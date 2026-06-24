# VSF Data Profiler

`vsf-profiler` is a local-first guided data-quality profiler for related CSV
files described by a DBML/schema contract. The supported product workflow is:
provide CSV plus DBML inputs, review mapping/schema evidence, run local
profiling, inspect table/column issues, and open deterministic reports with
data-quality next steps.

The repository still contains older advanced code paths for target-based
association artifacts, database connectors, lineage artifacts, package export,
Olist samples, and optional LLM summaries. They are compatibility and developer
surfaces for now; they are not the main product workflow.

DuckDB is the internal scan engine. Users do not need to manage DuckDB directly
for the default CSV plus DBML workflow.

This repository still carries Harness docs under `docs/` for agent workflow.
The product implemented here is `VSF Data Profiler`.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
```

Use `python -m venv .venv` instead if your system provides `python` as Python
3.11 or newer.

## Guided CSV + DBML Demo

No internet or Kaggle account is required.

```bash
make demo-small
open outputs/demo_small/report.html
```

For a 5-10 minute guided walkthrough, command checklist, and artifact tour, use
[docs/demo/vsf-data-profiler.md](docs/demo/vsf-data-profiler.md).

The larger release-candidate validation path exercises compatibility and
developer validation surfaces such as package export, artifact audit, and
dashboard E2E when local tooling is installed:

```bash
vsf-profiler doctor
make demo-full
```

The full demo still starts from the same synthetic CSV plus DBML dataset. It
also exports `outputs/demo_small_package/`, writes the optional
`analysis_report.pdf` and `outputs/demo_small_package.zip`, audits the
canonical artifacts, and runs the optional Playwright dashboard E2E when local
Node/Playwright tooling is installed. See
[docs/releases/v0.2-rc.md](docs/releases/v0.2-rc.md).

Latest public prerelease:
[VSF Data Profiler v0.2.0-rc2](https://github.com/Tan-Long/Auto-data-profilling-and-smart-eda-tools/releases/tag/vsf-profiler-v0.2.0-rc2),
with release notes in [docs/releases/v0.2.0-rc2.md](docs/releases/v0.2.0-rc2.md).

Primary generated evidence:

```text
outputs/demo_small/profile_summary.json
outputs/demo_small/issues.json
outputs/demo_small/schema_parse_report.json
outputs/demo_small/schema_evaluation.json
outputs/demo_small/relationship_graph.json
outputs/demo_small/dataset_verdict.json
outputs/demo_small/table_assessments.json
outputs/demo_small/issue_action_plans.json
outputs/demo_small/issue_todos.json
outputs/demo_small/quality_gates.json
outputs/demo_small/schema_diagram.json
outputs/demo_small/schema_diagram.dbml
outputs/demo_small/run.log
outputs/demo_small/run_events.jsonl
outputs/demo_small/run_summary.json
outputs/demo_small/charts/
outputs/demo_small/report.md
outputs/demo_small/report.html
outputs/demo_small/samples/
```

The current pipeline also writes compatibility/developer artifacts such as
`influence.json` and `lineage_graph.json`. They remain available for existing
tests and debugging, but they are no longer positioned as required user
workflow outputs.

Numeric column profiles include percentiles and IQR outlier evidence in
`profile_summary.json`; `issues.json` records `NUMERIC_OUTLIER` findings only
when profiled values exceed the generic IQR fence, and
`charts/outliers_top_columns.json` feeds report, package, and dashboard
summaries.

On Windows, open the report with:

```bash
start outputs/demo_small/report.html
```

## Legacy Olist Relational CSV Sample

Olist remains as a legacy relational CSV sample for maintainers who need a
larger compatibility dataset. It is not the product identity or the default
demo path. The Olist demo requires Kaggle CLI authentication; the synthetic
CSV+DBML demo does not require internet access.

```bash
python -m pip install kaggle
kaggle auth login
make download-olist
make demo-olist
open outputs/olist_demo/report.html
```

If `kaggle auth login` is unavailable in your Kaggle CLI version, configure
`~/.kaggle/kaggle.json` or the Kaggle credential environment variables.

## Core CLI

```bash
vsf-profiler doctor

vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --out outputs/demo_small

# Optional: force table-to-CSV choices when source filenames are not table names.
# YAML and JSON are supported, for example: mappings: {customers: crm_export.csv}
vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --mapping mapping.yaml \
  --out outputs/manual_mapping

vsf-profiler demo create-small --out data/demo_small
vsf-profiler demo download-olist --out data/olist
vsf-profiler demo run-olist --csv-dir data/olist --out outputs/olist_demo
```

## Compatibility and Developer CLI

These commands remain implemented for compatibility, release validation, and
developer debugging. They are not required for the guided CSV+DBML
data-quality workflow.

```bash
vsf-profiler package \
  --input outputs/demo_small \
  --output outputs/demo_small_package \
  --zip \
  --pdf

