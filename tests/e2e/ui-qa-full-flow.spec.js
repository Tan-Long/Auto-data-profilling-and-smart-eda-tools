const { expect, test } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const qaDir = path.join("outputs", "ui_qa_full_flow");

test("demo user can complete upload, demo, evaluate, report, and post-run review flows", async ({
  context,
  page,
}) => {
  test.setTimeout(240_000);
  fs.mkdirSync(qaDir, { recursive: true });
  const matrix = [];
  const artifactRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/jobs/") && url.includes("/artifacts/")) {
      artifactRequests.push(url);
    }
  });

  try {
    await page.goto("/");

    await expect(page.locator("#flowChooser")).toBeVisible();
    await expect(page.locator("#profileFlowButton")).toContainText("Profile my data");
    await expect(page.locator("#evaluateFlowButton")).toContainText("Evaluate tool");
    record(
      matrix,
      "First screen",
      "Profile and Evaluate choices are visible before any run.",
      "Both flow buttons are visible and inactive until selected.",
      await screenshot(page.locator("#flowChooser"), "01-first-screen.png"),
    );

    await page.locator("#evaluateFlowButton").click();
    await expect(page.locator("#evaluateFlow")).toBeVisible();
    await expect(page.locator("#evaluateFlow input[type='file']")).toHaveCount(0);
    await expect(page.locator("#evaluationCatalogCount")).toContainText("2 datasets", {
      timeout: 10_000,
    });
    await expect(page.locator("#evaluationDatasetList")).toContainText("Retail orders seeded faults");
    await expect(page.locator("#evaluationDatasetList")).toContainText("Support tickets seeded faults");
    record(
      matrix,
      "Evaluate catalog",
      "Evaluate exposes only built-in datasets and no file upload controls.",
      "Two curated datasets are listed; no DBML/CSV file inputs exist in Evaluate.",
      await screenshot(page.locator("#evaluateFlow"), "02-evaluate-catalog.png"),
    );

    await page.locator('[data-evaluation-dataset-id="support_tickets_seeded_faults"]').click();
    await expect(page.locator('[data-evaluation-dataset-id="support_tickets_seeded_faults"]')).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.locator("#startEvaluationButton").click();
    await expect(page.locator("#evaluateMessage")).toContainText("Evaluation complete", {
      timeout: 60_000,
    });
    await expect(page.locator("#evaluationExpectedList")).toContainText("caught");
    await expect(page.locator("#evaluationUsefulnessList")).toContainText("Actionability");
    await expect(page.locator("#evaluationBaselineList")).toContainText(/GE unavailable|Not covered by baseline/);
    await expect(page.locator("#evaluationArtifactLinks")).toContainText("evaluation_summary.json");
    await expect(page.locator("#evaluationArtifactLinks")).toContainText("ground_truth_issues.json");
    await expect(page.locator("#evaluationArtifactLinks")).toContainText("baseline_comparison.json");
    record(
      matrix,
      "Evaluate run",
      "A selected built-in dataset runs and shows correctness, usefulness, baseline, and artifact links.",
      "Support tickets evaluation completed with expected rows and artifact links.",
      await screenshot(page.locator("#evaluationComparison"), "03-evaluate-run.png"),
    );

    await page.locator("#profileFlowButton").click();
    await expect(page.locator("#profileFlow")).toBeVisible();
    await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "connect");
    await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
    await expect(page.locator("#csvList")).not.toContainText("customers.csv");
    await expect(page.locator("#diagramEmpty")).toContainText("Upload DBML to preview schema");
    record(
      matrix,
      "Upload initial state",
      "Upload mode starts clean, with no demo inventory visible.",
      "Source badge says No upload, CSV list has no demo CSVs, and diagram is empty.",
      await screenshot(page.locator("#sourceState"), "04-upload-empty-source.png"),
    );

    await page.locator("#quickDemoButton").click();
    await expect(page.locator("#sourceStateBadge")).toContainText("Demo paths");
    await expect(page.locator("#sourceStateSummary")).toContainText("DBML + CSV demo is loaded");
    await expect(page.locator("#runnerMessage")).toContainText("DBML + CSV demo is loaded");
    await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");
    await expect(page.locator("#csvList")).toContainText("customers.csv");
    await expect(page.locator("#profileStepNext")).toBeEnabled();
    await expect(page.locator("#runPathProfilerButton")).toBeDisabled();
    record(
      matrix,
      "Quick demo source",
      "A visible Connect-step button loads sample DBML and CSV inventory for demo runs.",
      "The sample demo switched to local path mode, filled mapping 7/7, and enabled Next while keeping Run gated.",
      await screenshot(page.locator("#sourceState"), "05-quick-demo-source.png"),
    );

    await page.locator("#clearUploadButton").click();
    await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
    await expect(page.locator("#csvList")).not.toContainText("customers.csv");

    const uploadFixtureDir = path.join(qaDir, "fixtures");
    fs.mkdirSync(uploadFixtureDir, { recursive: true });
    const accountsDbml = path.join(uploadFixtureDir, "accounts.dbml");
    const accountsCsv = path.join(uploadFixtureDir, "accounts.csv");
    const invoicesDbml = path.join(uploadFixtureDir, "invoices.dbml");
    const invoicesCsv = path.join(uploadFixtureDir, "invoices.csv");
    fs.writeFileSync(
      accountsDbml,
      ["Table accounts {", "  account_id varchar [pk, not null]", "  account_name varchar", "}", ""].join(
        "\n",
      ),
    );
    fs.writeFileSync(accountsCsv, "account_id,account_name\nA-1,Example account\n");
    fs.writeFileSync(
      invoicesDbml,
      [
        "Table invoices {",
        "  invoice_id varchar [pk, not null]",
        "  account_id varchar",
        "  amount float",
        "}",
        "",
      ].join("\n"),
    );
    fs.writeFileSync(invoicesCsv, "invoice_id,account_id,amount\nINV-1,A-1,42.50\n");

    await page.locator("#dbmlInput").setInputFiles(accountsDbml);
    await page.locator("#csvInput").setInputFiles(accountsCsv);
    await expect(page.locator("#sourceStateBadge")).toContainText("Custom upload");
    await expect(page.locator("#csvList")).toContainText("accounts.csv");
    await expect(page.locator("#csvList")).not.toContainText("customers.csv");
    await expect(page.locator("#mappingStatus")).toContainText("1/1 tables mapped");
    await expect(page.locator("#preflightGateBadge")).toContainText("Run enabled");
    await expect(page.locator("#profileStepNext")).toBeEnabled();
    await expect(page.locator("#runProfilerButton")).toBeDisabled();
    record(
      matrix,
      "Custom upload mapping",
      "Custom DBML/CSV replaces demo inventory and enables the run button.",
      "accounts.csv is visible, demo CSVs are absent, mapping is 1/1, and preflight enables Run.",
      await screenshot(page.locator("#profileFlow"), "05-custom-upload-mapped.png"),
    );

    await page.locator("#clearUploadButton").click();
    await expect(page.locator("#sourceStateBadge")).toContainText("No upload");
    await expect(page.locator("#csvList")).not.toContainText("accounts.csv");
    await page.locator("#dbmlInput").setInputFiles(invoicesDbml);
    await page.locator("#csvInput").setInputFiles(invoicesCsv);
    await expect(page.locator("#csvList")).toContainText("invoices.csv");
    await expect(page.locator("#csvList")).not.toContainText("accounts.csv");
    await expect(page.locator("#mappingStatus")).toContainText("1/1 tables mapped");
    record(
      matrix,
      "Clear and re-upload",
      "Clear source removes old uploads, and a new upload inventory replaces it.",
      "accounts.csv disappeared, invoices.csv is the only uploaded CSV, and mapping stayed valid.",
      await screenshot(page.locator("#profileFlow"), "06-reupload-source-state.png"),
    );

    await goToProfileStep(page, "preflight");
    await goToProfileStep(page, "run");
    await expect(page.locator("#runProfilerButton")).toBeEnabled();
    await page.locator("#runProfilerButton").click();
    await expect(page.locator("#runnerMessage")).toContainText("Run complete", {
      timeout: 60_000,
    });
    await goToProfileStep(page, "run");
    await expect(page.locator("#artifactList")).toContainText("Issue counts");
    record(
      matrix,
      "Upload run",
      "The custom upload can run through the real backend and produce artifacts.",
      "Upload job completed and generated result previews.",
      await screenshot(page.locator("#artifactList"), "07-upload-run-results.png"),
    );

    await page.locator("#runnerModePath").click();
    await expect(page.locator("#pathRunnerForm")).toBeVisible();
    await openDetails(page, "#profileDeveloperOptions");
    await page.locator("#demoPresetSmall").click();
    await expect(page.locator("#sourceStateBadge")).toContainText("Demo paths");
    await expect(page.locator("#mappingStatus")).toContainText("7/7 tables mapped");
    await expect(page.locator("#llmModeStatus")).toContainText("LLM off");
    await page.locator("#llmModeFake").click();
    await expect(page.locator("#llmModeStatus")).toContainText("Fake");
    await page.locator("#llmModeOpenAI").click();
    await expect(page.locator("#llmModeStatus")).toContainText("OpenAI");
    await page.locator("#llmModeOff").click();
    await expect(page.locator("#llmModeStatus")).toContainText("LLM off");
    await openDetails(page, "#profileDeveloperOptions");
    await page.locator("#runnerModeDatabase").click();
    await expect(page.locator("#databaseRunnerForm")).toBeVisible();
    await expect(page.locator("#runDatabaseProfilerButton")).toBeDisabled();
    await page.locator("#databaseUrlInput").fill("postgresql://profiler:secret@127.0.0.1:5432/demo");
    await page.locator("#databaseTablesInput").fill("customers, orders");
    await expect(page.locator("#profileStepNext")).toBeEnabled();
    await expect(page.locator("#runDatabaseProfilerButton")).toBeDisabled();
    await goToProfileStep(page, "preflight");
    await goToProfileStep(page, "run");
    await expect(page.locator("#runDatabaseProfilerButton")).toBeEnabled();
    await page.locator("#runnerModePath").click();
    await openDetails(page, "#pathCompatibilityOptions");
    await page.locator("#dbmlPathInput").fill("data/demo_small/schema.dbml");
    await page.locator("#csvDirPathInput").fill("data/demo_small/csv");
    await page.locator("#rulesPathInput").fill("data/demo_small/rules.yaml");
    await page.locator("#pathTargetInput").fill("order_reviews.review_score");
    await expect(page.locator("#profileStepNext")).toBeEnabled();
    await expect(page.locator("#runPathProfilerButton")).toBeDisabled();
    record(
      matrix,
      "Advanced controls",
      "LLM report mode toggles and developer DB validation work without requiring a real DB.",
      "Fake/OpenAI/off toggles update state, DB source stays disabled until URL/tables are supplied.",
      await screenshot(page.locator("#runner"), "08-advanced-controls.png"),
    );

    await goToProfileStep(page, "preflight");
    await goToProfileStep(page, "run");
    await expect(page.locator("#runPathProfilerButton")).toBeEnabled();
    await page.locator("#runPathProfilerButton").click();
    await expect(page.locator("#runnerMessage")).toContainText("Run complete", {
      timeout: 60_000,
    });
    await expect(page.locator("#dashboardStatusBadge")).toContainText("succeeded dashboard", {
      timeout: 20_000,
    });
    await expect(page.locator("#dashboardIssueCount")).toContainText("15/15 issues");
    await expect(page.locator("#stageList")).toContainText("Render Markdown and HTML reports");
    await expect(page.locator("#artifactList")).toContainText("Data-quality readiness");
    await expect(page.locator("#qualityGates")).toContainText("Quality Gates");
    await expect(page.locator("#dashboard")).toContainText("Review Issues");
    await expect(page.locator("#todosStatus")).toContainText("grouped todos");
    await expect(page.locator("#reportExportStatus")).toContainText("Reports ready");
    await expect(page.locator("#tableImpactStatus")).toContainText("tables from table_assessments.json");
    await expect(page.locator("#dashboardGraphStatus")).toContainText("Runtime artifact context");
    await expect(page.locator("#dashboardArtifactLinks")).toContainText("quality_gates.json");
    record(
      matrix,
      "Small demo run",
      "Local path Small demo completes and populates all review/report/artifact surfaces.",
      "Run completed with stages, artifacts, gates, issues, todos, report/export, table readiness, graphs, and developer artifact links.",
      await screenshot(page.locator("#dashboard"), "09-small-demo-review.png"),
    );

    await page.locator('[data-dashboard-kind="issue"][data-dashboard-value="ISSUE-0009"]').click();
    await expect(page.locator("#dashboardDrilldownMeta")).toContainText("ISSUE-0009");
    await expect(page.locator("#dashboardDrilldown")).toContainText("Action plan");
    await page.locator('[data-action-plan-export="markdown"]').click();
    await expect(page.locator(".issue-export-status")).toContainText("Copied Markdown for ISSUE-0009.");
    await page.locator('[data-action-plan-export="csv"]').click();
    await expect(page.locator(".issue-export-status")).toContainText("Copied CSV row for ISSUE-0009.");
    await page.locator('[data-action-plan-export="json"]').click();
    await expect(page.locator(".issue-export-status")).toContainText("Copied JSON for ISSUE-0009.");
    await page.locator('[data-issue-llm-provider="fake"]').click();
    await page.locator("[data-issue-llm-run]").click();
    await expect(page.locator(".issue-llm-message")).toContainText("Fake enrichment ready for ISSUE-0009", {
      timeout: 20_000,
    });
    await page.locator('[data-issue-llm-provider="openai"]').click();
    await page.locator("[data-issue-llm-run]").click();
    await expect(page.locator(".issue-llm-message")).toContainText(/OPENAI_API_KEY|OpenAI/i, {
      timeout: 20_000,
    });
    await expect(page.locator("#dashboardDrilldown")).toContainText(/unavailable|succeeded/i);
    record(
      matrix,
      "Issue drawer interactions",
      "Issue copy buttons and fake/OpenAI selected-issue enrichment show clear visible states.",
      "Markdown/CSV/JSON copy statuses appeared, fake enrichment succeeded, and OpenAI showed a visible provider state.",
      await screenshot(page.locator("#dashboardDrilldown"), "10-issue-drawer-llm-copy.png"),
    );

    await page.locator("#todosFilterVerify").click();
    await expect(page.locator("#todos")).toContainText("Rerun the profiler on the corrected CSV + DBML inputs.");
    await page.locator('[data-todo-export="fix_data"]').click();
    await expect(page.locator("#reportExportMessage")).toContainText("Copied Fix data Markdown.");
    await page.locator('[data-todo-export="verify_after_fix"]').click();
    await expect(page.locator("#reportExportMessage")).toContainText("Copied Verify after fix Markdown.");
    const reportHref = await page.locator('#reportExport a[href*="report.html"]').first().getAttribute("href");
    const reportPage = await context.newPage();
    await reportPage.goto(new URL(reportHref, page.url()).toString());
    await expect(reportPage.locator("h2", { hasText: "Quality Gates" })).toBeVisible();
    await expect(reportPage.locator("h2", { hasText: "Issue Action Plans" })).toBeVisible();
    await reportPage.close();
    record(
      matrix,
      "Todos and report export",
      "Todo filters and report export copy buttons work, and report.html opens with fixed sections.",
      "Verify filter showed expected todos, both copy buttons reported success, and report.html opened.",
      await screenshot(page.locator("#reportExport"), "11-report-export-copy.png"),
    );

    await page.locator("#dashboardGraphModeRelationship").click();
    await page.locator("#dashboardGraphInvalidOnlyToggle").check();
    await page.locator("#dashboardGraphDisplayFull").click();
    await expect(page.locator("#dashboardGraphStatus")).toContainText("Relationship graph");
    await expect(page.locator("#dashboardGraphStatus")).toContainText("invalid/warning only");
    const graphNode = page.locator('#dashboardGraphSvg [data-graph-node-id^="relationship-edge:"]').first();
    await expect.poll(async () => graphNode.count()).toBeGreaterThan(0);
    await graphNode.focus();
    await graphNode.press("Enter");
    await expect(page.locator("#dashboardGraphDrilldown")).toContainText("relationship_graph.json");
    await page.locator("#dashboardGraphResetView").click();
    await expect(page.locator("#dashboardGraphDisplayOverview")).toHaveAttribute("aria-pressed", "true");
    record(
      matrix,
      "Graph controls",
      "Graph mode, invalid-only filter, keyboard selection, and reset work.",
      "Relationship graph full mode selected an edge with Enter, drilldown loaded, and reset returned to Overview.",
      await screenshot(page.locator(".dashboard-graph"), "12-graph-controls.png"),
    );

    await page.reload();
    await page.locator("#profileFlowButton").click();
    await expect(page.locator('[data-profile-step-card="review"]')).toHaveAttribute("aria-disabled", "false", {
      timeout: 10_000,
    });
    await page.locator('[data-profile-step-card="review"]').click();
    await expect(page.locator("#profileFlow")).toHaveAttribute("data-profile-step", "review");
    await expect(page.locator("#runHistoryStatus")).toContainText("History ready", {
      timeout: 10_000,
    });
    await page.locator("[data-run-history-job-id]").first().click();
    await expect(page.locator("#dashboardStatusBadge")).toContainText("succeeded dashboard", {
      timeout: 20_000,
    });
    await expect(page.locator("#selectedRunTimelineStatus")).toContainText("8 stages");
    record(
      matrix,
      "Run history reload",
      "A clean reload can select a persisted run and restore dashboard/timeline state.",
      "History listed generated runs; selecting one restored the succeeded dashboard and 8-stage timeline.",
      await screenshot(page.locator("#runHistory"), "13-run-history-reload.png"),
    );

    const rawCsvArtifactRequests = artifactRequests.filter(
      (url) => url.endsWith(".csv") && !url.includes("/samples/"),
    );
    expect(rawCsvArtifactRequests).toEqual([]);
    record(
      matrix,
      "Raw CSV privacy",
      "Dashboard artifact fetches do not request raw source CSV files outside bounded samples.",
      "No raw non-sample CSV artifact URLs were requested during QA run.",
      "",
    );
  } catch (error) {
    const failureShot = await screenshot(page, "failure.png", { fullPage: true }).catch(() => "");
    matrix.push({
      flow: "QA run failure",
      expected: "All required scenarios pass.",
      actual: error.message,
      screenshot_path: failureShot,
      result: "fail",
    });
    throw error;
  } finally {
    writeMatrix(matrix);
  }
});

