import React from 'react';
import COLORS from './colors';

const DEFAULT_METERS = 5;
const MIN_BAR_PX = 80;
const MAX_BAR_PX = 220;

export default function ScaleIndicator({
  zoom = 1,
  meters = DEFAULT_METERS,
  pxPerMeter,
  labelPrefix = 'Scale'
}) {
  if (!pxPerMeter) return null;

  let displayMeters = meters;
  let barLength = pxPerMeter * zoom * displayMeters;

  const minMeters = meters / 8;
  const maxMeters = meters * 8;

  while (barLength > MAX_BAR_PX && displayMeters > minMeters) {
    displayMeters /= 2;
    barLength = pxPerMeter * zoom * displayMeters;
  }

  while (barLength < MIN_BAR_PX && displayMeters < maxMeters) {
    displayMeters *= 2;
    barLength = pxPerMeter * zoom * displayMeters;
  }

  barLength = Math.max(MIN_BAR_PX, Math.min(MAX_BAR_PX, barLength));

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        background: 'rgba(255,255,255,0.92)',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        padding: '8px 12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        fontSize: 11,
        color: COLORS.text,
        minWidth: 140
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {labelPrefix}: {parseFloat(displayMeters.toFixed(2))} m
      </div>
      <div
        style={{
          height: 10,
          width: barLength,
          background: COLORS.text,
          borderRadius: 2
        }}
      />
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', color: COLORS.textLight }}>
        <span>0</span>
        <span>{parseFloat(displayMeters.toFixed(2))} m</span>
      </div>
    </div>
  );
}
