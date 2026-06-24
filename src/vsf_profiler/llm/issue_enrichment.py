from __future__ import annotations

import csv
import io
import json
import os
import re
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol

from vsf_profiler.ingestion.connectors import redact_secret_text
from vsf_profiler.llm.narrative import (
    DEFAULT_OPENAI_BASE_URL,
    DEFAULT_OPENAI_MODEL,
    OpenAIModelConfig,
    OpenAITransport,
    _default_openai_transport,
    _extract_openai_text,
    _validated_openai_api_key,
)


ISSUE_ENRICHMENT_ARTIFACT = "issue_llm_enrichments"
ISSUE_ENRICHMENT_FILENAME = "issue_llm_enrichments.json"
ISSUE_ENRICHMENT_VERSION = 1
MAX_CONTEXT_BYTES = 20 * 1024
MAX_SAMPLE_BYTES = 4096
MAX_SAMPLE_ROWS = 5
MAX_RESPONSE_ITEMS = 3
MAX_RESPONSE_ITEM_CHARS = 240
OPENAI_KEY_RE = re.compile(r"\bsk-[A-Za-z0-9_-]{12,}")

OPENAI_ISSUE_ENRICHMENT_INSTRUCTIONS = """You are adding optional issue-level data-quality guidance.
Use only the supplied selected-issue JSON context.
Do not use external facts, raw CSV files, unbounded rows, or other issues.
Do not change severity, readiness, quality-gate, todo, or action-plan decisions.
Return concise JSON that matches the supplied schema. No Markdown, code fence, preface, or suffix.
Every suggestion is advisory and must say human review is required before changing data or contracts.
"""

ISSUE_ENRICHMENT_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "why_this_was_flagged",
        "extra_fix_suggestion",
        "extra_verification",
        "human_review_needed",
    ],
    "properties": {
        "why_this_was_flagged": {
            "type": "array",
            "minItems": 1,
            "maxItems": MAX_RESPONSE_ITEMS,
            "items": {"type": "string", "maxLength": MAX_RESPONSE_ITEM_CHARS},
        },
        "extra_fix_suggestion": {
            "type": "array",
            "minItems": 1,
            "maxItems": MAX_RESPONSE_ITEMS,
            "items": {"type": "string", "maxLength": MAX_RESPONSE_ITEM_CHARS},
        },
        "extra_verification": {
            "type": "array",
            "minItems": 1,
            "maxItems": MAX_RESPONSE_ITEMS,
            "items": {"type": "string", "maxLength": MAX_RESPONSE_ITEM_CHARS},
        },
        "human_review_needed": {
            "type": "object",
            "additionalProperties": False,
            "required": ["required", "reason"],
            "properties": {
                "required": {"type": "boolean"},
                "reason": {"type": "string", "maxLength": MAX_RESPONSE_ITEM_CHARS},
            },
        },
    },
}


class IssueEnrichmentProvider(Protocol):
    name: str
    model: str

    def generate(self, context: dict[str, Any]) -> dict[str, Any]:
        """Return a structured JSON-compatible enrichment for one selected issue."""


@dataclass(frozen=True)
class ProviderUnavailable(Exception):
    code: str
    message: str


class FakeIssueEnrichmentProvider:
    name = "fake"
    model = "deterministic-fake"

    def config_summary(self) -> dict[str, Any]:
        return {"provider": self.name, "model": self.model, "external_api": False}

    def generate(self, context: dict[str, Any]) -> dict[str, Any]:
        issue = context["issue"]
        plan = context["action_plan"]
        columns = ", ".join(issue.get("columns") or []) or "table scope"
        finding_summary = str(plan.get("finding_summary") or "").strip()
        first_fix = _first_string(plan.get("fix_data_checklist")) or _first_string(issue.get("suggested_fix"))
        first_verify = _first_string(plan.get("verify_after_fix_checklist"))
        if not first_fix:
            first_fix = "Confirm the expected source contract with a data owner before changing upstream data."
        if not first_verify:
            first_verify = "Rerun the profiler and confirm this issue no longer appears for the selected scope."
        return {
            "why_this_was_flagged": _short_list(
                [
                    finding_summary,
                    (
                        f"The selected issue is {issue.get('issue_type', 'UNKNOWN')} on "
                        f"{issue.get('table', 'unknown')}.{columns} with severity {issue.get('severity', 'unknown')}."
                    ),
                ],
                limit=2,
            ),
            "extra_fix_suggestion": _short_list(
                [
                    first_fix,
                    "Confirm the source extract or DBML contract owner before applying the deterministic checklist.",
                ],
                limit=2,
            ),
            "extra_verification": _short_list(
                [
                    first_verify,
                    "Keep issue_action_plans.json as the source of truth and treat this LLM note as advisory evidence.",
                ],
                limit=2,
            ),
            "human_review_needed": {
                "required": True,
                "reason": "LLM enrichment is advisory and must be reviewed before changing data, DBML, todos, or quality gates.",
            },
        }


