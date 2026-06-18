# US-069 Transparent Review Scoring

## User Story

As a data scientist reviewing generated EDA artifacts, I need dataset and table
scores to explain how they are calculated, so I do not mistake deterministic
review heuristics for a statistical health model.

## Scope

- Add scoring model metadata to `dataset_verdict.json` and
  `table_assessments.json`.
- Keep existing `risk_score`, `health_score`, and artifact names for
  compatibility.
- Add additive `review_score`, `average_review_score`, and per-table penalty
  breakdown fields.
- Update reports, package index, and web artifact review labels to say
  "review score" or "FK status" instead of ambiguous health wording.
- Document the formulas and the interpretation that P3/outliers are low-weight
  review signals.

## Out of Scope

- Replacing the deterministic heuristic with a statistical model.
- Changing issue severity contracts.
- Renaming existing artifact files or removing compatibility fields.

## Validation

- Focused tests cover scoring metadata and penalty breakdown.
- Report/package/web labels expose formula text.
- Existing report, dashboard, package, and L4 paths remain compatible.