python scripts/benchmark_large_dataset.py \
  --work-dir outputs/benchmark_ci \
  --rows 600 \
  --tables 7 \
  --max-analysis-rows 120 \
  --max-feature-columns 4 \
  --force

# Legacy Postgres connector mode reads selected local database tables through a chunked connector.
# Prefer the environment variable path so credentials are not stored in shell history.
export VSF_PROFILER_POSTGRES_URL='postgresql://user:password@127.0.0.1:5432/app'
vsf-profiler run \
  --postgres-url-env VSF_PROFILER_POSTGRES_URL \
  --postgres-schema public \
  --postgres-tables customers,orders,order_items \
  --target orders.order_total \
  --out outputs/postgres_profile

# Legacy MySQL/MariaDB connector mode uses the same connector boundary and temporary chunked extracts.
export VSF_PROFILER_MYSQL_URL='mysql://user:password@127.0.0.1:3306/app'
vsf-profiler run \
  --mysql-url-env VSF_PROFILER_MYSQL_URL \
  --mysql-schema app \
  --mysql-tables customers,orders,order_items \
  --target orders.order_total \
  --out outputs/mysql_profile

vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --target order_reviews.review_score \
  --out outputs/demo_small_l4 \
  --use-llm \
  --llm-provider fake

cp .env.example .env
# edit .env and add OPENAI_API_KEY before using the real provider
vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --target order_reviews.review_score \
  --out outputs/demo_small_l4_openai \
  --use-llm \
  --llm-provider openai

```

## Optional Real Postgres Smoke

The real connector smoke is optional and local-only. It creates a disposable
schema in the configured database, runs the connector in introspection and DBML
modes, verifies artifacts and redaction, then drops the schema.

Use an existing local test database:

```bash
python -m pip install -e ".[dev,postgres]"
export VSF_POSTGRES_TEST_URL='postgresql://postgres:vsf-smoke-secret@127.0.0.1:55432/vsf_smoke'
make postgres-smoke
```

Or start a disposable Docker Postgres first:

```bash
docker run --rm --name vsf-profiler-postgres-smoke \
  -e POSTGRES_PASSWORD=vsf-smoke-secret \
  -e POSTGRES_DB=vsf_smoke \
  -p 55432:5432 \
  -d postgres:16

export VSF_POSTGRES_TEST_URL='postgresql://postgres:vsf-smoke-secret@127.0.0.1:55432/vsf_smoke'
make postgres-smoke
docker stop vsf-profiler-postgres-smoke
```

When `VSF_POSTGRES_TEST_URL` is not set, the smoke skips explicitly. Docker is
not required for the normal test suite unless a local Harness/tooling setup
chooses to provide it.

## Optional Real MySQL/MariaDB Smoke

The MySQL/MariaDB connector smoke is optional and local-only. It creates
disposable tables in the configured database, runs connector introspection,
verifies canonical artifacts and redaction, then drops the tables.

Use an existing local test database:

```bash
python -m pip install -e ".[dev,mysql]"
export VSF_MYSQL_TEST_URL='mysql://root:vsf-smoke-secret@127.0.0.1:3306/vsf_smoke'
make mysql-smoke
```

When `VSF_MYSQL_TEST_URL` is not set, the smoke skips explicitly. The connector
also accepts `mariadb://` URLs and uses the same `connector_metadata.json`
contract as Postgres.

## Optional Large Dataset Benchmark

The benchmark generates deterministic relational CSV data, runs the existing
Python/DuckDB pipeline, creates an export package, audits the artifacts, and
writes `performance_guard_report.json`.

CI-safe smoke:

```bash
make benchmark-small
python -m json.tool outputs/benchmark_ci/run/performance_guard_report.json
```

Optional larger local run:

```bash
make benchmark-large
python -m json.tool outputs/benchmark_large/run/performance_guard_report.json
```

Interpret the report as environment-specific evidence. It records row counts,
stage runtimes, peak RSS memory when supported, artifact sizes, influence row
and feature limits, default Postgres chunk size, chart/report/package success,
artifact audit status, and the source scan proving no production
`pandas.read_csv` or unguarded `.fetchdf()` paths.

## Web UI and Local Runner

The web workspace is the current browser surface over the same local artifact
contracts. The first screen separates the two supported demo flows:

- **Profile my data** for CSV+DBML profiling through upload mode or local path
  mode, with mandatory preflight review before a run.
- **Evaluate tool** for built-in faulty dataset comparisons against seeded
  ground truth and the available Great Expectations baseline state.

After a Profile run, the local runner opens the review surface with Quality
Gates, Review Issues, deterministic action plans, grouped todos, Report /
Export, table readiness, and Developer artifact evidence. Selected issues can
run optional fake/OpenAI enrichment as a short structured add-on; the
deterministic action plan remains the source of truth.

Treat database source mode, Olist preset paths, compatibility LLM report
artifacts, graph artifacts, and raw artifact links as developer/compatibility
surfaces.

