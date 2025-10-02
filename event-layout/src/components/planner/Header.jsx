import React from 'react';
import COLORS from './colors';

export default function PlannerHeader({
  title,
  modes,
  currentMode,
  onModeChange,
  showPresets,
  onTogglePresets,
  showCSV,
  onToggleCSV,
  zoom,
  onZoomIn,
  onZoomOut,
  gridOn,
  onToggleGrid,
  extraCounts = {}
}) {
  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderBottom: `1px solid ${COLORS.border}`,
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
    }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "white" }}>
        {title}
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        {onTogglePresets && (
          <button
            onClick={onTogglePresets}
            style={{
              padding: "8px 16px",
              background: showPresets ? COLORS.warning : "white",
              color: showPresets ? "white" : COLORS.text,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}
          >
            📋 {showPresets ? "Hide" : "Show"} Presets
          </button>
        )}

        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            style={{
              padding: "8px 16px",
              background: currentMode === mode.id ? COLORS.primary : "white",
              color: currentMode === mode.id ? "white" : COLORS.text,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}
          >
            {mode.icon} {mode.label} {mode.showCount && extraCounts[mode.id] !== undefined ? `(${extraCounts[mode.id]})` : ''}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onToggleCSV && (
          <button
            onClick={onToggleCSV}
            style={{
              padding: "6px 12px",
              background: showCSV ? COLORS.danger : COLORS.success,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13
            }}
          >
            {showCSV ? "Hide" : "Import"}
          </button>
        )}

        <button
          onClick={onZoomOut}
          style={{
            border: "1px solid #fff",
            borderRadius: 6,
            padding: "4px 8px",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            cursor: "pointer",
            fontSize: 13
          }}
        >
          −
        </button>

        <div style={{
          fontSize: 13,
          width: 56,
          textAlign: "center",
          color: "white",
          fontWeight: 600
        }}>
          {Math.round(zoom * 100)}%
        </div>

        <button
          onClick={onZoomIn}
          style={{
            border: "1px solid #fff",
            borderRadius: 6,
            padding: "4px 8px",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            cursor: "pointer",
            fontSize: 13
          }}
        >
          +
        </button>

        <label style={{
          marginLeft: 8,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "white"
        }}>
          <input
            type="checkbox"
            checked={gridOn}
            onChange={(e) => onToggleGrid(e.target.checked)}
          />
          Grid
        </label>
      </div>
    </div>
  );
}