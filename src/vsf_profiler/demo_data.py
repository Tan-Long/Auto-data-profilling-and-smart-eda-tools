from __future__ import annotations

import csv
import shutil
import subprocess
import zipfile
from pathlib import Path


SMALL_SCHEMA = """Table customers {
  customer_id varchar [pk, not null]
  customer_name varchar [not null]
  customer_state varchar
}

Table orders {
  order_id varchar [pk, not null]
  customer_id varchar [ref: > customers.customer_id]
  order_status varchar
  order_purchase_timestamp timestamp
  order_delivered_customer_date timestamp
}

Table order_items {
  order_id varchar [ref: > orders.order_id]
  order_item_id int
  product_id varchar [ref: > products.product_id]
  seller_id varchar [ref: > sellers.seller_id]
  price float
  freight_value float

  indexes {
    (order_id, order_item_id) [pk]
  }
}

Table order_payments {
  order_id varchar [ref: > orders.order_id]
  payment_sequential int
  payment_type varchar
  payment_installments int
  payment_value float
}

Table order_reviews {
  review_id varchar [pk, not null]
  order_id varchar [ref: > orders.order_id]
  review_score int
  review_comment_message varchar
}

Table products {
  product_id varchar [pk, not null]
  product_category_name varchar
}

Table sellers {
  seller_id varchar [pk, not null]
  seller_state varchar
}
"""


SMALL_RULES = """rules:
  order_reviews:
    - id: REVIEW_SCORE_RANGE
      type: range
      column: review_score
      min: 1
      max: 5
      severity: P1

  order_payments:
    - id: PAYMENT_VALUE_NON_NEGATIVE
      type: range
      column: payment_value
      min: 0
      severity: P1

  order_items:
    - id: PRICE_NON_NEGATIVE
      type: range
      column: price
      min: 0
      severity: P1

  orders:
    - id: DELIVERED_AFTER_PURCHASE
      type: expression
      columns:
        - order_purchase_timestamp
        - order_delivered_customer_date
      expression: "order_delivered_customer_date >= order_purchase_timestamp"
      where: "order_delivered_customer_date IS NOT NULL"
      severity: P1
"""


OLIST_SAMPLE_SCHEMA = """Table olist_customers_dataset {
  customer_id varchar [pk, not null]
  customer_unique_id varchar
  customer_zip_code_prefix int
  customer_city varchar
  customer_state varchar
}

Table olist_orders_dataset {
  order_id varchar [pk, not null]
  customer_id varchar [ref: > olist_customers_dataset.customer_id]
  order_status varchar
  order_purchase_timestamp timestamp
  order_approved_at timestamp
  order_delivered_carrier_date timestamp
  order_delivered_customer_date timestamp
  order_estimated_delivery_date timestamp
}

Table olist_order_items_dataset {
  order_id varchar [ref: > olist_orders_dataset.order_id]
  order_item_id int
  product_id varchar [ref: > olist_products_dataset.product_id]
  seller_id varchar [ref: > olist_sellers_dataset.seller_id]
  shipping_limit_date timestamp
  price float
  freight_value float

  indexes {
    (order_id, order_item_id) [pk]
  }
}

Table olist_order_payments_dataset {
  order_id varchar [ref: > olist_orders_dataset.order_id]
  payment_sequential int
  payment_type varchar
  payment_installments int
  payment_value float
}

Table olist_order_reviews_dataset {
  review_id varchar
  order_id varchar [ref: > olist_orders_dataset.order_id]
  review_score int
  review_comment_title varchar
  review_comment_message varchar
  review_creation_date timestamp
  review_answer_timestamp timestamp
}

Table olist_products_dataset {
  product_id varchar [pk, not null]
  product_category_name varchar [ref: > product_category_name_translation.product_category_name]
  product_name_lenght int
  product_description_lenght int
  product_photos_qty int
  product_weight_g float
  product_length_cm float
  product_height_cm float
  product_width_cm float
}

Table olist_sellers_dataset {
  seller_id varchar [pk, not null]
  seller_zip_code_prefix int
  seller_city varchar
  seller_state varchar
}

Table product_category_name_translation {
  product_category_name varchar [pk, not null]
  product_category_name_english varchar
}

Table olist_geolocation_dataset {
  geolocation_zip_code_prefix int
  geolocation_lat float
  geolocation_lng float
  geolocation_city varchar
  geolocation_state varchar
}
"""


