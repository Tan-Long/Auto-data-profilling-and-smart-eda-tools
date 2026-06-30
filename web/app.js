const state = {
  dbmlText: "",
  dbmlName: "",
  dbmlFile: null,
  flowMode: "choose",
  profileStep: "connect",
  profileVisitedSteps: ["connect"],
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
  llmMode: "openai",
  runnerAvailable: false,
  runnerHost: "",
  currentJob: null,
  runEvents: [],
  runtimeAutoFollowStageName: "",
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
  issueLlmProvider: "openai",
  issueLlmPanelOpen: true,
  issueLlmRunningIssueId: "",
  issueLlmMessage: "",
  issueLlmMessageStatus: "",
  remediationRunning: false,
  remediationMessage: "",
  remediationMessageStatus: "",
  manualRecheckRunning: false,
  manualRecheckMessage: "",
  manualRecheckMessageStatus: "",
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
const tableIssueScoreWeights = { P0: 30, P1: 18, P2: 7, P3: 2 };
const tableRelationshipScoreWeights = { invalid: 12, warning: 6, skipped: 3 };

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
  runtimeRecheckComparison: document.querySelector("#runtimeRecheckComparison"),
  stageList: document.querySelector("#stageList"),
  artifactPanelTitle: document.querySelector("#artifactPanelTitle"),
  artifactCount: document.querySelector("#artifactCount"),
  artifactList: document.querySelector("#artifactList"),
  runHistoryStatus: document.querySelector("#runHistoryStatus"),
  runHistoryCount: document.querySelector("#runHistoryCount"),
  runHistoryList: document.querySelector("#runHistoryList"),
  refreshRunHistoryButton: document.querySelector("#refreshRunHistoryButton"),
  selectedRunTimelineStatus: document.querySelector("#selectedRunTimelineStatus"),
  selectedRunTimeline: document.querySelector("#selectedRunTimeline"),
  dashboardStatusBadge: document.querySelector("#dashboardStatusBadge"),
  dashboardIssueCount: document.querySelector("#dashboardIssueCount"),
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
  reportExportMessage: document.querySelector("#reportExportMessage"),
  remediationStatus: document.querySelector("#remediationStatus"),
  remediationGrid: document.querySelector("#remediationGrid"),
  remediationMessage: document.querySelector("#remediationMessage"),
  manualRecheckStatus: document.querySelector("#manualRecheckStatus"),
  manualRecheckForm: document.querySelector("#manualRecheckForm"),
  manualRecheckDbmlInput: document.querySelector("#manualRecheckDbmlInput"),
  manualRecheckCsvInput: document.querySelector("#manualRecheckCsvInput"),
  manualRecheckButton: document.querySelector("#manualRecheckButton"),
  manualRecheckDemoButton: document.querySelector("#manualRecheckDemoButton"),
  manualRecheckBaseline: document.querySelector("#manualRecheckBaseline"),
  manualRecheckMessage: document.querySelector("#manualRecheckMessage"),
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

const profileSteps = ["connect", "preflight", "run", "review", "fix"];
const profileStepLabels = {
  connect: "Connect",
  preflight: "Preflight Review",
  run: "Run",
  review: "Review",
  fix: "Fix & Recheck",
};
const runnerUiDemoPresets = new Set(["small"]);
const runtimeStageDescriptions = {
  parse_dbml_schema: "Parses the DBML contract, counts tables and relationships, and records schema diagnostics before any CSV data is trusted.",
  catalog_csv_files: "Builds the CSV inventory, matches CSV files to DBML tables, and records missing or extra source files.",
  profile_csv_tables: "Profiles mapped CSV tables and columns, including row counts, column counts, nulls, type casts, distributions, and outlier evidence.",
  data_quality_checks: "Runs deterministic column and table checks from the DBML contract, then writes issue rows for missing, duplicate, invalid, and outlier findings.",
  relationship_checks: "Validates DBML foreign-key relationships against the CSV data, including orphan child rows, null keys, and duplicate parent keys.",
  write_machine_artifacts: "Writes the machine-readable artifacts used by Review: issues, table readiness, action plans, todos, quality gates, charts, and schema evidence.",
  issue_llm_enrichment: "Generates concise OpenAI issue guidance for every detected issue using bounded selected-issue context. If OpenAI is unavailable, Review shows a human-review fallback.",
  llm_narrative: "Generates the compatibility LLM summary artifact. This is secondary to issue-level guidance; missing provider config uses deterministic fallback.",
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
  if (jobIsRunning()) {
    renderRunnerMessage("OpenAI issue guidance is locked while the pipeline is running.", "pending");
    renderControls();
    return;
  }
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

els.refreshRunHistoryButton.addEventListener("click", async () => {
  await loadRunHistory({ force: true });
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
  [els.todosFilterAll, "all"],
  [els.todosFilterFix, "fix_data"],
  [els.todosFilterVerify, "verify_after_fix"],
].forEach(([button, filter]) => {
  button.addEventListener("click", () => {
    state.todoFilter = filter;
    renderTodosSection();
  });
});

els.reportExportGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.dashboardPanelGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.dashboardPanelGrid.addEventListener("change", (event) => {
  handleDashboardControlChange(event);
});

els.todosGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.remediationGrid.addEventListener("click", async (event) => {
  const generateTarget = event.target.closest("[data-remediation-generate]");
  if (generateTarget) {
    await generateRemediationPlan();
    return;
  }
  const applyTarget = event.target.closest("[data-remediation-apply]");
  if (applyTarget) {
    await startRemediationRecheck();
    return;
  }
  handleDashboardSelectionClick(event);
});

els.manualRecheckForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await startManualUploadRecheck();
});

els.manualRecheckDemoButton.addEventListener("click", async () => {
  await startCorrectedDemoRecheck();
});

els.tableImpactGrid.addEventListener("click", (event) => {
  handleDashboardSelectionClick(event);
});

els.dashboardDrilldown.addEventListener("click", async (event) => {
  const enrichmentTarget = event.target.closest("[data-issue-llm-run]");
  if (enrichmentTarget) {
    state.issueLlmPanelOpen = true;
    await runIssueLlmEnrichment(enrichmentTarget.dataset.issueId || "");
    return;
  }
  const target = event.target.closest("[data-action-plan-export]");
  if (!target) {
    handleDashboardSelectionClick(event);
    return;
  }
  await handleIssueActionPlanExport(target);
});

function handleDashboardSelectionClick(event) {
  const resetTarget = event.target.closest("[data-dashboard-reset-filters]");
  if (resetTarget) {
    resetDashboardFilters();
    state.dashboardSelection = { kind: "overview", value: "", label: "Review Issues" };
    renderDashboard();
    return;
  }
  const target = event.target.closest("[data-dashboard-kind]");
  if (!target) {
    return;
  }
  const nextKind = target.dataset.dashboardKind;
  const nextValue = target.dataset.dashboardValue || "";
  const shouldOpenLlm = target.dataset.dashboardOpenLlm === "true";
  if (state.dashboardSelection?.kind !== nextKind || state.dashboardSelection?.value !== nextValue) {
    state.issueLlmPanelOpen = true;
  } else if (shouldOpenLlm) {
    state.issueLlmPanelOpen = true;
  }
  state.dashboardSelection = {
    kind: nextKind,
    value: nextValue,
    label: target.dataset.dashboardLabel || target.textContent.trim(),
  };
  const changedFilter = applyDashboardSelectionFilter(nextKind, nextValue);
  if (changedFilter) {
    renderDashboard();
  } else {
    if (nextKind === "table_assessment") {
      renderTableImpactSection();
    }
    renderDashboardDrilldown();
  }
  if (target.dataset.dashboardScroll === "drilldown") {
    window.requestAnimationFrame(() => {
      els.dashboardDrilldown.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
  } else if (target.dataset.dashboardScroll === "llm") {
    window.requestAnimationFrame(() => {
      const anchor = els.dashboardDrilldown.querySelector(".issue-llm-enrichment") || els.dashboardDrilldown;
      anchor.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
  }
}

function handleDashboardControlChange(event) {
  const tableFilter = event.target.closest("[data-issue-table-filter]");
  if (!tableFilter) {
    return;
  }
  const nextTable = tableFilter.value || "all";
  resetDashboardFilters();
  if (nextTable === "all") {
    state.dashboardSelection = { kind: "overview", value: "", label: "Review Issues" };
  } else {
    state.dashboardFilters.table = nextTable;
    state.dashboardSelection = { kind: "table", value: nextTable, label: nextTable };
  }
  renderDashboard();
}

function applyDashboardSelectionFilter(kind, value) {
  const previous = { ...state.dashboardFilters };
  if (kind === "severity") {
    resetDashboardFilters();
    state.dashboardFilters.severity = value || "all";
  } else if (kind === "issue_type") {
    resetDashboardFilters();
    state.dashboardFilters.issueType = value || "all";
  } else if (kind === "table") {
    resetDashboardFilters();
    state.dashboardFilters.table = value || "all";
  } else {
    return false;
  }
  return (
    previous.severity !== state.dashboardFilters.severity ||
    previous.issueType !== state.dashboardFilters.issueType ||
    previous.table !== state.dashboardFilters.table
  );
}

function resetDashboardFilters() {
  state.dashboardFilters = { severity: "all", issueType: "all", table: "all" };
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
    await loadRunHistory({ force: true });
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
    const firstRemediable = state.runHistory.find((run) => runCanRemediate(run));
    state.selectedHistoryJobId = preferredEntry?.job_id || firstRemediable?.job_id || state.runHistory[0]?.job_id || "";
  } catch (error) {
    state.runHistoryError = error.message || "Unable to load run history.";
  } finally {
    state.runHistoryLoading = false;
    renderRunHistory();
    renderProfileStepper();
    renderSidebarNavigation();
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
      const artifactPayload = await waitForEvaluationArtifactPayload(jobId, payload);
      await loadEvaluationArtifacts(artifactPayload);
      if (!state.evaluationArtifacts["evaluation_summary.json"]) {
        throw new Error("Evaluation completed but comparison artifacts were not ready.");
      }
      state.evaluationLoadingJobId = "";
      renderEvaluationMessage("Evaluation complete. Comparison Summary is ready.", "success");
      renderEvaluation();
      renderSidebarNavigation();
      return;
    }
    if (payload.status === "failed") {
      state.evaluationLoadingJobId = "";
      renderEvaluationMessage(payload.error || "Evaluation run failed.", "error");
      renderEvaluation();
      renderSidebarNavigation();
      return;
    }
  }
}

function evaluationRequiredArtifactPaths() {
  return [
    "evaluation_summary.json",
    "ground_truth_issues.json",
    "baseline_comparison.json",
  ];
}

async function waitForEvaluationArtifactPayload(jobId, initialPayload) {
  let payload = initialPayload;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const artifacts = payload?.artifacts || [];
    const ready = evaluationRequiredArtifactPaths().every((artifactPath) => (
      Boolean(evaluationArtifactUrl(artifactPath, artifacts))
    ));
    if (ready) {
      state.evaluationJob = payload;
      return payload;
    }
    await wait(250);
    const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" });
    const nextPayload = await response.json();
    if (!response.ok) {
      throw new Error(nextPayload.error || "Unable to refresh evaluation artifacts.");
    }
    payload = nextPayload;
  }
  state.evaluationJob = payload;
  return payload;
}

async function loadEvaluationArtifacts(job) {
  const artifactPaths = evaluationRequiredArtifactPaths();
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
    const targetStep = state.profileStep === "fix" ? "fix" : "review";
    state.profileStep = targetStep;
    markProfileStepVisited("run");
    markProfileStepVisited("review");
    markProfileStepVisited(targetStep);
    renderRunnerMessage(
      targetStep === "fix"
        ? `Loaded run ${jobId} from history for Fix & Recheck.`
        : `Loaded run ${jobId} from history.`,
      "success",
    );
  } catch (error) {
    renderRunnerMessage(error.message || "Unable to load the selected run.", "error");
  } finally {
    renderAll();
  }
}

async function startProfilerRun() {
  state.profileStep = "run";
  markProfileStepVisited("run");
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
  state.runtimeAutoFollowStageName = "";
  state.currentJob = { status: "queued", artifacts: [] };
  resetDashboardState();
  renderJob();
  renderControls();
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
    const message = error.message || "Unable to start local run.";
    state.currentJob = { status: "failed", error: message, artifacts: [] };
    renderRunnerMessage(message, "error");
  } finally {
    renderAll();
  }
}

