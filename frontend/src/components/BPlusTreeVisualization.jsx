import { useEffect, useState } from "react";
import * as d3 from "d3";

import PlaybackControls from "./PlaybackControls";

const TREE_NODES = [
  { id: "root", x: 310, y: 24, label: "50", type: "root", depth: 0 },
  { id: "left", x: 160, y: 94, label: "25", type: "internal", depth: 1 },
  { id: "right", x: 460, y: 94, label: "75", type: "internal", depth: 1 },
  { id: "leaf-a", x: 58, y: 166, label: "5 | 10 | 20", type: "leaf", depth: 2 },
  { id: "leaf-b", x: 210, y: 166, label: "30 | 40 | 45", type: "leaf", depth: 2 },
  { id: "leaf-c", x: 410, y: 166, label: "55 | 60 | 70", type: "leaf", depth: 2 },
  { id: "leaf-d", x: 562, y: 166, label: "80 | 90 | 95", type: "leaf", depth: 2 },
];
const LINKS = [["root", "left"], ["root", "right"], ["left", "leaf-a"], ["left", "leaf-b"], ["right", "leaf-c"], ["right", "leaf-d"]];

function keyFromQuery(query) {
  const numericValue = query.match(/=\s*(\d+)/)?.[1];
  return [10, 40, 70, 90].includes(Number(numericValue)) ? Number(numericValue) : 40;
}

function traversalFor(key) {
  if (key < 25) return ["root", "left", "leaf-a"];
  if (key < 50) return ["root", "left", "leaf-b"];
  if (key < 75) return ["root", "right", "leaf-c"];
  return ["root", "right", "leaf-d"];
}

export default function BPlusTreeVisualization({ query }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [svgNode, setSvgNode] = useState(null);
  const key = keyFromQuery(query);
  const traversal = traversalFor(key);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current === traversal.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1500 / speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, traversal.length]);

  useEffect(() => {
    if (!svgNode) return;
    const activeNodes = new Set(traversal.slice(0, step + 1));
    const activeLinks = new Set(traversal.slice(0, step).map((node, index) => `${node}-${traversal[index + 1]}`));
    const svg = d3.select(svgNode).attr("viewBox", "0 0 620 232");
    svg.selectAll("*").remove();
    const nodesById = new Map(TREE_NODES.map((node) => [node.id, node]));
    svg.append("g").selectAll("line").data(LINKS).join("line")
      .attr("x1", (link) => nodesById.get(link[0]).x + 31).attr("y1", (link) => nodesById.get(link[0]).y + 27)
      .attr("x2", (link) => nodesById.get(link[1]).x + 31).attr("y2", (link) => nodesById.get(link[1]).y)
      .attr("class", (link) => `tree-link ${activeLinks.has(`${link[0]}-${link[1]}`) ? "is-active" : ""}`);
    const node = svg.append("g").selectAll("g").data(TREE_NODES).join("g").attr("transform", (item) => `translate(${item.x}, ${item.y})`);
    node.append("rect").attr("width", 62).attr("height", 28).attr("rx", 4).attr("class", (item) => `tree-node tree-${item.type} ${activeNodes.has(item.id) ? "is-active" : ""} ${item.id === traversal.at(-1) && step === traversal.length - 1 ? "is-match" : ""}`);
    node.append("text").attr("x", 31).attr("y", 18).attr("text-anchor", "middle").attr("class", "tree-label").text((item) => item.label);
    svg.append("text").attr("x", 10).attr("y", 220).attr("class", "tree-caption").text(`Search key: ${key} | traversal: ${traversal.slice(0, step + 1).join(" → ")}`);
  }, [key, step, svgNode, traversal]);

  return (
    <article className="visual-card tree-card">
      <div className="visual-heading"><div><p className="eyebrow">Educational model</p><h3>Conceptual B+ Tree Visualization</h3></div><span>Key {key}</span></div>
      <p className="visual-copy">Follow the highlighted path from root to matching leaf. This is an educational model, not SQLite&apos;s exact internal page layout.</p>
      <svg ref={setSvgNode} className="tree-svg" role="img" aria-label="Conceptual B plus tree traversal" />
      <PlaybackControls step={step} totalSteps={traversal.length} playing={playing} onPrevious={() => setStep((value) => Math.max(0, value - 1))} onNext={() => setStep((value) => Math.min(traversal.length - 1, value + 1))} onPlayPause={() => setPlaying((value) => !value)} onReset={() => { setPlaying(false); setStep(0); }} speed={speed} onSpeedChange={setSpeed} />
    </article>
  );
}
