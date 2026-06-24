const state = {
  dbmlText: "",
  dbmlName: "",
  dbmlFile: null,
  rulesFile: null,
  flowMode: "choose",
  profileStep: "connect",
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
  dashboardGraphMode: "lineage",
  dashboardGraphDisplay: "overview",
  dashboardGraphScope: "table",
  dashboardGraphShowColumns: false,
  dashboardGraphShowRuntime: false,
  dashboardGraphInvalidOnly: false,
  dashboardGraphSelection: null,
  issueLlmProvider: "fake",
  issueLlmRunningIssueId: "",
  issueLlmMessage: "",
  issueLlmMessageStatus: "",
  diagramSelection: null,
  diagramExpanded: false,
  diagramShowNonKey: false,
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
  rulesInput: document.querySelector("#rulesInput"),
  rulesFileCard: document.querySelector("#rulesFileCard"),
  rulesFileName: document.querySelector("#rulesFileName"),
  rulesFileMeta: document.querySelector("#rulesFileMeta"),
  targetInput: document.querySelector("#targetInput"),
  pathTargetInput: document.querySelector("#pathTargetInput"),
  runnerModeUpload: document.querySelector("#runnerModeUpload"),
  runnerModePath: document.querySelector("#runnerModePath"),
  runnerModeDatabase: document.querySelector("#runnerModeDatabase"),
  runnerForm: document.querySelector("#runnerForm"),
  pathRunnerForm: document.querySelector("#pathRunnerForm"),
  databaseRunnerForm: document.querySelector("#databaseRunnerForm"),
  demoPresetSmall: document.querySelector("#demoPresetSmall"),
  demoPresetOlist: document.querySelector("#demoPresetOlist"),
  demoPresetStatus: document.querySelector("#demoPresetStatus"),
  llmModeOff: document.querySelector("#llmModeOff"),
  llmModeFake: document.querySelector("#llmModeFake"),
  llmModeOpenAI: document.querySelector("#llmModeOpenAI"),
  llmModeStatus: document.querySelector("#llmModeStatus"),
  runProfilerButton: document.querySelector("#runProfilerButton"),
  runPathProfilerButton: document.querySelector("#runPathProfilerButton"),
  runDatabaseProfilerButton: document.querySelector("#runDatabaseProfilerButton"),
  dbmlPathInput: document.querySelector("#dbmlPathInput"),
  csvDirPathInput: document.querySelector("#csvDirPathInput"),
  rulesPathInput: document.querySelector("#rulesPathInput"),
  databaseSourceType: document.querySelector("#databaseSourceType"),
  databaseUrlInput: document.querySelector("#databaseUrlInput"),
  databaseSchemaInput: document.querySelector("#databaseSchemaInput"),
  databaseTablesInput: document.querySelector("#databaseTablesInput"),
  databaseChunkRowsInput: document.querySelector("#databaseChunkRowsInput"),
  databaseRulesPathInput: document.querySelector("#databaseRulesPathInput"),
  databaseTargetInput: document.querySelector("#databaseTargetInput"),
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

const { demoPresets } = window.VSF_DEMO_DATA;
const {
  cloneCsvPreview,
  parseDbml,
  readCsvFile,
} = window.VSF_SOURCE_PARSERS;
const {
  dashboardChartPaths,
  dashboardMachineArtifacts,
  graphCategoryLabels,
  graphDisplayLabels,
  graphScopeLabels,
  lineageCategoryOrder,
  lineageTypeToCategory,
  localDiagramLimits,
  postRunDiagramArtifacts,
  relationshipCategoryOrder,
  relationshipIssueTypes,
  severityOrder,
} = window.VSF_DASHBOARD_CONFIG;

const profileSteps = ["connect", "preflight", "run", "review"];
const profileStepLabels = {
  connect: "Connect",
  preflight: "Preflight Review",
  run: "Run",
  review: "Review",
};

function severityRank(severity) {
  const index = severityOrder.indexOf(severity);
  return index === -1 ? severityOrder.length : index;
}

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

els.rulesInput.addEventListener("change", (event) => {
  resetPreflightReview();
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

els.diagramDensityToggle.addEventListener("click", () => {
  state.diagramExpanded = !state.diagramExpanded;
  renderDiagram();
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
  loadDemoState("small", { switchToPath: true });
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

els.runnerModeDatabase.addEventListener("click", () => {
  setRunnerMode("database");
});

els.demoPresetSmall.addEventListener("click", () => {
  loadDemoState("small", { switchToPath: true });
});

els.demoPresetOlist.addEventListener("click", () => {
  loadDemoState("olist", { switchToPath: true });
});

els.llmModeOff.addEventListener("click", () => {
  setLlmMode("off");
});

els.llmModeFake.addEventListener("click", () => {
  setLlmMode("fake");
});

els.llmModeOpenAI.addEventListener("click", () => {
  setLlmMode("openai");
});

els.runnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startProfilerRun();
});

els.pathRunnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startPathRun();
});

els.databaseRunnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startDatabaseRun();
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
  els.rulesPathInput,
  els.pathTargetInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    resetPreflightReview();
    syncDemoPresetFromPathInputs();
    renderAll();
  });
});

els.databaseSourceType.addEventListener("change", () => {
  syncDatabaseSourceControls();
  renderAll();
});

