# US-073 Guided CSV + DBML Data-Quality Profiler Progress

## 2026-06-23 Goal 1 Product Contract Alignment

Status: validated for Goal 1.

Scope completed:

- Reframed README, product contract, architecture, demo, release notes, and
  interface-design guidance around the guided CSV+DBML data-quality profiler.
- Kept existing pipeline behavior and artifact names intact while demoting
  rules config, association artifacts, database connectors, lineage/runtime
  graph artifacts, static preview, Olist paths, package export, and optional
  LLM summaries to compatibility or developer surfaces.
- Updated the main web UI copy to prioritize CSV+DBML profiling, issue review,
  table readiness, deterministic reports, and developer artifact links.
- Updated generated report/package templates and optional LLM artifact copy so
  user-facing output no longer presents Smart EDA, L4 narratives, target
  influence, or lineage as the main workflow.
- Aligned focused static/unit/E2E assertions with ADR 0030 and the US-073 Goal
  1 boundary.

Explicit non-goals preserved:

- No pipeline removal.
- No staged preflight gate, issue inbox redesign, action-plan workflow, LLM
  enrichment workflow, evaluation UI, or full workflow redesign implementation.
- No removal of compatibility/debug artifacts such as `influence.json`,
  `lineage_graph.json`, `l4_report.md`, or connector metadata.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_demo_small.py tests/test_export_package.py tests/test_llm_narrative.py tests/test_web_runner.py`
- `.venv/bin/pytest -q tests/test_postgres_connector.py tests/test_postgres_acceptance.py`
  (5 passed, 2 skipped)
- Product-facing stale-copy scan for old Smart EDA/L4/influence/lineage/static
  preflight/dashboard positioning returned no matches.
- `git diff --check`

## 2026-06-23 Goal 10 Built-In Evaluate Benchmark Flow

Status: implemented and browser-validated.

Scope completed:

- Replaced the Evaluate placeholder with a built-in curated dataset catalog and
  local-only evaluation run flow; no arbitrary upload controls are present in
  the Evaluate surface.
- Added two deterministic seeded-fault evaluation datasets:
  `retail_orders_seeded_faults` and `support_tickets_seeded_faults`.
- Added deterministic `ground_truth_issues.json`,
  `baseline_comparison.json`, and `evaluation_summary.json` artifacts.
- Compared VSF findings against ground-truth issue signatures, expected bad
  row counts, and expected duplicate relationship occurrences.
- Added Great Expectations baseline state handling. In this environment Great
  Expectations is unavailable, so native baseline rows are labeled
  `unavailable`; checks not covered by the baseline are labeled
  `not_covered` and are not marked as failed.
- Added compact UI rows for correctness, usefulness/actionability, baseline
  gaps, added-value checks, and evaluation artifact links.
- Added `/api/evaluation-catalog` and `/api/evaluations` to the local web
  runner, including history/source-mode metadata and canonical artifact links.

Explicit non-goals preserved:

- No arbitrary Evaluate uploads.
- No LLM, OpenAI, fake-provider, or provider behavior changes.
- No benchmark/performance claims.
- No removal or rename of existing Profile artifacts, reports, dashboard
  artifacts, or export-package compatibility artifacts.
- No change to the Profile my data upload/path/database flows.

Validation completed:

- `scripts/bin/harness-cli query tools --capability great-expectations --status present`
  returned no present tool rows.
- `.venv/bin/python` import check confirmed `great_expectations` is not
  installed, and the generated artifacts show `status: unavailable`.
- `node --check web/app.js`
- `node --check tests/e2e/web-dashboard.spec.js && node --check playwright.config.js`
- `.venv/bin/pytest -q tests/test_evaluation_benchmark.py tests/test_web_ui_static.py`
  (8 passed)
- `.venv/bin/pytest -q tests/test_web_runner.py` (23 passed)
- Regenerated and inspected:
  `outputs/us073_goal10_probe/retail/artifacts/evaluation_summary.json`,
  `baseline_comparison.json`, and `ground_truth_issues.json`.
- `PATH="$PWD/.venv/bin:$PATH" VSF_E2E_PORT=8777 npm run test:e2e:dashboard`
  (1 passed)
- Screenshots generated:
  `outputs/us073_goal10/evaluate-dataset-choice.png` and
  `outputs/us073_goal10/evaluate-comparison-summary.png`.
- `scripts/bin/harness-cli story verify US-073` (pass)

## 2026-06-23 Goal 9 Fixed Report And Export Surface

Status: validated.

Scope completed:

- Replaced the generated Markdown and HTML report body with deterministic fixed
  sections: Run Summary, Quality Gates, Table Overview, Column Issue Matrix,
  Issue Action Plans, Todos, Developer Artifacts, and Evaluation Summary.
- Built report content from structured generated artifacts only:
  `run_summary.json`, `quality_gates.json`, `issues.json`,
  `profile_summary.json`, `table_assessments.json`,
  `issue_action_plans.json`, and `issue_todos.json`.
- Added explicit missing/partial states for unavailable quality gates, action
  plans, todos, preflight review, and evaluation artifacts.
- Rendered action-plan finding values, Fix data checklist, Verify after fix
  checklist, guidelines, evidence coverage, and actionability metrics.
- Split todos into Fix data and Verify after fix in generated reports and the
  web export surface.
- Updated the offline package index to use the same fixed report sections and a
  Report / Export section before Developer Artifacts.
- Added a web Report / Export section after Todos with report links first,
  Markdown todo copy exports, and raw JSON/runtime artifacts kept in Developer
  Artifacts.
- Demoted raw JSON links to Developer Artifacts in generated report/package
  normal reading paths; a regenerated artifact-position check found no early
  `quality_gates.json`, `issue_action_plans.json`, `issue_todos.json`, or
  `run_summary.json` before Developer Artifacts in `report.md`, `report.html`,
  or package `index.html`.

Explicit non-goals preserved:

- No LLM enrichment, OpenAI/fake provider changes, or provider behavior.
- No Evaluate benchmark implementation.
- No run-history behavior changes.
- No artifact filename or package compatibility break.
- No new PDF engine or external report service.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_demo_small.py tests/test_export_package.py tests/test_web_ui_static.py tests/test_web_runner.py`
  (35 passed)
