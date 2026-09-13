import { useEffect, useState } from "react";
import * as d3 from "d3";

import PlaybackControls from "./PlaybackControls";

const TREE_NODES = [
  { id: "root", x: 309, y: 18, width: 62, label: "50", type: "root" },
  { id: "left", x: 144, y: 86, width: 62, label: "25", type: "internal" },
  { id: "right", x: 474, y: 86, width: 62, label: "75", type: "internal" },
  { id: "leaf-a", x: 10, y: 172, width: 145, label: "5 | 10 | 20", type: "leaf" },
  { id: "leaf-b", x: 182, y: 172, width: 145, label: "30 | 40 | 45", type: "leaf" },
  { id: "leaf-c", x: 354, y: 172, width: 145, label: "55 | 60 | 70", type: "leaf" },
  { id: "leaf-d", x: 526, y: 172, width: 145, label: "80 | 90 | 95", type: "leaf" },
];
const TREE_LINKS = [["root", "left"], ["root", "right"], ["left", "leaf-a"], ["left", "leaf-b"], ["right", "leaf-c"], ["right", "leaf-d"]];
const LEAF_LINKS = [["leaf-a", "leaf-b"], ["leaf-b", "leaf-c"], ["leaf-c", "leaf-d"]];
const LEAF_KEYS = {
  "leaf-a": [5, 10, 20],
  "leaf-b": [30, 40, 45],
  "leaf-c": [55, 60, 70],
  "leaf-d": [80, 90, 95],
};

function keyFromQuery(query) {
  const numericValue = query.match(/=\s*(-?\d+)/)?.[1];
  return numericValue === undefined ? 40 : Number(numericValue);
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
  const targetLeaf = traversal.at(-1);
  const keyIsPresent = LEAF_KEYS[targetLeaf].includes(key);

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
    const activeTreeLinks = new Set(traversal.slice(0, step).map((node, index) => `${node}-${traversal[index + 1]}`));
    const svg = d3.select(svgNode).attr("viewBox", "0 0 680 260");
    svg.selectAll("*").remove();
    const nodesById = new Map(TREE_NODES.map((node) => [node.id, node]));
    const defs = svg.append("defs");
    defs.append("marker").attr("id", "leaf-arrow").attr("viewBox", "0 0 8 8").attr("refX", 7).attr("refY", 4)
      .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
      .append("path").attr("d", "M 0 0 L 8 4 L 0 8 z").attr("class", "leaf-arrow-head");
    svg.append("g").selectAll("line").data(TREE_LINKS).join("line")
      .attr("x1", (link) => nodesById.get(link[0]).x + nodesById.get(link[0]).width / 2).attr("y1", (link) => nodesById.get(link[0]).y + 28)
      .attr("x2", (link) => nodesById.get(link[1]).x + nodesById.get(link[1]).width / 2).attr("y2", (link) => nodesById.get(link[1]).y)
      .attr("class", (link) => `tree-link ${activeTreeLinks.has(`${link[0]}-${link[1]}`) ? "is-active" : ""}`);
    svg.append("text").attr("x", 10).attr("y", 158).attr("class", "leaf-link-label").text("LEAF LINKS · NEXT LEAF");
    svg.append("g").selectAll("line").data(LEAF_LINKS).join("line")
      .attr("x1", (link) => nodesById.get(link[0]).x + nodesById.get(link[0]).width + 4).attr("y1", 186)
      .attr("x2", (link) => nodesById.get(link[1]).x - 6).attr("y2", 186)
      .attr("marker-end", "url(#leaf-arrow)").attr("class", "leaf-link");
    const node = svg.append("g").selectAll("g").data(TREE_NODES).join("g").attr("transform", (item) => `translate(${item.x}, ${item.y})`);
    node.append("rect").attr("width", (item) => item.width).attr("height", 28).attr("rx", 4)
      .attr("class", (item) => `tree-node tree-${item.type} ${activeNodes.has(item.id) ? "is-active" : ""} ${item.id === targetLeaf && step === traversal.length - 1 ? "is-match" : ""}`);
    node.append("text").attr("x", (item) => item.width / 2).attr("y", 18).attr("text-anchor", "middle").attr("class", "tree-label").text((item) => item.label);
    const traversalStatus = ["root", "internal node", "leaf"].slice(0, step + 1).join(" → ");
    svg.append("text").attr("x", 10).attr("y", 238).attr("class", "tree-caption").text(`Search key: ${key} | traversal: ${traversalStatus}`);
    const targetLabel = nodesById.get(targetLeaf).label;
    const resultStatus = keyIsPresent
      ? `Key ${key} found in [${targetLabel}].`
      : `Key ${key} is not present; search ended at [${targetLabel}], where it would be located.`;
    svg.append("text").attr("x", 10).attr("y", 254).attr("class", "tree-caption-note").text(step === traversal.length - 1 ? resultStatus : "Point lookup follows hierarchy edges from root to leaf.");
  }, [key, keyIsPresent, step, svgNode, targetLeaf, traversal]);

  return (
    <article className="visual-card tree-card">
      <div className="visual-heading"><div><p className="eyebrow">Educational model</p><h3>Conceptual B+ Tree Visualization</h3></div><span>Key {key}</span></div>
      <p className="visual-copy">Follow the highlighted path from root to the leaf where the search key belongs. Leaf nodes are linked sequentially, allowing efficient movement between adjacent leaf nodes. This is a conceptual educational model, not SQLite&apos;s exact internal page layout.</p>
      <svg ref={setSvgNode} className="tree-svg" role="img" aria-label="Conceptual B plus tree traversal" />
      <PlaybackControls step={step} totalSteps={traversal.length} playing={playing} onPrevious={() => setStep((value) => Math.max(0, value - 1))} onNext={() => setStep((value) => Math.min(traversal.length - 1, value + 1))} onPlayPause={() => setPlaying((value) => !value)} onReset={() => { setPlaying(false); setStep(0); }} speed={speed} onSpeedChange={setSpeed} />
    </article>
  );
}
