import React from 'react';
import COLORS from '../colors';

export default function RouteSidebar({
  visible,
  route,
  booths,
  boothAssignments,
  vendors,
  routeMode,
  onRouteModeChange,
  onGenerateAutoRoute,
  onToggleBooth,
  onClearRoute,
  onExportRoute
}) {
  if (!visible) return null;

  const assignedBooths = booths
    .filter((booth) => boothAssignments[booth.id])
    .map((booth) => ({
      booth,
      vendor: vendors.find((vendor) => vendor.id === boothAssignments[booth.id])
    }))
    .filter(({ vendor }) => Boolean(vendor));

  const entrance = booths.find((booth) => booth.type === 'entrance');

  return (
    <div
      style={{
        width: '320px',
        flexShrink: 0,
        background: COLORS.background,
        padding: '16px',
        borderRight: `1px solid ${COLORS.border}`,
        overflow: 'auto'
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: COLORS.text }}>
        Visit Route Planning
      </h3>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onGenerateAutoRoute}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          ⚡ Generate Auto Route
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16
        }}
      >
        <button
          onClick={() => onRouteModeChange('auto')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: routeMode === 'auto' ? COLORS.primary : 'white',
            color: routeMode === 'auto' ? 'white' : COLORS.text,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Auto
        </button>
        <button
          onClick={() => onRouteModeChange('manual')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: routeMode === 'manual' ? COLORS.primary : 'white',
            color: routeMode === 'manual' ? 'white' : COLORS.text,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Manual
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onExportRoute}
          disabled={route.length === 0}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: route.length === 0 ? COLORS.textMuted : COLORS.accent,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: route.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 13
          }}
        >
          ⬇️ Export Route
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onClearRoute}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'white',
            color: COLORS.danger,
            border: `1px solid ${COLORS.danger}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Clear Route
        </button>
      </div>

      <div>
        <h4 style={{ margin: '0 0 8px', fontSize: 14, color: COLORS.text }}>Route Stops ({route.length})</h4>
        {entrance && (
          <div style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 8 }}>
            Start at {entrance.label || 'Entrance'}
          </div>
        )}
        {route.length === 0 && (
          <div style={{ fontSize: 13, color: COLORS.textLight }}>
            No booths in route. Switch to manual mode to select booths or generate automatically.
          </div>
        )}
        <ol style={{ paddingLeft: 18, color: COLORS.text }}>
          {route.map((boothId, index) => {
            const booth = booths.find((item) => item.id === boothId);
            const vendor = vendors.find((item) => item.id === boothAssignments[boothId]);
            if (!booth || !vendor) return null;
            return (
              <li key={boothId} style={{ marginBottom: 8, fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{booth.label}</div>
                <div style={{ color: COLORS.textLight }}>{vendor.company}</div>
              </li>
            );
          })}
        </ol>
      </div>

      {routeMode === 'manual' && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, color: COLORS.text }}>
            Toggle Booths In Route
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assignedBooths.map(({ booth, vendor }) => (
              <button
                key={booth.id}
                onClick={() => onToggleBooth(booth.id)}
                style={{
                  padding: '10px 12px',
                  background: route.includes(booth.id) ? COLORS.boothRoute : 'white',
                  border: `1px solid ${route.includes(booth.id) ? COLORS.accent : COLORS.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 600, color: COLORS.text }}>{booth.label}</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>{vendor.company}</div>
              </button>
            ))}
            {assignedBooths.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.textLight }}>
                Assign vendors to booths to build manual routes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
