import re
from pathlib import Path


def _css_block(css: str, selector: str) -> str:
    match = re.search(rf"{re.escape(selector)}\s*\{{(?P<body>.*?)\n\}}", css, re.S)
    assert match, f"Missing CSS selector {selector}"
    return match.group("body")


def test_web_ui_contains_upload_mapping_and_visualization_regions():
    root = Path(__file__).resolve().parents[1] / "web"
    design_system = Path(__file__).resolve().parents[1] / ".interface-design" / "system.md"
    html = (root / "index.html").read_text()
    css = (root / "styles.css").read_text()
    app_js = (root / "app.js").read_text()
    js_modules = [
        root / "js" / "demo-data.js",
        root / "js" / "source-parsers.js",
        root / "js" / "dashboard-config.js",
        root / "js" / "workflow-nav-config.js",
    ]
    js = app_js + "\n" + "\n".join(path.read_text() for path in js_modules)
    design = design_system.read_text()

    required_html = [
        "Data Quality Profiler",
        'rel="icon"',
        'href="favicon.svg"',
        'id="flowChooser"',
        'id="workflowNav"',
        'aria-label="Workflow navigator"',
        'src="js/workflow-nav-config.js"',
        'id="profileFlow"',
        'data-profile-step="connect"',
        'id="evaluateFlow"',
        'id="profileFlowButton"',
        'id="evaluateFlowButton"',
        'id="flowModeStatus"',
        'id="profileStepBack"',
        'id="profileStepNext"',
        'id="profileStepHint"',
        "Add source",
        "Inspect results",
        'data-profile-step-card="connect"',
        'data-profile-step-card="preflight"',
        'data-profile-step-card="run"',
        'data-profile-step-card="review"',
        'data-profile-step-section="connect"',
        'data-profile-step-section="preflight"',
        'data-profile-step-section="run"',
        'data-profile-step-section="review"',
        "Profile my data",
        "Evaluate tool",
        "Built-in faulty dataset comparison",
        'id="evaluateStatusBadge"',
        'id="evaluationCatalogCount"',
        'id="evaluationDatasetList"',
        'id="startEvaluationButton"',
        'id="evaluateMessage"',
        'id="evaluationComparison"',
        'id="evaluationComparisonStatus"',
        'id="evaluationSummaryStrip"',
        'id="evaluationExpectedList"',
        'id="evaluationUsefulnessList"',
        'id="evaluationBaselineList"',
        'id="evaluationArtifactLinks"',
        "Comparison Summary",
        "Curated dataset catalog",
        "Great Expectations baseline",
        "No arbitrary uploads are accepted in Evaluate.",
        'id="dbmlInput"',
        'id="csvInput"',
        'id="sourceState"',
        'id="sourceStateBadge"',
        'id="sourceStateSummary"',
        'id="sourceStateDetails"',
        'id="quickDemoButton"',
        'id="clearUploadButton"',
        "Input source",
        "Source status",
        "Connect DBML + CSV",
        "Upload files and map tables",
        "DBML contract",
        "CSV files",
        "Use sample DBML + CSV",
        'id="visualizeButton"',
        'id="mappingBody"',
        'id="diagramFrame"',
        'id="localDiagram"',
        'id="diagramSvg"',
        'id="diagramMessage"',
        'id="diagramWarnings"',
        'id="diagramSourceBadge"',
        'id="diagramFitButton"',
        'id="diagramZoomOutButton"',
        'id="diagramZoomValue"',
        'id="diagramZoomInButton"',
        'id="diagramColumnsToggle"',
        'id="diagramResetSelection"',
        'id="diagramCanvas"',
        'id="diagramInspector"',
        'id="runnerForm"',
        'id="pathRunnerForm"',
        'id="preflightReview"',
        'id="preflightGateBadge"',
        'id="preflightRunSummary"',
        'id="preflightBlockerList"',
        'id="preflightWarningList"',
        'aria-label="What are preflight blockers?"',
        'aria-label="What are preflight warnings?"',
        'id="preflightBlockersInfo"',
        'id="preflightWarningsInfo"',
        'role="tooltip"',
        "Preflight Review",
        "Review connection and mapping readiness",
        "Blockers stop the run.",
        "Warnings need review.",
        "LLM enrichment",
        "LLM report enrichment",
        "OpenAI calls run only when this is on",
        "report rendering stays local",
        'id="llmModeToggle"',
        'role="switch"',
        'aria-checked="false"',
        'class="llm-switch-track"',
        'class="llm-switch-thumb"',
        'id="llmModeStatus"',
        'id="runProfilerButton"',
        'id="runPathProfilerButton"',
        'id="dbmlPathInput"',
        'id="csvDirPathInput"',
        'type="hidden"',
        'id="runSourcePreview"',
        'id="runSourceMode"',
        'id="runSourceDbml"',
        'id="runSourceCsvCount"',
        'id="runSourceCsvList"',
        "Selected source",
        'id="stageList"',
        'id="artifactList"',
        'id="runHistory"',
        'id="runHistoryList"',
        'id="runHistoryStatus"',
        'id="selectedRunTimeline"',
        'id="selectedRunTimelineStatus"',
        'id="dashboard"',
        'id="dashboardPanelGrid"',
        'aria-label="Review Issues visual charts and issue table"',
        "Issue detail drawer",
        "Select an issue to inspect where it happened, evidence, impact, and fix guidance.",
        'id="dashboardSummaryStrip"',
        'id="qualityGates"',
        'id="qualityGatesStatus"',
        'id="qualityGatesGrid"',
        "Quality Gates",
        'id="reportExport"',
        'id="reportExportStatus"',
        'id="reportExportGrid"',
        'id="reportExportTodos"',
        'id="reportExportMessage"',
        "Report / Export",
        'id="tableImpact"',
        'id="tableImpactGrid"',
        'id="tableImpactStatus"',
        'id="dashboardDrilldown"',
        "DBML diagram preview",
        "Local diagram preview renders from browser DBML state",
        "Fit view",
        "Zoom out",
        "Zoom in",
        "Hide full columns",
        "Reset layout",
        "CSV to DBML Table Mapping",
        "Run a local CSV + DBML data-quality profile",
        "Issue review snapshot",
        "Review Issues",
        "Table Readiness",
        "Hosted previews do not run profiler jobs",
        "Upload CSV + DBML",
        "Local CSV path",
        "LLM report enrichment",
        "OPENAI_API_KEY",
        "Upload DBML to preview schema",
        "Reset demo",
        'src="js/demo-data.js"',
        'src="js/source-parsers.js"',
        'src="js/dashboard-config.js"',
    ]
    for marker in required_html:
        assert marker in html
    assert "Previous runs" not in html
    assert "Run History" not in html
    assert "Select prior run and timeline" not in js
    assert "Current DBML + CSV source" not in html
    assert "Upload DBML contract" not in html
    assert "Upload related CSV files" not in html

    forbidden_html = [
        'id="databaseRunnerForm"',
        'id="runDatabaseProfilerButton"',
        'id="rulesPathInput"',
        'id="pathTargetInput"',
        'id="runnerModeDatabase"',
        'id="databaseSourceType"',
        'id="databaseUrlInput"',
        'id="databaseSchemaInput"',
        'id="databaseTablesInput"',
        'id="databaseChunkRowsInput"',
        'id="databaseRulesPathInput"',
        'id="databaseTargetInput"',
        "Developer DB source",
        "Compatibility run options",
        "Compatibility rule config",
        "Compatibility rule config path",
        "Compatibility association field",
        "Connection URL",
        "Schema / database",
        "Table list",
        'id="graphs"',
        'id="artifacts"',
        'id="dashboardGraphModeLineage"',
        'id="dashboardGraphModeRelationship"',
        'id="dashboardGraphDisplayOverview"',
        'id="dashboardGraphDisplayFocus"',
        'id="dashboardGraphDisplayFull"',
        'id="dashboardGraphColumnsToggle"',
        'id="dashboardGraphRuntimeToggle"',
        'id="dashboardGraphInvalidOnlyToggle"',
        'id="dashboardGraphResetView"',
        'id="dashboardGraphScope"',
        'id="dashboardGraphStatus"',
        'id="dashboardGraphSvg"',
        'id="dashboardGraphLegend"',
        'id="dashboardGraphDrilldown"',
        'id="dashboardArtifactLinks"',
        "Developer Schema Context",
        "Graph drilldown",
        "Developer artifact sources",
        "Schema context",
        "Developer artifacts",
        "Reset graph view",
        "Invalid/warning only",
        '<details class="info-popover">',
    ]
    for marker in forbidden_html:
        assert marker not in html

    required_css_tokens = [
        "--surface-canvas",
        "--surface-panel",
        "--surface-rail",
        "--accent",
        "--focus-ring",
        ".flow-chooser",
        ".flow-card",
        ".profile-flow",
        ".profile-step-strip",
        ".status-card-copy",
        ".sr-only",
        ".profile-step-footer",
        ".profile-step-actions",
        ".source-state-panel",
        ".source-state-grid",
        ".evaluate-flow-surface",
        ".evaluation-dataset-card",
        ".evaluation-summary-strip",
        ".evaluation-row",
        ".evaluation-metric-grid",
        ".preflight-review-panel",
        ".preflight-heading-label",
        ".info-popover",
        ".info-popover-trigger",
        ".info-popover-card",
        ".preflight-item",
        ".issue-inbox-grid",
        ".issue-review-table",
        ".issue-review-header",
        ".issue-review-body",
        ".issue-row-meter",
        ".issue-detail-drawer",
        ".issue-detail-disclosure",
        ".issue-context-strip",
        ".evidence-value",
        ".issue-llm-enrichment",
        ".issue-llm-controls",
        ".issue-llm-section",
        ".workflow-nav",
        ".nav-stage-item",
        ".nav-substep-list",
        ".nav-subitem",
        ".runtime-stage-item",
        ".stage-info-icon",
        ".stage-info-tooltip",
        ".stage-dropdown",
        ".stage-detail-grid",
        ".todo-occurrence-heading",
        ".todo-occurrence-finding",
        ".todo-occurrence-evidence",
        ".quality-gates-section",
        ".quality-gate-card",
        ".quality-gate-evidence-value",
        ".issue-active-lens",
        ".issue-visual-summary",
        ".issue-visual-chart",
        ".issue-focus-map",
        ".developer-options",
        ".runner-source-switch",
        ".diagram-role-bridge",
        ".diagram-edge-hit",
        ".diagram-edge-flow",
        ".diagram-cardinality-glyph",
        ".diagram-column-icon-key",
        ".diagram-column-icon-link",
        ".diagram-column-type",
        ".pill-status.manual",
        ".pill-status.ambiguous",
        ".pill-status.failed",
        "@media (prefers-reduced-motion: reduce)",
    ]
    for marker in required_css_tokens:
        assert marker in css

    assert "grid-template-columns: repeat(auto-fit, minmax(156px, 1fr));" in _css_block(css, ".profile-step-strip")

    required_js = [
        "parseDbml",
        "flowMode",
        "profileStep",
        "setFlowMode",
        "setProfileStep",
        "moveProfileStep",
        "profileStepGuard",
        "profileSourceReady",
        "profileRunComplete",
        "canOpenProfileStep",
        "data-profile-step-section",
        "profileStepLabels",
        "profileFlowButton",
        "evaluateFlowButton",
        "evaluationCatalog",
        "loadEvaluationCatalog",
        "startEvaluationRun",
        "pollEvaluationJob",
        "renderEvaluation",
        "renderEvaluationComparison",
        "renderEvaluationIssueRows",
        "renderEvaluationBaselineRows",
        "baselineStatusLabel",
        "/api/evaluation-catalog",
        "/api/evaluations",
        "evaluation_summary.json",
        "ground_truth_issues.json",
        "baseline_comparison.json",
        "Not covered by baseline",
        "GE unavailable",
        "parseCsvHeader",
        "VSF_DEMO_DATA",
        "VSF_SOURCE_PARSERS",
        "VSF_DASHBOARD_CONFIG",
        "markCustomUploadSource",
        "Custom CSV upload replaced the previous source inventory",
        "autoLinkCsvs",
        "manualMappings",
        "preflightAcceptedWarnings",
        "demoPresets",
        "runnerUiDemoPresets",
        "quickDemo",
        "mappingOverridesForRun",
        "buildPreflightReview",
        "buildPreflightReviewPayload",
        "preflightGateMessage",
        "conflictingMappingGroups",
        "csvColumnDiff",
        "dbml_parse_failure",
        "zero_mapped_tables",
        "preflight_review",
        "llmRunOptions",
        "appendLlmFormFields",
        "use_llm",
        "llm_provider",
        "checkRunnerHealth",
        "startProfilerRun",
        "startPathRun",
        "renderGeneratedResults",
        "renderGeneratedResultPreviews",
        "renderGeneratedL4Preview",
        "renderGeneratedIssueLlmPreview",
        "renderGeneratedReportLinks",
        "renderReportExportSection",
        "renderReportExportLinks",
        "handleTodoExport",
        "issueTodoGroupsMarkdown",
        "artifactUrlFromArtifacts",
        "loadDashboard",
        "renderDashboard",
        "renderDashboardSummary",
        "renderIssueInbox",
        "renderIssueDetailDrawer",
        "renderIssueLlmEnrichment",
        "runIssueLlmEnrichment",
        "getIssueLlmEnrichment",
        "issueEvidenceValues",
        "issueStatus",
        "Review warning: numeric outlier",
        "Schema/table-level checks",
        "Parent context",
        "Where",
        "What happened",
        "Evidence",
        "Why it matters",
        "How to fix",
        "LLM enrichment add-on",
        "Why this was flagged",
        "Extra fix suggestion",
        "Extra verification",
        "Human review needed",
        "renderL4GuardrailPanel",
        "renderTableImpactSection",
        "renderDashboardDrilldown",
        "renderL4GuardrailDetails",
        "guardrailStatusClass",
        "renderDiagram",
        "buildDiagramModel",
        "buildPreflightDiagramModel",
        "buildArtifactDiagramModel",
        "drawLocalDiagram",
        "layoutLocalDiagram",
        "diagramTableRole",
        "diagramVisibleColumns",
        "diagramManualPositions",
        "handleDiagramPointerDown",
        "handleDiagramPointerMove",
        "handleDiagramPointerEnd",
        "applyDiagramManualPositions",
        "findDiagramTableElement",
        "syncDiagramRelationshipGeometry",
        "diagramRelationshipTablePosition",
        "diagramColumnAbsoluteY",
        "diagramColumnIconSvg",
        "diagramKeyIconSvg",
        "diagramLinkIconSvg",
        "const rightLimit",
        "titleType",
        "diagramTableSelectionStatus",
        "diagramRelationshipSelectionStatus",
        "handleDiagramSelectionEvent",
        "renderDiagramInspector",
        "diagramSelectionContext",
        "localDiagramLimits",
        "Local DBML preview unavailable",
        "Diagram is too large for local preview",
        "Upload DBML to preview schema",
        "schema_diagram.json",
        "schema_parse_report.json",
        "l4_report.md",
        "guardrail_report.json",
        "issue_llm_enrichments.json",
        "/issue-enrichments",
        "data-issue-llm-provider",
        "data-issue-llm-run",
        "data-diagram-table",
        "data-diagram-relationship",
        "diagram-relationship",
        "diagram-cardinality-one",
        "diagram-cardinality-many",
        "one-to-many",
        "EventSource",
        "renderAll();",
        "buildDbdiagramUrl",
        "https://dbdiagram.io/embed?c=",
    ]
    for marker in required_js:
        assert marker in js

    evaluate_start = html.index('id="evaluateFlow"')
    evaluate_end = html.index("</section>", evaluate_start)
    evaluate_shell = html[evaluate_start:evaluate_end]
    for marker in [
        'id="dbmlInput"',
        'id="csvInput"',
        'id="runnerForm"',
        'id="pathRunnerForm"',
        'id="databaseRunnerForm"',
        'type="file"',
        'fetch("/api/jobs"',
        'fetch("/api/path-jobs"',
    ]:
        assert marker not in evaluate_shell

    source_switch_start = html.index('class="runner-mode-switch runner-source-switch"')
    source_switch_end = html.index('id="profileDeveloperOptions"', source_switch_start)
    primary_source_switch = html[source_switch_start:source_switch_end]
    assert 'aria-label="Runner mode" hidden' in primary_source_switch
    assert "Upload CSV + DBML" in primary_source_switch
    assert "Local CSV path" in primary_source_switch
    assert 'id="llmModeOff"' not in html
    assert 'id="llmModeOpenAI"' not in html
    assert "DBML file path" not in html
    assert "CSV directory path" not in html
    assert "Developer DB source" not in primary_source_switch
    assert "Legacy Olist sample" not in primary_source_switch
    assert "Legacy Olist sample" not in html
    assert "examples/olist/schema.dbml" not in html
    assert "data/olist" not in html

    assert "restrained guided data-quality console" in design
    assert "Single-Flow Review Stack" in design
    assert "Table Readiness" in design
    assert "Local ERD Diagram" in design
    assert "orthogonal elbow paths" in design
    assert "Georgia" not in css
    assert "radial-gradient" not in css
    assert "#fffaf0" not in css


