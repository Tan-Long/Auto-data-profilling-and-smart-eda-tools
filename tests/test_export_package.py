import hashlib
import json
import zipfile
from pathlib import Path

import pytest
from typer.testing import CliRunner

from vsf_profiler.cli import app, run_pipeline
from vsf_profiler.demo_data import create_small_demo
from vsf_profiler.export_package import create_analysis_package


FIXED_CREATED_AT = "2026-06-16T00:00:00.000Z"


def test_package_output_directory_writes_manifest_index_and_zip(tmp_path):
    out_dir = _demo_output(tmp_path)
    (out_dir / "raw_source.csv").write_text("id,secret\n1,raw\n", encoding="utf-8")
    connector_extract = out_dir / ".connector_extracts" / "postgres" / "customers.csv"
    connector_extract.parent.mkdir(parents=True)
    connector_extract.write_text("customer_id\n1\n", encoding="utf-8")

    package_dir = tmp_path / "analysis_package"
    result = create_analysis_package(
        input_dir=out_dir,
        output_dir=package_dir,
        create_zip=True,
        created_at=FIXED_CREATED_AT,
    )

    assert result.manifest_path == package_dir / "export_manifest.json"
    assert result.index_path == package_dir / "index.html"
    assert result.zip_path == package_dir.with_suffix(".zip")
    assert result.zip_path.exists()
    assert (package_dir / "report.html").exists()
    assert (package_dir / "charts" / "issue_counts_by_type.json").exists()
    assert any((package_dir / "samples").glob("*.csv"))
    assert not (package_dir / "raw_source.csv").exists()
    assert not (package_dir / ".connector_extracts").exists()

    manifest = _read_json(package_dir / "export_manifest.json")
    included = {entry["path"]: entry for entry in manifest["included_files"]}
    excluded = {entry["path"]: entry["reason"] for entry in manifest["excluded_files"]}

    assert manifest["artifact"] == "export_manifest"
    assert manifest["version"] == 1
    assert manifest["created_at"] == FIXED_CREATED_AT
    assert manifest["source_run"]["status"] == "success"
    assert manifest["redaction"]["status"] == "passed"
    assert manifest["package"]["entrypoint"] == "index.html"
    assert manifest["package"]["zip_archive"]["created"] is True
    assert manifest["package"]["zip_archive"]["name"] == result.zip_path.name
    assert "index.html" in included
    for path in [
        "report.html",
        "report.md",
        "dataset_verdict.json",
        "table_assessments.json",
        "issue_action_plans.json",
        "issue_todos.json",
        "quality_gates.json",
        "lineage_graph.json",
        "relationship_graph.json",
        "schema_parse_report.json",
        "schema_evaluation.json",
        "run_summary.json",
        "run_events.jsonl",
        "charts/issue_counts_by_type.json",
        "charts/outliers_top_columns.json",
    ]:
        assert path in included
        assert included[path]["sha256"] == _sha256(package_dir / path)
    assert any(path.startswith("samples/") and path.endswith(".csv") for path in included)
    assert excluded["raw_source.csv"] == "raw_source_csv_not_allowed"
    assert excluded[".connector_extracts/postgres/customers.csv"] == "connector_temp_extract"

    index_html = (package_dir / "index.html").read_text(encoding="utf-8")
    packaged_report_html = (package_dir / "report.html").read_text(encoding="utf-8")
    issue_action_plans = _read_json(out_dir / "issue_action_plans.json")
    issue_todos = _read_json(out_dir / "issue_todos.json")
    fix_todo_group_count = sum(
        1 for group in issue_todos["groups"] if group["todo_type"] == "fix_data"
    )
    verify_todo_group_count = sum(
        1 for group in issue_todos["groups"] if group["todo_type"] == "verify_after_fix"
    )
    assert "Data Quality Package" in index_html
    assert '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' in index_html
    assert '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' in packaged_report_html
    assert 'href="samples/' not in index_html
    assert 'href="samples/' not in packaged_report_html
    assert "report.html previews rows inline without direct CSV links" in index_html
    assert "Sample row preview" in packaged_report_html
    assert 'href="favicon.svg"' not in index_html
    assert 'href="favicon.svg"' not in packaged_report_html
    for section in [
        "Run Summary",
        "Report / Export",
        "Quality Gates",
        "Table Overview",
        "Column Issue Matrix",
        "Issue Action Plans",
        "Todos",
        "Developer Artifacts",
        "Evaluation Summary",
    ]:
        assert section in index_html
    for report_copy in [
        "Can this dataset run analysis?",
        "Can joins be trusted?",
        "What should be fixed?",
        "Finding Values",
        "Fix data checklist",
        "Verify after fix checklist",
        "Evidence coverage",
        "Actionability",
        "No evaluation artifact was included",
    ]:
        assert report_copy in index_html
    expanded_plan_count = min(5, len(issue_action_plans["plans"]))
    assert "Main package index expands the first 5 highest-priority plans" in index_html
    assert "Full deterministic action-plan evidence remains in <code>issue_action_plans.json</code>" in index_html
    assert index_html.count("<summary>") == expanded_plan_count
    assert "Compact todo snapshot" in index_html
    assert "Fix data snapshot" in index_html
    assert "Verify after fix snapshot" in index_html
    assert "Package index shows the first 10 todo groups per type" not in index_html
    if fix_todo_group_count > 3:
        assert f"{fix_todo_group_count - 3} additional Fix data groups" in index_html
    if verify_todo_group_count > 3:
        assert f"{verify_todo_group_count - 3} additional Verify after fix groups" in index_html
    assert "report.html" in index_html
    assert "report.md" in index_html
    developer_section = index_html.index("Developer Artifacts")
    assert index_html.rindex("lineage_graph.json") > developer_section
    assert index_html.rindex("relationship_graph.json") > developer_section
    assert index_html.rindex("table_assessments.json") > developer_section
    assert index_html.rindex("issue_action_plans.json") > developer_section
    assert index_html.rindex("issue_todos.json") > developer_section
    assert index_html.rindex("quality_gates.json") > developer_section
    assert index_html.rindex("charts/outliers_top_columns.json") > developer_section
    assert "lineage_graph.json" in index_html
    assert "relationship_graph.json" in index_html
    assert "table_assessments.json" in index_html
    assert "issue_action_plans.json" in index_html
    assert "issue_todos.json" in index_html
    assert "quality_gates.json" in index_html
    assert "Executive scorecard" not in index_html
    assert "Column Readiness Summary" not in index_html
    assert "Developer LLM Guardrail Artifact" not in index_html
    assert "Issue Evidence" not in index_html
    assert "Column Issue Blocks" not in index_html
    assert "Suggested fix" not in index_html
    assert "Georgia" not in index_html
    assert "#f4efe5" not in index_html

    with zipfile.ZipFile(result.zip_path) as archive:
        names = archive.namelist()
    assert names == sorted(names)
    assert "export_manifest.json" in names
    assert "index.html" in names
    assert "report.html" in names
    assert "raw_source.csv" not in names
    assert ".connector_extracts/postgres/customers.csv" not in names


