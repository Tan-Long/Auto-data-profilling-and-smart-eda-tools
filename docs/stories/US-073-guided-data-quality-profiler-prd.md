# US-073 Guided CSV + DBML Data-Quality Profiler PRD

## Problem Statement

VSF Data Profiler currently exposes too much product surface at once. The web
runner mixes setup controls, runtime output, generated artifacts, dashboard
panels, graphs, LLM narrative links, and raw JSON/report artifacts in one long
console. Users can run the profiler, but they are not guided through a clear
sequence of decisions, and after a run they still need to interpret artifacts,
JSON files, long text, and chart panels to understand what is wrong.

The current product also carries advanced surfaces that dilute the main demo and
workflow: optional rules, target-column influence analysis, database connector
mode, lineage graph views, static Vercel preflight, package artifact dumps, and
Olist demo paths. These features make the UI and docs look more powerful, but
they make the core use case harder to understand.

The desired product is simpler and more useful: a guided CSV + DBML
data-quality workflow where users can upload or point at local CSV files plus a
DBML schema, review preflight warnings before running, watch each run stage,
inspect issues by table and column, get immediate structured fix guidance, and
export a report that answers what is wrong and what to do next. The product also
needs a separate evaluation flow that proves detection quality against seeded
faulty datasets and a Great Expectations baseline.

## Solution

Refocus VSF Data Profiler as a guided CSV + DBML data-quality profiler.

The first screen has two explicit flows:

1. Profile my data.
2. Evaluate tool.

Profile my data guides users through:

1. Connect: provide one DBML schema and related CSV files, with local path mode
   available as a secondary demo/large-data path.
2. Preflight Review: parse DBML, inspect CSV-to-table mapping, identify
   blockers and warnings, and require human review/acceptance for warnings
   before a run.
3. Run: execute the local profiler and show each run stage as a timeline.
4. Review Issues: default post-run view, organized as Table -> Column -> Issue.
5. Report / Export: HTML and PDF reports plus todo exports, without forcing
   users to read raw JSON artifacts.

Evaluate tool is a separate benchmark/demo flow. It does not accept arbitrary
uploads. Users choose built-in curated faulty datasets, then the app runs VSF
and a Great Expectations baseline, compares both against known ground truth,
and renders a visual comparison summary. Evaluation also measures output
usefulness through structured action plans, evidence coverage, guardrail status,
and actionability score.

LLM output is not a long narrative. Every LLM result must be structured as an
action-plan suggestion tied to a specific issue, table, or quality gate. The
application always creates deterministic action plans first. LLM providers can
enrich those plans on demand, using generated context plus bounded sample rows,
but they cannot silently replace deterministic guidance. If OpenAI output fails
schema or guardrail checks, the UI must show a human-review state rather than
fallback silently.

## User Stories

1. As a data analyst, I want the first screen to offer Profile my data and
   Evaluate tool, so that I know whether I am checking my own data or running a
   benchmark demo.
2. As a data analyst, I want Profile my data to ask only for CSV files and DBML
   in the Connect step, so that setup is not cluttered by optional controls.
3. As a demo presenter, I want local path mode to remain available as a
   secondary Connect option, so that I can run a prepared local dataset quickly.
4. As a data analyst, I want rules, target-column influence analysis, database
   mode, lineage, and graph exploration removed from the main flow, so that the
   workflow stays focused on data-quality issues.
5. As a data analyst, I want Preflight Review to be mandatory before Run, so
   that I can inspect mapping and schema warnings before profiling.
6. As a data analyst, I want preflight blockers to prevent Run, so that the
   product does not start a run that cannot succeed.
7. As a data analyst, I want preflight warnings to stop Run until reviewed, so
   that risky partial runs require human awareness.
8. As a data analyst, I want to accept individual preflight warnings with a
   note, so that I can intentionally run partial or imperfect datasets.
