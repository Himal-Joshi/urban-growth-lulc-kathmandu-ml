import { Play, Pause, Layers, Eye, EyeOff } from "lucide-react";

const SPEED_OPTIONS = [0.5, 1, 2, 4];

export default function ControlPanel({
  playing,
  setPlaying,
  speed,
  setSpeed,
  showAllClasses,
  setShowAllClasses,
  showHotspot,
  setShowHotspot,
  isMobile,
}) {
  const iconSize = isMobile ? 17 : 16;
  const smallIconSize = isMobile ? 12 : 11;

  return (
    <div className="ctrls">
      <button className="pbtn" onClick={() => setPlaying(p => !p)}>
        {playing ? <Pause size={iconSize} /> : <Play size={iconSize} />}
      </button>
      <div className="spg">
        {SPEED_OPTIONS.map(s => (
          <button
            key={s}
            className={`spb ${speed === s ? "on" : ""}`}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
      {!isMobile && <div style={{ flex: 1 }} />}
      <button
        className={`cbtn ${!showAllClasses ? "on" : ""}`}
        onClick={() => setShowAllClasses(v => !v)}
      >
        <Layers size={smallIconSize} />
        {showAllClasses ? "All Classes" : "Built-up Only"}
      </button>
      <button
        className={`cbtn ${showHotspot ? "on" : ""}`}
        onClick={() => setShowHotspot(v => !v)}
      >
        {showHotspot ? <Eye size={smallIconSize} /> : <EyeOff size={smallIconSize} />}
        Hotspot
      </button>
    </div>
  );
}
