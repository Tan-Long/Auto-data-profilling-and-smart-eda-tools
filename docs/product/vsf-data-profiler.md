# VSF Data Profiler Product Contract

## Product

VSF Data Profiler is a local CLI for profiling CSV datasets against a DBML
schema contract.

## v0.2 Local Release Candidate Contract

The CLI accepts:

- A DBML schema file.
- A directory of CSV files.
- Or a Postgres connection URL/environment variable plus selected schema/tables.
- Or a MySQL/MariaDB connection URL/environment variable plus selected
  database/tables.
- An optional YAML business-rules file.
- An optional target column in `table.column` format.
- An optional `--use-llm` flag for a guarded Senior Data Scientist narrative.
- An optional `--llm-provider` value, currently `fake` or `openai`, used only
  when `--use-llm` is set.
- An output directory.
- A local-only web runner command, `vsf-profiler web`, with browser upload mode
  for demo/small-medium runs and local path mode for larger local datasets.
- A package command, `vsf-profiler package`, that exports an existing output
  directory for offline review without rerunning profiling.
- A doctor command, `vsf-profiler doctor`, that reports required and optional
  local environment readiness without printing secret values.
- A local benchmark script, `scripts/benchmark_large_dataset.py`, that
  generates deterministic relational CSV/DBML/rules inputs, runs the existing
  Python/DuckDB pipeline, and writes benchmark evidence.

The CLI produces:

- `profile_summary.json`
- `issues.json`
- `influence.json`
- `schema_parse_report.json`
- optionally, `connector_metadata.json` when a database connector runs
- `lineage_graph.json`
- `schema_evaluation.json`
- `relationship_graph.json`
- `dataset_verdict.json`
- `table_assessments.json`
- `schema_diagram.json`
- `schema_diagram.dbml`
- `run.log`
- `run_events.jsonl`
- `run_summary.json`
- JSON chart specs under `charts/`
- `report.md`
- `report.html`
- issue sample CSV files under `samples/`
- optionally, `l4_report.md` and `guardrail_report.json` when `--use-llm`
  runs the narrative path.
- export packages with `index.html`, `export_manifest.json`, copied generated
  artifacts, bounded sample evidence, an optional zip archive, and optional
  `analysis_report.pdf` when `vsf-profiler package` is run.

The web workspace presents a local data-quality console. It accepts DBML and CSV
files in the browser, maps uploaded CSV files to DBML tables, shows primary keys
and foreign keys, renders a local schema diagram preview, keeps a dbdiagram.io
visualization link as a secondary external action, and can run local
`127.0.0.1` backend jobs through either browser upload mode or local path mode.
Both modes run the same Python pipeline as the CLI. Completed web-runner jobs
are reviewed primarily through an interactive dashboard that fetches generated
artifact URLs instead of raw CSV files.

The hosted Vercel deployment is a static preflight surface only. It serves the
browser-side DBML/CSV mapping and visualization UI, but it does not host the
Python/DuckDB profiler, database connectors, local path jobs, LLM narrative
generation, package/PDF export, or dashboard backend. Full browser-driven runs
require `vsf-profiler web` or `make web-runner` on `127.0.0.1`.

## Required Capabilities

- Parse a practical DBML subset: tables, columns, types, `Project`, `Enum`,
  `TableGroup`, quoted identifiers, schema-qualified names, notes, settings,
  defaults, `pk`, `not null`, `unique`, inline refs, short `Ref:` syntax,
  `Ref` blocks, composite primary keys, and composite unique indexes from
  `indexes { (...) [...] }`.
- Generate `schema_parse_report.json` with parsed object counts, parser
  diagnostics, warnings, and unsupported constructs so unsupported DBML syntax
  is explicit instead of silently ignored.
- Parse DBML `Ref:` direction variants `>`, `<`, and `-`, including composite
  relationship endpoints where declared.
- Map CSV file stems to DBML table names and detect missing or extra CSV files.
- Profile selected Postgres or MySQL/MariaDB tables through a connector
  abstraction without manual CSV export. Connectors support connection URL/env
  var, selected schema/database and tables, optional DBML, and schema
  introspection when DBML is absent.
- Stream connector data through bounded/chunked extraction into
  DuckDB-readable files, remove raw extracts after the run, and generate
  `connector_metadata.json` with source type, tables scanned, row-count
  estimates when available, introspection status, extraction status, warnings,
  and redaction status.
- Provide an optional real Postgres acceptance smoke that creates a disposable
  local schema, runs connector introspection mode and DBML-supplied mode,
  verifies canonical artifacts and web/dashboard artifact discovery, confirms
  temporary extract cleanup, and scans outputs for connection URL, password,
  token, or secret-like leaks. It must skip explicitly when no
  `VSF_POSTGRES_TEST_URL` or local fixture capability is available.
