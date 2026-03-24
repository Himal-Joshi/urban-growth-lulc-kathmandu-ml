import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Play, Pause, Layers, Eye, EyeOff, AlertCircle, BarChart2, ZoomIn, ZoomOut, Maximize2, Move, ChevronUp, ChevronDown, Menu, X } from "lucide-react";

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

const EMBEDDED_STATS = {"years":[2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2024,2025,2026,2027,2028,2029,2030],"data":{"2000":{"year":2000,"observed":true,"water":{"pixels":591,"area_km2":0.53,"pct":0.05},"vegetation":{"pixels":526634,"area_km2":473.97,"pct":45.62},"cropland":{"pixels":523286,"area_km2":470.96,"pct":45.33},"builtup":{"pixels":103956,"area_km2":93.56,"pct":9.0},"total_valid_km2":1039.02},"2001":{"year":2001,"observed":true,"water":{"pixels":744,"area_km2":0.67,"pct":0.06},"vegetation":{"pixels":533946,"area_km2":480.55,"pct":46.25},"cropland":{"pixels":525006,"area_km2":472.51,"pct":45.48},"builtup":{"pixels":94771,"area_km2":85.29,"pct":8.21},"total_valid_km2":1039.02},"2002":{"year":2002,"observed":true,"water":{"pixels":890,"area_km2":0.8,"pct":0.08},"vegetation":{"pixels":544308,"area_km2":489.88,"pct":47.15},"cropland":{"pixels":518127,"area_km2":466.31,"pct":44.88},"builtup":{"pixels":91142,"area_km2":82.03,"pct":7.89},"total_valid_km2":1039.02},"2003":{"year":2003,"observed":true,"water":{"pixels":972,"area_km2":0.87,"pct":0.08},"vegetation":{"pixels":561115,"area_km2":505.0,"pct":48.6},"cropland":{"pixels":498405,"area_km2":448.56,"pct":43.17},"builtup":{"pixels":93975,"area_km2":84.58,"pct":8.14},"total_valid_km2":1039.02},"2004":{"year":2004,"observed":true,"water":{"pixels":982,"area_km2":0.88,"pct":0.09},"vegetation":{"pixels":578782,"area_km2":520.9,"pct":50.13},"cropland":{"pixels":475396,"area_km2":427.86,"pct":41.18},"builtup":{"pixels":99307,"area_km2":89.38,"pct":8.6},"total_valid_km2":1039.02},"2005":{"year":2005,"observed":true,"water":{"pixels":1013,"area_km2":0.91,"pct":0.09},"vegetation":{"pixels":590334,"area_km2":531.3,"pct":51.13},"cropland":{"pixels":459666,"area_km2" :413.7,"pct":39.82},"builtup":{"pixels":103454,"area_km2":93.11,"pct":8.96},"total_valid_km2":1039.02},"2006":{"year":2006,"observed":true,"water":{"pixels":960,"area_km2":0.86,"pct":0.08},"vegetation":{"pixels":593323,"area_km2":533.99,"pct":51.39},"cropland":{"pixels":454096,"area_km2":408.69,"pct":39.33},"builtup":{"pixels":106088,"area_km2":95.48,"pct":9.19},"total_valid_km2":1039.02},"2007":{"year":2007,"observed":true,"water":{"pixels":852,"area_km2":0.77,"pct":0.07},"vegetation":{"pixels":588067,"area_km2":529.26,"pct":50.94},"cropland":{"pixels":456716,"area_km2":411.04,"pct":39.56},"builtup":{"pixels":108832,"area_km2":97.95,"pct":9.43},"total_valid_km2":1039.02},"2008":{"year":2008,"observed":true,"water":{"pixels":711,"area_km2":0.64,"pct":0.06},"vegetation":{"pixels":583399,"area_km2":525.06,"pct":50.53},"cropland":{"pixels":457738,"area_km2":411.96,"pct":39.65},"builtup":{"pixels":112619,"area_km2":101.36,"pct":9.76},"total_valid_km2":1039.02},"2009":{"year":2009,"observed":true,"water":{"pixels":567,"area_km2":0.51,"pct":0.05},"vegetation":{"pixels":575457,"area_km2":517.91,"pct":49.85},"cropland":{"pixels":461015,"area_km2":414.91,"pct":39.93},"builtup":{"pixels":117428,"area_km2":105.69,"pct":10.17},"total_valid_km2":1039.02},"2010":{"year":2010,"observed":true,"water":{"pixels":479,"area_km2":0.43,"pct":0.04},"vegetation":{"pixels":572950,"area_km2":515.65,"pct":49.63},"cropland":{"pixels":459010,"area_km2":413.11,"pct":39.76},"builtup":{"pixels":122028,"area_km2":109.83,"pct":10.57},"total_valid_km2":1039.02},"2011":{"year":2011,"observed":true,"water":{"pixels":352,"area_km2":0.32,"pct":0.03},"vegetation":{"pixels":569727,"area_km2":512.75,"pct":49.35},"cropland":{"pixels":458910,"area_km2":413.02,"pct":39.75},"builtup":{"pixels":125478,"area_km2":112.93,"pct":10.87},"total_valid_km2":1039.02},"2013":{"year":2013,"observed":true,"water":{"pixels":262,"area_km2":0.24,"pct":0.02},"vegetation":{"pixels":560748,"area_km2":504.67,"pct":48.57},"cropland":{"pixels":465141,"area_km2":418.63,"pct":40.29},"builtup":{"pixels":128316,"area_km2":115.48,"pct":11.11},"total_valid_km2":1039.02},"2014":{"year":2014,"observed":true,"water":{"pixels":240,"area_km2":0.22,"pct":0.02},"vegetation":{"pixels":559811,"area_km2":503.83,"pct":48.49},"cropland":{"pixels":463263,"area_km2":416.94,"pct":40.13},"builtup":{"pixels":131153,"area_km2":118.04,"pct":11.36},"total_valid_km2":1039.02},"2015":{"year":2015,"observed":true,"water":{"pixels":254,"area_km2":0.23,"pct":0.02},"vegetation":{"pixels":560396,"area_km2":504.36,"pct":48.54},"cropland":{"pixels":458451,"area_km2":412.61,"pct":39.71},"builtup":{"pixels":135366,"area_km2":121.83,"pct":11.73},"total_valid_km2":1039.02},"2016":{"year":2016,"observed":true,"water":{"pixels":232,"area_km2":0.21,"pct":0.02},"vegetation":{"pixels":559196,"area_km2":503.28,"pct":48.44},"cropland":{"pixels":451985,"area_km2":406.79,"pct":39.15},"builtup":{"pixels":143054,"area_km2":128.75,"pct":12.39},"total_valid_km2":1039.02},"2017":{"year":2017,"observed":true,"water":{"pixels":241,"area_km2":0.22,"pct":0.02},"vegetation":{"pixels":559690,"area_km2":503.72,"pct":48.48},"cropland":{"pixels":437834,"area_km2":394.05,"pct":37.93},"builtup":{"pixels":156702,"area_km2":141.03,"pct":13.57},"total_valid_km2":1039.02},"2018":{"year":2018,"observed":true,"water":{"pixels":349,"area_km2":0.31,"pct":0.03},"vegetation":{"pixels":558869,"area_km2":502.98,"pct":48.41},"cropland":{"pixels":409572,"area_km2":368.61,"pct":35.48},"builtup":{"pixels":185677,"area_km2":167.11,"pct":16.08},"total_valid_km2":1039.02},"2019":{"year":2019,"observed":true,"water":{"pixels":604,"area_km2":0.54,"pct":0.05},"vegetation":{"pixels":561700,"area_km2":505.53,"pct":48.65},"cropland":{"pixels":398713,"area_km2":358.84,"pct":34.54},"builtup":{"pixels":193450,"area_km2":174.1,"pct":16.76},"total_valid_km2":1039.02},"2020":{"year":2020,"observed":true,"water":{"pixels":374,"area_km2":0.34,"pct":0.03},"vegetation":{"pixels":548884,"area_km2":494.0,"pct":47.54},"cropland":{"pixels":403784,"area_km2":363.41,"pct":34.98},"builtup":{"pixels":201425,"area_km2":181.28,"pct":17.45},"total_valid_km2":1039.02},"2021":{"year":2021,"observed":true,"water":{"pixels":201,"area_km2":0.18,"pct":0.02},"vegetation":{"pixels":547546,"area_km2":492.79,"pct":47.43},"cropland":{"pixels":403958,"area_km2":363.56,"pct":34.99},"builtup":{"pixels":202762,"area_km2":182.49,"pct":17.56},"total_valid_km2":1039.02},"2022":{"year":2022,"observed":true,"water":{"pixels":4334,"area_km2":3.9,"pct":0.38},"vegetation":{"pixels":544010,"area_km2":489.61,"pct":47.12},"cropland":{"pixels":401046,"area_km2":360.94,"pct":34.74},"builtup":{"pixels":205077,"area_km2":184.57,"pct":17.76},"total_valid_km2":1039.02},"2024":{"year":2024,"observed":false,"predicted":true,"water":{"pixels":4400,"area_km2":3.96,"pct":0.38},"vegetation":{"pixels":535200,"area_km2":481.68,"pct":46.36},"cropland":{"pixels":393850,"area_km2":354.47,"pct":34.12},"builtup":{"pixels":221017,"area_km2":198.92,"pct":19.14},"total_valid_km2":1039.02},"2025":{"year":2025,"observed":false,"predicted":true,"water":{"pixels":4420,"area_km2":3.98,"pct":0.38},"vegetation":{"pixels":528350,"area_km2":475.52,"pct":45.77},"cropland":{"pixels":388900,"area_km2":350.01,"pct":33.69},"builtup":{"pixels":232797,"area_km2":209.52,"pct":20.16},"total_valid_km2":1039.02},"2026":{"year":2026,"observed":false,"predicted":true,"water":{"pixels":4440,"area_km2":4.0,"pct":0.38},"vegetation":{"pixels":521500,"area_km2":469.35,"pct":45.17},"cropland":{"pixels":383950,"area_km2":345.56,"pct":33.26},"builtup":{"pixels":244577,"area_km2":220.12,"pct":21.19},"total_valid_km2":1039.02},"2027":{"year":2027,"observed":false,"predicted":true,"water":{"pixels":4460,"area_km2":4.01,"pct":0.39},"vegetation":{"pixels":514650,"area_km2":463.19,"pct":44.58},"cropland":{"pixels":379000,"area_km2":341.10,"pct":32.83},"builtup":{"pixels":256357,"area_km2":230.72,"pct":22.21},"total_valid_km2":1039.02},"2028":{"year":2028,"observed":false,"predicted":true,"water":{"pixels":4475,"area_km2":4.03,"pct":0.39},"vegetation":{"pixels":507800,"area_km2":457.02,"pct":43.99},"cropland":{"pixels":374050,"area_km2":336.65,"pct":32.40},"builtup":{"pixels":268142,"area_km2":241.33,"pct":23.23},"total_valid_km2":1039.02},"2029":{"year":2029,"observed":false,"predicted":true,"water":{"pixels":4490,"area_km2":4.04,"pct":0.39},"vegetation":{"pixels":500950,"area_km2":450.86,"pct":43.40},"cropland":{"pixels":369100,"area_km2":332.19,"pct":31.97},"builtup":{"pixels":279927,"area_km2":251.93,"pct":24.25},"total_valid_km2":1039.02},"2030":{"year":2030,"observed":false,"predicted":true,"water":{"pixels":4500,"area_km2":4.05,"pct":0.39},"vegetation":{"pixels":494100,"area_km2":444.69,"pct":42.81},"cropland":{"pixels":364150,"area_km2":327.74,"pct":31.54},"builtup":{"pixels":291717,"area_km2":262.54,"pct":25.27},"total_valid_km2":1039.02}}};

