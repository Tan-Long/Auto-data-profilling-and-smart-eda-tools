# 0030 Guided Data-Quality Profiler Boundary

Date: 2026-06-23

## Status

Accepted

## Context

The implemented VSF Data Profiler has accumulated many advanced surfaces:
optional rules, target-column influence analysis, database connector mode,
lineage graphs, static Vercel preflight, Olist demos, package artifact dumps,
interactive graph exploration, and long optional LLM report narratives.

User feedback from the product review was that the product needs a guided
step-by-step flow, direct issue inspection, structured explanations, simple
visual table/column reports, and evidence that detection results are correct
and useful. Long LLM text and raw artifacts are not a usable output for the
target demo.

## Decision

Refocus the product on a guided CSV + DBML data-quality workflow.

The product-facing workflow is:

1. Profile my data: CSV + DBML input, mandatory preflight review, local run
   timeline, table-first issue inbox, structured action plans, todos, and
   HTML/PDF report export.
2. Evaluate tool: built-in faulty datasets only, VSF vs Great Expectations
   baseline comparison, expected-vs-detected results, and output-usefulness
   scoring.

The main product no longer presents rules YAML, target-column influence
analysis, database connectors, lineage graphs, static Vercel preflight, Olist
demo UI, graph exploration, or long LLM narrative reports as product-facing
capabilities.

LLM output must be structured, bounded, evidence-linked, and guardrailed. The
deterministic system creates action plans first; LLM providers may add
suggestions but do not overwrite deterministic guidance. Failed OpenAI schema or
guardrail validation creates a human-review state, not silent fallback.

## Alternatives Considered

1. Keep the broad Smart EDA product and reorganize the existing dashboard.
   Rejected because the review feedback targets product shape, not just visual
   polish.
2. Keep rules, influence, connectors, lineage, and graphs as advanced controls
   in the same UI. Rejected because those controls recreate the overloaded
   workflow.
3. Make LLM the main report generator. Rejected because long text is not read
   and report correctness must come from structured artifacts.
4. Evaluate arbitrary uploaded datasets. Rejected because benchmark correctness
   requires known ground truth.

## Consequences

Positive:

- The product has a clear first-screen choice and step-by-step user journey.
- Users can inspect issues directly by table and column.
- Reports and exports are actionable through structured evidence values and
  todos.
- Demo quality can be proven through seeded faulty datasets and a baseline
  comparison.
- LLM output becomes useful, bounded, auditable, and optional.

Tradeoffs:

- Existing advanced capabilities need removal, deprecation, or hidden legacy
  handling.
- Artifact contracts and tests that currently expect rules, influence,
  connectors, lineage, Vercel, Olist, or package dump behavior need migration.
- Evaluation adds a Great Expectations dependency for demo/comparison mode.
- Sample curation and source documentation become part of product maintenance.

## Follow-Up

- Create implementation story slices from the PRD.
- Update product docs, README, architecture docs, release/demo docs, and test
  matrix after implementation begins.
- Add compatibility notes for removed CLI flags/artifacts where necessary.
- Add curated dataset source documentation and regeneration scripts.