- Provide an optional real MySQL/MariaDB acceptance smoke that creates
  disposable tables in a configured local database, runs connector
  introspection, verifies canonical artifacts and redaction, confirms temporary
  extract cleanup, and skips explicitly when no `VSF_MYSQL_TEST_URL` or local
  fixture capability is available.
- Redact connection strings, passwords, tokens, API keys, and auth material
  from runtime logs, events, summaries, reports, dashboard payloads, and errors.
- Profile CSV data with DuckDB without loading entire input files into pandas.
- Materialize DuckDB results into pandas only through bounded helpers with
  explicit row and column limits.
- Generate automatic quality checks from DBML constraints.
- Run YAML rules for range, accepted values, regex, and expressions.
- Validate foreign-key relationships with orphan, duplicate parent key, null FK,
  child duplicate checks for one-to-one relationships, composite FK joins, and
  join coverage metrics.
- Save issue evidence, sample rows, probable causes, and suggested fixes.
- Generate schema evaluation artifacts with DBML-vs-CSV table/column
  conformance, PK/FK metadata, and schema issue references.
- Generate a local lineage graph artifact that connects CSV or connector input
  sources, DBML or connector-introspected schema entities, tables, columns,
  relationships, profiler stages, runtime evidence, and generated artifacts.
  The graph must use existing structured artifacts and redacted connector
  metadata only, and must not read raw CSV rows.
- Generate relationship graph artifacts with table nodes, FK edges, declared and
  observed cardinality, runtime FK metrics, statuses, junction-table detection,
  and issue/sample evidence links.
- Generate a deterministic dataset verdict artifact with normalized severity
  counts, risk score, top blockers, affected tables, and recommended next
  actions.
- Generate a deterministic per-table assessment artifact with one row per
  profiled table, including role, health score, readiness, issue counts,
  affected columns, relationship risks, name-token business impact category,
  evidence artifact references, and recommended next actions.
- Generate deterministic chart-spec artifacts from aggregate outputs for issue
  counts, missingness, relationship FK health, dataset risk, and influence top
  features when available.
- Generate DBML diagram artifacts, including a stateless dbdiagram.io embed
  link when the encoded DBML fits safely in a URL.
- Show CSV-file-to-DBML-table mapping, primary keys, foreign keys, and
  relationships in the report.
- Provide a local-first web UI for uploading DBML/CSV files, rendering a local
  ERD-style DBML diagram with deterministic table layers, compact PK/FK-focused
  table cards, CSV mapping status, orthogonal relationship edges, fit/expanded
  controls, and selected table or relationship detail, then linking uploaded
  CSV files with DBML tables before running profiling.
- Provide a local-only browser runner with separate upload mode and local path
  mode. Upload mode handles demo/small-medium DBML, CSV, and optional rules
  files. Local path mode validates browser-entered DBML, CSV directory, optional
  rules, and optional target paths without sending CSV bytes through the
  browser. Both modes must call the existing Python DuckDB pipeline, preserve
  artifact names, and visualize `run_events.jsonl` and `run_summary.json`
  rather than infer stage status in JavaScript.
- Provide an interactive web-runner dashboard after completed jobs. The
  dashboard must render existing `charts/*.json` and canonical machine
  artifacts through web-runner artifact URLs, support severity/type/table
  filters, and show drilldown details with matching issues, affected
  tables/columns, counts/rates, relevant artifact links, and bounded sample CSV
  links when available. The runner's Generated results panel previews dataset
  verdict, issue counts, table impact, runtime summary, and report links from
  those generated artifacts while preserving raw artifact links. It also
  switches the DBML diagram panel from browser preflight state to generated
  `schema_diagram.json`, `relationship_graph.json`, and
  `schema_parse_report.json` artifact evidence after a run. The diagram
  renderer remains local-only and presentation-only: it does not add backend
  routes, rename artifacts, fetch raw CSV rows, or infer new profiler facts. It
  also renders a dedicated Table Impact section from
  `table_assessments.json`, including table readiness, health score, role,
  affected-column count, relationship-risk count, and deterministic
  business-impact category.
- Provide interactive lineage and relationship graph views in the web-runner
  dashboard from `lineage_graph.json` and `relationship_graph.json`. The graph
  views default to a low-noise source/schema/table/artifact-summary overview,
  then reveal Focus and Full detail modes plus opt-in columns,
  runtime/artifact fan-out, and invalid/warning relationship filtering. Node
  selection highlights direct neighbors, fades unrelated graph elements, and
  shows direct evidence, matching issues, and selected-table columns in the
  graph drilldown without reading raw CSV rows.
