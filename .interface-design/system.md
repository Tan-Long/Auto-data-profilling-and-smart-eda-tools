# VSF Data Profiler Interface System

## Direction

Intent: local data scientists, analytics engineers, and demo reviewers need to
run a CSV+DBML profiling job, understand data-quality readiness, inspect
table/column issues, and open deterministic report evidence without guessing
which surface owns which step.

Personality: restrained guided data-quality console. Dense, operational, and
local first. It should feel like a serious review tool for issue evidence
rather than a decorative upload workspace or marketing page.

Palette: graphite text, white/near-white work surfaces, cool gray rails, signal
teal for active actions, amber for warning/risk, red for blockers, and measured
blue for informational graph/runtime states.

Depth: borders and surface shifts only. No broad shadows, no decorative
gradients, no soft parchment treatment.

Signature: an evidence review stack: CSV+DBML run controls first, then
readiness, issue counts, todos, table readiness, and report links, all tied
back to generated machine artifacts without a separate developer-source pane.

## Domain Exploration

Domain concepts: profiling runs, runtime events, canonical artifacts,
data-quality readiness, table readiness, issue severity, DBML relationships,
bounded sample evidence, local-only runner, and developer compatibility
artifacts.

Color world: terminal graphite, clean report paper, DuckDB-style amber warning,
teal active checks, red validation failures, blue runtime telemetry.

Defaults to avoid:

- Cream/serif/soft-gradient demo workspace. Replace with system sans, flat
  surfaces, and compact evidence panels.
- Marketing landing hero. Replace with a task console whose first viewport
  starts the local run path.
- Decorative dashboard cards. Replace with data panels that expose artifact
  names, counts, filters, and drilldown actions.

## Tokens

### Spacing

Base: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48

### Colors

```css
--foreground-primary: #121817;
--foreground-secondary: #46504d;
--foreground-tertiary: #68736f;
--foreground-muted: #8a9490;
--surface-canvas: #f5f7f5;
--surface-panel: #ffffff;
--surface-overlay: #f9faf8;
--surface-inset: #eef2ef;
--surface-rail: #151b1a;
--border-subtle: #e3e8e4;
--border-default: #cfd8d2;
--border-strong: #9daaa3;
--focus-ring: #0f7664;
--accent: #0f7664;
--accent-strong: #0b5b4e;
--success: #23764d;
--warning: #9a5f00;
--destructive: #b23b32;
--info: #316596;
```

### Radius

Scale: 6px, 8px, 12px

Use smaller radii for controls and repeated rows. Use 12px only for major
sections, dialogs, and large dashboard panels.

### Typography

Font: system sans for all interface text. Use monospace only for table names,
artifact paths, IDs, event names, counts, and compact telemetry.

Scale: 11, 12, 13, 14, 16, 20, 24, 32.
Weights: 400, 600, 700, 800.
Data style: monospace with tabular numbers.

## Patterns

### Console Shell

- Left rail uses dark graphite with compact navigation and local-run boundary
  status.
- Main workspace uses a neutral canvas and white panels.
- Primary sequence is CSV+DBML setup, runtime progress, issue review, table
  readiness, report links, developer artifact evidence, then setup details.

### Button

- Minimum height: 40px
- Radius: 8px
- Font: 13-14px, 700 weight
- Primary background: `--accent`
- Secondary background: `--surface-panel`
- Focus: 3px outline using `--focus-ring` with offset.
- Disabled: visible but muted, with unchanged layout.

### Panel

- Border: 1px solid `--border-default`
- Radius: 12px
- Padding: 16px or 20px
- Background: `--surface-panel`
- No large drop shadows. Use only border, background, and small inset shifts.

### Dashboard Evidence Rows

- Clickable chart and table-impact rows are full-width buttons.
- Labels and artifact paths use monospace where they represent generated
  identifiers.
- Rows expose status, count, rate, or health score directly; hover/focus changes
  border and background without layout shift.

### Single-Flow Review Stack

- Guided workflow, preflight review, post-run review, quality gates, issue
  details, action plans, and todos should read top-to-bottom as one review
  stack.
- Avoid primary two-column split layouts for review surfaces. Use full-width
  panels, then compact pills, rows, and metric strips inside each section.
