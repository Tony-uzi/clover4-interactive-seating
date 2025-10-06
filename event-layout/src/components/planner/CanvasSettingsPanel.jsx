import React from 'react';
import COLORS from './colors';

const SHAPE_OPTIONS = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded Corners' },
  { id: 'oval', label: 'Oval' },
  { id: 'custom', label: 'Irregular Polygon' }
];

export default function CanvasSettingsPanel({
  title = 'Canvas Settings',
  width,
  height,
  onWidthChange,
  onHeightChange,
  shape,
  onShapeChange
}) {
  const handleChange = (event, handler, minValue) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next)) {
      handler(minValue);
      return;
    }
    handler(Math.max(minValue, next));
  };

  return (
    <div
      style={{
        width: '100%',
        background: '#fff',
        borderBottom: `1px solid ${COLORS.border}`,
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center'
      }}
    >
      <strong style={{ fontSize: 14, color: COLORS.text }}>{title}</strong>
      <label style={{ fontSize: 13, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 6 }}>
        Width (m)
        <input
          type="number"
          min={5}
          step={1}
          value={width}
          onChange={(event) => handleChange(event, onWidthChange, 5)}
          style={{
            width: 70,
            padding: '4px 6px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            fontSize: 13
          }}
        />
      </label>
      <label style={{ fontSize: 13, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 6 }}>
        Height (m)
        <input
          type="number"
          min={5}
          step={1}
          value={height}
          onChange={(event) => handleChange(event, onHeightChange, 5)}
          style={{
            width: 70,
            padding: '4px 6px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            fontSize: 13
          }}
        />
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.text }}>
        Shape
        <select
          value={shape}
          onChange={(event) => onShapeChange(event.target.value)}
          style={{
            padding: '4px 8px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            fontSize: 13,
            background: '#fff'
          }}
        >
          {SHAPE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
