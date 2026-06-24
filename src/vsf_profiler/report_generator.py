from __future__ import annotations

from collections import Counter, defaultdict
import csv
import json
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from vsf_profiler.dataset_verdict import SEVERITIES, issue_sort_key, normalize_severity
from vsf_profiler.models import InfluenceResult, Issue, ProfileSummary


RELATIONSHIP_ISSUES = {
    "ORPHAN_FOREIGN_KEY",
    "PARENT_KEY_DUPLICATE",
    "FOREIGN_KEY_NULL",
    "CHILD_RELATIONSHIP_DUPLICATE",
}
MAIN_REPORT_ACTION_PLAN_LIMIT = 5
MAIN_REPORT_EVIDENCE_VALUE_LIMIT = 6
MAIN_REPORT_TODO_GROUP_LIMIT = 10
DEVELOPER_ARTIFACT_LABELS = {
    "connector_metadata.json": "Connector Metadata",
    "lineage_graph.json": "Developer Runtime Context",
    "schema_evaluation.json": "Schema Evaluation",
    "relationship_graph.json": "Relationship Graph",
    "issue_action_plans.json": "Issue Action Plans",
    "issue_todos.json": "Issue Todos",
    "quality_gates.json": "Quality Gates",
    "issue_llm_enrichments.json": "Issue LLM Enrichments",
    "ground_truth_issues.json": "Evaluation Ground Truth",
    "baseline_comparison.json": "Great Expectations Baseline Comparison",
    "evaluation_summary.json": "Evaluation Summary",
    "run_summary.json": "Run Summary",
    "run_events.jsonl": "Run Events",
    "run.log": "Run Log",
}


def generate_reports(
    *,
    out_dir: Path,
    profile: ProfileSummary,
    issues: list[Issue],
    influence: InfluenceResult,
    schema_diagram: dict[str, Any],
    schema_parse_report: dict[str, Any] | None = None,
    connector_metadata: dict[str, Any] | None = None,
    lineage_graph: dict[str, Any] | None = None,
    schema_evaluation: dict[str, Any] | None = None,
    relationship_graph: dict[str, Any] | None = None,
    dataset_verdict: dict[str, Any] | None = None,
    table_assessments: dict[str, Any] | None = None,
    chart_specs: dict[str, dict[str, Any]] | None = None,
    run_summary: dict[str, Any] | None = None,
) -> None:
    context = _build_context(
        out_dir,
        profile,
        issues,
        influence,
        schema_diagram,
        schema_parse_report,
        connector_metadata,
        lineage_graph,
        schema_evaluation,
        relationship_graph,
        dataset_verdict,
        table_assessments,
        chart_specs,
        run_summary,
    )
    env = _template_env()
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "report.md").write_text(env.get_template("report.md.j2").render(**context))
    (out_dir / "report.html").write_text(env.get_template("report.html.j2").render(**context))


def _template_env() -> Environment:
    template_dir = Path(__file__).resolve().parents[2] / "templates"
    env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(enabled_extensions=("html", "xml")),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["pct"] = lambda value: f"{float(value) * 100:.2f}%"
    return env


def _build_context(
    out_dir: Path,
    profile: ProfileSummary,
    issues: list[Issue],
    influence: InfluenceResult,
    schema_diagram: dict[str, Any],
    schema_parse_report: dict[str, Any] | None,
    connector_metadata: dict[str, Any] | None,
    lineage_graph: dict[str, Any] | None,
    schema_evaluation: dict[str, Any] | None,
    relationship_graph: dict[str, Any] | None,
    dataset_verdict: dict[str, Any] | None,
    table_assessments: dict[str, Any] | None,
    chart_specs: dict[str, dict[str, Any]] | None,
    run_summary: dict[str, Any] | None,
) -> dict[str, Any]:
    sorted_issues = sorted(issues, key=issue_sort_key)
    verdict_context = _dataset_verdict_context(dataset_verdict)
    schema_parse_context = _schema_parse_report_context(schema_parse_report)
    connector_context = _connector_metadata_context(connector_metadata)
    lineage_context = _lineage_graph_context(lineage_graph)
    schema_context = _schema_evaluation_context(schema_evaluation)
    relationship_context = _relationship_graph_context(relationship_graph)
    table_assessment_context = _table_assessments_context(table_assessments)
    chart_context = _chart_specs_context(chart_specs)
    execution_context = _execution_flow_context(run_summary)
    l4_context = _l4_report_context(run_summary, out_dir)
    preflight_context = _preflight_review_context(_read_json_artifact(out_dir / "preflight_review.json"))
    quality_gates_context = _quality_gates_context(_read_json_artifact(out_dir / "quality_gates.json"))
    action_plans_context = _issue_action_plans_context(
        _read_json_artifact(out_dir / "issue_action_plans.json")
    )
    issue_enrichments_context = _issue_llm_enrichments_context(
        _read_json_artifact(out_dir / "issue_llm_enrichments.json")
    )
    todos_context = _issue_todos_context(_read_json_artifact(out_dir / "issue_todos.json"))
    evaluation_context = _evaluation_summary_context(
        _read_json_artifact(out_dir / "evaluation_summary.json")
    )
    table_count = len(profile.tables)
    column_count = sum(table.column_count for table in profile.tables.values())
    row_count = sum(table.row_count for table in profile.tables.values())
    issue_evidence = _issue_evidence_context(sorted_issues)
    fixed_report = {
        "run_summary": _fixed_run_summary_context(
            table_count=table_count,
            column_count=column_count,
            row_count=row_count,
            issues=sorted_issues,
            dataset_verdict=verdict_context,
            run_summary=execution_context,
            preflight_review=preflight_context,
            quality_gates=quality_gates_context,
        ),
        "quality_gates": quality_gates_context,
        "table_overview": _table_overview_context(
            profile=profile,
            table_assessments=table_assessment_context,
        ),
        "column_issue_matrix": _column_issue_matrix_context(sorted_issues, profile),
        "issue_action_plans": action_plans_context,
        "todos": todos_context,
        "developer_artifacts": _developer_artifacts_context(
            execution_context=execution_context,
            chart_context=chart_context,
            schema_diagram=schema_diagram,
            l4_report=l4_context,
            issue_enrichments=issue_enrichments_context,
        ),
        "evaluation_summary": evaluation_context,
    }
    visual_report = _visual_report_context(
        out_dir=out_dir,
        profile=profile,
        issues=sorted_issues,
        fixed_report=fixed_report,
        chart_context=chart_context,
        action_plans=action_plans_context,
    )
    return {
        "summary": {
            "table_count": table_count,
            "column_count": column_count,
            "row_count": row_count,
            "issue_count": len(issues),
            "critical_issue_count": sum(
                1 for issue in issues if normalize_severity(issue.severity) in {"P0", "P1"}
            ),
        },
        "scorecard": _scorecard_context(
            table_count=table_count,
            column_count=column_count,
            row_count=row_count,
            issues=sorted_issues,
            dataset_verdict=verdict_context,
            relationship_graph=relationship_context,
            l4_report=l4_context,
        ),
        "profile": profile,
        "issues": sorted_issues,
        "issue_evidence": issue_evidence,
        "top_issues": sorted_issues[:15],
        "relationship_issues": [
            issue for issue in sorted_issues if issue.issue_type in RELATIONSHIP_ISSUES
        ],
        "column_usability": _column_usability_context(profile, sorted_issues),
        "table_health_reviews": _table_health_reviews_context(
            profile,
            sorted_issues,
            table_assessment_context,
        ),
        "column_issue_blocks": _column_issue_blocks_context(sorted_issues),
        "influence": influence,
        "schema_diagram": schema_diagram,
        "schema_parse_report": schema_parse_context,
        "connector_metadata": connector_context,
        "lineage_graph": lineage_context,
        "schema_evaluation": schema_context,
        "relationship_graph": relationship_context,
        "dataset_verdict": verdict_context,
        "table_assessments": table_assessment_context,
        "chart_specs": chart_context,
        "execution_flow": execution_context,
        "l4_report": l4_context,
        "preflight_review": preflight_context,
        "quality_gates": quality_gates_context,
        "issue_action_plans": action_plans_context,
        "issue_llm_enrichments": issue_enrichments_context,
        "issue_todos": todos_context,
        "fixed_report": fixed_report,
        "visual_report": visual_report,
        "recommended_actions": _recommended_actions(sorted_issues, verdict_context),
    }


