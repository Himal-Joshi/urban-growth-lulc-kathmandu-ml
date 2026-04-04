import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import parseGeoRaster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

// LULC class value → color mapping (matches the project palette)
const LULC_COLORS = {
  1: [255, 77, 109],   // Built-up    → #ff4d6d
  2: [64, 145, 108],   // Vegetation  → #40916c
  3: [233, 196, 106],  // Cropland    → #e9c46a
  4: [72, 149, 239],   // Water       → #4895ef
};

// Cache parsed GeoRaster objects so we don't re-fetch on every render
const geoRasterCache = new Map();

function getOrFetchGeoRaster(url) {
  if (geoRasterCache.has(url)) {
    return geoRasterCache.get(url);
  }
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      return res.arrayBuffer();
    })
    .then((arrayBuffer) => parseGeoRaster(arrayBuffer))
    .catch((err) => {
      // Remove failed entries so they can be retried
      geoRasterCache.delete(url);
      throw err;
    });
  geoRasterCache.set(url, promise);
  return promise;
}

export default function GeoRasterLayerComponent({ url, opacity = 0.82 }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!map || !url) return undefined;

    let cancelled = false;

    // Clean up previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    getOrFetchGeoRaster(url)
      .then((georaster) => {
        if (cancelled) return;

        const layer = new GeoRasterLayer({
          georaster,
          opacity,
          resolution: 256,
          pixelValuesToColorFn: (values) => {
            const val = values[0];
            if (val === 0 || val === null || val === undefined) return null; // nodata → transparent
            const rgb = LULC_COLORS[val];
            if (!rgb) return null;
            return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
          },
        });

        layerRef.current = layer;
        layer.addTo(map);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[GeoRasterLayer] Failed to load GeoTIFF:", url, err);
          setError(err);
        }
      });

    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, url]);

  // Update opacity dynamically without re-fetching
  useEffect(() => {
    if (layerRef.current) layerRef.current.setOpacity(opacity);
  }, [opacity]);

  return null;
}