9. As a data reviewer, I want accepted preflight warnings recorded with the run,
   so that I can understand the conditions under which the report was produced.
10. As a data analyst, I want to see every run and stage in a timeline, so that
    I can check where a run is currently executing or where it failed.
11. As a data analyst, I want run history to persist from output folders, so
    that I can reopen prior runs after refreshing the page.
12. As a data analyst, I want the post-run default screen to be Review Issues,
    so that I can immediately inspect detected problems.
13. As a data analyst, I want issues grouped by table, then column, then issue,
    so that I can quickly answer where the problem is.
14. As a data analyst, I want schema-level and table-level issues separated
    from column issues, so that global mapping problems do not get lost.
15. As a data analyst, I want relationship issues to live under the child table
    and FK column, so that the issue has a clear home while still showing parent
    context.
16. As a data analyst, I want outliers labelled as review warnings, so that
    valid extremes are not treated as hard data failures by default.
17. As a data analyst, I want issue details in a drawer with Where, What
    happened, Evidence, Why it matters, and How to fix, so that I can understand
    each issue without opening JSON.
18. As a data analyst, I want bounded sample rows previewed as a table, so that
    I can see concrete evidence without downloading a sample CSV.
19. As a data analyst, I want every issue to include evidence values with label,
    raw value, and meaning, so that metrics are understandable.
20. As a data analyst, I want deterministic action plans for every issue, so
    that guidance is available even without an LLM provider.
21. As a data analyst, I want action plans rendered as a finding-values table,
    Fix data checklist, Verify after fix checklist, guidelines, and metrics, so
    that the output is immediately usable.
22. As a data analyst, I want fix todos and verify todos exported separately, so
    that remediation and validation work can be assigned to a team.
23. As a data analyst, I want a global Todos tab that groups duplicate todos
    while preserving table and column context, so that I can create a practical
    cleanup plan.
24. As a data analyst, I want issue-level copy/export for Markdown, CSV row, and
    structured JSON, so that I can reuse a single issue action plan.
25. As a data analyst, I want LLM enrichment to appear only after selecting an
    issue or other concrete target, so that the LLM stays tied to evidence.
26. As a data analyst, I want LLM output to be structured, short, and
    guardrailed, so that it does not become a long text block no one reads.
27. As a data analyst, I want OpenAI and fake provider choices to be explicit,
    so that demo runs can use fake output and real smoke runs can use OpenAI.
28. As a data analyst, I want OpenAI failures or schema/guardrail failures to
    require human review, so that invalid LLM output is not silently used.
29. As a data analyst, I want LLM metrics explained in tooltips or legends, so
    that evidence coverage, guardrail status, and actionability score are
    meaningful.
30. As a data analyst, I want quality gates such as Can run analysis, Can trust
    joins, Needs cleanup before sharing, and Outliers need review, so that the
    report makes data-readiness decisions explicit.
31. As a data analyst, I want quality gates computed deterministically, so that
    LLMs explain decisions without making readiness decisions.
32. As a data analyst, I want reports organized into fixed sections, so that I
    can find the same information in every run.
33. As a data analyst, I want reports to answer whether the dataset can run,
    which tables and columns have issues, what each issue means, what to fix,
    and how to verify the fix, so that the report is useful without raw
    artifacts.
34. As a data analyst, I want raw JSON artifacts hidden behind Developer
    artifacts or debug areas, so that normal users are not forced into artifact
    reading.
35. As a demo presenter, I want Evaluate tool to use built-in faulty datasets
    rather than uploads, so that benchmark truth is known and repeatable.
36. As a demo presenter, I want curated local samples shipped in the repo, so
    that demos run offline after setup.
37. As a demo presenter, I want each curated sample to have real and faulty
    variants, so that I can show profiling on realistic data and detection on
    seeded faults.
38. As a demo presenter, I want expected issues defined in ground-truth files,
    so that the benchmark knows what should be detected.