[
  els.databaseUrlInput,
  els.databaseSchemaInput,
  els.databaseTablesInput,
  els.databaseChunkRowsInput,
  els.databaseRulesPathInput,
  els.databaseTargetInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    resetPreflightReview();
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

els.dashboardPanelGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.tableImpactGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.dashboardDrilldown.addEventListener("click", async (event) => {
  const providerTarget = event.target.closest("[data-issue-llm-provider]");
  if (providerTarget) {
    state.issueLlmProvider = providerTarget.dataset.issueLlmProvider || "fake";
    state.issueLlmMessage = "";
    state.issueLlmMessageStatus = "";
    renderDashboardDrilldown();
    return;
  }
  const enrichmentTarget = event.target.closest("[data-issue-llm-run]");
  if (enrichmentTarget) {
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
  state.dashboardSelection = {
    kind: target.dataset.dashboardKind,
    value: target.dataset.dashboardValue || "",
    label: target.dataset.dashboardLabel || target.textContent.trim(),
  };
  renderDashboardDrilldown();
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
    await loadRunHistory();
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
      await loadRunHistory({ preferredJobId: payload.job_id });
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
  if (state.rulesFile) {
    form.append("rules", state.rulesFile, state.rulesFile.name);
  }
  const target = els.targetInput.value.trim();
  if (target) {
    form.append("target", target);
  }
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
  renderRunnerMessage(`Starting local path job on ${runnerHostLabel()}${llmRunSuffix()}...`, "pending");
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

async function startDatabaseRun() {
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

  const sourceType = els.databaseSourceType.value;
  const connectionUrl = els.databaseUrlInput.value.trim();
  const schema = els.databaseSchemaInput.value.trim();
  const tables = els.databaseTablesInput.value.trim();
  const chunkRows = els.databaseChunkRowsInput.value.trim();
  const rulesPath = els.databaseRulesPathInput.value.trim();
  const target = els.databaseTargetInput.value.trim();
  if (!connectionUrl) {
    renderRunnerMessage("Database connection URL is required.", "error");
    return;
  }

  const payload = {
    source_type: sourceType,
    connection_url: connectionUrl,
  };
  if (schema) {
    payload.schema = schema;
  }
  if (tables) {
    payload.tables = tables;
  }
  if (chunkRows) {
    payload.chunk_rows = Number(chunkRows);
  }
  if (rulesPath) {
    payload.rules_path = rulesPath;
  }
  if (target) {
    payload.target = target;
  }
  payload.preflight_review = buildPreflightReviewPayload(preflightReview);
  Object.assign(payload, llmRunOptions());

  state.runEvents = [];
  state.currentJob = {
    status: "queued",
    input_mode: "database",
    database: { source_type: sourceType },
    artifacts: [],
  };
  resetDashboardState();
  renderJob();
  renderRunnerMessage(
    `Starting ${databaseSourceLabel(sourceType)} database job on ${runnerHostLabel()}${llmRunSuffix()}...`,
    "pending",
  );
  els.runDatabaseProfilerButton.disabled = true;

  try {
    const response = await fetch("/api/database-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responsePayload = await response.json();
    if (!response.ok) {
      throw new Error(responsePayload.error || "Backend rejected the developer database source.");
    }
    state.currentJob = responsePayload;
    renderRunnerMessage("Pipeline started. Runtime events are streaming from run_events.jsonl.", "pending");
    connectEventStream(responsePayload.events_url);
  } catch (error) {
    renderRunnerMessage(error.message || "Unable to start database run.", "error");
  } finally {
    renderAll();
  }
}

function setRunnerMode(mode) {
  resetPreflightReview();
  state.runnerMode = ["upload", "path", "database"].includes(mode) ? mode : "upload";
  state.profileStep = "connect";
  if (state.runnerMode === "path") {
    syncDemoPresetFromPathInputs();
  }
  if (state.runnerMode === "path" && !state.dbmlText) {
    const presetName = demoPresets[state.selectedDemoPreset] ? state.selectedDemoPreset : "small";
    loadDemoState(presetName, { switchToPath: true });
    return;
  }
  if (state.runnerMode === "database") {
    syncDatabaseSourceControls({ preserveUserValue: true });
  }
  const messages = {
    upload: "Start with files uploaded from this browser session.",
    path: `Start with local paths visible to the ${runnerHostLabel()} runner.`,
    database: `Start with a developer database source visible to the ${runnerHostLabel()} runner.`,
  };
  renderRunnerMessage(messages[state.runnerMode], "idle");
  renderAll();
}

function runnerHostLabel() {
  return state.runnerHost || window.location.host || "configured host";
}

function setFlowMode(mode) {
  state.flowMode = ["choose", "profile", "evaluate"].includes(mode) ? mode : "choose";
  if (state.flowMode === "evaluate") {
    loadEvaluationCatalog();
  }
  renderAll();
  const target = state.flowMode === "evaluate" ? els.evaluateFlow : els.profileFlow;
  if (state.flowMode !== "choose" && target) {
    target.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function setProfileStep(step, options = {}) {
  const nextStep = profileSteps.includes(step) ? step : "connect";
  const changed = state.profileStep !== nextStep;
  state.profileStep = nextStep;
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
  state.llmMode = ["off", "fake", "openai"].includes(mode) ? mode : "off";
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
          ? "Run complete. Generated artifacts are ready."
          : state.currentJob.error || "Run failed.",
        state.currentJob.status === "succeeded" ? "success" : "error",
      );
      loadRunHistory({ preferredJobId: state.currentJob.job_id });
      if (state.currentJob.status === "succeeded") {
        loadDashboard(state.currentJob.job_id)
          .then(() => setProfileStep("review"))
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
  resetPreflightReview();
  resetRunResultsForInputChange();
  resetDiagramLayoutState();
  state.profileStep = "connect";
  const preset = demoPresets[presetName] || demoPresets.small;
  state.selectedDemoPreset = presetName in demoPresets ? presetName : "small";
  state.dbmlText = preset.dbmlText;
  state.dbmlName = preset.dbmlName;
  state.dbmlFile = null;
  state.rulesFile = null;
  state.csvFiles = preset.csvs.map(cloneCsvPreview);
  state.csvReadErrors = [];
  els.dbmlInput.value = "";
  els.csvInput.value = "";
  els.rulesInput.value = "";
  els.dbmlPathInput.value = preset.dbmlPath;
  els.csvDirPathInput.value = preset.csvDir;
  els.rulesPathInput.value = preset.rulesPath;
  els.pathTargetInput.value = preset.target;
  if (options.switchToPath) {
    state.runnerMode = "path";
    renderRunnerMessage(
      options.quickDemo
        ? `${preset.label} DBML + CSV demo is loaded. Continue to Preflight Review.`
        : `${preset.label} paths are ready for the local runner.`,
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
  state.rulesFile = null;
  state.csvFiles = [];
  state.csvReadErrors = [];
  state.mapping = new Map();
  state.manualMappings = new Set();
  state.runnerMode = "upload";
  state.selectedDemoPreset = "custom";
  els.dbmlInput.value = "";
  els.csvInput.value = "";
  els.rulesInput.value = "";
  if (options.clearPathValues) {
    els.dbmlPathInput.value = "";
    els.csvDirPathInput.value = "";
    els.rulesPathInput.value = "";
    els.pathTargetInput.value = "";
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
  const rulesPath = els.rulesPathInput.value.trim();
  const target = els.pathTargetInput.value.trim();
  const match = Object.entries(demoPresets).find(([, preset]) => (
    preset.dbmlPath === dbmlPath &&
    preset.csvDir === csvDir &&
    preset.rulesPath === rulesPath &&
    preset.target === target
  ));
  state.selectedDemoPreset = match ? match[0] : "custom";
}

function syncDatabaseSourceControls(options = {}) {
  const sourceType = els.databaseSourceType.value;
  if (sourceType === "mysql") {
    els.databaseUrlInput.placeholder = "mysql://user:password@127.0.0.1:3306/app";
    els.databaseSchemaInput.placeholder = "app";
    if (!options.preserveUserValue && els.databaseSchemaInput.value.trim() === "public") {
      els.databaseSchemaInput.value = "";
    }
  } else {
    els.databaseUrlInput.placeholder = "postgresql://user:password@127.0.0.1:5432/app";
    els.databaseSchemaInput.placeholder = "public";
    if (!options.preserveUserValue && !els.databaseSchemaInput.value.trim()) {
      els.databaseSchemaInput.value = "public";
    }
  }
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
  return state.llmMode === "off" ? "" : ` with ${llmModeLabel(state.llmMode)} compatibility LLM report`;
}

function llmModeLabel(mode) {
  return {
    off: "LLM off",
    fake: "Fake",
    openai: "OpenAI",
  }[mode] || "LLM off";
}

function databaseSourceLabel(sourceType) {
  return sourceType === "mysql" ? "MySQL/MariaDB" : "Postgres";
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

function profileStepGuard(step) {
  if (step === "connect") {
    const ready = profileSourceReady();
    return {
      allowed: ready,
      message: ready
        ? "Source connected. Continue to Preflight Review."
        : "Add DBML and CSV files, choose local paths, or configure a developer database source before continuing.",
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
    message: "Review generated quality gates, issues, todos, reports, and run history.",
  };
}

function profileSourceReady() {
  if (state.runnerMode === "database") {
    return Boolean(els.databaseUrlInput.value.trim());
  }
  if (state.runnerMode === "path") {
    return Boolean(els.dbmlPathInput.value.trim() && els.csvDirPathInput.value.trim());
  }
  return Boolean(
    state.dbmlFile &&
    state.csvFiles.some((file) => file.sourceFile) &&
    !state.dbmlParseError,
  );
}

function profileRunComplete() {
  return state.currentJob?.status === "succeeded" && !state.dashboardLoadingJobId;
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
    return profileRunComplete() || Boolean(state.dashboardArtifactIndex) || state.runHistory.length > 0;
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
  els.dbmlStatus.textContent = state.tables.length
    ? `${state.dbmlName || "DBML"} parsed: ${state.tables.length} tables, ${state.relationships.length} relationships`
    : "Waiting for DBML";
  els.csvStatus.textContent = sourceInventoryText();
  els.preflightStatus.textContent = preflightStatusText(preflightReview);
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

function renderSourceState() {
  const uploadedCsvs = state.csvFiles.filter((file) => file.sourceFile);
  const preset = demoPresets[state.selectedDemoPreset];
  const modeLabel = {
    upload: "Upload",
    path: "Local path",
    database: "Database",
  }[state.runnerMode] || "Upload";
  const dbmlLabel = state.dbmlFile
    ? state.dbmlFile.name
    : state.runnerMode === "path" && els.dbmlPathInput.value.trim()
      ? els.dbmlPathInput.value.trim()
      : state.dbmlName || "Not selected";
  const csvLabel = state.runnerMode === "path" && els.csvDirPathInput.value.trim()
    ? els.csvDirPathInput.value.trim()
    : state.csvFiles.length
      ? `${integerText(state.csvFiles.length)} file${state.csvFiles.length === 1 ? "" : "s"}`
      : "0 files";
  let badge = "No upload";
  let status = "";
  let summary = "Upload a DBML contract and CSV files to profile your own data.";
  if (state.runnerMode === "database") {
    badge = "Developer DB";
    status = "warnings_pending";
    summary = "Developer database mode is a compatibility source. CSV+DBML upload remains the primary guided path.";
  } else if (state.runnerMode === "path") {
    badge = preset ? "Demo paths" : "Custom paths";
    status = "ready";
    summary = preset
      ? `${preset.label} DBML + CSV demo is loaded for the local runner.`
      : "Local path mode will read files visible to the backend process.";
  } else if (state.dbmlFile || uploadedCsvs.length) {
    badge = "Custom upload";
    status = state.dbmlFile && uploadedCsvs.length ? "ready" : "warnings_pending";
    summary = uploadedCsvs.length
      ? "Browser upload source is active. New CSV selections replace the previous inventory."
      : "Custom DBML is active. Upload matching CSV files before running.";
  }

  els.sourceStateBadge.textContent = badge;
  els.sourceStateBadge.dataset.status = status;
  els.sourceStateSummary.textContent = summary;
  els.sourceStateDetails.innerHTML = `
    <div><span>DBML</span><strong>${escapeHtml(dbmlLabel)}</strong></div>
    <div><span>CSV</span><strong>${escapeHtml(csvLabel)}</strong></div>
    <div><span>Run mode</span><strong>${escapeHtml(modeLabel)}</strong></div>
  `;
  els.clearUploadButton.disabled = !(state.dbmlFile || uploadedCsvs.length || state.dbmlText || state.csvFiles.length);
}

function runnerStatusText() {
  if (!state.runnerAvailable) {
    return "Backend unavailable";
  }
  if (state.currentJob?.status) {
    return `${state.currentJob.status}`;
  }
  if (state.runnerMode === "path") {
    return "Ready for local paths";
  }
  if (state.runnerMode === "database") {
    return "Ready for developer database source";
  }
  return "Ready for uploaded files";
}

function sourceInventoryText() {
  if (state.runnerMode === "database") {
    const sourceType = databaseSourceLabel(els.databaseSourceType.value);
    if (els.databaseUrlInput.value.trim()) {
      const tableText = els.databaseTablesInput.value.trim() ? "selected tables" : "schema tables";
      return `${sourceType} ${tableText} ready`;
    }
    return `${sourceType} connection URL required`;
  }
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

  if (mode === "database") {
    if (!els.databaseUrlInput.value.trim()) {
      blockers.push(preflightItem(
        "missing_database_source",
        "Database source URL is missing.",
        "Enter a developer database connection URL or switch back to CSV + DBML source mode.",
      ));
    }
    return finalizePreflightReview(mode, blockers, warnings);
  }

  const hasRunDbml = mode === "upload"
    ? Boolean(state.dbmlFile)
    : Boolean(els.dbmlPathInput.value.trim());
  const hasCsvSource = mode === "upload"
    ? state.csvFiles.some((file) => file.sourceFile)
    : Boolean(els.csvDirPathInput.value.trim());

  if (!hasRunDbml) {
    blockers.push(preflightItem(
      "missing_dbml",
      mode === "upload" ? "Uploaded DBML is missing." : "DBML file path is missing.",
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
      mode === "upload" ? "Uploaded CSV source is missing." : "Local CSV directory path is missing.",
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
  const hasDatabaseUrl = Boolean(els.databaseUrlInput.value.trim());
  const jobRunning = ["queued", "running"].includes(state.currentJob?.status);
  const evaluationRunning = evaluationJobRunning();
  const preflightReview = buildPreflightReview();
  const preflightAllowsRun = preflightReview.runAllowed;
  const runStepActive = state.flowMode === "profile" && state.profileStep === "run";
  els.visualizeButton.disabled = !hasDbml;
  els.autoLinkButton.disabled = !hasDbml || !state.csvFiles.length;
  els.runProfilerButton.disabled = !runStepActive || !state.runnerAvailable || !hasUploadedDbml || !hasUploadedCsvs || !preflightAllowsRun || jobRunning;
  els.runPathProfilerButton.disabled = !runStepActive || !state.runnerAvailable || !hasPathInputs || !preflightAllowsRun || jobRunning;
  els.runDatabaseProfilerButton.disabled = !runStepActive || !state.runnerAvailable || !hasDatabaseUrl || !preflightAllowsRun || jobRunning;
  els.startEvaluationButton.disabled = !state.runnerAvailable || !selectedEvaluationDataset() || evaluationRunning;
  els.runnerModeUpload.classList.toggle("active", state.runnerMode === "upload");
  els.runnerModePath.classList.toggle("active", state.runnerMode === "path");
  els.runnerModeDatabase.classList.toggle("active", state.runnerMode === "database");
  els.runnerModeUpload.setAttribute("aria-selected", state.runnerMode === "upload" ? "true" : "false");
  els.runnerModePath.setAttribute("aria-selected", state.runnerMode === "path" ? "true" : "false");
  els.runnerModeDatabase.setAttribute("aria-selected", state.runnerMode === "database" ? "true" : "false");
  els.runnerForm.hidden = state.runnerMode !== "upload";
  els.pathRunnerForm.hidden = state.runnerMode !== "path";
  els.databaseRunnerForm.hidden = state.runnerMode !== "database";
  renderDemoPresetControls();
  renderLlmModeControls();
}

function renderDemoPresetControls() {
  const preset = demoPresets[state.selectedDemoPreset];
  els.demoPresetStatus.textContent = preset ? preset.label : "Custom paths";
  [
    [els.demoPresetSmall, state.selectedDemoPreset === "small"],
    [els.demoPresetOlist, state.selectedDemoPreset === "olist"],
  ].forEach(([button, active]) => {
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderLlmModeControls() {
  els.llmModeStatus.textContent = llmModeLabel(state.llmMode);
  [
    [els.llmModeOff, state.llmMode === "off"],
    [els.llmModeFake, state.llmMode === "fake"],
    [els.llmModeOpenAI, state.llmMode === "openai"],
  ].forEach(([button, active]) => {
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
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
        <span>${integerText(run.stage_count || 0)} stages</span>
        <span>${integerText(run.failed_stage_count || 0)} failed</span>
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
  const stages = Array.isArray(run.stages) ? run.stages : [];
  els.selectedRunTimelineStatus.textContent = `${integerText(stages.length)} stages · ${integerText(run.failed_stage_count || 0)} failed`;
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
  return generatedResultCard("Compatibility LLM guardrail", "guardrail_report.json", body, artifacts);
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
  state.dashboardGraphMode = "lineage";
  state.dashboardGraphScope = "table";
  state.dashboardGraphSelection = null;
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
    state.dashboardGraphSelection = null;
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
  renderDashboardArtifacts();
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
    renderDashboardGraph();
    return;
  }

  els.dashboardPanelGrid.innerHTML = renderIssueInbox(filteredIssues);
  renderDashboardGraph();
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
    els.reportExportMessage.textContent = "Report links are shown before Developer artifacts.";
    els.reportExportMessage.dataset.status = "";
    return;
  }

  const reportLinks = renderReportExportLinks();
  els.reportExportGrid.innerHTML = reportLinks || `
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
    els.reportExportMessage.textContent = "Developer artifacts remain available below for debugging.";
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
  els.reportExportMessage.textContent = "Raw JSON and runtime artifacts are listed in Developer artifacts below.";
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
  const columns = Array.isArray(occurrence.columns) && occurrence.columns.length
    ? occurrence.columns.join(", ")
    : "table scope";
  return `
    <div class="todo-occurrence">
      <code>${escapeHtml(occurrence.issue_id || "UNKNOWN")}</code>
      <span>${escapeHtml(occurrence.table || "unknown")}.${escapeHtml(columns)}</span>
      <small>${escapeHtml(occurrence.priority || "Needs human review")}</small>
    </div>
  `;
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
      ? "Fetching developer schema artifacts..."
      : "Run a job to render developer schema context.";
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
    return emptyGraphModel("Runtime artifact context", "lineage_graph.json", "lineage_graph.json is not available.");
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
    title: "Runtime artifact context",
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
        <div><span>${escapeHtml(state.dashboardGraphMode === "lineage" ? "runtime artifacts" : "FK")}</span><p>mode</p></div>
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
    "Compatibility LLM guardrail",
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
  const model = buildIssueInboxModel(filteredIssues);
  if (!model.tables.length) {
    return `
      <section class="issue-inbox-empty">
        <strong>No issues match the current filters.</strong>
        <p>Adjust severity, issue type, or table filters to review generated findings.</p>
      </section>
    `;
  }

  return `
    <section class="issue-inbox" aria-label="Review Issues grouped by table, column, and issue">
      <div class="issue-inbox-heading">
        <div>
          <p class="eyebrow">Review Issues</p>
          <h4>Table -> Column -> Issue</h4>
        </div>
        <div class="issue-inbox-totals" aria-label="Issue inbox summary">
          <span>${integerText(model.issueCount)} issues</span>
          <span>${integerText(model.columnCount)} columns</span>
          <span>${integerText(model.tableCount)} tables</span>
        </div>
      </div>
      <div class="issue-table-list">
        ${model.tables.map(renderIssueTableGroup).join("")}
      </div>
    </section>
  `;
}

function buildIssueInboxModel(filteredIssues) {
  const assessments = new Map(getDashboardTableAssessments().map((assessment) => [assessment.table, assessment]));
  const includeCleanTables = state.dashboardFilters.severity === "all" && state.dashboardFilters.issueType === "all";
  const tableNames = new Set(filteredIssues.map((issue) => issue.table || "Schema / dataset"));
  if (includeCleanTables) {
    getDashboardTableAssessments()
      .filter((assessment) => filterMatchesTable(assessment.table))
      .forEach((assessment) => tableNames.add(assessment.table));
  }

  const tables = [...tableNames]
    .filter((tableName) => state.dashboardFilters.table === "all" || tableName === state.dashboardFilters.table)
    .map((tableName) => {
      const assessment = assessments.get(tableName) || {};
      const issues = filteredIssues.filter((issue) => (issue.table || "Schema / dataset") === tableName);
      const columns = buildIssueColumnGroups(issues);
      const status = tableIssueStatus(issues, assessment);
      return {
        table: tableName,
        assessment,
        issues,
        columns,
        status,
        issueCount: issues.length,
        columnCount: columns.filter((column) => column.key !== "__table__").length,
      };
    })
    .sort((a, b) => (
      issueStatusOrder(a.status) - issueStatusOrder(b.status) ||
      b.issueCount - a.issueCount ||
      a.table.localeCompare(b.table)
    ));

  return {
    tables,
    issueCount: filteredIssues.length,
    columnCount: sum(tables.map((table) => table.columnCount)),
    tableCount: tables.length,
  };
}

function buildIssueColumnGroups(issues) {
  const groups = new Map();
  issues.forEach((issue) => {
    const key = issuePrimaryColumn(issue);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: issueColumnLabel(issue, key),
        issues: [],
      });
    }
    groups.get(key).issues.push(issue);
  });
  return [...groups.values()]
    .map((group) => ({
      ...group,
      status: aggregateIssueStatus(group.issues),
    }))
    .sort((a, b) => (
      (a.key === "__table__" ? -1 : 0) - (b.key === "__table__" ? -1 : 0) ||
      issueStatusOrder(a.status) - issueStatusOrder(b.status) ||
      a.label.localeCompare(b.label)
    ));
}

function renderIssueTableGroup(table) {
  const readiness = table.assessment.readiness ? statusFromReadiness(table.assessment.readiness) : table.status;
  const rowCount = table.assessment.row_count;
  const role = table.assessment.role || "table";
  return `
    <article class="issue-table-group">
      <div class="issue-table-heading">
        <div>
          <code>${escapeHtml(table.table)}</code>
          <p>${escapeHtml(role)}${rowCount === undefined ? "" : ` · ${integerText(rowCount)} rows`}</p>
        </div>
        <span class="pill-status ${issueStatusClass(readiness)}">${escapeHtml(readiness)}</span>
        <div class="issue-table-counts">
          <span>${integerText(table.issueCount)} issues</span>
          <span>${integerText(table.columnCount)} columns</span>
        </div>
      </div>
      ${table.columns.length
        ? table.columns.map((column) => renderIssueColumnGroup(table.table, column)).join("")
        : `<div class="issue-column-group clean"><strong>Clean</strong><p>No issues detected for this table in the current filters.</p></div>`}
    </article>
  `;
}

function renderIssueColumnGroup(tableName, column) {
  const tableScope = column.key === "__table__";
  return `
    <div class="issue-column-group ${tableScope ? "table-scope" : ""}">
      <div class="issue-column-heading">
        <div>
          <strong>${escapeHtml(tableScope ? "Schema/table-level checks" : column.label)}</strong>
          <p>${escapeHtml(tableScope ? "Separated from column findings" : `${column.issues.length} issue${column.issues.length === 1 ? "" : "s"} on this column`)}</p>
        </div>
        <span class="pill-status ${issueStatusClass(column.status)}">${escapeHtml(column.status)}</span>
      </div>
      <div class="issue-row-list">
        ${column.issues.map((issue) => renderInboxIssueRow(tableName, column, issue)).join("")}
      </div>
    </div>
  `;
}

function renderInboxIssueRow(tableName, column, issue) {
  const status = issueStatus(issue);
  const selected = state.dashboardSelection?.kind === "issue" && state.dashboardSelection.value === issue.issue_id;
  return `
    <button class="issue-inbox-row ${selected ? "selected" : ""}" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(issue.issue_id)}" data-dashboard-label="${escapeHtml(issue.issue_id)}">
      <span class="issue-guid">${escapeHtml(issueGuid(issue))}</span>
      <span class="issue-row-main">
        <strong>${escapeHtml(issueTypeLabel(issue))}</strong>
        <small>${escapeHtml(issueRowContext(issue, tableName, column))}</small>
      </span>
      <span class="pill-status ${issueStatusClass(status)}">${escapeHtml(status)}</span>
      <span class="issue-counts">
        <span>${integerText(issue.bad_count)} rows</span>
        <span>${percentText(issue.bad_rate)}</span>
      </span>
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
  return `
    <article class="issue-detail-drawer">
      <div class="issue-detail-header">
        <div>
          <span class="issue-guid">${escapeHtml(issueGuid(issue))}</span>
          <h4>${escapeHtml(issueTypeLabel(issue))}</h4>
        </div>
        <span class="pill-status ${issueStatusClass(status)}">${escapeHtml(status)}</span>
      </div>
      ${renderIssueDetailSection("Where", renderIssueWhere(issue, parent))}
      ${renderIssueDetailSection("What happened", renderIssueWhatHappened(issue))}
      ${renderIssueDetailSection("Evidence", renderIssueEvidence(issue))}
      ${renderIssueDetailSection("Why it matters", renderIssueWhyItMatters(issue))}
      ${renderIssueDetailSection("How to fix", renderIssueHowToFix(issue))}
      ${renderIssueDetailSection("Action plan", renderIssueActionPlan(actionPlan, issue))}
      ${renderIssueDetailSection("LLM enrichment add-on", renderIssueLlmEnrichment(actionPlan, issue))}
    </article>
  `;
}

function renderIssueDetailSection(title, body) {
  return `
    <section class="issue-detail-section">
      <h5>${escapeHtml(title)}</h5>
      ${body}
    </section>
  `;
}

function renderIssueWhere(issue, parent) {
  const columns = Array.isArray(issue.columns) && issue.columns.length ? issue.columns.join(", ") : "Table-level";
  return `
    <dl class="issue-detail-grid">
      <div><dt>Table</dt><dd><code>${escapeHtml(issue.table || "Schema / dataset")}</code></dd></div>
      <div><dt>Column</dt><dd><code>${escapeHtml(columns)}</code></dd></div>
      <div><dt>Scope</dt><dd>${escapeHtml(issueScopeLabel(issue))}</dd></div>
      <div><dt>Severity</dt><dd>${escapeHtml(issue.severity || "unknown")}</dd></div>
      ${parent ? `<div><dt>Parent context</dt><dd>${parent}</dd></div>` : ""}
    </dl>
  `;
}

function renderIssueWhatHappened(issue) {
  return `
    <p>${escapeHtml(issueWhatHappened(issue))}</p>
    <dl class="issue-detail-grid">
      <div><dt>Issue type</dt><dd><code>${escapeHtml(issue.issue_type || "UNKNOWN")}</code></dd></div>
      <div><dt>Affected rows</dt><dd>${integerText(issue.bad_count)} of ${integerText(issue.total_count)}</dd></div>
      <div><dt>Affected rate</dt><dd>${percentText(issue.bad_rate)}</dd></div>
    </dl>
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
        <strong>Fix data checklist</strong>
        ${renderActionPlanList(plan.fix_data_checklist)}
      </div>
      <div class="action-plan-block">
        <strong>Verify after fix checklist</strong>
        ${renderActionPlanList(plan.verify_after_fix_checklist)}
      </div>
      <div class="action-plan-block">
        <strong>Guidelines</strong>
        ${renderActionPlanList(plan.guidelines)}
      </div>
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

function renderActionPlanList(items) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) {
    return `<p class="muted">Needs human review before todos can be assigned.</p>`;
  }
  return `<ul class="issue-detail-list">${list.slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
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
  return String(issue.issue_type || "UNKNOWN").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function aggregateIssueStatus(issues) {
  if (!issues.length) {
    return "Clean";
  }
  return issues
    .map(issueStatus)
    .sort((a, b) => issueStatusOrder(a) - issueStatusOrder(b))[0];
}

function tableIssueStatus(issues, assessment = {}) {
  if (issues.length) {
    return aggregateIssueStatus(issues);
  }
  return assessment.readiness ? statusFromReadiness(assessment.readiness) : "Clean";
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

function renderDashboardArtifacts() {
  const artifactIndex = state.dashboardArtifactIndex;
  const paths = Object.keys(artifactIndex?.artifact_urls || {}).sort();
  els.dashboardArtifactCount.textContent = `${paths.length} files`;
  if (!paths.length) {
    els.dashboardArtifactLinks.innerHTML = `<p class="muted">Developer artifact sources are listed after artifact discovery.</p>`;
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
    "l4_report.md": "Compatibility LLM report",
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
  els.diagramDensityToggle.setAttribute("aria-pressed", state.diagramExpanded ? "true" : "false");
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
  const source = positions.get(rel.childTable);
  const target = positions.get(rel.parentTable);
  if (!source || !target) {
    return "";
  }
  const sourceColumn = (rel.childColumns || [])[0] || "";
  const targetColumn = (rel.parentColumns || [])[0] || "";
  const geometry = diagramRelationshipGeometry(source, target, sourceColumn, targetColumn, index);
  const label = `${rel.childTable}.${(rel.childColumns || []).join(",")} -> ${rel.parentTable}.${(rel.parentColumns || []).join(",")}`;
  const selectionClass = diagramRelationshipSelectionClass(rel, layout.selection);
  return `
    <g class="diagram-relationship diagram-relationship-${escapeHtml(diagramStatusTone(rel.status))} ${selectionClass}" data-diagram-relationship="${escapeHtml(rel.id)}" data-diagram-child-table="${escapeHtml(rel.childTable)}" data-diagram-parent-table="${escapeHtml(rel.parentTable)}" data-diagram-child-column="${escapeHtml(sourceColumn)}" data-diagram-parent-column="${escapeHtml(targetColumn)}" data-diagram-edge-index="${index}" tabindex="0" role="button" aria-label="${escapeHtml(label)}">
      <title>${escapeHtml(label)}</title>
      <path class="diagram-edge-hit" d="${geometry.path}"></path>
      <path class="diagram-edge" d="${geometry.path}"></path>
      <circle class="diagram-port-dot diagram-port-source" cx="${geometry.x1}" cy="${geometry.y1}" r="3"></circle>
      <circle class="diagram-port-dot diagram-port-target" cx="${geometry.x2}" cy="${geometry.y2}" r="3"></circle>
      <text class="diagram-edge-label" x="${geometry.labelX}" y="${geometry.labelY}">${escapeHtml(truncateMiddle(rel.label || rel.cardinality || "FK", 22))}</text>
    </g>
  `;
}

function diagramRelationshipGeometry(source, target, sourceColumn, targetColumn, index) {
  const sameLayer = source.layer === target.layer;
  const y1 = source.columnY?.get(sourceColumn) || source.y + 80;
  const y2 = target.columnY?.get(targetColumn) || target.y + 80;
  const sourceIsLeft = source.x < target.x;
  const x1 = sameLayer ? source.x + source.width : sourceIsLeft ? source.x + source.width : source.x;
  const x2 = sameLayer ? target.x + target.width : sourceIsLeft ? target.x : target.x + target.width;
  const offset = 24 + (index % 4) * 8;
  const direction = x2 >= x1 ? 1 : -1;
  let path;
  let labelX;
  let labelY;
  if (sameLayer) {
    const routeX = Math.max(source.x + source.width, target.x + target.width) + offset;
    path = `M ${x1} ${y1} L ${routeX} ${y1} L ${routeX} ${y2} L ${x2} ${y2}`;
    labelX = routeX + 8;
    labelY = (y1 + y2) / 2 - 6;
  } else {
    const layerDistance = Math.max(Math.abs(source.layer - target.layer), 1);
    const spread = layerDistance > 1 ? (index % 3 - 1) * 10 : 0;
    const midX = (x1 + x2) / 2 + spread;
    path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    labelX = midX + direction * 8;
    labelY = (y1 + y2) / 2 - 6;
  }
  return { path, x1, y1, x2, y2, labelX, labelY };
}

function diagramTableSvg(record, position, selection) {
  const table = record.table;
  if (!position) {
    return "";
  }
  const columns = record.visibleColumns;
  const lines = columns.map((column, index) => diagramColumnRowSvg(column, diagramColumnBaseline(index), position.width)).join("");
  const overflowLine = record.hiddenCount ? diagramOverflowColumnRow(record.hiddenCount, diagramColumnBaseline(columns.length), position.width) : "";
  const sourceLabel = table.status === "mapped" ? "CSV" : table.status === "missing_csv" ? "No CSV" : table.status || "DBML";
  const sizeLabel = table.rowCount !== null && table.rowCount !== undefined ? `${integerText(table.rowCount)} rows` : `${integerText(record.totalColumns)} cols`;
  const roleLabel = diagramCompactRoleLabel(record.role.label);
  const statusLabel = table.status === "missing_csv" ? "miss" : table.status === "mapped" ? "ok" : table.status || "db";
  const selectionClass = diagramTableSelectionClass(table.name, selection);
  return `
    <g class="diagram-table diagram-table-${escapeHtml(diagramStatusTone(table.status))} diagram-role-${escapeHtml(record.role.name)} ${selectionClass}" data-diagram-table="${escapeHtml(table.name)}" data-diagram-layer="${position.layer}" transform="translate(${position.x} ${position.y})" tabindex="0" role="button" aria-label="${escapeHtml(`${table.name} table`)}">
      <title>${escapeHtml(`${table.name} · ${record.role.label} · ${sourceLabel} · ${sizeLabel}`)}</title>
      <rect class="diagram-table-box" width="${position.width}" height="${position.height}" rx="8"></rect>
      <rect class="diagram-table-header" width="${position.width}" height="${DIAGRAM_TABLE_HEADER_HEIGHT}" rx="8"></rect>
      <text class="diagram-table-name" x="14" y="25">${escapeHtml(truncateMiddle(table.name, position.width > 220 ? 24 : 20))}</text>
      <rect class="diagram-status-chip" x="${position.width - 54}" y="14" width="40" height="18" rx="9"></rect>
      <text class="diagram-status-text" x="${position.width - 34}" y="26" text-anchor="middle">${escapeHtml(statusLabel)}</text>
      ${diagramTableMetricPill(12, DIAGRAM_TABLE_PILL_Y, 60, roleLabel, "role")}
      ${diagramTableMetricPill(76, DIAGRAM_TABLE_PILL_Y, 50, sourceLabel, "source")}
      ${diagramTableMetricPill(130, DIAGRAM_TABLE_PILL_Y, Math.max(58, position.width - 142), sizeLabel, "size")}
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
  const roleWidth = role.length > 2 ? 40 : 28;
  const rowWidth = Math.max(120, width - 20);
  const nameLimit = width > 220 ? 25 : 21;
  const tone = column.isPk ? "pk" : column.isFk ? "fk" : "non-key";
  const target = column.fkTarget ? ` -> ${column.fkTarget}` : "";
  return `
    <g class="diagram-column-row diagram-column-row-${tone}" data-diagram-column="${escapeHtml(column.name)}" data-diagram-column-y="${y}">
      <title>${escapeHtml(`${role} ${column.name}${target}`)}</title>
      <rect class="diagram-column-row-bg" x="10" y="${y - 14}" width="${rowWidth}" height="18" rx="6"></rect>
      <rect class="diagram-column-role-bg" x="14" y="${y - 12}" width="${roleWidth}" height="14" rx="5"></rect>
      <text class="diagram-column-role" x="${14 + roleWidth / 2}" y="${y - 2}" text-anchor="middle">${escapeHtml(role)}</text>
      <text class="diagram-column-name" x="${20 + roleWidth}" y="${y - 2}">${escapeHtml(truncateMiddle(column.name, nameLimit))}</text>
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
    relationshipElement.querySelectorAll(".diagram-edge-hit, .diagram-edge").forEach((pathElement) => {
      pathElement.setAttribute("d", geometry.path);
    });
    relationshipElement.querySelector(".diagram-port-source")?.setAttribute("cx", geometry.x1);
    relationshipElement.querySelector(".diagram-port-source")?.setAttribute("cy", geometry.y1);
    relationshipElement.querySelector(".diagram-port-target")?.setAttribute("cx", geometry.x2);
    relationshipElement.querySelector(".diagram-port-target")?.setAttribute("cy", geometry.y2);
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
    ${diagramArtifactLinks(["schema_diagram.json", "relationship_graph.json", "schema_parse_report.json"])}
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
      <strong>All columns</strong>
      ${renderDiagramColumnList(columns, record.totalColumns)}
    </div>
    <div class="diagram-detail-section">
      <strong>Key columns</strong>
      ${keyColumns.length ? `<ul>${keyColumns.map((column) => `<li><code>${escapeHtml(column.name)}</code> ${escapeHtml(diagramColumnRole(column))}${column.fkTarget ? ` -> <code>${escapeHtml(column.fkTarget)}</code>` : ""}</li>`).join("")}</ul>` : `<p class="muted">No PK/FK columns in current evidence.</p>`}
    </div>
    <div class="diagram-detail-section">
      <strong>Relationships</strong>
      ${renderDiagramRelationshipList([...incoming, ...outgoing], table.name)}
    </div>
    ${diagramArtifactLinks(["schema_diagram.json", "relationship_graph.json", "schema_parse_report.json"])}
  `;
}

function renderDiagramRelationshipInspector(rel) {
  return `
    <div class="diagram-inspector-heading">
      <p class="eyebrow">Relationship</p>
      <h4><code>${escapeHtml(rel.childTable)}</code> -> <code>${escapeHtml(rel.parentTable)}</code></h4>
      <span>${escapeHtml(rel.status || "declared")}</span>
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
    ${diagramArtifactLinks(["relationship_graph.json", "schema_diagram.json"])}
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

function renderDiagramColumnList(columns, totalColumns) {
  if (!columns.length) {
    return `<p class="muted">Column-level metadata is not available in current evidence.</p>`;
  }
  const unavailableCount = Math.max(Number(totalColumns || columns.length) - columns.length, 0);
  return `
    <ol class="diagram-column-list">
      ${columns.map((column) => `
        <li>
          <div class="diagram-column-main">
            <code>${escapeHtml(column.name)}</code>
            ${column.type ? `<span>${escapeHtml(column.type)}</span>` : ""}
          </div>
          <span class="diagram-column-badge">${escapeHtml(diagramColumnRole(column))}</span>
          ${column.fkTarget ? `<span class="diagram-column-target">-> <code>${escapeHtml(column.fkTarget)}</code></span>` : ""}
        </li>
      `).join("")}
      ${unavailableCount ? `<li><span>+${integerText(unavailableCount)} columns without column-level metadata</span></li>` : ""}
    </ol>
  `;
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
        return `<li><span>${escapeHtml(direction)}</span> <code>${escapeHtml(otherTable)}</code> <span>${escapeHtml(rel.status || rel.cardinality || "FK")}</span></li>`;
      }).join("")}
    </ul>
  `;
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
          return `<li><code>${escapeHtml(link.issue_id || "issue")}</code> ${escapeHtml(link.issue_type || "")} ${escapeHtml(link.severity || "")} · ${integerText(link.bad_count)} rows${sampleUrl ? ` · <a href="${escapeHtml(sampleUrl)}" target="_blank" rel="noopener">sample</a>` : ""}</li>`;
        }).join("")}
      </ul>
    </div>
  `;
}

function diagramArtifactLinks(paths) {
  const links = paths.map((path) => {
    const url = artifactUrlFromArtifacts(path);
    return url
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener"><code>${escapeHtml(path)}</code></a>`
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

renderAll();
checkRunnerHealth();
