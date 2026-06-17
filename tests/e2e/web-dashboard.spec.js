const { expect, test } = require("@playwright/test");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

test.beforeAll(() => {
  const profilerBin = process.platform === "win32"
    ? path.join(process.cwd(), ".venv", "Scripts", "vsf-profiler.exe")
    : path.join(process.cwd(), ".venv", "bin", "vsf-profiler");
  childProcess.execFileSync(
    profilerBin,
    ["demo", "create-olist-sample", "--out", "data/demo_olist"],
    { stdio: "inherit" },
  );
});

test("local path run renders the interactive dashboard from generated artifacts", async ({
  page,
}) => {
  const artifactRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/jobs/") && url.includes("/artifacts/")) {
      artifactRequests.push(url);
    }
  });

  await page.goto("/");
  await expect(page.locator("#runnerMessage")).toContainText("Local backend is ready");
  await expect(page.locator("#localDiagram")).toBeVisible();
  await expect(page.locator("#diagramFrame")).toBeHidden();
  await expect(page.locator("#diagramSourceBadge")).toContainText("Browser DBML");
  await expect(page.locator("#diagramMessage")).toContainText("Local preflight");
  await expect(page.locator("#diagramSvg")).toContainText("olist_orders_dataset");
  await expect(page.locator("#diagramSvg")).toContainText("PK order_id");
  await expect(page.locator("#diagramSvg")).toContainText("FK customer_id");
  await expect(page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]')).toHaveCount(1);
  await expect(page.locator("#diagramFitButton")).toBeVisible();
  await expect(page.locator("#diagramFitButton")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#diagramDensityToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#diagramColumnsToggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#diagramColumnsToggle")).toContainText("All columns");
  await expect(page.locator("#diagramSvg")).toContainText("order_status");
  await expect(page.locator('#diagramSvg .diagram-role-bridge[data-diagram-table="olist_order_items_dataset"]')).toHaveCount(1);
  await page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]').click();
  await expect(page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]')).toHaveClass(/selected/);
  await expect(page.locator("#diagramInspector")).toContainText("olist_orders_dataset");
  await expect(page.locator("#diagramInspector")).toContainText("Fact/event");
  await page.locator("#diagramSvg").click({ position: { x: 4, y: 4 } });
  await expect(page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]')).not.toHaveClass(/selected/);
  const mapping = page.locator("#mappingBody");
  await expect(mapping).toContainText("olist_customers_dataset.csv");
  await expect(mapping).toContainText("olist_orders_dataset.csv");
  await expect(mapping).toContainText("olist_order_items_dataset.csv");
  await expect(mapping).toContainText("olist_order_payments_dataset.csv");
  await expect(mapping).toContainText("olist_order_reviews_dataset.csv");
  await expect(mapping).toContainText("olist_products_dataset.csv");
  await expect(mapping).toContainText("olist_sellers_dataset.csv");
  await expect(mapping).toContainText("product_category_name_translation.csv");
  await expect(mapping).toContainText("olist_geolocation_dataset.csv");
  await expect(mapping).not.toContainText("undefined");
  await expect(mapping).not.toContainText("missing CSV");
  await expect(mapping).not.toContainText("extra CSV");
  await page.locator("#diagramColumnsToggle").click();
  await expect(page.locator("#diagramColumnsToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#diagramColumnsToggle")).toContainText("Key columns only");
  await expect(page.locator("#diagramSvg")).not.toContainText("order_status");
  await expect(page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]')).not.toHaveClass(/selected/);
  await expect(page.locator("#dbdiagramLink")).toHaveAttribute(
    "href",
    /https:\/\/dbdiagram\.io\/embed\?c=/,
  );

  await page.locator("#runnerModePath").click();
  await expect(page.locator("#pathRunnerForm")).toBeVisible();

  await page.locator("#dbmlPathInput").fill("data/demo_olist/schema.dbml");
  await page.locator("#csvDirPathInput").fill("data/demo_olist/csv");
  await page.locator("#rulesPathInput").fill("data/demo_olist/rules.yaml");
  await page.locator("#pathTargetInput").fill("olist_order_reviews_dataset.review_score");

  await expect(page.locator("#runPathProfilerButton")).toBeEnabled();
  await page.locator("#runPathProfilerButton").click();

  await expect(page.locator("#runnerMessage")).toContainText("Run complete", {
    timeout: 60_000,
  });
  await expect(page.locator("#dashboardMessage")).toContainText(
    /Dashboard loaded|Influence chart is absent/,
    { timeout: 20_000 },
  );

  await expect(page.locator("#dashboardStatusBadge")).toContainText(
    "succeeded dashboard",
  );
  await expect(page.locator("#dashboardIssueCount")).toContainText("15/15 issues");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("verdict");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("artifacts");
  await expect(page.locator("#diagramSourceBadge")).toContainText("schema_diagram.json");
  await expect(page.locator("#diagramMessage")).toContainText("Generated artifacts");
  await expect(page.locator("#diagramWarnings")).toContainText("schema_parse_report.json");
  await expect(page.locator("#diagramSvg")).toContainText("olist_order_payments_dataset");
  await expect(page.locator("#diagramSvg")).toContainText("varchar");
  await expect(page.locator("#diagramSvg")).toContainText("timestamp");
  await expect(page.locator("#diagramSvg")).toContainText("FK issue");
  await expect(page.locator('#diagramSvg [data-diagram-table="olist_order_payments_dataset"]')).toHaveCount(1);
  const dbdiagramUrl = await page.locator("#dbdiagramLink").getAttribute("href");
  const dbdiagramDbml = await page.evaluate((href) => {
    const encoded = new URL(href).searchParams.get("c") || "";
    return decodeURIComponent(escape(atob(encoded)));
  }, dbdiagramUrl);
  const orderItemsDbmlBlock = dbdiagramDbml.split("Table olist_order_items_dataset {")[1].split("\n}")[0];
  expect(orderItemsDbmlBlock).toContain("(order_id, order_item_id) [pk]");
  expect(orderItemsDbmlBlock).not.toContain("order_id varchar [pk");
  expect(orderItemsDbmlBlock).not.toContain("order_item_id int [pk");
  await page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]').click();
  await expect(page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]')).toHaveClass(/selected/);
  await expect(page.locator("#diagramInspector")).toContainText("FK issue");
  await page.locator("#dashboardSummaryStrip").click();
  await expect(page.locator('#diagramSvg [data-diagram-table="olist_orders_dataset"]')).not.toHaveClass(/selected/);
  const customerRelationship = page.locator(
    '#diagramSvg [data-diagram-relationship="olist_orders_dataset.customer_id->olist_customers_dataset.customer_id"]',
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

  await expect(page.getByText("Generated results")).toBeVisible();
  const generatedResults = page.locator("#artifactList");
  await expect(generatedResults).toContainText("Dataset verdict");
  await expect(generatedResults).toContainText("NOT_READY");
  await expect(generatedResults).toContainText("Issue counts");
  await expect(generatedResults).toContainText("15 issues");
  await expect(generatedResults).toContainText("Table impact");
  await expect(generatedResults).toContainText("9 tables");
  await expect(generatedResults).toContainText("Runtime summary");
  await expect(generatedResults).toContainText("8 stages");
  await expect(generatedResults).toContainText("Report HTML");
  await expect(generatedResults).toContainText("report.html");
  await expect(generatedResults).toContainText("Report Markdown");
  await expect(generatedResults).toContainText("report.md");
  await expect(generatedResults).toContainText("Generated artifacts");
  await expect(generatedResults).toContainText("dataset_verdict.json");
  await expect(page.locator("#artifactPreview")).toContainText("Select a report");
  await generatedResults.locator('.generated-report-link[data-artifact-path="report.md"]').click();
  await expect(page.locator("#artifactPreview")).toBeFocused();
  await expect(page.locator("#artifactPreviewMeta")).toContainText("report.md");
  await expect(page.locator("#artifactPreview")).toContainText("VSF");

  const runtimeStages = page.locator("#stageList");
  await expect(runtimeStages).toContainText("Stage result");
  await expect(runtimeStages).toContainText("9 tables");
  await expect(runtimeStages).toContainText("27 rows");
  await expect(runtimeStages).toContainText("profile_summary.json");
  await expect(runtimeStages).toContainText("relationship_graph.json");
  await runtimeStages.locator('[data-artifact-path="profile_summary.json"]').first().click();
  await expect(page.locator("#artifactPreview")).toBeFocused();
  await expect(page.locator("#artifactPreviewMeta")).toContainText("profile_summary.json");
  await expect(page.locator("#artifactPreview")).toContainText("Profile summary review");

  const dashboard = page.locator("#dashboardPanelGrid");
  await expect(dashboard).toContainText("Dataset verdict");
  await expect(dashboard).toContainText("Issue counts by severity");
  await expect(dashboard).toContainText("Issue counts by type");
  await expect(dashboard).toContainText("Missingness by table");
  await expect(dashboard).toContainText("Relationship FK health");
  await expect(dashboard).toContainText("Influence top features");

  await expect(page.locator("#tableImpact")).toContainText("Table Impact");
  await expect(page.locator("#tableImpactStatus")).toContainText(
    "tables from table_assessments.json",
  );
  await expect(page.locator("#tableImpactGrid")).toContainText("olist_order_reviews_dataset");

  await page
    .locator('#tableImpactGrid [data-dashboard-kind="table_assessment"][data-dashboard-value="olist_order_reviews_dataset"]')
    .click();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("olist_order_reviews_dataset");
  await expect(page.locator("#dashboardDrilldown")).toContainText("customer_feedback");
  await expect(page.locator("#dashboardDrilldown")).toContainText("table_assessments.json");

  await expect(page.locator("#dashboardGraphStatus")).toContainText("Lineage graph");
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
    .filter({ hasText: "olist_orders_dataset" })
    .first()
    .click();
  await expect(page.locator("#dashboardGraphDrilldownMeta")).toContainText("olist_orders_dataset");
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

  await expect(page.locator("#dashboardArtifactCount")).toContainText(/1[6-7] files/);
  await expect(page.locator("#dashboardArtifactLinks")).toContainText(
    "charts/issue_counts_by_severity.json",
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
    "lineage_graph.json",
  );
  await page
    .locator('#dashboardArtifactLinks [data-artifact-path="relationship_graph.json"]')
    .first()
    .click();
  await expect(page.locator("#artifactPreview")).toBeFocused();
  await expect(page.locator("#artifactPreviewMeta")).toContainText("relationship_graph.json");
  await expect(page.locator("#artifactPreview")).toContainText("Relationship review");
  await expect(page.locator("#artifactPreview")).toContainText("Relationship health");
  await expect(page.locator("#artifactPreview")).toContainText("FK issue");
  await expect(page.locator("#artifactPreview")).toContainText("Tables in relationship graph");
  await expect(page.locator("#artifactPreview")).not.toContainText("Object(9)");
  await page
    .locator('#dashboardArtifactLinks .artifact-json-link[data-artifact-path="charts/relationship_fk_health.json"]')
    .first()
    .click();
  await expect(page.locator("#artifactPreview")).toContainText("Relationship FK Health");
  await expect(page.locator("#artifactPreview")).toContainText("data-quality checks");
  await expect(page.locator("#artifactPreview .artifact-chart-label").first()).toContainText("FK issue");
  await page
    .locator('#dashboardArtifactLinks [data-artifact-path="issues.json"]')
    .first()
    .click();
  await expect(page.locator("#artifactPreview")).toContainText("Issue review");
  await expect(page.locator("#artifactPreview")).toContainText("Top issues");
  await expect(page.locator("#artifactPreview")).toContainText("Suggested fix");
  await expect(page.locator("#artifactPreview")).toContainText("Preview row evidence");
  await page.locator('#artifactPreview [data-artifact-action="preview-issue-sample"]').first().click();
  await expect(page.locator("#artifactPreviewMeta")).toContainText(".csv");
  await expect(page.locator("#artifactPreview")).toContainText("Issue row evidence");
  await expect(page.locator("#artifactPreview")).toContainText("Sample row 1");
  await expect(page.locator("#artifactPreview .issue-column-highlight").first()).toBeVisible();
  const stageListBox = await page.locator("#stageList").boundingBox();
  const generatedResultsBox = await page.locator("#artifactList").boundingBox();
  const drilldownBox = await page.locator("#dashboardDrilldown").boundingBox();
  const graphDrilldownBox = await page.locator("#dashboardGraphDrilldown").boundingBox();
  const artifactSourcesBox = await page.locator("#dashboardArtifactLinks").boundingBox();
  expect(generatedResultsBox.y).toBeGreaterThan(stageListBox.y);
  expect(graphDrilldownBox.y).toBeGreaterThan(drilldownBox.y);
  expect(artifactSourcesBox.y).toBeGreaterThan(graphDrilldownBox.y);
  const severityChartSource = page
    .locator('#dashboardArtifactLinks [data-artifact-path="charts/issue_counts_by_severity.json"]')
    .first();
  await expect(severityChartSource).toContainText("View chart");
  const popupOpened = page
    .waitForEvent("popup", { timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  await severityChartSource.click();
  await expect(page.locator('[data-dashboard-panel-path="charts/issue_counts_by_severity.json"]')).toBeFocused();
  expect(await popupOpened).toBe(false);
  await page
    .locator('#dashboardArtifactLinks .artifact-json-link[data-artifact-path="charts/dataset_verdict_risk_summary.json"]')
    .click();
  await expect(page.locator("#artifactPreview")).toBeFocused();
  await expect(page.locator("#artifactPreviewMeta")).toContainText(
    "charts/dataset_verdict_risk_summary.json",
  );
  await expect(page.locator("#artifactPreview")).toContainText("Chart preview");
  await expect(page.locator("#artifactPreview .artifact-chart-preview")).toBeVisible();
  await expect(page.locator("#artifactPreview .risk-gauge")).toBeVisible();
  await page
    .locator('#dashboardArtifactLinks .artifact-json-link[data-artifact-path="charts/issue_counts_by_severity.json"]')
    .click();
  await expect(page.locator("#artifactPreviewMeta")).toContainText(
    "charts/issue_counts_by_severity.json",
  );
  await expect(page.locator("#artifactPreview .artifact-chart-bar-row").first()).toBeVisible();

  await page.locator("#dashboardSeverityFilter").selectOption("P1");
  await expect(page.locator("#dashboardIssueCount")).toContainText("/15 issues");

  await page
    .locator('[data-dashboard-kind="severity"][data-dashboard-value="P1"]')
    .click();
  await expect(page.locator("#dashboardDrilldown")).toBeFocused();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("P1");
  await expect(page.locator("#dashboardDrilldown")).toContainText("matching issues");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Severity filter");
  await expect(page.locator('#dashboardDrilldown [data-drilldown-severity="P1"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('#dashboardDrilldown [data-drilldown-severity="P0"]').click();
  await expect(page.locator("#dashboardSeverityFilter")).toHaveValue("P0");
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("P0");
  await expect(page.locator('#dashboardDrilldown [data-drilldown-severity="P0"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#dashboardDrilldown")).toContainText("PRIMARY_KEY_NULL");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Table");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Columns");
  await expect(page.locator("#dashboardDrilldown")).toContainText("Preview row evidence");
  await page.locator('#dashboardDrilldown [data-artifact-action="preview-issue-sample"]').first().click();
  await expect(page.locator("#artifactPreview")).toBeFocused();
  await expect(page.locator("#artifactPreviewMeta")).toContainText(".csv");
  await expect(page.locator("#artifactPreview")).toContainText("Issue row evidence");
  await expect(page.locator("#artifactPreview")).toContainText("Sample row 1");
  await expect(page.locator("#artifactPreview")).toContainText("Highlighted columns");
  await expect(page.locator("#artifactPreview table")).toBeVisible();
  await expect(page.locator("#artifactPreview .issue-column-highlight").first()).toBeVisible();

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
});
