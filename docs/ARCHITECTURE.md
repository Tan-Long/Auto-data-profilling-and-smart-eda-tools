# Architecture

VSF Data Profiler is a local-first guided data-quality profiler for related
CSV tables that are described by a DBML/schema contract. The product workflow
is optimized for users who need schema-aware issue evidence, table/column
readiness, and deterministic cleanup guidance without loading every CSV into
pandas.

The core rule is: raw data is scanned through an external-memory engine, while
the application keeps only schema metadata, aggregate statistics, issue
evidence, bounded samples, and report artifacts in memory.

## Architecture Status

This document separates **core product architecture**, **compatibility and
developer surfaces**, **near-term hardening**, and **target architecture**.
That split matters because several implemented advanced capabilities are useful
for validation, but they should not redefine the product away from guided CSV
plus DBML data-quality profiling.

Core product scope:

- local CLI run over DBML plus CSV directory;
- DBML/CSV cataloging;
- explicit DBML parse diagnostics;
- DuckDB-based profiling and validation;
- issue catalog with bounded samples and data-quality next steps;
- direct relationship checks from DBML foreign keys;
- guarded DuckDB-to-pandas materialization for bounded analysis frames;
- schema evaluation and relationship graph artifacts;
- deterministic data-quality readiness artifact;
- deterministic per-table readiness and analysis-impact artifact;
- deterministic issue action-plan artifact with fix and verify checklists;
- deterministic grouped todo artifact derived from issue action plans;
- deterministic post-run quality gates derived from structured readiness,
  issue, action-plan, todo, and verdict artifacts;
- built-in evaluation comparison artifacts for curated faulty datasets;
- deterministic chart-spec artifacts from aggregate outputs;
- schema diagram artifacts;
- runtime trace artifacts;
- deterministic Markdown/HTML data-quality reports.

Compatibility and developer surfaces:

- local Postgres or MySQL/MariaDB connector for selected tables;
- additive lineage and influence artifacts from existing structured evidence;
- optional guarded compatibility LLM summary artifacts with validation from
  structured artifacts only;
- optional selected-issue LLM enrichment artifacts generated on demand from a
  concrete issue, deterministic action plan, and bounded sample evidence;
- historical static DBML/CSV mapping preview;
- local-only web runner with upload mode for demo/small-medium files and local
  path mode for larger local datasets, plus developer database source mode over
  the existing connector boundary;
- interactive local web-runner review surface rendered from generated
  artifacts, including chart panels plus developer schema/relationship context;
- exportable self-contained analysis packages generated from existing output
  directories without copying raw source CSV files;
- release-candidate doctor, demo, and artifact audit commands that compose
  existing profiler outputs without changing artifact contracts;
- large-dataset benchmark guardrails that generate deterministic relational CSV
  inputs, run the existing pipeline, and write `performance_guard_report.json`.

Near-term hardening scope:

- richer console progress and runtime hardening beyond the current logs, JSONL
  events, and run summary;
- richer but backward-compatible artifact contracts;
- large-data memory regression tests and guarded dataframe materialization.

Target roadmap scope:

- richer graph validation;
- richer configurable readiness thresholds;
- rendered chart images and richer chart types;
- additional external LLM provider adapters beyond the OpenAI provider;
- job retention controls for larger local web-runner output directories.

## Goals

- Accept many CSV files plus one DBML schema contract.
- Use DBML tables, primary keys, foreign keys, and relationship declarations to
  build a dataset graph.
- Profile each table and column without full pandas loads.
- Validate schema constraints and cross-table relationships.
- Produce normalized, machine-readable findings that identify table, column,
  bad count, sample artifact, evidence SQL, severity, and data-quality next step.
- Show the runtime execution flow while the profiler runs.
- Generate reproducible JSON, Markdown, HTML, diagram, and bounded sample
  artifacts.
- Keep optional LLM summaries bounded, evidence-linked, and guardrailed when
  compatibility runs enable them.
- Keep all raw data local unless the user explicitly opts into an external LLM.
- Keep database credentials out of logs, reports, run summaries, events, and
  artifact payloads.

## Non-Goals

- Do not mutate production databases or repair user data automatically.
- Do not require Spark, Kafka, or a hosted database for the local workflow.
- Do not send raw CSV rows to an LLM.
- Do not make causal-inference claims from profiling or association metrics.
- Do not use pandas/ydata/PyOD full-data pipelines for large input files.
- Do not build production database monitoring, backup validation, lock analysis,
  security audit, or external lineage catalog publishing in the core MVP.

## Product Surfaces

| Surface | Purpose | Status |
| --- | --- | --- |
| CLI | Run the full profiler and write artifacts to an output directory. | v0.2 local RC. |
| Static reports | Let users inspect findings without running an app server. | v0.2 local RC. |
| Static web workspace | Historical browser-only DBML/CSV mapping preview. It is retained for compatibility and is not the product-facing guided workflow. | Compatibility preview. |
| Local web runner | Run CSV+DBML jobs through a `127.0.0.1` backend using browser upload mode or local path mode, then expose quality gates, issue evidence, deterministic action plans, todos, table readiness, report/export links, selected-issue LLM enrichment, developer artifact links, persistent run history, and per-run stage timelines. Legacy rule config, association fields, database source mode, compatibility LLM report artifacts, and graph artifacts remain compatibility controls. | Guided local runner. |
| Evaluate tool | Run built-in faulty dataset comparisons against seeded ground truth and the available Great Expectations baseline state without accepting arbitrary uploads. | Local demo/release surface. |
| Runtime trace files | Make each run debuggable through log, JSONL events, and summary metadata. | v0.2 hardening. |
| Optional LLM artifacts | Produce guarded evidence summaries from artifact JSON after deterministic checks finish. | Compatibility surface. |
| Analysis package | Export an existing output directory into an offline package with manifest, index page, generated artifacts, checksums, optional PDF, and optional zip. | Developer handoff surface. |
| Release candidate commands | Diagnose local prerequisites, run the full demo/package/audit path, and reject artifact leakage before handoff. | v0.2 hardening. |
| Benchmark guardrails | Generate deterministic larger local data, run the existing pipeline, and record row/runtime/memory/artifact/materialization evidence. | v0.2 hardening. |