def _recommended_actions(issues: list[Issue], dataset_verdict: dict[str, Any]) -> list[str]:
    verdict_actions = dataset_verdict.get("recommended_next_actions", [])
    if verdict_actions:
        return verdict_actions

    actions: list[str] = []
    seen: set[str] = set()
    for issue in issues:
        for action in issue.suggested_fix:
            if action not in seen:
                actions.append(action)
                seen.add(action)
            if len(actions) >= 10:
                return actions
    return actions


def _read_json_artifact(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def _preflight_review_context(artifact: dict[str, Any] | None) -> dict[str, Any]:
    if not artifact:
        return {
            "available": False,
            "status": "not recorded",
            "mode": "unknown",
            "blocker_count": 0,
            "warning_count": 0,
            "accepted_warning_count": 0,
            "message": "No preflight_review.json was recorded for this run.",
        }
    blockers = artifact.get("blockers") if isinstance(artifact.get("blockers"), list) else []
    warnings = artifact.get("warnings") if isinstance(artifact.get("warnings"), list) else []
    accepted = artifact.get("accepted_warning_ids")
    accepted_count = len(accepted) if isinstance(accepted, list) else sum(
        1 for warning in warnings if isinstance(warning, dict) and warning.get("accepted")
    )
    return {
        "available": True,
        "status": str(artifact.get("status") or "unknown"),
        "mode": str(artifact.get("mode") or "unknown"),
        "recorded_at": artifact.get("recorded_at") or artifact.get("generated_at") or "",
        "blocker_count": len(blockers),
        "warning_count": len(warnings),
        "accepted_warning_count": accepted_count,
        "blockers": blockers[:8],
        "warnings": warnings[:8],
        "message": "Preflight review was recorded before the run.",
    }


def _quality_gates_context(artifact: dict[str, Any] | None) -> dict[str, Any]:
    if not artifact:
        return {
            "available": False,
            "summary": {},
            "gates": [],
            "answers": _quality_gate_answers([]),
            "message": "quality_gates.json was not available, so readiness gate answers need review.",
        }
    gates = []
    for gate in artifact.get("gates", []):
        if not isinstance(gate, dict):
            continue
        display_gate = dict(gate)
        display_gate["evidence_values"] = _display_evidence_values(gate.get("evidence_values"))
        gates.append(display_gate)
    return {
        "available": True,
        "path": "quality_gates.json",
        "summary": artifact.get("summary") or {},
        "source": artifact.get("source", "deterministic"),
        "derived_from": artifact.get("derived_from") or [],
        "gates": gates,
        "answers": _quality_gate_answers(gates),
        "message": "Quality gates are deterministic artifact evidence.",
    }


def _quality_gate_answers(gates: list[dict[str, Any]]) -> dict[str, dict[str, str]]:
    by_id = {str(gate.get("gate_id") or ""): gate for gate in gates}
    specs = {
        "can_run_analysis": "Can this dataset run analysis?",
        "can_trust_joins": "Can joins be trusted?",
        "needs_cleanup_before_sharing": "What should be fixed before sharing?",
        "outliers_need_review": "Do outliers need review?",
    }
    answers: dict[str, dict[str, str]] = {}
    for gate_id, question in specs.items():
        gate = by_id.get(gate_id, {})
        status = str(gate.get("status") or "Needs Review")
        explanation = str(
            gate.get("explanation")
            or "Gate evidence is missing; review generated artifacts before relying on this answer."
        )
        answers[gate_id] = {
            "question": question,
            "status": status,
            "answer": _gate_answer_text(status),
            "explanation": explanation,
            "target": str((gate.get("recommended_next_action") or {}).get("target") or ""),
            "action": str((gate.get("recommended_next_action") or {}).get("label") or ""),
        }
    return answers


def _gate_answer_text(status: str) -> str:
    if status == "Clean":
        return "Yes."
    if status == "Usable With Caution":
        return "Yes, with caution."
    if status == "Blocked":
        return "No."
    return "Needs review."


def _display_evidence_values(values: Any) -> list[dict[str, Any]]:
    if not isinstance(values, list):
        return []
    display_values: list[dict[str, Any]] = []
    for value in values:
        if not isinstance(value, dict):
            continue
        display_value = dict(value)
        if "meaning" in display_value:
            display_value["meaning"] = _display_artifact_text(str(display_value.get("meaning") or ""))
        raw_value = display_value.get("raw_value")
        if isinstance(raw_value, str) and raw_value.endswith(".json"):
            display_value["raw_value"] = _display_artifact_text(raw_value)
        display_values.append(display_value)
    return display_values


def _display_artifact_text(text: str) -> str:
    replacements = {
        "dataset_verdict.json": "dataset readiness evidence",
        "issues.json": "issue evidence",
        "table_assessments.json": "table readiness evidence",
        "issue_action_plans.json": "issue action-plan evidence",
        "issue_todos.json": "todo evidence",
        "quality_gates.json": "quality gate evidence",
        "profile_summary.json": "profile evidence",
        "relationship_graph.json": "relationship evidence",
        "schema_evaluation.json": "schema mapping evidence",
        "schema_parse_report.json": "schema parse evidence",
        "run_summary.json": "run summary evidence",
        "preflight_review.json": "preflight review evidence",
    }
    for artifact_name, label in replacements.items():
        text = text.replace(artifact_name, label)
    return text


def _table_overview_context(
    *,
    profile: ProfileSummary,
    table_assessments: dict[str, Any],
) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    assessments = {
        str(row.get("table") or ""): row
        for row in table_assessments.get("assessments", [])
        if isinstance(row, dict)
    }
    for table_name, table in sorted(profile.tables.items()):
        assessment = assessments.get(table_name, {})
        affected_columns = assessment.get("affected_columns") or []
        relationship_risks = assessment.get("relationship_risks") or []
        rows.append(
            {
                "table": table_name,
                "row_count": table.row_count,
                "column_count": table.column_count,
                "readiness": assessment.get("readiness", "unknown"),
                "role": assessment.get("role", "unknown"),
                "health_score": assessment.get("health_score", "unknown"),
                "issue_total": sum((assessment.get("issue_counts_by_severity") or {}).values())
                if assessment
                else 0,
                "affected_columns_text": ", ".join(affected_columns) if affected_columns else "none",
                "relationship_risk_count": len(relationship_risks),
                "next_step": (assessment.get("recommended_next_actions") or ["No deterministic next step."])[0],
            }
        )
    rows.sort(key=lambda row: (_readiness_rank(str(row["readiness"])), str(row["table"])))
    return {
        "available": bool(rows),
        "path": table_assessments.get("path", "table_assessments.json")
        if table_assessments.get("available")
        else "",
        "summary": {
            "table_count": len(rows),
            "not_ready_count": sum(1 for row in rows if row["readiness"] == "NOT_READY"),
            "warn_count": sum(1 for row in rows if row["readiness"] == "WARN"),
            "ready_count": sum(1 for row in rows if row["readiness"] == "READY"),
        },
        "rows": rows,
    }


def _readiness_rank(readiness: str) -> int:
    return {"NOT_READY": 0, "WARN": 1, "READY": 2}.get(readiness, 3)


def _column_issue_matrix_context(issues: list[Issue], profile: ProfileSummary) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for issue in issues:
        columns = issue.columns or ["table_level"]
        for column in columns:
            field = issue.table if column == "table_level" else f"{issue.table}.{column}"
            rows.append(
                {
                    "field": field,
                    "table": issue.table,
                    "column": column,
                    "issue_id": issue.issue_id,
                    "issue_type": issue.issue_type,
                    "severity": issue.severity,
                    "status": _issue_status_label(issue),
                    "bad_rows": f"{issue.bad_count}/{issue.total_count}",
                    "bad_rate": issue.bad_rate,
                    "meaning": _analysis_consequence(issue),
                    "fix": issue.suggested_fix[0]
                    if issue.suggested_fix
                    else "Review generated evidence before making data changes.",
                    "sample": issue.sample_bad_rows_path or "",
                }
            )
    rows.sort(
        key=lambda row: (
            _severity_sort_order(str(row["severity"])),
            str(row["table"]),
            str(row["column"]),
            str(row["issue_id"]),
        )
    )
    return {
        "available": bool(profile.tables),
        "issue_cell_count": len(rows),
        "rows": rows[:60],
        "message": "No issue rows were generated." if not rows else "",
    }


def _issue_status_label(issue: Issue) -> str:
    if issue.issue_type == "NUMERIC_OUTLIER":
        return "Needs Review"
    severity = normalize_severity(issue.severity)
    if severity in {"P0", "P1"}:
        return "Blocked"
    if severity == "P2":
        return "Needs Review"
    if severity == "P3":
        return "Usable With Caution"
    return "Needs Review"


def _issue_action_plans_context(artifact: dict[str, Any] | None) -> dict[str, Any]:
    if not artifact:
        return {
            "available": False,
            "summary": {},
            "plans": [],
            "display_plans": [],
            "summary_rows": [],
            "display_limit": MAIN_REPORT_ACTION_PLAN_LIMIT,
            "remaining_count": 0,
            "message": "issue_action_plans.json was not available, so issue-level fix guidance is partial.",
        }
    plans = []
    for plan in artifact.get("plans", []):
        if not isinstance(plan, dict):
            continue
        display_plan = dict(plan)
        display_plan["evidence_values"] = _display_evidence_values(plan.get("evidence_values"))
        plans.append(display_plan)
    display_plans = []
    for plan in plans[:MAIN_REPORT_ACTION_PLAN_LIMIT]:
        display_plan = dict(plan)
        display_plan["evidence_values"] = list(plan.get("evidence_values") or [])[
            :MAIN_REPORT_EVIDENCE_VALUE_LIMIT
        ]
        display_plan["hidden_evidence_value_count"] = max(
            0,
            len(plan.get("evidence_values") or []) - MAIN_REPORT_EVIDENCE_VALUE_LIMIT,
        )
        display_plans.append(display_plan)
    return {
        "available": True,
        "path": "issue_action_plans.json",
        "summary": artifact.get("summary") or {},
        "plans": plans,
        "display_plans": display_plans,
        "summary_rows": [_action_plan_summary_row(plan) for plan in plans[:30]],
        "display_limit": MAIN_REPORT_ACTION_PLAN_LIMIT,
        "remaining_count": max(0, len(plans) - len(display_plans)),
        "message": "Main report shows the highest-priority action plans first. Full deterministic action-plan evidence remains in issue_action_plans.json.",
    }


def _action_plan_summary_row(plan: dict[str, Any]) -> dict[str, Any]:
    fix_items = [str(item) for item in plan.get("fix_data_checklist") or [] if str(item).strip()]
    verify_items = [
        str(item) for item in plan.get("verify_after_fix_checklist") or [] if str(item).strip()
    ]
    coverage = plan.get("evidence_coverage") or {}
    actionability = plan.get("actionability_score") or {}
    return {
        "issue_id": str(plan.get("issue_id") or "UNKNOWN"),
        "issue_type": str(plan.get("issue_type") or "Issue"),
        "priority": str(plan.get("priority") or "Needs human review"),
        "table": str(plan.get("table") or "unknown"),
        "columns": ", ".join(str(column) for column in plan.get("columns") or []) or "table-level",
        "finding": str(plan.get("finding_summary") or "Finding summary needs human review."),
        "first_fix": fix_items[0] if fix_items else "Needs human review.",
        "first_verify": verify_items[0] if verify_items else "Needs human review.",
        "evidence_coverage": coverage.get("score", 0),
        "actionability": actionability.get("score", 0),
        "human_review_required": bool(plan.get("human_review_required")),
    }


def _issue_todos_context(artifact: dict[str, Any] | None) -> dict[str, Any]:
    if not artifact:
        return {
            "available": False,
            "summary": {},
            "fix_groups": [],
            "verify_groups": [],
            "fix_display_groups": [],
            "verify_display_groups": [],
            "display_limit": MAIN_REPORT_TODO_GROUP_LIMIT,
            "fix_remaining_count": 0,
            "verify_remaining_count": 0,
            "message": "issue_todos.json was not available, so fix and verification todos are partial.",
        }
    groups = [dict(group) for group in artifact.get("groups", []) if isinstance(group, dict)]
    fix_groups = [group for group in groups if group.get("todo_type") == "fix_data"]
    verify_groups = [group for group in groups if group.get("todo_type") == "verify_after_fix"]
    return {
        "available": True,
        "path": "issue_todos.json",
        "summary": artifact.get("summary") or {},
        "fix_groups": fix_groups[:30],
        "verify_groups": verify_groups[:30],
        "fix_display_groups": fix_groups[:MAIN_REPORT_TODO_GROUP_LIMIT],
        "verify_display_groups": verify_groups[:MAIN_REPORT_TODO_GROUP_LIMIT],
        "display_limit": MAIN_REPORT_TODO_GROUP_LIMIT,
        "fix_remaining_count": max(0, len(fix_groups) - MAIN_REPORT_TODO_GROUP_LIMIT),
        "verify_remaining_count": max(0, len(verify_groups) - MAIN_REPORT_TODO_GROUP_LIMIT),
        "message": "Todos are split into Fix data and Verify after fix groups.",
    }


def _issue_llm_enrichments_context(artifact: dict[str, Any] | None) -> dict[str, Any]:
    if not artifact:
        return {
            "available": False,
            "path": "",
            "summary": {},
        }
    return {
        "available": True,
        "path": "issue_llm_enrichments.json",
        "summary": artifact.get("summary") or {},
    }


def _developer_artifacts_context(
    *,
    execution_context: dict[str, Any],
    chart_context: dict[str, Any],
    schema_diagram: dict[str, Any],
    l4_report: dict[str, Any],
    issue_enrichments: dict[str, Any],
) -> dict[str, Any]:
    artifacts = list(execution_context.get("artifacts") or [])
    paths = {str(artifact.get("path") or "") for artifact in artifacts}
    for path in [
        "connector_metadata.json",
        "lineage_graph.json",
        "schema_evaluation.json",
        "relationship_graph.json",
        "profile_summary.json",
        "issues.json",
        "quality_gates.json",
        "issue_action_plans.json",
        "issue_todos.json",
        "table_assessments.json",
        "run_summary.json",
        "run_events.jsonl",
        "report.html",
        "report.md",
    ]:
        if path and path not in paths:
            artifacts.append({"name": _developer_artifact_label(path), "path": path})
            paths.add(path)
    for chart in chart_context.get("paths") or []:
        path = chart.get("path")
        if path and path not in paths:
            artifacts.append({"name": chart.get("name", path), "path": path})
            paths.add(path)
    dbml_path = schema_diagram.get("dbml_path")
    if dbml_path and dbml_path not in paths:
        artifacts.append({"name": "Generated DBML", "path": dbml_path})
    if l4_report.get("available"):
        for path in [l4_report.get("path"), l4_report.get("guardrail_path")]:
            if path and path not in paths:
                artifacts.append({"name": _developer_artifact_label(path), "path": path})
                paths.add(path)
    if issue_enrichments.get("available") and issue_enrichments.get("path") not in paths:
        path = issue_enrichments["path"]
        artifacts.append({"name": _developer_artifact_label(path), "path": path})
        paths.add(path)
    normalized = []
    for artifact in artifacts:
        path = str(artifact.get("path") or "")
        if not path:
            continue
        normalized.append({"name": _developer_artifact_label(path), "path": path})
    return {
        "available": bool(normalized),
        "artifacts": sorted(normalized, key=lambda artifact: str(artifact.get("path") or "")),
    }


def _developer_artifact_label(path: str) -> str:
    return DEVELOPER_ARTIFACT_LABELS.get(path, Path(path).stem.replace("_", " ").title())


def _evaluation_summary_context(artifact: dict[str, Any] | None) -> dict[str, Any]:
    if not artifact:
        return {
            "available": False,
            "status": "not_applicable",
            "message": "Not evaluated: this Profile my data run did not include an evaluation artifact.",
        }
    return {
        "available": True,
        "status": str(artifact.get("status") or "available"),
        "summary": artifact.get("summary") or artifact,
        "message": "Evaluation Summary loaded from evaluation_summary.json.",
    }


def _fixed_run_summary_context(
    *,
    table_count: int,
    column_count: int,
    row_count: int,
    issues: list[Issue],
    dataset_verdict: dict[str, Any],
    run_summary: dict[str, Any],
    preflight_review: dict[str, Any],
    quality_gates: dict[str, Any],
) -> dict[str, Any]:
    severity_counts = Counter(normalize_severity(issue.severity) for issue in issues)
    return {
        "run_id": run_summary.get("run_id", ""),
        "status": run_summary.get("status", "unknown"),
        "duration_seconds": run_summary.get("duration_seconds", ""),
        "table_count": table_count,
        "column_count": column_count,
        "row_count": row_count,
        "issue_count": len(issues),
        "p0_p1_count": severity_counts["P0"] + severity_counts["P1"],
        "readiness": dataset_verdict.get("verdict", "unknown")
        if dataset_verdict.get("available")
        else "unknown",
        "risk_score": dataset_verdict.get("risk_score", "unknown")
        if dataset_verdict.get("available")
        else "unknown",
        "preflight_status": preflight_review.get("status", "not recorded"),
        "preflight_message": preflight_review.get("message", ""),
        "gate_summary": quality_gates.get("summary", {}),
        "can_run_analysis": quality_gates.get("answers", {}).get("can_run_analysis", {}),
        "can_trust_joins": quality_gates.get("answers", {}).get("can_trust_joins", {}),
    }


def _visual_report_context(
    *,
    out_dir: Path,
    profile: ProfileSummary,
    issues: list[Issue],
    fixed_report: dict[str, Any],
    chart_context: dict[str, Any],
    action_plans: dict[str, Any],
) -> dict[str, Any]:
    run_summary = fixed_report.get("run_summary") or {}
    table_overview = fixed_report.get("table_overview") or {}
    column_matrix = fixed_report.get("column_issue_matrix") or {}
    plan_by_issue = {
        str(plan.get("issue_id") or ""): plan
        for plan in action_plans.get("plans", [])
        if isinstance(plan, dict)
    }
    severity_counts = Counter(normalize_severity(issue.severity) for issue in issues)
    top_fix_cards = [
        _visual_issue_card(out_dir=out_dir, issue=issue, plan=plan_by_issue.get(issue.issue_id, {}))
        for issue in issues[:5]
    ]
    table_hotspots = []
    for row in (table_overview.get("rows") or [])[:8]:
        issue_total = int(row.get("issue_total") or 0)
        relationship_risks = int(row.get("relationship_risk_count") or 0)
        table_hotspots.append(
            {
                **row,
                "bar_width_pct": min(100, max(issue_total * 12, relationship_risks * 16, 4)),
            }
        )
    return {
        "verdict": run_summary.get("readiness", "unknown"),
        "risk_score": run_summary.get("risk_score", "unknown"),
        "issue_count": run_summary.get("issue_count", 0),
        "p0_p1_count": run_summary.get("p0_p1_count", 0),
        "table_count": run_summary.get("table_count", 0),
        "column_count": run_summary.get("column_count", 0),
        "row_count": run_summary.get("row_count", 0),
        "severity_counts": {
            severity: severity_counts.get(severity, 0)
            for severity in SEVERITIES
        },
        "issue_type_chart": (chart_context.get("issue_type") or {}).get("data", [])[:8],
        "severity_chart": (chart_context.get("issue_severity") or {}).get("data", [])[:4],
        "missingness_chart": [
            row for row in (chart_context.get("missingness_columns") or {}).get("data", [])
            if _numeric(row.get("null_count")) > 0
        ][:6],
        "outlier_chart": (chart_context.get("outlier_columns") or {}).get("data", [])[:6],
        "table_hotspots": table_hotspots,
        "column_issue_rows": (column_matrix.get("rows") or [])[:16],
        "top_fix_cards": top_fix_cards,
        "can_run_analysis": run_summary.get("can_run_analysis", {}),
        "can_trust_joins": run_summary.get("can_trust_joins", {}),
    }


def _visual_issue_card(*, out_dir: Path, issue: Issue, plan: dict[str, Any]) -> dict[str, Any]:
    columns = issue.columns or []
    sample_preview = _sample_rows_preview(
        out_dir,
        issue.sample_bad_rows_path,
        highlighted_columns=columns,
    )
    return {
        "issue_id": issue.issue_id,
        "issue_type": issue.issue_type,
        "issue_label": _issue_type_label(issue.issue_type),
        "category": _issue_category(issue.issue_type),
        "severity": normalize_severity(issue.severity),
        "table": issue.table,
        "columns": columns,
        "field": f"{issue.table}.{', '.join(columns)}" if columns else issue.table,
        "bad_count": issue.bad_count,
        "total_count": issue.total_count,
        "bad_rate": issue.bad_rate,
        "bad_rate_text": _percent_text(issue.bad_rate),
        "sample_bad_rows_path": issue.sample_bad_rows_path or "",
        "sample_preview": sample_preview,
        "fix": (
            (plan.get("fix_data_checklist") or [None])[0]
            or (issue.suggested_fix[0] if issue.suggested_fix else "")
            or "Review generated evidence and choose a cleanup path."
        ),
        "verify": (
            (plan.get("verify_after_fix_checklist") or [None])[0]
            or f"Rerun and confirm {issue.issue_id} no longer appears."
        ),
        "why_it_matters": _analysis_consequence(issue),
    }


def _sample_rows_preview(
    out_dir: Path,
    sample_path: str | None,
    *,
    highlighted_columns: list[str] | None = None,
    row_limit: int = 3,
) -> dict[str, Any]:
    empty = {
        "available": False,
        "headers": [],
        "highlight_headers": [],
        "rows": [],
        "path": sample_path or "",
    }
    if not sample_path:
        return empty
    path = (out_dir / sample_path).resolve()
    try:
        path.relative_to(out_dir.resolve())
    except ValueError:
        return empty
    if not path.is_file():
        return empty
    try:
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            headers = _sample_preview_headers(
                list(reader.fieldnames or []),
                highlighted_columns=highlighted_columns or [],
                limit=8,
            )
            highlight_headers = [
                header
                for header in headers
                if _normalized_header(header) in {_normalized_header(column) for column in highlighted_columns or []}
            ]
            rows = [
                {header: str(row.get(header, ""))[:120] for header in headers}
                for _, row in zip(range(row_limit), reader)
            ]
    except (OSError, csv.Error, UnicodeDecodeError):
        return empty
    return {
        "available": bool(headers),
        "headers": headers,
        "highlight_headers": highlight_headers,
        "rows": rows,
        "path": sample_path,
    }


def _sample_preview_headers(
    fieldnames: list[str],
    *,
    highlighted_columns: list[str],
    limit: int,
) -> list[str]:
    if limit <= 0:
        return []
    selected = list(fieldnames[:limit])
    highlighted = {_normalized_header(column) for column in highlighted_columns if column}
    for field in fieldnames:
        if _normalized_header(field) not in highlighted or field in selected:
            continue
        selected.append(field)
    while len(selected) > limit:
        removable_index = next(
            (
                index
                for index in range(len(selected) - 1, -1, -1)
                if _normalized_header(selected[index]) not in highlighted
            ),
            len(selected) - 1,
        )
        selected.pop(removable_index)
    selected_set = set(selected)
    return [field for field in fieldnames if field in selected_set]


def _normalized_header(value: str) -> str:
    return str(value or "").strip().lower()


def _issue_type_label(issue_type: str) -> str:
    return issue_type.replace("_", " ").title()


def _issue_category(issue_type: str) -> str:
    if issue_type in {"REQUIRED_FIELD_NULL", "PRIMARY_KEY_NULL", "FOREIGN_KEY_NULL", "EMPTY_STRING"}:
        return "Missing"
    if issue_type in {"NUMERIC_OUTLIER", "VALUE_OUT_OF_RANGE", "NEGATIVE_VALUE_NOT_ALLOWED"}:
        return "Outlier / range"
    if issue_type in RELATIONSHIP_ISSUES:
        return "Relationship"
    if issue_type in {"DUPLICATE_PRIMARY_KEY", "UNIQUE_DUPLICATE"}:
        return "Key uniqueness"
    if issue_type in {"TYPE_CAST_INVALID", "DATE_ORDER_INVALID", "REGEX_MISMATCH"}:
        return "Format / type"
    return "Data quality"


def _percent_text(value: Any) -> str:
    return f"{_numeric(value) * 100:.2f}%"


def _scorecard_context(
    *,
    table_count: int,
    column_count: int,
    row_count: int,
    issues: list[Issue],
    dataset_verdict: dict[str, Any],
    relationship_graph: dict[str, Any],
    l4_report: dict[str, Any],
) -> list[dict[str, Any]]:
    severity_counts = dataset_verdict.get("severity_counts") or {}
    blocker_count = sum(severity_counts.get(severity, 0) for severity in ("P0", "P1"))
    relationship_counts = relationship_graph.get("status_counts") or {}
    invalid_fk_count = relationship_counts.get("invalid", 0)
    total_fk_count = relationship_graph.get("edge_count", 0)
    l4_status = l4_report.get("status", "not_enabled")
    l4_detail = (
        f"{l4_report.get('provider', 'unknown')} provider; validates LLM text only"
        if l4_report.get("available")
        else "deterministic run"
    )
    return [
        {
            "label": "Readiness",
            "value": dataset_verdict.get("verdict", "unknown"),
            "detail": "dataset_verdict.json",
            "tone": _tone_for_label(dataset_verdict.get("verdict", "")),
        },
        {
            "label": "Risk",
            "value": f"{dataset_verdict.get('risk_score', 0)}/100",
            "detail": dataset_verdict.get("verdict_rationale", ""),
            "tone": "danger" if _numeric(dataset_verdict.get("risk_score")) >= 75 else "warn",
        },
        {
            "label": "Issues",
            "value": len(issues),
            "detail": f"{blocker_count} P0/P1 blockers",
            "tone": "danger" if blocker_count else "ok",
        },
        {
            "label": "Tables",
            "value": table_count,
            "detail": f"{row_count} rows, {column_count} columns",
            "tone": "info",
        },
        {
            "label": "FK Health",
            "value": f"{invalid_fk_count}/{total_fk_count}",
            "detail": "invalid relationship edges",
            "tone": "danger" if invalid_fk_count else "ok",
        },
        {
            "label": "LLM text validation",
            "value": l4_report.get("status_text", _l4_display_status(l4_status)),
            "detail": l4_detail,
            "tone": _tone_for_l4_status(l4_status),
        },
    ]


def _issue_evidence_context(issues: list[Issue], *, limit: int = 25) -> list[dict[str, Any]]:
    rows = []
    for issue in issues[:limit]:
        parent = ""
        if issue.parent_table:
            parent_columns = ", ".join(issue.parent_columns or [])
            parent = f"{issue.parent_table}.{parent_columns}" if parent_columns else issue.parent_table
        rows.append(
            {
                "issue_id": issue.issue_id,
                "severity": issue.severity,
                "issue_type": issue.issue_type,
                "table": issue.table,
                "columns": issue.columns,
                "columns_text": ", ".join(issue.columns) if issue.columns else "none",
                "parent_ref": parent,
                "bad_count": issue.bad_count,
                "total_count": issue.total_count,
                "bad_rate": issue.bad_rate,
                "sample_bad_rows_path": issue.sample_bad_rows_path or "",
                "probable_cause": "; ".join(issue.probable_causes[:2]) if issue.probable_causes else "",
                "suggested_fix": issue.suggested_fix[0] if issue.suggested_fix else "",
            }
        )
    return rows


def _column_usability_context(
    profile: ProfileSummary,
    issues: list[Issue],
    *,
    row_limit: int = 30,
) -> dict[str, Any]:
    issue_map: dict[tuple[str, str], list[Issue]] = defaultdict(list)
    for issue in issues:
        for column in issue.columns or [""]:
            issue_map[(issue.table, column)].append(issue)

    rows: list[dict[str, Any]] = []
    counts = Counter({"ready": 0, "needs_preparation": 0, "blocked": 0})
    for table_name, table in sorted(profile.tables.items()):
        for column_name, column in sorted(table.columns.items()):
            column_issues = issue_map.get((table_name, column_name), [])
            severity = _worst_issue_severity(column_issues)
            outlier_count = int(column.outliers.outlier_count) if column.outliers else 0
            status = _column_usability_status(
                severity=severity,
                null_rate=column.null_rate,
                invalid_cast_count=column.invalid_cast_count,
                outlier_count=outlier_count,
            )
            counts[status] += 1
            rows.append(
                {
                    "table": table_name,
                    "column": column_name,
                    "field": f"{table_name}.{column_name}",
                    "status": status,
                    "status_label": _column_usability_label(status),
                    "severity": severity or "none",
                    "issue_count": len(column_issues),
                    "issue_types": sorted({issue.issue_type for issue in column_issues}),
                    "issue_types_text": _issue_types_text(column_issues),
                    "null_rate": column.null_rate,
                    "invalid_cast_count": column.invalid_cast_count,
                    "outlier_count": outlier_count,
                    "evidence": _column_usability_evidence(
                        column=column,
                        issues=column_issues,
                        outlier_count=outlier_count,
                    ),
                    "advisory_next_step": _column_usability_next_step(
                        status=status,
                        column=column,
                        issues=column_issues,
                        outlier_count=outlier_count,
                    ),
                }
            )

    rows.sort(
        key=lambda row: (
            _column_status_order(row["status"]),
            _severity_sort_order(row["severity"]),
            -row["issue_count"],
            -float(row["null_rate"]),
            -int(row["outlier_count"]),
            row["field"],
        )
    )
    return {
        "available": bool(rows),
        "column_count": len(rows),
        "ready_count": counts["ready"],
        "needs_preparation_count": counts["needs_preparation"],
        "blocked_count": counts["blocked"],
        "counts_text": _format_counts(
            {
                "ready": counts["ready"],
                "needs_preparation": counts["needs_preparation"],
                "blocked": counts["blocked"],
            }
        ),
        "rows": rows[:row_limit],
    }


def _table_health_reviews_context(
    profile: ProfileSummary,
    issues: list[Issue],
    table_assessments: dict[str, Any],
    *,
    limit: int = 20,
) -> dict[str, Any]:
    if not table_assessments.get("available"):
        return {"available": False, "reviews": []}
    issues_by_table: dict[str, list[Issue]] = defaultdict(list)
    for issue in issues:
        issues_by_table[issue.table].append(issue)
    reviews = []
    for row in table_assessments.get("assessments", [])[:limit]:
        table_name = row.get("table", "")
        table_profile = profile.tables.get(table_name)
        table_issues = issues_by_table.get(table_name, [])
        type_counts = Counter(issue.issue_type for issue in table_issues)
        severity_counts = Counter(normalize_severity(issue.severity) for issue in table_issues)
        affected_columns = row.get("affected_columns") or []
        next_actions = row.get("recommended_next_actions") or []
        reviews.append(
            {
                **row,
                "row_count": table_profile.row_count if table_profile else 0,
                "column_count": table_profile.column_count if table_profile else 0,
                "issue_type_counts": dict(sorted(type_counts.items())),
                "issue_type_counts_text": _format_review_counts(dict(sorted(type_counts.items()))),
                "severity_counts": dict(sorted(severity_counts.items())),
                "severity_counts_text": _format_counts(dict(sorted(severity_counts.items()))),
                "affected_columns_text": ", ".join(affected_columns) if affected_columns else "none",
                "first_next_step": next_actions[0] if next_actions else "Review generated evidence.",
                "review_note": _table_review_note(row, table_issues),
            }
        )
    return {
        "available": bool(reviews),
        "reviews": reviews,
    }


def _column_issue_blocks_context(
    issues: list[Issue],
    *,
    limit: int = 40,
) -> dict[str, Any]:
    blocks: list[dict[str, Any]] = []
    for issue in issues:
        columns = issue.columns or ["table_level"]
        for column in columns:
            field = issue.table if column == "table_level" else f"{issue.table}.{column}"
            blocks.append(
                {
                    "issue_id": issue.issue_id,
                    "field": field,
                    "table": issue.table,
                    "column": column,
                    "severity": issue.severity,
                    "issue_type": issue.issue_type,
                    "evidence": _issue_block_evidence(issue),
                    "analysis_consequence": _analysis_consequence(issue),
                    "advisory_next_step": issue.suggested_fix[0]
                    if issue.suggested_fix
                    else "Review generated evidence and choose a cleanup path.",
                    "sample_bad_rows_path": issue.sample_bad_rows_path or "",
                    "bad_count": issue.bad_count,
                    "total_count": issue.total_count,
                    "bad_rate": issue.bad_rate,
                }
            )
    blocks.sort(
        key=lambda row: (
            _severity_sort_order(row["severity"]),
            row["table"],
            row["column"],
            row["issue_id"],
        )
    )
    return {
        "available": bool(blocks),
        "blocks": blocks[:limit],
    }


def _dataset_verdict_context(dataset_verdict: dict[str, Any] | None) -> dict[str, Any]:
    if not dataset_verdict:
        return {"available": False}

    issue_counts = dataset_verdict.get("issue_counts") or {}
    severity_counts = issue_counts.get("by_severity") or {}
    return {
        "available": True,
        "path": "dataset_verdict.json",
        "verdict": dataset_verdict.get("verdict", ""),
        "risk_score": dataset_verdict.get("risk_score", 0),
        "verdict_rationale": dataset_verdict.get("verdict_rationale", ""),
        "issue_total": issue_counts.get("total", 0),
        "severity_counts": {
            severity: severity_counts.get(severity, 0)
            for severity in SEVERITIES
        },
        "type_counts": issue_counts.get("by_type", {}),
        "schema_summary": dataset_verdict.get("schema_summary") or {},
        "relationship_status_counts": dataset_verdict.get("relationship_status_counts") or {},
        "top_blockers": dataset_verdict.get("top_blockers") or [],
        "affected_tables": dataset_verdict.get("affected_tables") or [],
        "recommended_next_actions": dataset_verdict.get("recommended_next_actions") or [],
    }


def _schema_evaluation_context(schema_evaluation: dict[str, Any] | None) -> dict[str, Any]:
    if not schema_evaluation:
        return {"available": False}
    summary = schema_evaluation.get("summary") or {}
    method_counts = Counter(
        str(table.get("mapping_method") or table.get("status") or "unknown")
        for table in schema_evaluation.get("tables", [])
    )
    return {
        "available": True,
        "path": "schema_evaluation.json",
        "mapped_table_count": summary.get("mapped_table_count", 0),
        "missing_table_count": summary.get("missing_table_count", 0),
        "extra_csv_count": summary.get("extra_csv_count", 0),
        "schema_issue_count": summary.get("schema_issue_count", 0),
        "mapping_method_counts": dict(sorted(method_counts.items())),
        "mapping_method_counts_text": _format_counts(dict(sorted(method_counts.items()))),
    }


def _schema_parse_report_context(schema_parse_report: dict[str, Any] | None) -> dict[str, Any]:
    if not schema_parse_report:
        return {"available": False}
    counts = schema_parse_report.get("counts") or {}
    diagnostics = schema_parse_report.get("diagnostics") or []
    unsupported = schema_parse_report.get("unsupported_constructs") or []
    return {
        "available": True,
        "path": "schema_parse_report.json",
        "status": schema_parse_report.get("status", ""),
        "table_count": counts.get("tables", 0),
        "column_count": counts.get("columns", 0),
        "relationship_count": counts.get("relationships", 0),
        "warning_count": counts.get("warnings", 0),
        "unsupported_count": counts.get("unsupported_constructs", 0),
        "diagnostics": diagnostics[:10],
        "unsupported_constructs": unsupported[:10],
    }


def _connector_metadata_context(connector_metadata: dict[str, Any] | None) -> dict[str, Any]:
    if not connector_metadata:
        return {"available": False}
    tables = connector_metadata.get("tables") or []
    return {
        "available": True,
        "path": "connector_metadata.json",
        "source_type": connector_metadata.get("source_type", ""),
        "introspection_status": connector_metadata.get("introspection_status", ""),
        "extraction_status": connector_metadata.get("extraction_status", ""),
        "table_count": len(tables),
        "tables": tables[:10],
        "warning_count": len(connector_metadata.get("warnings") or []),
        "raw_extracts_persisted": connector_metadata.get("raw_extracts_persisted", False),
        "secrets_redacted": connector_metadata.get("secrets_redacted", False),
    }


def _lineage_graph_context(lineage_graph: dict[str, Any] | None) -> dict[str, Any]:
    if not lineage_graph:
        return {"available": False}
    summary = lineage_graph.get("summary") or {}
    evidence_artifacts = lineage_graph.get("evidence_artifacts") or []
    return {
        "available": True,
        "path": "lineage_graph.json",
        "source_system_count": summary.get("source_system_count", 0),
        "schema_count": summary.get("schema_count", 0),
        "table_count": summary.get("table_count", 0),
        "column_count": summary.get("column_count", 0),
        "relationship_count": summary.get("relationship_count", 0),
        "stage_count": summary.get("stage_count", 0),
        "artifact_count": summary.get("artifact_count", 0),
        "edge_count": summary.get("edge_count", 0),
        "connector_source_type": summary.get("connector_source_type", ""),
        "evidence_artifacts": evidence_artifacts[:12],
    }


def _relationship_graph_context(relationship_graph: dict[str, Any] | None) -> dict[str, Any]:
    if not relationship_graph:
        return {"available": False}
    summary = relationship_graph.get("summary") or {}
    status_counts = summary.get("status_counts", {})
    cardinality_counts = summary.get("cardinality_counts", {})
    return {
        "available": True,
        "path": "relationship_graph.json",
        "node_count": summary.get("node_count", 0),
        "edge_count": summary.get("edge_count", 0),
        "status_counts": status_counts,
        "status_counts_text": _format_counts(status_counts),
        "cardinality_counts": cardinality_counts,
        "cardinality_counts_text": _format_counts(cardinality_counts),
        "junction_table_count": summary.get("junction_table_count", 0),
        "many_to_many_relationship_count": summary.get("many_to_many_relationship_count", 0),
        "junction_tables_text": ", ".join(
            str(row.get("table", "")) for row in relationship_graph.get("junction_tables", [])[:10]
        )
        or "none",
        "edges": [
            {
                "id": edge.get("id", ""),
                "status": edge.get("status", ""),
                "declared_cardinality": edge.get("declared_cardinality", edge.get("cardinality", "")),
                "cardinality": edge.get("cardinality", ""),
                "observed_cardinality": edge.get("observed_cardinality", ""),
                "source": _format_endpoint(edge.get("source_table", ""), edge.get("source_columns")),
                "target": _format_endpoint(edge.get("target_table", ""), edge.get("target_columns")),
                "reason": edge.get("status_reason", ""),
            }
            for edge in relationship_graph.get("edges", [])[:10]
        ],
        "junction_tables": relationship_graph.get("junction_tables", [])[:10],
    }


def _table_assessments_context(table_assessments: dict[str, Any] | None) -> dict[str, Any]:
    if not table_assessments:
        return {"available": False, "assessments": []}
    summary = table_assessments.get("summary") or {}
    assessments = []
    for row in table_assessments.get("assessments", [])[:20]:
        impact = row.get("business_impact") or {}
        assessments.append(
            {
                "table": row.get("table", ""),
                "role": row.get("role", ""),
                "health_score": row.get("health_score", 0),
                "readiness": row.get("readiness", ""),
                "issue_total": sum((row.get("issue_counts_by_severity") or {}).values()),
                "affected_columns": row.get("affected_columns") or [],
                "relationship_risk_count": len(row.get("relationship_risks") or []),
                "business_impact_category": impact.get("category", ""),
                "business_impact_label": impact.get("label", ""),
                "business_impact_rationale": impact.get("rationale", ""),
                "analysis_impact_category": impact.get("category", ""),
                "analysis_impact_label": impact.get("label", ""),
                "analysis_impact_rationale": impact.get("rationale", ""),
                "recommended_next_actions": row.get("recommended_next_actions") or [],
            }
        )
    return {
        "available": True,
        "path": "table_assessments.json",
        "table_count": summary.get("table_count", 0),
        "average_health_score": summary.get("average_health_score", 0),
        "readiness_counts": summary.get("readiness_counts") or {},
        "readiness_counts_text": _format_counts(summary.get("readiness_counts") or {}),
        "role_counts": summary.get("role_counts") or {},
        "business_impact_counts": summary.get("business_impact_counts") or {},
        "analysis_impact_counts": summary.get("business_impact_counts") or {},
        "analysis_impact_counts_text": _format_counts(summary.get("business_impact_counts") or {}),
        "assessments": assessments,
    }


def _format_counts(counts: dict[str, Any]) -> str:
    if not counts:
        return "none"
    return ", ".join(f"{key}={value}" for key, value in counts.items())


def _format_review_counts(counts: dict[str, Any]) -> str:
    if not counts:
        return "none"
    return ", ".join(f"{key}: {value}" for key, value in counts.items())


def _worst_issue_severity(issues: list[Issue]) -> str:
    if not issues:
        return ""
    return min((normalize_severity(issue.severity) for issue in issues), key=_severity_sort_order)


def _severity_sort_order(severity: str) -> int:
    order = {severity: index for index, severity in enumerate(SEVERITIES)}
    return order.get(normalize_severity(severity), len(order))


def _column_status_order(status: str) -> int:
    return {"blocked": 0, "needs_preparation": 1, "ready": 2}.get(status, 3)


def _column_usability_status(
    *,
    severity: str,
    null_rate: float,
    invalid_cast_count: int,
    outlier_count: int,
) -> str:
    if severity in {"P0", "P1"}:
        return "blocked"
    if severity in {"P2", "P3"} or null_rate > 0 or invalid_cast_count > 0 or outlier_count > 0:
        return "needs_preparation"
    return "ready"


def _column_usability_label(status: str) -> str:
    labels = {
        "blocked": "Blocked for analysis",
        "needs_preparation": "Needs preparation",
        "ready": "Ready",
    }
    return labels.get(status, status)


def _issue_types_text(issues: list[Issue]) -> str:
    if not issues:
        return "none"
    return ", ".join(sorted({issue.issue_type for issue in issues}))


def _column_usability_evidence(
    *,
    column: Any,
    issues: list[Issue],
    outlier_count: int,
) -> str:
    parts = [
        f"null rate {column.null_rate:.2%}",
        f"distinct={column.distinct_count}",
    ]
    if column.invalid_cast_count:
        parts.append(f"invalid_casts={column.invalid_cast_count}")
    if outlier_count:
        parts.append(f"iqr_outliers={outlier_count}")
    if issues:
        parts.append(f"issues={len(issues)}")
    return "; ".join(parts)


def _column_usability_next_step(
    *,
    status: str,
    column: Any,
    issues: list[Issue],
    outlier_count: int,
) -> str:
    if issues:
        first_action = next((issue.suggested_fix[0] for issue in issues if issue.suggested_fix), "")
        if first_action:
            return first_action
    if outlier_count:
        return "Review IQR outlier evidence before scaling, aggregation, or feature use."
    if column.invalid_cast_count:
        return "Normalize typed values before using this column in analysis."
    if column.null_rate > 0:
        return "Choose an imputation, exclusion, or missingness flag strategy before modeling."
    if status == "ready":
        return "No deterministic cleanup step was generated."
    return "Review generated evidence before using this column in analysis."


def _table_review_note(row: dict[str, Any], issues: list[Issue]) -> str:
    readiness = row.get("readiness") or "unknown"
    relationship_risk_count = int(row.get("relationship_risk_count") or 0)
    if readiness == "NOT_READY":
        return "Resolve blocker evidence before joins, modeling, or repeated analysis use."
    if relationship_risk_count:
        return "Review relationship evidence before cross-table feature construction."
    if issues:
        return "Review issue evidence and prepare affected fields before analysis use."
    return "No deterministic blockers were found for this table."


def _issue_block_evidence(issue: Issue) -> str:
    sample = f"; sample={issue.sample_bad_rows_path}" if issue.sample_bad_rows_path else ""
    return f"{issue.bad_count}/{issue.total_count} rows; bad rate {issue.bad_rate:.2%}{sample}"


def _analysis_consequence(issue: Issue) -> str:
    issue_type = issue.issue_type
    if issue_type in {"PRIMARY_KEY_NULL", "DUPLICATE_PRIMARY_KEY", "UNIQUE_DUPLICATE"}:
        return "Entity-level joins, de-duplication, and train/test splits may be unreliable until key evidence is fixed."
    if issue_type in RELATIONSHIP_ISSUES:
        return "Cross-table joins may drop, multiply, or misalign records during feature construction."
    if issue_type in {"REQUIRED_FIELD_NULL", "EMPTY_STRING", "INVALID_PLACEHOLDER_TOKEN"}:
        return "Missingness handling is required before aggregate analysis or model feature use."
    if issue_type in {"VALUE_OUT_OF_RANGE", "NEGATIVE_VALUE_NOT_ALLOWED", "NUMERIC_OUTLIER"}:
        return "Distribution-sensitive aggregates and models may need capping, transformation, or exclusion decisions."
    if issue_type in {"TYPE_CAST_INVALID", "DATE_ORDER_INVALID", "REGEX_MISMATCH"}:
        return "Typed, time-based, or pattern-derived features need normalization before analysis use."
    if issue_type in {"TABLE_MISSING", "COLUMN_MISSING", "EXTRA_COLUMN"}:
        return "Schema coverage should be confirmed before comparing tables or training models."
    return "Dataset readiness is reduced until this evidence is reviewed."


def _format_endpoint(table: str, columns: Any) -> str:
    if not columns:
        return table
    if len(columns) == 1:
        return f"{table}.{columns[0]}"
    return f"{table}.({', '.join(columns)})"


def _chart_specs_context(chart_specs: dict[str, dict[str, Any]] | None) -> dict[str, Any]:
    if not chart_specs:
        return {"available": False, "paths": []}

    return {
        "available": True,
        "paths": [
            {
                "name": spec.get("title", filename),
                "path": f"charts/{filename}",
                "source_artifacts": spec.get("source_artifacts", []),
            }
            for filename, spec in sorted(chart_specs.items())
        ],
        "issue_severity": _chart_data_context(
            chart_specs.get("issue_counts_by_severity.json"),
            value_key="count",
        ),
        "issue_type": _chart_data_context(
            chart_specs.get("issue_counts_by_type.json"),
            value_key="count",
            limit=10,
        ),
        "missingness_tables": _chart_data_context(
            chart_specs.get("missingness_by_table.json"),
            value_key="null_rate",
        ),
        "missingness_columns": _chart_data_context(
            chart_specs.get("missingness_top_columns.json"),
            value_key="null_rate",
        ),
        "outlier_columns": _chart_data_context(
            chart_specs.get("outliers_top_columns.json"),
            value_key="outlier_count",
        ),
        "relationship_health": _chart_data_context(
            chart_specs.get("relationship_fk_health.json"),
            value_key="count",
        ),
        "relationship_edges": (chart_specs.get("relationship_fk_health.json") or {})
        .get("details", {})
        .get("edges", [])[:10],
        "risk_summary": _risk_chart_context(
            chart_specs.get("dataset_verdict_risk_summary.json"),
        ),
        "influence_top_features": _chart_data_context(
            chart_specs.get("influence_top_features.json"),
            value_key="score",
        ),
    }


def _chart_data_context(
    spec: dict[str, Any] | None,
    *,
    value_key: str,
    limit: int | None = None,
) -> dict[str, Any]:
    if not spec:
        return {"available": False, "title": "", "path": "", "data": [], "summary": {}}
    rows = [dict(row) for row in spec.get("data", [])]
    if limit is not None:
        rows = rows[:limit]
    return {
        "available": True,
        "title": spec.get("title", ""),
        "path": f"charts/{spec.get('chart_id', '')}.json",
        "data": _with_bar_widths(rows, value_key),
        "summary": spec.get("summary", {}),
    }


def _risk_chart_context(spec: dict[str, Any] | None) -> dict[str, Any]:
    if not spec:
        return {"available": False}
    summary = spec.get("summary") or {}
    risk_score = _numeric(summary.get("risk_score"))
    return {
        "available": True,
        "title": spec.get("title", ""),
        "path": "charts/dataset_verdict_risk_summary.json",
        "verdict": summary.get("verdict", ""),
        "risk_score": risk_score,
        "issue_count": summary.get("issue_count", 0),
        "bar_width_pct": max(0.0, min(risk_score, 100.0)),
    }


def _with_bar_widths(rows: list[dict[str, Any]], value_key: str) -> list[dict[str, Any]]:
    max_value = max((_abs_numeric(row.get(value_key)) for row in rows), default=0.0)
    denominator = max(max_value, 1.0)
    enriched = []
    for row in rows:
        enriched_row = dict(row)
        bar_width_pct = round(_abs_numeric(row.get(value_key)) / denominator * 100, 2)
        enriched_row["bar_width_pct"] = bar_width_pct
        enriched_row["bar_text"] = _bar_text(bar_width_pct)
        enriched.append(enriched_row)
    return enriched


def _bar_text(width_pct: float, *, width: int = 20) -> str:
    filled = int(round(max(0.0, min(width_pct, 100.0)) / 100 * width))
    return "#" * filled + "." * (width - filled)


def _tone_for_label(label: str) -> str:
    if label in {"P0", "P1", "NOT_READY", "invalid", "failed"}:
        return "danger"
    if label in {"P2", "WARN", "warning", "fallback_used", "skipped"}:
        return "warn"
    if label in {"P3", "READY", "passed", "success", "completed", "valid"}:
        return "ok"
    return "info"


def _tone_for_l4_status(status: str) -> str:
    if status == "passed":
        return "ok"
    if status == "fallback_used":
        return "warn"
    if status == "failed":
        return "danger"
    return "info"


def _l4_display_status(status: str) -> str:
    if status == "passed":
        return "LLM text valid"
    if status == "failed":
        return "LLM text failed"
    if status == "fallback_used":
        return "fallback used"
    if status == "not_enabled":
        return "not enabled"
    return str(status or "unknown").replace("_", " ")


def _abs_numeric(value: Any) -> float:
    return abs(_numeric(value))


def _numeric(value: Any) -> float:
    try:
        return float(value or 0.0)
    except (TypeError, ValueError):
        return 0.0


def _execution_flow_context(run_summary: dict[str, Any] | None) -> dict[str, Any]:
    if not run_summary:
        return {"available": False, "stages": [], "artifacts": []}

    stages = []
    for stage in run_summary.get("stage_timings", []):
        stages.append(
            {
                "name": stage.get("display_name") or stage.get("name", ""),
                "status": stage.get("status", ""),
                "duration_seconds": _format_duration(stage.get("duration_seconds")),
                "details": _format_details(stage.get("details") or {}),
                "error": stage.get("error_message") or "",
            }
        )

    artifact_paths = run_summary.get("artifact_paths") or {}
    artifacts = [
        {"name": name, "path": path}
        for name, path in sorted(artifact_paths.items())
        if not name.startswith("sample:")
    ]
    return {
        "available": True,
        "run_id": run_summary.get("run_id", ""),
        "status": run_summary.get("status", ""),
        "duration_seconds": _format_duration(run_summary.get("duration_seconds")),
        "output_dir": run_summary.get("output_dir", ""),
        "stages": stages,
        "artifacts": artifacts,
    }


def _l4_report_context(run_summary: dict[str, Any] | None, out_dir: Path) -> dict[str, Any]:
    if not run_summary:
        return _l4_not_enabled_context()
    artifact_paths = run_summary.get("artifact_paths") or {}
    l4_path = artifact_paths.get("l4_report")
    if not l4_path:
        return _l4_not_enabled_context()
    details = _l4_stage_details(run_summary)
    status = details.get("guardrail_status", "")
    provider = details.get("provider", "")
    fallback_reason = details.get("fallback_reason", "")
    preview_lines = _l4_preview_lines(out_dir / l4_path)
    return {
        "available": True,
        "path": l4_path,
        "guardrail_path": artifact_paths.get("guardrail_report", ""),
        "status": status or "unknown",
        "status_text": _l4_display_status(status or "unknown"),
        "status_class": status or "unknown",
        "provider": provider or "unknown",
        "model": details.get("model", ""),
        "fallback_reason": fallback_reason,
        "preview_lines": preview_lines,
        "state_text": "LLM output validation checks the optional LLM text only; data readiness still comes from quality gates.",
    }


def _l4_not_enabled_context() -> dict[str, Any]:
    return {
        "available": False,
        "path": "",
        "guardrail_path": "",
        "status": "not_enabled",
        "status_text": _l4_display_status("not_enabled"),
        "status_class": "not_enabled",
        "provider": "none",
        "model": "",
        "fallback_reason": "",
        "preview_lines": [],
        "state_text": "Optional LLM summary artifact was not generated for this deterministic run.",
    }


def _l4_preview_lines(path: Path, *, limit: int = 10) -> list[str]:
    if not path.is_file():
        return []
    lines = []
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = line.lstrip("#").strip()
        if line:
            lines.append(line)
        if len(lines) >= limit:
            break
    return lines


def _l4_stage_details(run_summary: dict[str, Any]) -> dict[str, Any]:
    for stage in run_summary.get("stage_timings", []):
        if stage.get("name") == "llm_narrative":
            return stage.get("details") or {}
    return {}


def _format_duration(value: Any) -> str:
    if value is None:
        return ""
    return f"{float(value):.3f}"


def _format_details(details: dict[str, Any]) -> str:
    if not details:
        return ""
    parts = []
    for key, value in details.items():
        parts.append(f"{key}={_format_detail_value(value)}")
    return ", ".join(parts)


def _format_detail_value(value: Any) -> str:
    if isinstance(value, list):
        return "[" + ", ".join(str(item) for item in value[:8]) + (", ..." if len(value) > 8 else "") + "]"
    if isinstance(value, dict):
        return "{" + ", ".join(f"{key}: {item}" for key, item in list(value.items())[:8]) + "}"
    return str(value)
