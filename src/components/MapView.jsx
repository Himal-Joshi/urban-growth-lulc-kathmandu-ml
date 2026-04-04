import { MapContainer, TileLayer, ImageOverlay } from "react-leaflet";
import GeoRasterLayerComponent from "../GeoRasterLayerComponent";

// Map constants
export const BASE = "/urban-growth-lulc-kathmandu-ml/data";
export const KATHMANDU_BOUNDS = [[27.3837, 85.1690], [27.8247, 85.5750]];
export const CARTO_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
export const CARTO_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
export const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

export const LULC = {
  builtup: { color: "#ff4d6d", grad: ["#ff4d6d", "#c9184a"], label: "Built-up", icon: "🏙️" },
  vegetation: { color: "#40916c", grad: ["#52b788", "#40916c"], label: "Vegetation", icon: "🌿" },
  cropland: { color: "#e9c46a", grad: ["#e9c46a", "#c9a84c"], label: "Cropland", icon: "🌾" },
  water: { color: "#4895ef", grad: ["#4cc9f0", "#4895ef"], label: "Water", icon: "💧" },
};

export const HOTSPOT_LEGEND = [
  { color: "#9d4edd", label: "Pre-2005" },
  { color: "#ff4d6d", label: "2005–2010" },
  { color: "#fb8500", label: "2010–2015" },
  { color: "#ffb703", label: "2015–2020" },
  { color: "#f8f9fa", label: "2020+" },
];

export default function MapView({
  currentYear,
  years,
  isPredicted,
  isMobile,
  currentData,
  yoyChange,
  showHotspot,
  showAllClasses,
  renderMode,
  tifUrl,
  theme,
  onMapReady,
  MapRefController,
  MapExtras,
}) {
  return (
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
        <MapExtras />
      </MapContainer>
      
      {/* Year Badge */}
      <div className="yr-badge">
        <span className="yr-num">{currentYear}</span>
        {isPredicted && <span className="pred-tag">{isMobile ? "PRED" : "PREDICTED"}</span>}
      </div>
      
      {/* Mobile Stats Overlay */}
      {isMobile && (
        <div className="stat-ov-mobile">
          <div className="sol">BUILT-UP</div>
          <div className="sov">{currentData?.builtup.area_km2.toFixed(1)}<span className="sou"> km²</span></div>
          <div className="sop">{currentData?.builtup.pct.toFixed(1)}% coverage</div>
          {yoyChange !== null && (
            <div className="soc" style={{ color: yoyChange >= 0 ? "#fb8500" : "var(--blue)" }}>
              {yoyChange >= 0 ? "▲" : "▼"} {Math.abs(yoyChange).toFixed(1)} km²
            </div>
          )}
        </div>
      )}
      
      {/* Legend */}
      <div className="leg">
        {(showHotspot ? HOTSPOT_LEGEND : Object.entries(LULC).map(([, v]) => ({ color: v.color, label: v.label }))).map(it => (
          <div key={it.label} className="li">
            <div className="ld" style={{ background: it.color }} />
            {it.label}
          </div>
        ))}
      </div>
      
      {/* Prediction Disclaimer */}
      {isPredicted && (
        <div style={{
          position: "absolute",
          bottom: isMobile ? 48 : 34,
          right: isMobile ? 55 : 42,
          maxWidth: isMobile ? 180 : 168,
          background: "var(--surface-strong)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(76,201,240,.3)",
          borderRadius: 7,
          padding: isMobile ? "7px 10px" : "6px 10px",
          zIndex: 5,
          pointerEvents: "none"
        }}>
          <div style={{
            fontSize: 9,
            fontFamily: "var(--mono)",
            color: "#4cc9f0",
            fontWeight: 600,
            marginBottom: 3,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            ⚠️ PREDICTION
          </div>
          <div style={{ fontSize: 9, color: "var(--text2)", lineHeight: isMobile ? 1.4 : 1.45 }}>
            Model prediction based on {isMobile ? "2000-2023 patterns" : "historical patterns (2000-2023)"}
          </div>
        </div>
      )}
    </div>
  );
}