class OpenAIIssueEnrichmentProvider:
    name = "openai"

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str = DEFAULT_OPENAI_BASE_URL,
        timeout_seconds: float = 60.0,
        max_output_tokens: int = 900,
        transport: OpenAITransport | None = None,
    ) -> None:
        self.api_key = _validated_openai_api_key(api_key)
        self.config = OpenAIModelConfig(
            model=model,
            base_url=base_url,
            timeout_seconds=timeout_seconds,
            max_output_tokens=max_output_tokens,
        )
        self.model = self.config.model
        self.base_url = self.config.base_url
        self.timeout_seconds = self.config.timeout_seconds
        self.max_output_tokens = self.config.max_output_tokens
        self._transport = transport or _default_openai_transport

    def config_summary(self) -> dict[str, Any]:
        return self.config.safe_dict()

    def generate(self, context: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "model": self.model,
            "instructions": OPENAI_ISSUE_ENRICHMENT_INSTRUCTIONS,
            "input": json.dumps(
                {
                    "task": "Generate optional structured enrichment for this selected issue.",
                    "schema_contract": "Return exactly the configured structured output schema.",
                    "context": context,
                },
                ensure_ascii=False,
                sort_keys=True,
            ),
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "issue_llm_enrichment",
                    "strict": True,
                    "schema": ISSUE_ENRICHMENT_RESPONSE_SCHEMA,
                }
            },
            "store": False,
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
        text = _extract_openai_text(response)
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            raise ValueError("OpenAI issue enrichment returned non-JSON output.") from exc
        if not isinstance(parsed, dict):
            raise ValueError("OpenAI issue enrichment returned JSON that is not an object.")
        return parsed


def generate_issue_llm_enrichment(
    *,
    out_dir: Path,
    issue_id: str,
    provider_name: str,
    openai_transport: OpenAITransport | None = None,
) -> dict[str, Any]:
    provider = _validated_provider_name(provider_name)
    context = build_issue_enrichment_context(out_dir=out_dir, issue_id=issue_id)
    context_guardrail = validate_issue_enrichment_context(context)
    request_summary = _request_summary(context, provider=provider)
    provider_config: dict[str, Any] = {"provider": provider}

    if context_guardrail["status"] != "passed":
        entry = _failure_entry(
            issue_id=issue_id,
            provider=provider,
            status="failed",
            code="context_guardrail_failed",
            message="Selected issue context failed LLM guardrails before provider execution.",
            request_summary=request_summary,
            guardrail_result=context_guardrail,
            provider_config=provider_config,
            source_artifacts=context["source_artifacts"],
        )
        artifact = append_issue_enrichment(out_dir=out_dir, entry=entry)
        return {"entry": entry, "artifact": artifact, "artifact_path": ISSUE_ENRICHMENT_FILENAME}

    try:
        provider_adapter = _provider_from_config(provider, openai_transport=openai_transport)
        provider_config = _provider_config_summary(provider_adapter)
    except ProviderUnavailable as exc:
        guardrail = _with_violation(context_guardrail, "provider_unavailable", exc.message)
        entry = _failure_entry(
            issue_id=issue_id,
            provider=provider,
            status="unavailable",
            code=exc.code,
            message=exc.message,
            request_summary=request_summary,
            guardrail_result=guardrail,
            provider_config=provider_config,
            source_artifacts=context["source_artifacts"],
        )
        artifact = append_issue_enrichment(out_dir=out_dir, entry=entry)
        return {"entry": entry, "artifact": artifact, "artifact_path": ISSUE_ENRICHMENT_FILENAME}
    except ValueError as exc:
        guardrail = _with_violation(context_guardrail, "provider_config", str(exc))
        entry = _failure_entry(
            issue_id=issue_id,
            provider=provider,
            status="failed",
            code="provider_config_invalid",
            message=str(exc),
            request_summary=request_summary,
            guardrail_result=guardrail,
            provider_config=provider_config,
            source_artifacts=context["source_artifacts"],
        )
        artifact = append_issue_enrichment(out_dir=out_dir, entry=entry)
        return {"entry": entry, "artifact": artifact, "artifact_path": ISSUE_ENRICHMENT_FILENAME}

    try:
        candidate = provider_adapter.generate(context)
    except Exception as exc:  # pragma: no cover - provider-specific failures vary.
        guardrail = _with_violation(
            context_guardrail,
            "provider_error",
            f"{exc.__class__.__name__}: {exc}",
        )
        entry = _failure_entry(
            issue_id=issue_id,
            provider=provider,
            status="failed",
            code="provider_error",
            message=f"{exc.__class__.__name__}: {exc}",
            request_summary=request_summary,
            guardrail_result=guardrail,
            provider_config=provider_config,
            source_artifacts=context["source_artifacts"],
        )
        artifact = append_issue_enrichment(out_dir=out_dir, entry=entry)
        return {"entry": entry, "artifact": artifact, "artifact_path": ISSUE_ENRICHMENT_FILENAME}

    response_guardrail = validate_issue_enrichment_response(candidate, context=context)
    guardrail = _combine_guardrails(context_guardrail, response_guardrail)
    if guardrail["status"] != "passed":
        entry = _failure_entry(
            issue_id=issue_id,
            provider=provider,
            status="invalid",
            code="response_guardrail_failed",
            message="LLM issue enrichment did not match the structured response contract.",
            request_summary=request_summary,
            guardrail_result=guardrail,
            provider_config=provider_config,
            source_artifacts=context["source_artifacts"],
        )
        artifact = append_issue_enrichment(out_dir=out_dir, entry=entry)
        return {"entry": entry, "artifact": artifact, "artifact_path": ISSUE_ENRICHMENT_FILENAME}

    structured_response = _normalized_response(candidate)
    entry = {
        "enrichment_id": _enrichment_id(issue_id=issue_id, provider=provider),
        "issue_id": issue_id,
        "provider": provider,
        "model": str(provider_config.get("model") or ""),
        "status": "succeeded",
        "created_at": _iso_now(),
        "deterministic_source_of_truth": "issue_action_plans.json",
        "human_review_required": True,
        "provider_config": provider_config,
        "request_summary": request_summary,
        "guardrail_result": guardrail,
        "structured_response": structured_response,
        "error": None,
        "source_artifacts": list(context["source_artifacts"]),
    }
    artifact = append_issue_enrichment(out_dir=out_dir, entry=entry)
    return {"entry": entry, "artifact": artifact, "artifact_path": ISSUE_ENRICHMENT_FILENAME}


