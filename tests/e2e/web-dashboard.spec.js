const { expect, test } = require("@playwright/test");
const fs = require("node:fs");

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

  await page.locator("#runnerModePath").click();
  await expect(page.locator("#pathRunnerForm")).toBeVisible();

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
    /Dashboard loaded|Influence chart is absent/,
    { timeout: 20_000 },
  );

  await expect(page.locator("#dashboardStatusBadge")).toContainText(
    "succeeded dashboard",
  );
  await expect(page.locator("#dashboardIssueCount")).toContainText("15/15 issues");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("verdict");
  await expect(page.locator("#dashboardSummaryStrip")).toContainText("artifacts");

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
  await expect(page.locator("#tableImpactGrid")).toContainText("order_reviews");

  await page
    .locator('#tableImpactGrid [data-dashboard-kind="table_assessment"][data-dashboard-value="order_reviews"]')
    .click();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("order_reviews");
  await expect(page.locator("#dashboardDrilldown")).toContainText("customer_feedback");
  await expect(page.locator("#dashboardDrilldown")).toContainText("table_assessments.json");

  await expect(page.locator("#dashboardGraphStatus")).toContainText("Lineage graph");
  await expect
    .poll(async () => page.locator("#dashboardGraphSvg [data-graph-node-id]").count())
    .toBeGreaterThan(0);
  await expect(page.locator("#dashboardGraphLegend")).toContainText("Table");

  await page
    .locator("#dashboardGraphSvg [data-graph-node-id]")
    .filter({ hasText: "orders" })
    .first()
    .click();
  await expect(page.locator("#dashboardGraphDrilldownMeta")).toContainText("orders");
  await expect(page.locator("#dashboardGraphDrilldown")).toContainText(
    "lineage_graph.json",
  );

  await page.locator("#dashboardGraphModeRelationship").click();
  await expect(page.locator("#dashboardGraphStatus")).toContainText(
    "Relationship graph",
  );
  await page.locator("#dashboardGraphScope").selectOption("relationships");
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

  await page.locator("#dashboardSeverityFilter").selectOption("P1");
  await expect(page.locator("#dashboardIssueCount")).toContainText("/15 issues");

  await page
    .locator('[data-dashboard-kind="severity"][data-dashboard-value="P1"]')
    .click();
  await expect(page.locator("#dashboardDrilldownMeta")).toContainText("P1");
  await expect(page.locator("#dashboardDrilldown")).toContainText("matching issues");
  await expect(page.locator("#dashboardDrilldown")).toContainText("sample CSV");

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
