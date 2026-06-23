from pathlib import Path


def test_web_ui_contains_upload_mapping_and_visualization_regions():
    root = Path(__file__).resolve().parents[1] / "web"
    design_system = Path(__file__).resolve().parents[1] / ".interface-design" / "system.md"
    html = (root / "index.html").read_text()
    css = (root / "styles.css").read_text()
    js = (root / "app.js").read_text()
    design = design_system.read_text()

    required_html = [
        "Data Quality Console",
        'id="dbmlInput"',
        'id="csvInput"',
        'id="visualizeButton"',
        'id="mappingBody"',
        'id="diagramFrame"',
        'id="localDiagram"',
        'id="diagramSvg"',
        'id="diagramMessage"',
        'id="diagramWarnings"',
        'id="diagramSourceBadge"',
        'id="diagramFitButton"',
        'id="diagramDensityToggle"',
        'id="diagramColumnsToggle"',
        'id="diagramResetSelection"',
        'id="diagramCanvas"',
        'id="diagramInspector"',
        'id="runnerForm"',
        'id="pathRunnerForm"',
        'id="dataRunnerForm"',
        'id="runProfilerButton"',
        'id="runPathProfilerButton"',
        'id="smallDemoPresetButton"',
        'id="olistFullPresetButton"',
        'id="runDataProfilerButton"',
        'id="dbmlPathInput"',
        'id="csvDirPathInput"',
        'id="dataSourceType"',
        'id="dataUrlEnvInput"',
        'id="llmReportToggle"',
        'id="llmProviderSelect"',
        'id="stageList"',
        'id="mappingShowAllToggle"',
        'id="generatedResults"',
        'id="artifactList"',
        'id="dashboard"',
        'id="dashboardPanelGrid"',
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
        'id="tableImpact"',
        'id="tableImpactGrid"',
        'id="tableImpactStatus"',
        'id="report"',
        "dashboard-detail-primary",
        "dashboard-detail-secondary",
        "dashboard-artifact-sources",
        'id="dashboardDrilldown"',
        'id="dashboardDrilldown" tabindex="-1"',
        'id="artifactPreview"',
        'id="artifactPreviewMeta"',
        'id="reportChartPreview"',
        "Generated report",
        "Run a job to render report charts from generated artifact data.",
        "Run a job to open <code>report.html</code> here automatically.",
        "DBML diagram preview",
        "Run a profiler job to render schema_diagram.json.",
        "Fit view",
        "Expanded cards",
        "All columns",
        "Reset selection",
        "Schema coverage",
        "Relationship evidence",
        "Show all tables",
        "Start a local Python/DuckDB run",
        "Generated results",
        "Dashboard",
        "Table Impact",
        "Evidence panels stay empty until a run writes artifacts.",
        "Upload mode",
        "Local path mode",
        "Data mode",
        "Demo nhỏ",
        "Full Olist",
        "LLM report",
        "l4_report.md",
        "Run profiler to build the DBML diagram",
        "Reset local paths",
    ]
    for marker in required_html:
        assert marker in html

    removed_input_markers = [
        'id="rulesInput"',
        'id="targetInput"',
        'id="rulesPathInput"',
        'id="pathTargetInput"',
        'id="dataRulesPathInput"',
        'id="dataTargetInput"',
    ]
    for marker in removed_input_markers:
        assert marker not in html

    expected_section_order = [
        'id="runner"',
        'id="diagram"',
        'id="mapping"',
        'id="generatedResults"',
        'id="report"',
        'id="dashboard"',
    ]
    section_positions = [html.index(marker) for marker in expected_section_order]
    assert section_positions == sorted(section_positions)

    expected_nav_order = [
        'href="#runner"',
        'href="#diagram"',
        'href="#mapping"',
        'href="#generatedResults"',
        'href="#report"',
        'href="#dashboard"',
    ]
    nav_positions = [html.index(marker) for marker in expected_nav_order]
    assert nav_positions == sorted(nav_positions)

    required_css_tokens = [
        "--surface-canvas",
        "--surface-panel",
        "--surface-rail",
        "--accent",
        "--focus-ring",
        ".diagram-role-bridge",
        ".diagram-inspector",
        ".diagram-edge-hit",
        ".dashboard-detail-primary",
        ".dashboard-detail-secondary",
        ".dashboard-issue-list",
        ".stage-result",
        ".schema-coverage-grid",
        ".data-runner-form",
        ".path-preset-row",
        ".runner-advanced-options",
        ".mapping-toolbar",
        ".generated-results-panel",
        ".stage-result-grid",
        ".stage-result-artifacts",
        ".artifact-link-list",
        ".artifact-preview",
        ".artifact-review",
        ".artifact-review-kpis",
        ".artifact-chart-preview",
        ".artifact-chart-bar-row",
        ".issue-location-summary",
        ".issue-sample-banner",
        ".issue-column-highlight",
        ".issue-row-marker",
        ".artifact-preview-json",
        ".artifact-preview-table",
        "@media (prefers-reduced-motion: reduce)",
    ]
    for marker in required_css_tokens:
        assert marker in css

    required_js = [
        "parseDbml",
        "parseCsvHeader",
        "csvStemFromName",
        "normalizeCsvFile",
        "resetLocalPathDefaults",
        "applyLocalPathPreset",
        "activeLocalPathPreset",
        "autoLinkCsvs",
        "checkRunnerHealth",
        "startProfilerRun",
        "startPathRun",
        "hasGeneratedEvidence",
        "generatedContractSummary",
        "generatedMappingTables",
        "generatedRelationships",
        "renderGeneratedResults",
        "renderGeneratedResultPreviews",
        "renderGeneratedReportLinks",
        "renderReportPanel",
        "renderReportIssueSeverityPanel",
        "renderReportMissingnessPanel",
        "renderReportBars",
        "renderStageResult",
        "stageResultItems",
        "stageArtifactPaths",
        "artifactUrlFromArtifacts",
        "loadDashboard",
        "renderDashboard",
        "renderDashboardSummary",
        "renderTableImpactSection",
        "renderDashboardDrilldown",
        "renderDrilldownSeverityFilters",
        "setDrilldownSeverityFilter",
        "data-drilldown-severity",
        "previewIssueSample",
        "renderIssueSampleButton",
        "renderIssueSampleContext",
        "renderIssueLocationSummary",
        "handleArtifactNavigationClick",
        "els.artifactPreview.addEventListener",
        "previewArtifact",
        "renderJsonArtifactPreview",
        "renderRelationshipGraphArtifactReview",
        "renderChartSpecPreview",
        "renderArtifactBarPreview",
        "renderGenericJsonArtifactReview",
        "renderMarkdownArtifactPreview",
        "renderCsvArtifactPreview",
        "renderIssueSampleCsvPreview",
        "artifactPreviewKind",
        "data-artifact-action=\"preview-issue-sample\"",
        "data-artifact-action=\"preview-artifact\"",
        "focusDashboardArtifact",
        "focusDashboardDrilldown",
        "isDashboardChartArtifact",
        "renderArtifactNavigationCard",
        "data-artifact-action",
        "data-dashboard-panel-path",
        "renderDashboardGraph",
        "renderDiagram",
        "buildDiagramModel",
        "buildArtifactDiagramModel",
        "schemaEvaluation",
        "dbml_type",
        "drawLocalDiagram",
        "layoutLocalDiagram",
        "diagramTableRole",
        "diagramNonAdjacentBusY",
        "diagramVisibleColumns",
        "diagramColumnRowSvg",
        "handleDiagramSelectionEvent",
        "clearDiagramSelection",
        "diagramRelationshipStatusLabel",
        "relationshipStatusDisplayLabel",
        "relationshipStatusDisplayDetail",
        "renderDiagramInspector",
        "diagramSelectionContext",
        "localDiagramLimits",
        "Local DBML preview unavailable",
        "Diagram is too large for local preview",
        "Run profiler to build the DBML diagram",
        "schema_diagram.json",
        "schema_parse_report.json",
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
        "resetLocalPathDefaults();",
        "buildDbdiagramUrl",
        "https://dbdiagram.io/embed?c=",
    ]
    for marker in required_js:
        assert marker in js

    assert "restrained data-quality console" in design
    assert "Table Impact" in design
    assert "Local ERD Diagram" in design
    assert "orthogonal elbow paths" in design
    assert "Georgia" not in css
    assert "radial-gradient" not in css
    assert "#fffaf0" not in css


