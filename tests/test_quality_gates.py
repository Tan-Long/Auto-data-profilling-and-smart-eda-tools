from vsf_profiler.quality_gates import build_quality_gates


def test_quality_gates_emit_clean_states_for_empty_run():
    artifact = build_quality_gates(
        preflight_review={"status": "ready", "blockers": [], "warnings": []},
        issues=[],
        table_assessments={
            "artifact": "table_assessments",
            "assessments": [
                {"table": "orders", "readiness": "READY", "relationship_risks": []}
            ],
        },
        issue_action_plans={"artifact": "issue_action_plans", "plans": []},
        issue_todos={"artifact": "issue_todos", "groups": []},
        dataset_verdict={
            "artifact": "dataset_verdict",
            "verdict": "READY",
            "risk_score": 0,
            "issue_counts": {
                "total": 0,
                "by_severity": {"P0": 0, "P1": 0, "P2": 0, "P3": 0},
            },
        },
    )

    assert artifact["artifact"] == "quality_gates"
    assert artifact["source"] == "deterministic"
    assert artifact["summary"]["statuses"] == {
        "Clean": 4,
        "Needs Review": 0,
        "Usable With Caution": 0,
        "Blocked": 0,
    }
    assert {gate["status"] for gate in artifact["gates"]} == {"Clean"}
    assert all(gate["evidence_values"] for gate in artifact["gates"])
    assert all(gate["recommended_next_action"]["target"] in {"Review Issues", "Todos"} for gate in artifact["gates"])


def test_quality_gates_block_analysis_and_joins_with_context():
    artifact = build_quality_gates(
        preflight_review={"status": "ready", "blockers": [], "warnings": []},
        issues=[
            {
                "issue_id": "ISSUE-0001",
                "issue_type": "DUPLICATE_PRIMARY_KEY",
                "severity": "P0",
                "table": "orders",
                "columns": ["order_id"],
                "bad_count": 2,
            },
            {
                "issue_id": "ISSUE-0002",
                "issue_type": "ORPHAN_FOREIGN_KEY",
                "severity": "P1",
                "table": "orders",
                "columns": ["customer_id"],
                "parent_table": "customers",
                "parent_columns": ["customer_id"],
                "bad_count": 3,
            },
        ],
        table_assessments={
            "artifact": "table_assessments",
            "assessments": [
                {
                    "table": "orders",
                    "readiness": "NOT_READY",
                    "affected_columns": ["order_id", "customer_id"],
                    "relationship_risks": [
                        {
                            "relationship_id": "orders.customer_id->customers.customer_id",
                            "status": "invalid",
                            "source_table": "orders",
                            "source_columns": ["customer_id"],
                            "target_table": "customers",
                            "target_columns": ["customer_id"],
                        }
                    ],
                }
            ],
        },
        issue_action_plans={"artifact": "issue_action_plans", "plans": []},
        issue_todos={
            "artifact": "issue_todos",
            "groups": [
                {
                    "todo_id": "FIX-0001",
                    "todo_type": "fix_data",
                    "text": "Deduplicate primary keys.",
                    "occurrence_count": 1,
                    "priorities": ["P0 - block run/use"],
                    "occurrences": [
                        {
                            "issue_id": "ISSUE-0001",
                            "issue_type": "DUPLICATE_PRIMARY_KEY",
                            "severity": "P0",
                            "table": "orders",
                            "columns": ["order_id"],
                        }
                    ],
                }
            ],
        },
        dataset_verdict={
            "artifact": "dataset_verdict",
            "verdict": "NOT_READY",
            "risk_score": 100,
            "issue_counts": {
                "total": 2,
                "by_severity": {"P0": 1, "P1": 1, "P2": 0, "P3": 0},
            },
        },
    )

    gates = {gate["gate_id"]: gate for gate in artifact["gates"]}
    assert gates["can_run_analysis"]["status"] == "Blocked"
    assert gates["can_trust_joins"]["status"] == "Blocked"
    assert gates["needs_cleanup_before_sharing"]["status"] == "Blocked"
    assert gates["outliers_need_review"]["status"] == "Clean"
    assert gates["can_trust_joins"]["contexts"][0]["relationship_id"] == (
        "orders.customer_id->customers.customer_id"
    )
    assert gates["needs_cleanup_before_sharing"]["recommended_next_action"]["target"] == "Todos"


def test_quality_gates_mark_insufficient_or_outlier_evidence_for_review():
    artifact = build_quality_gates(
        issues=[
            {
                "issue_id": "ISSUE-0003",
                "issue_type": "NUMERIC_OUTLIER",
                "severity": "P3",
                "table": "payments",
                "columns": ["amount"],
                "bad_count": 4,
            }
        ],
        table_assessments=None,
        issue_action_plans={
            "artifact": "issue_action_plans",
            "plans": [{"issue_id": "ISSUE-0003", "human_review_required": True}],
        },
        issue_todos={"artifact": "issue_todos", "groups": []},
        dataset_verdict=None,
    )

    gates = {gate["gate_id"]: gate for gate in artifact["gates"]}
    assert gates["can_run_analysis"]["status"] == "Needs Review"
    assert gates["can_trust_joins"]["status"] == "Needs Review"
    assert gates["needs_cleanup_before_sharing"]["status"] == "Needs Review"
    assert gates["outliers_need_review"]["status"] == "Needs Review"
    assert gates["outliers_need_review"]["contexts"][0]["issue_id"] == "ISSUE-0003"
