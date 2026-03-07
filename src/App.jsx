import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Play, Pause, Layers, Eye, EyeOff, AlertCircle, TrendingUp, Map, BarChart2, Maximize2 } from "lucide-react";

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

const EMBEDDED_STATS = {"years":[2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],"data":{"2000":{"year":2000,"observed":true,"water":{"pixels":591,"area_km2":0.53,"pct":0.05},"vegetation":{"pixels":526634,"area_km2":473.97,"pct":45.62},"cropland":{"pixels":523286,"area_km2":470.96,"pct":45.33},"builtup":{"pixels":103956,"area_km2":93.56,"pct":9.0},"total_valid_km2":1039.02},"2001":{"year":2001,"observed":true,"water":{"pixels":744,"area_km2":0.67,"pct":0.06},"vegetation":{"pixels":533946,"area_km2":480.55,"pct":46.25},"cropland":{"pixels":525006,"area_km2":472.51,"pct":45.48},"builtup":{"pixels":94771,"area_km2":85.29,"pct":8.21},"total_valid_km2":1039.02},"2002":{"year":2002,"observed":true,"water":{"pixels":890,"area_km2":0.8,"pct":0.08},"vegetation":{"pixels":544308,"area_km2":489.88,"pct":47.15},"cropland":{"pixels":518127,"area_km2":466.31,"pct":44.88},"builtup":{"pixels":91142,"area_km2":82.03,"pct":7.89},"total_valid_km2":1039.02},"2003":{"year":2003,"observed":true,"water":{"pixels":972,"area_km2":0.87,"pct":0.08},"vegetation":{"pixels":561115,"area_km2":505.0,"pct":48.6},"cropland":{"pixels":498405,"area_km2":448.56,"pct":43.17},"builtup":{"pixels":93975,"area_km2":84.58,"pct":8.14},"total_valid_km2":1039.02},"2004":{"year":2004,"observed":true,"water":{"pixels":982,"area_km2":0.88,"pct":0.09},"vegetation":{"pixels":578782,"area_km2":520.9,"pct":50.13},"cropland":{"pixels":475396,"area_km2":427.86,"pct":41.18},"builtup":{"pixels":99307,"area_km2":89.38,"pct":8.6},"total_valid_km2":1039.02},"2005":{"year":2005,"observed":true,"water":{"pixels":1013,"area_km2":0.91,"pct":0.09},"vegetation":{"pixels":590334,"area_km2":531.3,"pct":51.13},"cropland":{"pixels":459666,"area_km2":413.7,"pct":39.82},"builtup":{"pixels":103454,"area_km2":93.11,"pct":8.96},"total_valid_km2":1039.02},"2006":{"year":2006,"observed":true,"water":{"pixels":960,"area_km2":0.86,"pct":0.08},"vegetation":{"pixels":593323,"area_km2":533.99,"pct":51.39},"cropland":{"pixels":454096,"area_km2":408.69,"pct":39.33},"builtup":{"pixels":106088,"area_km2":95.48,"pct":9.19},"total_valid_km2":1039.02},"2007":{"year":2007,"observed":true,"water":{"pixels":852,"area_km2":0.77,"pct":0.07},"vegetation":{"pixels":588067,"area_km2":529.26,"pct":50.94},"cropland":{"pixels":456716,"area_km2":411.04,"pct":39.56},"builtup":{"pixels":108832,"area_km2":97.95,"pct":9.43},"total_valid_km2":1039.02},"2008":{"year":2008,"observed":true,"water":{"pixels":711,"area_km2":0.64,"pct":0.06},"vegetation":{"pixels":583399,"area_km2":525.06,"pct":50.53},"cropland":{"pixels":457738,"area_km2":411.96,"pct":39.65},"builtup":{"pixels":112619,"area_km2":101.36,"pct":9.76},"total_valid_km2":1039.02},"2009":{"year":2009,"observed":true,"water":{"pixels":567,"area_km2":0.51,"pct":0.05},"vegetation":{"pixels":575457,"area_km2":517.91,"pct":49.85},"cropland":{"pixels":461015,"area_km2":414.91,"pct":39.93},"builtup":{"pixels":117428,"area_km2":105.69,"pct":10.17},"total_valid_km2":1039.02},"2010":{"year":2010,"observed":true,"water":{"pixels":479,"area_km2":0.43,"pct":0.04},"vegetation":{"pixels":572950,"area_km2":515.65,"pct":49.63},"cropland":{"pixels":459010,"area_km2":413.11,"pct":39.76},"builtup":{"pixels":122028,"area_km2":109.83,"pct":10.57},"total_valid_km2":1039.02},"2011":{"year":2011,"observed":true,"water":{"pixels":352,"area_km2":0.32,"pct":0.03},"vegetation":{"pixels":569727,"area_km2":512.75,"pct":49.35},"cropland":{"pixels":458910,"area_km2":413.02,"pct":39.75},"builtup":{"pixels":125478,"area_km2":112.93,"pct":10.87},"total_valid_km2":1039.02},"2013":{"year":2013,"observed":true,"water":{"pixels":262,"area_km2":0.24,"pct":0.02},"vegetation":{"pixels":560748,"area_km2":504.67,"pct":48.57},"cropland":{"pixels":465141,"area_km2":418.63,"pct":40.29},"builtup":{"pixels":128316,"area_km2":115.48,"pct":11.11},"total_valid_km2":1039.02},"2014":{"year":2014,"observed":true,"water":{"pixels":240,"area_km2":0.22,"pct":0.02},"vegetation":{"pixels":559811,"area_km2":503.83,"pct":48.49},"cropland":{"pixels":463263,"area_km2":416.94,"pct":40.13},"builtup":{"pixels":131153,"area_km2":118.04,"pct":11.36},"total_valid_km2":1039.02},"2015":{"year":2015,"observed":true,"water":{"pixels":254,"area_km2":0.23,"pct":0.02},"vegetation":{"pixels":560396,"area_km2":504.36,"pct":48.54},"cropland":{"pixels":458451,"area_km2":412.61,"pct":39.71},"builtup":{"pixels":135366,"area_km2":121.83,"pct":11.73},"total_valid_km2":1039.02},"2016":{"year":2016,"observed":true,"water":{"pixels":232,"area_km2":0.21,"pct":0.02},"vegetation":{"pixels":559196,"area_km2":503.28,"pct":48.44},"cropland":{"pixels":451985,"area_km2":406.79,"pct":39.15},"builtup":{"pixels":143054,"area_km2":128.75,"pct":12.39},"total_valid_km2":1039.02},"2017":{"year":2017,"observed":true,"water":{"pixels":241,"area_km2":0.22,"pct":0.02},"vegetation":{"pixels":559690,"area_km2":503.72,"pct":48.48},"cropland":{"pixels":437834,"area_km2":394.05,"pct":37.93},"builtup":{"pixels":156702,"area_km2":141.03,"pct":13.57},"total_valid_km2":1039.02},"2018":{"year":2018,"observed":true,"water":{"pixels":349,"area_km2":0.31,"pct":0.03},"vegetation":{"pixels":558869,"area_km2":502.98,"pct":48.41},"cropland":{"pixels":409572,"area_km2":368.61,"pct":35.48},"builtup":{"pixels":185677,"area_km2":167.11,"pct":16.08},"total_valid_km2":1039.02},"2019":{"year":2019,"observed":true,"water":{"pixels":604,"area_km2":0.54,"pct":0.05},"vegetation":{"pixels":561700,"area_km2":505.53,"pct":48.65},"cropland":{"pixels":398713,"area_km2":358.84,"pct":34.54},"builtup":{"pixels":193450,"area_km2":174.1,"pct":16.76},"total_valid_km2":1039.02},"2020":{"year":2020,"observed":true,"water":{"pixels":374,"area_km2":0.34,"pct":0.03},"vegetation":{"pixels":548884,"area_km2":494.0,"pct":47.54},"cropland":{"pixels":403784,"area_km2":363.41,"pct":34.98},"builtup":{"pixels":201425,"area_km2":181.28,"pct":17.45},"total_valid_km2":1039.02},"2021":{"year":2021,"observed":true,"water":{"pixels":201,"area_km2":0.18,"pct":0.02},"vegetation":{"pixels":547546,"area_km2":492.79,"pct":47.43},"cropland":{"pixels":403958,"area_km2":363.56,"pct":34.99},"builtup":{"pixels":202762,"area_km2":182.49,"pct":17.56},"total_valid_km2":1039.02},"2022":{"year":2022,"observed":true,"water":{"pixels":4334,"area_km2":3.9,"pct":0.38},"vegetation":{"pixels":544010,"area_km2":489.61,"pct":47.12},"cropland":{"pixels":401046,"area_km2":360.94,"pct":34.74},"builtup":{"pixels":205077,"area_km2":184.57,"pct":17.76},"total_valid_km2":1039.02}}};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tt-year">{label}</div>
      <div className="tt-val">{payload[0]?.value?.toFixed(1)} <span>km²</span></div>
    </div>
  );
};

