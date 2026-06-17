# VSF Data Profiler v0.2 Local Release Candidate

`vsf-profiler` is a local-first CLI and `127.0.0.1` web runner that profiles
CSV datasets against a DBML schema, detects common data quality and
relationship issues, runs association-based influence analysis, and writes
Markdown/HTML reports plus machine-readable artifacts.

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

## Local Release Demo

No internet or Kaggle account is required.

```bash
make demo-small
open outputs/demo_small/report.html
```

For a 5-10 minute guided walkthrough, command checklist, artifact tour, and L4
guardrail caveats, use [docs/demo/vsf-data-profiler.md](docs/demo/vsf-data-profiler.md).
For the v0.2 release-candidate path, run:

```bash
vsf-profiler doctor
make demo-full
```

The full demo runs the synthetic demo, exports
`outputs/demo_small_package/`, writes `analysis_report.pdf` and
`outputs/demo_small_package.zip`, audits the canonical artifacts, and runs the
Playwright dashboard E2E when local
Node/Playwright tooling is installed. See
[docs/releases/v0.2-rc.md](docs/releases/v0.2-rc.md).

Latest public prerelease:
[VSF Data Profiler v0.2.0-rc2](https://github.com/Tan-Long/Auto-data-profilling-and-smart-eda-tools/releases/tag/vsf-profiler-v0.2.0-rc2),
with release notes in [docs/releases/v0.2.0-rc2.md](docs/releases/v0.2.0-rc2.md).

Expected artifacts:

```text
outputs/demo_small/profile_summary.json
outputs/demo_small/issues.json
outputs/demo_small/influence.json
outputs/demo_small/schema_parse_report.json
outputs/demo_small/lineage_graph.json
outputs/demo_small/schema_evaluation.json
outputs/demo_small/relationship_graph.json
outputs/demo_small/dataset_verdict.json
outputs/demo_small/table_assessments.json
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

On Windows, open the report with:

```bash
start outputs/demo_small/report.html
```

## Olist Demo

The Olist demo requires Kaggle CLI authentication. The synthetic demo does not
require internet access.

```bash
python -m pip install kaggle
kaggle auth login
make download-olist
make demo-olist
open outputs/olist_demo/report.html
```

If `kaggle auth login` is unavailable in your Kaggle CLI version, configure
`~/.kaggle/kaggle.json` or the Kaggle credential environment variables.

## CLI

```bash
vsf-profiler doctor

vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --rules data/demo_small/rules.yaml \
  --target order_reviews.review_score \
  --out outputs/demo_small

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

# Postgres mode reads selected local database tables through a chunked connector.
# Prefer the environment variable path so credentials are not stored in shell history.
export VSF_PROFILER_POSTGRES_URL='postgresql://user:password@127.0.0.1:5432/app'
vsf-profiler run \
  --postgres-url-env VSF_PROFILER_POSTGRES_URL \
  --postgres-schema public \
  --postgres-tables customers,orders,order_items \
  --target orders.order_total \
  --out outputs/postgres_profile

# MySQL/MariaDB mode uses the same connector boundary and temporary chunked extracts.
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
  --rules data/demo_small/rules.yaml \
  --target order_reviews.review_score \
  --out outputs/demo_small_l4 \
  --use-llm \
  --llm-provider fake

cp .env.example .env
# edit .env and add OPENAI_API_KEY before using the real provider
vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --rules data/demo_small/rules.yaml \
  --target order_reviews.review_score \
  --out outputs/demo_small_l4_openai \
  --use-llm \
  --llm-provider openai

vsf-profiler demo create-small --out data/demo_small
vsf-profiler demo download-olist --out data/olist
vsf-profiler demo run-olist --csv-dir data/olist --out outputs/olist_demo
```

## Real Postgres Smoke

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

## Real MySQL/MariaDB Smoke

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

## Large Dataset Benchmark

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

The web workspace has two distinct surfaces:

- the hosted/static preflight UI for DBML and small CSV header mapping; and
- the local web runner for full Python/DuckDB profiling jobs on
  `127.0.0.1`.

The static preflight UI lets a user upload a DBML file and related CSV files in
the browser, auto-link CSV file stems to DBML tables, inspect PK/FK
relationships, and inspect a local schema diagram without depending on an
external iframe. A generated dbdiagram.io link remains available as a secondary
action. It does not run the Python/DuckDB profiler, database connectors, local
path jobs, LLM narratives, package/PDF export, or backend dashboard jobs.

Static preflight deployment:

```text
https://smart-eda.vercel.app
```

For full profiling from the browser, start the local runner:

```bash
make web-runner
open http://127.0.0.1:8765
```

The local runner binds only to `127.0.0.1`. It preserves CLI artifact
contracts and can run upload-mode jobs for demo/small-medium files or local
path mode jobs where browser-entered DBML, CSV directory, and optional rules
paths are validated locally without uploading CSV bytes through the browser.
After a run completes, the local runner shows an interactive dashboard from
generated artifact URLs such as
`charts/*.json`, `issues.json`, `profile_summary.json`,
`relationship_graph.json`, `dataset_verdict.json`,
`table_assessments.json`, `schema_parse_report.json`, `lineage_graph.json`,
`schema_evaluation.json`, `schema_diagram.json`, `influence.json`, and
`run_summary.json`. The DBML diagram panel switches from browser preflight
state to generated `schema_diagram.json`, `relationship_graph.json`, and
`schema_parse_report.json` artifacts after a run. Its local ERD renderer uses
deterministic table layers, compact PK/FK-focused cards, orthogonal
relationship edges, fit/expanded/non-key controls, and table or relationship
drilldown backed by existing artifact evidence. The Generated results panel
previews verdict, issue counts, table impact, runtime summary, and report links
from those artifacts while keeping raw artifact links available.

- Upload mode sends browser-selected DBML/CSV/rules files to the local backend
  and is intended for demos and small-to-medium local files.
- Local path mode sends only local path strings to the backend, then runs the
  existing Python/DuckDB pipeline directly against those paths. Use it for
  larger local datasets when the CSV directory is visible to the server process.

The static `report.html` keeps its deterministic Visual Summary. The web
runner dashboard is the interactive browser view with filters and drilldown; it
also renders table assessments, lineage, and relationship graphs from
generated artifact JSON. It does not fetch raw CSV files or rerun the profiler.

## Scope

v0.2 local release-candidate scope:

- DBML subset parsing with explicit `schema_parse_report.json` diagnostics.
- CSV cataloging by file stem.
- Optional Postgres and MySQL/MariaDB connector modes for selected tables,
  writing additive `connector_metadata.json` without preserving raw connector
  extracts.
- DuckDB-backed profiling without full pandas CSV loads.
- DBML-derived quality checks.
- YAML business rules.
- FK relationship checks with cardinality, composite FK, and junction-table support.
- Issue catalog with evidence SQL and sample bad rows.
- DBML diagram artifacts with a dbdiagram.io embed link and CSV-to-table mapping.
- Local web-runner ERD-style DBML diagram preview for deterministic table
  layers, compact PK/FK cards, orthogonal relationship edges, fit controls,
  CSV mapping status, relationship drilldown, and parser diagnostics.
- Additive lineage graph artifact connecting input sources, schema entities,
  relationships, profiler stages, and generated artifacts.
- Deterministic severity aggregation and dataset verdict artifact.
- Deterministic chart-spec artifacts rendered as report visual summaries.
- Static web UI and Vercel preflight deployment for browser-side DBML/CSV
  mapping and visualization preview only.
- Local-only web runner with separate upload mode and local path mode, both
  backed by the existing Python pipeline, plus an interactive artifact
  dashboard rendered from generated JSON artifacts, including lineage and
  relationship graph views.
- Exportable self-contained analysis package command for offline review,
  writing `index.html`, `export_manifest.json`, copied generated artifacts,
  bounded sample evidence, an optional deterministic zip archive, and optional
  `analysis_report.pdf` without raw source CSV files.
- Generated Markdown, HTML, package index, and package PDF reports use a
  Senior Data Scientist review layout: executive scorecard, visual summaries,
  table impact, issue evidence, relationship/schema/lineage summaries, and
  explicit L4 guardrail state from existing artifacts only.
- Release-candidate hardening with `vsf-profiler doctor`, `make demo-full`,
  and `scripts/verify_vsf_artifacts.py` for final artifact/package audits.
- Large dataset benchmark guardrails with `make benchmark-small`,
  `make benchmark-large`, and `performance_guard_report.json`.
- Deterministic Markdown and HTML reports.
- Optional guarded Senior Data Scientist narrative from structured artifacts
  only, writing `l4_report.md` and `guardrail_report.json` when enabled.
  The built-in providers are `fake` for local validation and `openai` for
  opt-in API usage with `.env` configuration. OpenAI-compatible model config is
  validated before dispatch, and reports/dashboard views surface L4 guardrail
  status, provider, fallback reason, and artifact links when L4 artifacts exist.
- Olist-specific influence preset for `review_score`.

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