def build_issue_enrichment_context(*, out_dir: Path, issue_id: str) -> dict[str, Any]:
    issue_id = _validated_issue_id(issue_id)
    issues = _read_json_list(out_dir / "issues.json", label="issues.json")
    action_plans = _read_json_dict(out_dir / "issue_action_plans.json", label="issue_action_plans.json")
    issue = _find_by_issue_id(issues, issue_id)
    if issue is None:
        raise ValueError(f"Issue {issue_id} was not found in issues.json.")
    plan = _find_by_issue_id(action_plans.get("plans") or [], issue_id)
    if plan is None:
        raise ValueError(f"Issue {issue_id} does not have an action plan in issue_action_plans.json.")

    source_artifacts = ["issues.json", "issue_action_plans.json"]
    table_assessment = _selected_table_assessment(out_dir, issue)
    if table_assessment is not None:
        source_artifacts.append("table_assessments.json")
    dataset_verdict = _selected_dataset_context(out_dir, issue_id)
    if dataset_verdict:
        source_artifacts.append("dataset_verdict.json")
    quality_gate_context = _selected_quality_gate_context(out_dir, issue_id)
    if quality_gate_context:
        source_artifacts.append("quality_gates.json")
    todo_context = _selected_todo_context(out_dir, issue_id)
    if todo_context:
        source_artifacts.append("issue_todos.json")
    sample = _bounded_sample_context(out_dir, issue)
    if sample.get("included") and sample.get("artifact"):
        source_artifacts.append(str(sample["artifact"]))

    context = {
        "role": "Selected issue data-quality reviewer",
        "issue_id": issue_id,
        "source_artifacts": source_artifacts,
        "privacy_contract": {
            "selected_issue_only": True,
            "raw_csv_included": False,
            "full_csv_files_included": False,
            "bounded_sample_rows_included": bool(sample.get("included")),
            "max_sample_rows": MAX_SAMPLE_ROWS,
            "max_sample_bytes": MAX_SAMPLE_BYTES,
        },
        "deterministic_contract": {
            "source_of_truth": "issue_action_plans.json",
            "llm_may_change_action_plan": False,
            "llm_may_change_severity": False,
            "llm_may_change_quality_gates": False,
            "llm_may_change_benchmark_scoring": False,
        },
        "issue": _compact_issue(issue),
        "action_plan": _compact_action_plan(plan),
        "table_assessment": table_assessment,
        "dataset_context": dataset_verdict,
        "quality_gate_context": quality_gate_context,
        "todo_context": todo_context,
        "bounded_sample": sample,
    }
    context["context_summary"] = {
        "context_bytes": len(json.dumps(context, ensure_ascii=False, sort_keys=True).encode("utf-8")),
        "source_artifact_count": len(source_artifacts),
        "sample_row_count": int(sample.get("row_count") or 0),
    }
    return context


