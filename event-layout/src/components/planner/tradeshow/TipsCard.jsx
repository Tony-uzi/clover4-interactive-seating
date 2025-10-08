import React from 'react';
import COLORS from '../colors';

const MESSAGES = {
  layout: [
    { bold: 'Layout Mode:', text: 'Add booths and facilities from the catalog above. Drag to move, resize with handles.' },
    { bold: '', text: 'Double-click to delete a booth or facility.' }
  ],
  assign: [
    { bold: 'Vendor Mode:', text: 'Drag vendors from the sidebar onto booth spaces in the hall.' },
    { bold: '', text: 'Only booth-type spaces can accept vendors.' }
  ],
  route: [
    { bold: 'Route Mode:', text: 'Generate an automatic visitor route or toggle booths manually.' },
    { bold: '', text: 'Export the route for onsite teams once finalized.' }
  ]
};

export default function TipsCard({ mode }) {
  const lines = MESSAGES[mode] || [];

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
        maxWidth: 420
      }}
    >
      {lines.map(({ bold, text }) => (
        <div key={`${bold}${text}`}>
          {bold && <b>{bold}</b>} {text}
        </div>
      ))}
    </div>
  );
}
