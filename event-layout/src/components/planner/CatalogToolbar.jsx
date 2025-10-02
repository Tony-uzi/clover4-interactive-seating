import React from 'react';
import COLORS from './colors';

export default function CatalogToolbar({ catalog, onAdd, buttonLabelPrefix = '+' }) {
  if (!catalog || catalog.length === 0) return null;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        padding: 12,
        borderBottom: `1px solid ${COLORS.border}`,
        background: '#fff'
      }}
    >
      {catalog.map((item) => (
        <button
          key={item.key}
          onClick={() => onAdd(item)}
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: '8px 12px',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          {buttonLabelPrefix} {item.label}
          {typeof item.seats === 'number' && item.seats > 0 && (
            <span style={{ fontSize: 11, color: COLORS.textLight }}>({item.seats} seats)</span>
          )}
        </button>
      ))}
    </div>
  );
}
