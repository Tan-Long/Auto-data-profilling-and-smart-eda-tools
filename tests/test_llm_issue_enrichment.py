import json

from vsf_profiler.llm_issue_enrichment import (
    ISSUE_ENRICHMENT_FILENAME,
    MAX_CONTEXT_BYTES,
    build_issue_enrichment_context,
    generate_issue_llm_enrichment,
    validate_issue_enrichment_context,
)


def test_issue_enrichment_context_is_selected_issue_and_bounded_sample(tmp_path):
    out_dir = _write_issue_artifacts(tmp_path)

    context = build_issue_enrichment_context(out_dir=out_dir, issue_id="ISSUE-0001")
    guardrail = validate_issue_enrichment_context(context)

    assert context["issue_id"] == "ISSUE-0001"
    assert context["privacy_contract"]["raw_csv_included"] is False
    assert context["privacy_contract"]["full_csv_files_included"] is False
    assert context["privacy_contract"]["selected_issue_only"] is True
    assert context["deterministic_contract"]["source_of_truth"] == "issue_action_plans.json"
    assert context["bounded_sample"]["artifact"] == "samples/ISSUE-0001.csv"
    assert context["bounded_sample"]["row_count"] == 5
    assert len(context["bounded_sample"]["rows"]) == 5
    assert "samples/ISSUE-0001.csv" in context["source_artifacts"]
    assert len(json.dumps(context).encode("utf-8")) <= MAX_CONTEXT_BYTES
    assert guardrail["status"] == "passed"
    assert guardrail["raw_csv_included"] is False
    assert guardrail["unbounded_samples_included"] is False


def test_fake_issue_enrichment_persists_advisory_artifact_without_overwriting_action_plan(tmp_path):
    out_dir = _write_issue_artifacts(tmp_path)
    original_action_plans = (out_dir / "issue_action_plans.json").read_text(encoding="utf-8")

    result = generate_issue_llm_enrichment(
        out_dir=out_dir,
        issue_id="ISSUE-0001",
        provider_name="fake",
    )

    entry = result["entry"]
    artifact = json.loads((out_dir / ISSUE_ENRICHMENT_FILENAME).read_text(encoding="utf-8"))
    assert entry["status"] == "succeeded"
    assert entry["provider"] == "fake"
    assert entry["human_review_required"] is True
    assert entry["guardrail_result"]["status"] == "passed"
    assert entry["request_summary"]["raw_csv_included"] is False
    assert entry["request_summary"]["bounded_sample"]["row_count"] == 5
    assert "Why" not in entry["structured_response"]
    assert entry["structured_response"]["why_this_was_flagged"]
    assert entry["structured_response"]["extra_fix_suggestion"]
    assert entry["structured_response"]["extra_verification"]
    fix_text = " ".join(entry["structured_response"]["extra_fix_suggestion"])
    verify_text = " ".join(entry["structured_response"]["extra_verification"])
    assert "Backfill customer_id from the source order feed." not in fix_text
    assert "Confirm affected rows for orders.customer_id are 0 in the rerun." not in verify_text
    assert "deterministic checklist" in fix_text
    assert "issue_action_plans.json remains the checklist source of truth" in verify_text
    assert entry["structured_response"]["human_review_needed"]["required"] is True
    assert artifact["summary"]["enrichment_count"] == 1
    assert artifact["summary"]["provider_counts"] == {"fake": 1}
    assert (out_dir / "issue_action_plans.json").read_text(encoding="utf-8") == original_action_plans