## High-Level Flow

### Current v0.2 run flow

```text
DBML + CSV directory
  -> input boundary validation
  -> DBML catalog, parser diagnostics, and relationship graph
  -> CSV catalog and table mapping
  -> DuckDB external-memory scan layer
  -> table and column profiling
  -> DBML constraint checks
  -> direct relationship validation
  -> issue aggregation and recommended actions
  -> deterministic data-quality readiness artifact
  -> deterministic per-table assessment and analysis impact classification
  -> deterministic issue action plans with fix and verify checklists
  -> deterministic grouped todos for remediation and verification
  -> deterministic quality gates for analysis, joins, cleanup, and outlier review
  -> deterministic chart specs from aggregate artifacts
  -> deterministic JSON, samples, schema diagrams, Markdown, and HTML reports
```

Legacy rule config, target-based association analysis, database source mode,
lineage artifacts, and compatibility LLM report artifacts enter the same
implementation flow when explicitly enabled, but they are compatibility or
developer paths rather than the guided product workflow.

### Selected-issue enrichment flow

```text
v0.2 artifacts
  -> user selects one issue/action plan
  -> bounded selected-issue context from generated artifacts and samples/*.csv
  -> fake or OpenAI provider
  -> strict structured response validation
  -> issue_llm_enrichments.json
  -> visible human-review state in the drawer
```

The deterministic pipeline owns all facts. The LLM layer is a presenter and
must not invent numbers, references, causal claims, or data-quality next steps
that are not supported by evidence artifacts.

### Evaluate tool flow

```text
built-in faulty dataset id
  -> curated local DBML and CSV fixtures
  -> normal VSF pipeline
  -> ground_truth_issues.json
  -> baseline_comparison.json
  -> evaluation_summary.json
  -> local web comparison summary
```

Great Expectations is optional for local acceptance. When it is unavailable,
baseline rows are labeled `unavailable` or `not_covered`; this is not a failed
default demo path.

## Runtime Stack

| Concern | Choice | Rationale |
| --- | --- | --- |
| CLI | Typer | Small local command surface with typed options. |
| Query engine | DuckDB | Reads CSV directly and can aggregate/join without loading full files into Python memory. |
| Domain contracts | Pydantic | Stable JSON contracts and validation for reports. |
| Rules config | YAML | Human-editable data-quality rules. |
| Reports | Jinja2 Markdown/HTML templates | Deterministic, testable output. |
| Runtime logging | Python logging + JSONL events; optional Rich console | Near-term hardening for human-readable progress and machine-readable run trace. |
| Web workspace | Plain HTML/CSS/JavaScript plus Python stdlib local runner | Static DBML/CSV mapping without a build step; full profiling only through the local `127.0.0.1` backend. |
| pandas | Bounded analysis frames only | Allowed only after an explicit row and column guard. |
| LLM provider | Optional adapter | The core profiler must run without internet or model credentials. |

## Layering

```text
interfaces
  CLI, static web, report templates

application
  run orchestration, artifact writing, severity aggregation, runtime tracing,
  optional LLM dispatch

domain
  schema catalog, table catalog, profiles, issues, graph, readiness, report and
  runtime models

infrastructure
  DuckDB relations, DBML parser, YAML loader, file system, logging sinks,
  optional LLM client
```

Dependency rule: domain models do not import DuckDB, Typer, web UI code, report
templates, logging sinks, or LLM clients. Infrastructure adapters convert
external data into domain models before application logic consumes it.

The CLI should stay thin. If orchestration grows, move pipeline coordination out
of `cli.py` into an application runner such as `runner.py` so CLI and future web
runner can share the same implementation.

## Current and Planned Module Map

