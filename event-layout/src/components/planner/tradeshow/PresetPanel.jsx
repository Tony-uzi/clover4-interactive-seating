import React from 'react';
import COLORS from '../colors';

export default function PresetPanel({ visible, presets, onSelect }) {
  if (!visible) return null;

  return (
    <div
      style={{
        padding: 16,
        background: '#f0f9ff',
        borderBottom: `1px solid ${COLORS.secondary}`
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.text
        }}
      >
        Choose a Preset Layout
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 12
        }}
      >
        {presets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => onSelect(preset)}
            style={{
              padding: 16,
              background: 'white',
              border: `2px solid ${COLORS.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.borderColor = COLORS.primary;
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            <h4 style={{ margin: '0 0 6px', fontSize: 15, color: COLORS.text }}>
              {preset.name}
            </h4>
            <p style={{ margin: 0, fontSize: 12, color: COLORS.textLight }}>
              {preset.description}
            </p>
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: COLORS.textMuted
              }}
            >
              Hall size: {preset.hallWidth}m × {preset.hallHeight}m
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