async function screenshot(target, filename, options = {}) {
  const screenshotPath = path.join(qaDir, filename);
  await target.screenshot({ path: screenshotPath, ...options });
  return screenshotPath;
}

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

async function openDetails(page, selector) {
  const details = page.locator(selector);
  if (!(await details.evaluate((element) => element.open))) {
    await details.locator("summary").click();
  }
}

function record(matrix, flow, expected, actual, screenshotPath) {
  matrix.push({
    flow,
    expected,
    actual,
    screenshot_path: screenshotPath,
    result: "pass",
  });
}

function writeMatrix(matrix) {
  fs.mkdirSync(qaDir, { recursive: true });
  fs.writeFileSync(
    path.join(qaDir, "qa-matrix.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), matrix }, null, 2),
  );
  const lines = [
    "# VSF Data Profiler UI QA Matrix",
    "",
    "| Flow | Expected result | Actual result | Screenshot | Result |",
    "| --- | --- | --- | --- | --- |",
    ...matrix.map((row) =>
      [
        row.flow,
        row.expected,
        row.actual,
        row.screenshot_path ? `\`${row.screenshot_path}\`` : "",
        row.result,
      ]
        .map(markdownCell)
        .join(" | "),
    ).map((row) => `| ${row} |`),
    "",
  ];
  fs.writeFileSync(path.join(qaDir, "qa-matrix.md"), lines.join("\n"));
}

function markdownCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