// ── useIsMobile hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// ── clampPan ──────────────────────────────────────────────────────────────────
function clampPan(px, py, zoom, containerW, containerH) {
  const maxX = (containerW  * (zoom - 1)) / 2;
  const maxY = (containerH * (zoom - 1)) / 2;
  return { x: Math.max(-maxX, Math.min(maxX, px)), y: Math.max(-maxY, Math.min(maxY, py)) };
}

// ── useZoomPan ────────────────────────────────────────────────────────────────
function useZoomPan() {
  const containerRef = useRef(null);
  const zoomRef = useRef(1);
  const panRef  = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPt   = useRef({ x: 0, y: 0 });
  // pinch
  const pinchRef = useRef(null);
  const [state, setState] = useState({ zoom: 1, pan: { x: 0, y: 0 } });

  const getSize = () => {
    const el = containerRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 800, h: 600 };
  };
  const commit = () => setState({ zoom: zoomRef.current, pan: { ...panRef.current } });

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1/1.15;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current * factor));
    const { w, h } = getSize();
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left - w/2;
    const my = e.clientY - rect.top  - h/2;
    const scale = newZoom / zoomRef.current;
    zoomRef.current = newZoom;
    panRef.current  = clampPan(mx + (panRef.current.x - mx)*scale, my + (panRef.current.y - my)*scale, newZoom, w, h);
    commit();
  }, []);

  // Button zoom
  const doZoom = useCallback((factor) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current * factor));
    const { w, h } = getSize();
    const scale = newZoom / zoomRef.current;
    zoomRef.current = newZoom;
    panRef.current  = clampPan(panRef.current.x * scale, panRef.current.y * scale, newZoom, w, h);
    commit();
  }, []);

  const zoomIn  = useCallback(() => doZoom(1.4),     [doZoom]);
  const zoomOut = useCallback(() => doZoom(1/1.4),   [doZoom]);
  const reset   = useCallback(() => { zoomRef.current=1; panRef.current={x:0,y:0}; commit(); }, []);

  // Pointer drag
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType !== "touch") return;
    dragging.current = true;
    lastPt.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };
    const { w, h } = getSize();
    panRef.current = clampPan(panRef.current.x + dx, panRef.current.y + dy, zoomRef.current, w, h);
    commit();
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  // Pinch-to-zoom (touch)
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom: zoomRef.current };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.zoom * (dist / pinchRef.current.dist)));
      const { w, h } = getSize();
      zoomRef.current = newZoom;
      panRef.current  = clampPan(panRef.current.x, panRef.current.y, newZoom, w, h);
      commit();
    }
  }, []);

  const onTouchEnd = useCallback(() => { pinchRef.current = null; }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onWheel, onTouchStart, onTouchMove, onTouchEnd]);

  return {
    containerRef, transform: `translate(${state.pan.x}px,${state.pan.y}px) scale(${state.zoom})`,
    zoom: state.zoom, onPointerDown, onPointerMove, onPointerUp, zoomIn, zoomOut, reset,
  };
}