def validate_issue_enrichment_context(context: dict[str, Any]) -> dict[str, Any]:
    violations: list[dict[str, Any]] = []
    privacy = context.get("privacy_contract") or {}
    if privacy.get("raw_csv_included") is not False:
        violations.append(_violation("raw_csv_context", "Context must not include raw CSV files."))
    if privacy.get("full_csv_files_included") is not False:
        violations.append(_violation("full_csv_context", "Context must not include full CSV files."))
    if privacy.get("selected_issue_only") is not True:
        violations.append(_violation("selection_scope", "Context must be scoped to one selected issue."))

    source_artifacts = context.get("source_artifacts") or []
    for artifact in source_artifacts:
        artifact_path = str(artifact)
        if artifact_path.endswith(".csv") and not artifact_path.startswith("samples/"):
            violations.append(
                _violation(
                    "raw_csv_artifact",
                    f"CSV artifact {artifact_path} is outside the bounded samples directory.",
                )
            )
    sample = context.get("bounded_sample") or {}
    if int(sample.get("row_count") or 0) > MAX_SAMPLE_ROWS:
        violations.append(_violation("sample_row_limit", "Bounded sample row limit was exceeded."))
    if int(sample.get("bytes_read") or 0) > MAX_SAMPLE_BYTES + 1:
        violations.append(_violation("sample_byte_limit", "Bounded sample byte limit was exceeded."))

    context_bytes = len(json.dumps(context, ensure_ascii=False, sort_keys=True).encode("utf-8"))
    if context_bytes > MAX_CONTEXT_BYTES:
        violations.append(
            _violation(
                "context_size",
                f"Selected issue context is {context_bytes} bytes, above the {MAX_CONTEXT_BYTES} byte limit.",
            )
        )
    serialized = json.dumps(context, ensure_ascii=False, sort_keys=True)
    if _contains_secret(serialized):
        violations.append(_violation("secret_marker", "Selected issue context contains a secret-like marker."))
    return _guardrail_payload(
        violations=violations,
        checked_sections=[
            "privacy_contract",
            "source_artifacts",
            "bounded_sample",
            "context_size",
            "secret_markers",
        ],
        raw_csv_included=False,
        unbounded_samples_included=False,
    )


def validate_issue_enrichment_response(
    response: dict[str, Any],
    *,
    context: dict[str, Any],
) -> dict[str, Any]:
    violations: list[dict[str, Any]] = []
    if not isinstance(response, dict):
        violations.append(_violation("schema", "Response must be a JSON object."))
        return _guardrail_payload(violations=violations, checked_sections=["schema"])

    allowed_keys = set(ISSUE_ENRICHMENT_RESPONSE_SCHEMA["properties"])
    extra_keys = set(response) - allowed_keys
    missing_keys = allowed_keys - set(response)
    for key in sorted(extra_keys):
        violations.append(_violation("schema_extra_key", f"Unexpected response key: {key}."))
    for key in sorted(missing_keys):
        violations.append(_violation("schema_missing_key", f"Missing response key: {key}."))

    for key in ("why_this_was_flagged", "extra_fix_suggestion", "extra_verification"):
        _validate_response_list(key, response.get(key), violations)

    review = response.get("human_review_needed")
    if not isinstance(review, dict):
        violations.append(_violation("schema", "human_review_needed must be an object."))
    else:
        if review.get("required") is not True:
            violations.append(
                _violation(
                    "human_review_required",
                    "Issue-level LLM enrichment must require human review.",
                )
            )
        reason = review.get("reason")
        if not isinstance(reason, str) or not reason.strip():
            violations.append(_violation("schema", "human_review_needed.reason is required."))
        elif len(reason) > MAX_RESPONSE_ITEM_CHARS:
            violations.append(_violation("length", "human_review_needed.reason is too long."))

    serialized = json.dumps(response, ensure_ascii=False, sort_keys=True)
    if _contains_secret(serialized):
        violations.append(_violation("secret_marker", "Response contains a secret-like marker."))
    if "```" in serialized:
        violations.append(_violation("free_text_format", "Response must not include code fences."))
    if _mentions_forbidden_override(serialized):
        violations.append(
            _violation(
                "deterministic_override",
                "Response appears to override deterministic plans, severity, readiness, gates, or scoring.",
            )
        )
    issue_id = str(context.get("issue_id") or "")
    mentioned_issue_ids = sorted(set(re.findall(r"\bISSUE-\d+\b", serialized)))
    for mentioned in mentioned_issue_ids:
        if mentioned != issue_id:
            violations.append(
                _violation(
                    "selection_scope",
                    f"Response mentions issue {mentioned}, outside selected issue {issue_id}.",
                )
            )
    return _guardrail_payload(
        violations=violations,
        checked_sections=["schema", "length", "secret_markers", "deterministic_contract", "selection_scope"],
    )


