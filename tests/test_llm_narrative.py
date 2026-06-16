import json

from vsf_profiler.cli import _llm_provider_from_config, run_pipeline
from vsf_profiler.demo_data import create_small_demo
from vsf_profiler.llm_narrative import (
    OpenAINarrativeProvider,
    build_guardrail_evidence,
    build_narrative_context,
    validate_narrative,
)


class CapturingProvider:
    name = "fake"

    def __init__(self) -> None:
        self.context = {}

    def generate(self, context: dict) -> str:
        self.context = context
        summary = context["summary"]
        issue = context["top_issues"][0]
        column_ref = f"{issue['table']}.{issue['columns'][0]}"
        return (
            "# Senior Data Scientist Narrative\n\n"
            f"The deterministic artifacts show {summary['table_count']} tables, "
            f"{summary['issue_count']} issues, and risk score {summary['risk_score']}.\n\n"
            f"`{issue['issue_type']}` is present on `{column_ref}`.\n\n"
            "Influence findings are association-only and require domain review.\n"
        )


class BadProvider:
    name = "fake"

    def generate(self, context: dict) -> str:
        return (
            "# Senior Data Scientist Narrative\n\n"
            "The dataset has 999 issues. `ghost_table.bad_column` causes downstream churn.\n"
        )


def test_fake_provider_writes_l4_report_and_passed_guardrail(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    out_dir = tmp_path / "outputs" / "demo_small"
    provider = CapturingProvider()

    run_pipeline(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        out_dir=out_dir,
        use_llm=True,
        llm_provider=provider,
    )

    guardrail_report = json.loads((out_dir / "guardrail_report.json").read_text())
    l4_report = (out_dir / "l4_report.md").read_text()
    run_summary = json.loads((out_dir / "run_summary.json").read_text())
    report_md = (out_dir / "report.md").read_text()
    report_html = (out_dir / "report.html").read_text()

    assert guardrail_report["status"] == "passed"
    assert guardrail_report["provider"] == "fake"
    assert guardrail_report["raw_csv_included"] is False
    assert guardrail_report["unbounded_samples_included"] is False
    assert guardrail_report["checked_numbers"]
    assert guardrail_report["checked_refs"]
    assert guardrail_report["violations"] == []
    assert "Senior Data Scientist Narrative" in l4_report
    assert "association-only" in l4_report
    assert "l4_report.md" in report_md
    assert "guardrail_report.json" in report_md
    assert "l4_report.md" in report_html
    assert run_summary["artifact_paths"]["l4_report"] == "l4_report.md"
    assert run_summary["artifact_paths"]["guardrail_report"] == "guardrail_report.json"
    assert "llm_narrative" in [stage["name"] for stage in run_summary["stage_timings"]]
    assert provider.context["privacy_contract"] == {
        "raw_csv_included": False,
        "sample_rows_included": False,
        "sample_paths_may_be_referenced": True,
    }
    assert provider.context["source_artifacts"] == [
        "profile_summary.json",
        "issues.json",
        "schema_evaluation.json",
        "relationship_graph.json",
        "dataset_verdict.json",
        "charts/*.json",
        "influence.json",
    ]


def test_bad_provider_output_uses_deterministic_fallback(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    out_dir = tmp_path / "outputs" / "demo_small"

    run_pipeline(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        out_dir=out_dir,
        use_llm=True,
        llm_provider=BadProvider(),
    )

    guardrail_report = json.loads((out_dir / "guardrail_report.json").read_text())
    l4_report = (out_dir / "l4_report.md").read_text()
    violation_types = {violation["type"] for violation in guardrail_report["violations"]}

    assert guardrail_report["status"] == "fallback_used"
    assert guardrail_report["fallback_reason"] == "guardrail_failed"
    assert {"numeric_claim", "reference", "causal_wording"}.issubset(violation_types)
    assert "Deterministic fallback narrative" in l4_report
    assert "999" not in l4_report
    assert "ghost_table.bad_column" not in l4_report


def test_missing_provider_config_uses_deterministic_fallback(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    out_dir = tmp_path / "outputs" / "demo_small"

    run_pipeline(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        out_dir=out_dir,
        use_llm=True,
    )

    guardrail_report = json.loads((out_dir / "guardrail_report.json").read_text())
    assert guardrail_report["status"] == "fallback_used"
    assert guardrail_report["fallback_reason"] == "provider_config_missing"
    assert guardrail_report["provider"] == "none"
    assert (out_dir / "l4_report.md").exists()


def test_llm_disabled_preserves_deterministic_artifact_set(tmp_path):
    data_dir = create_small_demo(tmp_path / "data" / "demo_small")
    out_dir = tmp_path / "outputs" / "demo_small"

    run_pipeline(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=data_dir / "rules.yaml",
        target="order_reviews.review_score",
        out_dir=out_dir,
    )

    run_summary = json.loads((out_dir / "run_summary.json").read_text())
    report_md = (out_dir / "report.md").read_text()
    assert not (out_dir / "l4_report.md").exists()
    assert not (out_dir / "guardrail_report.json").exists()
    assert "l4_report" not in run_summary["artifact_paths"]
    assert "guardrail_report" not in run_summary["artifact_paths"]
    assert "llm_narrative" not in [stage["name"] for stage in run_summary["stage_timings"]]
    assert "Senior Data Scientist narrative" not in report_md


def test_guardrail_rejects_unsupported_numbers_refs_and_causal_wording():
    artifacts = {
        "profile_summary": {
            "tables": {
                "orders": {
                    "row_count": 2,
                    "column_count": 1,
                    "columns": {"order_id": {"null_count": 0}},
                }
            }
        },
        "issues": [
            {
                "issue_id": "ISSUE-0001",
                "issue_type": "ORPHAN_FOREIGN_KEY",
                "severity": "P1",
                "table": "orders",
                "columns": ["order_id"],
                "bad_count": 1,
            }
        ],
        "schema_evaluation": {"summary": {"mapped_table_count": 1}},
        "relationship_graph": {"summary": {"edge_count": 1}},
        "dataset_verdict": {
            "verdict": "WARN",
            "risk_score": 42,
            "issue_counts": {"by_severity": {"P1": 1}, "by_type": {"ORPHAN_FOREIGN_KEY": 1}},
        },
        "chart_specs": {},
        "influence": {"target": "orders.order_id", "top_features": [], "row_count": 0},
    }
    context = build_narrative_context(artifacts)
    evidence = build_guardrail_evidence(artifacts, context)

    passed = validate_narrative(
        "There are 1 issues on `orders.order_id` with risk score 42.",
        evidence,
    )
    failed = validate_narrative(
        "There are 999 issues on `missing_table.missing_column` and that causes churn.",
        evidence,
    )

    assert passed["status"] == "passed"
    assert failed["status"] == "failed"
    assert {violation["type"] for violation in failed["violations"]} == {
        "numeric_claim",
        "reference",
        "causal_wording",
    }


def test_openai_provider_uses_responses_api_without_raw_csv_payload():
    calls = []

    def fake_transport(url, headers, payload, timeout_seconds):
        calls.append(
            {
                "url": url,
                "headers": headers,
                "payload": payload,
                "timeout_seconds": timeout_seconds,
            }
        )
        return {
            "output": [
                {
                    "content": [
                        {
                            "type": "output_text",
                            "text": "# Senior Data Scientist Narrative\n\n"
                            "The deterministic artifacts show 1 tables and 2 rows.\n\n"
                            "Influence findings are association-only.",
                        }
                    ]
                }
            ]
        }

    provider = OpenAINarrativeProvider(
        api_key="test-key",
        model="gpt-test",
        base_url="https://example.test/v1/",
        timeout_seconds=12.5,
        max_output_tokens=345,
        transport=fake_transport,
    )
    context = {
        "role": "Senior Data Scientist",
        "source_artifacts": ["profile_summary.json", "issues.json"],
        "privacy_contract": {
            "raw_csv_included": False,
            "sample_rows_included": False,
            "sample_paths_may_be_referenced": True,
        },
        "summary": {"table_count": 1, "row_count": 2},
        "tables": [{"table": "orders", "columns": ["order_id"], "row_count": 2}],
        "top_issues": [],
    }

    narrative = provider.generate(context)

    assert "Senior Data Scientist Narrative" in narrative
    assert len(calls) == 1
    call = calls[0]
    assert call["url"] == "https://example.test/v1/responses"
    assert call["headers"]["Authorization"] == "Bearer test-key"
    assert call["headers"]["Content-Type"] == "application/json"
    assert call["timeout_seconds"] == 12.5
    assert call["payload"]["model"] == "gpt-test"
    assert call["payload"]["max_output_tokens"] == 345
    assert "raw CSV data" in call["payload"]["instructions"]
    request_context = json.loads(call["payload"]["input"])["context"]
    assert request_context["privacy_contract"]["raw_csv_included"] is False
    assert request_context["privacy_contract"]["sample_rows_included"] is False
    assert ".csv" not in call["payload"]["input"]
    assert "data/demo_small/csv" not in call["payload"]["input"]


def test_openai_config_without_api_key_falls_back_to_missing_provider(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("VSF_PROFILER_LLM_PROVIDER", "openai")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    assert _llm_provider_from_config(None) is None


def test_openai_config_can_load_env_example_style_file(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("VSF_PROFILER_LLM_PROVIDER", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("VSF_OPENAI_MODEL", raising=False)
    (tmp_path / ".env").write_text(
        "\n".join(
            [
                "VSF_PROFILER_LLM_PROVIDER=openai",
                "OPENAI_API_KEY=test-key",
                "VSF_OPENAI_MODEL=gpt-test",
            ]
        ),
        encoding="utf-8",
    )

    provider = _llm_provider_from_config(None)

    assert isinstance(provider, OpenAINarrativeProvider)
    assert provider.model == "gpt-test"
