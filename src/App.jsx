import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Play, AlertCircle, BarChart2, ChevronUp, X, Search, MapPin, Navigation2, Info, Plus, Minus } from "lucide-react";
import { MapContainer, TileLayer, ImageOverlay, useMap, ZoomControl } from "react-leaflet";
import GeoRasterLayerComponent from "./GeoRasterLayerComponent";
import { ChandraIcon, SuryaIcon } from "./components/icons/ThemeIcons";
import { useIsMobile } from "./hooks/useIsMobile";
import ExportPanel from "./components/ExportPanel";
import ControlPanel from "./components/ControlPanel";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE = "/urban-growth-lulc-kathmandu-ml/data";
const KATHMANDU_BOUNDS = [[27.3837, 85.1690], [27.8247, 85.5750]];
const KATHMANDU_CENTER = [27.6042, 85.3720];
const DEFAULT_ZOOM = 11;
const CARTO_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
const CARTO_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

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

const EMBEDDED_STATS = { "years": [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2024, 2025, 2026, 2027, 2028, 2029, 2030], "data": { "2000": { "year": 2000, "observed": true, "water": { "pixels": 591, "area_km2": 0.53, "pct": 0.05 }, "vegetation": { "pixels": 526634, "area_km2": 473.97, "pct": 45.62 }, "cropland": { "pixels": 523286, "area_km2": 470.96, "pct": 45.33 }, "builtup": { "pixels": 103956, "area_km2": 93.56, "pct": 9.0 }, "total_valid_km2": 1039.02 }, "2001": { "year": 2001, "observed": true, "water": { "pixels": 744, "area_km2": 0.67, "pct": 0.06 }, "vegetation": { "pixels": 533946, "area_km2": 480.55, "pct": 46.25 }, "cropland": { "pixels": 525006, "area_km2": 472.51, "pct": 45.48 }, "builtup": { "pixels": 94771, "area_km2": 85.29, "pct": 8.21 }, "total_valid_km2": 1039.02 }, "2002": { "year": 2002, "observed": true, "water": { "pixels": 890, "area_km2": 0.8, "pct": 0.08 }, "vegetation": { "pixels": 544308, "area_km2": 489.88, "pct": 47.15 }, "cropland": { "pixels": 518127, "area_km2": 466.31, "pct": 44.88 }, "builtup": { "pixels": 91142, "area_km2": 82.03, "pct": 7.89 }, "total_valid_km2": 1039.02 }, "2003": { "year": 2003, "observed": true, "water": { "pixels": 972, "area_km2": 0.87, "pct": 0.08 }, "vegetation": { "pixels": 561115, "area_km2": 505.0, "pct": 48.6 }, "cropland": { "pixels": 498405, "area_km2": 448.56, "pct": 43.17 }, "builtup": { "pixels": 93975, "area_km2": 84.58, "pct": 8.14 }, "total_valid_km2": 1039.02 }, "2004": { "year": 2004, "observed": true, "water": { "pixels": 982, "area_km2": 0.88, "pct": 0.09 }, "vegetation": { "pixels": 578782, "area_km2": 520.9, "pct": 50.13 }, "cropland": { "pixels": 475396, "area_km2": 427.86, "pct": 41.18 }, "builtup": { "pixels": 99307, "area_km2": 89.38, "pct": 8.6 }, "total_valid_km2": 1039.02 }, "2005": { "year": 2005, "observed": true, "water": { "pixels": 1013, "area_km2": 0.91, "pct": 0.09 }, "vegetation": { "pixels": 590334, "area_km2": 531.3, "pct": 51.13 }, "cropland": { "pixels": 459666, "area_km2": 413.7, "pct": 39.82 }, "builtup": { "pixels": 103454, "area_km2": 93.11, "pct": 8.96 }, "total_valid_km2": 1039.02 }, "2006": { "year": 2006, "observed": true, "water": { "pixels": 960, "area_km2": 0.86, "pct": 0.08 }, "vegetation": { "pixels": 593323, "area_km2": 533.99, "pct": 51.39 }, "cropland": { "pixels": 454096, "area_km2": 408.69, "pct": 39.33 }, "builtup": { "pixels": 106088, "area_km2": 95.48, "pct": 9.19 }, "total_valid_km2": 1039.02 }, "2007": { "year": 2007, "observed": true, "water": { "pixels": 852, "area_km2": 0.77, "pct": 0.07 }, "vegetation": { "pixels": 588067, "area_km2": 529.26, "pct": 50.94 }, "cropland": { "pixels": 456716, "area_km2": 411.04, "pct": 39.56 }, "builtup": { "pixels": 108832, "area_km2": 97.95, "pct": 9.43 }, "total_valid_km2": 1039.02 }, "2008": { "year": 2008, "observed": true, "water": { "pixels": 711, "area_km2": 0.64, "pct": 0.06 }, "vegetation": { "pixels": 583399, "area_km2": 525.06, "pct": 50.53 }, "cropland": { "pixels": 457738, "area_km2": 411.96, "pct": 39.65 }, "builtup": { "pixels": 112619, "area_km2": 101.36, "pct": 9.76 }, "total_valid_km2": 1039.02 }, "2009": { "year": 2009, "observed": true, "water": { "pixels": 567, "area_km2": 0.51, "pct": 0.05 }, "vegetation": { "pixels": 575457, "area_km2": 517.91, "pct": 49.85 }, "cropland": { "pixels": 461015, "area_km2": 414.91, "pct": 39.93 }, "builtup": { "pixels": 117428, "area_km2": 105.69, "pct": 10.17 }, "total_valid_km2": 1039.02 }, "2010": { "year": 2010, "observed": true, "water": { "pixels": 479, "area_km2": 0.43, "pct": 0.04 }, "vegetation": { "pixels": 572950, "area_km2": 515.65, "pct": 49.63 }, "cropland": { "pixels": 459010, "area_km2": 413.11, "pct": 39.76 }, "builtup": { "pixels": 122028, "area_km2": 109.83, "pct": 10.57 }, "total_valid_km2": 1039.02 }, "2011": { "year": 2011, "observed": true, "water": { "pixels": 352, "area_km2": 0.32, "pct": 0.03 }, "vegetation": { "pixels": 569727, "area_km2": 512.75, "pct": 49.35 }, "cropland": { "pixels": 458910, "area_km2": 413.02, "pct": 39.75 }, "builtup": { "pixels": 125478, "area_km2": 112.93, "pct": 10.87 }, "total_valid_km2": 1039.02 }, "2013": { "year": 2013, "observed": true, "water": { "pixels": 262, "area_km2": 0.24, "pct": 0.02 }, "vegetation": { "pixels": 560748, "area_km2": 504.67, "pct": 48.57 }, "cropland": { "pixels": 465141, "area_km2": 418.63, "pct": 40.29 }, "builtup": { "pixels": 128316, "area_km2": 115.48, "pct": 11.11 }, "total_valid_km2": 1039.02 }, "2014": { "year": 2014, "observed": true, "water": { "pixels": 240, "area_km2": 0.22, "pct": 0.02 }, "vegetation": { "pixels": 559811, "area_km2": 503.83, "pct": 48.49 }, "cropland": { "pixels": 463263, "area_km2": 416.94, "pct": 40.13 }, "builtup": { "pixels": 131153, "area_km2": 118.04, "pct": 11.36 }, "total_valid_km2": 1039.02 }, "2015": { "year": 2015, "observed": true, "water": { "pixels": 254, "area_km2": 0.23, "pct": 0.02 }, "vegetation": { "pixels": 560396, "area_km2": 504.36, "pct": 48.54 }, "cropland": { "pixels": 458451, "area_km2": 412.61, "pct": 39.71 }, "builtup": { "pixels": 135366, "area_km2": 121.83, "pct": 11.73 }, "total_valid_km2": 1039.02 }, "2016": { "year": 2016, "observed": true, "water": { "pixels": 232, "area_km2": 0.21, "pct": 0.02 }, "vegetation": { "pixels": 559196, "area_km2": 503.28, "pct": 48.44 }, "cropland": { "pixels": 451985, "area_km2": 406.79, "pct": 39.15 }, "builtup": { "pixels": 143054, "area_km2": 128.75, "pct": 12.39 }, "total_valid_km2": 1039.02 }, "2017": { "year": 2017, "observed": true, "water": { "pixels": 241, "area_km2": 0.22, "pct": 0.02 }, "vegetation": { "pixels": 559690, "area_km2": 503.72, "pct": 48.48 }, "cropland": { "pixels": 437834, "area_km2": 394.05, "pct": 37.93 }, "builtup": { "pixels": 156702, "area_km2": 141.03, "pct": 13.57 }, "total_valid_km2": 1039.02 }, "2018": { "year": 2018, "observed": true, "water": { "pixels": 349, "area_km2": 0.31, "pct": 0.03 }, "vegetation": { "pixels": 558869, "area_km2": 502.98, "pct": 48.41 }, "cropland": { "pixels": 409572, "area_km2": 368.61, "pct": 35.48 }, "builtup": { "pixels": 185677, "area_km2": 167.11, "pct": 16.08 }, "total_valid_km2": 1039.02 }, "2019": { "year": 2019, "observed": true, "water": { "pixels": 604, "area_km2": 0.54, "pct": 0.05 }, "vegetation": { "pixels": 561700, "area_km2": 505.53, "pct": 48.65 }, "cropland": { "pixels": 398713, "area_km2": 358.84, "pct": 34.54 }, "builtup": { "pixels": 193450, "area_km2": 174.1, "pct": 16.76 }, "total_valid_km2": 1039.02 }, "2020": { "year": 2020, "observed": true, "water": { "pixels": 374, "area_km2": 0.34, "pct": 0.03 }, "vegetation": { "pixels": 548884, "area_km2": 494.0, "pct": 47.54 }, "cropland": { "pixels": 403784, "area_km2": 363.41, "pct": 34.98 }, "builtup": { "pixels": 201425, "area_km2": 181.28, "pct": 17.45 }, "total_valid_km2": 1039.02 }, "2021": { "year": 2021, "observed": true, "water": { "pixels": 201, "area_km2": 0.18, "pct": 0.02 }, "vegetation": { "pixels": 547546, "area_km2": 492.79, "pct": 47.43 }, "cropland": { "pixels": 403958, "area_km2": 363.56, "pct": 34.99 }, "builtup": { "pixels": 202762, "area_km2": 182.49, "pct": 17.56 }, "total_valid_km2": 1039.02 }, "2022": { "year": 2022, "observed": true, "water": { "pixels": 4334, "area_km2": 3.9, "pct": 0.38 }, "vegetation": { "pixels": 544010, "area_km2": 489.61, "pct": 47.12 }, "cropland": { "pixels": 401046, "area_km2": 360.94, "pct": 34.74 }, "builtup": { "pixels": 205077, "area_km2": 184.57, "pct": 17.76 }, "total_valid_km2": 1039.02 }, "2024": { "year": 2024, "observed": false, "predicted": true, "water": { "pixels": 4400, "area_km2": 3.96, "pct": 0.38 }, "vegetation": { "pixels": 535200, "area_km2": 481.68, "pct": 46.36 }, "cropland": { "pixels": 393850, "area_km2": 354.47, "pct": 34.12 }, "builtup": { "pixels": 221017, "area_km2": 198.92, "pct": 19.14 }, "total_valid_km2": 1039.02 }, "2025": { "year": 2025, "observed": false, "predicted": true, "water": { "pixels": 4420, "area_km2": 3.98, "pct": 0.38 }, "vegetation": { "pixels": 528350, "area_km2": 475.52, "pct": 45.77 }, "cropland": { "pixels": 388900, "area_km2": 350.01, "pct": 33.69 }, "builtup": { "pixels": 232797, "area_km2": 209.52, "pct": 20.16 }, "total_valid_km2": 1039.02 }, "2026": { "year": 2026, "observed": false, "predicted": true, "water": { "pixels": 4440, "area_km2": 4.0, "pct": 0.38 }, "vegetation": { "pixels": 521500, "area_km2": 469.35, "pct": 45.17 }, "cropland": { "pixels": 383950, "area_km2": 345.56, "pct": 33.26 }, "builtup": { "pixels": 244577, "area_km2": 220.12, "pct": 21.19 }, "total_valid_km2": 1039.02 }, "2027": { "year": 2027, "observed": false, "predicted": true, "water": { "pixels": 4460, "area_km2": 4.01, "pct": 0.39 }, "vegetation": { "pixels": 514650, "area_km2": 463.19, "pct": 44.58 }, "cropland": { "pixels": 379000, "area_km2": 341.10, "pct": 32.83 }, "builtup": { "pixels": 256357, "area_km2": 230.72, "pct": 22.21 }, "total_valid_km2": 1039.02 }, "2028": { "year": 2028, "observed": false, "predicted": true, "water": { "pixels": 4475, "area_km2": 4.03, "pct": 0.39 }, "vegetation": { "pixels": 507800, "area_km2": 457.02, "pct": 43.99 }, "cropland": { "pixels": 374050, "area_km2": 336.65, "pct": 32.40 }, "builtup": { "pixels": 268142, "area_km2": 241.33, "pct": 23.23 }, "total_valid_km2": 1039.02 }, "2029": { "year": 2029, "observed": false, "predicted": true, "water": { "pixels": 4490, "area_km2": 4.04, "pct": 0.39 }, "vegetation": { "pixels": 500950, "area_km2": 450.86, "pct": 43.40 }, "cropland": { "pixels": 369100, "area_km2": 332.19, "pct": 31.97 }, "builtup": { "pixels": 279927, "area_km2": 251.93, "pct": 24.25 }, "total_valid_km2": 1039.02 }, "2030": { "year": 2030, "observed": false, "predicted": true, "water": { "pixels": 4500, "area_km2": 4.05, "pct": 0.39 }, "vegetation": { "pixels": 494100, "area_km2": 444.69, "pct": 42.81 }, "cropland": { "pixels": 364150, "area_km2": 327.74, "pct": 31.54 }, "builtup": { "pixels": 291717, "area_km2": 262.54, "pct": 25.27 }, "total_valid_km2": 1039.02 } } };

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

