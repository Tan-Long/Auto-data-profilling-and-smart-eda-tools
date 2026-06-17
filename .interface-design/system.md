# VSF Data Profiler Interface System

## Direction

Intent: local data engineers, analytics leads, and demo reviewers need to run a
profiling job, understand data-quality risk, inspect table-level business
impact, follow graph evidence, and open generated artifacts without guessing
which surface owns which step.

Personality: restrained data-quality console. Dense, operational, and local
first. It should feel like a serious review tool for generated evidence rather
than a decorative upload workspace or marketing page.

Palette: graphite text, white/near-white work surfaces, cool gray rails, signal
teal for active actions, amber for warning/risk, red for blockers, and measured
blue for informational graph/runtime states.

Depth: borders and surface shifts only. No broad shadows, no decorative
gradients, no soft parchment treatment.

Signature: an evidence review stack: run controls first, then dashboard verdict,
table impact, issues, graphs, and artifact links, all tied back to generated
machine artifacts.

## Domain Exploration

Domain concepts: profiling runs, runtime events, canonical artifacts, dataset
verdict, table assessments, issue severity, DBML relationships, lineage graph,
bounded sample evidence, local-only runner.

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
- Primary sequence is run setup, runtime progress, dashboard, graph/artifact
  evidence, then preflight setup details.

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
- Generated reports, machine artifacts, and sample CSVs preview inside the
  dashboard Artifact review panel by default. Opening raw JSON/Markdown in a
  separate browser tab is not the primary interaction.
- Machine-readable artifacts should render as artifact-specific reviews first:
  relationship health, lineage inventory, verdict blockers, table impact, issue
  mix, runtime stages, and chart data. Raw JSON trees are a fallback, not the
  primary user-facing view.
- Issue evidence must point below table level. Each issue row shows table,
  affected columns, bad-row count, sample artifact path, and opens a row
  evidence preview that labels sample rows and highlights affected cells.

### Runtime Stages

- Runtime stages should show immediate results, not only completed/running
  status. Each stage row exposes compact result chips from `run_summary.json`
  stage details and links to the generated artifacts that prove that stage.
- Stage evidence is always visible after a run. Avoid hiding stage output behind
  accordions; the demo should read as a progressive pipeline with visible
  outcomes at every step.

### Table Impact

- Dedicated dashboard section powered by `table_assessments.json`.
- Sort by readiness risk and health score.
- Each row shows table name, role, readiness, health score, business-impact
  category, affected-column count, and relationship-risk count.
- Selecting a table impact row populates drilldown with matching issues,
  assessment detail, and artifact links.

### Local ERD Diagram

- DBML preview uses deterministic ERD layering over existing browser DBML state
  and generated artifacts: reference/dimension tables first, bridge tables
  between their related entities, fact/event hubs next, and child/detail tables
  last.
- Table cards show all parsed columns by default, with monospace table names,
  status pills, column type text, and compact PK/FK badges on each row. A
  key-only mode is optional; it is not the default.
- Relationship edges are orthogonal elbow paths. Default edges are muted;
  amber/red appears only for warning or invalid relationship evidence.
- Edges must route through clear table-to-table corridors. Non-adjacent
  relationships use a two-corridor bus above or below intermediate table boxes;
  lines should not pass through table cards or jump to a global top rail.
- Relationship endpoints attach to the exact FK/PK column row when the column
  is visible, matching the mental model of dbdiagram.io-style schema diagrams.
- Edge labels stay hidden until hover/focus/selection so the diagram reads as
  structure first and diagnostics second.
- Diagram controls are compact evidence-tool controls: Fit view, expanded card
  density, non-key column visibility, and reset selection.
- Selection highlights the chosen table or relationship plus direct neighbors,
  while the detail panel shows artifact-backed table/edge evidence and links.

### Dashboard Progressive Graph

- The dashboard graph opens in a low-noise overview: table-level structure
  first, with column, runtime, and artifact fan-out hidden until explicit user
  intent.
- Graph controls use compact segmented modes for Overview, Focus, and Full,
  plus toggles for columns, runtime/artifacts, invalid/warning relationships,
  and reset.
- Relationship mode defaults to table-to-table FK edges. Relationship detail
  belongs in the drilldown and in Full mode nodes, not persistent edge labels.
- Lineage mode defaults to source -> table -> artifact-summary lanes. Runtime
  stages and individual artifact fan-out are opt-in.
- Selected nodes and direct neighbors are emphasized; unrelated graph elements
  fade instead of disappearing, preserving orientation without clutter.
- Edge color is mostly neutral. Amber/red is reserved for warning or invalid
  evidence, and labels appear only on hover/focus or active selection.

## Decisions

| Decision | Rationale | Date |
| --- | --- | --- |
| Use a restrained local data-quality console for US-056 | The demo goal is to run the profiler and inspect generated evidence, not present a decorative upload workspace | 2026-06-16 |
| Keep the dashboard as the primary post-run surface | The strongest demo moment is verdict, table impact, graph evidence, and artifacts after the Python/DuckDB run completes | 2026-06-16 |
| Preserve artifact names and routes in UI copy and controls | The web runner is a local presenter over canonical artifacts, not a new profiling engine | 2026-06-16 |
| Use an ERD-style local DBML diagram pattern for US-061 | The local preview must be demo-readable without relying on the external dbdiagram.io iframe | 2026-06-17 |
| Default dashboard graphs to progressive disclosure for US-062 | Demo reviewers need readable topology first and artifact-level evidence only on selection or explicit toggles | 2026-06-17 |
| Route local ERD edges through corridors instead of a global top rail | DBML relationships should read like a database diagram: table boxes first, orthogonal connectors second, and no lines cutting through intermediate cards | 2026-06-17 |
| Preview generated artifacts inline | Demo reviewers should inspect reports, JSON artifacts, and sample CSVs in the web console instead of being sent to raw browser-rendered files | 2026-06-17 |
| Show all local ERD columns by default | The local DBML diagram should behave like a dbdiagram-style schema view: users inspect every table column and see FK/PK relationships connected at row level | 2026-06-17 |
| Render JSON artifacts as reviews, not object dumps | Demo reviewers need relationship/table/verdict evidence in product language; `Object(...)` tree views are too raw for the main artifact surface | 2026-06-17 |
| Highlight issue sample rows and columns | Quality issues should be inspectable at table, row-sample, and affected-column level without forcing users to interpret raw CSV files | 2026-06-17 |
| Show runtime stage results inline | After each pipeline stage, reviewers should see the concrete counts and artifacts produced without expanding a hidden panel or opening raw runtime JSON | 2026-06-17 |
