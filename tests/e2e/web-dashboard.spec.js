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
  const profileFlowBox = await page.locator("#profileFlowCard").boundingBox();
  const evaluateFlowBox = await page.locator("#evaluateFlowCard").boundingBox();
  expect(profileFlowBox).toBeTruthy();
  expect(evaluateFlowBox).toBeTruthy();
  expect(Math.abs(profileFlowBox.y - evaluateFlowBox.y)).toBeLessThan(12);
  expect(evaluateFlowBox.x).toBeGreaterThan(profileFlowBox.x + profileFlowBox.width - 4);
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
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "connect");
  await expect(page.locator("#evaluateFlow")).toBeHidden();
  fs.mkdirSync("outputs/us073_goal3", { recursive: true });
  await expect(page.locator("#sourceState")).toBeVisible();
  await expect(page.locator("#sourceStateTitle")).toContainText("Source status");
  await expect(page.locator("#inputSetup")).toContainText("Connect DBML + CSV");
  await expect(page.locator("#inputSetup")).toContainText("Upload files and map tables");
  await expect(page.locator("#upload")).toBeVisible();
  await expect(page.locator("#dbmlDropzone")).toBeVisible();
  await expect(page.locator("#csvDropzone")).toBeVisible();
  await expect(page.locator("#issues")).toBeHidden();
  await expect(page.locator("#runner")).toBeHidden();
  await expect(page.locator("#preflightReview")).toBeHidden();
  await expect(page.locator("#preflightGateBadge")).toContainText("Run locked");
  await expect(page.locator("#preflightBlockerList")).toContainText("Uploaded DBML is missing");
  await expect(page.locator("#preflightBlockerList")).toContainText("Uploaded CSV source is missing");
  await expect(page.locator("#profileStepNext")).toBeDisabled();
  await expect(page.locator("#runProfilerButton")).toBeDisabled();
  await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
  await expect(page.locator("#sourceStateSummary")).toContainText("Choose sample data");
  await expect(page.locator("#runnerMessage")).toContainText("Local backend is ready");
  await page.locator("#profileFlow").screenshot({
    path: "outputs/us073_goal3/profile-preflight-blocked.png",
  });
  await page.locator("#quickDemoButton").click();
  await expect(page.locator("#sourceStateBadge")).toContainText("Sample data");
  await expect(page.locator("#sourceStateSummary")).toContainText("DBML + CSV demo is loaded");
  await expect(page.locator("#inputSetup")).toBeHidden();
  await expect(page.locator("#upload")).toBeHidden();
  await expect(page.locator("#dbmlDropzone")).toBeHidden();
  await expect(page.locator("#csvDropzone")).toBeHidden();
  await expect(page.locator("#runnerMessage")).toContainText("DBML + CSV demo is loaded");
  await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");
  await expect(page.locator("#csvList")).toContainText("customers.csv");
  await expect(page.locator("#diagramSvg")).toContainText("orders");
  const mappingTableOverflow = await page.locator("#mapping .mapping-table-wrap").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(mappingTableOverflow.scrollWidth).toBeLessThanOrEqual(mappingTableOverflow.clientWidth + 1);
  const orderItemsMappingRow = page.locator("#mappingBody tr").filter({
    has: page.locator("td:nth-child(2) code", { hasText: /^order_items$/ }),
  });
  await expect(orderItemsMappingRow.locator(".fk-row")).toHaveCount(3);
  await expect(orderItemsMappingRow.locator(".fk-column").first()).toContainText("order_id");
  await expect(orderItemsMappingRow.locator(".fk-target").first()).toContainText("orders.order_id");
  await expect(orderItemsMappingRow.locator(".selected-csv-file-name")).toHaveCount(0);
  await expect(orderItemsMappingRow.locator(".mapping-select")).toHaveValue("order_items");
  await expect(orderItemsMappingRow.locator(".mapping-select")).toHaveAttribute("title", "order_items.csv");
  await expect(page.locator("#profileStepNext")).toBeEnabled();
  await expect(page.locator("#runPathProfilerButton")).toBeDisabled();
  await expect(page.locator("#runner")).toBeHidden();
  await page.locator("#clearUploadButton").click();
  await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
  await expect(page.locator("#inputSetup")).toBeVisible();
  await expect(page.locator("#upload")).toBeVisible();
  await expect(page.locator("#dbmlDropzone")).toBeVisible();
  await expect(page.locator("#csvDropzone")).toBeVisible();
  await expect(page.locator("#csvList")).not.toContainText("customers.csv");
  await expect(page.locator("#runnerMessage")).toContainText("Source cleared");
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
  await expect(page.locator("#dbmlStatus")).toContainText("Source incomplete");
  await expect(page.locator("#sourceStateDetails")).toContainText("accounts.dbml");
  await page.locator("#csvInput").setInputFiles(customCsvPath);
  await expect(page.locator("#csvList")).toContainText("accounts.csv");
  await expect(page.locator("#csvList")).not.toContainText("customers.csv");
  await expect(page.locator("#dbmlStatus")).toContainText("Source ready");
  await expect(page.locator("#mappingStatus")).toContainText("1/1 tables mapped");
  await expect(page.locator("#profileStepNext")).toBeEnabled();
  await expect(page.locator("#runProfilerButton")).toBeDisabled();
  await page.locator("#clearUploadButton").click();
  await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
  await expect(page.locator("#csvList")).not.toContainText("accounts.csv");

  await expect(page.locator("#localDiagram")).toBeHidden();
  await expect(page.locator("#diagramEmpty")).toContainText("Upload DBML to preview schema");

  await page.locator("#quickDemoButton").click();
  await expect(page.locator("#upload")).toBeHidden();
  await expect(page.locator("#runner")).toBeHidden();
  await expect(page.locator("#demoPresetStatus")).toHaveCount(0);
  await expect(page.locator("#demoPresetSmall")).toHaveCount(0);
  await expect(page.locator("#sourceStateBadge")).toContainText("Sample data");
  await expect(page.locator("#dbmlPathInput")).toHaveValue("data/demo_small/schema.dbml");
  await expect(page.locator("#csvDirPathInput")).toHaveValue("data/demo_small/csv");
  await expect(page.locator("#localDiagram")).toBeVisible();
  await expect(page.locator("#diagramSvg")).toContainText("orders");
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"] [data-diagram-column="order_id"] .diagram-column-icon-key')).toHaveCount(1);
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"] [data-diagram-column="customer_id"] .diagram-column-icon-link')).toHaveCount(1);
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"] [data-diagram-column="order_id"]')).toContainText("varchar");
  const orderIdColumnTypePosition = await page
    .locator('#diagramSvg [data-diagram-table="orders"] [data-diagram-column="order_id"]')
    .evaluate((row) => {
      const name = row.querySelector(".diagram-column-name");
      const type = row.querySelector(".diagram-column-type");
      return {
        nameX: Number(name?.getAttribute("x") || 0),
        typeX: Number(type?.getAttribute("x") || 0),
        typeAnchor: type?.getAttribute("text-anchor") || "",
      };
    });
  expect(orderIdColumnTypePosition.typeX).toBeGreaterThan(orderIdColumnTypePosition.nameX);
  expect(orderIdColumnTypePosition.typeAnchor).toBe("");
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"]')).toHaveCount(1);
  await expect(page.locator("#diagramFitButton")).toBeVisible();
  await expect(page.locator("#diagramFitButton")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#diagramZoomValue")).toContainText("Fit");
  await page.locator("#diagramZoomInButton").click();
  await expect(page.locator("#diagramFitButton")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#diagramZoomValue")).toContainText("115%");
  await page.locator("#diagramZoomOutButton").click();
  await expect(page.locator("#diagramZoomValue")).toContainText("100%");
  await expect(page.locator("#diagramDensityToggle")).toHaveCount(0);
  await expect(page.locator("#diagramColumnsToggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#diagramColumnsToggle")).toContainText("Hide full columns");
  await expect(page.locator("#diagramSvg")).toContainText("order_status");
  await expect(page.locator("#diagramSvg .diagram-table-metric-source")).toHaveCount(0);
  await expect(page.locator("#diagramInspector")).toHaveClass(/sr-only/);
  const localDiagramTracks = await page.locator("#localDiagram").evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length,
  );
  expect(localDiagramTracks).toBe(1);
  await expect(page.locator('#diagramSvg .diagram-role-bridge[data-diagram-table="order_items"]')).toHaveCount(1);
  await page.locator('#diagramSvg [data-diagram-table="orders"]').click();
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"]')).toHaveClass(/selected/);
  await expect(page.locator("#diagramInspector")).toContainText("orders table selected");
  await expect(page.locator("#diagramInspector")).not.toContainText("All columns");
  await expect(page.locator("#diagramInspector")).not.toContainText("CSV mapping");
  await page.locator("#diagramColumnsToggle").click();
  await expect(page.locator("#diagramColumnsToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#diagramColumnsToggle")).toContainText("Show all columns");
  await expect(page.locator("#diagramFitButton")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#diagramSvg")).not.toContainText("order_status");
  const ordersTable = page.locator('#diagramSvg [data-diagram-table="orders"]');
  const ordersRelationshipPath = page.locator(
    '#diagramSvg [data-diagram-relationship="order_items.order_id->orders.order_id"] .diagram-edge',
  );
  const ordersRelationship = page.locator(
    '#diagramSvg [data-diagram-relationship="order_items.order_id->orders.order_id"]',
  );
  await expect(ordersRelationship).toHaveAttribute("aria-label", /orders\.order_id one-to-many order_items\.order_id/);
  await expect(ordersRelationship.locator(".diagram-cardinality-one")).toHaveCount(1);
  await expect(ordersRelationship.locator(".diagram-cardinality-many")).toHaveCount(1);
  await expect(ordersRelationship.locator(".diagram-cardinality-one")).toHaveAttribute("d", /M .+ L /);
  await expect(ordersRelationship.locator(".diagram-cardinality-many")).toHaveAttribute("d", /M .+ L .+ M .+ L .+ M .+ L /);
  await expect(ordersRelationship).not.toContainText("1");
  await expect(ordersRelationship).not.toContainText("*");
  await expect(ordersRelationship.locator(".diagram-edge-flow")).toHaveCount(1);
  const relationshipPathBeforeDrag = await ordersRelationshipPath.getAttribute("d");
  const ordersTransformBeforeDrag = await ordersTable.getAttribute("transform");
  const ordersBox = await ordersTable.boundingBox();
  expect(ordersBox).toBeTruthy();
  await page.mouse.move(ordersBox.x + ordersBox.width / 2, ordersBox.y + ordersBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(ordersBox.x + ordersBox.width / 2 + 90, ordersBox.y + ordersBox.height / 2 + 36, {
    steps: 8,
  });
  await expect.poll(async () => ordersRelationshipPath.getAttribute("d")).not.toBe(relationshipPathBeforeDrag);
  await page.mouse.up();
  await expect.poll(async () => ordersTable.getAttribute("transform")).not.toBe(ordersTransformBeforeDrag);
  await page.locator("#diagramResetSelection").click();
  await expect(page.locator('#diagramSvg [data-diagram-table="orders"]')).not.toHaveClass(/selected/);
  await expect.poll(async () => ordersTable.getAttribute("transform")).toBe(ordersTransformBeforeDrag);
  await expect(page.locator("#dbdiagramLink")).toHaveAttribute(
    "href",
    /https:\/\/dbdiagram\.io\/embed\?c=/,
  );

  await expect(page.locator("#demoPresetStatus")).toHaveCount(0);
  await expect(page.locator("#demoPresetSmall")).toHaveCount(0);
  await expect(page.locator("#llmModeStatus")).toContainText("Off");
  await expect(page.locator("#llmModeToggle")).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#profileStepNext")).toBeEnabled();
  await expect(page.locator("#runPathProfilerButton")).toBeDisabled();

  await page.locator('.mapping-select[data-table="customers"]').selectOption("");
  await page.locator('.mapping-select[data-table="orders"]').selectOption("customers");
  await goToProfileStep(page, "preflight");
  await expect(page.locator("#issues")).toBeVisible();
  await expect(page.locator("#issues")).toContainText("Contract health");
  await expect(page.locator("#mapping")).toBeHidden();
  await expect(page.locator("#preflightGateBadge")).toContainText("Review warnings");
  await expect(page.locator("#preflightBlockersInfo")).toBeHidden();
  await page.locator('button[aria-label="What are preflight blockers?"]').hover();
  await expect(page.locator("#preflightBlockersInfo")).toBeVisible();
  await page.locator("#preflightReviewTitle").hover();
  await expect(page.locator("#preflightBlockersInfo")).toBeHidden();
  await expect(page.locator("#preflightWarningsInfo")).toBeHidden();
  await page.locator('button[aria-label="What are preflight warnings?"]').hover();
  await expect(page.locator("#preflightWarningsInfo")).toBeVisible();
  await page.locator("#preflightReviewTitle").hover();
  await expect(page.locator("#preflightWarningsInfo")).toBeHidden();
  await expect(page.locator("#preflightWarningList")).toContainText("Manual mapping selected");
  await expect(page.locator("#runPathProfilerButton")).toBeDisabled();
  await page.locator("[data-preflight-accept-all]").click();
  await expect(page.locator("#preflightGateBadge")).toContainText("Run enabled");
  await expect(page.locator("#preflightWarningList")).toContainText("Accepted");
  await page.locator("#preflightReview").screenshot({
    path: "outputs/us073_goal3/profile-preflight-warnings-accepted.png",
  });
  await goToProfileStep(page, "run");
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "run");
  await expect(page.locator("#runner")).toBeVisible();
  await expect(page.locator("#runPathProfilerButton")).toBeEnabled();
  await page.locator("#loadDemoButton").click();
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "run");
  await expect(page.locator("#runner")).toBeVisible();
  await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");

  await expect(page.locator("#profileDeveloperOptions")).toBeVisible();
  await expect(page.locator("#runnerModeDatabase")).toHaveCount(0);
  await expect(page.locator("#databaseRunnerForm")).toHaveCount(0);
  await expect(page.locator("#runDatabaseProfilerButton")).toHaveCount(0);
  await expect(page.locator("#rulesPathInput")).toHaveCount(0);
  await expect(page.locator("#pathTargetInput")).toHaveCount(0);
  fs.mkdirSync("outputs/us073_input_contract", { recursive: true });
  await page.locator("#runner").screenshot({
    path: "outputs/us073_input_contract/input-contract-runner.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#runner").scrollIntoViewIfNeeded();
  await page.locator("#runner").screenshot({
    path: "outputs/us073_input_contract/input-contract-runner-mobile.png",
  });
  await page.setViewportSize({ width: 1280, height: 720 });

  await expect(page.locator("#runnerModeUpload")).toBeHidden();
  await expect(page.locator("#runnerModePath")).toBeHidden();
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "run");
  await expect(page.locator("#pathRunnerForm")).toBeVisible();
  await expect(page.locator("#demoPresetOlist")).toHaveCount(0);
  await expect(page.locator("#demoPresetStatus")).toHaveCount(0);
  await expect(page.locator("#dbmlPathInput")).toHaveValue("data/demo_small/schema.dbml");
  await expect(page.locator("#dbmlPathInput")).toHaveAttribute("readonly", "");
  await expect(page.locator("#csvDirPathInput")).toHaveValue("data/demo_small/csv");
  await expect(page.locator("#csvDirPathInput")).toHaveAttribute("readonly", "");
  await expect(page.locator("#diagramSvg")).toContainText("order_payments");
  await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");

  await expect(page.locator("#profileDeveloperOptions")).toBeVisible();
  await expect(page.locator("#llmModeFake")).toHaveCount(0);
  await page.locator("#llmModeToggle").click();
  await expect(page.locator("#llmModeStatus")).toContainText("On");
  await expect(page.locator("#llmModeToggle")).toHaveAttribute("aria-checked", "true");
  await page.locator("#llmModeToggle").click();
  await expect(page.locator("#llmModeStatus")).toContainText("Off");
  await expect(page.locator("#llmModeToggle")).toHaveAttribute("aria-checked", "false");

  await page.locator("#loadDemoButton").click();
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "run");
  await expect(page.locator("#diagramSvg")).toContainText("order_payments");
  await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");

  await expect(page.locator("#dbmlPathInput")).toHaveValue("data/demo_small/schema.dbml");
  await expect(page.locator("#csvDirPathInput")).toHaveValue("data/demo_small/csv");
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "run");

  await goToProfileStep(page, "preflight");
  await goToProfileStep(page, "run");
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
  await expect(page.locator("#dashboardIssueCount")).toContainText("12/12 issues");
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "run");
  await expect(page.locator("#profileStepNext")).toBeEnabled();
  await expect(page.locator("#stageList")).toContainText("Render Markdown and HTML reports");
  fs.mkdirSync("outputs/us073_stage3", { recursive: true });
  const parseStage = page.locator("#stageList .runtime-stage-item").filter({
    hasText: "Parse DBML schema",
  });
  const parseStageInfo = parseStage.locator(".stage-info");
  await parseStageInfo.hover();
  const parseTooltip = parseStageInfo.locator(".stage-info-tooltip");
  await expect(parseTooltip).toBeVisible();
  await expect(parseTooltip).toContainText("Parses the DBML contract");
  await parseStageInfo.hover();
  const parseTooltipBox = await parseTooltip.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  });
  const stageListBox = await page.locator("#stageList").boundingBox();
  expect(stageListBox).not.toBeNull();
  expect(parseTooltipBox.width).toBeGreaterThan(0);
  expect(parseTooltipBox.height).toBeGreaterThan(0);
  expect(parseTooltipBox.y).toBeGreaterThanOrEqual(stageListBox.y);
  await page.screenshot({
    path: "outputs/us073_stage3/runtime-stage-first-info-tooltip.png",
  });
  const reportStage = page.locator("#stageList .runtime-stage-item").filter({
    hasText: "Render Markdown and HTML reports",
  });
  await expect(reportStage.locator(".stage-info-icon")).toHaveText("i");
  const reportStageInfo = reportStage.locator(".stage-info");
  const reportTooltip = reportStageInfo.locator(".stage-info-tooltip");
  await reportStageInfo.hover();
  await expect(reportTooltip).toBeVisible();
  await expect(reportTooltip).toContainText("does not call OpenAI");
  await reportStage.locator("summary").click();
  expect(await reportStage.evaluate((element) => element.hasAttribute("open"))).toBe(true);
  await expect(reportStage.locator(".stage-detail-grid")).toContainText("report_count");
  await expect(reportStage.locator(".stage-detail-grid")).toContainText("formats");
  await expect(reportStage.locator(".stage-detail-grid")).toContainText("external_api_call");
  await expect(reportStage.locator(".stage-detail-grid")).toContainText("no");
  await page.waitForFunction(() => {
    const list = document.querySelector("#stageList");
    const stage = [...document.querySelectorAll("#stageList .runtime-stage-item")]
      .find((element) => element.textContent.includes("Render Markdown and HTML reports"));
    const detail = stage?.querySelector(".stage-detail-grid");
    if (!list || !detail) {
      return false;
    }
    const listRect = list.getBoundingClientRect();
    const detailRect = detail.getBoundingClientRect();
    return detailRect.top >= listRect.top && detailRect.bottom <= listRect.bottom + 1;
  });
  await page.screenshot({
    path: "outputs/us073_stage3/runtime-stage-report-detail-visible.png",
  });
  await page.mouse.move(20, 20);
  await reportStage.screenshot({
    path: "outputs/us073_stage3/runtime-stage-info-dropdown.png",
  });
  await page.locator("#profileStepNext").click();
  await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "review");
  const filterToolbarLayout = await page.locator("#dashboard .dashboard-filters").evaluate((element) => {
    const controls = [...element.querySelectorAll("#dashboardSeverityFilter, #dashboardIssueTypeFilter, #dashboardTableFilter, #dashboardResetFilters")]
      .map((control) => control.getBoundingClientRect());
    return {
      controlCount: controls.length,
      overflow: element.scrollWidth - element.clientWidth,
      ySpread: Math.max(...controls.map((rect) => rect.top)) - Math.min(...controls.map((rect) => rect.top)),
    };
  });
  expect(filterToolbarLayout.controlCount).toBe(4);
  expect(filterToolbarLayout.overflow).toBeLessThanOrEqual(1);
  expect(filterToolbarLayout.ySpread).toBeLessThan(8);
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("readiness");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("gates");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("artifacts");
  await expect(page.locator("#dashboardPanelGrid .issue-visual-summary")).toBeVisible();
  await expect(page.locator("#dashboardPanelGrid .issue-visual-summary")).toContainText("Issue map");
  await expect(page.locator("#dashboardPanelGrid .issue-visual-chart")).toHaveCount(3);
  expect(await page.locator("#dashboardPanelGrid .issue-visual-row").count()).toBeGreaterThan(3);

  await goToProfileStep(page, "connect");
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
  await expect(page.locator("#diagramInspector")).toContainText("Relationship selected");
  await expect(page.locator("#diagramInspector")).not.toContainText("FOREIGN_KEY_NULL");
  await expect(page.locator("#diagramInspector")).not.toContainText("relationship_graph.json");
  await expect(page.locator("#diagramDensityToggle")).toHaveCount(0);

  await goToProfileStep(page, "run");
  await expect(page.getByText("Issue review snapshot")).toBeVisible();
  const generatedResults = page.locator("#artifactList");
  await expect(generatedResults).toContainText("Data-quality readiness");
  await expect(generatedResults).toContainText("NOT_READY");
  await expect(generatedResults).toContainText("Issue counts");
  await expect(generatedResults).toContainText("12 issues");
  await expect(generatedResults).toContainText("Column usability");
  await expect(generatedResults).toContainText("blocked columns");
  await expect(generatedResults).toContainText("Table readiness");
  await expect(generatedResults).toContainText("7 tables");
  await expect(generatedResults).toContainText("Runtime summary");
  await expect(generatedResults).toContainText("7 stages");
  await expect(generatedResults).not.toContainText("Report HTML");
  await expect(generatedResults).not.toContainText("Report Markdown");
  await expect(generatedResults).not.toContainText("Developer artifact links");
  await expect(generatedResults).not.toContainText("dataset_verdict.json");
  await expect(page.locator("#stageList")).not.toContainText("Run influence analysis");
  await expect(page.locator("#stageList")).not.toContainText("influence_analysis");
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

  await goToProfileStep(page, "review");
  const dashboard = page.locator("#dashboardPanelGrid");
  await expect(dashboard).toContainText("Issue table");
  await expect(dashboard.locator(".issue-review-table")).toBeVisible();
  await expect(dashboard.locator(".issue-review-header")).toContainText("Affected");
  await expect(dashboard.locator(".issue-row-meter").first()).toBeVisible();
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
  await expect(page.locator('#workflowNav .nav-stage-item[data-nav-profile-step="review"]')).toContainText("Current");
  await expect(page.locator('#workflowNav .nav-stage-item[data-nav-profile-step="preflight"]')).toContainText("Done");
  await expect(page.locator('#workflowNav .nav-subitem[data-workflow-nav-target="qualityGates"]')).toHaveAttribute("aria-current", "step");
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
  await expect(page.locator("#runHistory")).toBeHidden();
  await expect(page.locator("#workflowNav")).not.toContainText("Run History");
  await expect(page.locator("#workflowNav")).not.toContainText("Previous runs");
  await expect(page.locator("#dashboardStatusBadge")).toContainText("succeeded dashboard", {
    timeout: 20_000,
  });
  await expect(page.locator("#dashboardIssueCount")).toContainText("12/12 issues");
  await expect(page.locator("#qualityGatesStatus")).toContainText("source=deterministic");
  await expect(page.locator("#todosStatus")).toContainText("grouped todos");
  fs.mkdirSync("outputs/us073_goal4", { recursive: true });
  await page.locator("#dashboardPanelGrid").scrollIntoViewIfNeeded();
  await page.locator("#dashboardPanelGrid").screenshot({
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

  await page.locator('#dashboardPanelGrid [data-dashboard-kind="issue"][data-dashboard-value="ISSUE-0009"]').click();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("ISSUE-0009");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Where");
  await expect(page.locator("#dashboardDrilldown .issue-focus-map")).toBeVisible();
  await expect(page.locator("#dashboardDrilldown .issue-focus-map")).toContainText("sellers.seller_id");
  await expect(page.locator("#dashboardDrilldown .issue-focus-track span")).toHaveAttribute("style", /width: [^0]/);
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
  await expect(page.locator("#dashboardDrilldown")).toContainText("sellers.seller_id");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Sample rows");
  await expect(page.locator("#dashboardDrilldown")).toContainText("LLM enrichment add-on");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Run LLM enrichment");
  fs.mkdirSync("outputs/us073_goal11", { recursive: true });
  const issueDetailPanel = page.locator("#dashboard .dashboard-detail").first();
  await issueDetailPanel.screenshot({
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
  await page.locator("#dashboardDrilldown .issue-llm-enrichment").scrollIntoViewIfNeeded();
  await issueDetailPanel.screenshot({
    path: "outputs/us073_goal11/issue-drawer-after-fake-enrichment.png",
  });
  await issueDetailPanel.screenshot({
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
  await page.locator("#dashboardDrilldown .issue-llm-enrichment").scrollIntoViewIfNeeded();
  await issueDetailPanel.screenshot({
    path: "outputs/us073_goal11/issue-drawer-openai-failure.png",
  });
  await issueDetailPanel.screenshot({
    path: `${goal12Dir}/issue-drawer-openai-unavailable.png`,
  });
  await page.locator("#dashboardDrilldown .issue-detail-header").scrollIntoViewIfNeeded();
  await issueDetailPanel.screenshot({
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
  await page.locator('#workflowNav .nav-subitem[data-workflow-nav-target="todos"]').click();
  await expect(page.locator('#workflowNav .nav-subitem[data-workflow-nav-target="todos"]')).toHaveAttribute("aria-current", "step");
  await expect(page.locator("#todos")).toContainText("Parent Key Duplicate on orders.order_id");
  await expect(page.locator("#todos")).toContainText("Evidence:");
  const parentDuplicateTodo = page.locator(".todo-occurrence").filter({ hasText: "Parent Key Duplicate on orders.order_id" }).first();
  await parentDuplicateTodo.click();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText(/ISSUE-/);
  await expect(page.locator("#dashboardDrilldown")).toContainText("Parent Key Duplicate");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Finding values");
  await page.locator("#todos").scrollIntoViewIfNeeded();
  await page.locator("#todosFilterVerify").click();
  await expect(page.locator("#todos")).toContainText("Rerun the profiler on the corrected CSV + DBML inputs.");
  await expect(page.locator("#todos")).toContainText("12 occurrences");
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

  await expect(page.locator("#graphs")).toHaveCount(0);
  await expect(page.locator("#dashboardGraphSvg")).toHaveCount(0);
  await expect(page.locator("#dashboardGraphDrilldown")).toHaveCount(0);
  await expect(page.locator("#artifacts")).toHaveCount(0);
  await expect(page.locator("#dashboardArtifactLinks")).toHaveCount(0);
  await expect(page.locator("#dashboard")).not.toContainText("Developer Schema Context");
  await expect(page.locator("#dashboard")).not.toContainText("Graph drilldown");
  await expect(page.locator("#dashboard")).not.toContainText("Developer artifact sources");

  await page.locator("#dashboardSeverityFilter").selectOption("P1");
  await expect(page.locator("#dashboardIssueCount")).toContainText("/12 issues");
  await expect(page.locator("#dashboardPanelGrid")).toContainText("Blocked");
  await page.locator('#dashboardPanelGrid [data-dashboard-kind="issue"]').first().click();
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
  await goToProfileStep(page, "run");
  await page.locator("#artifactList").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await page.screenshot({
    path: "outputs/us070_visual_review/dashboard-generated-results-mobile-page.png",
  });
  await page.locator("#artifactList").screenshot({
    path: "outputs/us070_visual_review/dashboard-generated-results-mobile.png",
  });
});

async function goToProfileStep(page, targetStep) {
  const order = ["connect", "preflight", "run", "review"];
  const targetIndex = order.indexOf(targetStep);
  if (targetIndex === -1) {
    throw new Error(`Unknown profile step: ${targetStep}`);
  }
  for (let attempt = 0; attempt < order.length + 2; attempt += 1) {
    const currentStep = await page.locator("#profileFlow").getAttribute("data-profile-step");
    if (currentStep === targetStep) {
      await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", targetStep);
      return;
    }
    const currentIndex = order.indexOf(currentStep);
    if (currentIndex === -1) {
      throw new Error(`Unknown current profile step: ${currentStep}`);
    }
    if (currentIndex < targetIndex) {
      await expect(page.locator("#profileStepNext")).toBeEnabled();
      await page.locator("#profileStepNext").click();
    } else {
      await expect(page.locator("#profileStepBack")).toBeEnabled();
      await page.locator("#profileStepBack").click();
    }
  }
  throw new Error(`Unable to navigate to profile step: ${targetStep}`);
}