| Module | Responsibility | Architecture role |
| --- | --- | --- |
| `src/vsf_profiler/cli.py` | CLI options, command entrypoints, and current pipeline orchestration. | Interface and application. |
| `src/vsf_profiler/models.py` | Pydantic contracts for schemas, catalogs, profiles, issues, and compatibility association results. | Domain. |
| `src/vsf_profiler/dbml_parser.py` | Practical DBML parsing plus explicit parse diagnostics. | Infrastructure adapter producing domain catalog data. |
| `src/vsf_profiler/connectors.py` | Tabular connector abstraction and Postgres/MySQL introspection plus chunked extraction. | Infrastructure adapter. |
| `src/vsf_profiler/csv_catalog.py` | CSV discovery and DBML table mapping. | Application/domain boundary. |
| `src/vsf_profiler/duckdb_utils.py` | DuckDB connection, safe identifier quoting, and CSV relation creation. | Infrastructure. |
| `src/vsf_profiler/profiler.py` | Table and column statistics through DuckDB SQL. | Application service. |
| `src/vsf_profiler/quality_rules.py` | DBML checks and legacy rule-config checks. | Application service. |
| `src/vsf_profiler/relationship_checker.py` | FK, anti-join, parent duplicate, and join coverage checks. | Application service. |
| `src/vsf_profiler/issue_catalog.py` | Normalized issue creation, severity defaults, evidence paths, and data-quality next steps. | Domain/application service. |
| `src/vsf_profiler/influence_analyzer.py` | Legacy bounded association analysis for an explicit association field. | Compatibility service with strict memory guards. |
| `src/vsf_profiler/schema_evaluation.py` | DBML-vs-CSV conformance artifact generation. | Report artifact service. |
| `src/vsf_profiler/relationship_graph.py` | Relationship graph artifact generation from DBML and DuckDB FK checks. | Report artifact service. |
| `src/vsf_profiler/lineage_graph.py` | Developer runtime-context artifact generation from existing source, schema, runtime, and artifact evidence. | Report artifact service. |
| `src/vsf_profiler/table_assessments.py` | Deterministic per-table readiness, role, relationship-risk, and name-token analysis-impact artifact generation from existing structured outputs. | Report artifact service. |
| `src/vsf_profiler/action_plans.py` | Deterministic issue action-plan artifact generation from existing issue and table-assessment evidence. | Report artifact service. |
| `src/vsf_profiler/todos.py` | Deterministic grouped todo generation from issue action-plan fix and verify checklists. | Report artifact service. |
| `src/vsf_profiler/quality_gates.py` | Deterministic post-run quality gate evaluation from preflight, issue, table-assessment, action-plan, todo, and dataset-verdict evidence. | Report artifact service. |
| `src/vsf_profiler/evaluation_benchmark.py` | Built-in faulty dataset catalog, ground-truth comparison, Great Expectations availability/baseline state, and evaluation summary artifacts. | Demo/release validation service. |
| `src/vsf_profiler/chart_specs.py` | Deterministic chart specs from aggregate machine artifacts. | Report artifact service. |
| `src/vsf_profiler/schema_diagram.py` | DBML diagram payload and dbdiagram link generation. | Report artifact service. |
| `src/vsf_profiler/llm_narrative.py` | Optional guarded LLM summary context building, fake and OpenAI provider adapters, deterministic fallback, and guardrail validation. | Application presenter / provider boundary. |
| `src/vsf_profiler/llm_issue_enrichment.py` | Optional selected-issue LLM enrichment context building, fake/OpenAI providers, strict structured response validation, and append-only enrichment artifact writing. | Application presenter / provider boundary. |
| `src/vsf_profiler/report_generator.py` | Deterministic Markdown and HTML reports. | Interface presenter. |
| `src/vsf_profiler/export_package.py` | Offline analysis package creation, manifest/checksum generation, static package index rendering, optional PDF export, artifact allow-listing, and package redaction scanning. | Interface presenter / packaging service. |
| `src/vsf_profiler/doctor.py` | Local environment diagnostics for required and optional release-candidate prerequisites, with redacted env reporting. | Interface / operational support. |
| `src/vsf_profiler/artifact_audit.py` | Final generated-artifact and package audit for canonical files, raw CSV exclusions, secret-like text, and artifact path contracts. | Operational support. |
| `src/vsf_profiler/large_benchmark.py` | Deterministic relational benchmark data generation, existing-pipeline benchmark orchestration, performance guard report creation, and source materialization scans. | Operational support. |
| `src/vsf_profiler/demo_data.py` | Small synthetic dataset with injected issues and Olist download helper. | Demo/test support. |
| `src/vsf_profiler/runtime.py` | Run context, stage timing, run events, bounded log, and run summary contract. | Application/runtime support. |
| `src/vsf_profiler/logging_utils.py` | Planned richer console logging helpers. | Near-term infrastructure. |
| `src/vsf_profiler/web_runner.py` | Local-only HTTP upload runner, backend jobs, SSE runtime events, and artifact serving. | Interface / application adapter. |
| `web/` | Local browser workspace for DBML/CSV mapping, runner controls, runtime timeline, and artifact links. | Static interface / local runner UI. |

## Domain Model

The domain should converge on these stable concepts:

- `RunSummary`: run id, input paths, output paths, tool versions, resource
  limits, start/finish timestamps, status, stage timings, and artifact list.
- `RunEvent`: machine-readable runtime event for stage start/finish, table
  profiling, issue discovery, artifact writing, warnings, and failures.
- `SchemaParseReport`: DBML parser status, parsed object counts, warnings,
  unsupported constructs, and diagnostics.
- `SchemaCatalog`: DBML tables, columns, types, primary keys, unique
  constraints, not-null constraints, foreign keys, and relationship metadata.
- `CsvCatalog`: discovered files, headers, inferred dialect, mapped table,
  missing tables, and extra files.
- `ConnectorMetadata`: source type, selected tables, row-count estimates,
  introspection/extraction status, warnings, and redaction status for connector
  runs.
- `TableProfile`: row count, column count, duplicate key metrics, and scan
  metadata.
- `ColumnProfile`: null count, distinct count, inferred semantic type, numeric
  stats, percentiles, IQR outlier evidence, string stats, date stats, top
  values, and quality flags.
- `Issue`: normalized finding with type, severity, table, columns, bad count,
  affected percent, evidence SQL, sample artifact, data-quality next step, and
  provenance.
- `RelationshipCheck`: FK health, orphan count, null FK count, duplicate parent
  count, join coverage, cardinality, and confidence.
- `DataGraph`: tables as nodes and relationships as edges, including edge type,
  cardinality, constraint source, and validation status.
- `LineageGraph`: developer runtime-context artifact with source systems,
  schemas, tables, columns, relationships, profiler stages, generated
  artifacts, and typed dependency edges derived from existing evidence
  artifacts.
