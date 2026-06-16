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
  dashboardGraphMode: "lineage",
  dashboardGraphScope: "table",
  dashboardGraphSelection: null,
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
  dashboardPanelGrid: document.querySelector("#dashboardPanelGrid"),
  dashboardGraphModeLineage: document.querySelector("#dashboardGraphModeLineage"),
  dashboardGraphModeRelationship: document.querySelector("#dashboardGraphModeRelationship"),
  dashboardGraphScope: document.querySelector("#dashboardGraphScope"),
  dashboardGraphStatus: document.querySelector("#dashboardGraphStatus"),
  dashboardGraphSvg: document.querySelector("#dashboardGraphSvg"),
  dashboardGraphLegend: document.querySelector("#dashboardGraphLegend"),
  dashboardGraphDrilldown: document.querySelector("#dashboardGraphDrilldown"),
  dashboardGraphDrilldownMeta: document.querySelector("#dashboardGraphDrilldownMeta"),
  dashboardDrilldown: document.querySelector("#dashboardDrilldown"),
  dashboardDrilldownMeta: document.querySelector("#dashboardDrilldownMeta"),
  dashboardArtifactCount: document.querySelector("#dashboardArtifactCount"),
  dashboardArtifactLinks: document.querySelector("#dashboardArtifactLinks"),
  csvList: document.querySelector("#csvList"),
  csvTemplate: document.querySelector("#csvItemTemplate"),
  visualizeButton: document.querySelector("#visualizeButton"),
  autoLinkButton: document.querySelector("#autoLinkButton"),
  dbdiagramLink: document.querySelector("#dbdiagramLink"),
  diagramFrame: document.querySelector("#diagramFrame"),
  diagramEmpty: document.querySelector("#diagramEmpty"),
  mappedMetric: document.querySelector("#mappedMetric"),
  missingMetric: document.querySelector("#missingMetric"),
  extraMetric: document.querySelector("#extraMetric"),
  edgeList: document.querySelector("#edgeList"),
  mappingBody: document.querySelector("#mappingBody"),
  loadDemoButton: document.querySelector("#loadDemoButton"),
};

const demoDbml = `Table customers {
  customer_id varchar [pk, not null]
  customer_name varchar
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

Table order_reviews {
  review_id varchar [pk, not null]
  order_id varchar [ref: > orders.order_id]
  review_score int
}`;

const demoCsvs = [
  { name: "customers.csv", columns: ["customer_id", "customer_name", "customer_state"], size: 248 },
  {
    name: "orders.csv",
    columns: [
      "order_id",
      "customer_id",
      "order_status",
      "order_purchase_timestamp",
      "order_delivered_customer_date",
    ],
    size: 512,
  },
  {
    name: "order_items.csv",
    columns: ["order_id", "order_item_id", "product_id", "seller_id", "price", "freight_value"],
    size: 442,
  },
  { name: "payments.csv", columns: ["order_id", "payment_value"], size: 144 },
];

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
});

els.dashboardGraphModeLineage.addEventListener("click", () => {
  setDashboardGraphMode("lineage");
});

els.dashboardGraphModeRelationship.addEventListener("click", () => {
  setDashboardGraphMode("relationship");
});