def test_package_includes_goal_10_and_11_optional_artifacts_when_present(tmp_path):
    out_dir = _demo_output(tmp_path)
    optional_payloads = {
        "issue_llm_enrichments.json": {"artifact": "issue_llm_enrichments", "summary": {}},
        "ground_truth_issues.json": {"artifact": "ground_truth_issues", "expected_issues": []},
        "baseline_comparison.json": {"artifact": "baseline_comparison", "rows": []},
        "evaluation_summary.json": {"artifact": "evaluation_summary", "summary": {}},
    }
    for path, payload in optional_payloads.items():
        (out_dir / path).write_text(json.dumps(payload), encoding="utf-8")

    package_dir = tmp_path / "analysis_package"
    create_analysis_package(
        input_dir=out_dir,
        output_dir=package_dir,
        create_zip=True,
        created_at=FIXED_CREATED_AT,
    )

    manifest = _read_json(package_dir / "export_manifest.json")
    included = {entry["path"] for entry in manifest["included_files"]}
    index_html = (package_dir / "index.html").read_text(encoding="utf-8")
    with zipfile.ZipFile(package_dir.with_suffix(".zip")) as archive:
        zip_names = set(archive.namelist())

    for path in optional_payloads:
        assert path in included
        assert path in zip_names
        assert (package_dir / path).exists()
        assert path in index_html


