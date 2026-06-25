import json
from pathlib import Path

import pytest

from vsf_profiler.cli import run_pipeline
from vsf_profiler.demo_data import create_small_demo


REQUIRED_ISSUES = {
    "DUPLICATE_PRIMARY_KEY",
    "ORPHAN_FOREIGN_KEY",
    "VALUE_OUT_OF_RANGE",
    "NEGATIVE_VALUE_NOT_ALLOWED",
    "DATE_ORDER_INVALID",
    "REQUIRED_FIELD_NULL",
}


def test_demo_small_pipeline_writes_required_outputs(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    out_dir = tmp_path / "outputs" / "demo_small"

    run_pipeline(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        out_dir=out_dir,
    )

    assert (out_dir / "profile_summary.json").exists()
    assert (out_dir / "issues.json").exists()
    assert (out_dir / "influence.json").exists()
    assert (out_dir / "schema_parse_report.json").exists()
    assert (out_dir / "lineage_graph.json").exists()
    assert (out_dir / "schema_evaluation.json").exists()
    assert (out_dir / "relationship_graph.json").exists()
    assert (out_dir / "dataset_verdict.json").exists()
    assert (out_dir / "table_assessments.json").exists()
    assert (out_dir / "issue_action_plans.json").exists()
    assert (out_dir / "issue_todos.json").exists()
    assert (out_dir / "quality_gates.json").exists()
    assert (out_dir / "charts").is_dir()
    assert (out_dir / "schema_diagram.dbml").exists()
    assert (out_dir / "schema_diagram.json").exists()
    assert (out_dir / "run.log").exists()
    assert (out_dir / "run_events.jsonl").exists()
    assert (out_dir / "run_summary.json").exists()
    assert (out_dir / "report.md").exists()
    assert (out_dir / "report.html").exists()

    issues = json.loads((out_dir / "issues.json").read_text())
    influence = json.loads((out_dir / "influence.json").read_text())
    schema_evaluation = json.loads((out_dir / "schema_evaluation.json").read_text())
    schema_parse_report = json.loads((out_dir / "schema_parse_report.json").read_text())
    lineage_graph = json.loads((out_dir / "lineage_graph.json").read_text())
    relationship_graph = json.loads((out_dir / "relationship_graph.json").read_text())
    dataset_verdict = json.loads((out_dir / "dataset_verdict.json").read_text())
    table_assessments = json.loads((out_dir / "table_assessments.json").read_text())
    issue_action_plans = json.loads((out_dir / "issue_action_plans.json").read_text())
    issue_todos = json.loads((out_dir / "issue_todos.json").read_text())
    quality_gates = json.loads((out_dir / "quality_gates.json").read_text())
    profile_summary = json.loads((out_dir / "profile_summary.json").read_text())
    chart_specs = {
        path.name: json.loads(path.read_text())
        for path in sorted((out_dir / "charts").glob("*.json"))
    }
    schema_diagram = json.loads((out_dir / "schema_diagram.json").read_text())
    run_summary = json.loads((out_dir / "run_summary.json").read_text())
    run_events = _events(out_dir)
    report_md = (out_dir / "report.md").read_text()
    report_html = (out_dir / "report.html").read_text()
    issue_types = {issue["issue_type"] for issue in issues}
    assert REQUIRED_ISSUES.issubset(issue_types)
    assert influence["top_features"]
    assert schema_parse_report["artifact"] == "schema_parse_report"
    assert schema_parse_report["status"] == "parsed"
    assert schema_parse_report["counts"]["tables"] == 7
    assert schema_parse_report["counts"]["relationships"] == 6
    assert lineage_graph["artifact"] == "lineage_graph"
    assert lineage_graph["summary"]["table_count"] == 7
    assert lineage_graph["summary"]["relationship_count"] == 6
    assert lineage_graph["summary"]["artifact_count"] >= 20
    assert "run_events.jsonl" in lineage_graph["evidence_artifacts"]
    assert schema_evaluation["summary"]["mapped_table_count"] == 7
    assert relationship_graph["summary"]["node_count"] == 7
    assert relationship_graph["summary"]["edge_count"] == 6
    assert dataset_verdict["verdict"] == "NOT_READY"
    assert 0 <= dataset_verdict["risk_score"] <= 100
    assert dataset_verdict["risk_breakdown"]["score"] == dataset_verdict["risk_score"]
    assert dataset_verdict["risk_breakdown"]["raw_score"] >= dataset_verdict["risk_score"]
    assert dataset_verdict["risk_breakdown"]["active_components"]
    assert dataset_verdict["issue_counts"]["total"] == len(issues)
    assert dataset_verdict["top_blockers"]
    assert dataset_verdict["affected_tables"]
    assert dataset_verdict["recommended_next_actions"]
    assert table_assessments["artifact"] == "table_assessments"
    assert table_assessments["summary"]["table_count"] == 7
    assert len(table_assessments["assessments"]) == 7
    assert {row["table"] for row in table_assessments["assessments"]} == set(profile_summary["tables"])
    assert any(row["readiness"] == "NOT_READY" for row in table_assessments["assessments"])
    assert any(
        row["business_impact"]["category"] == "feedback_signal_quality"
        for row in table_assessments["assessments"]
        if row["table"] == "order_reviews"
    )
    assert issue_action_plans["artifact"] == "issue_action_plans"
    assert issue_action_plans["summary"]["plan_count"] == len(issues)
    assert issue_action_plans["summary"]["source"] == "deterministic"
    assert all(plan["source"] == "deterministic" for plan in issue_action_plans["plans"])
    assert all(plan["issue_context"] for plan in issue_action_plans["plans"])
    assert all(plan["fix_data_steps"] for plan in issue_action_plans["plans"])
    assert all(plan["verify_after_fix_steps"] for plan in issue_action_plans["plans"])
    assert issue_todos["artifact"] == "issue_todos"
    assert issue_todos["derived_from"] == "issue_action_plans.json"
    assert issue_todos["summary"]["source"] == "deterministic"
    assert issue_todos["summary"]["fix_data_group_count"] > 0
    assert issue_todos["summary"]["verify_after_fix_group_count"] > 0
    fix_todo_group_count = sum(
        1 for group in issue_todos["groups"] if group["todo_type"] == "fix_data"
    )
    verify_todo_group_count = sum(
        1 for group in issue_todos["groups"] if group["todo_type"] == "verify_after_fix"
    )
    assert quality_gates["artifact"] == "quality_gates"
    assert quality_gates["source"] == "deterministic"
    assert set(quality_gates["derived_from"]) == {
        "preflight_review.json",
        "issues.json",
        "table_assessments.json",
        "issue_action_plans.json",
        "issue_todos.json",
        "dataset_verdict.json",
    }
    gates = {gate["label"]: gate for gate in quality_gates["gates"]}
    assert set(gates) == {
        "Can run analysis",
        "Can trust joins",
        "Needs cleanup before sharing",
        "Outliers need review",
    }
    assert gates["Can run analysis"]["status"] == "Blocked"
    assert gates["Can trust joins"]["status"] == "Blocked"
    assert gates["Needs cleanup before sharing"]["recommended_next_action"]["target"] == "Todos"
    assert all(gate["evidence_values"] for gate in quality_gates["gates"])
    assert list(chart_specs) == [
        "dataset_verdict_risk_summary.json",
        "influence_top_features.json",
        "issue_counts_by_severity.json",
        "issue_counts_by_type.json",
        "missingness_by_table.json",
        "missingness_top_columns.json",
        "outliers_top_columns.json",
        "relationship_fk_health.json",
    ]
    for spec in chart_specs.values():
        assert spec["artifact"] == "chart_spec"
        assert spec["data"] is not None
        assert set(spec["source_artifacts"]).issubset(
            {
                "profile_summary.json",
                "issues.json",
                "relationship_graph.json",
                "dataset_verdict.json",
                "influence.json",
            }
        )
    assert chart_specs["issue_counts_by_severity.json"]["data"][0]["severity"] == "P0"
    assert chart_specs["issue_counts_by_type.json"]["data"][0]["count"] >= 1
    assert chart_specs["missingness_top_columns.json"]["data"]
    assert chart_specs["outliers_top_columns.json"]["data"] == []
    assert chart_specs["relationship_fk_health.json"]["data"][0]["status"] == "invalid"
    assert chart_specs["dataset_verdict_risk_summary.json"]["summary"]["verdict"] == "NOT_READY"
    assert chart_specs["influence_top_features.json"]["data"]
    price_profile = profile_summary["tables"]["order_items"]["columns"]["price"]
    assert price_profile["p25"] is not None
    assert price_profile["p50"] is not None
    assert price_profile["p75"] is not None
    assert price_profile["p95"] is not None
    assert price_profile["p99"] is not None
    assert price_profile["outliers"]["method"] == "iqr"
    assert schema_diagram["dbdiagram_url"].startswith("https://dbdiagram.io/embed?c=")
    assert any(table["table"] == "orders" and table["csv_path"] for table in schema_diagram["tables"])
    assert any(
        rel["child_table"] == "orders" and rel["parent_table"] == "customers"
        for rel in schema_diagram["relationships"]
    )
    assert "VSF Data Quality Report" in report_md
    assert "Data Quality Report" in report_html
    assert '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' in report_html
    assert 'href="favicon.svg"' not in report_html
    for section in [
        "Run Summary",
        "Quality Gates",
        "Table Overview",
        "Column Issue Matrix",
        "Issue Action Plans",
        "Todos",
        "Developer Artifacts",
        "Evaluation Summary",
    ]:
        assert section in report_md
        assert section in report_html
    assert "Visual Overview" in report_md
    assert "What Should Be Fixed First?" in report_md
    assert "Where are the problems?" in report_html
    assert "What should be fixed first?" in report_html
    for answer in [
        "Can this dataset run analysis?",
        "Can joins be trusted?",
        "No.",
        "Can run analysis",
        "Can trust joins",
        "Needs cleanup before sharing",
        "Outliers need review",
    ]:
        assert answer in report_md
        assert answer in report_html
    for visual_report_text in [
        "Issue severity",
        "Issue types",
        "Missing values",
        "Outliers",
        "Sample row preview",
        "Fix data",
        "Verify after fix",
    ]:
        assert visual_report_text in report_md
        assert visual_report_text in report_html
    assert report_md.count("Sample row preview:") >= 1
    assert report_html.count("sample-table") >= 1
    assert "sample-preview-row" in report_html
    assert "Highlighted:" in report_html
    assert 'class="highlighted"' in report_html
    assert 'href="samples/' not in report_html
    assert "HTML report expands bounded sample rows inline" in report_md
    assert "issue_action_plans.json" in report_md
    assert "Full deterministic action-plan evidence remains" in report_html
    assert "issue_action_plans.json" in report_html
    assert len(report_md.splitlines()) < 360
    assert "Fix data" in report_md
    assert "Verify after fix" in report_md
    assert "Issue-first todo queue:" in report_md
    assert "Full fix/verify checklist detail belongs in the issue detail drawer" in report_md
    assert "Issue-first todo queue" in report_html
    assert "Issue todo queue" not in report_md
    assert "Fix data snapshot" not in report_md
    assert "Verify after fix snapshot" not in report_html
    assert "This report shows the first 10 todo groups per type" not in report_md
    assert "This report shows the first 10 todo groups per type" not in report_html
    assert "additional Fix data groups" not in report_md
    assert "additional Verify after fix groups" not in report_md
    assert "Not evaluated" in report_md
    assert "Not evaluated" in report_html
    developer_section = report_md.index("## Developer Artifacts")
    for artifact_name in [
        "quality_gates.json",
        "issue_action_plans.json",
        "issue_todos.json",
        "run_summary.json",
    ]:
        assert artifact_name in report_md
        assert report_md.rindex(artifact_name) > developer_section
        assert artifact_name in report_html
    assert "Executive Scorecard" not in report_md
    assert "Executive scorecard" not in report_html
    assert "Developer LLM Guardrail Artifact" not in report_md
    assert "Developer LLM Guardrail Artifact" not in report_html
    assert "Optional LLM summary artifact was not generated" not in report_md
    assert "Optional LLM summary artifact was not generated" not in report_html
    assert "Issue Evidence" not in report_md
    assert "Schema, Relationship, and Developer Artifact Summary" not in report_md
    assert "Column Readiness Summary" not in report_md
    assert "Column Issue Blocks" not in report_md
    assert "Probable cause" not in report_md
    assert "Suggested fix" not in report_md
    assert "business rule" not in report_md.lower()
    assert "business process" not in report_md.lower()
    assert run_summary["status"] == "success"
    assert run_summary["inputs"]["dbml_path"].endswith("schema.dbml")
    assert run_summary["inputs"]["csv_dir"].endswith("csv")
    assert run_summary["inputs"]["target"] == "order_reviews.review_score"
    assert run_summary["issue_counts"]["total"] == len(issues)
    assert run_summary["failed_stages"] == []
    stage_names = [stage["name"] for stage in run_summary["stage_timings"]]
    assert stage_names == [
        "parse_dbml_schema",
        "catalog_csv_files",
        "profile_csv_tables",
        "data_quality_checks",
        "relationship_checks",
        "influence_analysis",
        "write_machine_artifacts",
        "render_reports",
    ]
    for artifact_key in [
        "profile_summary",
        "issues",
        "influence",
        "schema_parse_report",
        "lineage_graph",
        "schema_evaluation",
        "relationship_graph",
        "dataset_verdict",
        "table_assessments",
        "issue_action_plans",
        "issue_todos",
        "quality_gates",
        "charts_dir",
        "chart_dataset_verdict_risk_summary",
        "chart_influence_top_features",
        "chart_issue_counts_by_severity",
        "chart_issue_counts_by_type",
        "chart_missingness_by_table",
        "chart_missingness_top_columns",
        "chart_outliers_top_columns",
        "chart_relationship_fk_health",
        "schema_diagram_json",
        "schema_diagram_dbml",
        "report_md",
        "report_html",
        "run_log",
        "run_events",
        "run_summary",
    ]:
        assert artifact_key in run_summary["artifact_paths"]
    assert [event["sequence"] for event in run_events] == list(range(1, len(run_events) + 1))
    event_types = [event["event_type"] for event in run_events]
    assert event_types[0] == "run_started"
    assert "stage_started" in event_types
    assert "stage_finished" in event_types
    assert "artifact_written" in event_types
    assert event_types[-1] == "run_finished"
    assert any(
        event["event_type"] == "artifact_written" and event["artifact_path"] == "report.html"
        for event in run_events
    )
    for issue in issues:
        assert "table" in issue
        assert "columns" in issue
        assert "bad_count" in issue
        assert "severity" in issue
        assert issue["suggested_fix"]
        assert issue["evidence_sql"]
        if issue["sample_bad_rows_path"]:
            assert issue["sample_bad_rows_path"].startswith("samples/")


def test_runtime_summary_written_when_stage_fails(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    out_dir = tmp_path / "outputs" / "demo_small"

    with pytest.raises(FileNotFoundError, match="Rules file does not exist"):
        run_pipeline(
            dbml_path=data_dir / "schema.dbml",
            csv_dir=data_dir / "csv",
            rules_path=data_dir / "missing_rules.yaml",
            target="order_reviews.review_score",
            out_dir=out_dir,
        )

    assert (out_dir / "run.log").exists()
    assert (out_dir / "run_events.jsonl").exists()
    assert (out_dir / "run_summary.json").exists()
    summary = json.loads((out_dir / "run_summary.json").read_text())
    events = _events(out_dir)
    assert summary["status"] == "failed"
    assert summary["error"]["error_type"] == "FileNotFoundError"
    assert summary["failed_stages"][0]["name"] == "data_quality_checks"
    assert any(event["event_type"] == "stage_failed" for event in events)
    assert events[-1]["event_type"] == "run_failed"
    assert "run_failed" in (out_dir / "run.log").read_text()


def test_production_code_does_not_use_unbounded_pandas_read_csv():
    src_root = Path(__file__).resolve().parents[1] / "src" / "vsf_profiler"
    offenders = []
    for path in src_root.glob("*.py"):
        text = path.read_text()
        if "pandas.read_csv" in text or "pd.read_csv" in text:
            offenders.append(path.name)
    assert offenders == []


def _events(out_dir: Path) -> list[dict]:
    return [
        json.loads(line)
        for line in (out_dir / "run_events.jsonl").read_text().splitlines()
        if line.strip()
    ]
