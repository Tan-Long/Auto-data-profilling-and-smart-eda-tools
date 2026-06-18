const state = {
  dbmlText: "",
  dbmlName: "",
  dbmlFile: null,
  rulesFile: null,
  runnerMode: "upload",
  runnerAvailable: false,
  currentJob: null,
  runEvents: [],
  eventSource: null,
  dashboardArtifactIndex: null,
  dashboardLoadingJobId: "",
  dashboardArtifacts: {},
  dashboardFilters: {
    severity: "all",
    issueType: "all",
    table: "all",
  },
  dashboardSelection: null,
  artifactPreviewRequestId: 0,
  dashboardGraphMode: "lineage",
  dashboardGraphDisplay: "overview",
  dashboardGraphScope: "table",
  dashboardGraphShowColumns: false,
  dashboardGraphShowRuntime: false,
  dashboardGraphInvalidOnly: false,
  dashboardGraphSelection: null,
  diagramSelection: null,
  diagramExpanded: false,
  diagramShowNonKey: true,
  diagramFit: true,
  tables: [],
  relationships: [],
  csvFiles: [],
  mapping: new Map(),
};

const els = {
  dbmlInput: document.querySelector("#dbmlInput"),
  csvInput: document.querySelector("#csvInput"),
  dbmlDropzone: document.querySelector("#dbmlDropzone"),
  csvDropzone: document.querySelector("#csvDropzone"),
  dbmlStatus: document.querySelector("#dbmlStatus"),
  csvStatus: document.querySelector("#csvStatus"),
  mappingStatus: document.querySelector("#mappingStatus"),
  runnerStatus: document.querySelector("#runnerStatus"),
  dbmlStatusCard: document.querySelector("#dbmlStatusCard"),
  csvStatusCard: document.querySelector("#csvStatusCard"),
  mappingStatusCard: document.querySelector("#mappingStatusCard"),
  runnerStatusCard: document.querySelector("#runnerStatusCard"),
  tableCountBadge: document.querySelector("#tableCountBadge"),
  csvCountBadge: document.querySelector("#csvCountBadge"),
  dbmlFileCard: document.querySelector("#dbmlFileCard"),
  dbmlFileName: document.querySelector("#dbmlFileName"),
  dbmlFileMeta: document.querySelector("#dbmlFileMeta"),
  rulesInput: document.querySelector("#rulesInput"),
  rulesFileCard: document.querySelector("#rulesFileCard"),
  rulesFileName: document.querySelector("#rulesFileName"),
  rulesFileMeta: document.querySelector("#rulesFileMeta"),
  targetInput: document.querySelector("#targetInput"),
  pathTargetInput: document.querySelector("#pathTargetInput"),
  runnerModeUpload: document.querySelector("#runnerModeUpload"),
  runnerModePath: document.querySelector("#runnerModePath"),
  runnerForm: document.querySelector("#runnerForm"),
  pathRunnerForm: document.querySelector("#pathRunnerForm"),
  runProfilerButton: document.querySelector("#runProfilerButton"),
  runPathProfilerButton: document.querySelector("#runPathProfilerButton"),
  dbmlPathInput: document.querySelector("#dbmlPathInput"),
  csvDirPathInput: document.querySelector("#csvDirPathInput"),
  rulesPathInput: document.querySelector("#rulesPathInput"),
  runnerMessage: document.querySelector("#runnerMessage"),
  jobStatusBadge: document.querySelector("#jobStatusBadge"),
  eventCount: document.querySelector("#eventCount"),
  stageList: document.querySelector("#stageList"),
  artifactCount: document.querySelector("#artifactCount"),
  artifactList: document.querySelector("#artifactList"),
  dashboardStatusBadge: document.querySelector("#dashboardStatusBadge"),
  dashboardIssueCount: document.querySelector("#dashboardIssueCount"),
  dashboardSeverityFilter: document.querySelector("#dashboardSeverityFilter"),
  dashboardIssueTypeFilter: document.querySelector("#dashboardIssueTypeFilter"),
  dashboardTableFilter: document.querySelector("#dashboardTableFilter"),
  dashboardResetFilters: document.querySelector("#dashboardResetFilters"),
  dashboardMessage: document.querySelector("#dashboardMessage"),
  dashboardSummaryStrip: document.querySelector("#dashboardSummaryStrip"),
  tableImpactStatus: document.querySelector("#tableImpactStatus"),
  tableImpactGrid: document.querySelector("#tableImpactGrid"),
  dashboardPanelGrid: document.querySelector("#dashboardPanelGrid"),
  dashboardGraphModeLineage: document.querySelector("#dashboardGraphModeLineage"),
  dashboardGraphModeRelationship: document.querySelector("#dashboardGraphModeRelationship"),
  dashboardGraphDisplayOverview: document.querySelector("#dashboardGraphDisplayOverview"),
  dashboardGraphDisplayFocus: document.querySelector("#dashboardGraphDisplayFocus"),
  dashboardGraphDisplayFull: document.querySelector("#dashboardGraphDisplayFull"),
  dashboardGraphScope: document.querySelector("#dashboardGraphScope"),
  dashboardGraphColumnsToggle: document.querySelector("#dashboardGraphColumnsToggle"),
  dashboardGraphRuntimeToggle: document.querySelector("#dashboardGraphRuntimeToggle"),
  dashboardGraphInvalidOnlyToggle: document.querySelector("#dashboardGraphInvalidOnlyToggle"),
  dashboardGraphResetView: document.querySelector("#dashboardGraphResetView"),
  dashboardGraphStatus: document.querySelector("#dashboardGraphStatus"),
  dashboardGraphSvg: document.querySelector("#dashboardGraphSvg"),
  dashboardGraphLegend: document.querySelector("#dashboardGraphLegend"),
  dashboardGraphDrilldown: document.querySelector("#dashboardGraphDrilldown"),
  dashboardGraphDrilldownMeta: document.querySelector("#dashboardGraphDrilldownMeta"),
  dashboardDrilldown: document.querySelector("#dashboardDrilldown"),
  dashboardDrilldownMeta: document.querySelector("#dashboardDrilldownMeta"),
  dashboardArtifactCount: document.querySelector("#dashboardArtifactCount"),
  dashboardArtifactLinks: document.querySelector("#dashboardArtifactLinks"),
  artifactPreview: document.querySelector("#artifactPreview"),
  artifactPreviewMeta: document.querySelector("#artifactPreviewMeta"),
  csvList: document.querySelector("#csvList"),
  csvTemplate: document.querySelector("#csvItemTemplate"),
  visualizeButton: document.querySelector("#visualizeButton"),
  autoLinkButton: document.querySelector("#autoLinkButton"),
  dbdiagramLink: document.querySelector("#dbdiagramLink"),
  diagramFrame: document.querySelector("#diagramFrame"),
  diagramEmpty: document.querySelector("#diagramEmpty"),
  diagramMessage: document.querySelector("#diagramMessage"),
  diagramSourceBadge: document.querySelector("#diagramSourceBadge"),
  diagramWarnings: document.querySelector("#diagramWarnings"),
  localDiagram: document.querySelector("#localDiagram"),
  diagramCanvas: document.querySelector("#diagramCanvas"),
  diagramSvg: document.querySelector("#diagramSvg"),
  diagramInspector: document.querySelector("#diagramInspector"),
  diagramFitButton: document.querySelector("#diagramFitButton"),
  diagramDensityToggle: document.querySelector("#diagramDensityToggle"),
  diagramColumnsToggle: document.querySelector("#diagramColumnsToggle"),
  diagramResetSelection: document.querySelector("#diagramResetSelection"),
  mappedMetric: document.querySelector("#mappedMetric"),
  missingMetric: document.querySelector("#missingMetric"),
  extraMetric: document.querySelector("#extraMetric"),
  edgeList: document.querySelector("#edgeList"),
  mappingBody: document.querySelector("#mappingBody"),
  loadDemoButton: document.querySelector("#loadDemoButton"),
};

