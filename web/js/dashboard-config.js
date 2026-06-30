(function () {
  const dashboardChartPaths = {
    risk: "charts/dataset_verdict_risk_summary.json",
    severity: "charts/issue_counts_by_severity.json",
    type: "charts/issue_counts_by_type.json",
    missingTable: "charts/missingness_by_table.json",
    missingColumns: "charts/missingness_top_columns.json",
    outliers: "charts/outliers_top_columns.json",
    relationship: "charts/relationship_fk_health.json",
    influence: "charts/influence_top_features.json",
  };

  const dashboardMachineArtifacts = [
    "issues.json",
    "profile_summary.json",
    "relationship_graph.json",
    "dataset_verdict.json",
    "table_assessments.json",
    "issue_action_plans.json",
    "issue_llm_enrichments.json",
    "issue_todos.json",
    "quality_gates.json",
    "schema_evaluation.json",
    "lineage_graph.json",
    "influence.json",
    "guardrail_report.json",
    "run_summary.json",
    "remediation_plan.json",
    "approved_remediations.json",
    "remediation_run_summary.json",
    "before_after_quality_diff.json",
  ];

  const graphScopeLabels = {
    table: "Tables",
    columns: "Columns",
    relationships: "Relationships",
    runtime: "Runtime + artifacts",
  };

  const graphDisplayLabels = {
    overview: "Overview",
    focus: "Focus",
    full: "Full",
  };

  const lineageTypeToCategory = {
    source_system: "source",
    schema: "schema",
    table: "table",
    column: "column",
    relationship: "relationship",
    profiler_stage: "stage",
    artifact: "artifact",
  };

  const graphCategoryLabels = {
    source: "Source",
    schema: "Schema",
    table: "Table",
    column: "Column",
    relationship: "Relationship",
    stage: "Runtime stage",
    artifact: "Artifact",
  };

  const lineageCategoryOrder = ["source", "schema", "table", "column", "relationship", "stage", "artifact"];
  const relationshipCategoryOrder = ["table", "column", "relationship", "artifact"];
  const relationshipIssueTypes = new Set([
    "ORPHAN_FOREIGN_KEY",
    "PARENT_KEY_DUPLICATE",
    "FOREIGN_KEY_NULL",
    "CHILD_RELATIONSHIP_DUPLICATE",
  ]);

  const severityOrder = ["P0", "P1", "P2", "P3"];

  const localDiagramLimits = {
    tables: 24,
    relationships: 60,
  };

  const postRunDiagramArtifacts = ["schema_diagram.json"];

  window.VSF_DASHBOARD_CONFIG = {
    dashboardChartPaths,
    dashboardMachineArtifacts,
    graphCategoryLabels,
    graphDisplayLabels,
    graphScopeLabels,
    lineageCategoryOrder,
    lineageTypeToCategory,
    localDiagramLimits,
    postRunDiagramArtifacts,
    relationshipCategoryOrder,
    relationshipIssueTypes,
    severityOrder,
  };
}());