def test_openai_issue_enrichment_uses_responses_structured_output_without_secret_persistence(
    tmp_path,
    monkeypatch,
):
    out_dir = _write_issue_artifacts(tmp_path)
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
            "output_text": json.dumps(
                {
                    "why_this_was_flagged": ["The selected issue evidence shows null customer identifiers."],
                    "extra_fix_suggestion": ["Check the upstream customer-id mapping before rerunning."],
                    "extra_verification": ["Rerun the profiler and confirm ISSUE-0001 is absent."],
                    "human_review_needed": {
                        "required": True,
                        "reason": "Review this advisory LLM suggestion before changing source data.",
                    },
                }
            )
        }

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("VSF_OPENAI_MODEL", "gpt-test")
    monkeypatch.setenv("VSF_OPENAI_BASE_URL", "https://example.test/v1")

    result = generate_issue_llm_enrichment(
        out_dir=out_dir,
        issue_id="ISSUE-0001",
        provider_name="openai",
        openai_transport=fake_transport,
    )

    entry = result["entry"]
    artifact_text = (out_dir / ISSUE_ENRICHMENT_FILENAME).read_text(encoding="utf-8")
    assert entry["status"] == "succeeded"
    assert entry["provider"] == "openai"
    assert entry["model"] == "gpt-test"
    assert "test-key" not in artifact_text
    assert len(calls) == 1
    call = calls[0]
    assert call["url"] == "https://example.test/v1/responses"
    assert call["headers"]["Authorization"] == "Bearer test-key"
    assert call["payload"]["text"]["format"]["type"] == "json_schema"
    assert call["payload"]["text"]["format"]["name"] == "issue_llm_enrichment"
    assert call["payload"]["store"] is False
    request = json.loads(call["payload"]["input"])
    request_context = request["context"]
    assert request_context["issue_id"] == "ISSUE-0001"
    assert request_context["privacy_contract"]["raw_csv_included"] is False
    assert request_context["bounded_sample"]["row_count"] == 5
    assert "issue_action_plans.json" in request_context["source_artifacts"]


def test_openai_issue_enrichment_missing_key_is_visible_unavailable_not_fake(tmp_path, monkeypatch):
    out_dir = _write_issue_artifacts(tmp_path)
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.delenv("VSF_OPENAI_MODEL", raising=False)

    result = generate_issue_llm_enrichment(
        out_dir=out_dir,
        issue_id="ISSUE-0001",
        provider_name="openai",
    )

    entry = result["entry"]
    assert entry["provider"] == "openai"
    assert entry["status"] == "unavailable"
    assert entry["error"]["code"] == "openai_api_key_missing"
    assert entry["human_review_required"] is True
    assert entry["structured_response"]["human_review_needed"]["required"] is True
    assert entry["guardrail_result"]["status"] == "failed"


def test_invalid_llm_issue_response_is_persisted_as_invalid_and_keeps_action_plan(tmp_path, monkeypatch):
    out_dir = _write_issue_artifacts(tmp_path)
    original_action_plans = (out_dir / "issue_action_plans.json").read_text(encoding="utf-8")

    def invalid_transport(url, headers, payload, timeout_seconds):
        return {"output_text": json.dumps({"why_this_was_flagged": ["Change severity to P3."]})}

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("VSF_OPENAI_MODEL", "gpt-test")

    result = generate_issue_llm_enrichment(
        out_dir=out_dir,
        issue_id="ISSUE-0001",
        provider_name="openai",
        openai_transport=invalid_transport,
    )

    entry = result["entry"]
    assert entry["status"] == "invalid"
    assert entry["error"]["code"] == "response_guardrail_failed"
    violation_types = {violation["type"] for violation in entry["guardrail_result"]["violations"]}
    assert "schema_missing_key" in violation_types
    assert "deterministic_override" in violation_types
    assert (out_dir / "issue_action_plans.json").read_text(encoding="utf-8") == original_action_plans