- `make demo-small`
- `PATH="$PWD/.venv/bin:$PATH" vsf-profiler package --input outputs/demo_small --output outputs/demo_small_package --zip --pdf --force`
- `VSF_E2E_PORT=8775 npm run test:e2e:dashboard` (1 passed)
- Screenshots captured by Playwright:
  `outputs/us073_goal9/report-export-surface.png` and
  `outputs/us073_goal9/generated-report-fixed-sections.png`
- `git diff --check`

## 2026-06-23 Goal 2 Two-Flow First-Screen Shell

Status: validated for Goal 2.

Scope completed:

- Added a first-screen workflow choice with explicit `Profile my data` and
  `Evaluate tool` entry points.
- Kept the existing CSV+DBML upload/path/database runner, runtime stages,
  issue review, table readiness, schema context, and developer artifact links
  behind the Profile flow.
- Added a visible Evaluate shell for future built-in faulty dataset comparison
  without upload controls, benchmark execution, or evaluation claims.
- Hid old runner actions from the initial decision surface; Reset demo,
  Visualize DBML, upload controls, local path controls, database controls, and
  developer LLM controls appear only after choosing Profile.
- Updated static UI and Playwright assertions for the two entry points and the
  no-upload Evaluate boundary.

Explicit non-goals preserved:

- No preflight warning acceptance.
- No table-first issue inbox redesign.
- No structured action plans or LLM enrichment flow.
- No real evaluation benchmark or Great Expectations integration.
- No backend route or pipeline removal.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_ui_static.py`
- `PATH="$PWD/.venv/bin:$PATH" VSF_E2E_PORT=8767 npm run test:e2e:dashboard`
- Screenshots captured by Playwright:
  `outputs/us073_goal2/first-screen-flow-choice.png` and
  `outputs/us073_goal2/evaluate-shell.png`
- `git diff --check`

## 2026-06-23 Goal 3 Profile Preflight Review Gate

Status: validated for Goal 3.

Scope completed:

- Added visible Profile stages: Connect, Preflight Review, and Run.
- Added a mandatory Profile preflight review panel before the runner controls.
- Run buttons now stay disabled until there are no blockers and every
  reviewable warning has been accepted.
- Separated blockers from warnings. Blockers cover missing DBML, DBML parse
  failure, missing CSV/local CSV source, unreadable CSV source, zero mapped
  tables, and conflicting mappings where detectable in the browser state.
- Added warnings for missing table CSVs, extra CSVs, missing or extra columns,
  ambiguous mappings, and manual mappings where detectable.
- Added visible per-warning acceptance state plus an accept-all convenience for
  multi-warning review.
- Carried accepted preflight review state into upload, path, and developer
  database run requests, and persisted it as `preflight_review.json` when a
  backend run starts.
- Kept the primary Profile decision surface CSV+DBML focused by collapsing
  legacy demo, developer LLM artifact, developer database source, rules, and
  target/association controls behind advanced or compatibility details.

Explicit non-goals preserved:

- No issue inbox redesign.
- No LLM action plans or report redesign.
- No benchmark comparison or real Evaluate flow.
- No backend route removal or database connector redesign.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py`
  (20 passed)
