# 🛰️ Prediction of Urban Growth & Densification and LULC Dynamics Using Temporal Machine Learning Models on Landsat (30 m) Time Series

> Analyzing and predicting urban expansion and Land Use/Land Cover (LULC) dynamics in the **Kathmandu Valley, Nepal** using machine learning models trained on Landsat 30m time series data spanning **2000–2022**.

---

## 📌 Overview

Kathmandu Valley has experienced rapid and largely unplanned urbanization over the past two decades. This project uses multi-temporal Landsat satellite imagery to:

- Classify LULC across four major land cover classes
- Track year-by-year changes in built-up area, vegetation, cropland, and water
- Identify urban growth hotspots by era of first appearance
- Predict future urban expansion using temporal machine learning models

An interactive visualization dashboard is built in React to explore the timelapse, compare years, and inspect statistics.

---

## 🗺️ Study Area

| Parameter | Value |
|-----------|-------|
| Location | Kathmandu Valley, Nepal |
| Total Valid Area | 1,039.02 km² |
| Spatial Resolution | 30 m (Landsat) |
| Study Period | 2000 – 2022 |
| Coordinate System | WGS 84 |

---

## 📡 Data Sources

| Source | Details |
|--------|---------|
| **Landsat 5 TM** | 2000 – 2011 |
| **Landsat 7 ETM+** | Pre-2013 (SLC-on) |
| **Landsat 8 OLI** | 2013 – 2021 |
| **Landsat 9 OLI-2** | 2022 |
| **Platform** | Google Earth Engine |
| **Collection** | Landsat Collection 2, Surface Reflectance |

> ⚡ **Note:** A sensor switch from Landsat 7 to Landsat 8 occurred in **2013**, which may cause minor discontinuities in the time series.

---

## 🏷️ LULC Classification

| Class | Color | Description |
|-------|-------|-------------|
| 🏙️ Built-up | Red | Urban areas, roads, impervious surfaces |
| 🌿 Vegetation | Green | Forest, shrubland, open green spaces |
| 🌾 Cropland | Tan/Yellow | Agricultural land, seasonal crops |
| 💧 Water | Blue | Rivers, ponds, wetlands |

---

## 📊 Key Findings

| Year | Built-up Area | Coverage |
|------|--------------|----------|
| 2000 | 93.56 km² | 9.00% |
| 2005 | 93.11 km² | 8.96% |
| 2010 | 109.83 km² | 10.57% |
| 2015 | 121.83 km² | 11.73% |
| 2018 | 167.11 km² | 16.08% |
| 2020 | 181.28 km² | 17.45% |
| 2022 | **184.57 km²** | **17.76%** |

> Built-up area nearly **doubled** between 2000 and 2022, growing by ~91 km².

---

## 🔥 Urban Growth Hotspots

Hotspot analysis classifies pixels by the **era of first urbanization**:

| Era | Color |
|-----|-------|
| Pre-2005 | Purple |
| 2005–2010 | Red |
| 2010–2015 | Orange |
| 2015–2020 | Amber |
| 2020+ | Yellow |

---

## 🖥️ Visualization Dashboard

An interactive React dashboard is included for exploring the data:

### Features
- **Timelapse** — animated year-by-year playback with adjustable speed (0.5×, 1×, 2×, 4×)
- **Compare** — side-by-side split-view comparison of any two years with a draggable divider
- **Change Layer** — built-up change overlay showing stable, new, and lost areas (consecutive years)
- **Hotspot Overlay** — era-based urbanization heatmap
- **Live Stats** — built-up area, coverage %, year-on-year change, growth trajectory chart

### Running the Dashboard

```bash
# Navigate to the dashboard folder
cd kathmandu-viz

# Install dependencies
npm install

# Start the development server
npm run dev
```


### Data Folder Structure

```
public/
└── data/
    ├── stats.json
    ├── tiles/
    │   ├── 2000_tile.png        # Full LULC map
    │   ├── 2000_builtup.png     # Built-up mask only
    │   └── ...
    ├── change/
    │   ├── 2000_2001_change.png # Change between consecutive years
    │   └── ...
    └── hotspot/
        └── hotspot.png
```

### Tech Stack

| Tool | Purpose |
|------|---------|
| React + Vite | Frontend framework |
| Recharts | Area chart / sparkline |
| Lucide React | Icons |
| Google Earth Engine | Satellite data processing |
| Landsat Collection 2 | Raw imagery |

---

## 📁 Project Structure

```
urban-growth-lulc-kathmandu-ml/
├── kathmandu-viz/          # React visualization dashboard
│   ├── public/data/        # Tile PNGs and stats.json
│   └── src/App.jsx         # Main app component
├── data/                   # Raw stats and analysis outputs
│   ├── stats.json
│   ├── tiles/
│   ├── change/
│   └── hotspot/
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ (or v18 with Vite 4)
- npm

### Installation

```bash
git clone https://github.com/Himal-Joshi/urban-growth-lulc-kathmandu-ml.git
cd urban-growth-lulc-kathmandu-ml/kathmandu-viz
npm install
npm run dev
```

---

## 📜 License

This project is for academic and research purposes.



---

*Data: Landsat Collection 2 via Google Earth Engine · Spatial Resolution: ~30m/px · Valley Area: 1,039.02 km²*