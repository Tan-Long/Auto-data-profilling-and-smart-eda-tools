from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable, Protocol


SOURCE_ARTIFACTS = [
    "profile_summary.json",
    "issues.json",
    "schema_evaluation.json",
    "relationship_graph.json",
    "dataset_verdict.json",
    "charts/*.json",
    "influence.json",
]

OPENAI_NARRATIVE_INSTRUCTIONS = """You are writing as a Senior Data Scientist.
Use only the supplied JSON context, which is derived from deterministic structured artifacts.
Do not use external facts, raw CSV data, row-level samples, or unbounded examples.
Do not invent numeric claims; every number must appear in the supplied evidence.
Reference tables, columns, issue ids, issue types, severities, and verdicts only when they appear in the supplied evidence.
Do not use causal wording such as causes, caused, drives, leads to, due to, because, or root cause.
Use association-only language for influence findings.
Return concise Markdown with practical findings and next actions.
"""

OpenAITransport = Callable[[str, dict[str, str], dict[str, Any], float], dict[str, Any]]

NUMERIC_CLAIM_RE = re.compile(r"(?<![\w.-])(?P<number>\d+(?:\.\d+)?)(?P<percent>%?)(?![\w.-])")
CODE_REF_RE = re.compile(r"`([^`]+)`")
TABLE_COLUMN_RE = re.compile(r"\b[A-Za-z][\w]*\.[A-Za-z][\w]*\b")
ISSUE_ID_RE = re.compile(r"\bISSUE-\d+\b")
CAUSAL_PATTERNS = {
    "causes": re.compile(r"\bcauses?\b", re.IGNORECASE),
    "caused": re.compile(r"\bcaused\b", re.IGNORECASE),
    "drives": re.compile(r"\bdrives?\b", re.IGNORECASE),
    "driven": re.compile(r"\bdriven\b", re.IGNORECASE),
    "leads_to": re.compile(r"\bleads?\s+to\b", re.IGNORECASE),
    "due_to": re.compile(r"\bdue\s+to\b", re.IGNORECASE),
    "because": re.compile(r"\bbecause\b", re.IGNORECASE),
    "root_cause": re.compile(r"\broot\s+cause\b", re.IGNORECASE),
}


class NarrativeProvider(Protocol):
    name: str

    def generate(self, context: dict[str, Any]) -> str:
        """Return a Markdown narrative using only the supplied context."""


class FakeNarrativeProvider:
    name = "fake"

    def generate(self, context: dict[str, Any]) -> str:
        summary = context["summary"]
        top_issue = next(iter(context["top_issues"]), {})
        top_ref = ""
        if top_issue.get("table") and top_issue.get("columns"):
            top_ref = f"`{top_issue['table']}.{top_issue['columns'][0]}`"
        return (
            "# Senior Data Scientist Narrative\n\n"
            "## Dataset Health\n\n"
            f"The deterministic artifacts show {summary['table_count']} tables, "
            f"{summary['row_count']} rows, {summary['issue_count']} issues, and a "
            f"risk score of {summary['risk_score']}.\n\n"
            "## Priority Findings\n\n"
            f"The highest-priority reviewed issue type is `{top_issue.get('issue_type', 'none')}` "
            f"on {top_ref or 'the mapped tables'}.\n\n"
            "## Modeling Caveat\n\n"
            "Influence findings are association-only and should be validated before use in decisions.\n"
        )


