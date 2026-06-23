# VSF Data Profiler Product Contract

## Product

VSF Data Profiler is a local-first guided data-quality profiler for related
CSV files described by a DBML/schema contract. The product contract is centered
on a user who wants to understand whether a CSV dataset matches its schema,
which tables and columns have quality problems, what evidence supports each
finding, and what cleanup or verification step should happen next.

DuckDB is an internal execution detail used for bounded local scans. Users
interact with CSV files, DBML schema files, issue evidence, table/column
readiness, and deterministic reports.

The current codebase still contains older advanced capabilities. They remain
available for compatibility and developer validation, but they are not the main
product workflow and should not be described as required user surfaces.

## Core Product Contract

The supported user workflow is:

1. Provide one DBML schema and a related CSV dataset.
2. Review CSV-to-table mapping and schema diagnostics.
3. Run the local profiler.
4. Review issues by table, column, issue type, severity, sample evidence, and
   data-quality next step.
5. Review deterministic action plans, grouped todos, and quality gates.
6. Open the deterministic HTML/Markdown report and bounded sample evidence.

The core CLI accepts:

- A DBML/schema file.
- A directory of related CSV files.
- An output directory.
- Optional explicit table-to-CSV mapping overrides when filenames do not match
  table names.

The primary product evidence includes:

- `profile_summary.json`
- `issues.json`
- `schema_parse_report.json`
- `schema_evaluation.json`
- `relationship_graph.json`
- `dataset_verdict.json`
- `table_assessments.json`
- `issue_action_plans.json`
- `issue_todos.json`
- `quality_gates.json`
- `schema_diagram.json`
- `schema_diagram.dbml`
- `run.log`
- `run_events.jsonl`
- `run_summary.json`
- JSON chart specs under `charts/`
- `report.md`
- `report.html`
- bounded issue sample CSV files under `samples/`

`dataset_verdict.json` remains the artifact name for compatibility. In user
copy it represents data-quality readiness: readiness label, risk score, top
blockers, affected tables, and data-quality next steps.

`table_assessments.json` remains the artifact name for compatibility. In user
copy it represents table readiness: role, health score, readiness, issue
counts, affected columns, relationship risks, analysis-impact metadata, and
data-quality next steps.

`quality_gates.json` represents deterministic post-run gate decisions such as
Can run analysis, Can trust joins, Needs cleanup before sharing, and Outliers
need review. Gates use the approved status labels Clean, Needs Review, Usable
With Caution, and Blocked.

`issue_action_plans.json` is the deterministic source of truth for issue-level
remediation guidance. `issue_todos.json` groups fix and verification work from
those action plans while preserving table, column, issue, and priority context.

The web runner also exposes a separate Evaluate tool. It uses built-in faulty
datasets only, writes `ground_truth_issues.json`, `baseline_comparison.json`,
and `evaluation_summary.json`, and renders unavailable or not-covered baseline
states explicitly when Great Expectations is not installed.

## Compatibility And Developer Surfaces

These capabilities are implemented and test-covered, but they are not the
product-facing guided workflow for US-073:

- Optional rules config accepted by the existing CLI/backend.
- Optional target-based association artifacts such as `influence.json` and
  `charts/influence_top_features.json`.
- Local Postgres and MySQL/MariaDB connector modes through the CLI or local web
  runner.
- Additive `lineage_graph.json` artifacts and developer graph context.
- Historical static browser preview deployment for DBML/CSV mapping only.
- Legacy Olist sample paths that require Kaggle credentials.
- `vsf-profiler package` export of an existing output directory into an
  offline package.
- `vsf-profiler doctor`, `make demo-full`, artifact audit commands, and
  benchmark commands used for release-candidate validation.
- Optional guarded LLM summary artifacts. When enabled, `l4_report.md` and
  `guardrail_report.json` are generated from structured artifacts only.
- Optional selected-issue LLM enrichment. When a concrete issue is selected,
  the web runner can append `issue_llm_enrichments.json` without changing
  deterministic action plans, todos, quality gates, severity, readiness, or
  evaluation scores.

Compatibility surfaces may remain visible behind developer/debug areas or in
release validation docs, but they should not be the first-run story or the main
copy used to explain the product.

## Required Capabilities

- Parse a practical DBML subset: tables, columns, types, `Project`, `Enum`,
  `TableGroup`, quoted identifiers, schema-qualified names, notes, settings,
  defaults, `pk`, `not null`, `unique`, inline refs, short `Ref:` syntax,
  `Ref` blocks, composite primary keys, and composite unique indexes from
  `indexes { (...) [...] }`.