def test_package_checksums_are_stable_for_same_input(tmp_path):
    out_dir = _demo_output(tmp_path)
    first_dir = tmp_path / "first_package"
    second_dir = tmp_path / "second_package"

    create_analysis_package(
        input_dir=out_dir,
        output_dir=first_dir,
        created_at=FIXED_CREATED_AT,
    )
    create_analysis_package(
        input_dir=out_dir,
        output_dir=second_dir,
        created_at=FIXED_CREATED_AT,
    )

    first_manifest = _read_json(first_dir / "export_manifest.json")
    second_manifest = _read_json(second_dir / "export_manifest.json")
    first_checksums = {
        entry["path"]: entry["sha256"]
        for entry in first_manifest["included_files"]
        if entry["path"] != "index.html"
    }
    second_checksums = {
        entry["path"]: entry["sha256"]
        for entry in second_manifest["included_files"]
        if entry["path"] != "index.html"
    }
    assert first_checksums == second_checksums


def test_package_command_creates_offline_package(tmp_path):
    out_dir = _demo_output(tmp_path)
    package_dir = tmp_path / "cli_package"

    result = CliRunner().invoke(
        app,
        [
            "package",
            "--input",
            str(out_dir),
            "--output",
            str(package_dir),
            "--zip",
            "--pdf",
        ],
    )

    assert result.exit_code == 0, result.output
    assert "Wrote analysis package" in result.output
    assert "Wrote PDF report" in result.output
    assert (package_dir / "export_manifest.json").exists()
    assert (package_dir / "index.html").exists()
    assert (package_dir / "analysis_report.pdf").exists()
    assert package_dir.with_suffix(".zip").exists()


def test_package_pdf_export_writes_manifest_index_and_zip_entries(tmp_path):
    out_dir = _demo_output(tmp_path)
    package_dir = tmp_path / "pdf_package"

    result = create_analysis_package(
        input_dir=out_dir,
        output_dir=package_dir,
        create_zip=True,
        create_pdf=True,
        created_at=FIXED_CREATED_AT,
    )

    assert result.pdf_path == package_dir / "analysis_report.pdf"
    assert result.pdf_path.exists()
    assert result.pdf_path.read_bytes().startswith(b"%PDF-1.4")

    manifest = _read_json(package_dir / "export_manifest.json")
    included = {entry["path"]: entry for entry in manifest["included_files"]}
    pdf_export = manifest["pdf_export"]

    assert pdf_export["created"] is True
    assert pdf_export["path"] == "analysis_report.pdf"
    assert pdf_export["sha256"] == _sha256(package_dir / "analysis_report.pdf")
    assert pdf_export["sha256"] == included["analysis_report.pdf"]["sha256"]
    assert pdf_export["backend"] == "vsf_profiler.simple_pdf"
    assert pdf_export["generator"]
    assert pdf_export["created_at"] == FIXED_CREATED_AT
    assert pdf_export["redaction_status"] == "passed"
    assert included["analysis_report.pdf"]["kind"] == "pdf_report"

    index_html = (package_dir / "index.html").read_text(encoding="utf-8")
    assert "analysis_report.pdf" in index_html
    assert "Data Quality Package" in index_html

    with zipfile.ZipFile(result.zip_path) as archive:
        names = archive.namelist()
    assert "analysis_report.pdf" in names


def test_package_redaction_scan_rejects_secret_leak(tmp_path):
    out_dir = _demo_output(tmp_path)
    (out_dir / "run.log").write_text(
        "stage_failed password=super-secret postgresql://user:super-secret@127.0.0.1/db\n",
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="Package redaction scan failed"):
        create_analysis_package(input_dir=out_dir, output_dir=tmp_path / "package")


def test_package_requires_complete_run_output(tmp_path):
    out_dir = _demo_output(tmp_path)
    (out_dir / "relationship_graph.json").unlink()

    with pytest.raises(ValueError, match="relationship_graph.json"):
        create_analysis_package(input_dir=out_dir, output_dir=tmp_path / "package")


def _demo_output(tmp_path: Path) -> Path:
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    out_dir = tmp_path / "outputs" / "demo_small"
    run_pipeline(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        out_dir=out_dir,
    )
    return out_dir


def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()
