import { useEffect, useState } from "react";
import * as d3 from "d3";

import PlaybackControls from "./PlaybackControls";

function getSearchValue(query, column) {
  if (!column) return "target";
  const match = query.match(new RegExp(`${column}\\s*=\\s*(['\"]?[^\\s;]+['\"]?)`, "i"));
  return match ? match[1].replace(/["']/g, "") : "target";
}

export default function TableScanVisualization({ result, query }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [svgNode, setSvgNode] = useState(null);
  const equality = result.analysis.equality_filters[0] || result.analysis.range_filters[0];
  const table = equality?.table || result.analysis.tables[0] || "orders";
  const column = equality?.column || "query column";
  const searchValue = getSearchValue(query, equality?.column);
  const totalRows = 12;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current === totalRows - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!svgNode) return;
    const rows = d3.range(totalRows).map((index) => ({
      id: index + 1,
      value: index === 3 || index === 9 ? searchValue : `…${index + 2}`,
      state: index > step ? "pending" : index === 3 || index === 9 ? "match" : "checked",
    }));
    const svg = d3.select(svgNode).attr("viewBox", "0 0 620 176");
    svg.selectAll("*").remove();
    const row = svg.selectAll("g.scan-row").data(rows).join("g").attr("class", "scan-row").attr("transform", (_, index) => `translate(${(index % 4) * 155 + 4}, ${Math.floor(index / 4) * 57 + 4})`);
    row.append("rect").attr("width", 146).attr("height", 48).attr("rx", 4).attr("class", (item) => `scan-row-${item.state}`);
    row.append("text").attr("x", 10).attr("y", 19).attr("class", "scan-row-id").text((item) => `row #${item.id}`);
    row.append("text").attr("x", 10).attr("y", 37).attr("class", "scan-row-value").text((item) => `${column}: ${item.value}`);
  }, [column, searchValue, step, svgNode]);

  return (
    <article className="visual-card table-scan-card">
      <div className="visual-heading"><div><p className="eyebrow">Educational simulation</p><h3>Table scan visualization</h3></div><span>{table}</span></div>
      <p className="visual-copy">Rows are checked in sequence for <code>{column} = {searchValue}</code>. Green rows match; blue rows were checked but did not match. This is not SQLite&apos;s exact internal execution process.</p>
      <svg ref={setSvgNode} className="scan-svg" role="img" aria-label="Educational table scan simulation" />
      <PlaybackControls step={step} totalSteps={totalRows} playing={playing} onPrevious={() => setStep((value) => Math.max(0, value - 1))} onNext={() => setStep((value) => Math.min(totalRows - 1, value + 1))} onPlayPause={() => setPlaying((value) => !value)} onReset={() => { setPlaying(false); setStep(0); }} />
    </article>
  );
}
