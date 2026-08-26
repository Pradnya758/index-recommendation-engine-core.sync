import BPlusTreeVisualization from "./BPlusTreeVisualization";
import ExecutionFlowVisualization from "./ExecutionFlowVisualization";
import PlanComparison from "./PlanComparison";
import TableScanVisualization from "./TableScanVisualization";

export default function VisualizationsPanel({ result, plan, query }) {
  if (!result) return null;
  return (
    <section className="visualizations-panel" aria-label="Educational visualizations">
      <div className="section-heading"><div><p className="eyebrow">Interactive learning lab</p><h2>Visualizations</h2></div><span className="count-label">Educational models</span></div>
      <ExecutionFlowVisualization />
      <div className="visual-grid">
        <TableScanVisualization result={result} query={query} />
        <BPlusTreeVisualization query={query} />
      </div>
      <PlanComparison result={result} plan={plan} />
    </section>
  );
}
