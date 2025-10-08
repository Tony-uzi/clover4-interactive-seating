import React from 'react';
import COLORS from '../colors';

export default function TipsCard({ mode }) {
  const isLayout = mode === 'layout';
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        fontSize: 12,
        background: 'rgba(255,255,255,0.95)',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        padding: '8px 12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        maxWidth: 400
      }}
    >
      {isLayout ? (
        <>
          <div>
            <b>Layout Mode:</b> Add furniture by clicking buttons above.
          </div>
          <div>Double-click to delete. Drag to move. Use corner handles to resize/rotate.</div>
        </>
      ) : (
        <>
          <div>
            <b>Assign Mode:</b> Drag guests from the left sidebar to tables/chairs on canvas.
          </div>
          <div>Only elements with seats (tables, chairs) can be assigned guests.</div>
        </>
      )}
    </div>
  );
}
