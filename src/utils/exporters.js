function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportToCSV(stats) {
  const headers = [
    "Year",
    "Observed",
    "Built-up (km²)",
    "Built-up (%)",
    "Vegetation (km²)",
    "Vegetation (%)",
    "Cropland (km²)",
    "Cropland (%)",
    "Water (km²)",
    "Water (%)",
    "Total Area (km²)",
  ];

  const rows = stats.years.map((year) => {
    const data = stats.data[year];

    return [
      year,
      data.observed ? "Yes" : "No",
      data.builtup.area_km2.toFixed(2),
      data.builtup.pct.toFixed(2),
      data.vegetation.area_km2.toFixed(2),
      data.vegetation.pct.toFixed(2),
      data.cropland.area_km2.toFixed(2),
      data.cropland.pct.toFixed(2),
      data.water.area_km2.toFixed(2),
      data.water.pct.toFixed(2),
      data.total_valid_km2.toFixed(2),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  downloadFile(csv, "kathmandu_urban_growth_data.csv", "text/csv");
}

export function exportToJSON(stats) {
  const jsonData = JSON.stringify(stats, null, 2);
  downloadFile(jsonData, "kathmandu_urban_growth_data.json", "application/json");
}

export function exportToTextReport(stats) {
  const lines = [
    "═══════════════════════════════════════════════════════════════════",
    "    KATHMANDU VALLEY URBAN GROWTH ANALYSIS (2000-2030)",
    "    Land Use & Land Cover Classification Report",
    "═══════════════════════════════════════════════════════════════════",
    "",
    "DATA SOURCE: Landsat Collection 2 (2000-2023)",
    "PROCESSING: Google Earth Engine",
    "STUDY AREA: Kathmandu Valley (1,039 km²)",
    "MODEL: FlexConvLSTM Neural Network (67% accuracy)",
    "",
    "───────────────────────────────────────────────────────────────────",
    "BUILT-UP AREA GROWTH SUMMARY",
    "───────────────────────────────────────────────────────────────────",
    "",
  ];

  const firstYear = stats.years[0];
  const lastObserved = stats.years.filter((year) => stats.data[year].observed).slice(-1)[0];
  const lastYear = stats.years.slice(-1)[0];

  lines.push(
    `Initial (${firstYear}):     ${stats.data[firstYear].builtup.area_km2.toFixed(2)} km² (${stats.data[firstYear].builtup.pct.toFixed(1)}%)`,
  );
  lines.push(
    `Latest Observed (${lastObserved}): ${stats.data[lastObserved].builtup.area_km2.toFixed(2)} km² (${stats.data[lastObserved].builtup.pct.toFixed(1)}%)`,
  );
  lines.push(
    `Predicted (${lastYear}):   ${stats.data[lastYear].builtup.area_km2.toFixed(2)} km² (${stats.data[lastYear].builtup.pct.toFixed(1)}%)`,
  );
  lines.push("");
  lines.push(
    `Total Growth: +${(stats.data[lastYear].builtup.area_km2 - stats.data[firstYear].builtup.area_km2).toFixed(2)} km²`,
  );
  lines.push(
    `Growth Rate:  ${(((stats.data[lastYear].builtup.area_km2 / stats.data[firstYear].builtup.area_km2) - 1) * 100).toFixed(1)}%`,
  );
  lines.push("");
  lines.push("───────────────────────────────────────────────────────────────────");
  lines.push("YEAR-BY-YEAR DATA");
  lines.push("───────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("Year  Type  Built-up   Veg.    Crop.   Water   Coverage");
  lines.push("            (km²)      (km²)   (km²)   (km²)   (%)");
  lines.push("─────────────────────────────────────────────────────────────────");

  stats.years.forEach((year) => {
    const data = stats.data[year];
    const type = data.observed ? "OBS" : "PRED";

    lines.push(
      `${year}  ${type}   ${data.builtup.area_km2.toFixed(1).padStart(7)}  ` +
      `${data.vegetation.area_km2.toFixed(1).padStart(6)}  ` +
      `${data.cropland.area_km2.toFixed(1).padStart(6)}  ` +
      `${data.water.area_km2.toFixed(1).padStart(5)}  ` +
      `${data.builtup.pct.toFixed(1).padStart(5)}`,
    );
  });

  lines.push("");
  lines.push("───────────────────────────────────────────────────────────────────");
  lines.push("NOTES");
  lines.push("───────────────────────────────────────────────────────────────────");
  lines.push("• OBS = Observed data from satellite imagery (2000-2023)");
  lines.push("• PRED = Model predictions (2024-2030)");
  lines.push("• Classifications: Built-up, Vegetation, Cropland, Water");
  lines.push("• Sensor transition: Landsat 7 to Landsat 8 in 2013");
  lines.push("• Model: ConvLSTM with monotonic constraint");
  lines.push("• Accuracy: 67% new built-up recall, 28% Figure of Merit");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString().split("T")[0]}`);
  lines.push("═══════════════════════════════════════════════════════════════════");

  downloadFile(lines.join("\n"), "kathmandu_urban_growth_report.txt", "text/plain");
}