- `VSF_E2E_PORT=8768 npm run test:e2e:dashboard` (1 passed)
- Screenshots captured by Playwright:
  `outputs/us073_goal3/profile-preflight-blocked.png` and
  `outputs/us073_goal3/profile-preflight-warnings-accepted.png`
- `git diff --check`

## 2026-06-23 Goal 4 Table-First Review Issues Inbox

Status: validated for Goal 4.

Scope completed:

- Made Review Issues the default post-run dashboard surface after a successful
  Profile run.
- Replaced the chart-first dashboard grid with an issue inbox grouped by
  Table -> Column -> Issue.
- Derived the inbox view model from existing generated artifacts, primarily
  `issues.json` and `table_assessments.json`, without changing profiler or
  route compatibility.
- Separated schema/table-level issue groups from column issue groups in the
  presenter model.
- Attached relationship/FK findings to the child table and FK column when the
  existing issue artifact provides those fields, and showed parent context in
  the detail drawer.
- Labelled numeric outliers as review warnings in the issue label/status path.
- Added an issue detail drawer with Where, What happened, Evidence, Why it
  matters, and How to fix sections.
- Rendered evidence values as labelled rows with raw value and meaning,
  including generated sample-row evidence where available.
- Used product status labels: Blocked, Needs Review, Usable With Caution, and
  Clean.
- Kept raw JSON/developer artifact links out of the main issue review surface
  and left them under Developer artifact sources / developer schema context.

Explicit non-goals preserved:

- No LLM enrichment or action-plan generator.
- No global todo export.
- No report/PDF redesign.
- No Evaluate benchmark.
- No backend route or artifact contract removal.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py`
  (20 passed)
- `VSF_E2E_PORT=8769 npm run test:e2e:dashboard` (1 passed)
- Screenshots captured by Playwright:
  `outputs/us073_goal4/review-issues-default.png` and
  `outputs/us073_goal4/review-issue-detail-drawer.png`
- `git diff --check`

## 2026-06-23 Goal 5 Deterministic Issue Action Plans

Status: validated for Goal 5.

Scope completed:

- Added deterministic `issue_action_plans.json` generation from existing
  `issues.json` issue records and `table_assessments.json` table evidence.
- Wrote one action plan per detected issue with finding summary, evidence
  values, Fix data checklist, Verify after fix checklist, guidelines, priority,
  `source=deterministic`, evidence coverage, actionability score, and
  human-review state.
- Kept the action-plan generator conservative: incomplete issue context produces
  a visible human-review plan instead of invented remediation details.
- Registered `issue_action_plans.json` with the web runner dashboard artifact
  payload and canonical artifact discovery.
- Rendered the issue detail drawer action plan as structured sections:
  metrics, finding values, Fix data checklist, Verify after fix checklist, and
  guidelines.
- Added visible metric explanations and title tooltips for evidence coverage
  and actionability score.
- Documented the artifact in README and architecture artifact/module lists.
- Preserved compatibility by copying the artifact into export packages when
  present without making old output folders fail package export.

Explicit non-goals preserved:

- No LLM enrichment, provider selection changes, or OpenAI/fake provider work.
- No global Todos tab or todo export implementation.
- No report/PDF redesign.
- No Evaluate benchmark implementation.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_runner.py tests/test_web_ui_static.py`
  (21 passed)