def append_issue_enrichment(*, out_dir: Path, entry: dict[str, Any]) -> dict[str, Any]:
    path = out_dir / ISSUE_ENRICHMENT_FILENAME
    existing = _read_json_dict_optional(path) or {}
    enrichments = [
        dict(item)
        for item in existing.get("enrichments", [])
        if isinstance(item, dict)
    ]
    enrichments.append(entry)
    provider_counts = Counter(str(item.get("provider") or "unknown") for item in enrichments)
    status_counts = Counter(str(item.get("status") or "unknown") for item in enrichments)
    artifact = {
        "artifact": ISSUE_ENRICHMENT_ARTIFACT,
        "version": ISSUE_ENRICHMENT_VERSION,
        "generated_at": _iso_now(),
        "summary": {
            "enrichment_count": len(enrichments),
            "issue_count": len({str(item.get("issue_id") or "") for item in enrichments if item.get("issue_id")}),
            "provider_counts": dict(sorted(provider_counts.items())),
            "status_counts": dict(sorted(status_counts.items())),
            "human_review_required_count": sum(1 for item in enrichments if item.get("human_review_required")),
            "source": "on_demand_issue_llm_enrichment",
        },
        "deterministic_source_of_truth": "issue_action_plans.json",
        "enrichments": enrichments,
    }
    path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False), encoding="utf-8")
    return artifact


def _provider_from_config(
    provider: str,
    *,
    openai_transport: OpenAITransport | None,
) -> IssueEnrichmentProvider:
    _load_env_file()
    if provider == "fake":
        return FakeIssueEnrichmentProvider()
    if provider == "openai":
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise ProviderUnavailable(
                "openai_api_key_missing",
                "OpenAI provider was selected, but OPENAI_API_KEY is not configured.",
            )
        return OpenAIIssueEnrichmentProvider(
            api_key=api_key,
            model=os.environ.get("VSF_OPENAI_MODEL", DEFAULT_OPENAI_MODEL).strip()
            or DEFAULT_OPENAI_MODEL,
            base_url=os.environ.get("VSF_OPENAI_BASE_URL", DEFAULT_OPENAI_BASE_URL).strip()
            or DEFAULT_OPENAI_BASE_URL,
            timeout_seconds=_env_float("VSF_OPENAI_TIMEOUT_SECONDS", 60.0),
            max_output_tokens=_env_int("VSF_OPENAI_MAX_OUTPUT_TOKENS", 900),
            transport=openai_transport,
        )
    raise ValueError(f"Unsupported LLM issue-enrichment provider: {provider}.")


def _request_summary(context: dict[str, Any], *, provider: str) -> dict[str, Any]:
    sample = context.get("bounded_sample") or {}
    summary = {
        "provider": provider,
        "issue_id": context.get("issue_id"),
        "source_artifacts": context.get("source_artifacts") or [],
        "context_bytes": len(json.dumps(context, ensure_ascii=False, sort_keys=True).encode("utf-8")),
        "raw_csv_included": False,
        "full_csv_files_included": False,
        "bounded_sample": {
            "included": bool(sample.get("included")),
            "artifact": sample.get("artifact") or "",
            "row_count": int(sample.get("row_count") or 0),
            "max_rows": MAX_SAMPLE_ROWS,
            "max_bytes": MAX_SAMPLE_BYTES,
            "truncated": bool(sample.get("truncated")),
        },
        "secrets_redacted": True,
    }
    return _redact_json(summary)


def _failure_entry(
    *,
    issue_id: str,
    provider: str,
    status: str,
    code: str,
    message: str,
    request_summary: dict[str, Any],
    guardrail_result: dict[str, Any],
    provider_config: dict[str, Any],
    source_artifacts: list[str],
) -> dict[str, Any]:
    safe_message = _redact_text(message)
    return {
        "enrichment_id": _enrichment_id(issue_id=issue_id, provider=provider),
        "issue_id": issue_id,
        "provider": provider,
        "model": str(provider_config.get("model") or ""),
        "status": status,
        "created_at": _iso_now(),
        "deterministic_source_of_truth": "issue_action_plans.json",
        "human_review_required": True,
        "provider_config": _redact_json(provider_config),
        "request_summary": request_summary,
        "guardrail_result": guardrail_result,
        "structured_response": {
            "why_this_was_flagged": [],
            "extra_fix_suggestion": [],
            "extra_verification": [],
            "human_review_needed": {
                "required": True,
                "reason": safe_message,
            },
        },
        "error": {
            "code": code,
            "message": safe_message,
        },
        "source_artifacts": list(source_artifacts),
    }


def _normalized_response(response: dict[str, Any]) -> dict[str, Any]:
    return {
        "why_this_was_flagged": _short_list(response.get("why_this_was_flagged"), limit=MAX_RESPONSE_ITEMS),
        "extra_fix_suggestion": _short_list(response.get("extra_fix_suggestion"), limit=MAX_RESPONSE_ITEMS),
        "extra_verification": _short_list(response.get("extra_verification"), limit=MAX_RESPONSE_ITEMS),
        "human_review_needed": {
            "required": True,
            "reason": _truncate(str((response.get("human_review_needed") or {}).get("reason") or ""), MAX_RESPONSE_ITEM_CHARS),
        },
    }