- Generate `schema_parse_report.json` with parsed object counts, parser
  diagnostics, warnings, and unsupported constructs so unsupported DBML syntax
  is explicit instead of silently ignored.
- Map CSV files to DBML table names by exact file stem first, then conservative
  schema/header inference when confidence is high and the top candidate is
  clearly better than alternatives.
- Support explicit manual table-to-CSV mapping overrides through backend run
  configuration without renaming columns, mutating data, or weakening schema
  checks.
- Detect missing, ambiguous, and extra CSV files with mapping candidate
  evidence.
- Profile CSV data with DuckDB without loading entire input files into pandas.
- Add numeric percentiles (`p25`, `p50`, `p75`, `p95`, `p99`) and default IQR
  outlier evidence to numeric column profiles using DuckDB SQL.
- Materialize DuckDB results into pandas only through bounded helpers with
  explicit row and column limits.
- Generate automatic checks from DBML constraints.
- Validate foreign-key relationships with orphan, duplicate parent key, null
  FK, child duplicate checks for one-to-one relationships, composite FK joins,
  and join coverage metrics.
- Save issue evidence, bounded sample rows, evidence notes, and data-quality
  next steps.
- Emit `NUMERIC_OUTLIER` P3 review findings with bounded sample evidence when
  numeric values fall outside their profiled IQR fence.
- Generate schema evaluation artifacts with DBML-vs-CSV table/column
  conformance, mapping method/confidence/candidate evidence, PK/FK metadata,
  and schema issue references.
- Generate relationship graph artifacts with table nodes, FK edges, declared
  and observed cardinality, runtime FK metrics, statuses, junction-table
  detection, and issue/sample evidence links.
- Generate deterministic readiness, table-readiness, and chart-spec artifacts
  from aggregate outputs.
- Include a top numeric outlier chart spec in `charts/outliers_top_columns.json`
  for reports, packages, and local dashboard review.
- Record runtime execution flow through a human-readable log, ordered JSONL
  events, and a summary with stage timings, issue counts, artifact paths, and
  skipped or failed stage details.
- Generate deterministic Markdown and HTML data-quality reports with readiness
  summary, issue evidence, column readiness, table readiness, schema/mapping
  diagnostics, runtime flow, and developer artifact appendix.

## Optional Capability Requirements

- Database connectors must redact connection strings, passwords, tokens, API
  keys, and auth material from runtime logs, events, summaries, reports,
  dashboard payloads, and errors.
- The local web-runner database source may accept a raw connection URL only
  through the `127.0.0.1` backend request. Persisted input manifests, job
  payloads, generated artifacts, reports, and dashboard payloads must expose
  only redacted connection details or source type summaries.
- Real Postgres and MySQL/MariaDB smokes must skip explicitly when local test
  URLs are absent.
- The local web runner dashboard must consume generated artifacts only; it must
  not fetch raw CSV files or rerun profiler logic in JavaScript.
- Export packages must exclude raw source CSV files and connector temporary
  extracts. Bounded `samples/*.csv` evidence is the only CSV content allowed in
  packages.
- LLM guardrails must reject unsupported numeric claims, references,
  analysis-impact claims, and causal wording. No raw CSV rows or unbounded
  samples may enter the LLM path.
- Tests must not make real LLM API calls.

## Non-Goals

- No hosted Python/DuckDB backend job runner.
- No requirement to use database connectors, package export, PDF export,
  benchmark commands, developer graph views, static deployment, or Olist for
  the core product workflow.
- No Spark, Kafka, realtime processing, or production database monitoring.
- No production database mutations.
- No external lineage catalog publishing or hosted metadata service.
- No automatic data repair.
- No causal-inference claims.
- No raw CSV rows or unbounded samples sent through the LLM path.

## Demo Contract

`make demo-small` must run without internet and create a synthetic relational
CSV plus DBML dataset with known data defects. The resulting `issues.json` must
include:

- `DUPLICATE_PRIMARY_KEY`
- `ORPHAN_FOREIGN_KEY`
- `VALUE_OUT_OF_RANGE`
- `NEGATIVE_VALUE_NOT_ALLOWED`
- `DATE_ORDER_INVALID`
- `REQUIRED_FIELD_NULL`

Olist support is optional at runtime because it depends on Kaggle credentials,
but the CLI may retain clear download and run commands for compatibility.

`make demo-full` is a developer validation path: doctor checks, `make
demo-small`, package export with zip and PDF, final artifact audit, optional
Playwright dashboard E2E when installed, and key output path printing.

`make benchmark-small` must run a CI-safe benchmark. `make benchmark-large`
must run an optional larger local benchmark. Both write
`performance_guard_report.json`; the report is benchmark output and is not a
required artifact from every normal profiler run.