const demoDbml = `Table olist_customers_dataset {
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

Table olist_order_reviews_dataset {
  review_id varchar
  order_id varchar [ref: > olist_orders_dataset.order_id]
  review_score int
  review_comment_title varchar
  review_comment_message varchar
  review_creation_date timestamp
  review_answer_timestamp timestamp
}

Table olist_order_payments_dataset {
  order_id varchar [ref: > olist_orders_dataset.order_id]
  payment_sequential int
  payment_type varchar
  payment_installments int
  payment_value float
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

const demoCsvs = [
  {
    name: "olist_customers_dataset.csv",
    columns: [
      "customer_id",
      "customer_unique_id",
      "customer_zip_code_prefix",
      "customer_city",
      "customer_state",
    ],
    size: 220,
  },
  {
    name: "olist_orders_dataset.csv",
    columns: [
      "order_id",
      "customer_id",
      "order_status",
      "order_purchase_timestamp",
      "order_approved_at",
      "order_delivered_carrier_date",
      "order_delivered_customer_date",
      "order_estimated_delivery_date",
    ],
    size: 620,
  },
  {
    name: "olist_order_items_dataset.csv",
    columns: [
      "order_id",
      "order_item_id",
      "product_id",
      "seller_id",
      "shipping_limit_date",
      "price",
      "freight_value",
    ],
    size: 260,
  },
  {
    name: "olist_order_payments_dataset.csv",
    columns: ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"],
    size: 159,
  },
  {
    name: "olist_order_reviews_dataset.csv",
    columns: [
      "review_id",
      "order_id",
      "review_score",
      "review_comment_title",
      "review_comment_message",
      "review_creation_date",
      "review_answer_timestamp",
    ],
    size: 310,
  },
  {
    name: "olist_products_dataset.csv",
    columns: [
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
    size: 250,
  },
  {
    name: "olist_sellers_dataset.csv",
    columns: ["seller_id", "seller_zip_code_prefix", "seller_city", "seller_state"],
    size: 132,
  },
  {
    name: "product_category_name_translation.csv",
    columns: ["product_category_name", "product_category_name_english"],
    size: 64,
  },
  {
    name: "olist_geolocation_dataset.csv",
    columns: [
      "geolocation_zip_code_prefix",
      "geolocation_lat",
      "geolocation_lng",
      "geolocation_city",
      "geolocation_state",
    ],
    size: 148,
  },
];

function csvStemFromName(name) {
  return String(name || "").replace(/\.csv$/i, "");
}

function normalizeCsvFile(file) {
  const name = file.name || `${file.stem || "table"}.csv`;
  return {
    ...file,
    name,
    stem: file.stem || csvStemFromName(name),
  };
}

const dashboardChartPaths = {
  risk: "charts/dataset_verdict_risk_summary.json",
  severity: "charts/issue_counts_by_severity.json",
  type: "charts/issue_counts_by_type.json",
  missingTable: "charts/missingness_by_table.json",
  missingColumns: "charts/missingness_top_columns.json",
  relationship: "charts/relationship_fk_health.json",
  influence: "charts/influence_top_features.json",
};

const dashboardMachineArtifacts = [
  "issues.json",
  "profile_summary.json",
  "relationship_graph.json",
  "dataset_verdict.json",
  "table_assessments.json",
  "schema_evaluation.json",
  "lineage_graph.json",
  "influence.json",
  "run_summary.json",
];

const graphScopeLabels = {
  table: "Tables",
  columns: "Columns",
  relationships: "Relationships",
  runtime: "Runtime + artifacts",
};

const graphDisplayLabels = {
  overview: "Overview",
  focus: "Focus",
  full: "Full",
};

const lineageTypeToCategory = {
  source_system: "source",
  schema: "schema",
  table: "table",
  column: "column",
  relationship: "relationship",
  profiler_stage: "stage",
  artifact: "artifact",
};

const graphCategoryLabels = {
  source: "Source",
  schema: "Schema",
  table: "Table",
  column: "Column",
  relationship: "Relationship",
  stage: "Runtime stage",
  artifact: "Artifact",
};

const lineageCategoryOrder = ["source", "schema", "table", "column", "relationship", "stage", "artifact"];
const relationshipCategoryOrder = ["table", "column", "relationship", "artifact"];
const relationshipIssueTypes = new Set([
  "ORPHAN_FOREIGN_KEY",
  "PARENT_KEY_DUPLICATE",
  "FOREIGN_KEY_NULL",
  "CHILD_RELATIONSHIP_DUPLICATE",
]);

const severityOrder = ["P0", "P1", "P2", "P3"];
const localDiagramLimits = {
  tables: 24,
  relationships: 60,
};
const postRunDiagramArtifacts = ["schema_diagram.json", "schema_evaluation.json"];

els.dbmlInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    await loadDbmlFile(file);
  }
});

els.csvInput.addEventListener("change", async (event) => {
  await loadCsvFiles([...event.target.files]);
});

els.rulesInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    state.rulesFile = file;
  } else {
    state.rulesFile = null;
  }
  renderAll();
});

els.visualizeButton.addEventListener("click", () => {
  renderDiagram();
});

els.diagramFitButton.addEventListener("click", () => {
  state.diagramFit = !state.diagramFit;
  renderDiagram();
  els.diagramCanvas.scrollTo({ left: 0, top: 0, behavior: "smooth" });
});

els.diagramDensityToggle.addEventListener("click", () => {
  state.diagramExpanded = !state.diagramExpanded;
  renderDiagram();
});

els.diagramColumnsToggle.addEventListener("click", () => {
  state.diagramShowNonKey = !state.diagramShowNonKey;
  renderDiagram();
});

els.diagramResetSelection.addEventListener("click", () => {
  state.diagramSelection = null;
  renderDiagram();
});

els.autoLinkButton.addEventListener("click", () => {
  autoLinkCsvs();
  renderAll();
});

els.loadDemoButton.addEventListener("click", () => {
  loadDemoState();
});

els.runnerModeUpload.addEventListener("click", () => {
  setRunnerMode("upload");
});

els.runnerModePath.addEventListener("click", () => {
  setRunnerMode("path");
});

els.runnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startProfilerRun();
});

els.pathRunnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startPathRun();
});

[
  els.dbmlPathInput,
  els.csvDirPathInput,
  els.rulesPathInput,
  els.pathTargetInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    renderControls();
  });
});

[
  els.dashboardSeverityFilter,
  els.dashboardIssueTypeFilter,
  els.dashboardTableFilter,
].forEach((select) => {
  select.addEventListener("change", () => {
    state.dashboardFilters = {
      severity: els.dashboardSeverityFilter.value,
      issueType: els.dashboardIssueTypeFilter.value,
      table: els.dashboardTableFilter.value,
    };
    state.dashboardSelection = null;
    state.dashboardGraphSelection = null;
    renderDashboard();
  });
});

els.dashboardResetFilters.addEventListener("click", () => {
  state.dashboardFilters = { severity: "all", issueType: "all", table: "all" };
  state.dashboardSelection = null;
  state.dashboardGraphSelection = null;
  renderDashboard();
});

els.dashboardPanelGrid.addEventListener("click", (event) => {
  handleArtifactNavigationClick(event);
  if (event.defaultPrevented) {
    return;
  }
  handleDashboardSelectionClick(event);
});

els.tableImpactGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.artifactList.addEventListener("click", (event) => {
  handleArtifactNavigationClick(event);
});

els.stageList.addEventListener("click", (event) => {
  handleArtifactNavigationClick(event);
});

els.dashboardArtifactLinks.addEventListener("click", (event) => {
  handleArtifactNavigationClick(event);
});

els.dashboardDrilldown.addEventListener("click", (event) => {
  handleArtifactNavigationClick(event);
  if (event.defaultPrevented) {
    return;
  }
  handleDrilldownFilterClick(event);
});

els.artifactPreview.addEventListener("click", (event) => {
  handleArtifactNavigationClick(event);
});

els.diagramInspector.addEventListener("click", (event) => {
  handleArtifactNavigationClick(event);
});

function handleArtifactNavigationClick(event) {
  const target = event.target.closest("[data-artifact-action]");
  if (!target) {
    return;
  }
  const action = target.dataset.artifactAction;
  const artifactPath = target.dataset.artifactPath || "";
  const artifactUrl = target.dataset.artifactUrl || "";
  if (action === "preview-issue-sample") {
    event.preventDefault();
    previewIssueSample(target.dataset.issueId || "");
    return;
  }
  if (action === "preview-artifact") {
    event.preventDefault();
    previewArtifact(artifactPath, artifactUrl);
    return;
  }
  if (action === "focus-dashboard-artifact" && focusDashboardArtifact(artifactPath)) {
    event.preventDefault();
  }
}

function handleDashboardSelectionClick(event) {
  const target = event.target.closest("[data-dashboard-kind]");
  if (!target) {
    return;
  }
  state.dashboardSelection = {
    kind: target.dataset.dashboardKind,
    value: target.dataset.dashboardValue || "",
    label: target.dataset.dashboardLabel || target.textContent.trim(),
  };
  renderDashboardDrilldown();
  focusDashboardDrilldown();
}

function handleDrilldownFilterClick(event) {
  const target = event.target.closest("[data-drilldown-severity]");
  if (!target) {
    return;
  }
  event.preventDefault();
  setDrilldownSeverityFilter(target.dataset.drilldownSeverity || "all");
}

els.dashboardGraphModeLineage.addEventListener("click", () => {
  setDashboardGraphMode("lineage");
});

els.dashboardGraphModeRelationship.addEventListener("click", () => {
  setDashboardGraphMode("relationship");
});

els.dashboardGraphDisplayOverview.addEventListener("click", () => {
  setDashboardGraphDisplay("overview");
});

els.dashboardGraphDisplayFocus.addEventListener("click", () => {
  setDashboardGraphDisplay("focus");
});

els.dashboardGraphDisplayFull.addEventListener("click", () => {
  setDashboardGraphDisplay("full");
});

els.dashboardGraphColumnsToggle.addEventListener("change", () => {
  state.dashboardGraphShowColumns = els.dashboardGraphColumnsToggle.checked;
  syncDashboardGraphScopeFromControls();
  renderDashboardGraph();
});

els.dashboardGraphRuntimeToggle.addEventListener("change", () => {
  state.dashboardGraphShowRuntime = els.dashboardGraphRuntimeToggle.checked;
  syncDashboardGraphScopeFromControls();
  renderDashboardGraph();
});

els.dashboardGraphInvalidOnlyToggle.addEventListener("change", () => {
  state.dashboardGraphInvalidOnly = els.dashboardGraphInvalidOnlyToggle.checked;
  renderDashboardGraph();
});

els.dashboardGraphResetView.addEventListener("click", () => {
  resetDashboardGraphView();
});

els.dashboardGraphScope.addEventListener("change", () => {
  state.dashboardGraphScope = els.dashboardGraphScope.value;
  state.dashboardGraphSelection = null;
  syncDashboardGraphControlsFromScope();
  renderDashboardGraph();
});

els.dashboardGraphSvg.addEventListener("click", (event) => {
  const target = event.target.closest("[data-graph-node-id]");
  if (!target) {
    return;
  }
  state.dashboardGraphSelection = { id: target.dataset.graphNodeId };
  renderDashboardGraph();
});

els.dashboardGraphSvg.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  const target = event.target.closest("[data-graph-node-id]");
  if (!target) {
    return;
  }
  event.preventDefault();
  state.dashboardGraphSelection = { id: target.dataset.graphNodeId };
  renderDashboardGraph();
});

els.diagramSvg.addEventListener("click", (event) => {
  if (handleDiagramSelectionEvent(event)) {
    event.stopPropagation();
    return;
  }
  if (clearDiagramSelection()) {
    event.stopPropagation();
  }
});

els.diagramSvg.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  if (handleDiagramSelectionEvent(event)) {
    event.preventDefault();
  }
});

document.addEventListener("click", (event) => {
  if (
    state.diagramSelection &&
    !event.target.closest("#localDiagram") &&
    !event.target.closest(".diagram-toolbar") &&
    !event.target.closest("#diagramWarnings") &&
    !event.target.closest("#dbdiagramLink")
  ) {
    clearDiagramSelection();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.diagramSelection) {
    clearDiagramSelection();
  }
});

setupDropzone(els.dbmlDropzone, async (files) => {
  const dbml = files.find((file) => file.name.endsWith(".dbml")) || files[0];
  if (dbml) {
    await loadDbmlFile(dbml);
  }
});

setupDropzone(els.csvDropzone, async (files) => {
  await loadCsvFiles(files.filter((file) => file.name.endsWith(".csv")));
});

async function checkRunnerHealth() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    const payload = await response.json();
    state.runnerAvailable = response.ok && payload.host === "127.0.0.1";
    els.runnerMessage.textContent = state.runnerAvailable
      ? "Local backend is ready on 127.0.0.1."
      : "Open this page with vsf-profiler web to run the backend pipeline.";
  } catch (error) {
    state.runnerAvailable = false;
    els.runnerMessage.textContent = "Open this page with vsf-profiler web to run the backend pipeline.";
  }
  renderAll();
}

async function startProfilerRun() {
  const uploadableCsvs = state.csvFiles.filter((file) => file.sourceFile);
  if (!state.dbmlFile || !uploadableCsvs.length || !state.runnerAvailable) {
    renderRunnerMessage("Upload DBML and CSV files through this browser session first.", "error");
    return;
  }
  const form = new FormData();
  form.append("dbml", state.dbmlFile, state.dbmlFile.name);
  uploadableCsvs.forEach((file) => {
    form.append("csv", file.sourceFile, file.sourceFile.name);
  });
  if (state.rulesFile) {
    form.append("rules", state.rulesFile, state.rulesFile.name);
  }
  const target = els.targetInput.value.trim();
  if (target) {
    form.append("target", target);
  }

  state.runEvents = [];
  state.currentJob = { status: "queued", artifacts: [] };
  resetDashboardState();
  renderJob();
  renderRunnerMessage("Uploading files to local runner...", "pending");
  els.runProfilerButton.disabled = true;

  try {
    const response = await fetch("/api/jobs", { method: "POST", body: form });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Backend rejected the upload.");
    }
    state.currentJob = payload;
    renderRunnerMessage("Pipeline started. Runtime events are streaming from run_events.jsonl.", "pending");
    connectEventStream(payload.events_url);
  } catch (error) {
    renderRunnerMessage(error.message || "Unable to start local run.", "error");
  } finally {
    renderAll();
  }
}

async function startPathRun() {
  if (!state.runnerAvailable) {
    renderRunnerMessage("Open this page with vsf-profiler web to run the backend pipeline.", "error");
    return;
  }

  const dbmlPath = els.dbmlPathInput.value.trim();
  const csvDir = els.csvDirPathInput.value.trim();
  const rulesPath = els.rulesPathInput.value.trim();
  const target = els.pathTargetInput.value.trim();
  if (!dbmlPath || !csvDir) {
    renderRunnerMessage("DBML file path and CSV directory path are required.", "error");
    return;
  }

  const payload = {
    dbml_path: dbmlPath,
    csv_dir: csvDir,
  };
  if (rulesPath) {
    payload.rules_path = rulesPath;
  }
  if (target) {
    payload.target = target;
  }

  state.runEvents = [];
  state.currentJob = { status: "queued", input_mode: "path", artifacts: [] };
  resetDashboardState();
  renderJob();
  renderRunnerMessage("Starting local path job on 127.0.0.1...", "pending");
  els.runPathProfilerButton.disabled = true;

  try {
    const response = await fetch("/api/path-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responsePayload = await response.json();
    if (!response.ok) {
      throw new Error(responsePayload.error || "Backend rejected the local paths.");
    }
    state.currentJob = responsePayload;
    renderRunnerMessage("Pipeline started. Runtime events are streaming from run_events.jsonl.", "pending");
    connectEventStream(responsePayload.events_url);
  } catch (error) {
    renderRunnerMessage(error.message || "Unable to start local path run.", "error");
  } finally {
    renderAll();
  }
}

function setRunnerMode(mode) {
  state.runnerMode = mode;
  renderRunnerMessage(
    mode === "path"
      ? "Start with local paths visible to the 127.0.0.1 runner."
      : "Start with files uploaded from this browser session.",
    "idle",
  );
  renderAll();
}

function connectEventStream(eventsUrl) {
  if (state.eventSource) {
    state.eventSource.close();
  }
  state.eventSource = new EventSource(eventsUrl);
  state.eventSource.addEventListener("run-event", (event) => {
    const payload = JSON.parse(event.data);
    const seen = new Set(state.runEvents.map((item) => item.sequence));
    if (!seen.has(payload.sequence)) {
      state.runEvents.push(payload);
    }
    renderJob();
  });
  state.eventSource.addEventListener("job", (event) => {
    state.currentJob = JSON.parse(event.data);
    renderJob();
    if (["succeeded", "failed"].includes(state.currentJob.status)) {
      state.eventSource.close();
      state.eventSource = null;
      renderRunnerMessage(
        state.currentJob.status === "succeeded"
          ? "Run complete. Generated artifacts are ready."
          : state.currentJob.error || "Run failed.",
        state.currentJob.status === "succeeded" ? "success" : "error",
      );
      if (state.currentJob.status === "succeeded") {
        loadDashboard(state.currentJob.job_id);
      }
      renderAll();
    }
  });
  state.eventSource.onerror = () => {
    if (!state.currentJob || !["succeeded", "failed"].includes(state.currentJob.status)) {
      renderRunnerMessage("Runtime stream interrupted. Refresh job status from generated artifacts.", "error");
    }
  };
}

function renderRunnerMessage(message, status) {
  els.runnerMessage.textContent = message;
  els.runnerMessage.dataset.status = status;
}

function loadDemoState() {
  state.dbmlText = demoDbml;
  state.dbmlName = "demo_schema.dbml";
  state.dbmlFile = null;
  state.rulesFile = null;
  state.csvFiles = demoCsvs.map(normalizeCsvFile);
  els.dbmlPathInput.value = "data/demo_olist/schema.dbml";
  els.csvDirPathInput.value = "data/demo_olist/csv";
  els.rulesPathInput.value = "data/demo_olist/rules.yaml";
  els.pathTargetInput.value = "olist_order_reviews_dataset.review_score";
  parseDbmlState();
  autoLinkCsvs();
  renderAll();
  renderDiagram();
}

function setupDropzone(element, onDrop) {
  element.addEventListener("dragover", (event) => {
    event.preventDefault();
    element.classList.add("dragging");
  });
  element.addEventListener("dragleave", () => element.classList.remove("dragging"));
  element.addEventListener("drop", async (event) => {
    event.preventDefault();
    element.classList.remove("dragging");
    await onDrop([...event.dataTransfer.files]);
  });
}

async function loadDbmlFile(file) {
  state.dbmlText = await file.text();
  state.dbmlName = file.name;
  state.dbmlFile = file;
  parseDbmlState();
  autoLinkCsvs();
  renderAll();
}

async function loadCsvFiles(files) {
  const parsed = (await Promise.all(files.map(readCsvFile))).map(normalizeCsvFile);
  const existing = new Map(
    state.csvFiles.map(normalizeCsvFile).map((file) => [file.stem, file]),
  );
  parsed.forEach((file) => existing.set(file.stem, file));
  state.csvFiles = [...existing.values()].sort((a, b) => a.name.localeCompare(b.name));
  autoLinkCsvs();
  renderAll();
}

async function readCsvFile(file) {
  const text = await readFilePrefix(file, 64 * 1024);
  return {
    name: file.name,
    stem: csvStemFromName(file.name),
    size: file.size,
    columns: parseCsvHeader(text),
    sourceFile: file,
  };
}

function readFilePrefix(file, bytes) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file.slice(0, bytes));
  });
}

function parseCsvHeader(text) {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const columns = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < firstLine.length; index += 1) {
    const char = firstLine[index];
    if (char === '"' && firstLine[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      columns.push(cleanColumn(current));
      current = "";
    } else {
      current += char;
    }
  }
  columns.push(cleanColumn(current));
  return columns.filter(Boolean);
}

function cleanColumn(value) {
  return value.replace(/^\uFEFF/, "").trim();
}

function parseDbmlState() {
  const parsed = parseDbml(state.dbmlText);
  state.tables = parsed.tables;
  state.relationships = parsed.relationships;
  state.diagramSelection = null;
}

function parseDbml(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const tables = [];
  const relationships = [];
  const tableRegex = /\bTable\s+([A-Za-z_][\w]*)\s*\{/gi;
  let match;
  while ((match = tableRegex.exec(clean))) {
    const tableName = match[1];
    const start = match.index + match[0].length;
    const end = findBlockEnd(clean, start);
    const body = clean.slice(start, end);
    const table = parseTable(tableName, body, relationships);
    tables.push(table);
    tableRegex.lastIndex = end + 1;
  }

  const refRegex =
    /^\s*Ref\s*:\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\s*>\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/gim;
  while ((match = refRegex.exec(clean))) {
    const rel = {
      childTable: match[1],
      childColumn: match[2],
      parentTable: match[3],
      parentColumn: match[4],
    };
    pushRelationship(relationships, rel);
    const table = tables.find((item) => item.name === rel.childTable);
    const column = table?.columns.find((item) => item.name === rel.childColumn);
    if (column) {
      column.fk = rel;
    }
  }

  return { tables, relationships };
}

function findBlockEnd(text, start) {
  let depth = 1;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "{") {
      depth += 1;
    }
    if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return text.length;
}

function parseTable(name, body, relationships) {
  const table = { name, columns: [], primaryKey: [] };
  body.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("indexes") || line === "{" || line === "}") {
      return;
    }

    const compositePk = line.match(/\(([^)]+)\)\s*\[[^\]]*\bpk\b[^\]]*\]/i);
    if (compositePk) {
      compositePk[1]
        .split(",")
        .map((column) => column.trim())
        .filter(Boolean)
        .forEach((column) => {
          if (!table.primaryKey.includes(column)) {
            table.primaryKey.push(column);
          }
        });
      return;
    }

    const columnMatch = line.match(/^([A-Za-z_][\w]*)\s+([A-Za-z_][\w]*(?:\([^)]*\))?)\s*(?:\[(.*?)\])?$/);
    if (!columnMatch) {
      return;
    }
    const column = {
      name: columnMatch[1],
      type: columnMatch[2],
      pk: false,
      notNull: false,
      unique: false,
      fk: null,
    };
    const attrs = columnMatch[3] || "";
    if (/\bpk\b/i.test(attrs)) {
      column.pk = true;
      column.notNull = true;
      table.primaryKey.push(column.name);
    }
    if (/not\s+null/i.test(attrs)) {
      column.notNull = true;
    }
    if (/\bunique\b/i.test(attrs)) {
      column.unique = true;
    }
    const ref = attrs.match(/ref\s*:\s*>\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/i);
    if (ref) {
      column.fk = {
        childTable: name,
        childColumn: column.name,
        parentTable: ref[1],
        parentColumn: ref[2],
      };
      pushRelationship(relationships, column.fk);
    }
    table.columns.push(column);
  });
  table.primaryKey = [...new Set(table.primaryKey)];
  return table;
}

function pushRelationship(relationships, rel) {
  const exists = relationships.some(
    (item) =>
      item.childTable === rel.childTable &&
      item.childColumn === rel.childColumn &&
      item.parentTable === rel.parentTable &&
      item.parentColumn === rel.parentColumn,
  );
  if (!exists) {
    relationships.push(rel);
  }
}

function autoLinkCsvs() {
  state.mapping = new Map();
  state.tables.forEach((table) => {
    const match = state.csvFiles.find((file) => file.stem === table.name);
    if (match) {
      state.mapping.set(table.name, match.stem);
    }
  });
}

function renderAll() {
  renderStatus();
  renderCsvList();
  renderEdges();
  renderMapping();
  renderDiagram();
  renderRunner();
  renderDashboard();
  renderControls();
}

function renderStatus() {
  const mapped = mappedTables().length;
  const missing = Math.max(state.tables.length - mapped, 0);
  const extra = extraCsvs().length;
  els.dbmlStatus.textContent = state.tables.length
    ? `${state.dbmlName || "DBML"} parsed: ${state.tables.length} tables, ${state.relationships.length} relationships`
    : "Waiting for DBML";
  els.csvStatus.textContent = state.csvFiles.length
    ? `${state.csvFiles.length} CSV files loaded`
    : "No CSV files selected";
  els.mappingStatus.textContent = state.tables.length
    ? `${mapped}/${state.tables.length} tables mapped, ${missing} missing, ${extra} extra`
    : "Run auto-link after upload";
  els.runnerStatus.textContent = runnerStatusText();
  setWorkflowCardState(els.dbmlStatusCard, state.tables.length ? "ready" : "pending");
  setWorkflowCardState(els.csvStatusCard, state.csvFiles.length ? "ready" : "pending");
  setWorkflowCardState(
    els.mappingStatusCard,
    !state.tables.length ? "pending" : missing || extra ? "warning" : "ready",
  );
  setWorkflowCardState(
    els.runnerStatusCard,
    state.runnerAvailable ? (state.currentJob?.status === "failed" ? "error" : "ready") : "warning",
  );
  els.tableCountBadge.textContent = `${state.tables.length} tables`;
  els.csvCountBadge.textContent = `${state.csvFiles.length} CSV`;
  els.mappedMetric.textContent = mapped;
  els.missingMetric.textContent = missing;
  els.extraMetric.textContent = extra;
  if (state.dbmlText) {
    els.dbmlFileCard.hidden = false;
    els.dbmlFileName.textContent = state.dbmlName;
    els.dbmlFileMeta.textContent = `${state.tables.length} tables, ${state.relationships.length} FK edges`;
  } else {
    els.dbmlFileCard.hidden = true;
  }
}

function setWorkflowCardState(element, stateName) {
  if (!element) {
    return;
  }
  element.dataset.state = stateName;
  element.classList.toggle("complete", stateName === "ready");
  element.classList.toggle("warning", stateName === "warning");
  element.classList.toggle("error", stateName === "error");
}

function runnerStatusText() {
  if (!state.runnerAvailable) {
    return "Backend unavailable";
  }
  if (state.currentJob?.status) {
    return `${state.currentJob.status}`;
  }
  return state.runnerMode === "path" ? "Ready for local paths" : "Ready for uploaded files";
}

function renderCsvList() {
  els.csvList.innerHTML = "";
  state.csvFiles.forEach((file) => {
    const node = els.csvTemplate.content.cloneNode(true);
    node.querySelector(".csv-name").textContent = file.name;
    node.querySelector(".csv-meta").textContent = `${file.columns.length} cols · ${formatBytes(file.size)}`;
    els.csvList.appendChild(node);
  });
}

function renderEdges() {
  els.edgeList.innerHTML = "";
  if (!state.relationships.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Relationships appear here after DBML parsing.";
    els.edgeList.appendChild(empty);
    return;
  }
  state.relationships.forEach((rel) => {
    const item = document.createElement("div");
    item.className = "edge-item";
    item.textContent = `${rel.childTable}.${rel.childColumn} -> ${rel.parentTable}.${rel.parentColumn}`;
    els.edgeList.appendChild(item);
  });
}

function renderMapping() {
  els.mappingBody.innerHTML = "";
  if (!state.tables.length) {
    els.mappingBody.innerHTML = `<tr><td colspan="6" class="empty-row">Upload DBML to start mapping.</td></tr>`;
    return;
  }

  state.tables.forEach((table) => {
    const csvStem = state.mapping.get(table.name) || "";
    const csvFile = state.csvFiles.find((file) => file.stem === csvStem);
    const header = csvFile ? headerMatch(table, csvFile) : { matched: 0, total: table.columns.length, ratio: 0 };
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${statusPill(csvFile ? "mapped" : "missing")}</td>
      <td><code>${escapeHtml(table.name)}</code></td>
      <td><code>${escapeHtml(table.primaryKey.join(", ") || "none")}</code></td>
      <td>${foreignKeySummary(table)}</td>
      <td>${csvSelect(table.name, csvStem)}</td>
      <td>${headerMeter(header)}</td>
    `;
    els.mappingBody.appendChild(row);
  });

  extraCsvs().forEach((file) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${statusPill("extra")}</td>
      <td><code>${escapeHtml(file.stem)}</code></td>
      <td>n/a</td>
      <td>n/a</td>
      <td><code>${escapeHtml(file.name)}</code></td>
      <td><span class="muted">Not declared in DBML</span></td>
    `;
    els.mappingBody.appendChild(row);
  });

  els.mappingBody.querySelectorAll("select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const tableName = event.target.dataset.table;
      if (event.target.value) {
        state.mapping.set(tableName, event.target.value);
      } else {
        state.mapping.delete(tableName);
      }
      renderAll();
    });
  });
}

function csvSelect(tableName, selectedStem) {
  const options = [`<option value="">Select CSV...</option>`].concat(
    state.csvFiles.map((file) => {
      const selected = file.stem === selectedStem ? "selected" : "";
      return `<option value="${escapeHtml(file.stem)}" ${selected}>${escapeHtml(file.name)}</option>`;
    }),
  );
  return `<select class="mapping-select" data-table="${escapeHtml(tableName)}" aria-label="CSV for ${escapeHtml(tableName)}">${options.join("")}</select>`;
}

function statusPill(status) {
  const label = {
    mapped: "mapped",
    missing: "missing CSV",
    extra: "extra CSV",
  }[status];
  return `<span class="pill-status ${status}">${label}</span>`;
}

function foreignKeySummary(table) {
  const fks = table.columns.filter((column) => column.fk);
  if (!fks.length) {
    return "none";
  }
  return fks
    .map((column) => `<div><code>${escapeHtml(column.name)}</code> -> <code>${escapeHtml(column.fk.parentTable)}.${escapeHtml(column.fk.parentColumn)}</code></div>`)
    .join("");
}

function headerMatch(table, csvFile) {
  const csvColumns = new Set(csvFile.columns);
  const matched = table.columns.filter((column) => csvColumns.has(column.name)).length;
  const total = table.columns.length || 1;
  return { matched, total, ratio: matched / total };
}

function headerMeter(header) {
  const pct = Math.round(header.ratio * 100);
  return `
    <div class="header-meter">
      <div class="meter-track"><div class="meter-fill" style="width: ${pct}%"></div></div>
      <small>${header.matched}/${header.total} columns · ${pct}%</small>
    </div>
  `;
}

function renderControls() {
  const hasDbml = Boolean(state.dbmlText && state.tables.length);
  const hasUploadedDbml = Boolean(state.dbmlFile);
  const hasUploadedCsvs = state.csvFiles.some((file) => file.sourceFile);
  const hasPathInputs = Boolean(els.dbmlPathInput.value.trim() && els.csvDirPathInput.value.trim());
  const jobRunning = ["queued", "running"].includes(state.currentJob?.status);
  els.visualizeButton.disabled = !hasDbml;
  els.autoLinkButton.disabled = !hasDbml || !state.csvFiles.length;
  els.runProfilerButton.disabled = !state.runnerAvailable || !hasUploadedDbml || !hasUploadedCsvs || jobRunning;
  els.runPathProfilerButton.disabled = !state.runnerAvailable || !hasPathInputs || jobRunning;
  els.runnerModeUpload.classList.toggle("active", state.runnerMode === "upload");
  els.runnerModePath.classList.toggle("active", state.runnerMode === "path");
  els.runnerModeUpload.setAttribute("aria-selected", state.runnerMode === "upload" ? "true" : "false");
  els.runnerModePath.setAttribute("aria-selected", state.runnerMode === "path" ? "true" : "false");
  els.runnerForm.hidden = state.runnerMode !== "upload";
  els.pathRunnerForm.hidden = state.runnerMode !== "path";
}

function renderRunner() {
  if (state.rulesFile) {
    els.rulesFileCard.hidden = false;
    els.rulesFileName.textContent = state.rulesFile.name;
    els.rulesFileMeta.textContent = `${formatBytes(state.rulesFile.size)} · optional rules`;
  } else {
    els.rulesFileCard.hidden = true;
  }
  renderJob();
}

function renderJob() {
  const job = state.currentJob;
  els.jobStatusBadge.textContent = job?.status || "No job";
  els.eventCount.textContent = `${state.runEvents.length} events`;
  const artifacts = job?.artifacts || [];
  els.artifactCount.textContent = `${artifacts.length} files`;
  renderStages(job);
  renderArtifacts(artifacts);
}

function renderStages(job) {
  const stageMap = new Map();
  state.runEvents
    .filter((event) => event.stage)
    .forEach((event) => {
      const current = stageMap.get(event.stage) || {
        name: event.stage,
        displayName: event.details?.display_name || event.stage,
        status: event.status || "running",
        duration: event.duration_seconds,
        details: {},
      };
      current.details = { ...current.details, ...(event.details || {}) };
      if (event.details?.display_name) {
        current.displayName = event.details.display_name;
      }
      if (event.event_type === "stage_started") {
        current.status = "running";
      }
      if (["stage_finished", "stage_failed"].includes(event.event_type)) {
        current.status = event.status || current.status;
        current.duration = event.duration_seconds;
      }
      stageMap.set(event.stage, current);
    });

  if (job?.summary?.stage_timings?.length) {
    job.summary.stage_timings.forEach((stage) => {
      stageMap.set(stage.name, {
        name: stage.name,
        displayName: stage.display_name,
        status: stage.status,
        duration: stage.duration_seconds,
        details: stage.details || {},
      });
    });
  }

  els.stageList.innerHTML = "";
  if (!stageMap.size) {
    els.stageList.innerHTML = `<p class="muted">Run events from <code>run_events.jsonl</code> will appear here.</p>`;
    return;
  }
  [...stageMap.values()].forEach((stage) => {
    const item = document.createElement("div");
    item.className = `stage-item ${escapeHtml(stage.status || "running")}`;
    item.innerHTML = `
      <span class="stage-dot" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(stage.displayName || stage.name)}</strong>
        <p><code>${escapeHtml(stage.name)}</code>${stage.duration ? ` · ${Number(stage.duration).toFixed(3)}s` : ""}</p>
        ${renderStageResult(stage, job)}
      </div>
      <span class="pill-status ${stage.status === "failed" ? "missing" : "mapped"}">${escapeHtml(stage.status || "running")}</span>
    `;
    els.stageList.appendChild(item);
  });
}

function renderStageResult(stage, job) {
  const items = stageResultItems(stage);
  const artifactPaths = stageArtifactPaths(stage.name);
  const artifactLinks = artifactPaths
    .map((path) => {
      const url = artifactUrlFromArtifacts(path, job?.artifacts || []) || artifactUrlFor(path);
      return url ? renderStageArtifactButton(path, url) : "";
    })
    .filter(Boolean)
    .join("");
  if (!items.length && !artifactLinks) {
    return stage.status === "running"
      ? `<div class="stage-result pending"><strong>Stage result</strong><span>Waiting for result evidence...</span></div>`
      : "";
  }
  return `
    <div class="stage-result">
      <div class="stage-result-heading">
        <strong>Stage result</strong>
        <span>${escapeHtml(stageResultSummary(stage.name))}</span>
      </div>
      ${items.length ? `
        <div class="stage-result-grid">
          ${items.map(([label, value]) => `
            <span><code>${escapeHtml(formatStageResultValue(value))}</code> ${escapeHtml(label)}</span>
          `).join("")}
        </div>
      ` : ""}
      ${artifactLinks ? `<div class="stage-result-artifacts">${artifactLinks}</div>` : ""}
    </div>
  `;
}

function stageResultItems(stage) {
  const details = objectOrEmpty(stage.details);
  const name = stage.name;
  const fromDetails = (...keys) => keys
    .filter((key) => details[key] !== undefined && key !== "display_name")
    .map((key) => [stageResultLabel(key), details[key]]);
  if (name === "parse_dbml_schema") {
    return fromDetails("table_count", "relationship_count", "diagnostic_count", "unsupported_construct_count");
  }
  if (name === "catalog_csv_files") {
    return fromDetails("mapped_table_count", "missing_table_count", "extra_csv_count");
  }
  if (name === "profile_csv_tables") {
    return fromDetails("table_count", "row_count", "column_count");
  }
  if (name === "data_quality_checks") {
    return fromDetails("issue_count");
  }
  if (name === "relationship_checks") {
    return fromDetails("relationship_count", "issue_count_added");
  }
  if (name === "influence_analysis") {
    return fromDetails("row_count", "feature_count");
  }
  if (name === "write_machine_artifacts") {
    return fromDetails("artifact_count", "chart_spec_count", "table_assessment_count");
  }
  if (name === "render_reports") {
    return fromDetails("report_count", "formats");
  }
  return Object.entries(details)
    .filter(([key]) => key !== "display_name")
    .slice(0, 4)
    .map(([key, value]) => [stageResultLabel(key), value]);
}

function stageArtifactPaths(stageName) {
  const pathsByStage = {
    parse_dbml_schema: ["schema_parse_report.json", "schema_diagram.json"],
    catalog_csv_files: ["schema_evaluation.json"],
    profile_csv_tables: ["profile_summary.json"],
    data_quality_checks: ["issues.json", "dataset_verdict.json", "table_assessments.json"],
    relationship_checks: ["relationship_graph.json", "charts/relationship_fk_health.json"],
    influence_analysis: ["influence.json", "charts/influence_top_features.json"],
    write_machine_artifacts: ["dataset_verdict.json", "lineage_graph.json", "run_summary.json"],
    render_reports: ["report.html", "report.md"],
  };
  return pathsByStage[stageName] || [];
}

function renderStageArtifactButton(path, url) {
  if (isDashboardChartArtifact(path)) {
    return `
      <button class="stage-artifact-button" type="button" data-artifact-action="focus-dashboard-artifact" data-artifact-path="${escapeHtml(path)}">
        <code>${escapeHtml(path)}</code>
        <span>View chart</span>
      </button>
    `;
  }
  return `
    <button class="stage-artifact-button" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(path)}" data-artifact-url="${escapeHtml(url)}">
      <code>${escapeHtml(path)}</code>
      <span>Review</span>
    </button>
  `;
}

function stageResultSummary(stageName) {
  const summaries = {
    parse_dbml_schema: "Parsed schema contract",
    catalog_csv_files: "Matched CSV files to DBML tables",
    profile_csv_tables: "Streamed profile statistics",
    data_quality_checks: "Detected row and column quality issues",
    relationship_checks: "Validated PK/FK relationship status",
    influence_analysis: "Computed bounded target influence",
    write_machine_artifacts: "Wrote machine-readable outputs",
    render_reports: "Rendered human-readable reports",
  };
  return summaries[stageName] || "Runtime evidence";
}

function stageResultLabel(key) {
  const labels = {
    table_count: "tables",
    relationship_count: "relationships",
    diagnostic_count: "diagnostics",
    unsupported_construct_count: "unsupported",
    mapped_table_count: "mapped",
    missing_table_count: "missing",
    extra_csv_count: "extra CSV",
    row_count: "rows",
    column_count: "columns",
    issue_count: "issues",
    issue_count_added: "issues added",
    feature_count: "features",
    artifact_count: "artifacts",
    chart_spec_count: "chart specs",
    table_assessment_count: "table assessments",
    report_count: "reports",
    formats: "formats",
  };
  return labels[key] || key.replaceAll("_", " ");
}

function formatStageResultValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "number") {
    return integerText(value);
  }
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  return String(value);
}

function renderArtifacts(artifacts) {
  els.artifactList.innerHTML = "";
  if (!artifacts.length) {
    els.artifactList.innerHTML = `<p class="muted">Generated result previews and artifact links load from <code>run_summary.json</code>.</p>`;
    return;
  }
  els.artifactList.innerHTML = renderGeneratedResults(artifacts);
}

function renderGeneratedResults(artifacts) {
  return `
    <div class="generated-results">
      ${renderGeneratedResultPreviews(artifacts)}
      ${renderGeneratedReportLinks(artifacts)}
      <div class="generated-links-block">
        <div class="runtime-heading compact">
          <strong>Generated artifacts</strong>
          <span>${integerText(artifacts.length)} files</span>
        </div>
        <div class="artifact-link-list">
          ${artifacts.map((artifact) => renderRawArtifactLink(artifact)).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderGeneratedResultPreviews(artifacts) {
  if (state.dashboardLoadingJobId && !state.dashboardArtifactIndex) {
    return `
      <div class="generated-result-grid">
        <article class="generated-result-card">
          <div class="generated-result-heading">
            <strong>Loading generated results</strong>
            <span>artifact URLs</span>
          </div>
          <p class="muted">Fetching chart specs and machine artifacts from the completed job.</p>
        </article>
      </div>
    `;
  }

  return `
    <div class="generated-result-grid">
      ${renderGeneratedVerdictPreview(artifacts)}
      ${renderGeneratedIssueCountsPreview(artifacts)}
      ${renderGeneratedTableImpactPreview(artifacts)}
      ${renderGeneratedRuntimePreview(artifacts)}
    </div>
  `;
}

function renderGeneratedVerdictPreview(artifacts) {
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const hasVerdict = Boolean(Object.keys(verdict).length);
  const riskScore = verdict.risk_score ?? verdict.summary?.risk_score;
  const verdictLabel = verdict.verdict || verdict.summary?.verdict || "Waiting";
  const issueCount = verdict.issue_counts?.total ?? getDashboardIssues().length;
  const blockers = Array.isArray(verdict.top_blockers) ? verdict.top_blockers.length : 0;
  const body = hasVerdict
    ? `
      <div class="generated-result-kpi">
        <strong>${escapeHtml(verdictLabel)}</strong>
        <span>${escapeHtml(riskScore === undefined ? "--" : `${integerText(riskScore)}/100`)} risk</span>
      </div>
      <p>${integerText(issueCount)} issues · ${integerText(blockers)} top blockers</p>
    `
    : `<p class="muted">Waiting for <code>dataset_verdict.json</code> from the dashboard artifact loader.</p>`;
  return generatedResultCard("Dataset verdict", "dataset_verdict.json", body, artifacts);
}

function renderGeneratedIssueCountsPreview(artifacts) {
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const runSummary = generatedRunSummary();
  const issues = getDashboardIssues();
  const bySeverity = verdict.issue_counts?.by_severity || runSummary.issue_counts?.by_severity || {};
  const total = verdict.issue_counts?.total ?? runSummary.issue_counts?.total ?? issues.length;
  const severityRows = severityOrder.map((severity) => `
    <span><code>${escapeHtml(severity)}</code> ${integerText(bySeverity[severity])}</span>
  `).join("");
  return generatedResultCard(
    "Issue counts",
    "issues.json",
    `
      <div class="generated-result-kpi">
        <strong>${integerText(total)}</strong>
        <span>issues</span>
      </div>
      <div class="generated-mini-list">${severityRows}</div>
    `,
    artifacts,
  );
}

function renderGeneratedTableImpactPreview(artifacts) {
  const assessmentArtifact = state.dashboardArtifacts["table_assessments.json"] || {};
  const assessments = getDashboardTableAssessments();
  const summary = assessmentArtifact.summary || {};
  const tableCount = summary.table_count ?? assessments.length;
  const averageReviewScore = summary.average_review_score ?? summary.average_health_score;
  const notReady = summary.readiness_counts?.NOT_READY ?? assessments.filter((row) => row.readiness === "NOT_READY").length;
  const topTables = assessments
    .slice()
    .sort((a, b) => (
      readinessOrder(a.readiness) - readinessOrder(b.readiness) ||
      Number(a.review_score ?? a.health_score ?? 0) - Number(b.review_score ?? b.health_score ?? 0) ||
      String(a.table || "").localeCompare(String(b.table || ""))
    ))
    .slice(0, 3)
    .map((assessment) => `<code>${escapeHtml(assessment.table)}</code>`)
    .join("");
  const body = tableCount
    ? `
      <div class="generated-result-kpi">
        <strong>${integerText(tableCount)}</strong>
        <span>tables</span>
      </div>
      <p>${integerText(notReady)} not ready · ${averageReviewScore === undefined ? "--" : integerText(averageReviewScore)} avg review score</p>
      ${topTables ? `<div class="generated-mini-list">${topTables}</div>` : ""}
    `
    : `<p class="muted">Waiting for <code>table_assessments.json</code>.</p>`;
  return generatedResultCard("Table impact", "table_assessments.json", body, artifacts);
}

function renderGeneratedRuntimePreview(artifacts) {
  const runSummary = generatedRunSummary();
  const stages = Array.isArray(runSummary.stage_timings) ? runSummary.stage_timings : [];
  const failedStages = Array.isArray(runSummary.failed_stages) ? runSummary.failed_stages.length : 0;
  const status = runSummary.status || state.currentJob?.status || "pending";
  const duration = runSummary.duration_seconds;
  const body = `
    <div class="generated-result-kpi">
      <strong>${escapeHtml(status)}</strong>
      <span>${integerText(stages.length)} stages</span>
    </div>
    <p>${duration === undefined ? "--" : `${Number(duration).toFixed(2)}s`} runtime · ${integerText(failedStages)} failed stages</p>
  `;
  return generatedResultCard("Runtime summary", "run_summary.json", body, artifacts);
}

function renderGeneratedReportLinks(artifacts) {
  const reportLinks = [
    ["report.html", "Report HTML"],
    ["report.md", "Report Markdown"],
    ["l4_report.md", "L4 report"],
  ]
    .map(([path, label]) => {
      const url = artifactUrlFromArtifacts(path, artifacts);
      return url
        ? `<button class="generated-report-link" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(path)}" data-artifact-url="${escapeHtml(url)}"><strong>${escapeHtml(label)}</strong><code>${escapeHtml(path)}</code><span>Preview report</span></button>`
        : "";
    })
    .filter(Boolean)
    .join("");

  if (!reportLinks) {
    return "";
  }

  return `
    <div class="generated-report-links" aria-label="Generated report links">
      ${reportLinks}
    </div>
  `;
}

function generatedResultCard(title, artifactPath, body, artifacts) {
  const artifactUrl = artifactUrlFromArtifacts(artifactPath, artifacts);
  return `
    <article class="generated-result-card">
      <div class="generated-result-heading">
        <strong>${escapeHtml(title)}</strong>
        ${artifactUrl ? renderArtifactReference(artifactPath, artifactUrl) : `<span>${escapeHtml(artifactPath)}</span>`}
      </div>
      ${body}
    </article>
  `;
}

function renderRawArtifactLink(artifact) {
  if (isDashboardChartArtifact(artifact.path)) {
    return renderArtifactNavigationCard(artifact.path, artifact.url, artifact.label);
  }
  return `
    <button class="artifact-link" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(artifact.path)}" data-artifact-url="${escapeHtml(artifact.url)}">
      <strong>${escapeHtml(artifact.label)}</strong>
      <code>${escapeHtml(artifact.path)}</code>
      <span>Preview</span>
    </button>
  `;
}

function generatedRunSummary() {
  return state.dashboardArtifacts["run_summary.json"] || state.currentJob?.summary || {};
}

function artifactUrlFromArtifacts(path, artifacts = state.currentJob?.artifacts || []) {
  const artifact = artifacts.find((item) => item.path === path);
  return artifact?.url || state.dashboardArtifactIndex?.artifact_urls?.[path] || "";
}

function resetDashboardState() {
  state.dashboardArtifactIndex = null;
  state.dashboardLoadingJobId = "";
  state.dashboardArtifacts = {};
  state.dashboardFilters = { severity: "all", issueType: "all", table: "all" };
  state.dashboardSelection = null;
  state.dashboardGraphMode = "lineage";
  state.dashboardGraphScope = "table";
  state.dashboardGraphSelection = null;
  state.diagramSelection = null;
  renderDashboard();
}

async function loadDashboard(jobId) {
  if (!jobId || state.dashboardArtifactIndex?.job_id === jobId || state.dashboardLoadingJobId === jobId) {
    return;
  }
  state.dashboardLoadingJobId = jobId;
  state.dashboardArtifactIndex = null;
  state.dashboardArtifacts = {};
  renderDashboardMessage("Loading dashboard artifacts from web-runner URLs...", "pending");
  renderDashboard();

  try {
    const response = await fetch(`/api/jobs/${jobId}/dashboard`, { cache: "no-store" });
    const dashboardArtifactIndex = await response.json();
    if (!response.ok) {
      throw new Error(dashboardArtifactIndex.error || "Dashboard artifact discovery failed.");
    }

    const artifactUrls = { ...(dashboardArtifactIndex.artifact_urls || {}) };
    postRunDiagramArtifacts.forEach((artifactPath) => {
      const artifactUrl = artifactUrlFromArtifacts(artifactPath, state.currentJob?.artifacts || []);
      if (artifactUrl && !artifactUrls[artifactPath]) {
        artifactUrls[artifactPath] = artifactUrl;
      }
    });
    const artifactEntries = Object.entries(artifactUrls);
    const loadedArtifacts = {};
    await Promise.all(
      artifactEntries.map(async ([artifactPath, artifactUrl]) => {
        if (artifactPath.endsWith(".json")) {
          loadedArtifacts[artifactPath] = await fetchArtifactJson(artifactPath, artifactUrl);
        }
      }),
    );
    state.dashboardArtifactIndex = dashboardArtifactIndex;
    state.dashboardArtifacts = loadedArtifacts;
    state.dashboardLoadingJobId = "";
    state.dashboardSelection = { kind: "overview", value: "", label: "Filtered issues" };
    state.dashboardGraphSelection = null;
    state.diagramShowNonKey = true;
    renderDashboardMessage("Dashboard loaded from generated artifacts.", "success");
  } catch (error) {
    state.dashboardLoadingJobId = "";
    renderDashboardMessage(error.message || "Unable to load dashboard artifacts.", "error");
  } finally {
    renderDashboard();
    renderJob();
    renderDiagram();
  }
}

async function fetchArtifactJson(artifactPath, artifactUrl) {
  const response = await fetch(artifactUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${artifactPath}.`);
  }
  return response.json();
}

function renderDashboardMessage(message, status) {
  els.dashboardMessage.textContent = message;
  els.dashboardMessage.dataset.status = status;
}

function renderDashboard() {
  const artifacts = state.dashboardArtifacts;
  const artifactIndex = state.dashboardArtifactIndex;
  const loading = Boolean(state.dashboardLoadingJobId);
  const loaded = Boolean(artifactIndex);
  const issues = getDashboardIssues();
  const filteredIssues = getFilteredDashboardIssues();

  els.dashboardStatusBadge.textContent = loading
    ? "Loading"
    : loaded
      ? `${artifactIndex.status} dashboard`
      : "Waiting for run";
  els.dashboardIssueCount.textContent = `${filteredIssues.length}/${issues.length} issues`;

  renderDashboardSummary(issues);
  renderDashboardFilters(issues);
  renderDashboardArtifacts();
  renderTableImpactSection();

  if (!loaded) {
    els.dashboardPanelGrid.innerHTML = loading
      ? `<p class="muted">Fetching chart specs and machine artifacts...</p>`
      : `<p class="muted">Run a job to render charts from generated artifact URLs.</p>`;
    els.dashboardDrilldownMeta.textContent = "No selection";
    els.dashboardDrilldown.innerHTML = `<p class="muted">Select a chart item to inspect matching issues and artifact links.</p>`;
    renderDashboardGraph();
    return;
  }

  const panels = [
    renderRiskPanel(),
    renderIssueSeverityPanel(filteredIssues),
    renderIssueTypePanel(filteredIssues),
    renderMissingnessPanel(),
    renderRelationshipHealthPanel(),
    renderInfluencePanel(),
  ].filter(Boolean);

  els.dashboardPanelGrid.innerHTML = panels.join("");
  renderDashboardGraph();
  renderDashboardDrilldown();

  if ((artifactIndex.missing_artifacts || []).length) {
    renderDashboardMessage(
      `Dashboard loaded with missing optional artifacts: ${artifactIndex.missing_artifacts.join(", ")}.`,
      "pending",
    );
  } else if (artifacts["influence.json"] && !artifacts[dashboardChartPaths.influence]) {
    renderDashboardMessage("Dashboard loaded. Influence chart is absent because no top features were generated.", "success");
  }
}

function renderDashboardSummary(issues) {
  const artifactIndex = state.dashboardArtifactIndex;
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const assessmentArtifact = state.dashboardArtifacts["table_assessments.json"] || {};
  const assessments = getDashboardTableAssessments();
  const riskScore = verdict.risk_score ?? verdict.summary?.risk_score ?? "--";
  const verdictLabel = verdict.verdict || verdict.summary?.verdict || (artifactIndex ? "unknown" : "Waiting");
  const paths = Object.keys(artifactIndex?.artifact_urls || {});
  els.dashboardSummaryStrip.innerHTML = `
    <div><span>verdict</span><strong>${escapeHtml(verdictLabel)}</strong></div>
    <div><span>risk</span><strong>${escapeHtml(riskScore === "--" ? "--" : `${integerText(riskScore)}/100`)}</strong></div>
    <div><span>issues</span><strong>${integerText(issues.length)}</strong></div>
    <div><span>tables</span><strong>${integerText(assessmentArtifact.summary?.table_count ?? assessments.length)}</strong></div>
    <div><span>artifacts</span><strong>${integerText(paths.length)}</strong></div>
  `;
}

function renderTableImpactSection() {
  const loaded = Boolean(state.dashboardArtifactIndex);
  const assessments = getDashboardTableAssessments()
    .filter((assessment) => filterMatchesTable(assessment.table))
    .sort((a, b) => (
      readinessOrder(a.readiness) - readinessOrder(b.readiness) ||
      Number(a.review_score ?? a.health_score ?? 0) - Number(b.review_score ?? b.health_score ?? 0) ||
      String(a.table || "").localeCompare(String(b.table || ""))
    ));

  if (!loaded) {
    els.tableImpactStatus.textContent = state.dashboardLoadingJobId
      ? "Fetching table_assessments.json"
      : "Waiting for table_assessments.json";
    els.tableImpactGrid.innerHTML = `<p class="muted">Run a job to review per-table readiness and business impact.</p>`;
    return;
  }

  els.tableImpactStatus.textContent = assessments.length
    ? `${assessments.length} tables from table_assessments.json`
    : "No matching table assessments";

  if (!assessments.length) {
    els.tableImpactGrid.innerHTML = `<p class="muted">No table assessments match the current table filter.</p>`;
    return;
  }

  els.tableImpactGrid.innerHTML = assessments.slice(0, 12).map((assessment) => {
    const impact = assessment.business_impact || {};
    const columns = Array.isArray(assessment.affected_columns) ? assessment.affected_columns : [];
    const risks = Array.isArray(assessment.relationship_risks) ? assessment.relationship_risks : [];
    const readiness = assessment.readiness || "unknown";
    return `
      <button class="table-impact-card" type="button" data-dashboard-kind="table_assessment" data-dashboard-value="${escapeHtml(assessment.table)}" data-dashboard-label="${escapeHtml(assessment.table)}">
        <span>
          <code>${escapeHtml(assessment.table)}</code>
          <small>${escapeHtml(assessment.role || "unknown")} · ${escapeHtml(impact.label || "General analytics")}</small>
        </span>
        <span class="table-impact-score">${integerText(assessment.review_score ?? assessment.health_score)}<small>review score</small></span>
        <span class="pill-status ${readinessPillClass(readiness)}">${escapeHtml(readiness)}</span>
        <span class="table-impact-meta">
          <span>${escapeHtml(impact.category || "general_analytics")}</span>
          <span>${integerText(columns.length)} columns</span>
          <span>${integerText(risks.length)} relationship risks</span>
        </span>
      </button>
    `;
  }).join("");
}

function renderDashboardFilters(issues) {
  const severities = uniqueSorted(issues.map((issue) => issue.severity), severityOrder);
  const issueTypes = uniqueSorted(issues.map((issue) => issue.issue_type));
  const tables = uniqueSorted([
    ...issues.map((issue) => issue.table).filter(Boolean),
    ...getDashboardTableAssessments().map((assessment) => assessment.table).filter(Boolean),
  ]);

  setSelectOptions(els.dashboardSeverityFilter, "all", "All severities", severities, state.dashboardFilters.severity);
  setSelectOptions(els.dashboardIssueTypeFilter, "all", "All issue types", issueTypes, state.dashboardFilters.issueType);
  setSelectOptions(els.dashboardTableFilter, "all", "All tables", tables, state.dashboardFilters.table);
}

function setSelectOptions(select, allValue, allLabel, values, selected) {
  const normalizedSelected = values.includes(selected) ? selected : allValue;
  select.innerHTML = [
    `<option value="${escapeHtml(allValue)}">${escapeHtml(allLabel)}</option>`,
    ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`),
  ].join("");
  select.value = normalizedSelected;
  if (selected !== normalizedSelected) {
    if (select === els.dashboardSeverityFilter) {
      state.dashboardFilters.severity = normalizedSelected;
    }
    if (select === els.dashboardIssueTypeFilter) {
      state.dashboardFilters.issueType = normalizedSelected;
    }
    if (select === els.dashboardTableFilter) {
      state.dashboardFilters.table = normalizedSelected;
    }
  }
}

