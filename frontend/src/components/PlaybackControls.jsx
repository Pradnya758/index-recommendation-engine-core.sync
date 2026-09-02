export default function PlaybackControls({
  step, totalSteps, playing,
  onPrevious, onNext, onPlayPause, onReset,
  speed, onSpeedChange,
}) {
  return (
    <div className="playback-controls">
      <button type="button" onClick={onReset} disabled={step === 0} title="Reset">↩ Reset</button>
      <button type="button" onClick={onPrevious} disabled={step === 0} title="Previous">‹ Prev</button>
      <button type="button" onClick={onPlayPause}>{playing ? "⏸ Pause" : "▶ Play"}</button>
      <button type="button" onClick={onNext} disabled={step === totalSteps - 1} title="Next">Next ›</button>
      <span style={{ color: "#8fa3bc", fontSize: "9px", marginLeft: "4px" }}>
        {step + 1} / {totalSteps}
      </span>
      {onSpeedChange && (
        <label className="speed-control">
          Speed
          <input
            type="range" min="1" max="3" value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          />
        </label>
      )}
    </div>
  );
}