def _write_issue_artifacts(root):
    out_dir = root / "artifacts"
    samples = out_dir / "samples"
    samples.mkdir(parents=True)
    (samples / "ISSUE-0001.csv").write_text(
        "\n".join(
            [
                "customer_id,order_id",
                ",O-001",
                ",O-002",
                ",O-003",
                ",O-004",
                ",O-005",
                ",O-006",
            ]
        ),
        encoding="utf-8",
    )
    issue = {
        "issue_id": "ISSUE-0001",
        "issue_type": "REQUIRED_FIELD_NULL",
        "severity": "P1",
        "table": "orders",
        "columns": ["customer_id"],
        "bad_count": 6,
        "total_count": 20,
        "bad_rate": 0.3,
        "sample_keys": ["O-001", "O-002"],
        "sample_bad_rows_path": "samples/ISSUE-0001.csv",
        "evidence_sql": "select * from orders where customer_id is null",
        "probable_causes": ["Missing customer mapping."],
        "suggested_fix": ["Backfill customer_id from the source order feed."],
    }
    action_plan = {
        "artifact": "issue_action_plans",
        "version": 1,
        "summary": {
            "issue_count": 1,
            "plan_count": 1,
            "human_review_count": 0,
            "average_actionability_score": 90,
            "source": "deterministic",
        },
        "plans": [
            {
                "issue_id": "ISSUE-0001",
                "source": "deterministic",
                "priority": "P1 - fix before analysis",
                "finding_summary": "Required field null on orders.customer_id: 6 of 20 rows affected (30.00%).",
                "evidence_values": [
                    {
                        "label": "Bad rows",
                        "raw_value": 6,
                        "meaning": "Rows that matched the issue evidence query.",
                        "artifact": "issues.json",
                        "field": "bad_count",
                    },
                    {
                        "label": "Sample rows",
                        "raw_value": "samples/ISSUE-0001.csv",
                        "meaning": "Generated bounded sample CSV for concrete row evidence.",
                        "artifact": "samples/ISSUE-0001.csv",
                        "field": "sample_bad_rows_path",
                    },
                ],
                "fix_data_checklist": ["Backfill customer_id from the source order feed."],
                "verify_after_fix_checklist": [
                    "Rerun the profiler on the corrected CSV + DBML inputs.",
                    "Confirm affected rows for orders.customer_id are 0 in the rerun.",
                ],
                "guidelines": ["Keep generated artifacts read-only."],
                "evidence_coverage": {"score": 90, "label": "Strong", "explanation": "Evidence present."},
                "actionability_score": {"score": 90, "label": "High", "explanation": "Complete."},
                "human_review_required": False,
                "human_review_reason": "",
                "issue_type": "REQUIRED_FIELD_NULL",
                "severity": "P1",
                "table": "orders",
                "columns": ["customer_id"],
            }
        ],
    }
    (out_dir / "issues.json").write_text(json.dumps([issue]), encoding="utf-8")
    (out_dir / "issue_action_plans.json").write_text(json.dumps(action_plan), encoding="utf-8")
    (out_dir / "table_assessments.json").write_text(
        json.dumps(
            {
                "artifact": "table_assessments",
                "assessments": [
                    {
                        "table": "orders",
                        "role": "fact",
                        "health_score": 70,
                        "readiness": "NOT_READY",
                        "issue_counts_by_severity": {"P1": 1},
                        "affected_columns": ["customer_id"],
                        "business_impact": {"category": "relationship_reliability"},
                        "recommended_next_actions": ["Fix customer relationship keys."],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    (out_dir / "dataset_verdict.json").write_text(
        json.dumps({"verdict": "NOT_READY", "risk_score": 80, "top_blockers": [{"issue_id": "ISSUE-0001"}]}),
        encoding="utf-8",
    )
    (out_dir / "quality_gates.json").write_text(
        json.dumps(
            {
                "gates": [
                    {
                        "gate_id": "can_trust_joins",
                        "status": "Blocked",
                        "reason": "Key issues present.",
                        "evidence_context": [{"issue_id": "ISSUE-0001", "table": "orders"}],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    (out_dir / "issue_todos.json").write_text(
        json.dumps(
            {
                "groups": [
                    {
                        "todo_type": "fix_data",
                        "text": "Backfill customer_id from the source order feed.",
                        "priority": "P1 - fix before analysis",
                        "occurrences": [{"issue_id": "ISSUE-0001"}],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    return out_dir
