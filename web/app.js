const state = {
  dbmlText: "",
  dbmlName: "",
  dbmlFile: null,
  flowMode: "choose",
  profileStep: "connect",
  activeWorkflowTarget: "flowChooser",
  evaluationCatalog: [],
  evaluationCatalogLoading: false,
  evaluationCatalogError: "",
  evaluationSelectedDatasetId: "",
  evaluationJob: null,
  evaluationArtifacts: {},
  evaluationLoadingJobId: "",
  evaluationMessage: "No arbitrary uploads are accepted in Evaluate.",
  evaluationMessageStatus: "idle",
  runnerMode: "upload",
  selectedDemoPreset: "small",
  llmMode: "off",
  runnerAvailable: false,
  runnerHost: "",
  currentJob: null,
  runEvents: [],
  runHistory: [],
  runHistoryLoading: false,
  runHistoryError: "",
  selectedHistoryJobId: "",
  eventSource: null,
  dashboardArtifactIndex: null,
  dashboardLoadingJobId: "",
  dashboardArtifacts: {},
  dashboardFilters: {
    severity: "all",
    issueType: "all",
    table: "all",
  },
  todoFilter: "all",
  dashboardSelection: null,
  issueSampleRows: {},
  issueLlmProvider: "fake",
  issueLlmPanelOpen: false,
  issueLlmRunningIssueId: "",
  issueLlmMessage: "",
  issueLlmMessageStatus: "",
  diagramSelection: null,
  diagramExpanded: false,
  diagramShowNonKey: true,
  diagramFit: true,
  diagramZoom: 1,
  diagramManualPositions: new Map(),
  diagramDrag: null,
  diagramSuppressClick: false,
  tables: [],
  relationships: [],
  dbmlParseError: "",
  csvFiles: [],
  csvReadErrors: [],
  mapping: new Map(),
  manualMappings: new Set(),
  preflightAcceptedWarnings: new Set(),
};

const DIAGRAM_TABLE_HEADER_HEIGHT = 50;
const DIAGRAM_TABLE_PILL_Y = 56;
const DIAGRAM_TABLE_PILL_TEXT_Y = 68;
const DIAGRAM_COLUMN_START_Y = 90;
const DIAGRAM_COLUMN_ROW_HEIGHT = 21;

const els = {
  workflowNav: document.querySelector("#workflowNav"),
  flowChooser: document.querySelector("#flowChooser"),
  profileFlow: document.querySelector("#profileFlow"),
  evaluateFlow: document.querySelector("#evaluateFlow"),
  profileFlowCard: document.querySelector("#profileFlowCard"),
  evaluateFlowCard: document.querySelector("#evaluateFlowCard"),
  profileFlowButton: document.querySelector("#profileFlowButton"),
  evaluateFlowButton: document.querySelector("#evaluateFlowButton"),
  flowModeStatus: document.querySelector("#flowModeStatus"),
  profileStepBack: document.querySelector("#profileStepBack"),
  profileStepNext: document.querySelector("#profileStepNext"),
  profileStepHint: document.querySelector("#profileStepHint"),
  evaluateStatusBadge: document.querySelector("#evaluateStatusBadge"),
  evaluationCatalogCount: document.querySelector("#evaluationCatalogCount"),
  evaluationDatasetList: document.querySelector("#evaluationDatasetList"),
  startEvaluationButton: document.querySelector("#startEvaluationButton"),
  evaluateMessage: document.querySelector("#evaluateMessage"),
  evaluationComparisonStatus: document.querySelector("#evaluationComparisonStatus"),
  evaluationSummaryStrip: document.querySelector("#evaluationSummaryStrip"),
  evaluationExpectedList: document.querySelector("#evaluationExpectedList"),
  evaluationUsefulnessList: document.querySelector("#evaluationUsefulnessList"),
  evaluationBaselineList: document.querySelector("#evaluationBaselineList"),
  evaluationArtifactLinks: document.querySelector("#evaluationArtifactLinks"),
  topbarActions: document.querySelector("#topbarActions"),
  dbmlInput: document.querySelector("#dbmlInput"),
  csvInput: document.querySelector("#csvInput"),
  dbmlDropzone: document.querySelector("#dbmlDropzone"),
  csvDropzone: document.querySelector("#csvDropzone"),
  dbmlStatus: document.querySelector("#dbmlStatus"),
  csvStatus: document.querySelector("#csvStatus"),
  sourceStateBadge: document.querySelector("#sourceStateBadge"),
  sourceStateSummary: document.querySelector("#sourceStateSummary"),
  sourceStateDetails: document.querySelector("#sourceStateDetails"),
  inputSetup: document.querySelector("#inputSetup"),
  upload: document.querySelector("#upload"),
  quickDemoButton: document.querySelector("#quickDemoButton"),
  clearUploadButton: document.querySelector("#clearUploadButton"),
  preflightStatus: document.querySelector("#preflightStatus"),
  mappingStatus: document.querySelector("#mappingStatus"),
  runnerStatus: document.querySelector("#runnerStatus"),
  preflightReview: document.querySelector("#preflightReview"),
  preflightGateBadge: document.querySelector("#preflightGateBadge"),
  preflightRunSummary: document.querySelector("#preflightRunSummary"),
  preflightBlockerCount: document.querySelector("#preflightBlockerCount"),
  preflightWarningCount: document.querySelector("#preflightWarningCount"),
  preflightBlockerList: document.querySelector("#preflightBlockerList"),
  preflightWarningList: document.querySelector("#preflightWarningList"),
  tableCountBadge: document.querySelector("#tableCountBadge"),
  csvCountBadge: document.querySelector("#csvCountBadge"),
  dbmlFileCard: document.querySelector("#dbmlFileCard"),
  dbmlFileName: document.querySelector("#dbmlFileName"),
  dbmlFileMeta: document.querySelector("#dbmlFileMeta"),
  runnerModeUpload: document.querySelector("#runnerModeUpload"),
  runnerModePath: document.querySelector("#runnerModePath"),
  runnerForm: document.querySelector("#runnerForm"),
  pathRunnerForm: document.querySelector("#pathRunnerForm"),
  profileDeveloperOptions: document.querySelector("#profileDeveloperOptions"),
  llmModeToggle: document.querySelector("#llmModeToggle"),
  llmModeStatus: document.querySelector("#llmModeStatus"),
  runSourcePreview: document.querySelector("#runSourcePreview"),
  runSourceMode: document.querySelector("#runSourceMode"),
  runSourceDbml: document.querySelector("#runSourceDbml"),
  runSourceCsvCount: document.querySelector("#runSourceCsvCount"),
  runSourceCsvList: document.querySelector("#runSourceCsvList"),
  runProfilerButton: document.querySelector("#runProfilerButton"),
  runPathProfilerButton: document.querySelector("#runPathProfilerButton"),
  dbmlPathInput: document.querySelector("#dbmlPathInput"),
  csvDirPathInput: document.querySelector("#csvDirPathInput"),
  runnerMessage: document.querySelector("#runnerMessage"),
  jobStatusBadge: document.querySelector("#jobStatusBadge"),
  eventCount: document.querySelector("#eventCount"),
  stageList: document.querySelector("#stageList"),
  artifactCount: document.querySelector("#artifactCount"),
  artifactList: document.querySelector("#artifactList"),
  runHistoryStatus: document.querySelector("#runHistoryStatus"),
  runHistoryCount: document.querySelector("#runHistoryCount"),
  runHistoryList: document.querySelector("#runHistoryList"),
  selectedRunTimelineStatus: document.querySelector("#selectedRunTimelineStatus"),
  selectedRunTimeline: document.querySelector("#selectedRunTimeline"),
  dashboardStatusBadge: document.querySelector("#dashboardStatusBadge"),
  dashboardIssueCount: document.querySelector("#dashboardIssueCount"),
  dashboardSeverityFilter: document.querySelector("#dashboardSeverityFilter"),
  dashboardIssueTypeFilter: document.querySelector("#dashboardIssueTypeFilter"),
  dashboardTableFilter: document.querySelector("#dashboardTableFilter"),
  dashboardResetFilters: document.querySelector("#dashboardResetFilters"),
  dashboardMessage: document.querySelector("#dashboardMessage"),
  dashboardSummaryStrip: document.querySelector("#dashboardSummaryStrip"),
  qualityGatesStatus: document.querySelector("#qualityGatesStatus"),
  qualityGatesGrid: document.querySelector("#qualityGatesGrid"),
  todosStatus: document.querySelector("#todosStatus"),
  todosGrid: document.querySelector("#todosGrid"),
  todosFilterAll: document.querySelector("#todosFilterAll"),
  todosFilterFix: document.querySelector("#todosFilterFix"),
  todosFilterVerify: document.querySelector("#todosFilterVerify"),
  reportExportStatus: document.querySelector("#reportExportStatus"),
  reportExportGrid: document.querySelector("#reportExportGrid"),
  reportExportTodos: document.querySelector("#reportExportTodos"),
  reportExportMessage: document.querySelector("#reportExportMessage"),
  tableImpactStatus: document.querySelector("#tableImpactStatus"),
  tableImpactGrid: document.querySelector("#tableImpactGrid"),
  dashboardPanelGrid: document.querySelector("#dashboardPanelGrid"),
  dashboardDrilldown: document.querySelector("#dashboardDrilldown"),
  dashboardDrilldownMeta: document.querySelector("#dashboardDrilldownMeta"),
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
  diagramZoomOutButton: document.querySelector("#diagramZoomOutButton"),
  diagramZoomInButton: document.querySelector("#diagramZoomInButton"),
  diagramZoomValue: document.querySelector("#diagramZoomValue"),
  diagramColumnsToggle: document.querySelector("#diagramColumnsToggle"),
  diagramResetSelection: document.querySelector("#diagramResetSelection"),
  mappedMetric: document.querySelector("#mappedMetric"),
  missingMetric: document.querySelector("#missingMetric"),
  extraMetric: document.querySelector("#extraMetric"),
  edgeList: document.querySelector("#edgeList"),
  mappingBody: document.querySelector("#mappingBody"),
  loadDemoButton: document.querySelector("#loadDemoButton"),
};

const { demoPresets } = window.VSF_DEMO_DATA;
const {
  cloneCsvPreview,
  parseDbml,
  readCsvFile,
} = window.VSF_SOURCE_PARSERS;
const {
  dashboardChartPaths,
  dashboardMachineArtifacts,
  localDiagramLimits,
  postRunDiagramArtifacts,
  severityOrder,
} = window.VSF_DASHBOARD_CONFIG;
const {
  profileWorkflowStages,
  evaluateWorkflowSteps,
} = window.VSF_WORKFLOW_NAV_CONFIG;

const profileSteps = ["connect", "preflight", "run", "review"];
const profileStepLabels = {
  connect: "Connect",
  preflight: "Preflight Review",
  run: "Run",
  review: "Review",
};
const runnerUiDemoPresets = new Set(["small"]);
const runtimeStageDescriptions = {
  parse_dbml_schema: "Parses the DBML contract, counts tables and relationships, and records schema diagnostics before any CSV data is trusted.",
  catalog_csv_files: "Builds the CSV inventory, matches CSV files to DBML tables, and records missing or extra source files.",
  profile_csv_tables: "Profiles mapped CSV tables and columns, including row counts, column counts, nulls, type casts, distributions, and outlier evidence.",
  data_quality_checks: "Runs deterministic column and table checks from the DBML contract, then writes issue rows for missing, duplicate, invalid, and outlier findings.",
  relationship_checks: "Validates DBML foreign-key relationships against the CSV data, including orphan child rows, null keys, and duplicate parent keys.",
  write_machine_artifacts: "Writes the machine-readable artifacts used by Review: issues, table readiness, action plans, todos, quality gates, charts, and schema evidence.",
  llm_narrative: "Optionally generates the compatibility LLM summary artifact. OpenAI is called only when selected and configured; missing provider config uses deterministic fallback.",
  render_reports: "Renders the human-readable Markdown and HTML reports locally from existing artifacts. This step does not call OpenAI or any external provider.",
};

let workflowNavScrollFrame = 0;

function severityRank(severity) {
  const index = severityOrder.indexOf(severity);
  return index === -1 ? severityOrder.length : index;
}

els.workflowNav.addEventListener("click", (event) => {
  handleWorkflowNavClick(event);
});

els.profileFlowButton.addEventListener("click", () => {
  setFlowMode("profile");
});

els.evaluateFlowButton.addEventListener("click", () => {
  setFlowMode("evaluate");
});

els.profileStepBack.addEventListener("click", () => {
  moveProfileStep(-1);
});

els.profileStepNext.addEventListener("click", () => {
  moveProfileStep(1);
});

els.profileFlow.addEventListener("click", (event) => {
  const card = event.target.closest("[data-profile-step-card]");
  if (!card) {
    return;
  }
  const step = card.dataset.profileStepCard;
  if (canOpenProfileStep(step)) {
    setProfileStep(step);
  }
});

els.profileFlow.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) {
    return;
  }
  const card = event.target.closest("[data-profile-step-card]");
  if (!card) {
    return;
  }
  event.preventDefault();
  const step = card.dataset.profileStepCard;
  if (canOpenProfileStep(step)) {
    setProfileStep(step);
  }
});

els.stageList.addEventListener("toggle", (event) => {
  const stage = event.target.closest?.(".runtime-stage-item");
  if (event.target !== stage || !stage.open) {
    return;
  }
  ensureRuntimeStageDetailVisible(stage);
}, true);

els.startEvaluationButton.addEventListener("click", async () => {
  await startEvaluationRun();
});

els.evaluationDatasetList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-evaluation-dataset-id]");
  if (!button) {
    return;
  }
  state.evaluationSelectedDatasetId = button.dataset.evaluationDatasetId;
  renderEvaluation();
});

els.dbmlInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    await loadDbmlFile(file);
  }
});

els.csvInput.addEventListener("change", async (event) => {
  await loadCsvFiles([...event.target.files]);
});

els.visualizeButton.addEventListener("click", () => {
  renderDiagram();
});

els.diagramFitButton.addEventListener("click", () => {
  state.diagramFit = !state.diagramFit;
  if (state.diagramFit) {
    state.diagramZoom = 1;
  }
  renderDiagram();
  els.diagramCanvas.scrollTo({ left: 0, top: 0, behavior: "smooth" });
});

els.diagramZoomOutButton.addEventListener("click", () => {
  adjustDiagramZoom(-0.15);
});

els.diagramZoomInButton.addEventListener("click", () => {
  adjustDiagramZoom(0.15);
});

els.diagramColumnsToggle.addEventListener("click", () => {
  state.diagramShowNonKey = !state.diagramShowNonKey;
  if (state.diagramShowNonKey) {
    state.diagramFit = false;
  }
  renderDiagram();
});

els.diagramResetSelection.addEventListener("click", () => {
  state.diagramSelection = null;
  state.diagramManualPositions = new Map();
  state.diagramDrag = null;
  renderDiagram();
});

els.autoLinkButton.addEventListener("click", () => {
  resetPreflightReview();
  autoLinkCsvs();
  renderAll();
});

els.loadDemoButton.addEventListener("click", () => {
  loadDemoState("small", {
    switchToPath: true,
    preserveStep: state.flowMode === "profile" && ["preflight", "run"].includes(state.profileStep),
  });
});

els.clearUploadButton.addEventListener("click", () => {
  clearProfileInputs({ clearPathValues: true });
});

els.quickDemoButton.addEventListener("click", () => {
  loadDemoState("small", { switchToPath: true, quickDemo: true });
});

els.runnerModeUpload.addEventListener("click", () => {
  setRunnerMode("upload");
});

els.runnerModePath.addEventListener("click", () => {
  setRunnerMode("path");
});

els.llmModeToggle.addEventListener("click", () => {
  setLlmMode(state.llmMode === "openai" ? "off" : "openai");
});

els.runnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startProfilerRun();
});

els.pathRunnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startPathRun();
});

els.preflightReview.addEventListener("click", (event) => {
  const warningButton = event.target.closest("[data-preflight-warning-id]");
  if (warningButton) {
    state.preflightAcceptedWarnings.add(warningButton.dataset.preflightWarningId);
    renderAll();
    return;
  }
  const acceptAllButton = event.target.closest("[data-preflight-accept-all]");
  if (acceptAllButton) {
    buildPreflightReview().warnings.forEach((warning) => {
      state.preflightAcceptedWarnings.add(warning.id);
    });
    renderAll();
  }
});

els.runHistoryList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-run-history-job-id]");
  if (!button) {
    return;
  }
  await selectRunHistory(button.dataset.runHistoryJobId);
});

[
  els.dbmlPathInput,
  els.csvDirPathInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    resetPreflightReview();
    syncDemoPresetFromPathInputs();
    renderAll();
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
    renderDashboard();
  });
});

els.dashboardResetFilters.addEventListener("click", () => {
  state.dashboardFilters = { severity: "all", issueType: "all", table: "all" };
  state.dashboardSelection = null;
  renderDashboard();
});

[
  [els.todosFilterAll, "all"],
  [els.todosFilterFix, "fix_data"],
  [els.todosFilterVerify, "verify_after_fix"],
].forEach(([button, filter]) => {
  button.addEventListener("click", () => {
    state.todoFilter = filter;
    renderTodosSection();
  });
});

els.reportExportTodos.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-todo-export]");
  if (!target) {
    return;
  }
  await handleTodoExport(target);
});

els.reportExportGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.dashboardPanelGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.todosGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.tableImpactGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.dashboardDrilldown.addEventListener("click", async (event) => {
  const providerTarget = event.target.closest("[data-issue-llm-provider]");
  if (providerTarget) {
    state.issueLlmProvider = providerTarget.dataset.issueLlmProvider || "fake";
    state.issueLlmPanelOpen = true;
    state.issueLlmMessage = "";
    state.issueLlmMessageStatus = "";
    renderDashboardDrilldown();
    return;
  }
  const enrichmentTarget = event.target.closest("[data-issue-llm-run]");
  if (enrichmentTarget) {
    state.issueLlmPanelOpen = true;
    await runIssueLlmEnrichment(enrichmentTarget.dataset.issueId || "");
    return;
  }
  const target = event.target.closest("[data-action-plan-export]");
  if (!target) {
    return;
  }
  await handleIssueActionPlanExport(target);
});

function handleDashboardSelectionClick(event) {
  const target = event.target.closest("[data-dashboard-kind]");
  if (!target) {
    return;
  }
  const nextKind = target.dataset.dashboardKind;
  const nextValue = target.dataset.dashboardValue || "";
  if (state.dashboardSelection?.kind !== nextKind || state.dashboardSelection?.value !== nextValue) {
    state.issueLlmPanelOpen = false;
  }
  state.dashboardSelection = {
    kind: nextKind,
    value: nextValue,
    label: target.dataset.dashboardLabel || target.textContent.trim(),
  };
  renderDashboardDrilldown();
  if (target.dataset.dashboardScroll === "drilldown") {
    window.requestAnimationFrame(() => {
      els.dashboardDrilldown.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
  }
}

els.diagramSvg.addEventListener("click", (event) => {
  if (state.diagramSuppressClick) {
    state.diagramSuppressClick = false;
    return;
  }
  handleDiagramSelectionEvent(event);
});

els.diagramSvg.addEventListener("pointerdown", (event) => {
  handleDiagramPointerDown(event);
});

els.diagramSvg.addEventListener("pointermove", (event) => {
  handleDiagramPointerMove(event);
});

els.diagramSvg.addEventListener("pointerup", (event) => {
  handleDiagramPointerEnd(event);
});

els.diagramSvg.addEventListener("pointercancel", (event) => {
  handleDiagramPointerEnd(event);
});

els.diagramSvg.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  if (handleDiagramSelectionEvent(event)) {
    event.preventDefault();
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
    state.runnerAvailable = response.ok && payload.status === "ok";
    state.runnerHost = typeof payload.host === "string" && payload.host ? payload.host : window.location.host;
    els.runnerMessage.textContent = state.runnerAvailable
      ? `Local backend is ready on ${runnerHostLabel()}.`
      : "Open this page with vsf-profiler web to run the backend pipeline.";
  } catch (error) {
    state.runnerAvailable = false;
    state.runnerHost = "";
    els.runnerMessage.textContent = "Open this page with vsf-profiler web to run the backend pipeline.";
  }
  renderAll();
  if (state.runnerAvailable) {
    if (state.flowMode === "evaluate") {
      await loadEvaluationCatalog();
    }
  } else {
    state.runHistory = [];
    state.runHistoryError = "Local backend unavailable.";
    state.evaluationCatalog = [];
    state.evaluationCatalogError = "Local backend unavailable.";
    renderRunHistory();
    renderEvaluation();
  }
}

async function loadRunHistory(options = {}) {
  if (!state.runnerAvailable && !options.force) {
    return;
  }
  state.runHistoryLoading = true;
  state.runHistoryError = "";
  renderRunHistory();
  try {
    const response = await fetch("/api/history", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load run history.");
    }
    state.runHistory = Array.isArray(payload.runs) ? payload.runs : [];
    const preferredJobId = options.preferredJobId || state.selectedHistoryJobId || state.currentJob?.job_id || "";
    const preferredEntry = state.runHistory.find((run) => run.job_id === preferredJobId);
    state.selectedHistoryJobId = preferredEntry?.job_id || state.runHistory[0]?.job_id || "";
  } catch (error) {
    state.runHistoryError = error.message || "Unable to load run history.";
  } finally {
    state.runHistoryLoading = false;
    renderRunHistory();
    renderProfileStepper();
  }
}

async function loadEvaluationCatalog() {
  if (!state.runnerAvailable) {
    state.evaluationCatalog = [];
    state.evaluationCatalogError = "Open this page with vsf-profiler web to load Evaluate datasets.";
    renderEvaluation();
    return;
  }
  if (state.evaluationCatalogLoading || state.evaluationCatalog.length) {
    renderEvaluation();
    return;
  }
  state.evaluationCatalogLoading = true;
  state.evaluationCatalogError = "";
  renderEvaluation();
  try {
    const response = await fetch("/api/evaluation-catalog", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load evaluation catalog.");
    }
    state.evaluationCatalog = Array.isArray(payload.datasets) ? payload.datasets : [];
    state.evaluationSelectedDatasetId =
      state.evaluationSelectedDatasetId ||
      state.evaluationCatalog[0]?.dataset_id ||
      "";
    state.evaluationMessage = "No arbitrary uploads are accepted. Choose a built-in faulty dataset and run the local comparison.";
    state.evaluationMessageStatus = "idle";
  } catch (error) {
    state.evaluationCatalogError = error.message || "Unable to load evaluation catalog.";
  } finally {
    state.evaluationCatalogLoading = false;
    renderEvaluation();
    renderControls();
  }
}

async function startEvaluationRun() {
  if (!state.runnerAvailable) {
    renderEvaluationMessage("Open this page with vsf-profiler web to run evaluation.", "error");
    return;
  }
  const datasetId = state.evaluationSelectedDatasetId;
  if (!datasetId) {
    renderEvaluationMessage("Choose a built-in faulty dataset first.", "error");
    return;
  }
  state.evaluationJob = { status: "queued", input_mode: "evaluation", artifacts: [] };
  state.evaluationArtifacts = {};
  state.evaluationLoadingJobId = "";
  renderEvaluationMessage("Starting built-in evaluation dataset run...", "pending");
  renderEvaluation();

  try {
    const response = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Backend rejected the evaluation dataset.");
    }
    state.evaluationJob = payload;
    renderEvaluationMessage("Evaluation running. VSF artifacts and comparison JSON are being generated.", "pending");
    await pollEvaluationJob(payload.job_id);
  } catch (error) {
    state.evaluationLoadingJobId = "";
    renderEvaluationMessage(error.message || "Unable to start evaluation run.", "error");
    renderEvaluation();
  }
}

async function pollEvaluationJob(jobId) {
  state.evaluationLoadingJobId = jobId;
  while (state.evaluationLoadingJobId === jobId) {
    await wait(500);
    const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      state.evaluationLoadingJobId = "";
      throw new Error(payload.error || "Unable to load evaluation job status.");
    }
    state.evaluationJob = payload;
    renderEvaluation();
    if (payload.status === "succeeded") {
      await loadEvaluationArtifacts(payload);
      state.evaluationLoadingJobId = "";
      renderEvaluationMessage("Evaluation complete. Comparison Summary is ready.", "success");
      renderEvaluation();
      return;
    }
    if (payload.status === "failed") {
      state.evaluationLoadingJobId = "";
      renderEvaluationMessage(payload.error || "Evaluation run failed.", "error");
      renderEvaluation();
      return;
    }
  }
}

async function loadEvaluationArtifacts(job) {
  const artifactPaths = [
    "evaluation_summary.json",
    "ground_truth_issues.json",
    "baseline_comparison.json",
  ];
  const loaded = {};
  await Promise.all(
    artifactPaths.map(async (artifactPath) => {
      const url = evaluationArtifactUrl(artifactPath, job.artifacts || []);
      if (url) {
        loaded[artifactPath] = await fetchArtifactJson(artifactPath, url);
      }
    }),
  );
  state.evaluationArtifacts = loaded;
}

function renderEvaluationMessage(message, status) {
  state.evaluationMessage = message;
  state.evaluationMessageStatus = status;
  els.evaluateMessage.textContent = message;
  els.evaluateMessage.dataset.status = status;
}

async function selectRunHistory(jobId) {
  if (!jobId) {
    return;
  }
  state.selectedHistoryJobId = jobId;
  renderRunHistory();
  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load the selected run.");
    }
    state.currentJob = payload;
    state.runEvents = [];
    renderJob();
    await loadDashboard(jobId, { force: true });
    state.profileStep = "review";
    renderRunnerMessage(`Loaded run ${jobId} from history.`, "success");
  } catch (error) {
    renderRunnerMessage(error.message || "Unable to load the selected run.", "error");
  } finally {
    renderAll();
  }
}

