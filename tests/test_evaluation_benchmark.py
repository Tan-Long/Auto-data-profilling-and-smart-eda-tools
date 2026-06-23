import json

import pytest

import vsf_profiler.evaluation_benchmark as evaluation


def test_evaluation_catalog_lists_built_in_datasets_without_uploads():
    catalog = evaluation.evaluation_catalog_payload()

    assert catalog["input_policy"] == "built_in_curated_datasets_only"
    assert catalog["arbitrary_uploads_supported"] is False
    dataset_ids = {dataset["dataset_id"] for dataset in catalog["datasets"]}
    assert dataset_ids == {
        "retail_orders_seeded_faults",
        "support_tickets_seeded_faults",
    }
    assert all(dataset["input_policy"] == "built_in_local_only" for dataset in catalog["datasets"])


def test_evaluation_benchmark_writes_ground_truth_baseline_and_summary(
    tmp_path,
    monkeypatch,
):
    monkeypatch.setattr(
        evaluation,
        "_great_expectations_availability",
        lambda: {
            "status": "unavailable",
            "version": None,
            "reason": "ModuleNotFoundError: No module named 'great_expectations'",
        },
    )

    summary = evaluation.run_evaluation_benchmark(
        dataset_id="support_tickets_seeded_faults",
        input_dir=tmp_path / "input",
        out_dir=tmp_path / "artifacts",
    )

    out_dir = tmp_path / "artifacts"
    assert (out_dir / "issues.json").exists()
    assert (out_dir / "issue_action_plans.json").exists()
    assert (out_dir / evaluation.GROUND_TRUTH_ARTIFACT).exists()
    assert (out_dir / evaluation.BASELINE_COMPARISON_ARTIFACT).exists()
    assert (out_dir / evaluation.EVALUATION_SUMMARY_ARTIFACT).exists()

    ground_truth = json.loads((out_dir / evaluation.GROUND_TRUTH_ARTIFACT).read_text())
    baseline = json.loads((out_dir / evaluation.BASELINE_COMPARISON_ARTIFACT).read_text())
    persisted_summary = json.loads((out_dir / evaluation.EVALUATION_SUMMARY_ARTIFACT).read_text())

    assert summary["artifact"] == "evaluation_summary"
    assert persisted_summary["dataset"]["dataset_id"] == "support_tickets_seeded_faults"
    assert persisted_summary["arbitrary_uploads_supported"] is False
    assert ground_truth["expected_issue_group_count"] == 14
    assert ground_truth["expected_issue_occurrence_count"] == 14
    assert persisted_summary["correctness"]["vsf_caught_group_count"] == 14
    assert persisted_summary["correctness"]["vsf_missed_group_count"] == 0
    assert persisted_summary["correctness"]["vsf_extra_group_count"] == 0
    assert persisted_summary["correctness"]["detection_coverage_rate"] == 1.0

    assert persisted_summary["usefulness"]["issue_action_plan_count"] == 14
    assert persisted_summary["usefulness"]["average_actionability_score"] > 0
    assert persisted_summary["usefulness"]["average_evidence_coverage_score"] > 0
    assert persisted_summary["baseline"]["status"] == "unavailable"
    assert persisted_summary["baseline"]["ge_unavailable_group_count"] > 0
    assert persisted_summary["baseline"]["ge_not_covered_group_count"] > 0
    assert persisted_summary["baseline"]["baseline_gap_count"] == 14
    assert baseline["baseline"]["coverage_policy"] == (
        "unsupported checks are labeled Not covered by baseline"
    )
    assert {
        row["ge_status"]
        for row in baseline["rows"]
        if row["baseline_coverage"] == "not_covered"
    } == {"not_covered"}
    assert {
        row["ge_status"]
        for row in baseline["rows"]
        if row["baseline_coverage"] == "native"
    } == {"unavailable"}


def test_evaluation_benchmark_rejects_unknown_dataset(tmp_path):
    with pytest.raises(ValueError, match="Unknown evaluation dataset_id"):
        evaluation.run_evaluation_benchmark(
            dataset_id="uploaded_csv",
            input_dir=tmp_path / "input",
            out_dir=tmp_path / "artifacts",
        )