- Package existing run output directories into self-contained offline analysis
  packages. Packages must include canonical generated artifacts, chart specs,
  relationship and lineage graphs, reports, runtime traces, bounded sample
  evidence, `export_manifest.json` with SHA-256 checksums and source run
  metadata, and an offline `index.html` entrypoint. Packages may optionally
  include `analysis_report.pdf` generated from existing report/package
  artifacts without rerunning profiling. Packages must exclude raw source CSV
  files and connector temporary extracts, and must fail if the included text
  artifacts or generated PDF contain unredacted secret-like values.
- Provide release-candidate operational checks: `vsf-profiler doctor` must
  check Python, required imports, DuckDB, optional Postgres and MySQL/MariaDB
  connector readiness, optional PDF backend readiness, optional
  Node/Playwright, and OpenAI env presence without leaking secrets; `make
  demo-full` must compose the existing demo, package export, artifact audit,
  and optional Playwright dashboard E2E; and
  `scripts/verify_vsf_artifacts.py` must audit canonical artifacts, package
  contents, raw CSV exclusions, secret-like strings, and deterministic artifact
  names.
- Provide large-dataset benchmark guardrails. The benchmark must generate
  deterministic configurable multi-table relational CSV data, run the existing
  Python/DuckDB pipeline without a second profiler engine, create charts,
  reports, package output, and artifact audit evidence, and write
  `performance_guard_report.json` with total/per-table rows, stage runtime,
  peak RSS memory when supported, artifact sizes, influence row/feature limits,
  default Postgres chunk size, package/audit status, and source materialization
  guard scan results.
- Run association-based influence analysis for a target column, including an
  Olist review-score preset, with explicit max analysis rows and max feature
  columns.
- Record runtime execution flow through a human-readable log, ordered JSONL
  events, and a summary with stage timings, issue counts, artifact paths, and
  skipped or failed stage details.
- Generate deterministic Markdown and HTML reports with visual summaries without
  requiring an LLM.
- Link schema parse diagnostics from deterministic Markdown/HTML reports and
  web-runner artifact lists.
- Link `lineage_graph.json` from deterministic Markdown/HTML reports and
  web-runner artifact/dashboard lists.
- Optionally generate a Senior Data Scientist narrative from existing structured
  artifacts only, guarded by validation that checks numeric claims,
  table/column/issue references, unsupported table/business-impact claims, and
  unsupported causal wording.
- Support a real OpenAI provider adapter behind the same guarded narrative
  boundary, configured by `.env` or environment variables, without making
  external calls in tests.
- Fall back to deterministic narrative output when `--use-llm` is enabled but
  provider configuration is missing or guardrails reject provider output.
- Link to `l4_report.md` and `guardrail_report.json` from the deterministic
  reports when those optional artifacts exist.

## Non-Goals

- No hosted Python/DuckDB backend job runner in the v0.2 local RC.
- No large company-data upload mode in the browser runner; use local path mode
  or the CLI for larger local datasets.
- No Kafka, Spark, realtime processing, or production database monitoring.
- No database connectors beyond Postgres and MySQL/MariaDB in the v0.2 local
  RC.
- No production database mutations.
- No external enterprise lineage catalog publishing or hosted metadata service.
- No automatic data repair.
- No causal-inference claims.
- No raw CSV rows or unbounded samples sent through the LLM narrative path.
- No browser dashboard reads of raw CSV files after a run; the dashboard
  consumes generated artifacts only.
- No export package inclusion of raw source CSV files or connector temporary
  extracts; bounded `samples/*.csv` evidence is the only CSV content allowed in
  packages.
- No real LLM API calls in tests.

## Demo Contract

`make demo-small` must run without internet and create a synthetic dataset with
known data defects. The resulting `issues.json` must include:

- `DUPLICATE_PRIMARY_KEY`
- `ORPHAN_FOREIGN_KEY`
- `VALUE_OUT_OF_RANGE`
- `NEGATIVE_VALUE_NOT_ALLOWED`
- `DATE_ORDER_INVALID`
- `REQUIRED_FIELD_NULL`

Olist support is optional at runtime because it depends on Kaggle credentials,
but the CLI must provide clear download and run commands.

`make demo-full` must run the local release-candidate path: doctor checks,
`make demo-small`, package export with zip and PDF, final artifact audit,
optional Playwright dashboard E2E when installed, and key output path printing.

`make benchmark-small` must run a CI-safe benchmark. `make benchmark-large`
must run an optional larger local benchmark. Both write
`performance_guard_report.json`; the report is benchmark output and is not a
required artifact from every normal profiler run.
