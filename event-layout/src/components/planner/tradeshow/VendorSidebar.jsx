import React from 'react';
import COLORS from '../colors';

export default function VendorSidebar({
  visible,
  unassignedVendors,
  allVendors,
  boothAssignments,
  booths,
  onRemove,
  onDragStart,
  onDragEnd
}) {
  if (!visible) return null;

  const assignments = booths
    .filter((booth) => boothAssignments[booth.id])
    .map((booth) => ({
      booth,
      vendor: allVendors.find((vendor) => vendor.id === boothAssignments[booth.id])
    }))
    .filter(({ vendor }) => Boolean(vendor));

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
        Available Vendors ({unassignedVendors.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {unassignedVendors.map((vendor) => (
          <div
            key={vendor.id}
            draggable
            onDragStart={(event) => onDragStart(event, vendor.id)}
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
              {vendor.company}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textLight }}>
              Contact: {vendor.contact}
            </div>
            <div style={{ fontSize: '11px', color: COLORS.textLight, marginTop: '4px' }}>
              📁 {vendor.category} | 🏢 {vendor.booth_size}
            </div>
          </div>
        ))}

        {unassignedVendors.length === 0 && allVendors.length > 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textLight, fontSize: '13px' }}>
            All vendors assigned!
          </div>
        )}

        {allVendors.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textLight, fontSize: '13px' }}>
            No vendors imported yet. Click "Import Vendors" to add.
          </div>
        )}
      </div>

      {assignments.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: COLORS.text }}>
            Booth Assignments
          </h3>
          {assignments.map(({ booth, vendor }) => (
            <div
              key={booth.id}
              style={{
                marginBottom: 12,
                padding: 10,
                background: 'white',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: COLORS.text }}>
                {booth.label}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: COLORS.boothAssigned,
                  borderRadius: 4,
                  fontSize: 12
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.text }}>{vendor.company}</div>
                  <div style={{ fontSize: 10, color: COLORS.textLight }}>{vendor.category}</div>
                </div>
                <button
                  onClick={() => onRemove(booth.id)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
