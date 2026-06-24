# VSF Data Profiler Demo

This is the current live-demo path for the guided CSV+DBML data-quality
profiler. It runs locally, uses built-in sample data, keeps raw artifacts behind
developer links, and does not require internet access, OpenAI credentials, or
Great Expectations to be installed.

## 5-10 Minute Demo Script

1. Start on the first screen and point out the two intended flows:
   **Profile my data** for a user CSV+DBML run, and **Evaluate tool** for a
   built-in faulty dataset comparison.
2. Choose **Profile my data**. In Connect, select **Local CSV path** and keep
   the **Small CSV demo** preset. Show that Preflight Review gates the run:
   blockers stop execution, warnings require review, and the accepted review is
   persisted with the run.
3. Run the Profile job. On completion, start with **Quality Gates** and
   **Review Issues**. Show the table-first issue inbox, then open issue
   `ISSUE-0009` to show Where, What happened, Evidence, Why it matters, How to
   fix, deterministic Action plan, sample rows, and issue-level copy controls.
4. Show **Todos** and **Report / Export**. The report links and todo copy
   actions are the primary user path; JSON/runtime files remain available below
   as Developer artifact evidence.
5. Switch to **Evaluate tool**. Choose a curated faulty dataset and run the
   local comparison. Show VSF caught/missed/extra findings, actionability and
   evidence metrics, and the Great Expectations baseline state. If GE is not
   installed, the baseline rows should read as unavailable or not covered
   rather than failing the demo.
6. Return to the selected issue drawer and run **Fake** issue LLM enrichment.
   Show the short structured add-on sections: Why this was flagged, Extra fix
   suggestion, Extra verification, and Human review needed. Emphasize that the
   deterministic action plan remains the source of truth.
7. Switch the same drawer control to **OpenAI** and run it with no local
   `OPENAI_API_KEY`. The expected default demo state is explicit
   `unavailable` with human review required, not a silent fake-provider
   fallback.

## Command Checklist

Install and prepare the local environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
```

Regenerate the deterministic CLI demo report:

```bash
PATH="$PWD/.venv/bin:$PATH" make demo-small
open outputs/demo_small/report.html
```

Start the local web runner for the guided browser demo:

```bash
PATH="$PWD/.venv/bin:$PATH" vsf-profiler web --port 8765
open http://127.0.0.1:8765
```

The default runner binds to `127.0.0.1`. For a trusted container or local
self-host smoke, use an explicit host and keep public auth/reverse proxying out
of this demo:

```bash
PATH="$PWD/.venv/bin:$PATH" vsf-profiler web --host 0.0.0.0 --port 8765
```

Docker runs the same web runner and writes artifacts to host `outputs/`:

```bash
docker compose up --build
curl http://127.0.0.1:8765/api/health
open http://127.0.0.1:8765
```

Export the report package after `make demo-small`:

```bash
PATH="$PWD/.venv/bin:$PATH" vsf-profiler package \
  --input outputs/demo_small \
  --output outputs/demo_small_package \
  --zip \
  --pdf \
  --force
open outputs/demo_small_package/index.html
```

Run the browser proof path and refresh the Goal 12 screenshots:

```bash
VSF_E2E_PORT=8779 npm run test:e2e:dashboard
```

## Screenshot Checklist

The final demo-readiness proof should include these fresh screenshots:

| Screenshot | What it proves |
| --- | --- |
| `outputs/us073_goal12/first-screen-two-flow-choice.png` | The first screen clearly separates Profile my data from Evaluate tool. |
| `outputs/us073_goal12/profile-post-run-review-surface.png` | A completed Profile run opens into the review surface with gates, issues, readiness, todos, and reports. |
| `outputs/us073_goal12/evaluate-comparison-summary.png` | Evaluate renders a real built-in comparison summary. |
| `outputs/us073_goal12/issue-drawer-after-fake-llm-enrichment.png` | Fake selected-issue LLM enrichment is structured and secondary to the deterministic action plan. |
| `outputs/us073_goal12/issue-drawer-openai-unavailable.png` | OpenAI missing-key/provider failure is visible and requires human review. |
| `outputs/us073_goal12/report-export-surface.png` | Report / Export keeps human-facing outputs before Developer artifacts. |

## Artifact Tour

| Artifact | Demo talking point |
| --- | --- |
| `profile_summary.json` | Table and column profiling from CSV scans, including row counts, nulls, distinct values, numeric percentiles, IQR outlier evidence, and type-oriented summaries. |
| `issues.json` | Normalized quality findings with severity, table/column refs, counts, evidence SQL, sample paths, evidence notes, and data-quality next steps. |
| `schema_parse_report.json` | DBML parsed object counts, warnings, unsupported constructs, and parser diagnostics. |
| `schema_evaluation.json` | DBML-vs-CSV conformance summary, including mapping confidence, missing/ambiguous/extra table or column evidence, and schema issue references. |
| `relationship_graph.json` | Table relationships with observed FK health, cardinality, junction-table detection, and relationship issue links. |
| `quality_gates.json` | Deterministic gates for analysis readiness, join trust, cleanup before sharing, and outlier review. |
| `table_assessments.json` | One deterministic readiness assessment per profiled table, including role, health score, relationship risk, and next steps. |
| `issue_action_plans.json` | The deterministic source of truth for issue remediation guidance. |
| `issue_todos.json` | Grouped Fix data and Verify after fix todos derived from deterministic action plans. |
| `issue_llm_enrichments.json` | Optional selected-issue enrichment attempts, including fake/OpenAI status, guardrail result, sanitized request summary, and human-review state. |
| `evaluation_summary.json` | Built-in benchmark comparison summary for VSF correctness, usefulness, and baseline status. |
| `ground_truth_issues.json` | Seeded expected findings for the selected built-in evaluation dataset. |
| `baseline_comparison.json` | Great Expectations baseline comparison rows, including unavailable and not-covered states. |
| `report.html` / `report.md` | Compact fixed-section reports for the normal user review path. |
| `samples/*.csv` | Bounded bad-row samples for evidence preview. Full source CSV files stay outside the package and artifact API. |

Compatibility artifacts such as `influence.json`, `lineage_graph.json`, and
legacy guarded LLM report files can still appear in developer runs, but they
are not the primary Goal 12 demo path.

## Demo Caveats

- The default Profile demo is deterministic and does not require OpenAI.
- Evaluate uses built-in datasets only; it does not accept arbitrary uploads.
- Great Expectations is optional for this local demo. Missing GE should render
  as an explicit unavailable baseline state.
- Selected-issue LLM enrichment is advisory. It never changes deterministic
  action plans, todos, quality gates, severity, readiness, or evaluation scores.
- OpenAI mode must be opt-in and may show `unavailable` when no key is
  configured. Do not commit `.env` or print API keys.
- LLM context is built from generated artifacts and bounded samples only; raw
  source CSV files and unbounded rows are not sent to providers.
