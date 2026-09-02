import BPlusTreeVisualization from "./BPlusTreeVisualization";
import ExecutionFlowVisualization from "./ExecutionFlowVisualization";
import PlanComparison from "./PlanComparison";
import TableScanVisualization from "./TableScanVisualization";

const TABS = [
  { id: "flow",       label: "Execution Flow" },
  { id: "scan",       label: "Table Scan" },
  { id: "tree",       label: "B+ Tree" },
  { id: "comparison", label: "Plan Comparison" },
];

export default function VisualizationsPanel({ result, plan, query, activeTab, onTabChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow">Interactive learning lab</div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Visualizations</div>
        </div>
        <span className="tag tag-cyan">Educational models</span>
      </div>

      <div className="viz-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            className={`viz-tab${activeTab === tab.id ? " active" : ""}`}
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div key={activeTab} style={{ animation: "fadeUp .22s ease" }}>
        {activeTab === "flow"       && <ExecutionFlowVisualization />}
        {activeTab === "scan"       && result && <TableScanVisualization result={result} query={query} />}
        {activeTab === "tree"       && <BPlusTreeVisualization query={query} />}
        {activeTab === "comparison" && result && <PlanComparison result={result} plan={plan} />}
      </div>
    </div>
  );
}
