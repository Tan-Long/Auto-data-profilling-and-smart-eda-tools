from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from vsf_profiler.models import Issue


ACTION_PLAN_ARTIFACT = "issue_action_plans"
ACTION_PLAN_VERSION = 1

RELATIONSHIP_ISSUE_TYPES = {
    "ORPHAN_FOREIGN_KEY",
    "PARENT_KEY_DUPLICATE",
    "FOREIGN_KEY_NULL",
    "CHILD_RELATIONSHIP_DUPLICATE",
}
TABLE_SCOPE_ISSUE_TYPES = {
    "TABLE_MISSING",
    "COLUMN_MISSING",
    "EXTRA_COLUMN",
}
SEVERITY_PRIORITIES = {
    "P0": "P0 - block run/use",
    "P1": "P1 - fix before analysis",
    "P2": "P2 - review before sharing",
    "P3": "P3 - monitor",
}


def build_issue_action_plans(
    issues: Sequence[Issue | Mapping[str, Any]],
    table_assessments: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build short deterministic remediation plans from existing issue evidence."""

    issue_rows = [_issue_dict(issue) for issue in issues]
    assessments_by_table = _assessments_by_table(table_assessments)
    plans = [
        _build_plan(
            issue,
            assessment=assessments_by_table.get(str(issue.get("table") or "")),
        )
        for issue in issue_rows
    ]
    actionability_scores = [
        _to_float((plan.get("actionability_score") or {}).get("score"))
        for plan in plans
        if _to_float((plan.get("actionability_score") or {}).get("score")) is not None
    ]
    average_actionability = (
        round(sum(actionability_scores) / len(actionability_scores), 1)
        if actionability_scores
        else 0.0
    )
    return {
        "artifact": ACTION_PLAN_ARTIFACT,
        "version": ACTION_PLAN_VERSION,
        "summary": {
            "issue_count": len(issue_rows),
            "plan_count": len(plans),
            "human_review_count": sum(1 for plan in plans if plan["human_review_required"]),
            "average_actionability_score": average_actionability,
            "source": "deterministic",
        },
        "plans": plans,
    }


def _build_plan(issue: dict[str, Any], *, assessment: dict[str, Any] | None) -> dict[str, Any]:
    issue_id = str(issue.get("issue_id") or "").strip()
    issue_type = str(issue.get("issue_type") or "UNKNOWN").strip() or "UNKNOWN"
    severity = str(issue.get("severity") or "").strip().upper()
    table = str(issue.get("table") or "").strip()
    columns = _string_list(issue.get("columns"))
    parent_columns = _string_list(issue.get("parent_columns"))
    parent_table = str(issue.get("parent_table") or "").strip()
    fixes = _string_list(issue.get("suggested_fix"))
    coverage = _evidence_coverage(issue, assessment=assessment)
    missing_context = _missing_context(issue, coverage=coverage)
    fix_checklist = _fix_checklist(issue, fixes=fixes, missing_context=missing_context)
    verify_checklist = _verify_checklist(issue, missing_context=missing_context)
    guidelines = _guidelines(issue)
    human_review_required = bool(missing_context) or coverage["score"] < 50
    actionability_score = _actionability_score(
        coverage_score=coverage["score"],
        has_fix=not _is_human_review_checklist(fix_checklist),
        has_verify=not _is_human_review_checklist(verify_checklist),
        has_context=not missing_context,
        human_review_required=human_review_required,
    )

    return {
        "issue_id": issue_id or "UNKNOWN",
        "source": "deterministic",
        "priority": SEVERITY_PRIORITIES.get(severity, "Needs human review"),
        "finding_summary": _finding_summary(issue),
        "evidence_values": _evidence_values(issue, assessment=assessment),
        "fix_data_checklist": fix_checklist,
        "verify_after_fix_checklist": verify_checklist,
        "guidelines": guidelines,
        "evidence_coverage": coverage,
        "actionability_score": actionability_score,
        "human_review_required": human_review_required,
        "human_review_reason": _human_review_reason(missing_context),
        "evidence_artifacts": _evidence_artifacts(issue, assessment=assessment),
        "issue_type": issue_type,
        "severity": severity or "unknown",
        "table": table,
        "columns": columns,
        "parent_table": parent_table or None,
        "parent_columns": parent_columns,
    }


def _issue_dict(issue: Issue | Mapping[str, Any]) -> dict[str, Any]:
    if isinstance(issue, Issue):
        return issue.model_dump(mode="json")
    if hasattr(issue, "model_dump"):
        return issue.model_dump(mode="json")  # type: ignore[no-any-return, union-attr]
    return dict(issue)


def _assessments_by_table(table_assessments: Mapping[str, Any] | None) -> dict[str, dict[str, Any]]:
    if not isinstance(table_assessments, Mapping):
        return {}
    assessments = table_assessments.get("assessments")
    if not isinstance(assessments, list):
        return {}
    by_table: dict[str, dict[str, Any]] = {}
    for row in assessments:
        if not isinstance(row, Mapping):
            continue
        table = str(row.get("table") or "")
        if table:
            by_table[table] = dict(row)
    return by_table


def _finding_summary(issue: dict[str, Any]) -> str:
    issue_type = _label(str(issue.get("issue_type") or "UNKNOWN"))
    scope = _scope_text(issue)
    bad_count = _to_int(issue.get("bad_count"))
    total_count = _to_int(issue.get("total_count"))
    rate = _to_float(issue.get("bad_rate"))
    if bad_count is not None and total_count is not None:
        return (
            f"{issue_type} on {scope}: {bad_count:,} of {total_count:,} rows affected"
            f" ({_percent_text(rate)})."
        )
    return f"{issue_type} on {scope}; row-count context needs human review."


def _evidence_values(issue: dict[str, Any], *, assessment: dict[str, Any] | None) -> list[dict[str, Any]]:
    values = [
        {
            "label": "Issue guid",
            "raw_value": str(issue.get("issue_id") or "UNKNOWN"),
            "meaning": "Stable generated finding ID from issues.json.",
            "artifact": "issues.json",
            "field": "issue_id",
        },
        {
            "label": "Bad rows",
            "raw_value": _to_int(issue.get("bad_count")) if _to_int(issue.get("bad_count")) is not None else "unknown",
            "meaning": "Rows that matched the issue evidence query.",
            "artifact": "issues.json",
            "field": "bad_count",
        },
        {
            "label": "Affected rate",
            "raw_value": _percent_text(_to_float(issue.get("bad_rate"))),
            "meaning": "Share of checked rows affected by this issue.",
            "artifact": "issues.json",
            "field": "bad_rate",
        },
        {
            "label": "Rows checked",
            "raw_value": _to_int(issue.get("total_count")) if _to_int(issue.get("total_count")) is not None else "unknown",
            "meaning": "Rows included in the profiler check.",
            "artifact": "issues.json",
            "field": "total_count",
        },
    ]
    sample_keys = _string_list(issue.get("sample_keys"))
    if sample_keys:
        values.append(
            {
                "label": "Sample keys",
                "raw_value": ", ".join(sample_keys[:5]),
                "meaning": "Bounded examples from generated sample evidence.",
                "artifact": "issues.json",
                "field": "sample_keys",
            }
        )
    sample_path = str(issue.get("sample_bad_rows_path") or "").strip()
    if sample_path:
        values.append(
            {
                "label": "Sample rows",
                "raw_value": sample_path,
                "meaning": "Generated bounded sample CSV for concrete row evidence.",
                "artifact": sample_path,
                "field": "sample_bad_rows_path",
            }
        )
    evidence_sql = str(issue.get("evidence_sql") or "").strip()
    if evidence_sql:
        values.append(
            {
                "label": "Evidence query",
                "raw_value": _truncate(evidence_sql, 120),
                "meaning": "Profiler query used to count affected rows.",
                "artifact": "issues.json",
                "field": "evidence_sql",
            }
        )
    parent_table = str(issue.get("parent_table") or "").strip()
    parent_columns = _string_list(issue.get("parent_columns"))
    if parent_table:
        values.append(
            {
                "label": "Parent context",
                "raw_value": f"{parent_table}.{', '.join(parent_columns) if parent_columns else 'key'}",
                "meaning": "Referenced parent side for this relationship check.",
                "artifact": "issues.json",
                "field": "parent_table",
            }
        )
    if assessment:
        values.append(
            {
                "label": "Table readiness",
                "raw_value": str(assessment.get("readiness") or "unknown"),
                "meaning": "Deterministic table readiness from table_assessments.json.",
                "artifact": "table_assessments.json",
                "field": "readiness",
            }
        )
        values.append(
            {
                "label": "Table health",
                "raw_value": _to_int(assessment.get("health_score"))
                if _to_int(assessment.get("health_score")) is not None
                else "unknown",
                "meaning": "Deterministic table health score from table_assessments.json.",
                "artifact": "table_assessments.json",
                "field": "health_score",
            }
        )
    return values


def _fix_checklist(
    issue: dict[str, Any],
    *,
    fixes: list[str],
    missing_context: list[str],
) -> list[str]:
    if missing_context or not fixes:
        return [
            "Needs human review: confirm the affected table, column, evidence query, and expected data contract before changing data."
        ]
    checklist = []
    scope = _scope_text(issue)
    sample_path = str(issue.get("sample_bad_rows_path") or "").strip()
    if sample_path:
        checklist.append(f"Inspect bounded sample rows in {sample_path} for {scope}.")
    for fix in fixes:
        checklist.append(fix)
    checklist.append("Apply the correction in the source extract, upstream pipeline, or DBML contract; do not edit generated artifacts.")
    return _unique_short_list(checklist, limit=5)


def _verify_checklist(issue: dict[str, Any], *, missing_context: list[str]) -> list[str]:
    if missing_context:
        return ["Needs human review: define the expected verification query before approving the fix."]
    issue_type = str(issue.get("issue_type") or "UNKNOWN")
    scope = _scope_text(issue)
    checks = [
        "Rerun the profiler on the corrected CSV + DBML inputs.",
        f"Confirm the {issue_type} finding for {scope} no longer appears in issues.json.",
        f"Confirm affected rows for {scope} are 0 in the rerun.",
    ]
    if issue_type in RELATIONSHIP_ISSUE_TYPES:
        checks.append("Confirm the child-to-parent relationship check has zero orphan, duplicate, or null-key rows.")
    if issue_type == "NUMERIC_OUTLIER":
        checks.append("Confirm the reviewed extreme values are either corrected or accepted by a documented domain decision.")
    return checks


def _guidelines(issue: dict[str, Any]) -> list[str]:
    issue_type = str(issue.get("issue_type") or "UNKNOWN")
    guidelines = _string_list(issue.get("probable_causes"))[:2]
    if issue_type in RELATIONSHIP_ISSUE_TYPES:
        guidelines.append("Validate child and parent key transformations together before trusting joins.")
    elif issue_type == "NUMERIC_OUTLIER":
        guidelines.append("Treat outliers as review warnings until a domain owner confirms whether the extremes are valid.")
    elif issue_type in TABLE_SCOPE_ISSUE_TYPES:
        guidelines.append("Resolve source export and DBML contract differences before relying on downstream checks.")
    else:
        guidelines.append("Keep DBML and CSV contracts aligned before publishing analysis-ready data.")
    guidelines.append("Keep generated artifacts read-only; fix source data or the declared contract, then rerun.")
    return _unique_short_list(guidelines, limit=4)


def _evidence_coverage(
    issue: dict[str, Any],
    *,
    assessment: dict[str, Any] | None,
) -> dict[str, Any]:
    checks: list[tuple[str, bool]] = [
        ("stable issue ID", bool(str(issue.get("issue_id") or "").strip())),
        ("table scope", bool(str(issue.get("table") or "").strip())),
        ("issue type", bool(str(issue.get("issue_type") or "").strip())),
        ("bad row count", _to_int(issue.get("bad_count")) is not None),
        ("total row count", _to_int(issue.get("total_count")) is not None),
        ("affected rate", _to_float(issue.get("bad_rate")) is not None),
        ("evidence SQL", bool(str(issue.get("evidence_sql") or "").strip())),
        (
            "sample evidence",
            bool(str(issue.get("sample_bad_rows_path") or "").strip())
            or bool(_string_list(issue.get("sample_keys"))),
        ),
        ("fix guidance", bool(_string_list(issue.get("suggested_fix")))),
    ]
    if str(issue.get("table") or "").strip():
        checks.append(("table assessment", assessment is not None))
    if str(issue.get("issue_type") or "") in RELATIONSHIP_ISSUE_TYPES:
        checks.append(
            (
                "parent context",
                bool(str(issue.get("parent_table") or "").strip())
                and bool(_string_list(issue.get("parent_columns"))),
            )
        )
    present = [name for name, ok in checks if ok]
    missing = [name for name, ok in checks if not ok]
    score = int(round((len(present) / len(checks)) * 100)) if checks else 0
    label = "Strong" if score >= 80 else "Partial" if score >= 50 else "Needs human review"
    missing_text = (
        f" Missing: {', '.join(missing[:3])}{'...' if len(missing) > 3 else ''}."
        if missing
        else " All expected evidence fields are present."
    )
    return {
        "score": score,
        "label": label,
        "used": len(present),
        "possible": len(checks),
        "used_evidence": present,
        "missing_evidence": missing,
        "explanation": f"{len(present)}/{len(checks)} expected evidence fields are present.{missing_text}",
    }


def _actionability_score(
    *,
    coverage_score: int,
    has_fix: bool,
    has_verify: bool,
    has_context: bool,
    human_review_required: bool,
) -> dict[str, Any]:
    score = round(
        coverage_score * 0.55
        + (100 if has_fix else 30) * 0.2
        + (100 if has_verify else 30) * 0.15
        + (100 if has_context else 20) * 0.1
    )
    if human_review_required:
        score = min(score, 55)
    label = "High" if score >= 80 else "Medium" if score >= 55 else "Needs human review"
    return {
        "score": int(score),
        "label": label,
        "explanation": "Computed from evidence coverage, issue context, and fix/verify checklist completeness.",
    }


def _missing_context(issue: dict[str, Any], *, coverage: dict[str, Any]) -> list[str]:
    missing = []
    if not str(issue.get("issue_id") or "").strip():
        missing.append("stable issue ID")
    if not str(issue.get("table") or "").strip():
        missing.append("affected table")
    if not str(issue.get("issue_type") or "").strip():
        missing.append("issue type")
    if _to_int(issue.get("bad_count")) is None or _to_int(issue.get("total_count")) is None:
        missing.append("row-count evidence")
    if not str(issue.get("evidence_sql") or "").strip() and not _string_list(issue.get("sample_keys")):
        missing.append("query or sample evidence")
    if not _string_list(issue.get("suggested_fix")):
        missing.append("fix guidance")
    if coverage.get("score", 0) < 50:
        missing.append("minimum evidence coverage")
    return _unique_short_list(missing, limit=8)


def _human_review_reason(missing_context: list[str]) -> str:
    if not missing_context:
        return ""
    return f"Needs human review because deterministic context is incomplete: {', '.join(missing_context)}."


def _evidence_artifacts(
    issue: dict[str, Any],
    *,
    assessment: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = [
        {
            "artifact": "issues.json",
            "issue_id": str(issue.get("issue_id") or "UNKNOWN"),
        }
    ]
    sample_path = str(issue.get("sample_bad_rows_path") or "").strip()
    if sample_path:
        refs.append({"artifact": sample_path})
    if assessment:
        refs.append(
            {
                "artifact": "table_assessments.json",
                "table": str(assessment.get("table") or issue.get("table") or ""),
            }
        )
    return refs


def _scope_text(issue: dict[str, Any]) -> str:
    table = str(issue.get("table") or "unknown table")
    columns = _string_list(issue.get("columns"))
    if columns:
        return f"{table}.{', '.join(columns)}"
    return f"{table} table scope"


def _is_human_review_checklist(checklist: list[str]) -> bool:
    return bool(checklist) and checklist[0].lower().startswith("needs human review")


def _string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.strip() else []
    if isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray)):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _unique_short_list(values: Sequence[str], *, limit: int) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = " ".join(str(value).split())
        if not cleaned or cleaned in seen:
            continue
        result.append(cleaned)
        seen.add(cleaned)
        if len(result) >= limit:
            break
    return result


def _to_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _percent_text(value: float | None) -> str:
    if value is None:
        return "unknown"
    return f"{value * 100:.2f}%"


def _label(value: str) -> str:
    return value.replace("_", " ").title()


def _truncate(value: str, limit: int) -> str:
    if len(value) <= limit:
        return value
    return f"{value[: limit - 1]}..."