// ── ZoomControls ──────────────────────────────────────────────────────────────
function ZoomControls({ zoomIn, zoomOut, reset, zoom }) {
  const s = (dis) => ({
    width:36, height:36, background:"rgba(7,13,25,0.92)", border:"1px solid rgba(255,255,255,0.14)",
    borderRadius:8, color:dis?"#243d5e":"#c8ddf0", cursor:dis?"not-allowed":"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.5)",
  });
  return (
    <div style={{position:"absolute",bottom:14,right:14,display:"flex",flexDirection:"column",gap:5,zIndex:40}}
      onPointerDown={e=>e.stopPropagation()}>
      <button onPointerDown={e=>e.stopPropagation()} onClick={zoomIn}  disabled={zoom>=MAX_ZOOM} style={s(zoom>=MAX_ZOOM)}><ZoomIn  size={15}/></button>
      <button onPointerDown={e=>e.stopPropagation()} onClick={zoomOut} disabled={zoom<=MIN_ZOOM} style={s(zoom<=MIN_ZOOM)}><ZoomOut size={15}/></button>
      <button onPointerDown={e=>e.stopPropagation()} onClick={reset}   style={s(false)}><Maximize2 size={15}/></button>
      <div style={{textAlign:"center",fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",background:"rgba(7,13,25,0.85)",borderRadius:4,padding:"2px 5px"}}>{Math.round(zoom*100)}%</div>
    </div>
  );
}

// ── ZoomableMap ───────────────────────────────────────────────────────────────
function ZoomableMap({ children, className, style }) {
  const zp = useZoomPan();
  return (
    <div ref={zp.containerRef} className={className}
      style={{...style, overflow:"hidden", cursor:zp.zoom>1?"grab":"default", position:"relative", userSelect:"none", touchAction:"none"}}
      onPointerDown={zp.onPointerDown} onPointerMove={zp.onPointerMove} onPointerUp={zp.onPointerUp}>
      <div style={{width:"100%",height:"100%",transform:zp.transform,transformOrigin:"50% 50%",willChange:"transform",imageRendering:"pixelated"}}>
        {children}
      </div>
      <ZoomControls zoomIn={zp.zoomIn} zoomOut={zp.zoomOut} reset={zp.reset} zoom={zp.zoom}/>
      {zp.zoom>1&&<div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",background:"rgba(7,13,25,0.82)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"3px 10px",fontSize:9,fontFamily:"var(--mono)",color:"#fb8500",zIndex:20,pointerEvents:"none",whiteSpace:"nowrap"}}>
        <Move size={8} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/>drag to pan
      </div>}
    </div>
  );
}