function MapRefController({ mapRef, onReady }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
    onReady?.(map);
  }, [map, mapRef, onReady]);
  return null;
}

function GlobalSearchBar({ map }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const searchMarkerRef = useRef(null);
  const searchBoundsRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  const clearOverlays = useCallback(() => {
    if (!map) return;
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }
    if (searchBoundsRef.current) {
      map.removeLayer(searchBoundsRef.current);
      searchBoundsRef.current = null;
    }
  }, [map]);

  useEffect(() => () => clearOverlays(), [clearOverlays]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.length < 3) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=np&limit=5`)
        .then(r => r.json())
        .then(data => setResults(data))
        .catch(() => setResults([]));
    }, 400);
  }, []);

  const selectResult = useCallback((r) => {
    if (!map) return;
    const lat = +r.lat;
    const lon = +r.lon;
    setResults([]);
    setQuery(r.display_name.split(",").slice(0, 2).join(", "));
    setFocused(false);
    clearOverlays();

    if (!map.getPane("searchPane")) {
      const p = map.createPane("searchPane");
      p.style.zIndex = "500";
    }

    if (r.boundingbox) {
      const south = +r.boundingbox[0];
      const north = +r.boundingbox[1];
      const west = +r.boundingbox[2];
      const east = +r.boundingbox[3];
      const rectBounds = [[south, west], [north, east]];
      searchBoundsRef.current = L.rectangle(rectBounds, {
        color: "#4cc9f0", weight: 2, dashArray: "8, 6", fill: true,
        fillColor: "#4cc9f0", fillOpacity: 0.08, interactive: false, pane: "searchPane"
      }).addTo(map);
      map.flyToBounds(rectBounds, { padding: [60, 60], duration: 1.5, maxZoom: 16 });
    } else {
      map.flyTo([lat, lon], 16, { duration: 1.5 });
    }

    searchMarkerRef.current = L.circleMarker([lat, lon], {
      radius: 8, color: "#ff4d6d", fillColor: "#ff4d6d", fillOpacity: 0.5, weight: 2, pane: "searchPane"
    }).bindPopup(`<strong style="font-size:13px">${r.display_name.split(",")[0]}</strong><br/><span style="font-size:11px;color:#888">${r.display_name}</span>`).addTo(map).openPopup();
  }, [clearOverlays, map]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    clearOverlays();
  }, [clearOverlays]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    setFocused(false);
    clearOverlays();
  }, [clearOverlays]);

  return (
    <div className={`global-search ${searchOpen ? "open" : ""}`}>
      {!searchOpen ? (
        <button className="search-icon-btn" onClick={() => setSearchOpen(true)} disabled={!map} title={map ? "Search location" : "Map loading..."}>
          <Search size={16} />
        </button>
      ) : (
        <>
          <div className="search-input-wrap">
            <Search size={14} style={{ color: "var(--text3)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search location in Nepal..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
            />
            {query && <button className="search-clear" onClick={clearSearch}><X size={12} /></button>}
            <button className="search-clear" onClick={closeSearch}><X size={14} /></button>
          </div>
          {focused && results.length > 0 && (
            <div className="search-results global-search-results">
              {results.map((r, i) => (
                <button key={i} className="search-result-item" onClick={() => selectResult(r)}>
                  <MapPin size={12} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div className="sr-name">{r.display_name.split(",")[0]}</div>
                    <div className="sr-addr">{r.display_name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


// ── MapExtras (minZoom + relocate button + search bar) ────────────────────────
function MapExtras({ showSearch = false, showZoom = true }) {
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
      {showZoom && <div className="manual-zoom" aria-label="Zoom controls">
        <button className="manual-zoom-btn" onClick={() => map.zoomIn()} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button className="manual-zoom-btn" onClick={() => map.zoomOut()} aria-label="Zoom out">
          <Minus size={16} />
        </button>
      </div>}
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
function SwipeCompareMap({ urlA, urlB, yearA, yearB, isPredictedA, isPredictedB, renderMode, onPrimaryMapReady, baseMapUrl }) {
  const [hinted, setHinted] = useState(false);
  const wrapRef = useRef(null);
  const dividerRef = useRef(null);
  const handleRef = useRef(null);
  const clipWrapRef = useRef(null);
  const mapARef = useRef(null);
  const mapBRef = useRef(null);
  const syncLockRef = useRef(false);
  const swipeDragging = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      mapARef.current?.invalidateSize?.();
      mapBRef.current?.invalidateSize?.();
    }, 80);
    return () => clearTimeout(id);
  }, [urlA, urlB, renderMode, yearA, yearB]);

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
    <div ref={wrapRef} style={{ height: "100%", width: "100%", position: "relative", background: "var(--map-shell)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", minHeight: 0, userSelect: "none", touchAction: "none" }}>
      {/* Bottom: Year A (interactive, always fully visible) */}
      <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%", position: "absolute", inset: 0, zIndex: 1 }}>
        <ZoomControl position="bottomright" />
        <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
        {renderMode === "tiff" ? (
          <GeoRasterLayerComponent url={urlA} opacity={0.82} />
        ) : (
          <ImageOverlay url={urlA} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
        )}
        <MapRefController mapRef={mapARef} onReady={onPrimaryMapReady} />
        <MapSyncController mapRef={mapARef} otherMapRef={mapBRef} syncRef={syncLockRef} />
        <MapExtras />
      </MapContainer>
      {/* Top: Year B (non-interactive, clipped to show only right side) */}
      <div ref={clipWrapRef} style={{ position: "absolute", inset: 0, zIndex: 2, clipPath: "inset(0 0 0 50%)", pointerEvents: "none" }}>
        <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom={false} dragging={false} keyboard={false} touchZoom={false} doubleClickZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
          {renderMode === "tiff" ? (
            <GeoRasterLayerComponent url={urlB} opacity={0.82} />
          ) : (
            <ImageOverlay url={urlB} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
          )}
          <MapSyncController mapRef={mapBRef} otherMapRef={mapARef} syncRef={syncLockRef} />
        </MapContainer>
      </div>
      {/* Divider line */}
      <div ref={dividerRef} style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "rgba(255,255,255,0.85)", zIndex: 20, pointerEvents: "none", transform: "translateX(-1px)" }} />
      {/* Handle */}
      <div ref={handleRef} onPointerDown={startSwipe} onTouchStart={startSwipe}
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "white", border: "2px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize", zIndex: 25, boxShadow: "0 2px 14px rgba(0,0,0,0.5)", fontSize: 17, color: "#070d19", fontWeight: 900, userSelect: "none", touchAction: "none" }}>⇄</div>
      {/* Labels */}
      <div style={{ position: "absolute", top: 12, left: 12, fontSize: "clamp(14px,4vw,22px)", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--label-text)", textShadow: "var(--label-shadow)", pointerEvents: "none", zIndex: 15, display: "flex", alignItems: "center", gap: 4 }}>{yearA}{isPredictedA && <span style={{ fontSize: "clamp(7px,2vw,9px)", background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 4px" }}>PRED</span>}</div>
      <div style={{ position: "absolute", top: 12, right: 55, fontSize: "clamp(14px,4vw,22px)", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--label-text)", textShadow: "var(--label-shadow)", pointerEvents: "none", zIndex: 15, display: "flex", alignItems: "center", gap: 4 }}>{yearB}{isPredictedB && <span style={{ fontSize: "clamp(7px,2vw,9px)", background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 4px" }}>PRED</span>}</div>
      {!hinted && <div style={{ position: "absolute", bottom: 55, left: "50%", transform: "translateX(-50%)", background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", zIndex: 15, pointerEvents: "none", whiteSpace: "nowrap" }}>⇄ drag handle to compare</div>}
    </div>
  );
}


const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (<div className="custom-tooltip"><div className="tt-year">{label}</div><div className="tt-val">{payload[0]?.value?.toFixed(1)} <span>km²</span></div></div>);
};

// ── SUB-COMPONENTS (Moved outside App to prevent remounting) ──────────────────
const StatsContent = ({ currentData, yoyChange, sparkData, currentYear, compact = false }) => (
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
      <ResponsiveContainer width="100%" height={68}>
        <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: -22, bottom: 0 }}>
          <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff4d6d" stopOpacity={.3} /><stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4a" vertical={false} />
          <XAxis dataKey="year" hide /><YAxis domain={["auto", "auto"]} tick={{ fontSize: 7, fill: "#4a6580", fontFamily: "var(--mono)" }} />
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

const CompareStatsContent = ({ dataA, dataB, yearA, yearB }) => {
  if (!dataA || !dataB) return null;
  const delta = dataB.builtup.area_km2 - dataA.builtup.area_km2;
  const pctChg = ((delta / dataA.builtup.area_km2) * 100).toFixed(1);
  return (
    <>
      <div className="ps">
        <div className="pt">Contrast Analysis</div>
        <div className="dc" style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 12, padding: 10 }}>
          <div className="dcp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div className="dyb" style={{ background: "rgba(129,236,255,0.05)", border: "1px solid var(--border)", borderRadius: 8, padding: 6 }}>
              <div className="dy" style={{ fontSize: 8, color: "var(--text3)", fontFamily: "var(--mono)" }}>EPOCH A</div>
              <div className="dv" style={{ fontSize: 14, fontWeight: 800, color: "var(--blue)", fontFamily: "var(--display)" }}>{yearA}</div>
              <div className="du" style={{ fontSize: 8, color: "var(--text3)" }}>{dataA.builtup.area_km2.toFixed(1)} km²</div>
            </div>
            <div className="dyb" style={{ background: "rgba(255,77,109,0.05)", border: "1px solid var(--border)", borderRadius: 8, padding: 6 }}>
              <div className="dy" style={{ fontSize: 8, color: "var(--text3)", fontFamily: "var(--mono)" }}>EPOCH B</div>
              <div className="dv" style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--display)" }}>{yearB}</div>
              <div className="du" style={{ fontSize: 8, color: "var(--text3)" }}>{dataB.builtup.area_km2.toFixed(1)} km²</div>
            </div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            <div className="ddl" style={{ fontSize: 8, letterSpacing: 1.5, color: "var(--text3)", marginBottom: 3 }}>NET EXPANSION</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <div className="ddv" style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--display)", color: "var(--accent)" }}>
                +{delta.toFixed(1)}
              </div>
              <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>KM²</div>
            </div>
            <div className="dp" style={{ color: delta >= 0 ? "var(--emerald)" : "var(--blue)", fontSize: 8, fontWeight: 700, marginTop: 2 }}>
              {pctChg}% Relative Shift
            </div>
          </div>
        </div>
      </div>
      
      <div className="ps" style={{ borderBottom: "none" }}>
        <div className="pt">Class Delta Analysis</div>
        <table className="ctbl" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 3px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: "2px 6px", fontSize: 8, color: "var(--text3)" }}>Class</th>
              <th style={{ padding: "2px 6px", fontSize: 8, color: "var(--text3)" }}>{yearA}</th>
              <th style={{ padding: "2px 6px", fontSize: 8, color: "var(--text3)" }}>{yearB}</th>
              <th style={{ padding: "2px 6px", fontSize: 8, color: "var(--text3)" }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(LULC).map(([k, v]) => {
              const a = dataA[k]?.area_km2, b = dataB[k]?.area_km2, d = b - a;
              return (
                <tr key={k} style={{ background: "var(--bg4)" }}>
                  <td style={{ padding: "5px", borderRadius: "6px 0 0 6px", borderLeft: `3px solid ${v.color}` }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text)" }}>{v.label}</span>
                  </td>
                  <td style={{ padding: "5px", fontSize: 8, fontFamily: "var(--mono)", textAlign: 'right' }}>{a?.toFixed(1)}</td>
                  <td style={{ padding: "5px", fontSize: 8, fontFamily: "var(--mono)", textAlign: 'right' }}>{b?.toFixed(1)}</td>
                  <td style={{ padding: "5px", borderRadius: "0 6px 6px 0", fontSize: 8, fontWeight: 800, color: d >= 0 ? "var(--gold)" : "var(--blue)", textAlign: 'right' }}>
                    {d >= 0 ? "+" : ""}{d.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontSize: 8, color: "var(--text3)", marginTop: 6, textAlign: "right", fontFamily: "var(--mono)" }}>Unit: km²</div>
      </div>
    </>
  );
};

const TimelapseMap = ({ currentYear, years, isPredicted, isMobile, currentData, yoyChange, showHotspot, showAllClasses, renderMode, tifUrl, theme, onMapReady }) => (
  <div className={`mapbox ${isPredicted ? "predicted" : ""}`} style={{ position: "absolute", inset: 0 }}>
    <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer url={theme === 'light' ? CARTO_LIGHT : CARTO_DARK} attribution={CARTO_ATTR} />
      {showAllClasses && renderMode === 'tiff' && years.map(y => (
        y === currentYear ? <GeoRasterLayerComponent key={`tiff-${y}`} url={tifUrl(y)} opacity={0.82} /> : null
      ))}
      {showAllClasses && renderMode === 'png' && years.map(y => (
        <ImageOverlay key={`png-${y}`} url={`${BASE}/tiles/${y}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={y === currentYear ? 0.82 : 0} />
      ))}
      {!showAllClasses && years.map(y => (
        <ImageOverlay key={`builtup-${y}`} url={`${BASE}/tiles/${y}_builtup.png`} bounds={KATHMANDU_BOUNDS} opacity={y === currentYear ? 0.82 : 0} />
      ))}
      {showHotspot && <ImageOverlay className="hotspot-overlay" url={`${BASE}/hotspot/hotspot.png`} bounds={KATHMANDU_BOUNDS} opacity={0.7} />}
      <MapRefController onReady={onMapReady} />
      <MapExtras showZoom={false} />
    </MapContainer>
    <div className="yr-badge"><span className="yr-num">{currentYear}</span>{isPredicted && <span className="pred-tag">{isMobile ? "PRED" : "PREDICTED"}</span>}</div>
    {isMobile && (
      <div className="stat-ov-mobile">
        <div className="sol">BUILT-UP</div>
        <div className="sov">{currentData?.builtup.area_km2.toFixed(1)}<span className="sou"> km²</span></div>
        <div className="sop">{currentData?.builtup.pct.toFixed(1)}% coverage</div>
        {yoyChange !== null && <div className="soc" style={{ color: yoyChange >= 0 ? "#fb8500" : "var(--blue)" }}>{yoyChange >= 0 ? "▲" : "▼"} {Math.abs(yoyChange).toFixed(1)} km²</div>}
      </div>
    )}
    <div className="leg">
      {(showHotspot ? HOTSPOT_LEGEND : Object.entries(LULC).map(([, v]) => ({ color: v.color, label: v.label }))).map(it => (
        <div key={it.label} className="li"><div className="ld" style={{ background: it.color }} />{it.label}</div>
      ))}
    </div>
    {isPredicted && (
      <div style={{ position: "absolute", bottom: isMobile ? 48 : 34, right: isMobile ? 55 : 42, maxWidth: isMobile ? 180 : 168, background: "var(--surface-strong)", backdropFilter: "blur(8px)", border: "1px solid rgba(76,201,240,.3)", borderRadius: 7, padding: isMobile ? "7px 10px" : "6px 10px", zIndex: 5, pointerEvents: "none" }}>
        <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "#4cc9f0", fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>⚠️ PREDICTION</div>
        <div style={{ fontSize: 9, color: "var(--text2)", lineHeight: isMobile ? 1.4 : 1.45 }}>
          Model prediction based on {isMobile ? "2000-2023 patterns" : "historical patterns (2000-2023)"}
        </div>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
 export default function App() {
  const isMobile = useIsMobile();
  const [theme, setTheme] = useState('dark');
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
  const [preloadProgress, setPreloadProgress] = useState(null); // { loaded, total } or null
  const [preloadDone, setPreloadDone] = useState(false);
  const [renderMode, setRenderMode] = useState('png'); // 'tiff' or 'png'
  const [timelapseMapInstance, setTimelapseMapInstance] = useState(null);
  const [swipeMapInstance, setSwipeMapInstance] = useState(null);
  const [opacityMapInstance, setOpacityMapInstance] = useState(null);
  const [changeMapInstance, setChangeMapInstance] = useState(null);
  const [splitMapAInstance, setSplitMapAInstance] = useState(null);
  const intervalRef = useRef(null);
  // Split-sync refs
  const splitMapARef = useRef(null);
  const splitMapBRef = useRef(null);
  const syncLock = useRef(false);

  const activeSearchMap = tab === "timelapse"
    ? timelapseMapInstance
    : compareMode === "swipe"
      ? swipeMapInstance
      : compareMode === "opacity"
        ? opacityMapInstance
        : showChange
          ? changeMapInstance
          : splitMapAInstance;

  useEffect(() => {
    fetch(`${BASE}/stats.json`).then(r => r.json()).then(d => {
      setStats(d); setYearA(d.years[0]); setYearB(d.years[d.years.length - 1]);
    }).catch(() => {
      setStats(EMBEDDED_STATS); setYearA(EMBEDDED_STATS.years[0]); setYearB(EMBEDDED_STATS.years[EMBEDDED_STATS.years.length - 1]);
    });
  }, []);

  // ── Preload all Maps (GeoTIFF + PNG) into cache ──
  useEffect(() => {
    if (!stats || preloadDone) return;

    // Keep startup light: preload the small PNG assets only.
    // GeoTIFFs are fetched on demand so the first visible map paints faster.
    const pngUrls = [];
    stats.years.forEach(y => {
      pngUrls.push(`${BASE}/tiles/${y}_tile.png`);
      pngUrls.push(`${BASE}/tiles/${y}_builtup.png`);
    });
    pngUrls.push(`${BASE}/hotspot/hotspot.png`);

    const total = pngUrls.length;
    let loadedPngs = 0;
    setPreloadProgress({ loaded: 0, total });

    const updateProgress = () => {
      setPreloadProgress({ loaded: loadedPngs, total });
    };

    const pngPromises = pngUrls.map(url => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { loadedPngs++; updateProgress(); resolve(); };
      img.onerror = () => { loadedPngs++; updateProgress(); resolve(); };
      img.src = url;
    }));

    Promise.all(pngPromises).then(() => {
      setPreloadDone(true);
      setPreloadProgress(null);
    });
  }, [stats, preloadDone]);

  useEffect(() => {
    if (!stats || !playing) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => setYearIdx(i => { if (i >= stats.years.length - 1) { setPlaying(false); return 0; } return i + 1; }), 1200 / speed);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, stats]);

  if (!stats) {
    const pct = preloadProgress ? Math.round((preloadProgress.loaded / preloadProgress.total) * 100) : 0;
    const label = 'LOADING STATS...';
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070d19", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #ff4d6d", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#8fa8c8", fontFamily: "monospace" }}>{label}</div>
        {preloadProgress && (
          <div style={{ width: 220, height: 4, background: "#1a2e4a", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #ff4d6d, #fb8500)", borderRadius: 2, transition: "width 0.3s ease" }} />
          </div>
        )}
        {preloadProgress && <div style={{ fontSize: 10, color: "#4a6580", fontFamily: "monospace" }}>{pct}%</div>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const years = stats.years;
  const currentYear = years[yearIdx];
  const currentData = stats.data[currentYear];
  const prevData = yearIdx > 0 ? stats.data[years[yearIdx - 1]] : null;
  const yoyChange = prevData ? currentData.builtup.area_km2 - prevData.builtup.area_km2 : null;
  const isPredicted = !currentData?.observed;
  const totalGrowth = stats.data[years[years.length - 1]].builtup.area_km2 - stats.data[years[0]].builtup.area_km2;
  const sparkData = years.map(y => ({ year: y, builtup: stats.data[y]?.builtup?.area_km2 ?? 0 }));
  // GeoTIFF paths: observed years in Aligned/, predicted in LULC Predicted/
  const tifUrl = (y) => {
    const data = stats.data[y];
    if (data && data.observed) {
      return `${BASE}/Aligned/LULC_${y}.tif`;
    } else {
      return `${BASE}/LULC Predicted/LULC_PRED_${y}.tif`;
    }
  };
  // Legacy PNG fallback for builtup-only mode
  const tileUrl = y => showAllClasses ? tifUrl(y) : `${BASE}/tiles/${y}_builtup.png`;
  const dataA = yearA ? stats.data[yearA] : null;
  const dataB = yearB ? stats.data[yearB] : null;
  const isPredictedA = dataA && !dataA.observed;
  const isPredictedB = dataB && !dataB.observed;
  const isConsecutive = yearA && yearB && Math.abs(years.indexOf(yearB) - years.indexOf(yearA)) === 1;
  const [sY, bY] = yearA && yearB ? (yearA < yearB ? [yearA, yearB] : [yearB, yearA]) : [yearA, yearB];
  const baseMapUrl = theme === 'light' ? CARTO_LIGHT : CARTO_DARK;

  return (
    <div className="app" data-theme={theme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;700;800&display=swap');
        
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg: #060e20;
          --bg-glass: rgba(6, 14, 32, 0.7);
          --bg2: #0f1930;
          --bg3: #141f38;
          --bg4: #192540;
          --border: rgba(129, 236, 255, 0.1);
          --border2: rgba(129, 236, 255, 0.2);
          --accent: #ff4d6d;
          --blue: #81ecff;
          --cyan: #00e3fd;
          --gold: #f5a623;
          --emerald: #69f6b8;
          --text: #dee5ff;
          --text2: #a3aac4;
          --text3: #6d758c;
          --font:'Inter', sans-serif;
          --mono:'JetBrains Mono', monospace;
          --display: 'Space Grotesk', sans-serif;
          --radius: 20px;
          --glass-blur: blur(20px);
          --pulse-grad: linear-gradient(135deg, #81ecff, #00e3fd);
          --surface-strong: rgba(7,13,25,.92);
          --surface-soft: rgba(7,13,25,.82);
          --surface-elevated: rgba(15,25,48,.92);
          --map-shell: #020810;
          --label-text: #fff;
          --label-shadow: 0 2px 12px rgba(0,0,0,.9);
        }
        [data-theme='light']{
          --bg: #f8fafc;
          --bg-glass: rgba(248, 250, 252, 0.8);
          --bg2: #ffffff;
          --bg3: #f1f5f9;
          --bg4: #e2e8f0;
          --border: rgba(0,0,0,0.06);
          --border2: rgba(0,0,0,0.12);
          --accent: #e63956;
          --blue: #00bcd4;
          --cyan: #0097a7;
          --gold: #d97706;
          --emerald: #10b981;
          --text: #0f172a;
          --text2: #334155;
          --text3: #64748b;
          --pulse-grad: linear-gradient(135deg, #00bcd4, #0097a7);
          --surface-strong: rgba(255,255,255,.94);
          --surface-soft: rgba(255,255,255,.9);
          --surface-elevated: rgba(255,255,255,.96);
          --map-shell: #e8eef7;
          --label-text: #0f172a;
          --label-shadow: 0 1px 8px rgba(255,255,255,.8);
        }
        html,body{height:100%;overflow:hidden;}
        body{background:var(--bg);color:var(--text);font-family:var(--font);}
        .app{position:relative;height:100vh;height:100dvh;overflow:hidden;--side-panel-space:320px;background:var(--bg);}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes subtle-pulse{0%,100%{box-shadow:0 0 15px rgba(129,236,255,.3)}50%{box-shadow:0 0 25px rgba(129,236,255,.6)}}
        @keyframes badgePulse{0%,100%{box-shadow:0 0 0 0 rgba(255,77,109,0.2)}50%{box-shadow:0 0 0 10px rgba(255,77,109,0)}}

        /* ── Leaflet overrides ── */
        .leaflet-container { background: var(--bg) !important; isolation: isolate; font-family: var(--font) !important; width: 100%; height: 100%; }
        .leaflet-control-zoom { display:none !important; border: 1px solid var(--border) !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; }
        .leaflet-control-zoom a { background: var(--bg-glass) !important; backdrop-filter: blur(12px); color: var(--text) !important; border-color: var(--border2) !important; height: 32px !important; width: 32px !important; line-height: 32px !important; }
        .leaflet-control-attribution { background: var(--bg-glass) !important; backdrop-filter: blur(12px); color: var(--text3) !important; font-size: 8px !important; border-radius: 6px 0 0 0; padding: 2px 6px !important; pointer-events: auto; z-index: 1600 !important; opacity: 1 !important; visibility: visible !important; }
        .leaflet-control-attribution a { color: var(--blue) !important; }
        .leaflet-tile-pane { z-index: 1 !important; }
        .leaflet-overlay-pane { z-index: 2 !important; }
        .leaflet-shadow-pane { z-index: 3 !important; }
        .leaflet-marker-pane { z-index: 4 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 1600 !important; }
        .leaflet-top.leaflet-left { top: 100px !important; left: 12px !important; }
        .hotspot-overlay { mix-blend-mode: screen; }

        /* ── Header ── */
        .header{position:fixed;top:0;left:0;right:0;height:60px;background:var(--bg-glass);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-bottom:1px solid var(--border);z-index:2000;display:flex;align-items:center;padding:0 20px;justify-content:space-between;box-shadow:0 10px 40px rgba(0,0,0,0.3);}
        @media(max-width:767px){ .header{height: 56px; padding: 0 16px; top: 0; border-radius: 0; border-bottom: 1px solid var(--border);} }
        .header-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0;}
        .header-copy{min-width:0;}
        .logo{width:34px;height:34px;background:var(--pulse-grad);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 16px rgba(129,236,255,0.25);position:relative;overflow:hidden;}
        @media(max-width:767px){ .logo{width: 34px; height: 34px; font-size: 17px; border-radius: 11px;} }
        .header-title{font-size:16px;font-weight:800;font-family:var(--display);letter-spacing:-0.4px;color:var(--text);line-height:1.08;}
        .header-title span{color:var(--blue);text-shadow:0 0 15px rgba(58,134,255,0.3);}
        @media(max-width:767px){ .header-title{font-size: 12px; line-height: 1.14;} .header-title span{display:block; margin-top: 2px;} }
        .header-sub{font-size:9px;font-family:var(--mono);color:var(--text3);letter-spacing:1.8px;text-transform:uppercase;margin-top:4px;}
        @media(max-width:767px){ .header-sub{display: none;} }
        .header-right{display:flex;align-items:center;gap:10px;justify-content:flex-end;position:relative;flex-wrap:wrap;}
        .btn-icon{width:36px;height:36px;flex:0 0 auto;}
        @media(max-width:767px){
          .header-right{gap:8px;flex-wrap:nowrap;}
          .header-right .badge,
          .header-right > button:not(.btn-icon):not(.mobile-quick-backdrop),
          .header-right > div:not(.render-toggle):not(.mobile-quick-menu){display:none !important;}
          .header-right .render-toggle{display:flex !important;}
          .header-right .render-toggle button{display:block !important;}
          .header-right .btn-icon{display:flex !important;}
        }
        .badge{padding:3px 9px;border-radius:18px;font-size:9px;font-family:var(--mono);font-weight:600;}
        .badge-s{background:rgba(245,166,35,.15);color:var(--gold);border:1px solid rgba(245,166,35,.3);}
        .badge-b{background:rgba(129,236,255,.15);color:var(--blue);border:1px solid rgba(129,236,255,.3);}
        .render-toggle{display:flex;align-items:center;background:var(--surface-elevated);border:1px solid var(--border2);border-radius:14px;padding:3px;box-shadow:0 8px 18px rgba(0,0,0,.18);}
        .render-toggle button{background:none;border:none;color:var(--text3);font-size:10px;font-family:var(--mono);font-weight:700;padding:6px 12px;border-radius:10px;cursor:pointer;transition:all .2s;}
        .render-toggle button.on{background:var(--bg4);color:var(--cyan);}
        @media(max-width:767px){
          .render-toggle{padding:3px; border-radius:12px; min-width:98px; justify-content:space-between;}
          .render-toggle button{padding:6px 10px; font-size:9px; min-width:42px;}
        }

        /* ── Download Menu ── */
        .download-menu{position:absolute;top:calc(100% + 8px);right:0;background:var(--bg-glass);backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,0.4);z-index:999;min-width:220px;overflow:hidden;animation:slideDown .2s ease;}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .download-item{width:100%;background:none;border:none;padding:12px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:background .15s;border-bottom:1px solid var(--border);text-align:left;}
        .download-item:last-child{border-bottom:none;}
        .download-item:hover{background:var(--bg3);}
        .download-item span{font-size:18px;flex-shrink:0;}
        .dm-title{font-size:13px;color:var(--text);font-family:var(--display);font-weight:600;margin-bottom:2px;}
        .dm-desc{font-size:10px;color:var(--text3);font-family:var(--mono);}
        .mobile-quick-menu{display:none;}
        .mobile-menu-toggle{display:none;}
        .mobile-menu-glyph{display:flex;flex-direction:column;justify-content:center;gap:4px;width:18px;}
        .mobile-menu-glyph span{display:block;width:100%;height:3px;border-radius:999px;background:var(--text);box-shadow:0 1px 0 rgba(0,0,0,.22);}
        .mobile-action-row{display:flex;gap:10px;}
        .mobile-theme-row{display:flex;}
        .mobile-action-btn{flex:1 1 0;min-height:44px;border-radius:14px;padding:0 14px;border:1px solid transparent;background:none;color:var(--text);font-family:var(--display);font-size:12px;font-weight:700;letter-spacing:.5px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;box-shadow:0 12px 26px rgba(0,0,0,.18);}
        .mobile-action-btn--export{background:rgba(251,133,0,.14);border-color:rgba(251,133,0,.38);color:#fb8500;}
        .mobile-action-btn--about{background:rgba(76,201,240,.14);border-color:rgba(76,201,240,.34);color:#4cc9f0;}
        .mobile-action-btn--theme{width:100%;background:rgba(129,236,255,.1);border-color:rgba(129,236,255,.24);color:var(--text);}
        .mobile-landsat-row{display:flex;gap:10px;flex-wrap:wrap;}
        .mobile-info-pill{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:16px;border:1px solid transparent;font-family:var(--display);font-size:12px;font-weight:800;letter-spacing:.6px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);}
        .mobile-info-pill--cyan{background:rgba(76,201,240,.12);border-color:rgba(76,201,240,.34);color:var(--blue);}
        .mobile-info-pill--gold{background:rgba(245,166,35,.12);border-color:rgba(245,166,35,.34);color:var(--gold);}

        /* ── Summary bar ── */
        .sumbar{display:none;}
        .si{padding:6px 10px;border-right:1px solid var(--border);}
        .si:last-child{border-right:none;}
        .sl{font-size:9px;font-family:var(--display);letter-spacing:1px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;}
        .sv{font-size:16px;font-weight:700;font-family:var(--mono);line-height:1;}
        .sv.r{color:var(--accent);}.sv.g{color:var(--emerald);}.sv.gold{color:var(--gold);}.sv.b{color:var(--cyan);}
        .ss{font-size:9px;color:var(--text3);}

        /* ── Tabs ── */
        .tabs-wrap{position:fixed;top:84px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;z-index:1500;}
        .tabs-wrap.compare-mode{left:47.5%;transform:translateX(-50%) scale(0.85);transform-origin:center;}
        .tabs{background:var(--bg2);border:1px solid var(--border);border-radius:24px;padding:4px;display:flex;gap:4px;box-shadow:0 12px 30px rgba(0,0,0,0.35);backdrop-filter:blur(20px);}
        @media(max-width:767px){ .tabs{width: 100%; max-width: 224px; min-width: 0; padding: 4px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);} }
        .tab{background:none;border:none;color:var(--text3);font-size:12px;font-weight:700;font-family:var(--font);padding:7px 18px;border-radius:20px;cursor:pointer;transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);display:flex;align-items:center;gap:7px;}
        @media(max-width:767px){ .tab{padding: 6px 10px; font-size: 11px; flex:1 1 0; justify-content:center;} }
        .tab.on{background:var(--pulse-grad);color:var(--bg);box-shadow:0 5px 20px rgba(129,236,255,0.4);}
        .tab:not(.on):hover{background:var(--bg3);color:var(--text);}

        /* ── Desktop main layout ── */
        .main{position:absolute;inset:0;display:block;}
        .mapp{position:absolute;inset:0;padding:0;}

        /* ── Mobile main layout ── */
        .main-mobile{position:absolute;inset:0;display:block;}
        .map-full{position:absolute;inset:0;padding:0;}

        /* ── Map box ── */
        .mapbox{position:absolute;inset:0;background:var(--bg);border:none;border-radius:0;}
        .mapbox.predicted{border:none;}

        /* ── Overlays ── */
        .yr-badge{position:absolute;top:84px;left:18px;background:var(--bg-glass);backdrop-filter:var(--glass-blur);border:none;border-left:4px solid var(--accent);border-radius:10px;padding:6px 14px;display:flex;align-items:baseline;gap:8px;z-index:1500;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,0.28);}
        @media(max-width:767px){ .yr-badge{top: 12px; left: 12px; padding: 6px 12px; border-radius: 8px;} }
        .yr-num{font-family:var(--display);font-size:clamp(24px,4.8vw,40px);font-weight:800;color:var(--text);line-height:1;letter-spacing:-1.5px;}
        @media(max-width:767px){ .yr-num{font-size: 24px; letter-spacing: -1px;} }
        .pred-tag{font-size:8px;font-family:var(--mono);padding:2px 7px;background:rgba(255,183,3,0.1);border:1px solid rgba(255,183,3,0.3);color:var(--gold);border-radius:4px;font-weight:700;letter-spacing:0.8px;}
        .stat-ov{display:none;} /* Redundant in desktop, sidebar handles details */
        .stat-ov-mobile{position:absolute;top:200px;left:16px;background:var(--bg-glass);backdrop-filter:var(--glass-blur);border:1px solid var(--border);border-radius:16px;padding:12px 16px;min-width:120px;z-index:1500;pointer-events:none;box-shadow:0 12px 40px rgba(0,0,0,0.5);}
        @media(max-width:767px){ .stat-ov-mobile{top: 72px; left: 12px; padding: 10px 12px; min-width: 104px;} }
        .mapbox.search-active > .stat-ov{top:240px;}
        .mapbox.search-results-visible > .stat-ov{top:480px;}
        .sol{font-size:10px;font-family:var(--display);color:var(--text3);letter-spacing:1px;margin-bottom:1px;}
        .sov{font-size:clamp(18px,4vw,24px);font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;}
        .sou{font-size:11px;color:var(--text3);}
        .sop{font-size:11px;font-weight:500;color:var(--text2);margin-top:2px;}
        .soc{font-size:10px;font-weight:500;font-family:var(--mono);margin-top:3px;padding-top:3px;border-top:1px solid var(--border);}
        .leg{position:absolute;bottom:128px;left:18px;background:var(--bg-glass);backdrop-filter:var(--glass-blur);border:1px solid var(--border);border-radius:14px;padding:8px 12px;display:flex;flex-direction:column;gap:6px;z-index:1500;pointer-events:none;box-shadow:0 10px 24px rgba(0,0,0,0.25);width:fit-content;}
        @media(max-width:1400px){ .leg{bottom: 188px;} }
        @media(max-width:767px){ .leg{bottom: 166px; left: 12px; padding: 7px 10px; gap: 5px;} }
        .li{font-size:10px;color:var(--text2);display:flex;align-items:center;gap:7px;font-family:var(--font);font-weight:500;}
        .ld{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
        @media(max-width:767px){ .li{font-size:9px;gap:6px;} .ld{width:8px;height:8px;} }

        /* ── Slider ── */
        .sl-sec{position:absolute;bottom:14px;left:calc(120px + 5%);right:calc(var(--side-panel-space) - 5%);transform:none;width:auto;background:var(--bg-glass);backdrop-filter:blur(22px);border:1px solid var(--border);border-radius:24px;z-index:1000;padding:12px 28px;box-shadow:0 10px 28px rgba(0,0,0,0.32);display:flex;flex-direction:column;gap:6px;transition: all 0.3s ease;}
        @media(max-width:1400px){ .sl-sec{left: calc(120px + 5%); right: calc(var(--side-panel-space) - 5%); bottom: 14px; width: auto;} }
        @media(max-width:767px){ .sl-sec{left: 50%; bottom: 88px; transform: translateX(-50%); width: calc(100% - 24px); padding: 7px 12px; gap: 4px; z-index: 1000;} }
        .sl-ticks{position:relative;height:12px;width:100%;margin-bottom:6px;}
        .tick{position:absolute;transform:translateX(-50%);font-size:10px;color:var(--text3);font-family:var(--mono);text-align:center;white-space:nowrap;}
        .tick.sensor{color:var(--text2);font-weight:600;}
        .tickl{width:1px;height:8px;background:var(--gold);margin:2px auto 0;opacity:0.6;}
        .slider-track-wrap{position:relative;width:100%;display:flex;align-items:center;}
        .sensor-marker{position:absolute;top:50%;transform:translate(-50%,-50%);width:3px;height:14px;background:var(--gold);border-radius:2px;z-index:2;pointer-events:none;box-shadow:0 0 6px rgba(255,215,0,0.5);}
        input[type="range"]{-webkit-appearance:none;width:100%;height:4px;background:var(--bg3);border-radius:2px;outline:none;position:relative;}
        input[type="range"]::before{content:"";position:absolute;left:0;top:0;height:100%;width:var(--fill);background:linear-gradient(90deg,var(--cyan),var(--blue));border-radius:2px;pointer-events:none;}
        input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:var(--bg2);border:2px solid var(--cyan);border-radius:50%;cursor:pointer;box-shadow:0 0 8px rgba(129,236,255,.45);transition:transform .1s;}
        input[type="range"]::-webkit-slider-thumb:hover{transform:scale(1.2);}
        input[type=range]::-moz-range-track{height:4px;background:var(--bg4);border-radius:2px;border:none;}
        input[type=range]::-moz-range-progress{height:4px;background:var(--accent);border-radius:2px;}
        input[type=range]::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);box-shadow:0 0 0 3px rgba(255,77,109,.25);cursor:pointer;}
        .op-sl{height:3px!important;}
        .op-sl::-webkit-slider-runnable-track{background:linear-gradient(to right,#4895ef,#ff4d6d)!important;border-radius:999px;height:3px!important;}
        .op-sl::-webkit-slider-thumb{-webkit-appearance:none;background:#fff!important;box-shadow:0 2px 8px rgba(0,0,0,0.3)!important;width:20px!important;height:20px!important;margin-top:-8px!important;border:3px solid #fff!important;border-radius:50%!important;position:relative;z-index:10;}
        .op-sl::-moz-range-track{background:linear-gradient(to right,#4895ef,#ff4d6d)!important;border-radius:999px;height:3px!important;}
        .op-sl::-moz-range-thumb{background:#fff!important;box-shadow:0 2px 8px rgba(0,0,0,0.3)!important;width:20px!important;height:20px!important;border:3px solid #fff!important;border-radius:50%!important;}

        /* ── Controls ── */
        .ctrls{position:absolute;bottom:78px;left:calc((100% - var(--side-panel-space)) / 2 + 12%);transform:translateX(-50%) scale(0.9);z-index:1500;display:flex;gap:6px;background:var(--bg-glass);backdrop-filter:var(--glass-blur);padding:6px 12px;border-radius:24px;border:1px solid var(--border);box-shadow:0 10px 28px rgba(0,0,0,0.36);align-items:center;width:auto;min-width:200px;max-width:calc(100% - var(--side-panel-space) - 36px);justify-content:flex-start;transition: all 0.3s ease;}
        @media(max-width:767px){ .ctrls{ bottom: 12px; left: 50%; transform: translateX(-50%); width: calc(100% - 16px); max-width: none; min-width: 0; padding: 8px 12px; gap: 8px; justify-content: space-between; align-items:center; flex-wrap:nowrap; overflow:visible; border-radius: 28px;} }
        .pbtn{background:var(--pulse-grad);color:var(--bg);border:none;width:38px;height:38px;min-width:38px;min-height:38px;max-width:38px;max-height:38px;flex:0 0 38px;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:0 4px 12px rgba(129,236,255,0.35);padding:0;}
        @media(max-width:767px){ .pbtn{width:50px;height:50px;min-width:50px;min-height:50px;max-width:50px;max-height:50px;flex:0 0 50px;border-radius:999px;} }
        .pbtn:hover{transform:scale(1.1);box-shadow:0 8px 25px rgba(129,236,255,0.6);}
        .spg{display:flex;background:var(--bg4);border-radius:16px;padding:3px;border:none;}
        .spb{background:none;border:none;color:var(--text3);font-size:10px;font-family:var(--mono);padding:4px 10px;border-radius:13px;cursor:pointer;transition:all .2s;font-weight:600;}
        .spb.on{background:var(--bg3);color:var(--blue);box-shadow:0 2px 8px rgba(0,0,0,.3);}
        .cbtn{background:var(--bg3);border:1px solid var(--border2);color:var(--text2);font-size:11px;padding:8px 14px;border-radius:20px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s;font-weight:500;}
        .cbtn.on{background:rgba(129,236,255,0.1);color:var(--cyan);border-color:var(--blue);box-shadow: 0 0 10px rgba(129,236,255,0.2);}
        @media(max-width:767px){
          .spg{flex:1 1 auto; min-width:80px; max-width:140px; border-radius:18px; padding:4px;}
          .spb{flex:1 1 0; padding:6px 0; font-size:9px;}
          .cbtn{padding:8px 10px; border-radius:20px; gap:5px; font-size:9px; white-space:nowrap; flex:0 1 auto; min-width:0; justify-content:center; overflow:hidden;}
          .cbtn svg{flex:0 0 auto;}
        }

        /* ── Desktop stats sidebar ── */
        .sp{position:absolute;top:84px;right:6px;width:252px;background:var(--bg-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:20px;z-index:1000;box-shadow:0 18px 36px rgba(0,0,0,0.32);padding:14px;overflow-y:auto;max-height:calc(100vh - 100px);display:flex;flex-direction:column;flex-shrink:0;scrollbar-gutter: stable;}

        /* ── Mobile bottom sheet ── */
        .sheet-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2600;display:flex;align-items:flex-end;}
        .sheet{position:relative;z-index:2601;background:var(--bg2);border-radius:16px 16px 0 0;width:100%;max-height:70vh;overflow-y:auto;animation:slideUp .25s ease;border-top:1px solid var(--border);box-shadow:0 -16px 36px rgba(0,0,0,.28);}
        .sheet-handle{width:36px;height:4px;background:var(--border2);border-radius:2px;margin:10px auto 6px;}
        .sheet-tab-btn{position:fixed;bottom:24px;right:24px;z-index:2000;width:56px;height:56px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 24px rgba(255,77,109,0.4);font-family:var(--display);font-weight:800;flex-direction:column;gap:2px;transition: transform 0.2s;}
        .sheet-tab-btn:hover{transform: scale(1.1);}
        @media(max-width:767px){ .sheet-tab-btn{bottom: 144px; right: 18px;} }

        /* ── Shared panel styles ── */
        .ps{padding:6px 12px;border-bottom:1px solid var(--border);}
        .ps:first-child{padding-top:2px;}
        .pt{font-size:8px;font-family:var(--mono);letter-spacing:1.8px;color:var(--text3);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:5px;}
        .pt::before{content:'';width:3px;height:10px;background:var(--accent);border-radius:2px;}
        .gc{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;margin:3px 0;}
        .gcb{font-size:16px;font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;letter-spacing:-0.5px;}
        .gcu{font-size:8px;color:var(--text3);}
        .gcr{display:flex;gap:8px;margin-top:2px;}
        .gcl{font-size:6px;font-family:var(--display);letter-spacing:1px;color:var(--text3);margin-bottom:0px;text-transform:uppercase;}
        .gcv{font-size:8px;font-weight:600;font-family:var(--mono);}
        .ci{margin-bottom:7px;}
        .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;}
        .cn{font-size:10px;font-weight:500;display:flex;align-items:center;gap:3px;}
        .cv{font-size:9px;font-family:var(--mono);color:var(--text3);}
        .ct{height:5px;background:var(--bg4);border-radius:999px;overflow:hidden;}
        .cf{height:100%;border-radius:999px;transition:width .4s;}
        .custom-tooltip{background:var(--bg3);border:1px solid var(--border2);padding:6px 9px;border-radius:6px;font-family:var(--mono);}
        .tt-year{font-size:9px;color:var(--text3);}
        .tt-val{font-size:12px;font-weight:600;color:var(--accent);}
        .tt-val span{font-size:9px;color:var(--text3);}

        /* ── Compare layout ── */
        .cmp-layout{position:absolute;inset:0;display:flex;padding-top:96px;padding-bottom:10px;background:var(--bg);}
        .cmp-col{flex:1;display:flex;flex-direction:column;padding:0 12px 10px;gap:4px;min-width:0;background:var(--bg);}
        .cmp-ctrl{display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex-shrink:0;padding:2px 0 4px;background:var(--bg);position:relative;z-index:1200;}
        .cmp-primary{display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-width:0;}
        .cmp-secondary{display:flex;align-items:center;gap:6px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end;}
        .cmp-tertiary{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-left:10px;}
        .cmp-ctrl.split-active{row-gap:8px;}
        .cmp-ctrl.split-active .cmp-secondary{margin-left:auto;justify-content:flex-end;}
        select{background:var(--bg3);border:1px solid var(--border2);color:var(--text);font-family:var(--mono);font-size:12px;padding:5px 7px;cursor:pointer;outline:none;border-radius:6px;font-weight:600;}
        .vs{font-size:10px;font-family:var(--mono);color:var(--text3);padding:3px 7px;background:var(--bg4);border-radius:16px;}
        .mg{display:flex;border:1px solid var(--border2);border-radius:6px;overflow:hidden;}
        .mb{background:none;border:none;cursor:pointer;padding:5px 9px;font-family:var(--font);font-size:10px;color:var(--text3);border-right:1px solid var(--border);font-weight:500;}
        .mb:last-child{border-right:none;}
        .mb.on{background:var(--bg4);color:var(--cyan);}
        .mb:hover:not(.on){background:var(--bg3);color:var(--text2);}
        .split-wrap{flex:1;display:flex;gap:5px;min-height:0;}
        .split-half{flex:1;position:relative;background:var(--map-shell);border-radius:18px;border:1px solid var(--border);overflow:hidden;min-height:0;}
        @media(max-width:900px){.split-half{min-height:250px;}}
        .split-lbl{position:absolute;top:8px;left:8px;font-size:clamp(12px,3vw,17px);font-weight:700;font-family:var(--mono);color:#fff;text-shadow:0 2px 10px #000;pointer-events:none;z-index:10;}
        .op-wrap{flex:1;display:flex;flex-direction:column;gap:6px;min-height:0;}
        .op-ctrl{flex-shrink:0;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;}
        .op-row{display:flex;align-items:center;gap:8px;}
        .op-yr{font-size:12px;font-weight:700;font-family:var(--mono);min-width:28px;}
        .op-yr.a{color:var(--blue);}.op-yr.b{color:var(--accent);}
        .csp{width:214px;border-left:1px solid var(--border);background:var(--bg2);overflow-y:auto;flex-shrink:0;}
        .dc{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:10px;margin-bottom:7px;}
        .dcp{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px;}
        .dyb{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:7px 9px;}
        .dy{font-size:10px;font-family:var(--mono);color:var(--text3);margin-bottom:2px;}
        .dv{font-size:19px;font-weight:700;font-family:var(--mono);color:var(--accent);line-height:1;letter-spacing:-1px;}
        .du{font-size:9px;color:var(--text3);}
        .dp{font-size:10px;font-weight:500;color:var(--text2);margin-top:2px;}
        .ddr{display:flex;justify-content:space-between;}
        .ddl{font-size:9px;font-family:var(--mono);color:var(--text3);letter-spacing:1px;margin-bottom:2px;}
        /* ── Mobile Layouts ── */
        .main-mobile{display:flex;flex-direction:column;height:calc(100vh - 70px);margin-top:70px;background:var(--bg);}
        @media(max-width:767px){ .main-mobile{margin-top: 126px; height: calc(100vh - 126px);} }
        .map-full{flex:1;position:relative;display:flex;flex-direction:column;min-height:0;}
        .mob-cmp-ctrl{padding:12px;background:var(--bg2);border-bottom:1px solid var(--border);z-index:20;}

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
        .mob-yr-row select{flex:1 1 120px;min-width:0;}
        .mob-mode-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
        .mob-mode-row .mg{width:100%;}
        .mob-mode-row .mb{flex:1 1 0;}

        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

        /* ── Map Extras: Search & Relocate ── */
        .map-extras{position:absolute;inset:0;pointer-events:none;z-index:1000;}
        .map-extras>*{pointer-events:auto;}
        .manual-zoom{position:absolute;top:12px;right:12px;display:flex;flex-direction:column;gap:8px;}
        .manual-zoom-btn{width:40px;height:40px;border:none;border-radius:14px;background:var(--surface-strong);backdrop-filter:blur(12px);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--text);cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.2);transition:all .2s;}
        .manual-zoom-btn:hover{background:var(--surface-elevated);border-color:var(--blue);color:var(--blue);}
        .search-control{position:absolute;top:10px;right:10px;}
        .global-search{position:relative;}
        .global-search.open{width:min(320px,42vw);}
        .tabs-wrap.compare-mode .global-search.open{width:min(180px,24vw);}
        .tabs-wrap.compare-mode .search-input{font-size:11px;}
        .tabs-wrap.compare-mode .search-input::placeholder{font-size:10px;}
        .tabs-wrap.compare-mode .search-input-wrap{padding:6px 10px;gap:6px;}
        .global-search-results{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:20;}
        .search-icon-btn{width:38px;height:38px;border-radius:8px;border:none;cursor:pointer;background:var(--surface-strong);backdrop-filter:blur(12px);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--text2);transition:all .2s;box-shadow:0 2px 10px rgba(0,0,0,.15);}
        .search-icon-btn:hover{background:var(--surface-elevated);border-color:rgba(255,77,109,.4);color:var(--accent);}
        .search-icon-btn:disabled{opacity:.45;cursor:not-allowed;}
        .search-control.open{width:min(88%,340px);right:10px;}
        .search-input-wrap{display:flex;align-items:center;gap:8px;background:var(--surface-strong);backdrop-filter:blur(12px);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;transition:border-color .2s;animation:searchExpand .25s ease;}
        @keyframes searchExpand{from{opacity:0;transform:scaleX(0.3);transform-origin:right}to{opacity:1;transform:scaleX(1);transform-origin:right}}
        .search-input-wrap:focus-within{border-color:rgba(255,77,109,.4);}
        .search-input{flex:1;background:none;border:none;outline:none;color:var(--text);font-family:var(--font);font-size:13px;min-width:0;}
        .search-input::placeholder{color:var(--text3);font-size:12px;}
        .search-clear{background:none;border:none;cursor:pointer;color:var(--text3);display:flex;align-items:center;padding:2px;border-radius:3px;transition:color .15s;}
        .search-clear:hover{color:var(--accent);}
        .search-results{margin-top:4px;background:var(--surface-elevated);backdrop-filter:blur(12px);border:1px solid var(--border2);border-radius:8px;overflow:hidden;max-height:220px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.18);}
        .search-result-item{width:100%;display:flex;align-items:flex-start;gap:8px;padding:10px 12px;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;text-align:left;transition:background .15s;font-family:var(--font);}
        .search-result-item:hover{background:var(--bg3);}
        .search-result-item:last-child{border-bottom:none;}
        .sr-name{font-size:12px;color:var(--text);font-weight:500;}
        .sr-addr{font-size:10px;color:var(--text3);margin-top:1px;}
        .relocate-btn{position:absolute;bottom:85px;left:10px;z-index:1000;display:flex;align-items:center;gap:6px;background:var(--surface-strong);backdrop-filter:blur(12px);border:1px solid rgba(255,77,109,.35);border-radius:8px;padding:8px 14px;cursor:pointer;color:var(--accent);font-family:var(--mono);font-size:11px;font-weight:600;box-shadow:0 2px 12px rgba(0,0,0,.18);transition:all .2s;}
        @media(max-width:767px){ .relocate-btn{top: 14px; right: 12px; left: auto; bottom: auto; width: 34px; height: 34px; padding: 0; font-size: 10px; border-radius: 50%; justify-content:center;} .relocate-btn span{display:none;} }
        .relocate-btn:hover{background:rgba(255,77,109,.15);border-color:var(--accent);transform:scale(1.03);}
        .leaflet-popup-content-wrapper{background:var(--bg2)!important;color:var(--text)!important;border:1px solid var(--border)!important;border-radius:8px!important;box-shadow:0 4px 16px rgba(0,0,0,.5)!important;}
        .leaflet-popup-tip{background:var(--bg2)!important;border:1px solid var(--border)!important;}
        .leaflet-popup-close-button{color:var(--text3)!important;}
        .footer{display:none!important;}

        @media(max-width:767px){
          .header-sub{display:none;}
          .header-title{font-size: 12px; line-height: 1.14;}
          .header { top: 12px; left: 12px; right: 12px; height: 64px; border-radius: 18px; padding: 0 16px; backdrop-filter: blur(20px); }
          .header-left{gap:12px; min-width:0;}
          .header-copy{display:flex;flex-direction:column;justify-content:center;gap:2px;min-width:0;}
          .header-right{margin-left:12px; flex:0 0 auto; max-width:132px;}
          .header-right .render-toggle{flex:0 0 auto;}
          .header-right .btn-icon{width:44px; height:38px; border-radius:12px;}
          .header-right{overflow:visible;}
          .mobile-menu-toggle{display:flex;position:relative;z-index:1001;}
          .mobile-menu-glyph{width:20px;gap:4px;}
          .mobile-menu-glyph span{height:3px;}
          .mobile-quick-backdrop{position:fixed;inset:0;background:transparent;border:none;padding:0;z-index:998;}
          .mobile-quick-menu{display:flex;flex-direction:column;gap:12px;position:absolute;top:calc(100% + 12px);right:0;width:min(292px,calc(100vw - 24px));padding:14px;background:var(--surface-elevated);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid var(--border2);border-radius:20px;box-shadow:0 20px 44px rgba(0,0,0,.25);z-index:999;}
          .mobile-action-row .download-menu{top:calc(100% + 10px);min-width:220px;}
          .tabs-wrap{top:84px;width:calc(100% - 24px);justify-content:center;}
          .global-search{display:none;}
          .sp{display:none;} /* Hide the huge right panel on mobile by default to preserve the map */
          .cmp-layout{padding-top:96px;}
          .cmp-col{padding:0 10px 10px;}
          .cmp-ctrl{gap:8px;align-items:flex-start;}
          .cmp-primary{flex:1 1 100%;}
          .cmp-tertiary{margin-left:0;flex:1 1 100%;justify-content:flex-start;}
          .cmp-secondary{margin-left:0;flex:1 1 100%;justify-content:flex-start;}
          .cmp-secondary .mg{width:100%;}
          .cmp-secondary .mb{flex:1 1 0;}
          .cmp-tertiary .cbtn{width:100%;justify-content:center;}
          .split-wrap{flex-direction:column;}
          .split-half{min-height:220px;}
          .search-control{right:8px;top:8px;}
          .search-control.open{width:min(75%,280px);}
          .manual-zoom{top:58px;right:12px;}
          .manual-zoom-btn{width:38px;height:38px;border-radius:12px;}
          .search-input{font-size:12px;}
          .search-icon-btn{width:34px;height:34px;border-radius:7px;}
          .sl-sec{width: calc(100% - 24px); max-width: 100%; bottom: 88px;}
          .sumbar{display:none;}
          .relocate-btn{top:14px;right:12px;left:auto;bottom:auto;padding:0;font-size:10px;}
        }
        @media(min-width:768px) and (max-width:1023px){
          .app{--side-panel-space:300px;}
          .sp{width:260px;}
          .sl-sec{width: calc(100% - 300px);}
        }
      `}</style>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo">🛰️</div>
          <div className="header-copy">
            <div className="header-title">Precision Intelligence: <span>Kathmandu Growth</span></div>
            <div className="header-sub">LAND USE & LAND COVER · 2000–2030</div>
          </div>
        </div>
        <div className="header-right">
          <div className="render-toggle">
            <button className={renderMode === 'tiff' ? "on" : ""} onClick={() => setRenderMode('tiff')}>TIF</button>
            <button className={renderMode === 'png' ? "on" : ""} onClick={() => setRenderMode('png')}>PNG</button>
          </div>
          {!isMobile && (
            <>
              <span className="badge badge-b">LANDSAT 5/7/8/9</span>
              <span className="badge badge-s">⚡ L7→L8: 2013</span>
              <button 
                className="btn-icon"
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: 0, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", transform: "translateY(-2px)" }}>
                  {theme === 'dark' ? <ChandraIcon size={42} /> : <SuryaIcon size={32} />}
                </span>
              </button>
              <ExportPanel stats={stats} />
              <button onClick={() => setAboutOpen(true)} style={{ background: "rgba(76,201,240,.15)", border: "1px solid rgba(76,201,240,.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 10, color: "#4cc9f0", fontFamily: "var(--mono)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                ℹ️ ABOUT
              </button>
            </>
          )}
          {isMobile && (
            <>
              <button
                className="btn-icon mobile-menu-toggle"
                onClick={() => setMenuOpen(v => !v)}
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 0, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
                title="Quick actions"
                aria-label="Open quick actions"
                aria-expanded={menuOpen}
              >
                <span className="mobile-menu-glyph" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </button>
              {menuOpen && (
                <>
                  <button className="mobile-quick-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close quick actions" />
                  <div className="mobile-quick-menu">
                    <div className="mobile-landsat-row">
                      <span className="mobile-info-pill mobile-info-pill--cyan">LANDSAT 5/7/8/9</span>
                      <span className="mobile-info-pill mobile-info-pill--gold">⚡ L7→L8: 2013</span>
                    </div>
                    <div className="mobile-action-row">
                      <ExportPanel
                        stats={stats}
                        buttonClassName="mobile-action-btn mobile-action-btn--export"
                        buttonStyle={{ padding: "0 14px", borderRadius: 14, minHeight: 44, fontSize: 12, fontFamily: "var(--display)", fontWeight: 700, letterSpacing: ".5px", gap: 8, justifyContent: "center", flex: "1 1 0", width: "100%" }}
                        menuAlign="left"
                        onAction={() => setMenuOpen(false)}
                      />
                      <button
                        className="mobile-action-btn mobile-action-btn--about"
                        onClick={() => {
                          setMenuOpen(false);
                          setAboutOpen(true);
                        }}
                      >
                        <Info size={14} />
                        ABOUT
                      </button>
                    </div>
                    <div className="mobile-theme-row">
                      <button
                        className="mobile-action-btn mobile-action-btn--theme"
                        onClick={() => {
                          setTheme(t => t === 'dark' ? 'light' : 'dark');
                          setMenuOpen(false);
                        }}
                      >
                        {theme === 'dark' ? <ChandraIcon size={22} /> : <SuryaIcon size={18} />}
                        {theme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
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
      <div className={`tabs-wrap ${tab === "compare" ? "compare-mode" : ""}`}>
        <div className="tabs">
          <button className={`tab ${tab === "timelapse" ? "on" : ""}`} onClick={() => setTab("timelapse")}><Play size={11} />Timelapse</button>
          <button className={`tab ${tab === "compare" ? "on" : ""}`} onClick={() => setTab("compare")}><BarChart2 size={11} />Compare</button>
        </div>
        <GlobalSearchBar map={activeSearchMap} />
      </div>

      {/* ════════════ TIMELAPSE ════════════ */}
      {tab === "timelapse" && (
        isMobile ? (
          <div className="main-mobile">
            <div className="map-full">
              <TimelapseMap currentYear={currentYear} years={years} theme={theme} isPredicted={isPredicted} isMobile={isMobile} currentData={currentData} yoyChange={yoyChange} showHotspot={showHotspot} showAllClasses={showAllClasses} renderMode={renderMode} tifUrl={tifUrl} onMapReady={setTimelapseMapInstance} />

              <div className="sl-sec">
                <div className="sl-ticks">
                  {years.filter((_, i) => i % 3 === 0 || years[i] === 2013).map((y) => {
                    const i = years.indexOf(y);
                    return (<div key={y} className={`tick ${y === 2013 ? "sensor" : ""}`} style={{ left: `${(i / (years.length - 1)) * 100}%` }}>{y === 2013 ? '' : y}</div>);
                  })}
                </div>
                <div className="slider-track-wrap">
                  <div className="sensor-marker" style={{ left: `${(years.indexOf(2013) / (years.length - 1)) * 100}%` }} />
                  <input type="range" min={0} max={years.length - 1} value={yearIdx} style={{ "--fill": `${(yearIdx / (years.length - 1)) * 100}%` }} onChange={e => { setYearIdx(+e.target.value); setPlaying(false); }} />
                </div>
              </div>
              <ControlPanel
                playing={playing}
                setPlaying={setPlaying}
                speed={speed}
                setSpeed={setSpeed}
                showAllClasses={showAllClasses}
                setShowAllClasses={setShowAllClasses}
                showHotspot={showHotspot}
                setShowHotspot={setShowHotspot}
                isMobile={isMobile}
              />
            </div>
            <button className="sheet-tab-btn" onClick={() => setSheetOpen(true)}>
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
                  <StatsContent currentData={currentData} yoyChange={yoyChange} sparkData={sparkData} currentYear={currentYear} compact={false} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="main">
            <div className="mapp">
              <TimelapseMap currentYear={currentYear} years={years} theme={theme} isPredicted={isPredicted} isMobile={isMobile} currentData={currentData} yoyChange={yoyChange} showHotspot={showHotspot} showAllClasses={showAllClasses} renderMode={renderMode} tifUrl={tifUrl} onMapReady={setTimelapseMapInstance} />

              <div className="sl-sec">
                <div className="sl-ticks">
                  {years.filter((_, i) => i % 2 === 0).map((y) => {
                    const i = years.indexOf(y);
                    return (
                      <div key={y} className={`tick ${y === 2013 ? "sensor" : ""}`} style={{ left: `${(i / (years.length - 1)) * 100}%` }}>
                        {y}{y === 2013 && <div className="tickl" />}
                      </div>
                    );
                  })}
                </div>
                <div className="slider-track-wrap">
                  <div className="sensor-marker" style={{ left: `${(years.indexOf(2013) / (years.length - 1)) * 100}%` }} />
                  <input type="range" min={0} max={years.length - 1} value={yearIdx} style={{ "--fill": `${(yearIdx / (years.length - 1)) * 100}%` }} onChange={e => { setYearIdx(+e.target.value); setPlaying(false); }} />
                </div>
              </div>
              <ControlPanel
                playing={playing}
                setPlaying={setPlaying}
                speed={speed}
                setSpeed={setSpeed}
                showAllClasses={showAllClasses}
                setShowAllClasses={setShowAllClasses}
                showHotspot={showHotspot}
                setShowHotspot={setShowHotspot}
                isMobile={isMobile}
              />
            </div>
            <div className="sp">
              <StatsContent currentData={currentData} yoyChange={yoyChange} sparkData={sparkData} currentYear={currentYear} compact={false} />
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
              {compareMode === "swipe" && yearA && yearB && (
                <div style={{ flex: 1, position: "relative" }}>
                  <SwipeCompareMap urlA={renderMode === 'tiff' ? tifUrl(yearA) : `${BASE}/tiles/${yearA}_tile.png`} urlB={renderMode === 'tiff' ? tifUrl(yearB) : `${BASE}/tiles/${yearB}_tile.png`} yearA={yearA} yearB={yearB} isPredictedA={isPredictedA} isPredictedB={isPredictedB} renderMode={renderMode} onPrimaryMapReady={setSwipeMapInstance} baseMapUrl={baseMapUrl} />
                </div>
              )}
              {compareMode === "split" && (
                <div className="split-wrap">
                  <div className="split-half">
                    <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
                      {renderMode === 'tiff' ? <GeoRasterLayerComponent url={tifUrl(yearA)} opacity={0.82} /> : <ImageOverlay url={`${BASE}/tiles/${yearA}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />}
                      <MapRefController mapRef={splitMapARef} onReady={setSplitMapAInstance} />
                      <MapSyncController mapRef={splitMapARef} otherMapRef={splitMapBRef} syncRef={syncLock} />
                      <MapExtras />
                    </MapContainer>
                    <div className="split-lbl">{yearA}{isPredictedA && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</div>
                  </div>
                  <div className="split-half">
                    <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                      <ZoomControl position="bottomright" />
                      <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
                      {renderMode === 'tiff' ? <GeoRasterLayerComponent url={tifUrl(yearB)} opacity={0.82} /> : <ImageOverlay url={`${BASE}/tiles/${yearB}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />}
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
                      <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
                      <GeoRasterLayerComponent url={tifUrl(yearA)} opacity={0.82} />
                      <GeoRasterLayerComponent url={tifUrl(yearB)} opacity={0.82 * (opacityB / 100)} />
                      <MapRefController onReady={setOpacityMapInstance} />
                      <MapExtras />
                    </MapContainer>
                    <div style={{ position: "absolute", top: 10, left: 10, background: "var(--surface-soft)", backdropFilter: "blur(8px)", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 10px", zIndex: 10, pointerEvents: "none", display: "flex", alignItems: "center", gap: 6 }}>
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
            <button className="sheet-tab-btn" onClick={() => setSheetOpen(true)}>
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
                  <CompareStatsContent dataA={dataA} dataB={dataB} yearA={yearA} yearB={yearB} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="cmp-layout">
            <div className="cmp-col">
              <div className={`cmp-ctrl ${compareMode === "split" ? "split-active" : ""}`}>
                <div className="cmp-primary">
                  <span style={{ fontSize: 9, fontFamily: "var(--mono)", letterSpacing: 1, color: "var(--text3)" }}>YEAR A</span>
                  <select value={yearA} onChange={e => setYearA(+e.target.value)}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <span className="vs">VS</span>
                  <span style={{ fontSize: 9, fontFamily: "var(--mono)", letterSpacing: 1, color: "var(--text3)" }}>YEAR B</span>
                  <select value={yearB} onChange={e => setYearB(+e.target.value)}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
                <div className="cmp-secondary">
                  <div className="mg">
                    <button className={`mb ${compareMode === "swipe" ? "on" : ""}`} onClick={() => setCompareMode("swipe")}>⇄ Swipe</button>
                    <button className={`mb ${compareMode === "split" ? "on" : ""}`} onClick={() => setCompareMode("split")}>▌▐ Split</button>
                    <button className={`mb ${compareMode === "opacity" ? "on" : ""}`} onClick={() => setCompareMode("opacity")}>◑ Opacity</button>
                  </div>
                </div>
              </div>
              {compareMode === "swipe" && yearA && yearB && (
                <div style={{ flex: 1, position: "relative" }}>
                  <SwipeCompareMap urlA={renderMode === 'tiff' ? tifUrl(yearA) : `${BASE}/tiles/${yearA}_tile.png`} urlB={renderMode === 'tiff' ? tifUrl(yearB) : `${BASE}/tiles/${yearB}_tile.png`} yearA={yearA} yearB={yearB} isPredictedA={isPredictedA} isPredictedB={isPredictedB} renderMode={renderMode} onPrimaryMapReady={setSwipeMapInstance} baseMapUrl={baseMapUrl} />
                </div>
              )}
              {compareMode === "split" && (
                <div className="split-wrap" style={isMobile ? { flexDirection: 'column' } : undefined}>
                  {showChange && isConsecutive ? (
                    <div className="mapbox" style={{ flex: 1, position: "relative" }}>
                      <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                        <ZoomControl position="bottomright" />
                        <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
                        <ImageOverlay url={`${BASE}/change/${sY}_${bY}_change.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                        <MapRefController onReady={setChangeMapInstance} />
                        <MapExtras />
                      </MapContainer>
                      <div style={{ position: "absolute", bottom: 50, left: 12, display: "flex", gap: 5, zIndex: 10, pointerEvents: "none" }}>
                        {[{ c: "#8b0000", l: "Stable" }, { c: "#fb8500", l: "New" }, { c: "#4895ef", l: "Lost" }].map(x => (
                          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--text2)", background: "var(--surface-strong)", padding: "3px 6px", borderRadius: 4, border: "1px solid var(--border)" }}><div style={{ width: 7, height: 7, background: x.c, borderRadius: 1 }} />{x.l}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="split-half">
                        <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                          <ZoomControl position="bottomright" />
                          <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
                          {renderMode === 'tiff' ? <GeoRasterLayerComponent url={tifUrl(yearA)} opacity={0.82} /> : <ImageOverlay url={`${BASE}/tiles/${yearA}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />}
                          <MapRefController mapRef={splitMapARef} onReady={setSplitMapAInstance} />
                          <MapSyncController mapRef={splitMapARef} otherMapRef={splitMapBRef} syncRef={syncLock} />
                          <MapExtras />
                        </MapContainer>
                        <div className="split-lbl">{yearA}{isPredictedA && <span style={{ fontSize: 7, marginLeft: 3, background: "rgba(255,183,3,.15)", border: "1px solid rgba(255,183,3,.4)", color: "var(--gold)", borderRadius: 3, padding: "1px 3px" }}>PRED</span>}</div>
                      </div>
                      <div className="split-half">
                        <MapContainer bounds={KATHMANDU_BOUNDS} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                          <ZoomControl position="bottomright" />
                          <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
                          {renderMode === 'tiff' ? <GeoRasterLayerComponent url={tifUrl(yearB)} opacity={0.82} /> : <ImageOverlay url={`${BASE}/tiles/${yearB}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />}
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
                      <TileLayer url={baseMapUrl} attribution={CARTO_ATTR} />
                      {renderMode === 'tiff' ? (
                        <>
                          <GeoRasterLayerComponent url={tifUrl(yearA)} opacity={0.82} />
                          <GeoRasterLayerComponent url={tifUrl(yearB)} opacity={0.82 * (opacityB / 100)} />
                        </>
                      ) : (
                        <>
                          <ImageOverlay url={`${BASE}/tiles/${yearA}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82} />
                          <ImageOverlay url={`${BASE}/tiles/${yearB}_tile.png`} bounds={KATHMANDU_BOUNDS} opacity={0.82 * (opacityB / 100)} />
                        </>
                      )}
                      <MapRefController onReady={setOpacityMapInstance} />
                      <MapExtras />
                    </MapContainer>
                    <div style={{ position: "absolute", top: 12, left: 12, background: "var(--surface-soft)", backdropFilter: "blur(8px)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 11px", zIndex: 10, pointerEvents: "none", display: "flex", alignItems: "center", gap: 8 }}>
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
            <div className="csp"><CompareStatsContent dataA={dataA} dataB={dataB} yearA={yearA} yearB={yearB} /></div>
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
