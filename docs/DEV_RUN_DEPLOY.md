# Dev, Run, Deploy Guide

This guide is the current operational reference for developing, running, and
deploying the VSF Data Profiler local runner.

## System Components

| Component | Path | Purpose |
| --- | --- | --- |
| Python package | `src/vsf_profiler/` | CLI, DuckDB profiling pipeline, artifact generation, web-runner backend. |
| CLI entrypoint | `vsf-profiler = vsf_profiler.cli:app` | Runs profiles, creates demo data, starts web runner, packages outputs. |
| Web UI | `web/` | Browser workflow for CSV+DBML profiling, review, history, and recheck. |
| Report templates | `templates/` | Deterministic Markdown/HTML report rendering. |
| Demo data | `data/demo_small/` | Faulty CSV+DBML demo used for normal profiling. |
| Corrected demo data | `data/demo_small_corrected/` | Corrected companion dataset used by Stage 5 recheck demos. |
| Evaluation data | `data/evaluation_public/` | Public local snapshots for built-in evaluation datasets. |
| Legacy examples | `examples/` | Compatibility schemas/rules such as Olist and Jaffle. |
| Generated outputs | `outputs/` | Local run artifacts, reports, web-run history, packages. Do not commit. |
| Docker runtime | `Dockerfile`, `docker-compose.yml` | Containerized local runner on port `8765`. |
| CI smoke | `.github/workflows/docker-smoke.yml` | Builds Docker image and checks `/api/health` on pull requests. |

## Runtime Model

The product workflow is local-first:

```text
DBML + CSV directory
  -> preflight mapping/schema review
  -> Python web runner or CLI
  -> DuckDB-backed profiling
  -> JSON artifacts, bounded samples, reports
  -> browser Review and Fix & Recheck surfaces
```

The browser does not mutate source files. Stage 5 creates a staged copy or
accepts corrected inputs, runs profiling again, and writes before/after diff
artifacts.

## Prerequisites

- Python `3.11+` for local development.
- Docker for container smoke/deploy.
- Node.js only for Playwright E2E tests.
- GitHub CLI `gh` only for PR/release operations.

Recommended local setup:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev,evaluation]"
```

Install optional extras only when needed:

```bash
python -m pip install -e ".[dev,evaluation,ml,postgres,mysql]"
npm ci
```

## Python Libraries

Core runtime dependencies are declared in `pyproject.toml`:

| Dependency | Used for |
| --- | --- |
| `duckdb` | External-memory CSV scans, joins, aggregation, validation queries. |
| `pandas` | Bounded analysis frames only, not full raw CSV loading. |
| `pydantic` | Runtime/report/domain data contracts. |
| `jinja2` | Markdown and HTML report templates. |
| `pyyaml` | Optional mapping/rules YAML parsing. |
| `typer` | CLI commands. |

Optional extras:

| Extra | Dependency | Used for |
| --- | --- | --- |
| `dev` | `pytest`, `ruff` | Unit/integration tests and linting. |
| `evaluation` | `great-expectations` | Built-in Evaluate tool baseline comparison. |
| `ml` | `scikit-learn` | Legacy bounded influence/association analysis. |
| `postgres` | `psycopg[binary]` | Optional local Postgres connector smoke. |
| `mysql` | `pymysql` | Optional local MySQL/MariaDB connector smoke. |

Node dependency:

| Dependency | Used for |
| --- | --- |
| `@playwright/test` | Browser E2E checks under `tests/e2e/`. |

## Environment Variables

Copy `.env.example` only for optional local settings:

```bash
cp .env.example .env
```

Do not commit `.env`.

| Variable | Default / example | Purpose |
| --- | --- | --- |
| `VSF_PROFILER_OUTPUT_DIR` | `outputs/web_runs` | Web-runner run root. |
| `VSF_PROFILER_PORT` | `8765` | Host port used by Docker Compose. |
| `OPENAI_API_KEY` | blank | Optional OpenAI issue/report enrichment. |
| `VSF_PROFILER_LLM_PROVIDER` | `openai` | Optional provider selection. |
| `VSF_OPENAI_MODEL` | `gpt-5.4-mini` | Optional OpenAI-compatible model override. |
| `VSF_OPENAI_BASE_URL` | `https://api.openai.com/v1` | Optional OpenAI-compatible API base URL. |
| `VSF_OPENAI_TIMEOUT_SECONDS` | `60` | Optional provider timeout. |
| `VSF_OPENAI_MAX_OUTPUT_TOKENS` | `1200` | Optional provider output cap. |
| `VSF_POSTGRES_TEST_URL` | unset | Optional live Postgres acceptance smoke. |
| `VSF_MYSQL_TEST_URL` | unset | Optional live MySQL/MariaDB acceptance smoke. |