- `.venv/bin/pytest -q tests/test_demo_small.py tests/test_export_package.py`
  (9 passed)
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py`
  (21 passed)
- `VSF_E2E_PORT=8770 npm run test:e2e:dashboard` (1 passed)
- Screenshot captured by Playwright:
  `outputs/us073_goal5/issue-action-plan-drawer.png`
- `git diff --check`

## 2026-06-23 Goal 6 Global Todos And Issue-Level Exports

Status: validated for Goal 6.

Scope completed:

- Added deterministic `issue_todos.json` generation from
  `issue_action_plans.json`.
- Split todos into `Fix data` and `Verify after fix` groups.
- Grouped duplicate todos only when todo type and text match, while preserving
  every occurrence's table, columns, issue ID, severity, priority, and finding
  summary.
- Exposed `issue_todos.json` through the web runner dashboard artifact payload,
  canonical artifact discovery, package copy path, and artifact audit optional
  path.
- Added a global read-only Todos view after a run with filters for All, Fix
  data, and Verify after fix.
- Added issue-level copy/export controls in the action-plan drawer for
  Markdown, CSV row, and structured JSON.
- Added clear missing/empty states for unavailable todo artifacts and no-todo
  runs.
- Documented `issue_todos.json` in README and architecture docs.

Explicit non-goals preserved:

- No LLM enrichment, OpenAI/fake provider changes, or provider behavior.
- No quality-gate implementation.
- No report/PDF redesign.
- No Evaluate benchmark implementation.
- No todo status editing, assignment, comments, or workflow state.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_runner.py tests/test_web_ui_static.py`
  (22 passed)
- `.venv/bin/pytest -q tests/test_demo_small.py tests/test_export_package.py`
  (9 passed)
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py tests/test_export_package.py`
  (29 passed)
- `VSF_E2E_PORT=8771 npm run test:e2e:dashboard` (1 passed)
- `jq` audit of the E2E-generated `issue_todos.json` confirmed
  `source=deterministic`, `derived_from=issue_action_plans.json`, 53 todo
  groups, 106 occurrences, and a duplicate verify todo with 15 issue
  occurrences preserving context.
- Screenshots captured by Playwright:
  `outputs/us073_goal6/global-todos-tab.png` and
  `outputs/us073_goal6/issue-export-copy-controls.png`
- `git diff --check`
- Harness trace #88 recorded with detailed tier evidence.

## 2026-06-23 Goal 7 Deterministic Quality Gates

Status: validated for Goal 7.

Scope completed:

- Added deterministic `quality_gates.json` generation from existing structured
  artifacts: `preflight_review.json` when present, `issues.json`,
  `table_assessments.json`, `issue_action_plans.json`, `issue_todos.json`, and
  `dataset_verdict.json`.
- Added the four required gates: Can run analysis, Can trust joins, Needs
  cleanup before sharing, and Outliers need review.
- Constrained gate statuses to the approved labels: Clean, Needs Review,
  Usable With Caution, and Blocked.
- Added short explanations, evidence values, linked issue/table/column context,
  and next actions pointing to Review Issues or Todos.
- Persisted web-runner preflight review before pipeline execution so
  `quality_gates.json` can include that evidence.
- Exposed `quality_gates.json` through dashboard artifact discovery, canonical
  artifact paths, export package inclusion when present, and artifact audit
  path consistency checks.
- Added a compact post-run Quality Gates section before Review Issues, with
  visible status explanations, evidence values, linked context, and missing or
  no-gate states.
- Documented the artifact in README, architecture, product, and demo artifact
  surfaces.

Explicit non-goals preserved:

- No LLM enrichment, OpenAI/fake provider changes, or provider behavior.
- No report/PDF redesign.
- No Evaluate benchmark implementation.
- No removal or rename of `dataset_verdict.json` or `table_assessments.json`.
- No new product status vocabulary beyond the approved four labels.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_quality_gates.py tests/test_web_ui_static.py tests/test_web_runner.py`
  (26 passed)
