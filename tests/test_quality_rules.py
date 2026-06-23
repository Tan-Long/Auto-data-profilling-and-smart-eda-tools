import json

from vsf_profiler.cli import run_pipeline
from vsf_profiler.demo_data import create_small_demo


def test_yaml_rules_emit_specific_issue_types(tmp_path):
    data_dir = create_small_demo(tmp_path / "demo")
    out_dir = tmp_path / "out"
    rules_path = tmp_path / "business_rules.yaml"
    rules_path.write_text(
        """
rules:
  order_reviews:
    - type: range
      column: review_rating
      min: 1
      max: 5
      severity: P1
  order_payments:
    - type: range
      column: payment_value
      min: 0
      severity: P1
  orders:
    - type: expression
      columns:
        - order_purchase_timestamp
        - order_delivered_customer_date
      expression: "order_delivered_customer_date >= order_purchase_timestamp"
      where: "order_delivered_customer_date IS NOT NULL"
      severity: P1
""",
        encoding="utf-8",
    )

    run_pipeline(
        dbml_path=data_dir / "schema.dbml",
        csv_dir=data_dir / "csv",
        rules_path=rules_path,
        out_dir=out_dir,
    )

    issues = json.loads((out_dir / "issues.json").read_text())
    by_type = {issue["issue_type"]: issue for issue in issues}
    assert by_type["VALUE_OUT_OF_RANGE"]["table"] == "order_reviews"
    assert by_type["NEGATIVE_VALUE_NOT_ALLOWED"]["table"] == "order_payments"
    assert by_type["DATE_ORDER_INVALID"]["table"] == "orders"
