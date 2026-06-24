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
    ]
    js = app_js + "\n" + "\n".join(path.read_text() for path in js_modules)
    design = design_system.read_text()

    required_html = [
        "Data Quality Profiler",
        'rel="icon"',
        'href="favicon.svg"',
        'id="flowChooser"',
        'id="profileFlow"',
        'data-profile-step="connect"',
        'id="evaluateFlow"',
        'id="profileFlowButton"',
        'id="evaluateFlowButton"',
        'id="flowModeStatus"',
        'id="profileStepBack"',
        'id="profileStepNext"',
        'id="profileStepHint"',
        'data-profile-step-card="connect"',
        'data-profile-step-card="preflight"',
        'data-profile-step-card="run"',
        'data-profile-step-card="review"',
        'data-profile-step-section="connect"',
        'data-profile-step-section="preflight"',
        'data-profile-step-section="connect run"',
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
        "Connected source",
        "Current DBML + CSV source",
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
        'id="diagramDensityToggle"',
        'id="diagramColumnsToggle"',
        'id="diagramResetSelection"',
        'id="diagramCanvas"',
        'id="diagramInspector"',
        'id="runnerForm"',
        'id="pathRunnerForm"',
        'id="databaseRunnerForm"',
        'id="preflightReview"',
        'id="preflightGateBadge"',
        'id="preflightRunSummary"',
        'id="preflightBlockerList"',
        'id="preflightWarningList"',
        "Preflight Review",
        "Review connection and mapping readiness",
        "Advanced and compatibility options",
        "Compatibility run options",
        'id="demoPresetSmall"',
        'id="demoPresetOlist"',
        'id="demoPresetStatus"',
        'id="llmModeOff"',
        'id="llmModeFake"',
        'id="llmModeOpenAI"',
        'id="llmModeStatus"',
        'id="runProfilerButton"',
        'id="runPathProfilerButton"',
        'id="runDatabaseProfilerButton"',
        'id="dbmlPathInput"',
        'id="csvDirPathInput"',
        'id="rulesPathInput"',
        'id="runnerModeDatabase"',
        'id="databaseSourceType"',
        'id="databaseUrlInput"',
        'id="databaseSchemaInput"',
        'id="databaseTablesInput"',
        'id="databaseChunkRowsInput"',
        'id="databaseRulesPathInput"',
        'id="databaseTargetInput"',
        'id="stageList"',
        'id="artifactList"',
        'id="runHistory"',
        'id="runHistoryList"',
        'id="runHistoryStatus"',
        'id="selectedRunTimeline"',
        'id="selectedRunTimelineStatus"',
        "Run History",
        "Selected Stage Timeline",
        'id="dashboard"',
        'id="dashboardPanelGrid"',
        'aria-label="Review Issues by table and column"',
        "Issue detail drawer",
        "Select an issue to inspect where it happened, evidence, impact, and fix guidance.",
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
        "Reset graph view",
        "Invalid/warning only",
        'id="dashboardSeverityFilter"',
        'id="dashboardIssueTypeFilter"',
        'id="dashboardTableFilter"',
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
        "Expanded cards",
        "Show all columns",
        "Reset layout",
        "CSV to DBML Table Mapping",
        "Run a local CSV + DBML data-quality profile",
        "Issue review snapshot",
        "Review Issues",
        "Table Readiness",
        "Hosted previews do not run profiler jobs",
        "Upload CSV + DBML",
        "Local CSV path",
        "Developer DB source",
        "Postgres",
        "MySQL / MariaDB",
        "Connection URL",
        "Schema / database",
        "Table list",
        "Small demo",
        "Legacy Olist sample",
        "Compatibility LLM report",
        "OpenAI",
        "Upload DBML to preview schema",
        "Reset demo",
        'src="js/demo-data.js"',
        'src="js/source-parsers.js"',
        'src="js/dashboard-config.js"',
    ]
    for marker in required_html:
        assert marker in html

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
        ".preflight-item",
        ".issue-inbox-grid",
        ".issue-table-group",
        ".issue-column-group",
        ".issue-detail-drawer",
        ".evidence-value",
        ".issue-llm-enrichment",
        ".issue-llm-controls",
        ".issue-llm-section",
        ".quality-gates-section",
        ".quality-gate-card",
        ".quality-gate-evidence-value",
        ".developer-options",
        ".compat-fields",
        ".runner-source-switch",
        ".database-source-grid",
        ".diagram-role-bridge",
        ".diagram-inspector",
        ".diagram-edge-hit",
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
        "loadDemoState(\"olist\"",
        "quickDemo",
        "examples/olist/schema.dbml",
        "data/olist",
        "olist_order_reviews_dataset.review_score",
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
        "startDatabaseRun",
        "databaseSourceLabel",
        "syncDatabaseSourceControls",
        "/api/database-jobs",
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
        "buildIssueInboxModel",
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
        "renderDashboardGraph",
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
        "renderDiagramColumnList",
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
        "buildLineageGraphView",
        "buildRelationshipGraphView",
        "dashboardGraphSelection",
        "dashboardGraphDisplay",
        "dashboardGraphShowColumns",
        "dashboardGraphShowRuntime",
        "dashboardGraphInvalidOnly",
        "applyDashboardGraphFocus",
        "graphSelectionContext",
        "renderGraphDirectConnections",
        "renderGraphTableColumns",
        "artifact-summary:generated",
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
        'fetch("/api/database-jobs"',
    ]:
        assert marker not in evaluate_shell

    source_switch_start = html.index('class="runner-mode-switch runner-source-switch"')
    source_switch_end = html.index('id="profileDeveloperOptions"', source_switch_start)
    primary_source_switch = html[source_switch_start:source_switch_end]
    assert "Upload CSV + DBML" in primary_source_switch
    assert "Local CSV path" in primary_source_switch
    assert "Developer DB source" not in primary_source_switch
    assert "Legacy Olist sample" not in primary_source_switch

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
        ".issue-table-heading",
        ".issue-inbox-row",
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

    assert "Avoid primary two-column split layouts for review surfaces" in design


def test_web_ui_uses_local_backend_runner_without_js_profiler_port():
    root = Path(__file__).resolve().parents[1] / "web"
    js = "\n".join(
        [
            (root / "app.js").read_text(),
            (root / "js" / "dashboard-config.js").read_text(),
        ]
    )
    assert 'fetch("/api/health"' in js
    assert 'fetch("/api/jobs"' in js
    assert 'fetch("/api/path-jobs"' in js
    assert 'fetch("/api/database-jobs"' in js
    assert 'fetch("/api/history"' in js
    assert 'fetch(`/api/jobs/${jobId}/dashboard`' in js
    assert "new EventSource" in js
    assert "run_events.jsonl" in js
    assert "run_summary.json" in js
    assert "renderRunHistory" in js
    assert "selectedRunTimeline" in js
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
    assert "Copy Fix data Markdown" in js
    assert "Copy Verify after fix Markdown" in js
    assert "Raw JSON and runtime artifacts are listed in Developer artifacts below." in js
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
    assert "data-graph-node-id" in js
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
