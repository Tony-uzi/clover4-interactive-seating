import React from 'react';
import COLORS from '../colors';

export default function RoomCapacityPanel({ capacity, onChange, stats }) {
  const handleNumberChange = (field, value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      onChange({ ...capacity, [field]: '' });
    } else {
      onChange({ ...capacity, [field]: Math.round(parsed) });
    }
  };

  const tablesLimit = capacity?.tables || '';
  const attendeesLimit = capacity?.attendees || '';
  const tablesWarning = tablesLimit && stats?.tablesCount > tablesLimit;
  const attendeesWarning = attendeesLimit && stats?.seatsAvailable > attendeesLimit;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 16px',
        background: '#fff',
        borderBottom: `1px solid ${COLORS.border}`
      }}
    >
      <strong style={{ fontSize: 14, color: COLORS.text }}>Room Capacity</strong>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          Max tables
          <input
            type="number"
            min={0}
            step={1}
            value={tablesLimit}
            onChange={(event) => handleNumberChange('tables', event.target.value)}
            style={{
              width: 80,
              padding: '6px 8px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              fontSize: 13
            }}
          />
        </label>
        <label style={{ fontSize: 13, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          Max attendees
          <input
            type="number"
            min={0}
            step={1}
            value={attendeesLimit}
            onChange={(event) => handleNumberChange('attendees', event.target.value)}
            style={{
              width: 90,
              padding: '6px 8px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              fontSize: 13
            }}
          />
        </label>
      </div>

      {stats && (
        <div style={{ fontSize: 12, color: COLORS.textLight, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>
            Tables in layout: <strong style={{ color: tablesWarning ? COLORS.danger : COLORS.text }}>{stats.tablesCount}</strong>
            {tablesLimit ? ` / ${tablesLimit}` : ''}
          </span>
          <span>
            Seats available: <strong style={{ color: attendeesWarning ? COLORS.danger : COLORS.text }}>{stats.seatsAvailable}</strong>
            {attendeesLimit ? ` / ${attendeesLimit}` : ''}
          </span>
          <span>
            Guests imported: <strong style={{ color: COLORS.text }}>{stats.guestCount}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
