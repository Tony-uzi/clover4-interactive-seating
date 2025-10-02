import React from 'react';
import COLORS from '../colors';

export default function GuestSidebar({
  visible,
  unassignedGuests,
  allGuests,
  seatAssignments,
  elements,
  onRemove,
  onDragStart,
  onDragEnd
}) {
  if (!visible) return null;

  const assignmentEntries = elements
    .filter((element) => seatAssignments[element.id] && seatAssignments[element.id].length > 0)
    .map((element) => ({
      element,
      guests: seatAssignments[element.id]
    }));

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
        Available Guests ({unassignedGuests.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {unassignedGuests.map((guest) => (
          <div
            key={guest.id}
            draggable
            onDragStart={(event) => onDragStart(event, guest.id)}
            onDragEnd={onDragEnd}
            style={{
              padding: '12px',
              background: 'white',
              border: `2px solid ${COLORS.border}`,
              borderRadius: '6px',
              cursor: 'grab',
              transition: 'all 0.2s'
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.borderColor = COLORS.primary;
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: COLORS.text }}>
              {guest.name}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textLight }}>{guest.email}</div>
            {guest.dietary && (
              <div style={{ fontSize: '11px', color: COLORS.textLight, marginTop: '4px' }}>
                🍽️ {guest.dietary}
              </div>
            )}
          </div>
        ))}

        {unassignedGuests.length === 0 && allGuests.length > 0 && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: COLORS.textLight,
              fontSize: '13px'
            }}
          >
            All guests are assigned!
          </div>
        )}

        {allGuests.length === 0 && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: COLORS.textLight,
              fontSize: '13px'
            }}
          >
            No guests imported yet. Click "Import Guests" to add.
          </div>
        )}
      </div>

      {assignmentEntries.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: COLORS.text }}>
            Seat Assignments
          </h3>
          {assignmentEntries.map(({ element, guests }) => (
            <div
              key={element.id}
              style={{
                marginBottom: 12,
                padding: 10,
                background: 'white',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: COLORS.text }}>
                {element.label}
              </div>
              {guests.map((guestId) => {
                const guest = allGuests.find((item) => item.id === guestId);
                if (!guest) return null;
                return (
                  <div
                    key={guestId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: '#fef3c7',
                      borderRadius: 4,
                      marginBottom: 4,
                      fontSize: 12
                    }}
                  >
                    <span>{guest.name}</span>
                    <button
                      onClick={() => onRemove(guestId, element.id)}
                      style={{
                        padding: '2px 6px',
                        background: COLORS.danger,
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontSize: 10
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
