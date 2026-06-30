(function () {
  const demoDbml = `Table customers {
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
}`;

  const demoCsvs = [
    { name: "customers.csv", stem: "customers", columns: ["customer_id", "customer_name", "customer_state"], size: 112 },
    {
      name: "orders.csv",
      stem: "orders",
      columns: [
        "order_id",
        "customer_id",
        "order_status",
        "order_purchase_timestamp",
        "order_delivered_customer_date",
      ],
      size: 370,
    },
    {
      name: "order_items.csv",
      stem: "order_items",
      columns: ["order_id", "order_item_id", "product_id", "seller_id", "price", "freight_value"],
      size: 183,
    },
    {
      name: "order_payments.csv",
      stem: "order_payments",
      columns: ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"],
      size: 159,
    },
    {
      name: "order_reviews.csv",
      stem: "order_reviews",
      columns: ["review_id", "order_id", "review_score", "review_comment_message"],
      size: 146,
    },
    { name: "products.csv", stem: "products", columns: ["product_id", "product_category_name"], size: 64 },
    { name: "sellers.csv", stem: "sellers", columns: ["seller_id", "seller_state"], size: 42 },
  ];

  const olistDemoDbml = `Table olist_customers_dataset {
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
}`;

  const olistDemoCsvs = [
    {
      name: "olist_customers_dataset.csv",
      stem: "olist_customers_dataset",
      columns: ["customer_id", "customer_unique_id", "customer_zip_code_prefix", "customer_city", "customer_state"],
      size: 9033957,
    },
    {
      name: "olist_geolocation_dataset.csv",
      stem: "olist_geolocation_dataset",
      columns: ["geolocation_zip_code_prefix", "geolocation_lat", "geolocation_lng", "geolocation_city", "geolocation_state"],
      size: 61273883,
    },
    {
      name: "olist_order_items_dataset.csv",
      stem: "olist_order_items_dataset",
      columns: ["order_id", "order_item_id", "product_id", "seller_id", "shipping_limit_date", "price", "freight_value"],
      size: 15438671,
    },
    {
      name: "olist_order_payments_dataset.csv",
      stem: "olist_order_payments_dataset",
      columns: ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"],
      size: 5777138,
    },
    {
      name: "olist_order_reviews_dataset.csv",
      stem: "olist_order_reviews_dataset",
      columns: ["review_id", "order_id", "review_score", "review_comment_title", "review_comment_message", "review_creation_date", "review_answer_timestamp"],
      size: 14451670,
    },
    {
      name: "olist_orders_dataset.csv",
      stem: "olist_orders_dataset",
      columns: ["order_id", "customer_id", "order_status", "order_purchase_timestamp", "order_approved_at", "order_delivered_carrier_date", "order_delivered_customer_date", "order_estimated_delivery_date"],
      size: 17654914,
    },
    {
      name: "olist_products_dataset.csv",
      stem: "olist_products_dataset",
      columns: ["product_id", "product_category_name", "product_name_lenght", "product_description_lenght", "product_photos_qty", "product_weight_g", "product_length_cm", "product_height_cm", "product_width_cm"],
      size: 2379446,
    },
    {
      name: "olist_sellers_dataset.csv",
      stem: "olist_sellers_dataset",
      columns: ["seller_id", "seller_zip_code_prefix", "seller_city", "seller_state"],
      size: 174703,
    },
    {
      name: "product_category_name_translation.csv",
      stem: "product_category_name_translation",
      columns: ["product_category_name", "product_category_name_english"],
      size: 2613,
    },
  ];

  const demoPresets = {
    small: {
      label: "Small demo",
      dbmlName: "demo_schema.dbml",
      dbmlPath: "data/demo_small/schema.dbml",
      csvDir: "data/demo_small/csv",
      target: "order_reviews.review_score",
      dbmlText: demoDbml,
      csvs: demoCsvs,
    },
    smallCorrected: {
      label: "Corrected small demo",
      dbmlName: "demo_schema_corrected.dbml",
      dbmlPath: "data/demo_small_corrected/schema.dbml",
      csvDir: "data/demo_small_corrected/csv",
      target: "order_reviews.review_score",
      dbmlText: demoDbml,
      csvs: [
        { name: "customers.csv", stem: "customers", columns: ["customer_id", "customer_name", "customer_state"], size: 95 },
        {
          name: "orders.csv",
          stem: "orders",
          columns: [
            "order_id",
            "customer_id",
            "order_status",
            "order_purchase_timestamp",
            "order_delivered_customer_date",
          ],
          size: 308,
        },
        {
          name: "order_items.csv",
          stem: "order_items",
          columns: ["order_id", "order_item_id", "product_id", "seller_id", "price", "freight_value"],
          size: 178,
        },
        {
          name: "order_payments.csv",
          stem: "order_payments",
          columns: ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"],
          size: 154,
        },
        {
          name: "order_reviews.csv",
          stem: "order_reviews",
          columns: ["review_id", "order_id", "review_score", "review_comment_message"],
          size: 135,
        },
        { name: "products.csv", stem: "products", columns: ["product_id", "product_category_name"], size: 61 },
        { name: "sellers.csv", stem: "sellers", columns: ["seller_id", "seller_state"], size: 39 },
      ],
    },
    olist: {
      label: "Legacy Olist sample",
      dbmlName: "olist_schema.dbml",
      dbmlPath: "examples/olist/schema.dbml",
      csvDir: "data/olist",
      dbmlText: olistDemoDbml,
      csvs: olistDemoCsvs,
    },
  };

  window.VSF_DEMO_DATA = {
    demoPresets,
  };
}());
