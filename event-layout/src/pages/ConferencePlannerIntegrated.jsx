import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Circle, Group } from 'react-konva';
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
import CanvasSettingsPanel from '../components/planner/CanvasSettingsPanel.jsx';
import SelectionInspector from '../components/planner/SelectionInspector.jsx';
import CustomWidgetModal from '../components/planner/conference/CustomWidgetModal.jsx';
import RoomCapacityPanel from '../components/planner/conference/RoomCapacityPanel.jsx';
import { downloadPlannerAsPDF, downloadPlannerAsPNG } from '../lib/exportPlanner.js';

const STORAGE_KEY = 'conference_planner_integrated_v1';

const DEFAULT_CUSTOM_CANVAS_POINTS = Object.freeze([
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 }
]);

const CUSTOM_POINT_BOUNDS = { min: -0.25, max: 1.25 };

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

  const hasLoadedRef = useRef(false);
  const hasSeededRef = useRef(false);

  const handleExportPNG = useCallback(() => {
    try {
      downloadPlannerAsPNG(stageRef, canvasNodeRef, { fileBaseName: 'conference-layout' });
    } catch (error) {
      console.error('Failed to export conference layout as PNG', error);
      window.alert('Export failed. Please try again once the canvas is fully loaded.');
    }
  }, [stageRef, canvasNodeRef]);

  const handleExportPDF = useCallback(() => {
    try {
      downloadPlannerAsPDF(stageRef, canvasNodeRef, { fileBaseName: 'conference-layout' });
    } catch (error) {
      console.error('Failed to export conference layout as PDF', error);
      window.alert('Export failed. Please try again once the canvas is fully loaded.');
    }
  }, [stageRef, canvasNodeRef]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.elements) setElements(parsed.elements);
      if (parsed.guests) {
        setGuests(
          parsed.guests.map((guest) => ({
            ...guest,
            tags: Array.isArray(guest.tags) ? guest.tags : []
          }))
        );
      }
      if (parsed.guests) {
        setGuests(
          parsed.guests.map((guest) => ({
            ...guest,
            tags: Array.isArray(guest.tags) ? guest.tags : []
          }))
        );
      }
      if (parsed.seatAssignments) setSeatAssignments(parsed.seatAssignments);
      if (parsed.roomWidth) setRoomWidth(parsed.roomWidth);
      if (parsed.roomHeight) setRoomHeight(parsed.roomHeight);
      if (parsed.canvasShape) setCanvasShape(parsed.canvasShape);
      if (Array.isArray(parsed.canvasCustomPoints)) {
        const validPoints = parsed.canvasCustomPoints.filter(
          (point) => typeof point?.x === 'number' && typeof point?.y === 'number'
        );
        if (validPoints.length >= 3) {
          setCanvasCustomPoints(validPoints.map((point) => ({ x: point.x, y: point.y })));
        }
      }
      if (Array.isArray(parsed.customWidgets)) setCustomWidgets(parsed.customWidgets);
      if (parsed.roomCapacity) {
        setRoomCapacity({
          tables: parsed.roomCapacity.tables || '',
          attendees: parsed.roomCapacity.attendees || ''
        });
      }
      if (Array.isArray(parsed.canvasCorners) && parsed.canvasCorners.length === 4) {
        setCanvasCorners(parsed.canvasCorners);
      }
      if (parsed.roomWidth) setRoomWidth(parsed.roomWidth);
      if (parsed.roomHeight) setRoomHeight(parsed.roomHeight);
      if (parsed.canvasShape) setCanvasShape(parsed.canvasShape);
      if (Array.isArray(parsed.canvasCustomPoints)) {
        const validPoints = parsed.canvasCustomPoints.filter(
          (point) => typeof point?.x === 'number' && typeof point?.y === 'number'
        );
        if (validPoints.length >= 3) {
          setCanvasCustomPoints(validPoints.map((point) => ({ x: point.x, y: point.y })));
        }
      }
      if (Array.isArray(parsed.customWidgets)) setCustomWidgets(parsed.customWidgets);
      if (parsed.roomCapacity) {
        setRoomCapacity({
          tables: parsed.roomCapacity.tables || '',
          attendees: parsed.roomCapacity.attendees || ''
        });
      }
      if (Array.isArray(parsed.canvasCorners) && parsed.canvasCorners.length === 4) {
        setCanvasCorners(parsed.canvasCorners);
      }
    } catch (error) {
      console.warn('Failed to restore conference planner state', error);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const payload = JSON.stringify({
      elements,
      guests,
      seatAssignments,
      roomWidth,
      roomHeight,
      canvasShape,
      canvasCustomPoints,
      customWidgets,
      roomCapacity,
      canvasCorners
    });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [elements, guests, seatAssignments, roomWidth, roomHeight, canvasShape, canvasCustomPoints, customWidgets, roomCapacity, canvasCorners]);

  useEffect(() => {
    setIsDraggingElement(false);
    setIsDraggingGuest(false);
  }, [mode]);

  useEffect(() => {
    if (canvasShape === 'custom' && (!Array.isArray(canvasCustomPoints) || canvasCustomPoints.length < 3)) {
      setCanvasCustomPoints(DEFAULT_CUSTOM_CANVAS_POINTS);
    }
  }, [canvasShape, canvasCustomPoints]);

  useEffect(() => {
    if (canvasShape === 'custom' && (!Array.isArray(canvasCustomPoints) || canvasCustomPoints.length < 3)) {
      setCanvasCustomPoints(DEFAULT_CUSTOM_CANVAS_POINTS);
    }
  }, [canvasShape, canvasCustomPoints]);

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
        scaleY: 1,
        orientation: 'horizontal',
        shapeType: 'rect',
        scaleY: 1,
        orientation: 'horizontal',
        shapeType: 'rect'
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
        scaleY: 1,
        orientation: 'horizontal',
        shapeType: 'rect',
        scaleY: 1,
        orientation: 'horizontal',
        shapeType: 'rect'
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
        scaleY: 1,
        orientation: 'vertical',
        shapeType: 'rect',
        scaleY: 1,
        orientation: 'vertical',
        shapeType: 'rect'
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
      scaleY: 1,
      orientation: catalogItem.orientation || 'horizontal',
      shapeType: catalogItem.shapeType || 'rect',
      points: Array.isArray(catalogItem.points)
        ? catalogItem.points.map((point) => ({ ...point }))
        : null,
      fillColor: catalogItem.fillColor || null,
      origin: catalogItem.custom ? 'custom' : 'default',
      scaleY: 1,
      orientation: catalogItem.orientation || 'horizontal',
      shapeType: catalogItem.shapeType || 'rect',
      points: Array.isArray(catalogItem.points)
        ? catalogItem.points.map((point) => ({ ...point }))
        : null,
      fillColor: catalogItem.fillColor || null,
      origin: catalogItem.custom ? 'custom' : 'default'
    };
    setElements((prev) => [...prev, node]);
    setSelectedId(id);
    setIsCanvasSelected(false);
    setIsCanvasSelected(false);
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


  const handleSaveCustomWidget = (config) => {
    const widgetId = generateId('widget');
    const baseSize = config.shapeType === 'circle' ? Math.max(config.w, config.h) : config.w;
    const adjustedHeight = config.shapeType === 'circle' ? Math.max(config.w, config.h) : config.h;
    const widget = {
      key: widgetId,
      type: `custom_${widgetId}`,
      label: config.label,
      w: parseFloat(baseSize.toFixed(2)),
      h: parseFloat(adjustedHeight.toFixed(2)),
      seats: config.seats || 0,
      shapeType: config.shapeType || 'rect',
      points: Array.isArray(config.points)
        ? config.points.map((point) => ({ ...point }))
        : null,
      fillColor: config.fillColor || null,
      custom: true
    };

    setCustomWidgets((prev) => [...prev, widget]);
    setShowCustomWidgetModal(false);
  };

  const handleRemoveCustomWidget = (type) => {
    if (!type) return;
    const elementIdsToRemove = elements.filter((element) => element.type === type).map((element) => element.id);
    setCustomWidgets((prev) => prev.filter((item) => item.type !== type));
    if (elementIdsToRemove.length > 0) {
      setElements((prev) => prev.filter((element) => element.type !== type));
      setSeatAssignments((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        elementIdsToRemove.forEach((id) => delete next[id]);
        return next;
      });
      if (elementIdsToRemove.includes(selectedId)) {
        setSelectedId(null);
      }
    }
  };

  const handleStageMouseDown = (event) => {
    const stage = event.target.getStage();
    if (event.target === stage) {
      setSelectedId(null);
      setIsCanvasSelected(false);
    }
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
        dietary: row.dietary || row.Dietary || '',
        tags: Array.from(
          new Set(
            (row.tags || row.Tags || '')
              .split(/[,;]/)
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          )
        ),
        dietary: row.dietary || row.Dietary || '',
        tags: Array.from(
          new Set(
            (row.tags || row.Tags || '')
              .split(/[,;]/)
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          )
        )
      }))
      .filter((guest) => guest.name && guest.email);

    if (processed.length === 0) return;
    setGuests((prev) => [...prev, ...processed]);
    setCsvText('');
    setShowCSVPanel(false);
  };

  useEffect(() => {
    const onKey = (event) => {
      
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        const interactiveAncestor = target.closest?.('input, textarea, [contenteditable="true"]');
        if (interactiveAncestor) return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        handleDeleteNode(selectedId);
      }
      if (event.key === 'Escape') {
        setSelectedId(null);
        setIsCanvasSelected(false);
        setIsCanvasSelected(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  useEffect(() => {
    if (mode !== 'layout') {
      setIsCanvasSelected(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'layout') {
      setIsCanvasSelected(false);
    }
  }, [mode]);

  const canvasWidth = mToPx(roomWidth);
  const canvasHeight = mToPx(roomHeight);
  if (canvasShape === 'rounded') {
    canvasCornerRadius = 24;
  } else if (canvasShape === 'oval') {
    canvasCornerRadius = Math.min(canvasWidth, canvasHeight) / 2;
  }

  
  let canvasCornerRadius = 0;
  if (canvasShape === 'rounded') {
    canvasCornerRadius = 24;
  } else if (canvasShape === 'oval') {
    canvasCornerRadius = Math.min(canvasWidth, canvasHeight) / 2;
  }

  const actualCanvasCorners = useMemo(
    () =>
      canvasCorners.map((corner) => ({
        x: corner.x * canvasWidth,
        y: corner.y * canvasHeight
      })),
    [canvasCorners, canvasWidth, canvasHeight]
  );

  const canvasCornersPoints = useMemo(
    () => actualCanvasCorners.flatMap((corner) => [corner.x, corner.y]),
    [actualCanvasCorners]
  );

  const effectiveCustomPoints = useMemo(() => {
    if (canvasShape !== 'custom') return DEFAULT_CUSTOM_CANVAS_POINTS;
    if (!Array.isArray(canvasCustomPoints) || canvasCustomPoints.length < 3) {
      return DEFAULT_CUSTOM_CANVAS_POINTS;
    }
    return canvasCustomPoints;
  }, [canvasShape, canvasCustomPoints]);

  const actualCanvasPoints = useMemo(
    () =>
      effectiveCustomPoints.map((point) => ({
        x: point.x * canvasWidth,
        y: point.y * canvasHeight
      })),
    [effectiveCustomPoints, canvasWidth, canvasHeight]
  );

  const canvasPolygonPoints = useMemo(
    () => actualCanvasPoints.flatMap((point) => [point.x, point.y]),
    [actualCanvasPoints]
  );

  const canvasClipFunc = useCallback(
    (context) => {
      if (!actualCanvasPoints.length) return;
      const [first, ...rest] = actualCanvasPoints;
      context.beginPath();
      context.moveTo(first.x, first.y);
      rest.forEach((point) => context.lineTo(point.x, point.y));
      context.closePath();
    },
    [actualCanvasPoints]
  );

  const updateCustomPointAt = useCallback(
    (index, x, y) => {
      if (canvasShape !== 'custom') return null;
      if (canvasWidth === 0 || canvasHeight === 0) return null;

      const normalize = (value, dimension) => {
        if (dimension === 0) return 0;
        const scaled = value / dimension;
        return Math.max(CUSTOM_POINT_BOUNDS.min, Math.min(CUSTOM_POINT_BOUNDS.max, scaled));
      };

      const normalizedX = normalize(x, canvasWidth);
      const normalizedY = normalize(y, canvasHeight);

      setCanvasCustomPoints((prev) => {
        const source = Array.isArray(prev) && prev.length >= 3 ? prev : DEFAULT_CUSTOM_CANVAS_POINTS;
        return source.map((point, idx) => {
          if (idx === index) return { x: normalizedX, y: normalizedY };
          return { x: point.x, y: point.y };
        });
      });

      return {
        x: normalizedX * canvasWidth,
        y: normalizedY * canvasHeight
      };
    },
    [canvasShape, canvasWidth, canvasHeight]
  );

  const handleCustomHandleDragMove = useCallback(
    (index, event) => {
      const nextPosition = event.target.position();
      const clampedPosition = updateCustomPointAt(index, nextPosition.x, nextPosition.y);
      if (clampedPosition) {
        event.target.position(clampedPosition);
      }
    },
    [updateCustomPointAt]
  );


  const capacityStats = useMemo(() => {
    const seatable = elements.filter((element) => element.seats > 0);
    return {
      tablesCount: seatable.length,
      seatsAvailable: seatable.reduce((sum, element) => sum + element.seats, 0),
      guestCount: guests.length
    };
  }, [elements, guests.length]);

  const tablesOverCapacity = roomCapacity.tables && capacityStats.tablesCount > roomCapacity.tables;
  const attendeesOverCapacity = roomCapacity.attendees && capacityStats.seatsAvailable > roomCapacity.attendees;

  const canAutoAssignDietary = elements.some((element) => element.seats > 0) && guests.length > 0;
  const canAutoAssignTags = canAutoAssignDietary && guests.some((guest) => guest.tags && guest.tags.length > 0);

  const catalogLabelForType = (type) => {
    const entry = combinedCatalog.find((item) => item.type === type);
    return entry ? entry.label : type;
  };

  const handleRenameNode = (id, nextLabel) => {
    setElements((prev) => prev.map((item) => (item.id === id ? { ...item, label: nextLabel } : item)));
  };

  const toggleOrientationForNode = (node) => {
    if (!node) return;
    const currentOrientation = node.orientation || (node.w >= node.h ? 'horizontal' : 'vertical');
    const nextOrientation = currentOrientation === 'vertical' ? 'horizontal' : 'vertical';
    const widthMeters = node.w * node.scaleX;
    const heightMeters = node.h * node.scaleY;

    setElements((prev) =>
      prev.map((item) => {
        if (item.id !== node.id) return item;
        return {
          ...item,
          w: heightMeters,
          h: widthMeters,
          scaleX: 1,
          scaleY: 1,
          orientation: nextOrientation
        };
      })
    );
  };
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
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        extraCounts={headerCounts}
      />
{/* 
      {mode === 'layout' && (
        <>
          <CatalogToolbar catalog={combinedCatalog} onAdd={handleAddItem} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '12px 16px',
              background: '#fff',
              borderBottom: `1px solid ${COLORS.border}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCustomWidgetModal(true)}
                style={{
                  padding: '8px 14px',
                  background: COLORS.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                ➕ Create custom widget
              </button>
              <span style={{ fontSize: 12, color: COLORS.textLight }}>
                Design bespoke layouts for booths, lounges, or any irregular areas.
              </span>
            </div>
            {customWidgets.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {customWidgets.map((widget) => (
                  <span
                    key={widget.type}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      background: '#f1f5f9',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 999,
                      fontSize: 12,
                      color: COLORS.text
                    }}
                  >
                    {widget.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomWidget(widget.type)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: 12,
                        cursor: 'pointer',
                        color: COLORS.textLight
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <CanvasSettingsPanel
            title="Room Canvas"
            width={roomWidth}
            height={roomHeight}
            onWidthChange={setRoomWidth}
            onHeightChange={setRoomHeight}
            shape={canvasShape}
            onShapeChange={setCanvasShape}
          />

          <RoomCapacityPanel capacity={roomCapacity} onChange={setRoomCapacity} stats={capacityStats} />

          {(tablesOverCapacity || attendeesOverCapacity) && (
            <div
              style={{
                padding: '8px 16px',
                background: '#fef2f2',
                borderBottom: `1px solid ${COLORS.border}`,
                color: COLORS.danger,
                fontSize: 12
              }}
            >
              {tablesOverCapacity && <span style={{ marginRight: 12 }}>⚠️ Table count exceeds capacity.</span>}
              {attendeesOverCapacity && <span>⚠️ Seating exceeds attendee capacity.</span>}
            </div>
          )}
        </>
        <>
          <CatalogToolbar catalog={combinedCatalog} onAdd={handleAddItem} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '12px 16px',
              background: '#fff',
              borderBottom: `1px solid ${COLORS.border}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCustomWidgetModal(true)}
                style={{
                  padding: '8px 14px',
                  background: COLORS.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                ➕ Create custom widget
              </button>
              <span style={{ fontSize: 12, color: COLORS.textLight }}>
                Design bespoke layouts for booths, lounges, or any irregular areas.
              </span>
            </div>
            {customWidgets.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {customWidgets.map((widget) => (
                  <span
                    key={widget.type}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      background: '#f1f5f9',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 999,
                      fontSize: 12,
                      color: COLORS.text
                    }}
                  >
                    {widget.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomWidget(widget.type)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: 12,
                        cursor: 'pointer',
                        color: COLORS.textLight
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <CanvasSettingsPanel
            title="Room Canvas"
            width={roomWidth}
            height={roomHeight}
            onWidthChange={setRoomWidth}
            onHeightChange={setRoomHeight}
            shape={canvasShape}
            onShapeChange={setCanvasShape}
          />

          <RoomCapacityPanel capacity={roomCapacity} onChange={setRoomCapacity} stats={capacityStats} />

          {(tablesOverCapacity || attendeesOverCapacity) && (
            <div
              style={{
                padding: '8px 16px',
                background: '#fef2f2',
                borderBottom: `1px solid ${COLORS.border}`,
                color: COLORS.danger,
                fontSize: 12
              }}
            >
              {tablesOverCapacity && <span style={{ marginRight: 12 }}>⚠️ Table count exceeds capacity.</span>}
              {attendeesOverCapacity && <span>⚠️ Seating exceeds attendee capacity.</span>}
            </div>
          )}
        </>
      )} */}

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
          onAddTag={handleAddTagToGuest}
          onRemoveTag={handleRemoveTagFromGuest}
          onAutoAssignDietary={handleAutoAssignByDietary}
          canAutoAssignDietary={canAutoAssignDietary}
          onAutoAssignTags={handleAutoAssignByTags}
          canAutoAssignTags={canAutoAssignTags}
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
              {canvasShape === 'custom' ? (
                <>
                  <Line
                    ref={canvasNodeRef}
                    points={canvasPolygonPoints}
                    closed
                    fill="#fff"
                    stroke={isCanvasSelected ? COLORS.accent : COLORS.text}
                    strokeWidth={isCanvasSelected ? 3 : 2}
                    listening={mode === 'layout'}
                    onMouseDown={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                    onTap={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                  />
                  <Group listening={false} clipFunc={canvasClipFunc}>
                    <Grid width={canvasWidth} height={canvasHeight} visible={gridOn} />
                  </Group>
                  {mode === 'layout' && (
                    <>
                      {actualCanvasPoints.map((point, index) => (
                        <Circle
                          key={`handle-${index}`}
                          x={point.x}
                          y={point.y}
                          radius={8 / zoom}
                          fill={COLORS.accent}
                          stroke="#fff"
                          strokeWidth={1 / zoom}
                          draggable
                          onMouseDown={(event) => {
                            event.cancelBubble = true;
                            if (mode !== 'layout') return;
                            setIsCanvasSelected(true);
                            setSelectedId(null);
                          }}
                          onTouchStart={(event) => {
                            event.cancelBubble = true;
                            if (mode !== 'layout') return;
                            setIsCanvasSelected(true);
                            setSelectedId(null);
                          }}
                          onDragMove={(event) => handleCustomHandleDragMove(index, event)}
                          onDragEnd={(event) => handleCustomHandleDragMove(index, event)}
                        />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Line
                    ref={canvasNodeRef}
                    points={canvasCornersPoints}
                    closed
                    fill="#fff"
                    stroke={isCanvasSelected ? COLORS.accent : COLORS.text}
                    strokeWidth={isCanvasSelected ? 3 : 2}
                    listening={mode === 'layout'}
                    onMouseDown={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                    onTap={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                  />
                  <Grid width={canvasWidth} height={canvasHeight} visible={gridOn} />
                  {mode === 'layout' && isCanvasSelected && (
                    <>
                      {actualCanvasCorners.map((corner, index) => (
                        <Circle
                          key={`corner-${index}`}
                          x={corner.x}
                          y={corner.y}
                          radius={8 / zoom}
                          fill={COLORS.accent}
                          stroke="#fff"
                          strokeWidth={1 / zoom}
                          draggable
                          onMouseDown={(event) => {
                            event.cancelBubble = true;
                          }}
                          onTouchStart={(event) => {
                            event.cancelBubble = true;
                          }}
                          onDragMove={(event) => {
                            const newX = Math.max(0, event.target.x());
                            const newY = Math.max(0, event.target.y());
                            const normalizedX = newX / canvasWidth;
                            const normalizedY = newY / canvasHeight;
                            setCanvasCorners((prev) =>
                              prev.map((c, i) => (i === index ? { x: normalizedX, y: normalizedY } : c))
                            );
                          }}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
              {canvasShape === 'custom' ? (
                <>
                  <Line
                    ref={canvasNodeRef}
                    points={canvasPolygonPoints}
                    closed
                    fill="#fff"
                    stroke={isCanvasSelected ? COLORS.accent : COLORS.text}
                    strokeWidth={isCanvasSelected ? 3 : 2}
                    listening={mode === 'layout'}
                    onMouseDown={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                    onTap={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                  />
                  <Group listening={false} clipFunc={canvasClipFunc}>
                    <Grid width={canvasWidth} height={canvasHeight} visible={gridOn} />
                  </Group>
                  {mode === 'layout' && (
                    <>
                      {actualCanvasPoints.map((point, index) => (
                        <Circle
                          key={`handle-${index}`}
                          x={point.x}
                          y={point.y}
                          radius={8 / zoom}
                          fill={COLORS.accent}
                          stroke="#fff"
                          strokeWidth={1 / zoom}
                          draggable
                          onMouseDown={(event) => {
                            event.cancelBubble = true;
                            if (mode !== 'layout') return;
                            setIsCanvasSelected(true);
                            setSelectedId(null);
                          }}
                          onTouchStart={(event) => {
                            event.cancelBubble = true;
                            if (mode !== 'layout') return;
                            setIsCanvasSelected(true);
                            setSelectedId(null);
                          }}
                          onDragMove={(event) => handleCustomHandleDragMove(index, event)}
                          onDragEnd={(event) => handleCustomHandleDragMove(index, event)}
                        />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Line
                    ref={canvasNodeRef}
                    points={canvasCornersPoints}
                    closed
                    fill="#fff"
                    stroke={isCanvasSelected ? COLORS.accent : COLORS.text}
                    strokeWidth={isCanvasSelected ? 3 : 2}
                    listening={mode === 'layout'}
                    onMouseDown={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                    onTap={() => {
                      if (mode !== 'layout') return;
                      setIsCanvasSelected(true);
                      setSelectedId(null);
                    }}
                  />
                  <Grid width={canvasWidth} height={canvasHeight} visible={gridOn} />
                  {mode === 'layout' && isCanvasSelected && (
                    <>
                      {actualCanvasCorners.map((corner, index) => (
                        <Circle
                          key={`corner-${index}`}
                          x={corner.x}
                          y={corner.y}
                          radius={8 / zoom}
                          fill={COLORS.accent}
                          stroke="#fff"
                          strokeWidth={1 / zoom}
                          draggable
                          onMouseDown={(event) => {
                            event.cancelBubble = true;
                          }}
                          onTouchStart={(event) => {
                            event.cancelBubble = true;
                          }}
                          onDragMove={(event) => {
                            const newX = Math.max(0, event.target.x());
                            const newY = Math.max(0, event.target.y());
                            const normalizedX = newX / canvasWidth;
                            const normalizedY = newY / canvasHeight;
                            setCanvasCorners((prev) =>
                              prev.map((c, i) => (i === index ? { x: normalizedX, y: normalizedY } : c))
                            );
                          }}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </Layer>

            <Layer>
              {elements.map((element) => (
                <ElementNode
                  key={element.id}
                  node={element}
                  isSelected={element.id === selectedId}
                  onSelect={() => {
                    setSelectedId(element.id);
                    setIsCanvasSelected(false);
                  }}
                  
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

          <SelectionInspector
            visible={mode === 'layout' && !!selectedElement}
            title="Selected Widget"
            typeLabel={selectedElement ? catalogLabelForType(selectedElement.type) : ''}
            name={selectedElement?.label || ''}
            onNameChange={(value) => selectedElement && handleRenameNode(selectedElement.id, value)}
            onDelete={() => selectedElement && handleDeleteNode(selectedElement.id)}
            canToggleOrientation={
              !!selectedElement && (selectedElement.type === 'window' || selectedElement.type === 'blind_path')
            }
            isVertical={
              !!selectedElement && (selectedElement.orientation === 'vertical' || selectedElement.h > selectedElement.w)
            }
            onToggleOrientation={() => toggleOrientationForNode(selectedElement)}
          >
            {selectedElement && (
              <div style={{ fontSize: 12, color: COLORS.textLight }}>
                Shape: <strong style={{ color: COLORS.text }}>{selectedElement.shapeType || 'rect'}</strong>
              </div>
            )}
            {selectedElement?.fillColor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLORS.textLight }}>
                Color
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1px solid ${COLORS.border}`,
                    background: selectedElement.fillColor
                  }}
                />
              </div>
            )}
            {selectedElement?.seats > 0 && (
              <div style={{ fontSize: 12, color: COLORS.textLight }}>
                Seats available: <strong style={{ color: COLORS.text }}>{selectedElement.seats}</strong>
              </div>
            )}
          </SelectionInspector>

          <SelectionInspector
            visible={mode === 'layout' && !!selectedElement}
            title="Selected Widget"
            typeLabel={selectedElement ? catalogLabelForType(selectedElement.type) : ''}
            name={selectedElement?.label || ''}
            onNameChange={(value) => selectedElement && handleRenameNode(selectedElement.id, value)}
            onDelete={() => selectedElement && handleDeleteNode(selectedElement.id)}
            canToggleOrientation={
              !!selectedElement && (selectedElement.type === 'window' || selectedElement.type === 'blind_path')
            }
            isVertical={
              !!selectedElement && (selectedElement.orientation === 'vertical' || selectedElement.h > selectedElement.w)
            }
            onToggleOrientation={() => toggleOrientationForNode(selectedElement)}
          >
            {selectedElement && (
              <div style={{ fontSize: 12, color: COLORS.textLight }}>
                Shape: <strong style={{ color: COLORS.text }}>{selectedElement.shapeType || 'rect'}</strong>
              </div>
            )}
            {selectedElement?.fillColor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLORS.textLight }}>
                Color
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1px solid ${COLORS.border}`,
                    background: selectedElement.fillColor
                  }}
                />
              </div>
            )}
            {selectedElement?.seats > 0 && (
              <div style={{ fontSize: 12, color: COLORS.textLight }}>
                Seats available: <strong style={{ color: COLORS.text }}>{selectedElement.seats}</strong>
              </div>
            )}
          </SelectionInspector>

          <TipsCard mode={mode} />
          <ScaleIndicator zoom={zoom} pxPerMeter={PX_PER_METER} />
        </div>
      </div>
      <CustomWidgetModal
        visible={showCustomWidgetModal}
        onClose={() => setShowCustomWidgetModal(false)}
        onSubmit={handleSaveCustomWidget}
      />
      <CustomWidgetModal
        visible={showCustomWidgetModal}
        onClose={() => setShowCustomWidgetModal(false)}
        onSubmit={handleSaveCustomWidget}
      />
    </div>
  );
}