OLIST_SAMPLE_RULES = """rules:
  olist_order_reviews_dataset:
    - id: REVIEW_SCORE_RANGE
      type: range
      column: review_score
      min: 1
      max: 5
      severity: P1

  olist_order_payments_dataset:
    - id: PAYMENT_VALUE_NON_NEGATIVE
      type: range
      column: payment_value
      min: 0
      severity: P1

  olist_order_items_dataset:
    - id: PRICE_NON_NEGATIVE
      type: range
      column: price
      min: 0
      severity: P1

    - id: FREIGHT_VALUE_NON_NEGATIVE
      type: range
      column: freight_value
      min: 0
      severity: P2

  olist_orders_dataset:
    - id: ORDER_STATUS_VALID
      type: accepted_values
      column: order_status
      values:
        - delivered
        - shipped
        - canceled
        - unavailable
        - invoiced
        - processing
        - created
        - approved
      severity: P2

    - id: DELIVERED_AFTER_PURCHASE
      type: expression
      columns:
        - order_purchase_timestamp
        - order_delivered_customer_date
      expression: "order_delivered_customer_date >= order_purchase_timestamp"
      where: "order_delivered_customer_date IS NOT NULL"
      severity: P1
"""


def create_small_demo(out: str | Path) -> Path:
    root = Path(out)
    csv_dir = root / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    (root / "schema.dbml").write_text(SMALL_SCHEMA)
    (root / "rules.yaml").write_text(SMALL_RULES)

    _write_csv(
        csv_dir / "customers.csv",
        ["customer_id", "customer_name", "customer_state"],
        [
            ["C001", "Alice", "SP"],
            ["C002", "Bob", "RJ"],
            ["", "Missing Customer Id", "MG"],
            ["C004", "unknown", "BA"],
        ],
    )
    _write_csv(
        csv_dir / "orders.csv",
        [
            "order_id",
            "customer_id",
            "order_status",
            "order_purchase_timestamp",
            "order_delivered_customer_date",
        ],
        [
            ["O001", "C001", "delivered", "2024-01-01 10:00:00", "2024-01-03 10:00:00"],
            ["O002", "C002", "delivered", "2024-01-02 10:00:00", "2024-01-01 09:00:00"],
            ["O002", "C002", "delivered", "2024-01-02 10:00:00", "2024-01-04 10:00:00"],
            ["O003", "C999", "delivered", "2024-01-05 10:00:00", "2024-01-06 10:00:00"],
            ["O004", "", "created", "2024-01-07 10:00:00", ""],
        ],
    )
    _write_csv(
        csv_dir / "order_items.csv",
        ["order_id", "order_item_id", "product_id", "seller_id", "price", "freight_value"],
        [
            ["O001", "1", "P001", "S001", "100.00", "10.00"],
            ["O002", "1", "P002", "S001", "50.00", "5.00"],
            ["O003", "1", "P999", "S002", "25.00", "2.50"],
            ["O004", "1", "P001", "S999", "10.00", "1.00"],
        ],
    )
    _write_csv(
        csv_dir / "order_payments.csv",
        ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"],
        [
            ["O001", "1", "credit_card", "1", "110.00"],
            ["O002", "1", "credit_card", "2", "-25.00"],
            ["O003", "1", "voucher", "1", "27.50"],
        ],
    )
    _write_csv(
        csv_dir / "order_reviews.csv",
        ["review_id", "order_id", "review_score", "review_comment_message"],
        [
            ["R001", "O001", "5", "great"],
            ["R002", "O002", "1", "late"],
            ["R003", "O003", "9", "invalid score"],
            ["R004", "O999", "2", "orphan order"],
        ],
    )
    _write_csv(
        csv_dir / "products.csv",
        ["product_id", "product_category_name"],
        [["P001", "books"], ["P002", "electronics"]],
    )
    _write_csv(
        csv_dir / "sellers.csv",
        ["seller_id", "seller_state"],
        [["S001", "SP"], ["S002", "RJ"]],
    )
    return root