def _compact_issue(issue: dict[str, Any]) -> dict[str, Any]:
    return {
        "issue_id": _short_value(issue.get("issue_id")),
        "issue_type": _short_value(issue.get("issue_type")),
        "severity": _short_value(issue.get("severity")),
        "table": _short_value(issue.get("table")),
        "columns": _short_list(issue.get("columns"), limit=8),
        "parent_table": _short_value(issue.get("parent_table")),
        "parent_columns": _short_list(issue.get("parent_columns"), limit=8),
        "bad_count": issue.get("bad_count"),
        "total_count": issue.get("total_count"),
        "bad_rate": issue.get("bad_rate"),
        "sample_keys": _short_list(issue.get("sample_keys"), limit=5),
        "sample_bad_rows_path": _safe_artifact_path(issue.get("sample_bad_rows_path")),
        "evidence_sql": _truncate(_redact_text(str(issue.get("evidence_sql") or "")), 500),
        "probable_causes": _short_list(issue.get("probable_causes"), limit=3),
        "suggested_fix": _short_list(issue.get("suggested_fix"), limit=4),
    }


def _compact_action_plan(plan: dict[str, Any]) -> dict[str, Any]:
    evidence_values = []
    for item in plan.get("evidence_values") or []:
        if not isinstance(item, dict):
            continue
        evidence_values.append(
            {
                "label": _short_value(item.get("label"), limit=80),
                "raw_value": _short_value(item.get("raw_value"), limit=160),
                "meaning": _short_value(item.get("meaning"), limit=180),
                "artifact": _safe_artifact_path(item.get("artifact")),
                "field": _short_value(item.get("field"), limit=80),
            }
        )
        if len(evidence_values) >= 8:
            break
    return {
        "issue_id": _short_value(plan.get("issue_id")),
        "source": _short_value(plan.get("source")),
        "priority": _short_value(plan.get("priority"), limit=80),
        "finding_summary": _short_value(plan.get("finding_summary"), limit=240),
        "evidence_values": evidence_values,
        "fix_data_checklist": _short_list(plan.get("fix_data_checklist"), limit=5),
        "verify_after_fix_checklist": _short_list(plan.get("verify_after_fix_checklist"), limit=5),
        "guidelines": _short_list(plan.get("guidelines"), limit=4),
        "evidence_coverage": plan.get("evidence_coverage") or {},
        "actionability_score": plan.get("actionability_score") or {},
        "human_review_required": bool(plan.get("human_review_required")),
        "human_review_reason": _short_value(plan.get("human_review_reason"), limit=200),
    }


def _selected_table_assessment(out_dir: Path, issue: dict[str, Any]) -> dict[str, Any] | None:
    artifact = _read_json_dict_optional(out_dir / "table_assessments.json")
    if not artifact:
        return None
    table = str(issue.get("table") or "")
    for row in artifact.get("assessments") or []:
        if not isinstance(row, dict) or str(row.get("table") or "") != table:
            continue
        return {
            "table": _short_value(row.get("table")),
            "role": _short_value(row.get("role")),
            "health_score": row.get("health_score"),
            "readiness": _short_value(row.get("readiness")),
            "issue_counts_by_severity": row.get("issue_counts_by_severity") or {},
            "affected_columns": _short_list(row.get("affected_columns"), limit=8),
            "business_impact": row.get("business_impact") or {},
            "recommended_next_actions": _short_list(row.get("recommended_next_actions"), limit=3),
        }
    return None


def _selected_dataset_context(out_dir: Path, issue_id: str) -> dict[str, Any] | None:
    artifact = _read_json_dict_optional(out_dir / "dataset_verdict.json")
    if not artifact:
        return None
    blockers = [
        dict(item)
        for item in artifact.get("top_blockers") or []
        if isinstance(item, dict) and str(item.get("issue_id") or "") == issue_id
    ][:3]
    return {
        "verdict": _short_value(artifact.get("verdict")),
        "risk_score": artifact.get("risk_score"),
        "selected_issue_is_top_blocker": bool(blockers),
        "top_blocker_rows": blockers,
    }


def _selected_quality_gate_context(out_dir: Path, issue_id: str) -> list[dict[str, Any]]:
    artifact = _read_json_dict_optional(out_dir / "quality_gates.json")
    if not artifact:
        return []
    matches = []
    for gate in artifact.get("gates") or []:
        if not isinstance(gate, dict):
            continue
        contexts = []
        for context in gate.get("evidence_context") or []:
            if isinstance(context, dict) and str(context.get("issue_id") or "") == issue_id:
                contexts.append(context)
        if contexts:
            matches.append(
                {
                    "gate_id": _short_value(gate.get("gate_id"), limit=80),
                    "status": _short_value(gate.get("status"), limit=80),
                    "reason": _short_value(gate.get("reason"), limit=180),
                    "evidence_context": contexts[:3],
                }
            )
    return matches[:3]


