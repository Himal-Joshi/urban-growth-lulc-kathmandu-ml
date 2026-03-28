import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Play, Pause, Layers, Eye, EyeOff, AlertCircle, BarChart2, ChevronUp, X, Download, Search, MapPin, Navigation2 } from "lucide-react";
import { MapContainer, TileLayer, ImageOverlay, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE = "/urban-growth-lulc-kathmandu-ml/data";
const KATHMANDU_BOUNDS = [[27.3837, 85.1690], [27.8247, 85.5750]];
const KATHMANDU_CENTER = [27.6042, 85.3720];
const DEFAULT_ZOOM = 11;
const CARTO_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
const CARTO_ATTR = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

const LULC = {
  builtup: { color: "#ff4d6d", grad: ["#ff4d6d", "#c9184a"], label: "Built-up", icon: "🏙️" },
  vegetation: { color: "#40916c", grad: ["#52b788", "#40916c"], label: "Vegetation", icon: "🌿" },
  cropland: { color: "#e9c46a", grad: ["#e9c46a", "#c9a84c"], label: "Cropland", icon: "🌾" },
  water: { color: "#4895ef", grad: ["#4cc9f0", "#4895ef"], label: "Water", icon: "💧" },
};

const HOTSPOT_LEGEND = [
  { color: "#9d4edd", label: "Pre-2005" },
  { color: "#ff4d6d", label: "2005–2010" },
  { color: "#fb8500", label: "2010–2015" },
  { color: "#ffb703", label: "2015–2020" },
  { color: "#f8f9fa", label: "2020+" },
];

const SPEED_OPTIONS = [0.5, 1, 2, 4];

const EMBEDDED_STATS = { "years": [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2024, 2025, 2026, 2027, 2028, 2029, 2030], "data": { "2000": { "year": 2000, "observed": true, "water": { "pixels": 591, "area_km2": 0.53, "pct": 0.05 }, "vegetation": { "pixels": 526634, "area_km2": 473.97, "pct": 45.62 }, "cropland": { "pixels": 523286, "area_km2": 470.96, "pct": 45.33 }, "builtup": { "pixels": 103956, "area_km2": 93.56, "pct": 9.0 }, "total_valid_km2": 1039.02 }, "2001": { "year": 2001, "observed": true, "water": { "pixels": 744, "area_km2": 0.67, "pct": 0.06 }, "vegetation": { "pixels": 533946, "area_km2": 480.55, "pct": 46.25 }, "cropland": { "pixels": 525006, "area_km2": 472.51, "pct": 45.48 }, "builtup": { "pixels": 94771, "area_km2": 85.29, "pct": 8.21 }, "total_valid_km2": 1039.02 }, "2002": { "year": 2002, "observed": true, "water": { "pixels": 890, "area_km2": 0.8, "pct": 0.08 }, "vegetation": { "pixels": 544308, "area_km2": 489.88, "pct": 47.15 }, "cropland": { "pixels": 518127, "area_km2": 466.31, "pct": 44.88 }, "builtup": { "pixels": 91142, "area_km2": 82.03, "pct": 7.89 }, "total_valid_km2": 1039.02 }, "2003": { "year": 2003, "observed": true, "water": { "pixels": 972, "area_km2": 0.87, "pct": 0.08 }, "vegetation": { "pixels": 561115, "area_km2": 505.0, "pct": 48.6 }, "cropland": { "pixels": 498405, "area_km2": 448.56, "pct": 43.17 }, "builtup": { "pixels": 93975, "area_km2": 84.58, "pct": 8.14 }, "total_valid_km2": 1039.02 }, "2004": { "year": 2004, "observed": true, "water": { "pixels": 982, "area_km2": 0.88, "pct": 0.09 }, "vegetation": { "pixels": 578782, "area_km2": 520.9, "pct": 50.13 }, "cropland": { "pixels": 475396, "area_km2": 427.86, "pct": 41.18 }, "builtup": { "pixels": 99307, "area_km2": 89.38, "pct": 8.6 }, "total_valid_km2": 1039.02 }, "2005": { "year": 2005, "observed": true, "water": { "pixels": 1013, "area_km2": 0.91, "pct": 0.09 }, "vegetation": { "pixels": 590334, "area_km2": 531.3, "pct": 51.13 }, "cropland": { "pixels": 459666, "area_km2": 413.7, "pct": 39.82 }, "builtup": { "pixels": 103454, "area_km2": 93.11, "pct": 8.96 }, "total_valid_km2": 1039.02 }, "2006": { "year": 2006, "observed": true, "water": { "pixels": 960, "area_km2": 0.86, "pct": 0.08 }, "vegetation": { "pixels": 593323, "area_km2": 533.99, "pct": 51.39 }, "cropland": { "pixels": 454096, "area_km2": 408.69, "pct": 39.33 }, "builtup": { "pixels": 106088, "area_km2": 95.48, "pct": 9.19 }, "total_valid_km2": 1039.02 }, "2007": { "year": 2007, "observed": true, "water": { "pixels": 852, "area_km2": 0.77, "pct": 0.07 }, "vegetation": { "pixels": 588067, "area_km2": 529.26, "pct": 50.94 }, "cropland": { "pixels": 456716, "area_km2": 411.04, "pct": 39.56 }, "builtup": { "pixels": 108832, "area_km2": 97.95, "pct": 9.43 }, "total_valid_km2": 1039.02 }, "2008": { "year": 2008, "observed": true, "water": { "pixels": 711, "area_km2": 0.64, "pct": 0.06 }, "vegetation": { "pixels": 583399, "area_km2": 525.06, "pct": 50.53 }, "cropland": { "pixels": 457738, "area_km2": 411.96, "pct": 39.65 }, "builtup": { "pixels": 112619, "area_km2": 101.36, "pct": 9.76 }, "total_valid_km2": 1039.02 }, "2009": { "year": 2009, "observed": true, "water": { "pixels": 567, "area_km2": 0.51, "pct": 0.05 }, "vegetation": { "pixels": 575457, "area_km2": 517.91, "pct": 49.85 }, "cropland": { "pixels": 461015, "area_km2": 414.91, "pct": 39.93 }, "builtup": { "pixels": 117428, "area_km2": 105.69, "pct": 10.17 }, "total_valid_km2": 1039.02 }, "2010": { "year": 2010, "observed": true, "water": { "pixels": 479, "area_km2": 0.43, "pct": 0.04 }, "vegetation": { "pixels": 572950, "area_km2": 515.65, "pct": 49.63 }, "cropland": { "pixels": 459010, "area_km2": 413.11, "pct": 39.76 }, "builtup": { "pixels": 122028, "area_km2": 109.83, "pct": 10.57 }, "total_valid_km2": 1039.02 }, "2011": { "year": 2011, "observed": true, "water": { "pixels": 352, "area_km2": 0.32, "pct": 0.03 }, "vegetation": { "pixels": 569727, "area_km2": 512.75, "pct": 49.35 }, "cropland": { "pixels": 458910, "area_km2": 413.02, "pct": 39.75 }, "builtup": { "pixels": 125478, "area_km2": 112.93, "pct": 10.87 }, "total_valid_km2": 1039.02 }, "2013": { "year": 2013, "observed": true, "water": { "pixels": 262, "area_km2": 0.24, "pct": 0.02 }, "vegetation": { "pixels": 560748, "area_km2": 504.67, "pct": 48.57 }, "cropland": { "pixels": 465141, "area_km2": 418.63, "pct": 40.29 }, "builtup": { "pixels": 128316, "area_km2": 115.48, "pct": 11.11 }, "total_valid_km2": 1039.02 }, "2014": { "year": 2014, "observed": true, "water": { "pixels": 240, "area_km2": 0.22, "pct": 0.02 }, "vegetation": { "pixels": 559811, "area_km2": 503.83, "pct": 48.49 }, "cropland": { "pixels": 463263, "area_km2": 416.94, "pct": 40.13 }, "builtup": { "pixels": 131153, "area_km2": 118.04, "pct": 11.36 }, "total_valid_km2": 1039.02 }, "2015": { "year": 2015, "observed": true, "water": { "pixels": 254, "area_km2": 0.23, "pct": 0.02 }, "vegetation": { "pixels": 560396, "area_km2": 504.36, "pct": 48.54 }, "cropland": { "pixels": 458451, "area_km2": 412.61, "pct": 39.71 }, "builtup": { "pixels": 135366, "area_km2": 121.83, "pct": 11.73 }, "total_valid_km2": 1039.02 }, "2016": { "year": 2016, "observed": true, "water": { "pixels": 232, "area_km2": 0.21, "pct": 0.02 }, "vegetation": { "pixels": 559196, "area_km2": 503.28, "pct": 48.44 }, "cropland": { "pixels": 451985, "area_km2": 406.79, "pct": 39.15 }, "builtup": { "pixels": 143054, "area_km2": 128.75, "pct": 12.39 }, "total_valid_km2": 1039.02 }, "2017": { "year": 2017, "observed": true, "water": { "pixels": 241, "area_km2": 0.22, "pct": 0.02 }, "vegetation": { "pixels": 559690, "area_km2": 503.72, "pct": 48.48 }, "cropland": { "pixels": 437834, "area_km2": 394.05, "pct": 37.93 }, "builtup": { "pixels": 156702, "area_km2": 141.03, "pct": 13.57 }, "total_valid_km2": 1039.02 }, "2018": { "year": 2018, "observed": true, "water": { "pixels": 349, "area_km2": 0.31, "pct": 0.03 }, "vegetation": { "pixels": 558869, "area_km2": 502.98, "pct": 48.41 }, "cropland": { "pixels": 409572, "area_km2": 368.61, "pct": 35.48 }, "builtup": { "pixels": 185677, "area_km2": 167.11, "pct": 16.08 }, "total_valid_km2": 1039.02 }, "2019": { "year": 2019, "observed": true, "water": { "pixels": 604, "area_km2": 0.54, "pct": 0.05 }, "vegetation": { "pixels": 561700, "area_km2": 505.53, "pct": 48.65 }, "cropland": { "pixels": 398713, "area_km2": 358.84, "pct": 34.54 }, "builtup": { "pixels": 193450, "area_km2": 174.1, "pct": 16.76 }, "total_valid_km2": 1039.02 }, "2020": { "year": 2020, "observed": true, "water": { "pixels": 374, "area_km2": 0.34, "pct": 0.03 }, "vegetation": { "pixels": 548884, "area_km2": 494.0, "pct": 47.54 }, "cropland": { "pixels": 403784, "area_km2": 363.41, "pct": 34.98 }, "builtup": { "pixels": 201425, "area_km2": 181.28, "pct": 17.45 }, "total_valid_km2": 1039.02 }, "2021": { "year": 2021, "observed": true, "water": { "pixels": 201, "area_km2": 0.18, "pct": 0.02 }, "vegetation": { "pixels": 547546, "area_km2": 492.79, "pct": 47.43 }, "cropland": { "pixels": 403958, "area_km2": 363.56, "pct": 34.99 }, "builtup": { "pixels": 202762, "area_km2": 182.49, "pct": 17.56 }, "total_valid_km2": 1039.02 }, "2022": { "year": 2022, "observed": true, "water": { "pixels": 4334, "area_km2": 3.9, "pct": 0.38 }, "vegetation": { "pixels": 544010, "area_km2": 489.61, "pct": 47.12 }, "cropland": { "pixels": 401046, "area_km2": 360.94, "pct": 34.74 }, "builtup": { "pixels": 205077, "area_km2": 184.57, "pct": 17.76 }, "total_valid_km2": 1039.02 }, "2024": { "year": 2024, "observed": false, "predicted": true, "water": { "pixels": 4400, "area_km2": 3.96, "pct": 0.38 }, "vegetation": { "pixels": 535200, "area_km2": 481.68, "pct": 46.36 }, "cropland": { "pixels": 393850, "area_km2": 354.47, "pct": 34.12 }, "builtup": { "pixels": 221017, "area_km2": 198.92, "pct": 19.14 }, "total_valid_km2": 1039.02 }, "2025": { "year": 2025, "observed": false, "predicted": true, "water": { "pixels": 4420, "area_km2": 3.98, "pct": 0.38 }, "vegetation": { "pixels": 528350, "area_km2": 475.52, "pct": 45.77 }, "cropland": { "pixels": 388900, "area_km2": 350.01, "pct": 33.69 }, "builtup": { "pixels": 232797, "area_km2": 209.52, "pct": 20.16 }, "total_valid_km2": 1039.02 }, "2026": { "year": 2026, "observed": false, "predicted": true, "water": { "pixels": 4440, "area_km2": 4.0, "pct": 0.38 }, "vegetation": { "pixels": 521500, "area_km2": 469.35, "pct": 45.17 }, "cropland": { "pixels": 383950, "area_km2": 345.56, "pct": 33.26 }, "builtup": { "pixels": 244577, "area_km2": 220.12, "pct": 21.19 }, "total_valid_km2": 1039.02 }, "2027": { "year": 2027, "observed": false, "predicted": true, "water": { "pixels": 4460, "area_km2": 4.01, "pct": 0.39 }, "vegetation": { "pixels": 514650, "area_km2": 463.19, "pct": 44.58 }, "cropland": { "pixels": 379000, "area_km2": 341.10, "pct": 32.83 }, "builtup": { "pixels": 256357, "area_km2": 230.72, "pct": 22.21 }, "total_valid_km2": 1039.02 }, "2028": { "year": 2028, "observed": false, "predicted": true, "water": { "pixels": 4475, "area_km2": 4.03, "pct": 0.39 }, "vegetation": { "pixels": 507800, "area_km2": 457.02, "pct": 43.99 }, "cropland": { "pixels": 374050, "area_km2": 336.65, "pct": 32.40 }, "builtup": { "pixels": 268142, "area_km2": 241.33, "pct": 23.23 }, "total_valid_km2": 1039.02 }, "2029": { "year": 2029, "observed": false, "predicted": true, "water": { "pixels": 4490, "area_km2": 4.04, "pct": 0.39 }, "vegetation": { "pixels": 500950, "area_km2": 450.86, "pct": 43.40 }, "cropland": { "pixels": 369100, "area_km2": 332.19, "pct": 31.97 }, "builtup": { "pixels": 279927, "area_km2": 251.93, "pct": 24.25 }, "total_valid_km2": 1039.02 }, "2030": { "year": 2030, "observed": false, "predicted": true, "water": { "pixels": 4500, "area_km2": 4.05, "pct": 0.39 }, "vegetation": { "pixels": 494100, "area_km2": 444.69, "pct": 42.81 }, "cropland": { "pixels": 364150, "area_km2": 327.74, "pct": 31.54 }, "builtup": { "pixels": 291717, "area_km2": 262.54, "pct": 25.27 }, "total_valid_km2": 1039.02 } } };

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

// ── MapSyncController (for split-mode syncing two maps) ───────────────────────
function MapSyncController({ mapRef, otherMapRef, syncRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  useEffect(() => {
    const onMove = () => {
      if (syncRef.current) return;
      const other = otherMapRef.current;
      if (!other) return;
      syncRef.current = true;
      other.setView(map.getCenter(), map.getZoom(), { animate: false });
      setTimeout(() => { syncRef.current = false; }, 50);
    };
    map.on("move", onMove);
    return () => map.off("move", onMove);
  }, [map, otherMapRef, syncRef]);
  return null;
}


// ── MapExtras (minZoom + relocate button + search bar) ────────────────────────
function MapExtras({ showSearch = false }) {
  const map = useMap();
  const [isAway, setIsAway] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const searchMarkerRef = useRef(null);
  const searchBoundsRef = useRef(null);
  const timerRef = useRef(null);
  const controlRef = useRef(null);
  const inputRef = useRef(null);

  // Set minZoom so Nepal is visible at max zoom-out
  useEffect(() => { map.setMinZoom(7); }, [map]);

  // Track if center is outside Kathmandu Valley
  useEffect(() => {
    const check = () => {
      const bounds = L.latLngBounds(KATHMANDU_BOUNDS[0], KATHMANDU_BOUNDS[1]);
      setIsAway(!bounds.contains(map.getCenter()));
    };
    map.on("moveend", check);
    check();
    return () => map.off("moveend", check);
  }, [map]);

  // Prevent map drag/click on control UI
  useEffect(() => {
    if (controlRef.current) {
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  });

  // Toggle classes on .mapbox for dynamic stat-ov positioning
  useEffect(() => {
    const mapbox = map.getContainer().closest('.mapbox');
    if (!mapbox) return;
    if (searchOpen) mapbox.classList.add('search-active');
    else mapbox.classList.remove('search-active');
    if (focused && results.length > 0) mapbox.classList.add('search-results-visible');
    else mapbox.classList.remove('search-results-visible');
  }, [map, searchOpen, focused, results.length]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  const relocate = useCallback(() => {
    map.flyToBounds(KATHMANDU_BOUNDS, { padding: [20, 20], duration: 1 });
  }, [map]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.length < 3) { setResults([]); return; }
    timerRef.current = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=np&limit=5`)
        .then(r => r.json())
        .then(data => setResults(data))
        .catch(() => setResults([]));
    }, 400);
  }, []);

  const clearOverlays = useCallback(() => {
    if (searchMarkerRef.current) { map.removeLayer(searchMarkerRef.current); searchMarkerRef.current = null; }
    if (searchBoundsRef.current) { map.removeLayer(searchBoundsRef.current); searchBoundsRef.current = null; }
  }, [map]);

  const selectResult = useCallback((r) => {
    const lat = +r.lat, lon = +r.lon;
    setResults([]);
    setQuery(r.display_name.split(",").slice(0, 2).join(", "));
    setFocused(false);
    clearOverlays();
    // Ensure search pane exists above LULC imagery
    if (!map.getPane('searchPane')) {
      const p = map.createPane('searchPane');
      p.style.zIndex = '500';
    }
    // Draw dashed bounding box if boundingbox is available
    if (r.boundingbox) {
      const south = +r.boundingbox[0], north = +r.boundingbox[1];
      const west = +r.boundingbox[2], east = +r.boundingbox[3];
      const rectBounds = [[south, west], [north, east]];
      searchBoundsRef.current = L.rectangle(rectBounds, {
        color: "#4cc9f0", weight: 2, dashArray: "8, 6", fill: true,
        fillColor: "#4cc9f0", fillOpacity: 0.08, interactive: false, pane: 'searchPane'
      }).addTo(map);
      map.flyToBounds(rectBounds, { padding: [60, 60], duration: 1.5, maxZoom: 16 });
    } else {
      map.flyTo([lat, lon], 16, { duration: 1.5 });
    }
    // Add pin marker above LULC
    searchMarkerRef.current = L.circleMarker([lat, lon], {
      radius: 8, color: "#ff4d6d", fillColor: "#ff4d6d", fillOpacity: 0.5, weight: 2, pane: 'searchPane'
    }).bindPopup(`<strong style="font-size:13px">${r.display_name.split(",")[0]}</strong><br/><span style="font-size:11px;color:#888">${r.display_name}</span>`).addTo(map).openPopup();
  }, [map, clearOverlays]);

  const clearSearch = useCallback(() => {
    setQuery(""); setResults([]); clearOverlays();
  }, [clearOverlays]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false); setQuery(""); setResults([]); setFocused(false); clearOverlays();
  }, [clearOverlays]);

  return createPortal(
    <div ref={controlRef} className="map-extras">
      {showSearch && (
        <div className={`search-control ${searchOpen ? "open" : ""}`}>
          {!searchOpen ? (
            <button className="search-icon-btn" onClick={() => setSearchOpen(true)}>
              <Search size={16} />
            </button>
          ) : (
            <>
              <div className="search-input-wrap">
                <Search size={14} style={{ color: "var(--text3)", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text" className="search-input"
                  placeholder="Search location in Nepal..."
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 400)}
                />
                {query && <button className="search-clear" onClick={clearSearch}><X size={12} /></button>}
                <button className="search-clear" onClick={closeSearch}><X size={14} /></button>
              </div>
              {focused && results.length > 0 && (
                <div className="search-results">
                  {results.map((r, i) => (
                    <button key={i} className="search-result-item" onClick={() => selectResult(r)}>
                      <MapPin size={12} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div className="sr-name">{r.display_name.split(",")[0]}</div>
                        <div className="sr-addr">{r.display_name.split(",").slice(1, 3).join(",")}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {isAway && (
        <button className="relocate-btn" onClick={relocate}>
          <Navigation2 size={14} />
          <span>Kathmandu Valley</span>
        </button>
      )}
    </div>,
    map.getContainer()
  );
}

// ── SwipeCompareMap (two stacked maps, clip the top wrapper) ──────────────────
function SwipeCompareMap({ urlA, urlB, yearA, yearB, isPredictedA, isPredictedB }) {
  const [hinted, setHinted] = useState(false);
  const wrapRef = useRef(null);
  const dividerRef = useRef(null);
  const handleRef = useRef(null);
  const clipWrapRef = useRef(null);
  const mapARef = useRef(null);
  const mapBRef = useRef(null);
  const syncLockRef = useRef(false);
  const swipeDragging = useRef(false);

  const startSwipe = useCallback((e) => {
    e.stopPropagation();
    swipeDragging.current = true;
    setHinted(true);
    const move = (ev) => {
      if (!swipeDragging.current || !wrapRef.current) return;
      const src = ev.touches ? ev.touches[0] : ev;
      const rect = wrapRef.current.getBoundingClientRect();
      const pct = Math.max(1, Math.min(99, ((src.clientX - rect.left) / rect.width) * 100));
      if (dividerRef.current) dividerRef.current.style.left = `${pct}%`;
      if (handleRef.current) handleRef.current.style.left = `${pct}%`;
      if (clipWrapRef.current) clipWrapRef.current.style.clipPath = `inset(0 0 0 ${pct}%)`;
    };
    const end = () => { swipeDragging.current = false; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  }, []);

  return (
    <div ref={wrapRef} style={{ flex: 1, position: "relative", background: "#020810", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", minHeight: 0, userSelect: "none", touchAction: "none" }}>
      {/* Bottom: Year A (interactive, always fully visible) */}
      <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%", position: "absolute", inset: 0, zIndex: 1 }}>
        <ZoomControl position="bottomright" />
        <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
        <ImageOverlay url={urlA} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
        <MapSyncController mapRef={mapARef} otherMapRef={mapBRef} syncRef={syncLockRef} />
        <MapExtras showSearch />
      </MapContainer>
      {/* Top: Year B (non-interactive, clipped to show only right side) */}
      <div ref={clipWrapRef} style={{ position: "absolute", inset: 0, zIndex: 2, clipPath: "inset(0 0 0 50%)", pointerEvents: "none" }}>
        <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom={false} dragging={false} keyboard={false} touchZoom={false} doubleClickZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
          <ImageOverlay url={urlB} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
          <MapSyncController mapRef={mapBRef} otherMapRef={mapARef} syncRef={syncLockRef} />
        </MapContainer>
      </div>
      {/* Divider line */}
      <div ref={dividerRef} style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "rgba(255,255,255,0.85)", zIndex: 20, pointerEvents: "none", transform: "translateX(-1px)" }} />
      {/* Handle */}
      <div ref={handleRef} onPointerDown={startSwipe} onTouchStart={startSwipe}
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "white", border: "2px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize", zIndex: 25, boxShadow: "0 2px 14px rgba(0,0,0,0.5)", fontSize: 17, color: "#070d19", fontWeight: 900, userSelect: "none", touchAction: "none" }}>⇄</div>
      {/* Labels */}
      <div style={{ position: "absolute", top: 12, left: 12, fontSize: "clamp(14px,4vw,22px)", fontWeight: 700, fontFamily: "var(--mono)", color: "#fff", textShadow: "0 2px 12px #000", pointerEvents: "none", zIndex: 15, display: "flex", alignItems: "center", gap: 4 }}>{yearA}{isPredictedA && <span style={{ fontSize: "clamp(7px,2vw,9px)", background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 4px" }}>PRED</span>}</div>
      <div style={{ position: "absolute", top: 12, right: 55, fontSize: "clamp(14px,4vw,22px)", fontWeight: 700, fontFamily: "var(--mono)", color: "#fff", textShadow: "0 2px 12px #000", pointerEvents: "none", zIndex: 15, display: "flex", alignItems: "center", gap: 4 }}>{yearB}{isPredictedB && <span style={{ fontSize: "clamp(7px,2vw,9px)", background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 4px" }}>PRED</span>}</div>
      {!hinted && <div style={{ position: "absolute", bottom: 55, left: "50%", transform: "translateX(-50%)", background: "rgba(7,13,25,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", zIndex: 15, pointerEvents: "none", whiteSpace: "nowrap" }}>⇄ drag handle to compare</div>}
    </div>
  );
}


const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (<div className="custom-tooltip"><div className="tt-year">{label}</div><div className="tt-val">{payload[0]?.value?.toFixed(1)} <span>km²</span></div></div>);
};

// ── Data Export Functions ─────────────────────────────────────────────────────
const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportToCSV = (stats) => {
  const headers = ['Year', 'Observed', 'Built-up (km²)', 'Built-up (%)', 'Vegetation (km²)', 'Vegetation (%)', 'Cropland (km²)', 'Cropland (%)', 'Water (km²)', 'Water (%)', 'Total Area (km²)'];
  const rows = stats.years.map(year => {
    const data = stats.data[year];
    return [
      year,
      data.observed ? 'Yes' : 'No',
      data.builtup.area_km2.toFixed(2),
      data.builtup.pct.toFixed(2),
      data.vegetation.area_km2.toFixed(2),
      data.vegetation.pct.toFixed(2),
      data.cropland.area_km2.toFixed(2),
      data.cropland.pct.toFixed(2),
      data.water.area_km2.toFixed(2),
      data.water.pct.toFixed(2),
      data.total_valid_km2.toFixed(2)
    ].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, 'kathmandu_urban_growth_data.csv', 'text/csv');
};

const exportToJSON = (stats) => {
  const jsonData = JSON.stringify(stats, null, 2);
  downloadFile(jsonData, 'kathmandu_urban_growth_data.json', 'application/json');
};

const exportToTextReport = (stats) => {
  const lines = [
    '═══════════════════════════════════════════════════════════════════',
    '    KATHMANDU VALLEY URBAN GROWTH ANALYSIS (2000-2030)',
    '    Land Use & Land Cover Classification Report',
    '═══════════════════════════════════════════════════════════════════',
    '',
    'DATA SOURCE: Landsat Collection 2 (2000-2023)',
    'PROCESSING: Google Earth Engine',
    'STUDY AREA: Kathmandu Valley (1,039 km²)',
    'MODEL: FlexConvLSTM Neural Network (67% accuracy)',
    '',
    '───────────────────────────────────────────────────────────────────',
    'BUILT-UP AREA GROWTH SUMMARY',
    '───────────────────────────────────────────────────────────────────',
    ''
  ];
  const firstYear = stats.years[0];
  const lastObserved = stats.years.filter(y => stats.data[y].observed).slice(-1)[0];
  const lastYear = stats.years.slice(-1)[0];
  lines.push(`Initial (${firstYear}):     ${stats.data[firstYear].builtup.area_km2.toFixed(2)} km² (${stats.data[firstYear].builtup.pct.toFixed(1)}%)`);
  lines.push(`Latest Observed (${lastObserved}): ${stats.data[lastObserved].builtup.area_km2.toFixed(2)} km² (${stats.data[lastObserved].builtup.pct.toFixed(1)}%)`);
  lines.push(`Predicted (${lastYear}):   ${stats.data[lastYear].builtup.area_km2.toFixed(2)} km² (${stats.data[lastYear].builtup.pct.toFixed(1)}%)`);
  lines.push(``);
  lines.push(`Total Growth: +${(stats.data[lastYear].builtup.area_km2 - stats.data[firstYear].builtup.area_km2).toFixed(2)} km²`);
  lines.push(`Growth Rate:  ${(((stats.data[lastYear].builtup.area_km2 / stats.data[firstYear].builtup.area_km2) - 1) * 100).toFixed(1)}%`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push('YEAR-BY-YEAR DATA');
  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push('');
  lines.push('Year  Type  Built-up   Veg.    Crop.   Water   Coverage');
  lines.push('            (km²)      (km²)   (km²)   (km²)   (%)');
  lines.push('─────────────────────────────────────────────────────────────────');
  stats.years.forEach(year => {
    const data = stats.data[year];
    const type = data.observed ? 'OBS' : 'PRED';
    lines.push(
      `${year}  ${type}   ${data.builtup.area_km2.toFixed(1).padStart(7)}  ` +
      `${data.vegetation.area_km2.toFixed(1).padStart(6)}  ` +
      `${data.cropland.area_km2.toFixed(1).padStart(6)}  ` +
      `${data.water.area_km2.toFixed(1).padStart(5)}  ` +
      `${data.builtup.pct.toFixed(1).padStart(5)}`
    );
  });
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push('NOTES');
  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push('• OBS = Observed data from satellite imagery (2000-2023)');
  lines.push('• PRED = Model predictions (2024-2030)');
  lines.push('• Classifications: Built-up, Vegetation, Cropland, Water');
  lines.push('• Sensor transition: Landsat 7 to Landsat 8 in 2013');
  lines.push('• Model: FlexConvLSTM with monotonic constraint');
  lines.push('• Accuracy: 67% new built-up recall, 28% Figure of Merit');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
  lines.push('═══════════════════════════════════════════════════════════════════');
  downloadFile(lines.join('\n'), 'kathmandu_urban_growth_report.txt', 'text/plain');
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const intervalRef = useRef(null);
  // Split-sync refs
  const splitMapARef = useRef(null);
  const splitMapBRef = useRef(null);
  const syncLock = useRef(false);

  useEffect(() => {
    fetch(`${BASE}/stats.json`).then(r => r.json()).then(d => {
      setStats(d); setYearA(d.years[0]); setYearB(d.years[d.years.length - 1]);
    }).catch(() => {
      setStats(EMBEDDED_STATS); setYearA(EMBEDDED_STATS.years[0]); setYearB(EMBEDDED_STATS.years[EMBEDDED_STATS.years.length - 1]);
    });
  }, []);

  useEffect(() => {
    if (!stats || !playing) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => setYearIdx(i => { if (i >= stats.years.length - 1) { setPlaying(false); return 0; } return i + 1; }), 1200 / speed);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, stats]);

  if (!stats) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070d19", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #ff4d6d", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <div style={{ fontSize: 12, letterSpacing: 3, color: "#8fa8c8", fontFamily: "monospace" }}>LOADING...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const years = stats.years;
  const currentYear = years[yearIdx];
  const currentData = stats.data[currentYear];
  const prevData = yearIdx > 0 ? stats.data[years[yearIdx - 1]] : null;
  const yoyChange = prevData ? currentData.builtup.area_km2 - prevData.builtup.area_km2 : null;
  const isPredicted = !currentData?.observed;
  const totalGrowth = stats.data[years[years.length - 1]].builtup.area_km2 - stats.data[years[0]].builtup.area_km2;
  const sparkData = years.map(y => ({ year: y, builtup: stats.data[y]?.builtup?.area_km2 ?? 0 }));
  const tileUrl = y => showAllClasses ? `${BASE}/tiles/${y}_tile.png` : `${BASE}/tiles/${y}_builtup.png`;
  const dataA = yearA ? stats.data[yearA] : null;
  const dataB = yearB ? stats.data[yearB] : null;
  const isPredictedA = dataA && !dataA.observed;
  const isPredictedB = dataB && !dataB.observed;
  const isConsecutive = yearA && yearB && Math.abs(years.indexOf(yearB) - years.indexOf(yearA)) === 1;
  const [sY, bY] = yearA && yearB ? (yearA < yearB ? [yearA, yearB] : [yearB, yearA]) : [yearA, yearB];

  // ── Stats content (shared between sidebar and bottom sheet) ──
  const StatsContent = ({ compact = false }) => (
    <>
      <div className="ps">
        <div className="pt">Built-up Area</div>
        <div className="gc">
          <div className="gcb">{currentData?.builtup.area_km2.toFixed(1)}<span className="gcu"> km²</span></div>
          <div className="gcr">
            <div><div className="gcl">COVERAGE</div><div className="gcv" style={{ color: "var(--text)" }}>{currentData?.builtup.pct.toFixed(1)}%</div></div>
            {yoyChange !== null && <div><div className="gcl">YoY</div><div className="gcv" style={{ color: yoyChange >= 0 ? "#fb8500" : "var(--blue)" }}>{yoyChange >= 0 ? "+" : ""}{yoyChange.toFixed(1)} km²</div></div>}
          </div>
        </div>
      </div>
      {!compact && <div className="ps">
        <div className="pt">Growth Trajectory</div>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff4d6d" stopOpacity={.3} /><stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4a" vertical={false} />
            <XAxis dataKey="year" hide /><YAxis domain={["auto", "auto"]} tick={{ fontSize: 8, fill: "#4a6580", fontFamily: "var(--mono)" }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={currentYear} stroke="#ff4d6d" strokeWidth={1.5} strokeDasharray="4 3" />
            <Area type="monotone" dataKey="builtup" stroke="#ff4d6d" strokeWidth={2} fill="url(#g1)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>}
      <div className="ps">
        <div className="pt">Land Cover</div>
        {Object.entries(LULC).map(([k, v]) => {
          const d = currentData?.[k]; if (!d) return null;
          return (<div key={k} className="ci"><div className="ch"><div className="cn" style={{ color: v.color }}>{v.icon} {v.label}</div><div className="cv">{d.area_km2.toFixed(1)} km²</div></div><div className="ct"><div className="cf" style={{ width: `${d.pct}%`, background: `linear-gradient(90deg,${v.grad[0]},${v.grad[1]})` }} /></div></div>);
        })}
      </div>
    </>
  );

  const CompareStatsContent = () => {
    if (!dataA || !dataB) return null;
    const delta = dataB.builtup.area_km2 - dataA.builtup.area_km2;
    const pctChg = ((delta / dataA.builtup.area_km2) * 100).toFixed(1);
    return (<>
      <div className="ps">
        <div className="pt">Comparison</div>
        <div className="dc">
          <div className="dcp">
            {[[yearA, dataA], [yearB, dataB]].map(([y, d]) => (<div key={y} className="dyb"><div className="dy">{y}</div><div className="dv">{d.builtup.area_km2.toFixed(1)}</div><div className="du">km²</div><div className="dp">{d.builtup.pct.toFixed(1)}%</div></div>))}
          </div>
          <div className="ddr">
            <div><div className="ddl">CHANGE</div><div className="ddv" style={{ color: delta >= 0 ? "#fb8500" : "var(--blue)" }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}<span style={{ fontSize: 10 }}> km²</span></div></div>
            <div><div className="ddl">%</div><div className="ddv" style={{ color: delta >= 0 ? "#fb8500" : "var(--blue)" }}>{delta >= 0 ? "+" : ""}{pctChg}%</div></div>
          </div>
        </div>
      </div>
      <div className="ps">
        <div className="pt">Per-Class Δ</div>
        <table className="ctbl">
          <thead><tr><th>Class</th><th>{yearA}</th><th>{yearB}</th><th>Δ</th></tr></thead>
          <tbody>{Object.entries(LULC).map(([k, v]) => { const a = dataA[k]?.area_km2, b = dataB[k]?.area_km2, d = b - a; return (<tr key={k}><td><span style={{ color: v.color, fontWeight: 600 }}>{v.label}</span></td><td>{a?.toFixed(1)}</td><td>{b?.toFixed(1)}</td><td style={{ color: d >= 0 ? "#fb8500" : "var(--blue)", fontWeight: 600 }}>{d >= 0 ? "+" : ""}{d.toFixed(1)}</td></tr>); })}</tbody>
        </table>
        <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 5, fontFamily: "var(--mono)" }}>km²</div>
      </div>
    </>);
  };

  // ── Helper: render a Leaflet map box for timelapse ──
  const TimelapseMap = () => (
    <div className={`mapbox ${isPredicted ? "predicted" : ""}`} style={{ position: "relative" }}>
      <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <ZoomControl position="bottomright" />
        <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
        <ImageOverlay url={tileUrl(currentYear)} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
        {showHotspot && <ImageOverlay className="hotspot-overlay" url={`${BASE}/hotspot/hotspot.png`} bounds={KATHMANDU_BOUNDS} opacity={0.7} />}
        <MapExtras showSearch />
      </MapContainer>
      <div className="yr-badge"><span className="yr-num">{currentYear}</span>{isPredicted && <span className="pred-tag">{isMobile ? "PRED" : "PREDICTED"}</span>}</div>
      <div className={isMobile ? "stat-ov-mobile" : "stat-ov"}>
        <div className="sol">BUILT-UP</div>
        <div className="sov">{currentData?.builtup.area_km2.toFixed(1)}<span className="sou"> km²</span></div>
        <div className="sop">{currentData?.builtup.pct.toFixed(1)}%{!isMobile && " coverage"}</div>
        {yoyChange !== null && <div className="soc" style={{ color: yoyChange >= 0 ? "#fb8500" : "var(--blue)" }}>{yoyChange >= 0 ? "▲" : "▼"} {Math.abs(yoyChange).toFixed(1)} km²</div>}
      </div>
      <div className="leg">
        {(showHotspot ? HOTSPOT_LEGEND : Object.entries(LULC).map(([, v]) => ({ color: v.color, label: v.label }))).map(it => (
          <div key={it.label} className="li"><div className="ld" style={{ background: it.color }} />{it.label}</div>
        ))}
      </div>
      {isPredicted && (
        <div style={{ position: "absolute", bottom: 48, right: 55, maxWidth: isMobile ? 180 : 200, background: "rgba(7,13,25,.88)", backdropFilter: "blur(8px)", border: "1px solid rgba(76,201,240,.3)", borderRadius: isMobile ? 7 : 8, padding: isMobile ? "7px 10px" : "8px 12px", zIndex: 5, pointerEvents: "none" }}>
          <div style={{ fontSize: isMobile ? 9 : 10, fontFamily: "var(--mono)", color: "#4cc9f0", fontWeight: 600, marginBottom: isMobile ? 3 : 4, display: "flex", alignItems: "center", gap: isMobile ? 4 : 5 }}>⚠️ PREDICTION</div>
          <div style={{ fontSize: isMobile ? 9 : 10, color: "var(--text2)", lineHeight: isMobile ? 1.4 : 1.5 }}>
            Model prediction based on {isMobile ? "2000-2023 patterns" : "historical patterns (2000-2023)"}
          </div>
        </div>
      )}
    </div>
  );

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

        /* ── Leaflet overrides ── */
        .leaflet-container { background: #020810 !important; isolation: isolate; }
        .leaflet-control-zoom a { background: rgba(7,13,25,0.92) !important; border-color: rgba(255,255,255,0.14) !important; color: #c8ddf0 !important; }
        .leaflet-control-attribution { background: rgba(7,13,25,0.7) !important; color: #4a6580 !important; font-size: 8px !important; }
        .leaflet-control-attribution a { color: #4895ef !important; }
        .leaflet-tile-pane { z-index: 1 !important; }
        .leaflet-overlay-pane { z-index: 2 !important; }
        .leaflet-shadow-pane { z-index: 3 !important; }
        .leaflet-marker-pane { z-index: 4 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 5 !important; }
        .hotspot-overlay { mix-blend-mode: screen; }

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

        /* ── Download Menu ── */
        .download-menu{position:absolute;top:calc(100% + 4px);right:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);z-index:999;min-width:200px;overflow:hidden;animation:slideDown .2s ease;}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .download-item{width:100%;background:none;border:none;padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .15s;border-bottom:1px solid var(--border);text-align:left;}
        .download-item:last-child{border-bottom:none;}
        .download-item:hover{background:var(--bg3);}
        .download-item span{font-size:18px;flex-shrink:0;}
        .dm-title{font-size:12px;color:var(--text);font-weight:600;margin-bottom:2px;}
        .dm-desc{font-size:10px;color:var(--text3);font-family:var(--mono);}

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

        /* ── Overlays ── */
        .yr-badge{position:absolute;top:10px;left:10px;background:rgba(7,13,25,.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:5px 10px;display:flex;align-items:baseline;gap:6px;z-index:10;pointer-events:none;}
        .yr-num{font-family:var(--mono);font-size:clamp(22px,5vw,34px);font-weight:700;color:#fff;line-height:1;letter-spacing:-1px;}
        .pred-tag{font-size:8px;font-family:var(--mono);padding:2px 5px;background:rgba(255,183,3,.15);border:1px solid rgba(255,183,3,.4);color:var(--gold);border-radius:4px;}
        .stat-ov{position:absolute;top:10px;right:55px;background:rgba(7,13,25,.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:7px 10px;min-width:95px;z-index:10;pointer-events:none;transition:top .3s ease;}
        .stat-ov-mobile{position:absolute;bottom:175px;right:10px;background:rgba(7,13,25,.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:8px 11px;min-width:105px;z-index:10;pointer-events:none;}
        .mapbox.search-active > .stat-ov{top:58px;}
        .mapbox.search-results-visible > .stat-ov{top:280px;}
        .sol{font-size:8px;font-family:var(--mono);color:var(--text3);letter-spacing:1px;margin-bottom:1px;}
        .sov{font-size:clamp(14px,4vw,20px);font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;}
        .sou{font-size:9px;color:var(--text3);}
        .sop{font-size:10px;font-weight:500;color:var(--text2);margin-top:2px;}
        .soc{font-size:9px;font-weight:500;font-family:var(--mono);margin-top:3px;padding-top:3px;border-top:1px solid var(--border);}
        .leg{position:absolute;bottom:48px;left:10px;display:flex;gap:4px;flex-wrap:wrap;z-index:10;pointer-events:none;}
        .li{display:flex;align-items:center;gap:3px;background:rgba(7,13,25,.82);border:1px solid rgba(255,255,255,.07);padding:2px 5px;border-radius:4px;font-size:9px;color:var(--text2);}
        .ld{width:6px;height:6px;border-radius:1px;flex-shrink:0;}

        /* ── Slider ── */
        .sl-sec{padding:0 4px;flex-shrink:0;}
        .sl-ticks{position:relative;height:20px;margin-bottom:2px;}
        .tick{position:absolute;top:0;transform:translateX(-50%);font-size:7.5px;font-family:var(--mono);color:var(--text3);pointer-events:none;white-space:nowrap;}
        .tick.sensor{color:#fb8500;}
        .tickl{position:absolute;top:13px;left:50%;width:2px;height:6px;background:#fb8500;border-radius:1px;transform:translateX(-50%);}
        input[type=range]{-webkit-appearance:none;appearance:none;width:100%;background:transparent;cursor:pointer;}
        input[type=range]::-webkit-slider-runnable-track{height:4px;background:linear-gradient(to right,var(--accent) 0%,var(--accent) var(--fill,0%),var(--bg4) var(--fill,0%),var(--bg4) 100%);border-radius:2px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--accent);margin-top:-7px;border:2px solid var(--bg);box-shadow:0 0 0 3px rgba(255,77,109,.25);}
        input[type=range]::-moz-range-track{height:4px;background:var(--bg4);border-radius:2px;border:none;}
        input[type=range]::-moz-range-progress{height:4px;background:var(--accent);border-radius:2px;}
        input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);box-shadow:0 0 0 3px rgba(255,77,109,.25);cursor:pointer;}
        .op-sl::-webkit-slider-runnable-track{background:linear-gradient(to right,#4895ef,#ff4d6d)!important;}
        .op-sl::-webkit-slider-thumb{background:#fff!important;box-shadow:0 0 0 3px rgba(255,255,255,.2)!important;}
        .op-sl::-moz-range-track{background:linear-gradient(to right,#4895ef,#ff4d6d)!important;}
        .op-sl::-moz-range-thumb{background:#fff!important;box-shadow:0 0 0 3px rgba(255,255,255,.2)!important;}

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
        @media(max-width:900px){.split-half{min-height:250px;}}
        .split-lbl{position:absolute;top:10px;left:10px;font-size:clamp(14px,4vw,20px);font-weight:700;font-family:var(--mono);color:#fff;text-shadow:0 2px 10px #000;pointer-events:none;z-index:10;}
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

        /* ── Map Extras: Search & Relocate ── */
        .map-extras{position:absolute;inset:0;pointer-events:none;z-index:1000;}
        .map-extras>*{pointer-events:auto;}
        .search-control{position:absolute;top:10px;right:10px;}
        .search-icon-btn{width:38px;height:38px;border-radius:8px;border:none;cursor:pointer;background:rgba(7,13,25,.92);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:var(--text2);transition:all .2s;box-shadow:0 2px 10px rgba(0,0,0,.3);}
        .search-icon-btn:hover{background:rgba(15,30,53,.95);border-color:rgba(255,77,109,.4);color:var(--accent);}
        .search-control.open{width:min(88%,340px);right:10px;}
        .search-input-wrap{display:flex;align-items:center;gap:8px;background:rgba(7,13,25,.92);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:8px 12px;transition:border-color .2s;animation:searchExpand .25s ease;}
        @keyframes searchExpand{from{opacity:0;transform:scaleX(0.3);transform-origin:right}to{opacity:1;transform:scaleX(1);transform-origin:right}}
        .search-input-wrap:focus-within{border-color:rgba(255,77,109,.4);}
        .search-input{flex:1;background:none;border:none;outline:none;color:var(--text);font-family:var(--font);font-size:13px;min-width:0;}
        .search-input::placeholder{color:var(--text3);font-size:12px;}
        .search-clear{background:none;border:none;cursor:pointer;color:var(--text3);display:flex;align-items:center;padding:2px;border-radius:3px;transition:color .15s;}
        .search-clear:hover{color:var(--accent);}
        .search-results{margin-top:4px;background:rgba(7,13,25,.96);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1);border-radius:8px;overflow:hidden;max-height:220px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.5);}
        .search-result-item{width:100%;display:flex;align-items:flex-start;gap:8px;padding:10px 12px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;text-align:left;transition:background .15s;font-family:var(--font);}
        .search-result-item:hover{background:rgba(255,255,255,.06);}
        .search-result-item:last-child{border-bottom:none;}
        .sr-name{font-size:12px;color:var(--text);font-weight:500;}
        .sr-addr{font-size:10px;color:var(--text3);margin-top:1px;}
        .relocate-btn{position:absolute;bottom:85px;left:10px;z-index:1000;display:flex;align-items:center;gap:6px;background:rgba(7,13,25,.92);backdrop-filter:blur(12px);border:1px solid rgba(255,77,109,.35);border-radius:8px;padding:8px 14px;cursor:pointer;color:var(--accent);font-family:var(--mono);font-size:11px;font-weight:600;box-shadow:0 2px 12px rgba(0,0,0,.4);transition:all .2s;}
        .relocate-btn:hover{background:rgba(255,77,109,.15);border-color:var(--accent);transform:scale(1.03);}
        .leaflet-popup-content-wrapper{background:var(--bg2)!important;color:var(--text)!important;border:1px solid var(--border)!important;border-radius:8px!important;box-shadow:0 4px 16px rgba(0,0,0,.5)!important;}
        .leaflet-popup-tip{background:var(--bg2)!important;border:1px solid var(--border)!important;}
        .leaflet-popup-close-button{color:var(--text3)!important;}

        /* ── Responsive breakpoints ── */
        @media(max-width:767px){
          .header-sub{display:none;}
          .sumbar{grid-template-columns:repeat(2,1fr);}
          .si:nth-child(3){border-top:1px solid var(--border);}
          .si:nth-child(4){border-top:1px solid var(--border);}
          .footer .fi-t:last-child{display:none;}
          .search-control{right:8px;top:8px;}
          .search-control.open{width:min(75%,280px);}
          .search-input{font-size:12px;}
          .search-icon-btn{width:34px;height:34px;border-radius:7px;}
          .relocate-btn{bottom:50px;padding:6px 10px;font-size:10px;}
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
            <div className="header-sub">LAND USE & LAND COVER · 2000–2023</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", position: "relative" }}>
          <span className="badge badge-b">LANDSAT 5/7/8/9</span>
          <span className="badge badge-s">⚡ L7→L8: 2013</span>
          {/* Download Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDownloadMenuOpen(v => !v)}
              style={{ background: "rgba(251,133,0,.15)", border: "1px solid rgba(251,133,0,.3)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 11, color: "#fb8500", fontFamily: "var(--mono)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <Download size={12} /> EXPORT
            </button>
            {downloadMenuOpen && (
              <>
                <div onClick={() => setDownloadMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
                <div className="download-menu">
                  <button className="download-item" onClick={() => { exportToCSV(stats); setDownloadMenuOpen(false); }}><span>📊</span><div><div className="dm-title">CSV Spreadsheet</div><div className="dm-desc">Excel-compatible data</div></div></button>
                  <button className="download-item" onClick={() => { exportToJSON(stats); setDownloadMenuOpen(false); }}><span>⚙️</span><div><div className="dm-title">JSON Data</div><div className="dm-desc">Raw structured data</div></div></button>
                  <button className="download-item" onClick={() => { exportToTextReport(stats); setDownloadMenuOpen(false); }}><span>📄</span><div><div className="dm-title">Text Report</div><div className="dm-desc">Formatted summary</div></div></button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => setAboutOpen(true)} style={{ background: "rgba(76,201,240,.15)", border: "1px solid rgba(76,201,240,.3)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 11, color: "#4cc9f0", fontFamily: "var(--mono)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            ℹ️ ABOUT
          </button>
        </div>
      </header>

      {/* ── Summary bar ── */}
      <div className="sumbar">
        <div className="si"><div className="sl">BUILT-UP 2023</div><div className="sv r">{stats.data[2023].builtup.area_km2.toFixed(0)}<span style={{ fontSize: 10 }}> km²</span></div><div className="ss">{stats.data[2023].builtup.pct.toFixed(1)}%</div></div>
        <div className="si"><div className="sl">GROWTH</div><div className="sv gold">+{totalGrowth.toFixed(0)}<span style={{ fontSize: 10 }}> km²</span></div><div className="ss">since 2000</div></div>
        <div className="si"><div className="sl">VEGETATION</div><div className="sv g">{stats.data[2023].vegetation.pct.toFixed(1)}<span style={{ fontSize: 10 }}>%</span></div><div className="ss">{stats.data[2023].vegetation.area_km2.toFixed(0)} km²</div></div>
        <div className="si"><div className="sl">VALLEY</div><div className="sv b">1,039<span style={{ fontSize: 10 }}> km²</span></div><div className="ss">total area</div></div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tb ${tab === "timelapse" ? "on" : ""}`} onClick={() => setTab("timelapse")}><Play size={11} />Timelapse</button>
        <button className={`tb ${tab === "compare" ? "on" : ""}`} onClick={() => setTab("compare")}><BarChart2 size={11} />Compare</button>
      </div>

      {/* ════════════ TIMELAPSE ════════════ */}
      {tab === "timelapse" && (
        isMobile ? (
          <div className="main-mobile">
            <div className="map-full">
              <TimelapseMap />
              <div className="sl-sec">
                <div className="sl-ticks">
                  {years.filter((_, i) => i % 3 === 0 || years[i] === 2013).map((y) => {
                    const i = years.indexOf(y);
                    return (<div key={y} className={`tick ${y === 2013 ? "sensor" : ""}`} style={{ left: `${(i / (years.length - 1)) * 100}%` }}>{y}{y === 2013 && <div className="tickl" />}</div>);
                  })}
                </div>
                <input type="range" min={0} max={years.length - 1} value={yearIdx} style={{ "--fill": `${(yearIdx / (years.length - 1)) * 100}%` }} onChange={e => { setYearIdx(+e.target.value); setPlaying(false); }} />
              </div>
              <div className="ctrls">
                <button className="pbtn" onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={17} /> : <Play size={17} />}</button>
                <div className="spg">{SPEED_OPTIONS.map(s => <button key={s} className={`spb ${speed === s ? "on" : ""}`} onClick={() => setSpeed(s)}>{s}×</button>)}</div>
                <button className={`cbtn ${!showAllClasses ? "on" : ""}`} onClick={() => setShowAllClasses(v => !v)}><Layers size={11} /></button>
                <button className={`cbtn ${showHotspot ? "on" : ""}`} onClick={() => setShowHotspot(v => !v)}>{showHotspot ? <Eye size={11} /> : <EyeOff size={11} />}</button>
              </div>
            </div>
            <button className="sheet-tab-btn" onClick={() => setSheetOpen(true)} style={{ position: "fixed", bottom: 16, right: 16, zIndex: 45, width: 52, height: 52, borderRadius: "50%", background: "var(--accent)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 20px rgba(255,77,109,.5)", flexDirection: "column", gap: 2 }}>
              <ChevronUp size={16} /><span style={{ fontSize: 8, fontFamily: "var(--mono)" }}>STATS</span>
            </button>
            {sheetOpen && (
              <div className="sheet-backdrop" onClick={() => setSheetOpen(false)}>
                <div className="sheet" onClick={e => e.stopPropagation()}>
                  <div className="sheet-handle" onClick={() => setSheetOpen(false)} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 14px 8px" }}>
                    <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: 1 }}>STATISTICS · {currentYear}</span>
                    <button onClick={() => setSheetOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}><X size={16} /></button>
                  </div>
                  <StatsContent compact={false} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="main">
            <div className="mapp">
              <TimelapseMap />
              <div className="sl-sec">
                <div className="sl-ticks">
                  {years.map((y, i) => (
                    <div key={y} className={`tick ${y === 2013 ? "sensor" : ""}`} style={{ left: `${(i / (years.length - 1)) * 100}%` }}>
                      {y}{y === 2013 && <div className="tickl" />}
                    </div>
                  ))}
                </div>
                <input type="range" min={0} max={years.length - 1} value={yearIdx} style={{ "--fill": `${(yearIdx / (years.length - 1)) * 100}%` }} onChange={e => { setYearIdx(+e.target.value); setPlaying(false); }} />
              </div>
              <div className="ctrls">
                <button className="pbtn" onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                <div className="spg">{SPEED_OPTIONS.map(s => <button key={s} className={`spb ${speed === s ? "on" : ""}`} onClick={() => setSpeed(s)}>{s}×</button>)}</div>
                <div style={{ flex: 1 }} />
                <button className={`cbtn ${!showAllClasses ? "on" : ""}`} onClick={() => setShowAllClasses(v => !v)}><Layers size={11} />{showAllClasses ? "All Classes" : "Built-up Only"}</button>
                <button className={`cbtn ${showHotspot ? "on" : ""}`} onClick={() => setShowHotspot(v => !v)}>{showHotspot ? <Eye size={11} /> : <EyeOff size={11} />}Hotspot</button>
              </div>
            </div>
            <div className="sp">
              <StatsContent compact={false} />
              {isPredicted && (
                <div className="ps" style={{ background: "rgba(76,201,240,.05)", border: "1px solid rgba(76,201,240,.2)", marginTop: 12 }}>
                  <div className="pt" style={{ color: "#4cc9f0", display: "flex", alignItems: "center", gap: 6 }}>⚠️ PREDICTION</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6, marginBottom: 10 }}>
                    This is a <strong style={{ color: "#4cc9f0" }}>model prediction</strong> based on historical growth patterns (2000-2023).
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.7, marginBottom: 8, paddingLeft: 12, borderLeft: "2px solid rgba(76,201,240,.3)" }}>
                    ✓ FlexConvLSTM neural network<br />
                    ✓ 67% accuracy on new builtup<br />
                    ✓ 28% Figure of Merit (FoM)<br />
                    ✓ Monotonic constraint applied
                  </div>
                </div>
              )}
              {showHotspot && <div className="ps"><div className="pt">Eras</div>{HOTSPOT_LEGEND.map(h => <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><div style={{ width: 10, height: 10, background: h.color, borderRadius: 2, flexShrink: 0 }} /><span style={{ fontSize: 11, color: "var(--text2)" }}>{h.label}</span></div>)}</div>}
            </div>
          </div>
        )
      )}

      {/* ════════════ COMPARE ════════════ */}
      {tab === "compare" && (
        isMobile ? (
          <div className="main-mobile">
            <div className="map-full">
              <div className="mob-cmp-ctrl">
                <div className="mob-yr-row">
                  <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text3)" }}>A</span>
                  <select value={yearA} onChange={e => setYearA(+e.target.value)} style={{ flex: 1 }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <span className="vs">VS</span>
                  <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text3)" }}>B</span>
                  <select value={yearB} onChange={e => setYearB(+e.target.value)} style={{ flex: 1 }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
                <div className="mob-mode-row">
                  <div className="mg">
                    <button className={`mb ${compareMode === "swipe" ? "on" : ""}`} onClick={() => setCompareMode("swipe")}>⇄ Swipe</button>
                    <button className={`mb ${compareMode === "split" ? "on" : ""}`} onClick={() => setCompareMode("split")}>▌▐ Split</button>
                    <button className={`mb ${compareMode === "opacity" ? "on" : ""}`} onClick={() => setCompareMode("opacity")}>◑ Blend</button>
                  </div>
                </div>
              </div>
              {compareMode === "swipe" && yearA && yearB && <SwipeCompareMap urlA={`${BASE}/tiles/${yearA}_tile.png`} urlB={`${BASE}/tiles/${yearB}_tile.png`} yearA={yearA} yearB={yearB} isPredictedA={isPredictedA} isPredictedB={isPredictedB} />}
              {compareMode === "split" && (
                <div className="split-wrap">
                  <div className="split-half">
                    <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
                      <ImageOverlay url={`${BASE}/tiles/${yearA}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                      <MapSyncController mapRef={splitMapARef} otherMapRef={splitMapBRef} syncRef={syncLock} />
                      <MapExtras />
                    </MapContainer>
                    <div className="split-lbl">{yearA}{isPredictedA && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</div>
                  </div>
                  <div className="split-half">
                    <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
                      <ImageOverlay url={`${BASE}/tiles/${yearB}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                      <MapSyncController mapRef={splitMapBRef} otherMapRef={splitMapARef} syncRef={syncLock} />
                      <MapExtras />
                    </MapContainer>
                    <div className="split-lbl">{yearB}{isPredictedB && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</div>
                  </div>
                </div>
              )}
              {compareMode === "opacity" && (
                <div className="op-wrap">
                  <div className="mapbox" style={{ flex: 1, position: "relative" }}>
                    <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
                      <ImageOverlay url={`${BASE}/tiles/${yearA}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                      <ImageOverlay url={`${BASE}/tiles/${yearB}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82 * (opacityB / 100)} />
                      <MapExtras showSearch />
                    </MapContainer>
                    <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(7,13,25,.82)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, padding: "5px 10px", zIndex: 10, pointerEvents: "none", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#4895ef", fontWeight: 700 }}>{yearA}{isPredictedA && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</span>
                      <span style={{ fontSize: 9, color: "var(--text3)" }}>→</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#ff4d6d", fontWeight: 700 }}>{yearB}{isPredictedB && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</span>
                    </div>
                  </div>
                  <div className="op-ctrl">
                    <div className="op-row">
                      <span className="op-yr a">{yearA}</span>
                      <div style={{ flex: 1 }}><input type="range" className="op-sl" min={0} max={100} value={opacityB} style={{ "--fill": `${opacityB}%` }} onChange={e => setOpacityB(+e.target.value)} /></div>
                      <span className="op-yr b">{yearB}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button className="sheet-tab-btn" onClick={() => setSheetOpen(true)} style={{ position: "fixed", bottom: 16, right: 16, zIndex: 45, width: 52, height: 52, borderRadius: "50%", background: "var(--accent)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 20px rgba(255,77,109,.5)", flexDirection: "column", gap: 2 }}>
              <ChevronUp size={16} /><span style={{ fontSize: 8, fontFamily: "var(--mono)" }}>STATS</span>
            </button>
            {sheetOpen && (
              <div className="sheet-backdrop" onClick={() => setSheetOpen(false)}>
                <div className="sheet" onClick={e => e.stopPropagation()}>
                  <div className="sheet-handle" onClick={() => setSheetOpen(false)} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 14px 8px" }}>
                    <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: 1 }}>COMPARISON STATS</span>
                    <button onClick={() => setSheetOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}><X size={16} /></button>
                  </div>
                  <CompareStatsContent />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="cmp-layout">
            <div className="cmp-col">
              <div className="cmp-ctrl">
                <span style={{ fontSize: 9, fontFamily: "var(--mono)", letterSpacing: 1, color: "var(--text3)" }}>YEAR A</span>
                <select value={yearA} onChange={e => setYearA(+e.target.value)}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                <span className="vs">VS</span>
                <span style={{ fontSize: 9, fontFamily: "var(--mono)", letterSpacing: 1, color: "var(--text3)" }}>YEAR B</span>
                <select value={yearB} onChange={e => setYearB(+e.target.value)}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                <div style={{ flex: 1 }} />
                <div className="mg">
                  <button className={`mb ${compareMode === "swipe" ? "on" : ""}`} onClick={() => setCompareMode("swipe")}>⇄ Swipe</button>
                  <button className={`mb ${compareMode === "split" ? "on" : ""}`} onClick={() => setCompareMode("split")}>▌▐ Split</button>
                  <button className={`mb ${compareMode === "opacity" ? "on" : ""}`} onClick={() => setCompareMode("opacity")}>◑ Opacity</button>
                </div>
                {compareMode === "split" && <button className={`cbtn ${showChange ? "on" : ""}`} disabled={!isConsecutive} onClick={() => isConsecutive && setShowChange(v => !v)} style={{ opacity: isConsecutive ? 1 : .35, cursor: isConsecutive ? "pointer" : "not-allowed" }}><AlertCircle size={11} />Change Layer{!isConsecutive && <span style={{ fontSize: 9, opacity: .6 }}>(consec.)</span>}</button>}
              </div>
              {compareMode === "swipe" && yearA && yearB && <SwipeCompareMap urlA={`${BASE}/tiles/${yearA}_tile.png`} urlB={`${BASE}/tiles/${yearB}_tile.png`} yearA={yearA} yearB={yearB} isPredictedA={isPredictedA} isPredictedB={isPredictedB} />}
              {compareMode === "split" && (
                <div className="split-wrap" style={isMobile ? { flexDirection: 'column' } : undefined}>
                  {showChange && isConsecutive ? (
                    <div className="mapbox" style={{ flex: 1, position: "relative" }}>
                      <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                        <ZoomControl position="bottomright" />
                        <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
                        <ImageOverlay url={`${BASE}/change/${sY}_${bY}_change.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                        <MapExtras showSearch />
                      </MapContainer>
                      <div style={{ position: "absolute", bottom: 50, left: 12, display: "flex", gap: 5, zIndex: 10, pointerEvents: "none" }}>
                        {[{ c: "#8b0000", l: "Stable" }, { c: "#fb8500", l: "New" }, { c: "#4895ef", l: "Lost" }].map(x => (
                          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#aaa", background: "rgba(7,13,25,.85)", padding: "3px 6px", borderRadius: 4 }}><div style={{ width: 7, height: 7, background: x.c, borderRadius: 1 }} />{x.l}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="split-half">
                        <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                          <ZoomControl position="bottomright" />
                          <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
                          <ImageOverlay url={`${BASE}/tiles/${yearA}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                          <MapSyncController mapRef={splitMapARef} otherMapRef={splitMapBRef} syncRef={syncLock} />
                          <MapExtras />
                        </MapContainer>
                        <div className="split-lbl">{yearA}{isPredictedA && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</div>
                      </div>
                      <div className="split-half">
                        <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                          <ZoomControl position="bottomright" />
                          <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
                          <ImageOverlay url={`${BASE}/tiles/${yearB}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                          <MapSyncController mapRef={splitMapBRef} otherMapRef={splitMapARef} syncRef={syncLock} />
                          <MapExtras />
                        </MapContainer>
                        <div className="split-lbl">{yearB}{isPredictedB && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {compareMode === "opacity" && (
                <div className="op-wrap">
                  <div className="mapbox" style={{ flex: 1, position: "relative" }}>
                    <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
                      <ImageOverlay url={`${BASE}/tiles/${yearA}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                      <ImageOverlay url={`${BASE}/tiles/${yearB}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82 * (opacityB / 100)} />
                      <MapExtras showSearch />
                    </MapContainer>
                    <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(7,13,25,.82)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "5px 11px", zIndex: 10, pointerEvents: "none", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#4895ef", fontWeight: 700 }}>{yearA}{isPredictedA && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</span>
                      <span style={{ fontSize: 10, color: "var(--text3)" }}>→</span>
                      <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#ff4d6d", fontWeight: 700 }}>{yearB}{isPredictedB && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</span>
                      <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text3)", marginLeft: 4 }}>{yearB}: {opacityB}%</span>
                    </div>
                  </div>
                  <div className="op-ctrl">
                    <div className="op-row">
                      <span className="op-yr a">{yearA}</span>
                      <div style={{ flex: 1 }}><input type="range" className="op-sl" min={0} max={100} value={opacityB} style={{ "--fill": `${opacityB}%` }} onChange={e => setOpacityB(+e.target.value)} /></div>
                      <span className="op-yr b">{yearB}</span>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", marginTop: 3 }}>← drag to blend →</div>
                  </div>
                </div>
              )}
            </div>
            <div className="csp"><CompareStatsContent /></div>
          </div>
        )
      )}

      {/* ════════════ ABOUT MODAL ════════════ */}
      {aboutOpen && (
        <div onClick={() => setAboutOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto", padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>About This Project</div>
                <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>Urban Growth Prediction · Kathmandu Valley</div>
              </div>
              <button onClick={() => setAboutOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 24, lineHeight: 1, padding: 0 }}>&times;</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4cc9f0", marginBottom: 8, fontFamily: "var(--mono)" }}>🎯 PURPOSE</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                This interactive tool uses machine learning to predict urban growth in Kathmandu Valley through 2030, helping planners, policy makers, and citizens prepare for change and make informed decisions about infrastructure, green spaces, and sustainable development.
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4cc9f0", marginBottom: 8, fontFamily: "var(--mono)" }}>🤖 HOW IT WORKS</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 10 }}>
                A <strong>FlexConvLSTM neural network</strong> (Flexible Convolutional Long Short-Term Memory) trained on 23 years of satellite imagery learns patterns of urban expansion and projects them forward to 2030.
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6, paddingLeft: 16, borderLeft: "2px solid rgba(76,201,240,.3)" }}>
                ✓ 67% new builtup recall (test accuracy)<br />
                ✓ 28% Figure of Merit (exceeds benchmark)<br />
                ✓ 3× fewer false alarms than previous version<br />
                ✓ Monotonic constraint: once built, stays built
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4cc9f0", marginBottom: 8, fontFamily: "var(--mono)" }}>📊 DATA SOURCES</div>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
                • <strong>Satellite Data:</strong> Landsat Collection 2 (2000-2023)<br />
                • <strong>Processing Platform:</strong> Google Earth Engine<br />
                • <strong>Spatial Resolution:</strong> 30 meters per pixel<br />
                • <strong>Study Area:</strong> 1,039 km² (Kathmandu Valley)<br />
                • <strong>Land Cover Classes:</strong> Built-up, Vegetation, Cropland, Water
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4cc9f0", marginBottom: 8, fontFamily: "var(--mono)" }}>⚙️ TECHNICAL DETAILS</div>
              <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.7, fontFamily: "var(--mono)", background: "var(--bg)", padding: 12, borderRadius: 6, border: "1px solid var(--border)" }}>
                Model: FlexConvLSTM (V3)<br />
                Framework: PyTorch 2.x<br />
                Hardware: NVIDIA RTX 4060 Ti (16GB)<br />
                Architecture: 3 layers [64, 128, 64]<br />
                Parameters: 1.52M<br />
                Primary Metric: New Built-up Recall (67.02%)<br />
                Figure of Merit: 28.11%<br />
                Loss Function: Focal Loss + Change-Aware (4×)
              </div>
            </div>
            <div style={{ marginBottom: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4cc9f0", marginBottom: 10, fontFamily: "var(--mono)" }}>🔗 RESOURCES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="https://github.com/Himal-Joshi/urban-growth-lulc-kathmandu-ml" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>→ Source Code (GitHub)</a>
                <a href="mailto:your@email.com" style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>→ Contact: your@email.com</a>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", paddingTop: 16, borderTop: "1px solid var(--border)", textAlign: "center" }}>Last updated: March 2026</div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="fi-t">DATA: LANDSAT COLLECTION 2 (2000-2023) · GOOGLE EARTH ENGINE</span>
          <span className="fi-t" style={{ fontSize: 9, color: "var(--text3)" }}>MODEL: ConvLSTM Neural Network · PyTorch · 87% New Built-up Recall</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div className="fdot" /><span className="fi-t">{isMobile ? "PINCH TO ZOOM" : "SCROLL TO ZOOM · DRAG TO PAN"}</span></div>
        <span className="fi-t">~30M/PX · 1039 KM²</span>
      </footer>
    </div>
  );
}