- Evidence values render as label, raw value, then meaning in one vertical
  sequence so users do not need to scan left and right to understand a finding.

### Compact Report Layering

- Human-facing reports and package indexes should summarize first, then expand
  only the highest-priority action plans needed for demo review.
- Full issue evidence, all action plans, and developer/debug detail belong in
  named artifacts such as `issue_action_plans.json`, `issue_todos.json`, and
  export packages, not as a primary dashboard pane.
- When a report truncates evidence, it must say exactly what is shown, what is
  hidden, and which artifact contains the full deterministic data.

### Table Readiness

- Dedicated review section powered by `table_assessments.json`.
- Sort by readiness risk and health score.
- Each row shows table name, role, readiness, health score, analysis-impact
  category, affected-column count, and relationship-risk count.
- Selecting a table assessment row populates drilldown with matching issues,
  assessment detail, and artifact links.

### Local ERD Diagram

- DBML preview uses deterministic ERD layering over existing browser DBML state
  and generated artifacts: reference/dimension tables first, bridge tables
  between their related entities, fact/event hubs next, and child/detail tables
  last.
- Table cards show all DBML columns by default with monospace table names,
  status pills, PK/FK/key rows, and a `+N columns` indicator only after the
  user intentionally hides non-key columns.
- Relationship edges are orthogonal elbow paths. Default edges are muted;
  amber/red appears only for warning or invalid relationship evidence.
- Edge labels stay hidden until hover/focus/selection so the diagram reads as
  structure first and diagnostics second.
- Diagram controls are compact evidence-tool controls: Fit view, zoom,
  non-key column visibility, and reset selection. Avoid card-density controls
  and per-table CSV source chips on the primary diagram surface.
- Selection highlights the chosen table or relationship plus direct neighbors.
  Avoid a visible inspector column in the DBML preview; full column detail
  belongs inside table cards, while artifact-backed evidence belongs in Review
  Issues, Quality Gates, Todos, and report surfaces.

## Decisions

| Decision | Rationale | Date |
| --- | --- | --- |
| Use a restrained local data-quality console for US-056 | The demo goal is to run the profiler and inspect generated evidence, not present a decorative upload workspace | 2026-06-16 |
| Keep the dashboard as the primary post-run surface | The strongest demo moment is readiness, issues, todos, table assessment, and reports after the Python/DuckDB run completes | 2026-06-16 |
| Reframe the console as guided CSV+DBML data-quality profiling | US-073 narrows the product contract while keeping advanced code paths as compatibility/developer surfaces | 2026-06-23 |
| Preserve artifact names and routes in UI copy and controls | The web runner is a local presenter over canonical artifacts, not a new profiling engine | 2026-06-16 |
| Use an ERD-style local DBML diagram pattern for US-061 | The local preview must be demo-readable without relying on the external dbdiagram.io iframe | 2026-06-17 |
| Deprecate dashboard graph panes for US-073 demo flow | Graph artifacts may still exist for compatibility, but the primary demo dashboard should not expose schema-context graph controls or graph drilldown | 2026-06-17 |
| Demote database source mode for US-073 | Postgres/MySQL inputs remain local compatibility controls, but the product-facing workflow is CSV plus DBML | 2026-06-23 |
| Use single-flow review layouts for US-073 | Meeting feedback rejected side-by-side two-column review presentation; demo users need to read stages, gates, issues, actions, and todos in a single vertical flow | 2026-06-23 |
| Compact deterministic reports for US-073 | Meeting feedback rejected long LLM-style text dumps; report readers need summary tables and bounded expanded examples, while full artifacts stay available for audit | 2026-06-23 |
| Remove developer graph and artifact-source panes from the primary dashboard | Demo feedback rejected the extra developer schema context, graph drilldown, and raw artifact source panes because they distract from issue review and next actions | 2026-06-24 |
| Default DBML preview to full-column reading | Demo feedback needs the ERD to behave more like dbdiagram.io: columns are visible immediately, while optional controls reduce clutter only when requested | 2026-06-24 |
| Remove visible DBML inspector rail | Demo feedback found the selected-table inspector too verbose and duplicative; the ERD should use the full available width and keep detailed evidence in the review/report flow | 2026-06-24 |
