from __future__ import annotations

from collections import Counter
from collections.abc import Mapping, Sequence
from typing import Any


QUALITY_GATES_ARTIFACT = "quality_gates"
QUALITY_GATES_VERSION = 1
GATE_STATUSES = ("Clean", "Needs Review", "Usable With Caution", "Blocked")
RELATIONSHIP_ISSUE_TYPES = {
    "ORPHAN_FOREIGN_KEY",
    "PARENT_KEY_DUPLICATE",
    "FOREIGN_KEY_NULL",
    "CHILD_RELATIONSHIP_DUPLICATE",
}
OUTLIER_ISSUE_TYPES = {"NUMERIC_OUTLIER"}
SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def build_quality_gates(
    *,
    preflight_review: Mapping[str, Any] | None = None,
    issues: Sequence[Mapping[str, Any]] | None = None,
    table_assessments: Mapping[str, Any] | None = None,
    issue_action_plans: Mapping[str, Any] | None = None,
    issue_todos: Mapping[str, Any] | None = None,
    dataset_verdict: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Evaluate deterministic post-run quality gates from existing artifacts."""

    issue_rows = [_dict_row(issue) for issue in issues or [] if isinstance(issue, Mapping)]
    assessment_rows = _assessment_rows(table_assessments)
    plan_rows = _plan_rows(issue_action_plans)
    todo_groups = _todo_groups(issue_todos)

    gates = [
        _can_run_analysis_gate(
            preflight_review=preflight_review,
            issue_rows=issue_rows,
            assessment_rows=assessment_rows,
            plan_rows=plan_rows,
            dataset_verdict=dataset_verdict,
        ),
        _can_trust_joins_gate(
            issue_rows=issue_rows,
            assessment_rows=assessment_rows,
            table_assessments=table_assessments,
        ),
        _needs_cleanup_gate(
            issue_rows=issue_rows,
            plan_rows=plan_rows,
            todo_groups=todo_groups,
            dataset_verdict=dataset_verdict,
        ),
        _outliers_need_review_gate(issue_rows=issue_rows),
    ]
    status_counts = Counter(gate["status"] for gate in gates)
    return {
        "artifact": QUALITY_GATES_ARTIFACT,
        "version": QUALITY_GATES_VERSION,
        "source": "deterministic",
        "derived_from": [
            "preflight_review.json",
            "issues.json",
            "table_assessments.json",
            "issue_action_plans.json",
            "issue_todos.json",
            "dataset_verdict.json",
        ],
        "summary": {
            "gate_count": len(gates),
            "blocked_count": status_counts.get("Blocked", 0),
            "needs_review_count": status_counts.get("Needs Review", 0),
            "usable_with_caution_count": status_counts.get("Usable With Caution", 0),
            "clean_count": status_counts.get("Clean", 0),
            "statuses": {status: status_counts.get(status, 0) for status in GATE_STATUSES},
            "source": "deterministic",
        },
        "gates": gates,
    }


def _can_run_analysis_gate(
    *,
    preflight_review: Mapping[str, Any] | None,
    issue_rows: list[dict[str, Any]],
    assessment_rows: list[dict[str, Any]],
    plan_rows: list[dict[str, Any]],
    dataset_verdict: Mapping[str, Any] | None,
) -> dict[str, Any]:
    severity_counts = _severity_counts(issue_rows, dataset_verdict=dataset_verdict)
    blocker_count = severity_counts["P0"] + severity_counts["P1"]
    preflight = _preflight_summary(preflight_review)
    verdict = str((dataset_verdict or {}).get("verdict") or "")
    not_ready_tables = [row for row in assessment_rows if str(row.get("readiness") or "") == "NOT_READY"]
    warning_tables = [row for row in assessment_rows if str(row.get("readiness") or "") == "WARN"]
    human_review_count = sum(1 for plan in plan_rows if bool(plan.get("human_review_required")))
    warning_issue_count = severity_counts["P2"] + severity_counts["P3"]

    if not dataset_verdict:
        status = "Needs Review"
        explanation = "Dataset readiness evidence is missing, so analysis readiness needs review."
    elif preflight["blocker_count"] > 0 or verdict == "NOT_READY" or blocker_count or not_ready_tables:
        status = "Blocked"
        explanation = (
            "Analysis should not proceed until blocker findings or not-ready table evidence are resolved."
        )
    elif preflight["warning_count"] > preflight["accepted_warning_count"] or human_review_count:
        status = "Needs Review"
        explanation = "Analysis evidence exists, but unresolved warnings or human-review plans need confirmation."
    elif verdict == "WARN" or warning_issue_count or warning_tables:
        status = "Usable With Caution"
        explanation = "The run completed, but warning-level findings should be reviewed before relying on outputs."
    else:
        status = "Clean"
        explanation = "The deterministic artifacts show no blockers or warning findings for analysis."

    return _gate(
        gate_id="can_run_analysis",
        label="Can run analysis",
        status=status,
        explanation=explanation,
        evidence_values=[
            _evidence(
                "Dataset verdict",
                verdict or "missing",
                "Overall readiness label from dataset_verdict.json.",
                "dataset_verdict.json",
                "verdict",
            ),
            _evidence(
                "P0/P1 issues",
                blocker_count,
                "High-priority issue count that can block analysis use.",
                "dataset_verdict.json" if dataset_verdict else "issues.json",
                "issue_counts.by_severity",
            ),
            _evidence(
                "Preflight review",
                preflight["status"],
                "Browser preflight state when a web run provided it; direct CLI runs may not record one.",
                "preflight_review.json",
                "status",
            ),
            _evidence(
                "Not-ready tables",
                len(not_ready_tables),
                "Tables marked NOT_READY in table_assessments.json.",
                "table_assessments.json",
                "summary.readiness_counts.NOT_READY",
            ),
        ],
        contexts=_issue_contexts(_top_issues(issue_rows, severities={"P0", "P1"}), limit=6)
        + _table_contexts(not_ready_tables, limit=4),
        recommended_next_action=_next_action(
            "Review Issues" if status in {"Blocked", "Needs Review"} else "Todos",
            "Open Review Issues for blocker context." if status in {"Blocked", "Needs Review"} else "Open Todos before sharing analysis outputs.",
        ),
    )


def _can_trust_joins_gate(
    *,
    issue_rows: list[dict[str, Any]],
    assessment_rows: list[dict[str, Any]],
    table_assessments: Mapping[str, Any] | None,
) -> dict[str, Any]:
    relationship_issues = [
        issue for issue in issue_rows if str(issue.get("issue_type") or "") in RELATIONSHIP_ISSUE_TYPES
    ]
    severe_relationship_issues = [
        issue for issue in relationship_issues if _severity(issue.get("severity")) in {"P0", "P1"}
    ]
    relationship_risks = _relationship_risks(assessment_rows)
    invalid_risks = [risk for risk in relationship_risks if risk["status"] == "invalid"]
    review_risks = [risk for risk in relationship_risks if risk["status"] in {"warning", "skipped"}]

    if not table_assessments:
        status = "Needs Review"
        explanation = "Table relationship-risk evidence is missing, so join trust needs review."
    elif invalid_risks or severe_relationship_issues:
        status = "Blocked"
        explanation = "Invalid FK or key evidence means joins should not be trusted yet."
    elif review_risks or relationship_issues:
        status = "Needs Review"
        explanation = "Relationship warnings or issue records need review before joins are trusted."
    else:
        status = "Clean"
        explanation = "No relationship-risk findings were present in the deterministic table assessments."

    return _gate(
        gate_id="can_trust_joins",
        label="Can trust joins",
        status=status,
        explanation=explanation,
        evidence_values=[
            _evidence(
                "Relationship issues",
                len(relationship_issues),
                "Issue records for FK, orphan, null-key, or parent duplicate checks.",
                "issues.json",
                "issue_type",
            ),
            _evidence(
                "Invalid relationship risks",
                len(invalid_risks),
                "Invalid relationship-risk rows from table_assessments.json.",
                "table_assessments.json",
                "assessments[].relationship_risks",
            ),
            _evidence(
                "Review relationship risks",
                len(review_risks),
                "Warning or skipped relationship checks that require human review.",
                "table_assessments.json",
                "assessments[].relationship_risks",
            ),
        ],
        contexts=_relationship_contexts(invalid_risks + review_risks, limit=6)
        + _issue_contexts(relationship_issues, limit=6),
        recommended_next_action=_next_action(
            "Review Issues",
            "Open Review Issues and inspect relationship findings before using joins.",
        ),
    )


def _needs_cleanup_gate(
    *,
    issue_rows: list[dict[str, Any]],
    plan_rows: list[dict[str, Any]],
    todo_groups: list[dict[str, Any]],
    dataset_verdict: Mapping[str, Any] | None,
) -> dict[str, Any]:
    severity_counts = _severity_counts(issue_rows, dataset_verdict=dataset_verdict)
    blocker_count = severity_counts["P0"] + severity_counts["P1"]
    issue_count = sum(severity_counts.values())
    human_review_count = sum(1 for plan in plan_rows if bool(plan.get("human_review_required")))
    fix_groups = [group for group in todo_groups if str(group.get("todo_type") or "") == "fix_data"]
    fix_occurrence_count = sum(_to_int(group.get("occurrence_count")) for group in fix_groups)

    if dataset_verdict and (str(dataset_verdict.get("verdict") or "") == "NOT_READY" or blocker_count):
        status = "Blocked"
        explanation = "Cleanup is required before this dataset is shared or treated as analysis-ready."
    elif human_review_count:
        status = "Needs Review"
        explanation = "Some action plans need human review before cleanup can be assigned confidently."
    elif issue_count or fix_occurrence_count:
        status = "Usable With Caution"
        explanation = "Cleanup work exists, but no P0/P1 blocker is present in this gate evidence."
    else:
        status = "Clean"
        explanation = "No issue or todo evidence indicates cleanup is needed before sharing."

    return _gate(
        gate_id="needs_cleanup_before_sharing",
        label="Needs cleanup before sharing",
        status=status,
        explanation=explanation,
        evidence_values=[
            _evidence(
                "Total issues",
                issue_count,
                "Total generated issue count used for cleanup readiness.",
                "dataset_verdict.json" if dataset_verdict else "issues.json",
                "issue_counts.total",
            ),
            _evidence(
                "Fix todo groups",
                len(fix_groups),
                "Grouped deterministic remediation todos from issue_todos.json.",
                "issue_todos.json",
                "summary.fix_data_group_count",
            ),
            _evidence(
                "Fix occurrences",
                fix_occurrence_count,
                "Issue occurrences attached to fix todos.",
                "issue_todos.json",
                "summary.fix_data_occurrence_count",
            ),
            _evidence(
                "Human-review plans",
                human_review_count,
                "Action plans with incomplete deterministic context.",
                "issue_action_plans.json",
                "summary.human_review_count",
            ),
        ],
        contexts=_todo_contexts(fix_groups, limit=8) or _issue_contexts(_top_issues(issue_rows), limit=8),
        recommended_next_action=_next_action(
            "Todos" if status != "Clean" else "Review Issues",
            "Open Todos and start with the highest-priority Fix data groups."
            if status != "Clean"
            else "Open Review Issues to confirm there are no cleanup findings.",
        ),
    )


def _outliers_need_review_gate(*, issue_rows: list[dict[str, Any]]) -> dict[str, Any]:
    outlier_issues = [
        issue for issue in issue_rows if str(issue.get("issue_type") or "") in OUTLIER_ISSUE_TYPES
    ]
    if outlier_issues:
        status = "Needs Review"
        explanation = "Numeric outlier findings are review warnings until a domain owner accepts or corrects them."
    else:
        status = "Clean"
        explanation = "No numeric outlier issue records were generated for this run."

    return _gate(
        gate_id="outliers_need_review",
        label="Outliers need review",
        status=status,
        explanation=explanation,
        evidence_values=[
            _evidence(
                "Numeric outlier issues",
                len(outlier_issues),
                "NUMERIC_OUTLIER findings detected in issues.json.",
                "issues.json",
                "issue_type",
            ),
            _evidence(
                "Outlier default",
                "review warning",
                "Outliers are not treated as hard data failures by default.",
                "issues.json",
                "severity",
            ),
        ],
        contexts=_issue_contexts(outlier_issues, limit=8),
        recommended_next_action=_next_action(
            "Review Issues" if outlier_issues else "Review Issues",
            "Open Review Issues for outlier columns and document accepted extremes."
            if outlier_issues
            else "Open Review Issues to confirm there are no outlier warnings.",
        ),
    )


def _gate(
    *,
    gate_id: str,
    label: str,
    status: str,
    explanation: str,
    evidence_values: list[dict[str, Any]],
    contexts: list[dict[str, Any]],
    recommended_next_action: dict[str, str],
) -> dict[str, Any]:
    return {
        "gate_id": gate_id,
        "label": label,
        "status": status if status in GATE_STATUSES else "Needs Review",
        "explanation": explanation,
        "evidence_values": evidence_values,
        "contexts": contexts,
        "recommended_next_action": recommended_next_action,
        "evidence_artifacts": sorted(
            {
                value["artifact"]
                for value in evidence_values
                if value.get("artifact") and value.get("artifact") != "not_recorded"
            }
        ),
    }


def _evidence(
    label: str,
    raw_value: Any,
    meaning: str,
    artifact: str,
    field: str,
) -> dict[str, Any]:
    return {
        "label": label,
        "raw_value": raw_value,
        "meaning": meaning,
        "artifact": artifact,
        "field": field,
    }


def _next_action(target: str, label: str) -> dict[str, str]:
    anchors = {"Review Issues": "#dashboardPanelGrid", "Todos": "#todos"}
    return {
        "label": label,
        "target": target,
        "anchor": anchors.get(target, "#dashboard"),
    }


def _dict_row(row: Mapping[str, Any]) -> dict[str, Any]:
    return dict(row)


def _assessment_rows(table_assessments: Mapping[str, Any] | None) -> list[dict[str, Any]]:
    rows = (table_assessments or {}).get("assessments") if isinstance(table_assessments, Mapping) else []
    if not isinstance(rows, Sequence) or isinstance(rows, (str, bytes, bytearray)):
        return []
    return [dict(row) for row in rows if isinstance(row, Mapping)]


def _plan_rows(issue_action_plans: Mapping[str, Any] | None) -> list[dict[str, Any]]:
    rows = (issue_action_plans or {}).get("plans") if isinstance(issue_action_plans, Mapping) else []
    if not isinstance(rows, Sequence) or isinstance(rows, (str, bytes, bytearray)):
        return []
    return [dict(row) for row in rows if isinstance(row, Mapping)]


def _todo_groups(issue_todos: Mapping[str, Any] | None) -> list[dict[str, Any]]:
    rows = (issue_todos or {}).get("groups") if isinstance(issue_todos, Mapping) else []
    if not isinstance(rows, Sequence) or isinstance(rows, (str, bytes, bytearray)):
        return []
    return [dict(row) for row in rows if isinstance(row, Mapping)]


def _preflight_summary(preflight_review: Mapping[str, Any] | None) -> dict[str, Any]:
    if not isinstance(preflight_review, Mapping):
        return {
            "status": "not_recorded",
            "blocker_count": 0,
            "warning_count": 0,
            "accepted_warning_count": 0,
        }
    blockers = _sequence(preflight_review.get("blockers"))
    warnings = _sequence(preflight_review.get("warnings"))
    accepted = [
        warning
        for warning in warnings
        if isinstance(warning, Mapping) and bool(warning.get("accepted"))
    ]
    accepted_ids = _sequence(preflight_review.get("accepted_warning_ids"))
    return {
        "status": str(preflight_review.get("status") or "recorded"),
        "blocker_count": len(blockers),
        "warning_count": len(warnings),
        "accepted_warning_count": max(len(accepted), len(accepted_ids)),
    }


def _severity_counts(
    issue_rows: list[dict[str, Any]],
    *,
    dataset_verdict: Mapping[str, Any] | None,
) -> dict[str, int]:
    verdict_counts = ((dataset_verdict or {}).get("issue_counts") or {}).get("by_severity")
    if isinstance(verdict_counts, Mapping):
        return {severity: _to_int(verdict_counts.get(severity)) for severity in SEVERITY_ORDER}
    counts = {severity: 0 for severity in SEVERITY_ORDER}
    for issue in issue_rows:
        counts[_severity(issue.get("severity"))] += 1
    return counts


def _relationship_risks(assessment_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    risks: list[dict[str, Any]] = []
    for assessment in assessment_rows:
        table = str(assessment.get("table") or "")
        for risk in _sequence(assessment.get("relationship_risks")):
            if not isinstance(risk, Mapping):
                continue
            risks.append(
                {
                    **dict(risk),
                    "table": table,
                    "status": str(risk.get("status") or ""),
                }
            )
    return sorted(
        risks,
        key=lambda risk: (
            {"invalid": 0, "warning": 1, "skipped": 2}.get(risk["status"], 9),
            str(risk.get("table") or ""),
            str(risk.get("relationship_id") or ""),
        ),
    )


def _top_issues(
    issue_rows: list[dict[str, Any]],
    *,
    severities: set[str] | None = None,
) -> list[dict[str, Any]]:
    rows = [
        issue
        for issue in issue_rows
        if severities is None or _severity(issue.get("severity")) in severities
    ]
    return sorted(
        rows,
        key=lambda issue: (
            SEVERITY_ORDER.get(_severity(issue.get("severity")), 99),
            -_to_int(issue.get("bad_count")),
            str(issue.get("issue_id") or ""),
        ),
    )


def _issue_contexts(issue_rows: list[dict[str, Any]], *, limit: int) -> list[dict[str, Any]]:
    contexts = []
    for issue in issue_rows[:limit]:
        contexts.append(
            {
                "source_artifact": "issues.json",
                "issue_id": str(issue.get("issue_id") or "UNKNOWN"),
                "issue_type": str(issue.get("issue_type") or "UNKNOWN"),
                "severity": _severity(issue.get("severity")),
                "table": str(issue.get("table") or "dataset"),
                "columns": _string_list(issue.get("columns")),
                "parent_table": issue.get("parent_table") or None,
                "parent_columns": _string_list(issue.get("parent_columns")),
            }
        )
    return contexts


def _table_contexts(assessment_rows: list[dict[str, Any]], *, limit: int) -> list[dict[str, Any]]:
    contexts = []
    for row in assessment_rows[:limit]:
        contexts.append(
            {
                "source_artifact": "table_assessments.json",
                "table": str(row.get("table") or "unknown"),
                "status": str(row.get("readiness") or "unknown"),
                "columns": _string_list(row.get("affected_columns")),
            }
        )
    return contexts


def _relationship_contexts(risks: list[dict[str, Any]], *, limit: int) -> list[dict[str, Any]]:
    contexts = []
    seen: set[str] = set()
    for risk in risks:
        key = str(risk.get("relationship_id") or "") or repr(risk)
        if key in seen:
            continue
        seen.add(key)
        contexts.append(
            {
                "source_artifact": "table_assessments.json",
                "relationship_id": str(risk.get("relationship_id") or ""),
                "status": str(risk.get("status") or "unknown"),
                "table": str(risk.get("source_table") or risk.get("table") or "unknown"),
                "columns": _string_list(risk.get("source_columns")),
                "parent_table": risk.get("target_table") or None,
                "parent_columns": _string_list(risk.get("target_columns")),
            }
        )
        if len(contexts) >= limit:
            break
    return contexts


def _todo_contexts(todo_groups: list[dict[str, Any]], *, limit: int) -> list[dict[str, Any]]:
    contexts = []
    for group in sorted(
        todo_groups,
        key=lambda row: (
            _priority_rank(_string_list(row.get("priorities"))),
            str(row.get("todo_id") or ""),
            str(row.get("text") or ""),
        ),
    ):
        occurrences = [item for item in _sequence(group.get("occurrences")) if isinstance(item, Mapping)]
        first = dict(occurrences[0]) if occurrences else {}
        contexts.append(
            {
                "source_artifact": "issue_todos.json",
                "todo_id": str(group.get("todo_id") or ""),
                "todo_type": str(group.get("todo_type") or ""),
                "text": str(group.get("text") or ""),
                "occurrence_count": _to_int(group.get("occurrence_count")),
                "issue_id": str(first.get("issue_id") or "UNKNOWN"),
                "issue_type": str(first.get("issue_type") or "UNKNOWN"),
                "severity": _severity(first.get("severity")),
                "table": str(first.get("table") or "unknown"),
                "columns": _string_list(first.get("columns")),
            }
        )
        if len(contexts) >= limit:
            break
    return contexts


def _priority_rank(priorities: list[str]) -> int:
    ranks = [SEVERITY_ORDER.get(priority.split(" ", 1)[0].upper(), 99) for priority in priorities]
    return min(ranks) if ranks else 99


def _severity(value: Any) -> str:
    normalized = str(value or "").strip().upper().replace("-", "_")
    return normalized if normalized in SEVERITY_ORDER else "P3"


def _string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray)):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _sequence(value: Any) -> list[Any]:
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return list(value)
    return []


def _to_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0