def _selected_todo_context(out_dir: Path, issue_id: str) -> list[dict[str, Any]]:
    artifact = _read_json_dict_optional(out_dir / "issue_todos.json")
    if not artifact:
        return []
    matches = []
    for group in artifact.get("groups") or []:
        if not isinstance(group, dict):
            continue
        occurrences = [
            item
            for item in group.get("occurrences") or []
            if isinstance(item, dict) and str(item.get("issue_id") or "") == issue_id
        ]
        if occurrences:
            matches.append(
                {
                    "todo_type": _short_value(group.get("todo_type"), limit=80),
                    "text": _short_value(group.get("text"), limit=180),
                    "priority": _short_value(group.get("priority"), limit=80),
                    "occurrence_count": len(occurrences),
                }
            )
    return matches[:5]


def _bounded_sample_context(out_dir: Path, issue: dict[str, Any]) -> dict[str, Any]:
    sample_path = _safe_artifact_path(issue.get("sample_bad_rows_path"))
    if not sample_path:
        return {"included": False, "artifact": "", "row_count": 0, "columns": [], "rows": []}
    if not sample_path.startswith("samples/"):
        return {
            "included": False,
            "artifact": sample_path,
            "row_count": 0,
            "columns": [],
            "rows": [],
            "warning": "Sample path is outside samples/ and was not read.",
        }
    path = (out_dir / sample_path).resolve()
    root = out_dir.resolve()
    if root not in path.parents or not path.is_file():
        return {"included": False, "artifact": sample_path, "row_count": 0, "columns": [], "rows": []}
    with path.open("r", encoding="utf-8", newline="") as handle:
        raw = handle.read(MAX_SAMPLE_BYTES + 1)
    truncated = len(raw.encode("utf-8")) > MAX_SAMPLE_BYTES
    if truncated:
        raw = raw[:MAX_SAMPLE_BYTES]
    reader = csv.DictReader(io.StringIO(raw))
    rows = []
    for row in reader:
        rows.append({str(key): _short_value(value, limit=80) for key, value in row.items() if key is not None})
        if len(rows) >= MAX_SAMPLE_ROWS:
            break
    return {
        "included": bool(rows),
        "artifact": sample_path,
        "row_count": len(rows),
        "columns": _short_list(reader.fieldnames or [], limit=20),
        "rows": rows,
        "bytes_read": min(len(raw.encode("utf-8")), MAX_SAMPLE_BYTES + 1),
        "max_rows": MAX_SAMPLE_ROWS,
        "max_bytes": MAX_SAMPLE_BYTES,
        "truncated": truncated,
    }


def _read_json_dict(path: Path, *, label: str) -> dict[str, Any]:
    payload = _read_json_dict_optional(path)
    if payload is None:
        raise ValueError(f"{label} is required for issue LLM enrichment.")
    return payload


def _read_json_list(path: Path, *, label: str) -> list[dict[str, Any]]:
    if not path.is_file():
        raise ValueError(f"{label} is required for issue LLM enrichment.")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{label} must be valid JSON.") from exc
    if not isinstance(payload, list):
        raise ValueError(f"{label} must contain a JSON list.")
    return [item for item in payload if isinstance(item, dict)]