async function startPathRun() {
  state.profileStep = "run";
  markProfileStepVisited("run");
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
  const preset = demoPresets[state.selectedDemoPreset];
  if (preset?.dbmlPath === dbmlPath && preset?.csvDir === csvDir) {
    if (preset.target) {
      payload.target = preset.target;
    }
  }
  const mappingOverrides = mappingOverridesForRun();
  if (Object.keys(mappingOverrides).length) {
    payload.mapping_overrides = mappingOverrides;
  }
  payload.preflight_review = buildPreflightReviewPayload(preflightReview);
  Object.assign(payload, llmRunOptions());

  state.runEvents = [];
  state.runtimeAutoFollowStageName = "";
  state.currentJob = { status: "queued", input_mode: "path", artifacts: [] };
  resetDashboardState();
  renderJob();
  renderControls();
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
    const message = error.message || "Unable to start local profiler run.";
    state.currentJob = { status: "failed", error: message, artifacts: [] };
    renderRunnerMessage(message, "error");
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
  if (state.flowMode === "profile") {
    markProfileStepVisited(state.profileStep || "connect");
  }
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
  markProfileStepVisited(nextStep);
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

function markProfileStepVisited(step) {
  if (!profileSteps.includes(step)) {
    return;
  }
  if (!state.profileVisitedSteps.includes(step)) {
    state.profileVisitedSteps = [...state.profileVisitedSteps, step];
  }
}

function resetProfileVisitedSteps(step = "connect") {
  state.profileVisitedSteps = [profileSteps.includes(step) ? step : "connect"];
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
  if (jobIsRunning()) {
    renderRunnerMessage("OpenAI issue guidance is locked while the pipeline is running.", "pending");
    renderControls();
    return;
  }
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
      updateRecheckMessagesAfterJobFinished(state.currentJob);
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

function updateRecheckMessagesAfterJobFinished(job) {
  if (job?.input_mode === "manual_recheck") {
    state.manualRecheckRunning = false;
    state.manualRecheckMessage = job.status === "succeeded"
      ? "Manual corrected-input recheck complete. Stage 3 now shows the before/after comparison."
      : job.error || "Manual corrected-input recheck failed.";
    state.manualRecheckMessageStatus = job.status === "succeeded" ? "success" : "error";
  }
  if (job?.input_mode === "remediation") {
    state.remediationRunning = false;
    state.remediationMessage = job.status === "succeeded"
      ? "Copy-only remediation recheck complete. Stage 3 now shows the before/after comparison."
      : job.error || "Copy-only remediation recheck failed.";
    state.remediationMessageStatus = job.status === "succeeded" ? "success" : "error";
  }
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
  if (!options.preserveStep) {
    resetProfileVisitedSteps("connect");
  } else {
    markProfileStepVisited(state.profileStep);
  }
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
  resetProfileVisitedSteps("connect");
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
    return { use_llm: false, use_issue_llm: false };
  }
  return {
    use_llm: true,
    use_issue_llm: true,
    llm_provider: state.llmMode,
  };
}

function appendLlmFormFields(form) {
  const options = llmRunOptions();
  form.append("use_llm", options.use_llm ? "true" : "false");
  form.append("use_issue_llm", options.use_issue_llm ? "true" : "false");
  if (options.llm_provider) {
    form.append("llm_provider", options.llm_provider);
  }
}

function llmRunSuffix() {
  return state.llmMode === "off" ? "" : " with OpenAI issue guidance";
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
  resetProfileVisitedSteps("connect");
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
  resetProfileVisitedSteps("connect");
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
    const visible = profileStageVisibleForSidebar(cardStep);
    card.hidden = !visible;
    if (!visible) {
      card.tabIndex = -1;
      card.setAttribute("aria-disabled", "true");
      return;
    }
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
    : "Workflow ready";
  els.profileStepHint.textContent = guard.message;
  els.profileStepHint.dataset.status = guard.allowed ? "ready" : "blocked";
}

function renderSidebarNavigation() {
  if (!els.workflowNav) {
    return;
  }
  const activeTarget = resolvedWorkflowActiveTarget();
  if (state.flowMode === "profile") {
    els.workflowNav.innerHTML = renderProfileWorkflowNav(activeTarget);
    return;
  }
  if (state.flowMode === "evaluate") {
    els.workflowNav.innerHTML = renderEvaluateWorkflowNav(activeTarget);
    return;
  }
  els.workflowNav.innerHTML = renderChooseWorkflowNavItem(activeTarget);
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
  const visibleStages = profileWorkflowStages.filter((stage) => profileStageVisibleForSidebar(stage.step));
  return `
    <section class="nav-section" aria-label="Profile stages">
      <p class="nav-section-title">Profile flow</p>
      ${visibleStages.map((stage) => renderProfileStageNavItem(stage, activeTarget)).join("")}
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

function profileStageVisibleForSidebar(step) {
  if (state.flowMode !== "profile") {
    return false;
  }
  return profileSteps.includes(step);
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
  const visibleSteps = evaluateWorkflowSteps.filter((step) => evaluateStepVisibleForSidebar(step.target));
  const activeStep = visibleSteps.some((step) => step.target === activeTarget)
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
          ${visibleSteps.map((step) => {
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

function evaluateStepVisibleForSidebar(target) {
  if (target === "evaluateFlow") {
    return true;
  }
  if (target === "evaluationComparison") {
    return Boolean(state.evaluationArtifacts["evaluation_summary.json"]);
  }
  return false;
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
    return evaluateWorkflowSteps.filter((step) => evaluateStepVisibleForSidebar(step.target)).map((step) => step.target);
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
  if (step === "review") {
    const ready = profileRunComplete() || Boolean(state.dashboardArtifactIndex);
    return {
      allowed: ready || hasRemediableHistoryRun(),
      message: ready
        ? "Review complete. Continue to Fix & Recheck."
        : "Open a prior completed run in Fix & Recheck, or finish a profile run first.",
    };
  }
  if (step === "fix") {
    return {
      allowed: false,
      message: hasRemediationResult()
        ? "Remediation recheck artifacts are ready."
        : "Select a completed run, approve copy-only fixes, and recheck the staged copy.",
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

function hasRemediableHistoryRun() {
  return state.runHistory.some((run) => runCanRemediate(run));
}

function runCanRemediate(run) {
  const inputMode = run?.input_mode || "";
  return run?.status === "succeeded" && ["upload", "path", "remediation", "manual_recheck"].includes(inputMode);
}

function hasRemediationResult() {
  return Boolean(getBeforeAfterQualityDiffArtifact() || getApprovedRemediationsArtifact());
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
  if (step === "fix") {
    return profileRunComplete() || Boolean(state.dashboardArtifactIndex) || hasRemediableHistoryRun();
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
  if (step === "review") {
    return Boolean(state.dashboardArtifactIndex);
  }
  if (step === "fix") {
    return hasRemediationResult();
  }
  return false;
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
          ${dataset.source_license ? `<span>${escapeHtml(dataset.source_license)} source</span>` : ""}
        </span>
        ${dataset.source_name ? `<small>${escapeHtml(dataset.source_name)}</small>` : ""}
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
    els.evaluationBaselineList.innerHTML = `<p class="muted">Great Expectations baseline status loads after comparison. The final matrix places VSF and GE side by side.</p>`;
    els.evaluationArtifactLinks.innerHTML = "";
    return;
  }

  const correctness = summary.correctness || {};
  const usefulness = summary.usefulness || {};
  const baselineSummary = summary.baseline || {};
  const baselineRows = summary.baseline_rows || baseline?.rows || [];
  els.evaluationComparisonStatus.textContent = `${summary.dataset?.label || "Evaluation"} complete`;
  els.evaluationSummaryStrip.innerHTML = `
    <div><span>VSF caught</span><strong>${integerText(correctness.vsf_caught_occurrence_count)}/${integerText(correctness.expected_issue_occurrence_count)}</strong></div>
    <div><span>missed</span><strong>${integerText(correctness.vsf_missed_occurrence_count)}</strong></div>
    <div><span>extra</span><strong>${integerText(correctness.vsf_extra_occurrence_count)}</strong></div>
    <div><span>GE status</span><strong>${escapeHtml(baselineStatusLabel(baselineSummary.status))}</strong></div>
    <div><span>guidance</span><strong>${integerText(usefulness.issue_action_plan_count)} plans</strong></div>
  `;
  els.evaluationExpectedList.innerHTML = renderEvaluationComparisonMatrix(
    summary.issue_comparison_rows || [],
    baselineRows,
  );
  els.evaluationUsefulnessList.innerHTML = renderEvaluationUsefulnessRows(usefulness);
  els.evaluationBaselineList.innerHTML = renderEvaluationBaselineSummary(baselineRows, baselineSummary);
  els.evaluationArtifactLinks.innerHTML = renderEvaluationArtifactLinks();
}

function renderEvaluationComparisonMatrix(rows, baselineRows) {
  if (!rows.length) {
    return `<p class="muted">No comparison rows were generated.</p>`;
  }
  const baselineByGroundTruthId = new Map((Array.isArray(baselineRows) ? baselineRows : [])
    .map((row) => [row.ground_truth_id, row]));
  const visibleRows = rows.slice(0, 10);
  const remainingRows = rows.slice(visibleRows.length);
  return `
    <div class="evaluation-comparison-table" role="table" aria-label="VSF and Great Expectations comparison">
      <div class="evaluation-comparison-header" role="row">
        <span role="columnheader">Seeded issue</span>
        <span role="columnheader">VSF profiler</span>
        <span role="columnheader">Great Expectations</span>
      </div>
      ${visibleRows.map((row) => renderEvaluationComparisonRow(row, baselineByGroundTruthId.get(row.ground_truth_id))).join("")}
    </div>
    ${remainingRows.length ? `
      <details class="evaluation-more-rows">
        <summary>Show ${integerText(remainingRows.length)} more expected issue${remainingRows.length === 1 ? "" : "s"}</summary>
        <div class="evaluation-comparison-table compact" role="table" aria-label="Additional comparison rows">
          ${remainingRows.map((row) => renderEvaluationComparisonRow(row, baselineByGroundTruthId.get(row.ground_truth_id))).join("")}
        </div>
      </details>
    ` : ""}
  `;
}

function renderEvaluationComparisonRow(row, baselineRow) {
  const geRow = baselineRow || {};
  const actualIssueIds = Array.isArray(row.actual_issue_ids) ? row.actual_issue_ids.filter(Boolean) : [];
  const geReason = shortEvaluationReason(geRow.reason || "", geRow.ge_status, geRow.baseline_coverage);
  return `
    <article class="evaluation-comparison-row" role="row">
      <div class="evaluation-comparison-cell expected" role="cell">
        <span class="evaluation-cell-label">Seeded issue</span>
        <div class="evaluation-cell-heading">
          <span class="issue-pill ${issueStatusClass(issueStatus(row))}">${escapeHtml(row.severity || "P?")}</span>
          <strong>${escapeHtml(issueTypeLabel(row))}</strong>
        </div>
        <small>${escapeHtml(evaluationIssueContext(row))}</small>
        <div class="evaluation-row-metrics">
          <code>${integerText(row.expected_occurrences)} expected group${Number(row.expected_occurrences || 0) === 1 ? "" : "s"}</code>
          <code>${integerText(row.expected_bad_count)} bad rows</code>
        </div>
      </div>
      <div class="evaluation-comparison-cell tool" role="cell">
        <span class="evaluation-cell-label">VSF profiler</span>
        <div class="evaluation-tool-status">
          <span class="pill-status ${evaluationStatusClass(row.vsf_status)}">${escapeHtml(row.vsf_status || "unknown")}</span>
          <strong>${integerText(row.actual_occurrences)}/${integerText(row.expected_occurrences)}</strong>
        </div>
        <small>${escapeHtml(readableEvaluationStatus(row.bad_count_status || "bad count unknown"))}</small>
        ${actualIssueIds.length ? `
          <div class="evaluation-issue-chips">
            ${actualIssueIds.slice(0, 3).map((issueId) => `<code>${escapeHtml(issueId)}</code>`).join("")}
            ${actualIssueIds.length > 3 ? `<span>+${integerText(actualIssueIds.length - 3)}</span>` : ""}
          </div>
        ` : ""}
      </div>
      <div class="evaluation-comparison-cell tool" role="cell">
        <span class="evaluation-cell-label">Great Expectations</span>
        <div class="evaluation-tool-status">
          <span class="pill-status ${evaluationStatusClass(geRow.ge_status)}">${escapeHtml(baselineStatusLabel(geRow.ge_status))}</span>
          <strong>${geRow.observed_bad_count === null || geRow.observed_bad_count === undefined ? "--" : integerText(geRow.observed_bad_count)}</strong>
        </div>
        <small>${escapeHtml(geReason || baselineCoverageLabel(geRow.baseline_coverage))}</small>
      </div>
    </article>
  `;
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

function renderEvaluationBaselineSummary(rows, baselineSummary) {
  const reason = humanEvaluationReason(baselineSummary.reason || "");
  const nativeCount = (Array.isArray(rows) ? rows : []).filter((row) => row.baseline_coverage === "native").length;
  const reasonMarkup = reason
    ? `<p class="evaluation-baseline-note">${escapeHtml(reason)}</p>`
    : "";
  return `
    <div class="evaluation-metric-grid">
      <div><span>GE caught</span><strong>${integerText(baselineSummary.ge_caught_group_count)}</strong></div>
      <div><span>Not covered</span><strong>${integerText(baselineSummary.ge_not_covered_group_count)}</strong></div>
      <div><span>Unavailable</span><strong>${integerText(baselineSummary.ge_unavailable_group_count)}</strong></div>
      <div><span>Baseline gaps</span><strong>${integerText(baselineSummary.baseline_gap_count)}</strong></div>
      <div><span>Native checks</span><strong>${integerText(nativeCount)}</strong></div>
    </div>
    ${reasonMarkup}
    <p class="muted">The comparison matrix above shows the VSF result and the GE baseline state on the same seeded issue row.</p>
  `;
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

function jobIsRunning(job = state.currentJob) {
  return ["queued", "running"].includes(job?.status);
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
    return "GE not installed";
  }
  return status || "unknown";
}

function baselineCoverageLabel(coverage) {
  if (coverage === "native") {
    return "Native GE check";
  }
  if (coverage === "not_covered") {
    return "Not covered by baseline";
  }
  return "Baseline state unknown";
}

function readableEvaluationStatus(status) {
  return String(status || "unknown").replace(/_/g, " ");
}

function humanEvaluationReason(reason) {
  const text = String(reason || "").trim();
  if (text.includes("ModuleNotFoundError") && text.includes("great_expectations")) {
    return "Great Expectations is not installed in this local environment. VSF still ran against seeded ground truth.";
  }
  if (text.includes("PandasDataset")) {
    return "Installed Great Expectations version does not expose the legacy PandasDataset adapter used by this benchmark.";
  }
  return text;
}

function shortEvaluationReason(reason, status, coverage) {
  const text = humanEvaluationReason(reason);
  if (status === "unavailable" && text.includes("Great Expectations is not installed")) {
    return "Optional GE baseline unavailable.";
  }
  if (coverage === "not_covered") {
    return "VSF-only data-quality check.";
  }
  return text;
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
  const jobRunning = jobIsRunning();
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
  const locked = jobIsRunning();
  const subtext = els.llmModeToggle.querySelector(".llm-toggle-subtext");
  els.llmModeStatus.textContent = enabled ? "On" : "Off";
  els.llmModeToggle.classList.toggle("active", enabled);
  els.llmModeToggle.classList.toggle("locked", locked);
  els.llmModeToggle.disabled = locked;
  els.llmModeToggle.setAttribute("aria-disabled", locked ? "true" : "false");
  els.llmModeToggle.setAttribute("aria-checked", enabled ? "true" : "false");
  els.llmModeToggle.setAttribute(
    "aria-label",
    locked
      ? `OpenAI issue guidance is locked ${enabled ? "on" : "off"} while the pipeline is running`
      : enabled ? "Disable OpenAI issue guidance" : "Enable OpenAI issue guidance",
  );
  els.llmModeToggle.title = locked
    ? "This setting is fixed for the current pipeline run."
    : "";
  if (subtext) {
    subtext.textContent = locked
      ? "Locked for this run. Wait for the pipeline to finish before changing it."
      : "After deterministic checks, adds bounded issue-level guidance before Review.";
  }
}

function renderRunner() {
  renderJob();
}

function renderJob() {
  const job = state.currentJob;
  els.jobStatusBadge.textContent = job?.status || "No job";
  els.eventCount.textContent = `${state.runEvents.length} events`;
  const artifacts = job?.artifacts || [];
  const reviewReady = generatedReviewResultsReady();
  els.artifactPanelTitle.textContent = reviewReady ? "Issue review snapshot" : "Generated results";
  if (reviewReady) {
    const artifactTotal = Object.keys(state.dashboardArtifactIndex?.artifact_urls || {}).length || artifacts.length;
    els.artifactCount.textContent = `${artifactTotal} files`;
  } else if (state.dashboardLoadingJobId) {
    els.artifactCount.textContent = "Loading results";
  } else if (jobIsRunning(job)) {
    els.artifactCount.textContent = "Running";
  } else {
    els.artifactCount.textContent = "Waiting for run";
  }
  renderStages(job);
  renderRuntimeRecheckComparison(job);
  renderArtifacts(artifacts);
}

function renderRuntimeRecheckComparison(job) {
  if (!els.runtimeRecheckComparison) {
    return;
  }
  if (!isRecheckJob(job)) {
    els.runtimeRecheckComparison.hidden = true;
    els.runtimeRecheckComparison.innerHTML = "";
    return;
  }

  els.runtimeRecheckComparison.hidden = false;
  const diff = getBeforeAfterQualityDiffArtifact();
  const runSummary = getRemediationRunSummaryArtifact();
  const summary = diff?.summary || runSummary?.quality_diff_summary || null;
  const sourceJobId = diff?.before_job_id || runSummary?.source_job_id || job?.remediation?.source_job_id || "";
  const afterJobId = diff?.after_job_id || runSummary?.recheck_job_id || job?.job_id || "";
  const sourceLabel = runSummary?.source || (job?.input_mode === "remediation" ? "copy-only remediation" : "corrected inputs");

  if (!summary) {
    const status = jobIsRunning(job)
      ? "Recheck running"
      : state.dashboardLoadingJobId
        ? "Loading comparison"
        : "Comparison pending";
    els.runtimeRecheckComparison.innerHTML = `
      <section class="runtime-recheck-card pending" aria-label="Before and after recheck comparison">
        <div class="runtime-recheck-heading">
          <div>
            <span>Stage 5 recheck</span>
            <strong>Before / after comparison</strong>
          </div>
          <code>${escapeHtml(status)}</code>
        </div>
        <div class="runtime-recheck-flow">
          <div><span>before</span><strong>${escapeHtml(sourceJobId || "baseline run")}</strong></div>
          <div class="runtime-recheck-arrow" aria-hidden="true">-></div>
          <div><span>after</span><strong>${escapeHtml(afterJobId || "current run")}</strong></div>
        </div>
        <p>Comparison appears here after <code>before_after_quality_diff.json</code> is loaded.</p>
      </section>
    `;
    return;
  }

  const issueDelta = Number(summary.issue_delta || 0);
  const tone = issueDelta < 0 ? "success" : issueDelta > 0 ? "danger" : "neutral";
  const diffUrl = artifactUrlFromArtifacts("before_after_quality_diff.json", job?.artifacts || []);
  els.runtimeRecheckComparison.innerHTML = `
    <section class="runtime-recheck-card ${tone}" aria-label="Before and after recheck comparison">
      <div class="runtime-recheck-heading">
        <div>
          <span>Stage 5 recheck · ${escapeHtml(sourceLabel)}</span>
          <strong>${escapeHtml(sourceJobId || "baseline")} -> ${escapeHtml(afterJobId || "current")}</strong>
        </div>
        ${diffUrl ? `<a href="${escapeHtml(diffUrl)}" target="_blank" rel="noopener">Open diff</a>` : `<code>before_after_quality_diff.json</code>`}
      </div>
      <div class="runtime-recheck-metrics">
        ${renderRuntimeRecheckMetric("issues", `${integerText(summary.before_issue_count)} -> ${integerText(summary.after_issue_count)}`, tone)}
        ${renderRuntimeRecheckMetric("resolved", integerText(summary.resolved_issue_count), "success")}
        ${renderRuntimeRecheckMetric("new", integerText(summary.new_issue_count), Number(summary.new_issue_count || 0) ? "danger" : "success")}
        ${renderRuntimeRecheckMetric("blocked gates", `${integerText(summary.before_blocked_gates)} -> ${integerText(summary.after_blocked_gates)}`, Number(summary.after_blocked_gates || 0) ? "warning" : "success")}
        ${renderRuntimeRecheckMetric("verdict", `${summary.before_verdict || "unknown"} -> ${summary.after_verdict || "unknown"}`, summary.after_verdict === "READY" ? "success" : "warning")}
      </div>
    </section>
  `;
}

function renderRuntimeRecheckMetric(label, value, tone) {
  return `
    <div class="runtime-recheck-metric ${escapeHtml(tone || "")}">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function isRecheckJob(job) {
  return ["manual_recheck", "remediation"].includes(job?.input_mode) || Boolean(job?.remediation?.source_job_id);
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
  const activeStageName = activeRuntimeStageName(visibleStages, job);
  if (!visibleStages.length) {
    els.stageList.innerHTML = `<p class="muted">Run events from <code>run_events.jsonl</code> will appear here.</p>`;
    return;
  }
  visibleStages.forEach((stage) => {
    els.stageList.insertAdjacentHTML(
      "beforeend",
      renderRuntimeStage(stage, { active: stage.name === activeStageName }),
    );
  });
  followActiveRuntimeStage(activeStageName, job);
}

function activeRuntimeStageName(stages, job) {
  if (!jobIsRunning(job)) {
    return "";
  }
  const visibleStages = Array.isArray(stages) ? stages : [];
  const activeStages = visibleStages.filter((stage) => ["queued", "running"].includes(stage.status || "running"));
  const activeStage = activeStages[activeStages.length - 1] || visibleStages[visibleStages.length - 1];
  return activeStage?.name || "";
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
  if (job.llm?.issue_enrichment_enabled) {
    const issueLlmStage = stageMap.get("issue_llm_enrichment");
    if (!issueLlmStage || !["completed", "skipped", "failed"].includes(issueLlmStage.status)) {
      return;
    }
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

function renderRuntimeStage(stage, options = {}) {
  const status = stage.status || "running";
  const purpose = stagePurpose(stage);
  const active = Boolean(options.active && ["queued", "running"].includes(status));
  const duration = stage.duration === null || stage.duration === undefined
    ? ""
    : ` · ${Number(stage.duration).toFixed(3)}s`;
  return `
    <details class="stage-item runtime-stage-item ${escapeHtml(status)} ${active ? "active" : ""}" data-stage-name="${escapeHtml(stage.name || "stage")}" data-stage-status="${escapeHtml(status)}" ${active ? 'open aria-current="step"' : ""}>
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

function followActiveRuntimeStage(stageName, job) {
  if (!stageName || !jobIsRunning(job) || state.flowMode !== "profile" || state.profileStep !== "run") {
    return;
  }
  if (state.runtimeAutoFollowStageName === stageName) {
    return;
  }
  state.runtimeAutoFollowStageName = stageName;
  window.requestAnimationFrame(() => {
    const stageElement = [...els.stageList.querySelectorAll(".runtime-stage-item")]
      .find((candidate) => candidate.dataset.stageName === stageName);
    if (!stageElement) {
      return;
    }
    ensureRuntimeStageDetailVisible(stageElement);
    stageElement.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  });
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
  if (stage.name === "llm_narrative") {
    rows.push(["Scope", guardrailScopeText()]);
  }
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
      if (stage.name === "llm_narrative" && key === "guardrail_status") {
        rows.push(["LLM output validation", guardrailDisplayStatus(value)]);
        return;
      }
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
  if (!generatedReviewResultsReady()) {
    els.artifactList.innerHTML = renderGeneratedResultsPending();
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

function renderGeneratedResultsPending() {
  const running = jobIsRunning();
  const loading = Boolean(state.dashboardLoadingJobId);
  const message = loading
    ? "Loading generated Review artifacts from the completed run."
    : running
      ? "Pipeline is running. Result previews appear here after Stage 3 completes."
      : "Run Stage 3 to generate Review Issues, Quality Gates, Todos, and Report / Export.";
  return `
    <div class="generated-results pending">
      <p class="muted">${escapeHtml(message)}</p>
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
  els.refreshRunHistoryButton.disabled = state.runHistoryLoading || !state.runnerAvailable;

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
  const remediable = runCanRemediate(run);
  const gateSummary = run.quality_gate_summary || {};
  const stages = visibleRuntimeStages(run.stages);
  const stageCount = stages.length || run.stage_count || 0;
  const failedStageCount = stages.length
    ? stages.filter((stage) => stage.status === "failed").length
    : run.failed_stage_count || 0;
  const finished = run.finished_at ? `finished ${formatRunTimestamp(run.finished_at)}` : "finish time unavailable";
  const created = run.created_at ? `created ${formatRunTimestamp(run.created_at)}` : "created time unavailable";
  return `
    <button class="run-history-item ${selected ? "selected" : ""} ${remediable ? "" : "unavailable"}" type="button" data-run-history-job-id="${escapeHtml(run.job_id)}" aria-pressed="${selected ? "true" : "false"}" ${remediable ? "" : "disabled"}>
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
        <span>${remediable ? "remediate" : "view only"}</span>
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
  return stage?.name === "influence_analysis";
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
  if (!generatedReviewResultsReady()) {
    return renderGeneratedResultsPending();
  }

  const optionalCards = [
    renderGeneratedL4Preview(artifacts),
    renderGeneratedIssueLlmPreview(artifacts),
  ].filter(Boolean).join("");

  return `
    ${renderRunSnapshotCard()}
    ${optionalCards ? `<div class="generated-result-grid generated-result-grid-secondary">${optionalCards}</div>` : ""}
  `;
}

function renderRunSnapshotCard() {
  const verdict = generatedVerdictSummary();
  const severity = generatedSeveritySummary();
  const columns = generatedColumnUsabilitySummary();
  const tables = generatedTableReadinessSummary();
  const runtime = generatedRuntimeSummary();
  const riskTone = verdict.riskValue >= 80 ? "danger" : verdict.riskValue >= 40 ? "warning" : "success";
  const maxSeverity = Math.max(...severity.rows.map((row) => row.count), 1);
  return `
    <section class="run-snapshot-card" aria-label="Issue review snapshot">
      <div class="run-snapshot-hero ${riskTone}">
        <div class="run-snapshot-readiness">
          <span>Data-quality readiness</span>
          <strong>${escapeHtml(verdict.label)}</strong>
          <small>${integerText(verdict.issueCount)} issues · ${integerText(verdict.blockerCount)} top blockers</small>
        </div>
        <div class="run-snapshot-risk">
          <span>risk</span>
          <strong>${escapeHtml(verdict.riskLabel)}</strong>
          <div class="run-snapshot-risk-track" aria-hidden="true">
            <span class="${riskTone}" style="width: ${verdict.riskValue}%"></span>
          </div>
        </div>
      </div>
      <div class="run-snapshot-grid">
        <section class="run-snapshot-section run-snapshot-wide">
          <div class="run-snapshot-section-heading">
            <strong>Issue counts</strong>
            <span>${integerText(severity.total)} issues</span>
          </div>
          <div class="run-snapshot-severity-bars">
            ${severity.rows.map((row) => renderRunSnapshotSeverityRow(row, maxSeverity)).join("")}
          </div>
        </section>
        <section class="run-snapshot-section">
          <div class="run-snapshot-section-heading">
            <strong>Column usability</strong>
            <span>${integerText(columns.total)} columns</span>
          </div>
          ${renderRunSnapshotMetricStrip([
            ["blocked columns", columns.blocked, "danger"],
            ["need prep", columns.needsPreparation, "warning"],
            ["ready", columns.ready, "success"],
          ])}
        </section>
        <section class="run-snapshot-section">
          <div class="run-snapshot-section-heading">
            <strong>Table readiness</strong>
            <span>${integerText(tables.tableCount)} tables</span>
          </div>
          <div class="run-snapshot-health">
            <strong>${escapeHtml(tables.averageHealthLabel)}</strong>
            <span>avg health · ${integerText(tables.notReady)} not ready</span>
          </div>
          ${tables.topTables.length ? `<div class="run-snapshot-table-tags">${tables.topTables.map((table) => `<code>${escapeHtml(table)}</code>`).join("")}</div>` : ""}
        </section>
        <section class="run-snapshot-section">
          <div class="run-snapshot-section-heading">
            <strong>Runtime summary</strong>
            <span>${escapeHtml(runtime.status)}</span>
          </div>
          ${renderRunSnapshotMetricStrip([
            ["stages", runtime.stageCount, ""],
            ["failed", runtime.failedStageCount, runtime.failedStageCount ? "danger" : "success"],
            ["runtime", runtime.durationLabel, ""],
          ])}
        </section>
      </div>
    </section>
  `;
}

function renderRunSnapshotSeverityRow(row, maxValue) {
  const width = row.count > 0 ? Math.max(4, Math.round(row.count / maxValue * 100)) : 0;
  return `
    <div class="run-snapshot-severity-row">
      <code>${escapeHtml(row.label)}</code>
      <span class="run-snapshot-bar" aria-hidden="true">
        <span class="${dashboardTone(row.label)}" style="width: ${width}%"></span>
      </span>
      <strong>${integerText(row.count)}</strong>
    </div>
  `;
}

function renderRunSnapshotMetricStrip(items) {
  return `
    <div class="run-snapshot-metric-strip">
      ${items.map(([label, value, tone]) => `
        <div class="${tone ? `run-snapshot-metric ${tone}` : "run-snapshot-metric"}">
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function generatedVerdictSummary() {
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const riskScore = verdict.risk_score ?? verdict.summary?.risk_score;
  const riskKnown = Number.isFinite(Number(riskScore));
  const riskValue = riskKnown ? clampNumber(riskScore, 0, 100) : 0;
  return {
    label: verdict.verdict || verdict.summary?.verdict || "Waiting",
    riskValue,
    riskLabel: riskKnown ? `${integerText(riskValue)}/100` : "--",
    issueCount: verdict.issue_counts?.total ?? getDashboardIssues().length,
    blockerCount: Array.isArray(verdict.top_blockers) ? verdict.top_blockers.length : 0,
  };
}

function generatedSeveritySummary() {
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const runSummary = generatedRunSummary();
  const issues = getDashboardIssues();
  const bySeverity = verdict.issue_counts?.by_severity || runSummary.issue_counts?.by_severity || {};
  const total = verdict.issue_counts?.total ?? runSummary.issue_counts?.total ?? issues.length;
  return {
    total,
    rows: severityOrder.map((label) => ({ label, count: Number(bySeverity[label] || 0) })),
  };
}

function generatedColumnUsabilitySummary() {
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
  return { ready, needsPreparation, blocked, total: ready + needsPreparation + blocked };
}

function generatedTableReadinessSummary() {
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
    .map((assessment) => assessment.table)
    .filter(Boolean);
  return {
    tableCount,
    notReady,
    topTables,
    averageHealthLabel: averageHealth === undefined ? "--" : integerText(averageHealth),
  };
}

function generatedRuntimeSummary() {
  const runSummary = generatedRunSummary();
  const stages = visibleRuntimeStages(runSummary.stage_timings);
  const failedStages = visibleRuntimeStages(runSummary.failed_stages).length;
  const duration = runSummary.duration_seconds;
  return {
    status: runSummary.status || state.currentJob?.status || "pending",
    stageCount: stages.length,
    failedStageCount: failedStages,
    durationLabel: duration === undefined ? "--" : `${Number(duration).toFixed(2)}s`,
  };
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
  const displayStatus = guardrailDisplayStatus(status);
  const providerLabel = `${provider}${model ? ` · ${model}` : ""}`;
  const details = [
    ["What this means", "The optional LLM report text passed validation for supported numbers, references, and safety constraints."],
    ["What it does not mean", "It does not mark the dataset ready. Data readiness still comes from Quality Gates, issues, and table readiness."],
    ["Provider", providerLabel],
    ["Evidence checked", `${integerText(checkedNumbers)} numbers · ${integerText(checkedRefs)} refs · ${integerText(violationCount)} violations`],
    ["Raw CSV sent to LLM", guardrail.raw_csv_included ? "yes" : "no"],
    ["Fallback", fallback || "none"],
  ];
  const body = `
    <div class="generated-result-kpi">
      <strong>${escapeHtml(displayStatus)}</strong>
      <span>${escapeHtml(providerLabel)}</span>
    </div>
    <p>${guardrailScopeText()} ${integerText(checkedNumbers)} numbers · ${integerText(checkedRefs)} refs · ${integerText(violationCount)} violations${fallback ? ` · ${escapeHtml(fallback)}` : ""}</p>
    <details class="generated-result-details" data-generated-details="llm-validation">
      <summary>Why this is not a readiness pass</summary>
      <dl class="generated-result-detail-grid">
        ${details.map(([label, value]) => generatedResultDetailRow(label, value)).join("")}
      </dl>
    </details>
  `;
  return generatedResultCard(
    "LLM output validation",
    "guardrail_report.json",
    body,
    artifacts,
    {
      className: "llm-validation-card",
      headingExtraHtml: `
        <span class="stage-info generated-result-info" tabindex="0" aria-label="${escapeHtml(guardrailScopeText())}" aria-describedby="llmValidationInfoTip">
          <span class="stage-info-icon" aria-hidden="true">i</span>
          <span class="stage-info-tooltip" id="llmValidationInfoTip" role="tooltip">${escapeHtml(guardrailScopeText())}</span>
        </span>
      `,
    },
  );
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

function generatedResultCard(title, artifactPath, body, artifacts, options = {}) {
  const className = options.className ? ` ${escapeHtml(options.className)}` : "";
  const headingExtraHtml = options.headingExtraHtml || "";
  return `
    <article class="generated-result-card${className}">
      <div class="generated-result-heading">
        <div class="generated-result-title-row">
          <strong>${escapeHtml(title)}</strong>
          ${headingExtraHtml}
        </div>
        <span>generated</span>
      </div>
      ${body}
    </article>
  `;
}

function generatedResultDetailRow(label, value) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
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

function generatedReviewResultsReady() {
  return Boolean(
    state.dashboardArtifactIndex &&
    Object.keys(state.dashboardArtifactIndex.artifact_urls || {}).length,
  );
}

function resetDashboardState() {
  state.dashboardArtifactIndex = null;
  state.dashboardLoadingJobId = "";
  state.dashboardArtifacts = {};
  state.dashboardFilters = { severity: "all", issueType: "all", table: "all" };
  state.todoFilter = "all";
  state.dashboardSelection = null;
  state.issueLlmRunningIssueId = "";
  state.issueLlmPanelOpen = true;
  state.issueLlmMessage = "";
  state.issueLlmMessageStatus = "";
  state.remediationRunning = false;
  state.remediationMessage = "";
  state.remediationMessageStatus = "";
  state.manualRecheckRunning = false;
  state.manualRecheckMessage = "";
  state.manualRecheckMessageStatus = "";
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
  const keepCurrentArtifactsDuringLoad = Boolean(options.keepCurrentArtifactsDuringLoad && state.dashboardArtifactIndex);
  if (!keepCurrentArtifactsDuringLoad) {
    state.dashboardArtifactIndex = null;
    state.dashboardArtifacts = {};
    renderDashboardMessage("Loading issue review artifacts from web-runner URLs...", "pending");
    renderDashboard();
  }

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
    renderDashboardMessage("", "");
  } catch (error) {
    state.dashboardLoadingJobId = "";
    renderDashboardMessage(error.message || "Unable to load issue review artifacts.", "error");
  } finally {
    if (options.preserveViewportSelector) {
      renderDashboardPreservingViewport(options.preserveViewportSelector);
    } else {
      renderDashboard();
    }
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
    renderDashboardDrilldownPreservingViewport();
    return;
  }
  const provider = ["fake", "openai"].includes(state.issueLlmProvider) ? state.issueLlmProvider : "openai";
  state.issueLlmRunningIssueId = issueId;
  state.issueLlmMessage = `Running ${issueLlmProviderLabel(provider)} issue enrichment for ${issueId}...`;
  state.issueLlmMessageStatus = "pending";
  renderDashboardDrilldownPreservingViewport();

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
    await loadDashboard(jobId, {
      force: true,
      preserveSelection: true,
      keepCurrentArtifactsDuringLoad: true,
      preserveViewportSelector: ".issue-llm-enrichment",
    });
  } catch (error) {
    state.issueLlmMessage = error.message || "Issue LLM enrichment failed.";
    state.issueLlmMessageStatus = "error";
  } finally {
    state.issueLlmRunningIssueId = "";
    renderDashboardDrilldownPreservingViewport();
    renderJob();
  }
}

async function generateRemediationPlan() {
  const jobId = state.dashboardArtifactIndex?.job_id || state.currentJob?.job_id || "";
  if (!jobId) {
    state.remediationMessage = "Run a completed profile before generating a remediation plan.";
    state.remediationMessageStatus = "error";
    renderRemediationSection();
    return;
  }
  state.remediationRunning = true;
  state.remediationMessage = "Generating remediation_plan.json from completed artifacts...";
  state.remediationMessageStatus = "pending";
  renderRemediationSection();
  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/remediation-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Remediation plan generation failed.");
    }
    if (state.currentJob?.job_id === jobId) {
      state.currentJob = {
        ...state.currentJob,
        artifacts: payload.artifacts || state.currentJob.artifacts || [],
      };
    }
    state.remediationMessage = "Remediation plan is ready for approval.";
    state.remediationMessageStatus = "success";
    await loadDashboard(jobId, {
      force: true,
      preserveSelection: true,
      keepCurrentArtifactsDuringLoad: true,
      preserveViewportSelector: ".remediation-section",
    });
  } catch (error) {
    state.remediationMessage = error.message || "Remediation plan generation failed.";
    state.remediationMessageStatus = "error";
    renderRemediationSection();
  } finally {
    state.remediationRunning = false;
    renderRemediationSection();
  }
}

async function startRemediationRecheck() {
  const sourceJobId = state.dashboardArtifactIndex?.job_id || state.currentJob?.job_id || "";
  const plan = getRemediationPlanArtifact();
  const approvedIds = remediationSupportedActions(plan)
    .map((action) => action.remediation_id)
    .filter(Boolean);
  const eligibility = deterministicRemediationEligibility(plan, approvedIds);
  if (!sourceJobId || !eligibility.allowed) {
    state.remediationMessage = eligibility.reason || "Generate a remediation plan before starting recheck.";
    state.remediationMessageStatus = "error";
    renderRemediationSection();
    return;
  }
  state.remediationRunning = true;
  state.remediationMessage = "Creating staged copy and starting remediation recheck...";
  state.remediationMessageStatus = "pending";
  renderRemediationSection();

  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(sourceJobId)}/remediation-runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved_remediation_ids: approvedIds }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Remediation recheck failed to start.");
    }
    state.runEvents = [];
    state.runtimeAutoFollowStageName = "";
    state.currentJob = payload;
    state.profileStep = "run";
    markProfileStepVisited("run");
    resetDashboardState();
    state.remediationRunning = true;
    state.remediationMessage = "Remediation recheck is running on a staged copy.";
    state.remediationMessageStatus = "pending";
    renderRunnerMessage("Remediation recheck started on staged CSV + DBML copy.", "pending");
    connectEventStream(payload.events_url);
  } catch (error) {
    state.remediationMessage = error.message || "Remediation recheck failed to start.";
    state.remediationMessageStatus = "error";
    renderRemediationSection();
  } finally {
    state.remediationRunning = false;
    renderAll();
  }
}

async function startManualUploadRecheck() {
  const sourceJobId = manualRecheckBaselineJobId();
  if (!sourceJobId) {
    setManualRecheckMessage("Open a completed baseline run before uploading corrected files.", "error");
    renderManualRecheckSection();
    return;
  }
  const dbmlFile = els.manualRecheckDbmlInput.files?.[0] || null;
  const csvFiles = [...(els.manualRecheckCsvInput.files || [])];
  if (!csvFiles.length) {
    setManualRecheckMessage("At least one corrected CSV file is required. DBML reuses the baseline unless supplied.", "error");
    renderManualRecheckSection();
    return;
  }
  if (!state.runnerAvailable) {
    setManualRecheckMessage("Open this page with vsf-profiler web to run manual recheck.", "error");
    renderManualRecheckSection();
    return;
  }

  const form = new FormData();
  if (dbmlFile) {
    form.append("dbml", dbmlFile, dbmlFile.name);
  }
  csvFiles.forEach((file) => {
    form.append("csv", file, file.name);
  });

  state.manualRecheckRunning = true;
  state.manualRecheckMessage = "Uploading corrected files and starting recheck...";
  state.manualRecheckMessageStatus = "pending";
  renderManualRecheckSection();
  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(sourceJobId)}/manual-recheck-runs`, {
      method: "POST",
      body: form,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Manual upload recheck failed to start.");
    }
    els.manualRecheckDbmlInput.value = "";
    els.manualRecheckCsvInput.value = "";
    startRecheckRuntime(payload, "Manual corrected upload recheck started.");
  } catch (error) {
    state.manualRecheckMessage = error.message || "Manual upload recheck failed to start.";
    state.manualRecheckMessageStatus = "error";
    renderManualRecheckSection();
  } finally {
    state.manualRecheckRunning = false;
    renderAll();
  }
}

async function startCorrectedDemoRecheck() {
  const sourceJobId = manualRecheckBaselineJobId();
  const preset = demoPresets.smallCorrected;
  if (!sourceJobId) {
    setManualRecheckMessage("Open a completed baseline run before running the corrected demo.", "error");
    renderManualRecheckSection();
    return;
  }
  if (!preset) {
    setManualRecheckMessage("Corrected demo preset is not available in js/demo-data.js.", "error");
    renderManualRecheckSection();
    return;
  }
  if (!state.runnerAvailable) {
    setManualRecheckMessage("Open this page with vsf-profiler web to run corrected demo recheck.", "error");
    renderManualRecheckSection();
    return;
  }

  state.manualRecheckRunning = true;
  state.manualRecheckMessage = "Starting corrected small demo recheck from local path...";
  state.manualRecheckMessageStatus = "pending";
  renderManualRecheckSection();
  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(sourceJobId)}/manual-recheck-runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dbml_path: preset.dbmlPath,
        csv_dir: preset.csvDir,
        target: preset.target,
        source_label: "demo_corrected_path",
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Corrected demo recheck failed to start.");
    }
    startRecheckRuntime(payload, "Corrected demo recheck started from data/demo_small_corrected.");
  } catch (error) {
    state.manualRecheckMessage = error.message || "Corrected demo recheck failed to start.";
    state.manualRecheckMessageStatus = "error";
    renderManualRecheckSection();
  } finally {
    state.manualRecheckRunning = false;
    renderAll();
  }
}

function startRecheckRuntime(payload, message) {
  state.runEvents = [];
  state.runtimeAutoFollowStageName = "";
  state.currentJob = payload;
  state.profileStep = "run";
  markProfileStepVisited("run");
  resetDashboardState();
  state.manualRecheckRunning = true;
  state.manualRecheckMessage = message;
  state.manualRecheckMessageStatus = "pending";
  renderRunnerMessage(`${message} Runtime events are streaming from run_events.jsonl.`, "pending");
  connectEventStream(payload.events_url);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function renderDashboardMessage(message, status) {
  const text = message || "";
  els.dashboardMessage.textContent = text;
  els.dashboardMessage.dataset.status = status || "";
  els.dashboardMessage.hidden = !text;
}

function preserveViewportAroundRender(renderFn, anchorSelector = ".issue-llm-enrichment") {
  const anchor = anchorSelector ? document.querySelector(anchorSelector) : null;
  const fallback = els.dashboardDrilldown;
  const beforeAnchor = anchor || fallback;
  const beforeTop = beforeAnchor?.getBoundingClientRect().top;
  renderFn();
  if (!Number.isFinite(beforeTop)) {
    return;
  }
  const afterAnchor = (anchorSelector ? document.querySelector(anchorSelector) : null) || fallback;
  const afterTop = afterAnchor?.getBoundingClientRect().top;
  if (!Number.isFinite(afterTop)) {
    return;
  }
  const delta = afterTop - beforeTop;
  if (Math.abs(delta) > 1) {
    window.scrollBy({ top: delta, left: 0, behavior: "auto" });
  }
}

function renderDashboardPreservingViewport(anchorSelector = ".issue-llm-enrichment") {
  preserveViewportAroundRender(() => {
    renderDashboard();
  }, anchorSelector);
}

function renderDashboardDrilldownPreservingViewport(anchorSelector = ".issue-llm-enrichment") {
  preserveViewportAroundRender(() => {
    renderDashboardDrilldown();
  }, anchorSelector);
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
  renderQualityGatesSection();
  renderTableImpactSection();
  renderTodosSection();
  renderManualRecheckSection();
  renderRemediationSection();
  renderReportExportSection();

  if (!loaded) {
    renderDashboardMessage(
      loading ? "Fetching issue artifacts..." : "Issue review loads after a completed backend job.",
      "pending",
    );
    els.dashboardPanelGrid.innerHTML = loading
      ? `<p class="muted">Fetching issue artifacts...</p>`
      : `<p class="muted">Run a job to review issues by table and column.</p>`;
    els.dashboardDrilldownMeta.textContent = "No selection";
    els.dashboardDrilldown.innerHTML = `<p class="muted">Select an issue to inspect where it happened, evidence, impact, and fix guidance.</p>`;
    return;
  }

  els.dashboardPanelGrid.innerHTML = `
    ${renderIssueVisualSummary(issues, filteredIssues)}
    ${renderStage4ReviewBriefing(issues, filteredIssues)}
    ${renderIssueInbox(filteredIssues, issues)}
  `;
  renderDashboardDrilldown();

  if ((artifactIndex.missing_artifacts || []).length) {
    renderDashboardMessage(
      `Issue review loaded with missing artifacts: ${artifactIndex.missing_artifacts.join(", ")}.`,
      "pending",
    );
  } else {
    renderDashboardMessage("", "");
  }
}

function renderDashboardSummary(issues) {
  const artifactIndex = state.dashboardArtifactIndex;
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const assessmentArtifact = state.dashboardArtifacts["table_assessments.json"] || {};
  const qualityGates = getQualityGatesArtifact();
  const assessments = getDashboardTableAssessments();
  const riskScore = verdict.risk_score ?? verdict.summary?.risk_score ?? "--";
  const verdictLabel = verdict.verdict || verdict.summary?.verdict || (artifactIndex ? "unknown" : "Waiting");
  const paths = Object.keys(artifactIndex?.artifact_urls || {});
  const gateSummary = qualityGates?.summary || {};
  const numericRisk = Number(riskScore);
  const riskKnown = Number.isFinite(numericRisk);
  const riskValue = riskKnown ? clampNumber(numericRisk, 0, 100) : 0;
  const riskLabel = riskKnown ? `${integerText(riskValue)}/100` : "--";
  const readinessToken = String(verdictLabel || "").toLowerCase();
  const readinessTone = readinessToken.includes("not") || readinessToken.includes("fail")
    ? "danger"
    : readinessToken.includes("ready") || readinessToken.includes("pass")
      ? "success"
      : "pending";
  const riskTone = riskValue >= 80 ? "danger" : riskValue >= 40 ? "warning" : "success";
  const riskBreakdown = riskBreakdownForVerdict(verdict, riskValue);
  const tableCount = assessmentArtifact.summary?.table_count ?? assessments.length;
  const blockedGates = qualityGates ? gateSummary.blocked_count || 0 : null;
  els.dashboardSummaryStrip.innerHTML = `
    <div class="dashboard-readiness-card ${readinessTone}">
      <div class="dashboard-summary-status">
        <span>readiness</span>
        <strong>${escapeHtml(verdictLabel)}</strong>
      </div>
      ${renderDashboardRiskMeter({ riskLabel, riskValue, riskTone, riskBreakdown })}
    </div>
    <div class="dashboard-summary-metrics">
      <div class="dashboard-summary-metric">
        <span>issues</span>
        <strong>${integerText(issues.length)}</strong>
      </div>
      <div class="dashboard-summary-metric">
        <span>tables</span>
        <strong>${integerText(tableCount)}</strong>
      </div>
      <div class="dashboard-summary-metric">
        <span>gates</span>
        <strong>${blockedGates === null ? "--" : `${integerText(blockedGates)} blocked`}</strong>
      </div>
      <div class="dashboard-summary-metric">
        <span>artifacts</span>
        <strong>${integerText(paths.length)}</strong>
      </div>
    </div>
  `;
}

function riskBreakdownForVerdict(verdict, riskValue) {
  const artifactBreakdown = verdict?.risk_breakdown || verdict?.summary?.risk_breakdown;
  if (
    artifactBreakdown &&
    (Array.isArray(artifactBreakdown.components) || Array.isArray(artifactBreakdown.active_components))
  ) {
    return {
      ...artifactBreakdown,
      score: Number.isFinite(Number(artifactBreakdown.score)) ? Number(artifactBreakdown.score) : riskValue,
    };
  }
  const components = fallbackRiskComponentsFromVerdict();
  const rawScore = components.reduce((sum, component) => sum + component.points, 0);
  return {
    score: riskValue,
    raw_score: rawScore,
    capped: rawScore > riskValue,
    components,
    active_components: components.filter((component) => component.points > 0),
    explanation: rawScore > riskValue
      ? `Raw risk is ${integerText(rawScore)}; displayed risk is capped at ${integerText(riskValue)}.`
      : "Risk score comes from deterministic issue, relationship, and schema evidence.",
  };
}

function renderDashboardRiskMeter({ riskLabel, riskValue, riskTone, riskBreakdown }) {
  return `
    <details class="dashboard-risk-meter" data-risk-tone="${escapeHtml(riskTone)}">
      <summary aria-label="Risk score ${escapeHtml(riskLabel)}. Open risk breakdown.">
        <div class="dashboard-risk-heading">
          <span>risk</span>
          <strong>${escapeHtml(riskLabel)}</strong>
          <span class="dashboard-risk-toggle">breakdown</span>
        </div>
        <div class="dashboard-risk-track" aria-hidden="true">
          <span class="dashboard-risk-fill ${riskTone}" style="width: ${riskValue}%"></span>
        </div>
      </summary>
      ${renderDashboardRiskBreakdown(riskBreakdown)}
    </details>
  `;
}

function renderDashboardRiskBreakdown(breakdown) {
  const components = dashboardRiskComponents(breakdown);
  const activeComponents = components.filter((component) => component.points > 0);
  const rows = activeComponents.length ? activeComponents : [
    {
      label: "No active risk components",
      count: 0,
      weight: 0,
      points: 0,
      artifact: "dataset_verdict.json",
      explanation: "No deterministic issue, relationship, or schema risk was counted.",
    },
  ];
  const rawScore = Number.isFinite(Number(breakdown?.raw_score))
    ? Number(breakdown.raw_score)
    : components.reduce((sum, component) => sum + component.points, 0);
  const score = Number.isFinite(Number(breakdown?.score)) ? Number(breakdown.score) : clampNumber(rawScore, 0, 100);
  const capped = Boolean(breakdown?.capped) || rawScore > score;
  const summaryText = capped
    ? `Raw ${integerText(rawScore)} points, capped to ${integerText(score)}/100.`
    : `${integerText(score)}/100 from deterministic evidence.`;
  return `
    <div class="dashboard-risk-breakdown" role="tooltip">
      <div class="dashboard-risk-breakdown-heading">
        <strong>Risk breakdown</strong>
        <span>${escapeHtml(summaryText)}</span>
      </div>
      <div class="dashboard-risk-components">
        ${rows
          .sort((a, b) => b.points - a.points || String(a.label).localeCompare(String(b.label)))
          .slice(0, 8)
          .map((component) => renderDashboardRiskComponent(component))
          .join("")}
      </div>
      <p>${escapeHtml(breakdown?.explanation || "Risk score comes from dataset_verdict.json.")}</p>
    </div>
  `;
}

function renderDashboardRiskComponent(component) {
  const width = clampNumber(component.points, 0, 100);
  const formula = component.weight
    ? `${integerText(component.count)} x ${integerText(component.weight)} = ${integerText(component.points)}`
    : integerText(component.points);
  return `
    <div class="dashboard-risk-component">
      <div>
        <span>${escapeHtml(component.label)}</span>
        <small>${escapeHtml(component.artifact || "dataset_verdict.json")}</small>
      </div>
      <strong>${escapeHtml(formula)}</strong>
      <div class="dashboard-risk-component-track" aria-hidden="true">
        <span style="width: ${width}%"></span>
      </div>
    </div>
  `;
}

function dashboardRiskComponents(breakdown) {
  const rawComponents = Array.isArray(breakdown?.components) && breakdown.components.length
    ? breakdown.components
    : Array.isArray(breakdown?.active_components) && breakdown.active_components.length
      ? breakdown.active_components
      : fallbackRiskComponentsFromVerdict();
  return rawComponents.map((component) => ({
    label: String(component.label || "Risk component"),
    count: Number.isFinite(Number(component.count)) ? Number(component.count) : 0,
    weight: Number.isFinite(Number(component.weight)) ? Number(component.weight) : 0,
    points: Number.isFinite(Number(component.points)) ? Number(component.points) : 0,
    artifact: String(component.artifact || "dataset_verdict.json"),
    explanation: String(component.explanation || ""),
  }));
}

function fallbackRiskComponentsFromVerdict() {
  const verdict = state.dashboardArtifacts["dataset_verdict.json"] || {};
  const severityCounts = verdict.issue_counts?.by_severity || {};
  const relationshipCounts = verdict.relationship_status_counts || {};
  const schemaSummary = verdict.schema_summary || {};
  const rows = [
    ["P0 issue findings", severityCounts.P0, 30, "issues.json"],
    ["P1 issue findings", severityCounts.P1, 15, "issues.json"],
    ["P2 issue findings", severityCounts.P2, 5, "issues.json"],
    ["P3 issue findings", severityCounts.P3, 1, "issues.json"],
    ["Invalid relationship checks", relationshipCounts.invalid, 10, "relationship_graph.json"],
    ["Warning relationship checks", relationshipCounts.warning, 4, "relationship_graph.json"],
    ["Skipped relationship checks", relationshipCounts.skipped, 2, "relationship_graph.json"],
    ["Missing DBML table CSVs", schemaSummary.missing_table_count, 25, "schema_evaluation.json"],
    ["Extra CSV files", schemaSummary.extra_csv_count, 2, "schema_evaluation.json"],
  ];
  return rows.map(([label, count, weight, artifact]) => {
    const numericCount = Number.isFinite(Number(count)) ? Number(count) : 0;
    return {
      label,
      count: numericCount,
      weight,
      points: numericCount * weight,
      artifact,
    };
  });
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
  const contextCount = contexts.length;
  const evidenceCount = evidence.length;
  const statusClass = issueStatusClass(status);
  return `
    <details class="quality-gate-card" data-status="${escapeHtml(status)}">
      <summary class="quality-gate-summary">
        ${renderQualityGateStatusBlock(status, statusClass)}
        <span class="quality-gate-summary-main">
          <strong>${escapeHtml(gate.label || "Quality gate")}</strong>
          <small>${integerText(evidenceCount)} evidence values · ${integerText(contextCount)} linked contexts</small>
        </span>
        <span class="quality-gate-expand" aria-hidden="true">Details</span>
      </summary>
      <div class="quality-gate-body">
        <div class="quality-gate-explanation">
          <span>Why</span>
          <p>${escapeHtml(gate.explanation || "Gate evidence needs review.")}</p>
        </div>
        <div class="quality-gate-detail-actions">
          <a class="quality-gate-action" href="${escapeHtml(nextAction.anchor || "#dashboardPanelGrid")}">${escapeHtml(nextAction.label || "Open Review Issues.")}</a>
        </div>
        <div class="quality-gate-section-heading">
          <strong>Evidence values</strong>
          <span>${integerText(evidenceCount)} generated values</span>
        </div>
        <div class="quality-gate-evidence" aria-label="${escapeHtml(gate.label || "Quality gate")} evidence">
          ${evidence.slice(0, 4).map(renderQualityGateEvidence).join("")}
        </div>
        ${renderQualityGateContextSummary(contexts)}
      </div>
    </details>
  `;
}

function renderQualityGateStatusBlock(status, statusClass) {
  return `
    <span class="quality-gate-status-block ${escapeHtml(statusClass)}">
      <span class="quality-gate-status-mark" aria-hidden="true">${status === "Clean" ? "OK" : "!"}</span>
      <span class="quality-gate-status-copy">
        <strong>${escapeHtml(status)}</strong>
        <small>${escapeHtml(qualityGateStatusMeaning(status))}</small>
      </span>
    </span>
  `;
}

function qualityGateStatusMeaning(status) {
  if (status === "Blocked") {
    return "Stops analysis";
  }
  if (status === "Clean") {
    return "No action needed";
  }
  if (status === "Usable With Caution") {
    return "Proceed carefully";
  }
  return "Needs owner review";
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

function renderQualityGateContextSummary(contexts) {
  if (!contexts.length) {
    return `<p class="muted">No linked table, column, or issue context for this gate.</p>`;
  }
  const groups = qualityGateContextGroups(contexts);
  const visibleGroups = groups.slice(0, 4);
  const remainingGroups = Math.max(0, groups.length - visibleGroups.length);
  const rawRows = contexts.slice(0, 8);
  const remaining = Math.max(0, contexts.length - rawRows.length);
  return `
    <div class="quality-gate-section-heading">
      <strong>Where it shows up</strong>
      <span>${integerText(contexts.length)} linked contexts grouped by table</span>
    </div>
    <div class="quality-gate-context-groups">
      ${visibleGroups.map(renderQualityGateContextGroup).join("")}
    </div>
    ${remainingGroups ? `<p class="quality-gate-more-context">${integerText(remainingGroups)} more table group${remainingGroups === 1 ? "" : "s"} are available in quality_gates.json.</p>` : ""}
    <details class="quality-gate-context-disclosure">
      <summary>Show linked context rows</summary>
      <div class="quality-gate-contexts">
        ${rawRows.map(renderQualityGateContext).join("")}
      </div>
      ${remaining ? `<p class="quality-gate-more-context">${integerText(remaining)} more context rows are available in quality_gates.json.</p>` : ""}
    </details>
  `;
}

function qualityGateContextGroups(contexts) {
  const groups = new Map();
  contexts.forEach((context) => {
    const table = context.table || context.parent_table || "dataset";
    if (!groups.has(table)) {
      groups.set(table, {
        table,
        count: 0,
        columns: new Set(),
        statuses: new Set(),
        issueTypes: new Set(),
      });
    }
    const group = groups.get(table);
    group.count += 1;
    arrayOfStrings(context.columns).forEach((column) => group.columns.add(column));
    [context.status, context.severity, context.todo_type].filter(Boolean).forEach((value) => group.statuses.add(value));
    if (context.issue_type) {
      group.issueTypes.add(context.issue_type);
    }
  });
  return [...groups.values()].sort((a, b) => b.count - a.count || a.table.localeCompare(b.table));
}

function renderQualityGateContextGroup(group) {
  const columns = [...group.columns].slice(0, 3);
  const statuses = [...group.statuses].slice(0, 3);
  const issueTypes = [...group.issueTypes].slice(0, 2);
  return `
    <div class="quality-gate-context-group">
      <div>
        <code>${escapeHtml(group.table)}</code>
        <span>${columns.length ? escapeHtml(columns.join(", ")) : "table scope"}</span>
      </div>
      <strong>${integerText(group.count)}</strong>
      <small>${escapeHtml([...issueTypes, ...statuses].filter(Boolean).join(" · ") || "linked evidence")}</small>
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
    const evidence = tableReadinessEvidence(assessment);
    const selected = state.dashboardSelection?.kind === "table_assessment" && state.dashboardSelection.value === assessment.table;
    return `
      <button
        class="table-impact-card ${selected ? "selected" : ""}"
        type="button"
        data-dashboard-kind="table_assessment"
        data-dashboard-value="${escapeHtml(assessment.table)}"
        data-dashboard-label="${escapeHtml(assessment.table)}"
        data-dashboard-scroll="drilldown"
        aria-pressed="${selected ? "true" : "false"}"
      >
        <span>
          <code>${escapeHtml(assessment.table)}</code>
          <small>${escapeHtml(assessment.role || "unknown")} · ${escapeHtml(impact.label || "General analytics")}</small>
        </span>
        <span class="table-impact-score">${integerText(assessment.health_score)}<small>health</small></span>
        <span class="pill-status ${readinessPillClass(readiness)}">${escapeHtml(readiness)}</span>
        ${renderTableSeverityStrip(evidence.severityCounts)}
        ${renderTableColumnEvidenceSummary(evidence)}
        ${renderTableScoreFormula(evidence)}
        <span class="table-impact-meta">
          <span>${escapeHtml(impact.category || "general_analytics")}</span>
          <span>${integerText(columns.length)} columns</span>
          <span>${integerText(risks.length)} FK risk${risks.length === 1 ? "" : "s"}</span>
        </span>
      </button>
    `;
  }).join("");
}

function tableReadinessEvidence(assessment) {
  const table = assessment?.table || "";
  const severityCounts = tableSeverityCounts(assessment);
  const issues = getDashboardIssues().filter((issue) => issue.table === table);
  const relationshipRisks = Array.isArray(assessment?.relationship_risks) ? assessment.relationship_risks : [];
  const affectedColumns = Array.isArray(assessment?.affected_columns) ? assessment.affected_columns : [];
  const missingRows = dashboardChartRows(dashboardChartPaths.missingColumns)
    .filter((row) => row.table === table && Number(row.null_count || 0) > 0);
  const outlierRows = dashboardChartRows(dashboardChartPaths.outliers)
    .filter((row) => row.table === table && Number(row.outlier_count || 0) > 0);
  const columnRows = tableColumnEvidenceRows(table, issues, missingRows, outlierRows, affectedColumns);
  const score = tableScoreBreakdown(severityCounts, relationshipRisks, assessment?.health_score);
  return { severityCounts, issues, relationshipRisks, missingRows, outlierRows, columnRows, score };
}

function dashboardChartRows(path) {
  const data = state.dashboardArtifacts[path]?.data;
  return Array.isArray(data) ? data : [];
}

function tableSeverityCounts(assessment) {
  const counts = assessment?.issue_counts_by_severity || {};
  return Object.fromEntries(severityOrder.map((severity) => [severity, Number(counts[severity] || 0)]));
}

function tableScoreBreakdown(severityCounts, relationshipRisks, healthScore) {
  const severityPenalty = severityOrder.reduce((sum, severity) => (
    sum + Number(severityCounts[severity] || 0) * tableIssueScoreWeights[severity]
  ), 0);
  const relationshipCounts = {};
  const relationshipPenalty = (Array.isArray(relationshipRisks) ? relationshipRisks : []).reduce((sum, risk) => {
    const status = risk.status || "unknown";
    relationshipCounts[status] = (relationshipCounts[status] || 0) + 1;
    return sum + (tableRelationshipScoreWeights[status] || 0);
  }, 0);
  const totalPenalty = severityPenalty + relationshipPenalty;
  const calculatedHealth = Math.max(0, Math.min(100, 100 - totalPenalty));
  return {
    healthScore: Number(healthScore ?? calculatedHealth),
    calculatedHealth,
    severityPenalty,
    relationshipPenalty,
    totalPenalty,
    relationshipCounts,
  };
}

function tableColumnEvidenceRows(table, issues, missingRows, outlierRows, affectedColumns = []) {
  const rows = new Map();
  const ensure = (column) => {
    const key = column || "table-level";
    if (!rows.has(key)) {
      rows.set(key, {
        table,
        column: key,
        issueCounts: Object.fromEntries(severityOrder.map((severity) => [severity, 0])),
        issueTotal: 0,
        badRows: 0,
        missingCount: 0,
        missingRate: 0,
        outlierCount: 0,
        outlierRate: 0,
      });
    }
    return rows.get(key);
  };
  issues.forEach((issue) => {
    const columns = Array.isArray(issue.columns) && issue.columns.length ? issue.columns : ["table-level"];
    columns.forEach((column) => {
      const row = ensure(column);
      const severity = todoPriorityToken(issue.severity);
      row.issueCounts[severity] = (row.issueCounts[severity] || 0) + 1;
      row.issueTotal += 1;
      row.badRows += Number(issue.bad_count || 0);
    });
  });
  missingRows.forEach((item) => {
    const row = ensure(item.column || String(item.field || "").split(".").pop() || "column");
    row.missingCount += Number(item.null_count || 0);
    row.missingRate = Math.max(row.missingRate, Number(item.null_rate || 0));
  });
  outlierRows.forEach((item) => {
    const row = ensure(item.column || String(item.field || "").split(".").pop() || "column");
    row.outlierCount += Number(item.outlier_count || 0);
    row.outlierRate = Math.max(row.outlierRate, Number(item.outlier_rate || 0));
  });
  affectedColumns.forEach((column) => {
    ensure(column);
  });
  return [...rows.values()].sort((a, b) => (
    severityCountWeight(b.issueCounts) - severityCountWeight(a.issueCounts) ||
    b.missingCount - a.missingCount ||
    b.outlierCount - a.outlierCount ||
    b.badRows - a.badRows ||
    a.column.localeCompare(b.column)
  ));
}

function severityCountWeight(counts) {
  return severityOrder.reduce((sum, severity, index) => (
    sum + Number(counts[severity] || 0) * (100 - index * 20)
  ), 0);
}

function renderTableSeverityStrip(severityCounts) {
  return `
    <span class="table-severity-strip" aria-label="Issue counts by severity">
      ${severityOrder.map((severity) => `
        <span class="table-severity-chip ${todoPriorityClass(severity)}">
          <span>${escapeHtml(severity)}</span>
          <b>${integerText(severityCounts[severity] || 0)}</b>
        </span>
      `).join("")}
    </span>
  `;
}

function renderTableColumnEvidenceSummary(evidence) {
  const affectedColumns = evidence.columnRows.filter((row) => row.issueTotal || row.missingCount || row.outlierCount);
  const previewRows = affectedColumns.slice(0, 3);
  return `
    <span class="table-column-evidence-summary">
      <span><strong>${integerText(evidence.missingRows.length)}</strong> missing columns</span>
      <span><strong>${integerText(evidence.outlierRows.length)}</strong> outlier columns</span>
      <span><strong>${integerText(affectedColumns.length)}</strong> affected columns</span>
      ${previewRows.length ? `
        <span class="table-column-preview">
          ${previewRows.map((row) => `
            <span><code>${escapeHtml(row.column)}</code>${tableColumnEvidenceText(row)}</span>
          `).join("")}
        </span>
      ` : `<span class="muted">No column-level evidence.</span>`}
    </span>
  `;
}

function tableColumnEvidenceText(row) {
  const parts = [];
  const issueParts = severityOrder
    .filter((severity) => Number(row.issueCounts[severity] || 0) > 0)
    .map((severity) => `${severity} ${integerText(row.issueCounts[severity])}`);
  if (issueParts.length) {
    parts.push(issueParts.join(" · "));
  }
  if (row.missingCount) {
    parts.push(`${integerText(row.missingCount)} missing`);
  }
  if (row.outlierCount) {
    parts.push(`${integerText(row.outlierCount)} outliers`);
  }
  return parts.length ? ` · ${escapeHtml(parts.join(" · "))}` : "";
}

function renderTableScoreFormula(evidence) {
  const parts = tableScoreFormulaParts(evidence.score, evidence.severityCounts);
  return `
    <span class="table-score-formula">
      <strong>Score</strong>
      <span>100 - ${integerText(evidence.score.totalPenalty)} = ${integerText(evidence.score.healthScore)}</span>
      <small>${escapeHtml(parts.length ? parts.join(" · ") : "No penalties")}</small>
    </span>
  `;
}

function tableScoreFormulaParts(score, severityCounts) {
  const severityParts = severityOrder
    .filter((severity) => Number(severityCounts[severity] || 0) > 0)
    .map((severity) => `${severity} ${integerText(severityCounts[severity])}x${tableIssueScoreWeights[severity]}`);
  const relationshipParts = Object.entries(score.relationshipCounts || {})
    .filter(([, count]) => Number(count) > 0)
    .map(([status, count]) => `${relationshipRiskPenaltyLabel(status)} ${integerText(count)}x${tableRelationshipScoreWeights[status] || 0}`);
  return [...severityParts, ...relationshipParts];
}

function relationshipRiskPenaltyLabel(status) {
  const labels = {
    invalid: "Invalid FK risk",
    warning: "FK warning",
    skipped: "FK skipped",
  };
  return labels[status] || `${status || "unknown"} FK risk`;
}

function renderTodosSection() {
  const artifact = getIssueTodosArtifact();
  const loaded = Boolean(state.dashboardArtifactIndex);
  const groups = getTodoGroupsForFilter();
  const allGroups = Array.isArray(artifact?.groups) ? artifact.groups : [];
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
  const issueActionCount = todoIssueWorkItems(allGroups).length;
  els.todosStatus.textContent = `${integerText(issueActionCount)} issue actions · ${integerText(summary.todo_occurrence_count)} occurrences · source=deterministic`;
  if (!allGroups.length) {
    els.todosGrid.innerHTML = `
      <section class="todo-empty">
        <strong>No todos generated.</strong>
        <p>No fix or verify todos were generated because no issues were detected for this run.</p>
      </section>
    `;
    return;
  }
  if (!groups.length) {
    els.todosGrid.innerHTML = `
      ${renderTodoVisualSummary(groups, allGroups, summary)}
      <section class="todo-empty">
        <strong>No ${escapeHtml(todoTypeLabel(state.todoFilter).toLowerCase())} todos match this run.</strong>
        <p>Switch back to All to review the other issue actions generated for this profile.</p>
      </section>
    `;
    return;
  }

  els.todosGrid.innerHTML = `
    ${renderTodoVisualSummary(groups, allGroups, summary)}
    ${renderTodoIssueQueue(groups)}
  `;
}

function renderRemediationSection() {
  const loaded = Boolean(state.dashboardArtifactIndex);
  const plan = getRemediationPlanArtifact();
  const approved = getApprovedRemediationsArtifact();
  const runSummary = getRemediationRunSummaryArtifact();
  const diff = getBeforeAfterQualityDiffArtifact();

  if (!loaded) {
    els.remediationStatus.textContent = state.dashboardLoadingJobId
      ? "Fetching remediation artifacts"
      : "Waiting for remediation_plan.json";
    els.remediationGrid.innerHTML = `<p class="muted">Run a job to prepare copy-only remediation actions.</p>`;
    setRemediationMessage("Remediation actions require approval and apply only to a staged copy.", "");
    return;
  }

  if (!plan) {
    els.remediationStatus.textContent = "Plan artifact missing";
    els.remediationGrid.innerHTML = `
      <section class="remediation-empty">
        <strong>Generate remediation plan</strong>
        <p>Build remediation_plan.json from generated issues and deterministic action plans.</p>
        <button class="button secondary compact" type="button" data-remediation-generate ${state.remediationRunning ? "disabled" : ""}>
          ${state.remediationRunning ? "Generating..." : "Generate plan"}
        </button>
      </section>
    `;
    setRemediationMessage(state.remediationMessage || "No source data will be changed.", state.remediationMessageStatus);
    return;
  }

  const actions = Array.isArray(plan.actions) ? plan.actions : [];
  const supported = remediationSupportedActions(plan);
  const summary = plan.summary || {};
  els.remediationStatus.textContent = `${integerText(supported.length)}/${integerText(actions.length)} copy actions · source=deterministic`;
  els.remediationGrid.innerHTML = `
    ${renderRemediationSummary(plan, supported)}
    ${renderRemediationDiff(diff, runSummary)}
    ${renderApprovedRemediations(approved)}
    ${renderRemediationActionQueue(actions)}
  `;
  setRemediationMessage(
    state.remediationMessage ||
      `${integerText(summary.review_required_count || 0)} actions need manual review; supported actions apply only to a staged copy.`,
    state.remediationMessageStatus,
  );
}

function renderRemediationSummary(plan, supported) {
  const summary = plan.summary || {};
  const policy = plan.policy || {};
  const supportedIds = supported.map((action) => action.remediation_id).filter(Boolean);
  const eligibility = deterministicRemediationEligibility(plan, supportedIds);
  const disabled = !eligibility.allowed;
  return `
    <section class="remediation-summary-card">
      <div class="remediation-summary-copy">
        <span>Copy-only policy</span>
        <strong>${escapeHtml(policy.application_target || "staged_copy_only")}</strong>
        <p>LLM role: ${escapeHtml(policy.llm_role || "advisory_only")} · source mutation: ${escapeHtml(policy.source_data_mutation || "never")}</p>
      </div>
      <div class="remediation-summary-metrics">
        <div><span>actions</span><strong>${integerText(summary.action_count || 0)}</strong></div>
        <div><span>supported</span><strong>${integerText(supported.length)}</strong></div>
        <div><span>review</span><strong>${integerText(summary.review_required_count || 0)}</strong></div>
      </div>
      <div class="remediation-apply-control">
        <button class="button primary" type="button" data-remediation-apply ${disabled ? "disabled" : ""} title="${escapeHtml(eligibility.reason || "")}">
          ${escapeHtml(remediationApplyButtonLabel(eligibility))}
        </button>
        <p>${escapeHtml(eligibility.reason || "Creates a staged CSV + DBML copy, applies supported deterministic actions, then reruns profiling.")}</p>
      </div>
    </section>
  `;
}

function deterministicRemediationEligibility(plan, approvedIds) {
  const sourceJobId = state.dashboardArtifactIndex?.job_id || state.currentJob?.job_id || "";
  const sourceMode = state.currentJob?.job_id === sourceJobId
    ? state.currentJob?.input_mode || ""
    : "";
  if (state.remediationRunning) {
    return { allowed: false, reason: "Remediation recheck is already starting." };
  }
  if (jobIsRunning()) {
    return { allowed: false, reason: "Wait for the current pipeline run to finish before starting another recheck." };
  }
  if (!sourceJobId || !plan) {
    return { allowed: false, reason: "Generate remediation_plan.json before starting a copy-only recheck." };
  }
  if (!["upload", "path", "remediation"].includes(sourceMode)) {
    return {
      allowed: false,
      reason: "Copy-only auto-apply starts from an original CSV+DBML run. For corrected-demo or manual-recheck runs, use Upload corrected inputs / Run corrected demo from a baseline.",
    };
  }
  if (!approvedIds.length) {
    return {
      allowed: false,
      reason: "No supported deterministic fixes are available for this run. Use corrected inputs when the remaining work needs human edits.",
    };
  }
  return { allowed: true, reason: "" };
}

function remediationApplyButtonLabel(eligibility) {
  if (state.remediationRunning) {
    return "Starting recheck...";
  }
  if (eligibility.allowed) {
    return "Apply supported fixes to copy + re-run";
  }
  if (jobIsRunning()) {
    return "Pipeline still running";
  }
  if (!state.currentJob || !getRemediationPlanArtifact()) {
    return "Generate plan first";
  }
  if (!["upload", "path", "remediation"].includes(state.currentJob.input_mode || "")) {
    return "Auto-apply unavailable for this run";
  }
  return "No supported fixes to apply";
}

function renderRemediationDiff(diff, runSummary) {
  const summary = diff?.summary || runSummary?.quality_diff_summary;
  if (!summary) {
    return `
      <section class="remediation-diff-card pending">
        <strong>Before / after diff</strong>
        <p>Run a remediation recheck to compare issue count, readiness, and blocked gates.</p>
      </section>
    `;
  }
  const issueDelta = Number(summary.issue_delta || 0);
  const issueTone = issueDelta < 0 ? "success" : issueDelta > 0 ? "danger" : "neutral";
  return `
    <section class="remediation-diff-card ${issueTone}">
      <div class="remediation-diff-heading">
        <strong>Before / after diff</strong>
        <span>${escapeHtml(diff?.after_job_id || runSummary?.remediation_job_id || "recheck")}</span>
      </div>
      <div class="remediation-diff-grid">
        <div><span>issues</span><strong>${integerText(summary.before_issue_count)} -> ${integerText(summary.after_issue_count)}</strong></div>
        <div><span>resolved</span><strong>${integerText(summary.resolved_issue_count)}</strong></div>
        <div><span>new</span><strong>${integerText(summary.new_issue_count)}</strong></div>
        <div><span>blocked gates</span><strong>${integerText(summary.before_blocked_gates)} -> ${integerText(summary.after_blocked_gates)}</strong></div>
      </div>
      <p>${escapeHtml(summary.before_verdict || "unknown")} -> ${escapeHtml(summary.after_verdict || "unknown")}</p>
    </section>
  `;
}

function renderApprovedRemediations(approved) {
  if (!approved) {
    return "";
  }
  const summary = approved.summary || {};
  return `
    <section class="remediation-approved-card">
      <strong>Approved batch</strong>
      <div class="remediation-approved-grid">
        <div><span>approved</span><strong>${integerText(summary.approved_count || 0)}</strong></div>
        <div><span>changed</span><strong>${integerText(summary.changed_action_count || 0)}</strong></div>
        <div><span>affected</span><strong>${integerText(summary.affected_count || 0)}</strong></div>
      </div>
    </section>
  `;
}

function renderRemediationActionQueue(actions) {
  if (!actions.length) {
    return `
      <section class="remediation-empty">
        <strong>No remediation actions generated.</strong>
        <p>No issues were present, so there is nothing to apply or recheck.</p>
      </section>
    `;
  }
  const visible = actions.slice(0, 8);
  const remaining = actions.slice(visible.length);
  return `
    <section class="remediation-action-queue">
      <div class="remediation-action-heading">
        <strong>Action approval queue</strong>
        <span>${integerText(actions.length)} actions</span>
      </div>
      <div class="remediation-action-list">
        ${visible.map(renderRemediationActionRow).join("")}
      </div>
      ${remaining.length ? `
        <details class="remediation-more">
          <summary>Show ${integerText(remaining.length)} more action${remaining.length === 1 ? "" : "s"}</summary>
          <div class="remediation-action-list compact">
            ${remaining.map(renderRemediationActionRow).join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
}

function renderRemediationActionRow(action) {
  const operation = action.deterministic_operation || {};
  const supported = Boolean(operation.supported);
  const columns = Array.isArray(action.columns) && action.columns.length
    ? action.columns.join(", ")
    : "table";
  return `
    <article class="remediation-action-row ${supported ? "supported" : "review"}">
      <span class="remediation-action-status">${supported ? "copy fix" : "review"}</span>
      <div>
        <code>${escapeHtml(action.remediation_id || "REMEDY")}</code>
        <strong>${escapeHtml(action.table || "dataset")}.${escapeHtml(columns)}</strong>
        <p>${escapeHtml(action.proposed_change || operation.reason || "Review remediation action.")}</p>
      </div>
      <span class="remediation-action-meta">
        <code>${escapeHtml(action.issue_id || "issue")}</code>
        <small>${escapeHtml(action.issue_type || "UNKNOWN")}</small>
      </span>
    </article>
  `;
}

function remediationSupportedActions(plan) {
  return (Array.isArray(plan?.actions) ? plan.actions : []).filter((action) => (
    action?.deterministic_operation?.supported
  ));
}

function renderManualRecheckSection() {
  const loaded = Boolean(state.dashboardArtifactIndex);
  const baselineJobId = manualRecheckBaselineJobId();
  const disabled = state.manualRecheckRunning || !loaded || !baselineJobId || !state.runnerAvailable || jobIsRunning();
  const correctedPreset = demoPresets.smallCorrected;
  els.manualRecheckStatus.textContent = loaded
    ? `Baseline ${baselineJobId}`
    : state.dashboardLoadingJobId
      ? "Fetching baseline artifacts"
      : "Waiting for baseline run";
  els.manualRecheckBaseline.textContent = baselineJobId || "No run selected";
  els.manualRecheckButton.disabled = disabled;
  els.manualRecheckDemoButton.disabled = disabled || !correctedPreset;
  const message = state.manualRecheckMessage ||
    (loaded
      ? "Upload corrected CSV files, optionally override DBML, or run the bundled corrected demo against this baseline."
      : "Open a completed run from history, then recheck corrected CSV files or the bundled corrected demo.");
  els.manualRecheckMessage.textContent = message;
  els.manualRecheckMessage.dataset.status = state.manualRecheckMessageStatus || "";
  els.manualRecheckMessage.hidden = !message;
}

function manualRecheckBaselineJobId() {
  return state.dashboardArtifactIndex?.job_id || "";
}

function setManualRecheckMessage(message, status) {
  state.manualRecheckMessage = message || "";
  state.manualRecheckMessageStatus = status || "";
  els.manualRecheckMessage.textContent = state.manualRecheckMessage;
  els.manualRecheckMessage.dataset.status = state.manualRecheckMessageStatus;
  els.manualRecheckMessage.hidden = !state.manualRecheckMessage;
}

function setRemediationMessage(message, status) {
  els.remediationMessage.textContent = message || "";
  els.remediationMessage.dataset.status = status || "";
  els.remediationMessage.hidden = !message;
}

function renderReportExportSection() {
  const loaded = Boolean(state.dashboardArtifactIndex);
  if (!loaded) {
    els.reportExportStatus.textContent = state.dashboardLoadingJobId
      ? "Fetching reports"
      : "Waiting for reports";
    els.reportExportGrid.innerHTML = `<p class="muted">Run a job to open generated reports.</p>`;
    els.reportExportMessage.textContent = "Reports are ready after a completed run.";
    els.reportExportMessage.dataset.status = "";
    return;
  }

  const reportLinks = renderReportExportLinks();
  els.reportExportGrid.innerHTML = reportLinks || `
    <section class="report-export-empty">
      <strong>Reports are missing.</strong>
      <p>Expected HTML report was not found for this run.</p>
    </section>
  `;
  els.reportExportStatus.textContent = reportLinks ? "Reports ready" : "Reports missing";
  els.reportExportMessage.textContent = reportLinks
    ? "Reports are ready for review."
    : "Report output was not found for this run.";
  els.reportExportMessage.dataset.status = "";
}

function renderReportExportLinks() {
  const reportUrl = artifactUrlFor("report.html");
  if (!reportUrl) {
    return "";
  }
  return `
    <a class="report-export-card" href="${escapeHtml(reportUrl)}" target="_blank" rel="noopener">
      <strong>HTML report</strong>
      <span>Open the fixed-section report for review.</span>
      <code>report.html</code>
    </a>
    ${renderReportIssueLlmAction()}
  `;
}

function renderReportIssueLlmAction() {
  const issue = reportIssueForLlmAction();
  if (!issue) {
    return "";
  }
  const issueId = issueGuid(issue);
  return `
    <button
      class="report-export-card report-export-action-card"
      type="button"
      data-dashboard-kind="issue"
      data-dashboard-value="${escapeHtml(issueId)}"
      data-dashboard-label="${escapeHtml(issueId)}"
      data-dashboard-open-llm="true"
      data-dashboard-scroll="llm"
    >
      <strong>Open OpenAI issue guidance</strong>
      <span>Jump to the selected issue drawer and review the OpenAI guidance panel at the top.</span>
      <code>${escapeHtml(issueLlmActionTarget(issue))}</code>
    </button>
  `;
}

function reportIssueForLlmAction() {
  const issues = getDashboardIssues();
  if (!issues.length) {
    return null;
  }
  if (state.dashboardSelection?.kind === "issue") {
    const selectedIssue = issues.find((issue) => issueGuid(issue) === state.dashboardSelection.value);
    if (selectedIssue) {
      return selectedIssue;
    }
  }
  return issues.slice().sort((a, b) => (
    severityRank(a.severity) - severityRank(b.severity) ||
    Number(b.bad_count || 0) - Number(a.bad_count || 0) ||
    issueGuid(a).localeCompare(issueGuid(b))
  ))[0] || null;
}

function issueLlmActionTarget(issue) {
  const columns = Array.isArray(issue.columns) && issue.columns.length
    ? issue.columns.join(", ")
    : "table-level";
  return `${issueGuid(issue)} · ${issue.table || "dataset"}.${columns}`;
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

function renderTodoIssueQueue(groups) {
  const items = todoIssueWorkItems(groups);
  const title = state.todoFilter === "fix_data"
    ? "Fix data issue queue"
    : state.todoFilter === "verify_after_fix"
      ? "Verify after fix issue queue"
      : "Issue work queue";
  if (!items.length && state.todoFilter !== "all") {
    return `
      <section class="todo-type-section">
        <h4>${escapeHtml(title)}</h4>
        <p class="muted">No ${escapeHtml(todoTypeLabel(state.todoFilter).toLowerCase())} issue actions match this run.</p>
      </section>
    `;
  }
  if (!items.length) {
    return "";
  }
  const visibleItems = items.slice(0, 8);
  const remainingItems = items.slice(visibleItems.length);
  const occurrenceCount = items.reduce((total, item) => total + item.totalCount, 0);
  return `
    <section class="todo-type-section visual">
      <div class="todo-type-heading">
        <div>
          <h4>${escapeHtml(title)}</h4>
          <p>${integerText(items.length)} issues · ${integerText(occurrenceCount)} todo occurrences</p>
        </div>
        <div class="todo-queue-heading-side">
          ${renderTodoQueuePriorityStrip(items)}
          <span class="todo-queue-open-label">Open issue for checklist</span>
        </div>
      </div>
      <div class="todo-issue-queue">
        ${visibleItems.map(renderTodoIssueWorkCard).join("")}
      </div>
      ${remainingItems.length ? renderTodoRemainingIssues(remainingItems) : ""}
    </section>
  `;
}

function renderTodoQueuePriorityStrip(items) {
  const rows = todoIssuePriorityRows(items);
  if (!rows.length) {
    return "";
  }
  return `
    <div class="todo-queue-priority-strip" aria-label="Todo queue urgency order">
      <strong>Urgency order</strong>
      ${rows.map((row) => `
        <span class="todo-queue-priority-chip ${todoPriorityClass(row.label)}">
          ${escapeHtml(row.label)} <b>${integerText(row.value)}</b>
        </span>
      `).join("")}
    </div>
  `;
}

function renderTodoVisualSummary(groups, allGroups, summary) {
  const visibleGroups = groups.length ? groups : allGroups;
  const fixGroups = visibleGroups.filter((group) => group.todo_type === "fix_data");
  const verifyGroups = visibleGroups.filter((group) => group.todo_type === "verify_after_fix");
  const priorityRows = todoPriorityRows(visibleGroups, 4);
  const tableRows = todoTableRows(visibleGroups, 5);
  const summaryCards = state.todoFilter === "fix_data"
    ? [renderTodoSummaryCard("Fix data", summary.fix_data_group_count, summary.fix_data_occurrence_count, fixGroups)]
    : state.todoFilter === "verify_after_fix"
      ? [renderTodoSummaryCard("Verify after fix", summary.verify_after_fix_group_count, summary.verify_after_fix_occurrence_count, verifyGroups)]
      : [
          renderTodoSummaryCard("Fix data", summary.fix_data_group_count, summary.fix_data_occurrence_count, fixGroups),
          renderTodoSummaryCard("Verify after fix", summary.verify_after_fix_group_count, summary.verify_after_fix_occurrence_count, verifyGroups),
        ];
  return `
    <div class="todo-visual-summary" aria-label="Todo visual summary">
      ${summaryCards.join("")}
      ${renderTodoDistributionCard("Priority mix", priorityRows, "No priorities")}
      ${renderTodoDistributionCard("Top tables", tableRows, "No table context")}
    </div>
  `;
}

function renderTodoSummaryCard(label, groupCount, occurrenceCount, groups) {
  const activeGroupCount = state.todoFilter === "all" ? groupCount : groups.length;
  const activeOccurrenceCount = state.todoFilter === "all" ? occurrenceCount : todoOccurrenceTotal(groups);
  const topPriority = todoPriorityRows(groups, 1)[0]?.label || "none";
  return `
    <article class="todo-summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${integerText(activeGroupCount)}</strong>
      <p>${integerText(activeOccurrenceCount)} occurrences · top ${escapeHtml(topPriority)}</p>
    </article>
  `;
}

function renderTodoDistributionCard(title, rows, emptyText) {
  const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
  return `
    <article class="todo-signal-card">
      <strong>${escapeHtml(title)}</strong>
      <div class="todo-distribution-list">
        ${rows.length ? rows.map((row) => {
          const width = Math.max(5, Math.round(Number(row.value || 0) / maxValue * 100));
          return `
            <div class="todo-distribution-row">
              <span>${escapeHtml(row.label)}</span>
              <span class="todo-distribution-track" aria-hidden="true"><span style="width: ${width}%"></span></span>
              <code>${integerText(row.value)}</code>
            </div>
          `;
        }).join("") : `<p class="muted">${escapeHtml(emptyText)}</p>`}
      </div>
    </article>
  `;
}

function todoIssueWorkItems(groups) {
  const byIssue = new Map();
  groups.forEach((group) => {
    const occurrences = Array.isArray(group.occurrences) ? group.occurrences : [];
    occurrences.forEach((occurrence) => {
      const issueId = occurrence.issue_id || "UNKNOWN";
      const issue = issueForTodoOccurrence(occurrence);
      const severity = todoPriorityToken(occurrence.severity || issue?.severity || occurrence.priority || issue?.priority || "");
      if (!byIssue.has(issueId)) {
        byIssue.set(issueId, {
          issueId,
          issue,
          occurrence,
          severity,
          priority: occurrence.priority || issue?.priority || todoUrgencyMeta(severity).priority,
          table: occurrence.table || issue?.table || "unknown",
          columns: Array.isArray(occurrence.columns) && occurrence.columns.length
            ? occurrence.columns
            : (Array.isArray(issue?.columns) ? issue.columns : []),
          issueType: occurrence.issue_type || issue?.issue_type || "UNKNOWN",
          findingSummary: occurrence.finding_summary || todoFindingFromIssue(issue),
          fixTexts: [],
          verifyTexts: [],
          fixCount: 0,
          verifyCount: 0,
          totalCount: 0,
        });
      }
      const item = byIssue.get(issueId);
      if (severityRank(severity) < severityRank(item.severity)) {
        item.severity = severity;
        item.priority = occurrence.priority || issue?.priority || todoUrgencyMeta(severity).priority;
      }
      const text = todoShortText(group.text || "Todo needs review.", 118);
      if (group.todo_type === "verify_after_fix") {
        item.verifyCount += 1;
        addUniqueTodoText(item.verifyTexts, text);
      } else {
        item.fixCount += 1;
        addUniqueTodoText(item.fixTexts, text);
      }
      item.totalCount += 1;
    });
  });
  return [...byIssue.values()].sort((a, b) => (
    severityRank(a.severity) - severityRank(b.severity) ||
    b.totalCount - a.totalCount ||
    a.issueId.localeCompare(b.issueId)
  ));
}

function addUniqueTodoText(target, text) {
  if (!text || target.includes(text)) {
    return;
  }
  target.push(text);
}

function renderTodoIssueWorkCard(item) {
  const field = todoIssueField(item);
  const preview = todoIssuePreviewText(item);
  const urgency = todoUrgencyMeta(item.severity);
  const priorityClass = todoPriorityClass(item.severity);
  return `
    <button class="todo-issue-work-card ${priorityClass}" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(item.issueId)}" data-dashboard-label="${escapeHtml(item.issueId)}" data-dashboard-scroll="drilldown">
      <span class="todo-priority-cell" aria-label="${escapeHtml(`${item.severity} ${urgency.label}: ${urgency.detail}`)}">
        <span class="todo-priority-token">${escapeHtml(item.severity)}</span>
        <strong>${escapeHtml(urgency.label)}</strong>
        <small>${escapeHtml(urgency.detail)}</small>
      </span>
      <span class="todo-work-main">
        <code>${escapeHtml(item.issueId)}</code>
        <strong>${escapeHtml(field)}</strong>
        <small>${escapeHtml(todoIssueTypeLabel(item.issueType))}</small>
      </span>
      <span class="todo-work-counts" aria-label="Todo counts">
        <span>${integerText(item.fixCount)} fix</span>
        <span>${integerText(item.verifyCount)} verify</span>
      </span>
      <span class="todo-work-preview">${escapeHtml(preview)}</span>
    </button>
  `;
}

function todoIssueField(item) {
  const columns = item.columns.length ? item.columns.join(", ") : "table";
  return `${item.table}.${columns}`;
}

function todoIssuePreviewText(item) {
  const firstFix = item.fixTexts.find((text) => !isRoutineTodoText(text)) || item.fixTexts[0];
  const firstVerify = item.verifyTexts.find((text) => !isRoutineTodoText(text)) || item.verifyTexts[0];
  if (state.todoFilter === "verify_after_fix") {
    return firstVerify || "Open issue detail to review verification checklist.";
  }
  if (state.todoFilter === "fix_data") {
    return firstFix || "Open issue detail to review fix checklist.";
  }
  if (firstFix && firstVerify) {
    return `Fix: ${firstFix} Verify: ${firstVerify}`;
  }
  return firstFix || firstVerify || item.findingSummary || "Open issue detail to review fix and verify checklist.";
}

function renderTodoRemainingIssues(items) {
  return `
    <details class="todo-more-groups">
      <summary>Show ${integerText(items.length)} more issue${items.length === 1 ? "" : "s"}</summary>
      <div class="todo-compact-list">
        ${items.map(renderTodoCompactIssue).join("")}
      </div>
    </details>
  `;
}

function renderTodoCompactIssue(item) {
  const urgency = todoUrgencyMeta(item.severity);
  return `
    <button class="todo-compact-row ${todoPriorityClass(item.severity)}" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(item.issueId)}" data-dashboard-label="${escapeHtml(item.issueId)}" data-dashboard-scroll="drilldown">
      <code>${escapeHtml(item.issueId)}</code>
      <strong>${escapeHtml(todoIssueField(item))}</strong>
      <span class="todo-priority-token">${escapeHtml(item.severity)}</span>
      <small>${escapeHtml(urgency.label)} · ${integerText(item.fixCount)} fix · ${integerText(item.verifyCount)} verify</small>
    </button>
  `;
}

function todoIssuePriorityRows(items) {
  const counts = new Map();
  items.forEach((item) => {
    const key = todoPriorityToken(item.severity);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => severityRank(a.label) - severityRank(b.label) || b.value - a.value);
}

function todoPriorityRows(groups, limit) {
  const counts = new Map();
  groups.forEach((group) => {
    const occurrences = Array.isArray(group.occurrences) ? group.occurrences : [];
    if (occurrences.length) {
      occurrences.forEach((occurrence) => {
        const key = todoPriorityToken(occurrence.severity || occurrence.priority || "");
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      return;
    }
    const key = todoPriorityTags(group)[0] || "P?";
    counts.set(key, (counts.get(key) || 0) + Number(group.occurrence_count || 1));
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => severityRank(a.label) - severityRank(b.label) || b.value - a.value)
    .slice(0, limit);
}

function todoTableRows(groups, limit) {
  const counts = new Map();
  groups.forEach((group) => {
    const occurrences = Array.isArray(group.occurrences) ? group.occurrences : [];
    if (occurrences.length) {
      occurrences.forEach((occurrence) => {
        const key = occurrence.table || "unknown";
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      return;
    }
    todoTableTags(group).forEach((table) => {
      counts.set(table, (counts.get(table) || 0) + Number(group.occurrence_count || 1));
    });
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function todoPriorityTags(group) {
  const priorities = [
    ...arrayOfStrings(group.priorities).map(todoPriorityToken),
    ...(Array.isArray(group.occurrences) ? group.occurrences.map((occurrence) => todoPriorityToken(occurrence.severity || occurrence.priority || "")) : []),
  ].filter(Boolean);
  return uniqueSorted(priorities, severityOrder).slice(0, 4);
}

function todoPriorityToken(value) {
  const match = String(value || "").toUpperCase().match(/P[0-3]/);
  return match ? match[0] : "P?";
}

function todoUrgencyMeta(severity) {
  if (severity === "P0") {
    return { label: "Blocker", detail: "Stop and fix first", priority: "P0 - block run/use" };
  }
  if (severity === "P1") {
    return { label: "Fix first", detail: "Before analysis", priority: "P1 - fix before analysis" };
  }
  if (severity === "P2") {
    return { label: "Review", detail: "Owner check", priority: "P2 - review with owner" };
  }
  if (severity === "P3") {
    return { label: "Monitor", detail: "Caution", priority: "P3 - monitor" };
  }
  return { label: "Review", detail: "Needs triage", priority: "Needs human review" };
}

function todoPriorityClass(severity) {
  const token = todoPriorityToken(severity).toLowerCase().replace("?", "unknown");
  return `priority-${token}`;
}

function todoTableTags(group) {
  const tables = [
    ...arrayOfStrings(group.tables),
    ...(Array.isArray(group.occurrences) ? group.occurrences.map((occurrence) => occurrence.table || "") : []),
  ].filter(Boolean);
  return uniqueSorted(tables).slice(0, 4);
}

function todoOccurrenceTotal(groups) {
  return groups.reduce((sum, group) => sum + Number(group.occurrence_count || 0), 0);
}

function todoShortText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  const cutoff = text.lastIndexOf(" ", maxLength - 3);
  return `${text.slice(0, cutoff > 48 ? cutoff : maxLength - 3).trim()}...`;
}

function isRoutineTodoGroup(group) {
  return isRoutineTodoText(group.text);
}

function isRoutineTodoText(value) {
  const text = String(value || "").toLowerCase();
  return text.includes("do not edit generated artifacts") ||
    text.includes("rerun the profiler on the corrected csv + dbml inputs");
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
  const displayStatus = guardrailDisplayStatus(status);
  return dashboardPanel(
    "LLM output validation",
    "guardrail_report.json",
    `
      <button class="risk-gauge-button" type="button" data-dashboard-kind="l4_guardrail" data-dashboard-value="${escapeHtml(status)}" data-dashboard-label="LLM output validation ${escapeHtml(displayStatus)}">
        <span class="pill-status ${guardrailStatusClass(status)}">${escapeHtml(displayStatus)}</span>
        <span>
          <strong>${escapeHtml(provider)}${model ? ` · ${escapeHtml(model)}` : ""}</strong>
          <small>${guardrailScopeText()} ${integerText(checkedNumbers)} numbers · ${integerText(checkedRefs)} refs · ${integerText(violationCount)} violations${fallback ? ` · ${escapeHtml(fallback)}` : ""}</small>
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

function renderIssueVisualSummary(allIssues, filteredIssues) {
  const overviewIssues = Array.isArray(allIssues) ? allIssues : [];
  const focusedIssues = Array.isArray(filteredIssues) ? filteredIssues : overviewIssues;
  const tableRows = [...countBy(overviewIssues, (issue) => issue.table || "Schema / dataset").entries()]
    .map(([label, value]) => ({ label, value, kind: "table" }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 5);
  const typeRows = [...countBy(overviewIssues, (issue) => issue.issue_type || "unknown").entries()]
    .map(([label, value]) => ({ label, displayLabel: issueTypeText(label), value, kind: "issue_type" }))
    .sort((a, b) => b.value - a.value || a.displayLabel.localeCompare(b.displayLabel))
    .slice(0, 5);
  const severityRows = severityPriorityRows(overviewIssues);
  const totalBadRows = sum(overviewIssues.map((issue) => Number(issue.bad_count || 0)));
  return `
    <section class="issue-visual-summary" aria-label="Issue visual summary">
      <div class="issue-visual-heading">
        <div>
          <p class="eyebrow">Visual summary</p>
          <h4>Issue map</h4>
        </div>
        <div class="issue-visual-heading-side">
          ${renderIssueActiveLens(focusedIssues.length)}
          <div class="issue-visual-total">
            <strong>${integerText(overviewIssues.length)}</strong>
            <span>issues total · ${integerText(totalBadRows)} bad rows</span>
          </div>
        </div>
      </div>
      <div class="issue-visual-grid">
        ${renderSeverityPriorityPanel(severityRows)}
        ${renderIssueVisualChart("Top tables", "Where issues cluster", tableRows, "No table issue clusters were generated.")}
        ${renderIssueVisualChart("Issue types", "What failed", typeRows, "No issue types were generated.")}
      </div>
    </section>
  `;
}

function renderStage4ReviewBriefing(allIssues, filteredIssues) {
  const issues = sortIssuesForReview(allIssues || []);
  const focusedIssues = Array.isArray(filteredIssues) ? filteredIssues : issues;
  const topIssue = issues[0] || null;
  const topLlm = topIssue ? getIssueLlmEnrichment(topIssue, "openai") : null;
  const missingRows = dashboardChartRows(dashboardChartPaths.missingColumns)
    .filter((row) => Number(row.null_count || 0) > 0);
  const outlierRows = dashboardChartRows(dashboardChartPaths.outliers)
    .filter((row) => Number(row.outlier_count || 0) > 0);
  const tableRows = getDashboardTableAssessments()
    .slice()
    .sort((a, b) => (
      readinessOrder(a.readiness) - readinessOrder(b.readiness) ||
      Number(a.health_score || 0) - Number(b.health_score || 0) ||
      String(a.table || "").localeCompare(String(b.table || ""))
    ))
    .slice(0, 6);
  return `
    <section class="review-briefing" aria-label="Stage 4 review briefing">
      <div class="review-briefing-heading">
        <div>
          <p class="eyebrow">Review briefing</p>
          <h4>What to inspect and escalate</h4>
        </div>
        <span>${integerText(focusedIssues.length)}/${integerText(issues.length)} issues in current view</span>
      </div>
      <div class="review-briefing-grid">
        ${stage4BriefingCards({ issues, topIssue, missingRows, outlierRows, topLlm }).map(renderStage4BriefingCard).join("")}
      </div>
      <div class="review-data-map" aria-label="DBML table, missingness, outlier, and issue evidence map">
        ${renderStage4TableMap(tableRows)}
        ${renderStage4DataSignals(missingRows, outlierRows)}
      </div>
    </section>
  `;
}

function stage4BriefingCards({ issues, topIssue, missingRows, outlierRows, topLlm }) {
  const p0p1 = issues.filter((issue) => ["P0", "P1"].includes(todoPriorityToken(issue.severity))).length;
  const missingTotal = missingRows.reduce((sum, row) => sum + Number(row.null_count || 0), 0);
  const outlierTotal = outlierRows.reduce((sum, row) => sum + Number(row.outlier_count || 0), 0);
  const llmStatus = topLlm?.status || "not generated";
  return [
    {
      title: "Overall",
      tone: p0p1 ? "danger" : "success",
      bullets: [
        `${integerText(issues.length)} issues detected.`,
        `${integerText(p0p1)} P0/P1 blockers before analysis.`,
        topIssue ? `${issueGuid(topIssue)} is first by severity and bad rows.` : "No issue selected.",
      ],
    },
    {
      title: "Data signals",
      tone: missingTotal || outlierTotal ? "warning" : "success",
      bullets: [
        `${integerText(missingTotal)} missing values across ${integerText(missingRows.length)} columns.`,
        `${integerText(outlierTotal)} outliers across ${integerText(outlierRows.length)} numeric columns.`,
        "Use the maps below before opening individual details.",
      ],
    },
    {
      title: "Default route",
      tone: "info",
      bullets: [
        "Inspect highlighted sample rows.",
        "Fix source extract, pipeline, or DBML contract.",
        "Do not edit generated artifacts.",
      ],
    },
    {
      title: "OpenAI add-on",
      tone: topLlm?.status === "succeeded" ? "info" : "warning",
      bullets: [
        `Top issue guidance: ${llmStatus}.`,
        topLlm?.status === "succeeded" ? "Selected-issue guidance is available." : "Run OpenAI guidance on selected issue if needed.",
        "Human review required before applying AI advice.",
      ],
    },
  ];
}

function renderStage4BriefingCard(card) {
  return `
    <article class="review-briefing-card ${escapeHtml(card.tone)}">
      <strong>${escapeHtml(card.title)}</strong>
      <ul>
        ${card.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderStage4TableMap(tables) {
  if (!tables.length) {
    return `<article class="review-data-card"><strong>DBML table map</strong><p class="muted">table_assessments.json is unavailable.</p></article>`;
  }
  return `
    <article class="review-data-card wide">
      <div class="review-data-card-heading">
        <strong>DBML table map</strong>
        <span>${integerText(tables.length)} highest-risk tables</span>
      </div>
      <div class="review-table-map-grid">
        ${tables.map((table) => {
          const counts = tableSeverityCounts(table);
          const affected = Array.isArray(table.affected_columns) ? table.affected_columns : [];
          return `
            <button class="review-table-map-card" type="button" data-dashboard-kind="table_assessment" data-dashboard-value="${escapeHtml(table.table)}" data-dashboard-label="${escapeHtml(table.table)}" data-dashboard-scroll="drilldown">
              <span><code>${escapeHtml(table.table)}</code><small>${escapeHtml(table.role || "unknown")}</small></span>
              <span class="pill-status ${readinessPillClass(table.readiness)}">${escapeHtml(table.readiness || "unknown")}</span>
              <span class="review-table-health">${integerText(table.health_score)} health</span>
              ${renderTableSeverityStrip(counts)}
              <small>${escapeHtml(affected.slice(0, 3).join(", ") || "No affected columns")}</small>
            </button>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function renderStage4DataSignals(missingRows, outlierRows) {
  return `
    <article class="review-data-card">
      <div class="review-data-card-heading">
        <strong>Missing values</strong>
        <span>${integerText(missingRows.length)} columns</span>
      </div>
      ${renderStage4SignalRows(
        missingRows.slice(0, 5).map((row) => ({
          label: row.field || `${row.table}.${row.column}`,
          value: integerText(row.null_count),
          detail: percentText(row.null_rate),
          kind: "missing_table",
          rawValue: row.table,
        })),
        "No missing-value columns.",
      )}
    </article>
    <article class="review-data-card">
      <div class="review-data-card-heading">
        <strong>Outliers</strong>
        <span>${integerText(outlierRows.length)} columns</span>
      </div>
      ${renderStage4SignalRows(
        outlierRows.slice(0, 5).map((row) => ({
          label: row.field || `${row.table}.${row.column}`,
          value: integerText(row.outlier_count),
          detail: percentText(row.outlier_rate),
          kind: "numeric_outlier",
          rawValue: row.field || `${row.table}.${row.column}`,
        })),
        "No IQR outlier columns.",
      )}
    </article>
  `;
}

function renderStage4SignalRows(rows, emptyText) {
  if (!rows.length) {
    return `<p class="muted">${escapeHtml(emptyText)}</p>`;
  }
  return `
    <div class="review-signal-list">
      ${rows.map((row) => `
        <button class="review-signal-row" type="button" data-dashboard-kind="${escapeHtml(row.kind)}" data-dashboard-value="${escapeHtml(row.rawValue)}" data-dashboard-label="${escapeHtml(row.label)}" data-dashboard-scroll="drilldown">
          <span>${escapeHtml(row.label)}</span>
          <code>${escapeHtml(row.value)}</code>
          <small>${escapeHtml(row.detail)}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function firstArrayText(values) {
  if (!Array.isArray(values)) {
    return "";
  }
  const value = values.find((item) => String(item || "").trim());
  return value ? String(value).trim() : "";
}

function severityPriorityRows(issues) {
  return severityOrder.map((label) => {
    const matching = issues.filter((issue) => issue.severity === label);
    return {
      label,
      value: matching.length,
      badRows: sum(matching.map((issue) => Number(issue.bad_count || 0))),
      kind: "severity",
    };
  });
}

function renderSeverityPriorityPanel(rows) {
  const maxBadRows = Math.max(...rows.map((row) => Number(row.badRows || 0)), 1);
  const mustFix = rows.filter((row) => row.label === "P0" || row.label === "P1");
  const review = rows.filter((row) => row.label === "P2" || row.label === "P3");
  return `
    <article class="severity-priority-panel" aria-label="Severity priority">
      <div class="issue-visual-chart-heading">
        <strong>Severity priority</strong>
        <span>Fix order</span>
      </div>
      <div class="severity-priority-stack">
        ${renderSeverityPriorityGroup("Must fix before analysis", mustFix, maxBadRows, "critical")}
        ${renderSeverityPriorityGroup("Review after blockers", review, maxBadRows, "review")}
      </div>
    </article>
  `;
}

function renderSeverityPriorityGroup(title, rows, maxBadRows, tone) {
  return `
    <div class="severity-priority-group ${escapeHtml(tone)}">
      <span>${escapeHtml(title)}</span>
      <div>
        ${rows.map((row) => renderSeverityPriorityCard(row, maxBadRows)).join("")}
      </div>
    </div>
  `;
}

function renderSeverityPriorityCard(row, maxBadRows) {
  const value = Number(row.value || 0);
  const badRows = Number(row.badRows || 0);
  const width = badRows > 0 ? Math.max(6, Math.round(badRows / maxBadRows * 100)) : 0;
  const selected = state.dashboardFilters.severity === row.label;
  const meta = severityPriorityMeta(row.label);
  return `
    <button class="severity-priority-card ${dashboardTone(row.label)} ${selected ? "selected" : ""}" type="button" data-dashboard-kind="${escapeHtml(row.kind)}" data-dashboard-value="${escapeHtml(row.label)}" data-dashboard-label="${escapeHtml(row.label)}" data-dashboard-scroll="drilldown" aria-pressed="${selected ? "true" : "false"}" aria-label="${escapeHtml(`${row.label}: ${meta.label}, ${integerText(value)} issues, ${integerText(badRows)} bad rows`)}">
      <span class="severity-priority-code">${escapeHtml(row.label)}</span>
      <span class="severity-priority-copy">
        <strong>${escapeHtml(meta.label)}</strong>
        <small>${escapeHtml(meta.detail)}</small>
      </span>
      <span class="severity-priority-count">${integerText(value)}</span>
      <span class="severity-priority-meter" aria-hidden="true"><span style="width: ${width}%"></span></span>
      <span class="severity-priority-impact">${integerText(badRows)} bad rows</span>
    </button>
  `;
}

function severityPriorityMeta(severity) {
  if (severity === "P0") {
    return { label: "Blocks use", detail: "Stop use" };
  }
  if (severity === "P1") {
    return { label: "Fix first", detail: "Pre-analysis" };
  }
  if (severity === "P2") {
    return { label: "Review", detail: "Owner check" };
  }
  if (severity === "P3") {
    return { label: "Monitor", detail: "Caution" };
  }
  return { label: "Review", detail: "Owner check" };
}

function renderIssueActiveLens(filteredCount) {
  const label = dashboardActiveFilterLabel();
  if (!label) {
    return "";
  }
  return `
    <div class="issue-active-lens" role="status">
      <span>Focus: ${escapeHtml(label)}</span>
      <strong>${integerText(filteredCount)}/${integerText(getDashboardIssues().length)}</strong>
      <button type="button" data-dashboard-reset-filters>Show full review</button>
    </div>
  `;
}

function dashboardActiveFilterLabel() {
  const filters = state.dashboardFilters;
  if (filters.severity !== "all") {
    return `severity ${filters.severity}`;
  }
  if (filters.issueType !== "all") {
    return issueTypeText(filters.issueType);
  }
  if (filters.table !== "all") {
    return `table ${filters.table}`;
  }
  return "";
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
  const selected = issueVisualRowSelected(row);
  return `
    <button class="issue-visual-row ${selected ? "selected" : ""}" type="button" data-dashboard-kind="${escapeHtml(row.kind)}" data-dashboard-value="${escapeHtml(row.label)}" data-dashboard-label="${escapeHtml(label)}" data-dashboard-scroll="drilldown" aria-pressed="${selected ? "true" : "false"}">
      <span class="issue-visual-row-label">${escapeHtml(label)}</span>
      <span class="issue-visual-row-track" aria-hidden="true">
        <span class="issue-visual-row-fill ${dashboardTone(row.label)}" style="width: ${width}%"></span>
      </span>
      <span class="issue-visual-row-value">${integerText(value)}</span>
    </button>
  `;
}

function issueVisualRowSelected(row) {
  const filters = state.dashboardFilters;
  if (row.kind === "table") {
    return filters.table === row.label;
  }
  if (row.kind === "issue_type") {
    return filters.issueType === row.label;
  }
  if (row.kind === "severity") {
    return filters.severity === row.label;
  }
  return false;
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

function renderIssueInbox(filteredIssues, allIssues = filteredIssues) {
  const issues = sortIssuesForReview(filteredIssues);
  const availableTables = uniqueSorted((allIssues || []).map((issue) => issue.table).filter(Boolean));
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
        <div class="issue-inbox-side">
          ${renderIssueTableControls(availableTables)}
          <div class="issue-inbox-totals" aria-label="Issue inbox summary">
            <span>${integerText(issues.length)} issues</span>
            <span>${integerText(columnCount)} columns</span>
            <span>${integerText(tableCount)} tables</span>
          </div>
        </div>
      </div>
      <div class="issue-review-table" role="table" aria-label="Issues by table and column">
        <div class="issue-review-header" role="row">
          <span role="columnheader">Priority</span>
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

function renderIssueTableControls(availableTables) {
  const selectedTable = state.dashboardFilters.table || "all";
  const tableOptions = [
    `<option value="all"${selectedTable === "all" ? " selected" : ""}>All tables</option>`,
    ...availableTables.map((table) => (
      `<option value="${escapeHtml(table)}"${selectedTable === table ? " selected" : ""}>${escapeHtml(table)}</option>`
    )),
  ].join("");
  return `
    <div class="issue-table-controls" aria-label="Issue table controls">
      <label class="issue-table-filter">
        <span>Table</span>
        <select data-issue-table-filter aria-label="Filter Issue table by table">
          ${tableOptions}
        </select>
      </label>
      <span class="issue-sort-note">Sort: P0 first</span>
    </div>
  `;
}

function sortIssuesForReview(issues) {
  return [...(issues || [])].sort((a, b) => (
    severityRank(a.severity) - severityRank(b.severity) ||
    Number(b.bad_count || 0) - Number(a.bad_count || 0) ||
    issueStatusOrder(issueStatus(a)) - issueStatusOrder(issueStatus(b)) ||
    (a.table || "").localeCompare(b.table || "") ||
    issuePrimaryColumn(a).localeCompare(issuePrimaryColumn(b)) ||
    issueGuid(a).localeCompare(issueGuid(b))
  ));
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
      <span class="issue-priority-cell" role="cell">
        <span class="issue-severity-token ${dashboardTone(issue.severity)}">${escapeHtml(issue.severity || "P?")}</span>
        <code>${escapeHtml(issueGuid(issue))}</code>
      </span>
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
  const tableCount = uniqueSorted(issues.map((issue) => issue.table).filter(Boolean)).length;
  const badRowCount = sum(issues.map((issue) => Number(issue.bad_count || 0)));
  els.dashboardDrilldownMeta.textContent = selection.label || "Review Issues";
  els.dashboardDrilldown.innerHTML = `
    <div class="drilldown-summary">
      <div><span>${integerText(issues.length)}</span><p>matching issue${issues.length === 1 ? "" : "s"}</p></div>
      <div><span>${integerText(tableCount)}</span><p>table${tableCount === 1 ? "" : "s"}</p></div>
      <div><span>${integerText(badRowCount)}</span><p>bad row${badRowCount === 1 ? "" : "s"}</p></div>
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
    const assessment = getDashboardTableAssessments().find((row) => row.table === selection.value);
    const relatedIssueIds = new Set(relatedIssueIdsForTableAssessment(assessment));
    return issues.filter((issue) => issue.table === selection.value || relatedIssueIds.has(issue.issue_id));
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

function relatedIssueIdsForTableAssessment(assessment) {
  if (!assessment) {
    return [];
  }
  const ids = new Set();
  (assessment.relationship_risks || []).forEach((risk) => {
    relatedIssueIdsForRelationshipRisk(risk).forEach((issueId) => ids.add(issueId));
  });
  return [...ids].sort((a, b) => a.localeCompare(b));
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
      ${renderIssueLlmPriorityPanel(actionPlan, issue)}
      ${renderIssueSampleRows(issue)}
      ${renderIssueActionDisclosure("Evidence", "Sample + query", renderIssueEvidencePack(issue), { open: true })}
      ${renderIssueActionDisclosure("Fix / Todo", "Actions only", renderIssueActionPlan(actionPlan, issue), { open: true })}
    </article>
  `;
}

function renderIssueLlmPriorityPanel(actionPlan, issue) {
  return `
    <section class="issue-llm-priority-panel" aria-label="OpenAI issue guidance">
      <div class="issue-llm-priority-heading">
        <div>
          <span>OpenAI issue guidance</span>
          <strong>Additional review context</strong>
        </div>
        <code>issue_llm_enrichments.json</code>
      </div>
      ${renderIssueLlmEnrichment(actionPlan, issue)}
    </section>
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

function renderIssueEvidencePack(issue) {
  const path = issue.sample_bad_rows_path || "";
  const query = String(issue.evidence_sql || "").trim();
  return `
    <div class="issue-evidence-pack compact">
      <div class="issue-evidence-intro">
        <strong>Evidence scope</strong>
        <p>${escapeHtml(issueWhatHappened(issue))}</p>
      </div>
      ${renderIssueAdditionalEvidence(issue)}
      ${path ? `
        <p class="issue-evidence-note">Row preview above is the bounded sample for <code>${escapeHtml(path)}</code>; highlighted cells mark the issue columns.</p>
      ` : ""}
      ${query ? `
        <details class="issue-detail-disclosure issue-evidence-query">
          <summary><h5>Detection query</h5><span>Show SQL</span></summary>
          <div class="issue-detail-disclosure-body">
            <pre><code>${escapeHtml(query)}</code></pre>
          </div>
        </details>
      ` : ""}
    </div>
  `;
}

function renderIssueAdditionalEvidence(issue) {
  const evidence = renderIssueEvidence(issue, {
    excludeLabels: [
      "Issue guid",
      "Bad rows",
      "Affected rate",
      "Total rows checked",
      "Parent table",
      "Sample rows",
      "Evidence query",
    ],
  });
  if (!evidence) {
    return "";
  }
  return `
    <section>
      <h5>Additional evidence</h5>
      ${evidence}
    </section>
  `;
}

function renderIssueEvidence(issue, options = {}) {
  const excludeLabels = new Set(options.excludeLabels || []);
  const evidenceValues = issueEvidenceValues(issue).filter((item) => !excludeLabels.has(item.label));
  if (!evidenceValues.length) {
    return "";
  }
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
  const sourceValue = plan.source === "deterministic" ? "source=deterministic" : `source=${plan.source || "deterministic"}`;
  const llmEntry = getIssueLlmEnrichment(issue, "openai");
  const llmFixAdditions = issueLlmActionAdditions(plan, llmEntry, "fix");
  const llmVerifyAdditions = issueLlmActionAdditions(plan, llmEntry, "verify");
  const hasLlmAdditions = llmFixAdditions.length || llmVerifyAdditions.length;
  return `
    <div class="action-plan">
      ${renderIssueExportControls(plan)}
      <div class="action-plan-summary">
        <div>
          <span>Recommended work</span>
          <strong>${escapeHtml(plan.priority || "Needs human review")}</strong>
        </div>
        <span class="action-plan-source-chips">
          <code>${escapeHtml(sourceValue)}</code>
          ${hasLlmAdditions ? `<code>OpenAI additions applied</code>` : ""}
        </span>
      </div>
      ${plan.human_review_required ? `
        <div class="action-plan-human-review">
          <strong>Needs human review</strong>
          <p>${escapeHtml(plan.human_review_reason || "Deterministic context is incomplete.")}</p>
        </div>
      ` : ""}
      <div class="issue-fix-todo-grid">
        <div class="action-plan-block">
          <strong>Fix data checklist</strong>
          ${renderActionPlanSteps(plan.fix_data_steps, plan.fix_data_checklist, 2, {
            collapseRemaining: true,
            showEvidence: false,
            showWhy: false,
          })}
          ${renderIssueLlmActionAdditions("OpenAI fix additions", llmFixAdditions)}
        </div>
        <div class="action-plan-block">
          <strong>Verify after fix checklist</strong>
          ${renderActionPlanSteps(plan.verify_after_fix_steps, plan.verify_after_fix_checklist, 2, {
            collapseRemaining: true,
            showEvidence: false,
            showWhy: false,
          })}
          ${renderIssueLlmActionAdditions("OpenAI verify additions", llmVerifyAdditions)}
        </div>
      </div>
      <details class="issue-detail-disclosure action-plan-more">
        <summary><h5>More deterministic context</h5><span>Metrics and guidelines</span></summary>
        <div class="issue-detail-disclosure-body">
          <div class="action-plan-metrics" aria-label="Action plan metrics">
            ${renderActionPlanMetric("Priority", plan.priority || "Needs human review", "")}
            ${renderActionPlanMetric(
              "Source",
              hasLlmAdditions ? `${sourceValue} + OpenAI advisory` : sourceValue,
              hasLlmAdditions
                ? "OpenAI additions are shown in Fix / Todo but require human review."
                : "Generated without LLM enrichment.",
            )}
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
            <strong>Guidelines</strong>
            ${renderActionPlanList(plan.guidelines)}
          </div>
        </div>
      </details>
    </div>
  `;
}

function issueLlmActionAdditions(plan, entry, kind) {
  if (!entry || entry.status !== "succeeded") {
    return [];
  }
  const response = entry.structured_response || {};
  const key = kind === "verify" ? "extra_verification" : "extra_fix_suggestion";
  return filterDuplicateLlmItems(response[key], deterministicPlanTexts(plan, kind));
}

function renderIssueLlmActionAdditions(title, items) {
  if (!items.length) {
    return "";
  }
  return `
    <div class="action-plan-llm-additions" data-llm-action-additions>
      <div class="action-plan-llm-heading">
        <strong>${escapeHtml(title)}</strong>
        <span>human review required</span>
      </div>
      <div class="action-plan-step-list">
        ${items.map((item, index) => `
          <div class="action-plan-step llm">
            <div class="action-plan-step-heading">
              <span>AI${integerText(index + 1)}</span>
              <strong>Advisory addition</strong>
            </div>
            <p>${escapeHtml(item)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderIssueLlmEnrichment(plan, issue) {
  const issueId = issueGuid(issue);
  const provider = "openai";
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
        <div class="issue-llm-callout">
          <strong>Updates Fix / Todo when available</strong>
          <span>OpenAI additions are merged into the Fix / Todo checklist below and require human review.</span>
        </div>
        <button class="button secondary compact" type="button" data-issue-llm-run data-issue-id="${escapeHtml(issueId)}" ${running ? "disabled" : ""}>
          ${issueLlmButtonLabel(provider, Boolean(entry))}
        </button>
      </div>
      <p class="form-message issue-llm-message" data-status="${escapeHtml(state.issueLlmMessageStatus || issueLlmStatusToMessageStatus(status))}" role="status">${escapeHtml(message)}</p>
      ${renderIssueLlmStructuredResponse(entry, provider, plan)}
    </div>
  `;
}

function renderIssueLlmStructuredResponse(entry, provider, plan = null) {
  if (!entry) {
    return `
      <div class="issue-llm-result empty">
        <p class="muted">No ${escapeHtml(issueLlmProviderLabel(provider))} guidance has been generated for this issue yet. Keep the Stage 3 toggle on before running, or run this selected issue now.</p>
      </div>
    `;
  }
  const response = entry.structured_response || {};
  const review = response.human_review_needed || {};
  const status = entry.status || "unknown";
  const extraFixItems = filterDuplicateLlmItems(response.extra_fix_suggestion, deterministicPlanTexts(plan, "fix"));
  const extraVerifyItems = filterDuplicateLlmItems(response.extra_verification, deterministicPlanTexts(plan, "verify"));
  const actionAdditionCount = extraFixItems.length + extraVerifyItems.length;
  const guidanceAvailable = [
    response.why_this_was_flagged,
  ].some((items) => Array.isArray(items) && items.filter(Boolean).length);
  const reviewReason = review.reason || entry.error?.message || "Human review is required before using this advisory LLM enrichment.";
  return `
    <div class="issue-llm-result" data-issue-llm-result-status="${escapeHtml(status)}">
      <div class="issue-llm-result-heading">
        <strong>${escapeHtml(issueLlmProviderLabel(entry.provider || provider))} result</strong>
        <span class="pill-status ${issueLlmStatusClass(status)}">${escapeHtml(status)}</span>
      </div>
      ${guidanceAvailable ? `
        ${renderIssueLlmSection("Why this was flagged", response.why_this_was_flagged)}
      ` : `<p class="muted">OpenAI guidance is unavailable for this issue. Use the deterministic Fix / Todo checklist below, then retry after provider configuration is available.</p>`}
      ${actionAdditionCount
        ? `<p class="issue-llm-footnote">${integerText(actionAdditionCount)} OpenAI fix/verify addition${actionAdditionCount === 1 ? "" : "s"} merged into Fix / Todo below.</p>`
        : ""}
      <div class="issue-llm-review">
        <strong>Human review needed</strong>
        <p>${escapeHtml(reviewReason)}</p>
      </div>
      <p class="issue-llm-footnote">Deterministic action plans remain the source of truth.</p>
    </div>
  `;
}

function issueLlmButtonLabel(provider, hasEntry) {
  if (hasEntry) {
    return "Retry OpenAI enrichment";
  }
  return "Run OpenAI guidance";
}

function renderIssueLlmSection(title, items, emptyText = "No LLM guidance was generated for this section.") {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return `
    <div class="issue-llm-section">
      <strong>${escapeHtml(title)}</strong>
      ${list.length
        ? `<ul class="issue-detail-list">${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : `<p class="muted">${escapeHtml(emptyText)}</p>`}
    </div>
  `;
}

function deterministicPlanTexts(plan, kind) {
  if (!plan) {
    return [];
  }
  const stepKey = kind === "verify" ? "verify_after_fix_steps" : "fix_data_steps";
  const checklistKey = kind === "verify" ? "verify_after_fix_checklist" : "fix_data_checklist";
  const stepTexts = Array.isArray(plan[stepKey])
    ? plan[stepKey].flatMap((step) => [step.title, step.detail, step.evidence, step.why])
    : [];
  const checklistTexts = Array.isArray(plan[checklistKey]) ? plan[checklistKey] : [];
  return [...stepTexts, ...checklistTexts]
    .map((item) => normalizeGuidanceText(item))
    .filter(Boolean);
}

function filterDuplicateLlmItems(items, deterministicTexts) {
  const normalizedDeterministic = deterministicTexts.filter(Boolean);
  return (Array.isArray(items) ? items : []).filter((item) => {
    const normalized = normalizeGuidanceText(item);
    if (!normalized) {
      return false;
    }
    return !normalizedDeterministic.some((candidate) => guidanceTextOverlaps(normalized, candidate));
  });
}

function guidanceTextOverlaps(left, right) {
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  const minLength = Math.min(left.length, right.length);
  return minLength >= 36 && (left.includes(right) || right.includes(left));
}

function normalizeGuidanceText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/issue-\d+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  const llmEntry = getIssueLlmEnrichment(plan, "openai");
  const llmFixAdditions = issueLlmActionAdditions(plan, llmEntry, "fix");
  const llmVerifyAdditions = issueLlmActionAdditions(plan, llmEntry, "verify");
  const lines = [
    `# ${plan.issue_id || "UNKNOWN"} ${plan.issue_type || "Issue"}`,
    "",
    `- Priority: ${plan.priority || "Needs human review"}`,
    `- Source: ${plan.source || "deterministic"}`,
    `- OpenAI additions: ${llmFixAdditions.length || llmVerifyAdditions.length ? "included, human review required" : "none"}`,
    `- Table: ${plan.table || "unknown"}`,
    `- Columns: ${arrayOfStrings(plan.columns).join(", ") || "table scope"}`,
    "",
    "## Finding",
    plan.finding_summary || "Finding summary needs human review.",
    "",
    "## Fix data checklist",
    ...actionPlanMarkdownSteps(plan.fix_data_steps, plan.fix_data_checklist),
    ...actionPlanMarkdownLlmAdditions("OpenAI fix additions", llmFixAdditions),
    "",
    "## Verify after fix checklist",
    ...actionPlanMarkdownSteps(plan.verify_after_fix_steps, plan.verify_after_fix_checklist),
    ...actionPlanMarkdownLlmAdditions("OpenAI verify additions", llmVerifyAdditions),
    "",
    "## Guidelines",
    ...actionPlanMarkdownItems(plan.guidelines),
  ];
  return lines.join("\n");
}

function actionPlanMarkdownLlmAdditions(title, items) {
  if (!items.length) {
    return [];
  }
  return [
    "",
    `### ${title}`,
    "_Advisory OpenAI additions. Human review is required before changing data or contracts._",
    ...items.map((item) => `- ${item}`),
  ];
}

function actionPlanMarkdownSteps(steps, fallbackItems) {
  const structured = Array.isArray(steps) ? steps.filter((step) => step && typeof step === "object") : [];
  if (!structured.length) {
    return actionPlanMarkdownItems(fallbackItems);
  }
  return structured.flatMap((step, index) => {
    const lines = [`${index + 1}. ${step.title || "Action step"}: ${step.detail || "Needs human review."}`];
    if (step.evidence) {
      lines.push(`   - Evidence: ${step.evidence}`);
    }
    if (step.why) {
      lines.push(`   - Why: ${step.why}`);
    }
    return lines;
  });
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

function renderActionPlanSteps(steps, fallbackItems, limit = 4, options = {}) {
  const structured = Array.isArray(steps) ? steps.filter((step) => step && typeof step === "object") : [];
  const showEvidence = options.showEvidence !== false;
  const showWhy = options.showWhy !== false;
  if (structured.length) {
    const visibleSteps = structured.slice(0, limit);
    const remainingSteps = options.collapseRemaining ? structured.slice(limit) : [];
    return `
      <div class="action-plan-step-list">
        ${visibleSteps.map((step, index) => renderActionPlanStep(step, index, { showEvidence, showWhy })).join("")}
        ${remainingSteps.length ? `
          <details class="action-plan-remaining">
            <summary>${integerText(remainingSteps.length)} more checklist step${remainingSteps.length === 1 ? "" : "s"}</summary>
            <div class="action-plan-step-list">
              ${remainingSteps.map((step, index) => renderActionPlanStep(step, index + limit, { showEvidence, showWhy })).join("")}
            </div>
          </details>
        ` : ""}
      </div>
    `;
  }
  return renderActionPlanList(fallbackItems, limit);
}

function renderActionPlanStep(step, index, options = {}) {
  const evidence = String(step.evidence || "").trim();
  const why = String(step.why || "").trim();
  return `
    <div class="action-plan-step">
      <div class="action-plan-step-heading">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(step.title || "Action step")}</strong>
      </div>
      <p>${escapeHtml(step.detail || "Needs human review before assigning this action.")}</p>
      ${options.showEvidence && evidence ? `<small><b>Evidence</b>${escapeHtml(evidence)}</small>` : ""}
      ${options.showWhy && why ? `<small><b>Why</b>${escapeHtml(why)}</small>` : ""}
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
  const displayStatus = guardrailDisplayStatus(guardrail.status);
  return `
    <div class="table-assessment-detail">
      <div>
        <strong>LLM output validation</strong>
        <p>${guardrailScopeText()}</p>
      </div>
      <span class="pill-status ${guardrailStatusClass(guardrail.status)}">${escapeHtml(displayStatus)}</span>
      <dl class="graph-metadata">
        <div><dt>provider</dt><dd>${escapeHtml(guardrail.provider || "unknown")}${model ? ` · ${escapeHtml(model)}` : ""}</dd></div>
        <div><dt>checked numbers</dt><dd>${integerText(checkedNumbers)}</dd></div>
        <div><dt>checked refs</dt><dd>${integerText(checkedRefs)}</dd></div>
        <div><dt>violations</dt><dd>${integerText(violations.length)}</dd></div>
        <div><dt>fallback reason</dt><dd>${escapeHtml(guardrail.fallback_reason || "none")}</dd></div>
        <div><dt>raw CSV included</dt><dd>${escapeHtml(String(Boolean(guardrail.raw_csv_included)))}</dd></div>
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
  const risks = Array.isArray(assessment.relationship_risks) ? assessment.relationship_risks : [];
  const evidence = tableReadinessEvidence(assessment);
  return `
    <div class="table-assessment-detail">
      <div class="table-assessment-detail-heading">
        <div>
          <strong><code>${escapeHtml(assessment.table)}</code></strong>
          <p>${escapeHtml(assessment.role || "unknown")} · ${escapeHtml(impact.label || "General analytics")}</p>
        </div>
        <button class="button secondary compact" type="button" data-dashboard-reset-filters>Show full review</button>
      </div>
      <span class="pill-status ${readinessPillClass(assessment.readiness)}">${escapeHtml(assessment.readiness || "unknown")}</span>
      ${renderTableScoreBreakdown(evidence, assessment)}
      ${renderTableColumnEvidenceTable(evidence)}
      ${renderTableRelationshipRisks(assessment)}
      <dl class="graph-metadata table-impact-context">
        <div><dt>analysis impact</dt><dd>${escapeHtml(impact.category || "general_analytics")}</dd></div>
        <div><dt>impact evidence</dt><dd>${escapeHtml(impact.rationale || "")}</dd></div>
        <div><dt>FK risks</dt><dd>${integerText(risks.length)}</dd></div>
      </dl>
    </div>
  `;
}

function renderTableScoreBreakdown(evidence, assessment) {
  const parts = tableScoreFormulaParts(evidence.score, evidence.severityCounts);
  return `
    <section class="table-score-breakdown" aria-label="Table health score calculation">
      <div>
        <span>Score calculation</span>
        <strong>100 - ${integerText(evidence.score.totalPenalty)} = ${integerText(evidence.score.healthScore)}/100</strong>
        <small>${escapeHtml(parts.length ? parts.join(" · ") : "No penalties")}</small>
      </div>
      ${renderTableSeverityStrip(evidence.severityCounts)}
      <p>Health score combines issue severity penalties and FK relationship penalties from table_assessments.json: P0=${tableIssueScoreWeights.P0}, P1=${tableIssueScoreWeights.P1}, P2=${tableIssueScoreWeights.P2}, P3=${tableIssueScoreWeights.P3}; invalid FK=${tableRelationshipScoreWeights.invalid}, warning FK=${tableRelationshipScoreWeights.warning}, skipped FK=${tableRelationshipScoreWeights.skipped}.</p>
      ${evidence.score.calculatedHealth !== Number(assessment.health_score) ? `
        <p class="muted">Displayed score follows artifact value ${integerText(assessment.health_score)}; calculated preview is ${integerText(evidence.score.calculatedHealth)}.</p>
      ` : ""}
    </section>
  `;
}

function renderTableColumnEvidenceTable(evidence) {
  const rows = evidence.columnRows.filter((row) => row.issueTotal || row.missingCount || row.outlierCount);
  return `
    <section class="table-column-evidence-table" aria-label="Column readiness evidence">
      <div class="table-column-evidence-heading">
        <strong>Column readiness evidence</strong>
        <span>${integerText(rows.length)} affected columns</span>
      </div>
      ${rows.length ? `
        <div class="table-column-evidence-header" role="row">
          <span role="columnheader">Column</span>
          <span role="columnheader">Issue levels</span>
          <span role="columnheader">Missing</span>
          <span role="columnheader">Outlier</span>
          <span role="columnheader">Bad rows</span>
        </div>
        ${rows.map((row) => `
          <button class="table-column-evidence-row" type="button" data-dashboard-kind="${row.outlierCount ? "numeric_outlier" : "table_assessment"}" data-dashboard-value="${escapeHtml(row.outlierCount ? `${row.table}.${row.column}` : row.table)}" data-dashboard-label="${escapeHtml(`${row.table}.${row.column}`)}" data-dashboard-scroll="drilldown" role="row">
            <span role="cell"><code>${escapeHtml(row.column)}</code></span>
            <span class="table-column-severity-cells" role="cell">
              ${severityOrder.map((severity) => `
                <span class="${todoPriorityClass(severity)}"><b>${escapeHtml(severity)}</b>${integerText(row.issueCounts[severity] || 0)}</span>
              `).join("")}
            </span>
            <span role="cell">${integerText(row.missingCount)}<small>${row.missingCount ? percentText(row.missingRate) : "clean"}</small></span>
            <span role="cell">${integerText(row.outlierCount)}<small>${row.outlierCount ? percentText(row.outlierRate) : "none"}</small></span>
            <span role="cell">${integerText(row.badRows)}</span>
          </button>
        `).join("")}
      ` : `<p class="muted">No per-column missing, outlier, or issue evidence for this table.</p>`}
    </section>
  `;
}

function renderTableRelationshipRisks(assessment) {
  const risks = Array.isArray(assessment.relationship_risks) ? assessment.relationship_risks : [];
  if (!risks.length) {
    return `
      <section class="table-relationship-risks" aria-label="FK relationship risks">
        <div class="table-column-evidence-heading">
          <strong>FK relationship risks</strong>
          <span>0 risks</span>
        </div>
        <p class="muted">No FK relationship risk was counted for this table.</p>
      </section>
    `;
  }
  return `
    <section class="table-relationship-risks" aria-label="FK relationship risks">
      <div class="table-column-evidence-heading">
        <strong>FK relationship risks</strong>
        <span>${integerText(risks.length)} risk${risks.length === 1 ? "" : "s"}</span>
      </div>
      <div class="relationship-risk-list">
        ${risks.map((risk) => renderTableRelationshipRisk(risk)).join("")}
      </div>
    </section>
  `;
}

function renderTableRelationshipRisk(risk) {
  const roleText = risk.role === "parent"
    ? "This table is the parent side; fix the child rows or load missing parent keys."
    : "This table is the child side; fix its FK values or parent coverage.";
  const source = relationshipEndpointText(risk.source_table, risk.source_columns);
  const target = relationshipEndpointText(risk.target_table, risk.target_columns);
  const issueIds = relatedIssueIdsForRelationshipRisk(risk);
  const joinCoverage = Number.isFinite(Number(risk.join_coverage)) ? percentText(Number(risk.join_coverage)) : "--";
  return `
    <article class="relationship-risk-card">
      <div class="relationship-risk-heading">
        <span class="pill-status ${risk.status === "invalid" ? "missing" : "mapped"}">${escapeHtml(relationshipRiskPenaltyLabel(risk.status))}</span>
        <code>${escapeHtml(risk.relationship_id || `${source}->${target}`)}</code>
      </div>
      <div class="relationship-risk-flow" aria-label="Relationship endpoints">
        <code>${escapeHtml(source)}</code>
        <span>-></span>
        <code>${escapeHtml(target)}</code>
      </div>
      <p>${escapeHtml(roleText)} ${escapeHtml(risk.status_reason || "")}</p>
      <div class="relationship-risk-metrics">
        <span><strong>${integerText(risk.orphan_count || 0)}</strong> orphan rows</span>
        <span><strong>${integerText(risk.parent_duplicate_count || 0)}</strong> parent duplicates</span>
        <span><strong>${integerText(risk.child_fk_null_count || 0)}</strong> child FK nulls</span>
        <span><strong>${escapeHtml(joinCoverage)}</strong> join coverage</span>
      </div>
      ${issueIds.length ? `
        <div class="relationship-risk-issues">
          <span>Open related issue</span>
          ${issueIds.map((issueId) => `
            <button class="relationship-risk-issue" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(issueId)}" data-dashboard-label="${escapeHtml(issueId)}" data-dashboard-scroll="drilldown">
              <code>${escapeHtml(issueId)}</code>
            </button>
          `).join("")}
        </div>
      ` : `<p class="muted">No linked issue row was found for this FK risk; inspect relationship_graph.json.</p>`}
    </article>
  `;
}

function relationshipEndpointText(table, columns) {
  const columnText = Array.isArray(columns) && columns.length ? columns.join(", ") : "key";
  return `${table || "table"}.${columnText}`;
}

function relatedIssueIdsForRelationshipRisk(risk) {
  const edge = relationshipEdgeForRisk(risk);
  const ids = new Set();
  (edge?.evidence_links || []).forEach((link) => {
    if (link?.issue_id) {
      ids.add(String(link.issue_id));
    }
  });
  if (!ids.size) {
    const sourceColumns = new Set(risk.source_columns || []);
    getDashboardIssues().forEach((issue) => {
      const issueColumns = Array.isArray(issue.columns) ? issue.columns : [];
      const matchesSource = issue.table === risk.source_table &&
        issueColumns.some((column) => sourceColumns.has(column));
      const matchesParent = issue.parent_table === risk.target_table;
      if (matchesSource && matchesParent && issue.issue_id) {
        ids.add(issue.issue_id);
      }
    });
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function relationshipEdgeForRisk(risk) {
  const relationshipId = risk?.relationship_id || "";
  const edges = state.dashboardArtifacts["relationship_graph.json"]?.edges;
  if (!relationshipId || !Array.isArray(edges)) {
    return null;
  }
  return edges.find((edge) => edge.id === relationshipId) || null;
}

function renderIssueRows(issues) {
  const sortedIssues = sortIssuesForReview(issues);
  if (!sortedIssues.length) {
    return `<p class="muted">No issues match this selection.</p>`;
  }
  return `
    <div class="dashboard-issue-list" role="table" aria-label="Matching issues by severity">
      ${renderDrilldownSeverityStrip(sortedIssues)}
      <div class="dashboard-issue-header" role="row">
        <span role="columnheader">Priority</span>
        <span role="columnheader">Issue</span>
        <span role="columnheader">Where</span>
        <span role="columnheader">Affected</span>
        <span role="columnheader">Evidence</span>
      </div>
      ${sortedIssues.slice(0, 12).map(renderDrilldownIssueRow).join("")}
    </div>
  `;
}

function renderDrilldownSeverityStrip(issues) {
  const counts = drilldownIssueSeverityRows(issues);
  return `
    <div class="drilldown-severity-strip" aria-label="Severity counts for current drilldown">
      <strong>Severity order</strong>
      ${severityOrder.map((severity) => {
        const count = counts.get(severity) || 0;
        const meta = todoUrgencyMeta(severity);
        return `
          <span class="drilldown-severity-chip ${todoPriorityClass(severity)}" title="${escapeHtml(meta.priority)}">
            <span>${escapeHtml(severity)}</span>
            <b>${integerText(count)}</b>
          </span>
        `;
      }).join("")}
    </div>
  `;
}

function drilldownIssueSeverityRows(issues) {
  return issues.reduce((counts, issue) => {
    const severity = todoPriorityToken(issue.severity);
    counts.set(severity, (counts.get(severity) || 0) + 1);
    return counts;
  }, new Map());
}

function renderDrilldownIssueRow(issue) {
  const severity = todoPriorityToken(issue.severity);
  const urgency = todoUrgencyMeta(severity);
  const priorityClass = todoPriorityClass(severity);
  const affectedPercent = Math.min(100, Math.max(0, Number(issue.bad_rate || 0) * 100));
  const affectedWidth = Number(issue.bad_count || 0) > 0 ? Math.max(2, affectedPercent) : 0;
  return `
    <button class="dashboard-issue-row ${priorityClass}" type="button" data-dashboard-kind="issue" data-dashboard-value="${escapeHtml(issueGuid(issue))}" data-dashboard-label="${escapeHtml(issueGuid(issue))}" data-dashboard-scroll="drilldown" role="row" aria-label="${escapeHtml(`${severity} ${issueGuid(issue)} ${issueTypeLabel(issue)} ${drilldownIssueLocationText(issue)}`)}">
      <span class="drilldown-priority-cell" role="cell">
        <span class="drilldown-priority-token">${escapeHtml(severity)}</span>
        <span>
          <strong>${escapeHtml(urgency.label)}</strong>
          <small>${escapeHtml(urgency.detail)}</small>
        </span>
      </span>
      <span class="drilldown-issue-main" role="cell">
        <strong>${escapeHtml(issueTypeLabel(issue))}</strong>
        <small><code>${escapeHtml(issueGuid(issue))}</code></small>
      </span>
      <span class="drilldown-issue-location" role="cell">
        ${drilldownIssueLocation(issue)}
      </span>
      <span class="issue-counts drilldown-issue-counts" role="cell">
        <span>${integerText(issue.bad_count)} rows</span>
        <span class="issue-row-meter" aria-label="${escapeHtml(percentText(issue.bad_rate))} affected"><span style="width: ${affectedWidth}%"></span></span>
        <span>${percentText(issue.bad_rate)}</span>
      </span>
      <span class="drilldown-issue-action" role="cell">
        ${issue.sample_bad_rows_path
          ? `<span class="sample-preview-button as-label">Preview rows</span>`
          : `<span class="muted">no sample</span>`}
      </span>
    </button>
  `;
}

function drilldownIssueLocation(issue) {
  const table = issue.table || "unknown";
  const columns = Array.isArray(issue.columns) && issue.columns.length ? issue.columns.join(", ") : "table scope";
  const parentColumns = Array.isArray(issue.parent_columns) && issue.parent_columns.length ? issue.parent_columns.join(", ") : "key";
  const relationship = issue.parent_table ? `
    <small><code>${escapeHtml(table)}.${escapeHtml(columns)}</code> -> <code>${escapeHtml(issue.parent_table)}.${escapeHtml(parentColumns)}</code></small>
  ` : "";
  return `
    <strong><code>${escapeHtml(table)}</code></strong>
    <small><code>${escapeHtml(columns)}</code></small>
    ${relationship}
  `;
}

function drilldownIssueLocationText(issue) {
  const table = issue.table || "unknown";
  const columns = Array.isArray(issue.columns) && issue.columns.length ? issue.columns.join(", ") : "table scope";
  return `${table} ${columns}`;
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

function getRemediationPlanArtifact() {
  const artifact = state.dashboardArtifacts["remediation_plan.json"];
  return artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact : null;
}

function getApprovedRemediationsArtifact() {
  const artifact = state.dashboardArtifacts["approved_remediations.json"];
  return artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact : null;
}

function getRemediationRunSummaryArtifact() {
  const artifact = state.dashboardArtifacts["remediation_run_summary.json"];
  return artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact : null;
}

function getBeforeAfterQualityDiffArtifact() {
  const artifact = state.dashboardArtifacts["before_after_quality_diff.json"];
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
    "guardrail_report.json": "LLM output validation report",
    "remediation_plan.json": "Remediation plan",
    "approved_remediations.json": "Approved remediations",
    "remediation_run_summary.json": "Remediation run summary",
    "before_after_quality_diff.json": "Before/after quality diff",
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

function guardrailDisplayStatus(status) {
  const normalized = String(status || "unknown");
  if (normalized === "passed") {
    return "LLM text valid";
  }
  if (normalized === "failed") {
    return "LLM text failed";
  }
  if (normalized === "fallback_used") {
    return "fallback used";
  }
  if (normalized === "not_enabled") {
    return "not enabled";
  }
  return normalized.replace(/_/g, " ");
}

function guardrailScopeText() {
  return "Validates LLM text only; data readiness still comes from quality gates.";
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