- `.venv/bin/pytest -q tests/test_demo_small.py tests/test_export_package.py`
  (9 passed)
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py tests/test_demo_small.py tests/test_export_package.py`
  (32 passed)
- `VSF_E2E_PORT=8772 npm run test:e2e:dashboard` (1 passed)
- `jq` audit of the E2E-generated `quality_gates.json` confirmed
  `source=deterministic`, 4 gates, 3 Blocked gates, 1 Clean gate, and next
  actions pointing to Review Issues or Todos.
- Screenshot captured by Playwright:
  `outputs/us073_goal7/quality-gates-summary.png`
- `git diff --check`
- Harness trace #89 recorded with detailed tier evidence.

## 2026-06-23 Goal 8 Persistent Run History And Stage Timeline

Status: validated for Goal 8.

Scope completed:

- Added a web-runner `/api/history` endpoint backed by scanning
  `outputs/web_runs` folders rather than storing UI state in an app database.
- Reconstructed historical jobs from existing run folders so prior runs remain
  addressable through the existing `/api/jobs/<job_id>/dashboard` and artifact
  URL contract after a server restart.
- Built run history entries from `run_summary.json`, `run_events.jsonl`,
  `quality_gates.json`, `issues.json`, and filesystem metadata with graceful
  partial handling for older or failed folders.
- Added run-history UI in the Profile flow with run id/name, status, created
  and finished time where available, source mode, issue count, gate summary,
  stage count, and failed stage count.
- Added selected-run loading so prior runs populate the existing Review Issues,
  Quality Gates, Todos, Table Readiness, Schema Context, and Developer
  Artifacts views from generated artifacts.
- Added a selected run stage timeline showing stage name, status, duration,
  skip reason, and failure details where available.
- Kept current live run event streaming and generated dashboard artifact
  loading paths intact.

Explicit non-goals preserved:

- No LLM enrichment, OpenAI/fake provider changes, or provider behavior.
- No report/PDF redesign.
- No Evaluate benchmark implementation.
- No upload behavior changes.
- No application database for run history.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_runner.py -k "history or path_job_http_endpoint"`
  (3 passed)
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py -k "history or path_job_http_endpoint or web_ui"`
  (8 passed)
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py tests/test_demo_small.py`
  (29 passed)
- `VSF_E2E_PORT=8773 npm run test:e2e:dashboard` (1 passed)
- Screenshots captured by Playwright:
  `outputs/us073_goal8/run-history-after-refresh.png` and
  `outputs/us073_goal8/selected-run-stage-timeline.png`
- `git diff --check`

## 2026-06-23 Single-Flow Review Layout Refinement

Status: validated as a UI refinement after Goal 7 feedback.

Scope completed:

- Removed the primary two-column review presentation from the guided web UI.
- Changed flow choice, upload/connect, preflight review, runtime review,
  dashboard review, quality gates, issue rows, issue detail drawer, evidence
  values, action-plan metrics, todos, and table readiness surfaces to read as a
  single vertical review stack.
- Kept controls, artifact contracts, run behavior, deterministic action plans,
  todos, quality gates, and developer compatibility surfaces unchanged.
- Added a reusable interface-system decision for the Single-Flow Review Stack
  so later goals do not reintroduce side-by-side review layouts.
- Added a static UI guard that checks the main review selectors use single-flow
  grid columns.

Explicit non-goals preserved:

