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
    issue_context = _issue_context(issue)
    fix_steps = _fix_steps(
        issue,
        fixes=fixes,
        missing_context=missing_context,
        context=issue_context,
    )
    verify_steps = _verify_steps(issue, missing_context=missing_context, context=issue_context)
    fix_checklist = _step_checklist(fix_steps)
    verify_checklist = _step_checklist(verify_steps)
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
        "issue_context": issue_context,
        "evidence_values": _evidence_values(issue, assessment=assessment),
        "fix_data_steps": fix_steps,
        "fix_data_checklist": fix_checklist,
        "verify_after_fix_steps": verify_steps,
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


def _fix_steps(
    issue: dict[str, Any],
    *,
    fixes: list[str],
    missing_context: list[str],
    context: dict[str, Any],
) -> list[dict[str, str]]:
    scope = str(context.get("scope") or _scope_text(issue))
    issue_type = str(issue.get("issue_type") or "UNKNOWN")
    issue_label = str(context.get("issue_label") or _label(issue_type))
    affected_text = _affected_rows_text(issue)
    sample_path = str(context.get("sample_path") or "")
    parent_ref = str(context.get("parent_ref") or "")

    if missing_context or not fixes:
        return [
            _step(
                "Human review before changing data",
                f"Needs human review: confirm the affected table, column, evidence query, and expected DBML/CSV contract for {scope}.",
                evidence=f"Missing deterministic context: {', '.join(missing_context) or 'fix guidance'}.",
                why="The profiler cannot safely assign a concrete pipeline change until the expected contract is known.",
            )
        ]

    steps: list[dict[str, str]] = []
    if sample_path:
        steps.append(
            _step(
                "Inspect the exact failing rows",
                f"Open {sample_path} and inspect the rows where {scope} triggered {issue_label}.",
                evidence=affected_text,
                why="Use concrete row values before deciding whether this is a data defect, transform defect, or contract mismatch.",
            )
        )

    if issue_type == "FOREIGN_KEY_NULL":
        parent_hint = f" Parent reference: {parent_ref}." if parent_ref else ""
        steps.extend(
            [
                _step(
                    "Decide how null child keys should behave",
                    (
                        f"For {scope}, choose one path: backfill the key from the source, quarantine/drop rows "
                        f"without a valid parent, or update DBML only if the relationship is truly optional.{parent_hint}"
                    ),
                    evidence="The child foreign-key value is null or blank in the bounded sample rows.",
                    why="A blank child key makes joins unreliable unless the business relationship is intentionally optional.",
                ),
                _step(
                    "Fix the upstream source or transform",
                    (
                        f"Update the source extract or pipeline step that emits {scope}; do not edit generated "
                        "samples, issues.json, or reports."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested a source or relationship correction.",
                    why="Generated artifacts are evidence only; the next profiler run must read corrected CSV + DBML inputs.",
                ),
            ]
        )
    elif issue_type == "ORPHAN_FOREIGN_KEY":
        parent_hint = parent_ref or "the referenced parent key"
        steps.extend(
            [
                _step(
                    "Compare child keys with the parent table",
                    (
                        f"Use the sample rows for {scope} and check why those values do not exist in {parent_hint}."
                    ),
                    evidence="The issue was counted by an anti-join between child and parent keys.",
                    why="Orphans usually come from missing parent extracts, inconsistent key transforms, or load-order gaps.",
                ),
                _step(
                    "Repair the relationship source",
                    (
                        f"Load the missing parent rows, normalize key formatting on both sides, or quarantine child rows "
                        f"whose {scope} cannot map to {parent_hint}."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested a parent/child relationship correction.",
                    why="Fixing only the child table can hide a missing parent-dimension problem.",
                ),
            ]
        )
    elif issue_type == "PARENT_KEY_DUPLICATE":
        steps.extend(
            [
                _step(
                    "Find the duplicate parent records",
                    f"Inspect sample keys and rows for {scope}; identify which parent record should be canonical.",
                    evidence=affected_text,
                    why="Duplicate parent keys can multiply child rows and make relationship checks ambiguous.",
                ),
                _step(
                    "Deduplicate before using the table as a parent",
                    (
                        f"Fix the upstream dimension extract so {scope} is unique, or update the DBML key if the "
                        "declared parent key is not the real business key."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested parent-key deduplication.",
                    why="The parent table must have one row per key before child joins can be trusted.",
                ),
            ]
        )
    elif issue_type == "CHILD_RELATIONSHIP_DUPLICATE":
        parent_hint = f" against {parent_ref}" if parent_ref else ""
        steps.extend(
            [
                _step(
                    "Inspect duplicate child relationship rows",
                    f"Review the sample rows where {scope} repeats{parent_hint}.",
                    evidence=affected_text,
                    why="A declared one-to-one relationship cannot be trusted if the child side has repeated keys.",
                ),
                _step(
                    "Fix data or cardinality",
                    (
                        f"Deduplicate {scope} upstream if one row is expected, or update the DBML relationship "
                        "cardinality if repeated child rows are valid."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested child relationship deduplication.",
                    why="The correction depends on whether the contract or the extract is wrong.",
                ),
            ]
        )
    elif issue_type in {"DUPLICATE_PRIMARY_KEY", "UNIQUE_DUPLICATE"}:
        steps.extend(
            [
                _step(
                    "Identify the duplicate key groups",
                    f"Inspect sample keys and rows for {scope}; group records by the repeated value.",
                    evidence=affected_text,
                    why="The fix needs a deterministic choice of which row is canonical or whether the key definition is wrong.",
                ),
                _step(
                    "Enforce uniqueness upstream",
                    (
                        f"Deduplicate {scope}, fix key generation, or update the DBML unique/primary-key contract "
                        "if this column is not actually unique."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested a uniqueness correction.",
                    why="Analysis and joins can double-count records when keys are not unique.",
                ),
            ]
        )
    elif issue_type in {"PRIMARY_KEY_NULL", "REQUIRED_FIELD_NULL", "EMPTY_STRING"}:
        steps.extend(
            [
                _step(
                    "Trace where the missing value is produced",
                    f"Use the sample rows to find which source field or transform emitted a blank value for {scope}.",
                    evidence=affected_text,
                    why="Backfilling is only safe after locating the source of the missing value.",
                ),
                _step(
                    "Block or backfill before publish",
                    (
                        f"Add a validation in the source extract or pipeline so {scope} is populated, or route "
                        "incomplete rows to a reject/quarantine output."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested not-null enforcement.",
                    why="Required and key columns should be fixed before downstream analysis consumes the CSV.",
                ),
            ]
        )
    elif issue_type == "INVALID_PLACEHOLDER_TOKEN":
        steps.extend(
            [
                _step(
                    "Normalize placeholder values",
                    f"Inspect sample rows for placeholder tokens in {scope} and map them to null or a valid domain value.",
                    evidence=affected_text,
                    why="Tokens like unknown/NA/null strings can be mistaken for real values by analysis tools.",
                ),
                _step(
                    "Move normalization upstream",
                    f"Apply the placeholder mapping in the ingestion or export transform that produces {scope}.",
                    evidence=_first_string(fixes) or "Profiler suggested placeholder normalization.",
                    why="Consistent normalization prevents the same token issue from reappearing in future runs.",
                ),
            ]
        )
    elif issue_type == "NUMERIC_OUTLIER":
        steps.extend(
            [
                _step(
                    "Review the extreme values with context",
                    f"Inspect sample rows for {scope} and compare them with the column's expected business range.",
                    evidence=affected_text,
                    why="Outliers can be valid events, unit errors, sign errors, or extraction defects.",
                ),
                _step(
                    "Choose correction, transform, or accepted exception",
                    (
                        f"Correct invalid values, fix units/scaling for {scope}, or document that the extremes are "
                        "valid and should remain in the dataset."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested domain review for outliers.",
                    why="Outlier handling should be explainable before the data is presented.",
                ),
            ]
        )
    elif issue_type in TABLE_SCOPE_ISSUE_TYPES or issue_type == "TYPE_CAST_INVALID":
        steps.extend(
            [
                _step(
                    "Compare CSV output with the DBML contract",
                    f"Check the CSV header/type evidence for {scope} against the DBML declaration.",
                    evidence=affected_text,
                    why="Schema mismatches usually require deciding whether the extract or the contract is authoritative.",
                ),
                _step(
                    "Align source extract and contract",
                    (
                        f"Update the export query, transform, or DBML contract so {scope} has the expected table, "
                        "column, and type shape."
                    ),
                    evidence=_first_string(fixes) or "Profiler suggested schema alignment.",
                    why="The profiler should be rerun only after CSV + DBML agree on the same contract.",
                ),
            ]
        )
    else:
        steps.append(
            _step(
                "Apply the deterministic fix",
                f"{_first_string(fixes) or f'Update the source pipeline for {scope}.'}",
                evidence=affected_text,
                why="This issue has enough deterministic evidence to assign a source-data correction.",
            )
        )

    steps.append(
        _step(
            "Change only source inputs",
            "Apply the correction in the source extract, upstream pipeline, or DBML contract; do not edit generated artifacts.",
            evidence="Generated sample/report artifacts are read-only evidence.",
            why="The fix is proven only when a fresh run regenerates clean artifacts from corrected inputs.",
        )
    )
    return _unique_steps(steps, limit=5)


def _verify_steps(
    issue: dict[str, Any],
    *,
    missing_context: list[str],
    context: dict[str, Any],
) -> list[dict[str, str]]:
    scope = str(context.get("scope") or _scope_text(issue))
    issue_type = str(issue.get("issue_type") or "UNKNOWN")
    issue_label = str(context.get("issue_label") or _label(issue_type))
    parent_ref = str(context.get("parent_ref") or "")
    if missing_context:
        return [
            _step(
                "Human review defines the acceptance query",
                f"Needs human review: define the expected verification query for {scope} before approving the fix.",
                evidence=f"Missing deterministic context: {', '.join(missing_context)}.",
                why="Without a stable acceptance query, a rerun can look clean while the wrong contract was changed.",
            )
        ]

    steps = [
        _step(
            "Rerun the profiler",
            "Rerun the profiler on the corrected CSV + DBML inputs.",
            evidence="Use the same Stage 1/2 source selection, then run Stage 3 again.",
            why="Only a fresh run proves the source data or contract fix affected generated artifacts.",
        ),
        _step(
            "Confirm the issue disappeared",
            f"Confirm the {issue_label} finding for {scope} no longer appears in issues.json.",
            evidence="Filter issues.json by issue_type, table, and columns.",
            why="The exact finding should be gone, not merely hidden in the UI.",
        ),
        _step(
            "Confirm affected rows are zero",
            f"Confirm affected rows for {scope} are 0 in the rerun.",
            evidence="Check bad_count/affected rows for the rerun evidence.",
            why="A partial reduction is useful but should not be marked fixed until the affected count is zero.",
        ),
    ]
    if issue_type in RELATIONSHIP_ISSUE_TYPES:
        relationship_hint = f" for {scope} -> {parent_ref}" if parent_ref else f" for {scope}"
        steps.append(
            _step(
                "Verify the relationship check",
                f"Confirm the child-to-parent relationship check{relationship_hint} has zero orphan, duplicate, or null-key rows.",
                evidence="Review relationship issues and quality gates after the rerun.",
                why="Join readiness should come from the relationship gate, not just one sample row.",
            )
        )
    if issue_type == "NUMERIC_OUTLIER":
        steps.append(
            _step(
                "Record the outlier decision",
                "Confirm the reviewed extreme values are either corrected or accepted by a documented domain decision.",
                evidence="Compare rerun sample rows and the outlier profile.",
                why="Valid extremes should be explainable; invalid extremes should disappear after correction.",
            )
        )
    return _unique_steps(steps, limit=5)


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


def _issue_context(issue: dict[str, Any]) -> dict[str, Any]:
    issue_type = str(issue.get("issue_type") or "UNKNOWN")
    bad_count = _to_int(issue.get("bad_count"))
    total_count = _to_int(issue.get("total_count"))
    parent_ref = _parent_ref(issue)
    return {
        "scope": _scope_text(issue),
        "issue_label": _label(issue_type),
        "issue_type": issue_type,
        "severity": str(issue.get("severity") or "").strip().upper() or "unknown",
        "table": str(issue.get("table") or "").strip() or None,
        "columns": _string_list(issue.get("columns")),
        "parent_ref": parent_ref or None,
        "parent_table": str(issue.get("parent_table") or "").strip() or None,
        "parent_columns": _string_list(issue.get("parent_columns")),
        "affected_rows": bad_count if bad_count is not None else "unknown",
        "rows_checked": total_count if total_count is not None else "unknown",
        "affected_rate": _percent_text(_to_float(issue.get("bad_rate"))),
        "sample_path": str(issue.get("sample_bad_rows_path") or "").strip() or None,
        "sample_keys": _string_list(issue.get("sample_keys"))[:5],
        "has_evidence_sql": bool(str(issue.get("evidence_sql") or "").strip()),
    }


def _parent_ref(issue: dict[str, Any]) -> str:
    parent_table = str(issue.get("parent_table") or "").strip()
    parent_columns = _string_list(issue.get("parent_columns"))
    if parent_table and parent_columns:
        return f"{parent_table}.{', '.join(parent_columns)}"
    if parent_table:
        return f"{parent_table}.key"
    return ""


def _affected_rows_text(issue: dict[str, Any]) -> str:
    bad_count = _to_int(issue.get("bad_count"))
    total_count = _to_int(issue.get("total_count"))
    rate = _percent_text(_to_float(issue.get("bad_rate")))
    if bad_count is not None and total_count is not None:
        return f"{bad_count:,} of {total_count:,} checked rows are affected ({rate})."
    if bad_count is not None:
        return f"{bad_count:,} affected rows were counted; total checked rows are unknown."
    return "Affected row count is unknown; inspect generated evidence before changing data."


def _step(title: str, detail: str, *, evidence: str, why: str) -> dict[str, str]:
    return {
        "title": " ".join(str(title).split()),
        "detail": " ".join(str(detail).split()),
        "evidence": " ".join(str(evidence).split()),
        "why": " ".join(str(why).split()),
    }


def _unique_steps(steps: Sequence[dict[str, str]], *, limit: int) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    seen: set[str] = set()
    for step in steps:
        detail = " ".join(str(step.get("detail") or "").split())
        if not detail or detail in seen:
            continue
        result.append(
            {
                "title": " ".join(str(step.get("title") or "Step").split()),
                "detail": detail,
                "evidence": " ".join(str(step.get("evidence") or "").split()),
                "why": " ".join(str(step.get("why") or "").split()),
            }
        )
        seen.add(detail)
        if len(result) >= limit:
            break
    return result


def _step_checklist(steps: Sequence[dict[str, str]]) -> list[str]:
    return _unique_short_list([str(step.get("detail") or "") for step in steps], limit=5)


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


def _first_string(values: Sequence[str] | Any) -> str:
    for value in _string_list(values):
        if value:
            return value
    return ""


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
