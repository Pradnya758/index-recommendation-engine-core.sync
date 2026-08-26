import { useEffect, useState } from "react";

import PlaybackControls from "./PlaybackControls";

const FLOW_STEPS = [
  ["SQL Query", "The submitted SELECT statement is received."],
  ["SQL Parsing", "SQLGlot checks syntax and ensures this is one SELECT query."],
  ["Feature Extraction", "Filters, joins, ordering, and grouping columns are detected."],
  ["Existing Index Check", "Primary keys and current indexes are checked first."],
  ["Candidate Generation", "Single-column and composite candidates are formed."],
  ["Recommendation", "Useful candidates are scored and explained."],
];

export default function ExecutionFlowVisualization() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current === FLOW_STEPS.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1300);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <article className="visual-card execution-flow-card">
      <div className="visual-heading"><div><p className="eyebrow">Step-by-step</p><h3>Query execution flow</h3></div><span>{step + 1} / {FLOW_STEPS.length}</span></div>
      <div className="flow-track">
        {FLOW_STEPS.map(([title], index) => (
          <div className={`flow-node ${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}`} key={title}>
            <b>{index + 1}</b><span>{title}</span>
          </div>
        ))}
      </div>
      <p className="visual-copy"><strong>{FLOW_STEPS[step][0]}:</strong> {FLOW_STEPS[step][1]}</p>
      <PlaybackControls step={step} totalSteps={FLOW_STEPS.length} playing={playing} onPrevious={() => setStep((value) => Math.max(0, value - 1))} onNext={() => setStep((value) => Math.min(FLOW_STEPS.length - 1, value + 1))} onPlayPause={() => setPlaying((value) => !value)} onReset={() => { setPlaying(false); setStep(0); }} />
    </article>
  );
}