class OpenAINarrativeProvider:
    name = "openai"

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str = "https://api.openai.com/v1",
        timeout_seconds: float = 60.0,
        max_output_tokens: int = 1200,
        transport: OpenAITransport | None = None,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.max_output_tokens = max_output_tokens
        self._transport = transport or _default_openai_transport

    def generate(self, context: dict[str, Any]) -> str:
        payload = {
            "model": self.model,
            "instructions": OPENAI_NARRATIVE_INSTRUCTIONS,
            "input": json.dumps(
                {
                    "task": "Generate the guarded L4 Senior Data Scientist narrative.",
                    "context": context,
                },
                ensure_ascii=False,
                sort_keys=True,
            ),
            "max_output_tokens": self.max_output_tokens,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        response = self._transport(
            f"{self.base_url}/responses",
            headers,
            payload,
            self.timeout_seconds,
        )
        return _extract_openai_text(response)


def generate_l4_narrative(
    *,
    out_dir: Path,
    artifacts: dict[str, Any],
    provider: NarrativeProvider | None,
) -> dict[str, Any]:
    context = build_narrative_context(artifacts)
    evidence = build_guardrail_evidence(artifacts, context)
    provider_name = getattr(provider, "name", "none") if provider else "none"
    violations: list[dict[str, Any]] = []
    fallback_reason = ""

    if provider is None:
        fallback_reason = "provider_config_missing"
        narrative = deterministic_l4_narrative(context)
        status = "fallback_used"
        violations.append(
            {
                "type": "provider_config",
                "message": "No LLM provider was configured; deterministic fallback was used.",
            }
        )
    else:
        try:
            candidate = provider.generate(context)
        except Exception as exc:  # pragma: no cover - exact provider failures are adapter-specific.
            fallback_reason = "provider_error"
            candidate = ""
            violations.append(
                {
                    "type": "provider_error",
                    "message": f"{exc.__class__.__name__}: {exc}",
                }
            )
        candidate_guardrail = validate_narrative(candidate, evidence)
        if candidate and candidate_guardrail["status"] == "passed":
            narrative = candidate
            status = "passed"
        else:
            if not fallback_reason:
                fallback_reason = "guardrail_failed"
            violations.extend(candidate_guardrail["violations"])
            narrative = deterministic_l4_narrative(context)
            status = "fallback_used"

    final_guardrail = validate_narrative(narrative, evidence)
    if final_guardrail["status"] != "passed":
        status = "failed"
        violations.extend(final_guardrail["violations"])

    l4_path = out_dir / "l4_report.md"
    guardrail_path = out_dir / "guardrail_report.json"
    l4_path.write_text(narrative, encoding="utf-8")
    guardrail_report = {
        "artifact": "guardrail_report",
        "version": 1,
        "status": status,
        "provider": provider_name,
        "fallback_reason": fallback_reason,
        "l4_report_path": "l4_report.md",
        "source_artifacts": list(SOURCE_ARTIFACTS),
        "raw_csv_included": False,
        "unbounded_samples_included": False,
        "checked_numbers": final_guardrail["checked_numbers"],
        "checked_refs": final_guardrail["checked_refs"],
        "violations": violations,
    }
    guardrail_path.write_text(_json_dumps(guardrail_report), encoding="utf-8")
    return {
        "l4_report_path": l4_path,
        "guardrail_report_path": guardrail_path,
        "guardrail_report": guardrail_report,
        "context": context,
    }


def build_narrative_context(artifacts: dict[str, Any]) -> dict[str, Any]:
    profile = artifacts["profile_summary"]
    issues = list(artifacts["issues"])
    dataset_verdict = artifacts["dataset_verdict"]
    schema_evaluation = artifacts["schema_evaluation"]
    relationship_graph = artifacts["relationship_graph"]
    charts = artifacts["chart_specs"]
    influence = artifacts["influence"]
    tables = profile.get("tables") or {}
    issue_counts = dataset_verdict.get("issue_counts") or {}
    return {
        "role": "Senior Data Scientist",
        "source_artifacts": list(SOURCE_ARTIFACTS),
        "privacy_contract": {
            "raw_csv_included": False,
            "sample_rows_included": False,
            "sample_paths_may_be_referenced": True,
        },
        "summary": {
            "table_count": len(tables),
            "column_count": sum((table.get("column_count") or 0) for table in tables.values()),
            "row_count": sum((table.get("row_count") or 0) for table in tables.values()),
            "issue_count": len(issues),
            "risk_score": dataset_verdict.get("risk_score", 0),
            "verdict": dataset_verdict.get("verdict", ""),
            "severity_counts": issue_counts.get("by_severity") or {},
            "issue_type_counts": issue_counts.get("by_type") or {},
        },
        "tables": [
            {
                "table": table_name,
                "row_count": table.get("row_count", 0),
                "column_count": table.get("column_count", 0),
                "columns": sorted((table.get("columns") or {}).keys()),
            }
            for table_name, table in sorted(tables.items())
        ],
        "top_issues": [
            {
                "issue_id": issue.get("issue_id"),
                "issue_type": issue.get("issue_type"),
                "severity": issue.get("severity"),
                "table": issue.get("table"),
                "columns": issue.get("columns") or [],
                "bad_count": issue.get("bad_count", 0),
                "sample_bad_rows_path": issue.get("sample_bad_rows_path"),
            }
            for issue in issues[:15]
        ],
        "schema_summary": schema_evaluation.get("summary") or {},
        "relationship_summary": relationship_graph.get("summary") or {},
        "dataset_verdict": {
            "verdict": dataset_verdict.get("verdict", ""),
            "verdict_rationale": dataset_verdict.get("verdict_rationale", ""),
            "top_blockers": dataset_verdict.get("top_blockers") or [],
            "recommended_next_actions": dataset_verdict.get("recommended_next_actions") or [],
        },
        "chart_summaries": {
            name: spec.get("summary") or {}
            for name, spec in sorted(charts.items())
        },
        "influence": {
            "target": influence.get("target"),
            "method": influence.get("method", ""),
            "row_count": influence.get("row_count", 0),
            "top_features": (influence.get("top_features") or [])[:10],
            "notes": influence.get("notes") or [],
        },
    }


def deterministic_l4_narrative(context: dict[str, Any]) -> str:
    summary = context["summary"]
    top_issues = context["top_issues"][:5]
    lines = [
        "# Senior Data Scientist Narrative",
        "",
        "_Deterministic fallback narrative generated from structured artifacts only._",
        "",
        "## Dataset Health",
        "",
        (
            f"The run reviewed {summary['table_count']} tables, {summary['column_count']} columns, "
            f"and {summary['row_count']} rows. The deterministic verdict is "
            f"`{summary['verdict']}` with risk score {summary['risk_score']} and "
            f"{summary['issue_count']} issues."
        ),
        "",
        "## Priority Findings",
        "",
    ]
    if not top_issues:
        lines.append("No issue records were present in `issues.json`.")
    for issue in top_issues:
        columns = issue["columns"]
        ref = f"`{issue['table']}.{columns[0]}`" if columns else f"`{issue['table']}`"
        lines.append(
            f"- `{issue['issue_type']}` on {ref}: {issue['bad_count']} affected rows "
            f"with severity `{issue['severity']}`."
        )
    lines.extend(
        [
            "",
            "## Recommended Next Actions",
            "",
        ]
    )
    actions = context["dataset_verdict"]["recommended_next_actions"][:5]
    if actions:
        lines.extend(f"- {action}" for action in actions)
    else:
        lines.append("- No deterministic next actions were provided.")
    lines.extend(
        [
            "",
            "## Modeling Caveat",
            "",
            (
                "Influence findings are association-only. Validate important patterns with "
                "domain review before operational use."
            ),
            "",
        ]
    )
    return "\n".join(lines)


def build_guardrail_evidence(
    artifacts: dict[str, Any],
    context: dict[str, Any],
) -> dict[str, Any]:
    numbers: dict[str, set[str]] = {}
    refs: dict[str, set[str]] = {}
    _collect_numbers(context["summary"], "$.context.summary", numbers)
    _collect_numbers(artifacts, "$.artifacts", numbers)
    _collect_refs(artifacts, refs)
    _collect_refs(context, refs)
    for artifact in SOURCE_ARTIFACTS:
        refs.setdefault(artifact, set()).add("source_artifacts")
    refs.setdefault("l4_report.md", set()).add("optional_artifact")
    refs.setdefault("guardrail_report.json", set()).add("optional_artifact")
    refs.setdefault("association-only", set()).add("allowed_phrase")
    refs.setdefault("association", set()).add("allowed_phrase")
    refs.setdefault("READY", set()).add("verdict")
    refs.setdefault("WARN", set()).add("verdict")
    refs.setdefault("NOT_READY", set()).add("verdict")
    numbers.setdefault("100", set()).add("risk_score_scale")
    return {
        "numbers": numbers,
        "refs": refs,
    }


def validate_narrative(markdown: str, evidence: dict[str, Any]) -> dict[str, Any]:
    checked_numbers, number_violations = _check_numbers(markdown, evidence["numbers"])
    checked_refs, ref_violations = _check_refs(markdown, evidence["refs"])
    causal_violations = _check_causal_wording(markdown)
    violations = number_violations + ref_violations + causal_violations
    return {
        "status": "failed" if violations else "passed",
        "checked_numbers": checked_numbers,
        "checked_refs": checked_refs,
        "violations": violations,
    }


def _check_numbers(
    markdown: str,
    allowed_numbers: dict[str, set[str]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    checked = []
    violations = []
    for match in NUMERIC_CLAIM_RE.finditer(markdown):
        claim = match.group(0)
        number = match.group("number")
        keys = _number_keys(number, is_percent=bool(match.group("percent")))
        evidence_paths = sorted({path for key in keys for path in allowed_numbers.get(key, set())})
        status = "passed" if evidence_paths else "failed"
        row = {
            "claim": claim,
            "normalized": keys[0],
            "status": status,
            "evidence_paths": evidence_paths,
        }
        checked.append(row)
        if status == "failed":
            violations.append(
                {
                    "type": "numeric_claim",
                    "claim": claim,
                    "message": "Numeric claim is not present in allowed structured evidence.",
                }
            )
    return checked, violations


def _check_refs(
    markdown: str,
    allowed_refs: dict[str, set[str]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    claims = set(TABLE_COLUMN_RE.findall(markdown))
    claims.update(ISSUE_ID_RE.findall(markdown))
    for code_ref in CODE_REF_RE.findall(markdown):
        cleaned = code_ref.strip()
        if _is_reference_like(cleaned):
            claims.add(cleaned)

    checked = []
    violations = []
    for ref in sorted(claims):
        evidence_paths = sorted(allowed_refs.get(ref, set()))
        status = "passed" if evidence_paths else "failed"
        checked.append(
            {
                "ref": ref,
                "status": status,
                "evidence_paths": evidence_paths,
            }
        )
        if status == "failed":
            violations.append(
                {
                    "type": "reference",
                    "ref": ref,
                    "message": "Reference is not present in allowed structured evidence.",
                }
            )
    return checked, violations


def _check_causal_wording(markdown: str) -> list[dict[str, Any]]:
    violations = []
    for label, pattern in CAUSAL_PATTERNS.items():
        for match in pattern.finditer(markdown):
            violations.append(
                {
                    "type": "causal_wording",
                    "claim": match.group(0),
                    "pattern": label,
                    "message": "Unsupported causal wording is not allowed in L4 narrative.",
                }
            )
    return violations


def _collect_numbers(value: Any, path: str, numbers: dict[str, set[str]]) -> None:
    if isinstance(value, bool):
        return
    if isinstance(value, int | float):
        numbers.setdefault(_normalize_number(value), set()).add(path)
        return
    if isinstance(value, dict):
        for key, item in value.items():
            _collect_numbers(item, f"{path}.{key}", numbers)
        return
    if isinstance(value, list):
        for index, item in enumerate(value):
            _collect_numbers(item, f"{path}[{index}]", numbers)


def _collect_refs(value: Any, refs: dict[str, set[str]], path: str = "$") -> None:
    if isinstance(value, dict):
        table_name = value.get("table") or value.get("source_table") or value.get("target_table")
        if isinstance(table_name, str):
            refs.setdefault(table_name, set()).add(path)
            for column in value.get("columns") or value.get("source_columns") or value.get("target_columns") or []:
                if isinstance(column, str):
                    refs.setdefault(column, set()).add(path)
                    refs.setdefault(f"{table_name}.{column}", set()).add(path)
        for key in ("issue_id", "issue_type", "severity", "verdict", "status", "target", "feature"):
            ref = value.get(key)
            if isinstance(ref, str) and ref:
                refs.setdefault(ref, set()).add(f"{path}.{key}")
        for key, item in value.items():
            _collect_refs(item, refs, f"{path}.{key}")
        return
    if isinstance(value, list):
        for index, item in enumerate(value):
            _collect_refs(item, refs, f"{path}[{index}]")


def _number_keys(number: str, *, is_percent: bool) -> list[str]:
    value = float(number)
    keys = [_normalize_number(value)]
    if is_percent:
        keys.append(_normalize_number(value / 100))
    return keys


def _normalize_number(value: int | float) -> str:
    number = float(value)
    if number.is_integer():
        return str(int(number))
    return f"{number:.6f}".rstrip("0").rstrip(".")


def _is_reference_like(value: str) -> bool:
    if not value or value.replace(".", "", 1).isdigit():
        return False
    return bool(re.fullmatch(r"[A-Za-z_][\w.-]*", value))


def _json_dumps(payload: dict[str, Any]) -> str:
    return json.dumps(payload, indent=2, ensure_ascii=False)


def _default_openai_transport(
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    timeout_seconds: float,
) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        message = detail[:500] if detail else exc.reason
        raise RuntimeError(f"OpenAI Responses API failed with HTTP {exc.code}: {message}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"OpenAI Responses API request failed: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError("OpenAI Responses API returned invalid JSON.") from exc


def _extract_openai_text(response: dict[str, Any]) -> str:
    output_text = response.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    text_parts: list[str] = []
    for output_item in response.get("output") or []:
        if not isinstance(output_item, dict):
            continue
        for content_item in output_item.get("content") or []:
            if not isinstance(content_item, dict):
                continue
            text = content_item.get("text")
            if isinstance(text, str) and text.strip():
                text_parts.append(text.strip())

    if text_parts:
        return "\n".join(text_parts)
    raise RuntimeError("OpenAI Responses API response did not include output text.")
