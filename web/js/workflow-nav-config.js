window.VSF_WORKFLOW_NAV_CONFIG = {
  profileWorkflowStages: [
    {
      step: "connect",
      number: "01",
      label: "Connect",
      detail: "DBML, CSV, diagram, mapping",
      target: "sourceState",
      substeps: [
        { target: "sourceState", label: "Source status", detail: "Selected DBML and CSV inventory" },
        { target: "inputSetup", label: "Upload files", detail: "Add DBML contract and CSV files" },
        { target: "diagram", label: "DBML diagram", detail: "Preview tables and FK links" },
        { target: "mapping", label: "CSV mapping", detail: "Map CSV files to DBML tables" },
      ],
    },
    {
      step: "preflight",
      number: "02",
      label: "Preflight Review",
      detail: "Blockers, warnings, approval",
      target: "preflightReview",
      substeps: [
        { target: "issues", label: "Contract health", detail: "Mapping and relationship summary" },
        { target: "preflightReview", label: "Gate summary", detail: "Run lock and review status" },
        { target: "preflightBlockerList", label: "Blockers", detail: "Must fix before running" },
        { target: "preflightWarningList", label: "Warnings", detail: "Human review before run" },
      ],
    },
    {
      step: "run",
      number: "03",
      label: "Run",
      detail: "Local job and runtime evidence",
      target: "runner",
      substeps: [
        { target: "runner", label: "Run controls", detail: "Start local profiler job" },
        { target: "stageList", label: "Runtime stages", detail: "Streaming stage status" },
        { target: "artifactList", label: "Issue snapshot", detail: "Generated artifact preview" },
      ],
    },
    {
      step: "review",
      number: "04",
      label: "Review",
      detail: "Gates, issues, todos, reports",
      target: "qualityGates",
      substeps: [
        { target: "qualityGates", label: "Quality Gates", detail: "Can run, trust, and share" },
        { target: "dashboardPanelGrid", label: "Review Issues", detail: "Charts and issue table" },
        { target: "dashboardDrilldown", label: "Issue Detail", detail: "Where, evidence, fix guidance" },
        { target: "todos", label: "Todos", detail: "Fix data and verify after fix" },
        { target: "reportExport", label: "Report / Export", detail: "Open reports and copy todos" },
        { target: "tableImpact", label: "Table Readiness", detail: "Per-table analysis readiness" },
      ],
    },
  ],
  evaluateWorkflowSteps: [
    { target: "evaluateFlow", label: "Dataset catalog", detail: "Choose built-in faulty data" },
    { target: "evaluationComparison", label: "Comparison Summary", detail: "Correctness and baseline coverage" },
  ],
};