function setDashboardGraphMode(mode) {
  state.dashboardGraphMode = mode;
  state.dashboardGraphSelection = null;
  renderDashboardGraph();
}

function setDashboardGraphDisplay(display) {
  state.dashboardGraphDisplay = display;
  if (display === "overview") {
    state.dashboardGraphScope = "table";
  }
  if (display === "full") {
    state.dashboardGraphScope = state.dashboardGraphMode === "relationship" ? "relationships" : "runtime";
  }
  syncDashboardGraphControlsFromScope();
  renderDashboardGraph();
}

function resetDashboardGraphView() {
  state.dashboardGraphDisplay = "overview";
  state.dashboardGraphScope = "table";
  state.dashboardGraphShowColumns = false;
  state.dashboardGraphShowRuntime = false;
  state.dashboardGraphInvalidOnly = false;
  state.dashboardGraphSelection = null;
  renderDashboardGraph();
}

function renderDashboardGraph() {
  updateGraphControls();
  const loaded = Boolean(state.dashboardArtifactIndex);
  if (!loaded) {
    const message = state.dashboardLoadingJobId
      ? "Fetching graph artifacts..."
      : "Run a job to render lineage and relationship graphs.";
    renderEmptyGraph(message);
    return;
  }

  const options = dashboardGraphOptions();
  let graph = state.dashboardGraphMode === "relationship"
    ? buildRelationshipGraphView(options)
    : buildLineageGraphView(options);

  if (!graph.nodes.length) {
    renderEmptyGraph(graph.emptyMessage || "No graph nodes are available for this scope.");
    return;
  }

  const selectedVisible = graph.nodes.some((node) => node.id === state.dashboardGraphSelection?.id);
  if (!selectedVisible) {
    state.dashboardGraphSelection = null;
  }
  graph = applyDashboardGraphFocus(graph);
  drawDashboardGraph(graph);
  renderGraphLegend(graph);
  renderGraphDrilldown(graph);
}

function updateGraphControls() {
  els.dashboardGraphModeLineage.classList.toggle("active", state.dashboardGraphMode === "lineage");
  els.dashboardGraphModeRelationship.classList.toggle("active", state.dashboardGraphMode === "relationship");
  els.dashboardGraphModeLineage.setAttribute("aria-selected", String(state.dashboardGraphMode === "lineage"));
  els.dashboardGraphModeRelationship.setAttribute("aria-selected", String(state.dashboardGraphMode === "relationship"));
  updateGraphDisplayButton(els.dashboardGraphDisplayOverview, "overview");
  updateGraphDisplayButton(els.dashboardGraphDisplayFocus, "focus");
  updateGraphDisplayButton(els.dashboardGraphDisplayFull, "full");
  els.dashboardGraphColumnsToggle.checked = state.dashboardGraphShowColumns;
  els.dashboardGraphRuntimeToggle.checked = state.dashboardGraphShowRuntime;
  els.dashboardGraphInvalidOnlyToggle.checked = state.dashboardGraphInvalidOnly;
  if (els.dashboardGraphScope.value !== state.dashboardGraphScope) {
    els.dashboardGraphScope.value = state.dashboardGraphScope;
  }
}

function updateGraphDisplayButton(button, display) {
  const active = state.dashboardGraphDisplay === display;
  button.classList.toggle("active", active);
  button.setAttribute("aria-pressed", String(active));
}

function dashboardGraphOptions() {
  const full = state.dashboardGraphDisplay === "full";
  return {
    display: state.dashboardGraphDisplay,
    scope: state.dashboardGraphScope,
    showColumns: full || state.dashboardGraphShowColumns || state.dashboardGraphScope === "columns",
    showRuntime: full || state.dashboardGraphShowRuntime || state.dashboardGraphScope === "runtime",
    showRelationships: full || state.dashboardGraphScope === "relationships",
    invalidOnly: state.dashboardGraphInvalidOnly,
  };
}

function syncDashboardGraphScopeFromControls() {
  if (state.dashboardGraphDisplay === "full") {
    state.dashboardGraphScope = state.dashboardGraphMode === "relationship" ? "relationships" : "runtime";
    return;
  }
  if (state.dashboardGraphShowRuntime) {
    state.dashboardGraphScope = "runtime";
    return;
  }
  if (state.dashboardGraphShowColumns) {
    state.dashboardGraphScope = "columns";
    return;
  }
  state.dashboardGraphScope = "table";
}

function syncDashboardGraphControlsFromScope() {
  if (state.dashboardGraphScope === "table") {
    state.dashboardGraphShowColumns = false;
    state.dashboardGraphShowRuntime = false;
    if (state.dashboardGraphDisplay === "full") {
      state.dashboardGraphDisplay = "overview";
    }
    return;
  }
  if (state.dashboardGraphScope === "columns") {
    state.dashboardGraphShowColumns = true;
    state.dashboardGraphShowRuntime = false;
  }
  if (state.dashboardGraphScope === "relationships") {
    state.dashboardGraphDisplay = "full";
    state.dashboardGraphShowColumns = true;
    state.dashboardGraphShowRuntime = false;
  }
  if (state.dashboardGraphScope === "runtime") {
    state.dashboardGraphShowRuntime = true;
  }
}

function buildLineageGraphView(options) {
  const artifact = state.dashboardArtifacts["lineage_graph.json"];
  if (!artifact) {
    return emptyGraphModel("Lineage graph", "lineage_graph.json", "lineage_graph.json is not available.");
  }

  const categories = new Set(lineageCategoriesForOptions(options));
  const rawNodes = Array.isArray(artifact.nodes) ? artifact.nodes : [];
  let nodes = rawNodes
    .map((node) => normalizeLineageNode(node))
    .filter((node) => categories.has(node.category));
  nodes = addLineageArtifactSummaryNode(nodes, rawNodes, options);
  const nodeIds = new Set(nodes.map((node) => node.id));
  let edges = (Array.isArray(artifact.edges) ? artifact.edges : [])
    .map((edge) => normalizeGraphEdge(edge, "lineage_graph.json"))
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  if (!options.showRuntime && options.showRelationships) {
    edges = edges.filter((edge) => [
      "defines_relationship",
      "uses_child_table",
      "uses_parent_table",
      "uses_child_column",
      "uses_parent_column",
    ].includes(edge.type));
  } else if (!options.showRuntime) {
    edges = edges.filter((edge) => [
      "provides_schema",
      "defines_table",
      "provides_table",
      "summarized_by",
    ].includes(edge.type));
  }

  if (hasArtifactSummaryNode(nodes)) {
    edges = [
      ...edges,
      ...lineageArtifactSummaryEdges(nodes),
    ];
  }

  if (options.invalidOnly) {
    const warningRelationshipIds = warningRelationshipNodeIds(rawNodes);
    if (warningRelationshipIds.size) {
      const included = new Set(
        nodes
          .filter((node) => node.category !== "relationship" || warningRelationshipIds.has(node.id))
          .map((node) => node.id),
      );
      nodes = nodes.filter((node) => included.has(node.id));
      edges = edges.filter((edge) => included.has(edge.source) && included.has(edge.target));
    }
  }

  return filterGraphModelByTable({
    title: "Lineage graph",
    sourceArtifact: "lineage_graph.json",
    categoryOrder: lineageCategoryOrder,
    nodes,
    edges,
    summary: artifact.summary || {},
    emptyMessage: "No lineage nodes match the selected table and scope.",
  });
}

function lineageCategoriesForOptions(options) {
  const categories = ["source", "schema", "table"];
  if (options.showColumns) {
    categories.push("column");
  }
  if (options.showRelationships) {
    categories.push("relationship");
  }
  if (options.showRuntime) {
    categories.push("stage", "artifact");
  }
  return categories;
}

function normalizeLineageNode(node) {
  const data = objectOrEmpty(node.data);
  const type = String(node.type || "unknown");
  const category = lineageTypeToCategory[type] || type;
  return {
    id: String(node.id || `${category}:${node.label || "node"}`),
    label: String(node.label || node.id || "node"),
    type,
    category,
    data,
    evidence: arrayOfStrings(node.evidence),
    table: data.table || tableFromNodeId(String(node.id || "")),
    column: data.column || "",
    artifactPath: category === "artifact" ? data.path || node.label || "" : "",
    sourceArtifact: "lineage_graph.json",
  };
}

function addLineageArtifactSummaryNode(nodes, rawNodes, options) {
  if (options.showRuntime || options.showRelationships) {
    return nodes;
  }
  const artifactCount = rawNodes.filter((node) => lineageTypeToCategory[node.type] === "artifact").length;
  if (!artifactCount) {
    return nodes;
  }
  return [
    ...nodes,
    {
      id: "artifact-summary:generated",
      label: `${artifactCount} generated artifacts`,
      type: "artifact_summary",
      category: "artifact",
      data: {
        artifact_count: artifactCount,
        summary: "Individual artifact and runtime-stage nodes are hidden in overview.",
      },
      evidence: ["run_summary.json", "lineage_graph.json"],
      table: "",
      column: "",
      artifactPath: "run_summary.json",
      sourceArtifact: "lineage_graph.json",
    },
  ];
}

function hasArtifactSummaryNode(nodes) {
  return nodes.some((node) => node.id === "artifact-summary:generated");
}

function lineageArtifactSummaryEdges(nodes) {
  if (!hasArtifactSummaryNode(nodes)) {
    return [];
  }
  return nodes
    .filter((node) => node.category === "table")
    .map((node) => ({
      source: node.id,
      target: "artifact-summary:generated",
      type: "summarized_by",
      label: "artifact summary",
      status: "",
      evidence: ["run_summary.json", "lineage_graph.json"],
      data: { table: node.table || node.label },
      sourceArtifact: "lineage_graph.json",
    }));
}

function warningRelationshipNodeIds(rawNodes) {
  return new Set(
    rawNodes
      .filter((node) => lineageTypeToCategory[node.type] === "relationship" && isWarningGraphStatus(node.data?.status))
      .map((node) => String(node.id || "")),
  );
}