- `InfluenceResult`: legacy association metrics for an explicitly supplied
  field with explicit non-causality wording.
- `DatasetVerdict`: compatibility artifact for overall data-quality
  readiness, risk score, top blockers, warnings, and data-quality next steps.
- `TableAssessment`: per-profiled-table role, health score, readiness, issue
  counts, affected columns, relationship risks, name-token analysis impact,
  evidence artifact references, and data-quality next steps.
- `QualityGate`: deterministic post-run gate with approved status label,
  short explanation, evidence values, linked issue/table/column context, and a
  next action pointing to Review Issues or Todos.
- `ChartSpec`: deterministic chart metadata and aggregate data with source
  artifact references.
- `NarrativeReport`: optional LLM summary artifact plus guardrail validation
  status.
- `IssueLlmEnrichment`: optional selected-issue enrichment attempt with
  provider, issue id, status, guardrail result, sanitized request summary,
  structured response, error state, source artifacts, and human-review
  requirement.
- `EvaluationSummary`: built-in benchmark comparison summary with dataset
  metadata, VSF caught/missed/extra rows, bad-count accuracy, action-plan
  usefulness, evidence coverage, and baseline unavailable/not-covered states.

`RunSummary` is the near-term runtime contract. `RunManifest` may be introduced
later as a richer superset, but it should not replace current artifact names
without a compatibility path.

The legacy `tanlong` branch may contain useful ontology ideas for findings,
schema evaluation, readiness, graph edges, issue clusters, and guardrail reports.
Those concepts should be ported as contracts, not as pandas execution logic.

## Input Boundaries

All untrusted input is parsed at the boundary:

- CLI paths must be resolved and validated before pipeline execution.
- DBML text must be parsed into a `SchemaCatalog`.
- CSV files must be cataloged before any scan.
- CSV headers and DBML table names must be normalized consistently.
- Legacy rule config must be validated into typed rule objects when supplied.
- Legacy association fields must use `table.column` format and must exist after
  mapping when supplied.
- Database connection URLs must be accepted through CLI/env input only at the
  boundary and redacted before runtime/report surfaces.
- LLM provider config must be optional and isolated from deterministic runs.

The pipeline should fail fast for invalid control inputs such as unreadable
DBML, malformed legacy rule config, missing CSV directories, invalid legacy
association field names, or unwritable output directories. Data-quality
failures inside valid input files should be reported as issues rather than
crashing the run whenever possible.

Security-sensitive boundary rule: table names, column names, and file paths from
DBML/CSV input are untrusted. SQL generation must quote identifiers through a
single utility and avoid raw string interpolation of unescaped identifiers.

## DBML and Schema Graph

The DBML parser is the contract parser for the dataset graph.

v0.2 parser support:

- `Project`, `Enum`, `TableGroup`, tables, and columns;
- column types;
- quoted identifiers and schema-qualified names;
- notes, settings, and default values where useful for diagnostics;
- `pk`, `not null`, and `unique`;
- composite primary and unique indexes from `indexes { (...) [...] }`;
- inline refs such as `ref: > parent.id`;
- `Ref` blocks;
- short `Ref:` syntax with `>`, `<`, and `-` direction variants;
- one-to-one, one-to-many, and many-to-one declared cardinality;
- direct and composite foreign keys;
- many-to-many junction-table detection from pairs of FK relationships.

Roadmap support:

- native many-to-many `<>` DBML relationship declarations;
- full DBML grammar compatibility through a parser adapter.

Current implementation covers a practical subset and writes explicit parser
diagnostics. A future parser iteration may adopt a complete DBML parser behind
the same `SchemaCatalog` contract, but parser-specific objects should not leak
into the rest of the application. Unsupported DBML constructs must be written
to `schema_parse_report.json` so parser gaps are visible instead of silent.

Graph construction should not trust DBML blindly. It should combine declared
constraints with observed data checks:

- Does the parent key exist?
- Is the parent key unique at runtime?
- Is the child FK nullable?
- Are there orphan child keys?
- Is the relationship cardinality consistent with DBML?
- Does a bridge table look like a valid many-to-many junction?

## CSV Catalog and Mapping

CSV files map to DBML tables by exact file stem first. If no exact CSV exists
for a DBML table, the backend can infer a mapping from normalized filename
similarity, DBML column overlap, primary-key column match, foreign-key column
match, and an extra-column penalty. Inferred mappings are selected only when
confidence is high and the best candidate is clearly separated from the next
candidate. Ambiguous candidates stay unmapped until the user provides a manual
override.

The catalog also records:

- missing CSV files for DBML tables;
- extra CSV files not described in DBML;
- candidate mapping scores and ambiguity evidence;
- mapping method, selected CSV, confidence, matched/missing/extra columns;
- headers read from each file;
- header-to-column mismatches;
- file size and modification metadata when available.

Manual mapping overrides are explicit run configuration. The CLI accepts a
YAML/JSON mapping file, and the local web runner passes dropdown overrides to
the backend for upload and local path jobs. Overrides force table-to-CSV
selection only; they do not rename columns or repair data.

## External-Memory Data Access

DuckDB is the scan layer. CSV files are exposed as DuckDB relations, and all
large-data operations are expressed as SQL aggregates, joins, anti-joins, or
bounded samples.

Rules:

- Do not call `pandas.read_csv()` on user CSV files in production profiling
  code.
- Do not call `.fetchdf()` without an explicit row and column cap.
- Production code should use `fetch_bounded_df(...)` for DuckDB-to-pandas
  materialization; direct `.fetchdf()` belongs only inside that guard.