els.dashboardGraphScope.addEventListener("change", () => {
  state.dashboardGraphScope = els.dashboardGraphScope.value;
  state.dashboardGraphSelection = null;
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
  state.csvFiles = demoCsvs;
  els.dbmlPathInput.value = "data/demo_small/schema.dbml";
  els.csvDirPathInput.value = "data/demo_small/csv";
  els.rulesPathInput.value = "data/demo_small/rules.yaml";
  els.pathTargetInput.value = "order_reviews.review_score";
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
  const parsed = await Promise.all(files.map(readCsvFile));
  const existing = new Map(state.csvFiles.map((file) => [file.stem, file]));
  parsed.forEach((file) => existing.set(file.stem, file));
  state.csvFiles = [...existing.values()].sort((a, b) => a.name.localeCompare(b.name));
  autoLinkCsvs();
  renderAll();
}

async function readCsvFile(file) {
  const text = await readFilePrefix(file, 64 * 1024);
  return {
    name: file.name,
    stem: file.name.replace(/\.csv$/i, ""),
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
    empty.textContent = "Relationships sẽ hiện ở đây sau khi parse DBML.";
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
    els.mappingBody.innerHTML = `<tr><td colspan="6" class="empty-row">Upload DBML để bắt đầu mapping.</td></tr>`;
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
      };
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
      </div>
      <span class="pill-status ${stage.status === "failed" ? "missing" : "mapped"}">${escapeHtml(stage.status || "running")}</span>
    `;
    els.stageList.appendChild(item);
  });
}

function renderArtifacts(artifacts) {
  els.artifactList.innerHTML = "";
  if (!artifacts.length) {
    els.artifactList.innerHTML = `<p class="muted">Artifact links are loaded from <code>run_summary.json</code>.</p>`;
    return;
  }
  artifacts.forEach((artifact) => {
    const link = document.createElement("a");
    link.className = "artifact-link";
    link.href = artifact.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = `
      <strong>${escapeHtml(artifact.label)}</strong>
      <code>${escapeHtml(artifact.path)}</code>
    `;
    els.artifactList.appendChild(link);
  });
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

    const artifactEntries = Object.entries(dashboardArtifactIndex.artifact_urls || {});
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
    renderDashboardMessage("Dashboard loaded from generated artifacts.", "success");
  } catch (error) {
    state.dashboardLoadingJobId = "";
    renderDashboardMessage(error.message || "Unable to load dashboard artifacts.", "error");
  } finally {
    renderDashboard();
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

  renderDashboardFilters(issues);
  renderDashboardArtifacts();

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

function renderDashboardFilters(issues) {
  const severities = uniqueSorted(issues.map((issue) => issue.severity), severityOrder);
  const issueTypes = uniqueSorted(issues.map((issue) => issue.issue_type));
  const tables = uniqueSorted(issues.map((issue) => issue.table).filter(Boolean));

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

  const graph = state.dashboardGraphMode === "relationship"
    ? buildRelationshipGraphView(state.dashboardGraphScope)
    : buildLineageGraphView(state.dashboardGraphScope);

  if (!graph.nodes.length) {
    renderEmptyGraph(graph.emptyMessage || "No graph nodes are available for this scope.");
    return;
  }

  const selectedVisible = graph.nodes.some((node) => node.id === state.dashboardGraphSelection?.id);
  if (!selectedVisible) {
    state.dashboardGraphSelection = null;
  }
  drawDashboardGraph(graph);
  renderGraphLegend(graph);
  renderGraphDrilldown(graph);
}

function updateGraphControls() {
  els.dashboardGraphModeLineage.classList.toggle("active", state.dashboardGraphMode === "lineage");
  els.dashboardGraphModeRelationship.classList.toggle("active", state.dashboardGraphMode === "relationship");
  els.dashboardGraphModeLineage.setAttribute("aria-selected", String(state.dashboardGraphMode === "lineage"));
  els.dashboardGraphModeRelationship.setAttribute("aria-selected", String(state.dashboardGraphMode === "relationship"));
  if (els.dashboardGraphScope.value !== state.dashboardGraphScope) {
    els.dashboardGraphScope.value = state.dashboardGraphScope;
  }
}

function buildLineageGraphView(scope) {
  const artifact = state.dashboardArtifacts["lineage_graph.json"];
  if (!artifact) {
    return emptyGraphModel("Lineage graph", "lineage_graph.json", "lineage_graph.json is not available.");
  }

  const categories = new Set(lineageCategoriesForScope(scope));
  const rawNodes = Array.isArray(artifact.nodes) ? artifact.nodes : [];
  const nodes = rawNodes
    .map((node) => normalizeLineageNode(node))
    .filter((node) => categories.has(node.category));
  const nodeIds = new Set(nodes.map((node) => node.id));
  let edges = (Array.isArray(artifact.edges) ? artifact.edges : [])
    .map((edge) => normalizeGraphEdge(edge, "lineage_graph.json"))
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  if (scope === "relationships") {
    edges = edges.filter((edge) => [
      "defines_relationship",
      "uses_child_table",
      "uses_parent_table",
      "uses_child_column",
      "uses_parent_column",
    ].includes(edge.type));
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

function lineageCategoriesForScope(scope) {
  if (scope === "columns") {
    return ["source", "schema", "table", "column", "relationship"];
  }
  if (scope === "relationships") {
    return ["schema", "table", "column", "relationship"];
  }
  if (scope === "runtime") {
    return ["source", "schema", "table", "relationship", "stage", "artifact"];
  }
  return ["source", "schema", "table", "relationship"];
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

function buildRelationshipGraphView(scope) {
  const artifact = state.dashboardArtifacts["relationship_graph.json"];
  if (!artifact) {
    return emptyGraphModel("Relationship graph", "relationship_graph.json", "relationship_graph.json is not available.");
  }

  const nodes = [];
  const edges = [];
  const tableIds = new Map();
  const columnIds = new Map();
  const relationshipIds = new Map();
  const includeColumns = scope === "columns" || scope === "relationships";
  const includeRelationships = scope === "relationships" || scope === "runtime";
  const includeArtifact = scope === "runtime";

  (Array.isArray(artifact.nodes) ? artifact.nodes : []).forEach((tableNode) => {
    const tableName = String(tableNode.table || "");
    if (!tableName) {
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

  (Array.isArray(artifact.edges) ? artifact.edges : []).forEach((edge) => {
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
  const selectedId = state.dashboardGraphSelection?.id || "";
  els.dashboardGraphStatus.textContent = `${graph.title} · ${graphScopeLabels[state.dashboardGraphScope]} · ${graph.nodes.length} nodes · ${graph.edges.length} edges`;
  els.dashboardGraphSvg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  els.dashboardGraphSvg.innerHTML = `
    <defs>
      <marker id="graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z"></path>
      </marker>
    </defs>
    <g class="graph-edges">
      ${graph.edges.map((edge) => graphEdgeSvg(edge, layout.positions)).join("")}
    </g>
    <g class="graph-nodes">
      ${graph.nodes.map((node) => graphNodeSvg(node, layout.positions.get(node.id), selectedId === node.id)).join("")}
    </g>
  `;
}

function layoutDashboardGraph(graph) {
  const nodeWidth = 176;
  const nodeHeight = 46;
  const xGap = 76;
  const yGap = 12;
  const margin = 28;
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
  const width = Math.max(760, margin * 2 + groups.length * nodeWidth + Math.max(groups.length - 1, 0) * xGap);
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

function graphEdgeSvg(edge, positions) {
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
  return `
    <path class="graph-edge ${escapeHtml(tone)}" d="${path}" marker-end="url(#graph-arrow)">
      <title>${escapeHtml(edge.label || edge.type)}</title>
    </path>
  `;
}

function graphNodeSvg(node, position, selected) {
  if (!position) {
    return "";
  }
  const label = truncateMiddle(node.label, 28);
  const category = graphCategoryLabels[node.category] || node.category;
  const nodeClass = `graph-node graph-node-${node.category}${selected ? " selected" : ""}`;
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

  const issues = graphIssuesForNode(node);
  const artifacts = graphArtifactsForNode(node, graph);
  els.dashboardGraphDrilldownMeta.textContent = truncateMiddle(node.label, 36);
  els.dashboardGraphDrilldown.innerHTML = `
    <div class="graph-node-detail">
      <strong>${escapeHtml(node.label)}</strong>
      <p><code>${escapeHtml(node.id)}</code></p>
      <span class="pill-status ${graphNodePillClass(node)}">${escapeHtml(graphCategoryLabels[node.category] || node.category)}</span>
    </div>
    ${renderGraphMetadata(node)}
    ${renderIssueRows(issues)}
    ${renderDrilldownArtifacts(artifacts)}
  `;
}

function graphIssuesForNode(node) {
  const issues = getFilteredDashboardIssues();
  const data = node.data || {};
  const evidenceIssueIds = new Set(
    (Array.isArray(data.evidence_links) ? data.evidence_links : [])
      .map((link) => link.issue_id)
      .filter(Boolean),
  );
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

function graphArtifactsForNode(node, graph) {
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
  if (["invalid", "failed"].includes(status)) {
    return "danger";
  }
  if (["warning", "skipped"].includes(status)) {
    return "warn";
  }
  return "";
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
    .map(([label, value]) => ({ label, value, kind: "relationship_status" }))
    .sort((a, b) => relationshipStatusOrder(a.label) - relationshipStatusOrder(b.label));
  return dashboardPanel(
    "Relationship FK health",
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
    <article class="dashboard-card">
      <div class="dashboard-card-heading">
        <strong>${escapeHtml(title)}</strong>
        ${artifactUrl ? `<a href="${escapeHtml(artifactUrl)}" target="_blank" rel="noopener">${escapeHtml(artifactPath)}</a>` : `<span>${escapeHtml(artifactPath)}</span>`}
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
        return `
          <button class="dashboard-bar-row" type="button" data-dashboard-kind="${escapeHtml(row.kind)}" data-dashboard-value="${escapeHtml(row.label)}" data-dashboard-label="${escapeHtml(row.label)}">
            <span class="dashboard-bar-label">${escapeHtml(row.label)}</span>
            <span class="dashboard-bar-track"><span class="dashboard-bar-fill ${dashboardTone(row.label)}" style="width: ${width}%"></span></span>
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
    ${renderIssueRows(issues)}
    ${renderDrilldownArtifacts(artifacts)}
  `;
}

function dashboardIssuesForSelection(selection) {
  const issues = getFilteredDashboardIssues();
  if (!selection || selection.kind === "overview" || selection.kind === "verdict") {
    return issues;
  }
  if (selection.kind === "severity") {
    return issues.filter((issue) => issue.severity === selection.value);
  }
  if (selection.kind === "issue_type") {
    return issues.filter((issue) => issue.issue_type === selection.value);
  }
  if (selection.kind === "table") {
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
            </div>
            <span class="pill-status ${issue.severity === "P0" || issue.severity === "P1" ? "missing" : "mapped"}">${escapeHtml(issue.severity || "")}</span>
            <div class="issue-counts">
              <span>${integerText(issue.bad_count)} rows</span>
              <span>${percentText(issue.bad_rate)}</span>
            </div>
            ${sampleUrl ? `<a href="${escapeHtml(sampleUrl)}" target="_blank" rel="noopener">sample CSV</a>` : `<span class="muted">no sample</span>`}
          </article>
        `;
      }).join("")}
    </div>
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
          ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener"><code>${escapeHtml(path)}</code></a>`
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
    paths.add(dashboardChartPaths.missingTable);
    paths.add(dashboardChartPaths.missingColumns);
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
    <a class="artifact-link" href="${escapeHtml(artifactIndex.artifact_urls[path])}" target="_blank" rel="noopener">
      <strong>${escapeHtml(artifactLabel(path))}</strong>
      <code>${escapeHtml(path)}</code>
    </a>
  `).join("");
}

function getDashboardIssues() {
  return Array.isArray(state.dashboardArtifacts["issues.json"])
    ? state.dashboardArtifacts["issues.json"]
    : [];
}

function getFilteredDashboardIssues() {
  return getDashboardIssues().filter((issue) => {
    const filters = state.dashboardFilters;
    return (
      (filters.severity === "all" || issue.severity === filters.severity) &&
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

function artifactLabel(path) {
  const labels = {
    "issues.json": "Issues",
    "connector_metadata.json": "Connector metadata",
    "schema_parse_report.json": "Schema parse diagnostics",
    "lineage_graph.json": "Lineage graph",
    "profile_summary.json": "Profile summary",
    "relationship_graph.json": "Relationship graph",
    "dataset_verdict.json": "Dataset verdict",
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
  if (!state.dbmlText) {
    return;
  }
  const url = buildDbdiagramUrl(state.dbmlText);
  els.dbdiagramLink.href = url;
  els.dbdiagramLink.setAttribute("aria-disabled", "false");
  els.diagramFrame.src = url;
  els.diagramFrame.hidden = false;
  els.diagramEmpty.hidden = true;
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