LLM calls are opt-in. The default profile run does not require network access or
model credentials.

## Data Layout

### Current Demo Data

`data/demo_small/` contains the faulty demo:

```text
data/demo_small/schema.dbml
data/demo_small/csv/*.csv
```

`data/demo_small_corrected/` contains the corrected companion demo:

```text
data/demo_small_corrected/schema.dbml
data/demo_small_corrected/csv/*.csv
```

Current UI presets use DBML and CSV paths only. They do not send a rule file.

Regenerate both demo datasets:

```bash
vsf-profiler demo create-small --out data/demo_small
vsf-profiler demo create-small-corrected --out data/demo_small_corrected
```

### Evaluation Data

`data/evaluation_public/` contains local public snapshots and license text.
These support the Evaluate tool without network access.

### Legacy / Optional Data

`examples/olist/` and `examples/jaffle/` contain compatibility schemas and rule
files. Olist CSV data is downloaded separately into `data/olist/` when needed:

```bash
python -m pip install kaggle
kaggle auth login
vsf-profiler demo download-olist --out data/olist
```

## Run Locally

### CLI Profile Run

Current CSV+DBML demo run:

```bash
vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --target order_reviews.review_score \
  --out outputs/demo_small
```

Open the generated report:

```bash
open outputs/demo_small/report.html
```

Important artifacts:

```text
outputs/demo_small/issues.json
outputs/demo_small/profile_summary.json
outputs/demo_small/dataset_verdict.json
outputs/demo_small/quality_gates.json
outputs/demo_small/table_assessments.json
outputs/demo_small/issue_action_plans.json
outputs/demo_small/issue_todos.json
outputs/demo_small/remediation_plan.json
outputs/demo_small/report.html
outputs/demo_small/run_events.jsonl
outputs/demo_small/run_summary.json
outputs/demo_small/charts/
outputs/demo_small/samples/
```

Optional CLI inputs:

- `--mapping mapping.yaml` for explicit table-to-CSV overrides.
- `--rules rules.yaml` for legacy/compatibility rule checks.
- `--use-llm --llm-provider fake` for local guarded LLM artifact smoke.
- `--use-llm --llm-provider openai` only when `OPENAI_API_KEY` is configured.

### Local Web Runner

Start the full Python/DuckDB web runner:

```bash
vsf-profiler web --host 127.0.0.1 --port 8765 --run-root outputs/web_runs
open http://127.0.0.1:8765
```

Health check:

```bash
curl -fsS http://127.0.0.1:8765/api/health
```

Profile flow:

1. Open **Profile my data**.
2. Use the built-in small demo or upload DBML + CSV files.
3. Run preflight review.
4. Run profile.
5. Review Quality Gates, Review Issues, Todos, Report / Export, and Table Readiness.

Stage 5 recheck flow:

1. Open **Fix & Recheck**.
2. Select a completed baseline run from history.
3. Use **Run corrected demo** for the bundled corrected dataset, or upload corrected CSV files.
4. Stage 3 shows before/after comparison after the recheck completes.
5. Use **Apply supported fixes to copy + re-run** only when the selected baseline has supported deterministic copy-only actions.

Generated web-run files are written under:

```text
outputs/web_runs/<job_id>/input/
outputs/web_runs/<job_id>/artifacts/
```

## Development Checks

Run before committing:

```bash
node --check web/app.js
python -m ruff check src tests
python -m pytest -q
```

Optional browser E2E:

```bash
npm ci
npm run test:e2e:dashboard
```

Optional live database smokes:

