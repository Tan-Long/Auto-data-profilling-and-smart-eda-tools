# VSF Data Profiler Demo Package

This is the concise v0.2 local release-candidate demo path. It uses the
bundled Olist-shaped demo dataset and does not require internet access.

## 5-10 Minute Demo Script

1. Setup and orient: VSF Data Profiler is a local CLI for profiling CSV files
   against a DBML schema. It uses DuckDB for large-file-friendly scans and
   writes static Markdown/HTML plus machine-readable artifacts.
2. Run the release demo:
   `PATH="/Users/jin/repository-harness/.venv/bin:$PATH" make demo-full`
3. Open `outputs/olist_demo/report.html`. Point out schema mapping,
   relationship checks, issue counts, visual summaries, dataset findings, and
   execution flow.
4. Show the artifact directory:
   `find outputs/olist_demo -maxdepth 2 -type f | sort`
5. Run the fake LLM path to show deterministic guardrails without an API call.
6. Open `outputs/olist_demo_l4/report.html`, then show `l4_report.md` and
   `guardrail_report.json`.
7. Run the OpenAI smoke path only when `.env` has `OPENAI_API_KEY`. Explain
   that OpenAI may produce unsupported claims; if so, guardrails reject the
   candidate and write deterministic fallback with `fallback_used`.
8. In the local web runner, show that completed upload/path jobs populate the
   interactive dashboard from generated artifact URLs. Contrast it with the
   static report Visual Summary, which remains deterministic and non-interactive.
9. Close with the v0.2 local RC boundary: local CLI, static Vercel preflight
   only, full browser jobs through `127.0.0.1`, deterministic artifacts,
   optional guarded L4 narrative, optional Postgres/MySQL smokes, optional PDF
   package export, and no hosted Python/DuckDB backend runner.

## Command Checklist

Default deterministic demo:

```bash
PATH="/Users/jin/repository-harness/.venv/bin:$PATH" make demo-small
open outputs/olist_demo/report.html
```

Release-candidate demo:

```bash
PATH="/Users/jin/repository-harness/.venv/bin:$PATH" vsf-profiler doctor
PATH="/Users/jin/repository-harness/.venv/bin:$PATH" make demo-full
open outputs/olist_demo_package/index.html
```

Fake LLM demo:

```bash
PATH="/Users/jin/repository-harness/.venv/bin:$PATH" vsf-profiler run \
  --dbml data/demo_olist/schema.dbml \
  --csv-dir data/demo_olist/csv \
  --out outputs/olist_demo_l4 \
  --use-llm \
  --llm-provider fake
open outputs/olist_demo_l4/report.html
```

OpenAI smoke demo:

```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY; do not commit .env
PATH="/Users/jin/repository-harness/.venv/bin:$PATH" vsf-profiler run \
  --dbml data/demo_olist/schema.dbml \
  --csv-dir data/demo_olist/csv \
  --out outputs/olist_demo_l4_openai_smoke \
  --use-llm \
  --llm-provider openai
.venv/bin/python scripts/verify_openai_smoke.py
open outputs/olist_demo_l4_openai_smoke/report.html
```

## Artifact Tour

| Artifact | Demo talking point |
| --- | --- |
| `profile_summary.json` | Table and column profiling from CSV scans, including row counts, nulls, distinct values, and type-oriented summaries. |
| `issues.json` | Normalized quality findings with severity, table/column refs, counts, evidence SQL, sample paths, probable causes, and suggested fixes. |
| `connector_metadata.json` | Optional for connector runs. Records source type, tables scanned, row estimates, extraction status, warnings, and redaction status. |
| `schema_parse_report.json` | DBML parsed object counts, warnings, unsupported constructs, and parser diagnostics. |
| `schema_evaluation.json` | DBML-vs-CSV conformance summary, including missing/extra table or column evidence and schema issue references. |
| `relationship_graph.json` | Graph of tables and DBML relationships with observed FK status, cardinality, junction-table detection, and relationship issue links. |
| `dataset_verdict.json` | Deterministic issue counts, top blockers, affected tables, and recommended next actions. |
| `table_assessments.json` | One deterministic assessment per profiled table with role, issue counts, relationship findings, name-token business impact, evidence refs, and next actions. |
| `charts/*.json` | Deterministic chart specs for issue counts, missingness, and relationship FK status. |
| `l4_report.md` | Optional Senior Data Scientist narrative generated only when `--use-llm` runs; may be provider output or deterministic fallback. |
| `guardrail_report.json` | Audit record for L4 validation: status, provider, fallback reason, checked numbers, checked refs, violations, and raw-data flags. |

The static `report.html` renders a deterministic Visual Summary from these
chart specs. The local web runner adds the interactive dashboard: filters,
chart-item drilldown, issue rows, and artifact/sample links all come from the
same generated artifacts and protected web-runner URLs.

## Demo Caveats

- The default run is fully deterministic and should not write `l4_report.md` or
  `guardrail_report.json`.
- `--llm-provider fake` is for local validation and should produce a passed
  guardrail report without calling a real API.
- `--llm-provider openai` is opt-in and uses local `.env` configuration. Do not
  commit `.env` or print API keys.
- OpenAI may return prose with unsupported numbers or references. That is not a
  demo failure if `guardrail_report.json` records `fallback_used` with a clear
  reason such as `guardrail_failed`.
- L4 prompts use structured artifacts only. Raw CSV rows and unbounded samples
  are not sent through the narrative path.

## v0.2 Local RC Summary

v0.2 local RC is ready after doctor, default demo, package/PDF export, artifact
audit, benchmark smoke, optional Postgres/MySQL smokes, fake LLM validation,
OpenAI smoke verification when configured, and local web-runner
upload/path/dashboard flows pass. The hosted Vercel surface remains static
preflight only; full jobs run through the local `127.0.0.1` runner.
