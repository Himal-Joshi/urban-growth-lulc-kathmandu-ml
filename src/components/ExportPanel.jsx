import { useState } from "react";
import { Download } from "lucide-react";
import { exportToCSV, exportToJSON, exportToTextReport } from "../utils/exporters";

export default function ExportPanel({
  stats,
  buttonStyle,
  buttonClassName = "",
  menuStyle,
  menuAlign = "right",
  onAction,
}) {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const resolvedMenuStyle = menuAlign === "left"
    ? { left: 0, right: "auto", ...menuStyle }
    : { right: 0, left: "auto", ...menuStyle };

  const closeMenu = () => {
    setDownloadMenuOpen(false);
    onAction?.();
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className={buttonClassName}
        onClick={() => setDownloadMenuOpen(v => !v)}
        style={{
          background: "rgba(251,133,0,.15)",
          border: "1px solid rgba(251,133,0,.3)",
          borderRadius: 6,
          padding: "5px 10px",
          cursor: "pointer",
          fontSize: 10,
          color: "#fb8500",
          fontFamily: "var(--mono)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 4,
          ...buttonStyle,
        }}
      >
        <Download size={12} /> EXPORT
      </button>
      {downloadMenuOpen && (
        <>
          <div
            onClick={() => setDownloadMenuOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 998 }}
          />
          <div className="download-menu" style={resolvedMenuStyle}>
            <button
              className="download-item"
              onClick={() => {
                exportToCSV(stats);
                closeMenu();
              }}
            >
              <span>📊</span>
              <div>
                <div className="dm-title">CSV Spreadsheet</div>
                <div className="dm-desc">Excel-compatible data</div>
              </div>
            </button>
            <button
              className="download-item"
              onClick={() => {
                exportToJSON(stats);
                closeMenu();
              }}
            >
              <span>⚙️</span>
              <div>
                <div className="dm-title">JSON Data</div>
                <div className="dm-desc">Raw structured data</div>
              </div>
            </button>
            <button
              className="download-item"
              onClick={() => {
                exportToTextReport(stats);
                closeMenu();
              }}
            >
              <span>📄</span>
              <div>
                <div className="dm-title">Text Report</div>
                <div className="dm-desc">Formatted summary</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