```bash
export VSF_POSTGRES_TEST_URL='postgresql://user:password@127.0.0.1:55432/vsf_smoke'
python -m pytest -q tests/test_postgres_acceptance.py

export VSF_MYSQL_TEST_URL='mysql://user:password@127.0.0.1:3306/vsf_smoke'
python -m pytest -q tests/test_mysql_acceptance.py
```

If the database URLs are unset, those acceptance smokes skip explicitly.

## Docker Run / Deploy

Build and run locally:

```bash
docker build -t vsf-profiler-local .
docker run --rm \
  -p 8765:8765 \
  -v "$PWD/outputs:/app/outputs" \
  -v "$PWD/data:/app/data" \
  --env-file .env.example \
  vsf-profiler-local
```

Docker Compose:

```bash
docker compose up --build
```

Runtime behavior:

- Container listens on `0.0.0.0:8765`.
- Host sees the app at `http://127.0.0.1:${VSF_PROFILER_PORT:-8765}`.
- `./outputs` is mounted to `/app/outputs`.
- `./data` is mounted to `/app/data`.
- The container creates `data/demo_small` on startup if missing.
- `VSF_PROFILER_OUTPUT_DIR` defaults to `/app/outputs/web_runs` in Docker.

CI uses `.github/workflows/docker-smoke.yml` to build this image, run the
container, and verify `/api/health`.

## Static Deploy Boundary

The `web/` folder can be served as a static preview, but static hosting alone
does not run Python/DuckDB jobs.

Static-only preview can show browser-side DBML/CSV mapping UI, but it cannot:

- start profile jobs;
- run Evaluate;
- write `outputs/web_runs`;
- create Stage 5 recheck runs;
- serve generated artifact URLs from a backend run.

For a public deployment, put the Python web runner behind infrastructure that
this repo does not provide:

- TLS termination;
- authentication/authorization;
- reverse proxy or gateway;
- persistent mounted output storage;
- retention cleanup for `outputs/web_runs`;
- network and file-size limits appropriate for user data.

Do not expose `vsf-profiler web --host 0.0.0.0` directly to the public internet.

## Generated Files And Git Hygiene

Commit:

- source under `src/`;
- UI under `web/`;
- templates under `templates/`;
- tests under `tests/`;
- checked-in demo fixtures under `data/demo_small`, `data/demo_small_corrected`, and `data/evaluation_public`;
- documentation under `docs/`.

Do not commit:

- `.env`;
- `.venv/`;
- `node_modules/`;
- `outputs/`;
- downloaded private/raw data such as `data/olist/`;
- Playwright screenshots or local browser snapshots unless explicitly needed;
- `__pycache__/` or `.pytest_cache/`.

## Troubleshooting

### Port 8765 Is Busy

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
vsf-profiler web --port 8766
```

### `Rules path does not exist`

The current product UI does not require rule files. Regenerate demo data and
run without `--rules`:

```bash
vsf-profiler demo create-small --out data/demo_small
vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --target order_reviews.review_score \
  --out outputs/demo_small
```

Use `--rules` only for legacy examples that actually include a rules file.

### Stage 5 Button Does Nothing

`Apply supported fixes to copy + re-run` only runs when the selected baseline
has supported deterministic actions and is an eligible source run. If it is
disabled, read the note under the button. For corrected-demo or manual edited
data, use **Upload corrected inputs** or **Run corrected demo**.

### Evaluate Baseline Is Unavailable

Install the evaluation extra:

```bash
python -m pip install -e ".[evaluation]"
```

If Great Expectations is still unavailable, the app marks baseline rows as
`unavailable` or `not_covered`; the profiler itself can still run.

### OpenAI Is Not Used

Set `OPENAI_API_KEY` and explicitly enable LLM usage. Default profiling does
not call OpenAI.

```bash
export OPENAI_API_KEY='...'
vsf-profiler run \
  --dbml data/demo_small/schema.dbml \
  --csv-dir data/demo_small/csv \
  --target order_reviews.review_score \
  --out outputs/demo_small_openai \
  --use-llm \
  --llm-provider openai
```

### Docker Cannot See Local Data

Ensure both mounts are present:

```bash
-v "$PWD/outputs:/app/outputs"
-v "$PWD/data:/app/data"
```

Local path mode inside the container can only read paths visible inside the
container filesystem.