Historical hosted previews are retained only as compatibility previews for
browser-side DBML/CSV mapping. They are not the product-facing workflow and do
not run Python/DuckDB jobs.

For full profiling from the browser, start the local runner:

```bash
make web-runner
open http://127.0.0.1:8765
```

The local runner binds only to `127.0.0.1`. It preserves CLI artifact contracts
and can run upload-mode jobs for demo/small-medium CSV+DBML inputs or local
path mode jobs where browser-entered DBML and CSV directory paths are validated
locally without uploading CSV bytes through the browser. Legacy controls for
association fields, database sources, and optional compatibility
LLM report artifacts remain available for compatibility but are not the main
workflow.
After a run completes, the local runner can show an interactive dashboard from
generated artifact URLs such as
`charts/*.json`, `issues.json`, `profile_summary.json`,
`relationship_graph.json`, `dataset_verdict.json`,
`table_assessments.json`, `schema_parse_report.json`,
`schema_evaluation.json`, `schema_diagram.json`, and `run_summary.json`.
Compatibility artifacts such as `lineage_graph.json` and `influence.json` may
also be present behind developer artifact links. The DBML diagram panel
switches from browser preview
state to generated `schema_diagram.json`, `relationship_graph.json`, and
`schema_parse_report.json` artifacts after a run. Its local ERD renderer uses
deterministic table layers, compact PK/FK-focused cards, orthogonal
relationship edges, fit/expanded/non-key controls, and table or relationship
drilldown backed by existing artifact evidence. The post-run snapshot previews
data-quality readiness, issue counts, table readiness, runtime summary, and
report links from those artifacts while keeping developer artifact links
available.

- Upload mode sends browser-selected DBML/CSV files to the local backend and is
  intended for demos and small-to-medium local files.
- Local path mode sends only local path strings to the backend, then runs the
  existing Python/DuckDB pipeline directly against those paths. Use it for
  larger local datasets when the CSV directory is visible to the server process.
- Developer database source mode sends a local Postgres or MySQL/MariaDB
  connection URL to the `127.0.0.1` backend, introspects selected tables,
  generates schema/DBML evidence, extracts temporary chunked CSV material for
  DuckDB scanning, and removes those temporary extracts after artifacts are
  written.

The static `report.html` keeps its deterministic issue summary. The web-runner
review surface is an interactive browser view with filters and drilldown; it
also renders table readiness and schema/relationship context from generated
artifact JSON. It does not fetch raw CSV files or rerun the profiler.

## Scope

Core MVP workflow:

- DBML/schema parsing with explicit `schema_parse_report.json` diagnostics.
- CSV cataloging by exact file stem first, then conservative schema/header
  inference or explicit manual mapping override.
- DuckDB-backed profiling without full pandas CSV loads.
- DBML-derived quality checks.
- FK relationship checks with cardinality, composite FK, and junction-table support.
- Issue catalog with evidence SQL, bounded sample bad rows, and data-quality
  next steps.
- Schema evaluation, relationship graph, deterministic data-quality
  readiness artifact (`dataset_verdict.json`), per-table assessment artifact
  (`table_assessments.json`), and chart specs rendered in reports.
- Deterministic quality gates, issue action plans, grouped todos, and
  selected-issue enrichment evidence when requested.
- Built-in evaluation datasets with ground truth, comparison summary, and
  explicit Great Expectations unavailable/not-covered states.
- Deterministic Markdown and HTML data-quality reports.

Compatibility and developer surfaces:

- Local-only web runner and historical static preview for browser-assisted mapping,
  local path runs, and artifact dashboard review.
- Postgres and MySQL/MariaDB connector modes for selected local database
  tables, writing additive `connector_metadata.json` without preserving raw
  connector extracts.
- Additive `lineage_graph.json` and `influence.json` artifacts.
- Exportable self-contained analysis package command with optional zip and
  optional `analysis_report.pdf`.
- Release-candidate hardening commands: `vsf-profiler doctor`,
  `make demo-full`, and `scripts/verify_vsf_artifacts.py`.
- Large dataset benchmark guardrails with `make benchmark-small`,
  `make benchmark-large`, and `performance_guard_report.json`.
- Optional compatibility LLM report artifacts from structured artifacts only,
  writing `l4_report.md` and `guardrail_report.json` when enabled. Selected
  issue enrichment writes `issue_llm_enrichments.json` only after a concrete
  issue is chosen. The built-in providers are `fake` for local validation and
  `openai` for opt-in API usage with `.env` configuration.
- Legacy Olist preset paths for relational CSV compatibility data.

Non-goals:

- No hosted Python/DuckDB backend job runner.
- No production database monitoring.
- No Spark/Kafka/realtime pipeline.
- No automatic data repair.
- No causal-inference claims.

## Tests

```bash
pytest -q
make demo-full
```
