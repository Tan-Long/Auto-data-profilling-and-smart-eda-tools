# 0028 Transparent Review Score Boundary

## Status

Accepted.

## Context

VSF reports and dashboard used terms like "health score" for deterministic
artifact heuristics. That wording can imply a statistical model or domain
truth, while the implementation only weights issue severity and relationship
status to prioritize EDA review.

## Decision

Keep existing machine fields such as `risk_score` and `health_score` for
backward compatibility, but add explicit scoring model metadata and
user-facing "review score" language.

The table review score remains:

`100 - (P0*30 + P1*18 + P2*7 + P3*2 + invalid_fk*12 + warning_fk*6 + skipped_fk*3)`

bounded to `0..100`.

The dataset review-risk score remains:

`min(100, P0*30 + P1*15 + P2*5 + P3*1 + invalid_fk*10 + warning_fk*4 + skipped_fk*2 + missing_table*25 + extra_csv*2)`.

## Consequences

- Reports, package index, and web artifact review can explain the calculation
  without opening source code.
- Existing consumers of `health_score` continue to work.
- P3 findings, including generic outliers, are clearly presented as low-weight
  review signals rather than automatic blockers.