- Keep raw row samples small and write them to artifact files.
- Prefer aggregate tables, sketches, and SQL windows over Python collections.
- Parent-key checks must not materialize large key sets in Python.
- Cross-table joins must run through DuckDB with explicit join strategy and
  output limits.
- Quote all identifiers with a shared utility; never concatenate untrusted table
  or column names into SQL directly.
- Use DuckDB resource options for large runs: memory limit, temp directory, and
  thread count where configured.

Resource controls should be first-class run options:

- DuckDB memory limit;
- DuckDB temp directory;
- max sample rows per issue;
- max analysis rows for legacy bounded association analysis;
- max feature columns for legacy association analysis;
- exact vs approximate distinct-count mode;
- fail-fast vs best-effort mode.

## Tabular Connectors

The connector boundary adapts non-CSV tabular sources into the existing
DuckDB-compatible catalog instead of replacing profiling services.

Current connector support:

- Postgres connection URL supplied through `--postgres-url` or
  `--postgres-url-env`.
- MySQL/MariaDB connection URL supplied through `--mysql-url` or
  `--mysql-url-env`.
- Selected Postgres schema or MySQL database plus comma-separated selected
  tables.
- Optional DBML; when absent, table/column/key/FK metadata is generated from
  connector introspection.
- Chunked row fetches into temporary local CSV extracts that DuckDB scans with
  the existing external-memory path.
- Additive `connector_metadata.json`.

Connector rules:

- Do not load full database tables into pandas.
- Do not persist connector extracts as artifacts.
- Delete temporary connector extracts after the run.
- Redact URLs, passwords, tokens, API keys, and auth material from logs,
  events, summaries, reports, dashboard payloads, and errors.
- Keep relationship checks DuckDB-based after connector extraction.

## Profiling

Profiling is table-local and column-local before cross-table checks begin.

Table-level metrics:

- row count;
- column count;
- duplicate full-row count when enabled;
- primary-key duplicate count;
- scan warnings;
- missing/extra column counts.

Column-level metrics:

- non-null count and null count;
- null percent;
- exact or approximate distinct count;
- top values with counts;
- inferred type family;
- min, max, mean, standard deviation for numeric-looking columns;
- min and max for date/time-looking columns;
- min, max, and average length for strings;
- invalid parse count for expected numeric/date/boolean columns.

For very high-cardinality columns, profiling should avoid keeping full value
histograms in memory. The report should show bounded top-k values and a clear
note when distinct counts are approximate.

## Quality Checks

Quality checks come from three sources:

- DBML constraints: required fields, primary keys, unique columns, foreign keys,
  and type expectations.
- legacy rule config: range checks, accepted values, regex, date ordering, and
  SQL expressions when supplied.
- Built-in heuristics: empty strings, placeholder tokens, constant columns, high
  missingness, high cardinality, invalid dates, invalid numbers, duplicate rows,
  and suspicious identifiers.

Every issue must carry evidence:

- stable issue type;
- severity;
- table and columns;
- bad row count;
- affected percentage when meaningful;
- evidence SQL or deterministic rule reference;
- bounded sample artifact path;
- evidence note when deterministic;
- data-quality next step;
- provenance showing whether it came from DBML, YAML, built-in heuristics, or
  graph validation.

The issue catalog should stay machine-readable and stable even when report
wording changes.

## Relationship Validation

Relationship checks run after table profiles and DBML graph construction.

v0.2 checks:

- FK child null count;
- orphan FK count through anti-join;
- parent duplicate key count;
- child join coverage;
- one-to-one child duplicate FK count;
- composite FK checks over all key columns;
- many-to-many junction-table pattern detection.

Roadmap checks:

- parent coverage;
- declared-vs-observed cardinality mismatch;
- richer many-to-many bridge-table validation.

Relationship validation should emit both issue records and graph-edge status.
For example, an edge can be declared in DBML but marked `invalid` because the
parent key is not unique or because orphan keys exceed the configured threshold.

## Legacy Association Analysis

The target-column association path is retained for compatibility. It is
association analysis, not causality analysis, and is not part of the guided
CSV+DBML product workflow.

Allowed implementation pattern:

- select an explicit association field in `table.column` format;
- build a bounded analysis relation in DuckDB;
- include direct table features and selected parent-table features through safe
  joins;
- aggregate one-to-many child features before joining to the target grain;
- enforce max rows, max columns, and max joined output size;
- materialize the analysis frame only through `fetch_bounded_df(...)`;
- compute association metrics with SQL or bounded in-memory frames;
- label every result as association only.

The default behavior should still produce a successful run when no association
field is provided. In that case `influence.json` should record `skipped` with a
clear reason rather than crashing the pipeline.

The legacy `tanlong` branch may contain useful ideas for safe joins, fact-table
selection, and cross-table correlation. Those ideas must be rewritten to use
DuckDB relations and bounded samples instead of pandas merges.

## Charts

Charts are generated from aggregate outputs, not raw full datasets.

Current chart specs are deterministic JSON files under `charts/` and are built
only from existing machine artifacts:

- `profile_summary.json`;
- `issues.json`;
- `relationship_graph.json`;
- `dataset_verdict.json`;
- `influence.json` when the legacy association path is enabled.

Current chart specs:

- issue counts by severity and type;
- missingness by table and top columns;
- top numeric IQR outlier columns from profile summaries;
- relationship FK health summary;
- readiness risk summary;
- legacy association chart when available.