function buildRelationshipGraphView(options) {
  const artifact = state.dashboardArtifacts["relationship_graph.json"];
  if (!artifact) {
    return emptyGraphModel("Relationship graph", "relationship_graph.json", "relationship_graph.json is not available.");
  }

  const nodes = [];
  const edges = [];
  const tableIds = new Map();
  const columnIds = new Map();
  const relationshipIds = new Map();
  const includeColumns = options.showColumns;
  const includeRelationships = options.showRelationships;
  const includeArtifact = options.showRuntime;
  const relationshipEdges = (Array.isArray(artifact.edges) ? artifact.edges : [])
    .filter((edge) => !options.invalidOnly || isWarningGraphStatus(edge.status));
  const relationshipTableNames = new Set();
  relationshipEdges.forEach((edge) => {
    if (edge.source_table) {
      relationshipTableNames.add(String(edge.source_table));
    }
    if (edge.target_table) {
      relationshipTableNames.add(String(edge.target_table));
    }
  });

  (Array.isArray(artifact.nodes) ? artifact.nodes : []).forEach((tableNode) => {
    const tableName = String(tableNode.table || "");
    if (!tableName) {
      return;
    }
    if (options.invalidOnly && !relationshipTableNames.has(tableName)) {
      return;
    }
    const nodeId = `relationship-table:${tableName}`;
    tableIds.set(tableName, nodeId);
    nodes.push({
      id: nodeId,
      label: tableName,
      type: "table",
      category: "table",
      data: objectOrEmpty(tableNode),
      evidence: ["relationship_graph.json"],
      table: tableName,
      column: "",
      artifactPath: "",
      sourceArtifact: "relationship_graph.json",
    });
    if (includeColumns) {
      arrayOfStrings(tableNode.primary_key).forEach((column) => {
        ensureRelationshipColumnNode(nodes, columnIds, tableName, column, {
          role: "primary_key",
          is_pk: true,
        });
      });
    }
  });

  relationshipEdges.forEach((edge) => {
    const sourceTable = String(edge.source_table || "");
    const targetTable = String(edge.target_table || "");
    const sourceTableId = tableIds.get(sourceTable);
    const targetTableId = tableIds.get(targetTable);
    const sourceColumnList = arrayOfStrings(edge.source_columns);
    const targetColumnList = arrayOfStrings(edge.target_columns);
    const sourceColumns = sourceColumnList.length ? sourceColumnList : arrayOfStrings([edge.source_column]);
    const targetColumns = targetColumnList.length ? targetColumnList : arrayOfStrings([edge.target_column]);
    if (!sourceTableId || !targetTableId) {
      return;
    }

    if (includeColumns) {
      sourceColumns.forEach((column) => {
        ensureRelationshipColumnNode(nodes, columnIds, sourceTable, column, {
          role: "foreign_key",
          relationship_id: edge.id,
        });
      });
      targetColumns.forEach((column) => {
        ensureRelationshipColumnNode(nodes, columnIds, targetTable, column, {
          role: "parent_key",
          relationship_id: edge.id,
        });
      });
    }

    if (includeRelationships) {
      const relNodeId = `relationship-edge:${edge.id || `${sourceTable}.${sourceColumns.join("_")}>${targetTable}`}`;
      relationshipIds.set(edge.id, relNodeId);
      nodes.push({
        id: relNodeId,
        label: edge.id || `${sourceTable} -> ${targetTable}`,
        type: "foreign_key",
        category: "relationship",
        data: objectOrEmpty(edge),
        evidence: ["relationship_graph.json"],
        table: sourceTable,
        column: "",
        artifactPath: "",
        sourceArtifact: "relationship_graph.json",
      });
      edges.push({
        source: relNodeId,
        target: sourceTableId,
        type: "uses_child_table",
        label: "child",
        status: edge.status || "",
        evidence: ["relationship_graph.json"],
        data: objectOrEmpty(edge),
      });
      edges.push({
        source: relNodeId,
        target: targetTableId,
        type: "uses_parent_table",
        label: "parent",
        status: edge.status || "",
        evidence: ["relationship_graph.json"],
        data: objectOrEmpty(edge),
      });
      if (includeColumns) {
        sourceColumns.forEach((column) => {
          const columnId = columnIds.get(`${sourceTable}.${column}`);
          if (columnId) {
            edges.push({
              source: relNodeId,
              target: columnId,
              type: "uses_child_column",
              label: "child column",
              status: edge.status || "",
              evidence: ["relationship_graph.json"],
              data: objectOrEmpty(edge),
            });
          }
        });
        targetColumns.forEach((column) => {
          const columnId = columnIds.get(`${targetTable}.${column}`);
          if (columnId) {
            edges.push({
              source: relNodeId,
              target: columnId,
              type: "uses_parent_column",
              label: "parent column",
              status: edge.status || "",
              evidence: ["relationship_graph.json"],
              data: objectOrEmpty(edge),
            });
          }
        });
      }
    } else if (includeColumns && sourceColumns.length && targetColumns.length) {
      sourceColumns.forEach((sourceColumn, index) => {
        const targetColumn = targetColumns[index] || targetColumns[0];
        const sourceColumnId = columnIds.get(`${sourceTable}.${sourceColumn}`);
        const targetColumnId = columnIds.get(`${targetTable}.${targetColumn}`);
        if (sourceColumnId && targetColumnId) {
          edges.push({
            source: sourceColumnId,
            target: targetColumnId,
            type: "foreign_key_column",
            label: edge.status || edge.cardinality || "FK",
            status: edge.status || "",
            evidence: ["relationship_graph.json"],
            data: objectOrEmpty(edge),
          });
        }
      });
    } else {
      edges.push({
        source: sourceTableId,
        target: targetTableId,
        type: "foreign_key",
        label: edge.status || edge.cardinality || "FK",
        status: edge.status || "",
        evidence: ["relationship_graph.json"],
        data: objectOrEmpty(edge),
      });
    }
  });

  if (includeColumns) {
    for (const [compound, columnId] of columnIds.entries()) {
      const tableName = compound.split(".")[0];
      const tableId = tableIds.get(tableName);
      if (tableId) {
        edges.push({
          source: tableId,
          target: columnId,
          type: "has_column",
          label: "column",
          status: "",
          evidence: ["relationship_graph.json"],
          data: {},
        });
      }
    }
  }

  if (includeArtifact) {
    const artifactNodeId = "relationship-artifact:relationship_graph.json";
    nodes.push({
      id: artifactNodeId,
      label: "relationship_graph.json",
      type: "artifact",
      category: "artifact",
      data: { path: "relationship_graph.json", summary: artifact.summary || {} },
      evidence: ["relationship_graph.json"],
      table: "",
      column: "",
      artifactPath: "relationship_graph.json",
      sourceArtifact: "relationship_graph.json",
    });
    const relatedIds = relationshipIds.size ? [...relationshipIds.values()] : [...tableIds.values()];
    relatedIds.forEach((nodeId) => {
      edges.push({
        source: nodeId,
        target: artifactNodeId,
        type: "summarized_by",
        label: "artifact",
        status: "",
        evidence: ["relationship_graph.json"],
        data: {},
      });
    });
  }

  return filterGraphModelByTable({
    title: "Relationship graph",
    sourceArtifact: "relationship_graph.json",
    categoryOrder: relationshipCategoryOrder,
    nodes,
    edges,
    summary: artifact.summary || {},
    emptyMessage: "No relationship nodes match the selected table and scope.",
  });
}

function ensureRelationshipColumnNode(nodes, columnIds, tableName, columnName, data = {}) {
  if (!tableName || !columnName) {
    return;
  }
  const key = `${tableName}.${columnName}`;
  if (columnIds.has(key)) {
    return;
  }
  const nodeId = `relationship-column:${key}`;
  columnIds.set(key, nodeId);
  nodes.push({
    id: nodeId,
    label: key,
    type: "column",
    category: "column",
    data: { table: tableName, column: columnName, ...data },
    evidence: ["relationship_graph.json"],
    table: tableName,
    column: columnName,
    artifactPath: "",
    sourceArtifact: "relationship_graph.json",
  });
}

function normalizeGraphEdge(edge, sourceArtifact) {
  return {
    source: String(edge.source || ""),
    target: String(edge.target || ""),
    type: String(edge.type || "edge"),
    label: String(edge.label || edge.type || ""),
    status: String(edge.status || edge.data?.status || ""),
    evidence: arrayOfStrings(edge.evidence),
    data: objectOrEmpty(edge.data),
    sourceArtifact,
  };
}

function emptyGraphModel(title, sourceArtifact, emptyMessage) {
  return {
    title,
    sourceArtifact,
    categoryOrder: lineageCategoryOrder,
    nodes: [],
    edges: [],
    summary: {},
    emptyMessage,
  };
}

function filterGraphModelByTable(model) {
  const selectedTable = state.dashboardFilters.table;
  if (selectedTable === "all") {
    return model;
  }
  const nodeIds = new Set(model.nodes.map((node) => node.id));
  const included = new Set(
    model.nodes
      .filter((node) => graphNodeMatchesTable(node, selectedTable))
      .map((node) => node.id),
  );

  model.edges.forEach((edge) => {
    if (included.has(edge.source) && nodeIds.has(edge.target)) {
      included.add(edge.target);
    }
    if (included.has(edge.target) && nodeIds.has(edge.source)) {
      included.add(edge.source);
    }
  });

  const nodes = model.nodes.filter((node) => included.has(node.id));
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = model.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  return { ...model, nodes, edges };
}

function applyDashboardGraphFocus(graph) {
  if (state.dashboardGraphDisplay !== "focus" || !state.dashboardGraphSelection?.id) {
    return graph;
  }
  const selectedId = state.dashboardGraphSelection.id;
  const included = new Set([selectedId]);
  graph.edges.forEach((edge) => {
    if (edge.source === selectedId) {
      included.add(edge.target);
    }
    if (edge.target === selectedId) {
      included.add(edge.source);
    }
  });
  const nodes = graph.nodes.filter((node) => included.has(node.id));
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  return { ...graph, nodes, edges };
}

function graphNodeMatchesTable(node, table) {
  if (!table || table === "all") {
    return true;
  }
  const data = node.data || {};
  return (
    node.table === table ||
    data.table === table ||
    data.child_table === table ||
    data.parent_table === table ||
    data.source_table === table ||
    data.target_table === table ||
    String(node.label || "").startsWith(`${table}.`) ||
    String(node.id || "").includes(`:${table}`) ||
    String(node.id || "").includes(`:${table}.`)
  );
}

function drawDashboardGraph(graph) {
  const layout = layoutDashboardGraph(graph);
  const selection = graphSelectionContext(graph);
  const display = graphDisplayLabels[state.dashboardGraphDisplay] || "Overview";
  const invalidLabel = state.dashboardGraphInvalidOnly ? " · invalid/warning only" : "";
  els.dashboardGraphStatus.textContent = `${graph.title} · ${display} · ${graphScopeLabels[state.dashboardGraphScope]} · ${graph.nodes.length} nodes · ${graph.edges.length} edges${invalidLabel}`;
  els.dashboardGraphSvg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  els.dashboardGraphSvg.style.minWidth = `${layout.width}px`;
  els.dashboardGraphSvg.innerHTML = `
    <defs>
      <marker id="graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z"></path>
      </marker>
    </defs>
    <g class="graph-edges">
      ${graph.edges.map((edge) => graphEdgeSvg(edge, layout.positions, selection)).join("")}
    </g>
    <g class="graph-nodes">
      ${graph.nodes.map((node) => graphNodeSvg(node, layout.positions.get(node.id), selection)).join("")}
    </g>
  `;
}

function layoutDashboardGraph(graph) {
  const compact = state.dashboardGraphDisplay === "overview" && graph.nodes.length <= 18;
  const nodeWidth = compact ? 136 : 176;
  const nodeHeight = 46;
  const xGap = compact ? 26 : 76;
  const yGap = 12;
  const margin = compact ? 16 : 28;
  const categoryOrder = graph.categoryOrder || lineageCategoryOrder;
  const groups = categoryOrder
    .map((category) => ({
      category,
      nodes: graph.nodes
        .filter((node) => node.category === category)
        .sort((a, b) => String(a.label).localeCompare(String(b.label))),
    }))
    .filter((group) => group.nodes.length);
  const maxRows = Math.max(...groups.map((group) => group.nodes.length), 1);
  const width = Math.max(compact ? 620 : 760, margin * 2 + groups.length * nodeWidth + Math.max(groups.length - 1, 0) * xGap);
  const height = Math.max(340, margin * 2 + maxRows * nodeHeight + Math.max(maxRows - 1, 0) * yGap);
  const positions = new Map();

  groups.forEach((group, groupIndex) => {
    const x = margin + groupIndex * (nodeWidth + xGap);
    group.nodes.forEach((node, rowIndex) => {
      const y = margin + rowIndex * (nodeHeight + yGap);
      positions.set(node.id, { x, y, width: nodeWidth, height: nodeHeight });
    });
  });
  return { width, height, positions };
}

function graphSelectionContext(graph) {
  const selectedId = state.dashboardGraphSelection?.id || "";
  const neighborIds = new Set();
  const activeEdgeKeys = new Set();
  if (!selectedId) {
    return { selectedId, neighborIds, activeEdgeKeys, hasSelection: false };
  }
  graph.edges.forEach((edge) => {
    if (edge.source === selectedId || edge.target === selectedId) {
      neighborIds.add(edge.source);
      neighborIds.add(edge.target);
      activeEdgeKeys.add(graphEdgeKey(edge));
    }
  });
  return { selectedId, neighborIds, activeEdgeKeys, hasSelection: true };
}

function graphEdgeKey(edge) {
  return `${edge.source}::${edge.target}::${edge.type}::${edge.label || ""}`;
}