export default function App() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("timelapse");
  const [yearIdx, setYearIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showAllClasses, setShowAllClasses] = useState(true);
  const [showHotspot, setShowHotspot] = useState(false);
  const [yearA, setYearA] = useState(null);
  const [yearB, setYearB] = useState(null);
  const [dividerPct, setDividerPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const intervalRef = useRef(null);
  const compareRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE}/stats.json`).then(r => r.json()).then(d => {
      setStats(d); setYearA(d.years[0]); setYearB(d.years[d.years.length - 1]);
    }).catch(() => {
      setStats(EMBEDDED_STATS);
      setYearA(EMBEDDED_STATS.years[0]);
      setYearB(EMBEDDED_STATS.years[EMBEDDED_STATS.years.length - 1]);
    });
  }, []);

  useEffect(() => {
    if (!stats || !playing) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setYearIdx(i => { if (i >= stats.years.length - 1) { setPlaying(false); return 0; } return i + 1; });
    }, 1200 / speed);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, stats]);

  const onMouseDown = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onMouseMove = useCallback((e) => {
    if (!dragging || !compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    setDividerPct(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
  }, [dragging]);
  const onMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) { window.addEventListener("mousemove", onMouseMove); window.addEventListener("mouseup", onMouseUp); }
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [dragging, onMouseMove, onMouseUp]);

  if (!stats) return (
    <div className="loading-screen">
      <div className="loading-inner">
        <div className="loading-pulse" />
        <div className="loading-text">INITIALIZING SATELLITE DATA</div>
        <div className="loading-sub">Kathmandu Valley · Land Use Monitor</div>
      </div>
    </div>
  );

  const years = stats.years;
  const currentYear = years[yearIdx];
  const currentData = stats.data[currentYear];
  const prevData = yearIdx > 0 ? stats.data[years[yearIdx - 1]] : null;
  const yoyChange = prevData ? currentData.builtup.area_km2 - prevData.builtup.area_km2 : null;
  const isPredicted = !currentData?.observed;
  const totalGrowth = stats.data[years[years.length-1]].builtup.area_km2 - stats.data[years[0]].builtup.area_km2;
  const sparkData = years.map(y => ({ year: y, builtup: stats.data[y]?.builtup?.area_km2 ?? 0 }));
  const tileUrl = y => showAllClasses ? `${BASE}/tiles/${y}_tile.png` : `${BASE}/tiles/${y}_builtup.png`;

  const dataA = yearA ? stats.data[yearA] : null;
  const dataB = yearB ? stats.data[yearB] : null;
  const isConsecutive = yearA && yearB && Math.abs(years.indexOf(yearB) - years.indexOf(yearA)) === 1;
  const [sY, bY] = yearA < yearB ? [yearA, yearB] : [yearB, yearA];

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #070d19;
          --bg2: #0b1525;
          --bg3: #0f1e35;
          --bg4: #142444;
          --border: #1a2e4a;
          --border2: #243d5e;
          --accent: #ff4d6d;
          --accent2: #ff6b8a;
          --blue: #4895ef;
          --cyan: #4cc9f0;
          --gold: #ffb703;
          --green: #40916c;
          --text: #e2eaf5;
          --text2: #8fa8c8;
          --text3: #4a6580;
          --font: 'Inter', sans-serif;
          --mono: 'JetBrains Mono', monospace;
          --radius: 10px;
          --shadow: 0 4px 24px rgba(0,0,0,0.4);
        }

        body { background: var(--bg); color: var(--text); font-family: var(--font); }

        .app { display: flex; flex-direction: column; min-height: 100vh; background: var(--bg); }

        /* ── Loading ── */
        .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
        .loading-inner { text-align: center; }
        .loading-pulse { width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--accent); border-top-color: transparent; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-family: var(--mono); font-size: 13px; letter-spacing: 3px; color: var(--text2); }
        .loading-sub { font-size: 11px; color: var(--text3); margin-top: 6px; letter-spacing: 1px; }

        /* ── Header ── */
        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; height: 64px;
          background: rgba(11,21,37,0.95);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 100;
        }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-logo { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), #c9184a); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .header-title { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; }
        .header-title span { color: var(--accent); }
        .header-sub { font-size: 11px; color: var(--text3); font-family: var(--mono); letter-spacing: 1px; }
        .header-badges { display: flex; gap: 8px; }
        .badge { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-family: var(--mono); font-weight: 500; letter-spacing: 0.5px; }
        .badge-sensor { background: rgba(251,133,0,0.12); color: #fb8500; border: 1px solid rgba(251,133,0,0.25); }
        .badge-sat { background: rgba(72,149,239,0.12); color: var(--blue); border: 1px solid rgba(72,149,239,0.25); }

        /* ── Summary Bar ── */
        .summary-bar {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid var(--border);
          background: var(--bg2);
        }
        .summary-item { padding: 14px 24px; border-right: 1px solid var(--border); }
        .summary-item:last-child { border-right: none; }
        .summary-label { font-size: 10px; font-family: var(--mono); letter-spacing: 1.5px; color: var(--text3); text-transform: uppercase; margin-bottom: 4px; }
        .summary-value { font-size: 22px; font-weight: 700; font-family: var(--mono); line-height: 1; }
        .summary-value.red { color: var(--accent); }
        .summary-value.gold { color: var(--gold); }
        .summary-value.green { color: #52b788; }
        .summary-value.blue { color: var(--cyan); }
        .summary-sub { font-size: 10px; color: var(--text3); margin-top: 3px; }

        /* ── Tabs ── */
        .tabs { display: flex; background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 24px; gap: 4px; }
        .tab-btn {
          background: none; border: none; cursor: pointer;
          padding: 14px 20px; font-family: var(--font); font-size: 13px;
          font-weight: 500; color: var(--text3); display: flex; align-items: center; gap: 8px;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: all 0.2s; letter-spacing: 0.2px;
        }
        .tab-btn:hover { color: var(--text2); }
        .tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }
        .tab-icon { opacity: 0.7; }

        /* ── Main layout ── */
        .main { display: flex; flex: 1; overflow: hidden; height: calc(100vh - 64px - 54px - 48px); }

        /* ── Map panel ── */
        .map-panel { flex: 1; display: flex; flex-direction: column; padding: 16px; gap: 12px; min-width: 0; }
        .map-container {
          flex: 1; position: relative; background: #020810;
          border-radius: var(--radius); overflow: hidden; min-height: 300px;
          border: 1px solid var(--border);
          box-shadow: inset 0 0 60px rgba(0,0,0,0.5);
        }
        .map-container.predicted { border: 1px dashed var(--text3); }
        .tile-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; transition: opacity 0.25s ease; }
        .map-year-badge {
          position: absolute; top: 16px; left: 16px;
          background: rgba(7,13,25,0.82); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 10px 16px;
          display: flex; align-items: baseline; gap: 10px;
        }
        .map-year { font-family: var(--mono); font-size: 40px; font-weight: 700; color: #fff; line-height: 1; letter-spacing: -2px; }
        .predicted-tag { font-size: 9px; font-family: var(--mono); padding: 2px 7px; background: rgba(255,183,3,0.15); border: 1px solid rgba(255,183,3,0.4); color: var(--gold); border-radius: 4px; letter-spacing: 1px; }
        .map-stats-overlay {
          position: absolute; top: 16px; right: 16px;
          background: rgba(7,13,25,0.82); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          padding: 12px 14px; min-width: 130px;
        }
        .mos-label { font-size: 9px; font-family: var(--mono); color: var(--text3); letter-spacing: 1px; margin-bottom: 2px; }
        .mos-val { font-size: 24px; font-weight: 700; font-family: var(--mono); color: var(--accent); line-height: 1; }
        .mos-unit { font-size: 11px; color: var(--text3); }
        .mos-pct { font-size: 13px; font-weight: 600; color: var(--text2); margin-top: 4px; }
        .mos-change { font-size: 12px; font-weight: 500; font-family: var(--mono); margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border); }
        .map-legend {
          position: absolute; bottom: 14px; left: 14px;
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .legend-item {
          display: flex; align-items: center; gap: 5px;
          background: rgba(7,13,25,0.82); backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 4px 8px; border-radius: 6px;
          font-size: 10px; color: var(--text2);
        }
        .legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

        /* ── Slider ── */
        .slider-section { padding: 0 4px; }
        .slider-ticks { position: relative; height: 18px; margin-bottom: 4px; }
        .tick { position: absolute; top: 0; transform: translateX(-50%); font-size: 9px; font-family: var(--mono); color: var(--text3); pointer-events: none; }
        .tick.sensor { color: #fb8500; }
        .tick-line { position: absolute; bottom: 0; left: 50%; width: 1px; height: 5px; background: #fb8500; transform: translateX(-50%); }

        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; background: linear-gradient(to right, var(--accent) 0%, var(--accent) var(--fill, 0%), var(--bg4) var(--fill, 0%), var(--bg4) 100%); border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); margin-top: -6px; border: 2px solid var(--bg); box-shadow: 0 0 0 3px rgba(255,77,109,0.25); }

        /* ── Controls ── */
        .controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .play-btn {
          width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--accent), #c9184a);
          display: flex; align-items: center; justify-content: center;
          color: white; transition: all 0.2s; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(255,77,109,0.35);
        }
        .play-btn:hover { transform: scale(1.07); box-shadow: 0 6px 20px rgba(255,77,109,0.5); }
        .speed-group { display: flex; border: 1px solid var(--border2); border-radius: 6px; overflow: hidden; }
        .speed-btn { background: none; border: none; cursor: pointer; padding: 7px 11px; font-family: var(--mono); font-size: 10px; color: var(--text3); transition: all 0.15s; border-right: 1px solid var(--border); }
        .speed-btn:last-child { border-right: none; }
        .speed-btn:hover { background: var(--bg3); color: var(--text2); }
        .speed-btn.active { background: var(--bg4); color: var(--cyan); }
        .ctrl-btn {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg3); border: 1px solid var(--border2); cursor: pointer;
          padding: 8px 14px; font-family: var(--font); font-size: 12px;
          color: var(--text2); transition: all 0.2s; border-radius: 6px; font-weight: 500;
        }
        .ctrl-btn:hover { border-color: var(--blue); color: var(--blue); background: rgba(72,149,239,0.08); }
        .ctrl-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(255,77,109,0.08); }

        /* ── Stats panel ── */
        .stats-panel { width: 300px; border-left: 1px solid var(--border); background: var(--bg2); display: flex; flex-direction: column; gap: 0; overflow-y: auto; flex-shrink: 0; }
        .panel-section { padding: 18px 18px; border-bottom: 1px solid var(--border); }
        .section-title { font-size: 10px; font-family: var(--mono); letter-spacing: 2px; color: var(--text3); text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
        .section-title::before { content: ''; width: 3px; height: 10px; background: var(--accent); border-radius: 2px; display: inline-block; }

        /* Growth card */
        .growth-card { background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 14px; margin-bottom: 10px; }
        .gc-big { font-size: 48px; font-weight: 700; font-family: var(--mono); color: var(--accent); line-height: 1; letter-spacing: -2px; }
        .gc-unit { font-size: 14px; color: var(--text3); }
        .gc-row { display: flex; gap: 16px; margin-top: 10px; }
        .gc-stat { flex: 1; }
        .gc-stat-label { font-size: 9px; font-family: var(--mono); letter-spacing: 1px; color: var(--text3); margin-bottom: 2px; }
        .gc-stat-val { font-size: 16px; font-weight: 600; font-family: var(--mono); }

        /* Class bars */
        .class-item { margin-bottom: 12px; }
        .class-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .class-name { font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 5px; }
        .class-vals { font-size: 10px; font-family: var(--mono); color: var(--text3); }
        .class-track { height: 6px; background: var(--bg4); border-radius: 3px; overflow: hidden; }
        .class-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

        /* Chart */
        .custom-tooltip { background: var(--bg3); border: 1px solid var(--border2); padding: 8px 12px; border-radius: 6px; font-family: var(--mono); }
        .tt-year { font-size: 10px; color: var(--text3); }
        .tt-val { font-size: 14px; font-weight: 600; color: var(--accent); }
        .tt-val span { font-size: 10px; color: var(--text3); }

        /* ── Compare ── */
        .compare-layout { display: flex; flex: 1; overflow: hidden; }
        .compare-map-col { flex: 1; display: flex; flex-direction: column; padding: 16px; gap: 12px; min-width: 0; }
        .compare-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .year-selector { display: flex; align-items: center; gap: 8px; }
        .year-label { font-size: 10px; font-family: var(--mono); letter-spacing: 1px; color: var(--text3); }
        .year-pill { font-size: 11px; font-family: var(--mono); color: var(--text3); padding: 2px 8px; background: var(--bg4); border: 1px solid var(--border2); border-radius: 4px; }
        select {
          background: var(--bg3); border: 1px solid var(--border2);
          color: var(--text); font-family: var(--mono); font-size: 13px;
          padding: 8px 12px; cursor: pointer; outline: none; border-radius: 6px;
          font-weight: 600; transition: border-color 0.2s;
        }
        select:focus { border-color: var(--blue); }
        .vs-badge { font-size: 11px; font-family: var(--mono); color: var(--text3); padding: 6px 12px; background: var(--bg4); border-radius: 20px; }
        .change-btn { display: flex; align-items: center; gap: 6px; background: var(--bg3); border: 1px solid var(--border2); cursor: pointer; padding: 8px 14px; font-family: var(--font); font-size: 12px; color: var(--text2); transition: all 0.2s; border-radius: 6px; font-weight: 500; }
        .change-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .change-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(255,77,109,0.08); }
        .change-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .split-map { flex: 1; position: relative; background: #020810; border-radius: var(--radius); overflow: hidden; min-height: 300px; border: 1px solid var(--border); user-select: none; }
        .split-label { position: absolute; top: 14px; font-size: 26px; font-weight: 700; font-family: var(--mono); color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,0.8); pointer-events: none; z-index: 5; }
        .split-label.left { left: 16px; }
        .split-label.right { right: 16px; }
        .divider-line { position: absolute; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.9); cursor: ew-resize; z-index: 10; transform: translateX(-1px); }
        .divider-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 36px; height: 36px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #070d19; font-weight: 700; font-size: 12px; cursor: ew-resize; box-shadow: 0 2px 16px rgba(0,0,0,0.5); }
        .compare-stats-panel { width: 300px; border-left: 1px solid var(--border); background: var(--bg2); overflow-y: auto; flex-shrink: 0; }
        .delta-card { background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 14px; margin-bottom: 10px; }
        .dc-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .dc-year-box { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; }
        .dc-year { font-size: 10px; font-family: var(--mono); color: var(--text3); margin-bottom: 4px; }
        .dc-val { font-size: 24px; font-weight: 700; font-family: var(--mono); color: var(--accent); line-height: 1; letter-spacing: -1px; }
        .dc-unit { font-size: 9px; color: var(--text3); }
        .dc-pct { font-size: 12px; font-weight: 500; color: var(--text2); margin-top: 4px; }
        .dc-delta-row { display: flex; justify-content: space-between; }
        .dc-delta-item { text-align: center; }
        .dc-delta-label { font-size: 9px; font-family: var(--mono); color: var(--text3); letter-spacing: 1px; margin-bottom: 2px; }
        .dc-delta-val { font-size: 20px; font-weight: 700; font-family: var(--mono); }
        .class-table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: var(--mono); }
        .class-table th { text-align: right; padding: 4px 0; color: var(--text3); font-weight: 500; font-size: 9px; letter-spacing: 0.5px; }
        .class-table th:first-child { text-align: left; }
        .class-table td { padding: 6px 0; border-bottom: 1px solid var(--border); text-align: right; color: var(--text2); }
        .class-table td:first-child { text-align: left; }
        .class-table tr:last-child td { border-bottom: none; }

        /* ── Footer ── */
        .footer { border-top: 1px solid var(--border); padding: 10px 28px; display: flex; justify-content: space-between; align-items: center; background: var(--bg2); }
        .footer-item { font-size: 10px; font-family: var(--mono); color: var(--text3); letter-spacing: 0.5px; }
        .footer-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
      `}</style>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">🛰️</div>
          <div>
            <div className="header-title">Kathmandu Valley <span>Urban Growth</span></div>
            <div className="header-sub">LAND USE & LAND COVER · 2000 – 2022</div>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge badge-sat">LANDSAT 5/7/8/9</span>
          <span className="badge badge-sensor">⚡ L7→L8 SWITCH: 2013</span>
        </div>
      </header>

      {/* ── Summary Bar ── */}
      <div className="summary-bar">
        <div className="summary-item">
          <div className="summary-label">Built-up 2022</div>
          <div className="summary-value red">{stats.data[2022].builtup.area_km2.toFixed(0)} <span style={{fontSize:13}}>km²</span></div>
          <div className="summary-sub">{stats.data[2022].builtup.pct.toFixed(1)}% of valley</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Total Growth</div>
          <div className="summary-value gold">+{totalGrowth.toFixed(0)} <span style={{fontSize:13}}>km²</span></div>
          <div className="summary-sub">since 2000</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Vegetation 2022</div>
          <div className="summary-value green">{stats.data[2022].vegetation.pct.toFixed(1)}<span style={{fontSize:13}}>%</span></div>
          <div className="summary-sub">{stats.data[2022].vegetation.area_km2.toFixed(0)} km²</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Valley Area</div>
          <div className="summary-value blue">1,039 <span style={{fontSize:13}}>km²</span></div>
          <div className="summary-sub">total valid area</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab-btn ${tab === "timelapse" ? "active" : ""}`} onClick={() => setTab("timelapse")}>
          <Play size={14} className="tab-icon" /> Timelapse
        </button>
        <button className={`tab-btn ${tab === "compare" ? "active" : ""}`} onClick={() => setTab("compare")}>
          <BarChart2 size={14} className="tab-icon" /> Compare Years
        </button>
      </div>

      {/* ── TIMELAPSE ── */}
      {tab === "timelapse" && (
        <div className="main">
          <div className="map-panel">
            {/* Map */}
            <div className={`map-container ${isPredicted ? "predicted" : ""}`}>
              <img className="tile-img" src={tileUrl(currentYear)} alt="" onError={e => e.target.style.opacity=0} onLoad={e => e.target.style.opacity=1} />
              {showHotspot && <img className="tile-img" src={`${BASE}/hotspot/hotspot.png`} style={{opacity:0.7,mixBlendMode:"screen"}} alt="" />}

              <div className="map-year-badge">
                <span className="map-year">{currentYear}</span>
                {isPredicted && <span className="predicted-tag">PREDICTED</span>}
              </div>

              <div className="map-stats-overlay">
                <div className="mos-label">BUILT-UP</div>
                <div className="mos-val">{currentData?.builtup.area_km2.toFixed(1)}<span className="mos-unit"> km²</span></div>
                <div className="mos-pct">{currentData?.builtup.pct.toFixed(1)}% coverage</div>
                {yoyChange !== null && (
                  <div className="mos-change" style={{color: yoyChange >= 0 ? "#fb8500" : "#4895ef"}}>
                    {yoyChange >= 0 ? "▲" : "▼"} {Math.abs(yoyChange).toFixed(1)} km² YoY
                  </div>
                )}
              </div>

              <div className="map-legend">
                {(showHotspot ? HOTSPOT_LEGEND : Object.entries(LULC).map(([,v])=>({color:v.color,label:v.label}))).map(item => (
                  <div key={item.label} className="legend-item">
                    <div className="legend-dot" style={{background:item.color}} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Slider */}
            <div className="slider-section">
              <div className="slider-ticks">
                {years.map((y, i) => (
                  <div key={y} className={`tick ${y===2013?"sensor":""}`} style={{left:`${(i/(years.length-1))*100}%`}}>
                    {(y%5===0||y===2013) ? y : ""}
                    {y===2013 && <div className="tick-line" />}
                  </div>
                ))}
              </div>
              <input type="range" min={0} max={years.length-1} value={yearIdx}
                style={{"--fill": `${(yearIdx/(years.length-1))*100}%`}}
                onChange={e => { setYearIdx(+e.target.value); setPlaying(false); }} />
            </div>

            {/* Controls */}
            <div className="controls">
              <button className="play-btn" onClick={() => setPlaying(p => !p)}>
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div className="speed-group">
                {SPEED_OPTIONS.map(s => (
                  <button key={s} className={`speed-btn ${speed===s?"active":""}`} onClick={() => setSpeed(s)}>{s}×</button>
                ))}
              </div>
              <div style={{flex:1}} />
              <button className={`ctrl-btn ${!showAllClasses?"active":""}`} onClick={() => setShowAllClasses(v=>!v)}>
                <Layers size={13} />
                {showAllClasses ? "All Classes" : "Built-up Only"}
              </button>
              <button className={`ctrl-btn ${showHotspot?"active":""}`} onClick={() => setShowHotspot(v=>!v)}>
                {showHotspot ? <Eye size={13} /> : <EyeOff size={13} />}
                Hotspot
              </button>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="stats-panel">
            {/* Big stat */}
            <div className="panel-section">
              <div className="section-title">Built-up Area</div>
              <div className="growth-card">
                <div className="gc-big">{currentData?.builtup.area_km2.toFixed(1)}<span className="gc-unit"> km²</span></div>
                <div className="gc-row">
                  <div className="gc-stat">
                    <div className="gc-stat-label">COVERAGE</div>
                    <div className="gc-stat-val" style={{color:"var(--text)"}}>{currentData?.builtup.pct.toFixed(1)}%</div>
                  </div>
                  {yoyChange !== null && (
                    <div className="gc-stat">
                      <div className="gc-stat-label">YoY CHANGE</div>
                      <div className="gc-stat-val" style={{color: yoyChange>=0?"#fb8500":"var(--blue)"}}>
                        {yoyChange>=0?"+":""}{yoyChange.toFixed(1)} km²
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sparkline */}
            <div className="panel-section">
              <div className="section-title">Growth Trajectory</div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={sparkData} margin={{top:4,right:4,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="builtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4a" vertical={false} />
                  <XAxis dataKey="year" hide />
                  <YAxis domain={["auto","auto"]} tick={{fontSize:8,fill:"#4a6580",fontFamily:"var(--mono)"}} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={currentYear} stroke="#ff4d6d" strokeWidth={1.5} strokeDasharray="4 3" />
                  <ReferenceLine x={2013} stroke="#fb8500" strokeWidth={1} strokeOpacity={0.5} />
                  <Area type="monotone" dataKey="builtup" stroke="#ff4d6d" strokeWidth={2} fill="url(#builtGrad)" dot={false} activeDot={{r:4,fill:"#ff4d6d",stroke:"var(--bg)",strokeWidth:2}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Land cover */}
            <div className="panel-section">
              <div className="section-title">Land Cover Breakdown</div>
              {Object.entries(LULC).map(([k, v]) => {
                const d = currentData?.[k]; if (!d) return null;
                return (
                  <div key={k} className="class-item">
                    <div className="class-header">
                      <div className="class-name" style={{color:v.color}}>{v.icon} {v.label}</div>
                      <div className="class-vals">{d.area_km2.toFixed(1)} km² · {d.pct.toFixed(1)}%</div>
                    </div>
                    <div className="class-track">
                      <div className="class-fill" style={{width:`${d.pct}%`, background:`linear-gradient(90deg, ${v.grad[0]}, ${v.grad[1]})`}} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hotspot legend */}
            {showHotspot && (
              <div className="panel-section">
                <div className="section-title">Urbanization Eras</div>
                {HOTSPOT_LEGEND.map(h => (
                  <div key={h.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:12,height:12,background:h.color,borderRadius:3,flexShrink:0}} />
                    <span style={{fontSize:12,color:"var(--text2)"}}>{h.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPARE ── */}
      {tab === "compare" && (
        <div className="compare-layout" style={{flex:1,overflow:"hidden"}}>
          <div className="compare-map-col">
            {/* Controls */}
            <div className="compare-controls">
              <div className="year-selector">
                <span className="year-label">YEAR A</span>
                <select value={yearA} onChange={e => setYearA(+e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <span className="vs-badge">VS</span>
              <div className="year-selector">
                <span className="year-label">YEAR B</span>
                <select value={yearB} onChange={e => setYearB(+e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{flex:1}} />
              <button className={`change-btn ${showChange?"active":""}`} disabled={!isConsecutive}
                onClick={() => isConsecutive && setShowChange(v=>!v)}
                title={!isConsecutive ? "Only available for consecutive years" : ""}>
                <AlertCircle size={13} />
                Change Layer
                {!isConsecutive && <span style={{fontSize:9,opacity:0.6}}>(consecutive only)</span>}
              </button>
            </div>

            {/* Split map */}
            <div className="split-map" ref={compareRef}>
              {showChange && isConsecutive ? (
                <>
                  <img className="tile-img" src={`${BASE}/change/${sY}_${bY}_change.png`} alt="" />
                  <div className="map-legend" style={{bottom:14,left:14}}>
                    {[{c:"#8b0000",l:"Stable"},{c:"#fb8500",l:"New"},{c:"#4895ef",l:"Lost"}].map(x => (
                      <div key={x.l} className="legend-item"><div className="legend-dot" style={{background:x.c}} />{x.l}</div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{position:"absolute",top:0,left:0,width:`${dividerPct}%`,height:"100%",overflow:"hidden"}}>
                    <img src={`${BASE}/tiles/${yearA}_tile.png`} alt="" style={{position:"absolute",top:0,left:0,width:`${10000/dividerPct}%`,height:"100%",objectFit:"contain",objectPosition:"left center"}} onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1} />
                  </div>
                  <div style={{position:"absolute",top:0,left:`${dividerPct}%`,right:0,height:"100%",overflow:"hidden"}}>
                    <img src={`${BASE}/tiles/${yearB}_tile.png`} alt="" style={{position:"absolute",top:0,right:0,width:`${10000/(100-dividerPct)}%`,height:"100%",objectFit:"contain",objectPosition:"right center"}} onError={e=>e.target.style.opacity=0} onLoad={e=>e.target.style.opacity=1} />
                  </div>
                  <div className="divider-line" style={{left:`${dividerPct}%`}} onMouseDown={onMouseDown}>
                    <div className="divider-handle">⇄</div>
                  </div>
                  <div className="split-label left">{yearA}</div>
                  <div className="split-label right">{yearB}</div>
                </>
              )}
            </div>
          </div>

          {/* Compare stats */}
          <div className="compare-stats-panel">
            {dataA && dataB && (() => {
              const delta = dataB.builtup.area_km2 - dataA.builtup.area_km2;
              const pctChg = ((delta / dataA.builtup.area_km2) * 100).toFixed(1);
              return (
                <>
                  <div className="panel-section">
                    <div className="section-title">Built-up Comparison</div>
                    <div className="delta-card">
                      <div className="dc-pair">
                        {[[yearA,dataA],[yearB,dataB]].map(([y,d])=>(
                          <div key={y} className="dc-year-box">
                            <div className="dc-year">{y}</div>
                            <div className="dc-val">{d.builtup.area_km2.toFixed(1)}</div>
                            <div className="dc-unit">km²</div>
                            <div className="dc-pct">{d.builtup.pct.toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                      <div className="dc-delta-row">
                        <div className="dc-delta-item">
                          <div className="dc-delta-label">CHANGE</div>
                          <div className="dc-delta-val" style={{color:delta>=0?"#fb8500":"var(--blue)"}}>{delta>=0?"+":""}{delta.toFixed(1)}<span style={{fontSize:11}}> km²</span></div>
                        </div>
                        <div className="dc-delta-item">
                          <div className="dc-delta-label">% CHANGE</div>
                          <div className="dc-delta-val" style={{color:delta>=0?"#fb8500":"var(--blue)"}}>{delta>=0?"+":""}{pctChg}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel-section">
                    <div className="section-title">Per-Class Comparison</div>
                    <table className="class-table">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>{yearA}</th>
                          <th>{yearB}</th>
                          <th>Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(LULC).map(([k,v])=>{
                          const a=dataA[k]?.area_km2, b=dataB[k]?.area_km2, d=b-a;
                          return (
                            <tr key={k}>
                              <td><span style={{color:v.color,fontWeight:600}}>{v.label}</span></td>
                              <td>{a?.toFixed(1)}</td>
                              <td>{b?.toFixed(1)}</td>
                              <td style={{color:d>=0?"#fb8500":"var(--blue)",fontWeight:600}}>{d>=0?"+":""}{d.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{fontSize:9,color:"var(--text3)",marginTop:8,fontFamily:"var(--mono)"}}>all values in km²</div>
                  </div>

                  <div className="panel-section">
                    <div className="section-title">Coverage Comparison</div>
                    {Object.entries(LULC).map(([k,v])=>{
                      const pA=dataA[k]?.pct??0, pB=dataB[k]?.pct??0;
                      return (
                        <div key={k} style={{marginBottom:12}}>
                          <div style={{fontSize:11,color:v.color,fontWeight:500,marginBottom:5}}>{v.icon} {v.label}</div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {[[yearA,pA],[yearB,pB]].map(([y,p])=>(
                              <div key={y} style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:32,fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",textAlign:"right"}}>{y}</div>
                                <div style={{flex:1,height:6,background:"var(--bg4)",borderRadius:3}}>
                                  <div style={{width:`${p}%`,height:"100%",background:v.color,borderRadius:3,opacity: y===yearA?0.5:1}} />
                                </div>
                                <div style={{width:34,fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)"}}>{p.toFixed(1)}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <span className="footer-item">DATA: LANDSAT COLLECTION 2 · GOOGLE EARTH ENGINE</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="footer-dot" />
          <span className="footer-item">LIVE</span>
        </div>
        <span className="footer-item">SPATIAL RES: ~90 M/PX · VALLEY: 1039.02 KM²</span>
      </footer>
    </div>
  );
}