The Markdown and HTML reports render a static data-quality report from those
specs and the other generated machine artifacts. The report structure is
evidence-first: readiness, chart-summary bars, table readiness, issue evidence,
schema/relationship summary, developer artifact appendix, and explicit LLM
guardrail state when optional LLM artifacts are present.
HTML uses simple CSS bars only; Markdown uses textual bars for PDF/package
compatibility. The CLI does not need matplotlib, seaborn, browser automation,
or raw-data plotting to produce these reports.

The local web runner renders an interactive issue-review surface from the same
generated chart specs and machine artifacts. Filtering and drilldown are
client-side presentation over artifact JSON. Its issue review snapshot may
summarize data-quality readiness, issue counts, table readiness, runtime
summary, and report links from those artifacts while preserving developer
artifact links. The
DBML diagram panel renders browser preflight state before a run and prefers
generated `schema_diagram.json`, `relationship_graph.json`, and
`schema_parse_report.json` artifact evidence after a run. The local diagram
renderer is an ERD-style SVG presentation layer: deterministic role/degree/name
layout, compact PK/FK table cards, orthogonal relationship paths, fit and
expanded/non-key controls, and table or relationship detail panels. The
dashboard must use web-runner artifact URLs and must not read raw CSV files,
infer new profiling facts, or rerun the profiler.

Roadmap chart artifacts:

- top-k categorical distributions;
- numeric histograms from SQL bins;
- relationship graph diagram data;
- optional rendered chart images.

The stable artifact should be chart data or a chart spec first. PNG/SVG/HTML
rendering can be layered on top so the report remains reproducible in headless
environments.

## Severity and Readiness

Severity should be deterministic and explainable.

Current v0.2 severity is rule-default based and normalized for readiness
aggregation:

- P0: the run or core dataset contract is blocked;
- P1: critical data quality or relationship issue likely to break analytics;
- P2: medium data quality issue that needs cleanup or confirmation;
- P3: warning, outlier, or review-needed finding.

Current readiness inputs:

- issue type;
- bad count and affected percent;
- DBML constraint criticality;
- relationship role;
- schema evaluation summary;
- relationship graph edge status.

Roadmap readiness inputs:

- legacy association-field relevance;
- configurable thresholds;
- compound issue patterns.

Current readiness outputs:

- issue severity;
- table-level risk;
- deterministic table assessments with bounded analysis-impact categories;
- relationship-level risk;
- dataset-level readiness labels such as `READY`, `WARN`, or `NOT_READY`;
- top blockers and data-quality next steps.

The severity and readiness model from the legacy `tanlong` branch is a useful
product-behavior reference. It should be adapted to the current issue model and
tested with deterministic fixtures.

## Optional LLM Summary Artifacts

The LLM layer is optional and runs after deterministic artifacts are complete.
`fake` is available for local validation, and `openai` is available as the
real opt-in provider through `.env` or environment variables. Missing provider
configuration is treated as a deterministic fallback condition, not a profiling
failure.

LLM input may include:

- profile summary JSON;
- issue summaries;
- schema evaluation;
- relationship graph summary;
- readiness label;
- per-table assessment summary;
- chart summaries;
- legacy association summary when present.

LLM input must not include:

- full CSV data;
- secrets;
- credentials;
- raw sample row snippets;
- unbounded sample rows;
- unsupported numbers or claims.

The compatibility LLM output should summarize:

- data-quality readiness;
- important table and column findings;
- relationship risks;
- likely downstream modeling or analysis impact;
- prioritized data-quality next steps;
- caveats and non-causal interpretation.

Guardrail validation should run after generation:

- verify numeric claims against allowed evidence;
- verify issue/table/column references;
- verify table analysis-impact claims against `table_assessments.json`;
- reject causal wording unless explicitly supported;
- fall back to deterministic summary output if validation fails.

The OpenAI provider uses the Responses API with a bounded JSON prompt built
from the same artifact context. It does not use the OpenAI SDK as a required
dependency and must remain testable through an injected fake transport.
Provider configuration is validated before dispatch: model names must be
bounded, base URLs must be absolute http(s) URLs with HTTPS required outside
localhost, timeouts and output-token limits must be finite and bounded, and API
keys must not be recorded. `guardrail_report.json` may include sanitized model
configuration for audit, but never provider secrets.

## Reports and Artifacts

The output directory is the run contract.

### v0.2 artifacts

| Artifact | Purpose |
| --- | --- |
| `profile_summary.json` | Table and column statistics, including numeric percentiles and IQR outlier evidence. |
| `issues.json` | Normalized data-quality, schema, and relationship findings. |
| `influence.json` | Legacy association analysis or skipped status. |
| `samples/` | Bounded evidence rows for findings. |
| `connector_metadata.json` | Optional connector source metadata, selected tables, row estimates, extraction status, warnings, and redaction status. |
| `schema_parse_report.json` | DBML parsed object counts, warnings, unsupported constructs, and parse diagnostics. |
| `lineage_graph.json` | Developer runtime-context artifact connecting sources, schema entities, relationships, profiler stages, and generated artifacts. |
| `schema_evaluation.json` | DBML-vs-CSV table/column conformance and schema issue references. |
| `relationship_graph.json` | Table nodes, direct FK edges, FK metrics, status, and evidence links. |
| `dataset_verdict.json` | Data-quality readiness label, risk score, blockers, and data-quality next steps. |
| `table_assessments.json` | One assessment per profiled table with role, health score, readiness, relationship risks, analysis-impact category, evidence refs, and data-quality next steps. |
| `issue_action_plans.json` | One deterministic action plan per issue with finding summary, evidence values, fix checklist, verify checklist, priority, evidence coverage, actionability score, and human-review state. |
| `issue_todos.json` | Grouped deterministic Fix data and Verify after fix todos derived from `issue_action_plans.json`, preserving occurrence context for table, column, issue, and priority. |
| `quality_gates.json` | Deterministic gate statuses for Can run analysis, Can trust joins, Needs cleanup before sharing, and Outliers need review, with explanations, evidence values, linked context, and next actions. |
| `charts/` | Deterministic chart specs and report visual-summary data, including `outliers_top_columns.json`. |
| `schema_diagram.json` | Diagram metadata and dbdiagram link. |
| `schema_diagram.dbml` | DBML used for diagram rendering. |
| `l4_report.md` | Optional guarded LLM summary artifact when `--use-llm` runs. |
| `guardrail_report.json` | Optional LLM validation status, sanitized model config, checked claims, and violations. |
| `report.md` | Deterministic human-readable report. |
| `report.html` | Static HTML report. |
| `analysis_report.pdf` | Package-only optional PDF rendered from existing report artifacts when `vsf-profiler package --pdf` is used. |
| `export_manifest.json` | Package-only manifest with included artifacts, SHA-256 checksums, source run metadata, exclusions, and redaction status. |
| `index.html` | Package-only offline entrypoint linking reports and machine artifacts. |

