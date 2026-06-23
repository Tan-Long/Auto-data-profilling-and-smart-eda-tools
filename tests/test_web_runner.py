import csv
import json
import threading
import time
import urllib.error
import urllib.request

import pytest

from vsf_profiler.demo_data import create_small_demo
from vsf_profiler.models import CatalogTable, ColumnSchema, CsvCatalog, Schema, TableSchema
from vsf_profiler import web_runner
from vsf_profiler.action_plans import build_issue_action_plans
from vsf_profiler.connectors import redact_connection_url
from vsf_profiler.todos import build_issue_todos
from vsf_profiler.web_runner import (
    LOCAL_WEB_HOST,
    UploadedFile,
    WebRunStore,
    create_web_server,
)

POSTGRES_SECRET_URL = "postgresql://profiler:super-secret@127.0.0.1:5432/demo?token=query-secret"
MYSQL_SECRET_URL = "mysql://profiler:super-secret@127.0.0.1:3306/demo?token=query-secret"


REQUIRED_ARTIFACTS = {
    "profile_summary.json",
    "issues.json",
    "schema_parse_report.json",
    "lineage_graph.json",
    "schema_evaluation.json",
    "relationship_graph.json",
    "dataset_verdict.json",
    "table_assessments.json",
    "issue_action_plans.json",
    "issue_todos.json",
    "quality_gates.json",
    "run_events.jsonl",
    "run_summary.json",
    "report.html",
}


def wait_for_job(job, *, seconds=20):
    deadline = time.monotonic() + seconds
    while job.status not in {"succeeded", "failed"} and time.monotonic() < deadline:
        time.sleep(0.05)
    return job.status