async function startProfilerRun() {
  state.profileStep = "run";
  const preflightReview = buildPreflightReview();
  if (!preflightReview.runAllowed) {
    renderRunnerMessage(preflightGateMessage(preflightReview), "error");
    return;
  }
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
  const mappingOverrides = mappingOverridesForRun();
  if (Object.keys(mappingOverrides).length) {
    form.append("mapping_overrides", JSON.stringify(mappingOverrides));
  }
  form.append("preflight_review", JSON.stringify(buildPreflightReviewPayload(preflightReview)));
  appendLlmFormFields(form);

  state.runEvents = [];
  state.currentJob = { status: "queued", artifacts: [] };
  resetDashboardState();
  renderJob();
  renderRunnerMessage(`Uploading files to local runner${llmRunSuffix()}...`, "pending");
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
  state.profileStep = "run";
  const preflightReview = buildPreflightReview();
  if (!preflightReview.runAllowed) {
    renderRunnerMessage(preflightGateMessage(preflightReview), "error");
    return;
  }
  if (!state.runnerAvailable) {
    renderRunnerMessage("Open this page with vsf-profiler web to run the backend pipeline.", "error");
    return;
  }

  const dbmlPath = els.dbmlPathInput.value.trim();
  const csvDir = els.csvDirPathInput.value.trim();
  if (!dbmlPath || !csvDir) {
    renderRunnerMessage("Selected DBML and CSV source are required.", "error");
    return;
  }

  const payload = {
    dbml_path: dbmlPath,
    csv_dir: csvDir,
  };
  const mappingOverrides = mappingOverridesForRun();
  if (Object.keys(mappingOverrides).length) {
    payload.mapping_overrides = mappingOverrides;
  }
  payload.preflight_review = buildPreflightReviewPayload(preflightReview);
  Object.assign(payload, llmRunOptions());

  state.runEvents = [];
  state.currentJob = { status: "queued", input_mode: "path", artifacts: [] };
  resetDashboardState();
  renderJob();
  renderRunnerMessage(`Starting local profiler job on ${runnerHostLabel()}${llmRunSuffix()}...`, "pending");
  els.runPathProfilerButton.disabled = true;

  try {
    const response = await fetch("/api/path-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responsePayload = await response.json();
    if (!response.ok) {
      throw new Error(responsePayload.error || "Backend rejected the selected local source.");
    }
    state.currentJob = responsePayload;
    renderRunnerMessage("Pipeline started. Runtime events are streaming from run_events.jsonl.", "pending");
    connectEventStream(responsePayload.events_url);
  } catch (error) {
    renderRunnerMessage(error.message || "Unable to start local profiler run.", "error");
  } finally {
    renderAll();
  }
}

function setRunnerMode(mode) {
  resetPreflightReview();
  state.runnerMode = ["upload", "path"].includes(mode) ? mode : "upload";
  if (state.runnerMode === "path") {
    syncDemoPresetFromPathInputs();
  }
  if (state.runnerMode === "path" && !state.dbmlText) {
    const presetName = demoPresets[state.selectedDemoPreset] ? state.selectedDemoPreset : "small";
    loadDemoState(presetName, { switchToPath: true, preserveStep: true });
    return;
  }
  const messages = {
    upload: "Start with files uploaded from this browser session.",
    path: `Start with selected files visible to the ${runnerHostLabel()} runner.`,
  };
  renderRunnerMessage(messages[state.runnerMode], "idle");
  renderAll();
}

function runnerHostLabel() {
  return state.runnerHost || window.location.host || "configured host";
}

function setFlowMode(mode, options = {}) {
  state.flowMode = ["choose", "profile", "evaluate"].includes(mode) ? mode : "choose";
  state.activeWorkflowTarget = defaultWorkflowTarget();
  if (state.flowMode === "evaluate") {
    loadEvaluationCatalog();
  }
  renderAll();
  const target = state.flowMode === "evaluate" ? els.evaluateFlow : els.profileFlow;
  if (state.flowMode !== "choose" && target && options.focus !== false) {
    target.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function setProfileStep(step, options = {}) {
  const nextStep = profileSteps.includes(step) ? step : "connect";
  const changed = state.profileStep !== nextStep;
  state.profileStep = nextStep;
  if (changed) {
    state.activeWorkflowTarget = defaultWorkflowTarget();
  }
  if (options.render !== false) {
    renderAll();
  }
  if (changed && options.focus !== false && state.flowMode === "profile") {
    els.profileFlow.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function moveProfileStep(direction) {
  const currentIndex = profileSteps.indexOf(state.profileStep);
  if (currentIndex === -1) {
    setProfileStep("connect");
    return;
  }
  if (direction < 0) {
    setProfileStep(profileSteps[Math.max(currentIndex - 1, 0)]);
    return;
  }
  const nextStep = profileSteps[currentIndex + 1];
  if (!nextStep || !profileStepGuard(state.profileStep).allowed) {
    renderProfileStepper();
    return;
  }
  setProfileStep(nextStep);
}

function setLlmMode(mode) {
  state.llmMode = mode === "openai" ? "openai" : "off";
  renderControls();
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
          ? "Run complete. Generated artifacts are ready. Click Next to review them."
          : state.currentJob.error || "Run failed.",
        state.currentJob.status === "succeeded" ? "success" : "error",
      );
      if (state.currentJob.status === "succeeded") {
        loadDashboard(state.currentJob.job_id)
          .then(() => renderAll())
          .catch(() => renderAll());
      } else {
        loadDashboard(state.currentJob.job_id);
        renderAll();
      }
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

function loadDemoState(presetName = "small", options = {}) {
  const previousProfileStep = state.profileStep;
  resetPreflightReview();
  resetRunResultsForInputChange();
  resetDiagramLayoutState();
  state.profileStep = options.preserveStep ? previousProfileStep : "connect";
  const preset = demoPresets[presetName] || demoPresets.small;
  state.selectedDemoPreset = presetName in demoPresets ? presetName : "small";
  state.dbmlText = preset.dbmlText;
  state.dbmlName = preset.dbmlName;
  state.dbmlFile = null;
  state.csvFiles = preset.csvs.map(cloneCsvPreview);
  state.csvReadErrors = [];
  els.dbmlInput.value = "";
  els.csvInput.value = "";
  els.dbmlPathInput.value = preset.dbmlPath;
  els.csvDirPathInput.value = preset.csvDir;
  if (options.switchToPath) {
    state.runnerMode = "path";
    renderRunnerMessage(
      options.quickDemo
        ? `${preset.label} DBML + CSV demo is loaded. Continue to Preflight Review.`
        : `${preset.label} DBML + CSV files are ready for the local runner.`,
      "idle",
    );
  }
  parseDbmlState();
  autoLinkCsvs();
  renderAll();
  renderDiagram();
}

function clearProfileInputs(options = {}) {
  resetPreflightReview();
  resetRunResultsForInputChange();
  resetDiagramLayoutState();
  state.profileStep = "connect";
  clearDbmlState();
  state.dbmlFile = null;
  state.csvFiles = [];
  state.csvReadErrors = [];
  state.mapping = new Map();
  state.manualMappings = new Set();
  state.runnerMode = "upload";
  state.selectedDemoPreset = "custom";
  els.dbmlInput.value = "";
  els.csvInput.value = "";
  if (options.clearPathValues) {
    els.dbmlPathInput.value = "";
    els.csvDirPathInput.value = "";
  }
  renderRunnerMessage("Source cleared. Add DBML and CSV files for a new profile run.", "idle");
  renderAll();
}

function clearDbmlState() {
  state.dbmlText = "";
  state.dbmlName = "";
  state.tables = [];
  state.relationships = [];
  state.dbmlParseError = "";
  state.diagramSelection = null;
}

function resetRunResultsForInputChange() {
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
  state.currentJob = null;
  state.runEvents = [];
  resetDashboardState();
}

function resetDiagramLayoutState() {
  state.diagramSelection = null;
  state.diagramFit = true;
  state.diagramZoom = 1;
  state.diagramManualPositions = new Map();
  state.diagramDrag = null;
  state.diagramSuppressClick = false;
}

function adjustDiagramZoom(delta) {
  state.diagramFit = false;
  state.diagramZoom = Math.max(0.5, Math.min(2, Number((state.diagramZoom + delta).toFixed(2))));
  renderDiagram();
}

function markCustomUploadSource() {
  state.runnerMode = "upload";
  state.selectedDemoPreset = "custom";
}

function syncDemoPresetFromPathInputs() {
  const dbmlPath = els.dbmlPathInput.value.trim();
  const csvDir = els.csvDirPathInput.value.trim();
  const match = Object.entries(demoPresets).find(([presetName, preset]) => (
    runnerUiDemoPresets.has(presetName) &&
    preset.dbmlPath === dbmlPath &&
    preset.csvDir === csvDir
  ));
  state.selectedDemoPreset = match ? match[0] : "custom";
}

function llmRunOptions() {
  if (state.llmMode === "off") {
    return { use_llm: false };
  }
  return {
    use_llm: true,
    llm_provider: state.llmMode,
  };
}

function appendLlmFormFields(form) {
  const options = llmRunOptions();
  form.append("use_llm", options.use_llm ? "true" : "false");
  if (options.llm_provider) {
    form.append("llm_provider", options.llm_provider);
  }
}

function llmRunSuffix() {
  return state.llmMode === "off" ? "" : " with LLM report enrichment";
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
  resetPreflightReview();
  resetRunResultsForInputChange();
  resetDiagramLayoutState();
  state.profileStep = "connect";
  markCustomUploadSource();
  if (!state.csvFiles.some((csvFile) => csvFile.sourceFile)) {
    state.csvFiles = [];
  }
  state.csvReadErrors = [];
  state.dbmlText = await file.text();
  state.dbmlName = file.name;
  state.dbmlFile = file;
  parseDbmlState();
  autoLinkCsvs();
  renderRunnerMessage("Custom DBML uploaded. Add matching CSV files, then review preflight.", "idle");
  renderAll();
}

async function loadCsvFiles(files) {
  if (!files.length) {
    return;
  }
  resetPreflightReview();
  resetRunResultsForInputChange();
  resetDiagramLayoutState();
  state.profileStep = "connect";
  const hasUploadedDbml = Boolean(state.dbmlFile);
  markCustomUploadSource();
  if (!hasUploadedDbml) {
    clearDbmlState();
  }
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        return { file: await readCsvFile(file) };
      } catch (error) {
        return {
          error: {
            name: file.name,
            message: error?.message || "Unable to read CSV file.",
          },
        };
      }
    }),
  );
  const parsed = results.map((result) => result.file).filter(Boolean);
  state.csvReadErrors = results.map((result) => result.error).filter(Boolean);
  state.csvFiles = parsed.sort((a, b) => a.name.localeCompare(b.name));
  autoLinkCsvs();
  renderRunnerMessage(
    parsed.length
      ? "Custom CSV upload replaced the previous source inventory. Review mapping before running."
      : "No readable CSV files were found in that upload.",
    parsed.length ? "idle" : "error",
  );
  renderAll();
}

function parseDbmlState() {
  const parsed = parseDbml(state.dbmlText);
  state.tables = parsed.tables;
  state.relationships = parsed.relationships;
  state.dbmlParseError = parsed.error;
  state.diagramSelection = null;
}

function autoLinkCsvs() {
  state.mapping = new Map();
  state.manualMappings = new Set();
  state.tables.forEach((table) => {
    const match = state.csvFiles.find((file) => file.stem === table.name);
    if (match) {
      state.mapping.set(table.name, match.stem);
    }
  });
}

function renderAll() {
  renderFlowShell();
  renderStatus();
  renderSourceState();
  renderCsvList();
  renderEdges();
  renderMapping();
  renderPreflightReview();
  renderDiagram();
  renderEvaluation();
  renderRunner();
  renderRunHistory();
  renderDashboard();
  renderControls();
  renderProfileStepper();
  renderSidebarNavigation();
}

function renderFlowShell() {
  const profileActive = state.flowMode === "profile";
  const evaluateActive = state.flowMode === "evaluate";
  els.profileFlow.hidden = !profileActive;
  els.evaluateFlow.hidden = !evaluateActive;
  els.topbarActions.hidden = !profileActive;
  els.flowModeStatus.textContent = profileActive
    ? "Profile my data"
    : evaluateActive
      ? "Evaluate tool"
      : "Choose a flow";
  [
    [els.profileFlowCard, els.profileFlowButton, profileActive],
    [els.evaluateFlowCard, els.evaluateFlowButton, evaluateActive],
  ].forEach(([card, button, active]) => {
    card.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderProfileStepper() {
  if (!els.profileFlow) {
    return;
  }
  if (!profileSteps.includes(state.profileStep)) {
    state.profileStep = "connect";
  }
  const currentStep = state.profileStep;
  const currentIndex = profileSteps.indexOf(currentStep);
  const nextStep = profileSteps[currentIndex + 1];
  const guard = profileStepGuard(currentStep);
  els.profileFlow.dataset.profileStep = currentStep;
  document.querySelectorAll("[data-profile-step-section]").forEach((section) => {
    const sectionSteps = (section.dataset.profileStepSection || "").split(/\s+/).filter(Boolean);
    section.hidden = !sectionSteps.includes(currentStep);
  });
  const hideUploadSetup = currentStep === "connect" && pathSourceActive();
  els.inputSetup.hidden = els.inputSetup.hidden || hideUploadSetup;
  els.upload.hidden = els.upload.hidden || hideUploadSetup;
  document.querySelectorAll("[data-profile-step-card]").forEach((card) => {
    const cardStep = card.dataset.profileStepCard;
    const cardIndex = profileSteps.indexOf(cardStep);
    const canOpen = canOpenProfileStep(cardStep);
    card.classList.toggle("active", cardStep === currentStep);
    card.classList.toggle("complete", profileStepComplete(cardStep));
    card.classList.toggle("pending", cardIndex > currentIndex);
    card.classList.toggle("unavailable", !canOpen && cardStep !== currentStep);
    card.setAttribute("aria-disabled", canOpen ? "false" : "true");
    card.tabIndex = canOpen ? 0 : -1;
  });

  els.profileStepBack.disabled = currentIndex <= 0;
  els.profileStepNext.disabled = !nextStep || !guard.allowed;
  els.profileStepNext.textContent = nextStep
    ? `Next: ${profileStepLabels[nextStep]}`
    : "Review ready";
  els.profileStepHint.textContent = guard.message;
  els.profileStepHint.dataset.status = guard.allowed ? "ready" : "blocked";
}

function renderSidebarNavigation() {
  if (!els.workflowNav) {
    return;
  }
  const activeTarget = resolvedWorkflowActiveTarget();
  els.workflowNav.innerHTML = [
    renderChooseWorkflowNavItem(activeTarget),
    renderProfileWorkflowNav(activeTarget),
    renderEvaluateWorkflowNav(activeTarget),
  ].join("");
}

function renderChooseWorkflowNavItem(activeTarget) {
  const active = state.flowMode === "choose" || activeTarget === "flowChooser";
  return `
    <section class="nav-section" aria-label="Start">
      <a class="nav-item ${active ? "active" : ""}" href="#flowChooser" data-nav-flow="choose" data-workflow-nav-target="flowChooser"${active ? ' aria-current="step"' : ""}>
        <span class="nav-step-index">00</span>
        <span class="nav-item-body">
          <strong>Choose workflow</strong>
          <small>Profile data or evaluate tool</small>
        </span>
      </a>
    </section>
  `;
}

function renderProfileWorkflowNav(activeTarget) {
  return `
    <section class="nav-section" aria-label="Profile stages">
      <p class="nav-section-title">Profile flow</p>
      ${profileWorkflowStages.map((stage) => renderProfileStageNavItem(stage, activeTarget)).join("")}
    </section>
  `;
}

function renderProfileStageNavItem(stage, activeTarget) {
  const isProfileFlow = state.flowMode === "profile";
  const isCurrent = isProfileFlow && state.profileStep === stage.step;
  const complete = profileStageCompleteForSidebar(stage.step);
  const canOpen = canOpenProfileStepFromSidebar(stage.step);
  const status = isCurrent ? "Current" : complete ? "Done" : canOpen ? "Ready" : "Locked";
  const target = isCurrent ? workflowStageActiveSubtarget(stage, activeTarget) : stage.target;
  const stageClasses = [
    "nav-item",
    "nav-stage-item",
    isCurrent ? "active" : "",
    complete ? "complete" : "",
    !canOpen ? "unavailable" : "",
  ].filter(Boolean).join(" ");
  return `
    <div class="nav-stage-group">
      <a class="${stageClasses}" href="#${escapeHtml(target)}" data-nav-flow="profile" data-nav-profile-step="${escapeHtml(stage.step)}" data-workflow-nav-target="${escapeHtml(target)}"${!canOpen ? ' aria-disabled="true"' : ""}>
        <span class="nav-step-index">${escapeHtml(stage.number)}</span>
        <span class="nav-item-body">
          <strong>${escapeHtml(stage.label)}</strong>
          <small>${escapeHtml(stage.detail)}</small>
        </span>
        <span class="nav-status-pill">${escapeHtml(status)}</span>
      </a>
      ${isCurrent ? renderWorkflowSubsteps(stage, activeTarget) : ""}
    </div>
  `;
}

function renderWorkflowSubsteps(stage, activeTarget) {
  const activeSubtarget = workflowStageActiveSubtarget(stage, activeTarget);
  return `
    <div class="nav-substep-list" aria-label="${escapeHtml(stage.label)} substeps">
      ${stage.substeps.map((substep) => {
        const active = substep.target === activeSubtarget;
        return `
          <a class="nav-subitem ${active ? "active" : ""}" href="#${escapeHtml(substep.target)}" data-nav-flow="profile" data-nav-profile-step="${escapeHtml(stage.step)}" data-workflow-nav-target="${escapeHtml(substep.target)}"${active ? ' aria-current="step"' : ""}>
            <strong>${escapeHtml(substep.label)}</strong>
            <small>${escapeHtml(substep.detail)}</small>
          </a>
        `;
      }).join("")}
    </div>
  `;
}

function renderEvaluateWorkflowNav(activeTarget) {
  const active = state.flowMode === "evaluate";
  const activeStep = evaluateWorkflowSteps.some((step) => step.target === activeTarget)
    ? activeTarget
    : "evaluateFlow";
  return `
    <section class="nav-section" aria-label="Evaluate flow">
      <p class="nav-section-title">Evaluate flow</p>
      <a class="nav-item ${active ? "active" : ""}" href="#evaluateFlow" data-nav-flow="evaluate" data-workflow-nav-target="${escapeHtml(activeStep)}">
        <span class="nav-step-index">EV</span>
        <span class="nav-item-body">
          <strong>Evaluate tool</strong>
          <small>Curated faulty dataset benchmark</small>
        </span>
      </a>
      ${active ? `
        <div class="nav-substep-list" aria-label="Evaluate substeps">
          ${evaluateWorkflowSteps.map((step) => {
            const stepActive = step.target === activeStep;
            return `
              <a class="nav-subitem ${stepActive ? "active" : ""}" href="#${escapeHtml(step.target)}" data-nav-flow="evaluate" data-workflow-nav-target="${escapeHtml(step.target)}"${stepActive ? ' aria-current="step"' : ""}>
                <strong>${escapeHtml(step.label)}</strong>
                <small>${escapeHtml(step.detail)}</small>
              </a>
            `;
          }).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function workflowStageActiveSubtarget(stage, activeTarget) {
  return stage.substeps.some((substep) => substep.target === activeTarget)
    ? activeTarget
    : stage.substeps[0]?.target || stage.target;
}

function profileStageCompleteForSidebar(step) {
  if (profileStepComplete(step)) {
    return true;
  }
  if (state.flowMode !== "profile") {
    return false;
  }
  const currentIndex = profileSteps.indexOf(state.profileStep);
  const stepIndex = profileSteps.indexOf(step);
  return currentIndex > -1 && stepIndex > -1 && stepIndex < currentIndex;
}

function canOpenProfileStepFromSidebar(step) {
  if (canOpenProfileStep(step)) {
    return true;
  }
  if (step === "connect") {
    return true;
  }
  if (state.flowMode !== "profile") {
    return false;
  }
  const currentIndex = profileSteps.indexOf(state.profileStep);
  const stepIndex = profileSteps.indexOf(step);
  return currentIndex > -1 && stepIndex > -1 && stepIndex < currentIndex;
}

function resolvedWorkflowActiveTarget() {
  const visibleTargets = workflowVisibleTargets();
  if (
    state.activeWorkflowTarget &&
    visibleTargets.includes(state.activeWorkflowTarget) &&
    isWorkflowTargetVisible(state.activeWorkflowTarget)
  ) {
    return state.activeWorkflowTarget;
  }
  return defaultWorkflowTarget();
}

function workflowVisibleTargets() {
  if (state.flowMode === "evaluate") {
    return evaluateWorkflowSteps.map((step) => step.target);
  }
  if (state.flowMode === "profile") {
    const stage = activeProfileWorkflowStage();
    return stage ? stage.substeps.map((substep) => substep.target) : [];
  }
  return ["flowChooser"];
}

function activeProfileWorkflowStage() {
  return profileWorkflowStages.find((stage) => stage.step === state.profileStep) || profileWorkflowStages[0];
}

function defaultWorkflowTarget() {
  if (state.flowMode === "evaluate") {
    return "evaluateFlow";
  }
  if (state.flowMode === "profile") {
    const stage = activeProfileWorkflowStage();
    return stage?.substeps?.[0]?.target || "sourceState";
  }
  return "flowChooser";
}

function isWorkflowTargetVisible(targetId) {
  const target = document.getElementById(targetId);
  if (!target || target.hidden || target.offsetParent === null) {
    return false;
  }
  const rect = target.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function handleWorkflowNavClick(event) {
  const item = event.target.closest("[data-workflow-nav-target]");
  if (!item) {
    return;
  }
  event.preventDefault();
  const targetId = item.dataset.workflowNavTarget || defaultWorkflowTarget();
  const flow = item.dataset.navFlow || state.flowMode;
  const profileStep = item.dataset.navProfileStep || "";

  if (profileStep && !canOpenProfileStepFromSidebar(profileStep)) {
    renderProfileStepper();
    renderSidebarNavigation();
    return;
  }

  if (flow && flow !== state.flowMode) {
    setFlowMode(flow, { focus: false });
  }
  if (flow === "profile" && profileStep && profileStep !== state.profileStep) {
    setProfileStep(profileStep, { focus: false });
  } else {
    renderAll();
  }
  state.activeWorkflowTarget = targetId;
  renderSidebarNavigation();
  scrollToWorkflowTarget(targetId);
}

function scrollToWorkflowTarget(targetId) {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(targetId);
    if (!target || target.hidden) {
      return;
    }
    target.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  });
}

function scheduleWorkflowNavViewportUpdate() {
  if (workflowNavScrollFrame) {
    return;
  }
  workflowNavScrollFrame = window.requestAnimationFrame(() => {
    workflowNavScrollFrame = 0;
    updateWorkflowNavFromViewport();
  });
}

function updateWorkflowNavFromViewport() {
  const targetId = workflowTargetFromViewport();
  if (!targetId || targetId === state.activeWorkflowTarget) {
    return;
  }
  state.activeWorkflowTarget = targetId;
  renderSidebarNavigation();
}

function workflowTargetFromViewport() {
  const probeY = Math.min(window.innerHeight * 0.32, 320);
  const candidates = workflowVisibleTargets()
    .map((targetId) => {
      const target = document.getElementById(targetId);
      if (!target || target.hidden || target.offsetParent === null) {
        return null;
      }
      const rect = target.getBoundingClientRect();
      if (rect.bottom < 96 || rect.top > window.innerHeight * 0.82) {
        return null;
      }
      return {
        targetId,
        distance: Math.abs(rect.top - probeY),
        top: rect.top,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance || a.top - b.top);
  return candidates[0]?.targetId || defaultWorkflowTarget();
}

function profileStepGuard(step) {
  if (step === "connect") {
    const ready = profileSourceReady();
    return {
      allowed: ready,
      message: ready
        ? "Source connected. Continue to Preflight Review."
        : "Add a DBML schema and matching CSV files before continuing.",
    };
  }
  if (step === "preflight") {
    const review = buildPreflightReview();
    return {
      allowed: review.runAllowed,
      message: review.runAllowed
        ? "Preflight is accepted. Continue to Run."
        : preflightGateMessage(review),
    };
  }
  if (step === "run") {
    const running = ["queued", "running"].includes(state.currentJob?.status);
    const succeeded = profileRunComplete();
    return {
      allowed: succeeded,
      message: succeeded
        ? "Run complete. Continue to Review."
        : running
          ? "Runtime stages are streaming. Review unlocks after a successful run."
          : "Start the profiler here. Review unlocks after a successful run.",
    };
  }
  return {
    allowed: false,
    message: "Review generated quality gates, issues, todos, reports, and table readiness.",
  };
}

function profileSourceReady() {
  if (state.runnerMode === "path") {
    return Boolean(els.dbmlPathInput.value.trim() && els.csvDirPathInput.value.trim());
  }
  return Boolean(
    state.dbmlFile &&
    state.csvFiles.some((file) => file.sourceFile) &&
    !state.dbmlParseError,
  );
}

function pathSourceActive() {
  return state.runnerMode === "path" && Boolean(
    state.dbmlText ||
    state.csvFiles.length ||
    els.dbmlPathInput.value.trim() ||
    els.csvDirPathInput.value.trim(),
  );
}

function profileRunComplete() {
  const succeeded = state.currentJob?.status === "succeeded" || state.dashboardArtifactIndex?.status === "succeeded";
  return succeeded && Boolean(state.dashboardArtifactIndex) && !state.dashboardLoadingJobId;
}

function canOpenProfileStep(step) {
  if (step === "connect") {
    return true;
  }
  if (step === "preflight") {
    return profileSourceReady();
  }
  if (step === "run") {
    return buildPreflightReview().runAllowed;
  }
  if (step === "review") {
    return profileRunComplete() || Boolean(state.dashboardArtifactIndex);
  }
  return false;
}

function profileStepComplete(step) {
  if (step === "connect") {
    return profileSourceReady();
  }
  if (step === "preflight") {
    return buildPreflightReview().runAllowed;
  }
  if (step === "run") {
    return profileRunComplete();
  }
  return Boolean(state.dashboardArtifactIndex);
}

function renderEvaluation() {
  const running = evaluationJobRunning();
  const summary = state.evaluationArtifacts["evaluation_summary.json"];
  const baseline = state.evaluationArtifacts["baseline_comparison.json"];
  const selectedDataset = selectedEvaluationDataset();
  const catalogCount = state.evaluationCatalog.length;

  els.evaluateStatusBadge.textContent = running
    ? "Running"
    : summary
      ? "Compared"
      : catalogCount
        ? "Ready"
        : state.evaluationCatalogLoading
          ? "Loading"
          : "Catalog";
  els.evaluateStatusBadge.dataset.status = running
    ? "warnings_pending"
    : summary
      ? "ready"
      : "";
  els.evaluationCatalogCount.textContent = `${integerText(catalogCount)} dataset${catalogCount === 1 ? "" : "s"}`;
  els.evaluateMessage.textContent = state.evaluationMessage;
  els.evaluateMessage.dataset.status = state.evaluationMessageStatus;
  els.startEvaluationButton.disabled = !state.runnerAvailable || !selectedDataset || running;
  renderEvaluationDatasetList();
  renderEvaluationComparison(summary, baseline);
}

function renderEvaluationDatasetList() {
  if (state.evaluationCatalogLoading) {
    els.evaluationDatasetList.innerHTML = `<p class="muted">Loading built-in evaluation datasets...</p>`;
    return;
  }
  if (state.evaluationCatalogError) {
    els.evaluationDatasetList.innerHTML = `<p class="muted">${escapeHtml(state.evaluationCatalogError)}</p>`;
    return;
  }
  if (!state.evaluationCatalog.length) {
    els.evaluationDatasetList.innerHTML = `<p class="muted">No built-in evaluation datasets are available from the local runner.</p>`;
    return;
  }
  els.evaluationDatasetList.innerHTML = state.evaluationCatalog.map((dataset) => {
    const selected = dataset.dataset_id === state.evaluationSelectedDatasetId;
    return `
      <button class="evaluation-dataset-card ${selected ? "selected" : ""}" type="button" role="radio" aria-checked="${selected ? "true" : "false"}" data-evaluation-dataset-id="${escapeHtml(dataset.dataset_id)}">
        <span>
          <strong>${escapeHtml(dataset.label)}</strong>
          <small>${escapeHtml(dataset.summary)}</small>
        </span>
        <span class="evaluation-dataset-meta">
          <code>${escapeHtml(dataset.domain || "dataset")}</code>
          <span>${integerText(dataset.table_count)} tables</span>
          <span>${integerText(dataset.expected_issue_group_count)} expected groups</span>
        </span>
      </button>
    `;
  }).join("");
}

function renderEvaluationComparison(summary, baseline) {
  const running = evaluationJobRunning();
  if (!summary) {
    els.evaluationComparisonStatus.textContent = running
      ? `${state.evaluationJob?.status || "running"}`
      : "Waiting for run";
    els.evaluationSummaryStrip.innerHTML = `
      <div><span>correctness</span><strong>--</strong></div>
      <div><span>baseline</span><strong>--</strong></div>
      <div><span>usefulness</span><strong>--</strong></div>
    `;
    const message = running
      ? "VSF is profiling the selected built-in dataset and generating comparison artifacts."
      : "Run a curated dataset to compare VSF output against seeded ground truth.";
    els.evaluationExpectedList.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
    els.evaluationUsefulnessList.innerHTML = `<p class="muted">Actionability metrics load from issue_action_plans.json after the evaluation run.</p>`;
    els.evaluationBaselineList.innerHTML = `<p class="muted">Great Expectations baseline status loads after comparison.</p>`;
    els.evaluationArtifactLinks.innerHTML = "";
    return;
  }

  const correctness = summary.correctness || {};
  const usefulness = summary.usefulness || {};
  const baselineSummary = summary.baseline || {};
  els.evaluationComparisonStatus.textContent = `${summary.dataset?.label || "Evaluation"} complete`;
  els.evaluationSummaryStrip.innerHTML = `
    <div><span>VSF caught</span><strong>${integerText(correctness.vsf_caught_occurrence_count)}/${integerText(correctness.expected_issue_occurrence_count)}</strong></div>
    <div><span>missed</span><strong>${integerText(correctness.vsf_missed_occurrence_count)}</strong></div>
    <div><span>extra</span><strong>${integerText(correctness.vsf_extra_occurrence_count)}</strong></div>
    <div><span>GE status</span><strong>${escapeHtml(baselineSummary.status || "unknown")}</strong></div>
    <div><span>guidance</span><strong>${integerText(usefulness.issue_action_plan_count)} plans</strong></div>
  `;
  els.evaluationExpectedList.innerHTML = renderEvaluationIssueRows(summary.issue_comparison_rows || []);
  els.evaluationUsefulnessList.innerHTML = renderEvaluationUsefulnessRows(usefulness);
  els.evaluationBaselineList.innerHTML = renderEvaluationBaselineRows(
    summary.baseline_rows || baseline?.rows || [],
    baselineSummary,
  );
  els.evaluationArtifactLinks.innerHTML = renderEvaluationArtifactLinks();
}

function renderEvaluationIssueRows(rows) {
  if (!rows.length) {
    return `<p class="muted">No comparison rows were generated.</p>`;
  }
  return rows.map((row) => `
    <div class="evaluation-row">
      <span class="pill-status ${evaluationStatusClass(row.vsf_status)}">${escapeHtml(row.vsf_status || "unknown")}</span>
      <span>
        <strong>${escapeHtml(issueTypeLabel(row))}</strong>
        <small>${escapeHtml(evaluationIssueContext(row))}</small>
      </span>
      <span class="evaluation-row-metrics">
        <code>${integerText(row.actual_occurrences)}/${integerText(row.expected_occurrences)} occurrences</code>
        <code>${escapeHtml(row.bad_count_status || "bad count unknown")}</code>
      </span>
    </div>
  `).join("");
}

function renderEvaluationUsefulnessRows(usefulness) {
  return `
    <div class="evaluation-metric-grid">
      <div><span>Action plans</span><strong>${integerText(usefulness.issue_action_plan_count)}</strong></div>
      <div><span>Evidence coverage</span><strong>${scoreOrIntegerText(usefulness.average_evidence_coverage_score)}/100</strong></div>
      <div><span>Actionability</span><strong>${scoreOrIntegerText(usefulness.average_actionability_score)}/100</strong></div>
      <div><span>Sample evidence</span><strong>${integerText(usefulness.sample_evidence_count)}</strong></div>
    </div>
  `;
}

function renderEvaluationBaselineRows(rows, baselineSummary) {
  const reason = baselineSummary.reason
    ? `<p class="evaluation-baseline-note">${escapeHtml(baselineSummary.reason)}</p>`
    : "";
  const summary = `
    <div class="evaluation-metric-grid">
      <div><span>GE caught</span><strong>${integerText(baselineSummary.ge_caught_group_count)}</strong></div>
      <div><span>Not covered</span><strong>${integerText(baselineSummary.ge_not_covered_group_count)}</strong></div>
      <div><span>Unavailable</span><strong>${integerText(baselineSummary.ge_unavailable_group_count)}</strong></div>
      <div><span>Baseline gaps</span><strong>${integerText(baselineSummary.baseline_gap_count)}</strong></div>
    </div>
    ${reason}
  `;
  const rowMarkup = rows.slice(0, 12).map((row) => `
    <div class="evaluation-row">
      <span class="pill-status ${evaluationStatusClass(row.ge_status)}">${escapeHtml(baselineStatusLabel(row.ge_status))}</span>
      <span>
        <strong>${escapeHtml(row.issue_type || "Expected issue")}</strong>
        <small>${escapeHtml(evaluationIssueContext(row))}</small>
      </span>
      <span class="evaluation-row-metrics">
        <code>${escapeHtml(row.reason || "")}</code>
      </span>
    </div>
  `).join("");
  return `${summary}${rowMarkup}`;
}

function renderEvaluationArtifactLinks() {
  const links = [
    ["evaluation_summary.json", "Evaluation summary"],
    ["ground_truth_issues.json", "Ground truth"],
    ["baseline_comparison.json", "Baseline comparison"],
  ].map(([path, label]) => {
    const url = evaluationArtifactUrl(path);
    return url
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener"><strong>${escapeHtml(label)}</strong><code>${escapeHtml(path)}</code></a>`
      : "";
  }).filter(Boolean).join("");
  return links
    ? `<div class="runtime-heading compact"><strong>Evaluation artifacts</strong><span>JSON</span></div>${links}`
    : "";
}

function selectedEvaluationDataset() {
  return state.evaluationCatalog.find((dataset) => (
    dataset.dataset_id === state.evaluationSelectedDatasetId
  )) || null;
}

function evaluationJobRunning() {
  return ["queued", "running"].includes(state.evaluationJob?.status);
}

function evaluationArtifactUrl(path, artifacts = state.evaluationJob?.artifacts || []) {
  const artifact = artifacts.find((item) => item.path === path);
  return artifact?.url || "";
}

function evaluationStatusClass(status) {
  if (["caught", "exact", "available"].includes(status)) {
    return "mapped";
  }
  if (["missed", "failed"].includes(status)) {
    return "failed";
  }
  if (["partial", "unavailable", "not_covered"].includes(status)) {
    return "missing";
  }
  return "extra";
}

function baselineStatusLabel(status) {
  if (status === "not_covered") {
    return "Not covered by baseline";
  }
  if (status === "unavailable") {
    return "GE unavailable";
  }
  return status || "unknown";
}

function evaluationIssueContext(row) {
  const columns = Array.isArray(row.columns) && row.columns.length
    ? row.columns.join(", ")
    : "table scope";
  const parent = row.parent_table ? ` -> ${row.parent_table}` : "";
  const expected = row.expected_bad_count === undefined
    ? ""
    : ` · expected ${integerText(row.expected_bad_count)} bad rows`;
  return `${row.table || "dataset"}.${columns}${parent}${expected}`;
}

function renderStatus() {
  const mapped = mappedTables().length;
  const missing = Math.max(state.tables.length - mapped, 0);
  const extra = extraCsvs().length;
  const preflightReview = buildPreflightReview();
  els.dbmlStatus.textContent = sourceStageStatusText();
  els.csvStatus.textContent = sourceInventoryText();
  els.preflightStatus.textContent = compactPreflightStatusText(preflightReview);
  els.mappingStatus.textContent = state.tables.length
    ? `${mapped}/${state.tables.length} tables mapped, ${missing} missing, ${extra} extra`
    : "Run auto-link after upload";
  els.runnerStatus.textContent = runnerStatusText(preflightReview);
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

function renderSourceState() {
  const uploadedCsvs = state.csvFiles.filter((file) => file.sourceFile);
  const preset = runnerUiDemoPresets.has(state.selectedDemoPreset)
    ? demoPresets[state.selectedDemoPreset]
    : null;
  const dbmlLabel = sourceDbmlDisplayName();
  const csvLabel = state.csvFiles.length
    ? `${integerText(state.csvFiles.length)} file${state.csvFiles.length === 1 ? "" : "s"}`
    : els.csvDirPathInput.value.trim()
      ? "CSV source selected"
      : "0 files";
  let badge = "No upload";
  let status = "";
  let summary = "Choose sample data or add one DBML contract with related CSV files.";
  if (state.runnerMode === "path") {
    badge = preset ? "Sample data" : "Selected files";
    status = "ready";
    summary = preset
      ? `${preset.label} DBML + CSV demo is loaded for the local runner.`
      : "Local runner will read the selected DBML and CSV source.";
  } else if (state.dbmlFile || uploadedCsvs.length) {
    badge = "Custom upload";
    status = state.dbmlFile && uploadedCsvs.length ? "ready" : "warnings_pending";
    summary = uploadedCsvs.length
      ? "Browser upload source is active. New CSV selections replace the previous inventory."
      : "Custom DBML is active. Add matching CSV files before running.";
  }

  els.sourceStateBadge.textContent = badge;
  els.sourceStateBadge.dataset.status = status;
  els.sourceStateSummary.textContent = summary;
  els.sourceStateDetails.innerHTML = `
    <div><span>DBML</span><strong>${escapeHtml(dbmlLabel)}</strong></div>
    <div><span>CSV</span><strong>${escapeHtml(csvLabel)}</strong></div>
  `;
  els.clearUploadButton.disabled = !(state.dbmlFile || uploadedCsvs.length || state.dbmlText || state.csvFiles.length);
}

function runnerStatusText(preflightReview = buildPreflightReview()) {
  if (!state.runnerAvailable) {
    return "Offline";
  }
  if (state.currentJob?.status) {
    return titleCaseStatus(state.currentJob.status);
  }
  if (!preflightReview.runAllowed) {
    return "Locked";
  }
  return "Ready";
}

function sourceStageStatusText() {
  if (profileSourceReady()) {
    return "Source ready";
  }
  if (state.dbmlText || state.csvFiles.length) {
    return "Source incomplete";
  }
  return "Add source";
}

function titleCaseStatus(status) {
  return String(status || "ready")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sourceInventoryText() {
  return state.csvFiles.length
    ? `${state.csvFiles.length} CSV files loaded`
    : "No CSV files selected";
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
    const method = mappingMethodForTable(table, csvFile);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${statusPill(method)}</td>
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
        state.manualMappings.add(tableName);
      } else {
        state.mapping.delete(tableName);
        state.manualMappings.delete(tableName);
      }
      renderAll();
    });
  });
}

function csvSelect(tableName, selectedStem) {
  const selectedFile = state.csvFiles.find((file) => file.stem === selectedStem);
  const options = [`<option value="">Select CSV...</option>`].concat(
    state.csvFiles.map((file) => {
      const selected = file.stem === selectedStem ? "selected" : "";
      return `<option value="${escapeHtml(file.stem)}" ${selected}>${escapeHtml(file.name)}</option>`;
    }),
  );
  const selectedName = selectedFile?.name || "No CSV selected";
  return `
    <div class="csv-file-cell">
      <select class="mapping-select" data-table="${escapeHtml(tableName)}" aria-label="CSV for ${escapeHtml(tableName)}" title="${escapeHtml(selectedName)}">${options.join("")}</select>
    </div>
  `;
}

function statusPill(status) {
  const label = {
    mapped: "mapped",
    exact: "exact",
    manual: "manual",
    inferred: "inferred",
    ambiguous: "ambiguous",
    missing: "missing CSV",
    missing_csv: "missing CSV",
    extra: "extra CSV",
  }[status] || status;
  return `<span class="pill-status ${status}">${label}</span>`;
}

function mappingMethodForTable(table, csvFile) {
  if (!csvFile) {
    return "missing";
  }
  if (state.manualMappings.has(table.name)) {
    return "manual";
  }
  if (csvFile.stem === table.name) {
    return "exact";
  }
  return "mapped";
}

function foreignKeySummary(table) {
  const fks = table.columns.filter((column) => column.fk);
  if (!fks.length) {
    return `<span class="muted">none</span>`;
  }
  const rows = fks
    .map((column) => `
      <span class="fk-row">
        <code class="fk-column">${escapeHtml(column.name)}</code>
        <span class="fk-arrow" aria-label="references">-></span>
        <span class="fk-target">
          <code>${escapeHtml(column.fk.parentTable)}</code><span>.</span><code>${escapeHtml(column.fk.parentColumn)}</code>
        </span>
      </span>
    `)
    .join("");
  return `<div class="fk-list" aria-label="Foreign key references for ${escapeHtml(table.name)}">${rows}</div>`;
}

function headerMatch(table, csvFile) {
  const csvColumns = new Set(csvFile.columns);
  const matched = table.columns.filter((column) => csvColumns.has(column.name)).length;
  const total = table.columns.length || 1;
  return { matched, total, ratio: matched / total };
}

function mappingOverridesForRun() {
  const overrides = {};
  state.manualMappings.forEach((tableName) => {
    const csvStem = state.mapping.get(tableName);
    const csvFile = state.csvFiles.find((file) => file.stem === csvStem);
    if (csvFile) {
      overrides[tableName] = csvFile.name;
    }
  });
  return overrides;
}

function buildPreflightReview() {
  const blockers = [];
  const warnings = [];
  const mode = state.runnerMode;

  const hasRunDbml = mode === "upload"
    ? Boolean(state.dbmlFile)
    : Boolean(els.dbmlPathInput.value.trim());
  const hasCsvSource = mode === "upload"
    ? state.csvFiles.some((file) => file.sourceFile)
    : Boolean(els.csvDirPathInput.value.trim());

  if (!hasRunDbml) {
    blockers.push(preflightItem(
      "missing_dbml",
      mode === "upload" ? "Uploaded DBML is missing." : "Selected DBML source is missing.",
      "Connect a DBML schema before running the profiler.",
    ));
  }
  if (state.dbmlParseError) {
    blockers.push(preflightItem(
      "dbml_parse_failure",
      "DBML parse failed.",
      state.dbmlParseError,
    ));
  }
  if (!hasCsvSource) {
    blockers.push(preflightItem(
      "no_csv_source",
      mode === "upload" ? "Uploaded CSV source is missing." : "Selected CSV source is missing.",
      "Connect at least one CSV source before running the profiler.",
    ));
  }
  state.csvReadErrors.forEach((error) => {
    blockers.push(preflightItem(
      `unreadable_source:${error.name}`,
      `CSV source could not be read: ${error.name}`,
      error.message,
    ));
  });

  const hasReviewableInputs = Boolean(state.tables.length && hasCsvSource && !state.dbmlParseError);
  const mappedCount = mappedTables().length;
  if (hasReviewableInputs && mappedCount === 0) {
    blockers.push(preflightItem(
      "zero_mapped_tables",
      "No DBML tables are mapped to CSV files.",
      "Map at least one table before running the profiler.",
    ));
  }

  conflictingMappingGroups().forEach((conflict) => {
    blockers.push(preflightItem(
      `conflicting_mapping:${conflict.csvStem}`,
      `Conflicting mapping for ${conflict.csvName}.`,
      `${conflict.tables.join(", ")} are mapped to the same CSV source.`,
    ));
  });

  if (!hasReviewableInputs) {
    return finalizePreflightReview(mode, blockers, warnings);
  }

  state.tables.forEach((table) => {
    const csvStem = state.mapping.get(table.name);
    const csvFile = state.csvFiles.find((file) => file.stem === csvStem);
    if (!csvFile) {
      warnings.push(preflightItem(
        `missing_table_csv:${table.name}`,
        `Missing CSV for table ${table.name}.`,
        "This table will not have a declared CSV match unless you map it manually.",
      ));
      const candidates = ambiguousCsvCandidates(table);
      if (candidates.length) {
        warnings.push(preflightItem(
          `ambiguous_mapping:${table.name}`,
          `Ambiguous CSV candidates for ${table.name}.`,
          `Possible matches: ${candidates.map((file) => file.name).join(", ")}.`,
        ));
      }
      return;
    }

    const columnDiff = csvColumnDiff(table, csvFile);
    if (columnDiff.missing.length) {
      warnings.push(preflightItem(
        `missing_columns:${table.name}`,
        `Missing DBML columns in ${csvFile.name}.`,
        columnDiff.missing.join(", "),
      ));
    }
    if (columnDiff.extra.length) {
      warnings.push(preflightItem(
        `extra_columns:${table.name}`,
        `Extra CSV columns in ${csvFile.name}.`,
        columnDiff.extra.join(", "),
      ));
    }
    if (state.manualMappings.has(table.name)) {
      warnings.push(preflightItem(
        `manual_mapping:${table.name}`,
        `Manual mapping selected for ${table.name}.`,
        `${table.name} will run against ${csvFile.name}.`,
      ));
    }
  });

  extraCsvs().forEach((file) => {
    warnings.push(preflightItem(
      `extra_csv:${file.stem}`,
      `Extra CSV not declared in DBML: ${file.name}.`,
      "This file is available in the connected source but is not mapped to a DBML table.",
    ));
  });

  return finalizePreflightReview(mode, blockers, warnings);
}

function preflightItem(id, title, detail) {
  return { id, title, detail };
}

function finalizePreflightReview(mode, blockers, warnings) {
  const reviewWarnings = warnings.map((warning) => ({
    ...warning,
    accepted: state.preflightAcceptedWarnings.has(warning.id),
  }));
  const acceptedWarningIds = reviewWarnings
    .filter((warning) => warning.accepted)
    .map((warning) => warning.id);
  const unreviewedWarningCount = reviewWarnings.filter((warning) => !warning.accepted).length;
  const status = blockers.length
    ? "blocked"
    : unreviewedWarningCount
      ? "warnings_pending"
      : "ready";
  return {
    mode,
    status,
    blockers,
    warnings: reviewWarnings,
    acceptedWarningIds,
    unreviewedWarningCount,
    runAllowed: status === "ready",
  };
}

function conflictingMappingGroups() {
  const groups = new Map();
  state.mapping.forEach((csvStem, tableName) => {
    if (!csvStem) {
      return;
    }
    const current = groups.get(csvStem) || [];
    current.push(tableName);
    groups.set(csvStem, current);
  });
  return [...groups.entries()]
    .filter(([, tables]) => tables.length > 1)
    .map(([csvStem, tables]) => {
      const csvFile = state.csvFiles.find((file) => file.stem === csvStem);
      return {
        csvStem,
        csvName: csvFile?.name || csvStem,
        tables,
      };
    });
}

function csvColumnDiff(table, csvFile) {
  const tableColumns = new Set(table.columns.map((column) => column.name));
  const csvColumns = new Set(csvFile.columns);
  return {
    missing: table.columns
      .map((column) => column.name)
      .filter((columnName) => !csvColumns.has(columnName)),
    extra: csvFile.columns.filter((columnName) => !tableColumns.has(columnName)),
  };
}

function ambiguousCsvCandidates(table) {
  const candidates = state.csvFiles
    .map((file) => ({ file, header: headerMatch(table, file) }))
    .filter(({ header }) => header.matched > 0 && header.ratio >= 0.5)
    .sort((left, right) => right.header.ratio - left.header.ratio);
  if (candidates.length < 2 || candidates[0].header.ratio !== candidates[1].header.ratio) {
    return [];
  }
  return candidates
    .filter((candidate) => candidate.header.ratio === candidates[0].header.ratio)
    .map((candidate) => candidate.file);
}

function renderPreflightReview() {
  const review = buildPreflightReview();
  pruneAcceptedPreflightWarnings(review);
  els.preflightGateBadge.textContent = preflightBadgeText(review);
  els.preflightGateBadge.dataset.status = review.status;
  els.preflightRunSummary.textContent = preflightGateMessage(review);
  els.preflightRunSummary.dataset.status = review.status === "ready" ? "success" : "error";
  els.preflightBlockerCount.textContent = countLabel(review.blockers.length, "blocker");
  els.preflightWarningCount.textContent = countLabel(review.warnings.length, "warning");
  renderPreflightList(els.preflightBlockerList, review.blockers, "blocker");
  renderPreflightList(els.preflightWarningList, review.warnings, "warning", review);
}

function renderPreflightList(container, items, kind, review = null) {
  container.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = kind === "blocker"
      ? "No blockers detected."
      : "No warnings require review.";
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    const accepted = kind === "warning" && item.accepted;
    row.className = `preflight-item ${kind}${accepted ? " accepted" : ""}`;
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.detail)}</p>
      </div>
      ${kind === "warning" ? warningReviewButton(item) : ""}
    `;
    container.appendChild(row);
  });

  if (kind === "warning" && review && review.unreviewedWarningCount > 1) {
    const actionRow = document.createElement("div");
    actionRow.className = "preflight-action-row";
    actionRow.innerHTML = `<button class="button secondary" type="button" data-preflight-accept-all>Accept all reviewable warnings</button>`;
    container.appendChild(actionRow);
  }
}

function warningReviewButton(item) {
  if (item.accepted) {
    return `<button class="button secondary preflight-accept-button" type="button" disabled>Accepted</button>`;
  }
  return `<button class="button secondary preflight-accept-button" type="button" data-preflight-warning-id="${escapeHtml(item.id)}">Accept warning</button>`;
}

function pruneAcceptedPreflightWarnings(review) {
  const currentWarningIds = new Set(review.warnings.map((warning) => warning.id));
  [...state.preflightAcceptedWarnings].forEach((warningId) => {
    if (!currentWarningIds.has(warningId)) {
      state.preflightAcceptedWarnings.delete(warningId);
    }
  });
}

function preflightStatusText(review) {
  if (review.blockers.length) {
    return `${countLabel(review.blockers.length, "blocker")} must be resolved`;
  }
  if (review.unreviewedWarningCount) {
    return `${countLabel(review.unreviewedWarningCount, "warning")} requires acceptance`;
  }
  if (review.warnings.length) {
    return `${countLabel(review.warnings.length, "warning")} accepted`;
  }
  return "Preflight clean";
}

function compactPreflightStatusText(review) {
  if (review.blockers.length) {
    return countLabel(review.blockers.length, "blocker");
  }
  if (review.unreviewedWarningCount) {
    return countLabel(review.unreviewedWarningCount, "warning");
  }
  return "Ready";
}

function preflightBadgeText(review) {
  if (review.status === "blocked") {
    return "Run locked";
  }
  if (review.status === "warnings_pending") {
    return "Review warnings";
  }
  return "Run enabled";
}

function preflightGateMessage(review) {
  if (review.blockers.length) {
    return `Run locked until ${countLabel(review.blockers.length, "blocker")} are resolved.`;
  }
  if (review.unreviewedWarningCount) {
    return `Review and accept ${countLabel(review.unreviewedWarningCount, "warning")} before running.`;
  }
  if (review.warnings.length) {
    return "All preflight warnings have been accepted. The run is enabled.";
  }
  return "Preflight is clean. The run is enabled.";
}

function countLabel(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function buildPreflightReviewPayload(review = buildPreflightReview()) {
  return {
    status: review.status,
    mode: review.mode,
    generated_at: new Date().toISOString(),
    blockers: review.blockers,
    warnings: review.warnings,
    accepted_warning_ids: review.acceptedWarningIds,
    inputs: {
      dbml_name: state.dbmlName || null,
      csv_files: state.csvFiles.map((file) => file.name),
      mapping_overrides: mappingOverridesForRun(),
    },
  };
}

function resetPreflightReview() {
  state.preflightAcceptedWarnings.clear();
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
  const evaluationRunning = evaluationJobRunning();
  const preflightReview = buildPreflightReview();
  const preflightAllowsRun = preflightReview.runAllowed;
  const runStepActive = state.flowMode === "profile" && state.profileStep === "run";
  els.visualizeButton.disabled = !hasDbml;
  els.autoLinkButton.disabled = !hasDbml || !state.csvFiles.length;
  els.runProfilerButton.disabled = !runStepActive || !state.runnerAvailable || !hasUploadedDbml || !hasUploadedCsvs || !preflightAllowsRun || jobRunning;
  els.runPathProfilerButton.disabled = !runStepActive || !state.runnerAvailable || !hasPathInputs || !preflightAllowsRun || jobRunning;
  els.startEvaluationButton.disabled = !state.runnerAvailable || !selectedEvaluationDataset() || evaluationRunning;
  els.runnerModeUpload.classList.toggle("active", state.runnerMode === "upload");
  els.runnerModePath.classList.toggle("active", state.runnerMode === "path");
  els.runnerModeUpload.setAttribute("aria-selected", state.runnerMode === "upload" ? "true" : "false");
  els.runnerModePath.setAttribute("aria-selected", state.runnerMode === "path" ? "true" : "false");
  els.runnerForm.hidden = state.runnerMode !== "upload";
  els.pathRunnerForm.hidden = state.runnerMode !== "path";
  renderRunSourcePreview(preflightReview);
  renderLlmModeControls();
}

function renderRunSourcePreview(preflightReview = buildPreflightReview()) {
  const csvNames = state.csvFiles
    .map((file) => file.name)
    .filter(Boolean);
  const csvCount = csvNames.length;
  const sourceReady = profileSourceReady();
  els.runSourceMode.textContent = sourceReady
    ? preflightReview.runAllowed ? "Ready to run" : "Review warnings"
    : "Waiting for files";
  els.runSourceMode.dataset.status = sourceReady ? "ready" : "";
  els.runSourceDbml.textContent = sourceDbmlDisplayName();
  els.runSourceCsvCount.textContent = csvCount
    ? `${integerText(csvCount)} CSV file${csvCount === 1 ? "" : "s"}`
    : els.csvDirPathInput.value.trim()
      ? "CSV source selected"
      : "0 CSV files";
  els.runSourceCsvList.innerHTML = csvNames.length
    ? csvNames.map((name) => `<li title="${escapeHtml(name)}">${escapeHtml(name)}</li>`).join("")
    : '<li class="muted">No CSV files selected</li>';
}

function sourceDbmlDisplayName() {
  return state.dbmlName || state.dbmlFile?.name || pathBasename(els.dbmlPathInput.value) || "Not selected";
}

function pathBasename(path) {
  return String(path || "")
    .split(/[\\/]/)
    .filter(Boolean)
    .pop() || "";
}

function renderLlmModeControls() {
  const enabled = state.llmMode === "openai";
  els.llmModeStatus.textContent = enabled ? "On" : "Off";
  els.llmModeToggle.classList.toggle("active", enabled);
  els.llmModeToggle.setAttribute("aria-checked", enabled ? "true" : "false");
  els.llmModeToggle.setAttribute(
    "aria-label",
    enabled ? "Disable LLM report enrichment" : "Enable LLM report enrichment",
  );
}

function renderRunner() {
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
      const eventDetails = event.details || {};
      const current = stageMap.get(event.stage) || {
        name: event.stage,
        displayName: eventDetails.display_name || event.stage,
        status: event.status || "running",
        duration: event.duration_seconds,
        details: {},
        skipReason: "",
      };
      current.details = { ...(current.details || {}), ...eventDetails };
      if (eventDetails.display_name) {
        current.displayName = eventDetails.display_name;
      }
      if (event.event_type === "stage_started") {
        current.status = "running";
      }
      if (["stage_finished", "stage_failed"].includes(event.event_type)) {
        current.status = event.status || current.status;
        current.duration = event.duration_seconds;
        current.skipReason = eventDetails.skip_reason || current.skipReason || "";
      }
      stageMap.set(event.stage, current);
    });

  if (job?.summary?.stage_timings?.length) {
    job.summary.stage_timings.forEach((stage) => {
      const stageDetails = stage.details || {};
      stageMap.set(stage.name, {
        name: stage.name,
        displayName: stage.display_name,
        status: stage.status,
        duration: stage.duration_seconds,
        details: stageDetails,
        skipReason: stage.skip_reason || stageDetails.skip_reason || "",
      });
    });
  }

  insertInferredRuntimeStages(stageMap, job);
  els.stageList.innerHTML = "";
  const visibleStages = visibleRuntimeStages([...stageMap.values()]);
  if (!visibleStages.length) {
    els.stageList.innerHTML = `<p class="muted">Run events from <code>run_events.jsonl</code> will appear here.</p>`;
    return;
  }
  visibleStages.forEach((stage) => {
    els.stageList.insertAdjacentHTML("beforeend", renderRuntimeStage(stage));
  });
}

function insertInferredRuntimeStages(stageMap, job) {
  if (!job || !["queued", "running"].includes(job.status)) {
    return;
  }
  if (!job.llm?.enabled || stageMap.has("llm_narrative")) {
    return;
  }
  const machineArtifactsStage = stageMap.get("write_machine_artifacts");
  if (machineArtifactsStage?.status !== "completed") {
    return;
  }
  const provider = job.llm.provider || state.llmMode || "openai";
  stageMap.set("llm_narrative", {
    name: "llm_narrative",
    displayName: "Generate optional LLM summary artifact",
    status: "running",
    duration: null,
    details: {
      selected_provider: provider,
      external_api_call: provider === "openai" ? "starting" : "no",
      wait_reason: "Waiting for provider response and guardrail validation.",
    },
    skipReason: "",
  });
}

function renderRuntimeStage(stage) {
  const status = stage.status || "running";
  const purpose = stagePurpose(stage);
  const duration = stage.duration === null || stage.duration === undefined
    ? ""
    : ` · ${Number(stage.duration).toFixed(3)}s`;
  return `
    <details class="stage-item runtime-stage-item ${escapeHtml(status)}">
      <summary class="stage-summary">
        <span class="stage-dot" aria-hidden="true"></span>
        <span class="stage-main">
          <strong>${escapeHtml(stage.displayName || stage.name)}</strong>
          <span><code>${escapeHtml(stage.name || "stage")}</code>${duration}</span>
        </span>
        <span class="stage-info" aria-label="${escapeHtml(purpose)}">
          <span class="stage-info-icon" aria-hidden="true">i</span>
          <span class="stage-info-tooltip" role="tooltip">${escapeHtml(purpose)}</span>
        </span>
        <span class="pill-status ${runtimeStageStatusClass(status)}">${escapeHtml(status)}</span>
        <span class="stage-expand-label">Details</span>
      </summary>
      ${renderRuntimeStageDropdown(stage, purpose)}
    </details>
  `;
}

function runtimeStageStatusClass(status) {
  if (status === "failed") {
    return "failed";
  }
  if (status === "skipped") {
    return "skipped";
  }
  if (status === "running" || status === "queued") {
    return "running";
  }
  return "mapped";
}

function renderRuntimeStageDropdown(stage, purpose) {
  const detailRows = runtimeStageDetailRows(stage, purpose);
  return `
    <div class="stage-dropdown">
      <dl class="stage-detail-grid">
        ${detailRows.map(([label, value]) => `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${stageDetailValueHtml(value)}</dd>
          </div>
        `).join("")}
      </dl>
    </div>
  `;
}

function ensureRuntimeStageDetailVisible(stageElement) {
  window.requestAnimationFrame(() => {
    if (!stageElement.open) {
      return;
    }
    const container = els.stageList;
    const dropdown = stageElement.querySelector(".stage-dropdown");
    if (!container || !dropdown) {
      return;
    }
    const padding = 8;
    const containerRect = container.getBoundingClientRect();
    const stageRect = stageElement.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    let nextScrollTop = container.scrollTop;

    if (dropdownRect.bottom > containerRect.bottom - padding) {
      nextScrollTop += dropdownRect.bottom - (containerRect.bottom - padding);
    }
    if (stageRect.top < containerRect.top + padding) {
      nextScrollTop -= (containerRect.top + padding) - stageRect.top;
    }

    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const boundedScrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop));
    if (Math.abs(boundedScrollTop - container.scrollTop) > 1) {
      container.scrollTop = boundedScrollTop;
    }
  });
}

function runtimeStageDetailRows(stage, purpose) {
  const rows = [
    ["What this step does", purpose],
    ["Stage id", stage.name || "stage"],
    ["Status", stage.status || "running"],
  ];
  if (stage.duration !== null && stage.duration !== undefined) {
    rows.push(["Duration", `${Number(stage.duration).toFixed(3)}s`]);
  }
  if (stage.skipReason) {
    rows.push(["Skip reason", stage.skipReason]);
  }
  if (stage.error_type || stage.error_message) {
    rows.push(["Error", [stage.error_type, stage.error_message].filter(Boolean).join(": ")]);
  }
  Object.entries(stage.details || {})
    .filter(([key, value]) => key !== "display_name" && value !== null && value !== undefined && value !== "")
    .forEach(([key, value]) => {
      rows.push([key, value]);
    });
  return rows;
}

function stagePurpose(stage) {
  return runtimeStageDescriptions[stage.name] || "Runs this profiler step and records runtime evidence in run_events.jsonl and run_summary.json.";
}

function stageDetailValueHtml(value) {
  if (Array.isArray(value)) {
    if (!value.length) {
      return `<span class="muted">none</span>`;
    }
    return `<ul>${value.map((item) => `<li>${escapeHtml(stageDetailValueText(item))}</li>`).join("")}</ul>`;
  }
  if (value && typeof value === "object") {
    return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
  }
  if (typeof value === "boolean") {
    return `<code>${value ? "true" : "false"}</code>`;
  }
  if (typeof value === "number") {
    return `<code>${scoreOrIntegerText(value)}</code>`;
  }
  return `<span>${escapeHtml(stageDetailValueText(value))}</span>`;
}

function stageDetailValueText(value) {
  if (value === null || value === undefined || value === "") {
    return "none";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function renderArtifacts(artifacts) {
  els.artifactList.innerHTML = "";
  if (!artifacts.length) {
    els.artifactList.innerHTML = `<p class="muted">Issue review previews load from generated run artifacts.</p>`;
    return;
  }
  els.artifactList.innerHTML = renderGeneratedResults(artifacts);
}

function renderGeneratedResults(artifacts) {
  return `
    <div class="generated-results">
      ${renderGeneratedResultPreviews(artifacts)}
    </div>
  `;
}

function renderRunHistory() {
  const runs = state.runHistory;
  els.runHistoryCount.textContent = `${integerText(runs.length)} run${runs.length === 1 ? "" : "s"}`;
  els.runHistoryStatus.textContent = state.runHistoryLoading
    ? "Loading"
    : state.runHistoryError
      ? "Unavailable"
      : runs.length
        ? "History ready"
        : "No runs";

  if (state.runHistoryLoading && !runs.length) {
    els.runHistoryList.innerHTML = `<p class="muted">Scanning <code>outputs/web_runs</code> for prior runs...</p>`;
  } else if (state.runHistoryError) {
    els.runHistoryList.innerHTML = `<p class="muted">${escapeHtml(state.runHistoryError)}</p>`;
  } else if (!runs.length) {
    els.runHistoryList.innerHTML = `<p class="muted">No persisted runs found in <code>outputs/web_runs</code>. Completed local runs will appear here after the backend writes artifacts.</p>`;
  } else {
    els.runHistoryList.innerHTML = runs.map(renderRunHistoryItem).join("");
  }

  renderSelectedRunTimeline();
}

function renderRunHistoryItem(run) {
  const selected = run.job_id === state.selectedHistoryJobId;
  const gateSummary = run.quality_gate_summary || {};
  const stages = visibleRuntimeStages(run.stages);
  const stageCount = stages.length || run.stage_count || 0;
  const failedStageCount = stages.length
    ? stages.filter((stage) => stage.status === "failed").length
    : run.failed_stage_count || 0;
  const finished = run.finished_at ? `finished ${formatRunTimestamp(run.finished_at)}` : "finish time unavailable";
  const created = run.created_at ? `created ${formatRunTimestamp(run.created_at)}` : "created time unavailable";
  return `
    <button class="run-history-item ${selected ? "selected" : ""}" type="button" data-run-history-job-id="${escapeHtml(run.job_id)}" aria-pressed="${selected ? "true" : "false"}">
      <span class="run-history-main">
        <strong>${escapeHtml(run.name || run.job_id)}</strong>
        <span class="pill-status ${run.status === "failed" ? "missing" : "mapped"}">${escapeHtml(run.status || "unknown")}</span>
      </span>
      <span class="run-history-meta">
        <span>${escapeHtml(run.source_mode || run.input_mode || "unknown source")}</span>
        <span>${escapeHtml(created)}</span>
        <span>${escapeHtml(finished)}</span>
      </span>
      <span class="run-history-metrics">
        <span>${integerText(run.issue_count || 0)} issues</span>
        <span>${escapeHtml(gateSummaryText(gateSummary))}</span>
        <span>${integerText(stageCount)} stages</span>
        <span>${integerText(failedStageCount)} failed</span>
      </span>
    </button>
  `;
}

function renderSelectedRunTimeline() {
  const run = selectedRunHistoryEntry();
  if (!run) {
    els.selectedRunTimelineStatus.textContent = "No selection";
    els.selectedRunTimeline.innerHTML = `<p class="muted">Select a run to inspect stage status, duration, and failure or skip details.</p>`;
    return;
  }
  const stages = visibleRuntimeStages(run.stages);
  const failedStageCount = stages.filter((stage) => stage.status === "failed").length;
  els.selectedRunTimelineStatus.textContent = `${integerText(stages.length)} stages · ${integerText(failedStageCount)} failed`;
  if (!stages.length) {
    els.selectedRunTimeline.innerHTML = `<p class="muted">No stage timeline was found for this run. Older folders without <code>run_summary.json</code> or <code>run_events.jsonl</code> remain selectable for available artifacts.</p>`;
    return;
  }
  els.selectedRunTimeline.innerHTML = `
    <div class="selected-run-summary">
      <div><span>run</span><strong>${escapeHtml(run.name || run.job_id)}</strong></div>
      <div><span>status</span><strong>${escapeHtml(run.status || "unknown")}</strong></div>
      <div><span>issues</span><strong>${integerText(run.issue_count || 0)}</strong></div>
      <div><span>gates</span><strong>${escapeHtml(gateSummaryText(run.quality_gate_summary || {}))}</strong></div>
    </div>
    <div class="selected-run-stage-list">
      ${stages.map(renderSelectedRunStage).join("")}
    </div>
  `;
}

function renderSelectedRunStage(stage) {
  const status = stage.status || "unknown";
  const duration = stage.duration_seconds === null || stage.duration_seconds === undefined
    ? ""
    : ` · ${Number(stage.duration_seconds).toFixed(3)}s`;
  const error = stage.error_message
    ? `<p class="stage-detail-error">${escapeHtml(stage.error_type ? `${stage.error_type}: ${stage.error_message}` : stage.error_message)}</p>`
    : "";
  const skipReason = stage.skip_reason
    ? `<p class="stage-detail-skip">${escapeHtml(stage.skip_reason)}</p>`
    : "";
  const detailText = stageDetailText(stage.details);
  return `
    <article class="selected-run-stage stage-item ${escapeHtml(status)}">
      <span class="stage-dot" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(stage.display_name || stage.name)}</strong>
        <p><code>${escapeHtml(stage.name || "stage")}</code>${duration}</p>
        ${error}
        ${skipReason}
        ${detailText ? `<p class="stage-detail-muted">${escapeHtml(detailText)}</p>` : ""}
      </div>
      <span class="pill-status ${status === "failed" ? "missing" : "mapped"}">${escapeHtml(status)}</span>
    </article>
  `;
}

function visibleRuntimeStages(stages) {
  return (Array.isArray(stages) ? stages : []).filter((stage) => !isHiddenCompatibilityStage(stage));
}

function isHiddenCompatibilityStage(stage) {
  if (!stage || stage.name !== "influence_analysis") {
    return false;
  }
  const details = stage.details || {};
  const skipReason = String(stage.skipReason || stage.skip_reason || details.skip_reason || "");
  return stage.status === "skipped" && /no target column was provided/i.test(skipReason);
}

function selectedRunHistoryEntry() {
  return state.runHistory.find((run) => run.job_id === state.selectedHistoryJobId) || null;
}

function gateSummaryText(summary) {
  if (!summary.available) {
    return "gates unavailable";
  }
  const blocked = Number(summary.blocked_count || 0);
  const needsReview = Number(summary.needs_review_count || 0);
  const gateCount = Number(summary.gate_count || 0);
  const reviewSuffix = needsReview ? `, ${integerText(needsReview)} review` : "";
  return `${integerText(blocked)} blocked${reviewSuffix} / ${integerText(gateCount)} gates`;
}

function stageDetailText(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return "";
  }
  const entries = Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 3);
  return entries.map(([key, value]) => `${key}: ${typeof value === "number" ? scoreOrIntegerText(value) : String(value)}`).join(" · ");
}

function formatRunTimestamp(value) {
  if (!value) {
    return "time unavailable";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderGeneratedResultPreviews(artifacts) {
  if (state.dashboardLoadingJobId && !state.dashboardArtifactIndex) {
    return `
      <div class="generated-result-grid">
        <article class="generated-result-card">
          <div class="generated-result-heading">
            <strong>Loading issue review snapshot</strong>
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
      ${renderGeneratedColumnUsabilityPreview(artifacts)}
      ${renderGeneratedTableImpactPreview(artifacts)}
      ${renderGeneratedL4Preview(artifacts)}
      ${renderGeneratedIssueLlmPreview(artifacts)}
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
  return generatedResultCard("Data-quality readiness", "dataset_verdict.json", body, artifacts);
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

function renderGeneratedColumnUsabilityPreview(artifacts) {
  const profile = state.dashboardArtifacts["profile_summary.json"] || {};
  const tables = profile.tables || {};
  const issues = getDashboardIssues();
  const issueSeverityByField = new Map();
  issues.forEach((issue) => {
    const table = issue.table || "";
    const columns = Array.isArray(issue.columns) && issue.columns.length ? issue.columns : [""];
    columns.forEach((column) => {
      const key = column ? `${table}.${column}` : table;
      const current = issueSeverityByField.get(key);
      if (!current || severityRank(issue.severity) < severityRank(current)) {
        issueSeverityByField.set(key, issue.severity || "");
      }
    });
  });

  let ready = 0;
  let needsPreparation = 0;
  let blocked = 0;
  Object.entries(tables).forEach(([tableName, table]) => {
    Object.entries(table.columns || {}).forEach(([columnName, column]) => {
      const severity = issueSeverityByField.get(`${tableName}.${columnName}`) || "";
      const outliers = column.outliers || {};
      const hasReviewSignal = Number(column.null_rate || 0) > 0 ||
        Number(column.invalid_cast_count || 0) > 0 ||
        Number(outliers.outlier_count || 0) > 0;
      if (severity === "P0" || severity === "P1") {
        blocked += 1;
      } else if (severity === "P2" || severity === "P3" || hasReviewSignal) {
        needsPreparation += 1;
      } else {
        ready += 1;
      }
    });
  });

  const total = ready + needsPreparation + blocked;
  const body = total
    ? `
      <div class="generated-result-kpi">
        <strong>${integerText(blocked)}</strong>
        <span>blocked columns</span>
      </div>
      <p>${integerText(needsPreparation)} need preparation · ${integerText(ready)} ready</p>
    `
    : `<p class="muted">Waiting for <code>profile_summary.json</code> and <code>issues.json</code>.</p>`;
  return generatedResultCard("Column usability", "profile_summary.json", body, artifacts);
}

function renderGeneratedTableImpactPreview(artifacts) {
  const assessmentArtifact = state.dashboardArtifacts["table_assessments.json"] || {};
  const assessments = getDashboardTableAssessments();
  const summary = assessmentArtifact.summary || {};
  const tableCount = summary.table_count ?? assessments.length;
  const averageHealth = summary.average_health_score;
  const notReady = summary.readiness_counts?.NOT_READY ?? assessments.filter((row) => row.readiness === "NOT_READY").length;
  const topTables = assessments
    .slice()
    .sort((a, b) => (
      readinessOrder(a.readiness) - readinessOrder(b.readiness) ||
      Number(a.health_score || 0) - Number(b.health_score || 0) ||
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
      <p>${integerText(notReady)} not ready · ${averageHealth === undefined ? "--" : integerText(averageHealth)} avg health</p>
      ${topTables ? `<div class="generated-mini-list">${topTables}</div>` : ""}
    `
    : `<p class="muted">Waiting for <code>table_assessments.json</code>.</p>`;
  return generatedResultCard("Table readiness", "table_assessments.json", body, artifacts);
}

function renderGeneratedL4Preview(artifacts) {
  const narrativeUrl = artifactUrlFromArtifacts("l4_report.md", artifacts);
  const guardrailUrl = artifactUrlFromArtifacts("guardrail_report.json", artifacts);
  const guardrail = getL4Guardrail();
  if (!narrativeUrl && !guardrailUrl && !Object.keys(guardrail).length) {
    return "";
  }
  const status = guardrail.status || "not loaded";
  const provider = guardrail.provider || "unknown";
  const model = guardrail.model || guardrail.model_config?.model || "";
  const checkedNumbers = Array.isArray(guardrail.checked_numbers) ? guardrail.checked_numbers.length : 0;
  const checkedRefs = Array.isArray(guardrail.checked_refs) ? guardrail.checked_refs.length : 0;
  const violationCount = Array.isArray(guardrail.violations) ? guardrail.violations.length : 0;
  const fallback = guardrail.fallback_reason || "";
  const body = `
    <div class="generated-result-kpi">
      <strong>${escapeHtml(status)}</strong>
      <span>${escapeHtml(provider)}${model ? ` · ${escapeHtml(model)}` : ""}</span>
    </div>
    <p>${integerText(checkedNumbers)} numbers · ${integerText(checkedRefs)} refs · ${integerText(violationCount)} violations${fallback ? ` · ${escapeHtml(fallback)}` : ""}</p>
  `;
  return generatedResultCard("Optional LLM guardrail", "guardrail_report.json", body, artifacts);
}

function renderGeneratedIssueLlmPreview(artifacts) {
  const artifactUrl = artifactUrlFromArtifacts("issue_llm_enrichments.json", artifacts);
  const artifact = getIssueLlmArtifact();
  if (!artifactUrl && !artifact) {
    return "";
  }
  const summary = artifact?.summary || {};
  const statusCounts = summary.status_counts || {};
  const statusText = Object.entries(statusCounts)
    .map(([status, count]) => `${escapeHtml(status)}=${integerText(count)}`)
    .join(" · ");
  const body = `
    <div class="generated-result-kpi">
      <strong>${integerText(summary.enrichment_count || 0)}</strong>
      <span>${integerText(summary.human_review_required_count || 0)} human review</span>
    </div>
    <p>${statusText || "Issue-level add-on evidence"}</p>
  `;
  return generatedResultCard("Issue LLM enrichments", "issue_llm_enrichments.json", body, artifacts);
}

function renderGeneratedRuntimePreview(artifacts) {
  const runSummary = generatedRunSummary();
  const stages = visibleRuntimeStages(runSummary.stage_timings);
  const failedStages = visibleRuntimeStages(runSummary.failed_stages).length;
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
  ]
    .map(([path, label]) => {
      const url = artifactUrlFromArtifacts(path, artifacts);
      return url
        ? `<a class="generated-report-link" href="${escapeHtml(url)}" target="_blank" rel="noopener"><strong>${escapeHtml(label)}</strong><code>${escapeHtml(path)}</code></a>`
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
  return `
    <article class="generated-result-card">
      <div class="generated-result-heading">
        <strong>${escapeHtml(title)}</strong>
        <span>generated</span>
      </div>
      ${body}
    </article>
  `;
}

function renderRawArtifactLink(artifact) {
  return `
    <a class="artifact-link" href="${escapeHtml(artifact.url)}" target="_blank" rel="noopener">
      <strong>${escapeHtml(artifact.label)}</strong>
      <code>${escapeHtml(artifact.path)}</code>
    </a>
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
  state.todoFilter = "all";
  state.dashboardSelection = null;
  state.issueLlmRunningIssueId = "";
  state.issueLlmMessage = "";
  state.issueLlmMessageStatus = "";
  state.diagramSelection = null;
  renderDashboard();
}

async function loadDashboard(jobId, options = {}) {
  if (
    !jobId ||
    (!options.force && state.dashboardArtifactIndex?.job_id === jobId) ||
    state.dashboardLoadingJobId === jobId
  ) {
    return;
  }
  state.dashboardLoadingJobId = jobId;
  const previousSelection = state.dashboardSelection;
  state.dashboardArtifactIndex = null;
  state.dashboardArtifacts = {};
  renderDashboardMessage("Loading issue review artifacts from web-runner URLs...", "pending");
  renderDashboard();

  try {
    const response = await fetch(`/api/jobs/${jobId}/dashboard`, { cache: "no-store" });
    const dashboardArtifactIndex = await response.json();
    if (!response.ok) {
      throw new Error(dashboardArtifactIndex.error || "Issue review artifact discovery failed.");
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
    state.dashboardSelection = options.preserveSelection && previousSelection
      ? previousSelection
      : { kind: "overview", value: "", label: "Review Issues" };
    renderDashboardMessage("Issue review loaded from generated artifacts.", "success");
  } catch (error) {
    state.dashboardLoadingJobId = "";
    renderDashboardMessage(error.message || "Unable to load issue review artifacts.", "error");
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

async function runIssueLlmEnrichment(issueId) {
  const jobId = state.dashboardArtifactIndex?.job_id || state.currentJob?.job_id || "";
  if (!jobId || !issueId) {
    state.issueLlmMessage = "Select a completed issue before running LLM enrichment.";
    state.issueLlmMessageStatus = "error";
    renderDashboardDrilldown();
    return;
  }
  const provider = ["fake", "openai"].includes(state.issueLlmProvider) ? state.issueLlmProvider : "fake";
  state.issueLlmRunningIssueId = issueId;
  state.issueLlmMessage = `Running ${issueLlmProviderLabel(provider)} issue enrichment for ${issueId}...`;
  state.issueLlmMessageStatus = "pending";
  renderDashboardDrilldown();

  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/issue-enrichments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue_id: issueId, provider }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Issue LLM enrichment failed.");
    }
    if (state.currentJob?.job_id === jobId) {
      state.currentJob = {
        ...state.currentJob,
        artifacts: payload.artifacts || state.currentJob.artifacts || [],
      };
    }
    const entry = payload.enrichment || {};
    state.issueLlmMessage = issueLlmMessageForEntry(entry);
    state.issueLlmMessageStatus = entry.status === "succeeded" ? "success" : "error";
    await loadDashboard(jobId, { force: true, preserveSelection: true });
  } catch (error) {
    state.issueLlmMessage = error.message || "Issue LLM enrichment failed.";
    state.issueLlmMessageStatus = "error";
  } finally {
    state.issueLlmRunningIssueId = "";
    renderDashboardDrilldown();
    renderJob();
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
  renderQualityGatesSection();
  renderTableImpactSection();
  renderTodosSection();
  renderReportExportSection();

  if (!loaded) {
    els.dashboardPanelGrid.innerHTML = loading
      ? `<p class="muted">Fetching issue artifacts...</p>`
      : `<p class="muted">Run a job to review issues by table and column.</p>`;
    els.dashboardDrilldownMeta.textContent = "No selection";
    els.dashboardDrilldown.innerHTML = `<p class="muted">Select an issue to inspect where it happened, evidence, impact, and fix guidance.</p>`;
    return;
  }

  els.dashboardPanelGrid.innerHTML = `
    ${renderIssueVisualSummary(filteredIssues)}
    ${renderIssueInbox(filteredIssues)}
  `;
  renderDashboardDrilldown();

  if ((artifactIndex.missing_artifacts || []).length) {
    renderDashboardMessage(
      `Issue review loaded with missing artifacts: ${artifactIndex.missing_artifacts.join(", ")}.`,
      "pending",
    );
  } else if (artifacts["influence.json"] && !artifacts[dashboardChartPaths.influence]) {
    renderDashboardMessage("Issue review loaded. Legacy association chart is absent because no features were generated.", "success");
  }
}

function renderDashboardSummary(issues) {
  const artifactIndex = state.dashboardArtifactIndex;
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const assessmentArtifact = state.dashboardArtifacts["table_assessments.json"] || {};
  const qualityGates = getQualityGatesArtifact();
  const assessments = getDashboardTableAssessments();
  const guardrail = getL4Guardrail();
  const riskScore = verdict.risk_score ?? verdict.summary?.risk_score ?? "--";
  const verdictLabel = verdict.verdict || verdict.summary?.verdict || (artifactIndex ? "unknown" : "Waiting");
  const paths = Object.keys(artifactIndex?.artifact_urls || {});
  const gateSummary = qualityGates?.summary || {};
  const l4Summary = guardrail.status
    ? `<div><span>LLM report</span><strong>${escapeHtml(guardrail.status)}</strong></div>`
    : "";
  els.dashboardSummaryStrip.innerHTML = `
    <div><span>readiness</span><strong>${escapeHtml(verdictLabel)}</strong></div>
    <div><span>risk</span><strong>${escapeHtml(riskScore === "--" ? "--" : `${integerText(riskScore)}/100`)}</strong></div>
    <div><span>issues</span><strong>${integerText(issues.length)}</strong></div>
    <div><span>tables</span><strong>${integerText(assessmentArtifact.summary?.table_count ?? assessments.length)}</strong></div>
    <div><span>gates</span><strong>${qualityGates ? `${integerText(gateSummary.blocked_count || 0)} blocked` : "--"}</strong></div>
    ${l4Summary}
    <div><span>artifacts</span><strong>${integerText(paths.length)}</strong></div>
  `;
}

function renderQualityGatesSection() {
  const loaded = Boolean(state.dashboardArtifactIndex);
  const artifact = getQualityGatesArtifact();

  if (!loaded) {
    els.qualityGatesStatus.textContent = state.dashboardLoadingJobId
      ? "Fetching quality_gates.json"
      : "Waiting for quality_gates.json";
    els.qualityGatesGrid.innerHTML = `<p class="muted">Run a job to review deterministic post-run gates.</p>`;
    return;
  }

  if (!artifact) {
    els.qualityGatesStatus.textContent = "Gate artifact missing";
    els.qualityGatesGrid.innerHTML = `
      <section class="quality-gate-empty">
        <strong>Quality gates need generated run artifacts.</strong>
        <p>quality_gates.json was not available for this run. Rerun the profiler so gates can be derived from readiness, issues, action plans, and todos.</p>
      </section>
    `;
    return;
  }

  const gates = Array.isArray(artifact.gates) ? artifact.gates : [];
  const summary = artifact.summary || {};
  els.qualityGatesStatus.textContent = `${integerText(summary.gate_count ?? gates.length)} gates · ${integerText(summary.blocked_count || 0)} blocked · source=deterministic`;
  if (!gates.length) {
    els.qualityGatesGrid.innerHTML = `
      <section class="quality-gate-empty">
        <strong>No quality gates generated.</strong>
        <p>No gate rows were present in quality_gates.json for this run.</p>
      </section>
    `;
    return;
  }

  els.qualityGatesGrid.innerHTML = gates.map(renderQualityGateCard).join("");
}

function renderQualityGateCard(gate) {
  const status = gate.status || "Needs Review";
  const evidence = Array.isArray(gate.evidence_values) ? gate.evidence_values : [];
  const contexts = Array.isArray(gate.contexts) ? gate.contexts : [];
  const nextAction = gate.recommended_next_action || {};
  return `
    <article class="quality-gate-card" data-status="${escapeHtml(status)}">
      <div class="quality-gate-heading">
        <div>
          <strong>${escapeHtml(gate.label || "Quality gate")}</strong>
          <p>${escapeHtml(gate.explanation || "Gate evidence needs review.")}</p>
        </div>
        <span class="pill-status ${issueStatusClass(status)}" title="${escapeHtml(gate.explanation || status)}">${escapeHtml(status)}</span>
      </div>
      <div class="quality-gate-evidence" aria-label="${escapeHtml(gate.label || "Quality gate")} evidence">
        ${evidence.slice(0, 4).map(renderQualityGateEvidence).join("")}
      </div>
      ${contexts.length ? `
        <div class="quality-gate-contexts">
          ${contexts.slice(0, 5).map(renderQualityGateContext).join("")}
        </div>
      ` : `<p class="muted">No linked table, column, or issue context for this gate.</p>`}
      <a class="quality-gate-action" href="${escapeHtml(nextAction.anchor || "#dashboardPanelGrid")}">${escapeHtml(nextAction.label || "Open Review Issues.")}</a>
    </article>
  `;
}

function renderQualityGateEvidence(value) {
  return `
    <div class="quality-gate-evidence-value" title="${escapeHtml(value.meaning || "")}">
      <span>${escapeHtml(value.label || "Evidence")}</span>
      <strong>${escapeHtml(value.raw_value ?? "unknown")}</strong>
      <small>${escapeHtml(value.meaning || "")}</small>
    </div>
  `;
}

function renderQualityGateContext(context) {
  const issueText = context.issue_id ? `${context.issue_id} · ${context.issue_type || "UNKNOWN"}` : context.relationship_id || context.todo_id || "context";
  const columns = Array.isArray(context.columns) && context.columns.length
    ? context.columns.join(", ")
    : "table scope";
  const parent = context.parent_table
    ? ` -> ${context.parent_table}${Array.isArray(context.parent_columns) && context.parent_columns.length ? `.${context.parent_columns.join(", ")}` : ""}`
    : "";
  return `
    <div class="quality-gate-context">
      <code>${escapeHtml(issueText)}</code>
      <span>${escapeHtml(context.table || "dataset")}.${escapeHtml(columns)}${escapeHtml(parent)}</span>
      <small>${escapeHtml(context.status || context.severity || context.todo_type || context.source_artifact || "")}</small>
    </div>
  `;
}

function renderTableImpactSection() {
  const loaded = Boolean(state.dashboardArtifactIndex);
  const assessments = getDashboardTableAssessments()
    .filter((assessment) => filterMatchesTable(assessment.table))
    .sort((a, b) => (
      readinessOrder(a.readiness) - readinessOrder(b.readiness) ||
      Number(a.health_score || 0) - Number(b.health_score || 0) ||
      String(a.table || "").localeCompare(String(b.table || ""))
    ));

  if (!loaded) {
    els.tableImpactStatus.textContent = state.dashboardLoadingJobId
      ? "Fetching table_assessments.json"
      : "Waiting for table_assessments.json";
    els.tableImpactGrid.innerHTML = `<p class="muted">Run a job to review per-table readiness and affected columns.</p>`;
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
        <span class="table-impact-score">${integerText(assessment.health_score)}<small>health</small></span>
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

function renderTodosSection() {
  const artifact = getIssueTodosArtifact();
  const loaded = Boolean(state.dashboardArtifactIndex);
  const groups = getTodoGroupsForFilter();
  syncTodoFilterButtons();

  if (!loaded) {
    els.todosStatus.textContent = state.dashboardLoadingJobId
      ? "Fetching issue_todos.json"
      : "Waiting for issue_todos.json";
    els.todosGrid.innerHTML = `<p class="muted">Run a job to review deterministic fix and verify todos.</p>`;
    return;
  }

  if (!artifact) {
    els.todosStatus.textContent = "Todo artifact missing";
    els.todosGrid.innerHTML = `
      <section class="todo-empty">
        <strong>Todos need generated action plans.</strong>
        <p>issue_todos.json was not available for this run. Rerun the profiler so todos can be derived from issue_action_plans.json.</p>
      </section>
    `;
    return;
  }

  const summary = artifact.summary || {};
  els.todosStatus.textContent = `${integerText(summary.todo_group_count)} grouped todos · ${integerText(summary.todo_occurrence_count)} occurrences · source=deterministic`;
  if (!groups.length) {
    els.todosGrid.innerHTML = `
      <section class="todo-empty">
        <strong>No todos generated.</strong>
        <p>No fix or verify todos were generated because no issues were detected for this run.</p>
      </section>
    `;
    return;
  }

  els.todosGrid.innerHTML = `
    <div class="todo-summary-strip" aria-label="Todo summary">
      <div><span>${integerText(summary.fix_data_group_count)}</span><p>Fix data groups</p></div>
      <div><span>${integerText(summary.verify_after_fix_group_count)}</span><p>Verify after fix groups</p></div>
      <div><span>${integerText(summary.todo_occurrence_count)}</span><p>Occurrences</p></div>
    </div>
    ${renderTodoGroupSection("Fix data", groups.filter((group) => group.todo_type === "fix_data"))}
    ${renderTodoGroupSection("Verify after fix", groups.filter((group) => group.todo_type === "verify_after_fix"))}
  `;
}

function renderReportExportSection() {
  const loaded = Boolean(state.dashboardArtifactIndex);
  if (!loaded) {
    els.reportExportStatus.textContent = state.dashboardLoadingJobId
      ? "Fetching reports"
      : "Waiting for reports";
    els.reportExportGrid.innerHTML = `<p class="muted">Run a job to open generated reports and copy todo exports.</p>`;
    els.reportExportTodos.innerHTML = `<p class="muted">Todo exports load after deterministic todos are generated.</p>`;
    els.reportExportMessage.textContent = "Reports and todo exports are ready after a completed run.";
    els.reportExportMessage.dataset.status = "";
    return;
  }

  const reportLinks = renderReportExportLinks();
  const reportPreview = renderReportVisualPreview();
  els.reportExportGrid.innerHTML = reportLinks ? `${reportPreview}${reportLinks}` : `
    <section class="report-export-empty">
      <strong>Reports are missing.</strong>
      <p>Expected HTML and Markdown reports were not found for this run.</p>
    </section>
  `;
  els.reportExportStatus.textContent = reportLinks ? "Reports ready" : "Reports missing";

  const todoArtifact = getIssueTodosArtifact();
  if (!todoArtifact) {
    els.reportExportTodos.innerHTML = `
      <section class="report-export-empty">
        <strong>Todo exports unavailable.</strong>
        <p>Fix data and Verify after fix exports load when deterministic todos are generated.</p>
      </section>
    `;
    els.reportExportMessage.textContent = "Todo exports need issue_todos.json from a completed run.";
    els.reportExportMessage.dataset.status = "";
    return;
  }

  const groups = Array.isArray(todoArtifact.groups) ? todoArtifact.groups : [];
  const fixGroups = groups.filter((group) => group.todo_type === "fix_data");
  const verifyGroups = groups.filter((group) => group.todo_type === "verify_after_fix");
  els.reportExportTodos.innerHTML = `
    <div class="runtime-heading compact">
      <strong>Todo exports</strong>
      <span>${integerText(groups.length)} groups</span>
    </div>
    <div class="report-export-actions">
      <button class="button secondary compact" type="button" data-todo-export="fix_data">Copy Fix data Markdown</button>
      <button class="button secondary compact" type="button" data-todo-export="verify_after_fix">Copy Verify after fix Markdown</button>
    </div>
    <div class="report-export-todo-split" aria-label="Todo export summary">
      ${renderReportExportTodoSummary("Fix data", fixGroups)}
      ${renderReportExportTodoSummary("Verify after fix", verifyGroups)}
    </div>
  `;
  els.reportExportMessage.textContent = "Reports and todo exports are ready for review.";
  els.reportExportMessage.dataset.status = "";
}

function renderReportExportLinks() {
  const links = [
    {
      path: "report.html",
      label: "HTML report",
      detail: "Open the fixed-section report for review.",
    },
    {
      path: "report.md",
      label: "Markdown report",
      detail: "Use the same deterministic report in Markdown.",
    },
  ];
  if (artifactUrlFor("issue_llm_enrichments.json")) {
    links.push({
      path: "issue_llm_enrichments.json",
      label: "Issue LLM enrichments",
      detail: "Open optional selected-issue enrichment evidence.",
    });
  }
  return links.map((link) => {
    const url = artifactUrlFor(link.path);
    if (!url) {
      return "";
    }
    return `
      <a class="report-export-card" href="${escapeHtml(url)}" target="_blank" rel="noopener">
        <strong>${escapeHtml(link.label)}</strong>
        <span>${escapeHtml(link.detail)}</span>
        <code>${escapeHtml(link.path)}</code>
      </a>
    `;
  }).filter(Boolean).join("");
}

function renderReportVisualPreview() {
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const issues = getDashboardIssues();
  const missingSpec = state.dashboardArtifacts[dashboardChartPaths.missingColumns] || {};
  const outlierSpec = state.dashboardArtifacts[dashboardChartPaths.outliers] || {};
  const issueTypeRows = topChartRows(
    state.dashboardArtifacts[dashboardChartPaths.type]?.data || issueTypeCountsForPreview(issues),
    "issue_type",
    "count",
    4,
  );
  const missingRows = topChartRows(missingSpec.data || [], "field", "null_count", 3);
  const outlierRows = topChartRows(outlierSpec.data || [], "field", "outlier_count", 3);
  const topIssues = issues
    .slice()
    .sort((a, b) => (
      severityRank(a.severity) - severityRank(b.severity) ||
      Number(b.bad_count || 0) - Number(a.bad_count || 0) ||
      issueGuid(a).localeCompare(issueGuid(b))
    ))
    .slice(0, 3);
  const issueCount = verdict.issue_counts?.total ?? issues.length;
  const riskScore = verdict.risk_score ?? verdict.summary?.risk_score;
  const verdictText = verdict.verdict || verdict.summary?.verdict || "Review required";
  return `
    <section class="report-visual-preview" aria-label="Report visual preview">
      <div class="report-preview-heading">
        <div>
          <p class="eyebrow">Report preview</p>
          <h4>Summary before opening the report</h4>
        </div>
        <span>${escapeHtml(verdictText)}</span>
      </div>
      <div class="report-preview-summary">
        <strong>${escapeHtml(verdictText)}</strong>
        <span>${integerText(issueCount)} issues · ${riskScore === undefined ? "--" : `${integerText(riskScore)}/100`} risk · ${integerText(missingRows.length + outlierRows.length)} previewed columns</span>
      </div>
      <div class="report-preview-signal-grid">
        ${renderReportPreviewBars("Issue types", issueTypeRows, (row) => issueTypeText(row.label), "No issue counts available yet.")}
        ${renderReportPreviewBars("Missing values", missingRows, (row) => row.label, "No missing-value columns in the report preview.")}
        ${renderReportPreviewBars("Outliers", outlierRows, (row) => row.label, "No outlier columns in the report preview.")}
      </div>
      <div class="report-fix-list">
        <strong>Inspect first</strong>
        ${topIssues.length ? topIssues.map(renderReportFixPreviewCard).join("") : `<p class="muted">No issues are available for this run.</p>`}
      </div>
    </section>
  `;
}

function topChartRows(rows, labelKey, valueKey, limit) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      label: String(row[labelKey] || row.label || row.field || "unknown"),
      value: Number(row[valueKey] ?? row.count ?? row.value ?? 0),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function issueTypeCountsForPreview(issues) {
  return [...countBy(issues, (issue) => issue.issue_type || "UNKNOWN").entries()]
    .map(([issue_type, count]) => ({ issue_type, count }));
}

function renderReportPreviewBars(title, rows, labelFormatter, emptyText) {
  const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
  return `
    <div class="report-preview-chart">
      <div class="report-preview-chart-heading">
        <strong>${escapeHtml(title)}</strong>
      </div>
      ${rows.length ? rows.map((row) => {
        const width = Math.max(5, Math.round(Number(row.value || 0) / maxValue * 100));
        return `
          <div class="report-preview-bar">
            <span>${escapeHtml(labelFormatter(row))}</span>
            <span class="report-preview-track" aria-hidden="true">
              <span style="width: ${width}%"></span>
            </span>
            <code>${integerText(row.value)}</code>
          </div>
        `;
      }).join("") : `<p class="muted">${escapeHtml(emptyText)}</p>`}
    </div>
  `;
}

function renderReportFixPreviewCard(issue) {
  const issueId = issueGuid(issue);
  const table = issue.table || "Schema / dataset";
  const column = issuePrimaryColumn(issue);
  const displayColumn = column === "__table__" ? "table-level" : column;
  return `
    <button class="report-fix-row" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(issueId)}" data-dashboard-label="${escapeHtml(issueId)}" data-dashboard-scroll="drilldown">
      <span class="issue-pill ${issueStatusClass(issueStatus(issue))}">${escapeHtml(issue.severity || "P?")}</span>
      <strong>${escapeHtml(table)}.${escapeHtml(displayColumn)}</strong>
      <span>${escapeHtml(issueTypeLabel(issue))}</span>
      <code>${integerText(issue.bad_count || 0)} rows</code>
    </button>
  `;
}

function renderReportExportTodoSummary(title, groups) {
  const occurrenceCount = groups.reduce((sum, group) => sum + Number(group.occurrence_count || 0), 0);
  return `
    <article class="report-export-todo-card">
      <strong>${escapeHtml(title)}</strong>
      <p>${integerText(groups.length)} groups · ${integerText(occurrenceCount)} occurrences</p>
    </article>
  `;
}

async function handleTodoExport(target) {
  const todoType = target.dataset.todoExport || "";
  const artifact = getIssueTodosArtifact();
  const groups = Array.isArray(artifact?.groups)
    ? artifact.groups.filter((group) => group.todo_type === todoType)
    : [];
  if (!groups.length) {
    setReportExportMessage(`No ${todoTypeLabel(todoType)} todos are available to copy.`, "error");
    return;
  }
  try {
    await copyText(issueTodoGroupsMarkdown(todoType, groups));
    setReportExportMessage(`Copied ${todoTypeLabel(todoType)} Markdown.`, "success");
  } catch (error) {
    setReportExportMessage("Copy failed in this browser.", "error");
  }
}

function issueTodoGroupsMarkdown(todoType, groups) {
  const lines = [`# ${todoTypeLabel(todoType)} Todos`, ""];
  groups.forEach((group) => {
    const occurrenceCount = Number(group.occurrence_count || 0);
    lines.push(`- ${group.text || "Todo needs review."}`);
    lines.push(`  - Todo ID: ${group.todo_id || "unknown"}`);
    lines.push(`  - Occurrences: ${integerText(occurrenceCount)}`);
    const priorities = Array.isArray(group.priorities) ? group.priorities.filter(Boolean) : [];
    if (priorities.length) {
      lines.push(`  - Priorities: ${priorities.join(", ")}`);
    }
    const occurrences = Array.isArray(group.occurrences) ? group.occurrences : [];
    occurrences.slice(0, 10).forEach((occurrence) => {
      const columns = Array.isArray(occurrence.columns) && occurrence.columns.length
        ? occurrence.columns.join(", ")
        : "table scope";
      lines.push(`  - ${occurrence.issue_id || "UNKNOWN"}: ${occurrence.table || "unknown"}.${columns}`);
    });
  });
  return `${lines.join("\n")}\n`;
}

function todoTypeLabel(todoType) {
  return todoType === "verify_after_fix" ? "Verify after fix" : "Fix data";
}

function setReportExportMessage(message, status) {
  els.reportExportMessage.textContent = message;
  els.reportExportMessage.dataset.status = status;
}

function syncTodoFilterButtons() {
  [
    [els.todosFilterAll, "all"],
    [els.todosFilterFix, "fix_data"],
    [els.todosFilterVerify, "verify_after_fix"],
  ].forEach(([button, filter]) => {
    const active = state.todoFilter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function getTodoGroupsForFilter() {
  const artifact = getIssueTodosArtifact();
  const groups = Array.isArray(artifact?.groups) ? artifact.groups : [];
  if (state.todoFilter === "fix_data" || state.todoFilter === "verify_after_fix") {
    return groups.filter((group) => group.todo_type === state.todoFilter);
  }
  return groups;
}

function renderTodoGroupSection(title, groups) {
  if (!groups.length && state.todoFilter !== "all") {
    return `
      <section class="todo-type-section">
        <h4>${escapeHtml(title)}</h4>
        <p class="muted">No ${escapeHtml(title.toLowerCase())} todos match this run.</p>
      </section>
    `;
  }
  if (!groups.length) {
    return "";
  }
  return `
    <section class="todo-type-section">
      <h4>${escapeHtml(title)}</h4>
      <div class="todo-group-list">
        ${groups.map(renderTodoGroup).join("")}
      </div>
    </section>
  `;
}

function renderTodoGroup(group) {
  const occurrenceCount = Number(group.occurrence_count || 0);
  const priorities = Array.isArray(group.priorities) ? group.priorities : [];
  const occurrences = Array.isArray(group.occurrences) ? group.occurrences : [];
  return `
    <article class="todo-group-card">
      <div class="todo-group-heading">
        <div>
          <span class="todo-type-label">${escapeHtml(group.todo_type_label || group.todo_type || "Todo")}</span>
          <strong>${escapeHtml(group.text || "Todo needs human review.")}</strong>
        </div>
        <span class="pill-status mapped">${integerText(occurrenceCount)} occurrence${occurrenceCount === 1 ? "" : "s"}</span>
      </div>
      <div class="todo-meta-row">
        <span>source=deterministic</span>
        ${priorities.slice(0, 4).map((priority) => `<code>${escapeHtml(priority)}</code>`).join("")}
      </div>
      <div class="todo-occurrence-list">
        ${occurrences.slice(0, 8).map(renderTodoOccurrence).join("")}
      </div>
      ${occurrences.length > 8 ? `<p class="muted">${integerText(occurrences.length - 8)} more occurrence${occurrences.length - 8 === 1 ? "" : "s"} in issue_todos.json.</p>` : ""}
    </article>
  `;
}

function renderTodoOccurrence(occurrence) {
  const issue = issueForTodoOccurrence(occurrence);
  const columns = Array.isArray(occurrence.columns) && occurrence.columns.length
    ? occurrence.columns.join(", ")
    : "table scope";
  const scope = `${occurrence.table || "unknown"}.${columns}`;
  const issueId = occurrence.issue_id || "UNKNOWN";
  const issueType = issue ? issueTypeLabel(issue) : todoIssueTypeLabel(occurrence.issue_type || "UNKNOWN");
  const finding = occurrence.finding_summary || todoFindingFromIssue(issue) || `${issueType} on ${scope}.`;
  const evidence = todoOccurrenceEvidenceText(occurrence, issue);
  return `
    <button class="todo-occurrence" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(issueId)}" data-dashboard-label="${escapeHtml(issueId)}" data-dashboard-scroll="drilldown">
      <span class="todo-occurrence-heading">
        <code>${escapeHtml(issueId)}</code>
        <strong>${escapeHtml(issueType)}</strong>
      </span>
      <span class="todo-occurrence-finding">${escapeHtml(finding)}</span>
      <span class="todo-occurrence-evidence">${escapeHtml(evidence)}</span>
      <small>${escapeHtml(occurrence.priority || "Needs human review")} · open issue detail</small>
    </button>
  `;
}

function issueForTodoOccurrence(occurrence) {
  const issueId = occurrence?.issue_id || "";
  if (!issueId) {
    return null;
  }
  return getDashboardIssues().find((issue) => issue.issue_id === issueId) || null;
}

function todoFindingFromIssue(issue) {
  if (!issue) {
    return "";
  }
  const columns = Array.isArray(issue.columns) && issue.columns.length
    ? issue.columns.join(", ")
    : "table scope";
  return `${issueTypeLabel(issue)} on ${issue.table || "unknown"}.${columns}: ${integerText(issue.bad_count)} of ${integerText(issue.total_count)} rows affected (${percentText(issue.bad_rate)}).`;
}

function todoIssueTypeLabel(value) {
  return String(value || "UNKNOWN")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unknown";
}

function todoOccurrenceEvidenceText(occurrence, issue) {
  const parts = [];
  if (issue?.bad_count !== undefined && issue?.total_count !== undefined) {
    parts.push(`${integerText(issue.bad_count)}/${integerText(issue.total_count)} rows`);
  }
  const sampleKeys = Array.isArray(issue?.sample_keys) ? issue.sample_keys.filter(Boolean) : [];
  if (sampleKeys.length) {
    parts.push(`sample key ${sampleKeys.slice(0, 3).join(", ")}`);
  }
  if (issue?.sample_bad_rows_path) {
    parts.push(`sample rows ${issue.sample_bad_rows_path}`);
  }
  const parentTable = occurrence.parent_table || issue?.parent_table;
  const parentColumns = Array.isArray(occurrence.parent_columns) && occurrence.parent_columns.length
    ? occurrence.parent_columns
    : (Array.isArray(issue?.parent_columns) ? issue.parent_columns : []);
  if (parentTable) {
    parts.push(`parent ${parentTable}.${parentColumns.length ? parentColumns.join(", ") : "key"}`);
  }
  const cause = Array.isArray(issue?.probable_causes) ? issue.probable_causes.find(Boolean) : "";
  if (cause) {
    parts.push(cause);
  }
  return parts.length
    ? `Evidence: ${parts.join(" · ")}`
    : "Evidence: open the issue detail drawer for generated sample rows and query context.";
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

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayOfStrings(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item !== null && item !== undefined && item !== "").map((item) => String(item));
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
    "Data-quality readiness",
    "dataset_verdict.json",
    `
      <button class="risk-gauge-button" type="button" data-dashboard-kind="verdict" data-dashboard-value="${escapeHtml(riskLabel)}" data-dashboard-label="Data-quality readiness ${escapeHtml(riskLabel)}">
        ${riskGaugeSvg(riskScore)}
        <span><strong>${escapeHtml(riskLabel)}</strong><small>${riskScore}/100 risk · ${issueCount} issues</small></span>
      </button>
    `,
  );
}

function renderL4GuardrailPanel() {
  const guardrail = getL4Guardrail();
  const narrativeAvailable = Boolean(state.dashboardArtifactIndex?.artifact_urls?.["l4_report.md"]);
  if (!Object.keys(guardrail).length && !narrativeAvailable) {
    return "";
  }
  const status = guardrail.status || "not loaded";
  const provider = guardrail.provider || "unknown";
  const model = guardrail.model || guardrail.model_config?.model || "";
  const checkedNumbers = Array.isArray(guardrail.checked_numbers) ? guardrail.checked_numbers.length : 0;
  const checkedRefs = Array.isArray(guardrail.checked_refs) ? guardrail.checked_refs.length : 0;
  const violationCount = Array.isArray(guardrail.violations) ? guardrail.violations.length : 0;
  const fallback = guardrail.fallback_reason || "";
  return dashboardPanel(
    "Optional LLM guardrail",
    "guardrail_report.json",
    `
      <button class="risk-gauge-button" type="button" data-dashboard-kind="l4_guardrail" data-dashboard-value="${escapeHtml(status)}" data-dashboard-label="LLM guardrail ${escapeHtml(status)}">
        <span class="pill-status ${guardrailStatusClass(status)}">${escapeHtml(status)}</span>
        <span>
          <strong>${escapeHtml(provider)}${model ? ` · ${escapeHtml(model)}` : ""}</strong>
          <small>${integerText(checkedNumbers)} numbers · ${integerText(checkedRefs)} refs · ${integerText(violationCount)} violations${fallback ? ` · ${escapeHtml(fallback)}` : ""}</small>
        </span>
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

function renderOutliersPanel() {
  const spec = state.dashboardArtifacts[dashboardChartPaths.outliers];
  const rows = (spec?.data || [])
    .filter((row) => filterMatchesTable(row.table))
    .slice(0, 10)
    .map((row) => ({
      label: row.field || `${row.table}.${row.column}`,
      value: Number(row.outlier_count || 0),
      count: Number(row.outlier_count || 0),
      kind: "numeric_outlier",
      detail: percentText(row.outlier_rate),
    }));
  return dashboardPanel(
    "Numeric IQR outliers",
    dashboardChartPaths.outliers,
    renderDashboardBars(rows, {
      empty: "No numeric outlier rows match the current table filter.",
      valueFormatter: integerText,
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

function renderIssueVisualSummary(filteredIssues) {
  const tableRows = [...countBy(filteredIssues, (issue) => issue.table || "Schema / dataset").entries()]
    .map(([label, value]) => ({ label, value, kind: "table" }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 5);
  const typeRows = [...countBy(filteredIssues, (issue) => issue.issue_type || "unknown").entries()]
    .map(([label, value]) => ({ label, displayLabel: issueTypeText(label), value, kind: "issue_type" }))
    .sort((a, b) => b.value - a.value || a.displayLabel.localeCompare(b.displayLabel))
    .slice(0, 5);
  const severityRows = severityOrder
    .map((label) => ({ label, value: filteredIssues.filter((issue) => issue.severity === label).length, kind: "severity" }))
    .filter((row) => row.value > 0);
  const badRows = sum(filteredIssues.map((issue) => Number(issue.bad_count || 0)));
  return `
    <section class="issue-visual-summary" aria-label="Issue visual summary">
      <div class="issue-visual-heading">
        <div>
          <p class="eyebrow">Visual summary</p>
          <h4>Issue map</h4>
        </div>
        <div class="issue-visual-total">
          <strong>${integerText(filteredIssues.length)}</strong>
          <span>issues · ${integerText(badRows)} bad rows</span>
        </div>
      </div>
      <div class="issue-visual-grid">
        ${renderIssueVisualChart("Severity", "Run impact", severityRows, "No severities match the current filters.")}
        ${renderIssueVisualChart("Top tables", "Where issues cluster", tableRows, "No tables match the current filters.")}
        ${renderIssueVisualChart("Issue types", "What failed", typeRows, "No issue types match the current filters.")}
      </div>
    </section>
  `;
}

function renderIssueVisualChart(title, subtitle, rows, emptyText) {
  const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
  return `
    <article class="issue-visual-chart">
      <div class="issue-visual-chart-heading">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </div>
      ${rows.length ? `
        <div class="issue-visual-bars">
          ${rows.map((row) => renderIssueVisualRow(row, maxValue)).join("")}
        </div>
      ` : `<p class="muted">${escapeHtml(emptyText)}</p>`}
    </article>
  `;
}

function renderIssueVisualRow(row, maxValue) {
  const value = Number(row.value || 0);
  const width = value > 0 ? Math.max(5, Math.round(value / maxValue * 100)) : 0;
  const label = row.displayLabel || row.label;
  return `
    <button class="issue-visual-row" type="button" data-dashboard-kind="${escapeHtml(row.kind)}" data-dashboard-value="${escapeHtml(row.label)}" data-dashboard-label="${escapeHtml(label)}">
      <span class="issue-visual-row-label">${escapeHtml(label)}</span>
      <span class="issue-visual-row-track" aria-hidden="true">
        <span class="issue-visual-row-fill ${dashboardTone(row.label)}" style="width: ${width}%"></span>
      </span>
      <span class="issue-visual-row-value">${integerText(value)}</span>
    </button>
  `;
}

function renderInfluencePanel() {
  const spec = state.dashboardArtifacts[dashboardChartPaths.influence];
  if (!spec) {
    const influence = state.dashboardArtifacts["influence.json"] || {};
    const reason = influence.skipped_reason || influence.notes?.[0] || "No legacy association features were generated.";
    return dashboardPanel(
      "Legacy association artifact",
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
    "Legacy association artifact",
    dashboardChartPaths.influence,
    renderDashboardBars(rows, {
      empty: "No legacy association features match the current table filter.",
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

function renderIssueInbox(filteredIssues) {
  const issues = [...filteredIssues].sort((a, b) => (
    issueStatusOrder(issueStatus(a)) - issueStatusOrder(issueStatus(b)) ||
    (a.table || "").localeCompare(b.table || "") ||
    issuePrimaryColumn(a).localeCompare(issuePrimaryColumn(b)) ||
    issueGuid(a).localeCompare(issueGuid(b))
  ));
  const tableCount = uniqueSorted(issues.map((issue) => issue.table).filter(Boolean)).length;
  const columnCount = new Set(issues.map((issue) => `${issue.table || "Schema / dataset"}.${issuePrimaryColumn(issue)}`)).size;
  if (!issues.length) {
    return `
      <section class="issue-inbox-empty">
        <strong>No issues match the current filters.</strong>
        <p>Adjust severity, issue type, or table filters to review generated findings.</p>
      </section>
    `;
  }

  return `
    <section class="issue-inbox" aria-label="Review Issues compact issue table">
      <div class="issue-inbox-heading">
        <div>
          <p class="eyebrow">Review Issues</p>
          <h4>Issue table</h4>
          <p>Click a row to see the exact table, column, evidence, explanation, and fix checklist.</p>
        </div>
        <div class="issue-inbox-totals" aria-label="Issue inbox summary">
          <span>${integerText(issues.length)} issues</span>
          <span>${integerText(columnCount)} columns</span>
          <span>${integerText(tableCount)} tables</span>
        </div>
      </div>
      <div class="issue-review-table" role="table" aria-label="Issues by table and column">
        <div class="issue-review-header" role="row">
          <span role="columnheader">Issue</span>
          <span role="columnheader">Table</span>
          <span role="columnheader">Column</span>
          <span role="columnheader">Problem</span>
          <span role="columnheader">Affected</span>
          <span role="columnheader">Status</span>
        </div>
        <div class="issue-review-body">
          ${issues.map(renderInboxIssueRow).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderInboxIssueRow(issue) {
  const status = issueStatus(issue);
  const selected = state.dashboardSelection?.kind === "issue" && state.dashboardSelection.value === issue.issue_id;
  const tableName = issue.table || "Schema / dataset";
  const columnKey = issuePrimaryColumn(issue);
  const columnLabel = issueColumnLabel(issue, columnKey);
  const context = issueRowContext(issue, tableName, { key: columnKey, label: columnLabel });
  const affectedPercent = Math.min(100, Math.max(0, Number(issue.bad_rate || 0) * 100));
  const affectedWidth = Number(issue.bad_count || 0) > 0 ? Math.max(2, affectedPercent) : 0;
  return `
    <button class="issue-inbox-row ${selected ? "selected" : ""}" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(issue.issue_id)}" data-dashboard-label="${escapeHtml(issue.issue_id)}" data-dashboard-scroll="drilldown" role="row" aria-label="${escapeHtml(`${issueGuid(issue)} ${tableName} ${columnLabel} ${issueTypeLabel(issue)}`)}">
      <span class="issue-guid" role="cell">${escapeHtml(issueGuid(issue))}</span>
      <span class="issue-table-cell" role="cell"><code>${escapeHtml(tableName)}</code></span>
      <span class="issue-column-cell" role="cell"><code>${escapeHtml(columnLabel)}</code>${context ? `<small>${escapeHtml(context)}</small>` : ""}</span>
      <span class="issue-row-main" role="cell">
        <strong>${escapeHtml(issueTypeLabel(issue))}</strong>
        <small>${escapeHtml(issueScopeLabel(issue))}</small>
      </span>
      <span class="issue-counts" role="cell">
        <span>${integerText(issue.bad_count)} rows</span>
        <span class="issue-row-meter" aria-label="${escapeHtml(percentText(issue.bad_rate))} affected"><span style="width: ${affectedWidth}%"></span></span>
        <span>${percentText(issue.bad_rate)}</span>
      </span>
      <span class="pill-status ${issueStatusClass(status)}" role="cell">${escapeHtml(status)}</span>
    </button>
  `;
}

function renderDashboardDrilldown() {
  if (!state.dashboardArtifactIndex) {
    els.dashboardDrilldownMeta.textContent = "No selection";
    els.dashboardDrilldown.innerHTML = `<p class="muted">Select an issue to inspect where it happened, evidence, impact, and fix guidance.</p>`;
    return;
  }
  const selection = state.dashboardSelection || { kind: "overview", value: "", label: "Review Issues" };
  if (selection.kind === "issue") {
    const issue = getDashboardIssues().find((candidate) => candidate.issue_id === selection.value);
    if (issue) {
      els.dashboardDrilldownMeta.textContent = issueGuid(issue);
      els.dashboardDrilldown.innerHTML = renderIssueDetailDrawer(issue);
      return;
    }
  }
  const issues = dashboardIssuesForSelection(selection);
  els.dashboardDrilldownMeta.textContent = selection.label || "Review Issues";
  els.dashboardDrilldown.innerHTML = `
    <div class="drilldown-summary">
      <div><span>${issues.length}</span><p>matching issues</p></div>
      <div><span>${uniqueSorted(issues.map((issue) => issue.table).filter(Boolean)).length}</span><p>tables</p></div>
      <div><span>${integerText(sum(issues.map((issue) => Number(issue.bad_count || 0))))}</span><p>bad rows</p></div>
    </div>
    <p class="muted">Select an issue row to open its detail drawer.</p>
    ${renderL4GuardrailDetails(selection)}
    ${renderTableAssessmentDetails(selection)}
    ${renderIssueRows(issues)}
  `;
}

function dashboardIssuesForSelection(selection) {
  const issues = getFilteredDashboardIssues();
  if (!selection || selection.kind === "overview" || selection.kind === "verdict") {
    return issues;
  }
  if (selection.kind === "issue") {
    return issues.filter((issue) => issue.issue_id === selection.value);
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
  if (selection.kind === "table_assessment") {
    return issues.filter((issue) => issue.table === selection.value);
  }
  if (selection.kind === "numeric_outlier") {
    const [table, column] = String(selection.value || "").split(".");
    return issues.filter((issue) => (
      issue.issue_type === "NUMERIC_OUTLIER" &&
      issue.table === table &&
      Array.isArray(issue.columns) &&
      issue.columns.includes(column)
    ));
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

function renderIssueDetailDrawer(issue) {
  const status = issueStatus(issue);
  const parent = issueParentContext(issue);
  const actionPlan = getIssueActionPlan(issue);
  requestIssueSampleRows(issue);
  return `
    <article class="issue-detail-drawer">
      <div class="issue-detail-header">
        <div>
          <span class="issue-guid">${escapeHtml(issueGuid(issue))}</span>
          <h4>${escapeHtml(issueTypeLabel(issue))}</h4>
        </div>
        <span class="pill-status ${issueStatusClass(status)}">${escapeHtml(status)}</span>
      </div>
      ${renderIssueFocusMap(issue, parent)}
      ${renderIssueSampleRows(issue)}
      ${renderIssueActionDisclosure("Fix / Todo", "Deterministic checklist", renderIssueActionPlan(actionPlan, issue), { open: true })}
      ${renderIssueActionDisclosure("LLM enrichment add-on", "Optional explanation", renderIssueLlmEnrichment(actionPlan, issue), { open: state.issueLlmPanelOpen })}
      ${renderIssueActionDisclosure("Evidence", "What happened, why, raw values", renderIssueEvidencePack(issue, parent))}
    </article>
  `;
}

function renderIssueFocusMap(issue, parent) {
  const table = issue.table || "Schema / dataset";
  const columns = Array.isArray(issue.columns) && issue.columns.length ? issue.columns.join(", ") : "Table-level";
  const affectedPercent = Math.min(100, Math.max(0, Number(issue.bad_rate || 0) * 100));
  const affectedWidth = Number(issue.bad_count || 0) > 0 ? Math.max(2, affectedPercent) : 0;
  const parentColumns = Array.isArray(issue.parent_columns) && issue.parent_columns.length ? issue.parent_columns.join(", ") : "key";
  const relationship = isRelationshipIssue(issue) && issue.parent_table
    ? `<span class="issue-focus-link"><code>${escapeHtml(table)}.${escapeHtml(columns)}</code><span>-></span><code>${escapeHtml(issue.parent_table)}.${escapeHtml(parentColumns)}</code></span>`
    : "";
  return `
    <section class="issue-focus-map" aria-label="Selected issue visual focus">
      <div class="issue-focus-location">
        <span>Where</span>
        <strong><code>${escapeHtml(table)}</code></strong>
        <p><code>${escapeHtml(columns)}</code></p>
        ${relationship || (parent ? `<p class="issue-focus-parent">Parent ${parent}</p>` : "")}
      </div>
      <div class="issue-focus-impact">
        <span>Affected rows</span>
        <strong>${integerText(issue.bad_count)} / ${integerText(issue.total_count)}</strong>
        <div class="issue-focus-track" aria-label="${escapeHtml(percentText(issue.bad_rate))} affected">
          <span style="width: ${affectedWidth}%"></span>
        </div>
        <p>${escapeHtml(percentText(issue.bad_rate))} of checked rows</p>
      </div>
      <div class="issue-focus-status">
        <span>Why</span>
        <strong>${escapeHtml(issueScopeLabel(issue))}</strong>
        <p>${escapeHtml(issueTypeLabel(issue))}</p>
      </div>
    </section>
  `;
}

function renderIssueSampleRows(issue) {
  const path = issue.sample_bad_rows_path || "";
  const highlightedColumns = issueHighlightedColumns(issue);
  const sample = path ? state.issueSampleRows[path] : null;
  if (!path) {
    return `
      <section class="issue-row-evidence">
        <div class="issue-row-evidence-heading">
          <div>
            <h5>Row evidence</h5>
            <p>No bounded sample CSV was generated for this issue.</p>
          </div>
        </div>
      </section>
    `;
  }
  if (!sample || sample.status === "loading") {
    return `
      <section class="issue-row-evidence" aria-busy="true">
        <div class="issue-row-evidence-heading">
          <div>
            <h5>Row evidence</h5>
            <p>Loading sample rows from <code>${escapeHtml(path)}</code>...</p>
          </div>
          <span>Previewing sample</span>
        </div>
      </section>
    `;
  }
  if (sample.status === "error" || !sample.rows.length || !sample.headers.length) {
    return `
      <section class="issue-row-evidence">
        <div class="issue-row-evidence-heading">
          <div>
            <h5>Row evidence</h5>
            <p>${escapeHtml(sample.error || "Sample rows were unavailable for this issue.")}</p>
          </div>
          <span>Preview unavailable</span>
        </div>
      </section>
    `;
  }
  return `
    <section class="issue-row-evidence">
      <div class="issue-row-evidence-heading">
        <div>
          <h5>Row evidence</h5>
          <p>Highlighted cells are the issue columns from <code>${escapeHtml(path)}</code>.</p>
        </div>
        <span>Previewing sample</span>
      </div>
      <div class="issue-sample-table-wrap">
        <table class="issue-sample-table">
          <thead>
            <tr>
              <th>Row</th>
              ${sample.headers.map((header) => `
                <th class="${highlightedColumns.has(normalizeColumnKey(header)) ? "highlighted" : ""}">${escapeHtml(header)}</th>
              `).join("")}
            </tr>
          </thead>
          <tbody>
            ${sample.rows.map((row, rowIndex) => `
              <tr>
                <td><strong>${integerText(rowIndex + 1)}</strong></td>
                ${sample.headers.map((header) => {
                  const highlighted = highlightedColumns.has(normalizeColumnKey(header));
                  const value = row[header] ?? "";
                  return `<td class="${highlighted ? "highlighted" : ""}${highlighted && !String(value).trim() ? " missing" : ""}">${escapeHtml(String(value)) || "<span>blank</span>"}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function requestIssueSampleRows(issue) {
  const path = issue.sample_bad_rows_path || "";
  if (!path || state.issueSampleRows[path]) {
    return;
  }
  const url = artifactUrlFor(path);
  if (!url) {
    state.issueSampleRows[path] = {
      status: "error",
      headers: [],
      rows: [],
      error: "Sample artifact URL is unavailable for this run.",
    };
    return;
  }
  state.issueSampleRows[path] = { status: "loading", headers: [], rows: [] };
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Sample CSV request failed with ${response.status}.`);
      }
      return response.text();
    })
    .then((text) => {
      state.issueSampleRows[path] = {
        status: "ready",
        ...parseIssueSampleCsv(text, 3),
      };
    })
    .catch((error) => {
      state.issueSampleRows[path] = {
        status: "error",
        headers: [],
        rows: [],
        error: error.message || "Sample CSV could not be loaded.",
      };
    })
    .finally(() => {
      const selectedIssueId = state.dashboardSelection?.kind === "issue"
        ? state.dashboardSelection.value
        : "";
      if (selectedIssueId === issueGuid(issue)) {
        renderDashboardDrilldown();
      }
    });
}

function parseIssueSampleCsv(text, rowLimit) {
  const records = csvRecords(text, rowLimit + 1);
  const headers = (records[0] || []).map((header) => header.replace(/^\uFEFF/, "").trim());
  const rows = records.slice(1, rowLimit + 1).map((record) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = record[index] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

function csvRecords(text, maxRecords) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      record.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      record.push(field);
      records.push(record);
      if (records.length >= maxRecords) {
        return records;
      }
      record = [];
      field = "";
      continue;
    }
    field += char;
  }
  if (field || record.length) {
    record.push(field);
    records.push(record);
  }
  return records;
}

function issueHighlightedColumns(issue) {
  const columns = Array.isArray(issue.columns) ? issue.columns : [];
  const parentColumns = Array.isArray(issue.parent_columns) ? issue.parent_columns : [];
  return new Set([...columns, ...parentColumns].map(normalizeColumnKey).filter(Boolean));
}

function normalizeColumnKey(value) {
  return String(value || "").trim().toLowerCase();
}

function renderIssueDetailSection(title, body, options = {}) {
  if (options.collapsed) {
    return `
      <details class="issue-detail-section issue-detail-disclosure">
        <summary><h5>${escapeHtml(title)}</h5><span>Show details</span></summary>
        <div class="issue-detail-disclosure-body">
          ${body}
        </div>
      </details>
    `;
  }
  return `
    <section class="issue-detail-section">
      <h5>${escapeHtml(title)}</h5>
      ${body}
    </section>
  `;
}

function renderIssueActionDisclosure(title, subtitle, body, options = {}) {
  return `
    <details class="issue-action-disclosure" ${options.open ? "open" : ""}>
      <summary>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </summary>
      <div class="issue-action-body">
        ${body}
      </div>
    </details>
  `;
}

function renderIssueEvidencePack(issue, parent) {
  return `
    <div class="issue-evidence-pack">
      <section>
        <h5>Where</h5>
        ${renderIssueWhere(issue, parent)}
      </section>
      <section>
        <h5>What happened</h5>
        ${renderIssueWhatHappened(issue)}
      </section>
      <section>
        <h5>Why it matters</h5>
        ${renderIssueWhyItMatters(issue)}
      </section>
      <section>
        <h5>How to fix</h5>
        ${renderIssueHowToFix(issue)}
      </section>
      <section>
        <h5>Raw evidence values</h5>
        ${renderIssueEvidence(issue)}
      </section>
    </div>
  `;
}

function renderIssueWhere(issue, parent) {
  const columns = Array.isArray(issue.columns) && issue.columns.length ? issue.columns.join(", ") : "Table-level";
  return `
    <div class="issue-context-strip">
      <div><span>Table</span><code>${escapeHtml(issue.table || "Schema / dataset")}</code></div>
      <div><span>Column</span><code>${escapeHtml(columns)}</code></div>
      <div><span>Scope</span><strong>${escapeHtml(issueScopeLabel(issue))}</strong></div>
      <div><span>Severity</span><strong>${escapeHtml(issue.severity || "unknown")}</strong></div>
      ${parent ? `<div><span>Parent context</span>${parent}</div>` : ""}
    </div>
  `;
}

function renderIssueWhatHappened(issue) {
  return `
    <p>${escapeHtml(issueWhatHappened(issue))}</p>
    <div class="issue-context-strip">
      <div><span>Issue type</span><code>${escapeHtml(issue.issue_type || "UNKNOWN")}</code></div>
      <div><span>Affected rows</span><strong>${integerText(issue.bad_count)} of ${integerText(issue.total_count)}</strong></div>
      <div><span>Affected rate</span><strong>${percentText(issue.bad_rate)}</strong></div>
    </div>
  `;
}

function renderIssueEvidence(issue) {
  const evidenceValues = issueEvidenceValues(issue);
  return `
    <div class="evidence-value-list">
      ${evidenceValues.map((item) => `
        <div class="evidence-value">
          <span>${escapeHtml(item.label)}</span>
          ${item.url
            ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener"><code>${escapeHtml(item.rawValue)}</code></a>`
            : `<code>${escapeHtml(item.rawValue)}</code>`}
          <p>${escapeHtml(item.meaning)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderIssueWhyItMatters(issue) {
  const causes = Array.isArray(issue.probable_causes) ? issue.probable_causes : [];
  return `
    <p>${escapeHtml(issueImpactText(issue))}</p>
    ${causes.length ? `<ul class="issue-detail-list">${causes.slice(0, 3).map((cause) => `<li>${escapeHtml(cause)}</li>`).join("")}</ul>` : ""}
  `;
}

function renderIssueHowToFix(issue) {
  const fixes = Array.isArray(issue.suggested_fix) ? issue.suggested_fix : [];
  if (!fixes.length) {
    return `<p>Inspect bounded sample rows and update the source pipeline or DBML contract.</p>`;
  }
  return `<ul class="issue-detail-list">${fixes.slice(0, 4).map((fix) => `<li>${escapeHtml(fix)}</li>`).join("")}</ul>`;
}

function renderIssueActionPlan(plan, issue) {
  if (!plan) {
    return `
      <div class="action-plan-human-review">
        <strong>Needs human review</strong>
        <p>issue_action_plans.json is not available for this run. Review ${escapeHtml(issueGuid(issue))} directly in issues.json before assigning fix or verify work.</p>
      </div>
    `;
  }
  const coverage = plan.evidence_coverage || {};
  const actionability = plan.actionability_score || {};
  const evidenceValues = Array.isArray(plan.evidence_values) ? plan.evidence_values : [];
  const sourceValue = plan.source === "deterministic" ? "source=deterministic" : `source=${plan.source || "deterministic"}`;
  return `
    <div class="action-plan">
      ${renderIssueExportControls(plan)}
      <p class="action-plan-summary">${escapeHtml(plan.finding_summary || "Finding summary needs human review.")}</p>
      ${plan.human_review_required ? `
        <div class="action-plan-human-review">
          <strong>Needs human review</strong>
          <p>${escapeHtml(plan.human_review_reason || "Deterministic context is incomplete.")}</p>
        </div>
      ` : ""}
      <div class="issue-fix-todo-grid">
        <div class="action-plan-block">
          <strong>Fix data checklist</strong>
          ${renderActionPlanList(plan.fix_data_checklist, 3)}
        </div>
        <div class="action-plan-block">
          <strong>Verify after fix checklist</strong>
          ${renderActionPlanList(plan.verify_after_fix_checklist, 3)}
        </div>
      </div>
      <details class="issue-detail-disclosure action-plan-more">
        <summary><h5>More deterministic context</h5><span>Metrics, guidelines, finding values</span></summary>
        <div class="issue-detail-disclosure-body">
          <div class="action-plan-metrics" aria-label="Action plan metrics">
            ${renderActionPlanMetric("Priority", plan.priority || "Needs human review", "")}
            ${renderActionPlanMetric("Source", sourceValue, "Generated without LLM enrichment.")}
            ${renderActionPlanMetric(
              "Evidence coverage",
              `${coverage.label || "Unknown"} · ${integerText(coverage.score)}/100`,
              coverage.explanation || "Shows how much expected evidence is present.",
            )}
            ${renderActionPlanMetric(
              "Actionability",
              `${actionability.label || "Unknown"} · ${integerText(actionability.score)}/100`,
              actionability.explanation || "Shows whether this plan has enough context to assign.",
            )}
          </div>
          <div class="action-plan-block">
            <strong>Finding values</strong>
            ${renderActionPlanEvidenceValues(evidenceValues)}
          </div>
          <div class="action-plan-block">
            <strong>Guidelines</strong>
            ${renderActionPlanList(plan.guidelines)}
          </div>
        </div>
      </details>
    </div>
  `;
}

function renderIssueLlmEnrichment(plan, issue) {
  const issueId = issueGuid(issue);
  const provider = ["fake", "openai"].includes(state.issueLlmProvider) ? state.issueLlmProvider : "fake";
  const entry = getIssueLlmEnrichment(issue, provider);
  const running = state.issueLlmRunningIssueId === issueId;
  const status = running ? "pending" : entry?.status || "not_run";
  const message = running
    ? state.issueLlmMessage
    : state.issueLlmMessage || issueLlmMessageForEntry(entry);
  if (!plan) {
    return `
      <div class="issue-llm-enrichment" data-issue-llm-status="unavailable">
        <div class="action-plan-human-review">
          <strong>Human review needed</strong>
          <p>LLM enrichment runs only after a concrete deterministic action plan is available for the selected issue.</p>
        </div>
      </div>
    `;
  }
  return `
    <div class="issue-llm-enrichment" data-issue-llm-status="${escapeHtml(status)}">
      <div class="issue-llm-controls" aria-label="Issue LLM enrichment controls">
        <div class="runner-mode-switch issue-llm-provider-switch" role="group" aria-label="Issue LLM provider">
          <button class="mode-button ${provider === "fake" ? "active" : ""}" type="button" data-issue-llm-provider="fake" aria-pressed="${provider === "fake" ? "true" : "false"}">Fake</button>
          <button class="mode-button ${provider === "openai" ? "active" : ""}" type="button" data-issue-llm-provider="openai" aria-pressed="${provider === "openai" ? "true" : "false"}">OpenAI</button>
        </div>
        <button class="button secondary compact" type="button" data-issue-llm-run data-issue-id="${escapeHtml(issueId)}" ${running ? "disabled" : ""}>
          ${entry ? "Retry enrichment" : "Run LLM enrichment"}
        </button>
      </div>
      <p class="form-message issue-llm-message" data-status="${escapeHtml(state.issueLlmMessageStatus || issueLlmStatusToMessageStatus(status))}" role="status">${escapeHtml(message)}</p>
      ${renderIssueLlmStructuredResponse(entry, provider)}
    </div>
  `;
}

function renderIssueLlmStructuredResponse(entry, provider) {
  if (!entry) {
    return `
      <div class="issue-llm-result empty">
        <p class="muted">No ${escapeHtml(issueLlmProviderLabel(provider))} enrichment has been generated for this selected issue.</p>
      </div>
    `;
  }
  const response = entry.structured_response || {};
  const review = response.human_review_needed || {};
  const status = entry.status || "unknown";
  const errorText = entry.error?.message ? ` ${entry.error.message}` : "";
  return `
    <div class="issue-llm-result" data-issue-llm-result-status="${escapeHtml(status)}">
      <div class="issue-llm-result-heading">
        <strong>${escapeHtml(issueLlmProviderLabel(entry.provider || provider))} result</strong>
        <span class="pill-status ${issueLlmStatusClass(status)}">${escapeHtml(status)}</span>
      </div>
      ${renderIssueLlmSection("Why this was flagged", response.why_this_was_flagged)}
      ${renderIssueLlmSection("Extra fix suggestion", response.extra_fix_suggestion)}
      ${renderIssueLlmSection("Extra verification", response.extra_verification)}
      <div class="issue-llm-review">
        <strong>Human review needed</strong>
        <p>${escapeHtml(review.reason || "Human review is required before using this advisory LLM enrichment.")}${escapeHtml(errorText)}</p>
      </div>
      <p class="issue-llm-footnote">Deterministic action plans remain the source of truth.</p>
    </div>
  `;
}

function renderIssueLlmSection(title, items) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return `
    <div class="issue-llm-section">
      <strong>${escapeHtml(title)}</strong>
      ${list.length
        ? `<ul class="issue-detail-list">${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : `<p class="muted">No LLM guidance was generated for this section.</p>`}
    </div>
  `;
}

function renderIssueExportControls(plan) {
  const issueId = plan.issue_id || "UNKNOWN";
  return `
    <div class="issue-export-controls" aria-label="Issue action-plan export controls">
      <button class="button secondary compact" type="button" data-action-plan-export="markdown" data-issue-id="${escapeHtml(issueId)}">Copy Markdown</button>
      <button class="button secondary compact" type="button" data-action-plan-export="csv" data-issue-id="${escapeHtml(issueId)}">Copy CSV row</button>
      <button class="button secondary compact" type="button" data-action-plan-export="json" data-issue-id="${escapeHtml(issueId)}">Copy JSON</button>
      <span class="issue-export-status" data-action-plan-export-status aria-live="polite"></span>
    </div>
  `;
}

async function handleIssueActionPlanExport(target) {
  const issueId = target.dataset.issueId || "";
  const format = target.dataset.actionPlanExport || "";
  const plan = getIssueActionPlans().find((candidate) => candidate.issue_id === issueId);
  if (!plan) {
    setIssueExportStatus("Action plan is unavailable for export.", "error");
    return;
  }
  const formatters = {
    markdown: issueActionPlanMarkdown,
    csv: issueActionPlanCsvRow,
    json: issueActionPlanJson,
  };
  const formatter = formatters[format];
  if (!formatter) {
    setIssueExportStatus("Unknown export format.", "error");
    return;
  }
  try {
    await copyText(formatter(plan));
    const labels = { markdown: "Markdown", csv: "CSV row", json: "JSON" };
    setIssueExportStatus(`Copied ${labels[format]} for ${issueId}.`, "success");
  } catch (error) {
    setIssueExportStatus("Copy failed in this browser.", "error");
  }
}

function setIssueExportStatus(message, status) {
  const statusElement = els.dashboardDrilldown.querySelector("[data-action-plan-export-status]");
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message;
  statusElement.dataset.status = status;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Fall back to the synchronous copy path below for local browser runs.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("copy failed");
  }
}

function issueActionPlanMarkdown(plan) {
  const lines = [
    `# ${plan.issue_id || "UNKNOWN"} ${plan.issue_type || "Issue"}`,
    "",
    `- Priority: ${plan.priority || "Needs human review"}`,
    `- Source: ${plan.source || "deterministic"}`,
    `- Table: ${plan.table || "unknown"}`,
    `- Columns: ${arrayOfStrings(plan.columns).join(", ") || "table scope"}`,
    "",
    "## Finding",
    plan.finding_summary || "Finding summary needs human review.",
    "",
    "## Fix data checklist",
    ...actionPlanMarkdownItems(plan.fix_data_checklist),
    "",
    "## Verify after fix checklist",
    ...actionPlanMarkdownItems(plan.verify_after_fix_checklist),
    "",
    "## Guidelines",
    ...actionPlanMarkdownItems(plan.guidelines),
  ];
  return lines.join("\n");
}

function actionPlanMarkdownItems(items) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return list.length ? list.map((item) => `- ${item}`) : ["- Needs human review."];
}

function issueActionPlanCsvRow(plan) {
  const columns = [
    "issue_id",
    "issue_type",
    "priority",
    "table",
    "columns",
    "source",
    "finding_summary",
    "fix_data_checklist",
    "verify_after_fix_checklist",
  ];
  const row = [
    plan.issue_id || "",
    plan.issue_type || "",
    plan.priority || "",
    plan.table || "",
    arrayOfStrings(plan.columns).join("|"),
    plan.source || "deterministic",
    plan.finding_summary || "",
    arrayOfStrings(plan.fix_data_checklist).join("|"),
    arrayOfStrings(plan.verify_after_fix_checklist).join("|"),
  ];
  return `${columns.join(",")}\n${row.map(csvCell).join(",")}`;
}

function issueActionPlanJson(plan) {
  return JSON.stringify(plan, null, 2);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function renderActionPlanMetric(label, value, explanation) {
  return `
    <div class="action-plan-metric" title="${escapeHtml(explanation || label)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${explanation ? `<small>${escapeHtml(explanation)}</small>` : ""}
    </div>
  `;
}

function renderActionPlanEvidenceValues(values) {
  if (!values.length) {
    return `<p class="muted">No deterministic finding values were available.</p>`;
  }
  return `
    <div class="evidence-value-list action-plan-values">
      ${values.map((item) => {
        const rawValue = actionPlanRawValue(item);
        const artifactPath = String(item.artifact || "");
        const url = artifactPath && !artifactPath.endsWith(".json") ? artifactUrlFor(artifactPath) : "";
        return `
          <div class="evidence-value">
            <span>${escapeHtml(item.label || "Value")}</span>
            ${url
              ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener"><code>${escapeHtml(rawValue)}</code></a>`
              : `<code>${escapeHtml(rawValue)}</code>`}
            <p>${escapeHtml(item.meaning || "Deterministic evidence value.")}</p>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderActionPlanList(items, limit = 6) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) {
    return `<p class="muted">Needs human review before todos can be assigned.</p>`;
  }
  return `<ul class="issue-detail-list">${list.slice(0, limit).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function actionPlanRawValue(item) {
  const value = item?.raw_value ?? item?.rawValue ?? "";
  if (typeof value === "number") {
    return Number.isInteger(value) ? integerText(value) : String(value);
  }
  return String(value);
}

function issueEvidenceValues(issue) {
  const values = [
    {
      label: "Issue guid",
      rawValue: issueGuid(issue),
      meaning: "Stable short identifier for this generated finding.",
    },
    {
      label: "Bad rows",
      rawValue: integerText(issue.bad_count),
      meaning: "Rows that matched the issue evidence query.",
    },
    {
      label: "Affected rate",
      rawValue: percentText(issue.bad_rate),
      meaning: "Share of profiled table rows affected by this finding.",
    },
    {
      label: "Total rows checked",
      rawValue: integerText(issue.total_count),
      meaning: "Rows included in the profiler check for this issue.",
    },
  ];
  if (Array.isArray(issue.sample_keys) && issue.sample_keys.length) {
    values.push({
      label: "Sample keys",
      rawValue: issue.sample_keys.slice(0, 5).join(", "),
      meaning: "Bounded examples from the generated sample evidence.",
    });
  }
  if (issue.sample_bad_rows_path) {
    values.push({
      label: "Sample rows",
      rawValue: issue.sample_bad_rows_path,
      meaning: "Generated bounded sample CSV for concrete row evidence.",
      url: artifactUrlFor(issue.sample_bad_rows_path),
    });
  }
  if (issue.evidence_sql) {
    values.push({
      label: "Evidence query",
      rawValue: truncateMiddle(issue.evidence_sql, 96),
      meaning: "SQL predicate used by the profiler to count affected rows.",
    });
  }
  if (issue.parent_table) {
    values.push({
      label: "Parent table",
      rawValue: `${issue.parent_table}.${(issue.parent_columns || []).join(", ") || "key"}`,
      meaning: "Referenced parent side for this relationship check.",
    });
  }
  return values;
}

function issuePrimaryColumn(issue) {
  if (!Array.isArray(issue.columns) || !issue.columns.length || issueScopeKind(issue) === "table") {
    return "__table__";
  }
  return issue.columns[0];
}

function issueColumnLabel(issue, key) {
  if (key === "__table__") {
    return "Schema/table-level checks";
  }
  if (isRelationshipIssue(issue)) {
    return `${key} (FK child column)`;
  }
  if (Array.isArray(issue.columns) && issue.columns.length > 1) {
    return issue.columns.join(", ");
  }
  return key;
}

function issueRowContext(issue, tableName, column) {
  if (isRelationshipIssue(issue) && issue.parent_table) {
    const childColumn = Array.isArray(issue.columns) ? issue.columns.join(", ") : column.label;
    const parentColumns = Array.isArray(issue.parent_columns) ? issue.parent_columns.join(", ") : "key";
    return `${tableName}.${childColumn} -> ${issue.parent_table}.${parentColumns}`;
  }
  if (isOutlierIssue(issue)) {
    return "Review warning for numeric extremes";
  }
  return column.key === "__table__" ? "Schema/table-level issue" : `${tableName}.${column.label}`;
}

function issueWhatHappened(issue) {
  if (isOutlierIssue(issue)) {
    return "Review warning: values fell outside the profiled IQR fence and should be checked before treating them as defects.";
  }
  if (isRelationshipIssue(issue)) {
    return "Relationship check found rows that may make joins incomplete, duplicated, or unreliable.";
  }
  if (issueScopeKind(issue) === "table") {
    return "Schema or table-level contract evidence needs review before this table is treated as clean.";
  }
  return "Column-level data-quality evidence violated the DBML or profiler rule for this field.";
}

function issueImpactText(issue) {
  if (isOutlierIssue(issue)) {
    return "Outliers can be valid business events, but they should be reviewed before they drive analysis or reporting.";
  }
  if (isRelationshipIssue(issue)) {
    return "Relationship issues can hide records, create duplicate joins, or make downstream table comparisons unreliable.";
  }
  if (["PRIMARY_KEY_NULL", "DUPLICATE_PRIMARY_KEY", "PARENT_KEY_DUPLICATE"].includes(issue.issue_type)) {
    return "Key issues can break entity identity and make joins or deduplication unsafe.";
  }
  if (issueScopeKind(issue) === "table") {
    return "Table-level contract issues can make the dataset incomplete before column-level checks begin.";
  }
  return "This issue can reduce trust in analysis that depends on the affected table or column.";
}

function issueParentContext(issue) {
  if (!issue.parent_table) {
    return "";
  }
  const parentColumns = Array.isArray(issue.parent_columns) && issue.parent_columns.length
    ? issue.parent_columns.join(", ")
    : "key";
  return `<code>${escapeHtml(issue.parent_table)}.${escapeHtml(parentColumns)}</code>`;
}

function issueScopeKind(issue) {
  if (["TABLE_MISSING", "TABLE_EXTRA", "SCHEMA_PARSE_WARNING"].includes(issue.issue_type)) {
    return "table";
  }
  if (!Array.isArray(issue.columns) || !issue.columns.length) {
    return "table";
  }
  return "column";
}

function issueScopeLabel(issue) {
  if (issueScopeKind(issue) === "table") {
    return "Schema/table-level";
  }
  if (isRelationshipIssue(issue)) {
    return "Relationship/FK child column";
  }
  return "Column-level";
}

function issueGuid(issue) {
  return issue.issue_id || "ISSUE";
}

function issueTypeLabel(issue) {
  if (isOutlierIssue(issue)) {
    return "Review warning: numeric outlier";
  }
  return issueTypeText(issue.issue_type || "UNKNOWN");
}

function issueTypeText(value) {
  return String(value || "UNKNOWN").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function issueStatus(issue) {
  if (isOutlierIssue(issue)) {
    return "Needs Review";
  }
  if (["P0", "P1"].includes(issue.severity)) {
    return "Blocked";
  }
  if (issue.severity === "P2") {
    return "Needs Review";
  }
  if (issue.severity === "P3") {
    return "Usable With Caution";
  }
  return "Needs Review";
}

function statusFromReadiness(readiness) {
  if (readiness === "READY") {
    return "Clean";
  }
  if (readiness === "WARN") {
    return "Usable With Caution";
  }
  if (readiness === "NOT_READY") {
    return "Blocked";
  }
  return "Needs Review";
}

function issueStatusOrder(status) {
  return {
    Blocked: 0,
    "Needs Review": 1,
    "Usable With Caution": 2,
    Clean: 3,
  }[status] ?? 4;
}

function issueStatusClass(status) {
  if (status === "Blocked") {
    return "failed";
  }
  if (status === "Needs Review") {
    return "missing";
  }
  if (status === "Usable With Caution") {
    return "extra";
  }
  return "mapped";
}

function isRelationshipIssue(issue) {
  return new Set([
    "ORPHAN_FOREIGN_KEY",
    "PARENT_KEY_DUPLICATE",
    "FOREIGN_KEY_NULL",
    "CHILD_RELATIONSHIP_DUPLICATE",
  ]).has(issue.issue_type);
}

function isOutlierIssue(issue) {
  return issue.issue_type === "NUMERIC_OUTLIER";
}

function renderL4GuardrailDetails(selection) {
  if (!selection || selection.kind !== "l4_guardrail") {
    return "";
  }
  const guardrail = getL4Guardrail();
  if (!Object.keys(guardrail).length) {
    return `<p class="muted">Guardrail metadata is not loaded.</p>`;
  }
  const checkedNumbers = Array.isArray(guardrail.checked_numbers) ? guardrail.checked_numbers.length : 0;
  const checkedRefs = Array.isArray(guardrail.checked_refs) ? guardrail.checked_refs.length : 0;
  const violations = Array.isArray(guardrail.violations) ? guardrail.violations : [];
  const model = guardrail.model || guardrail.model_config?.model || "";
  return `
    <div class="table-assessment-detail">
      <div>
        <strong>LLM guardrail</strong>
        <p>${escapeHtml(guardrail.provider || "unknown")}${model ? ` · ${escapeHtml(model)}` : ""}</p>
      </div>
      <span class="pill-status ${guardrailStatusClass(guardrail.status)}">${escapeHtml(guardrail.status || "unknown")}</span>
      <dl class="graph-metadata">
        <div><dt>checked_numbers</dt><dd>${integerText(checkedNumbers)}</dd></div>
        <div><dt>checked_refs</dt><dd>${integerText(checkedRefs)}</dd></div>
        <div><dt>violations</dt><dd>${integerText(violations.length)}</dd></div>
        <div><dt>fallback_reason</dt><dd>${escapeHtml(guardrail.fallback_reason || "none")}</dd></div>
        <div><dt>raw_csv_included</dt><dd>${escapeHtml(String(Boolean(guardrail.raw_csv_included)))}</dd></div>
      </dl>
    </div>
  `;
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
        <div><dt>health_score</dt><dd>${integerText(assessment.health_score)}/100</dd></div>
        <div><dt>analysis_impact</dt><dd>${escapeHtml(impact.category || "general_analytics")}</dd></div>
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
    paths.add("table_assessments.json");
    paths.add(dashboardChartPaths.missingTable);
    paths.add(dashboardChartPaths.missingColumns);
  }
  if (selection?.kind === "table_assessment") {
    paths.add("table_assessments.json");
    paths.add("profile_summary.json");
    paths.add("relationship_graph.json");
  }
  if (selection?.kind === "numeric_outlier") {
    paths.add("profile_summary.json");
    paths.add(dashboardChartPaths.outliers);
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
  if (selection?.kind === "l4_guardrail") {
    paths.add("l4_report.md");
    paths.add("guardrail_report.json");
  }
  if (selection?.kind === "issue" && getIssueLlmArtifact()) {
    paths.add("issue_llm_enrichments.json");
  }
  return [...paths].filter((path) => artifactUrlFor(path));
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

function getIssueActionPlans() {
  const artifact = state.dashboardArtifacts["issue_action_plans.json"];
  return Array.isArray(artifact?.plans) ? artifact.plans : [];
}

function getIssueActionPlan(issue) {
  const issueId = issueGuid(issue);
  return getIssueActionPlans().find((plan) => plan.issue_id === issueId) || null;
}

function getIssueLlmArtifact() {
  const artifact = state.dashboardArtifacts["issue_llm_enrichments.json"];
  return artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact : null;
}

function getIssueLlmEnrichments() {
  const artifact = getIssueLlmArtifact();
  return Array.isArray(artifact?.enrichments) ? artifact.enrichments : [];
}

function getIssueLlmEnrichment(issue, provider = state.issueLlmProvider) {
  const issueId = issueGuid(issue);
  const enrichments = getIssueLlmEnrichments();
  for (let index = enrichments.length - 1; index >= 0; index -= 1) {
    const entry = enrichments[index];
    if (entry.issue_id === issueId && entry.provider === provider) {
      return entry;
    }
  }
  return null;
}

function getIssueTodosArtifact() {
  const artifact = state.dashboardArtifacts["issue_todos.json"];
  return artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact : null;
}

function getQualityGatesArtifact() {
  const artifact = state.dashboardArtifacts["quality_gates.json"];
  return artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact : null;
}

function getL4Guardrail() {
  const artifact = state.dashboardArtifacts["guardrail_report.json"];
  return artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact : {};
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
    "lineage_graph.json": "Runtime artifact context",
    "profile_summary.json": "Profile summary",
    "relationship_graph.json": "Relationship graph",
    "dataset_verdict.json": "Data-quality readiness",
    "table_assessments.json": "Table assessments",
    "issue_action_plans.json": "Issue action plans",
    "issue_llm_enrichments.json": "Issue LLM enrichments",
    "issue_todos.json": "Issue todos",
    "quality_gates.json": "Quality gates",
    "schema_evaluation.json": "Schema evaluation",
    "influence.json": "Legacy association artifact",
    "run_summary.json": "Run summary",
    "l4_report.md": "Optional LLM report",
    "guardrail_report.json": "Guardrail report",
  };
  return labels[path] || path.replace(/^charts\//, "Chart: ");
}

function issueLlmProviderLabel(provider) {
  return provider === "openai" ? "OpenAI" : "Fake";
}

function issueLlmMessageForEntry(entry) {
  if (!entry) {
    return "Run issue-level LLM enrichment after reviewing the deterministic action plan.";
  }
  if (entry.status === "succeeded") {
    return `${issueLlmProviderLabel(entry.provider)} enrichment ready for ${entry.issue_id}.`;
  }
  if (entry.status === "unavailable") {
    return entry.error?.message || "Selected provider is unavailable. Human review is required.";
  }
  if (entry.status === "invalid") {
    return "LLM output failed the structured guardrail. Human review is required.";
  }
  return entry.error?.message || "Issue LLM enrichment failed. Human review is required.";
}

function issueLlmStatusToMessageStatus(status) {
  if (status === "succeeded") {
    return "success";
  }
  if (status === "pending") {
    return "pending";
  }
  return ["failed", "invalid", "unavailable"].includes(status) ? "error" : "";
}

function issueLlmStatusClass(status) {
  if (status === "succeeded") {
    return "manual";
  }
  if (["failed", "invalid", "unavailable"].includes(status)) {
    return "failed";
  }
  return "ambiguous";
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

function guardrailStatusClass(status) {
  if (status === "passed") {
    return "mapped";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status === "fallback_used") {
    return "missing";
  }
  return "extra";
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
      "Upload DBML to preview schema",
      "The local preview renders from the current browser DBML state. Use custom files or the sample DBML + CSV demo.",
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
  const disabled = !model.hasInput || Boolean(model.error);
  els.diagramFitButton.setAttribute("aria-pressed", state.diagramFit ? "true" : "false");
  els.diagramZoomValue.textContent = state.diagramFit ? "Fit" : `${Math.round(state.diagramZoom * 100)}%`;
  els.diagramColumnsToggle.setAttribute("aria-pressed", state.diagramShowNonKey ? "true" : "false");
  els.diagramColumnsToggle.textContent = state.diagramShowNonKey ? "Hide full columns" : "Show all columns";
  els.diagramResetSelection.disabled = !state.diagramSelection && state.diagramManualPositions.size === 0;
  els.diagramFitButton.disabled = disabled;
  els.diagramZoomOutButton.disabled = disabled || (!state.diagramFit && state.diagramZoom <= 0.5);
  els.diagramZoomInButton.disabled = disabled || (!state.diagramFit && state.diagramZoom >= 2);
}

function buildDiagramModel() {
  const schemaDiagram = state.dashboardArtifacts["schema_diagram.json"];
  const relationshipGraph = state.dashboardArtifacts["relationship_graph.json"];
  const parseReport = state.dashboardArtifacts["schema_parse_report.json"];
  if (schemaDiagram || relationshipGraph) {
    return buildArtifactDiagramModel(schemaDiagram || {}, relationshipGraph || {}, parseReport || null);
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

function buildArtifactDiagramModel(schemaDiagram, relationshipGraph, parseReport) {
  const schemaTables = Array.isArray(schemaDiagram.tables) ? schemaDiagram.tables : [];
  const graphNodes = Array.isArray(relationshipGraph.nodes) ? relationshipGraph.nodes : [];
  const graphEdges = Array.isArray(relationshipGraph.edges) ? relationshipGraph.edges : [];
  const graphNodeByTable = new Map(graphNodes.map((node) => [String(node.table || ""), node]));
  const parseTableByName = new Map(
    (parseReport?.objects?.tables || []).map((table) => [String(table.name || ""), table]),
  );
  const tableNames = uniqueSorted([
    ...schemaTables.map((table) => table.table).filter(Boolean),
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
      label: edge.status || edge.cardinality || "FK",
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
      label: rel.declared_cardinality || rel.relationship_type || "FK",
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
      const graphNode = graphNodeByTable.get(tableName) || {};
      const parsedTable = parseTableByName.get(tableName) || {};
      return {
        name: tableName,
        status: graphNode.status || schemaTable.status || "mapped",
        csvPath: graphNode.csv_path || schemaTable.csv_path || "",
        rowCount: graphNode.row_count ?? null,
        columnCount: graphNode.column_count ?? schemaTable.column_count ?? 0,
        primaryKey: arrayOfStrings(graphNode.primary_key || schemaTable.primary_key || parsedTable.primary_key),
        columns: diagramColumnsFromArtifacts(schemaTable, graphNode, parsedTable),
      };
    }),
    relationships: relationships.filter((rel) => rel.childTable && rel.parentTable),
  };
}

function diagramColumnsFromArtifacts(schemaTable, graphNode, parsedTable = {}) {
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
  arrayOfStrings(graphNode.primary_key || schemaTable.primary_key).forEach((columnName) => {
    const column = ensureColumn(columnName);
    if (column) {
      column.isPk = true;
    }
  });
  const foreignKeys = [
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
  const zoom = state.diagramFit ? 1 : state.diagramZoom;
  els.diagramSvg.style.width = state.diagramFit ? "100%" : `${Math.round(layout.width * zoom)}px`;
  els.diagramSvg.style.height = state.diagramFit ? "100%" : `${Math.round(layout.height * zoom)}px`;
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
  const nodeWidth = state.diagramExpanded ? 236 : 204;
  const xGap = state.diagramExpanded ? 92 : 76;
  const yGap = state.diagramExpanded ? 30 : 24;
  const margin = 24;
  const topMargin = 36;
  const tableRecords = model.tables.map((table) => {
    const role = diagramTableRole(table, graph);
    const columnSet = diagramVisibleColumns(table);
    const rowCount = Math.max(columnSet.visible.length, columnSet.hiddenCount ? columnSet.visible.length + 1 : columnSet.visible.length, 1);
    return {
      table,
      role,
      degree: role.degree,
      visibleColumns: columnSet.visible,
      hiddenCount: columnSet.hiddenCount,
      totalColumns: columnSet.totalColumns,
      width: nodeWidth,
      height: Math.max(state.diagramExpanded ? 154 : 132, DIAGRAM_COLUMN_START_Y + Math.max(rowCount - 1, 0) * DIAGRAM_COLUMN_ROW_HEIGHT + 26),
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
  const maxLayerHeight = Math.max(320, ...layerHeights);
  const width = Math.max(760, margin * 2 + layerCount * nodeWidth + Math.max(layerCount - 1, 0) * xGap);
  const height = Math.max(380, topMargin + margin + maxLayerHeight);
  const positions = new Map();
  [...layers.entries()].forEach(([layer, records]) => {
    const layerHeight = records.reduce((total, record) => total + record.height, 0) + Math.max(records.length - 1, 0) * yGap;
    let y = topMargin + (maxLayerHeight - layerHeight) / 2;
    records.forEach((record) => {
      const columnY = new Map();
      record.visibleColumns.forEach((column, index) => {
        columnY.set(column.name, y + diagramColumnBaseline(index));
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
  applyDiagramManualPositions(positions, tableRecords, width, height);
  const selection = diagramSelectionContext(model);
  return { width, height, positions, tableRecords, graph, selection, topMargin };
}

function applyDiagramManualPositions(positions, tableRecords, layoutWidth, layoutHeight) {
  tableRecords.forEach((record) => {
    const manual = state.diagramManualPositions.get(record.table.name);
    const position = positions.get(record.table.name);
    if (!manual || !position) {
      return;
    }
    const nextPosition = clampDiagramPosition(manual.x, manual.y, position.width, position.height, layoutWidth, layoutHeight);
    position.x = nextPosition.x;
    position.y = nextPosition.y;
    record.visibleColumns.forEach((column, index) => {
      position.columnY.set(column.name, position.y + diagramColumnBaseline(index));
    });
  });
}

function diagramColumnBaseline(index) {
  return DIAGRAM_COLUMN_START_Y + index * DIAGRAM_COLUMN_ROW_HEIGHT;
}

function clampDiagramPosition(x, y, width, height, layoutWidth, layoutHeight) {
  const min = 8;
  return {
    x: Math.max(min, Math.min(Number(x || 0), Math.max(min, layoutWidth - width - min))),
    y: Math.max(min, Math.min(Number(y || 0), Math.max(min, layoutHeight - height - min))),
  };
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
  const hasFactName = /(order|event|transaction|payment|review|fact|activity|log|history)/.test(name);
  const keyColumns = (table.columns || []).filter((column) => column.isPk || column.isFk);
  const fkKeyCount = keyColumns.filter((column) => column.isFk).length;
  if (outgoing.length >= 2 || (hasBridgeName && outgoing.length > 0) || (fkKeyCount >= 2 && incoming.length <= 1)) {
    return { name: "bridge", label: "Bridge", layer: 1, degree, incoming: incoming.length, outgoing: outgoing.length };
  }
  if ((outgoing.length === 0 && incoming.length > 0) || (hasReferenceName && outgoing.length <= 1 && incoming.length >= 0)) {
    return { name: "reference", label: "Reference", layer: 0, degree, incoming: incoming.length, outgoing: outgoing.length };
  }
  if (incoming.length >= 2 || (hasFactName && incoming.length > 0)) {
    return { name: "hub", label: "Fact/event", layer: 2, degree, incoming: incoming.length, outgoing: outgoing.length };
  }
  if (outgoing.length > 0) {
    return { name: "child", label: "Child/detail", layer: 3, degree, incoming: incoming.length, outgoing: outgoing.length };
  }
  return { name: "isolated", label: "Schema table", layer: 1, degree, incoming: incoming.length, outgoing: outgoing.length };
}

function diagramVisibleColumns(table) {
  const allColumns = (table.columns || []).filter((column) => !column.summary);
  const totalColumns = Number(table.columnCount || allColumns.length || 0);
  const keyColumns = allColumns.filter((column) => column.isPk || column.isFk || column.isUnique);
  if (state.diagramShowNonKey) {
    return { visible: allColumns, hiddenCount: Math.max(totalColumns - allColumns.length, 0), totalColumns };
  }
  const candidates = keyColumns;
  const limit = state.diagramExpanded ? 8 : 5;
  const visible = candidates.slice(0, limit);
  const hiddenCount = Math.max(totalColumns - visible.length, 0);
  return { visible, hiddenCount, totalColumns };
}

function diagramRelationshipSvg(rel, layout, index) {
  const positions = layout.positions;
  const child = positions.get(rel.childTable);
  const parent = positions.get(rel.parentTable);
  if (!child || !parent) {
    return "";
  }
  const childColumn = (rel.childColumns || [])[0] || "";
  const parentColumn = (rel.parentColumns || [])[0] || "";
  const geometry = diagramRelationshipGeometry(child, parent, childColumn, parentColumn, index);
  const label = `${rel.childTable}.${(rel.childColumns || []).join(",")} -> ${rel.parentTable}.${(rel.parentColumns || []).join(",")}`;
  const statusLabel = rel.status || rel.cardinality || rel.relationshipType || "";
  const directionLabel = `${rel.parentTable}.${(rel.parentColumns || []).join(",")} one-to-many ${rel.childTable}.${(rel.childColumns || []).join(",")}${statusLabel ? ` · ${statusLabel}` : ""}`;
  const selectionClass = diagramRelationshipSelectionClass(rel, layout.selection);
  return `
    <g class="diagram-relationship diagram-relationship-${escapeHtml(diagramStatusTone(rel.status))} ${selectionClass}" data-diagram-relationship="${escapeHtml(rel.id)}" data-diagram-child-table="${escapeHtml(rel.childTable)}" data-diagram-parent-table="${escapeHtml(rel.parentTable)}" data-diagram-child-column="${escapeHtml(childColumn)}" data-diagram-parent-column="${escapeHtml(parentColumn)}" data-diagram-edge-index="${index}" tabindex="0" role="button" aria-label="${escapeHtml(directionLabel)}">
      <title>${escapeHtml(directionLabel)}</title>
      <path class="diagram-edge-hit" d="${geometry.path}"></path>
      <path class="diagram-edge" d="${geometry.path}"></path>
      <path class="diagram-edge-flow" d="${geometry.path}"></path>
      <path class="diagram-cardinality-glyph diagram-cardinality-one" d="${geometry.parentOnePath}"></path>
      <path class="diagram-cardinality-glyph diagram-cardinality-many" d="${geometry.childManyPath}"></path>
      <text class="diagram-edge-label" x="${geometry.labelX}" y="${geometry.labelY}">one-to-many</text>
    </g>
  `;
}

function diagramRelationshipGeometry(child, parent, childColumn, parentColumn, index) {
  const sameLayer = child.layer === parent.layer;
  const childY = child.columnY?.get(childColumn) || child.y + 80;
  const parentY = parent.columnY?.get(parentColumn) || parent.y + 80;
  const childIsLeft = child.x < parent.x;
  const childX = sameLayer ? child.x + child.width : childIsLeft ? child.x + child.width : child.x;
  const parentX = sameLayer ? parent.x + parent.width : childIsLeft ? parent.x : parent.x + parent.width;
  const offset = 24 + (index % 4) * 8;
  const direction = childX >= parentX ? 1 : -1;
  let path;
  let labelX;
  let labelY;
  let parentSegmentDirection;
  let childSegmentDirection;
  if (sameLayer) {
    const routeX = Math.max(child.x + child.width, parent.x + parent.width) + offset;
    path = `M ${parentX} ${parentY} L ${routeX} ${parentY} L ${routeX} ${childY} L ${childX} ${childY}`;
    labelX = routeX + 8;
    labelY = (childY + parentY) / 2 - 6;
    parentSegmentDirection = routeX >= parentX ? 1 : -1;
    childSegmentDirection = childX >= routeX ? 1 : -1;
  } else {
    const layerDistance = Math.max(Math.abs(child.layer - parent.layer), 1);
    const spread = layerDistance > 1 ? (index % 3 - 1) * 10 : 0;
    const midX = (childX + parentX) / 2 + spread;
    path = `M ${parentX} ${parentY} L ${midX} ${parentY} L ${midX} ${childY} L ${childX} ${childY}`;
    labelX = midX + direction * 8;
    labelY = (childY + parentY) / 2 - 6;
    parentSegmentDirection = midX >= parentX ? 1 : -1;
    childSegmentDirection = childX >= midX ? 1 : -1;
  }
  const parentOneX = parentX + parentSegmentDirection * 9;
  const childForkX = childX - childSegmentDirection * 12;
  const childTipX = childX - childSegmentDirection * 2;
  return {
    path,
    x1: childX,
    y1: childY,
    x2: parentX,
    y2: parentY,
    childX,
    childY,
    parentX,
    parentY,
    parentOnePath: `M ${parentOneX} ${parentY - 7} L ${parentOneX} ${parentY + 7}`,
    childManyPath: `M ${childForkX} ${childY} L ${childTipX} ${childY - 7} M ${childForkX} ${childY} L ${childTipX} ${childY} M ${childForkX} ${childY} L ${childTipX} ${childY + 7}`,
    labelX,
    labelY,
  };
}

function diagramTableSvg(record, position, selection) {
  const table = record.table;
  if (!position) {
    return "";
  }
  const columns = record.visibleColumns;
  const lines = columns.map((column, index) => diagramColumnRowSvg(column, diagramColumnBaseline(index), position.width)).join("");
  const overflowLine = record.hiddenCount ? diagramOverflowColumnRow(record.hiddenCount, diagramColumnBaseline(columns.length), position.width) : "";
  const sizeLabel = table.rowCount !== null && table.rowCount !== undefined ? `${integerText(table.rowCount)} rows` : `${integerText(record.totalColumns)} cols`;
  const roleLabel = diagramCompactRoleLabel(record.role.label);
  const statusLabel = table.status === "missing_csv" ? "miss" : table.status === "mapped" ? "ok" : table.status || "db";
  const selectionClass = diagramTableSelectionClass(table.name, selection);
  return `
    <g class="diagram-table diagram-table-${escapeHtml(diagramStatusTone(table.status))} diagram-role-${escapeHtml(record.role.name)} ${selectionClass}" data-diagram-table="${escapeHtml(table.name)}" data-diagram-layer="${position.layer}" transform="translate(${position.x} ${position.y})" tabindex="0" role="button" aria-label="${escapeHtml(`${table.name} table`)}">
      <title>${escapeHtml(`${table.name} · ${record.role.label} · ${sizeLabel}`)}</title>
      <rect class="diagram-table-box" width="${position.width}" height="${position.height}" rx="8"></rect>
      <rect class="diagram-table-header" width="${position.width}" height="${DIAGRAM_TABLE_HEADER_HEIGHT}" rx="8"></rect>
      <text class="diagram-table-name" x="14" y="25">${escapeHtml(truncateMiddle(table.name, position.width > 220 ? 24 : 20))}</text>
      <rect class="diagram-status-chip" x="${position.width - 54}" y="14" width="40" height="18" rx="9"></rect>
      <text class="diagram-status-text" x="${position.width - 34}" y="26" text-anchor="middle">${escapeHtml(statusLabel)}</text>
      ${diagramTableMetricPill(12, DIAGRAM_TABLE_PILL_Y, 72, roleLabel, "role")}
      ${diagramTableMetricPill(90, DIAGRAM_TABLE_PILL_Y, Math.max(82, position.width - 102), sizeLabel, "size")}
      ${lines || diagramEmptyColumnRow(DIAGRAM_COLUMN_START_Y, position.width)}
      ${overflowLine}
    </g>
  `;
}

function diagramTableMetricPill(x, y, width, label, kind) {
  return `
    <g class="diagram-table-metric diagram-table-metric-${escapeHtml(kind)}">
      <rect class="diagram-table-metric-bg" x="${x}" y="${y}" width="${width}" height="18" rx="9"></rect>
      <text class="diagram-table-metric-text" x="${x + width / 2}" y="${DIAGRAM_TABLE_PILL_TEXT_Y}" text-anchor="middle">${escapeHtml(truncateMiddle(label, Math.max(5, Math.floor(width / 7))))}</text>
    </g>
  `;
}

function diagramCompactRoleLabel(label) {
  const normalized = String(label || "");
  if (normalized === "Reference") {
    return "Ref";
  }
  if (normalized === "Fact/event") {
    return "Fact";
  }
  if (normalized === "Child/detail") {
    return "Child";
  }
  if (normalized === "Schema table") {
    return "Table";
  }
  return normalized || "Table";
}

function diagramColumnRowSvg(column, y, width) {
  const role = column.isPk && column.isFk ? "PK/FK" : column.isPk ? "PK" : column.isFk ? "FK" : "COL";
  const rowWidth = Math.max(120, width - 20);
  const tone = column.isPk ? "pk" : column.isFk ? "fk" : "non-key";
  const target = column.fkTarget ? ` -> ${column.fkTarget}` : "";
  const typeLabel = String(column.type || "");
  const iconWidth = diagramColumnInlineIconWidth(column);
  const iconX = 18;
  const nameX = iconWidth ? iconX + iconWidth + 8 : iconX;
  const rightLimit = width - 18;
  const typeWidth = typeLabel ? Math.min(74, Math.max(30, typeLabel.length * 5.5 + 8)) : 0;
  const typeGap = typeLabel ? 8 : 0;
  const nameLimit = Math.max(8, Math.floor((rightLimit - nameX - typeWidth - typeGap) / 5.8));
  const displayName = truncateMiddle(column.name, nameLimit);
  const typeX = Math.min(nameX + displayName.length * 5.8 + typeGap, rightLimit - typeWidth);
  const titleType = typeLabel ? ` ${typeLabel}` : "";
  return `
    <g class="diagram-column-row diagram-column-row-${tone}" data-diagram-column="${escapeHtml(column.name)}" data-diagram-column-y="${y}">
      <title>${escapeHtml(`${role} ${column.name}${titleType}${target}`)}</title>
      <rect class="diagram-column-row-bg" x="10" y="${y - 14}" width="${rowWidth}" height="18" rx="6"></rect>
      ${diagramColumnIconSvg(column, iconX, y)}
      <text class="diagram-column-name" x="${nameX}" y="${y - 2}">${escapeHtml(displayName)}</text>
      ${typeLabel ? `<text class="diagram-column-type" x="${typeX}" y="${y - 2}">${escapeHtml(truncateMiddle(typeLabel, 12))}</text>` : ""}
    </g>
  `;
}

function diagramColumnInlineIconWidth(column) {
  if (column.isPk && column.isFk) {
    return 21;
  }
  if (column.isPk || column.isFk) {
    return 10;
  }
  return 0;
}

function diagramColumnIconSvg(column, x, y) {
  if (column.isPk && column.isFk) {
    return `${diagramKeyIconSvg(x, y)}${diagramLinkIconSvg(x + 11, y)}`;
  }
  if (column.isPk) {
    return diagramKeyIconSvg(x, y);
  }
  if (column.isFk) {
    return diagramLinkIconSvg(x, y);
  }
  return "";
}

function diagramKeyIconSvg(x, y) {
  return `
    <g class="diagram-column-icon diagram-column-icon-key" transform="translate(${x} ${y - 13}) scale(0.4)" aria-hidden="true">
      <path d="M21 2l-2 2"></path>
      <path d="M11.39 11.61a5.5 5.5 0 1 1-7.78 7.78a5.5 5.5 0 0 1 7.78-7.78z"></path>
      <path d="M11.39 11.61L15.5 7.5"></path>
      <path d="M15.5 7.5l3 3L22 7l-3-3"></path>
    </g>
  `;
}

function diagramLinkIconSvg(x, y) {
  return `
    <g class="diagram-column-icon diagram-column-icon-link" transform="translate(${x} ${y - 13}) scale(0.4)" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </g>
  `;
}

function diagramOverflowColumnRow(hiddenCount, y, width) {
  return `
    <g class="diagram-column-row diagram-column-row-overflow" data-diagram-column-y="${y}">
      <rect class="diagram-column-row-bg" x="10" y="${y - 14}" width="${Math.max(120, width - 20)}" height="18" rx="6"></rect>
      <text class="diagram-column overflow" x="18" y="${y - 2}">+${integerText(hiddenCount)} more columns</text>
    </g>
  `;
}

function diagramEmptyColumnRow(y, width) {
  return `
    <g class="diagram-column-row diagram-column-row-empty" data-diagram-column-y="${y}">
      <rect class="diagram-column-row-bg" x="10" y="${y - 14}" width="${Math.max(120, width - 20)}" height="18" rx="6"></rect>
      <text class="diagram-column empty" x="18" y="${y - 2}">No key columns</text>
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

function handleDiagramPointerDown(event) {
  if (event.button !== 0) {
    return false;
  }
  const tableTarget = event.target.closest("[data-diagram-table]");
  if (!tableTarget) {
    return false;
  }
  const point = diagramPointerPoint(event);
  const position = diagramTablePositionFromElement(tableTarget);
  state.diagramDrag = {
    pointerId: event.pointerId,
    tableName: tableTarget.dataset.diagramTable || "",
    startPointerX: point.x,
    startPointerY: point.y,
    startX: position.x,
    startY: position.y,
    width: position.width,
    height: position.height,
    moved: false,
  };
  tableTarget.classList.add("dragging");
  tableTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function handleDiagramPointerMove(event) {
  const drag = state.diagramDrag;
  if (!drag || drag.pointerId !== event.pointerId) {
    return false;
  }
  const point = diagramPointerPoint(event);
  const dx = point.x - drag.startPointerX;
  const dy = point.y - drag.startPointerY;
  if (Math.abs(dx) + Math.abs(dy) > 3) {
    drag.moved = true;
  }
  const layoutWidth = Number(els.diagramSvg.viewBox.baseVal.width || 0);
  const layoutHeight = Number(els.diagramSvg.viewBox.baseVal.height || 0);
  const nextPosition = clampDiagramPosition(
    drag.startX + dx,
    drag.startY + dy,
    drag.width,
    drag.height,
    layoutWidth,
    layoutHeight,
  );
  state.diagramManualPositions.set(drag.tableName, nextPosition);
  const tableTarget = findDiagramTableElement(drag.tableName);
  if (tableTarget) {
    tableTarget.setAttribute("transform", `translate(${nextPosition.x} ${nextPosition.y})`);
    syncDiagramRelationshipGeometry(drag.tableName);
  }
  event.preventDefault();
  return true;
}

function handleDiagramPointerEnd(event) {
  const drag = state.diagramDrag;
  if (!drag || drag.pointerId !== event.pointerId) {
    return false;
  }
  const tableTarget = findDiagramTableElement(drag.tableName);
  tableTarget?.classList.remove("dragging");
  tableTarget?.releasePointerCapture?.(event.pointerId);
  state.diagramSuppressClick = drag.moved;
  state.diagramDrag = null;
  if (drag.moved) {
    renderDiagram();
  }
  return true;
}

function diagramPointerPoint(event) {
  const point = els.diagramSvg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = els.diagramSvg.getScreenCTM();
  return matrix ? point.matrixTransform(matrix.inverse()) : { x: point.x, y: point.y };
}

function diagramTablePositionFromElement(element) {
  const transform = element.getAttribute("transform") || "";
  const match = transform.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
  const box = element.querySelector(".diagram-table-box");
  return {
    x: match ? Number(match[1]) : 0,
    y: match ? Number(match[2]) : 0,
    width: Number(box?.getAttribute("width") || 0),
    height: Number(box?.getAttribute("height") || 0),
    layer: Number(element.dataset.diagramLayer || 0),
  };
}

function findDiagramTableElement(tableName) {
  return [...els.diagramSvg.querySelectorAll("[data-diagram-table]")]
    .find((element) => element.dataset.diagramTable === tableName) || null;
}

function syncDiagramRelationshipGeometry(tableName = "") {
  els.diagramSvg.querySelectorAll("[data-diagram-relationship]").forEach((relationshipElement) => {
    const childTable = relationshipElement.dataset.diagramChildTable || "";
    const parentTable = relationshipElement.dataset.diagramParentTable || "";
    if (tableName && childTable !== tableName && parentTable !== tableName) {
      return;
    }
    const sourceElement = findDiagramTableElement(relationshipElement.dataset.diagramChildTable || "");
    const targetElement = findDiagramTableElement(relationshipElement.dataset.diagramParentTable || "");
    if (!sourceElement || !targetElement) {
      return;
    }
    const source = diagramRelationshipTablePosition(
      sourceElement,
      relationshipElement.dataset.diagramChildColumn || "",
    );
    const target = diagramRelationshipTablePosition(
      targetElement,
      relationshipElement.dataset.diagramParentColumn || "",
    );
    const geometry = diagramRelationshipGeometry(
      source,
      target,
      relationshipElement.dataset.diagramChildColumn || "",
      relationshipElement.dataset.diagramParentColumn || "",
      Number(relationshipElement.dataset.diagramEdgeIndex || 0),
    );
    relationshipElement.querySelectorAll(".diagram-edge-hit, .diagram-edge, .diagram-edge-flow").forEach((pathElement) => {
      pathElement.setAttribute("d", geometry.path);
    });
    relationshipElement.querySelector(".diagram-cardinality-one")?.setAttribute("d", geometry.parentOnePath);
    relationshipElement.querySelector(".diagram-cardinality-many")?.setAttribute("d", geometry.childManyPath);
    relationshipElement.querySelector(".diagram-edge-label")?.setAttribute("x", geometry.labelX);
    relationshipElement.querySelector(".diagram-edge-label")?.setAttribute("y", geometry.labelY);
  });
}

function diagramRelationshipTablePosition(tableElement, columnName) {
  const position = diagramTablePositionFromElement(tableElement);
  position.columnY = new Map([[columnName, diagramColumnAbsoluteY(tableElement, position, columnName)]]);
  return position;
}

function diagramColumnAbsoluteY(tableElement, position, columnName) {
  const columnElement = [...tableElement.querySelectorAll("[data-diagram-column]")]
    .find((element) => element.dataset.diagramColumn === columnName);
  return position.y + Number(columnElement?.dataset.diagramColumnY || columnElement?.getAttribute("y") || DIAGRAM_COLUMN_START_Y);
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
    els.diagramInspector.textContent = `${integerText(model.tables.length)} tables, ${integerText(model.relationships.length)} relationships. ${state.diagramShowNonKey ? "Full columns visible." : "Key columns only."}`;
    return;
  }
  if (selected.kind === "table") {
    const record = layout.tableRecords.find((item) => item.table.name === selected.id);
    els.diagramInspector.textContent = record
      ? diagramTableSelectionStatus(record, layout)
      : `${integerText(model.tables.length)} tables, ${integerText(model.relationships.length)} relationships.`;
    return;
  }
  const rel = model.relationships.find((item) => item.id === selected.id);
  els.diagramInspector.textContent = rel
    ? diagramRelationshipSelectionStatus(rel)
    : `${integerText(model.tables.length)} tables, ${integerText(model.relationships.length)} relationships.`;
}

function diagramTableSelectionStatus(record, layout) {
  const table = record.table;
  const incoming = layout.graph.incoming.get(table.name) || [];
  const outgoing = layout.graph.outgoing.get(table.name) || [];
  const rowText = table.rowCount === null || table.rowCount === undefined ? "rows unavailable" : `${integerText(table.rowCount)} rows`;
  return `${table.name} table selected. ${record.role.label}. ${table.status || "schema"}. ${rowText}, ${integerText(record.totalColumns)} columns, ${integerText(incoming.length)} incoming and ${integerText(outgoing.length)} outgoing relationships.`;
}

function diagramRelationshipSelectionStatus(rel) {
  const childColumns = (rel.childColumns || []).join(", ") || "unknown child column";
  const parentColumns = (rel.parentColumns || []).join(", ") || "unknown parent column";
  const issueCount = Array.isArray(rel.evidenceLinks) ? rel.evidenceLinks.length : 0;
  const issueText = issueCount ? ` ${integerText(issueCount)} linked issue${issueCount === 1 ? "" : "s"}.` : "";
  return `Relationship selected. ${rel.childTable}.${childColumns} points to ${rel.parentTable}.${parentColumns}. ${rel.status || rel.cardinality || "declared FK"}.${issueText}`;
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

window.addEventListener("scroll", scheduleWorkflowNavViewportUpdate, { passive: true });
window.addEventListener("resize", scheduleWorkflowNavViewportUpdate);

renderAll();
checkRunnerHealth();
