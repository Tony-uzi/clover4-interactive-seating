import React from 'react';
import COLORS from './colors';

export default function SelectionInspector({
  visible,
  title = 'Selection',
  typeLabel,
  name,
  onNameChange,
  onDelete,
  canToggleOrientation = false,
  isVertical = false,
  onToggleOrientation,
  children
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 16,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.15)',
        border: `1px solid ${COLORS.border}`,
        width: 240,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 20
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {title}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
          {typeLabel}
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: COLORS.textLight }}>
        Widget Name
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Enter a name"
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            fontSize: 13,
            color: COLORS.text
          }}
        />
      </label>

      {canToggleOrientation && (
        <button
          onClick={onToggleOrientation}
          style={{
            padding: '8px 12px',
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {isVertical ? 'Set Horizontal' : 'Set Vertical'}
        </button>
      )}

      {children}

      <button
        onClick={onDelete}
        style={{
          padding: '6px 12px',
          background: COLORS.danger,
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Delete Widget
      </button>
    </div>
  );
}
