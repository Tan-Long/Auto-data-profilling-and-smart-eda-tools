from __future__ import annotations

import csv
import json
from collections import defaultdict
from dataclasses import dataclass
from importlib import import_module
from pathlib import Path
from statistics import mean
from typing import Any, Callable

from vsf_profiler.demo_data import create_small_demo


GROUND_TRUTH_ARTIFACT = "ground_truth_issues.json"
BASELINE_COMPARISON_ARTIFACT = "baseline_comparison.json"
EVALUATION_SUMMARY_ARTIFACT = "evaluation_summary.json"
PUBLIC_EVALUATION_DATA_ROOT = Path(__file__).resolve().parents[2] / "data" / "evaluation_public"


@dataclass(frozen=True)
class EvaluationInputPaths:
    root: Path
    dbml_path: Path
    csv_dir: Path
    rules_path: Path | None


@dataclass(frozen=True)
class EvaluationDatasetSpec:
    dataset_id: str
    label: str
    summary: str
    domain: str
    expected_table_count: int
    expected_issue_group_count: int
    target: str | None
    generator: Callable[[Path], EvaluationInputPaths]
    ground_truth_factory: Callable[[], list[dict[str, Any]]]
    source_name: str = "VSF seeded demo data"
    source_url: str = ""
    source_license: str = ""
    source_local_path: str = ""


SUPPORT_SCHEMA = """Table accounts {
  account_id varchar [pk, not null]
  email varchar [unique]
  signup_date timestamp
}

Table tickets {
  ticket_id varchar [pk, not null]
  account_id varchar [ref: > accounts.account_id]
  priority varchar
  status varchar
  opened_at timestamp
  resolved_at timestamp
  first_response_hours int
}

Table agents {
  agent_id varchar [pk, not null]
  agent_name varchar [not null]
}

Table ticket_assignments {
  ticket_id varchar [ref: > tickets.ticket_id]
  agent_id varchar [ref: > agents.agent_id]
  assigned_at timestamp
}
"""


SUPPORT_RULES = """rules:
  tickets:
    - id: TICKET_PRIORITY_ALLOWED
      type: accepted_values
      column: priority
      values:
        - high
        - medium
        - low
      severity: P1
    - id: FIRST_RESPONSE_RANGE
      type: range
      column: first_response_hours
      min: 0
      max: 10
      severity: P1
    - id: RESOLVED_AFTER_OPENED
      type: expression
      columns:
        - opened_at
        - resolved_at
      expression: "CAST(resolved_at AS TIMESTAMP) >= CAST(opened_at AS TIMESTAMP)"
      where: "resolved_at IS NOT NULL"
      severity: P1
"""


DIABETES_SCHEMA = """Table diabetes_records {
  patient_id varchar [pk, not null]
  pregnancies int
  glucose int
  blood_pressure int
  skin_thickness int
  insulin int
  bmi float
  diabetes_pedigree_function float
  age int
  outcome int
}
"""


DIABETES_RULES = """rules:
  diabetes_records:
    - id: GLUCOSE_POSITIVE
      type: range
      column: glucose
      min: 1
      max: 400
      severity: P1
    - id: BLOOD_PRESSURE_POSITIVE
      type: range
      column: blood_pressure
      min: 1
      max: 220
      severity: P1
    - id: BMI_POSITIVE
      type: range
      column: bmi
      min: 1
      max: 120
      severity: P1
    - id: INSULIN_NON_NEGATIVE
      type: range
      column: insulin
      min: 0
      max: 900
      severity: P1
    - id: OUTCOME_BINARY
      type: accepted_values
      column: outcome
      values:
        - "0"
        - "1"
      severity: P1
"""


MANUFACTURING_SCHEMA = """Table production_runs {
  run_id varchar [pk, not null]
  run_date varchar [not null]
  cost float
  output float
  defective float
}
"""


MANUFACTURING_RULES = """rules:
  production_runs:
    - id: COST_NON_NEGATIVE
      type: range
      column: cost
      min: 0
      severity: P1
    - id: OUTPUT_POSITIVE
      type: range
      column: output
      min: 1
      max: 1000
      severity: P1
    - id: DEFECTIVE_PERCENT_RANGE
      type: range
      column: defective
      min: 0
      max: 100
      severity: P1
    - id: RUN_DATE_FORMAT
      type: regex
      column: run_date
      pattern: '^\\d{2}-\\d{2}-\\d{2}$'
      severity: P2
"""


def evaluation_catalog_payload() -> dict[str, Any]:
    datasets = [
        {
            "dataset_id": spec.dataset_id,
            "label": spec.label,
            "summary": spec.summary,
            "domain": spec.domain,
            "table_count": spec.expected_table_count,
            "expected_issue_group_count": spec.expected_issue_group_count,
            "target": spec.target,
            "input_policy": "built_in_local_only",
            "source_name": spec.source_name,
            "source_url": spec.source_url,
            "source_license": spec.source_license,
            "source_local_path": spec.source_local_path,
        }
        for spec in _dataset_specs()
    ]
    return {
        "artifact": "evaluation_dataset_catalog",
        "version": 1,
        "input_policy": "built_in_curated_datasets_only",
        "arbitrary_uploads_supported": False,
        "datasets": datasets,
    }


def get_evaluation_dataset(dataset_id: str) -> EvaluationDatasetSpec:
    specs = {spec.dataset_id: spec for spec in _dataset_specs()}
    try:
        return specs[dataset_id]
    except KeyError as exc:
        allowed = ", ".join(sorted(specs))
        raise ValueError(f"Unknown evaluation dataset_id {dataset_id!r}. Choose one of: {allowed}.") from exc


