import React, { useEffect, useState } from 'react';
import COLORS from '../colors';

function parsePoints(pointsInput) {
  if (!pointsInput) return [];
  const segments = pointsInput
    .split(/\s*;\s*|\s*\n\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const points = segments.map((segment) => {
    const [rawX, rawY] = segment.split(',').map((value) => value.trim());
    const x = parseFloat(rawX);
    const y = parseFloat(rawY);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new Error(`Invalid point "${segment}"`);
    }
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  });

  if (points.length < 3) {
    throw new Error('Polygon requires at least three points.');
  }

  return points;
}

export default function CustomWidgetModal({ visible, onClose, onSubmit }) {
  const [name, setName] = useState('Custom Widget');
  const [seats, setSeats] = useState(0);
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [shapeType, setShapeType] = useState('rect');
  const [pointsInput, setPointsInput] = useState('0,0;1,0;1,1;0,1');
  const [fillColor, setFillColor] = useState('#94a3b8');
  const [error, setError] = useState('');

  if (!visible) return null;

  useEffect(() => {
    if (visible) {
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    if (shapeType === 'circle') {
      const normalized = Math.max(Number(width) || 1, Number(height) || 1);
      const fixed = normalized.toFixed(2);
      if (width !== fixed) setWidth(fixed);
      if (height !== fixed) setHeight(fixed);
    }
  }, [shapeType, width, height]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Widget name is required.');
      return;
    }

    const widthValue = Number(width);
    const heightValue = Number(height);
    const seatsValue = Number(seats);

    if (Number.isNaN(widthValue) || widthValue <= 0) {
      setError('Width must be a positive number.');
      return;
    }
    if (Number.isNaN(heightValue) || heightValue <= 0) {
      setError('Height must be a positive number.');
      return;
    }

    let parsedPoints;
    if (shapeType === 'polygon') {
      try {
        parsedPoints = parsePoints(pointsInput);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    const payload = {
      label: trimmedName,
      seats: Number.isNaN(seatsValue) ? 0 : Math.max(0, seatsValue),
      w: parseFloat(widthValue.toFixed(2)),
      h: parseFloat(heightValue.toFixed(2)),
      shapeType,
      points: parsedPoints,
      fillColor
    };

    onSubmit(payload);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        zIndex: 1000
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 420,
          maxWidth: '92%',
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 18px 36px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: COLORS.text }}>Create Custom Widget</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 18,
              cursor: 'pointer',
              color: COLORS.textLight
            }}
          >
            ✕
          </button>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: COLORS.text }}>
          Widget name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="VIP Lounge"
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              fontSize: 13
            }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: COLORS.text }}>
            Width (m)
            <input
              type="number"
              min={0.5}
              step={0.1}
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: COLORS.text }}>
            Height (m)
            <input
              type="number"
              min={0.5}
              step={0.1}
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: COLORS.text }}>
            Seats
            <input
              type="number"
              min={0}
              step={1}
              value={seats}
              onChange={(event) => setSeats(event.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: COLORS.text }}>
            Fill color
            <input
              type="color"
              value={fillColor}
              onChange={(event) => setFillColor(event.target.value)}
              style={{
                padding: 0,
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                height: 38
              }}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: COLORS.text }}>
          Shape type
          <select
            value={shapeType}
            onChange={(event) => setShapeType(event.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              fontSize: 13,
              background: '#fff'
            }}
          >
            <option value="rect">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="polygon">Custom polygon</option>
          </select>
        </label>

        {shapeType === 'polygon' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: COLORS.text }}>
            Polygon points
            <textarea
              value={pointsInput}
              onChange={(event) => setPointsInput(event.target.value)}
              rows={4}
              placeholder={'0,0; 1,0; 1,1; 0,1'}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13,
                resize: 'vertical'
              }}
            />
            <span style={{ fontSize: 12, color: COLORS.textLight }}>
              Enter points as pairs between 0 and 1 (x,y). Use semicolons or new lines to separate points.
            </span>
          </label>
        )}

        {error && (
          <div style={{ color: COLORS.danger, fontSize: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              background: COLORS.primary,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Save widget
          </button>
        </div>
      </form>
    </div>
  );
}
