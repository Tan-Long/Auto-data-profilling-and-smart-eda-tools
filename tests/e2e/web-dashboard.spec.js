const { expect, test } = require("@playwright/test");
const fs = require("node:fs");

test("local path run renders the interactive dashboard from generated artifacts", async ({
  context,
  page,
}) => {
  const artifactRequests = [];
  const goal12Dir = "outputs/us073_goal12";
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/jobs/") && url.includes("/artifacts/")) {
      artifactRequests.push(url);
    }
  });

  await page.goto("/");
  await expect(page.locator("#flowChooser")).toBeVisible();
  await expect(page.locator("#profileFlowButton")).toContainText("Profile my data");
  await expect(page.locator("#evaluateFlowButton")).toContainText("Evaluate tool");
  await expect(page.locator("#profileFlow")).toBeHidden();
  await expect(page.locator("#evaluateFlow")).toBeHidden();
  fs.mkdirSync("outputs/us073_goal2", { recursive: true });
  fs.mkdirSync(goal12Dir, { recursive: true });
  await page.locator("#flowChooser").screenshot({
    path: "outputs/us073_goal2/first-screen-flow-choice.png",
  });
  await page.locator("#flowChooser").screenshot({
    path: `${goal12Dir}/first-screen-two-flow-choice.png`,
  });

  await page.locator("#evaluateFlowButton").click();
  await expect(page.locator("#evaluateFlow")).toBeVisible();
  await expect(page.locator("#evaluateFlow")).toContainText("Built-in faulty dataset comparison");
  await expect(page.locator("#evaluationCatalogCount")).toContainText("2 datasets", {
    timeout: 10_000,
  });
  await expect(page.locator("#evaluationDatasetList")).toContainText("Retail orders seeded faults");
  await expect(page.locator("#evaluationDatasetList")).toContainText("Support tickets seeded faults");
  await expect(page.locator("#evaluateFlow")).toContainText("No arbitrary uploads");
  await expect(page.locator("#evaluateFlow input[type='file']")).toHaveCount(0);
  await expect(page.locator("#evaluateFlow #runnerForm")).toHaveCount(0);
  await expect(page.locator("#profileFlow")).toBeHidden();
  fs.mkdirSync("outputs/us073_goal10", { recursive: true });
  await page.locator("#evaluateFlow").screenshot({
    path: "outputs/us073_goal10/evaluate-dataset-choice.png",
  });
  await page.locator("#startEvaluationButton").click();
  await expect(page.locator("#evaluateMessage")).toContainText("Evaluation complete", {
    timeout: 60_000,
  });
  await expect(page.locator("#evaluationComparisonStatus")).toContainText("complete");
  await expect(page.locator("#evaluationSummaryStrip")).toContainText("VSF caught");
  await expect(page.locator("#evaluationExpectedList")).toContainText("caught");
  await expect(page.locator("#evaluationUsefulnessList")).toContainText("Actionability");
  await expect(page.locator("#evaluationBaselineList")).toContainText("GE unavailable");
  await expect(page.locator("#evaluationBaselineList")).toContainText("Not covered by baseline");
  await expect(page.locator("#evaluationArtifactLinks")).toContainText("evaluation_summary.json");
  await page.locator("#evaluationComparison").screenshot({
    path: "outputs/us073_goal10/evaluate-comparison-summary.png",
  });
  await page.locator("#evaluationComparison").screenshot({
    path: `${goal12Dir}/evaluate-comparison-summary.png`,
  });

  await page.locator("#profileFlowButton").click();
  await expect(page.locator("#profileFlow")).toBeVisible();
  await expect(page.locator("#evaluateFlow")).toBeHidden();
  fs.mkdirSync("outputs/us073_goal3", { recursive: true });
  await expect(page.locator("#preflightReview")).toBeVisible();
  await expect(page.locator("#preflightGateBadge")).toContainText("Run locked");
  await expect(page.locator("#preflightBlockerList")).toContainText("Uploaded DBML is missing");
  await expect(page.locator("#preflightBlockerList")).toContainText("Uploaded CSV source is missing");
  await expect(page.locator("#runProfilerButton")).toBeDisabled();
  await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
  await expect(page.locator("#sourceStateSummary")).toContainText("Upload a DBML contract");
  await page.locator("#preflightReview").screenshot({
    path: "outputs/us073_goal3/profile-preflight-blocked.png",
  });
  await expect(page.locator("#runnerMessage")).toContainText("Local backend is ready");
  await expect(page.locator("#diagramEmpty")).toBeVisible();
  await expect(page.locator("#diagramEmpty")).toContainText("Upload DBML to preview schema");
  await expect(page.locator("#localDiagram")).toBeHidden();
  await expect(page.locator("#diagramFrame")).toBeHidden();
  await expect(page.locator("#diagramMessage")).toContainText("Local preflight");
  await expect(page.locator("#diagramMessage")).toContainText("empty");
  await expect(page.locator("#diagramSourceBadge")).toContainText("Browser DBML");

  fs.mkdirSync("outputs/us073_upload_state", { recursive: true });
  const customDbmlPath = "outputs/us073_upload_state/accounts.dbml";
  const customCsvPath = "outputs/us073_upload_state/accounts.csv";
  fs.writeFileSync(
    customDbmlPath,
    [
      "Table accounts {",
      "  account_id varchar [pk, not null]",
      "  account_name varchar",
      "}",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(customCsvPath, "account_id,account_name\nA-1,Example account\n");
  await page.locator("#dbmlInput").setInputFiles(customDbmlPath);
  await expect(page.locator("#sourceStateBadge")).toContainText("Custom upload");
  await expect(page.locator("#dbmlStatus")).toContainText("accounts.dbml parsed: 1 tables");
  await page.locator("#csvInput").setInputFiles(customCsvPath);
  await expect(page.locator("#csvList")).toContainText("accounts.csv");
  await expect(page.locator("#csvList")).not.toContainText("customers.csv");
  await expect(page.locator("#mappingStatus")).toContainText("1/1 tables mapped");
  await expect(page.locator("#runProfilerButton")).toBeEnabled();
  await page.locator("#clearUploadButton").click();
  await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
  await expect(page.locator("#csvList")).not.toContainText("accounts.csv");

  await expect(page.locator("#localDiagram")).toBeHidden();
  await expect(page.locator("#diagramEmpty")).toContainText("Upload DBML to preview schema");

  await page.locator("#runnerModePath").click();
  await expect(page.locator("#pathRunnerForm")).toBeVisible();
  await expect(page.locator("#demoPresetStatus")).toContainText("Small demo");
  await expect(page.locator("#sourceStateBadge")).toContainText("Demo paths");
  await expect(page.locator("#localDiagram")).toBeVisible();
  await expect(page.locator("#diagramSvg")).toContainText("orders");
  await expect(page.locator("#diagramSvg")).toContainText("PK order_id");
  await expect(page.locator("#diagramSvg")).toContainText("FK customer_id");
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"]')).toHaveCount(1);
  await expect(page.locator("#diagramFitButton")).toBeVisible();
  await expect(page.locator("#diagramFitButton")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#diagramDensityToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#diagramColumnsToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('#diagramSvg .diagram-role-bridge[data-diagram-table="order_items"]')).toHaveCount(1);
  await page.locator('#diagramSvg [data-diagram-table="orders"]').click();
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"]')).toHaveClass(/selected/);
  await expect(page.locator("#diagramInspector")).toContainText("orders");
  await expect(page.locator("#diagramInspector")).toContainText("Fact/event");
  await page.locator("#diagramColumnsToggle").click();
  await expect(page.locator("#diagramColumnsToggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#diagramSvg")).toContainText("order_status");
  await page.locator("#diagramResetSelection").click();
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"]')).not.toHaveClass(/selected/);
  await expect(page.locator("#dbdiagramLink")).toHaveAttribute(
    "href",
    /https:\/\/dbdiagram\.io\/embed\?c=/,
  );

  await expect(page.locator("#demoPresetStatus")).toContainText("Small demo");
  await expect(page.locator("#demoPresetSmall")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#llmModeStatus")).toContainText("LLM off");
  await expect(page.locator("#llmModeOff")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#preflightGateBadge")).toContainText("Run enabled");
  await expect(page.locator("#runPathProfilerButton")).toBeEnabled();

  await page.locator('.mapping-select[data-table="customers"]').selectOption("");
  await page.locator('.mapping-select[data-table="orders"]').selectOption("customers");
  await expect(page.locator("#preflightGateBadge")).toContainText("Review warnings");
  await expect(page.locator("#preflightWarningList")).toContainText("Manual mapping selected");
  await expect(page.locator("#runPathProfilerButton")).toBeDisabled();
  await page.locator("[data-preflight-accept-all]").click();
  await expect(page.locator("#preflightGateBadge")).toContainText("Run enabled");
  await expect(page.locator("#preflightWarningList")).toContainText("Accepted");
  await expect(page.locator("#runPathProfilerButton")).toBeEnabled();
  await page.locator("#preflightReview").screenshot({
    path: "outputs/us073_goal3/profile-preflight-warnings-accepted.png",
  });
  await page.locator("#loadDemoButton").click();
  await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");

  await page.locator("#profileDeveloperOptions > summary").click();

  await page.locator("#runnerModeDatabase").click();
  await expect(page.locator("#databaseRunnerForm")).toBeVisible();
  await expect(page.locator("#runnerStatus")).toContainText("Ready for developer database source");
  await expect(page.locator("#databaseSourceType")).toHaveValue("postgres");
  await expect(page.locator("#databaseSchemaInput")).toHaveValue("public");
  await expect(page.locator("#runDatabaseProfilerButton")).toBeDisabled();
  await page
    .locator("#databaseUrlInput")
    .fill("postgresql://profiler:secret@127.0.0.1:5432/demo");
  await page.locator("#databaseTablesInput").fill("customers, orders, order_items");
  await page.locator("#databaseTargetInput").fill("orders.order_total");
  await expect(page.locator("#csvStatus")).toContainText("Postgres selected tables ready");
  await expect(page.locator("#runDatabaseProfilerButton")).toBeEnabled();
  await page.locator("#databaseSourceType").selectOption("mysql");
  await expect(page.locator("#databaseSchemaInput")).toHaveValue("");
  await page
    .locator("#databaseUrlInput")
    .fill("mysql://profiler:secret@127.0.0.1:3306/demo");
  await expect(page.locator("#csvStatus")).toContainText("MySQL/MariaDB selected tables ready");
  fs.mkdirSync("outputs/us072_database_mode", { recursive: true });
  await page.locator("#runner").screenshot({
    path: "outputs/us072_database_mode/database-mode-runner.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#runner").scrollIntoViewIfNeeded();
  await page.locator("#runner").screenshot({
    path: "outputs/us072_database_mode/database-mode-runner-mobile.png",
  });
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.locator("#runnerModePath").click();
  await expect(page.locator("#pathRunnerForm")).toBeVisible();

  await page.locator("#demoPresetOlist").click();
  await expect(page.locator("#demoPresetStatus")).toContainText("Legacy Olist sample");
  await expect(page.locator("#dbmlPathInput")).toHaveValue("examples/olist/schema.dbml");
  await expect(page.locator("#csvDirPathInput")).toHaveValue("data/olist");
  await expect(page.locator("#rulesPathInput")).toHaveValue("examples/olist/rules.yaml");
  await expect(page.locator("#pathTargetInput")).toHaveValue("olist_order_reviews_dataset.review_score");
  await expect(page.locator("#diagramSvg")).toContainText("olist_orders_dataset");
  await expect(page.locator("#mappingStatus")).toContainText("9/9 tables mapped");

  await page.locator("#llmModeFake").click();
  await expect(page.locator("#llmModeStatus")).toContainText("Fake");
  await expect(page.locator("#llmModeFake")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#llmModeOff").click();
  await expect(page.locator("#llmModeStatus")).toContainText("LLM off");

  await page.locator("#demoPresetSmall").click();
  await expect(page.locator("#demoPresetStatus")).toContainText("Small demo");
  await expect(page.locator("#diagramSvg")).toContainText("order_payments");
  await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");

  await page.locator("#pathCompatibilityOptions > summary").click();
  await page.locator("#dbmlPathInput").fill("data/demo_small/schema.dbml");
  await page.locator("#csvDirPathInput").fill("data/demo_small/csv");
  await page.locator("#rulesPathInput").fill("data/demo_small/rules.yaml");
  await page.locator("#pathTargetInput").fill("order_reviews.review_score");

  await expect(page.locator("#runPathProfilerButton")).toBeEnabled();
  await page.locator("#runPathProfilerButton").click();

  await expect(page.locator("#runnerMessage")).toContainText("Run complete", {
    timeout: 60_000,
  });
  await expect(page.locator("#dashboardMessage")).toContainText(
    /Issue review loaded|Legacy association chart is absent/,
    { timeout: 20_000 },
  );

  await expect(page.locator("#dashboardStatusBadge")).toContainText(
    "succeeded dashboard",
  );
  await expect(page.locator("#dashboardIssueCount")).toContainText("15/15 issues");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("readiness");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("gates");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("artifacts");
  await expect(page.locator("#diagramSourceBadge")).toContainText("schema_diagram.json");
  await expect(page.locator("#diagramMessage")).toContainText("Generated artifacts");
  await expect(page.locator("#diagramWarnings")).toContainText("schema_parse_report.json");
  await expect(page.locator("#diagramSvg")).toContainText("order_payments");
  await expect(page.locator("#diagramSvg")).toContainText("invalid");
  await expect(page.locator('#diagramSvg [data-diagram-table="order_payments"]')).toHaveCount(1);
  const customerRelationship = page.locator(
    '#diagramSvg [data-diagram-relationship="orders.customer_id->customers.customer_id"]',
  );
  await expect(customerRelationship).toHaveCount(1);
  await customerRelationship.focus();
  await customerRelationship.press("Enter");
  await expect(customerRelationship).toHaveClass(/selected/);
  await expect(page.locator("#diagramInspector")).toContainText("Relationship");
  await expect(page.locator("#diagramInspector")).toContainText("FOREIGN_KEY_NULL");
  await expect(page.locator("#diagramInspector")).toContainText("relationship_graph.json");
  await page.locator("#diagramDensityToggle").click();
  await expect(page.locator("#diagramDensityToggle")).toHaveAttribute("aria-pressed", "true");

  await expect(page.getByText("Issue review snapshot")).toBeVisible();
  const generatedResults = page.locator("#artifactList");
  await expect(generatedResults).toContainText("Data-quality readiness");
  await expect(generatedResults).toContainText("NOT_READY");
  await expect(generatedResults).toContainText("Issue counts");
  await expect(generatedResults).toContainText("15 issues");
  await expect(generatedResults).toContainText("Column usability");
  await expect(generatedResults).toContainText("blocked columns");
  await expect(generatedResults).toContainText("Table readiness");
  await expect(generatedResults).toContainText("7 tables");
  await expect(generatedResults).toContainText("Runtime summary");
  await expect(generatedResults).toContainText("8 stages");
  await expect(generatedResults).not.toContainText("Report HTML");
  await expect(generatedResults).not.toContainText("Report Markdown");
  await expect(generatedResults).not.toContainText("Developer artifact links");
  await expect(generatedResults).not.toContainText("dataset_verdict.json");
  fs.mkdirSync("outputs/us070_visual_review", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await generatedResults.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await page.screenshot({
    path: "outputs/us070_visual_review/dashboard-generated-results-desktop-page.png",
  });
  await generatedResults.screenshot({
    path: "outputs/us070_visual_review/dashboard-generated-results-desktop.png",
  });

  const dashboard = page.locator("#dashboardPanelGrid");
  await expect(dashboard).toContainText("Table -> Column -> Issue");
  await expect(dashboard).toContainText("customers");
  await expect(dashboard).toContainText("customer_id");
  await expect(dashboard).toContainText("Required Field Null");
  await expect(dashboard).toContainText("Blocked");
  await expect(dashboard).toContainText("Usable With Caution");
  fs.mkdirSync("outputs/us073_goal7", { recursive: true });
  await expect(page.locator("#qualityGates")).toContainText("Quality Gates");
  await expect(page.locator("#qualityGatesStatus")).toContainText("source=deterministic");
  await expect(page.locator("#qualityGates")).toContainText("Can run analysis");
  await expect(page.locator("#qualityGates")).toContainText("Can trust joins");
  await expect(page.locator("#qualityGates")).toContainText("Needs cleanup before sharing");
  await expect(page.locator("#qualityGates")).toContainText("Outliers need review");
  await expect(page.locator("#qualityGates")).toContainText("Blocked");
  await expect(page.locator("#qualityGates")).toContainText("Open Todos");
  await page.locator("#qualityGates").scrollIntoViewIfNeeded();
  await page.locator("#qualityGates").screenshot({
    path: "outputs/us073_goal7/quality-gates-summary.png",
  });
  fs.mkdirSync("outputs/us073_goal9", { recursive: true });
  const reportExport = page.locator("#reportExport");
  await expect(reportExport).toContainText("Report / Export");
  await expect(page.locator("#reportExportStatus")).toContainText("Reports ready");
  await expect(reportExport).toContainText("HTML report");
  await expect(reportExport).toContainText("report.html");
  await expect(reportExport).toContainText("Markdown report");
  await expect(reportExport).toContainText("report.md");
  await expect(reportExport).toContainText("Todo exports");
  await expect(reportExport).toContainText("Fix data");
  await expect(reportExport).toContainText("Verify after fix");
  await expect(reportExport).toContainText("Copy Fix data Markdown");
  await expect(reportExport).toContainText("Copy Verify after fix Markdown");
  await reportExport.scrollIntoViewIfNeeded();
  await reportExport.screenshot({
    path: "outputs/us073_goal9/report-export-surface.png",
  });
  await reportExport.screenshot({
    path: `${goal12Dir}/report-export-surface.png`,
  });
  const reportHref = await reportExport.locator('a[href*="report.html"]').first().getAttribute("href");
  const reportPage = await context.newPage();
  await reportPage.goto(new URL(reportHref, page.url()).toString());
  await expect(reportPage.locator("h2", { hasText: "Run Summary" })).toBeVisible();
  await expect(reportPage.locator("h2", { hasText: "Quality Gates" })).toBeVisible();
  await expect(reportPage.locator("h2", { hasText: "Column Issue Matrix" })).toBeVisible();
  await expect(reportPage.locator("h2", { hasText: "Issue Action Plans" })).toBeVisible();
  await expect(reportPage.locator("h2", { hasText: "Developer Artifacts" })).toBeVisible();
  await reportPage.screenshot({
    path: "outputs/us073_goal9/generated-report-fixed-sections.png",
    fullPage: true,
  });
  await reportPage.close();
  fs.mkdirSync("outputs/us073_goal8", { recursive: true });
  await expect(page.locator("#runHistoryStatus")).toContainText("History ready", {
    timeout: 10_000,
  });
  await expect(page.locator("#runHistoryList")).toContainText("15 issues");
  await expect(page.locator("#runHistoryList")).toContainText("8 stages");
  await expect(page.locator("#selectedRunTimelineStatus")).toContainText("8 stages");

  await page.reload();
  await expect(page.locator("#flowChooser")).toBeVisible();
  await page.locator("#profileFlowButton").click();
  await expect(page.locator("#runnerMessage")).toContainText("Local backend is ready");
  await expect(page.locator("#runHistoryStatus")).toContainText("History ready", {
    timeout: 10_000,
  });
  await expect(page.locator("#runHistoryList")).toContainText("15 issues");
  await expect(page.locator("#runHistoryList")).toContainText("gates");
  await page.locator("#runHistory").scrollIntoViewIfNeeded();
  await page.locator("#runHistory").screenshot({
    path: "outputs/us073_goal8/run-history-after-refresh.png",
  });
  await page.locator("[data-run-history-job-id]").first().click();
  await expect(page.locator("#dashboardStatusBadge")).toContainText("succeeded dashboard", {
    timeout: 20_000,
  });
  await expect(page.locator("#dashboardIssueCount")).toContainText("15/15 issues");
  await expect(page.locator("#qualityGatesStatus")).toContainText("source=deterministic");
  await expect(page.locator("#todosStatus")).toContainText("grouped todos");
  await expect(page.locator("#selectedRunTimelineStatus")).toContainText("8 stages");
  await expect(page.locator("#selectedRunTimeline")).toContainText("Parse DBML schema");
  await page.locator("#selectedRunTimeline").screenshot({
    path: "outputs/us073_goal8/selected-run-stage-timeline.png",
  });
  fs.mkdirSync("outputs/us073_goal4", { recursive: true });
  await page.locator("#dashboard").scrollIntoViewIfNeeded();
  await page.locator("#dashboard").screenshot({
    path: "outputs/us073_goal4/review-issues-default.png",
  });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const dashboard = document.querySelector("#dashboard");
    window.scrollTo(0, dashboard.offsetTop);
  });
  await page.waitForTimeout(100);
  await page.screenshot({
    path: `${goal12Dir}/profile-post-run-review-surface.png`,
  });

  await page.locator('[data-dashboard-kind="issue"][data-dashboard-value="ISSUE-0009"]').click();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("ISSUE-0009");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Where");
  await expect(page.locator("#dashboardDrilldown")).toContainText("What happened");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Evidence");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Why it matters");
  await expect(page.locator("#dashboardDrilldown")).toContainText("How to fix");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Action plan");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Finding values");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Fix data checklist");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Verify after fix checklist");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Guidelines");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Evidence coverage");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Actionability");
  await expect(page.locator("#dashboardDrilldown")).toContainText("source=deterministic");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Copy Markdown");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Copy CSV row");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Copy JSON");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Parent context");
  await expect(page.locator("#dashboardDrilldown")).toContainText("customers.customer_id");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Sample rows");
  await expect(page.locator("#dashboardDrilldown")).toContainText("LLM enrichment add-on");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Run LLM enrichment");
  fs.mkdirSync("outputs/us073_goal11", { recursive: true });
  await page.locator("#dashboardDrilldown").screenshot({
    path: "outputs/us073_goal11/issue-drawer-before-llm-enrichment.png",
  });
  await page.locator('[data-issue-llm-provider="fake"]').click();
  await expect(page.locator('[data-issue-llm-provider="fake"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-issue-llm-run]").click();
  await expect(page.locator(".issue-llm-message")).toContainText("Fake enrichment ready for ISSUE-0009", {
    timeout: 20_000,
  });
  await expect(page.locator("#dashboardDrilldown")).toContainText("Why this was flagged");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Extra fix suggestion");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Extra verification");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Human review needed");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Deterministic action plans remain the source of truth");
  await page.locator("#dashboardDrilldown").screenshot({
    path: "outputs/us073_goal11/issue-drawer-after-fake-enrichment.png",
  });
  await page.locator("#dashboardDrilldown").screenshot({
    path: `${goal12Dir}/issue-drawer-after-fake-llm-enrichment.png`,
  });
  await page.locator('[data-issue-llm-provider="openai"]').click();
  await expect(page.locator('[data-issue-llm-provider="openai"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-issue-llm-run]").click();
  await expect(page.locator(".issue-llm-message")).toContainText("OPENAI_API_KEY", {
    timeout: 20_000,
  });
  await expect(page.locator("#dashboardDrilldown")).toContainText("unavailable");
  await expect(page.locator("#dashboardDrilldown")).toContainText("OpenAI provider was selected");
  await page.locator("#dashboardDrilldown").screenshot({
    path: "outputs/us073_goal11/issue-drawer-openai-failure.png",
  });
  await page.locator("#dashboardDrilldown").screenshot({
    path: `${goal12Dir}/issue-drawer-openai-unavailable.png`,
  });
  await page.locator("#dashboardDrilldown").screenshot({
    path: "outputs/us073_goal4/review-issue-detail-drawer.png",
  });
  fs.mkdirSync("outputs/us073_goal5", { recursive: true });
  await page.locator("#dashboardDrilldown").screenshot({
    path: "outputs/us073_goal5/issue-action-plan-drawer.png",
  });
  fs.mkdirSync("outputs/us073_goal6", { recursive: true });
  await page.locator('[data-action-plan-export="markdown"]').click();
  await expect(page.locator(".issue-export-status")).toContainText("Copied Markdown for ISSUE-0009.");
  await page.locator('[data-action-plan-export="csv"]').click();
  await expect(page.locator(".issue-export-status")).toContainText("Copied CSV row for ISSUE-0009.");
  await page.locator('[data-action-plan-export="json"]').click();
  await expect(page.locator(".issue-export-status")).toContainText("Copied JSON for ISSUE-0009.");
  await page.locator("#dashboardDrilldown").screenshot({
    path: "outputs/us073_goal6/issue-export-copy-controls.png",
  });

  await expect(page.locator("#todos")).toContainText("Todos");
  await expect(page.locator("#todosStatus")).toContainText("source=deterministic");
  await expect(page.locator("#todos")).toContainText("Fix data");
  await expect(page.locator("#todos")).toContainText("Verify after fix");
  await expect(page.locator("#todos")).toContainText("source=deterministic");
  await page.locator("#todosFilterVerify").click();
  await expect(page.locator("#todos")).toContainText("Rerun the profiler on the corrected CSV + DBML inputs.");
  await expect(page.locator("#todos")).toContainText("15 occurrences");
  await page.locator("#todos").scrollIntoViewIfNeeded();
  await page.locator("#todos").screenshot({
    path: "outputs/us073_goal6/global-todos-tab.png",
  });

  await expect(page.locator("#tableImpact")).toContainText("Table Readiness");
  await expect(page.locator("#tableImpactStatus")).toContainText(
    "tables from table_assessments.json",
  );
  await expect(page.locator("#tableImpactGrid")).toContainText("order_reviews");

  await page
    .locator('#tableImpactGrid [data-dashboard-kind="table_assessment"][data-dashboard-value="order_reviews"]')
    .click();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("order_reviews");
  await expect(page.locator("#dashboardDrilldown")).toContainText("feedback_signal_quality");
  await expect(page.locator("#dashboardDrilldown")).toContainText("affected_columns");

  await expect(page.locator("#dashboardGraphStatus")).toContainText("Runtime artifact context");
  await expect(page.locator("#dashboardGraphStatus")).toContainText("Overview");
  await expect
    .poll(async () => page.locator("#dashboardGraphSvg [data-graph-node-id]").count())
    .toBeGreaterThan(0);
  await expect(page.locator("#dashboardGraphLegend")).toContainText("Table");
  await expect(page.locator('#dashboardGraphSvg [data-graph-node-id^="column:"]')).toHaveCount(0);
  await expect(page.locator('#dashboardGraphSvg [data-graph-node-id^="stage:"]')).toHaveCount(0);
  await expect(page.locator('#dashboardGraphSvg [data-graph-node-id^="artifact:"]')).toHaveCount(0);

  await page
    .locator("#dashboardGraphSvg [data-graph-node-id]")
    .filter({ hasText: "orders" })
    .first()
    .click();
  await expect(page.locator("#dashboardGraphDrilldownMeta")).toContainText("orders");
  await expect(page.locator("#dashboardGraphDrilldown")).toContainText(
    "lineage_graph.json",
  );
  await expect(page.locator("#dashboardGraphDrilldown")).toContainText("Direct neighbors");
  await expect(page.locator("#dashboardGraphDrilldown")).toContainText("Columns in inspector");
  await expect(page.locator("#dashboardGraphSvg .graph-node.dimmed").first()).toBeVisible();

  await page.locator("#dashboardGraphDisplayFocus").click();
  await expect(page.locator("#dashboardGraphStatus")).toContainText("Focus");
  await expect(page.locator("#dashboardGraphSvg .graph-node.selected")).toHaveCount(1);
  await page.locator("#dashboardGraphResetView").click();
  await expect(page.locator("#dashboardGraphStatus")).toContainText("Overview");
  await expect(page.locator("#dashboardGraphDisplayOverview")).toHaveAttribute("aria-pressed", "true");
  fs.mkdirSync("outputs/graph_progressive_screenshots", { recursive: true });
  await page.locator(".dashboard-graph").screenshot({
    path: "outputs/graph_progressive_screenshots/lineage-overview.png",
  });

  await page.locator("#dashboardGraphModeRelationship").click();
  await expect(page.locator("#dashboardGraphStatus")).toContainText(
    "Relationship graph",
  );
  await expect(page.locator("#dashboardGraphStatus")).toContainText("Overview");
  await expect(
    page.locator('#dashboardGraphSvg [data-graph-node-id^="relationship-edge:"]'),
  ).toHaveCount(0);
  await page.locator("#dashboardGraphInvalidOnlyToggle").check();
  await expect(page.locator("#dashboardGraphStatus")).toContainText(
    "invalid/warning only",
  );
  await page.locator("#dashboardGraphDisplayFull").click();
  await expect(page.locator("#dashboardGraphStatus")).toContainText(
    "Relationships",
  );
  await expect
    .poll(async () =>
      page.locator('#dashboardGraphSvg [data-graph-node-id^="relationship-edge:"]').count(),
    )
    .toBeGreaterThan(0);
  await page
    .locator('#dashboardGraphSvg [data-graph-node-id^="relationship-edge:"]')
    .first()
    .click();
  await expect(page.locator("#dashboardGraphDrilldown")).toContainText(
    "relationship_graph.json",
  );
  await expect(page.locator("#dashboardGraphDrilldown")).toContainText(
    /ORPHAN_FOREIGN_KEY|FOREIGN_KEY_NULL|PARENT_KEY_DUPLICATE|CHILD_RELATIONSHIP_DUPLICATE/,
  );
  await page.locator(".dashboard-graph").screenshot({
    path: "outputs/graph_progressive_screenshots/relationship-full.png",
  });

  await expect(page.locator("#dashboardArtifactCount")).toContainText(/(?:21|22) files/);
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "charts/issue_counts_by_severity.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "charts/outliers_top_columns.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "schema_parse_report.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "relationship_graph.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "table_assessments.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "issue_action_plans.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "issue_todos.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "issue_llm_enrichments.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "quality_gates.json",
  );
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "lineage_graph.json",
  );

  await page.locator("#dashboardSeverityFilter").selectOption("P1");
  await expect(page.locator("#dashboardIssueCount")).toContainText("/15 issues");
  await expect(page.locator("#dashboardPanelGrid")).toContainText("Blocked");
  await page.locator('[data-dashboard-kind="issue"]').first().click();
  await expect(page.locator("#dashboardDrilldown")).toContainText("Sample rows");

  const rawCsvArtifactRequests = artifactRequests.filter(
    (url) => url.endsWith(".csv") && !url.includes("/samples/"),
  );
  expect(rawCsvArtifactRequests).toEqual([]);

  fs.mkdirSync("outputs/web_demo_ux_screenshots", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const dashboard = document.querySelector("#dashboard");
    window.scrollTo(0, dashboard.offsetTop);
  });
  await page.waitForTimeout(100);
  await page.screenshot({
    path: "outputs/web_demo_ux_screenshots/desktop-dashboard.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const tableImpact = document.querySelector("#tableImpact");
    window.scrollTo(0, tableImpact.offsetTop);
  });
  await page.waitForTimeout(100);
  await expect(page.locator("#tableImpact")).toBeVisible();
  await page.screenshot({
    path: "outputs/web_demo_ux_screenshots/mobile-dashboard.png",
  });
  await page.locator("#artifactList").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await page.screenshot({
    path: "outputs/us070_visual_review/dashboard-generated-results-mobile-page.png",
  });
  await page.locator("#artifactList").screenshot({
    path: "outputs/us070_visual_review/dashboard-generated-results-mobile.png",
  });
});
