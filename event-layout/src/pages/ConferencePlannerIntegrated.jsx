import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import PlannerHeader from '../components/planner/Header.jsx';
import CatalogToolbar from '../components/planner/CatalogToolbar.jsx';
import CSVImport from '../components/planner/CSVImport.jsx';
import Grid from '../components/planner/Grid.jsx';
import COLORS from '../components/planner/colors.js';
import { mToPx, snapPx, generateId, PX_PER_METER } from '../components/planner/utils.js';
import ElementNode from '../components/planner/conference/ElementNode.jsx';
import GuestSidebar from '../components/planner/conference/GuestSidebar.jsx';
import TipsCard from '../components/planner/conference/TipsCard.jsx';
import { CONFERENCE_CATALOG, DEFAULT_ROOM_DIMENSIONS } from '../components/planner/conference/constants.js';
import ScaleIndicator from '../components/planner/ScaleIndicator.jsx';

const STORAGE_KEY = 'conference_planner_integrated_v1';

const MODES = [
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'assign', label: 'Assign', icon: '👥', showCount: true }
];

export default function ConferencePlannerIntegrated() {
  const [mode, setMode] = useState('layout');
  const [elements, setElements] = useState([]);
  const [gridOn, setGridOn] = useState(true);
  const [zoom, setZoom] = useState(0.8);
  const [stagePos, setStagePos] = useState({ x: 40, y: 40 });
  const stageRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  const [guests, setGuests] = useState([]);
  const [csvText, setCsvText] = useState('');
  const [showCSVPanel, setShowCSVPanel] = useState(false);
  const [seatAssignments, setSeatAssignments] = useState({});
  const [isDraggingGuest, setIsDraggingGuest] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);

  const [roomWidth] = useState(DEFAULT_ROOM_DIMENSIONS.width);
  const [roomHeight] = useState(DEFAULT_ROOM_DIMENSIONS.height);

  const hasLoadedRef = useRef(false);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.elements) setElements(parsed.elements);
      if (parsed.guests) setGuests(parsed.guests);
      if (parsed.seatAssignments) setSeatAssignments(parsed.seatAssignments);
    } catch (error) {
      console.warn('Failed to restore conference planner state', error);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const payload = JSON.stringify({ elements, guests, seatAssignments });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [elements, guests, seatAssignments]);

  useEffect(() => {
    setIsDraggingElement(false);
    setIsDraggingGuest(false);
  }, [mode]);

  useEffect(() => {
    if (!hasLoadedRef.current || hasSeededRef.current) return;
    if (elements.length > 0) {
      hasSeededRef.current = true;
      return;
    }

    const defaults = [
      {
        id: generateId('door'),
        type: 'door',
        label: 'Main Door',
        seats: 0,
        x: snapPx(mToPx(roomWidth / 2 - 0.6)),
        y: snapPx(mToPx(roomHeight - 0.4)),
        w: 1.2,
        h: 0.3,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      },
      {
        id: generateId('window'),
        type: 'window',
        label: 'North Window',
        seats: 0,
        x: snapPx(mToPx(4)),
        y: snapPx(mToPx(0.2)),
        w: 2.4,
        h: 0.25,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      },
      {
        id: generateId('blind'),
        type: 'blind_path',
        label: 'Tactile Path',
        seats: 0,
        x: snapPx(mToPx(2)),
        y: snapPx(mToPx(4)),
        w: 0.6,
        h: 6,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      }
    ];

    setElements(defaults);
    hasSeededRef.current = true;
  }, [elements, roomHeight, roomWidth]);

  const handleAddItem = (catalogItem) => {
    const id = generateId('elem');
    const node = {
      id,
      type: catalogItem.type,
      label: catalogItem.label,
      seats: catalogItem.seats || 0,
      x: snapPx(mToPx(2)),
      y: snapPx(mToPx(2)),
      w: catalogItem.w,
      h: catalogItem.h,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };
    setElements((prev) => [...prev, node]);
    setSelectedId(id);
  };

  const handleChangeNode = (node) => {
    setElements((prev) => prev.map((item) => (item.id === node.id ? node : item)));
  };

  const handleDeleteNode = (id) => {
    setElements((prev) => prev.filter((item) => item.id !== id));
    setSeatAssignments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedId === id) setSelectedId(null);
  };

  const handleStageMouseDown = (event) => {
    if (event.target === event.target.getStage()) setSelectedId(null);
  };

  const handleWheel = (event) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };
    const direction = event.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    const nextScale = Math.min(3, Math.max(0.2, oldScale * direction));
    const nextPos = {
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale
    };
    setZoom(nextScale);
    setStagePos(nextPos);
  };

  const zoomBy = (factor) => {
    setZoom((prev) => Math.min(3, Math.max(0.2, prev * factor)));
  };

  const assignGuestToElement = (guestId, elementId) => {
    const element = elements.find((item) => item.id === elementId);
    if (!element) return;

    const currentAssignments = seatAssignments[elementId] || [];
    if (element.seats > 0 && currentAssignments.length >= element.seats) {
      alert(`This ${element.label} is full! (${element.seats} seats)`);
      return;
    }

    setSeatAssignments((prev) => ({
      ...prev,
      [elementId]: [...(prev[elementId] || []), guestId]
    }));
  };

  const removeGuestFromElement = (guestId, elementId) => {
    setSeatAssignments((prev) => ({
      ...prev,
      [elementId]: (prev[elementId] || []).filter((id) => id !== guestId)
    }));
  };

  const unassignedGuests = useMemo(() => {
    const assignedIds = new Set();
    Object.values(seatAssignments).forEach((assignment) => {
      assignment.forEach((guestId) => assignedIds.add(guestId));
    });
    return guests.filter((guest) => !assignedIds.has(guest.id));
  }, [guests, seatAssignments]);

  const handleGuestDragStart = (event, guestId) => {
    event.dataTransfer.setData('guestId', guestId);
    event.dataTransfer.effectAllowed = 'move';
    setIsDraggingGuest(true);
  };

  const handleGuestDragEnd = () => {
    setIsDraggingGuest(false);
  };

  const handleCanvasDrop = (event) => {
    event.preventDefault();
    const guestId = event.dataTransfer.getData('guestId');
    if (!guestId) return;
    const stage = stageRef.current;
    if (!stage) return;

    const containerRect = stage.container().getBoundingClientRect();
    const relativeX = event.clientX - containerRect.left;
    const relativeY = event.clientY - containerRect.top;
    const stageX = (relativeX - stagePos.x) / zoom;
    const stageY = (relativeY - stagePos.y) / zoom;

    const droppedOn = elements.find((element) => {
      if (element.seats === 0) return false;
      const width = element.w * PX_PER_METER * element.scaleX;
      const height = element.h * PX_PER_METER * element.scaleY;
      return stageX >= element.x && stageX <= element.x + width && stageY >= element.y && stageY <= element.y + height;
    });

    if (droppedOn) {
      assignGuestToElement(guestId, droppedOn.id);
    }
  };

  const handleImportGuests = (rows) => {
    const processed = rows
      .map((row) => ({
        id: generateId('guest'),
        name: row.name || row.Name || '',
        email: row.email || row.Email || '',
        dietary: row.dietary || row.Dietary || ''
      }))
      .filter((guest) => guest.name && guest.email);

    if (processed.length === 0) return;
    setGuests((prev) => [...prev, ...processed]);
    setCsvText('');
    setShowCSVPanel(false);
  };

  useEffect(() => {
    const onKey = (event) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        handleDeleteNode(selectedId);
      }
      if (event.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const canvasWidth = mToPx(roomWidth);
  const canvasHeight = mToPx(roomHeight);
  const headerCounts = useMemo(() => ({ assign: guests.length }), [guests.length]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: COLORS.background
      }}
    >
      <PlannerHeader
        title="Conference Planner"
        modes={MODES}
        currentMode={mode}
        onModeChange={setMode}
        showCSV={showCSVPanel}
        onToggleCSV={() => setShowCSVPanel((prev) => !prev)}
        zoom={zoom}
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(1 / 1.2)}
        gridOn={gridOn}
        onToggleGrid={setGridOn}
        extraCounts={headerCounts}
      />

      {mode === 'layout' && (
        <CatalogToolbar catalog={CONFERENCE_CATALOG} onAdd={handleAddItem} />
      )}

      <CSVImport
        visible={showCSVPanel}
        csvText={csvText}
        onCsvTextChange={setCsvText}
        onProcess={handleImportGuests}
        itemCount={guests.length}
        itemLabel="Guests"
        placeholder={'name,email,dietary\nAlice Wang,alice@example.com,Vegetarian'}
        formatHint="Columns: name,email,dietary"
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <GuestSidebar
          visible={mode === 'assign'}
          unassignedGuests={unassignedGuests}
          allGuests={guests}
          seatAssignments={seatAssignments}
          elements={elements}
          onRemove={removeGuestFromElement}
          onDragStart={handleGuestDragStart}
          onDragEnd={handleGuestDragEnd}
        />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Stage
            ref={stageRef}
            x={stagePos.x}
            y={stagePos.y}
            width={window.innerWidth - (mode === 'assign' ? 320 : 0)}
            height={window.innerHeight - 150}
            scaleX={zoom}
            scaleY={zoom}
            onWheel={handleWheel}
            draggable={!isDraggingElement && !isDraggingGuest}
            onDragEnd={(event) => {
              const stage = stageRef.current;
              if (!stage || event.target !== stage) return;
              setStagePos({ x: stage.x(), y: stage.y() });
            }}
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageMouseDown}
            style={{ background: COLORS.backgroundLight }}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fill="#fff"
                stroke={COLORS.text}
                strokeWidth={2}
                cornerRadius={6}
                listening={false}
              />
              <Grid width={canvasWidth} height={canvasHeight} visible={gridOn} />
            </Layer>

            <Layer>
              {elements.map((element) => (
                <ElementNode
                  key={element.id}
                  node={element}
                  isSelected={element.id === selectedId}
                  onSelect={() => setSelectedId(element.id)}
                  onChange={handleChangeNode}
                  onDelete={handleDeleteNode}
                  assignedGuests={seatAssignments[element.id]}
                  isDraggable={mode === 'layout'}
                  onDragStart={() => setIsDraggingElement(true)}
                  onDragEnd={() => setIsDraggingElement(false)}
                />
              ))}
            </Layer>

            {mode === 'assign' && (
              <Layer>
                {elements
                  .filter((element) => element.seats > 0)
                  .map((element) => (
                    <Rect
                      key={`drop-${element.id}`}
                      x={element.x}
                      y={element.y}
                      width={element.w * PX_PER_METER * element.scaleX}
                      height={element.h * PX_PER_METER * element.scaleY}
                      rotation={element.rotation}
                      fill="transparent"
                      stroke={COLORS.accent}
                      strokeWidth={2}
                      dash={[5, 5]}
                      opacity={0.5}
                      listening={false}
                    />
                  ))}
              </Layer>
            )}
          </Stage>

          {mode === 'assign' && isDraggingGuest && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'all',
                zIndex: 10,
                background: 'rgba(6, 182, 212, 0.08)'
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={handleCanvasDrop}
            />
          )}

          <TipsCard mode={mode} />
          <ScaleIndicator zoom={zoom} pxPerMeter={PX_PER_METER} />
        </div>
      </div>
    </div>
  );
}
