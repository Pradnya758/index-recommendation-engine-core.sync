export default function PlaybackControls({ step, totalSteps, playing, onPrevious, onNext, onPlayPause, onReset, speed, onSpeedChange }) {
  return (
    <div className="playback-controls">
      <button type="button" onClick={onPrevious} disabled={step === 0}>Previous</button>
      <button type="button" onClick={onPlayPause}>{playing ? "Pause" : "Play"}</button>
      <button type="button" onClick={onNext} disabled={step === totalSteps - 1}>Next</button>
      <button type="button" onClick={onReset}>Reset</button>
      {onSpeedChange && (
        <label className="speed-control">Speed
          <input type="range" min="1" max="3" value={speed} onChange={(event) => onSpeedChange(Number(event.target.value))} />
        </label>
      )}
    </div>
  );
}
