import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Play, Pause, Layers, Eye, EyeOff, AlertCircle, BarChart2, ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

const BASE = "/urban-growth-lulc-kathmandu-ml/data";

const LULC = {
  builtup:    { color: "#ff4d6d", grad: ["#ff4d6d","#c9184a"], label: "Built-up",   icon: "🏙️" },
  vegetation: { color: "#40916c", grad: ["#52b788","#40916c"], label: "Vegetation", icon: "🌿" },
  cropland:   { color: "#e9c46a", grad: ["#e9c46a","#c9a84c"], label: "Cropland",   icon: "🌾" },
  water:      { color: "#4895ef", grad: ["#4cc9f0","#4895ef"], label: "Water",       icon: "💧" },
};

const HOTSPOT_LEGEND = [
  { color: "#9d4edd", label: "Pre-2005" },
  { color: "#ff4d6d", label: "2005–2010" },
  { color: "#fb8500", label: "2010–2015" },
  { color: "#ffb703", label: "2015–2020" },
  { color: "#f8f9fa", label: "2020+" },
];

const SPEED_OPTIONS = [0.5, 1, 2, 4];
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

const EMBEDDED_STATS = {"years":[2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],"data":{"2000":{"year":2000,"observed":true,"water":{"pixels":591,"area_km2":0.53,"pct":0.05},"vegetation":{"pixels":526634,"area_km2":473.97,"pct":45.62},"cropland":{"pixels":523286,"area_km2":470.96,"pct":45.33},"builtup":{"pixels":103956,"area_km2":93.56,"pct":9.0},"total_valid_km2":1039.02},"2001":{"year":2001,"observed":true,"water":{"pixels":744,"area_km2":0.67,"pct":0.06},"vegetation":{"pixels":533946,"area_km2":480.55,"pct":46.25},"cropland":{"pixels":525006,"area_km2":472.51,"pct":45.48},"builtup":{"pixels":94771,"area_km2":85.29,"pct":8.21},"total_valid_km2":1039.02},"2002":{"year":2002,"observed":true,"water":{"pixels":890,"area_km2":0.8,"pct":0.08},"vegetation":{"pixels":544308,"area_km2":489.88,"pct":47.15},"cropland":{"pixels":518127,"area_km2":466.31,"pct":44.88},"builtup":{"pixels":91142,"area_km2":82.03,"pct":7.89},"total_valid_km2":1039.02},"2003":{"year":2003,"observed":true,"water":{"pixels":972,"area_km2":0.87,"pct":0.08},"vegetation":{"pixels":561115,"area_km2":505.0,"pct":48.6},"cropland":{"pixels":498405,"area_km2":448.56,"pct":43.17},"builtup":{"pixels":93975,"area_km2":84.58,"pct":8.14},"total_valid_km2":1039.02},"2004":{"year":2004,"observed":true,"water":{"pixels":982,"area_km2":0.88,"pct":0.09},"vegetation":{"pixels":578782,"area_km2":520.9,"pct":50.13},"cropland":{"pixels":475396,"area_km2":427.86,"pct":41.18},"builtup":{"pixels":99307,"area_km2":89.38,"pct":8.6},"total_valid_km2":1039.02},"2005":{"year":2005,"observed":true,"water":{"pixels":1013,"area_km2":0.91,"pct":0.09},"vegetation":{"pixels":590334,"area_km2":531.3,"pct":51.13},"cropland":{"pixels":459666,"area_km2":413.7,"pct":39.82},"builtup":{"pixels":103454,"area_km2":93.11,"pct":8.96},"total_valid_km2":1039.02},"2006":{"year":2006,"observed":true,"water":{"pixels":960,"area_km2":0.86,"pct":0.08},"vegetation":{"pixels":593323,"area_km2":533.99,"pct":51.39},"cropland":{"pixels":454096,"area_km2":408.69,"pct":39.33},"builtup":{"pixels":106088,"area_km2":95.48,"pct":9.19},"total_valid_km2":1039.02},"2007":{"year":2007,"observed":true,"water":{"pixels":852,"area_km2":0.77,"pct":0.07},"vegetation":{"pixels":588067,"area_km2":529.26,"pct":50.94},"cropland":{"pixels":456716,"area_km2":411.04,"pct":39.56},"builtup":{"pixels":108832,"area_km2":97.95,"pct":9.43},"total_valid_km2":1039.02},"2008":{"year":2008,"observed":true,"water":{"pixels":711,"area_km2":0.64,"pct":0.06},"vegetation":{"pixels":583399,"area_km2":525.06,"pct":50.53},"cropland":{"pixels":457738,"area_km2":411.96,"pct":39.65},"builtup":{"pixels":112619,"area_km2":101.36,"pct":9.76},"total_valid_km2":1039.02},"2009":{"year":2009,"observed":true,"water":{"pixels":567,"area_km2":0.51,"pct":0.05},"vegetation":{"pixels":575457,"area_km2":517.91,"pct":49.85},"cropland":{"pixels":461015,"area_km2":414.91,"pct":39.93},"builtup":{"pixels":117428,"area_km2":105.69,"pct":10.17},"total_valid_km2":1039.02},"2010":{"year":2010,"observed":true,"water":{"pixels":479,"area_km2":0.43,"pct":0.04},"vegetation":{"pixels":572950,"area_km2":515.65,"pct":49.63},"cropland":{"pixels":459010,"area_km2":413.11,"pct":39.76},"builtup":{"pixels":122028,"area_km2":109.83,"pct":10.57},"total_valid_km2":1039.02},"2011":{"year":2011,"observed":true,"water":{"pixels":352,"area_km2":0.32,"pct":0.03},"vegetation":{"pixels":569727,"area_km2":512.75,"pct":49.35},"cropland":{"pixels":458910,"area_km2":413.02,"pct":39.75},"builtup":{"pixels":125478,"area_km2":112.93,"pct":10.87},"total_valid_km2":1039.02},"2013":{"year":2013,"observed":true,"water":{"pixels":262,"area_km2":0.24,"pct":0.02},"vegetation":{"pixels":560748,"area_km2":504.67,"pct":48.57},"cropland":{"pixels":465141,"area_km2":418.63,"pct":40.29},"builtup":{"pixels":128316,"area_km2":115.48,"pct":11.11},"total_valid_km2":1039.02},"2014":{"year":2014,"observed":true,"water":{"pixels":240,"area_km2":0.22,"pct":0.02},"vegetation":{"pixels":559811,"area_km2":503.83,"pct":48.49},"cropland":{"pixels":463263,"area_km2":416.94,"pct":40.13},"builtup":{"pixels":131153,"area_km2":118.04,"pct":11.36},"total_valid_km2":1039.02},"2015":{"year":2015,"observed":true,"water":{"pixels":254,"area_km2":0.23,"pct":0.02},"vegetation":{"pixels":560396,"area_km2":504.36,"pct":48.54},"cropland":{"pixels":458451,"area_km2":412.61,"pct":39.71},"builtup":{"pixels":135366,"area_km2":121.83,"pct":11.73},"total_valid_km2":1039.02},"2016":{"year":2016,"observed":true,"water":{"pixels":232,"area_km2":0.21,"pct":0.02},"vegetation":{"pixels":559196,"area_km2":503.28,"pct":48.44},"cropland":{"pixels":451985,"area_km2":406.79,"pct":39.15},"builtup":{"pixels":143054,"area_km2":128.75,"pct":12.39},"total_valid_km2":1039.02},"2017":{"year":2017,"observed":true,"water":{"pixels":241,"area_km2":0.22,"pct":0.02},"vegetation":{"pixels":559690,"area_km2":503.72,"pct":48.48},"cropland":{"pixels":437834,"area_km2":394.05,"pct":37.93},"builtup":{"pixels":156702,"area_km2":141.03,"pct":13.57},"total_valid_km2":1039.02},"2018":{"year":2018,"observed":true,"water":{"pixels":349,"area_km2":0.31,"pct":0.03},"vegetation":{"pixels":558869,"area_km2":502.98,"pct":48.41},"cropland":{"pixels":409572,"area_km2":368.61,"pct":35.48},"builtup":{"pixels":185677,"area_km2":167.11,"pct":16.08},"total_valid_km2":1039.02},"2019":{"year":2019,"observed":true,"water":{"pixels":604,"area_km2":0.54,"pct":0.05},"vegetation":{"pixels":561700,"area_km2":505.53,"pct":48.65},"cropland":{"pixels":398713,"area_km2":358.84,"pct":34.54},"builtup":{"pixels":193450,"area_km2":174.1,"pct":16.76},"total_valid_km2":1039.02},"2020":{"year":2020,"observed":true,"water":{"pixels":374,"area_km2":0.34,"pct":0.03},"vegetation":{"pixels":548884,"area_km2":494.0,"pct":47.54},"cropland":{"pixels":403784,"area_km2":363.41,"pct":34.98},"builtup":{"pixels":201425,"area_km2":181.28,"pct":17.45},"total_valid_km2":1039.02},"2021":{"year":2021,"observed":true,"water":{"pixels":201,"area_km2":0.18,"pct":0.02},"vegetation":{"pixels":547546,"area_km2":492.79,"pct":47.43},"cropland":{"pixels":403958,"area_km2":363.56,"pct":34.99},"builtup":{"pixels":202762,"area_km2":182.49,"pct":17.56},"total_valid_km2":1039.02},"2022":{"year":2022,"observed":true,"water":{"pixels":4334,"area_km2":3.9,"pct":0.38},"vegetation":{"pixels":544010,"area_km2":489.61,"pct":47.12},"cropland":{"pixels":401046,"area_km2":360.94,"pct":34.74},"builtup":{"pixels":205077,"area_km2":184.57,"pct":17.76},"total_valid_km2":1039.02}}};