def run_evaluation_benchmark(
    *,
    dataset_id: str,
    input_dir: str | Path,
    out_dir: str | Path,
) -> dict[str, Any]:
    from vsf_profiler.cli import run_pipeline

    spec = get_evaluation_dataset(dataset_id)
    input_paths = spec.generator(Path(input_dir))
    output_path = Path(out_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    run_pipeline(
        dbml_path=input_paths.dbml_path,
        csv_dir=input_paths.csv_dir,
        rules_path=input_paths.rules_path,
        target=spec.target,
        out_dir=output_path,
        use_llm=False,
        llm_provider=None,
    )

    issues = _read_json_list(output_path / "issues.json")
    action_plans = _read_json_dict(output_path / "issue_action_plans.json")
    run_summary = _read_json_dict(output_path / "run_summary.json")

    ground_truth = build_ground_truth_artifact(spec)
    comparison = build_vsf_comparison(
        expected_issues=ground_truth["expected_issues"],
        actual_issues=issues,
    )
    baseline = build_baseline_comparison(
        spec=spec,
        input_paths=input_paths,
        expected_issues=ground_truth["expected_issues"],
    )
    summary = build_evaluation_summary(
        spec=spec,
        ground_truth=ground_truth,
        comparison=comparison,
        baseline=baseline,
        action_plans=action_plans,
        run_summary=run_summary,
        actual_issues=issues,
    )

    _write_json(output_path / GROUND_TRUTH_ARTIFACT, ground_truth)
    _write_json(output_path / BASELINE_COMPARISON_ARTIFACT, baseline)
    _write_json(output_path / EVALUATION_SUMMARY_ARTIFACT, summary)
    return summary


def build_ground_truth_artifact(spec: EvaluationDatasetSpec) -> dict[str, Any]:
    expected = spec.ground_truth_factory()
    return {
        "artifact": "ground_truth_issues",
        "version": 1,
        "dataset": _dataset_payload(spec),
        "source": "curated_seeded_faults",
        "expected_issue_group_count": len(expected),
        "expected_issue_occurrence_count": sum(
            int(item.get("expected_occurrences", 1)) for item in expected
        ),
        "expected_issues": expected,
    }


def build_vsf_comparison(
    *,
    expected_issues: list[dict[str, Any]],
    actual_issues: list[dict[str, Any]],
) -> dict[str, Any]:
    actual_by_signature: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for issue in actual_issues:
        actual_by_signature[_signature_key(issue)].append(issue)

    expected_signature_keys = {str(row["signature_key"]) for row in expected_issues}
    rows = []
    caught_groups = 0
    missed_groups = 0
    partial_groups = 0
    caught_occurrences = 0
    missed_occurrences = 0
    bad_count_exact = 0

    for expected in expected_issues:
        signature_key = str(expected["signature_key"])
        actual_group = actual_by_signature.get(signature_key, [])
        expected_occurrences = int(expected.get("expected_occurrences", 1))
        actual_occurrences = len(actual_group)
        expected_bad_count = int(expected.get("expected_bad_count", 0))
        actual_bad_counts = [int(issue.get("bad_count", 0)) for issue in actual_group]
        if actual_occurrences >= expected_occurrences:
            vsf_status = "caught"
            caught_groups += 1
        elif actual_occurrences > 0:
            vsf_status = "partial"
            partial_groups += 1
        else:
            vsf_status = "missed"
            missed_groups += 1
        caught_for_row = min(actual_occurrences, expected_occurrences)
        caught_occurrences += caught_for_row
        missed_occurrences += max(expected_occurrences - actual_occurrences, 0)
        bad_count_status = "exact" if expected_bad_count in actual_bad_counts else "not_matched"
        if bad_count_status == "exact":
            bad_count_exact += 1
        rows.append(
            {
                "ground_truth_id": expected["ground_truth_id"],
                "signature_key": signature_key,
                "issue_type": expected["issue_type"],
                "severity": expected["severity"],
                "table": expected["table"],
                "columns": expected["columns"],
                "parent_table": expected.get("parent_table"),
                "expected_bad_count": expected_bad_count,
                "expected_occurrences": expected_occurrences,
                "actual_occurrences": actual_occurrences,
                "actual_bad_counts": actual_bad_counts,
                "vsf_status": vsf_status,
                "bad_count_status": bad_count_status,
                "actual_issue_ids": [str(issue.get("issue_id", "")) for issue in actual_group],
                "comparison_scope": "correctness",
            }
        )

    extra_groups = []
    extra_occurrences = 0
    for signature_key, issues in sorted(actual_by_signature.items()):
        if signature_key in expected_signature_keys:
            expected_row = next(
                item for item in expected_issues if item["signature_key"] == signature_key
            )
            extra_count = max(len(issues) - int(expected_row.get("expected_occurrences", 1)), 0)
            if extra_count:
                extra_occurrences += extra_count
            continue
        extra_occurrences += len(issues)
        first = issues[0]
        extra_groups.append(
            {
                "signature_key": signature_key,
                "issue_type": first.get("issue_type"),
                "table": first.get("table"),
                "columns": first.get("columns") or [],
                "parent_table": first.get("parent_table"),
                "actual_occurrences": len(issues),
                "actual_issue_ids": [str(issue.get("issue_id", "")) for issue in issues],
                "actual_bad_counts": [int(issue.get("bad_count", 0)) for issue in issues],
            }
        )

    expected_group_count = len(expected_issues)
    expected_occurrence_count = sum(int(row.get("expected_occurrences", 1)) for row in expected_issues)
    return {
        "artifact": "vsf_ground_truth_comparison",
        "version": 1,
        "summary": {
            "expected_issue_group_count": expected_group_count,
            "expected_issue_occurrence_count": expected_occurrence_count,
            "actual_issue_occurrence_count": len(actual_issues),
            "vsf_caught_group_count": caught_groups,
            "vsf_partial_group_count": partial_groups,
            "vsf_missed_group_count": missed_groups,
            "vsf_extra_group_count": len(extra_groups),
            "vsf_caught_occurrence_count": caught_occurrences,
            "vsf_missed_occurrence_count": missed_occurrences,
            "vsf_extra_occurrence_count": extra_occurrences,
            "bad_count_exact_group_count": bad_count_exact,
            "detection_coverage_rate": _rate(caught_occurrences, expected_occurrence_count),
        },
        "rows": rows,
        "extra_findings": extra_groups,
    }


def build_baseline_comparison(
    *,
    spec: EvaluationDatasetSpec,
    input_paths: EvaluationInputPaths,
    expected_issues: list[dict[str, Any]],
) -> dict[str, Any]:
    availability = _great_expectations_availability()
    native_results: dict[str, dict[str, Any]] = {}
    baseline_status = availability["status"]
    baseline_reason = _human_readable_ge_reason(availability.get("reason", ""))

    if availability["status"] == "available":
        try:
            native_results = _run_great_expectations_native_checks(
                input_paths=input_paths,
                expected_issues=expected_issues,
            )
        except Exception as exc:  # pragma: no cover - depends on optional GE API.
            baseline_status = "unavailable"
            baseline_reason = _human_readable_ge_reason(f"{exc.__class__.__name__}: {exc}")

    rows = []
    ge_caught = 0
    ge_missed = 0
    ge_not_covered = 0
    ge_unavailable = 0
    for expected in expected_issues:
        coverage = str(expected.get("baseline_coverage", "not_covered"))
        if coverage != "native":
            ge_status = "not_covered"
            ge_not_covered += 1
            reason = expected.get("baseline_reason") or "Not covered by baseline."
            observed_bad_count = None
        elif baseline_status != "available":
            ge_status = "unavailable"
            ge_unavailable += 1
            reason = baseline_reason or "Great Expectations is unavailable."
            observed_bad_count = None
        else:
            result = native_results.get(str(expected["ground_truth_id"]), {})
            observed_bad_count = result.get("unexpected_count")
            ge_status = "caught" if result.get("caught") else "missed"
            reason = result.get("reason", "")
            if ge_status == "caught":
                ge_caught += 1
            else:
                ge_missed += 1
        rows.append(
            {
                "ground_truth_id": expected["ground_truth_id"],
                "issue_type": expected["issue_type"],
                "table": expected["table"],
                "columns": expected["columns"],
                "expected_bad_count": expected["expected_bad_count"],
                "baseline_coverage": coverage,
                "ge_status": ge_status,
                "observed_bad_count": observed_bad_count,
                "reason": reason,
            }
        )

    expected_count = len(expected_issues)
    baseline_gap_count = expected_count - ge_caught
    return {
        "artifact": "baseline_comparison",
        "version": 1,
        "dataset": _dataset_payload(spec),
        "baseline": {
            "name": "Great Expectations",
            "status": baseline_status,
            "version": availability.get("version"),
            "reason": baseline_reason,
            "coverage_policy": "unsupported checks are labeled Not covered by baseline",
        },
        "summary": {
            "expected_issue_group_count": expected_count,
            "ge_caught_group_count": ge_caught,
            "ge_missed_group_count": ge_missed,
            "ge_not_covered_group_count": ge_not_covered,
            "ge_unavailable_group_count": ge_unavailable,
            "baseline_gap_count": baseline_gap_count,
            "added_value_check_count": ge_not_covered,
        },
        "rows": rows,
    }


def build_evaluation_summary(
    *,
    spec: EvaluationDatasetSpec,
    ground_truth: dict[str, Any],
    comparison: dict[str, Any],
    baseline: dict[str, Any],
    action_plans: dict[str, Any],
    run_summary: dict[str, Any],
    actual_issues: list[dict[str, Any]],
) -> dict[str, Any]:
    usefulness = _usefulness_summary(action_plans, actual_issues)
    correctness_summary = comparison["summary"]
    baseline_summary = baseline["summary"]
    return {
        "artifact": "evaluation_summary",
        "version": 1,
        "dataset": _dataset_payload(spec),
        "input_policy": "built_in_curated_datasets_only",
        "arbitrary_uploads_supported": False,
        "artifacts": {
            "ground_truth": GROUND_TRUTH_ARTIFACT,
            "baseline_comparison": BASELINE_COMPARISON_ARTIFACT,
            "evaluation_summary": EVALUATION_SUMMARY_ARTIFACT,
            "vsf_issues": "issues.json",
            "actionability": "issue_action_plans.json",
        },
        "correctness": {
            "label": "Correctness against seeded ground truth",
            **correctness_summary,
        },
        "usefulness": {
            "label": "Usefulness and actionability of generated guidance",
            **usefulness,
        },
        "baseline": {
            "label": "Great Expectations baseline comparison",
            "status": baseline["baseline"]["status"],
            "reason": baseline["baseline"].get("reason", ""),
            **baseline_summary,
        },
        "issue_comparison_rows": comparison["rows"],
        "baseline_rows": baseline["rows"],
        "extra_findings": comparison["extra_findings"],
        "run_summary": {
            "run_id": run_summary.get("run_id"),
            "status": run_summary.get("status"),
            "stage_count": len(run_summary.get("stage_timings") or []),
            "issue_count": len(actual_issues),
        },
        "ground_truth": {
            "source": ground_truth["source"],
            "expected_issue_group_count": ground_truth["expected_issue_group_count"],
            "expected_issue_occurrence_count": ground_truth["expected_issue_occurrence_count"],
        },
    }


def _dataset_specs() -> list[EvaluationDatasetSpec]:
    return [
        EvaluationDatasetSpec(
            dataset_id="retail_orders_seeded_faults",
            label="Retail orders seeded faults",
            summary="Seven-table commerce dataset with null keys, duplicate orders, bad ranges, "
            "date ordering, placeholder text, and foreign-key defects.",
            domain="commerce",
            expected_table_count=7,
            expected_issue_group_count=13,
            target="order_reviews.review_score",
            generator=_generate_retail_orders_dataset,
            ground_truth_factory=_retail_orders_ground_truth,
        ),
        EvaluationDatasetSpec(
            dataset_id="support_tickets_seeded_faults",
            label="Support tickets seeded faults",
            summary="Four-table support dataset with duplicate account and ticket keys, invalid "
            "priority/range values, date ordering, placeholder text, and relationship defects.",
            domain="support",
            expected_table_count=4,
            expected_issue_group_count=14,
            target="tickets.first_response_hours",
            generator=_generate_support_tickets_dataset,
            ground_truth_factory=_support_tickets_ground_truth,
        ),
        EvaluationDatasetSpec(
            dataset_id="public_diabetes_seeded_faults",
            label="Public diabetes seeded faults",
            summary="Plotly public diabetes CSV snapshot with seeded patient key defects, "
            "missing clinical measurements, range violations, and outliers.",
            domain="healthcare",
            expected_table_count=1,
            expected_issue_group_count=12,
            target="diabetes_records.outcome",
            generator=_generate_public_diabetes_dataset,
            ground_truth_factory=_public_diabetes_ground_truth,
            source_name="Plotly datasets diabetes.csv",
            source_url="https://github.com/plotly/datasets/blob/master/diabetes.csv",
            source_license="MIT",
            source_local_path="data/evaluation_public/plotly_diabetes/diabetes.csv",
        ),
        EvaluationDatasetSpec(
            dataset_id="public_manufacturing_defects_seeded_faults",
            label="Public manufacturing defects seeded faults",
            summary="Plotly public cost/output/defective CSV snapshot with seeded run-id, "
            "date-format, negative-cost, impossible-output, and defect-rate errors.",
            domain="manufacturing",
            expected_table_count=1,
            expected_issue_group_count=10,
            target="production_runs.defective",
            generator=_generate_public_manufacturing_dataset,
            ground_truth_factory=_public_manufacturing_ground_truth,
            source_name="Plotly datasets cost_output_defective.csv",
            source_url="https://github.com/plotly/datasets/blob/master/cost_output_defective.csv",
            source_license="MIT",
            source_local_path="data/evaluation_public/plotly_manufacturing/cost_output_defective.csv",
        ),
    ]


def _generate_retail_orders_dataset(root: Path) -> EvaluationInputPaths:
    data_root = create_small_demo(root)
    return EvaluationInputPaths(
        root=data_root,
        dbml_path=data_root / "schema.dbml",
        csv_dir=data_root / "csv",
        rules_path=data_root / "rules.yaml",
    )


def _generate_support_tickets_dataset(root: Path) -> EvaluationInputPaths:
    root.mkdir(parents=True, exist_ok=True)
    csv_dir = root / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    (root / "schema.dbml").write_text(SUPPORT_SCHEMA, encoding="utf-8")
    (root / "rules.yaml").write_text(SUPPORT_RULES, encoding="utf-8")
    _write_csv(
        csv_dir / "accounts.csv",
        ["account_id", "email", "signup_date"],
        [
            ["A001", "shared@example.com", "2024-01-01 09:00:00"],
            ["A002", "shared@example.com", "2024-01-02 09:00:00"],
            ["A002", "bob@example.com", "2024-01-03 09:00:00"],
        ],
    )
    _write_csv(
        csv_dir / "tickets.csv",
        [
            "ticket_id",
            "account_id",
            "priority",
            "status",
            "opened_at",
            "resolved_at",
            "first_response_hours",
        ],
        [
            ["T001", "A001", "high", "open", "2024-02-01 10:00:00", "", "1"],
            ["T002", "A999", "urgent", "closed", "2024-02-02 10:00:00", "2024-02-01 09:00:00", "-5"],
            ["T002", "A002", "medium", "closed", "2024-02-03 10:00:00", "2024-02-04 10:00:00", "5"],
            ["T003", "", "low", "open", "2024-02-05 10:00:00", "", "15"],
        ],
    )
    _write_csv(
        csv_dir / "agents.csv",
        ["agent_id", "agent_name"],
        [
            ["AG1", "Lara"],
            ["AG2", "unknown"],
        ],
    )
    _write_csv(
        csv_dir / "ticket_assignments.csv",
        ["ticket_id", "agent_id", "assigned_at"],
        [
            ["T001", "AG1", "2024-02-01 10:05:00"],
            ["T999", "AG2", "2024-02-02 10:05:00"],
            ["T002", "AGX", "2024-02-03 10:05:00"],
            ["", "AG1", "2024-02-04 10:05:00"],
        ],
    )
    return EvaluationInputPaths(
        root=root,
        dbml_path=root / "schema.dbml",
        csv_dir=csv_dir,
        rules_path=root / "rules.yaml",
    )


def _generate_public_diabetes_dataset(root: Path) -> EvaluationInputPaths:
    source_path = PUBLIC_EVALUATION_DATA_ROOT / "plotly_diabetes" / "diabetes.csv"
    source_rows = _read_public_csv_rows(source_path)[:14]
    root.mkdir(parents=True, exist_ok=True)
    csv_dir = root / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    (root / "schema.dbml").write_text(DIABETES_SCHEMA, encoding="utf-8")
    (root / "rules.yaml").write_text(DIABETES_RULES, encoding="utf-8")

    rows: list[list[str]] = []
    for index, row in enumerate(source_rows, start=1):
        patient_id = f"P{index:03d}"
        if index == 4:
            patient_id = "P003"
        if index == 5:
            patient_id = ""
        glucose = row["Glucose"]
        blood_pressure = row["BloodPressure"]
        insulin = row["Insulin"]
        bmi = row["BMI"]
        outcome = row["Outcome"]
        if index == 6:
            glucose = "0"
        if index == 7:
            blood_pressure = "0"
        if index == 8:
            insulin = "-8"
        if index == 9:
            bmi = "220"
        if index == 10:
            outcome = "2"
        rows.append(
            [
                patient_id,
                row["Pregnancies"],
                glucose,
                blood_pressure,
                row["SkinThickness"],
                insulin,
                bmi,
                row["DiabetesPedigreeFunction"],
                row["Age"],
                outcome,
            ]
        )
    _write_csv(
        csv_dir / "diabetes_records.csv",
        [
            "patient_id",
            "pregnancies",
            "glucose",
            "blood_pressure",
            "skin_thickness",
            "insulin",
            "bmi",
            "diabetes_pedigree_function",
            "age",
            "outcome",
        ],
        rows,
    )
    return EvaluationInputPaths(
        root=root,
        dbml_path=root / "schema.dbml",
        csv_dir=csv_dir,
        rules_path=root / "rules.yaml",
    )


def _generate_public_manufacturing_dataset(root: Path) -> EvaluationInputPaths:
    source_path = PUBLIC_EVALUATION_DATA_ROOT / "plotly_manufacturing" / "cost_output_defective.csv"
    source_rows = _read_public_csv_rows(source_path)
    root.mkdir(parents=True, exist_ok=True)
    csv_dir = root / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    (root / "schema.dbml").write_text(MANUFACTURING_SCHEMA, encoding="utf-8")
    (root / "rules.yaml").write_text(MANUFACTURING_RULES, encoding="utf-8")

    rows: list[list[str]] = []
    for index, row in enumerate(source_rows, start=1):
        run_id = f"RUN-{index:03d}"
        run_date = row["date"]
        cost = row["cost"]
        output = row["output"]
        defective = row["defective"]
        if index == 3:
            run_id = "RUN-002"
        if index == 4:
            run_id = ""
        if index == 5:
            run_date = "bad-date"
        if index == 6:
            cost = "-25"
        if index == 7:
            output = "5000"
        if index == 8:
            defective = "140"
        rows.append([run_id, run_date, cost, output, defective])
    _write_csv(
        csv_dir / "production_runs.csv",
        ["run_id", "run_date", "cost", "output", "defective"],
        rows,
    )
    return EvaluationInputPaths(
        root=root,
        dbml_path=root / "schema.dbml",
        csv_dir=csv_dir,
        rules_path=root / "rules.yaml",
    )


def _retail_orders_ground_truth() -> list[dict[str, Any]]:
    return [
        _gt("GT-RETAIL-001", "REQUIRED_FIELD_NULL", "P1", "customers", ["customer_id"], 1, "native", "DBML not-null expectation.", baseline_check={"type": "not_null"}),
        _gt("GT-RETAIL-002", "PRIMARY_KEY_NULL", "P0", "customers", ["customer_id"], 1, "native", "Primary-key not-null expectation.", baseline_check={"type": "not_null"}),
        _gt("GT-RETAIL-003", "INVALID_PLACEHOLDER_TOKEN", "P3", "customers", ["customer_name"], 1, "not_covered", "Not covered by baseline."),
        _gt("GT-RETAIL-004", "DUPLICATE_PRIMARY_KEY", "P0", "orders", ["order_id"], 2, "native", "Column uniqueness expectation.", baseline_check={"type": "unique"}),
        _gt("GT-RETAIL-005", "VALUE_OUT_OF_RANGE", "P1", "order_reviews", ["review_score"], 1, "native", "Numeric range expectation.", baseline_check={"type": "between", "min": 1, "max": 5}),
        _gt("GT-RETAIL-006", "NEGATIVE_VALUE_NOT_ALLOWED", "P1", "order_payments", ["payment_value"], 1, "native", "Numeric minimum expectation.", baseline_check={"type": "between", "min": 0}),
        _gt("GT-RETAIL-007", "DATE_ORDER_INVALID", "P1", "orders", ["order_purchase_timestamp", "order_delivered_customer_date"], 1, "not_covered", "Not covered by baseline."),
        _gt("GT-RETAIL-008", "FOREIGN_KEY_NULL", "P3", "orders", ["customer_id"], 1, "not_covered", "Not covered by baseline.", parent_table="customers", parent_columns=["customer_id"]),
        _gt("GT-RETAIL-009", "ORPHAN_FOREIGN_KEY", "P1", "orders", ["customer_id"], 1, "not_covered", "Not covered by baseline.", parent_table="customers", parent_columns=["customer_id"]),
        _gt("GT-RETAIL-010", "PARENT_KEY_DUPLICATE", "P1", "orders", ["order_id"], 2, "not_covered", "Not covered by baseline.", expected_occurrences=3),
        _gt("GT-RETAIL-011", "ORPHAN_FOREIGN_KEY", "P1", "order_items", ["product_id"], 1, "not_covered", "Not covered by baseline.", parent_table="products", parent_columns=["product_id"]),
        _gt("GT-RETAIL-012", "ORPHAN_FOREIGN_KEY", "P1", "order_items", ["seller_id"], 1, "not_covered", "Not covered by baseline.", parent_table="sellers", parent_columns=["seller_id"]),
        _gt("GT-RETAIL-013", "ORPHAN_FOREIGN_KEY", "P1", "order_reviews", ["order_id"], 1, "not_covered", "Not covered by baseline.", parent_table="orders", parent_columns=["order_id"]),
    ]


def _support_tickets_ground_truth() -> list[dict[str, Any]]:
    return [
        _gt("GT-SUPPORT-001", "DUPLICATE_PRIMARY_KEY", "P0", "accounts", ["account_id"], 2, "native", "Column uniqueness expectation.", baseline_check={"type": "unique"}),
        _gt("GT-SUPPORT-002", "UNIQUE_DUPLICATE", "P1", "accounts", ["email"], 2, "native", "Column uniqueness expectation.", baseline_check={"type": "unique"}),
        _gt("GT-SUPPORT-003", "DUPLICATE_PRIMARY_KEY", "P0", "tickets", ["ticket_id"], 2, "native", "Column uniqueness expectation.", baseline_check={"type": "unique"}),
        _gt("GT-SUPPORT-004", "ACCEPTED_VALUE_VIOLATION", "P1", "tickets", ["priority"], 1, "native", "Accepted-values expectation.", baseline_check={"type": "in_set", "values": ["high", "medium", "low"]}),
        _gt("GT-SUPPORT-005", "VALUE_OUT_OF_RANGE", "P1", "tickets", ["first_response_hours"], 2, "native", "Numeric range expectation.", baseline_check={"type": "between", "min": 0, "max": 10}),
        _gt("GT-SUPPORT-006", "DATE_ORDER_INVALID", "P1", "tickets", ["opened_at", "resolved_at"], 1, "not_covered", "Not covered by baseline."),
        _gt("GT-SUPPORT-007", "INVALID_PLACEHOLDER_TOKEN", "P3", "agents", ["agent_name"], 1, "not_covered", "Not covered by baseline."),
        _gt("GT-SUPPORT-008", "PARENT_KEY_DUPLICATE", "P1", "accounts", ["account_id"], 2, "not_covered", "Not covered by baseline."),
        _gt("GT-SUPPORT-009", "FOREIGN_KEY_NULL", "P3", "tickets", ["account_id"], 1, "not_covered", "Not covered by baseline.", parent_table="accounts", parent_columns=["account_id"]),
        _gt("GT-SUPPORT-010", "ORPHAN_FOREIGN_KEY", "P1", "tickets", ["account_id"], 1, "not_covered", "Not covered by baseline.", parent_table="accounts", parent_columns=["account_id"]),
        _gt("GT-SUPPORT-011", "PARENT_KEY_DUPLICATE", "P1", "tickets", ["ticket_id"], 2, "not_covered", "Not covered by baseline."),
        _gt("GT-SUPPORT-012", "FOREIGN_KEY_NULL", "P3", "ticket_assignments", ["ticket_id"], 1, "not_covered", "Not covered by baseline.", parent_table="tickets", parent_columns=["ticket_id"]),
        _gt("GT-SUPPORT-013", "ORPHAN_FOREIGN_KEY", "P1", "ticket_assignments", ["ticket_id"], 1, "not_covered", "Not covered by baseline.", parent_table="tickets", parent_columns=["ticket_id"]),
        _gt("GT-SUPPORT-014", "ORPHAN_FOREIGN_KEY", "P1", "ticket_assignments", ["agent_id"], 1, "not_covered", "Not covered by baseline.", parent_table="agents", parent_columns=["agent_id"]),
    ]


def _public_diabetes_ground_truth() -> list[dict[str, Any]]:
    return [
        _gt("GT-DIABETES-001", "REQUIRED_FIELD_NULL", "P1", "diabetes_records", ["patient_id"], 1, "native", "DBML not-null expectation.", baseline_check={"type": "not_null"}),
        _gt("GT-DIABETES-002", "PRIMARY_KEY_NULL", "P0", "diabetes_records", ["patient_id"], 1, "native", "Primary-key not-null expectation.", baseline_check={"type": "not_null"}),
        _gt("GT-DIABETES-003", "DUPLICATE_PRIMARY_KEY", "P0", "diabetes_records", ["patient_id"], 2, "native", "Column uniqueness expectation.", baseline_check={"type": "unique"}),
        _gt("GT-DIABETES-004", "NUMERIC_OUTLIER", "P3", "diabetes_records", ["blood_pressure"], 4, "not_covered", "Not covered by baseline."),
        _gt("GT-DIABETES-005", "NUMERIC_OUTLIER", "P3", "diabetes_records", ["insulin"], 2, "not_covered", "Not covered by baseline."),
        _gt("GT-DIABETES-006", "NUMERIC_OUTLIER", "P3", "diabetes_records", ["bmi"], 2, "not_covered", "Not covered by baseline."),
        _gt("GT-DIABETES-007", "NUMERIC_OUTLIER", "P3", "diabetes_records", ["diabetes_pedigree_function"], 2, "not_covered", "Not covered by baseline."),
        _gt("GT-DIABETES-008", "VALUE_OUT_OF_RANGE", "P1", "diabetes_records", ["glucose"], 1, "native", "Clinical glucose range expectation.", baseline_check={"type": "between", "min": 1, "max": 400}),
        _gt("GT-DIABETES-009", "VALUE_OUT_OF_RANGE", "P1", "diabetes_records", ["blood_pressure"], 2, "native", "Blood-pressure range expectation.", baseline_check={"type": "between", "min": 1, "max": 220}),
        _gt("GT-DIABETES-010", "VALUE_OUT_OF_RANGE", "P1", "diabetes_records", ["bmi"], 2, "native", "BMI range expectation.", baseline_check={"type": "between", "min": 1, "max": 120}),
        _gt("GT-DIABETES-011", "VALUE_OUT_OF_RANGE", "P1", "diabetes_records", ["insulin"], 1, "native", "Insulin range expectation.", baseline_check={"type": "between", "min": 0, "max": 900}),
        _gt("GT-DIABETES-012", "ACCEPTED_VALUE_VIOLATION", "P1", "diabetes_records", ["outcome"], 1, "native", "Binary outcome expectation.", baseline_check={"type": "in_set", "values": ["0", "1"]}),
    ]


def _public_manufacturing_ground_truth() -> list[dict[str, Any]]:
    return [
        _gt("GT-MFG-001", "REQUIRED_FIELD_NULL", "P1", "production_runs", ["run_id"], 1, "native", "DBML not-null expectation.", baseline_check={"type": "not_null"}),
        _gt("GT-MFG-002", "PRIMARY_KEY_NULL", "P0", "production_runs", ["run_id"], 1, "native", "Primary-key not-null expectation.", baseline_check={"type": "not_null"}),
        _gt("GT-MFG-003", "DUPLICATE_PRIMARY_KEY", "P0", "production_runs", ["run_id"], 2, "native", "Column uniqueness expectation.", baseline_check={"type": "unique"}),
        _gt("GT-MFG-004", "NUMERIC_OUTLIER", "P3", "production_runs", ["cost"], 3, "not_covered", "Not covered by baseline."),
        _gt("GT-MFG-005", "NUMERIC_OUTLIER", "P3", "production_runs", ["output"], 1, "not_covered", "Not covered by baseline."),
        _gt("GT-MFG-006", "NUMERIC_OUTLIER", "P3", "production_runs", ["defective"], 1, "not_covered", "Not covered by baseline."),
        _gt("GT-MFG-007", "NEGATIVE_VALUE_NOT_ALLOWED", "P1", "production_runs", ["cost"], 1, "native", "Non-negative cost expectation.", baseline_check={"type": "between", "min": 0}),
        _gt("GT-MFG-008", "VALUE_OUT_OF_RANGE", "P1", "production_runs", ["output"], 1, "native", "Production output range expectation.", baseline_check={"type": "between", "min": 1, "max": 1000}),
        _gt("GT-MFG-009", "VALUE_OUT_OF_RANGE", "P1", "production_runs", ["defective"], 1, "native", "Defective percentage range expectation.", baseline_check={"type": "between", "min": 0, "max": 100}),
        _gt("GT-MFG-010", "REGEX_MISMATCH", "P2", "production_runs", ["run_date"], 1, "not_covered", "Not covered by baseline."),
    ]


def _gt(
    ground_truth_id: str,
    issue_type: str,
    severity: str,
    table: str,
    columns: list[str],
    expected_bad_count: int,
    baseline_coverage: str,
    baseline_reason: str,
    *,
    parent_table: str | None = None,
    parent_columns: list[str] | None = None,
    expected_occurrences: int = 1,
    baseline_check: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload = {
        "ground_truth_id": ground_truth_id,
        "issue_type": issue_type,
        "severity": severity,
        "table": table,
        "columns": columns,
        "parent_table": parent_table,
        "parent_columns": parent_columns or [],
        "expected_bad_count": expected_bad_count,
        "expected_occurrences": expected_occurrences,
        "baseline_coverage": baseline_coverage,
        "baseline_reason": baseline_reason,
        "baseline_check": baseline_check or {},
    }
    payload["signature"] = _signature_payload(payload)
    payload["signature_key"] = _signature_key(payload)
    return payload


def _run_great_expectations_native_checks(
    *,
    input_paths: EvaluationInputPaths,
    expected_issues: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    pandas_module = import_module("pandas")

    try:
        dataset_module = import_module("great_expectations.dataset")
        pandas_dataset = getattr(dataset_module, "PandasDataset")
    except Exception as exc:  # pragma: no cover - depends on optional GE API.
        raise RuntimeError(
            "Installed Great Expectations does not expose the PandasDataset API used "
            "by this local benchmark adapter."
        ) from exc

    frames: dict[str, Any] = {}
    results: dict[str, dict[str, Any]] = {}
    for expected in expected_issues:
        if expected.get("baseline_coverage") != "native":
            continue
        check = expected.get("baseline_check") or {}
        table = str(expected["table"])
        column = str((expected.get("columns") or [""])[0])
        csv_path = input_paths.csv_dir / f"{table}.csv"
        if table not in frames:
            frames[table] = pandas_dataset(_dataframe_from_csv(csv_path, pandas_module))
        dataset = frames[table]
        result = _run_ge_expectation(dataset, column, check)
        results[str(expected["ground_truth_id"])] = {
            "caught": result["caught"],
            "unexpected_count": result.get("unexpected_count"),
            "reason": result.get("reason", ""),
        }
    return results


def _dataframe_from_csv(csv_path: Path, pandas_module: Any) -> Any:
    with csv_path.open("r", newline="", encoding="utf-8") as handle:
        return pandas_module.DataFrame(list(csv.DictReader(handle)))


def _run_ge_expectation(dataset: Any, column: str, check: dict[str, Any]) -> dict[str, Any]:
    check_type = check.get("type")
    if check_type == "not_null":
        result = dataset.expect_column_values_to_not_be_null(column, result_format="SUMMARY")
    elif check_type == "unique":
        result = dataset.expect_column_values_to_be_unique(column, result_format="SUMMARY")
    elif check_type == "between":
        result = dataset.expect_column_values_to_be_between(
            column,
            min_value=check.get("min"),
            max_value=check.get("max"),
            result_format="SUMMARY",
        )
    elif check_type == "in_set":
        result = dataset.expect_column_values_to_be_in_set(
            column,
            value_set=check.get("values") or [],
            result_format="SUMMARY",
        )
    else:
        return {"caught": False, "reason": "No native Great Expectations check configured."}
    result_payload = dict(result or {})
    details = result_payload.get("result") if isinstance(result_payload.get("result"), dict) else {}
    unexpected_count = details.get("unexpected_count")
    return {
        "caught": result_payload.get("success") is False,
        "unexpected_count": unexpected_count if isinstance(unexpected_count, int) else None,
        "reason": "Native Great Expectations expectation failed."
        if result_payload.get("success") is False
        else "Native Great Expectations expectation passed.",
    }


def _great_expectations_availability() -> dict[str, Any]:
    try:
        module = import_module("great_expectations")
    except ModuleNotFoundError as exc:
        return {
            "status": "unavailable",
            "version": None,
            "reason": _human_readable_ge_reason(f"{exc.__class__.__name__}: {exc}"),
        }
    return {
        "status": "available",
        "version": getattr(module, "__version__", None),
        "reason": "",
    }


def _human_readable_ge_reason(reason: str) -> str:
    text = str(reason or "").strip()
    if "ModuleNotFoundError" in text and "great_expectations" in text:
        return (
            "Great Expectations is not installed in this local environment. "
            "VSF still ran against seeded ground truth; install the optional "
            "evaluation extra to run GE-native checks."
        )
    if "PandasDataset" in text:
        return (
            "The installed Great Expectations version does not expose the legacy "
            "PandasDataset adapter used by this local benchmark."
        )
    return text


def _usefulness_summary(
    action_plans: dict[str, Any],
    actual_issues: list[dict[str, Any]],
) -> dict[str, Any]:
    plans = action_plans.get("plans") if isinstance(action_plans.get("plans"), list) else []
    evidence_scores = [
        int(plan.get("evidence_coverage", {}).get("score"))
        for plan in plans
        if isinstance(plan.get("evidence_coverage", {}).get("score"), int)
    ]
    actionability_scores = [
        int(plan.get("actionability_score", {}).get("score"))
        for plan in plans
        if isinstance(plan.get("actionability_score", {}).get("score"), int)
    ]
    summary = action_plans.get("summary") if isinstance(action_plans.get("summary"), dict) else {}
    sample_count = sum(1 for issue in actual_issues if issue.get("sample_bad_rows_path"))
    return {
        "issue_action_plan_count": len(plans),
        "issue_action_plan_source": summary.get("source", "deterministic"),
        "human_review_count": int(summary.get("human_review_count") or 0),
        "average_evidence_coverage_score": round(mean(evidence_scores), 2)
        if evidence_scores
        else 0,
        "average_actionability_score": round(mean(actionability_scores), 2)
        if actionability_scores
        else float(summary.get("average_actionability_score") or 0),
        "sample_evidence_count": sample_count,
        "guidance_coverage_rate": _rate(len(plans), len(actual_issues)),
    }


def _signature_payload(issue: dict[str, Any]) -> dict[str, Any]:
    return {
        "issue_type": str(issue.get("issue_type") or ""),
        "table": str(issue.get("table") or ""),
        "columns": [str(column) for column in (issue.get("columns") or [])],
        "parent_table": str(issue.get("parent_table") or ""),
        "parent_columns": [str(column) for column in (issue.get("parent_columns") or [])],
    }


def _signature_key(issue: dict[str, Any]) -> str:
    signature = _signature_payload(issue)
    return "|".join(
        [
            signature["issue_type"],
            signature["table"],
            ",".join(signature["columns"]),
            signature["parent_table"],
            ",".join(signature["parent_columns"]),
        ]
    )


def _dataset_payload(spec: EvaluationDatasetSpec) -> dict[str, Any]:
    return {
        "dataset_id": spec.dataset_id,
        "label": spec.label,
        "summary": spec.summary,
        "domain": spec.domain,
        "table_count": spec.expected_table_count,
        "target": spec.target,
        "source_name": spec.source_name,
        "source_url": spec.source_url,
        "source_license": spec.source_license,
        "source_local_path": spec.source_local_path,
    }


def _read_public_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(
            f"Public evaluation source snapshot is missing: {path}. "
            "Restore data/evaluation_public before running Evaluate."
        )
    with path.open("r", newline="", encoding="utf-8") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def _read_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, list) else []


def _read_json_dict(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def _write_csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)


def _rate(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round(numerator / denominator, 6)
