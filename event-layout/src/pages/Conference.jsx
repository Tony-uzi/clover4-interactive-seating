import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Arrow } from 'react-konva';
import COLORS from '../components/planner/colors.js';
import { DEFAULT_ROOM_DIMENSIONS } from '../components/planner/conference/constants.js';
import { mToPx, PX_PER_METER } from '../components/planner/utils.js';

const STORAGE_KEY = 'conference_planner_integrated_v1';

const TYPE_COLORS = {
  table_round: COLORS.booth,
  table_rect: COLORS.booth,
  chair: '#fde68a',
  podium: '#fca5a5',
  stage: '#a7f3d0',
  door: COLORS.warning,
  window: COLORS.primaryLight,
  blind_path: '#facc15'
};

function elementSize(element) {
  const scaleX = element.scaleX || 1;
  const scaleY = element.scaleY || 1;
  return {
    width: (element.w || 0) * PX_PER_METER * scaleX,
    height: (element.h || 0) * PX_PER_METER * scaleY
  };
}

function elementCenter(element) {
  const { width, height } = elementSize(element);
  return {
    x: (element.x || 0) + width / 2,
    y: (element.y || 0) + height / 2
  };
}

function loadConferenceData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        elements: [],
        guests: [],
        seatAssignments: {},
        roomWidth: DEFAULT_ROOM_DIMENSIONS.width,
        roomHeight: DEFAULT_ROOM_DIMENSIONS.height,
        canvasShape: 'rounded'
      };
    }
    const parsed = JSON.parse(stored);
    return {
      elements: Array.isArray(parsed.elements) ? parsed.elements : [],
      guests: Array.isArray(parsed.guests)
        ? parsed.guests.map((guest) => ({
            ...guest,
            tags: Array.isArray(guest.tags) ? guest.tags : []
          }))
        : [],
      seatAssignments: parsed.seatAssignments || {},
      roomWidth: parsed.roomWidth || DEFAULT_ROOM_DIMENSIONS.width,
      roomHeight: parsed.roomHeight || DEFAULT_ROOM_DIMENSIONS.height,
      canvasShape: parsed.canvasShape || 'rounded'
    };
  } catch (error) {
    console.warn('Failed to load conference kiosk data', error);
    return {
      elements: [],
      guests: [],
      seatAssignments: {},
      roomWidth: DEFAULT_ROOM_DIMENSIONS.width,
      roomHeight: DEFAULT_ROOM_DIMENSIONS.height,
      canvasShape: 'rounded'
    };
  }
}