def _read_json_dict_optional(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def _find_by_issue_id(rows: Any, issue_id: str) -> dict[str, Any] | None:
    if not isinstance(rows, list):
        return None
    for row in rows:
        if isinstance(row, dict) and str(row.get("issue_id") or "") == issue_id:
            return row
    return None


def _validate_response_list(key: str, value: Any, violations: list[dict[str, Any]]) -> None:
    if not isinstance(value, list):
        violations.append(_violation("schema", f"{key} must be a list."))
        return
    if not value:
        violations.append(_violation("schema", f"{key} must include at least one item."))
    if len(value) > MAX_RESPONSE_ITEMS:
        violations.append(_violation("length", f"{key} includes too many items."))
    for item in value:
        if not isinstance(item, str) or not item.strip():
            violations.append(_violation("schema", f"{key} items must be non-empty strings."))
            continue
        if len(item) > MAX_RESPONSE_ITEM_CHARS:
            violations.append(_violation("length", f"{key} item is too long."))


def _guardrail_payload(
    *,
    violations: list[dict[str, Any]],
    checked_sections: list[str],
    raw_csv_included: bool = False,
    unbounded_samples_included: bool = False,
) -> dict[str, Any]:
    return {
        "status": "failed" if violations else "passed",
        "checked_sections": checked_sections,
        "raw_csv_included": raw_csv_included,
        "unbounded_samples_included": unbounded_samples_included,
        "violation_count": len(violations),
        "violations": violations,
    }


def _combine_guardrails(*guardrails: dict[str, Any]) -> dict[str, Any]:
    violations = [
        violation
        for guardrail in guardrails
        for violation in guardrail.get("violations", [])
        if isinstance(violation, dict)
    ]
    checked = []
    for guardrail in guardrails:
        checked.extend(str(item) for item in guardrail.get("checked_sections") or [])
    return _guardrail_payload(
        violations=violations,
        checked_sections=sorted(set(checked)),
        raw_csv_included=any(bool(guardrail.get("raw_csv_included")) for guardrail in guardrails),
        unbounded_samples_included=any(
            bool(guardrail.get("unbounded_samples_included")) for guardrail in guardrails
        ),
    )


def _with_violation(guardrail: dict[str, Any], violation_type: str, message: str) -> dict[str, Any]:
    violations = [
        violation
        for violation in guardrail.get("violations", [])
        if isinstance(violation, dict)
    ]
    violations.append(_violation(violation_type, _redact_text(message)))
    return _guardrail_payload(
        violations=violations,
        checked_sections=list(guardrail.get("checked_sections") or []) + ["provider"],
        raw_csv_included=bool(guardrail.get("raw_csv_included")),
        unbounded_samples_included=bool(guardrail.get("unbounded_samples_included")),
    )


def _violation(violation_type: str, message: str) -> dict[str, Any]:
    return {"type": violation_type, "message": _redact_text(message)}


def _mentions_forbidden_override(serialized: str) -> bool:
    return bool(
        re.search(
            r"\b(change|override|replace|lower|raise|update)\b.{0,50}\b("
            r"severity|readiness|quality gate|quality_gates|benchmark|score|issue_action_plans"
            r")\b",
            serialized,
            re.IGNORECASE,
        )
    )


def _provider_config_summary(provider: IssueEnrichmentProvider) -> dict[str, Any]:
    summary_fn = getattr(provider, "config_summary", None)
    if callable(summary_fn):
        summary = summary_fn()
        if isinstance(summary, dict):
            return _redact_json(summary)
    return _redact_json(
        {
            "provider": getattr(provider, "name", "unknown"),
            "model": getattr(provider, "model", ""),
        }
    )


def _redact_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _redact_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_redact_json(item) for item in value]
    if isinstance(value, str):
        return _redact_text(value)
    return value


def _redact_text(value: str) -> str:
    return OPENAI_KEY_RE.sub("[redacted]", redact_secret_text(value))


def _contains_secret(value: str) -> bool:
    redacted = _redact_text(value)
    return redacted != value or bool(re.search(r"(?i)\b(authorization|bearer)\b", value))


def _short_value(value: Any, *, limit: int = 120) -> str:
    if value is None:
        return ""
    return _truncate(_redact_text(str(value).strip()), limit)


def _short_list(value: Any, *, limit: int) -> list[str]:
    if value is None:
        values: list[Any] = []
    elif isinstance(value, str):
        values = [value]
    elif isinstance(value, list | tuple):
        values = list(value)
    else:
        values = [value]
    result = []
    seen = set()
    for item in values:
        text = _short_value(item, limit=MAX_RESPONSE_ITEM_CHARS)
        if not text or text in seen:
            continue
        result.append(text)
        seen.add(text)
        if len(result) >= limit:
            break
    return result


def _first_string(value: Any) -> str:
    values = _short_list(value, limit=1)
    return values[0] if values else ""


def _truncate(value: str, limit: int) -> str:
    text = " ".join(str(value or "").split())
    if len(text) <= limit:
        return text
    return f"{text[: max(0, limit - 1)]}..."


def _safe_artifact_path(value: Any) -> str:
    raw = str(value or "").strip().replace("\\", "/")
    if not raw:
        return ""
    path = Path(raw)
    if path.is_absolute() or ".." in path.parts:
        return ""
    return _truncate(raw, 240)


def _validated_issue_id(issue_id: str) -> str:
    value = str(issue_id or "").strip()
    if not value:
        raise ValueError("issue_id is required.")
    if len(value) > 80 or _has_control_characters(value):
        raise ValueError("issue_id is invalid.")
    return value


def _validated_provider_name(provider_name: str) -> str:
    provider = str(provider_name or "").strip().lower()
    if provider not in {"fake", "openai"}:
        raise ValueError("provider must be fake or openai.")
    return provider


def _has_control_characters(value: str) -> bool:
    return any(ord(char) < 32 for char in value)


def _enrichment_id(*, issue_id: str, provider: str) -> str:
    timestamp = _iso_now().replace(":", "").replace(".", "").replace("-", "")
    safe_issue = re.sub(r"[^A-Za-z0-9_.-]+", "_", issue_id)[:80]
    return f"{safe_issue}:{provider}:{timestamp}"


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or not raw.strip():
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer.") from exc
    return value


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or not raw.strip():
        return default
    try:
        value = float(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be a number.") from exc
    return value


def _load_env_file(path: Path = Path(".env")) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, raw_value = stripped.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = raw_value.strip().strip('"').strip("'")
        os.environ[key] = value