39. As a demo presenter, I want Great Expectations comparison in the evaluation
    flow, so that I can show VSF catches baseline-detectable issues and adds
    DBML/FK/outlier value.
40. As a demo presenter, I want baseline gaps labelled Not covered by baseline,
    so that GE is not unfairly marked failed for DBML-native checks.
41. As a demo presenter, I want the Evaluation UI to open on Comparison Summary,
    so that viewers can see caught, missed, baseline, and added-value outcomes
    immediately.
42. As a demo presenter, I want visual proof with checks, crosses, neutral
    dashes, review badges, and mini bars, so that detection quality is visible
    at a glance.
43. As a maintainer, I want evaluation metrics to include detection coverage,
    bad-count accuracy, baseline comparison, action-plan completeness, evidence
    coverage, and actionability score, so that the benchmark covers correctness
    and usefulness.
44. As a maintainer, I want report correctness checked against structured
    artifacts, so that report text cannot invent numbers or claims.
45. As a maintainer, I want screenshot validation for UI and report changes, so
    that visual readability is treated as acceptance evidence.

## Implementation Decisions

- Product positioning changes from Smart EDA to guided CSV + DBML data-quality
  profiler with issue explainability and benchmarked detection.
- Breaking simplification is accepted. The product removes rules YAML,
  target-column influence analysis, database connector mode, lineage graph,
  static Vercel product surface, Olist demo UI, long LLM report narratives, and
  artifact-dump-first package UX from the main product contract.
- The main supported input contract is DBML plus related CSV files. Local path
  mode remains as a secondary way to provide the same inputs.
- The main web workflow is soft-locked by stage. Users can return to completed
  stages but cannot skip prerequisites.
- Preflight review distinguishes non-overridable blockers from warnings that
  require per-warning human review and acceptance before Run.
- Accepted preflight warnings are persisted per run and rendered in run summary
  and report output.
- Run history is persistent by scanning output run folders and reading generated
  run summaries, without introducing a new application database.
- Post-run issue review is table-first. Column and issue filters support
  navigation, but severity and issue type are not the primary structure.
- Relationship and FK issues are assigned to the child table and FK column,
  while drawer details also show parent context.
- Graphs are not main navigation surfaces. A minimal schema/relationship
  context may appear inside preflight or issue details only when it improves
  comprehension.
- Evidence Values are a shared model for dataset, table, column, issue, quality
  gate, and action-plan outputs. Each value has a label, raw value, and human
  meaning.
- Action plans are structured outputs. The deterministic layer creates one for
  every issue. LLM providers can add suggestions but cannot overwrite the
  deterministic plan.
- Structured action plans include finding summary, evidence values, fix todos,
  verify todos, guidelines, priority, source, guardrail state, evidence
  coverage, and actionability score.
- Actionability score is deterministic and based on schema completeness, not on
  LLM self-assessment.
- Evidence coverage is computed over evidence sources used by each action plan.
- LLM output is always structured and guardrailed. Free text essays are
  rejected.
- OpenAI failure, timeout, schema failure, or guardrail failure is visible and
  requires human review. The UI offers retry, switch provider, or continue
  without LLM; it does not silently approve bad output.
- Sanitized LLM attempts are logged for audit without secrets or unbounded raw
  data.
- Reports render fixed sections: Run Summary, Table Overview, Column Issue
  Matrix, Issue Action Plans, Todos, and Evaluation Summary when applicable.
- Quality Gates are deterministic. LLM can explain gates but cannot decide them.
- Todos are read-only in the application for the first version and can be
  exported as Markdown, CSV, and JSON. Editing todo status is out of scope.
- Evaluation tool uses built-in faulty dataset catalog only. It does not accept
  user uploads because upload datasets lack benchmark ground truth.
- Evaluation uses Great Expectations as a required dependency for the
  comparison demo path, installed through an evaluation extra. Core profiling
  remains usable without GE.