// ─────────────────────────────────────────────────────────────────────────────
// Core zoom/pan state — stored in refs to avoid stale closures
// Pan is in SCREEN pixels (not content pixels). Clamp = half container * (zoom-1)
// ─────────────────────────────────────────────────────────────────────────────
function createZoomPan() {
  const zoomRef  = { current: 1 };
  const panRef   = { current: { x: 0, y: 0 } };
  return { zoomRef, panRef };
}

function clampPan(px, py, zoom, containerW, containerH) {
  // Max offset is half the extra space the zoomed image creates
  const maxX = (containerW  * (zoom - 1)) / 2;
  const maxY = (containerH * (zoom - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, px)),
    y: Math.max(-maxY, Math.min(maxY, py)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useZoomPan — complete, correct implementation
// ─────────────────────────────────────────────────────────────────────────────
function useZoomPan() {
  const containerRef = useRef(null);
  const zoomRef      = useRef(1);
  const panRef       = useRef({ x: 0, y: 0 });
  const dragging     = useRef(false);
  const lastPt       = useRef({ x: 0, y: 0 });
  const [state, setState] = useState({ zoom: 1, pan: { x: 0, y: 0 } });

  const getSize = () => {
    const el = containerRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 800, h: 600 };
  };

  const commit = () => {
    setState({ zoom: zoomRef.current, pan: { ...panRef.current } });
  };

  // Wheel zoom — zoom toward cursor
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current * factor));
    const { w, h } = getSize();

    // Zoom toward mouse position
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left - w / 2;
    const my = e.clientY - rect.top  - h / 2;
    const scale = newZoom / zoomRef.current;
    const newPanX = mx + (panRef.current.x - mx) * scale;
    const newPanY = my + (panRef.current.y - my) * scale;

    zoomRef.current = newZoom;
    panRef.current  = clampPan(newPanX, newPanY, newZoom, w, h);
    commit();
  }, []);

  // Button zoom — zoom toward center
  const doZoom = useCallback((factor) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current * factor));
    const { w, h } = getSize();
    const scale   = newZoom / zoomRef.current;
    zoomRef.current = newZoom;
    panRef.current  = clampPan(
      panRef.current.x * scale,
      panRef.current.y * scale,
      newZoom, w, h
    );
    commit();
  }, []);

  const zoomIn  = useCallback(() => doZoom(1.4),     [doZoom]);
  const zoomOut = useCallback(() => doZoom(1 / 1.4), [doZoom]);
  const reset   = useCallback(() => {
    zoomRef.current = 1;
    panRef.current  = { x: 0, y: 0 };
    commit();
  }, []);

  // Pointer drag
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPt.current   = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };
    const { w, h } = getSize();
    panRef.current = clampPan(
      panRef.current.x + dx,
      panRef.current.y + dy,
      zoomRef.current, w, h
    );
    commit();
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
  const isDragging = state.zoom > 1;

  return {
    containerRef,
    transform,
    zoom: state.zoom,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomIn, zoomOut, reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ZoomControls buttons
// ─────────────────────────────────────────────────────────────────────────────
function ZoomControls({ zoomIn, zoomOut, reset, zoom }) {
  const s = (dis) => ({
    width: 32, height: 32,
    background: "rgba(7,13,25,0.9)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 7,
    color: dis ? "#243d5e" : "#c8ddf0",
    cursor: dis ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
    transition: "background 0.15s",
  });
  return (
    <div
      style={{ position: "absolute", bottom: 14, right: 14, display: "flex", flexDirection: "column", gap: 5, zIndex: 40 }}
      onPointerDown={e => e.stopPropagation()} // prevent drag when clicking buttons
    >
      <button onPointerDown={e=>e.stopPropagation()} onClick={zoomIn}  disabled={zoom>=MAX_ZOOM} style={s(zoom>=MAX_ZOOM)}><ZoomIn  size={14}/></button>
      <button onPointerDown={e=>e.stopPropagation()} onClick={zoomOut} disabled={zoom<=MIN_ZOOM} style={s(zoom<=MIN_ZOOM)}><ZoomOut size={14}/></button>
      <button onPointerDown={e=>e.stopPropagation()} onClick={reset}   style={s(false)}><Maximize2 size={14}/></button>
      <div style={{ textAlign:"center", fontSize:9, fontFamily:"var(--mono)", color:"var(--text3)", background:"rgba(7,13,25,0.85)", borderRadius:4, padding:"2px 5px" }}>
        {Math.round(zoom*100)}%
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZoomableMap — wraps any content with smooth zoom+pan
// ─────────────────────────────────────────────────────────────────────────────
function ZoomableMap({ children, className, style }) {
  const zp = useZoomPan();
  return (
    <div
      ref={zp.containerRef}
      className={className}
      style={{ ...style, overflow:"hidden", cursor: zp.zoom>1 ? "grab" : "default", position:"relative", userSelect:"none" }}
      onPointerDown={zp.onPointerDown}
      onPointerMove={zp.onPointerMove}
      onPointerUp={zp.onPointerUp}
    >
      <div style={{ width:"100%", height:"100%", transform: zp.transform, transformOrigin:"50% 50%", willChange:"transform", imageRendering:"pixelated" }}>
        {children}
      </div>
      <ZoomControls zoomIn={zp.zoomIn} zoomOut={zp.zoomOut} reset={zp.reset} zoom={zp.zoom} />
      {zp.zoom > 1 && (
        <div style={{ position:"absolute", top:10, left:"50%", transform:"translateX(-50%)", background:"rgba(7,13,25,0.82)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"3px 10px", fontSize:9, fontFamily:"var(--mono)", color:"#fb8500", zIndex:20, pointerEvents:"none", whiteSpace:"nowrap" }}>
          <Move size={8} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/> drag to pan
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SwipeCompare — before/after swipe on the SAME image space
// The swipe handle lives OUTSIDE the zoom layer so it tracks screen coords.
// The clip is applied to the INNER (zoom) layer correctly.
// ─────────────────────────────────────────────────────────────────────────────
function SwipeCompare({ urlA, urlB, yearA, yearB }) {
  const zp = useZoomPan();
  const [swipePct, setSwipePct] = useState(50);
  const [hasSwipedOnce, setHasSwipedOnce] = useState(false);
  const swipeDragging = useRef(false);
  const wrapRef = useRef(null);

  const startSwipe = useCallback((e) => {
    e.stopPropagation();
    swipeDragging.current = true;
    setHasSwipedOnce(true);
    window.addEventListener("pointermove", moveSwipe);
    window.addEventListener("pointerup", endSwipe);
  }, []);

  const moveSwipe = useCallback((e) => {
    if (!swipeDragging.current || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pct  = Math.max(1, Math.min(99, ((e.clientX - rect.left) / rect.width) * 100));
    setSwipePct(pct);
  }, []);

  const endSwipe = useCallback(() => {
    swipeDragging.current = false;
    window.removeEventListener("pointermove", moveSwipe);
    window.removeEventListener("pointerup", endSwipe);
  }, [moveSwipe]);

  return (
    <div
      ref={wrapRef}
      style={{ flex:1, position:"relative", background:"#020810", borderRadius:"var(--radius)", border:"1px solid var(--border)", overflow:"hidden", minHeight:0, userSelect:"none" }}
    >
      {/* ── Zoom layer ── */}
      <div
        ref={zp.containerRef}
        style={{ position:"absolute", inset:0, overflow:"hidden", cursor: zp.zoom>1 ? "grab" : "default" }}
        onPointerDown={zp.onPointerDown}
        onPointerMove={zp.onPointerMove}
        onPointerUp={zp.onPointerUp}
      >
        <div style={{ width:"100%", height:"100%", transform: zp.transform, transformOrigin:"50% 50%", willChange:"transform", position:"relative" }}>
          {/* Year A — full */}
          <img src={urlA} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", imageRendering:"pixelated", display:"block" }}/>
          {/* Year B — clipped left of swipe line using % of the CONTENT box
              Because the content box is the same size as the container (before zoom),
              swipePct% in content space = swipePct% screen position */}
          <div style={{ position:"absolute", inset:0, clipPath:`inset(0 0 0 ${swipePct}%)` }}>
            <img src={urlB} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", imageRendering:"pixelated", display:"block" }}/>
          </div>
        </div>
      </div>

      {/* ── Swipe line + handle — in screen space outside zoom ── */}
      <div style={{ position:"absolute", top:0, bottom:0, left:`${swipePct}%`, width:2, background:"rgba(255,255,255,0.85)", zIndex:20, pointerEvents:"none", transform:"translateX(-1px)" }}/>
      <div
        onPointerDown={startSwipe}
        style={{
          position:"absolute", top:"50%", left:`${swipePct}%`,
          transform:"translate(-50%,-50%)",
          width:38, height:38, borderRadius:"50%",
          background:"white", border:"2px solid #ccc",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"ew-resize", zIndex:25,
          boxShadow:"0 2px 14px rgba(0,0,0,0.5)",
          fontSize:16, color:"#070d19", fontWeight:900,
          userSelect:"none",
        }}
      >⇄</div>

      {/* Labels */}
      <div style={{ position:"absolute", top:12, left:12, fontSize:22, fontWeight:700, fontFamily:"var(--mono)", color:"#fff", textShadow:"0 2px 12px #000", pointerEvents:"none", zIndex:15 }}>{yearA}</div>
      <div style={{ position:"absolute", top:12, right:55, fontSize:22, fontWeight:700, fontFamily:"var(--mono)", color:"#fff", textShadow:"0 2px 12px #000", pointerEvents:"none", zIndex:15 }}>{yearB}</div>

      {/* Hint — disappears after first swipe */}
      {!hasSwipedOnce && (
        <div style={{ position:"absolute", bottom:55, left:"50%", transform:"translateX(-50%)", background:"rgba(7,13,25,0.85)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"4px 14px", fontSize:10, fontFamily:"var(--mono)", color:"var(--text3)", zIndex:15, pointerEvents:"none", whiteSpace:"nowrap" }}>
          ⇄ drag handle to compare years
        </div>
      )}

      <ZoomControls zoomIn={zp.zoomIn} zoomOut={zp.zoomOut} reset={zp.reset} zoom={zp.zoom}/>
      {zp.zoom > 1 && (
        <div style={{ position:"absolute", top:10, left:"50%", transform:"translateX(-50%)", background:"rgba(7,13,25,0.82)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"3px 10px", fontSize:9, fontFamily:"var(--mono)", color:"#fb8500", zIndex:30, pointerEvents:"none", whiteSpace:"nowrap" }}>
          <Move size={8} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/> drag map to pan
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tt-year">{label}</div>
      <div className="tt-val">{payload[0]?.value?.toFixed(1)} <span>km²</span></div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("timelapse");
  const [compareMode, setCompareMode] = useState("swipe");
  const [yearIdx, setYearIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showAllClasses, setShowAllClasses] = useState(true);
  const [showHotspot, setShowHotspot] = useState(false);
  const [yearA, setYearA] = useState(null);
  const [yearB, setYearB] = useState(null);
  const [showChange, setShowChange] = useState(false);
  const [opacityB, setOpacityB] = useState(50);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE}/stats.json`).then(r=>r.json()).then(d=>{
      setStats(d); setYearA(d.years[0]); setYearB(d.years[d.years.length-1]);
    }).catch(()=>{
      setStats(EMBEDDED_STATS);
      setYearA(EMBEDDED_STATS.years[0]);
      setYearB(EMBEDDED_STATS.years[EMBEDDED_STATS.years.length-1]);
    });
  }, []);

  useEffect(() => {
    if (!stats || !playing) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setYearIdx(i => { if (i >= stats.years.length-1) { setPlaying(false); return 0; } return i+1; });
    }, 1200/speed);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, stats]);

  if (!stats) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070d19",flexDirection:"column",gap:16}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:"2px solid #ff4d6d",borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:12,letterSpacing:3,color:"#8fa8c8",fontFamily:"monospace"}}>INITIALIZING SATELLITE DATA</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const years = stats.years;
  const currentYear = years[yearIdx];
  const currentData = stats.data[currentYear];
  const prevData = yearIdx > 0 ? stats.data[years[yearIdx-1]] : null;
  const yoyChange = prevData ? currentData.builtup.area_km2 - prevData.builtup.area_km2 : null;
  const isPredicted = !currentData?.observed;
  const totalGrowth = stats.data[years[years.length-1]].builtup.area_km2 - stats.data[years[0]].builtup.area_km2;
  const sparkData = years.map(y=>({year:y, builtup: stats.data[y]?.builtup?.area_km2??0}));
  const tileUrl = y => showAllClasses ? `${BASE}/tiles/${y}_tile.png` : `${BASE}/tiles/${y}_builtup.png`;
  const dataA = yearA ? stats.data[yearA] : null;
  const dataB = yearB ? stats.data[yearB] : null;
  const isConsecutive = yearA && yearB && Math.abs(years.indexOf(yearB)-years.indexOf(yearA))===1;
  const [sY,bY] = yearA && yearB ? (yearA<yearB?[yearA,yearB]:[yearB,yearA]) : [yearA,yearB];

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#070d19;--bg2:#0b1525;--bg3:#0f1e35;--bg4:#142444;
          --border:#1a2e4a;--border2:#243d5e;
          --accent:#ff4d6d;--blue:#4895ef;--cyan:#4cc9f0;--gold:#ffb703;
          --text:#e2eaf5;--text2:#8fa8c8;--text3:#4a6580;
          --font:'Inter',sans-serif;--mono:'JetBrains Mono',monospace;--radius:10px;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--font);}
        .app{display:flex;flex-direction:column;height:100vh;overflow:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}

        .header{display:flex;align-items:center;justify-content:space-between;padding:0 22px;height:54px;background:rgba(11,21,37,0.97);border-bottom:1px solid var(--border);flex-shrink:0;}
        .header-left{display:flex;align-items:center;gap:11px;}
        .logo{width:32px;height:32px;background:linear-gradient(135deg,var(--accent),#c9184a);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;}
        .header-title{font-size:14px;font-weight:700;}
        .header-title span{color:var(--accent);}
        .header-sub{font-size:10px;color:var(--text3);font-family:var(--mono);letter-spacing:1px;}
        .badge{padding:3px 9px;border-radius:20px;font-size:10px;font-family:var(--mono);font-weight:500;}
        .badge-s{background:rgba(251,133,0,.12);color:#fb8500;border:1px solid rgba(251,133,0,.25);}
        .badge-b{background:rgba(72,149,239,.12);color:var(--blue);border:1px solid rgba(72,149,239,.25);}

        .sumbar{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border);background:var(--bg2);flex-shrink:0;}
        .si{padding:8px 16px;border-right:1px solid var(--border);}
        .si:last-child{border-right:none;}
        .sl{font-size:9px;font-family:var(--mono);letter-spacing:1.5px;color:var(--text3);margin-bottom:2px;}
        .sv{font-size:18px;font-weight:700;font-family:var(--mono);line-height:1;}
        .sv.r{color:var(--accent);}.sv.g{color:#52b788;}.sv.gold{color:var(--gold);}.sv.b{color:var(--cyan);}
        .ss{font-size:9px;color:var(--text3);margin-top:1px;}

        .tabs{display:flex;background:var(--bg2);border-bottom:1px solid var(--border);padding:0 16px;flex-shrink:0;}
        .tb{background:none;border:none;cursor:pointer;padding:9px 15px;font-family:var(--font);font-size:12px;font-weight:500;color:var(--text3);display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s;}
        .tb:hover{color:var(--text2);}
        .tb.on{color:var(--text);border-bottom-color:var(--accent);}

        .main{display:flex;flex:1;overflow:hidden;min-height:0;}
        .mapp{flex:1;display:flex;flex-direction:column;padding:10px 12px;gap:8px;min-width:0;overflow:hidden;}

        /* Map boxes */
        .mapbox{flex:1;position:relative;background:#020810;border-radius:var(--radius);border:1px solid var(--border);min-height:0;overflow:hidden;}
        .mapbox.predicted{border-style:dashed;}
        .fi{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;}

        /* Overlays */
        .yr-badge{position:absolute;top:12px;left:12px;background:rgba(7,13,25,.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:7px 12px;display:flex;align-items:baseline;gap:8px;z-index:5;pointer-events:none;}
        .yr-num{font-family:var(--mono);font-size:34px;font-weight:700;color:#fff;line-height:1;letter-spacing:-2px;}
        .pred-tag{font-size:9px;font-family:var(--mono);padding:2px 6px;background:rgba(255,183,3,.15);border:1px solid rgba(255,183,3,.4);color:var(--gold);border-radius:4px;}
        .stat-ov{position:absolute;top:12px;right:55px;background:rgba(7,13,25,.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:9px 11px;min-width:110px;z-index:5;pointer-events:none;}
        .sol{font-size:9px;font-family:var(--mono);color:var(--text3);letter-spacing:1px;margin-bottom:2px;}
        .sov{font-size:20px;font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;}
        .sou{font-size:10px;color:var(--text3);}
        .sop{font-size:11px;font-weight:500;color:var(--text2);margin-top:3px;}
        .soc{font-size:10px;font-weight:500;font-family:var(--mono);margin-top:4px;padding-top:4px;border-top:1px solid var(--border);}
        .leg{position:absolute;bottom:50px;left:12px;display:flex;gap:5px;flex-wrap:wrap;z-index:5;pointer-events:none;}
        .li{display:flex;align-items:center;gap:4px;background:rgba(7,13,25,.82);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.07);padding:3px 6px;border-radius:5px;font-size:9px;color:var(--text2);}
        .ld{width:7px;height:7px;border-radius:2px;flex-shrink:0;}

        /* Slider */
        .sl-sec{padding:0 4px;flex-shrink:0;}
        .sl-ticks{position:relative;height:15px;margin-bottom:3px;}
        .tick{position:absolute;top:0;transform:translateX(-50%);font-size:9px;font-family:var(--mono);color:var(--text3);pointer-events:none;}
        .tick.sensor{color:#fb8500;}
        .tickl{position:absolute;bottom:0;left:50%;width:1px;height:5px;background:#fb8500;transform:translateX(-50%);}
        input[type=range]{-webkit-appearance:none;width:100%;background:transparent;cursor:pointer;}
        input[type=range]::-webkit-slider-runnable-track{height:4px;background:linear-gradient(to right,var(--accent) 0%,var(--accent) var(--fill,0%),var(--bg4) var(--fill,0%),var(--bg4) 100%);border-radius:2px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);margin-top:-5px;border:2px solid var(--bg);box-shadow:0 0 0 3px rgba(255,77,109,.25);}
        .op-sl::-webkit-slider-runnable-track{background:linear-gradient(to right,#4895ef,#ff4d6d)!important;}
        .op-sl::-webkit-slider-thumb{background:#fff!important;box-shadow:0 0 0 3px rgba(255,255,255,.2)!important;}

        /* Controls */
        .ctrls{display:flex;align-items:center;gap:7px;flex-wrap:wrap;flex-shrink:0;}
        .pbtn{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,var(--accent),#c9184a);display:flex;align-items:center;justify-content:center;color:white;transition:all .2s;flex-shrink:0;box-shadow:0 4px 14px rgba(255,77,109,.35);}
        .pbtn:hover{transform:scale(1.07);}
        .spg{display:flex;border:1px solid var(--border2);border-radius:6px;overflow:hidden;}
        .spb{background:none;border:none;cursor:pointer;padding:5px 9px;font-family:var(--mono);font-size:10px;color:var(--text3);transition:all .15s;border-right:1px solid var(--border);}
        .spb:last-child{border-right:none;}
        .spb.on{background:var(--bg4);color:var(--cyan);}
        .cbtn{display:flex;align-items:center;gap:5px;background:var(--bg3);border:1px solid var(--border2);cursor:pointer;padding:6px 11px;font-family:var(--font);font-size:11px;color:var(--text2);transition:all .2s;border-radius:6px;font-weight:500;white-space:nowrap;}
        .cbtn:hover{border-color:var(--blue);color:var(--blue);}
        .cbtn.on{border-color:var(--accent);color:var(--accent);background:rgba(255,77,109,.08);}

        /* Stats panel */
        .sp{width:265px;border-left:1px solid var(--border);background:var(--bg2);display:flex;flex-direction:column;overflow-y:auto;flex-shrink:0;}
        .ps{padding:12px 14px;border-bottom:1px solid var(--border);}
        .pt{font-size:9px;font-family:var(--mono);letter-spacing:2px;color:var(--text3);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
        .pt::before{content:'';width:3px;height:10px;background:var(--accent);border-radius:2px;}
        .gc{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:11px;margin-bottom:8px;}
        .gcb{font-size:40px;font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;letter-spacing:-2px;}
        .gcu{font-size:12px;color:var(--text3);}
        .gcr{display:flex;gap:14px;margin-top:7px;}
        .gcl{font-size:9px;font-family:var(--mono);letter-spacing:1px;color:var(--text3);margin-bottom:1px;}
        .gcv{font-size:14px;font-weight:600;font-family:var(--mono);}
        .ci{margin-bottom:9px;}
        .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
        .cn{font-size:11px;font-weight:500;display:flex;align-items:center;gap:4px;}
        .cv{font-size:10px;font-family:var(--mono);color:var(--text3);}
        .ct{height:5px;background:var(--bg4);border-radius:3px;overflow:hidden;}
        .cf{height:100%;border-radius:3px;transition:width .4s;}
        .custom-tooltip{background:var(--bg3);border:1px solid var(--border2);padding:6px 10px;border-radius:6px;font-family:var(--mono);}
        .tt-year{font-size:10px;color:var(--text3);}
        .tt-val{font-size:13px;font-weight:600;color:var(--accent);}
        .tt-val span{font-size:10px;color:var(--text3);}

        /* Compare layout */
        .cmp-layout{display:flex;flex:1;overflow:hidden;min-height:0;}
        .cmp-col{flex:1;display:flex;flex-direction:column;padding:10px 12px;gap:8px;min-width:0;overflow:hidden;}
        .cmp-ctrl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex-shrink:0;}
        select{background:var(--bg3);border:1px solid var(--border2);color:var(--text);font-family:var(--mono);font-size:13px;padding:6px 10px;cursor:pointer;outline:none;border-radius:6px;font-weight:600;}
        select:focus{border-color:var(--blue);}
        .vs{font-size:11px;font-family:var(--mono);color:var(--text3);padding:5px 9px;background:var(--bg4);border-radius:20px;}
        .mg{display:flex;border:1px solid var(--border2);border-radius:6px;overflow:hidden;}
        .mb{background:none;border:none;cursor:pointer;padding:6px 11px;font-family:var(--font);font-size:11px;color:var(--text3);transition:all .15s;border-right:1px solid var(--border);font-weight:500;}
        .mb:last-child{border-right:none;}
        .mb.on{background:var(--bg4);color:var(--cyan);}
        .mb:hover:not(.on){background:var(--bg3);color:var(--text2);}

        /* Split side-by-side */
        .split-wrap{flex:1;display:flex;gap:6px;min-height:0;}
        .split-half{flex:1;position:relative;background:#020810;border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;min-height:0;}
        .split-lbl{position:absolute;top:10px;left:10px;font-size:20px;font-weight:700;font-family:var(--mono);color:#fff;text-shadow:0 2px 10px #000;pointer-events:none;z-index:5;}

        /* Opacity */
        .op-wrap{flex:1;display:flex;flex-direction:column;gap:8px;min-height:0;}
        .op-ctrl{flex-shrink:0;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:9px 14px;}
        .op-row{display:flex;align-items:center;gap:10px;}
        .op-yr{font-size:13px;font-weight:700;font-family:var(--mono);min-width:34px;}
        .op-yr.a{color:var(--blue);}.op-yr.b{color:var(--accent);}

        /* Compare stats */
        .csp{width:265px;border-left:1px solid var(--border);background:var(--bg2);overflow-y:auto;flex-shrink:0;}
        .dc{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:11px;margin-bottom:8px;}
        .dcp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px;}
        .dyb{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;}
        .dy{font-size:10px;font-family:var(--mono);color:var(--text3);margin-bottom:3px;}
        .dv{font-size:20px;font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;letter-spacing:-1px;}
        .du{font-size:9px;color:var(--text3);}
        .dp{font-size:11px;font-weight:500;color:var(--text2);margin-top:2px;}
        .ddr{display:flex;justify-content:space-between;}
        .ddl{font-size:9px;font-family:var(--mono);color:var(--text3);letter-spacing:1px;margin-bottom:2px;}
        .ddv{font-size:17px;font-weight:700;font-family:var(--mono);}
        .ctbl{width:100%;border-collapse:collapse;font-size:11px;font-family:var(--mono);}
        .ctbl th{text-align:right;padding:3px 0;color:var(--text3);font-weight:500;font-size:9px;}
        .ctbl th:first-child{text-align:left;}
        .ctbl td{padding:5px 0;border-bottom:1px solid var(--border);text-align:right;color:var(--text2);}
        .ctbl td:first-child{text-align:left;}
        .ctbl tr:last-child td{border-bottom:none;}

        .footer{border-top:1px solid var(--border);padding:6px 20px;display:flex;justify-content:space-between;align-items:center;background:var(--bg2);flex-shrink:0;}
        .fi-t{font-size:9px;font-family:var(--mono);color:var(--text3);}
        .fdot{width:6px;height:6px;background:var(--accent);border-radius:50%;animation:pulse 2s ease-in-out infinite;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
      `}</style>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo">🛰️</div>
          <div>
            <div className="header-title">Kathmandu Valley <span>Urban Growth</span></div>
            <div className="header-sub">LAND USE & LAND COVER · 2000 – 2022</div>
          </div>
        </div>
        <div style={{display:"flex",gap:7}}>
          <span className="badge badge-b">LANDSAT 5/7/8/9</span>
          <span className="badge badge-s">⚡ L7→L8: 2013</span>
        </div>
      </header>

      {/* ── Summary bar ── */}
      <div className="sumbar">
        <div className="si"><div className="sl">BUILT-UP 2022</div><div className="sv r">{stats.data[2022].builtup.area_km2.toFixed(0)}<span style={{fontSize:11}}> km²</span></div><div className="ss">{stats.data[2022].builtup.pct.toFixed(1)}% of valley</div></div>
        <div className="si"><div className="sl">TOTAL GROWTH</div><div className="sv gold">+{totalGrowth.toFixed(0)}<span style={{fontSize:11}}> km²</span></div><div className="ss">since 2000</div></div>
        <div className="si"><div className="sl">VEGETATION 2022</div><div className="sv g">{stats.data[2022].vegetation.pct.toFixed(1)}<span style={{fontSize:11}}>%</span></div><div className="ss">{stats.data[2022].vegetation.area_km2.toFixed(0)} km²</div></div>
        <div className="si"><div className="sl">VALLEY AREA</div><div className="sv b">1,039<span style={{fontSize:11}}> km²</span></div><div className="ss">total valid area</div></div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tb ${tab==="timelapse"?"on":""}`} onClick={()=>setTab("timelapse")}><Play size={12}/>Timelapse</button>
        <button className={`tb ${tab==="compare"?"on":""}`}   onClick={()=>setTab("compare")}><BarChart2 size={12}/>Compare Years</button>
      </div>

      {/* ════════════ TIMELAPSE ════════════ */}
      {tab === "timelapse" && (
        <div className="main">
          <div className="mapp">
            <ZoomableMap className={`mapbox ${isPredicted?"predicted":""}`}>
              <img className="fi" src={tileUrl(currentYear)} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/>
              {showHotspot && <img className="fi" src={`${BASE}/hotspot/hotspot.png`} style={{opacity:.7,mixBlendMode:"screen"}} alt=""/>}
              {/* overlays — inside zoom so they stay on map */}
              <div className="yr-badge"><span className="yr-num">{currentYear}</span>{isPredicted&&<span className="pred-tag">PREDICTED</span>}</div>
              <div className="stat-ov">
                <div className="sol">BUILT-UP</div>
                <div className="sov">{currentData?.builtup.area_km2.toFixed(1)}<span className="sou"> km²</span></div>
                <div className="sop">{currentData?.builtup.pct.toFixed(1)}% coverage</div>
                {yoyChange!==null&&<div className="soc" style={{color:yoyChange>=0?"#fb8500":"var(--blue)"}}>{yoyChange>=0?"▲":"▼"} {Math.abs(yoyChange).toFixed(1)} km²</div>}
              </div>
              <div className="leg">
                {(showHotspot?HOTSPOT_LEGEND:Object.entries(LULC).map(([,v])=>({color:v.color,label:v.label}))).map(it=>(
                  <div key={it.label} className="li"><div className="ld" style={{background:it.color}}/>{it.label}</div>
                ))}
              </div>
            </ZoomableMap>

            <div className="sl-sec">
              <div className="sl-ticks">
                {years.map((y,i)=>(
                  <div key={y} className={`tick ${y===2013?"sensor":""}`} style={{left:`${(i/(years.length-1))*100}%`}}>
                    {(y%5===0||y===2013)?y:""}{y===2013&&<div className="tickl"/>}
                  </div>
                ))}
              </div>
              <input type="range" min={0} max={years.length-1} value={yearIdx} style={{"--fill":`${(yearIdx/(years.length-1))*100}%`}} onChange={e=>{setYearIdx(+e.target.value);setPlaying(false);}}/>
            </div>

            <div className="ctrls">
              <button className="pbtn" onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={16}/>:<Play size={16}/>}</button>
              <div className="spg">{SPEED_OPTIONS.map(s=><button key={s} className={`spb ${speed===s?"on":""}`} onClick={()=>setSpeed(s)}>{s}×</button>)}</div>
              <div style={{flex:1}}/>
              <button className={`cbtn ${!showAllClasses?"on":""}`} onClick={()=>setShowAllClasses(v=>!v)}><Layers size={11}/>{showAllClasses?"All Classes":"Built-up Only"}</button>
              <button className={`cbtn ${showHotspot?"on":""}`} onClick={()=>setShowHotspot(v=>!v)}>{showHotspot?<Eye size={11}/>:<EyeOff size={11}/>}Hotspot</button>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="sp">
            <div className="ps">
              <div className="pt">Built-up Area</div>
              <div className="gc">
                <div className="gcb">{currentData?.builtup.area_km2.toFixed(1)}<span className="gcu"> km²</span></div>
                <div className="gcr">
                  <div><div className="gcl">COVERAGE</div><div className="gcv" style={{color:"var(--text)"}}>{currentData?.builtup.pct.toFixed(1)}%</div></div>
                  {yoyChange!==null&&<div><div className="gcl">YoY CHANGE</div><div className="gcv" style={{color:yoyChange>=0?"#fb8500":"var(--blue)"}}>{yoyChange>=0?"+":""}{yoyChange.toFixed(1)} km²</div></div>}
                </div>
              </div>
            </div>
            <div className="ps">
              <div className="pt">Growth Trajectory</div>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={sparkData} margin={{top:4,right:4,left:-20,bottom:0}}>
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff4d6d" stopOpacity={.3}/><stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4a" vertical={false}/>
                  <XAxis dataKey="year" hide/><YAxis domain={["auto","auto"]} tick={{fontSize:8,fill:"#4a6580",fontFamily:"var(--mono)"}}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <ReferenceLine x={currentYear} stroke="#ff4d6d" strokeWidth={1.5} strokeDasharray="4 3"/>
                  <ReferenceLine x={2013} stroke="#fb8500" strokeWidth={1} strokeOpacity={.5}/>
                  <Area type="monotone" dataKey="builtup" stroke="#ff4d6d" strokeWidth={2} fill="url(#g1)" dot={false} activeDot={{r:4,fill:"#ff4d6d",stroke:"var(--bg)",strokeWidth:2}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="ps">
              <div className="pt">Land Cover Breakdown</div>
              {Object.entries(LULC).map(([k,v])=>{
                const d=currentData?.[k]; if(!d)return null;
                return(<div key={k} className="ci"><div className="ch"><div className="cn" style={{color:v.color}}>{v.icon} {v.label}</div><div className="cv">{d.area_km2.toFixed(1)} km²·{d.pct.toFixed(1)}%</div></div><div className="ct"><div className="cf" style={{width:`${d.pct}%`,background:`linear-gradient(90deg,${v.grad[0]},${v.grad[1]})`}}/></div></div>);
              })}
            </div>
            {showHotspot&&<div className="ps"><div className="pt">Urbanization Eras</div>{HOTSPOT_LEGEND.map(h=><div key={h.label} style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}><div style={{width:10,height:10,background:h.color,borderRadius:2,flexShrink:0}}/><span style={{fontSize:11,color:"var(--text2)"}}>{h.label}</span></div>)}</div>}
          </div>
        </div>
      )}

      {/* ════════════ COMPARE ════════════ */}
      {tab === "compare" && (
        <div className="cmp-layout">
          <div className="cmp-col">
            {/* Controls */}
            <div className="cmp-ctrl">
              <span style={{fontSize:9,fontFamily:"var(--mono)",letterSpacing:1,color:"var(--text3)"}}>YEAR A</span>
              <select value={yearA} onChange={e=>setYearA(+e.target.value)}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
              <span className="vs">VS</span>
              <span style={{fontSize:9,fontFamily:"var(--mono)",letterSpacing:1,color:"var(--text3)"}}>YEAR B</span>
              <select value={yearB} onChange={e=>setYearB(+e.target.value)}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
              <div style={{flex:1}}/>
              <div className="mg">
                <button className={`mb ${compareMode==="swipe"?"on":""}`}   onClick={()=>setCompareMode("swipe")}>⇄ Swipe</button>
                <button className={`mb ${compareMode==="split"?"on":""}`}   onClick={()=>setCompareMode("split")}>▌▐ Split</button>
                <button className={`mb ${compareMode==="opacity"?"on":""}`} onClick={()=>setCompareMode("opacity")}>◑ Opacity</button>
              </div>
              {compareMode==="split"&&(
                <button className={`cbtn ${showChange?"on":""}`} disabled={!isConsecutive} onClick={()=>isConsecutive&&setShowChange(v=>!v)} style={{opacity:isConsecutive?1:.35,cursor:isConsecutive?"pointer":"not-allowed"}}>
                  <AlertCircle size={11}/>Change Layer{!isConsecutive&&<span style={{fontSize:9,opacity:.6}}>(consec.)</span>}
                </button>
              )}
            </div>

            {/* ── SWIPE ── */}
            {compareMode==="swipe" && yearA && yearB && (
              <SwipeCompare
                urlA={`${BASE}/tiles/${yearA}_tile.png`}
                urlB={`${BASE}/tiles/${yearB}_tile.png`}
                yearA={yearA} yearB={yearB}
              />
            )}

            {/* ── SPLIT — two separate full maps side by side ── */}
            {compareMode==="split" && (
              <div className="split-wrap">
                {showChange && isConsecutive ? (
                  <ZoomableMap className="mapbox" style={{flex:1}}>
                    <img className="fi" src={`${BASE}/change/${sY}_${bY}_change.png`} alt=""/>
                    <div style={{position:"absolute",bottom:50,left:12,display:"flex",gap:5,zIndex:5,pointerEvents:"none"}}>
                      {[{c:"#8b0000",l:"Stable"},{c:"#fb8500",l:"New"},{c:"#4895ef",l:"Lost"}].map(x=>(
                        <div key={x.l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#aaa",background:"rgba(7,13,25,.85)",padding:"3px 6px",borderRadius:4}}><div style={{width:7,height:7,background:x.c,borderRadius:1}}/>{x.l}</div>
                      ))}
                    </div>
                  </ZoomableMap>
                ) : (
                  <>
                    {/* Left half — Year A */}
                    <ZoomableMap className="split-half">
                      <img className="fi" src={`${BASE}/tiles/${yearA}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/>
                      <div className="split-lbl">{yearA}</div>
                    </ZoomableMap>
                    {/* Right half — Year B */}
                    <ZoomableMap className="split-half">
                      <img className="fi" src={`${BASE}/tiles/${yearB}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/>
                      <div className="split-lbl">{yearB}</div>
                    </ZoomableMap>
                  </>
                )}
              </div>
            )}

            {/* ── OPACITY ── */}
            {compareMode==="opacity" && (
              <div className="op-wrap">
                <ZoomableMap className="mapbox" style={{flex:1}}>
                  <img className="fi" src={`${BASE}/tiles/${yearA}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/>
                  <img className="fi" src={`${BASE}/tiles/${yearB}_tile.png`} alt="" style={{opacity:opacityB/100}} onError={e=>e.target.style.opacity=0}/>
                  <div style={{position:"absolute",top:12,left:12,background:"rgba(7,13,25,.82)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"5px 11px",zIndex:5,pointerEvents:"none",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,fontFamily:"var(--mono)",color:"#4895ef",fontWeight:700}}>{yearA}</span>
                    <span style={{fontSize:10,color:"var(--text3)"}}>→</span>
                    <span style={{fontSize:12,fontFamily:"var(--mono)",color:"#ff4d6d",fontWeight:700}}>{yearB}</span>
                    <span style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",marginLeft:4}}>{yearB}: {opacityB}%</span>
                  </div>
                </ZoomableMap>
                <div className="op-ctrl">
                  <div className="op-row">
                    <span className="op-yr a">{yearA}</span>
                    <div style={{flex:1}}><input type="range" className="op-sl" min={0} max={100} value={opacityB} style={{"--fill":`${opacityB}%`}} onChange={e=>setOpacityB(+e.target.value)}/></div>
                    <span className="op-yr b">{yearB}</span>
                  </div>
                  <div style={{textAlign:"center",fontSize:10,fontFamily:"var(--mono)",color:"var(--text3)",marginTop:3}}>← drag to blend between years →</div>
                </div>
              </div>
            )}
          </div>

          {/* Compare stats panel */}
          <div className="csp">
            {dataA&&dataB&&(()=>{
              const delta=dataB.builtup.area_km2-dataA.builtup.area_km2;
              const pctChg=((delta/dataA.builtup.area_km2)*100).toFixed(1);
              return(<>
                <div className="ps">
                  <div className="pt">Built-up Comparison</div>
                  <div className="dc">
                    <div className="dcp">
                      {[[yearA,dataA],[yearB,dataB]].map(([y,d])=>(
                        <div key={y} className="dyb"><div className="dy">{y}</div><div className="dv">{d.builtup.area_km2.toFixed(1)}</div><div className="du">km²</div><div className="dp">{d.builtup.pct.toFixed(1)}%</div></div>
                      ))}
                    </div>
                    <div className="ddr">
                      <div><div className="ddl">CHANGE</div><div className="ddv" style={{color:delta>=0?"#fb8500":"var(--blue)"}}>{delta>=0?"+":""}{delta.toFixed(1)}<span style={{fontSize:10}}> km²</span></div></div>
                      <div><div className="ddl">% CHANGE</div><div className="ddv" style={{color:delta>=0?"#fb8500":"var(--blue)"}}>{delta>=0?"+":""}{pctChg}%</div></div>
                    </div>
                  </div>
                </div>
                <div className="ps">
                  <div className="pt">Per-Class Comparison</div>
                  <table className="ctbl">
                    <thead><tr><th>Class</th><th>{yearA}</th><th>{yearB}</th><th>Δ</th></tr></thead>
                    <tbody>{Object.entries(LULC).map(([k,v])=>{const a=dataA[k]?.area_km2,b=dataB[k]?.area_km2,d=b-a;return(<tr key={k}><td><span style={{color:v.color,fontWeight:600}}>{v.label}</span></td><td>{a?.toFixed(1)}</td><td>{b?.toFixed(1)}</td><td style={{color:d>=0?"#fb8500":"var(--blue)",fontWeight:600}}>{d>=0?"+":""}{d.toFixed(1)}</td></tr>);})}</tbody>
                  </table>
                  <div style={{fontSize:9,color:"var(--text3)",marginTop:5,fontFamily:"var(--mono)"}}>all values in km²</div>
                </div>
                <div className="ps">
                  <div className="pt">Coverage Comparison</div>
                  {Object.entries(LULC).map(([k,v])=>{
                    const pA=dataA[k]?.pct??0,pB=dataB[k]?.pct??0;
                    return(<div key={k} style={{marginBottom:9}}><div style={{fontSize:11,color:v.color,fontWeight:500,marginBottom:4}}>{v.icon} {v.label}</div>
                      {[[yearA,pA,.5],[yearB,pB,1]].map(([y,p,op])=>(
                        <div key={y} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                          <div style={{width:30,fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",textAlign:"right"}}>{y}</div>
                          <div style={{flex:1,height:5,background:"var(--bg4)",borderRadius:3}}><div style={{width:`${p}%`,height:"100%",background:v.color,borderRadius:3,opacity:op}}/></div>
                          <div style={{width:30,fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)"}}>{p.toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>);
                  })}
                </div>
              </>);
            })()}
          </div>
        </div>
      )}

      <footer className="footer">
        <span className="fi-t">DATA: LANDSAT COLLECTION 2 · GOOGLE EARTH ENGINE</span>
        <div style={{display:"flex",alignItems:"center",gap:7}}><div className="fdot"/><span className="fi-t">SCROLL TO ZOOM · DRAG TO PAN</span></div>
        <span className="fi-t">~30M/PX · VALLEY: 1039.02 KM²</span>
      </footer>
    </div>
  );
}