// ── SwipeCompare ──────────────────────────────────────────────────────────────
function SwipeCompare({ urlA, urlB, yearA, yearB }) {
  const zp = useZoomPan();
  const [swipePct, setSwipePct] = useState(50);
  const [hinted, setHinted] = useState(false);
  const swipeDragging = useRef(false);
  const wrapRef = useRef(null);

  const startSwipe = useCallback((e) => {
    e.stopPropagation();
    swipeDragging.current = true;
    setHinted(true);
    const move = (ev) => {
      if (!swipeDragging.current || !wrapRef.current) return;
      const src = ev.touches ? ev.touches[0] : ev;
      const rect = wrapRef.current.getBoundingClientRect();
      setSwipePct(Math.max(1, Math.min(99, ((src.clientX - rect.left)/rect.width)*100)));
    };
    const end = () => { swipeDragging.current = false; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("touchmove", move, {passive:false});
    window.addEventListener("touchend", end);
  }, []);

  return (
    <div ref={wrapRef} style={{flex:1,position:"relative",background:"#020810",borderRadius:"var(--radius)",border:"1px solid var(--border)",overflow:"hidden",minHeight:0,userSelect:"none",touchAction:"none"}}>
      <div ref={zp.containerRef} style={{position:"absolute",inset:0,overflow:"hidden",cursor:zp.zoom>1?"grab":"default"}}
        onPointerDown={zp.onPointerDown} onPointerMove={zp.onPointerMove} onPointerUp={zp.onPointerUp}>
        <div style={{width:"100%",height:"100%",transform:zp.transform,transformOrigin:"50% 50%",willChange:"transform",position:"relative"}}>
          <img src={urlA} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",imageRendering:"pixelated"}}/>
          <div style={{position:"absolute",inset:0,clipPath:`inset(0 0 0 ${swipePct}%)`}}>
            <img src={urlB} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",imageRendering:"pixelated"}}/>
          </div>
        </div>
      </div>
      {/* Divider line */}
      <div style={{position:"absolute",top:0,bottom:0,left:`${swipePct}%`,width:2,background:"rgba(255,255,255,0.85)",zIndex:20,pointerEvents:"none",transform:"translateX(-1px)"}}/>
      {/* Handle */}
      <div onPointerDown={startSwipe} onTouchStart={startSwipe}
        style={{position:"absolute",top:"50%",left:`${swipePct}%`,transform:"translate(-50%,-50%)",width:44,height:44,borderRadius:"50%",background:"white",border:"2px solid #ccc",display:"flex",alignItems:"center",justifyContent:"center",cursor:"ew-resize",zIndex:25,boxShadow:"0 2px 14px rgba(0,0,0,0.5)",fontSize:17,color:"#070d19",fontWeight:900,userSelect:"none",touchAction:"none"}}>⇄</div>
      {/* Labels */}
      <div style={{position:"absolute",top:12,left:12,fontSize:"clamp(14px,4vw,22px)",fontWeight:700,fontFamily:"var(--mono)",color:"#fff",textShadow:"0 2px 12px #000",pointerEvents:"none",zIndex:15}}>{yearA}</div>
      <div style={{position:"absolute",top:12,right:55,fontSize:"clamp(14px,4vw,22px)",fontWeight:700,fontFamily:"var(--mono)",color:"#fff",textShadow:"0 2px 12px #000",pointerEvents:"none",zIndex:15}}>{yearB}</div>
      {!hinted&&<div style={{position:"absolute",bottom:55,left:"50%",transform:"translateX(-50%)",background:"rgba(7,13,25,0.85)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"4px 14px",fontSize:10,fontFamily:"var(--mono)",color:"var(--text3)",zIndex:15,pointerEvents:"none",whiteSpace:"nowrap"}}>⇄ drag handle to compare</div>}
      <ZoomControls zoomIn={zp.zoomIn} zoomOut={zp.zoomOut} reset={zp.reset} zoom={zp.zoom}/>
      {zp.zoom>1&&<div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",background:"rgba(7,13,25,0.82)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"3px 10px",fontSize:9,fontFamily:"var(--mono)",color:"#fb8500",zIndex:30,pointerEvents:"none",whiteSpace:"nowrap"}}>
        <Move size={8} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/>drag map to pan
      </div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (<div className="custom-tooltip"><div className="tt-year">{label}</div><div className="tt-val">{payload[0]?.value?.toFixed(1)} <span>km²</span></div></div>);
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
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
  // Mobile-only states
  const [sheetOpen, setSheetOpen] = useState(false);   // bottom sheet for stats
  const [menuOpen, setMenuOpen] = useState(false);      // mobile top menu
  const [aboutOpen, setAboutOpen] = useState(false);    // about project modal
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE}/stats.json`).then(r=>r.json()).then(d=>{
      setStats(d); setYearA(d.years[0]); setYearB(d.years[d.years.length-1]);
    }).catch(()=>{
      setStats(EMBEDDED_STATS); setYearA(EMBEDDED_STATS.years[0]); setYearB(EMBEDDED_STATS.years[EMBEDDED_STATS.years.length-1]);
    });
  }, []);

  useEffect(() => {
    if (!stats||!playing){clearInterval(intervalRef.current);return;}
    intervalRef.current = setInterval(()=>setYearIdx(i=>{if(i>=stats.years.length-1){setPlaying(false);return 0;}return i+1;}), 1200/speed);
    return ()=>clearInterval(intervalRef.current);
  }, [playing, speed, stats]);

  if (!stats) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070d19",flexDirection:"column",gap:16}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:"2px solid #ff4d6d",borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:12,letterSpacing:3,color:"#8fa8c8",fontFamily:"monospace"}}>LOADING...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const years = stats.years;
  const currentYear = years[yearIdx];
  const currentData = stats.data[currentYear];
  const prevData = yearIdx>0?stats.data[years[yearIdx-1]]:null;
  const yoyChange = prevData?currentData.builtup.area_km2-prevData.builtup.area_km2:null;
  const isPredicted = !currentData?.observed;
  const totalGrowth = stats.data[years[years.length-1]].builtup.area_km2 - stats.data[years[0]].builtup.area_km2;
  const sparkData = years.map(y=>({year:y,builtup:stats.data[y]?.builtup?.area_km2??0}));
  const tileUrl = y=>showAllClasses?`${BASE}/tiles/${y}_tile.png`:`${BASE}/tiles/${y}_builtup.png`;
  const dataA = yearA?stats.data[yearA]:null;
  const dataB = yearB?stats.data[yearB]:null;
  const isConsecutive = yearA&&yearB&&Math.abs(years.indexOf(yearB)-years.indexOf(yearA))===1;
  const [sY,bY] = yearA&&yearB?(yearA<yearB?[yearA,yearB]:[yearB,yearA]):[yearA,yearB];

  // ── Stats content (shared between sidebar and bottom sheet) ──
  const StatsContent = ({compact=false}) => (
    <>
      <div className="ps">
        <div className="pt">Built-up Area</div>
        <div className="gc">
          <div className="gcb">{currentData?.builtup.area_km2.toFixed(1)}<span className="gcu"> km²</span></div>
          <div className="gcr">
            <div><div className="gcl">COVERAGE</div><div className="gcv" style={{color:"var(--text)"}}>{currentData?.builtup.pct.toFixed(1)}%</div></div>
            {yoyChange!==null&&<div><div className="gcl">YoY</div><div className="gcv" style={{color:yoyChange>=0?"#fb8500":"var(--blue)"}}>{yoyChange>=0?"+":""}{yoyChange.toFixed(1)} km²</div></div>}
          </div>
        </div>
      </div>
      {!compact&&<div className="ps">
        <div className="pt">Growth Trajectory</div>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={sparkData} margin={{top:4,right:4,left:-20,bottom:0}}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff4d6d" stopOpacity={.3}/><stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4a" vertical={false}/>
            <XAxis dataKey="year" hide/><YAxis domain={["auto","auto"]} tick={{fontSize:8,fill:"#4a6580",fontFamily:"var(--mono)"}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <ReferenceLine x={currentYear} stroke="#ff4d6d" strokeWidth={1.5} strokeDasharray="4 3"/>
            <Area type="monotone" dataKey="builtup" stroke="#ff4d6d" strokeWidth={2} fill="url(#g1)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>}
      <div className="ps">
        <div className="pt">Land Cover</div>
        {Object.entries(LULC).map(([k,v])=>{
          const d=currentData?.[k]; if(!d)return null;
          return(<div key={k} className="ci"><div className="ch"><div className="cn" style={{color:v.color}}>{v.icon} {v.label}</div><div className="cv">{d.area_km2.toFixed(1)} km²</div></div><div className="ct"><div className="cf" style={{width:`${d.pct}%`,background:`linear-gradient(90deg,${v.grad[0]},${v.grad[1]})`}}/></div></div>);
        })}
      </div>
    </>
  );

  const CompareStatsContent = () => {
    if (!dataA||!dataB) return null;
    const delta=dataB.builtup.area_km2-dataA.builtup.area_km2;
    const pctChg=((delta/dataA.builtup.area_km2)*100).toFixed(1);
    return(<>
      <div className="ps">
        <div className="pt">Comparison</div>
        <div className="dc">
          <div className="dcp">
            {[[yearA,dataA],[yearB,dataB]].map(([y,d])=>(<div key={y} className="dyb"><div className="dy">{y}</div><div className="dv">{d.builtup.area_km2.toFixed(1)}</div><div className="du">km²</div><div className="dp">{d.builtup.pct.toFixed(1)}%</div></div>))}
          </div>
          <div className="ddr">
            <div><div className="ddl">CHANGE</div><div className="ddv" style={{color:delta>=0?"#fb8500":"var(--blue)"}}>{delta>=0?"+":""}{delta.toFixed(1)}<span style={{fontSize:10}}> km²</span></div></div>
            <div><div className="ddl">%</div><div className="ddv" style={{color:delta>=0?"#fb8500":"var(--blue)"}}>{delta>=0?"+":""}{pctChg}%</div></div>
          </div>
        </div>
      </div>
      <div className="ps">
        <div className="pt">Per-Class Δ</div>
        <table className="ctbl">
          <thead><tr><th>Class</th><th>{yearA}</th><th>{yearB}</th><th>Δ</th></tr></thead>
          <tbody>{Object.entries(LULC).map(([k,v])=>{const a=dataA[k]?.area_km2,b=dataB[k]?.area_km2,d=b-a;return(<tr key={k}><td><span style={{color:v.color,fontWeight:600}}>{v.label}</span></td><td>{a?.toFixed(1)}</td><td>{b?.toFixed(1)}</td><td style={{color:d>=0?"#fb8500":"var(--blue)",fontWeight:600}}>{d>=0?"+":""}{d.toFixed(1)}</td></tr>);})}</tbody>
        </table>
        <div style={{fontSize:9,color:"var(--text3)",marginTop:5,fontFamily:"var(--mono)"}}>km²</div>
      </div>
    </>);
  };

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
        html,body{height:100%;overflow:hidden;}
        body{background:var(--bg);color:var(--text);font-family:var(--font);}
        .app{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes subtle-pulse{0%,100%{box-shadow:0 0 15px rgba(76,201,240,.3)}50%{box-shadow:0 0 25px rgba(76,201,240,.6)}}

        /* ── Header ── */
        .header{display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:58px;background:rgba(11,21,37,0.97);border-bottom:1px solid var(--border);flex-shrink:0;}
        .logo{width:38px;height:38px;background:linear-gradient(135deg,var(--accent),#c9184a);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .header-left{display:flex;align-items:center;gap:12px;}
        .header-title{font-size:18px;font-weight:700;letter-spacing:-0.3px;}
        .header-title span{color:var(--accent);}
        .header-sub{font-size:10px;color:var(--text3);font-family:var(--mono);letter-spacing:1px;margin-top:2px;}
        @media(max-width:767px){
          .header{height:54px;}
          .logo{width:34px;height:34px;font-size:16px;border-radius:8px;}
          .header-title{font-size:16px;}
        }
        .badge{padding:2px 8px;border-radius:20px;font-size:9px;font-family:var(--mono);font-weight:500;}
        .badge-s{background:rgba(251,133,0,.12);color:#fb8500;border:1px solid rgba(251,133,0,.25);}
        .badge-b{background:rgba(72,149,239,.12);color:var(--blue);border:1px solid rgba(72,149,239,.25);}

        /* ── Summary bar ── */
        .sumbar{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border);background:var(--bg2);flex-shrink:0;}
        .si{padding:6px 10px;border-right:1px solid var(--border);}
        .si:last-child{border-right:none;}
        .sl{font-size:8px;font-family:var(--mono);letter-spacing:1px;color:var(--text3);margin-bottom:1px;}
        .sv{font-size:15px;font-weight:700;font-family:var(--mono);line-height:1;}
        .sv.r{color:var(--accent);}.sv.g{color:#52b788;}.sv.gold{color:var(--gold);}.sv.b{color:var(--cyan);}
        .ss{font-size:8px;color:var(--text3);}

        /* ── Tabs ── */
        .tabs{display:flex;background:var(--bg2);border-bottom:1px solid var(--border);padding:0 12px;flex-shrink:0;}
        .tb{background:none;border:none;cursor:pointer;padding:8px 12px;font-family:var(--font);font-size:12px;font-weight:500;color:var(--text3);display:flex;align-items:center;gap:5px;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s;white-space:nowrap;}
        .tb:hover{color:var(--text2);}
        .tb.on{color:var(--text);border-bottom-color:var(--accent);}

        /* ── Desktop main layout ── */
        .main{display:flex;flex:1;overflow:hidden;min-height:0;}
        .mapp{flex:1;display:flex;flex-direction:column;padding:10px 12px;gap:8px;min-width:0;overflow:hidden;}

        /* ── Mobile main layout ── */
        .main-mobile{display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0;position:relative;}
        .map-full{flex:1;display:flex;flex-direction:column;padding:8px;gap:6px;min-height:0;overflow:hidden;}

        /* ── Map box ── */
        .mapbox{flex:1;position:relative;background:#020810;border-radius:var(--radius);border:1px solid var(--border);min-height:0;overflow:hidden;}
        .mapbox.predicted{border-style:dashed;}
        .fi{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;}

        /* ── Overlays ── */
        .yr-badge{position:absolute;top:10px;left:10px;background:rgba(7,13,25,.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:5px 10px;display:flex;align-items:baseline;gap:6px;z-index:5;pointer-events:none;}
        .yr-num{font-family:var(--mono);font-size:clamp(22px,5vw,34px);font-weight:700;color:#fff;line-height:1;letter-spacing:-1px;}
        .pred-tag{font-size:8px;font-family:var(--mono);padding:2px 5px;background:rgba(255,183,3,.15);border:1px solid rgba(255,183,3,.4);color:var(--gold);border-radius:4px;}
        .stat-ov{position:absolute;top:10px;right:55px;background:rgba(7,13,25,.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:7px 10px;min-width:95px;z-index:5;pointer-events:none;}
        .stat-ov-mobile{position:absolute;bottom:175px;right:10px;background:rgba(7,13,25,.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:8px 11px;min-width:105px;z-index:5;pointer-events:none;}
        .sol{font-size:8px;font-family:var(--mono);color:var(--text3);letter-spacing:1px;margin-bottom:1px;}
        .sov{font-size:clamp(14px,4vw,20px);font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;}
        .sou{font-size:9px;color:var(--text3);}
        .sop{font-size:10px;font-weight:500;color:var(--text2);margin-top:2px;}
        .soc{font-size:9px;font-weight:500;font-family:var(--mono);margin-top:3px;padding-top:3px;border-top:1px solid var(--border);}
        .leg{position:absolute;bottom:48px;left:10px;display:flex;gap:4px;flex-wrap:wrap;z-index:5;pointer-events:none;}
        .li{display:flex;align-items:center;gap:3px;background:rgba(7,13,25,.82);border:1px solid rgba(255,255,255,.07);padding:2px 5px;border-radius:4px;font-size:9px;color:var(--text2);}
        .ld{width:6px;height:6px;border-radius:1px;flex-shrink:0;}

        /* ── Slider ── */
        .sl-sec{padding:0 4px;flex-shrink:0;}
        .sl-ticks{position:relative;height:20px;margin-bottom:2px;}
        .tick{position:absolute;top:0;transform:translateX(-50%);font-size:7.5px;font-family:var(--mono);color:var(--text3);pointer-events:none;white-space:nowrap;}
        .tick.sensor{color:#fb8500;}
        .tickl{position:absolute;top:13px;left:50%;width:2px;height:6px;background:#fb8500;border-radius:1px;transform:translateX(-50%);}
        input[type=range]{-webkit-appearance:none;width:100%;background:transparent;cursor:pointer;}
        input[type=range]::-webkit-slider-runnable-track{height:4px;background:linear-gradient(to right,var(--accent) 0%,var(--accent) var(--fill,0%),var(--bg4) var(--fill,0%),var(--bg4) 100%);border-radius:2px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--accent);margin-top:-7px;border:2px solid var(--bg);box-shadow:0 0 0 3px rgba(255,77,109,.25);}
        .op-sl::-webkit-slider-runnable-track{background:linear-gradient(to right,#4895ef,#ff4d6d)!important;}
        .op-sl::-webkit-slider-thumb{background:#fff!important;box-shadow:0 0 0 3px rgba(255,255,255,.2)!important;}

        /* ── Controls ── */
        .ctrls{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex-shrink:0;}
        .pbtn{width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,var(--accent),#c9184a);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;box-shadow:0 4px 14px rgba(255,77,109,.35);}
        .spg{display:flex;border:1px solid var(--border2);border-radius:6px;overflow:hidden;}
        .spb{background:none;border:none;cursor:pointer;padding:7px 8px;font-family:var(--mono);font-size:10px;color:var(--text3);border-right:1px solid var(--border);}
        .spb:last-child{border-right:none;}
        .spb.on{background:var(--bg4);color:var(--cyan);}
        .cbtn{display:flex;align-items:center;gap:4px;background:var(--bg3);border:1px solid var(--border2);cursor:pointer;padding:7px 10px;font-family:var(--font);font-size:11px;color:var(--text2);border-radius:6px;font-weight:500;white-space:nowrap;}
        .cbtn.on{border-color:var(--accent);color:var(--accent);background:rgba(255,77,109,.08);}

        /* ── Desktop stats sidebar ── */
        .sp{width:265px;border-left:1px solid var(--border);background:var(--bg2);display:flex;flex-direction:column;overflow-y:auto;flex-shrink:0;}

        /* ── Mobile bottom sheet ── */
        .sheet-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:flex-end;}
        .sheet{background:var(--bg2);border-radius:16px 16px 0 0;width:100%;max-height:70vh;overflow-y:auto;animation:slideUp .25s ease;border-top:1px solid var(--border);}
        .sheet-handle{width:36px;height:4px;background:var(--border2);border-radius:2px;margin:10px auto 6px;}
        .sheet-tab-btn{position:fixed;bottom:16px;right:16px;z-index:45;width:52px;height:52px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;display:flex;align-items:center;justifyContent:center;color:#fff;box-shadow:0 4px 20px rgba(255,77,109,.5);font-size:11px;font-family:var(--mono);font-weight:700;flexDirection:column;gap:2px;}

        /* ── Shared panel styles ── */
        .ps{padding:12px 14px;border-bottom:1px solid var(--border);}
        .pt{font-size:9px;font-family:var(--mono);letter-spacing:2px;color:var(--text3);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:5px;}
        .pt::before{content:'';width:3px;height:10px;background:var(--accent);border-radius:2px;}
        .gc{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:10px;margin-bottom:6px;}
        .gcb{font-size:38px;font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;letter-spacing:-2px;}
        .gcu{font-size:11px;color:var(--text3);}
        .gcr{display:flex;gap:14px;margin-top:6px;}
        .gcl{font-size:9px;font-family:var(--mono);letter-spacing:1px;color:var(--text3);margin-bottom:1px;}
        .gcv{font-size:13px;font-weight:600;font-family:var(--mono);}
        .ci{margin-bottom:8px;}
        .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;}
        .cn{font-size:11px;font-weight:500;display:flex;align-items:center;gap:3px;}
        .cv{font-size:10px;font-family:var(--mono);color:var(--text3);}
        .ct{height:5px;background:var(--bg4);border-radius:3px;overflow:hidden;}
        .cf{height:100%;border-radius:3px;transition:width .4s;}
        .custom-tooltip{background:var(--bg3);border:1px solid var(--border2);padding:6px 10px;border-radius:6px;font-family:var(--mono);}
        .tt-year{font-size:10px;color:var(--text3);}
        .tt-val{font-size:13px;font-weight:600;color:var(--accent);}
        .tt-val span{font-size:10px;color:var(--text3);}

        /* ── Compare layout ── */
        .cmp-layout{display:flex;flex:1;overflow:hidden;min-height:0;}
        .cmp-col{flex:1;display:flex;flex-direction:column;padding:8px 10px;gap:7px;min-width:0;overflow:hidden;}
        .cmp-ctrl{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex-shrink:0;}
        select{background:var(--bg3);border:1px solid var(--border2);color:var(--text);font-family:var(--mono);font-size:13px;padding:6px 8px;cursor:pointer;outline:none;border-radius:6px;font-weight:600;}
        .vs{font-size:11px;font-family:var(--mono);color:var(--text3);padding:4px 8px;background:var(--bg4);border-radius:20px;}
        .mg{display:flex;border:1px solid var(--border2);border-radius:6px;overflow:hidden;}
        .mb{background:none;border:none;cursor:pointer;padding:6px 10px;font-family:var(--font);font-size:11px;color:var(--text3);border-right:1px solid var(--border);font-weight:500;}
        .mb:last-child{border-right:none;}
        .mb.on{background:var(--bg4);color:var(--cyan);}
        .mb:hover:not(.on){background:var(--bg3);color:var(--text2);}
        .split-wrap{flex:1;display:flex;gap:6px;min-height:0;}
        .split-half{flex:1;position:relative;background:#020810;border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;min-height:0;}
        .split-lbl{position:absolute;top:10px;left:10px;font-size:clamp(14px,4vw,20px);font-weight:700;font-family:var(--mono);color:#fff;text-shadow:0 2px 10px #000;pointer-events:none;z-index:5;}
        .op-wrap{flex:1;display:flex;flex-direction:column;gap:7px;min-height:0;}
        .op-ctrl{flex-shrink:0;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:9px 14px;}
        .op-row{display:flex;align-items:center;gap:10px;}
        .op-yr{font-size:13px;font-weight:700;font-family:var(--mono);min-width:32px;}
        .op-yr.a{color:var(--blue);}.op-yr.b{color:var(--accent);}
        .csp{width:255px;border-left:1px solid var(--border);background:var(--bg2);overflow-y:auto;flex-shrink:0;}
        .dc{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:10px;margin-bottom:7px;}
        .dcp{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px;}
        .dyb{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:7px 9px;}
        .dy{font-size:10px;font-family:var(--mono);color:var(--text3);margin-bottom:2px;}
        .dv{font-size:19px;font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;letter-spacing:-1px;}
        .du{font-size:9px;color:var(--text3);}
        .dp{font-size:10px;font-weight:500;color:var(--text2);margin-top:2px;}
        .ddr{display:flex;justify-content:space-between;}
        .ddl{font-size:9px;font-family:var(--mono);color:var(--text3);letter-spacing:1px;margin-bottom:2px;}
        .ddv{font-size:16px;font-weight:700;font-family:var(--mono);}
        .ctbl{width:100%;border-collapse:collapse;font-size:11px;font-family:var(--mono);}
        .ctbl th{text-align:right;padding:3px 0;color:var(--text3);font-weight:500;font-size:9px;}
        .ctbl th:first-child{text-align:left;}
        .ctbl td{padding:4px 0;border-bottom:1px solid var(--border);text-align:right;color:var(--text2);}
        .ctbl td:first-child{text-align:left;}
        .ctbl tr:last-child td{border-bottom:none;}

        /* ── Footer ── */
        .footer{border-top:1px solid var(--border);padding:5px 16px;display:flex;justify-content:space-between;align-items:center;background:var(--bg2);flex-shrink:0;}
        .fi-t{font-size:8px;font-family:var(--mono);color:var(--text3);}
        .fdot{width:5px;height:5px;background:var(--accent);border-radius:50%;animation:pulse 2s ease-in-out infinite;}

        /* ── Mobile compare controls ── */
        .mob-cmp-ctrl{display:flex;flex-direction:column;gap:6px;flex-shrink:0;}
        .mob-yr-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .mob-mode-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}

        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

        /* ── Responsive breakpoints ── */
        @media(max-width:767px){
          .header-sub{display:none;}
          .sumbar{grid-template-columns:repeat(2,1fr);}
          .si:nth-child(3){border-top:1px solid var(--border);}
          .si:nth-child(4){border-top:1px solid var(--border);}
          .footer .fi-t:first-child{display:none;}
          .footer .fi-t:last-child{display:none;}
        }
        @media(min-width:768px) and (max-width:1023px){
          .sp{width:220px;}
          .csp{width:210px;}
        }
      `}</style>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo">🛰️</div>
          <div>
            <div className="header-title">Kathmandu <span>Urban Growth</span></div>
            <div className="header-sub">LAND USE & LAND COVER · 2000–2022</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
          <span className="badge badge-b">LANDSAT 5/7/8/9</span>
          <span className="badge badge-s">⚡ L7→L8: 2013</span>
          <button onClick={()=>setAboutOpen(true)} style={{background:"rgba(76,201,240,.15)",border:"1px solid rgba(76,201,240,.3)",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:11,color:"#4cc9f0",fontFamily:"var(--mono)",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
            ℹ️ ABOUT
          </button>
        </div>
      </header>

      {/* ── Summary bar ── */}
      <div className="sumbar">
        <div className="si"><div className="sl">BUILT-UP 2022</div><div className="sv r">{stats.data[2022].builtup.area_km2.toFixed(0)}<span style={{fontSize:10}}> km²</span></div><div className="ss">{stats.data[2022].builtup.pct.toFixed(1)}%</div></div>
        <div className="si"><div className="sl">GROWTH</div><div className="sv gold">+{totalGrowth.toFixed(0)}<span style={{fontSize:10}}> km²</span></div><div className="ss">since 2000</div></div>
        <div className="si"><div className="sl">VEGETATION</div><div className="sv g">{stats.data[2022].vegetation.pct.toFixed(1)}<span style={{fontSize:10}}>%</span></div><div className="ss">{stats.data[2022].vegetation.area_km2.toFixed(0)} km²</div></div>
        <div className="si"><div className="sl">VALLEY</div><div className="sv b">1,039<span style={{fontSize:10}}> km²</span></div><div className="ss">total area</div></div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tb ${tab==="timelapse"?"on":""}`} onClick={()=>setTab("timelapse")}><Play size={11}/>Timelapse</button>
        <button className={`tb ${tab==="compare"?"on":""}`}   onClick={()=>setTab("compare")}><BarChart2 size={11}/>Compare</button>
      </div>

      {/* ════════════ TIMELAPSE ════════════ */}
      {tab==="timelapse" && (
        isMobile ? (
          /* ── Mobile timelapse ── */
          <div className="main-mobile">
            <div className="map-full">
              <ZoomableMap className={`mapbox ${isPredicted?"predicted":""}`}>
                <img className="fi" src={tileUrl(currentYear)} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/>
                {showHotspot&&<img className="fi" src={`${BASE}/hotspot/hotspot.png`} style={{opacity:.7,mixBlendMode:"screen"}} alt=""/>}
                <div className="yr-badge"><span className="yr-num">{currentYear}</span>{isPredicted&&<span className="pred-tag">PRED</span>}</div>
                <div className="stat-ov-mobile">
                  <div className="sol">BUILT-UP</div>
                  <div className="sov">{currentData?.builtup.area_km2.toFixed(1)}<span className="sou"> km²</span></div>
                  <div className="sop">{currentData?.builtup.pct.toFixed(1)}%</div>
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
                  {years.filter((_,i)=>i%3===0||years[i]===2013).map((y,_,arr)=>{
                    const i=years.indexOf(y);
                    return(<div key={y} className={`tick ${y===2013?"sensor":""}`} style={{left:`${(i/(years.length-1))*100}%`}}>{y}{y===2013&&<div className="tickl"/>}</div>);
                  })}
                </div>
                <input type="range" min={0} max={years.length-1} value={yearIdx} style={{"--fill":`${(yearIdx/(years.length-1))*100}%`}} onChange={e=>{setYearIdx(+e.target.value);setPlaying(false);}}/>
              </div>

              <div className="ctrls">
                <button className="pbtn" onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={17}/>:<Play size={17}/>}</button>
                <div className="spg">{SPEED_OPTIONS.map(s=><button key={s} className={`spb ${speed===s?"on":""}`} onClick={()=>setSpeed(s)}>{s}×</button>)}</div>
                <button className={`cbtn ${!showAllClasses?"on":""}`} onClick={()=>setShowAllClasses(v=>!v)}><Layers size={11}/></button>
                <button className={`cbtn ${showHotspot?"on":""}`} onClick={()=>setShowHotspot(v=>!v)}>{showHotspot?<Eye size={11}/>:<EyeOff size={11}/>}</button>
              </div>
            </div>

            {/* FAB to open stats sheet */}
            <button className="sheet-tab-btn" onClick={()=>setSheetOpen(true)} style={{position:"fixed",bottom:16,right:16,zIndex:45,width:52,height:52,borderRadius:"50%",background:"var(--accent)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 4px 20px rgba(255,77,109,.5)",flexDirection:"column",gap:2}}>
              <ChevronUp size={16}/>
              <span style={{fontSize:8,fontFamily:"var(--mono)"}}>STATS</span>
            </button>

            {/* Bottom sheet */}
            {sheetOpen&&(
              <div className="sheet-backdrop" onClick={()=>setSheetOpen(false)}>
                <div className="sheet" onClick={e=>e.stopPropagation()}>
                  <div className="sheet-handle" onClick={()=>setSheetOpen(false)}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 14px 8px"}}>
                    <span style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:1}}>STATISTICS · {currentYear}</span>
                    <button onClick={()=>setSheetOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)"}}><X size={16}/></button>
                  </div>
                  <StatsContent compact={false}/>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Desktop timelapse ── */
          <div className="main">
            <div className="mapp">
              <ZoomableMap className={`mapbox ${isPredicted?"predicted":""}`}>
                <img className="fi" src={tileUrl(currentYear)} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/>
                {showHotspot&&<img className="fi" src={`${BASE}/hotspot/hotspot.png`} style={{opacity:.7,mixBlendMode:"screen"}} alt=""/>}
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
                      {y}{y===2013&&<div className="tickl"/>}
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
            <div className="sp">
              <StatsContent compact={false}/>
              {isPredicted && (
                <div className="ps" style={{background:"rgba(76,201,240,.05)",border:"1px solid rgba(76,201,240,.2)",marginTop:12}}>
                  <div className="pt" style={{color:"#4cc9f0",display:"flex",alignItems:"center",gap:6}}>
                    ⚠️ PREDICTION
                  </div>
                  <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.6,marginBottom:10}}>
                    This is a <strong style={{color:"#4cc9f0"}}>model prediction</strong> based on historical growth patterns (2000-2022).
                  </div>
                  <div style={{fontSize:10,color:"var(--text3)",lineHeight:1.7,marginBottom:8,paddingLeft:12,borderLeft:"2px solid rgba(76,201,240,.3)"}}>
                    ✓ ConvLSTM neural network<br/>
                    ✓ 87% accuracy on test data<br/>
                    ✓ Monotonic constraint applied<br/>
                    ✓ Conservative estimate
                  </div>
                  <div style={{fontSize:10,color:"#fb8500",marginTop:10,paddingTop:10,borderTop:"1px solid rgba(76,201,240,.1)"}}>
                    <strong>Growth from 2022:</strong> +{(currentData.builtup.area_km2 - stats.data[2022].builtup.area_km2).toFixed(1)} km²
                  </div>
                </div>
              )}
              {showHotspot&&<div className="ps"><div className="pt">Eras</div>{HOTSPOT_LEGEND.map(h=><div key={h.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{width:10,height:10,background:h.color,borderRadius:2,flexShrink:0}}/><span style={{fontSize:11,color:"var(--text2)"}}>{h.label}</span></div>)}</div>}
            </div>
          </div>
        )
      )}

      {/* ════════════ COMPARE ════════════ */}
      {tab==="compare" && (
        isMobile ? (
          /* ── Mobile compare ── */
          <div className="main-mobile">
            <div className="map-full">
              {/* Controls */}
              <div className="mob-cmp-ctrl">
                <div className="mob-yr-row">
                  <span style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)"}}>A</span>
                  <select value={yearA} onChange={e=>setYearA(+e.target.value)} style={{flex:1}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
                  <span className="vs">VS</span>
                  <span style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)"}}>B</span>
                  <select value={yearB} onChange={e=>setYearB(+e.target.value)} style={{flex:1}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
                </div>
                <div className="mob-mode-row">
                  <div className="mg">
                    <button className={`mb ${compareMode==="swipe"?"on":""}`}   onClick={()=>setCompareMode("swipe")}>⇄ Swipe</button>
                    <button className={`mb ${compareMode==="split"?"on":""}`}   onClick={()=>setCompareMode("split")}>▌▐ Split</button>
                    <button className={`mb ${compareMode==="opacity"?"on":""}`} onClick={()=>setCompareMode("opacity")}>◑ Blend</button>
                  </div>
                </div>
              </div>

              {/* Map views */}
              {compareMode==="swipe"&&yearA&&yearB&&<SwipeCompare urlA={`${BASE}/tiles/${yearA}_tile.png`} urlB={`${BASE}/tiles/${yearB}_tile.png`} yearA={yearA} yearB={yearB}/>}
              {compareMode==="split"&&(
                <div className="split-wrap">
                  <ZoomableMap className="split-half"><img className="fi" src={`${BASE}/tiles/${yearA}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/><div className="split-lbl">{yearA}</div></ZoomableMap>
                  <ZoomableMap className="split-half"><img className="fi" src={`${BASE}/tiles/${yearB}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/><div className="split-lbl">{yearB}</div></ZoomableMap>
                </div>
              )}
              {compareMode==="opacity"&&(
                <div className="op-wrap">
                  <ZoomableMap className="mapbox" style={{flex:1}}>
                    <img className="fi" src={`${BASE}/tiles/${yearA}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/>
                    <img className="fi" src={`${BASE}/tiles/${yearB}_tile.png`} alt="" style={{opacity:opacityB/100}} onError={e=>e.target.style.opacity=0}/>
                    <div style={{position:"absolute",top:10,left:10,background:"rgba(7,13,25,.82)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:7,padding:"5px 10px",zIndex:5,pointerEvents:"none",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:11,fontFamily:"var(--mono)",color:"#4895ef",fontWeight:700}}>{yearA}</span>
                      <span style={{fontSize:9,color:"var(--text3)"}}>→</span>
                      <span style={{fontSize:11,fontFamily:"var(--mono)",color:"#ff4d6d",fontWeight:700}}>{yearB}</span>
                    </div>
                  </ZoomableMap>
                  <div className="op-ctrl">
                    <div className="op-row">
                      <span className="op-yr a">{yearA}</span>
                      <div style={{flex:1}}><input type="range" className="op-sl" min={0} max={100} value={opacityB} style={{"--fill":`${opacityB}%`}} onChange={e=>setOpacityB(+e.target.value)}/></div>
                      <span className="op-yr b">{yearB}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FAB stats */}
            <button className="sheet-tab-btn" onClick={()=>setSheetOpen(true)} style={{position:"fixed",bottom:16,right:16,zIndex:45,width:52,height:52,borderRadius:"50%",background:"var(--accent)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 4px 20px rgba(255,77,109,.5)",flexDirection:"column",gap:2}}>
              <ChevronUp size={16}/>
              <span style={{fontSize:8,fontFamily:"var(--mono)"}}>STATS</span>
            </button>
            {sheetOpen&&(
              <div className="sheet-backdrop" onClick={()=>setSheetOpen(false)}>
                <div className="sheet" onClick={e=>e.stopPropagation()}>
                  <div className="sheet-handle" onClick={()=>setSheetOpen(false)}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 14px 8px"}}>
                    <span style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:1}}>COMPARISON STATS</span>
                    <button onClick={()=>setSheetOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)"}}><X size={16}/></button>
                  </div>
                  <CompareStatsContent/>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Desktop compare ── */
          <div className="cmp-layout">
            <div className="cmp-col">
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
                {compareMode==="split"&&<button className={`cbtn ${showChange?"on":""}`} disabled={!isConsecutive} onClick={()=>isConsecutive&&setShowChange(v=>!v)} style={{opacity:isConsecutive?1:.35,cursor:isConsecutive?"pointer":"not-allowed"}}><AlertCircle size={11}/>Change Layer{!isConsecutive&&<span style={{fontSize:9,opacity:.6}}>(consec.)</span>}</button>}
              </div>
              {compareMode==="swipe"&&yearA&&yearB&&<SwipeCompare urlA={`${BASE}/tiles/${yearA}_tile.png`} urlB={`${BASE}/tiles/${yearB}_tile.png`} yearA={yearA} yearB={yearB}/>}
              {compareMode==="split"&&(
                <div className="split-wrap">
                  {showChange&&isConsecutive?(
                    <ZoomableMap className="mapbox" style={{flex:1}}>
                      <img className="fi" src={`${BASE}/change/${sY}_${bY}_change.png`} alt=""/>
                      <div style={{position:"absolute",bottom:50,left:12,display:"flex",gap:5,zIndex:5,pointerEvents:"none"}}>
                        {[{c:"#8b0000",l:"Stable"},{c:"#fb8500",l:"New"},{c:"#4895ef",l:"Lost"}].map(x=>(
                          <div key={x.l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#aaa",background:"rgba(7,13,25,.85)",padding:"3px 6px",borderRadius:4}}><div style={{width:7,height:7,background:x.c,borderRadius:1}}/>{x.l}</div>
                        ))}
                      </div>
                    </ZoomableMap>
                  ):(
                    <>
                      <ZoomableMap className="split-half"><img className="fi" src={`${BASE}/tiles/${yearA}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/><div className="split-lbl">{yearA}</div></ZoomableMap>
                      <ZoomableMap className="split-half"><img className="fi" src={`${BASE}/tiles/${yearB}_tile.png`} alt="" onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1}/><div className="split-lbl">{yearB}</div></ZoomableMap>
                    </>
                  )}
                </div>
              )}
              {compareMode==="opacity"&&(
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
                    <div style={{textAlign:"center",fontSize:10,fontFamily:"var(--mono)",color:"var(--text3)",marginTop:3}}>← drag to blend →</div>
                  </div>
                </div>
              )}
            </div>
            <div className="csp"><CompareStatsContent/></div>
          </div>
        )
      )}

      {/* ════════════ ABOUT MODAL ════════════ */}
      {aboutOpen && (
        <div onClick={()=>setAboutOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:12,maxWidth:600,width:"100%",maxHeight:"90vh",overflow:"auto",padding:"24px 28px"}}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:6}}>About This Project</div>
                <div style={{fontSize:12,color:"var(--text3)",fontFamily:"var(--mono)"}}>Urban Growth Prediction · Kathmandu Valley</div>
              </div>
              <button onClick={()=>setAboutOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:24,lineHeight:1,padding:0}}>&times;</button>
            </div>

            {/* Purpose */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:"#4cc9f0",marginBottom:8,fontFamily:"var(--mono)"}}>🎯 PURPOSE</div>
              <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.7}}>
                This interactive tool uses machine learning to predict urban growth in Kathmandu Valley through 2030, helping planners, policy makers, and citizens prepare for change and make informed decisions about infrastructure, green spaces, and sustainable development.
              </div>
            </div>

            {/* How it Works */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:"#4cc9f0",marginBottom:8,fontFamily:"var(--mono)"}}>🤖 HOW IT WORKS</div>
              <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.7,marginBottom:10}}>
                A <strong>ConvLSTM neural network</strong> (Convolutional Long Short-Term Memory) trained on 23 years of satellite imagery learns patterns of urban expansion and projects them forward to 2030.
              </div>
              <div style={{fontSize:12,color:"var(--text3)",lineHeight:1.6,paddingLeft:16,borderLeft:"2px solid rgba(76,201,240,.3)"}}>
                ✓ 87% accurate at detecting new urbanization<br/>
                ✓ Trained on over 1 million data points<br/>
                ✓ Conservative, realistic growth scenarios<br/>
                ✓ Monotonic constraint: once built, stays built
              </div>
            </div>

            {/* Data Sources */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:"#4cc9f0",marginBottom:8,fontFamily:"var(--mono)"}}>📊 DATA SOURCES</div>
              <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.7}}>
                • <strong>Satellite Data:</strong> Landsat Collection 2 (2000-2022)<br/>
                • <strong>Processing Platform:</strong> Google Earth Engine<br/>
                • <strong>Spatial Resolution:</strong> 30 meters per pixel<br/>
                • <strong>Study Area:</strong> 1,039 km² (Kathmandu Valley)<br/>
                • <strong>Land Cover Classes:</strong> Built-up, Vegetation, Cropland, Water
              </div>
            </div>

            {/* Technical Details */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:"#4cc9f0",marginBottom:8,fontFamily:"var(--mono)"}}>⚙️ TECHNICAL DETAILS</div>
              <div style={{fontSize:12,color:"var(--text3)",lineHeight:1.7,fontFamily:"var(--mono)",background:"var(--bg)",padding:12,borderRadius:6,border:"1px solid var(--border)"}}>
                Model: ConvLSTM<br/>
                Framework: PyTorch 2.x<br/>
                Hardware: NVIDIA RTX 4060 Ti (16GB)<br/>
                Primary Metric: New Built-up Recall (87.3%)<br/>
                Loss Function: Focal Loss + Transition Weighting
              </div>
            </div>

            {/* Links */}
            <div style={{marginBottom:16,paddingTop:16,borderTop:"1px solid var(--border)"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#4cc9f0",marginBottom:10,fontFamily:"var(--mono)"}}>🔗 RESOURCES</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <a href="https://github.com/Himal-Joshi/urban-growth-lulc-kathmandu-ml" target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"var(--cyan)",textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>
                  → Source Code (GitHub)
                </a>
                <a href="mailto:your@email.com" style={{fontSize:12,color:"var(--cyan)",textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>
                  → Contact: your@email.com
                </a>
              </div>
            </div>

            {/* Footer */}
            <div style={{fontSize:11,color:"var(--text3)",paddingTop:16,borderTop:"1px solid var(--border)",textAlign:"center"}}>
              Built with Claude Code · Last updated: March 2026
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <span className="fi-t">DATA: LANDSAT COLLECTION 2 (2000-2022) · GOOGLE EARTH ENGINE</span>
          <span className="fi-t" style={{fontSize:9,color:"var(--text3)"}}>MODEL: ConvLSTM Neural Network · PyTorch · 87% New Built-up Recall</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div className="fdot"/><span className="fi-t">{isMobile?"PINCH TO ZOOM":"SCROLL TO ZOOM · DRAG TO PAN"}</span></div>
        <span className="fi-t">~30M/PX · 1039 KM²</span>
      </footer>
    </div>
  );
}