def test_web_runner_upload_job_writes_canonical_artifacts(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    store = WebRunStore(run_root=tmp_path / "web_runs")

    job = store.start_job(
        dbml=UploadedFile(
            filename="schema.dbml",
            content=(data_dir / "schema.dbml").read_bytes(),
        ),
        csv_files=[
            UploadedFile(filename=path.name, content=path.read_bytes())
            for path in sorted((data_dir / "csv").glob("*.csv"))
        ],
        rules=UploadedFile(
            filename="rules.yaml",
            content=(data_dir / "rules.yaml").read_bytes(),
        ),
        target="order_reviews.review_score",
    )

    wait_for_job(job)

    assert job.status == "succeeded"
    assert (job.out_dir / "profile_summary.json").exists()
    assert (job.out_dir / "issues.json").exists()
    assert (job.out_dir / "schema_parse_report.json").exists()
    assert (job.out_dir / "lineage_graph.json").exists()
    assert (job.out_dir / "schema_evaluation.json").exists()
    assert (job.out_dir / "relationship_graph.json").exists()
    assert (job.out_dir / "dataset_verdict.json").exists()
    assert (job.out_dir / "table_assessments.json").exists()
    assert (job.out_dir / "issue_action_plans.json").exists()
    assert (job.out_dir / "issue_todos.json").exists()
    assert (job.out_dir / "quality_gates.json").exists()
    assert (job.out_dir / "charts" / "issue_counts_by_type.json").exists()
    assert (job.out_dir / "run_events.jsonl").exists()
    assert (job.out_dir / "run_summary.json").exists()
    assert (job.out_dir / "report.html").exists()

    payload = store.job_payload(job)
    artifact_paths = {artifact["path"] for artifact in payload["artifacts"]}
    assert REQUIRED_ARTIFACTS.issubset(artifact_paths)
    issues = json.loads((job.out_dir / "issues.json").read_text())
    action_plans = json.loads((job.out_dir / "issue_action_plans.json").read_text())
    assert action_plans["artifact"] == "issue_action_plans"
    assert action_plans["summary"]["source"] == "deterministic"
    assert action_plans["summary"]["plan_count"] == len(issues)
    assert action_plans["summary"]["human_review_count"] == 0
    first_plan = action_plans["plans"][0]
    assert first_plan["source"] == "deterministic"
    assert first_plan["finding_summary"]
    assert first_plan["evidence_values"]
    assert first_plan["fix_data_checklist"]
    assert first_plan["verify_after_fix_checklist"]
    assert first_plan["guidelines"]
    assert first_plan["priority"]
    assert first_plan["evidence_coverage"]["explanation"]
    assert first_plan["actionability_score"]["explanation"]
    issue_todos = json.loads((job.out_dir / "issue_todos.json").read_text())
    assert issue_todos["artifact"] == "issue_todos"
    assert issue_todos["derived_from"] == "issue_action_plans.json"
    assert issue_todos["summary"]["source"] == "deterministic"
    assert issue_todos["summary"]["fix_data_group_count"] > 0
    assert issue_todos["summary"]["verify_after_fix_group_count"] > 0
    rerun_todo = next(
        group for group in issue_todos["groups"] if group["text"] == "Rerun the profiler on the corrected CSV + DBML inputs."
    )
    assert rerun_todo["todo_type"] == "verify_after_fix"
    assert rerun_todo["occurrence_count"] == len(issues)
    assert rerun_todo["source"] == "deterministic"
    assert {"issue_id", "table", "columns", "priority"}.issubset(rerun_todo["occurrences"][0])
    quality_gates = json.loads((job.out_dir / "quality_gates.json").read_text())
    assert quality_gates["artifact"] == "quality_gates"
    assert quality_gates["source"] == "deterministic"
    assert "issue_todos.json" in quality_gates["derived_from"]
    gates = {gate["gate_id"]: gate for gate in quality_gates["gates"]}
    assert gates["can_run_analysis"]["status"] == "Blocked"
    assert gates["can_trust_joins"]["status"] == "Blocked"
    assert gates["needs_cleanup_before_sharing"]["recommended_next_action"]["target"] == "Todos"
    assert gates["outliers_need_review"]["status"] == "Clean"


def test_web_runner_path_job_writes_canonical_artifacts_without_csv_upload(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    store = WebRunStore(run_root=tmp_path / "web_runs")

    job = store.start_path_job(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
    )

    wait_for_job(job)

    assert job.status == "succeeded"
    assert job.input_mode == "path"
    assert not list(job.input_dir.rglob("*.csv"))
    assert (job.out_dir / "charts" / "issue_counts_by_type.json").exists()

    payload = store.job_payload(job)
    assert payload["input_mode"] == "path"
    artifact_paths = {artifact["path"] for artifact in payload["artifacts"]}
    assert REQUIRED_ARTIFACTS.issubset(artifact_paths)


def test_web_runner_evaluation_job_uses_built_in_dataset_catalog(tmp_path, monkeypatch):
    monkeypatch.setattr(
        "vsf_profiler.evaluation_benchmark._great_expectations_availability",
        lambda: {
            "status": "unavailable",
            "version": None,
            "reason": "ModuleNotFoundError: No module named 'great_expectations'",
        },
    )
    store = WebRunStore(run_root=tmp_path / "web_runs")

    catalog = store.evaluation_catalog_payload()
    assert catalog["arbitrary_uploads_supported"] is False
    assert {dataset["dataset_id"] for dataset in catalog["datasets"]} == {
        "retail_orders_seeded_faults",
        "support_tickets_seeded_faults",
    }

    job = store.start_evaluation_job(dataset_id="retail_orders_seeded_faults")
    wait_for_job(job)

    assert job.status == "succeeded"
    assert job.input_mode == "evaluation"
    assert job.evaluation_dataset_id == "retail_orders_seeded_faults"
    manifest = json.loads((job.input_dir / "evaluation_inputs.json").read_text())
    assert manifest["input_policy"] == "built_in_curated_datasets_only"
    assert manifest["arbitrary_uploads_supported"] is False
    assert (job.out_dir / "ground_truth_issues.json").exists()
    assert (job.out_dir / "baseline_comparison.json").exists()
    assert (job.out_dir / "evaluation_summary.json").exists()

    payload = store.job_payload(job)
    assert payload["input_mode"] == "evaluation"
    assert payload["evaluation"] == {"dataset_id": "retail_orders_seeded_faults"}
    artifact_paths = {artifact["path"] for artifact in payload["artifacts"]}
    assert REQUIRED_ARTIFACTS.issubset(artifact_paths)
    assert {
        "ground_truth_issues.json",
        "baseline_comparison.json",
        "evaluation_summary.json",
    }.issubset(artifact_paths)
    summary = json.loads((job.out_dir / "evaluation_summary.json").read_text())
    assert summary["correctness"]["vsf_missed_group_count"] == 0
    assert summary["baseline"]["status"] == "unavailable"

    history_entry = store.history_entry(job)
    assert history_entry["input_mode"] == "evaluation"
    assert history_entry["source_mode"] == "evaluation:retail_orders_seeded_faults"


def test_web_runner_history_scans_output_folders_after_restart(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    run_root = tmp_path / "web_runs"
    store = WebRunStore(run_root=run_root)

    job = store.start_path_job(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
    )

    wait_for_job(job)
    assert job.status == "succeeded"

    restarted_store = WebRunStore(run_root=run_root)
    history = restarted_store.history_payload()
    entry = next(item for item in history["runs"] if item["job_id"] == job.job_id)

    assert entry["status"] == "succeeded"
    assert entry["input_mode"] == "path"
    assert entry["source_mode"] == "path"
    assert entry["issue_count"] > 0
    assert entry["quality_gate_summary"]["available"] is True
    assert entry["quality_gate_summary"]["blocked_count"] >= 1
    assert entry["stage_count"] >= 8
    assert entry["failed_stage_count"] == 0
    assert entry["stages"][0]["name"] == "parse_dbml_schema"
    assert entry["dashboard_url"] == f"/api/jobs/{job.job_id}/dashboard"

    historical_job = restarted_store.get_job(job.job_id)
    assert historical_job is not None
    payload = restarted_store.job_payload(historical_job)
    assert payload["status"] == "succeeded"
    assert payload["input_mode"] == "path"
    assert payload["summary"]["run_id"] == entry["run_id"]
    artifact_paths = {artifact["path"] for artifact in payload["artifacts"]}
    assert REQUIRED_ARTIFACTS.issubset(artifact_paths)

    dashboard = restarted_store.dashboard_payload(historical_job)
    assert dashboard["missing_artifacts"] == []
    assert dashboard["artifact_urls"]["quality_gates.json"] == (
        f"/api/jobs/{job.job_id}/artifacts/quality_gates.json"
    )
    assert restarted_store.resolve_artifact(historical_job, "run_summary.json").is_file()


def test_web_runner_history_keeps_failed_and_legacy_partial_runs_selectable(tmp_path):
    run_root = tmp_path / "web_runs"
    failed_dir = run_root / "run_failed_manual" / "artifacts"
    failed_dir.mkdir(parents=True)
    (run_root / "run_failed_manual" / "input").mkdir()
    (failed_dir / "run_summary.json").write_text(
        json.dumps(
            {
                "run_id": "manual-failed",
                "status": "failed",
                "started_at": "2026-06-23T01:00:00.000Z",
                "finished_at": "2026-06-23T01:00:02.000Z",
                "duration_seconds": 2.0,
                "inputs": {"source_type": "csv", "csv_dir": "data/demo_small/csv"},
                "issue_counts": {"total": 0},
                "stage_timings": [
                    {
                        "name": "parse_dbml_schema",
                        "display_name": "Parse DBML schema",
                        "status": "completed",
                        "started_at": "2026-06-23T01:00:00.000Z",
                        "finished_at": "2026-06-23T01:00:01.000Z",
                        "duration_seconds": 1.0,
                    },
                    {
                        "name": "profile_tables",
                        "display_name": "Profile tables",
                        "status": "failed",
                        "started_at": "2026-06-23T01:00:01.000Z",
                        "finished_at": "2026-06-23T01:00:02.000Z",
                        "duration_seconds": 1.0,
                        "error_type": "RuntimeError",
                        "error_message": "source CSV missing",
                    },
                ],
                "artifact_paths": {"run_summary": "run_summary.json"},
                "error": {"error_type": "RuntimeError", "error_message": "source CSV missing"},
            }
        ),
        encoding="utf-8",
    )

    legacy_dir = run_root / "run_legacy_events" / "artifacts"
    legacy_dir.mkdir(parents=True)
    (legacy_dir / "run_events.jsonl").write_text(
        "\n".join(
            [
                json.dumps(
                    {
                        "sequence": 1,
                        "event_type": "run_started",
                        "timestamp": "2026-06-23T00:00:00.000Z",
                        "run_id": "legacy",
                        "status": "running",
                    }
                ),
                json.dumps(
                    {
                        "sequence": 2,
                        "event_type": "stage_started",
                        "timestamp": "2026-06-23T00:00:01.000Z",
                        "run_id": "legacy",
                        "stage": "parse_dbml_schema",
                        "status": "running",
                        "details": {"display_name": "Parse DBML schema"},
                    }
                ),
                json.dumps(
                    {
                        "sequence": 3,
                        "event_type": "stage_failed",
                        "timestamp": "2026-06-23T00:00:02.000Z",
                        "run_id": "legacy",
                        "stage": "parse_dbml_schema",
                        "status": "failed",
                        "duration_seconds": 1.0,
                        "details": {
                            "display_name": "Parse DBML schema",
                            "error_type": "ValueError",
                            "error_message": "invalid DBML",
                        },
                    }
                ),
                json.dumps(
                    {
                        "sequence": 4,
                        "event_type": "run_failed",
                        "timestamp": "2026-06-23T00:00:03.000Z",
                        "run_id": "legacy",
                        "status": "failed",
                    }
                ),
            ]
        ),
        encoding="utf-8",
    )

    store = WebRunStore(run_root=run_root)
    history = store.history_payload()
    failed_entry = next(item for item in history["runs"] if item["job_id"] == "run_failed_manual")
    legacy_entry = next(item for item in history["runs"] if item["job_id"] == "run_legacy_events")

    assert failed_entry["status"] == "failed"
    assert failed_entry["failed_stage_count"] == 1
    assert failed_entry["stages"][1]["error_message"] == "source CSV missing"
    assert failed_entry["error"] == "RuntimeError: source CSV missing"
    assert failed_entry["quality_gate_summary"]["available"] is False

    failed_job = store.get_job("run_failed_manual")
    assert failed_job is not None
    dashboard = store.dashboard_payload(failed_job)
    assert dashboard["status"] == "failed"
    assert dashboard["artifact_urls"]["run_summary.json"] == (
        "/api/jobs/run_failed_manual/artifacts/run_summary.json"
    )
    assert "issues.json" in dashboard["missing_artifacts"]

    assert legacy_entry["status"] == "failed"
    assert legacy_entry["partial"] is True
    assert legacy_entry["stage_count"] == 1
    assert legacy_entry["failed_stage_count"] == 1
    assert legacy_entry["stages"][0]["error_message"] == "invalid DBML"


def test_issue_action_plans_mark_missing_context_for_human_review():
    action_plans = build_issue_action_plans(
        [
            {
                "issue_id": "ISSUE-9999",
                "issue_type": "UNKNOWN",
                "severity": "P2",
                "bad_count": 1,
                "total_count": 2,
                "bad_rate": 0.5,
                "evidence_sql": "",
                "probable_causes": [],
                "suggested_fix": [],
            }
        ],
        table_assessments={},
    )

    plan = action_plans["plans"][0]
    assert action_plans["summary"]["plan_count"] == 1
    assert action_plans["summary"]["human_review_count"] == 1
    assert plan["source"] == "deterministic"
    assert plan["human_review_required"] is True
    assert "Needs human review" in plan["human_review_reason"]
    assert plan["fix_data_checklist"][0].startswith("Needs human review")
    assert plan["verify_after_fix_checklist"][0].startswith("Needs human review")


def test_issue_todos_group_duplicate_text_while_preserving_context():
    todos = build_issue_todos(
        {
            "artifact": "issue_action_plans",
            "plans": [
                {
                    "issue_id": "ISSUE-0001",
                    "issue_type": "REQUIRED_FIELD_NULL",
                    "severity": "P1",
                    "priority": "P1 - fix before analysis",
                    "source": "deterministic",
                    "table": "customers",
                    "columns": ["email"],
                    "fix_data_checklist": ["Backfill missing values."],
                    "verify_after_fix_checklist": ["Rerun the profiler on the corrected CSV + DBML inputs."],
                },
                {
                    "issue_id": "ISSUE-0002",
                    "issue_type": "PRIMARY_KEY_NULL",
                    "severity": "P0",
                    "priority": "P0 - block run/use",
                    "source": "deterministic",
                    "table": "orders",
                    "columns": ["order_id"],
                    "fix_data_checklist": ["Backfill missing values."],
                    "verify_after_fix_checklist": ["Rerun the profiler on the corrected CSV + DBML inputs."],
                },
            ],
        }
    )

    fix_group = next(group for group in todos["groups"] if group["todo_type"] == "fix_data")
    verify_group = next(group for group in todos["groups"] if group["todo_type"] == "verify_after_fix")
    assert fix_group["occurrence_count"] == 2
    assert verify_group["occurrence_count"] == 2
    assert fix_group["priorities"] == ["P0 - block run/use", "P1 - fix before analysis"]
    assert {item["issue_id"] for item in fix_group["occurrences"]} == {"ISSUE-0001", "ISSUE-0002"}
    assert {item["table"] for item in fix_group["occurrences"]} == {"customers", "orders"}
    assert todos["summary"]["todo_group_count"] == 2


def test_issue_todos_empty_action_plans_emit_empty_artifact():
    todos = build_issue_todos({"artifact": "issue_action_plans", "plans": []})

    assert todos["artifact"] == "issue_todos"
    assert todos["derived_from"] == "issue_action_plans.json"
    assert todos["source"] == "deterministic"
    assert todos["groups"] == []
    assert todos["summary"]["todo_group_count"] == 0
    assert todos["summary"]["fix_data_group_count"] == 0
    assert todos["summary"]["verify_after_fix_group_count"] == 0


def test_web_runner_path_job_can_enable_fake_llm_report(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    store = WebRunStore(run_root=tmp_path / "web_runs")

    job = store.start_path_job(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        use_llm=True,
        llm_provider="fake",
    )

    wait_for_job(job)

    assert job.status == "succeeded"
    assert (job.out_dir / "l4_report.md").exists()
    assert (job.out_dir / "guardrail_report.json").exists()
    path_inputs = json.loads((job.input_dir / "path_inputs.json").read_text())
    assert path_inputs["use_llm"] is True
    assert path_inputs["llm_provider"] == "fake"
    run_summary = json.loads((job.out_dir / "run_summary.json").read_text())
    assert run_summary["inputs"]["use_llm"] is True
    assert run_summary["inputs"]["llm_provider"] == "fake"
    payload = store.job_payload(job)
    assert payload["llm"] == {"enabled": True, "provider": "fake"}
    artifact_paths = {artifact["path"] for artifact in payload["artifacts"]}
    assert {"l4_report.md", "guardrail_report.json"}.issubset(artifact_paths)


def test_web_runner_path_job_persists_preflight_review_artifact(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    store = WebRunStore(run_root=tmp_path / "web_runs")
    preflight_review = {
        "status": "ready",
        "mode": "path",
        "blockers": [],
        "warnings": [
            {
                "id": "extra_csv:notes",
                "title": "Extra CSV not declared in DBML: notes.csv.",
                "detail": "Reviewed before run.",
                "accepted": True,
            }
        ],
        "accepted_warning_ids": ["extra_csv:notes"],
    }

    job = store.start_path_job(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        preflight_review=preflight_review,
    )

    wait_for_job(job)

    assert job.status == "succeeded"
    path_inputs = json.loads((job.input_dir / "path_inputs.json").read_text())
    assert path_inputs["preflight_review"]["accepted_warning_ids"] == ["extra_csv:notes"]
    persisted_review = json.loads((job.out_dir / "preflight_review.json").read_text())
    assert persisted_review["status"] == "ready"
    assert persisted_review["warnings"][0]["accepted"] is True
    assert persisted_review["recorded_at"]
    payload = store.job_payload(job)
    artifact_paths = {artifact["path"] for artifact in payload["artifacts"]}
    assert "preflight_review.json" in artifact_paths


def test_web_runner_database_job_writes_artifacts_and_redacts_secret_url(
    tmp_path,
    monkeypatch,
):
    captured: dict[str, object] = {}

    def fake_from_config(**kwargs):
        captured.update(kwargs)
        return FakeWebDatabaseConnector(
            source_type="postgres",
            secret_url=kwargs["postgres_url"],
            default_schema=kwargs["postgres_schema"],
            selected_tables=kwargs["postgres_tables"],
            chunk_rows=kwargs["postgres_chunk_rows"],
        )

    monkeypatch.setattr(web_runner.PostgresConnector, "from_config", staticmethod(fake_from_config))
    store = WebRunStore(run_root=tmp_path / "web_runs")

    job = store.start_database_job(
        source_type="postgres",
        connection_url=POSTGRES_SECRET_URL,
        schema="public",
        tables="customers",
        chunk_rows=2,
    )

    wait_for_job(job)

    assert job.status == "succeeded"
    assert job.input_mode == "database"
    assert job.database_source_type == "postgres"
    assert captured["postgres_url"] == POSTGRES_SECRET_URL
    assert captured["postgres_schema"] == "public"
    assert captured["postgres_tables"] == "customers"
    assert captured["postgres_chunk_rows"] == 2
    assert (job.out_dir / "connector_metadata.json").exists()
    assert (job.out_dir / "schema_diagram.dbml").exists()
    assert not (job.out_dir / ".connector_extracts").exists()

    database_inputs = json.loads((job.input_dir / "database_inputs.json").read_text())
    assert database_inputs["input_mode"] == "database"
    assert database_inputs["source_type"] == "postgres"
    assert database_inputs["connection_url"] == (
        "postgresql://[redacted]@127.0.0.1:5432/demo?token=%5Bredacted%5D"
    )
    assert database_inputs["secrets_redacted"] is True

    payload = store.job_payload(job)
    assert payload["input_mode"] == "database"
    assert payload["database"] == {"source_type": "postgres"}
    assert POSTGRES_SECRET_URL not in json.dumps(payload)
    assert "super-secret" not in json.dumps(payload)
    assert_no_secret_leak(job.root_dir, POSTGRES_SECRET_URL)
    assert_no_secret_leak(job.root_dir, "super-secret")
    assert_no_secret_leak(job.root_dir, "query-secret")


def test_web_runner_database_job_http_endpoint(tmp_path, monkeypatch):
    def fake_from_config(**kwargs):
        return FakeWebDatabaseConnector(
            source_type="mysql",
            secret_url=kwargs["mysql_url"],
            default_schema=kwargs["mysql_schema"],
            selected_tables=kwargs["mysql_tables"],
            chunk_rows=kwargs["mysql_chunk_rows"],
        )

    monkeypatch.setattr(web_runner.MySQLConnector, "from_config", staticmethod(fake_from_config))
    server = create_web_server(port=0, run_root=tmp_path / "web_runs")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://{LOCAL_WEB_HOST}:{server.server_address[1]}"
    try:
        payload = _post_json(
            f"{base_url}/api/database-jobs",
            {
                "source_type": "mysql",
                "connection_url": MYSQL_SECRET_URL,
                "schema": "demo",
                "tables": "customers",
                "chunk_rows": 1,
                "target": "customers.customer_id",
            },
        )

        assert payload["status"] in {"queued", "running"}
        assert payload["input_mode"] == "database"
        assert payload["database"] == {"source_type": "mysql"}
        assert MYSQL_SECRET_URL not in json.dumps(payload)

        job_payload = _wait_for_http_job(base_url, payload["job_id"])
        assert job_payload["status"] == "succeeded"
        assert job_payload["input_mode"] == "database"
        artifact_paths = {artifact["path"] for artifact in job_payload["artifacts"]}
        assert REQUIRED_ARTIFACTS.issubset(artifact_paths)
        assert "connector_metadata.json" in artifact_paths
        assert "schema_diagram.dbml" in artifact_paths
        assert MYSQL_SECRET_URL not in json.dumps(job_payload)
        assert "super-secret" not in json.dumps(job_payload)

        with pytest.raises(urllib.error.HTTPError) as exc_info:
            _post_json(
                f"{base_url}/api/database-jobs",
                {
                    "source_type": "postgres",
                    "connection_url": MYSQL_SECRET_URL,
                },
            )
        assert exc_info.value.code == 400
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()


def test_web_runner_database_job_validates_inputs_before_start(tmp_path):
    store = WebRunStore(run_root=tmp_path / "web_runs")

    with pytest.raises(ValueError, match="source_type"):
        store.start_database_job(
            source_type="sqlite",
            connection_url="sqlite:///tmp/demo.db",
        )

    with pytest.raises(ValueError, match="Postgres connection_url"):
        store.start_database_job(
            source_type="postgres",
            connection_url=MYSQL_SECRET_URL,
        )

    with pytest.raises(ValueError, match="MySQL connection_url"):
        store.start_database_job(
            source_type="mysql",
            connection_url=POSTGRES_SECRET_URL,
        )

    with pytest.raises(ValueError, match="chunk_rows"):
        store.start_database_job(
            source_type="postgres",
            connection_url=POSTGRES_SECRET_URL,
            chunk_rows=0,
        )

    with pytest.raises(ValueError, match="table.column"):
        store.start_database_job(
            source_type="postgres",
            connection_url=POSTGRES_SECRET_URL,
            target="customer_id",
        )

    with pytest.raises(ValueError, match="llm_provider requires use_llm"):
        store.start_database_job(
            source_type="postgres",
            connection_url=POSTGRES_SECRET_URL,
            llm_provider="fake",
        )


def test_web_runner_path_job_validates_inputs_before_start(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    store = WebRunStore(run_root=tmp_path / "web_runs")

    with pytest.raises(ValueError, match="DBML path"):
        store.start_path_job(
            dbml_path=data_dir / "missing.dbml",
            csv_dir=data_dir / "csv",
        )

    unsupported_dbml = data_dir / "schema.txt"
    unsupported_dbml.write_text((data_dir / "schema.dbml").read_text(encoding="utf-8"))
    with pytest.raises(ValueError, match=".dbml"):
        store.start_path_job(
            dbml_path=unsupported_dbml,
            csv_dir=data_dir / "csv",
        )

    with pytest.raises(ValueError, match="CSV directory"):
        store.start_path_job(
            dbml_path=data_dir / "schema.dbml",
            csv_dir=data_dir / "schema.dbml",
        )

    empty_csv_dir = tmp_path / "empty_csv"
    empty_csv_dir.mkdir()
    with pytest.raises(ValueError, match="at least one .csv"):
        store.start_path_job(
            dbml_path=data_dir / "schema.dbml",
            csv_dir=empty_csv_dir,
        )

    unsupported_rules = data_dir / "rules.txt"
    unsupported_rules.write_text((data_dir / "rules.yaml").read_text(encoding="utf-8"))
    with pytest.raises(ValueError, match=".yaml"):
        store.start_path_job(
            dbml_path=data_dir / "schema.dbml",
            csv_dir=data_dir / "csv",
            rules_path=unsupported_rules,
        )

    with pytest.raises(ValueError, match="table.column"):
        store.start_path_job(
            dbml_path=data_dir / "schema.dbml",
            csv_dir=data_dir / "csv",
            target="review_score",
        )

    with pytest.raises(ValueError, match="llm_provider requires use_llm"):
        store.start_path_job(
            dbml_path=data_dir / "schema.dbml",
            csv_dir=data_dir / "csv",
            llm_provider="fake",
        )

    with pytest.raises(ValueError, match="llm_provider"):
        store.start_path_job(
            dbml_path=data_dir / "schema.dbml",
            csv_dir=data_dir / "csv",
            use_llm=True,
            llm_provider="unsupported",
        )


def test_web_runner_path_job_http_endpoint(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    server = create_web_server(port=0, run_root=tmp_path / "web_runs")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://{LOCAL_WEB_HOST}:{server.server_address[1]}"
    try:
        payload = _post_json(
            f"{base_url}/api/path-jobs",
            {
                "dbml_path": str(data_dir / "schema.dbml"),
                "csv_dir": str(data_dir / "csv"),
                "rules_path": str(data_dir / "rules.yaml"),
                "target": "order_reviews.review_score",
            },
        )

        assert payload["status"] in {"queued", "running"}
        assert payload["input_mode"] == "path"

        job_payload = _wait_for_http_job(base_url, payload["job_id"])
        assert job_payload["status"] == "succeeded"
        assert job_payload["input_mode"] == "path"
        artifact_paths = {artifact["path"] for artifact in job_payload["artifacts"]}
        assert REQUIRED_ARTIFACTS.issubset(artifact_paths)

        history = _get_json(f"{base_url}/api/history")
        history_entry = next(item for item in history["runs"] if item["job_id"] == payload["job_id"])
        assert history_entry["status"] == "succeeded"
        assert history_entry["stage_count"] >= 8
        assert history_entry["issue_count"] > 0
        assert history_entry["quality_gate_summary"]["available"] is True

        with pytest.raises(urllib.error.HTTPError) as exc_info:
            _post_json(
                f"{base_url}/api/path-jobs",
                {
                    "dbml_path": str(data_dir / "missing.dbml"),
                    "csv_dir": str(data_dir / "csv"),
                },
            )
        assert exc_info.value.code == 400
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()


def test_web_runner_evaluation_http_endpoint(tmp_path, monkeypatch):
    monkeypatch.setattr(
        "vsf_profiler.evaluation_benchmark._great_expectations_availability",
        lambda: {
            "status": "unavailable",
            "version": None,
            "reason": "ModuleNotFoundError: No module named 'great_expectations'",
        },
    )
    server = create_web_server(port=0, run_root=tmp_path / "web_runs")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://{LOCAL_WEB_HOST}:{server.server_address[1]}"
    try:
        catalog = _get_json(f"{base_url}/api/evaluation-catalog")
        assert catalog["arbitrary_uploads_supported"] is False
        assert len(catalog["datasets"]) >= 2

        payload = _post_json(
            f"{base_url}/api/evaluations",
            {"dataset_id": "support_tickets_seeded_faults"},
        )

        assert payload["status"] in {"queued", "running"}
        assert payload["input_mode"] == "evaluation"
        assert payload["evaluation"] == {"dataset_id": "support_tickets_seeded_faults"}

        job_payload = _wait_for_http_job(base_url, payload["job_id"])
        assert job_payload["status"] == "succeeded"
        assert job_payload["input_mode"] == "evaluation"
        artifact_paths = {artifact["path"] for artifact in job_payload["artifacts"]}
        assert {
            "ground_truth_issues.json",
            "baseline_comparison.json",
            "evaluation_summary.json",
        }.issubset(artifact_paths)

        summary_url = next(
            artifact["url"]
            for artifact in job_payload["artifacts"]
            if artifact["path"] == "evaluation_summary.json"
        )
        summary = _get_json(f"{base_url}{summary_url}")
        assert summary["dataset"]["dataset_id"] == "support_tickets_seeded_faults"
        assert summary["correctness"]["vsf_extra_group_count"] == 0
        assert summary["baseline"]["status"] == "unavailable"

        with pytest.raises(urllib.error.HTTPError) as exc_info:
            _post_json(
                f"{base_url}/api/evaluations",
                {"dataset_id": "uploaded_csv"},
            )
        assert exc_info.value.code == 400
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()


def test_web_runner_dashboard_endpoint_lists_generated_artifact_urls(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    server = create_web_server(port=0, run_root=tmp_path / "web_runs")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://{LOCAL_WEB_HOST}:{server.server_address[1]}"
    try:
        payload = _post_json(
            f"{base_url}/api/path-jobs",
            {
                "dbml_path": str(data_dir / "schema.dbml"),
                "csv_dir": str(data_dir / "csv"),
                "rules_path": str(data_dir / "rules.yaml"),
                "target": "order_reviews.review_score",
            },
        )
        job_payload = _wait_for_http_job(base_url, payload["job_id"])
        assert job_payload["status"] == "succeeded"

        dashboard = _get_json(f"{base_url}/api/jobs/{payload['job_id']}/dashboard")
        assert dashboard["job_id"] == payload["job_id"]
        assert dashboard["status"] == "succeeded"
        assert dashboard["missing_artifacts"] == []
        assert "charts/issue_counts_by_severity.json" in dashboard["chart_artifacts"]
        assert "charts/influence_top_features.json" in dashboard["chart_artifacts"]
        assert "charts/outliers_top_columns.json" in dashboard["chart_artifacts"]
        for artifact_path in [
            "issues.json",
            "profile_summary.json",
            "relationship_graph.json",
            "dataset_verdict.json",
            "table_assessments.json",
            "issue_action_plans.json",
            "issue_todos.json",
            "quality_gates.json",
            "schema_evaluation.json",
            "schema_parse_report.json",
            "lineage_graph.json",
            "influence.json",
            "run_summary.json",
            "charts/issue_counts_by_type.json",
            "charts/outliers_top_columns.json",
        ]:
            assert dashboard["artifact_urls"][artifact_path] == (
                f"/api/jobs/{payload['job_id']}/artifacts/{artifact_path}"
            )

        issue_type_spec = _get_json(
            f"{base_url}{dashboard['artifact_urls']['charts/issue_counts_by_type.json']}"
        )
        assert issue_type_spec["artifact"] == "chart_spec"
        assert issue_type_spec["data"]
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()


def test_web_runner_dashboard_lists_optional_connector_metadata_when_present(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    store = WebRunStore(run_root=tmp_path / "web_runs")
    job = store.start_path_job(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
    )
    wait_for_job(job)
    assert job.status == "succeeded"

    (job.out_dir / "connector_metadata.json").write_text(
        json.dumps(
            {
                "artifact": "connector_metadata",
                "source_type": "postgres",
                "connection": {"url": "[redacted]"},
            }
        ),
        encoding="utf-8",
    )

    payload = store.job_payload(job)
    artifact_paths = {artifact["path"] for artifact in payload["artifacts"]}
    assert "connector_metadata.json" in artifact_paths
    dashboard = store.dashboard_payload(job)
    assert dashboard["artifact_urls"]["connector_metadata.json"] == (
        f"/api/jobs/{job.job_id}/artifacts/connector_metadata.json"
    )


def test_web_runner_dashboard_lists_optional_l4_artifacts_when_present(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    store = WebRunStore(run_root=tmp_path / "web_runs")
    job = store.start_path_job(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
    )
    wait_for_job(job)
    assert job.status == "succeeded"

    (job.out_dir / "l4_report.md").write_text("# LLM Data-Quality Summary Artifact\n", encoding="utf-8")
    (job.out_dir / "guardrail_report.json").write_text(
        json.dumps(
            {
                "artifact": "guardrail_report",
                "status": "passed",
                "provider": "fake",
                "checked_numbers": [],
                "checked_refs": [],
                "violations": [],
            }
        ),
        encoding="utf-8",
    )

    dashboard = store.dashboard_payload(job)
    assert dashboard["artifact_urls"]["l4_report.md"] == (
        f"/api/jobs/{job.job_id}/artifacts/l4_report.md"
    )
    assert dashboard["artifact_urls"]["guardrail_report.json"] == (
        f"/api/jobs/{job.job_id}/artifacts/guardrail_report.json"
    )
    assert "l4_report.md" not in dashboard["required_artifacts"]
    assert "guardrail_report.json" not in dashboard["required_artifacts"]


def test_web_runner_issue_llm_enrichment_endpoint_persists_optional_artifact(tmp_path, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    server = create_web_server(port=0, run_root=tmp_path / "web_runs")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://{LOCAL_WEB_HOST}:{server.server_address[1]}"
    try:
        payload = _post_json(
            f"{base_url}/api/path-jobs",
            {
                "dbml_path": str(data_dir / "schema.dbml"),
                "csv_dir": str(data_dir / "csv"),
                "rules_path": str(data_dir / "rules.yaml"),
                "target": "order_reviews.review_score",
            },
        )
        job_payload = _wait_for_http_job(base_url, payload["job_id"])
        assert job_payload["status"] == "succeeded"
        issues_url = next(
            artifact["url"]
            for artifact in job_payload["artifacts"]
            if artifact["path"] == "issues.json"
        )
        issues = _get_json(f"{base_url}{issues_url}")
        issue_id = issues[0]["issue_id"]

        fake_result = _post_json(
            f"{base_url}/api/jobs/{payload['job_id']}/issue-enrichments",
            {"issue_id": issue_id, "provider": "fake"},
            expected_status=200,
        )

        fake_entry = fake_result["enrichment"]
        assert fake_entry["issue_id"] == issue_id
        assert fake_entry["provider"] == "fake"
        assert fake_entry["status"] == "succeeded"
        assert fake_entry["human_review_required"] is True
        assert fake_entry["structured_response"]["extra_fix_suggestion"]
        artifact_paths = {artifact["path"] for artifact in fake_result["artifacts"]}
        assert "issue_llm_enrichments.json" in artifact_paths
        assert fake_result["dashboard"]["artifact_urls"]["issue_llm_enrichments.json"] == (
            f"/api/jobs/{payload['job_id']}/artifacts/issue_llm_enrichments.json"
        )
        artifact = _get_json(f"{base_url}{fake_result['artifact_url']}")
        assert artifact["summary"]["provider_counts"] == {"fake": 1}
        assert artifact["deterministic_source_of_truth"] == "issue_action_plans.json"

        openai_result = _post_json(
            f"{base_url}/api/jobs/{payload['job_id']}/issue-enrichments",
            {"issue_id": issue_id, "provider": "openai"},
            expected_status=200,
        )
        openai_entry = openai_result["enrichment"]
        assert openai_entry["provider"] == "openai"
        assert openai_entry["status"] == "unavailable"
        assert openai_entry["error"]["code"] == "openai_api_key_missing"
        assert openai_entry["human_review_required"] is True
        artifact = _get_json(f"{base_url}{openai_result['artifact_url']}")
        assert artifact["summary"]["provider_counts"] == {"fake": 1, "openai": 1}
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()


def test_web_runner_upload_job_applies_mapping_overrides_after_filename_sanitization(tmp_path):
    store = WebRunStore(run_root=tmp_path / "web_runs")

    job = store.start_job(
        dbml=UploadedFile(
            filename="schema.dbml",
            content=b"""
            Table customers {
              customer_id varchar [pk, not null]
              email varchar
            }
            """,
        ),
        csv_files=[
            UploadedFile(
                filename="crm customers.csv",
                content=b"customer_id,email\nC001,a@example.com\n",
            )
        ],
        mapping_overrides={"customers": "crm customers.csv"},
    )

    wait_for_job(job)

    assert job.status == "succeeded"
    schema_evaluation = json.loads((job.out_dir / "schema_evaluation.json").read_text())
    customers = schema_evaluation["tables"][0]
    assert customers["mapping_method"] == "manual"
    assert customers["selected_csv"] == "crm_customers.csv"
    assert customers["matched_columns"] == ["customer_id", "email"]


def test_web_runner_path_job_applies_mapping_overrides(tmp_path):
    root = tmp_path / "data"
    csv_dir = root / "csv"
    csv_dir.mkdir(parents=True)
    schema_path = root / "schema.dbml"
    schema_path.write_text(
        """
        Table customers {
          customer_id varchar [pk, not null]
          email varchar
        }
        """,
        encoding="utf-8",
    )
    _write_csv(csv_dir / "crm_customers.csv", ["customer_id", "email"], [["C001", "a@example.com"]])
    store = WebRunStore(run_root=tmp_path / "web_runs")

    job = store.start_path_job(
        dbml_path=schema_path,
        csv_dir=csv_dir,
        mapping_overrides={"customers": "crm_customers.csv"},
    )

    wait_for_job(job)

    assert job.status == "succeeded"
    path_inputs = json.loads((job.input_dir / "path_inputs.json").read_text())
    assert path_inputs["mapping_overrides"] == {"customers": "crm_customers.csv"}
    schema_evaluation = json.loads((job.out_dir / "schema_evaluation.json").read_text())
    assert schema_evaluation["tables"][0]["mapping_method"] == "manual"


def test_web_runner_rejects_artifact_path_traversal(tmp_path):
    store = WebRunStore(run_root=tmp_path / "web_runs")
    job = store.start_job(
        dbml=UploadedFile(filename="schema.dbml", content=b"Table orders { order_id varchar [pk] }"),
        csv_files=[UploadedFile(filename="orders.csv", content=b"order_id\n1\n")],
    )
    wait_for_job(job, seconds=10)

    try:
        store.resolve_artifact(job, "../input/schema.dbml")
    except ValueError as exc:
        assert "outside" in str(exc)
    else:
        raise AssertionError("path traversal was not rejected")


def test_web_server_binds_localhost_only(tmp_path):
    server = create_web_server(port=0, run_root=tmp_path / "web_runs")
    try:
        assert server.server_address[0] == LOCAL_WEB_HOST
    finally:
        server.server_close()


class FakeWebDatabaseConnector:
    def __init__(
        self,
        *,
        source_type: str,
        secret_url: str,
        default_schema: str,
        selected_tables: str | None,
        chunk_rows: int,
    ) -> None:
        self.source_type = source_type
        self.secret_url = secret_url
        self.default_schema = default_schema
        self.selected_tables = selected_tables
        self.chunk_rows = chunk_rows

    def runtime_inputs(self):
        url_key = "postgres_url" if self.source_type == "postgres" else "mysql_url"
        return {
            "source_type": self.source_type,
            url_key: self.secret_url,
            "password": "super-secret",
            "target_token": "query-secret",
        }

    def prepare_schema(self):
        table = TableSchema(
            name="customers",
            columns={
                "customer_id": ColumnSchema(
                    name="customer_id",
                    type="varchar",
                    is_pk=True,
                    not_null=True,
                ),
                "email": ColumnSchema(name="email", type="varchar", unique=True),
            },
            primary_key=["customer_id"],
        )
        schema = Schema(tables={"customers": table})
        return schema, {
            "artifact": "schema_parse_report",
            "version": 1,
            "parser": "fake_web_database_connector",
            "status": "generated_from_connector",
            "source": {"path": ""},
            "counts": {
                "tables": 1,
                "columns": 2,
                "relationships": 0,
                "warnings": 0,
                "errors": 0,
                "unsupported_constructs": 0,
            },
            "diagnostics": [],
            "unsupported_constructs": [],
            "objects": {"tables": [{"name": "customers"}]},
        }

    def build_catalog(self, *, schema, out_dir):
        extract_dir = out_dir / ".connector_extracts" / self.source_type
        extract_dir.mkdir(parents=True)
        extract_path = extract_dir / "customers.csv"
        _write_csv(
            extract_path,
            ["customer_id", "email"],
            [["C001", "a@example.com"], ["C002", "b@example.com"]],
        )
        catalog = CsvCatalog(
            tables={
                "customers": CatalogTable(
                    table="customers",
                    csv_path=extract_path,
                    columns=["customer_id", "email"],
                    file_size_mb=0.001,
                    source_type=self.source_type,
                    source_name=f"{self.source_type}:{self.default_schema}.customers",
                )
            }
        )
        metadata = {
            "artifact": "connector_metadata",
            "version": 1,
            "source_type": self.source_type,
            "connection": {"url": redact_connection_url(self.secret_url), "provided_by": "test"},
            "default_schema": self.default_schema,
            "introspection_status": "completed",
            "extraction_status": "completed",
            "tables_scanned": ["customers"],
            "tables": [
                {
                    "table": "customers",
                    "source_table": f"{self.default_schema}.customers",
                    "columns": ["customer_id", "email"],
                    "column_count": 2,
                    "row_count_estimate": 2,
                    "rows_extracted": 2,
                    "status": "extracted",
                }
            ],
            "warnings": [],
            "chunk_rows": self.chunk_rows,
            "raw_extracts_persisted": False,
            "secrets_redacted": True,
        }
        return catalog, metadata, [extract_dir]


def _post_json(url, payload, *, expected_status=202):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        assert response.status == expected_status
        return json.loads(response.read().decode("utf-8"))


def _get_json(url):
    with urllib.request.urlopen(url, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def _wait_for_http_job(base_url, job_id):
    deadline = time.monotonic() + 20
    payload = {}
    while time.monotonic() < deadline:
        payload = _get_json(f"{base_url}/api/jobs/{job_id}")
        if payload["status"] in {"succeeded", "failed"}:
            return payload
        time.sleep(0.05)
    return payload


def _write_csv(path, header: list[str], rows: list[list[str]]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)


def assert_no_secret_leak(root_dir, secret: str) -> None:
    for path in root_dir.rglob("*"):
        if path.is_file() and path.suffix in {".json", ".jsonl", ".log", ".md", ".html"}:
            assert secret not in path.read_text(encoding="utf-8")
