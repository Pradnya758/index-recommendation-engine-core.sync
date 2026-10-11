import { useEffect, useState } from "react";
import * as d3 from "d3";

import PlaybackControls from "./PlaybackControls";

const TABLE_SCAN_KEYS = [5, 10, 15, 20, 30, 40, 45, 55, 60, 70, 80, 90];

function getSearchValue(query, column) {
  if (!column) return "15";
  const match = query.match(new RegExp(`${column}\\s*=\\s*(['\"]?[^\\s;]+['\"]?)`, "i"));
  return match ? match[1].replace(/["']/g, "") : "15";
}

export default function TableScanVisualization({ result, query }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scanState, setScanState] = useState("checking");
  const [svgNode, setSvgNode] = useState(null);
  const equality = result.analysis.equality_filters[0] || result.analysis.range_filters[0];
  const table = equality?.table || result.analysis.tables[0] || "orders";
  const column = equality?.column || "query column";
  const [searchKey, setSearchKey] = useState(() => getSearchValue(query, equality?.column));
  const normalizedSearchKey = searchKey.trim();
  const matchingIndex = TABLE_SCAN_KEYS.findIndex((value) => String(value) === normalizedSearchKey);
  const finalStep = matchingIndex >= 0 ? matchingIndex : TABLE_SCAN_KEYS.length - 1;
  const found = scanState === "found";
  const scanComplete = found || scanState === "missing";

  useEffect(() => {
    setSearchKey(getSearchValue(query, equality?.column));
    setPlaying(false);
    setStep(0);
    setScanState("checking");
  }, [equality?.column, query]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current === matchingIndex) {
          setScanState("found");
          setPlaying(false);
          return current;
        }
        if (current >= TABLE_SCAN_KEYS.length - 1) {
          setScanState("missing");
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [matchingIndex, playing]);

  useEffect(() => {
    if (!svgNode) return;
    const rows = TABLE_SCAN_KEYS.map((value, index) => ({
      id: index + 1,
      value,
      state: found && index === matchingIndex ? "found" : index === step ? "current" : "pending",
    }));
    const svg = d3.select(svgNode).attr("viewBox", "0 0 620 176");
    svg.selectAll("*").remove();
    const row = svg.selectAll("g.scan-row").data(rows).join("g").attr("class", "scan-row").attr("transform", (_, index) => `translate(${(index % 4) * 155 + 4}, ${Math.floor(index / 4) * 57 + 4})`);
    row.append("rect").attr("width", 146).attr("height", 48).attr("rx", 4).attr("class", (item) => `scan-row-${item.state}`);
    row.append("text").attr("x", 10).attr("y", 19).attr("class", "scan-row-id").text((item) => `row #${item.id}`);
    row.append("text").attr("x", 10).attr("y", 37).attr("class", "scan-row-value").text((item) => `${column}: ${item.value}`);
  }, [column, found, matchingIndex, step, svgNode]);

  function updateSearchKey(event) {
    setSearchKey(event.target.value);
    setPlaying(false);
    setStep(0);
    setScanState("checking");
  }

  function togglePlayback() {
    if (scanComplete) {
      setStep(0);
      setScanState("checking");
      setPlaying(true);
      return;
    }
    setPlaying((value) => !value);
  }

  return (
    <article className="visual-card table-scan-card">
      <div className="visual-heading"><div><p className="eyebrow">Educational simulation</p><h3>Table scan visualization</h3></div><span>{table}</span></div>
      <p className="visual-copy">Enter a key and follow the sequential search from the first record. Blue marks the row currently being checked; green marks the matching record. This educational simulation does not measure actual SQLite execution performance.</p>
      <div className="scan-search-control">
        <label htmlFor="table-scan-search-key">Search Key</label>
        <input id="table-scan-search-key" value={searchKey} onChange={updateSearchKey} inputMode="numeric" autoComplete="off" />
        <span className={`scan-result${scanComplete ? found ? " is-found" : " is-missing" : ""}`} aria-live="polite">
          {found
            ? `Found ${column} = ${searchKey.trim()} at row ${step + 1}`
            : scanState === "missing"
              ? "Not Found"
              : `Checking row ${step + 1}...`}
        </span>
      </div>
      <svg ref={setSvgNode} className="scan-svg" role="img" aria-label="Educational table scan simulation" />
      <PlaybackControls step={step} totalSteps={finalStep + 1} playing={playing} onPrevious={() => { setPlaying(false); setScanState("checking"); setStep((value) => Math.max(0, value - 1)); }} onNext={() => { setPlaying(false); setScanState("checking"); setStep((value) => Math.min(finalStep, value + 1)); }} onPlayPause={togglePlayback} onReset={() => { setPlaying(false); setScanState("checking"); setStep(0); }} />
    </article>
  );
}