The package `index.html` is an offline review entrypoint, not a raw artifact
dump. It mirrors the core report evidence with scorecards, LLM guardrail state,
table readiness, issue evidence, schema/relationship summaries, developer
artifact links, chart-spec links, and bounded sample links. The optional
`analysis_report.pdf` is rendered from the generated Markdown report so the PDF
shares the same core review evidence.

### Near-term runtime artifacts

| Artifact | Purpose |
| --- | --- |
| `run.log` | Human-readable run log. |
| `run_events.jsonl` | Machine-readable runtime event stream. |
| `run_summary.json` | Inputs, outputs, config, timings, stage status, and issue counts. |

### Roadmap artifacts

| Artifact | Purpose |
| --- | --- |
| `run_manifest.json` | Richer superset of `run_summary.json` with versions and artifact inventory. |
| `rendered_charts/` | Optional rendered chart images derived from chart specs. |

Backward compatibility matters: existing artifact names should keep working
while richer artifacts are added.

## Web Architecture

The current web UI has a historical static mapping preview and a local-only
runner.

Static browser preview:

- reads DBML files in the browser;
- reads only CSV headers;
- maps CSV files to DBML tables;
- displays PK/FK relationships in a local ERD-style schema diagram with
  deterministic layers, compact cards, orthogonal edges, and focused detail;
- generates a dbdiagram.io link as a secondary external action.

The historical static deployment serves only this browser preview. It does not
run the Python/DuckDB backend, database connectors, local path mode, LLM summary
generation, package/PDF export, or review jobs.

Local runner:

```text
browser workspace
  -> 127.0.0.1 backend job API
  -> same application pipeline used by CLI
  -> outputs/web_runs/<job_id>/artifacts
  -> run_events.jsonl and run_summary.json
  -> browser artifact viewer and interactive issue review
  -> persistent run history by scanning outputs/web_runs folders
```

The web runner must not create a separate profiling implementation. CLI and web
must share the same application services and domain models. Upload mode is for
demo/small-medium files. Local path mode is the browser workflow for larger
local datasets because it sends only path strings to the local backend and lets
the Python pipeline read CSV files directly from disk.

The interactive issue review is a presentation layer. It consumes generated
`charts/*.json` and machine artifacts through protected artifact URLs. It may
filter and group artifact rows for display, but it must not implement
profiling, validation, relationship, readiness, legacy association, or LLM
logic.

## Performance Strategy

The system should scale by scanning and aggregating, not by retaining rows.

| Workload | Strategy |
| --- | --- |
| Row counts | DuckDB `COUNT(*)` over CSV relation. |
| Null counts | SQL conditional aggregates. |
| Distinct counts | Exact `COUNT(DISTINCT)` by default, approximate mode for very large columns. |
| Top values | SQL `GROUP BY` with `ORDER BY count DESC LIMIT k`. |
| PK duplicates | SQL grouped count on key columns. |
| FK orphans | SQL anti-join or `NOT EXISTS`. |
| Parent duplicate keys | SQL grouped count on parent key. |
| Composite FK | SQL joins and grouped checks over all key columns. |
| Many-to-many validation | Junction-table pattern detection from key and relationship metadata. |
| Issue samples | SQL query with `LIMIT sample_size`, written to CSV. |
| Legacy association artifact | SQL feature extraction plus bounded sample frame. |
| Charts | SQL aggregate bins and top-k datasets. |

Large-file regression tests should include synthetic data that exceeds normal
developer RAM expectations for pandas full-load workflows. The acceptance rule
is not raw speed alone; it is bounded memory and graceful degradation.

The benchmark guardrail path writes `performance_guard_report.json` after a
generated large-dataset run. The report records generated row counts, pipeline
stage timings from `run_summary.json`, run event counts, peak RSS memory where
supported, artifact sizes, legacy association row/feature limits, package and audit
status, and static materialization guard scan results. It is benchmark
evidence, not a machine-independent performance SLA.

## Runtime Execution and Observability

Near-term runtime hardening should make each run show and record the same
execution stages:

1. Parse DBML schema.
2. Catalog CSV files and table mappings.
3. Profile CSV tables and columns.
4. Run data quality checks.
5. Check relationships.
6. Run legacy association analysis or record why it was skipped.
7. Generate artifacts and reports.

Console output should show stage start, stage success/failure, duration, and key
metrics. File outputs should include:

- `run.log`: detailed human-readable log;
- `run_events.jsonl`: machine-readable event stream;
- `run_summary.json`: final run status, input/output paths, stage timings,
  totals, and issue counts by severity.

Runtime events should include at least:

- `run_started`;
- `stage_started`;
- `stage_finished`;
- `stage_failed`;
- `table_profile_started`;
- `table_profile_finished`;
- `issue_found`;
- `artifact_written`;
- `run_finished`;
- `run_failed`.

Logs must not print full raw rows, secrets, credentials, or unbounded sample
values. They may include table name, column name, issue type, severity,
`bad_count`, `bad_rate`, and sample artifact path.

For the local web runner, job status exposes the same stage metadata instead of
inventing a separate progress model. Persistent run history is rebuilt from
`outputs/web_runs/<job_id>/artifacts` by reading `run_summary.json`,
`run_events.jsonl`, `quality_gates.json`, and other existing generated
artifacts; it must not introduce an application database for this local
workflow.

## Error Handling

Error handling distinguishes control-plane errors from data-quality findings.

Control-plane errors stop the run:

- missing DBML file;
- unreadable CSV directory;
- invalid YAML syntax;
- invalid legacy association field format;
- artifact output path cannot be created;
- DuckDB cannot initialize with configured resource options.

Data-plane issues become findings when the run can continue:

- missing CSV for a DBML table;
- extra CSV not in DBML;
- missing expected column;
- invalid values;
- FK violations;
- parse failures in expected numeric/date columns.

Best-effort mode may continue after non-critical table failures and mark the
affected tables as incomplete in `run_summary.json` and, later,
`run_manifest.json`.

Once runtime hardening exists, every stopped run should still attempt to write a
failure `run_summary.json` and `run.log` so users know which stage failed.

## Security and Privacy

- The default workflow is local.
- Raw data should not leave the user's machine.
- LLM use must be opt-in.
- LLM prompts should contain structured summaries, not full raw tables.
- Sample artifacts must be bounded and clearly listed.
- Future redaction/masking should happen before samples are written or before
  structured context is sent to external providers.
- Environment variables and credentials must not be copied into reports.
- Logs must not include full raw rows, secrets, tokens, or credentials.
- SQL generation must quote identifiers and avoid unescaped user-controlled
  table/column names.

## Testing Strategy

v0.2 required tests:

- DBML parser unit tests for supported syntax.
- CSV catalog tests for stem mapping, missing files, extra files, and header
  mismatches.
- DuckDB profiling tests with deterministic small fixtures.
- Relationship tests for valid FK, orphan FK, duplicate parent, and nullable FK.
- Relationship tests for composite FK, one-to-one, one-to-many, many-to-one,
  invalid parent duplicate, and junction-table detection.
- YAML rule tests for range, accepted values, regex, and expression checks.
- End-to-end demo tests that assert artifact existence and representative issue
  types.
- Large-data regression tests that fail if production code uses unbounded
  pandas CSV loading.

Near-term hardening tests:

- Runtime logging tests that assert `run.log`, `run_events.jsonl`, and
  `run_summary.json` are created and include stage events.
- Guarded materialization tests that fail on unbounded `.fetchdf()` paths.
- Severity/readiness tests with fixed issue sets.
- Chart-spec tests with fixed aggregate payloads.

Roadmap tests:

- Native many-to-many DBML declaration cases.
- Additional provider-adapter tests beyond OpenAI.
- Web runner tests for local-only binding, uploaded demo runs, local path jobs,
  issue-review artifact discovery, event-summary display markers, validation
  failures, and artifact path safety.
- Optional real Postgres acceptance smoke using a disposable schema from
  `VSF_POSTGRES_TEST_URL` or a local Docker-created database, with explicit
  skip behavior when no fixture is available.
- Optional real MySQL/MariaDB acceptance smoke using disposable tables from
  `VSF_MYSQL_TEST_URL`, with explicit skip behavior when no fixture is
  available.

## Legacy `tanlong` Migration Guidance

The legacy `tanlong` branch should be treated as a product-behavior reference,
not as the execution engine for large data.

Keep and adapt:

- ontology contracts for data quality, schema evaluation, readiness, graph, and
  LLM reports;
- severity aggregation and threshold concepts;
- guardrail validation for optional LLM reports;
- LLM summary flow as an optional presenter layer;
- schema graph and cardinality ideas;
- cross-table safe-join concepts;
- web job-management ideas if a local backend is added.

Rewrite before porting:

- ingestion readers that call pandas full-file loaders;
- ydata-profiling full-frame profiling;
- PyOD/sklearn anomaly detection over full dataframes;
- missingness analysis over full dataframes;
- parent-key and FK checks that materialize large Python sets;
- pandas merge-based cross-table correlation.

Drop or isolate:

- any feature that requires full raw dataframes for normal operation;
- any LLM path that can introduce unsupported numeric claims;
- any chart generation that needs full raw columns in memory.

## Near-Term Implementation Slices

1. Add runtime execution flow artifacts: `run.log`, `run_events.jsonl`, and
   `run_summary.json`, and include an Execution Flow section in reports.
2. Harden current v0.2 contracts while preserving existing artifact names.
3. Add large-data memory regression tests and guarded `.fetchdf()` checks.
4. Introduce richer ontology JSON for schema evaluation and relationship graph
   without changing the v0.2 pipeline shape.
5. Extend deterministic readiness scoring with configurable thresholds.
6. Extend DBML parsing for native many-to-many declarations and fuller DBML
   grammar compatibility.
7. Extend chart specs with additional aggregate chart types and optional
   rendered images.
8. Add additional external LLM provider adapters behind the optional LLM
   boundary.