def create_olist_sample(out: str | Path) -> Path:
    root = Path(out)
    csv_dir = root / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    (root / "schema.dbml").write_text(OLIST_SAMPLE_SCHEMA)
    (root / "rules.yaml").write_text(OLIST_SAMPLE_RULES)

    _write_csv(
        csv_dir / "olist_customers_dataset.csv",
        [
            "customer_id",
            "customer_unique_id",
            "customer_zip_code_prefix",
            "customer_city",
            "customer_state",
        ],
        [
            ["C001", "CU001", "1001", "sao paulo", "SP"],
            ["C002", "CU002", "2002", "rio de janeiro", "RJ"],
            ["", "CU003", "3003", "belo horizonte", "MG"],
            ["C004", "CU004", "4004", "salvador", "BA"],
        ],
    )
    _write_csv(
        csv_dir / "olist_orders_dataset.csv",
        [
            "order_id",
            "customer_id",
            "order_status",
            "order_purchase_timestamp",
            "order_approved_at",
            "order_delivered_carrier_date",
            "order_delivered_customer_date",
            "order_estimated_delivery_date",
        ],
        [
            [
                "O001",
                "C001",
                "delivered",
                "2024-01-01 10:00:00",
                "2024-01-01 11:00:00",
                "2024-01-02 08:00:00",
                "2024-01-03 10:00:00",
                "2024-01-05 10:00:00",
            ],
            [
                "O002",
                "C002",
                "delivered",
                "2024-01-02 10:00:00",
                "2024-01-02 11:00:00",
                "2024-01-03 08:00:00",
                "2024-01-01 09:00:00",
                "2024-01-07 10:00:00",
            ],
            [
                "O002",
                "C002",
                "delivered",
                "2024-01-02 10:00:00",
                "2024-01-02 11:00:00",
                "2024-01-03 08:00:00",
                "2024-01-04 10:00:00",
                "2024-01-07 10:00:00",
            ],
            [
                "O003",
                "C999",
                "delivered",
                "2024-01-05 10:00:00",
                "2024-01-05 11:00:00",
                "2024-01-05 18:00:00",
                "2024-01-06 10:00:00",
                "2024-01-08 10:00:00",
            ],
            [
                "O004",
                "",
                "created",
                "2024-01-07 10:00:00",
                "",
                "",
                "",
                "2024-01-12 10:00:00",
            ],
        ],
    )
    _write_csv(
        csv_dir / "olist_order_items_dataset.csv",
        [
            "order_id",
            "order_item_id",
            "product_id",
            "seller_id",
            "shipping_limit_date",
            "price",
            "freight_value",
        ],
        [
            ["O001", "1", "P001", "S001", "2024-01-04 10:00:00", "100.00", "10.00"],
            ["O002", "1", "P002", "S001", "2024-01-05 10:00:00", "50.00", "5.00"],
            ["O003", "1", "P999", "S002", "2024-01-07 10:00:00", "25.00", "2.50"],
            ["O004", "1", "P001", "S999", "2024-01-08 10:00:00", "10.00", "1.00"],
        ],
    )
    _write_csv(
        csv_dir / "olist_order_payments_dataset.csv",
        ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"],
        [
            ["O001", "1", "credit_card", "1", "110.00"],
            ["O002", "1", "credit_card", "2", "-25.00"],
            ["O003", "1", "voucher", "1", "27.50"],
        ],
    )
    _write_csv(
        csv_dir / "olist_order_reviews_dataset.csv",
        [
            "review_id",
            "order_id",
            "review_score",
            "review_comment_title",
            "review_comment_message",
            "review_creation_date",
            "review_answer_timestamp",
        ],
        [
            ["R001", "O001", "5", "great", "fast delivery", "2024-01-04", "2024-01-04"],
            ["R002", "O002", "1", "late", "arrived late", "2024-01-05", "2024-01-05"],
            ["R003", "O003", "9", "invalid score", "score outside range", "2024-01-07", "2024-01-07"],
            ["R004", "O999", "2", "orphan order", "missing order reference", "2024-01-08", "2024-01-08"],
        ],
    )
    _write_csv(
        csv_dir / "olist_products_dataset.csv",
        [
            "product_id",
            "product_category_name",
            "product_name_lenght",
            "product_description_lenght",
            "product_photos_qty",
            "product_weight_g",
            "product_length_cm",
            "product_height_cm",
            "product_width_cm",
        ],
        [
            ["P001", "books", "12", "100", "1", "500", "20", "5", "15"],
            ["P002", "electronics", "20", "200", "3", "700", "25", "8", "18"],
        ],
    )
    _write_csv(
        csv_dir / "olist_sellers_dataset.csv",
        ["seller_id", "seller_zip_code_prefix", "seller_city", "seller_state"],
        [["S001", "1001", "sao paulo", "SP"], ["S002", "2002", "rio de janeiro", "RJ"]],
    )
    _write_csv(
        csv_dir / "product_category_name_translation.csv",
        ["product_category_name", "product_category_name_english"],
        [["books", "books"]],
    )
    _write_csv(
        csv_dir / "olist_geolocation_dataset.csv",
        ["geolocation_zip_code_prefix", "geolocation_lat", "geolocation_lng", "geolocation_city", "geolocation_state"],
        [["1001", "-23.55", "-46.63", "sao paulo", "SP"], ["2002", "-22.90", "-43.17", "rio de janeiro", "RJ"]],
    )
    return root


def download_olist(out: str | Path) -> Path:
    root = Path(out)
    root.mkdir(parents=True, exist_ok=True)
    if shutil.which("kaggle") is None:
        raise RuntimeError(
            "Kaggle CLI is not installed. Run: pip install kaggle && kaggle auth login "
            "or configure ~/.kaggle/kaggle.json"
        )
    try:
        subprocess.run(
            ["kaggle", "datasets", "download", "-d", "olistbr/brazilian-ecommerce", "-p", str(root)],
            check=True,
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            "Kaggle download failed. Run: pip install kaggle && kaggle auth login "
            "or configure ~/.kaggle/kaggle.json"
        ) from exc

    zip_path = root / "brazilian-ecommerce.zip"
    if zip_path.exists():
        with zipfile.ZipFile(zip_path) as archive:
            archive.extractall(root)
    return root


def _write_csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)