def test_web_review_surfaces_use_single_flow_layouts():
    root = Path(__file__).resolve().parents[1]
    css = (root / "web" / "styles.css").read_text()
    design = (root / ".interface-design" / "system.md").read_text()

    single_flow_selectors = [
        ".dashboard-layout",
        ".quality-gate-grid",
        ".quality-gate-heading",
        ".quality-gate-evidence",
        ".table-impact-grid",
        ".dashboard-detail-grid",
        ".table-assessment-detail",
        ".dashboard-issue-row",
        ".drilldown-summary",
        ".issue-detail-grid div",
        ".evidence-value",
        ".action-plan-metrics",
        ".todo-summary-strip",
        ".todo-group-heading",
        ".todo-occurrence",
        ".runner-grid",
        ".preflight-review-grid",
        ".preflight-item",
        ".runtime-panel",
    ]
    for selector in single_flow_selectors:
        assert "grid-template-columns: minmax(0, 1fr);" in _css_block(css, selector)

    assert "max-height:" in _css_block(css, ".issue-review-body")
    assert "overflow: auto;" in _css_block(css, ".issue-review-body")
    assert "grid-template-columns:" in _css_block(css, ".issue-inbox-row")
    assert "Avoid primary two-column split layouts for review surfaces" in design


def test_web_ui_uses_local_backend_runner_without_js_profiler_port():
    root = Path(__file__).resolve().parents[1] / "web"
    js = "\n".join(
        [
            (root / "app.js").read_text(),
            (root / "js" / "dashboard-config.js").read_text(),
            (root / "js" / "workflow-nav-config.js").read_text(),
        ]
    )
    assert 'fetch("/api/health"' in js
    assert 'fetch("/api/jobs"' in js
    assert 'fetch("/api/path-jobs"' in js
    assert 'fetch("/api/history"' in js
    assert 'fetch(`/api/jobs/${jobId}/dashboard`' in js
    assert "new EventSource" in js
    assert "run_events.jsonl" in js
    assert "run_summary.json" in js
    assert "runtimeStageDescriptions" in js
    assert "renderRuntimeStage" in js
    assert "renderRuntimeStageDropdown" in js
    assert "insertInferredRuntimeStages" in js
    assert "Waiting for provider response and guardrail validation." in js
    assert "runtimeStageStatusClass" in js
    assert "renderRunHistory" in js
    assert "sourceStageStatusText" in js
    assert "compactPreflightStatusText" in js
    assert "titleCaseStatus" in js
    assert "renderSidebarNavigation" in js
    assert "profileStageCompleteForSidebar" in js
    assert "workflowTargetFromViewport" in js
    assert "data-workflow-nav-target" in js
    assert "Quality Gates" in js
    assert "Issue table" in js
    assert "Charts and issue table" in js
    assert "renderIssueVisualSummary" in js
    assert "renderIssueFocusMap" in js
    assert "selectedRunTimeline" in js
    assert 'return stage?.name === "influence_analysis";' in js
    assert "LLM output validation" in js
    assert "LLM text valid" in js
    assert "Validates LLM text only; data readiness still comes from quality gates." in js
    assert "Optional LLM guardrail" not in js
    assert "data-run-history-job-id" in js
    assert "charts/issue_counts_by_severity.json" in js
    assert "charts/issue_counts_by_type.json" in js
    assert "charts/missingness_by_table.json" in js
    assert "charts/outliers_top_columns.json" in js
    assert "charts/relationship_fk_health.json" in js
    assert "charts/influence_top_features.json" in js
    assert "renderOutliersPanel" in js
    assert "lineage_graph.json" in js
    assert "relationship_graph.json" in js
    assert "table_assessments.json" in js
    assert "issue_action_plans.json" in js
    assert "issue_llm_enrichments.json" in js
    assert "issue_todos.json" in js
    assert "quality_gates.json" in js
    assert "guardrail_report.json" in js
    assert "renderQualityGatesSection" in js
    assert "getQualityGatesArtifact" in js
    assert "quality_gates.json was not available" in js
    assert "renderTableImpactSection" in js
    assert "renderTodosSection" in js
    assert "renderReportExportSection" in js
    assert "issueForTodoOccurrence" in js
    assert "todoOccurrenceEvidenceText" in js
    assert "data-dashboard-scroll=\"drilldown\"" in js
    assert "open issue detail" in js
    assert "Copy Fix data Markdown" in js
    assert "Copy Verify after fix Markdown" in js
    assert "Reports and todo exports are ready for review." in js
    assert "Developer artifacts below" not in js
    assert "getIssueTodosArtifact" in js
    assert "No todos generated" in js
    assert "Todo artifact missing" in js
    assert "getIssueActionPlans" in js
    assert "renderIssueActionPlan" in js
    assert "renderIssueLlmEnrichment" in js
    assert "runIssueLlmEnrichment" in js
    assert "getIssueLlmEnrichment" in js
    assert "data-issue-llm-provider" in js
    assert "data-issue-llm-run" in js
    assert "/issue-enrichments" in js
    assert "Why this was flagged" in js
    assert "Extra fix suggestion" in js
    assert "Extra verification" in js
    assert "Human review needed" in js
    assert "Copy Markdown" in js
    assert "Copy CSV row" in js
    assert "Copy JSON" in js
    assert "data-action-plan-export" in js
    assert "issueActionPlanMarkdown" in js
    assert "issueActionPlanCsvRow" in js
    assert "issueActionPlanJson" in js
    assert "Fix data checklist" in js
    assert "Verify after fix checklist" in js
    assert "Evidence coverage" in js
    assert "Actionability" in js
    assert "source=deterministic" in js
    assert "data-graph-node-id" not in js
    assert "profile_dataset" not in js
    assert "run_quality_checks" not in js
    assert "XMLHttpRequest" not in js
    assert "diagramFrame.src =" not in js


def test_web_ui_path_mode_avoids_browser_directory_permission_api():
    root = Path(__file__).resolve().parents[1] / "web"
    html = (root / "index.html").read_text()
    js = (root / "app.js").read_text()

    assert "webkitdirectory" not in html
    assert "showDirectoryPicker" not in js


def test_web_dashboard_uses_artifacts_not_raw_csv_fetches():
    root = Path(__file__).resolve().parents[1] / "web"
    js = "\n".join(
        [
            (root / "app.js").read_text(),
            (root / "js" / "source-parsers.js").read_text(),
        ]
    )

    assert "fetchCsv" not in js
    assert "fetchRawCsv" not in js
    assert 'fetch(".csv' not in js
    assert "fetch(`.csv" not in js
    assert "readFilePrefix" in js
    assert "fetchArtifactJson" in js
    assert "dashboardArtifactIndex" in js