- Evaluation distinguishes Detection benchmark from LLM structured output
  smoke. Detection pass/fail is independent of OpenAI.
- Curated real-world sample datasets are stored locally in small form, with
  source documentation and regeneration scripts. Faulty variants include
  explicit ground truth.

Major modules to build or modify:

- Workflow state and staged UI controller for Profile my data and Evaluate
  tool.
- Preflight review engine for blockers, warnings, acceptance state, and persisted
  run review records.
- Run history reader over output run folders.
- Issue inbox view model for Table -> Column -> Issue grouping.
- Bounded sample preview presenter.
- Evidence Values generator and schema.
- Issue action plan generator and schema.
- Structured LLM action-plan provider boundary and guardrail validator.
- Quality Gates evaluator.
- Todos export generator.
- Evaluation dataset catalog, ground-truth loader, Great Expectations baseline
  adapter, and comparison report generator.
- Report and PDF renderer aligned to fixed sections and structured outputs.

## Testing Decisions

- Tests should assert external behavior and generated contracts rather than
  private helper implementation.
- Unit tests should cover preflight classification, warning acceptance rules,
  Evidence Values generation, action-plan generation, actionability scoring,
  evidence coverage scoring, quality gate evaluation, todo grouping, LLM schema
  validation, and evaluation comparison scoring.
- Integration tests should run the CSV + DBML pipeline without rules, target,
  connectors, influence, or lineage as product-facing requirements.
- Integration tests should assert `preflight_review`, `evidence_values`,
  `issue_action_plans`, `action_todos`, quality gates, and report sections are
  generated and internally consistent.
- Evaluation tests should run built-in faulty datasets through VSF and the GE
  adapter, then compare expected issues, bad counts, baseline coverage, added
  value, and usefulness metrics.
- LLM tests should use fake providers for CI. OpenAI smoke is optional and
  should be explicit, never required for deterministic benchmark pass/fail.
- Web static tests should assert the two-flow first screen, stage locking,
  hidden raw artifact language in the main flow, issue drawer structure,
  action-plan layout, todos export controls, evaluation comparison summary, and
  provider failure states.
- E2E tests should cover Profile my data from Connect through Report and
  Evaluate tool through VSF-vs-GE comparison.
- Screenshot validation is required for workflow first screen, preflight review,
  run timeline, issue drawer/action plan, todos tab, evaluation comparison,
  report HTML, and mobile layouts.
- Report correctness tests should verify displayed counts and recommendations
  are consistent with structured artifacts.
- Prior art exists in current tests for demo runs, web runner routes, static UI,
  dashboard E2E, report/package rendering, LLM guardrails, artifact audit,
  benchmark generation, and schema/relationship checks.

## Out of Scope

- Uploading arbitrary datasets into Evaluate tool.
- Editable todo status or project-management sync.
- Hosted backend jobs or SaaS evaluation.
- Raw full-CSV LLM prompts.
- Long-form LLM report narratives.
- Automatic data repair.
- Causal claims from profiling or LLM output.
- Database connector mode.
- Rules YAML.
- Target-column influence analysis.
- Lineage graph product surfaces.
- Static Vercel preflight as a product-facing flow.
- Olist as a main demo path.
- Treating Great Expectations as failed for checks it does not natively cover.

## Further Notes

- Raw JSON and developer artifacts may remain available behind a debug or
  Developer artifacts area, but they are not the main user experience.
- Current artifact names may need compatibility handling during migration, but
  the target product contract should not require removed advanced artifacts.
- The implementation should include an ADR for the breaking product boundary
  and story slices that are narrow enough for independent agents to implement.
- Curated sample sources should include `SOURCE.md` files with source URL,
  license/terms notes, date retrieved, sampling rules, and injected defects.
- Human-readable copy should avoid Smart EDA, Senior Data Scientist, business
  impact, and artifact-dump framing unless needed for backward compatibility.