export default function Conference() {
  const [elements, setElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [seatAssignments, setSeatAssignments] = useState({});
  const [roomWidth, setRoomWidth] = useState(DEFAULT_ROOM_DIMENSIONS.width);
  const [roomHeight, setRoomHeight] = useState(DEFAULT_ROOM_DIMENSIONS.height);
  const [canvasShape, setCanvasShape] = useState('rounded');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 960, height: 600 });

  useEffect(() => {
    const {
      elements: loadedElements,
      guests: loadedGuests,
      seatAssignments: loadedAssignments,
      roomWidth: loadedRoomWidth,
      roomHeight: loadedRoomHeight,
      canvasShape: loadedCanvasShape
    } = loadConferenceData();
    setElements(loadedElements);
    setGuests(loadedGuests);
    setSeatAssignments(loadedAssignments);
    setRoomWidth(loadedRoomWidth);
    setRoomHeight(loadedRoomHeight);
    setCanvasShape(loadedCanvasShape);
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize({ width: Math.max(320, width), height: Math.max(360, height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const guestAssignments = useMemo(() => {
    const map = new Map();
    Object.entries(seatAssignments || {}).forEach(([elementId, guestIds]) => {
      (guestIds || []).forEach((guestId) => {
        map.set(guestId, elementId);
      });
    });
    return map;
  }, [seatAssignments]);

  const selectedGuest = useMemo(() => guests.find((guest) => guest.id === selectedGuestId) || null, [guests, selectedGuestId]);

  const selectedElement = useMemo(() => {
    if (!selectedGuest) return null;
    const elementId = guestAssignments.get(selectedGuest.id);
    if (!elementId) return null;
    return elements.find((element) => element.id === elementId) || null;
  }, [selectedGuest, guestAssignments, elements]);

  const entranceElement = useMemo(
    () => elements.find((element) => element.type === 'door' || element.type === 'entrance') || null,
    [elements]
  );

  const suggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return guests.slice(0, 8);
    return guests.filter((guest) => guest.name && guest.name.toLowerCase().includes(term)).slice(0, 12);
  }, [guests, searchTerm]);

  const pathPoints = useMemo(() => {
    if (!entranceElement || !selectedElement) return null;
    const start = elementCenter(entranceElement);
    const end = elementCenter(selectedElement);
    return [start.x, start.y, end.x, end.y];
  }, [entranceElement, selectedElement]);

  const layoutWidth = mToPx(roomWidth);
  const layoutHeight = mToPx(roomHeight);
  let canvasCornerRadius = 12;
  if (canvasShape === 'rectangle') {
    canvasCornerRadius = 0;
  } else if (canvasShape === 'oval') {
    canvasCornerRadius = Math.min(layoutWidth, layoutHeight) / 2;
  }
  const margin = 40;
  const availableWidth = Math.max(1, stageSize.width - margin);
  const availableHeight = Math.max(1, stageSize.height - margin);
  const scale = Math.min(availableWidth / layoutWidth, availableHeight / layoutHeight);
  const offsetX = Math.max(0, (stageSize.width - layoutWidth * scale) / 2);
  const offsetY = Math.max(0, (stageSize.height - layoutHeight * scale) / 2);

  const handleSelectGuest = (guestId) => {
    setSelectedGuestId(guestId);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (suggestions.length > 0) {
      handleSelectGuest(suggestions[0].id);
    }
  };

  const renderElement = (element) => {
    const { width, height } = elementSize(element);
    const shapeType = element.shapeType || (element.type === 'table_round' ? 'circle' : 'rect');
    const isSelected = selectedElement && selectedElement.id === element.id;
    const fill = element.fillColor || TYPE_COLORS[element.type] || (element.seats && element.seats > 0 ? '#f8fafc' : '#e2e8f0');
    const label = element.label || '';

    const children = [];

    if (shapeType === 'circle') {
      const radius = Math.min(width, height) / 2;
      children.push(
        <Circle
          key="shape"
          x={width / 2}
          y={height / 2}
          radius={radius}
          fill={fill}
          stroke={COLORS.text}
          strokeWidth={1.5}
        />
      );
      if (isSelected) {
        children.push(
          <Circle
            key="highlight"
            x={width / 2}
            y={height / 2}
            radius={radius + 6}
            stroke={COLORS.accent}
            strokeWidth={3}
            dash={[10, 6]}
            listening={false}
          />
        );
      }
    } else if (shapeType === 'polygon' && Array.isArray(element.points) && element.points.length >= 3) {
      const polygonPoints = element.points.flatMap((point) => [point.x * width, point.y * height]);
      children.push(
        <Line
          key="shape"
          points={polygonPoints}
          closed
          fill={fill}
          stroke={COLORS.text}
          strokeWidth={1.5}
        />
      );
      if (isSelected) {
        children.push(
          <Line
            key="highlight"
            points={polygonPoints}
            closed
            stroke={COLORS.accent}
            strokeWidth={3}
            dash={[10, 6]}
            listening={false}
          />
        );
      }
    } else {
      children.push(
        <Rect
          key="shape"
          width={width}
          height={height}
          fill={fill}
          stroke={COLORS.text}
          strokeWidth={1.5}
          cornerRadius={4}
        />
      );
      if (isSelected) {
        children.push(
          <Rect
            key="highlight"
            width={width}
            height={height}
            stroke={COLORS.accent}
            strokeWidth={3}
            cornerRadius={4}
            dash={[10, 6]}
            listening={false}
          />
        );
      }
    }

    if (element.type === 'door') {
      children.push(
        <Line
          key="door-detail"
          points={[0, 0, 0, height]}
          stroke={COLORS.text}
          strokeWidth={1.5}
          listening={false}
        />
      );
    }

    if (element.type === 'window') {
      children.push(
        <Line
          key="window-1"
          points={[0, height * 0.25, width, height * 0.25]}
          stroke={COLORS.textLight}
          strokeWidth={1.5}
          listening={false}
        />
      );
      children.push(
        <Line
          key="window-2"
          points={[0, height * 0.75, width, height * 0.75]}
          stroke={COLORS.textLight}
          strokeWidth={1.5}
          listening={false}
        />
      );
    }

    if (element.type === 'blind_path') {
      const lineCount = 3;
      for (let i = 0; i < lineCount; i += 1) {
        const ratio = (i + 1) / (lineCount + 1);
        children.push(
          <Line
            key={`blind-${i}`}
            points={[ratio * width, 0, ratio * width, height]}
            stroke={COLORS.text}
            strokeWidth={1}
            dash={[6, 6]}
            listening={false}
          />
        );
      }
    }

    if (label) {
      children.push(
        <Text
          key="label"
          text={`${TYPE_LABELS[element.type] || '📦'} ${label}`}
          width={width}
          y={-18}
          align="center"
          fontSize={13}
          fill={COLORS.text}
          listening={false}
          fontStyle="bold"
        />
      );
    }

    return (
      <Group key={element.id} x={element.x || 0} y={element.y || 0} rotation={element.rotation || 0}>
        {children}
      </Group>
    );
  };

  return (
    <section className="page" style={{ background: COLORS.background }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header>
          <h1 className="editor-head" style={{ marginBottom: 8 }}>
            Conference Navigator
          </h1>
          <p className="editor-subtitle">
            Locate attendees instantly and guide them from the entrance to their assigned seat.
          </p>
        </header>

        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'stretch',
            minHeight: 520,
            flexWrap: 'wrap'
          }}
        >
          <aside
            style={{
              flex: '0 0 320px',
              maxWidth: '100%',
              background: 'white',
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="conference-search" style={{ fontWeight: 600, color: COLORS.text }}>
                Search Attendee
              </label>
              <input
                id="conference-search"
                type="search"
                placeholder="Enter attendee name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14
                }}
              />
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Matches ({suggestions.length})</div>
              {suggestions.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.textLight }}>No attendees found. Check the spelling or import data.</div>
              )}
              {suggestions.map((guest) => {
                const assignedElementId = guestAssignments.get(guest.id);
                const assignedElement = elements.find((element) => element.id === assignedElementId);
                return (
                  <button
                    type="button"
                    key={guest.id}
                    onClick={() => handleSelectGuest(guest.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 4,
                      padding: '10px 12px',
                      background: selectedGuestId === guest.id ? COLORS.boothRoute : 'white',
                      border: `1px solid ${selectedGuestId === guest.id ? COLORS.accent : COLORS.border}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{guest.name}</span>
                    <span style={{ fontSize: 12, color: COLORS.textLight }}>{guest.email || 'No email provided'}</span>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                      {assignedElement ? assignedElement.label || 'Assigned seat' : 'Seat not assigned'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                background: COLORS.backgroundLight,
                borderRadius: 10,
                padding: 16,
                border: `1px solid ${COLORS.border}`
              }}
            >
              <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>Attendee Details</div>
              {!selectedGuest && <div style={{ fontSize: 13, color: COLORS.textLight }}>Select an attendee to view details.</div>}
              {selectedGuest && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{selectedGuest.name}</div>
                  {selectedGuest.email && <div style={{ fontSize: 13, color: COLORS.textLight }}>{selectedGuest.email}</div>}
                  {selectedGuest.dietary && (
                    <div style={{ fontSize: 13, color: COLORS.text }}>
                      Dietary Preference: <strong>{selectedGuest.dietary}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: COLORS.text }}>
                    Seat: <strong>{selectedElement ? selectedElement.label || selectedElement.type : 'Not assigned'}</strong>
                  </div>
                  {entranceElement && (
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      Route starts from: {entranceElement.label || 'Entrance'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          <div
            ref={containerRef}
            style={{
              flex: '1 1 520px',
              minHeight: 520,
              background: 'white',
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: 16,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
              position: 'relative'
            }}
          >
            {elements.length === 0 ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textLight,
                  fontSize: 14
                }}
              >
                No layout data found. Import data in the planner to enable kiosk navigation.
              </div>
            ) : (
              <Stage width={stageSize.width} height={stageSize.height} listening={false}>
                <Layer>
                  <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
                    <Rect
                      x={0}
                      y={0}
                      width={layoutWidth}
                      height={layoutHeight}
                      fill="#ffffff"
                      stroke={COLORS.border}
                      strokeWidth={2}
                      cornerRadius={canvasCornerRadius}
                    />

                    {pathPoints && (
                      <Arrow
                        points={pathPoints}
                        stroke={COLORS.accent}
                        fill={COLORS.accent}
                        strokeWidth={6}
                        pointerLength={16}
                        pointerWidth={16}
                        dash={[12, 12]}
                        listening={false}
                      />
                    )}

                    {entranceElement && (
                      <Group key="entrance-marker">
                        <Circle
                          x={elementCenter(entranceElement).x}
                          y={elementCenter(entranceElement).y}
                          radius={12}
                          fill={COLORS.success}
                          opacity={0.8}
                          listening={false}
                        />
                        <Text
                          text="Entrance"
                          x={elementCenter(entranceElement).x - 40}
                          y={elementCenter(entranceElement).y - 34}
                          width={80}
                          align="center"
                          fontSize={12}
                          fill={COLORS.success}
                          listening={false}
                        />
                      </Group>
                    )}

                    {elements.map((element) => renderElement(element))}
                  </Group>
                </Layer>
              </Stage>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