- No artifact contract changes.
- No LLM enrichment, OpenAI/fake provider changes, or provider behavior.
- No report/PDF redesign.
- No Evaluate benchmark implementation.
- No run-history implementation.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_web_ui_static.py` (5 passed)
- `VSF_E2E_PORT=8774 npm run test:e2e:dashboard` (1 passed)
- Visual review of regenerated screenshots:
  `outputs/us073_goal4/review-issues-default.png`,
  `outputs/us073_goal4/review-issue-detail-drawer.png`, and
  `outputs/us073_goal6/global-todos-tab.png`
- `git diff --check`

## 2026-06-23 Goal 9 Report Compactness Refinement

Status: validated after report-length audit.

Scope completed:

- Changed generated Markdown/HTML reports so Issue Action Plans render as a
  compact summary table plus the first 5 highest-priority expanded plans.
- Kept full deterministic action-plan evidence in `issue_action_plans.json`
  and added explicit copy showing how many plans were hidden from the main
  report.
- Changed generated report Todos so Fix data and Verify after fix are still
  separate lists, but each list shows only the first 10 groups and points to
  `issue_todos.json` for the full grouped todo artifact.
- Applied the same compact-reading pattern to the offline package `index.html`.
- Changed report/package Todo HTML from a two-column block to a vertical stack,
  preserving the single-flow review decision.
- Updated interface-design memory with a Compact Report Layering pattern.
- Updated tests so early `issue_action_plans.json` and `issue_todos.json`
  mentions are allowed only as explicit full-evidence pointers, while Developer
  Artifacts still lists the canonical files.

Explicit non-goals preserved:

- No artifact filename changes.
- No action-plan or todo generation behavior changes.
- No LLM enrichment, OpenAI/fake provider changes, or provider behavior.
- No Evaluate benchmark implementation.
- No new report/PDF rendering engine.

Validation completed:

- `node --check web/app.js`
- `.venv/bin/pytest -q tests/test_demo_small.py tests/test_export_package.py tests/test_web_ui_static.py tests/test_web_runner.py`
  (35 passed)
- `make demo-small`
- `vsf-profiler package --input outputs/demo_small --output outputs/demo_small_package --zip --pdf --force`
- `VSF_E2E_PORT=8776 npm run test:e2e:dashboard` (1 passed)
- Regenerated report sizes:
  `outputs/demo_small/report.md` = 426 lines / 27,849 bytes,
  `outputs/demo_small/report.html` = 503 lines / 47,225 bytes,
  `outputs/demo_small_package/index.html` = 623 lines / 48,277 bytes.
- Report compactness evidence: 15 plans total, 5 expanded in the report, 10
  additional plans linked through `issue_action_plans.json`; 28 Fix data todo
  groups and 25 Verify after fix todo groups compacted to 10 visible groups
  each with remaining counts linked through `issue_todos.json`.
- Screenshots updated by Playwright:
  `outputs/us073_goal9/report-export-surface.png` and
  `outputs/us073_goal9/generated-report-fixed-sections.png`.
- `git diff --check`

## 2026-06-23 Goal 11 On-Demand Issue LLM Enrichment

Status: implemented and validated.

Scope completed:

- Added selected-issue LLM enrichment as an on-demand drawer add-on that appears
  only after a concrete deterministic issue action plan is selected.
- Added `issue_llm_enrichments.json` as an optional artifact with provider,
  issue id, status, guardrail result, sanitized request summary, structured
  response, error state, source artifacts, and human-review requirement.
- Added deterministic fake issue enrichment for CI/demo and a separate OpenAI
  issue provider that uses the Responses API with a strict JSON schema.
- Kept `issue_action_plans.json`, todos, quality gates, severity, readiness,
  and Evaluate pass/fail semantics deterministic and unchanged.
- Built LLM context from generated selected-issue artifacts plus bounded
  `samples/*.csv` evidence only. Full/raw source CSV files are never sent.
- Made OpenAI missing-key, provider error, timeout/transport error, invalid
  schema, and guardrail failure persist visible human-review states. OpenAI mode
  does not silently fall back to fake.
- Rendered drawer sections for Why this was flagged, Extra fix suggestion,
  Extra verification, and Human review needed.
- Exposed optional enrichment evidence through Generated results, Developer
  artifacts, and Report / Export links without putting it in the main report
  body.

Explicit non-goals preserved:

- No global long-form LLM report narrative as the primary flow.
- No deterministic action-plan, todo, quality-gate, readiness, severity, or
  benchmark scoring changes from LLM output.
- No provider fallback from selected OpenAI to fake.
- No raw source CSV or unbounded row prompt context.

Validation completed:

- `node --check web/app.js`
- `node --check playwright.config.js`
- `.venv/bin/pytest -q tests/test_llm_issue_enrichment.py` (5 passed)
- `.venv/bin/pytest -q tests/test_web_runner.py` (24 passed)
- `.venv/bin/pytest -q tests/test_web_ui_static.py` (5 passed)
- `.venv/bin/pytest -q tests/test_llm_narrative.py tests/test_web_runner.py tests/test_web_ui_static.py tests/test_demo_small.py tests/test_llm_issue_enrichment.py`
  (57 passed)
- `VSF_E2E_PORT=8778 npm run test:e2e:dashboard` (1 passed)
- Screenshots generated:
  `outputs/us073_goal11/issue-drawer-before-llm-enrichment.png`,
  `outputs/us073_goal11/issue-drawer-after-fake-enrichment.png`, and
  `outputs/us073_goal11/issue-drawer-openai-failure.png`
- `git diff --check`

## 2026-06-23 Goal 12 Final Demo Readiness Pass

Status: validated.

Scope completed:

- Rewrote the live demo guide around the current Profile my data, Review
  Issues / Quality Gates / Todos, Report / Export, Evaluate tool, selected
  issue fake enrichment, and OpenAI unavailable human-review path.
- Updated README web-runner copy so it no longer says the staged Profile /
  Evaluate redesign is unfinished.
- Distinguished compatibility LLM reports from selected-issue LLM enrichment
  in the Profile advanced controls, generated-result labels, report/package
  labels, and artifact labels.
- Kept deterministic artifact semantics, issue ids, severity labels, quality
  gates, Evaluate scoring, benchmark pass/fail logic, run history, report
  compactness, and package artifact names unchanged.
- Updated the dashboard E2E to refresh the final Goal 12 screenshot set under
  `outputs/us073_goal12/`.

Explicit non-goals preserved:

- No new product flow beyond Profile my data, Evaluate tool, and selected-issue
  LLM enrichment.
- No real OpenAI or Great Expectations requirement for the default demo path.
- No arbitrary Evaluate uploads.
- No long LLM report narrative as the primary user path.
- No raw JSON-first user flow; developer artifacts remain available after
  human-facing report, todo, issue, and evaluation surfaces.

Validation completed:

- Harness optional tool checks for `browser-automation`, `visual-verification`,
  `great-expectations`, and `openai-provider` returned no present rows, so the
  demo proof used repo-local Playwright, explicit GE unavailable state, and
  OpenAI missing-key unavailable state.
- `node --check web/app.js`
- `node --check tests/e2e/web-dashboard.spec.js`
- `node --check playwright.config.js`
- `.venv/bin/pytest -q tests/test_web_ui_static.py tests/test_web_runner.py tests/test_demo_small.py tests/test_export_package.py tests/test_evaluation_benchmark.py tests/test_llm_issue_enrichment.py tests/test_llm_narrative.py`
  (66 passed)
- `PATH="$PWD/.venv/bin:$PATH" make demo-small` (15 issues)
- `PATH="$PWD/.venv/bin:$PATH" vsf-profiler package --input outputs/demo_small --output outputs/demo_small_package --zip --pdf --force`
- `VSF_E2E_PORT=8781 npm run test:e2e:dashboard` (1 passed)
- Targeted stale-copy scan for old placeholder/framing phrases returned no
  matches across README, demo/product docs, current web UI, templates, and
  touched tests.
- Visual inspection completed for:
  `outputs/us073_goal12/first-screen-two-flow-choice.png`,
  `outputs/us073_goal12/profile-post-run-review-surface.png`,
  `outputs/us073_goal12/evaluate-comparison-summary.png`,
  `outputs/us073_goal12/issue-drawer-after-fake-llm-enrichment.png`,
  `outputs/us073_goal12/issue-drawer-openai-unavailable.png`, and
  `outputs/us073_goal12/report-export-surface.png`.
- `git diff --check`
- `scripts/bin/harness-cli story verify US-073` (pass)

## 2026-06-23 Goal 13 Release Acceptance Hardening

Status: validated.

Scope completed:

- Audited the completed guided profiler release surfaces end to end: Profile my
  data, Evaluate tool, selected-issue LLM enrichment, compact reports, export
  packages, demo docs, architecture docs, generated artifacts, and Harness
  evidence.
- Kept the work to release-readiness hardening. No new product flow or core
  deterministic scoring semantics were added.
- Added package/export allow-list coverage for optional Goal 10/11 evidence:
  `issue_llm_enrichments.json`, `ground_truth_issues.json`, and
  `baseline_comparison.json` are now packaged, manifest-listed, zip-listed, and
  linked when present.
- Restored compact compatibility evidence in generated reports through
  `Developer Evidence Summary` rows for connector metadata, runtime execution,
  schema mapping, and relationship cardinality. This keeps legacy acceptance
  evidence visible without returning to long raw artifact sections.
- Renamed the optional compatibility report heading from developer LLM guardrail
  language to `Compatibility LLM Guardrail Artifact`, keeping it distinct from
  selected-issue LLM enrichment.
- Aligned product and architecture docs with the implemented deterministic
  action plans, grouped todos, quality gates, Evaluate comparison artifacts, GE
  unavailable behavior, and selected-issue LLM enrichment boundary.

Explicit non-goals preserved:

- No real OpenAI, Great Expectations, Postgres, or MySQL requirement for
  default release acceptance.
- No stale Smart EDA, placeholder future shell, global LLM narrative, or raw
  JSON-first primary flow.
- No report expansion into long developer-artifact dumps.
- No changes to deterministic issue ids, severity, readiness, quality gates,
  action plans, todos, or Evaluate scoring from LLM output.

Validation completed:

- Harness optional tool checks for `browser-automation`,
  `visual-verification`, `great-expectations`, `openai-provider`, `postgres`,
  `mysql`, `artifact-audit`, and `security-scan` returned no present rows, so
  optional integrations remained clean skips or explicit unavailable states.
- `node --check web/app.js`
- `node --check playwright.config.js`
- `node --check tests/e2e/web-dashboard.spec.js`
- `.venv/bin/python -m py_compile src/vsf_profiler/export_package.py src/vsf_profiler/report_generator.py src/vsf_profiler/web_runner.py src/vsf_profiler/llm_issue_enrichment.py src/vsf_profiler/evaluation_benchmark.py`
- Focused regression after the package/export change:
  `.venv/bin/pytest -q tests/test_export_package.py tests/test_doctor_and_artifact_audit.py tests/test_demo_small.py tests/test_llm_narrative.py`
  (38 passed)
- Focused compatibility regression after compact report evidence fixes:
  `.venv/bin/pytest -q tests/test_mysql_connector.py::test_pipeline_with_mysql_connector_writes_metadata_and_redacts_secrets tests/test_postgres_connector.py::test_pipeline_with_connector_writes_metadata_and_redacts_secrets tests/test_relationship_checker.py::test_extended_relationship_cardinality_composite_fk_and_junction_detection tests/test_schema_artifacts.py::test_pipeline_manual_mapping_override_writes_mapping_evidence_and_reports tests/test_schema_validation.py::test_report_generated_without_target`
  (5 passed)
- `.venv/bin/pytest -q tests/test_export_package.py tests/test_demo_small.py tests/test_llm_narrative.py`
  (30 passed)
- `.venv/bin/pytest -q` (125 passed, 3 skipped)
- `PATH="$PWD/.venv/bin:$PATH" make demo-small` (15 issues)
- `PATH="$PWD/.venv/bin:$PATH" VSF_E2E_PORT=8782 make demo-full`
  (doctor ok, package export ok, artifact audit passed, Playwright E2E 1
  passed)
- `PATH="$PWD/.venv/bin:$PATH" make benchmark-small`
  (`performance_guard_report.json` status `passed`)
- `PATH="$PWD/.venv/bin:$PATH" vsf-profiler package --input outputs/demo_small --output outputs/demo_small_package --zip --pdf --force`
- `VSF_E2E_PORT=8783 npm run test:e2e:dashboard` (1 passed)
- Direct artifact/redaction audit:
  `scripts/verify_vsf_artifacts.py --run-dir outputs/demo_small --package-dir outputs/demo_small_package --zip-path outputs/demo_small_package.zip`
  passed with 24 run artifacts, 26 package artifacts, 87 text files, 45 zip
  entries, and no violations.
- Targeted stale-copy scan for old placeholder/framing phrases returned no
  matches across README, demo/product docs, current web UI, templates,
  report/export code, and touched UI tests.
- Generated report/package compactness evidence:
  `outputs/demo_small/report.md` = 435 lines,
  `outputs/demo_small/report.html` = 48,026 bytes,
  `outputs/demo_small_package/index.html` = 623 lines / 48,277 bytes.
- Screenshot inventory under `outputs/us073_goal12/` contains six current PNGs:
  first screen, Profile post-run review, Evaluate comparison summary,
  selected-issue fake enrichment, selected-issue OpenAI unavailable, and
  Report / Export.
- Visual inspection completed for the Profile review, Evaluate summary, Report
  / Export, fake selected-issue enrichment, and OpenAI unavailable screenshots.
- `git diff --check`
- `scripts/bin/harness-cli story verify US-073` (pass)

Open issue resolved during acceptance:

- The first full pytest run exposed stale compatibility expectations for
  connector metadata, schema mapping method counts, relationship cardinality
  labels, and execution flow headings in generated reports. Goal 13 resolved
  this with the compact `Developer Evidence Summary`, then reran focused
  regressions and the full test suite successfully.