def test_web_ui_uses_local_backend_runner_without_js_profiler_port():
    root = Path(__file__).resolve().parents[1] / "web"
    js = (root / "app.js").read_text()
    css = (root / "styles.css").read_text()
    assert 'fetch("/api/health"' in js
    assert 'fetch("/api/jobs"' in js
    assert 'fetch("/api/path-jobs"' in js
    assert 'fetch("/api/data-jobs"' in js
    assert "rules_path" not in js
    assert "#targetInput" not in js
    assert "#pathTargetInput" not in js
    assert 'fetch(`/api/jobs/${jobId}/dashboard`' in js
    assert "new EventSource" in js
    assert "run_events.jsonl" in js
    assert "run_summary.json" in js
    assert "l4_report.md" in js
    assert "guardrail_report.json" in js
    assert "charts/issue_counts_by_severity.json" in js
    assert "charts/issue_counts_by_type.json" in js
    assert "charts/missingness_by_table.json" in js
    assert "charts/relationship_fk_health.json" in js
    assert "lineage_graph.json" in js
    assert "relationship_graph.json" in js
    assert "table_assessments.json" in js
    assert "renderTableImpactSection" in js
    assert "data-graph-node-id" in js
    assert "profile_dataset" not in js
    assert "run_quality_checks" not in js
    assert "XMLHttpRequest" not in js
    assert "diagramFrame.src =" not in js
    assert "window.open" not in js
    assert "Review chart" in js
    assert "Likely cause:" in js
    assert "Suggested fix:" in js
    assert "Severity filter" in js
    assert "FK issue means the declared relationship exists" in js
    assert "data-quality evidence" in js
    assert ".drilldown-severity-chip.active" in css
    assert 'target="_blank"' not in js


def test_web_ui_path_mode_avoids_browser_directory_permission_api():
    root = Path(__file__).resolve().parents[1] / "web"
    html = (root / "index.html").read_text()
    js = (root / "app.js").read_text()

    assert "webkitdirectory" not in html
    assert "showDirectoryPicker" not in js


def test_playwright_dashboard_uses_isolated_configurable_port():
    config = (Path(__file__).resolve().parents[1] / "playwright.config.js").read_text()

    assert "VSF_E2E_PORT" in config
    assert "18765" in config
    assert "--port 8765" not in config
    assert "127.0.0.1:8765" not in config


def test_web_dashboard_uses_artifacts_not_raw_csv_fetches():
    js = (Path(__file__).resolve().parents[1] / "web" / "app.js").read_text()

    assert "fetchCsv" not in js
    assert "fetchRawCsv" not in js
    assert 'fetch(".csv' not in js
    assert "fetch(`.csv" not in js
    assert "readFilePrefix" in js
    assert "fetchArtifactJson" in js
    assert "dashboardArtifactIndex" in js