function graphEdgeSvg(edge, positions, selection) {
  const source = positions.get(edge.source);
  const target = positions.get(edge.target);
  if (!source || !target) {
    return "";
  }
  const sameColumn = Math.abs(source.x - target.x) < 4;
  const x1 = source.x + source.width;
  const y1 = source.y + source.height / 2;
  const x2 = sameColumn ? target.x + target.width : target.x;
  const y2 = target.y + target.height / 2;
  const mid = sameColumn ? x1 + 36 : x1 + Math.max((x2 - x1) / 2, 34);
  const path = sameColumn
    ? `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`
    : `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  const tone = graphStatusTone(edge.status);
  const active = selection.activeEdgeKeys.has(graphEdgeKey(edge));
  const dimmed = selection.hasSelection && !active;
  const edgeClass = [
    "graph-edge-wrap",
    tone,
    active ? "selected" : "",
    dimmed ? "dimmed" : "",
  ].filter(Boolean).join(" ");
  const labelX = sameColumn ? mid + 6 : Math.min(x1, x2) + Math.abs(x2 - x1) / 2;
  const labelY = Math.min(y1, y2) + Math.abs(y2 - y1) / 2 - 6;
  return `
    <g class="${escapeHtml(edgeClass)}">
      <path class="graph-edge ${escapeHtml(tone)}" d="${path}" marker-end="url(#graph-arrow)">
        <title>${escapeHtml(edge.label || edge.type)}</title>
      </path>
      <text class="graph-edge-label" x="${labelX}" y="${labelY}">${escapeHtml(truncateMiddle(edge.label || edge.type, 22))}</text>
    </g>
  `;
}

function graphNodeSvg(node, position, selection) {
  if (!position) {
    return "";
  }
  const label = truncateMiddle(node.label, position.width < 150 ? 20 : 28);
  const category = graphCategoryLabels[node.category] || node.category;
  const selected = selection.selectedId === node.id;
  const neighbor = selection.neighborIds.has(node.id) && !selected;
  const dimmed = selection.hasSelection && !selected && !neighbor;
  const nodeClass = [
    "graph-node",
    `graph-node-${node.category}`,
    selected ? "selected" : "",
    neighbor ? "neighbor" : "",
    dimmed ? "dimmed" : "",
  ].filter(Boolean).join(" ");
  return `
    <g class="${escapeHtml(nodeClass)}" role="button" tabindex="0" data-graph-node-id="${escapeHtml(node.id)}" aria-label="${escapeHtml(`${category}: ${node.label}`)}" transform="translate(${position.x} ${position.y})">
      <title>${escapeHtml(`${category}: ${node.label}`)}</title>
      <rect width="${position.width}" height="${position.height}" rx="8"></rect>
      <text class="graph-node-label" x="12" y="20">${escapeHtml(label)}</text>
      <text class="graph-node-kind" x="12" y="36">${escapeHtml(category)}</text>
    </g>
  `;
}

function renderEmptyGraph(message) {
  els.dashboardGraphStatus.textContent = message;
  els.dashboardGraphLegend.innerHTML = `<span>No graph loaded</span>`;
  els.dashboardGraphSvg.setAttribute("viewBox", "0 0 760 240");
  els.dashboardGraphSvg.style.minWidth = "760px";
  els.dashboardGraphSvg.innerHTML = `
    <text class="graph-empty-text" x="380" y="120" text-anchor="middle">${escapeHtml(message)}</text>
  `;
  els.dashboardGraphDrilldownMeta.textContent = "No node";
  els.dashboardGraphDrilldown.innerHTML = `<p class="muted">Select a graph node to inspect metadata and evidence artifacts.</p>`;
}

function renderGraphLegend(graph) {
  const counts = countBy(graph.nodes, (node) => node.category);
  const ordered = (graph.categoryOrder || lineageCategoryOrder).filter((category) => counts.has(category));
  els.dashboardGraphLegend.innerHTML = ordered.map((category) => `
    <span class="graph-legend-item graph-legend-${escapeHtml(category)}">
      ${escapeHtml(graphCategoryLabels[category] || category)}
      <strong>${integerText(counts.get(category))}</strong>
    </span>
  `).join("");
}

function renderGraphDrilldown(graph) {
  const node = graph.nodes.find((candidate) => candidate.id === state.dashboardGraphSelection?.id);
  if (!node) {
    els.dashboardGraphDrilldownMeta.textContent = "No node";
    els.dashboardGraphDrilldown.innerHTML = `
      <div class="drilldown-summary">
        <div><span>${integerText(graph.nodes.length)}</span><p>nodes</p></div>
        <div><span>${integerText(graph.edges.length)}</span><p>edges</p></div>
        <div><span>${escapeHtml(state.dashboardGraphMode === "lineage" ? "lineage" : "FK")}</span><p>mode</p></div>
      </div>
      ${renderDrilldownArtifacts([graph.sourceArtifact])}
    `;
    return;
  }

  const connections = graphDirectConnections(graph, node.id);
  const issues = graphIssuesForNode(node, connections.edges);
  const artifacts = graphArtifactsForNode(node, graph, connections.edges);
  els.dashboardGraphDrilldownMeta.textContent = truncateMiddle(node.label, 36);
  els.dashboardGraphDrilldown.innerHTML = `
    <div class="graph-node-detail">
      <strong>${escapeHtml(node.label)}</strong>
      <p><code>${escapeHtml(node.id)}</code></p>
      <span class="pill-status ${graphNodePillClass(node)}">${escapeHtml(graphCategoryLabels[node.category] || node.category)}</span>
    </div>
    ${renderGraphMetadata(node)}
    ${renderGraphDirectConnections(connections)}
    ${renderGraphTableColumns(node)}
    ${renderIssueRows(issues)}
    ${renderDrilldownArtifacts(artifacts)}
  `;
}

function graphDirectConnections(graph, nodeId) {
  const nodesById = new Map(graph.nodes.map((candidate) => [candidate.id, candidate]));
  const edges = graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
  const nodes = edges
    .map((edge) => nodesById.get(edge.source === nodeId ? edge.target : edge.source))
    .filter(Boolean);
  return { edges, nodes };
}

function renderGraphDirectConnections(connections) {
  if (!connections.edges.length) {
    return `<p class="muted">No direct graph neighbors in the current view.</p>`;
  }
  return `
    <div class="graph-direct-evidence">
      <strong>Direct neighbors</strong>
      ${connections.edges.slice(0, 8).map((edge, index) => {
        const neighbor = connections.nodes[index];
        const status = edge.status ? ` · ${edge.status}` : "";
        return `
          <div>
            <span>${escapeHtml(edge.type || "edge")}${escapeHtml(status)}</span>
            <code>${escapeHtml(neighbor?.label || edge.target || edge.source)}</code>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderGraphTableColumns(node) {
  if (node.category !== "table") {
    return "";
  }
  const tableName = node.table || node.data?.table || node.label;
  const columns = tableColumnsForGraphNode(tableName);
  if (!columns.length) {
    return "";
  }
  return `
    <div class="graph-column-inspector">
      <strong>Columns in inspector</strong>
      <div>
        ${columns.slice(0, 12).map((column) => `
          <span><code>${escapeHtml(column.name)}</code>${column.kind ? `<small>${escapeHtml(column.kind)}</small>` : ""}</span>
        `).join("")}
        ${columns.length > 12 ? `<span><code>+${integerText(columns.length - 12)} more</code></span>` : ""}
      </div>
    </div>
  `;
}

function tableColumnsForGraphNode(tableName) {
  const profile = state.dashboardArtifacts["profile_summary.json"];
  const table = profile?.tables?.[tableName];
  const columns = objectOrEmpty(table?.columns);
  return Object.entries(columns)
    .map(([name, detail]) => ({
      name,
      kind: detail?.expected_type_from_dbml || detail?.inferred_type || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function graphIssuesForNode(node, directEdges = []) {
  const issues = getFilteredDashboardIssues();
  const data = node.data || {};
  const evidenceIssueIds = new Set(
    (Array.isArray(data.evidence_links) ? data.evidence_links : [])
      .map((link) => link.issue_id)
      .filter(Boolean),
  );
  directEdges.forEach((edge) => {
    (Array.isArray(edge.data?.evidence_links) ? edge.data.evidence_links : [])
      .map((link) => link.issue_id)
      .filter(Boolean)
      .forEach((issueId) => evidenceIssueIds.add(issueId));
  });
  if (evidenceIssueIds.size) {
    return issues.filter((issue) => evidenceIssueIds.has(issue.issue_id));
  }
  if (node.category === "column") {
    const table = node.table || data.table;
    const column = node.column || data.column;
    return issues.filter((issue) => (
      issue.table === table &&
      Array.isArray(issue.columns) &&
      issue.columns.includes(column)
    ));
  }
  if (node.category === "relationship") {
    const tables = new Set([
      data.child_table,
      data.parent_table,
      data.source_table,
      data.target_table,
    ].filter(Boolean));
    return issues.filter((issue) => relationshipIssueTypes.has(issue.issue_type) && tables.has(issue.table));
  }
  const table = node.table || data.table;
  if (node.category === "table" && table) {
    return issues.filter((issue) => issue.table === table);
  }
  return [];
}

function graphArtifactsForNode(node, graph, directEdges = []) {
  const paths = new Set([graph.sourceArtifact]);
  arrayOfStrings(node.evidence).forEach((path) => paths.add(path));
  if (node.artifactPath) {
    paths.add(node.artifactPath);
  }
  const evidenceLinks = Array.isArray(node.data?.evidence_links) ? node.data.evidence_links : [];
  evidenceLinks.forEach((link) => {
    if (link.sample_bad_rows_path) {
      paths.add(link.sample_bad_rows_path);
    }
  });
  directEdges.forEach((edge) => {
    arrayOfStrings(edge.evidence).forEach((path) => paths.add(path));
    const edgeEvidenceLinks = Array.isArray(edge.data?.evidence_links) ? edge.data.evidence_links : [];
    edgeEvidenceLinks.forEach((link) => {
      if (link.sample_bad_rows_path) {
        paths.add(link.sample_bad_rows_path);
      }
    });
  });
  return [...paths].filter((path) => artifactUrlFor(path));
}

function renderGraphMetadata(node) {
  const entries = graphMetadataEntries(node);
  if (!entries.length) {
    return `<p class="muted">No additional metadata for this node.</p>`;
  }
  return `
    <dl class="graph-metadata">
      ${entries.map(([key, value]) => `
        <div>
          <dt>${escapeHtml(key)}</dt>
          <dd>${escapeHtml(formatGraphValue(key, value))}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

function graphMetadataEntries(node) {
  const preferred = [
    "status",
    "source_type",
    "source_name",
    "row_count",
    "column_count",
    "primary_key",
    "child_table",
    "child_columns",
    "parent_table",
    "parent_columns",
    "source_table",
    "source_columns",
    "target_table",
    "target_columns",
    "declared_cardinality",
    "observed_cardinality",
    "cardinality",
    "metrics",
    "path",
    "duration_seconds",
  ];
  const data = node.data || {};
  const seen = new Set();
  const entries = [];
  preferred.forEach((key) => {
    if (hasRenderableGraphValue(data[key])) {
      entries.push([key, data[key]]);
      seen.add(key);
    }
  });
  Object.entries(data).forEach(([key, value]) => {
    if (!seen.has(key) && hasRenderableGraphValue(value) && entries.length < 14) {
      entries.push([key, value]);
    }
  });
  return entries.slice(0, 14);
}

function hasRenderableGraphValue(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return true;
}

function formatGraphValue(key, value) {
  if (/password|secret|token|credential|api[_-]?key/i.test(key)) {
    return "[redacted]";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return truncateMiddle(JSON.stringify(value), 180);
  }
  return truncateMiddle(String(value), 180);
}

function graphNodePillClass(node) {
  const status = node.data?.status || "";
  if (["invalid", "failed"].includes(status)) {
    return "missing";
  }
  if (["warning", "skipped"].includes(status)) {
    return "missing";
  }
  return "mapped";
}

function graphStatusTone(status) {
  if (["invalid", "failed", "error"].includes(status)) {
    return "danger";
  }
  if (["warning", "skipped"].includes(status)) {
    return "warn";
  }
  return "";
}

function isWarningGraphStatus(status) {
  return ["invalid", "failed", "error", "warning", "skipped"].includes(String(status || ""));
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayOfStrings(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item !== null && item !== undefined && item !== "").map((item) => String(item));
}

function tableFromNodeId(nodeId) {
  const match = nodeId.match(/^(?:table|column):([^.:/]+)/);
  return match ? match[1] : "";
}

function truncateMiddle(value, maxLength) {
  const text = String(value || "");
  if (text.length <= maxLength) {
    return text;
  }
  const keep = Math.max(4, Math.floor((maxLength - 1) / 2));
  return `${text.slice(0, keep)}...${text.slice(text.length - keep)}`;
}

function renderRiskPanel() {
  const spec = state.dashboardArtifacts[dashboardChartPaths.risk];
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const summary = spec?.summary || {};
  const riskScore = clampNumber(summary.risk_score ?? verdict.risk_score, 0, 100);
  const riskLabel = summary.verdict || verdict.verdict || "unknown";
  const issueCount = summary.issue_count ?? verdict.issue_counts?.total ?? getDashboardIssues().length;
  return dashboardPanel(
    "Dataset verdict",
    "dataset_verdict.json",
    `
      <button class="risk-gauge-button" type="button" data-dashboard-kind="verdict" data-dashboard-value="${escapeHtml(riskLabel)}" data-dashboard-label="Dataset verdict ${escapeHtml(riskLabel)}">
        ${riskGaugeSvg(riskScore)}
        <span><strong>${escapeHtml(riskLabel)}</strong><small>${riskScore}/100 risk · ${issueCount} issues</small></span>
      </button>
    `,
  );
}

function renderIssueSeverityPanel(filteredIssues) {
  const rows = severityOrder.map((severity) => ({
    label: severity,
    value: filteredIssues.filter((issue) => issue.severity === severity).length,
    kind: "severity",
  }));
  return dashboardPanel(
    "Issue counts by severity",
    dashboardChartPaths.severity,
    renderDashboardBars(rows, { valueFormatter: integerText }),
  );
}

function renderIssueTypePanel(filteredIssues) {
  const counts = countBy(filteredIssues, (issue) => issue.issue_type || "unknown");
  const rows = [...counts.entries()]
    .map(([label, value]) => ({ label, value, kind: "issue_type" }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 10);
  return dashboardPanel(
    "Issue counts by type",
    dashboardChartPaths.type,
    renderDashboardBars(rows, { empty: "No issue types match the current filters.", valueFormatter: integerText }),
  );
}

function renderMissingnessPanel() {
  const spec = state.dashboardArtifacts[dashboardChartPaths.missingTable];
  const rows = (spec?.data || [])
    .filter((row) => filterMatchesTable(row.table))
    .slice(0, 10)
    .map((row) => ({
      label: row.table,
      value: Number(row.null_rate || 0),
      count: Number(row.null_count || 0),
      kind: "table",
      detail: `${integerText(row.null_count)} nulls`,
    }));
  return dashboardPanel(
    "Missingness by table",
    dashboardChartPaths.missingTable,
    renderDashboardBars(rows, {
      empty: "No missingness rows match the current table filter.",
      valueFormatter: percentText,
    }),
  );
}

function renderRelationshipHealthPanel() {
  const spec = state.dashboardArtifacts[dashboardChartPaths.relationship];
  const edges = (spec?.details?.edges || []).filter((edge) => {
    const table = state.dashboardFilters.table;
    return table === "all" || edge.source_table === table || edge.target_table === table;
  });
  const statusCounts = edges.length
    ? countBy(edges, (edge) => edge.status || "unknown")
    : new Map((spec?.data || []).map((row) => [row.status || "unknown", Number(row.count || 0)]));
  const rows = [...statusCounts.entries()]
    .map(([status, value]) => ({
      label: relationshipStatusDisplayLabel(status),
      rawLabel: status,
      tone: status,
      value,
      kind: "relationship_status",
      detail: relationshipStatusDisplayDetail(status),
    }))
    .sort((a, b) => relationshipStatusOrder(a.rawLabel) - relationshipStatusOrder(b.rawLabel));
  return dashboardPanel(
    "Relationship FK status",
    dashboardChartPaths.relationship,
    renderDashboardBars(rows, { empty: "No relationship rows match the current table filter.", valueFormatter: integerText }),
  );
}

function renderInfluencePanel() {
  const spec = state.dashboardArtifacts[dashboardChartPaths.influence];
  if (!spec) {
    const influence = state.dashboardArtifacts["influence.json"] || {};
    const reason = influence.skipped_reason || influence.notes?.[0] || "No influence top features were generated.";
    return dashboardPanel(
      "Influence top features",
      "influence.json",
      `<p class="muted">${escapeHtml(reason)}</p>`,
    );
  }
  const rows = (spec.data || [])
    .filter((row) => {
      const table = state.dashboardFilters.table;
      return table === "all" || String(row.feature || "").startsWith(`${table}__`);
    })
    .slice(0, 10)
    .map((row) => ({
      label: row.feature,
      value: Math.abs(Number(row.score || 0)),
      rawValue: Number(row.score || 0),
      kind: "influence_feature",
      detail: row.method || "",
    }));
  return dashboardPanel(
    "Influence top features",
    dashboardChartPaths.influence,
    renderDashboardBars(rows, {
      empty: "No influence features match the current table filter.",
      valueFormatter: scoreText,
      rawValue: true,
    }),
  );
}

function dashboardPanel(title, artifactPath, body) {
  const artifactUrl = artifactUrlFor(artifactPath);
  return `
    <article class="dashboard-card" data-dashboard-panel-path="${escapeHtml(artifactPath)}" tabindex="-1">
      <div class="dashboard-card-heading">
        <strong>${escapeHtml(title)}</strong>
        ${artifactUrl ? renderArtifactReference(artifactPath, artifactUrl) : `<span>${escapeHtml(artifactPath)}</span>`}
      </div>
      ${body}
    </article>
  `;
}

function renderDashboardBars(rows, options = {}) {
  if (!rows.length) {
    return `<p class="muted">${escapeHtml(options.empty || "No rows available.")}</p>`;
  }
  const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row.value || 0))), 1);
  return `
    <div class="dashboard-bars">
      ${rows.map((row) => {
        const value = Number(row.value || 0);
        const width = Math.max(2, Math.round(Math.abs(value) / maxValue * 100));
        const displayValue = options.rawValue ? row.rawValue : value;
        const formatter = options.valueFormatter || integerText;
        const selectionValue = row.valueKey || row.rawLabel || row.label;
        const toneLabel = row.tone || row.rawLabel || row.label;
        return `
          <button class="dashboard-bar-row" type="button" data-dashboard-kind="${escapeHtml(row.kind)}" data-dashboard-value="${escapeHtml(selectionValue)}" data-dashboard-label="${escapeHtml(row.label)}">
            <span class="dashboard-bar-label">${escapeHtml(row.label)}</span>
            <span class="dashboard-bar-track"><span class="dashboard-bar-fill ${dashboardTone(toneLabel)}" style="width: ${width}%"></span></span>
            <span class="dashboard-bar-value">${escapeHtml(formatter(displayValue))}${row.detail ? `<small>${escapeHtml(row.detail)}</small>` : ""}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderDashboardDrilldown() {
  if (!state.dashboardArtifactIndex) {
    els.dashboardDrilldownMeta.textContent = "No selection";
    els.dashboardDrilldown.innerHTML = `<p class="muted">Select a chart item to inspect matching issues and artifact links.</p>`;
    return;
  }
  const selection = state.dashboardSelection || { kind: "overview", value: "", label: "Filtered issues" };
  const issues = dashboardIssuesForSelection(selection);
  const artifacts = drilldownArtifactsForSelection(selection);
  els.dashboardDrilldownMeta.textContent = selection.label || "Filtered issues";
  els.dashboardDrilldown.innerHTML = `
    <div class="drilldown-summary">
      <div><span>${issues.length}</span><p>matching issues</p></div>
      <div><span>${uniqueSorted(issues.map((issue) => issue.table).filter(Boolean)).length}</span><p>tables</p></div>
      <div><span>${integerText(sum(issues.map((issue) => Number(issue.bad_count || 0))))}</span><p>bad rows</p></div>
    </div>
    ${renderDrilldownSeverityFilters(selection)}
    ${renderTableAssessmentDetails(selection)}
    ${renderIssueRows(issues)}
    ${renderDrilldownArtifacts(artifacts)}
  `;
}

function renderDrilldownSeverityFilters(selection) {
  const baseSelection = selection?.kind === "severity"
    ? { kind: "overview", value: "", label: "Filtered issues" }
    : selection;
  const baseIssues = dashboardIssuesForSelection(baseSelection, {
    ignoreSeverityFilter: true,
    ignoreSelectionSeverity: true,
  });
  const counts = countBy(baseIssues, (issue) => issue.severity || "unknown");
  const activeSeverity = selection?.kind === "severity"
    ? selection.value
    : state.dashboardFilters.severity;
  const chips = [
    { value: "all", label: "All", count: baseIssues.length },
    ...severityOrder.map((severity) => ({
      value: severity,
      label: severity,
      count: counts.get(severity) || 0,
    })),
  ];
  return `
    <div class="drilldown-severity-filter" aria-label="Drilldown severity filter">
      <span>Severity filter</span>
      <div class="drilldown-severity-chips">
        ${chips.map((chip) => `
          <button
            class="drilldown-severity-chip ${chip.value === activeSeverity ? "active" : ""}"
            type="button"
            data-drilldown-severity="${escapeHtml(chip.value)}"
            aria-pressed="${chip.value === activeSeverity ? "true" : "false"}"
          >
            <strong>${escapeHtml(chip.label)}</strong>
            <small>${integerText(chip.count)}</small>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function setDrilldownSeverityFilter(severity) {
  const normalizedSeverity = severityOrder.includes(severity) ? severity : "all";
  state.dashboardFilters.severity = normalizedSeverity;
  if (state.dashboardSelection?.kind === "severity") {
    state.dashboardSelection = normalizedSeverity === "all"
      ? { kind: "overview", value: "", label: "Filtered issues" }
      : { kind: "severity", value: normalizedSeverity, label: normalizedSeverity };
  }
  renderDashboard();
  focusDashboardDrilldown();
}

function dashboardIssuesForSelection(selection, options = {}) {
  const issues = getFilteredDashboardIssues({ ignoreSeverityFilter: options.ignoreSeverityFilter });
  if (!selection || selection.kind === "overview" || selection.kind === "verdict") {
    return issues;
  }
  if (selection.kind === "severity") {
    return options.ignoreSelectionSeverity
      ? issues
      : issues.filter((issue) => issue.severity === selection.value);
  }
  if (selection.kind === "issue_type") {
    return issues.filter((issue) => issue.issue_type === selection.value);
  }
  if (selection.kind === "table") {
    return issues.filter((issue) => issue.table === selection.value);
  }
  if (selection.kind === "table_assessment") {
    return issues.filter((issue) => issue.table === selection.value);
  }
  if (selection.kind === "relationship_status") {
    const relationshipIssueTypes = new Set([
      "ORPHAN_FOREIGN_KEY",
      "PARENT_KEY_DUPLICATE",
      "FOREIGN_KEY_NULL",
      "CHILD_RELATIONSHIP_DUPLICATE",
    ]);
    return issues.filter((issue) => relationshipIssueTypes.has(issue.issue_type));
  }
  return issues;
}

function renderTableAssessmentDetails(selection) {
  if (!selection || selection.kind !== "table_assessment") {
    return "";
  }
  const assessment = getDashboardTableAssessments().find((row) => row.table === selection.value);
  if (!assessment) {
    return "";
  }
  const impact = assessment.business_impact || {};
  const columns = Array.isArray(assessment.affected_columns) ? assessment.affected_columns : [];
  const risks = Array.isArray(assessment.relationship_risks) ? assessment.relationship_risks : [];
  return `
    <div class="table-assessment-detail">
      <div>
        <strong><code>${escapeHtml(assessment.table)}</code></strong>
        <p>${escapeHtml(assessment.role || "unknown")} · ${escapeHtml(impact.label || "General analytics")}</p>
      </div>
      <span class="pill-status ${readinessPillClass(assessment.readiness)}">${escapeHtml(assessment.readiness || "unknown")}</span>
      <dl class="graph-metadata">
        <div><dt>review_score</dt><dd>${integerText(assessment.review_score ?? assessment.health_score)}/100</dd></div>
        <div><dt>business_impact</dt><dd>${escapeHtml(impact.category || "general_analytics")}</dd></div>
        <div><dt>impact_evidence</dt><dd>${escapeHtml(impact.rationale || "")}</dd></div>
        <div><dt>affected_columns</dt><dd>${escapeHtml(columns.length ? columns.join(", ") : "none")}</dd></div>
        <div><dt>relationship_risks</dt><dd>${integerText(risks.length)}</dd></div>
      </dl>
    </div>
  `;
}

function renderIssueRows(issues) {
  if (!issues.length) {
    return `<p class="muted">No issues match this selection.</p>`;
  }
  return `
    <div class="dashboard-issue-list">
      ${issues.slice(0, 12).map((issue) => {
        const sampleUrl = issue.sample_bad_rows_path ? artifactUrlFor(issue.sample_bad_rows_path) : "";
        return `
          <article class="dashboard-issue-row">
            <div>
              <strong>${escapeHtml(issue.issue_type || "UNKNOWN")}</strong>
              <p><code>${escapeHtml(issue.table || "unknown")}</code>${issue.columns?.length ? ` · <code>${escapeHtml(issue.columns.join(", "))}</code>` : ""}</p>
              ${renderIssueLocationSummary(issue)}
            </div>
            <span class="pill-status ${issue.severity === "P0" || issue.severity === "P1" ? "missing" : "mapped"}">${escapeHtml(issue.severity || "")}</span>
            <div class="issue-counts">
              <span>${integerText(issue.bad_count)} rows</span>
              <span>${percentText(issue.bad_rate)}</span>
            </div>
            ${renderIssueSampleButton(issue, sampleUrl)}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderIssueLocationSummary(issue) {
  const columns = arrayOfStrings(issue.columns);
  const path = issue.sample_bad_rows_path || "";
  return `
    <div class="issue-location-summary">
      <span>Table <code>${escapeHtml(issue.table || "unknown")}</code></span>
      <span>Columns <code>${escapeHtml(columns.length ? columns.join(", ") : "n/a")}</code></span>
      <span>Rows <code>${integerText(issue.bad_count)} bad</code></span>
      ${path ? `<span>Sample <code>${escapeHtml(path)}</code></span>` : ""}
    </div>
  `;
}

function renderIssueSampleButton(issue, sampleUrl) {
  if (!sampleUrl) {
    return `<span class="muted">no sample</span>`;
  }
  return `
    <button
      class="inline-preview-button"
      type="button"
      data-artifact-action="preview-issue-sample"
      data-issue-id="${escapeHtml(issue.issue_id || "")}"
      data-artifact-path="${escapeHtml(issue.sample_bad_rows_path)}"
      data-artifact-url="${escapeHtml(sampleUrl)}"
    >Preview row evidence</button>
  `;
}

function renderDrilldownArtifacts(artifacts) {
  if (!artifacts.length) {
    return "";
  }
  return `
    <div class="drilldown-artifacts">
      <strong>Relevant artifacts</strong>
      ${artifacts.map((path) => {
        const url = artifactUrlFor(path);
        return url
          ? renderArtifactReference(path, url)
          : `<code>${escapeHtml(path)}</code>`;
      }).join("")}
    </div>
  `;
}

function drilldownArtifactsForSelection(selection) {
  const paths = new Set(["issues.json", "dataset_verdict.json", "lineage_graph.json", "run_summary.json"]);
  if (selection?.kind === "severity") {
    paths.add(dashboardChartPaths.severity);
  }
  if (selection?.kind === "issue_type") {
    paths.add(dashboardChartPaths.type);
  }
  if (selection?.kind === "table") {
    paths.add("profile_summary.json");
    paths.add("table_assessments.json");
    paths.add(dashboardChartPaths.missingTable);
    paths.add(dashboardChartPaths.missingColumns);
  }
  if (selection?.kind === "table_assessment") {
    paths.add("table_assessments.json");
    paths.add("profile_summary.json");
    paths.add("relationship_graph.json");
  }
  if (selection?.kind === "relationship_status") {
    paths.add("relationship_graph.json");
    paths.add(dashboardChartPaths.relationship);
  }
  if (selection?.kind === "influence_feature") {
    paths.add("influence.json");
    paths.add(dashboardChartPaths.influence);
  }
  if (selection?.kind === "verdict") {
    paths.add(dashboardChartPaths.risk);
    paths.add("schema_evaluation.json");
    paths.add("relationship_graph.json");
  }
  return [...paths].filter((path) => artifactUrlFor(path));
}

function renderDashboardArtifacts() {
  const artifactIndex = state.dashboardArtifactIndex;
  const paths = Object.keys(artifactIndex?.artifact_urls || {}).sort();
  els.dashboardArtifactCount.textContent = `${paths.length} files`;
  if (!paths.length) {
    els.dashboardArtifactLinks.innerHTML = `<p class="muted">Dashboard sources are listed after artifact discovery.</p>`;
    return;
  }
  els.dashboardArtifactLinks.innerHTML = paths.map((path) => `
    ${isDashboardChartArtifact(path)
      ? renderArtifactNavigationCard(path, artifactIndex.artifact_urls[path], artifactLabel(path))
      : `<button class="artifact-link" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(path)}" data-artifact-url="${escapeHtml(artifactIndex.artifact_urls[path])}">
          <strong>${escapeHtml(artifactLabel(path))}</strong>
          <code>${escapeHtml(path)}</code>
          <span>Preview</span>
        </button>`}
  `).join("");
}

function getDashboardIssues() {
  return Array.isArray(state.dashboardArtifacts["issues.json"])
    ? state.dashboardArtifacts["issues.json"]
    : [];
}

function getDashboardTableAssessments() {
  const artifact = state.dashboardArtifacts["table_assessments.json"];
  return Array.isArray(artifact?.assessments) ? artifact.assessments : [];
}

function getFilteredDashboardIssues(options = {}) {
  return getDashboardIssues().filter((issue) => {
    const filters = state.dashboardFilters;
    return (
      (options.ignoreSeverityFilter || filters.severity === "all" || issue.severity === filters.severity) &&
      (filters.issueType === "all" || issue.issue_type === filters.issueType) &&
      (filters.table === "all" || issue.table === filters.table)
    );
  });
}

function filterMatchesTable(table) {
  return state.dashboardFilters.table === "all" || table === state.dashboardFilters.table;
}

function artifactUrlFor(path) {
  if (!path || !state.dashboardArtifactIndex?.job_id) {
    return "";
  }
  const mapped = state.dashboardArtifactIndex.artifact_urls?.[path];
  if (mapped) {
    return mapped;
  }
  return `/api/jobs/${state.dashboardArtifactIndex.job_id}/artifacts/${String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function isDashboardChartArtifact(path) {
  return Object.values(dashboardChartPaths).includes(path);
}

function renderArtifactReference(path, url) {
  if (!isDashboardChartArtifact(path)) {
    return `
      <button class="artifact-focus-button" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(path)}" data-artifact-url="${escapeHtml(url)}">
        <code>${escapeHtml(path)}</code>
        <span>Preview</span>
      </button>
    `;
  }
  return `
    <span class="artifact-reference">
      <button class="artifact-focus-button" type="button" data-artifact-action="focus-dashboard-artifact" data-artifact-path="${escapeHtml(path)}">
        <code>${escapeHtml(path)}</code>
        <span>View chart</span>
      </button>
      <button class="artifact-json-link" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(path)}" data-artifact-url="${escapeHtml(url)}">Review chart</button>
    </span>
  `;
}

function renderArtifactNavigationCard(path, url, label) {
  return `
    <div class="artifact-link-stack">
      <button class="artifact-link artifact-action-link" type="button" data-artifact-action="focus-dashboard-artifact" data-artifact-path="${escapeHtml(path)}">
        <strong>${escapeHtml(label || artifactLabel(path))}</strong>
        <code>${escapeHtml(path)}</code>
        <span>View chart</span>
      </button>
      <button class="artifact-json-link" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(path)}" data-artifact-url="${escapeHtml(url)}">Review chart</button>
    </div>
  `;
}

function focusDashboardArtifact(artifactPath) {
  if (!artifactPath) {
    return false;
  }
  const panel = [...els.dashboardPanelGrid.querySelectorAll("[data-dashboard-panel-path]")]
    .find((item) => item.dataset.dashboardPanelPath === artifactPath);
  if (!panel) {
    return false;
  }
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
  panel.focus({ preventScroll: true });
  renderDashboardMessage(`${artifactLabel(artifactPath)} selected in Dashboard.`, "success");
  return true;
}

function focusDashboardDrilldown() {
  requestAnimationFrame(() => {
    els.dashboardDrilldown.scrollIntoView({ behavior: "smooth", block: "start" });
    els.dashboardDrilldown.focus({ preventScroll: true });
  });
}

async function previewIssueSample(issueId) {
  const issue = getDashboardIssues().find((candidate) => candidate.issue_id === issueId);
  if (!issue || !issue.sample_bad_rows_path) {
    els.artifactPreviewMeta.textContent = issueId || "Issue sample";
    els.artifactPreview.innerHTML = `<p class="muted">No sample row artifact is available for this issue.</p>`;
    focusArtifactPreview();
    return;
  }
  const sampleUrl = artifactUrlFor(issue.sample_bad_rows_path);
  await previewArtifact(issue.sample_bad_rows_path, sampleUrl, renderIssueSampleContext(issue));
}

function renderIssueSampleContext(issue) {
  return {
    kind: "issue_sample",
    issueId: issue.issue_id || "",
    issueType: issue.issue_type || "UNKNOWN",
    severity: issue.severity || "",
    table: issue.table || "unknown",
    columns: arrayOfStrings(issue.columns),
    badCount: Number(issue.bad_count || 0),
    badRate: Number(issue.bad_rate || 0),
    samplePath: issue.sample_bad_rows_path || "",
  };
}

async function previewArtifact(artifactPath, artifactUrl = "", context = {}) {
  if (!artifactPath) {
    return;
  }
  const requestId = ++state.artifactPreviewRequestId;
  const url = artifactUrl || resolveArtifactUrl(artifactPath);
  els.artifactPreviewMeta.textContent = artifactPath;
  els.artifactPreview.innerHTML = `<p class="muted">Loading <code>${escapeHtml(artifactPath)}</code>...</p>`;
  focusArtifactPreview();
  if (!url) {
    els.artifactPreview.innerHTML = `<p class="muted">No artifact URL is available for <code>${escapeHtml(artifactPath)}</code>.</p>`;
    return;
  }

  const kind = artifactPreviewKind(artifactPath);
  if (kind === "html" || kind === "pdf") {
    els.artifactPreview.innerHTML = renderEmbeddedArtifactPreview(artifactPath, url, kind);
    return;
  }

  try {
    const cached = state.dashboardArtifacts[artifactPath];
    if (kind === "json" && cached !== undefined) {
      els.artifactPreview.innerHTML = renderJsonArtifactPreview(cached, artifactPath);
      return;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    if (requestId !== state.artifactPreviewRequestId) {
      return;
    }
    els.artifactPreview.innerHTML = renderArtifactPreviewContent(artifactPath, text, kind, context);
  } catch (error) {
    if (requestId !== state.artifactPreviewRequestId) {
      return;
    }
    els.artifactPreview.innerHTML = `
      <p class="muted">Unable to preview <code>${escapeHtml(artifactPath)}</code>: ${escapeHtml(error.message || "unknown error")}</p>
    `;
  }
}

function resolveArtifactUrl(path) {
  return artifactUrlFor(path) || artifactUrlFromArtifacts(path, state.currentJob?.artifacts || []);
}

function artifactPreviewKind(path) {
  const lower = String(path || "").toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return "html";
  }
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return "markdown";
  }
  if (lower.endsWith(".json") || lower.endsWith(".jsonl")) {
    return "json";
  }
  if (lower.endsWith(".csv")) {
    return "csv";
  }
  return "text";
}

function renderEmbeddedArtifactPreview(path, url, kind) {
  return `
    <div class="artifact-preview-embed">
      <div class="artifact-preview-banner">
        <strong>${escapeHtml(kind === "pdf" ? "PDF preview" : "HTML report preview")}</strong>
        <code>${escapeHtml(path)}</code>
      </div>
      <iframe class="artifact-preview-frame" title="${escapeHtml(path)}" src="${escapeHtml(url)}"></iframe>
    </div>
  `;
}

function renderArtifactPreviewContent(path, text, kind, context = {}) {
  if (kind === "json") {
    try {
      return renderJsonArtifactPreview(JSON.parse(text), path);
    } catch {
      return renderTextArtifactPreview(text, "Invalid JSON shown as text");
    }
  }
  if (kind === "markdown") {
    return renderMarkdownArtifactPreview(text);
  }
  if (kind === "csv") {
    return renderCsvArtifactPreview(text, context);
  }
  return renderTextArtifactPreview(text, artifactLabel(path));
}

function renderJsonArtifactPreview(value, path = "") {
  const artifactPath = String(path || value?.artifact || "json artifact");
  if (artifactPath === "relationship_graph.json") {
    return renderRelationshipGraphArtifactReview(artifactPath, value);
  }
  if (artifactPath === "lineage_graph.json") {
    return renderLineageGraphArtifactReview(artifactPath, value);
  }
  if (artifactPath === "dataset_verdict.json") {
    return renderDatasetVerdictArtifactReview(artifactPath, value);
  }
  if (artifactPath === "table_assessments.json") {
    return renderTableAssessmentsArtifactReview(artifactPath, value);
  }
  if (artifactPath === "issues.json" || Array.isArray(value)) {
    return renderIssuesArtifactReview(artifactPath, Array.isArray(value) ? value : []);
  }
  if (artifactPath === "schema_evaluation.json") {
    return renderSchemaEvaluationArtifactReview(artifactPath, value);
  }
  if (artifactPath === "schema_parse_report.json") {
    return renderSchemaParseArtifactReview(artifactPath, value);
  }
  if (artifactPath === "profile_summary.json") {
    return renderProfileSummaryArtifactReview(artifactPath, value);
  }
  if (artifactPath === "run_summary.json") {
    return renderRunSummaryArtifactReview(artifactPath, value);
  }
  if (artifactPath === "influence.json") {
    return renderInfluenceArtifactReview(artifactPath, value);
  }
  if (artifactPath.startsWith("charts/") || value?.artifact === "chart_spec") {
    return renderChartSpecArtifactReview(artifactPath, value);
  }
  return renderGenericJsonArtifactReview(artifactPath, value);
}

function renderRelationshipGraphArtifactReview(path, artifact) {
  const summary = objectOrEmpty(artifact?.summary);
  const nodes = Array.isArray(artifact?.nodes) ? artifact.nodes : [];
  const edges = Array.isArray(artifact?.edges) ? artifact.edges : [];
  const issueEdges = edges
    .slice()
    .sort((a, b) => relationshipStatusOrder(a.status) - relationshipStatusOrder(b.status))
    .slice(0, 8);
  return artifactReviewShell(
    "Relationship review",
    path,
    "FK data-quality status, cardinality, and table-level relationship evidence.",
    `
      ${artifactReviewKpis([
        ["tables", summary.node_count ?? nodes.length],
        ["relationships", summary.edge_count ?? edges.length],
        ["FK issues", summary.status_counts?.invalid ?? edges.filter((edge) => edge.status === "invalid").length],
        ["junctions", summary.junction_table_count ?? 0],
        ["many-to-many", summary.many_to_many_relationship_count ?? 0],
      ])}
      ${artifactReviewSection("Relationship status", issueEdges.length ? `
        <div class="artifact-review-rows">
          ${issueEdges.map((edge) => {
            const metrics = objectOrEmpty(edge.metrics);
            const evidence = Array.isArray(edge.evidence_links) ? edge.evidence_links : [];
            const sourceColumns = arrayOfStrings(edge.source_columns).join(", ") || edge.source_column || "";
            const targetColumns = arrayOfStrings(edge.target_columns).join(", ") || edge.target_column || "";
            return `
              <article class="artifact-review-row">
                <div class="artifact-review-row-header">
                  <strong><code>${escapeHtml(edge.source_table)}.${escapeHtml(sourceColumns)}</code> -> <code>${escapeHtml(edge.target_table)}.${escapeHtml(targetColumns)}</code></strong>
                  ${artifactReviewPill(relationshipStatusDisplayLabel(edge.status), edge.status || "unknown")}
                </div>
                <p>${escapeHtml(edge.status_reason || edge.cardinality || edge.declared_cardinality || "Relationship evidence")}</p>
                <div class="artifact-review-meta">
                  <span>${escapeHtml(edge.cardinality || edge.declared_cardinality || "unknown cardinality")}</span>
                  <span>${metrics.join_coverage === undefined ? "join coverage n/a" : `${percentText(metrics.join_coverage)} join coverage`}</span>
                  <span>${integerText(metrics.orphan_count)} orphans</span>
                  <span>${integerText(metrics.parent_duplicate_count)} parent duplicates</span>
                  <span>${integerText(metrics.child_fk_null_count)} FK nulls</span>
                </div>
                ${evidence.length ? `<div class="artifact-review-chip-list">${evidence.slice(0, 4).map((item) => `<span>${escapeHtml(item.issue_type || item.issue_id || "issue")} · ${escapeHtml(item.severity || "")}</span>`).join("")}</div>` : ""}
              </article>
            `;
          }).join("")}
        </div>
      ` : `<p class="muted">No relationships were declared in this artifact.</p>`)}
      ${artifactReviewSection("Tables in relationship graph", nodes.length ? `
        <div class="artifact-review-rows compact">
          ${nodes.slice(0, 10).map((node) => `
            <article class="artifact-review-row">
              <div class="artifact-review-row-header">
                <strong><code>${escapeHtml(node.table)}</code></strong>
                ${artifactReviewPill(node.status || "mapped")}
              </div>
              <div class="artifact-review-meta">
                <span>${integerText(node.row_count)} rows</span>
                <span>${integerText(node.column_count)} columns</span>
                <span>PK ${escapeHtml(arrayOfStrings(node.primary_key).join(", ") || "none")}</span>
                <span>${integerText(Array.isArray(node.foreign_keys) ? node.foreign_keys.length : 0)} FK</span>
                <span>${integerText(Array.isArray(node.referenced_by) ? node.referenced_by.length : 0)} inbound</span>
              </div>
            </article>
          `).join("")}
        </div>
        ${nodes.length > 10 ? `<p class="muted">Showing 10 of ${integerText(nodes.length)} tables.</p>` : ""}
      ` : `<p class="muted">No table nodes were found.</p>`)}
    `,
  );
}

function renderLineageGraphArtifactReview(path, artifact) {
  const summary = objectOrEmpty(artifact?.summary);
  const nodes = Array.isArray(artifact?.nodes) ? artifact.nodes : [];
  const edges = Array.isArray(artifact?.edges) ? artifact.edges : [];
  const nodeTypes = [...countBy(nodes, (node) => node.type || "unknown").entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return artifactReviewShell(
    "Lineage review",
    path,
    "Source, schema, table, runtime, and artifact dependency evidence.",
    `
      ${artifactReviewKpis([
        ["sources", summary.source_system_count],
        ["tables", summary.table_count],
        ["columns", summary.column_count],
        ["stages", summary.stage_count],
        ["artifacts", summary.artifact_count],
        ["edges", summary.edge_count ?? edges.length],
      ])}
      ${artifactReviewSection("Node inventory", `
        <div class="artifact-review-chip-list">
          ${nodeTypes.map(([type, count]) => `<span>${escapeHtml(type)} · ${integerText(count)}</span>`).join("") || "<span>No nodes</span>"}
        </div>
      `)}
      ${artifactReviewSection("Dependency examples", edges.length ? `
        <div class="artifact-review-rows compact">
          ${edges.slice(0, 8).map((edge) => `
            <article class="artifact-review-row">
              <div class="artifact-review-row-header">
                <strong><code>${escapeHtml(truncateMiddle(edge.source, 42))}</code> -> <code>${escapeHtml(truncateMiddle(edge.target, 42))}</code></strong>
                ${artifactReviewPill(edge.type || "edge")}
              </div>
              <div class="artifact-review-meta">
                ${arrayOfStrings(edge.evidence).slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("") || "<span>no evidence links</span>"}
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<p class="muted">No lineage edges were found.</p>`)}
    `,
  );
}

function renderDatasetVerdictArtifactReview(path, artifact) {
  const counts = objectOrEmpty(artifact?.issue_counts);
  const bySeverity = objectOrEmpty(counts.by_severity);
  const blockers = Array.isArray(artifact?.top_blockers) ? artifact.top_blockers : [];
  const scoreModel = objectOrEmpty(artifact?.risk_score_model);
  return artifactReviewShell(
    "Dataset verdict review",
    path,
    "EDA readiness, blocker issues, and deterministic review risk.",
    `
      ${artifactReviewKpis([
        ["verdict", artifact?.verdict || "unknown"],
        ["risk", artifact?.risk_score === undefined ? "--" : `${integerText(artifact.risk_score)}/100`],
        ["issues", counts.total ?? 0],
        ["P0", bySeverity.P0 ?? 0],
        ["P1", bySeverity.P1 ?? 0],
      ])}
      ${artifactReviewSection("Scoring model", `
        <p>${escapeHtml(scoreModel.description || "Risk score is a deterministic EDA review heuristic, not a statistical health model.")}</p>
        <p><code>${escapeHtml(scoreModel.formula || "Weighted severity, relationship, and schema findings capped at 100.")}</code></p>
      `)}
      ${artifactReviewSection("Top blockers", blockers.length ? `
        <div class="artifact-review-rows">
          ${blockers.slice(0, 8).map((issue) => renderIssueReviewRow(issue)).join("")}
        </div>
      ` : `<p class="muted">No top blockers were listed.</p>`)}
      ${artifactReviewSection("Next actions", arrayOfStrings(artifact?.recommended_next_actions).length ? `
        <ul class="artifact-review-list">${arrayOfStrings(artifact.recommended_next_actions).slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      ` : `<p class="muted">No recommended actions were listed.</p>`)}
    `,
  );
}

function renderTableAssessmentsArtifactReview(path, artifact) {
  const summary = objectOrEmpty(artifact?.summary);
  const scoreModel = objectOrEmpty(summary.score_model);
  const assessments = Array.isArray(artifact?.assessments) ? artifact.assessments : [];
  const sorted = assessments
    .slice()
    .sort((a, b) => (
      readinessOrder(a.readiness) - readinessOrder(b.readiness) ||
      Number(a.review_score ?? a.health_score ?? 0) - Number(b.review_score ?? b.health_score ?? 0) ||
      String(a.table || "").localeCompare(String(b.table || ""))
    ));
  return artifactReviewShell(
    "Table impact review",
    path,
    "Per-table readiness, review score, business impact, and relationship risk.",
    `
      ${artifactReviewKpis([
        ["tables", summary.table_count ?? assessments.length],
        ["avg review", summary.average_review_score ?? summary.average_health_score ?? "--"],
        ["not ready", summary.readiness_counts?.NOT_READY ?? sorted.filter((item) => item.readiness === "NOT_READY").length],
        ["business areas", Object.keys(objectOrEmpty(summary.business_impact_counts)).length],
      ])}
      ${artifactReviewSection("Scoring model", `
        <p>${escapeHtml(scoreModel.description || "Review score is a deterministic EDA prioritization heuristic, not a statistical health model.")}</p>
        <p><code>${escapeHtml(scoreModel.formula || "100 minus weighted issue and relationship penalties.")}</code></p>
      `)}
      ${artifactReviewSection("Highest-risk tables", sorted.length ? `
        <div class="artifact-review-rows">
          ${sorted.slice(0, 8).map((assessment) => {
            const impact = objectOrEmpty(assessment.business_impact);
            const risks = Array.isArray(assessment.relationship_risks) ? assessment.relationship_risks : [];
            return `
              <article class="artifact-review-row">
                <div class="artifact-review-row-header">
                  <strong><code>${escapeHtml(assessment.table)}</code></strong>
                  ${artifactReviewPill(assessment.readiness || "unknown")}
                </div>
                <p>${escapeHtml(impact.label || "General analytics")} · ${escapeHtml(assessment.role || "unknown role")}</p>
                <div class="artifact-review-meta">
                  <span>${integerText(assessment.review_score ?? assessment.health_score)} review score</span>
                  <span>${integerText(assessment.row_count)} rows</span>
                  <span>${integerText(assessment.column_count)} columns</span>
                  <span>${integerText(risks.length)} relationship risks</span>
                  <span>${integerText(arrayOfStrings(assessment.affected_columns).length)} affected columns</span>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      ` : `<p class="muted">No table assessments were found.</p>`)}
    `,
  );
}

function renderIssuesArtifactReview(path, issues) {
  const bySeverity = countBy(issues, (issue) => issue.severity || "unknown");
  const byType = [...countBy(issues, (issue) => issue.issue_type || "unknown").entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const badRows = sum(issues.map((issue) => Number(issue.bad_count || 0)));
  return artifactReviewShell(
    "Issue review",
    path,
    "Quality findings grouped by severity, table, and sample evidence.",
    `
      ${artifactReviewKpis([
        ["issues", issues.length],
        ["bad rows", badRows],
        ["P0", bySeverity.get("P0") || 0],
        ["P1", bySeverity.get("P1") || 0],
        ["types", byType.length],
      ])}
      ${artifactReviewSection("Issue type mix", `
        <div class="artifact-review-chip-list">
          ${byType.slice(0, 10).map(([type, count]) => `<span>${escapeHtml(type)} · ${integerText(count)}</span>`).join("") || "<span>No issue types</span>"}
        </div>
      `)}
      ${artifactReviewSection("Top issues", issues.length ? `
        <div class="artifact-review-rows">
          ${issues.slice(0, 10).map((issue) => renderIssueReviewRow(issue)).join("")}
        </div>
      ` : `<p class="muted">No issues were found.</p>`)}
    `,
  );
}

function renderSchemaEvaluationArtifactReview(path, artifact) {
  const summary = objectOrEmpty(artifact?.summary);
  const tables = Array.isArray(artifact?.tables) ? artifact.tables : [];
  const relationships = Array.isArray(artifact?.relationships) ? artifact.relationships : [];
  return artifactReviewShell(
    "Schema evaluation review",
    path,
    "DBML-to-CSV mapping, schema issues, and declared relationships.",
    `
      ${artifactReviewKpis([
        ["DBML tables", summary.dbml_table_count ?? tables.length],
        ["mapped", summary.mapped_table_count ?? tables.filter((table) => table.status === "mapped").length],
        ["missing", summary.missing_table_count ?? 0],
        ["extra CSV", summary.extra_csv_count ?? 0],
        ["schema issues", summary.schema_issue_count ?? 0],
        ["relationships", relationships.length],
      ])}
      ${artifactReviewSection("Table mapping", tables.length ? `
        <div class="artifact-review-rows compact">
          ${tables.slice(0, 10).map((table) => `
            <article class="artifact-review-row">
              <div class="artifact-review-row-header">
                <strong><code>${escapeHtml(table.table)}</code></strong>
                ${artifactReviewPill(table.status || "unknown")}
              </div>
              <div class="artifact-review-meta">
                <span>${integerText(table.dbml_column_count)} DBML columns</span>
                <span>${integerText(table.csv_column_count)} CSV columns</span>
                <span>${integerText(Array.isArray(table.schema_issues) ? table.schema_issues.length : 0)} schema issues</span>
                <span>PK ${escapeHtml(arrayOfStrings(table.primary_key).join(", ") || "none")}</span>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<p class="muted">No table mapping rows were found.</p>`)}
    `,
  );
}

function renderSchemaParseArtifactReview(path, artifact) {
  const counts = objectOrEmpty(artifact?.counts);
  const diagnostics = Array.isArray(artifact?.diagnostics) ? artifact.diagnostics : [];
  const unsupported = Array.isArray(artifact?.unsupported_constructs) ? artifact.unsupported_constructs : [];
  return artifactReviewShell(
    "DBML parse review",
    path,
    "Parser status, DBML objects, diagnostics, and unsupported syntax.",
    `
      ${artifactReviewKpis([
        ["status", artifact?.status || "unknown"],
        ["tables", counts.tables ?? 0],
        ["columns", counts.columns ?? 0],
        ["relationships", counts.relationships ?? 0],
        ["warnings", counts.warnings ?? diagnostics.filter((item) => item.severity === "warning").length],
        ["unsupported", counts.unsupported_constructs ?? unsupported.length],
      ])}
      ${artifactReviewSection("Diagnostics", diagnostics.length ? `
        <div class="artifact-review-rows compact">
          ${diagnostics.slice(0, 8).map((diagnostic) => `
            <article class="artifact-review-row">
              <div class="artifact-review-row-header">
                <strong>${escapeHtml(diagnostic.message || diagnostic.code || "Diagnostic")}</strong>
                ${artifactReviewPill(diagnostic.severity || "info")}
              </div>
              <div class="artifact-review-meta">
                <span>${escapeHtml(diagnostic.location || diagnostic.line || "no location")}</span>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<p class="muted">No DBML parser diagnostics.</p>`)}
    `,
  );
}

function renderProfileSummaryArtifactReview(path, artifact) {
  const tables = artifact?.tables && typeof artifact.tables === "object" ? Object.values(artifact.tables) : [];
  const columnCount = sum(tables.map((table) => Number(table.column_count || 0)));
  const rowCount = sum(tables.map((table) => Number(table.row_count || 0)));
  return artifactReviewShell(
    "Profile summary review",
    path,
    "Streaming table and column profile results.",
    `
      ${artifactReviewKpis([
        ["tables", tables.length],
        ["columns", columnCount],
        ["rows", rowCount],
      ])}
      ${artifactReviewSection("Tables", tables.length ? `
        <div class="artifact-review-rows compact">
          ${tables.slice(0, 10).map((table) => {
            const columns = table.columns && typeof table.columns === "object" ? Object.values(table.columns) : [];
            const missingColumns = columns.filter((column) => Number(column.null_count || 0) > 0);
            return `
              <article class="artifact-review-row">
                <div class="artifact-review-row-header">
                  <strong><code>${escapeHtml(table.table)}</code></strong>
                  <span>${integerText(table.row_count)} rows</span>
                </div>
                <div class="artifact-review-meta">
                  <span>${integerText(table.column_count)} columns</span>
                  <span>${integerText(missingColumns.length)} columns with nulls</span>
                  <span>${escapeHtml(formatBytes(Number(table.file_size_mb || 0) * 1024 * 1024))}</span>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      ` : `<p class="muted">No table profiles were found.</p>`)}
    `,
  );
}

function renderRunSummaryArtifactReview(path, artifact) {
  const stages = Array.isArray(artifact?.stage_timings) ? artifact.stage_timings : [];
  const artifacts = Array.isArray(artifact?.artifact_paths) ? artifact.artifact_paths : [];
  return artifactReviewShell(
    "Runtime review",
    path,
    "Pipeline status, stage timing, and generated artifact inventory.",
    `
      ${artifactReviewKpis([
        ["status", artifact?.status || "unknown"],
        ["duration", artifact?.duration_seconds === undefined ? "--" : `${Number(artifact.duration_seconds).toFixed(2)}s`],
        ["stages", stages.length],
        ["artifacts", artifacts.length],
        ["failed", Array.isArray(artifact?.failed_stages) ? artifact.failed_stages.length : 0],
      ])}
      ${artifactReviewSection("Stages", stages.length ? `
        <div class="artifact-review-rows compact">
          ${stages.map((stage) => `
            <article class="artifact-review-row">
              <div class="artifact-review-row-header">
                <strong>${escapeHtml(stage.display_name || stage.name)}</strong>
                ${artifactReviewPill(stage.status || "unknown")}
              </div>
              <div class="artifact-review-meta">
                <span><code>${escapeHtml(stage.name)}</code></span>
                <span>${stage.duration_seconds === undefined ? "--" : `${Number(stage.duration_seconds).toFixed(3)}s`}</span>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<p class="muted">No stage timings were found.</p>`)}
    `,
  );
}

function renderInfluenceArtifactReview(path, artifact) {
  const features = Array.isArray(artifact?.top_features) ? artifact.top_features : [];
  return artifactReviewShell(
    "Influence review",
    path,
    "Bounded influence analysis result for the selected target.",
    `
      ${artifactReviewKpis([
        ["target", artifact?.target || "unknown"],
        ["method", artifact?.method || "unknown"],
        ["rows", artifact?.row_count ?? 0],
        ["features", features.length],
      ])}
      ${artifactReviewSection("Top features", features.length ? `
        <div class="artifact-review-rows compact">
          ${features.slice(0, 8).map((feature) => `
            <article class="artifact-review-row">
              <div class="artifact-review-row-header">
                <strong><code>${escapeHtml(feature.feature)}</code></strong>
                <span>${scoreText(feature.score)}</span>
              </div>
              <p>${escapeHtml(feature.interpretation || feature.direction || "Feature influence evidence")}</p>
              <div class="artifact-review-meta">
                <span>${escapeHtml(feature.direction || "direction n/a")}</span>
                <span>${escapeHtml(feature.method || "method n/a")}</span>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<p class="muted">No influence features were generated.</p>`)}
    `,
  );
}

function renderChartSpecArtifactReview(path, artifact) {
  const data = Array.isArray(artifact?.data) ? artifact.data : [];
  const sourceArtifacts = arrayOfStrings(artifact?.source_artifacts);
  return artifactReviewShell(
    artifact?.title || "Chart spec review",
    path,
    chartSpecReviewSubtitle(artifact),
    `
      ${artifactReviewKpis([
        ["chart id", artifact?.chart_id || "unknown"],
        ["type", artifact?.chart_type || "unknown"],
        ["rows", data.length],
        ["sources", sourceArtifacts.length],
      ])}
      ${artifactReviewSection("Chart preview", renderChartSpecPreview(artifact))}
      ${artifactReviewSection("Chart data", data.length ? `
        <div class="artifact-review-rows compact">
          ${data.slice(0, 10).map((row) => {
            const entries = Object.entries(objectOrEmpty(row)).filter(([key]) => key !== "sort_order");
            return `
              <article class="artifact-review-row">
                <div class="artifact-review-meta">
                  ${entries.map(([key, item]) => `<span><code>${escapeHtml(key)}</code> ${escapeHtml(formatReviewValue(item))}</span>`).join("")}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      ` : `<p class="muted">This chart spec has no data rows.</p>`)}
      ${artifactReviewSection("Source artifacts", sourceArtifacts.length ? `
        <div class="artifact-review-chip-list">${sourceArtifacts.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      ` : `<p class="muted">No source artifacts listed.</p>`)}
    `,
  );
}

function chartSpecReviewSubtitle(artifact) {
  const chartType = String(artifact?.chart_type || "chart");
  if (artifact?.chart_id === "relationship_fk_health") {
    return `${chartType} spec rendered by the dashboard. FK issue means the declared relationship exists, but data-quality checks found null, orphan, or duplicate key evidence.`;
  }
  return `${chartType} spec rendered by the dashboard.`;
}

function renderChartSpecPreview(artifact) {
  const chartType = String(artifact?.chart_type || "").toLowerCase();
  if (chartType === "gauge") {
    return renderArtifactGaugePreview(artifact);
  }
  return renderArtifactBarPreview(artifact);
}

function renderArtifactGaugePreview(artifact) {
  const data = Array.isArray(artifact?.data) ? artifact.data : [];
  const riskRow = data.find((row) => String(row?.label || "").toLowerCase() === "risk") || data[0] || {};
  const riskScore = clampNumber(riskRow.value ?? artifact?.summary?.risk_score, 0, 100);
  const verdict = artifact?.summary?.verdict || "Gauge";
  const issueCount = artifact?.summary?.issue_count;
  return `
    <div class="artifact-chart-preview artifact-chart-gauge">
      ${riskGaugeSvg(riskScore)}
      <div class="artifact-chart-gauge-copy">
        <strong>${integerText(riskScore)}/100 risk</strong>
        <span>${escapeHtml(verdict)}</span>
        ${issueCount === undefined ? "" : `<small>${integerText(issueCount)} issues from dataset_verdict.json</small>`}
      </div>
    </div>
  `;
}

function renderArtifactBarPreview(artifact) {
  const rows = chartPreviewRows(artifact);
  if (!rows.length) {
    return `<p class="muted">This chart spec has no renderable rows.</p>`;
  }
  const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row.value || 0))), 1);
  return `
    <div class="artifact-chart-preview artifact-chart-bars" role="img" aria-label="${escapeHtml(artifact?.title || "Chart preview")}">
      ${rows.slice(0, 12).map((row) => {
        const value = Number(row.value || 0);
        const width = value === 0 ? 0 : Math.max(2, Math.round(Math.abs(value) / maxValue * 100));
        return `
          <div class="artifact-chart-bar-row">
            <span class="artifact-chart-label">${escapeHtml(row.label)}</span>
            <span class="artifact-chart-track">
              <span class="artifact-chart-fill ${dashboardTone(row.tone || row.label)}" style="width: ${width}%"></span>
            </span>
            <span class="artifact-chart-value">${escapeHtml(row.displayValue)}${row.detail ? `<small>${escapeHtml(row.detail)}</small>` : ""}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function chartPreviewRows(artifact) {
  const data = Array.isArray(artifact?.data) ? artifact.data : [];
  const chartType = String(artifact?.chart_type || "").toLowerCase();
  const isRelationshipHealth = artifact?.chart_id === "relationship_fk_health";
  return data.map((row, index) => {
    const normalized = objectOrEmpty(row);
    const rawStatus = normalized.status === undefined ? "" : String(normalized.status);
    const label = isRelationshipHealth && rawStatus
      ? relationshipStatusDisplayLabel(rawStatus)
      : chartPreviewLabel(normalized, index + 1);
    const valueKey = chartPreviewValueKey(normalized);
    const numericValue = Number(normalized[valueKey] ?? 0);
    return {
      label,
      tone: isRelationshipHealth && rawStatus ? rawStatus : label,
      value: Number.isFinite(numericValue) ? numericValue : 0,
      displayValue: chartPreviewDisplayValue(normalized[valueKey], valueKey, chartType),
      detail: isRelationshipHealth && rawStatus
        ? relationshipStatusDisplayDetail(rawStatus)
        : chartPreviewDetail(normalized),
    };
  });
}

function chartPreviewLabel(row, fallbackIndex) {
  const key = ["severity", "issue_type", "table", "column", "status", "feature", "label"].find((candidate) => row[candidate] !== undefined && row[candidate] !== "");
  return key ? String(row[key]) : `row ${fallbackIndex}`;
}

function chartPreviewValueKey(row) {
  return ["count", "null_rate", "missing_rate", "value", "score"].find((candidate) => row[candidate] !== undefined && row[candidate] !== "") || "value";
}

function chartPreviewDisplayValue(value, valueKey, chartType) {
  if (valueKey.includes("rate")) {
    return percentText(value);
  }
  if (chartType === "horizontal_bar" || valueKey === "score") {
    return scoreText(value);
  }
  return integerText(value);
}

function chartPreviewDetail(row) {
  if (row.method) {
    return row.method;
  }
  if (row.direction) {
    return row.direction;
  }
  if (row.rank !== undefined) {
    return `rank ${integerText(row.rank)}`;
  }
  return "";
}

function renderGenericJsonArtifactReview(path, value) {
  const isArray = Array.isArray(value);
  const entries = isArray
    ? value.map((item, index) => [String(index), item])
    : Object.entries(objectOrEmpty(value));
  const arrayCount = entries.filter(([, item]) => Array.isArray(item)).length;
  const objectCount = entries.filter(([, item]) => item && typeof item === "object" && !Array.isArray(item)).length;
  const primitiveCount = entries.length - arrayCount - objectCount;
  return artifactReviewShell(
    artifactLabel(path),
    path,
    "Structured JSON artifact summary.",
    `
      ${artifactReviewKpis([
        [isArray ? "items" : "fields", entries.length],
        ["arrays", arrayCount],
        ["objects", objectCount],
        ["values", primitiveCount],
      ])}
      ${artifactReviewSection("Top-level fields", entries.length ? `
        <div class="artifact-review-rows compact">
          ${entries.slice(0, 16).map(([key, item]) => `
            <article class="artifact-review-row">
              <div class="artifact-review-row-header">
                <strong><code>${escapeHtml(key)}</code></strong>
                <span>${escapeHtml(reviewValueKind(item))}</span>
              </div>
              <p>${escapeHtml(formatReviewValue(item))}</p>
            </article>
          `).join("")}
        </div>
        ${entries.length > 16 ? `<p class="muted">Showing 16 of ${integerText(entries.length)} top-level entries.</p>` : ""}
      ` : `<p class="muted">Empty JSON artifact.</p>`)}
    `,
  );
}

function artifactReviewShell(title, path, subtitle, body) {
  return `
    <div class="artifact-review">
      <div class="artifact-review-header">
        <div>
          <p class="eyebrow">Artifact review</p>
          <h4>${escapeHtml(title)}</h4>
          <code>${escapeHtml(path)}</code>
        </div>
        <span>${escapeHtml(subtitle)}</span>
      </div>
      ${body}
    </div>
  `;
}

function artifactReviewKpis(items) {
  const rows = items
    .filter((item) => item && item[1] !== undefined && item[1] !== null)
    .map(([label, value]) => `
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(formatReviewValue(value))}</strong>
      </div>
    `)
    .join("");
  return `<div class="artifact-review-kpis">${rows}</div>`;
}

function artifactReviewSection(title, body) {
  return `
    <section class="artifact-review-section">
      <div class="artifact-review-section-heading">
        <strong>${escapeHtml(title)}</strong>
      </div>
      ${body}
    </section>
  `;
}

function artifactReviewPill(value, toneValue = value) {
  return `<span class="artifact-review-pill ${escapeHtml(artifactReviewTone(toneValue))}">${escapeHtml(value || "unknown")}</span>`;
}

function artifactReviewTone(value) {
  const text = String(value || "").toLowerCase();
  if (["invalid", "not_ready", "failed", "error", "p0", "p1"].some((item) => text.includes(item))) {
    return "danger";
  }
  if (["warning", "warn", "skipped", "pending", "unsupported", "p2"].some((item) => text.includes(item))) {
    return "warn";
  }
  if (["valid", "ready", "success", "completed", "mapped", "parsed"].some((item) => text.includes(item))) {
    return "success";
  }
  return "";
}

function renderIssueReviewRow(issue) {
  const columns = arrayOfStrings(issue.columns).join(", ") || "n/a";
  const sampleUrl = issue.sample_bad_rows_path ? artifactUrlFor(issue.sample_bad_rows_path) : "";
  const causes = arrayOfStrings(issue.probable_causes);
  const fixes = arrayOfStrings(issue.suggested_fix);
  return `
    <article class="artifact-review-row">
      <div class="artifact-review-row-header">
        <strong>${escapeHtml(issue.issue_type || issue.issue_id || "Issue")}</strong>
        ${artifactReviewPill(issue.severity || "unknown")}
      </div>
      <p><code>${escapeHtml(issue.table || "unknown table")}</code> · ${escapeHtml(columns)}</p>
      <div class="artifact-review-meta">
        <span>${integerText(issue.bad_count)} bad rows</span>
        <span>${percentText(issue.bad_rate)} bad rate</span>
        ${issue.sample_bad_rows_path ? `<span>${escapeHtml(issue.sample_bad_rows_path)}</span>` : ""}
      </div>
      ${causes.length ? `<p><strong>Likely cause:</strong> ${escapeHtml(causes[0])}</p>` : ""}
      ${fixes.length ? `<p><strong>Suggested fix:</strong> ${escapeHtml(fixes[0])}</p>` : ""}
      ${renderIssueSampleButton(issue, sampleUrl)}
    </article>
  `;
}

function reviewValueKind(value) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value && typeof value === "object") {
    return "object";
  }
  return typeof value;
}

function formatReviewValue(value) {
  if (Array.isArray(value)) {
    return `${integerText(value.length)} items`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    return `${integerText(keys.length)} fields${keys.length ? `: ${keys.slice(0, 4).join(", ")}` : ""}`;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? integerText(value) : Number(value).toFixed(4);
  }
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  return truncateMiddle(String(value), 96);
}

function renderRawJsonArtifactPreview(value) {
  return `
    <div class="artifact-preview-json">
      ${jsonPreviewNode(value, 0)}
    </div>
  `;
}

function jsonPreviewNode(value, depth) {
  if (value === null || typeof value !== "object") {
    return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
  }
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);
  const summary = Array.isArray(value)
    ? `Array(${entries.length})`
    : `Object(${entries.length})`;
  return `
    <details class="json-node" ${depth < 2 ? "open" : ""}>
      <summary><code>${escapeHtml(summary)}</code></summary>
      <div class="json-children">
        ${entries.map(([key, item]) => `
          <div class="json-row">
            <span class="json-key">${escapeHtml(key)}</span>
            <span class="json-value">${jsonPreviewNode(item, depth + 1)}</span>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

function renderMarkdownArtifactPreview(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  let html = "";
  let inCode = false;
  let codeLines = [];
  let inList = false;
  function closeList() {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  }
  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`;
        codeLines = [];
      } else {
        closeList();
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 2, 6);
      html += `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      return;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${escapeHtml(bullet[1])}</li>`;
      return;
    }
    closeList();
    if (line.trim()) {
      html += `<p>${escapeHtml(line)}</p>`;
    }
  });
  closeList();
  if (inCode) {
    html += `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`;
  }
  return `<div class="artifact-preview-markdown">${html || "<p class=\"muted\">Empty Markdown artifact.</p>"}</div>`;
}

function renderCsvArtifactPreview(text, context = {}) {
  if (context.kind === "issue_sample") {
    return renderIssueSampleCsvPreview(text, context);
  }
  const rows = parseCsvRows(text);
  if (!rows.length) {
    return `<p class="muted">Empty CSV artifact.</p>`;
  }
  const [header, ...body] = rows;
  const shownRows = body.slice(0, 200);
  const truncated = body.length > shownRows.length;
  return `
    <div class="artifact-preview-table-wrap">
      <table class="artifact-preview-table">
        <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
        <tbody>
          ${shownRows.map((row) => `<tr>${header.map((_, index) => `<td>${escapeHtml(row[index] || "")}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
    ${truncated ? `<p class="muted">Showing first ${integerText(shownRows.length)} of ${integerText(body.length)} rows.</p>` : ""}
  `;
}

function renderIssueSampleCsvPreview(text, context) {
  const rows = parseCsvRows(text);
  if (!rows.length) {
    return `
      ${renderIssueSampleBanner(context, 0)}
      <p class="muted">The sample artifact is empty.</p>
    `;
  }
  const [header, ...body] = rows;
  const highlightColumns = new Set(arrayOfStrings(context.columns));
  const shownRows = body.slice(0, 50);
  const truncated = body.length > shownRows.length;
  const highlightedHeader = header.filter((column) => highlightColumns.has(column));
  return `
    <div class="issue-sample-preview">
      ${renderIssueSampleBanner(context, body.length)}
      <div class="issue-sample-hint">
        <span>Highlighted columns</span>
        <strong>${escapeHtml(highlightedHeader.length ? highlightedHeader.join(", ") : arrayOfStrings(context.columns).join(", ") || "n/a")}</strong>
      </div>
      <div class="artifact-preview-table-wrap">
        <table class="artifact-preview-table issue-sample-table">
          <thead>
            <tr>
              <th class="issue-row-marker">Sample row</th>
              ${header.map((cell) => `<th class="${highlightColumns.has(cell) ? "issue-column-highlight" : ""}">${escapeHtml(cell)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${shownRows.map((row, rowIndex) => `
              <tr>
                <td class="issue-row-marker">${escapeHtml(sampleRowLabel(row, header, rowIndex))}</td>
                ${header.map((cell, columnIndex) => `<td class="${highlightColumns.has(cell) ? "issue-column-highlight" : ""}">${escapeHtml(row[columnIndex] || "")}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ${truncated ? `<p class="muted">Showing first ${integerText(shownRows.length)} of ${integerText(body.length)} sample rows.</p>` : ""}
      <p class="muted">Rows are from the generated bounded bad-row sample artifact. Source file row numbers are shown only when present in the sample.</p>
    </div>
  `;
}

function renderIssueSampleBanner(context, sampleRowCount) {
  const columns = arrayOfStrings(context.columns);
  return `
    <div class="issue-sample-banner">
      <div>
        <p class="eyebrow">Issue row evidence</p>
        <strong>${escapeHtml(context.issueType || "UNKNOWN")}</strong>
        <span><code>${escapeHtml(context.issueId || "issue")}</code> · ${escapeHtml(context.severity || "severity n/a")}</span>
      </div>
      <div class="issue-sample-banner-grid">
        <span>Table <code>${escapeHtml(context.table || "unknown")}</code></span>
        <span>Columns <code>${escapeHtml(columns.length ? columns.join(", ") : "n/a")}</code></span>
        <span>Bad rows <code>${integerText(context.badCount)}</code></span>
        <span>Sample rows <code>${integerText(sampleRowCount)}</code></span>
        <span>Bad rate <code>${percentText(context.badRate)}</code></span>
      </div>
    </div>
  `;
}

function sampleRowLabel(row, header, rowIndex) {
  const rowNumberColumns = ["__row_number", "__vsf_row_number", "row_number", "_row_number", "source_row_number"];
  const foundColumn = rowNumberColumns.find((column) => header.includes(column));
  if (foundColumn) {
    const value = row[header.indexOf(foundColumn)];
    if (value) {
      return `Source row ${value}`;
    }
  }
  return `Sample row ${rowIndex + 1}`;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = String(text || "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === "\"") {
      if (quoted && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((items) => items.some((item) => item !== ""));
}

function renderTextArtifactPreview(text, label) {
  return `
    <div class="artifact-preview-text">
      <strong>${escapeHtml(label || "Text artifact")}</strong>
      <pre><code>${escapeHtml(String(text || ""))}</code></pre>
    </div>
  `;
}

function focusArtifactPreview() {
  requestAnimationFrame(() => {
    els.artifactPreview.scrollIntoView({ behavior: "smooth", block: "start" });
    els.artifactPreview.focus({ preventScroll: true });
  });
}

function artifactLabel(path) {
  const labels = {
    "issues.json": "Issues",
    "connector_metadata.json": "Connector metadata",
    "schema_parse_report.json": "Schema parse diagnostics",
    "lineage_graph.json": "Lineage graph",
    "profile_summary.json": "Profile summary",
    "relationship_graph.json": "Relationship graph",
    "dataset_verdict.json": "Dataset verdict",
    "table_assessments.json": "Table assessments",
    "schema_evaluation.json": "Schema evaluation",
    "influence.json": "Influence",
    "run_summary.json": "Run summary",
  };
  return labels[path] || path.replace(/^charts\//, "Chart: ");
}

function riskGaugeSvg(score) {
  const normalized = clampNumber(score, 0, 100);
  const circumference = 2 * Math.PI * 42;
  const filled = circumference * normalized / 100;
  return `
    <svg class="risk-gauge" viewBox="0 0 104 104" role="img" aria-label="Risk score ${normalized} out of 100">
      <circle class="risk-gauge-bg" cx="52" cy="52" r="42"></circle>
      <circle class="risk-gauge-value" cx="52" cy="52" r="42" stroke-dasharray="${filled} ${circumference - filled}"></circle>
      <text x="52" y="56" text-anchor="middle">${normalized}</text>
    </svg>
  `;
}

function dashboardTone(label) {
  if (["P0", "P1", "invalid", "NOT_READY"].includes(label)) {
    return "danger";
  }
  if (["P2", "warning", "skipped", "WARN"].includes(label)) {
    return "warn";
  }
  return "";
}

function readinessPillClass(readiness) {
  if (readiness === "NOT_READY") {
    return "missing";
  }
  if (readiness === "WARN") {
    return "extra";
  }
  return "mapped";
}

function readinessOrder(readiness) {
  return { NOT_READY: 0, WARN: 1, READY: 2 }[readiness] ?? 99;
}

function countBy(items, keyFn) {
  const counts = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function relationshipStatusOrder(status) {
  return { invalid: 0, warning: 1, skipped: 2, valid: 3 }[status] ?? 99;
}

function relationshipStatusDisplayLabel(status, fallback = "FK status") {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "invalid") {
    return "FK issue";
  }
  if (normalized === "warning") {
    return "FK warning";
  }
  if (normalized === "valid") {
    return "Healthy FK";
  }
  if (normalized === "skipped") {
    return "Not checked";
  }
  return fallback;
}

function relationshipStatusDisplayDetail(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "invalid") {
    return "data-quality evidence";
  }
  if (normalized === "warning") {
    return "review recommended";
  }
  if (normalized === "valid") {
    return "checks passed";
  }
  if (normalized === "skipped") {
    return "check skipped";
  }
  return "";
}

function uniqueSorted(values, preferredOrder = []) {
  const unique = [...new Set(values.filter(Boolean))];
  if (preferredOrder.length) {
    return unique.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
      }
      return a.localeCompare(b);
    });
  }
  return unique.sort((a, b) => a.localeCompare(b));
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function clampNumber(value, min, max) {
  const numeric = Number(value || 0);
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function integerText(value) {
  return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function percentText(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function scoreText(value) {
  return Number(value || 0).toFixed(4);
}

function renderDiagram() {
  const model = buildDiagramModel();
  updateDbdiagramLink(model.externalUrl);
  renderDiagramDiagnostics(model.parseReport);
  updateDiagramControls(model);

  els.diagramFrame.hidden = true;
  els.diagramFrame.removeAttribute("src");

  if (!model.hasInput) {
    renderDiagramState(
      "empty",
      "Preparing demo DBML diagram",
      "The local preview renders here from browser DBML state. Upload DBML/CSV files or reset the demo.",
      model,
    );
    return;
  }

  if (model.error) {
    renderDiagramState("error", "Local DBML preview unavailable", model.error, model);
    return;
  }

  if (model.tables.length > localDiagramLimits.tables || model.relationships.length > localDiagramLimits.relationships) {
    renderDiagramState(
      "large",
      "Diagram is too large for local preview",
      `${integerText(model.tables.length)} tables and ${integerText(model.relationships.length)} relationships were found. Open the generated DBML link or inspect the artifact table instead.`,
      model,
    );
    return;
  }

  if (!model.tables.length) {
    renderDiagramState(
      "error",
      "No DBML tables parsed",
      "The local preview could not find table declarations in the current DBML. Run the backend parser for full diagnostics.",
      model,
    );
    return;
  }

  els.diagramEmpty.hidden = true;
  els.localDiagram.hidden = false;
  els.diagramMessage.textContent = `${model.sourceLabel} · ${integerText(model.tables.length)} tables · ${integerText(model.relationships.length)} relationships`;
  els.diagramMessage.dataset.status = model.source === "artifact" ? "success" : "idle";
  els.diagramSourceBadge.textContent = model.sourceBadge;
  const layout = layoutLocalDiagram(model);
  normalizeDiagramSelection(layout);
  drawLocalDiagram(model, layout);
  renderDiagramInspector(model, layout);
}

function updateDiagramControls(model) {
  els.diagramFitButton.setAttribute("aria-pressed", state.diagramFit ? "true" : "false");
  els.diagramDensityToggle.setAttribute("aria-pressed", state.diagramExpanded ? "true" : "false");
  els.diagramColumnsToggle.setAttribute("aria-pressed", state.diagramShowNonKey ? "true" : "false");
  els.diagramColumnsToggle.textContent = state.diagramShowNonKey ? "All columns" : "Key columns only";
  els.diagramResetSelection.disabled = !state.diagramSelection;
  els.diagramFitButton.disabled = !model.hasInput || Boolean(model.error);
}

function buildDiagramModel() {
  const schemaDiagram = state.dashboardArtifacts["schema_diagram.json"];
  const relationshipGraph = state.dashboardArtifacts["relationship_graph.json"];
  const parseReport = state.dashboardArtifacts["schema_parse_report.json"];
  const schemaEvaluation = state.dashboardArtifacts["schema_evaluation.json"];
  if (schemaDiagram || relationshipGraph) {
    return buildArtifactDiagramModel(schemaDiagram || {}, relationshipGraph || {}, parseReport || null, schemaEvaluation || null);
  }
  return buildPreflightDiagramModel();
}

function buildPreflightDiagramModel() {
  const hasInput = Boolean(state.dbmlText);
  return {
    source: "preflight",
    sourceLabel: "Local preflight",
    sourceBadge: "Browser DBML",
    hasInput,
    error: hasInput && !state.tables.length ? "No table declarations were parsed by the lightweight browser preview." : "",
    externalUrl: hasInput ? buildDbdiagramUrl(state.dbmlText) : "",
    parseReport: null,
    tables: state.tables.map((table) => {
      const csvStem = state.mapping.get(table.name) || "";
      const csvFile = state.csvFiles.find((file) => file.stem === csvStem);
      return {
        name: table.name,
        status: csvFile ? "mapped" : "missing_csv",
        csvPath: csvFile?.name || "",
        rowCount: null,
        columnCount: table.columns.length,
        columns: table.columns.map((column) => ({
          name: column.name,
          type: column.type,
          isPk: Boolean(column.pk || table.primaryKey.includes(column.name)),
          isFk: Boolean(column.fk),
          fkTarget: column.fk ? `${column.fk.parentTable}.${column.fk.parentColumn}` : "",
        })),
      };
    }),
    relationships: state.relationships.map((rel) => ({
      id: `${rel.childTable}.${rel.childColumn}->${rel.parentTable}.${rel.parentColumn}`,
      childTable: rel.childTable,
      childColumns: [rel.childColumn],
      parentTable: rel.parentTable,
      parentColumns: [rel.parentColumn],
      status: "preflight",
      label: "FK",
    })),
  };
}

function buildArtifactDiagramModel(schemaDiagram, relationshipGraph, parseReport, schemaEvaluation = null) {
  const schemaTables = Array.isArray(schemaDiagram.tables) ? schemaDiagram.tables : [];
  const evaluationTables = Array.isArray(schemaEvaluation?.tables) ? schemaEvaluation.tables : [];
  const graphNodes = Array.isArray(relationshipGraph.nodes) ? relationshipGraph.nodes : [];
  const graphEdges = Array.isArray(relationshipGraph.edges) ? relationshipGraph.edges : [];
  const graphNodeByTable = new Map(graphNodes.map((node) => [String(node.table || ""), node]));
  const evaluationTableByName = new Map(evaluationTables.map((table) => [String(table.table || ""), table]));
  const parseTableByName = new Map(
    (parseReport?.objects?.tables || []).map((table) => [String(table.name || ""), table]),
  );
  const tableNames = uniqueSorted([
    ...schemaTables.map((table) => table.table).filter(Boolean),
    ...evaluationTables.map((table) => table.table).filter(Boolean),
    ...graphNodes.map((node) => node.table).filter(Boolean),
    ...[...parseTableByName.keys()].filter(Boolean),
  ]);
  const relationships = graphEdges.length
    ? graphEdges.map((edge) => ({
      id: edge.id || `${edge.source_table}.${edge.source_column}->${edge.target_table}.${edge.target_column}`,
      childTable: edge.source_table || "",
      childColumns: arrayOfStrings(edge.source_columns).length ? arrayOfStrings(edge.source_columns) : arrayOfStrings([edge.source_column]),
      parentTable: edge.target_table || "",
      parentColumns: arrayOfStrings(edge.target_columns).length ? arrayOfStrings(edge.target_columns) : arrayOfStrings([edge.target_column]),
      status: edge.status || "",
      statusReason: edge.status_reason || "",
      label: diagramRelationshipStatusLabel(edge.status, edge.cardinality || edge.observed_cardinality || edge.declared_cardinality || "FK"),
      cardinality: edge.cardinality || edge.observed_cardinality || edge.declared_cardinality || "",
      declaredCardinality: edge.declared_cardinality || "",
      relationshipType: edge.relationship_type || "",
      role: edge.role || "",
      metrics: edge.metrics || {},
      evidenceLinks: Array.isArray(edge.evidence_links) ? edge.evidence_links : [],
    }))
    : (Array.isArray(schemaDiagram.relationships) ? schemaDiagram.relationships : []).map((rel) => ({
      id: `${rel.child_table || rel.childTable}.${rel.child_column || rel.childColumn}->${rel.parent_table || rel.parentTable}.${rel.parent_column || rel.parentColumn}`,
      childTable: rel.child_table || rel.childTable || "",
      childColumns: arrayOfStrings(rel.child_columns || [rel.child_column || rel.childColumn]),
      parentTable: rel.parent_table || rel.parentTable || "",
      parentColumns: arrayOfStrings(rel.parent_columns || [rel.parent_column || rel.parentColumn]),
      status: "",
      label: diagramRelationshipStatusLabel(rel.status, rel.declared_cardinality || rel.relationship_type || "FK"),
      cardinality: rel.declared_cardinality || "",
      declaredCardinality: rel.declared_cardinality || "",
      relationshipType: rel.relationship_type || "",
      statusReason: "",
      metrics: {},
      evidenceLinks: [],
    }));
  const schemaTableByName = new Map(schemaTables.map((table) => [String(table.table || ""), table]));
  return {
    source: "artifact",
    sourceLabel: "Generated artifacts",
    sourceBadge: "schema_diagram.json",
    hasInput: Boolean(schemaTables.length || graphNodes.length || state.dbmlText),
    error: "",
    externalUrl: schemaDiagram.dbdiagram_url || (state.dbmlText ? buildDbdiagramUrl(state.dbmlText) : ""),
    parseReport,
    tables: tableNames.map((tableName) => {
      const schemaTable = schemaTableByName.get(tableName) || {};
      const evaluationTable = evaluationTableByName.get(tableName) || {};
      const graphNode = graphNodeByTable.get(tableName) || {};
      const parsedTable = parseTableByName.get(tableName) || {};
      return {
        name: tableName,
        status: graphNode.status || evaluationTable.status || schemaTable.status || "mapped",
        csvPath: graphNode.csv_path || evaluationTable.csv_path || schemaTable.csv_path || "",
        rowCount: graphNode.row_count ?? null,
        columnCount: graphNode.column_count ?? evaluationTable.csv_column_count ?? evaluationTable.dbml_column_count ?? schemaTable.column_count ?? 0,
        primaryKey: arrayOfStrings(graphNode.primary_key || evaluationTable.primary_key || schemaTable.primary_key || parsedTable.primary_key),
        columns: diagramColumnsFromArtifacts(schemaTable, graphNode, parsedTable, evaluationTable),
      };
    }),
    relationships: relationships.filter((rel) => rel.childTable && rel.parentTable),
  };
}

function diagramColumnsFromArtifacts(schemaTable, graphNode, parsedTable = {}, evaluationTable = {}) {
  const byName = new Map();
  function ensureColumn(name) {
    if (!name) {
      return null;
    }
    if (!byName.has(name)) {
      byName.set(name, { name, type: "", isPk: false, isFk: false, fkTarget: "" });
    }
    return byName.get(name);
  }
  arrayOfStrings(parsedTable.columns).forEach((columnName) => {
    ensureColumn(columnName);
  });
  (Array.isArray(evaluationTable.columns) ? evaluationTable.columns : []).forEach((columnEval) => {
    const column = ensureColumn(columnEval.name);
    if (column) {
      column.type = columnEval.dbml_type || column.type || "";
      column.isPk = Boolean(columnEval.is_pk) || column.isPk;
      column.isFk = Boolean(columnEval.foreign_key) || column.isFk;
      if (columnEval.foreign_key) {
        column.fkTarget = `${columnEval.foreign_key.parent_table || ""}.${columnEval.foreign_key.parent_column || ""}`.replace(/^\./, "").replace(/\.$/, "");
      }
    }
  });
  arrayOfStrings(graphNode.primary_key || evaluationTable.primary_key || schemaTable.primary_key).forEach((columnName) => {
    const column = ensureColumn(columnName);
    if (column) {
      column.isPk = true;
    }
  });
  const foreignKeys = [
    ...(Array.isArray(evaluationTable.foreign_keys) ? evaluationTable.foreign_keys : []),
    ...(Array.isArray(schemaTable.foreign_keys) ? schemaTable.foreign_keys : []),
    ...(Array.isArray(graphNode.foreign_keys) ? graphNode.foreign_keys : []),
  ];
  foreignKeys.forEach((fk) => {
    const column = ensureColumn(fk.column || fk.child_column || fk.source_column);
    if (column) {
      column.isFk = true;
      column.fkTarget = `${fk.parent_table || fk.target_table || ""}.${fk.parent_column || fk.target_column || ""}`.replace(/^\./, "").replace(/\.$/, "");
    }
  });
  const columns = [...byName.values()];
  if (!columns.length && Number(schemaTable.column_count || graphNode.column_count || 0) > 0) {
    columns.push({
      name: `${integerText(schemaTable.column_count || graphNode.column_count)} columns`,
      type: "",
      isPk: false,
      isFk: false,
      fkTarget: "",
      summary: true,
    });
  }
  return columns.sort((a, b) => Number(b.isPk) - Number(a.isPk) || Number(b.isFk) - Number(a.isFk) || a.name.localeCompare(b.name));
}

function updateDbdiagramLink(url) {
  if (url) {
    els.dbdiagramLink.href = url;
    els.dbdiagramLink.setAttribute("aria-disabled", "false");
    return;
  }
  els.dbdiagramLink.href = "#";
  els.dbdiagramLink.setAttribute("aria-disabled", "true");
}

function renderDiagramDiagnostics(report) {
  if (!report) {
    els.diagramWarnings.hidden = true;
    els.diagramWarnings.innerHTML = "";
    return;
  }
  const counts = report.counts || {};
  const diagnostics = Array.isArray(report.diagnostics) ? report.diagnostics : [];
  const unsupported = Array.isArray(report.unsupported_constructs) ? report.unsupported_constructs : [];
  const problemCount = Number(counts.warnings || 0) + Number(counts.errors || 0) + Number(counts.unsupported_constructs || 0);
  const detailRows = [
    ...diagnostics.slice(0, 3).map((item) => item.message || item.code || JSON.stringify(item)),
    ...unsupported.slice(0, 3).map((item) => item.message || item.construct || JSON.stringify(item)),
  ].filter(Boolean);
  els.diagramWarnings.hidden = false;
  els.diagramWarnings.classList.toggle("warning", problemCount > 0);
  els.diagramWarnings.innerHTML = `
    <strong>Schema parse diagnostics</strong>
    <span><code>schema_parse_report.json</code> · ${escapeHtml(report.status || "unknown")} · ${integerText(problemCount)} warnings/issues</span>
    ${detailRows.length ? `<ul>${detailRows.map((row) => `<li>${escapeHtml(row)}</li>`).join("")}</ul>` : ""}
  `;
}

function renderDiagramState(kind, title, message, model) {
  els.localDiagram.hidden = true;
  els.diagramEmpty.hidden = false;
  els.diagramEmpty.dataset.state = kind;
  els.diagramEmpty.innerHTML = `
    <div class="diagram-glyph" aria-hidden="true"></div>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(message)}</p>
  `;
  els.diagramMessage.textContent = `${model.sourceLabel || "Local preview"} · ${kind}`;
  els.diagramMessage.dataset.status = kind === "error" ? "error" : "idle";
  els.diagramSourceBadge.textContent = model.sourceBadge || "Local preview";
  els.diagramSvg.innerHTML = "";
  els.diagramInspector.innerHTML = "";
}

function drawLocalDiagram(model, layout) {
  els.diagramSvg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  els.diagramSvg.classList.toggle("fit", state.diagramFit);
  els.localDiagram.classList.toggle("fit", state.diagramFit);
  els.diagramSvg.style.width = state.diagramFit ? "100%" : `${layout.width}px`;
  els.diagramSvg.style.height = state.diagramFit ? "100%" : `${layout.height}px`;
  els.diagramSvg.innerHTML = `
    <g class="diagram-edges">
      ${model.relationships.map((rel, index) => diagramRelationshipSvg(rel, layout, index)).join("")}
    </g>
    <g class="diagram-tables">
      ${layout.tableRecords.map((record) => diagramTableSvg(record, layout.positions.get(record.table.name), layout.selection)).join("")}
    </g>
  `;
}

function layoutLocalDiagram(model) {
  const graph = buildDiagramGraph(model);
  const nodeWidth = state.diagramExpanded ? 360 : 320;
  const xGap = 160;
  const yGap = 42;
  const margin = 40;
  const topMargin = 92;
  const tableRecords = model.tables.map((table) => {
    const role = diagramTableRole(table, graph);
    const columnSet = diagramVisibleColumns(table);
    const rowCount = Math.max(
      columnSet.visible.length + (columnSet.hiddenCount ? 1 : 0),
      1,
    );
    return {
      table,
      role,
      degree: role.degree,
      visibleColumns: columnSet.visible,
      hiddenCount: columnSet.hiddenCount,
      totalColumns: columnSet.totalColumns,
      width: nodeWidth,
      height: Math.max(state.diagramExpanded ? 220 : 190, 72 + rowCount * 32 + 18),
    };
  });
  const originalLayers = [...new Set(tableRecords.map((record) => record.role.layer))].sort((a, b) => a - b);
  const layerIndexByOriginal = new Map(originalLayers.map((layer, index) => [layer, index]));
  tableRecords.forEach((record) => {
    record.layer = layerIndexByOriginal.get(record.role.layer) || 0;
  });
  const layers = new Map();
  tableRecords.forEach((record) => {
    const layer = layers.get(record.layer) || [];
    layer.push(record);
    layers.set(record.layer, layer);
  });
  [...layers.values()].forEach((records) => {
    records.sort((a, b) => b.degree - a.degree || a.table.name.localeCompare(b.table.name));
  });
  const layerCount = Math.max(layers.size, 1);
  const layerHeights = [...layers.values()].map((records) => records.reduce((total, record) => total + record.height, 0) + Math.max(records.length - 1, 0) * yGap);
  const maxLayerHeight = Math.max(360, ...layerHeights);
  const width = Math.max(860, margin * 2 + layerCount * nodeWidth + Math.max(layerCount - 1, 0) * xGap);
  const height = Math.max(460, topMargin + margin + maxLayerHeight);
  const positions = new Map();
  [...layers.entries()].forEach(([layer, records]) => {
    const layerHeight = records.reduce((total, record) => total + record.height, 0) + Math.max(records.length - 1, 0) * yGap;
    let y = topMargin + (maxLayerHeight - layerHeight) / 2;
    records.forEach((record) => {
      const columnY = new Map();
      record.visibleColumns.forEach((column, index) => {
        columnY.set(column.name, y + 72 + index * 32 + 15);
      });
      positions.set(record.table.name, {
        x: margin + layer * (nodeWidth + xGap),
        y,
        width: record.width,
        height: record.height,
        layer,
        columnY,
      });
      y += record.height + yGap;
    });
  });
  const selection = diagramSelectionContext(model);
  return { width, height, positions, tableRecords, graph, selection, topMargin };
}

function buildDiagramGraph(model) {
  const incoming = new Map();
  const outgoing = new Map();
  model.tables.forEach((table) => {
    incoming.set(table.name, []);
    outgoing.set(table.name, []);
  });
  model.relationships.forEach((rel) => {
    if (!incoming.has(rel.parentTable)) {
      incoming.set(rel.parentTable, []);
    }
    if (!outgoing.has(rel.childTable)) {
      outgoing.set(rel.childTable, []);
    }
    incoming.get(rel.parentTable).push(rel);
    outgoing.get(rel.childTable).push(rel);
  });
  return { incoming, outgoing };
}

function diagramTableRole(table, graph) {
  const incoming = graph.incoming.get(table.name) || [];
  const outgoing = graph.outgoing.get(table.name) || [];
  const degree = incoming.length + outgoing.length;
  const name = table.name.toLowerCase();
  const hasReferenceName = /(customer|product|seller|category|type|state|status|lookup|reference|dimension|dim_|ref_)/.test(name);
  const hasBridgeName = /(bridge|junction|link|map|xref|assoc|association|item|items|line)/.test(name);
  const hasFactName = diagramNameLooksFact(name);
  const dependsOnFact = outgoing.some((rel) => diagramNameLooksFact(rel.parentTable));
  const keyColumns = (table.columns || []).filter((column) => column.isPk || column.isFk);
  const fkKeyCount = keyColumns.filter((column) => column.isFk).length;
  if (outgoing.length >= 2 || (hasBridgeName && outgoing.length > 0) || (fkKeyCount >= 2 && incoming.length <= 1)) {
    return {
      name: "bridge",
      label: dependsOnFact ? "Detail/line" : "Bridge",
      layer: dependsOnFact ? 2 : 1,
      degree,
      incoming: incoming.length,
      outgoing: outgoing.length,
    };
  }
  if ((outgoing.length === 0 && incoming.length > 0) || (hasReferenceName && outgoing.length <= 1 && incoming.length >= 0)) {
    return { name: "reference", label: "Reference", layer: 0, degree, incoming: incoming.length, outgoing: outgoing.length };
  }
  if (incoming.length >= 2 || (hasFactName && incoming.length > 0)) {
    return { name: "hub", label: "Fact/event", layer: 1, degree, incoming: incoming.length, outgoing: outgoing.length };
  }
  if (outgoing.length > 0) {
    return { name: "child", label: "Child/detail", layer: 2, degree, incoming: incoming.length, outgoing: outgoing.length };
  }
  return { name: "isolated", label: "Schema table", layer: 1, degree, incoming: incoming.length, outgoing: outgoing.length };
}

function diagramNameLooksFact(name) {
  return /(order|event|transaction|payment|review|fact|activity|log|history)/.test(String(name || "").toLowerCase());
}

function diagramVisibleColumns(table) {
  const allColumns = (table.columns || []).filter((column) => !column.summary);
  const totalColumns = Number(table.columnCount || allColumns.length || 0);
  const keyColumns = allColumns.filter((column) => column.isPk || column.isFk || column.isUnique);
  const visible = state.diagramShowNonKey ? allColumns : keyColumns;
  const hiddenCount = state.diagramShowNonKey ? 0 : Math.max(totalColumns - visible.length, 0);
  return { visible, hiddenCount, totalColumns };
}

function diagramRelationshipSvg(rel, layout, index) {
  const positions = layout.positions;
  const source = positions.get(rel.childTable);
  const target = positions.get(rel.parentTable);
  if (!source || !target) {
    return "";
  }
  const sameLayer = source.layer === target.layer;
  const sourceColumn = (rel.childColumns || [])[0] || "";
  const targetColumn = (rel.parentColumns || [])[0] || "";
  const y1 = source.columnY.get(sourceColumn) || source.y + 80;
  const y2 = target.columnY.get(targetColumn) || target.y + 80;
  const sourceCenter = source.x + source.width / 2;
  const targetCenter = target.x + target.width / 2;
  const sourceIsLeft = sourceCenter < targetCenter;
  const x1 = sourceIsLeft ? source.x + source.width : source.x;
  const x2 = sourceIsLeft ? target.x : target.x + target.width;
  const direction = sourceIsLeft ? 1 : -1;
  const laneOffset = diagramLaneOffset(index);
  const sourceCorridor = sourceIsLeft
    ? source.x + source.width + 48 + laneOffset
    : source.x - 48 - laneOffset;
  let path;
  let labelX;
  let labelY;
  if (sameLayer) {
    const routeX = sourceIsLeft
      ? Math.max(source.x + source.width, target.x + target.width) + 44 + laneOffset
      : Math.min(source.x, target.x) - 44 - laneOffset;
    path = `M ${x1} ${y1} L ${routeX} ${y1} L ${routeX} ${y2} L ${x2} ${y2}`;
    labelX = routeX + direction * 8;
    labelY = (y1 + y2) / 2 - 6;
  } else {
    const layerDistance = Math.abs(source.layer - target.layer);
    if (layerDistance > 1) {
      const targetCorridor = sourceIsLeft
        ? target.x - 48 - laneOffset
        : target.x + target.width + 48 + laneOffset;
      const busY = diagramNonAdjacentBusY(source, target, layout, y1, y2, laneOffset);
      path = [
        `M ${x1} ${y1}`,
        `L ${sourceCorridor} ${y1}`,
        `L ${sourceCorridor} ${busY}`,
        `L ${targetCorridor} ${busY}`,
        `L ${targetCorridor} ${y2}`,
        `L ${x2} ${y2}`,
      ].join(" ");
      labelX = (sourceCorridor + targetCorridor) / 2;
      labelY = busY - 6;
    } else {
      path = `M ${x1} ${y1} L ${sourceCorridor} ${y1} L ${sourceCorridor} ${y2} L ${x2} ${y2}`;
      labelX = sourceCorridor + direction * 8;
      labelY = (y1 + y2) / 2 - 6;
    }
  }
  const label = `${rel.childTable}.${(rel.childColumns || []).join(",")} -> ${rel.parentTable}.${(rel.parentColumns || []).join(",")}`;
  const selectionClass = diagramRelationshipSelectionClass(rel, layout.selection);
  return `
    <g class="diagram-relationship diagram-relationship-${escapeHtml(diagramStatusTone(rel.status))} ${selectionClass}" data-diagram-relationship="${escapeHtml(rel.id)}" tabindex="0" role="button" aria-label="${escapeHtml(label)}">
      <title>${escapeHtml(label)}</title>
      <path class="diagram-edge-hit" d="${path}"></path>
      <path class="diagram-edge" d="${path}"></path>
      <circle class="diagram-port-dot" cx="${x1}" cy="${y1}" r="3"></circle>
      <circle class="diagram-port-dot" cx="${x2}" cy="${y2}" r="3"></circle>
      <text class="diagram-edge-label" x="${labelX}" y="${labelY}">${escapeHtml(truncateMiddle(rel.label || rel.cardinality || "FK", 22))}</text>
    </g>
  `;
}

function diagramLaneOffset(index) {
  const lanes = [0, -12, 12, -24, 24, -36, 36];
  return lanes[index % lanes.length];
}

function diagramNonAdjacentBusY(source, target, layout, y1, y2, laneOffset) {
  const minLayer = Math.min(source.layer, target.layer);
  const maxLayer = Math.max(source.layer, target.layer);
  const blockers = layout.tableRecords
    .map((record) => layout.positions.get(record.table.name))
    .filter((position) => position && position.layer > minLayer && position.layer < maxLayer);
  if (!blockers.length) {
    return (y1 + y2) / 2;
  }
  const blockerTop = Math.min(...blockers.map((position) => position.y));
  const blockerBottom = Math.max(...blockers.map((position) => position.y + position.height));
  const desired = (y1 + y2) / 2;
  const topBus = Math.max(30, blockerTop - 34 - Math.abs(laneOffset) / 2);
  const bottomBus = Math.min(layout.height - 30, blockerBottom + 34 + Math.abs(laneOffset) / 2);
  if (desired < blockerTop - 20 || desired > blockerBottom + 20) {
    return desired;
  }
  return Math.abs(desired - topBus) <= Math.abs(desired - bottomBus) ? topBus : bottomBus;
}

function diagramTableSvg(record, position, selection) {
  const table = record.table;
  if (!position) {
    return "";
  }
  const columns = record.visibleColumns;
  const lines = columns
    .map((column, index) => diagramColumnRowSvg(column, 72 + index * 32, position.width))
    .join("");
  const overflowLine = record.hiddenCount
    ? diagramHiddenColumnRowSvg(record.hiddenCount, 72 + columns.length * 32, position.width)
    : "";
  const meta = [
    table.status === "mapped" ? "mapped CSV" : table.status === "missing_csv" ? "missing CSV" : table.status || "schema",
    table.rowCount !== null && table.rowCount !== undefined ? `${integerText(table.rowCount)} rows` : `${integerText(record.totalColumns)} columns`,
  ].filter(Boolean).join(" · ");
  const selectionClass = diagramTableSelectionClass(table.name, selection);
  return `
    <g class="diagram-table diagram-table-${escapeHtml(diagramStatusTone(table.status))} diagram-role-${escapeHtml(record.role.name)} ${selectionClass}" data-diagram-table="${escapeHtml(table.name)}" transform="translate(${position.x} ${position.y})" tabindex="0" role="button" aria-label="${escapeHtml(`${table.name} table`)}">
      <title>${escapeHtml(`${table.name} · ${record.role.label} · ${meta}`)}</title>
      <rect class="diagram-table-box" width="${position.width}" height="${position.height}" rx="8"></rect>
      <rect class="diagram-table-header" width="${position.width}" height="60" rx="8"></rect>
      <text class="diagram-table-name" x="16" y="25">${escapeHtml(truncateMiddle(table.name, 24))}</text>
      <text class="diagram-table-meta" x="16" y="48">${escapeHtml(truncateMiddle(`${record.role.label} · ${meta}`, 48))}</text>
      <rect class="diagram-status-chip" x="${position.width - 92}" y="17" width="74" height="24" rx="12"></rect>
      <text class="diagram-status-text" x="${position.width - 55}" y="33" text-anchor="middle">${escapeHtml(table.status === "missing_csv" ? "missing" : table.status || "schema")}</text>
      ${lines || `<text class="diagram-column empty" x="14" y="78">No columns</text>`}
      ${overflowLine}
    </g>
  `;
}

function diagramColumnRowSvg(column, y, width) {
  const role = column.isPk && column.isFk ? "PK/FK" : column.isPk ? "PK" : column.isFk ? "FK" : "COL";
  const type = column.type || "";
  const badgeWidth = role === "PK/FK" ? 44 : 32;
  const nameLimit = type ? 28 : 40;
  const rowClass = [
    "diagram-column-row",
    column.isPk ? "pk" : "",
    column.isFk ? "fk" : "",
    !column.isPk && !column.isFk ? "non-key" : "",
  ].filter(Boolean).join(" ");
  return `
    <g class="${rowClass}" data-diagram-column="${escapeHtml(column.name)}">
      <title>${escapeHtml(`${role} ${column.name}${type ? ` ${type}` : ""}${column.fkTarget ? ` -> ${column.fkTarget}` : ""}`)}</title>
      <rect class="diagram-column-row-bg" x="10" y="${y}" width="${width - 20}" height="30" rx="5"></rect>
      <rect class="diagram-column-badge" x="16" y="${y + 7}" width="${badgeWidth}" height="16" rx="4"></rect>
      <text class="diagram-column-role" x="${16 + badgeWidth / 2}" y="${y + 19}" text-anchor="middle">${escapeHtml(role)}</text>
      <text class="diagram-column-name" x="${28 + badgeWidth}" y="${y + 20}">${escapeHtml(truncateMiddle(column.name, nameLimit))}</text>
      ${type ? `<text class="diagram-column-type" x="${width - 16}" y="${y + 20}" text-anchor="end">${escapeHtml(truncateMiddle(type, 15))}</text>` : ""}
    </g>
  `;
}

function diagramHiddenColumnRowSvg(hiddenCount, y, width) {
  return `
    <g class="diagram-column-row overflow">
      <rect class="diagram-column-row-bg" x="10" y="${y}" width="${width - 20}" height="30" rx="5"></rect>
      <text class="diagram-column-name" x="16" y="${y + 20}">+${integerText(hiddenCount)} hidden columns</text>
    </g>
  `;
}

function diagramStatusTone(status) {
  if (["invalid", "missing_csv", "failed", "error"].includes(status)) {
    return "danger";
  }
  if (["warning", "skipped"].includes(status)) {
    return "warn";
  }
  return "mapped";
}

function handleDiagramSelectionEvent(event) {
  const relationshipTarget = event.target.closest("[data-diagram-relationship]");
  if (relationshipTarget) {
    state.diagramSelection = {
      kind: "relationship",
      id: relationshipTarget.dataset.diagramRelationship || "",
    };
    renderDiagram();
    return true;
  }
  const tableTarget = event.target.closest("[data-diagram-table]");
  if (tableTarget) {
    state.diagramSelection = {
      kind: "table",
      id: tableTarget.dataset.diagramTable || "",
    };
    renderDiagram();
    return true;
  }
  return false;
}

function clearDiagramSelection() {
  if (!state.diagramSelection) {
    return false;
  }
  state.diagramSelection = null;
  renderDiagram();
  return true;
}

function diagramSelectionContext(model) {
  const selected = state.diagramSelection;
  const tableNames = new Set(model.tables.map((table) => table.name));
  const relationshipIds = new Set(model.relationships.map((rel) => rel.id));
  const selectedTables = new Set();
  const neighborTables = new Set();
  const selectedRelationships = new Set();
  if (!selected) {
    return { selected: null, selectedTables, neighborTables, selectedRelationships };
  }
  if (selected.kind === "table" && tableNames.has(selected.id)) {
    selectedTables.add(selected.id);
    model.relationships.forEach((rel) => {
      if (rel.childTable === selected.id || rel.parentTable === selected.id) {
        selectedRelationships.add(rel.id);
        neighborTables.add(rel.childTable);
        neighborTables.add(rel.parentTable);
      }
    });
    neighborTables.delete(selected.id);
    return { selected, selectedTables, neighborTables, selectedRelationships };
  }
  if (selected.kind === "relationship" && relationshipIds.has(selected.id)) {
    const rel = model.relationships.find((item) => item.id === selected.id);
    if (rel) {
      selectedRelationships.add(rel.id);
      selectedTables.add(rel.childTable);
      selectedTables.add(rel.parentTable);
    }
    return { selected, selectedTables, neighborTables, selectedRelationships };
  }
  return { selected: null, selectedTables, neighborTables, selectedRelationships };
}

function normalizeDiagramSelection(layout) {
  if (!state.diagramSelection || layout.selection.selected) {
    return;
  }
  state.diagramSelection = null;
  layout.selection = diagramSelectionContext({
    tables: layout.tableRecords.map((record) => record.table),
    relationships: [],
  });
}

function diagramTableSelectionClass(tableName, selection) {
  if (!selection.selected) {
    return "";
  }
  if (selection.selectedTables.has(tableName)) {
    return "selected";
  }
  if (selection.neighborTables.has(tableName)) {
    return "neighbor";
  }
  return "dimmed";
}

function diagramRelationshipSelectionClass(rel, selection) {
  if (!selection.selected) {
    return "";
  }
  if (selection.selectedRelationships.has(rel.id)) {
    return "selected";
  }
  if (selection.selectedTables.has(rel.childTable) || selection.selectedTables.has(rel.parentTable)) {
    return "neighbor";
  }
  return "dimmed";
}

function renderDiagramInspector(model, layout) {
  const selected = layout.selection.selected;
  if (!selected) {
    els.diagramInspector.innerHTML = renderDiagramOverview(model, layout);
    return;
  }
  if (selected.kind === "table") {
    const record = layout.tableRecords.find((item) => item.table.name === selected.id);
    els.diagramInspector.innerHTML = record
      ? renderDiagramTableInspector(record, layout)
      : renderDiagramOverview(model, layout);
    return;
  }
  const rel = model.relationships.find((item) => item.id === selected.id);
  els.diagramInspector.innerHTML = rel
    ? renderDiagramRelationshipInspector(rel)
    : renderDiagramOverview(model, layout);
}

function renderDiagramOverview(model, layout) {
  const roleCounts = layout.tableRecords.reduce((counts, record) => {
    counts[record.role.label] = (counts[record.role.label] || 0) + 1;
    return counts;
  }, {});
  return `
    <div class="diagram-inspector-heading">
      <p class="eyebrow">ERD overview</p>
      <h4>${integerText(model.tables.length)} tables</h4>
      <span>${integerText(model.relationships.length)} relationships</span>
    </div>
    <dl class="diagram-detail-grid">
      <div><dt>Source</dt><dd>${escapeHtml(model.sourceBadge)}</dd></div>
      <div><dt>Layers</dt><dd>${integerText(new Set(layout.tableRecords.map((record) => record.layer)).size)}</dd></div>
      <div><dt>Columns</dt><dd>${state.diagramShowNonKey ? "key + non-key" : "key only"}</dd></div>
      <div><dt>Density</dt><dd>${state.diagramExpanded ? "expanded" : "compact"}</dd></div>
    </dl>
    <div class="diagram-detail-section">
      <strong>Layer roles</strong>
      <div class="diagram-chip-list">
        ${Object.entries(roleCounts).map(([label, count]) => `<span>${escapeHtml(label)} ${integerText(count)}</span>`).join("")}
      </div>
    </div>
    ${diagramArtifactLinks(["schema_diagram.json", "schema_evaluation.json", "relationship_graph.json", "schema_parse_report.json"])}
  `;
}

function renderDiagramTableInspector(record, layout) {
  const table = record.table;
  const incoming = layout.graph.incoming.get(table.name) || [];
  const outgoing = layout.graph.outgoing.get(table.name) || [];
  const columns = (table.columns || []).filter((column) => !column.summary);
  const keyColumns = columns.filter((column) => column.isPk || column.isFk);
  return `
    <div class="diagram-inspector-heading">
      <p class="eyebrow">${escapeHtml(record.role.label)}</p>
      <h4><code>${escapeHtml(table.name)}</code></h4>
      <span>${escapeHtml(table.status || "schema")}</span>
    </div>
    <dl class="diagram-detail-grid">
      <div><dt>Rows</dt><dd>${table.rowCount === null || table.rowCount === undefined ? "n/a" : integerText(table.rowCount)}</dd></div>
      <div><dt>Columns</dt><dd>${integerText(record.totalColumns)}</dd></div>
      <div><dt>Incoming</dt><dd>${integerText(incoming.length)}</dd></div>
      <div><dt>Outgoing</dt><dd>${integerText(outgoing.length)}</dd></div>
    </dl>
    <div class="diagram-detail-section">
      <strong>CSV mapping</strong>
      <p>${table.csvPath ? `<code>${escapeHtml(table.csvPath)}</code>` : "No CSV mapped"}</p>
    </div>
    <div class="diagram-detail-section">
      <strong>Key columns</strong>
      ${keyColumns.length ? `<ul>${keyColumns.map((column) => `<li><code>${escapeHtml(column.name)}</code> ${escapeHtml(diagramColumnRole(column))}${column.fkTarget ? ` -> <code>${escapeHtml(column.fkTarget)}</code>` : ""}</li>`).join("")}</ul>` : `<p class="muted">No PK/FK columns in current evidence.</p>`}
    </div>
    <div class="diagram-detail-section">
      <strong>Relationships</strong>
      ${renderDiagramRelationshipList([...incoming, ...outgoing], table.name)}
    </div>
    ${diagramArtifactLinks(["schema_diagram.json", "schema_evaluation.json", "relationship_graph.json", "schema_parse_report.json"])}
  `;
}

function renderDiagramRelationshipInspector(rel) {
  return `
    <div class="diagram-inspector-heading">
      <p class="eyebrow">Relationship</p>
      <h4><code>${escapeHtml(rel.childTable)}</code> -> <code>${escapeHtml(rel.parentTable)}</code></h4>
      <span>${escapeHtml(diagramRelationshipStatusLabel(rel.status, "declared"))}</span>
    </div>
    <dl class="diagram-detail-grid">
      <div><dt>Child columns</dt><dd>${escapeHtml((rel.childColumns || []).join(", ") || "n/a")}</dd></div>
      <div><dt>Parent columns</dt><dd>${escapeHtml((rel.parentColumns || []).join(", ") || "n/a")}</dd></div>
      <div><dt>Cardinality</dt><dd>${escapeHtml(rel.cardinality || rel.declaredCardinality || "unknown")}</dd></div>
      <div><dt>Type</dt><dd>${escapeHtml(rel.relationshipType || "FK")}</dd></div>
    </dl>
    ${rel.statusReason ? `<div class="diagram-detail-section"><strong>Status reason</strong><p>${escapeHtml(rel.statusReason)}</p></div>` : ""}
    ${renderDiagramRelationshipMetrics(rel.metrics)}
    ${renderDiagramEvidenceLinks(rel.evidenceLinks)}
    ${diagramArtifactLinks(["relationship_graph.json", "schema_diagram.json", "schema_evaluation.json"])}
  `;
}

function diagramColumnRole(column) {
  if (column.isPk && column.isFk) {
    return "PK/FK";
  }
  if (column.isPk) {
    return "PK";
  }
  if (column.isFk) {
    return "FK";
  }
  return "COL";
}

function renderDiagramRelationshipList(relationships, tableName) {
  if (!relationships.length) {
    return `<p class="muted">No relationships in current evidence.</p>`;
  }
  return `
    <ul>
      ${relationships.map((rel) => {
        const direction = rel.childTable === tableName ? "to parent" : "from child";
        const otherTable = rel.childTable === tableName ? rel.parentTable : rel.childTable;
        return `<li><span>${escapeHtml(direction)}</span> <code>${escapeHtml(otherTable)}</code> <span>${escapeHtml(diagramRelationshipStatusLabel(rel.status, rel.cardinality || "FK"))}</span></li>`;
      }).join("")}
    </ul>
  `;
}

function diagramRelationshipStatusLabel(status, fallback = "FK") {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "invalid") {
    return "FK issue";
  }
  if (normalized === "warning") {
    return "FK warning";
  }
  if (normalized === "valid") {
    return "FK valid";
  }
  if (normalized === "skipped") {
    return "FK skipped";
  }
  return fallback || "FK";
}

function renderDiagramRelationshipMetrics(metrics = {}) {
  const entries = Object.entries(metrics).filter(([, value]) => value !== null && value !== undefined);
  if (!entries.length) {
    return "";
  }
  return `
    <div class="diagram-detail-section">
      <strong>Metrics</strong>
      <div class="diagram-chip-list">
        ${entries.slice(0, 6).map(([key, value]) => `<span><code>${escapeHtml(key)}</code> ${escapeHtml(typeof value === "number" ? scoreOrIntegerText(value) : value)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderDiagramEvidenceLinks(evidenceLinks = []) {
  if (!evidenceLinks.length) {
    return "";
  }
  return `
    <div class="diagram-detail-section">
      <strong>Evidence</strong>
      <ul>
        ${evidenceLinks.slice(0, 6).map((link) => {
          const sampleUrl = artifactUrlFromArtifacts(link.sample_bad_rows_path || "");
          return `<li><code>${escapeHtml(link.issue_id || "issue")}</code> ${escapeHtml(link.issue_type || "")} ${escapeHtml(link.severity || "")} · ${integerText(link.bad_count)} rows${sampleUrl ? ` · <button class="inline-preview-button" type="button" data-artifact-action="preview-artifact" data-artifact-path="${escapeHtml(link.sample_bad_rows_path)}" data-artifact-url="${escapeHtml(sampleUrl)}">Preview sample</button>` : ""}</li>`;
        }).join("")}
      </ul>
    </div>
  `;
}

function diagramArtifactLinks(paths) {
  const links = paths.map((path) => {
    const url = artifactUrlFromArtifacts(path);
    return url
      ? renderArtifactReference(path, url)
      : `<code>${escapeHtml(path)}</code>`;
  }).join("");
  return `<div class="diagram-artifact-links"><strong>Artifacts</strong><div>${links}</div></div>`;
}

function scoreOrIntegerText(value) {
  return Number.isInteger(value) ? integerText(value) : Number(value).toFixed(3);
}

function buildDbdiagramUrl(dbml) {
  const encoded = btoa(unescape(encodeURIComponent(dbml)));
  return `https://dbdiagram.io/embed?c=${encodeURIComponent(encoded)}`;
}

function mappedTables() {
  return state.tables.filter((table) => state.mapping.has(table.name));
}

function extraCsvs() {
  const mappedStems = new Set([...state.mapping.values()]);
  return state.csvFiles.filter((file) => !mappedStems.has(file.stem));
}

function formatBytes(size) {
  if (!size) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

loadDemoState();
checkRunnerHealth();
