import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Circle, Group } from 'react-konva';
import PlannerHeader from '../components/planner/Header.jsx';
import CatalogToolbar from '../components/planner/CatalogToolbar.jsx';
import CSVImport from '../components/planner/CSVImport.jsx';
import Grid from '../components/planner/Grid.jsx';
import COLORS from '../components/planner/colors.js';
import { mToPx, snapPx, generateId, PX_PER_METER } from '../components/planner/utils.js';
import { BOOTH_CATALOG, PRESET_LAYOUTS } from '../components/planner/tradeshow/constants.js';
import BoothNode from '../components/planner/tradeshow/BoothNode.jsx';
import VendorSidebar from '../components/planner/tradeshow/VendorSidebar.jsx';
import RouteSidebar from '../components/planner/tradeshow/RouteSidebar.jsx';
import RouteVisualization from '../components/planner/tradeshow/RouteVisualization.jsx';
import TipsCard from '../components/planner/tradeshow/TipsCard.jsx';
import PresetPanel from '../components/planner/tradeshow/PresetPanel.jsx';
import ScaleIndicator from '../components/planner/ScaleIndicator.jsx';
import CanvasSettingsPanel from '../components/planner/CanvasSettingsPanel.jsx';
import SelectionInspector from '../components/planner/SelectionInspector.jsx';

const STORAGE_KEY = 'tradeshow_planner_integrated_v1';

const DEFAULT_CUSTOM_CANVAS_POINTS = Object.freeze([
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 }
]);

const CUSTOM_POINT_BOUNDS = { min: -0.25, max: 1.25 };

const MODES = [
  { id: 'layout', label: 'Layout', icon: '🏗️' },
  { id: 'assign', label: 'Vendors', icon: '🏪', showCount: true },
  { id: 'route', label: 'Route', icon: '🗺️', showCount: true }
];

export default function TradeshowPlannerIntegrated() {
  const [mode, setMode] = useState('layout');
  const [booths, setBooths] = useState([]);
  const [gridOn, setGridOn] = useState(true);
  const [zoom, setZoom] = useState(0.7);
  const [stagePos, setStagePos] = useState({ x: 40, y: 40 });
  const stageRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showPresetPanel, setShowPresetPanel] = useState(true);

  const [vendors, setVendors] = useState([]);
  const [csvText, setCsvText] = useState('');
  const [showCSVPanel, setShowCSVPanel] = useState(false);

  const [boothAssignments, setBoothAssignments] = useState({});
  const [visitRoute, setVisitRoute] = useState([]);
  const [routeMode, setRouteMode] = useState('auto');
  const [isDraggingVendor, setIsDraggingVendor] = useState(false);
  const [isDraggingBooth, setIsDraggingBooth] = useState(false);

  const [hallWidth, setHallWidth] = useState(40);
  const [hallHeight, setHallHeight] = useState(30);
  const [canvasShape, setCanvasShape] = useState('rounded');
  const [canvasCustomPoints, setCanvasCustomPoints] = useState(DEFAULT_CUSTOM_CANVAS_POINTS);
  const [canvasCorners, setCanvasCorners] = useState(() => [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ]);
  const selectedBooth = useMemo(
    () => booths.find((item) => item.id === selectedId) || null,
    [booths, selectedId]
  );
  const [isCanvasSelected, setIsCanvasSelected] = useState(false);
  const canvasNodeRef = useRef(null);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.booths) setBooths(parsed.booths);
      if (parsed.vendors) setVendors(parsed.vendors);
      if (parsed.boothAssignments) setBoothAssignments(parsed.boothAssignments);
      if (parsed.visitRoute) setVisitRoute(parsed.visitRoute);
      if (parsed.hallWidth) setHallWidth(parsed.hallWidth);
      if (parsed.hallHeight) setHallHeight(parsed.hallHeight);
      if (parsed.canvasShape) setCanvasShape(parsed.canvasShape);
      if (Array.isArray(parsed.canvasCustomPoints)) {
        const validPoints = parsed.canvasCustomPoints.filter(
          (point) => typeof point?.x === 'number' && typeof point?.y === 'number'
        );
        if (validPoints.length >= 3) {
          setCanvasCustomPoints(validPoints.map((point) => ({ x: point.x, y: point.y })));
        }
      }
      if (typeof parsed.showPresetPanel === 'boolean') setShowPresetPanel(parsed.showPresetPanel);
      if (Array.isArray(parsed.canvasCorners) && parsed.canvasCorners.length === 4) {
        setCanvasCorners(parsed.canvasCorners);
      }
    } catch (error) {
      console.warn('Failed to restore tradeshow planner state', error);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const payload = JSON.stringify({
      booths,
      vendors,
      boothAssignments,
      visitRoute,
      hallWidth,
      hallHeight,
      showPresetPanel,
      canvasShape,
      canvasCustomPoints,
      canvasCorners
    });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [
    booths,
    vendors,
    boothAssignments,
    visitRoute,
    hallWidth,
    hallHeight,
    showPresetPanel,
    canvasShape,
    canvasCustomPoints,
    canvasCorners
  ]);

  useEffect(() => {
    setIsDraggingBooth(false);
    setIsDraggingVendor(false);
  }, [mode]);

  useEffect(() => {
    if (canvasShape === 'custom' && (!Array.isArray(canvasCustomPoints) || canvasCustomPoints.length < 3)) {
      setCanvasCustomPoints(DEFAULT_CUSTOM_CANVAS_POINTS);
    }
  }, [canvasShape, canvasCustomPoints]);

  const handleAddBooth = (catalogItem) => {
    const id = generateId('booth');
    const node = {
      id,
      type: catalogItem.type,
      label: catalogItem.label,
      category: catalogItem.category,
      x: snapPx(mToPx(3)),
      y: snapPx(mToPx(3)),
      w: catalogItem.w,
      h: catalogItem.h,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      orientation: catalogItem.orientation || 'horizontal'
    };
    setBooths((prev) => [...prev, node]);
    setSelectedId(id);
    setIsCanvasSelected(false);
  };

  const handleChangeBooth = (booth) => {
    setBooths((prev) => prev.map((item) => (item.id === booth.id ? booth : item)));
  };

  const handleDeleteBooth = (id) => {
    setBooths((prev) => prev.filter((item) => item.id !== id));
    setBoothAssignments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setVisitRoute((prev) => prev.filter((boothId) => boothId !== id));
    if (selectedId === id) setSelectedId(null);
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

  const assignVendorToBooth = (vendorId, boothId) => {
    const booth = booths.find((item) => item.id === boothId);
    if (!booth || booth.category !== 'booth') return;
    setBoothAssignments((prev) => ({
      ...prev,
      [boothId]: vendorId
    }));
  };

  const removeVendorFromBooth = (boothId) => {
    setBoothAssignments((prev) => {
      const next = { ...prev };
      delete next[boothId];
      return next;
    });
    setVisitRoute((prev) => prev.filter((id) => id !== boothId));
  };

  const unassignedVendors = useMemo(() => {
    const assigned = new Set(Object.values(boothAssignments));
    return vendors.filter((vendor) => !assigned.has(vendor.id));
  }, [vendors, boothAssignments]);

  const generateAutoRoute = () => {
    const assignedBooths = booths.filter((booth) => boothAssignments[booth.id] && booth.category === 'booth');
    if (assignedBooths.length === 0) {
      alert('No vendors assigned to booths yet!');
      return;
    }

    const entrance = booths.find((booth) => booth.type === 'entrance');

    if (!entrance) {
      const ordered = [...assignedBooths].sort((a, b) => {
        if (Math.abs(a.y - b.y) > 100) return a.y - b.y;
        return a.x - b.x;
      });
      setVisitRoute(ordered.map((booth) => booth.id));
      return;
    }

    const route = [];
    const visited = new Set();
    let current = {
      x: entrance.x,
      y: entrance.y
    };

    while (route.length < assignedBooths.length) {
      let nearest = null;
      let minDistance = Infinity;

      assignedBooths.forEach((booth) => {
        if (visited.has(booth.id)) return;
        const centerX = booth.x + (booth.w * PX_PER_METER * booth.scaleX) / 2;
        const centerY = booth.y + (booth.h * PX_PER_METER * booth.scaleY) / 2;
        const distance = Math.hypot(centerX - current.x, centerY - current.y);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = booth;
        }
      });

      if (!nearest) break;
      route.push(nearest.id);
      visited.add(nearest.id);
      current = {
        x: nearest.x + (nearest.w * PX_PER_METER * nearest.scaleX) / 2,
        y: nearest.y + (nearest.h * PX_PER_METER * nearest.scaleY) / 2
      };
    }

    setVisitRoute(route);
  };

  const toggleBoothInRoute = (boothId) => {
    if (!boothAssignments[boothId]) return;
    setVisitRoute((prev) => (prev.includes(boothId) ? prev.filter((id) => id !== boothId) : [...prev, boothId]));
  };

  const clearRoute = () => {
    setVisitRoute([]);
  };

  const exportRoute = () => {
    if (visitRoute.length === 0) {
      alert('No route to export!');
      return;
    }

    const lines = [];
    lines.push('Tradeshow Visit Route');
    lines.push('======================\n');
    const entrance = booths.find((item) => item.type === 'entrance');
    if (entrance) {
      lines.push(`Start at ${entrance.label || 'Entrance'}\n`);
    }
    visitRoute.forEach((boothId, index) => {
      const booth = booths.find((item) => item.id === boothId);
      const vendorId = boothAssignments[boothId];
      const vendor = vendors.find((item) => item.id === vendorId);
      if (!booth || !vendor) return;
      lines.push(`${index + 1}. ${booth.label}`);
      lines.push(`   Company: ${vendor.company}`);
      lines.push(`   Contact: ${vendor.contact}`);
      lines.push(`   Category: ${vendor.category}\n`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tradeshow_route.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const loadPreset = (preset) => {
    const newBooths = [];

    preset.booths.forEach((boothTemplate) => {
      const catalogItem = BOOTH_CATALOG.find((item) => item.type === boothTemplate.type);
      if (!catalogItem) return;
      const scaleX = boothTemplate.scaleX ?? 1;
      const scaleY = boothTemplate.scaleY ?? 1;
      const rotation = boothTemplate.rotation ?? 0;
      newBooths.push({
        id: generateId('booth'),
        type: boothTemplate.type,
        label: boothTemplate.label,
        category: catalogItem.category,
        x: snapPx(mToPx(boothTemplate.x)),
        y: snapPx(mToPx(boothTemplate.y)),
        w: catalogItem.w,
        h: catalogItem.h,
        rotation,
        scaleX,
        scaleY,
        orientation: boothTemplate.orientation || catalogItem.orientation || 'horizontal'
      });
    });

    preset.facilities.forEach((facilityTemplate) => {
      const catalogItem = BOOTH_CATALOG.find((item) => item.type === facilityTemplate.type);
      if (!catalogItem) return;
      const scaleX = facilityTemplate.scaleX ?? 1;
      const scaleY = facilityTemplate.scaleY ?? 1;
      const rotation = facilityTemplate.rotation ?? 0;
      newBooths.push({
        id: generateId('facility'),
        type: facilityTemplate.type,
        label: facilityTemplate.label,
        category: catalogItem.category,
        x: snapPx(mToPx(facilityTemplate.x)),
        y: snapPx(mToPx(facilityTemplate.y)),
        w: catalogItem.w,
        h: catalogItem.h,
        rotation,
        scaleX,
        scaleY,
        orientation: facilityTemplate.orientation || catalogItem.orientation || 'horizontal'
      });
    });

    setBooths(newBooths);
    setHallWidth(preset.hallWidth);
    setHallHeight(preset.hallHeight);
    setShowPresetPanel(false);
    setBoothAssignments({});
    setVisitRoute([]);
    setIsCanvasSelected(false);
  };

  const handleVendorDragStart = (event, vendorId) => {
    event.dataTransfer.setData('vendorId', vendorId);
    event.dataTransfer.effectAllowed = 'move';
    setIsDraggingVendor(true);
  };

  const handleVendorDragEnd = () => {
    setIsDraggingVendor(false);
  };

  const handleCanvasDrop = (event) => {
    event.preventDefault();
    const vendorId = event.dataTransfer.getData('vendorId');
    if (!vendorId) return;
    const stage = stageRef.current;
    if (!stage) return;

    const containerRect = stage.container().getBoundingClientRect();
    const relativeX = event.clientX - containerRect.left;
    const relativeY = event.clientY - containerRect.top;
    const stageX = (relativeX - stagePos.x) / zoom;
    const stageY = (relativeY - stagePos.y) / zoom;

    const targetBooth = booths.find((booth) => {
      if (booth.category !== 'booth') return false;
      const width = booth.w * PX_PER_METER * booth.scaleX;
      const height = booth.h * PX_PER_METER * booth.scaleY;
      return stageX >= booth.x && stageX <= booth.x + width && stageY >= booth.y && stageY <= booth.y + height;
    });

    if (targetBooth) {
      assignVendorToBooth(vendorId, targetBooth.id);
    }
  };

  const handleImportVendors = (rows) => {
    const processed = rows
      .map((row) => ({
        id: generateId('vendor'),
        company: row.company || row.Company || '',
        contact: row.contact || row.Contact || '',
        category: row.category || row.Category || '',
        booth_size: row.booth_size || row.BoothSize || 'standard'
      }))
      .filter((vendor) => vendor.company);

    if (processed.length === 0) return;
    setVendors((prev) => [...prev, ...processed]);
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
        handleDeleteBooth(selectedId);
      }
      if (event.key === 'Escape') {
        setSelectedId(null);
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

  const canvasWidth = mToPx(hallWidth);
  const canvasHeight = mToPx(hallHeight);
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


  const catalogLabelForType = (type) => {
    const entry = BOOTH_CATALOG.find((item) => item.type === type);
    return entry ? entry.label : type;
  };

  const handleRenameBooth = (id, nextLabel) => {
    setBooths((prev) => prev.map((item) => (item.id === id ? { ...item, label: nextLabel } : item)));
  };

  const toggleOrientationForBooth = (booth) => {
    if (!booth) return;
    const currentOrientation = booth.orientation || (booth.w >= booth.h ? 'horizontal' : 'vertical');
    const nextOrientation = currentOrientation === 'vertical' ? 'horizontal' : 'vertical';
    const widthMeters = booth.w * booth.scaleX;
    const heightMeters = booth.h * booth.scaleY;

    setBooths((prev) =>
      prev.map((item) => {
        if (item.id !== booth.id) return item;
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

  const headerCounts = useMemo(
    () => ({ assign: vendors.length, route: visitRoute.length }),
    [vendors.length, visitRoute.length]
  );

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
        title="Tradeshow Planner"
        modes={MODES}
        currentMode={mode}
        onModeChange={setMode}
        showPresets={showPresetPanel}
        onTogglePresets={() => setShowPresetPanel((prev) => !prev)}
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
        <>
          <CatalogToolbar catalog={BOOTH_CATALOG} onAdd={handleAddBooth} />
          <CanvasSettingsPanel
            title="Hall Canvas"
            width={hallWidth}
            height={hallHeight}
            onWidthChange={setHallWidth}
            onHeightChange={setHallHeight}
            shape={canvasShape}
            onShapeChange={setCanvasShape}
          />
        </>
      )}

      <PresetPanel visible={showPresetPanel} presets={PRESET_LAYOUTS} onSelect={loadPreset} />

      <CSVImport
        visible={showCSVPanel}
        csvText={csvText}
        onCsvTextChange={setCsvText}
        onProcess={handleImportVendors}
        itemCount={vendors.length}
        itemLabel="Vendors"
        placeholder={'company,contact,category,booth_size\nClover Inc.,Amy Lin,Payments,large'}
        formatHint="Columns: company, contact, category, booth_size"
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <VendorSidebar
          visible={mode === 'assign'}
          unassignedVendors={unassignedVendors}
          allVendors={vendors}
          boothAssignments={boothAssignments}
          booths={booths}
          onRemove={removeVendorFromBooth}
          onDragStart={handleVendorDragStart}
          onDragEnd={handleVendorDragEnd}
        />

        <RouteSidebar
          visible={mode === 'route'}
          route={visitRoute}
          booths={booths}
          boothAssignments={boothAssignments}
          vendors={vendors}
          routeMode={routeMode}
          onRouteModeChange={setRouteMode}
          onGenerateAutoRoute={generateAutoRoute}
          onToggleBooth={toggleBoothInRoute}
          onClearRoute={clearRoute}
          onExportRoute={exportRoute}
        />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Stage
            ref={stageRef}
            x={stagePos.x}
            y={stagePos.y}
            width={
              window.innerWidth -
              ((mode === 'assign' || mode === 'route') ? 320 : 0)
            }
            height={window.innerHeight - 160}
            scaleX={zoom}
            scaleY={zoom}
            onWheel={handleWheel}
            draggable={!isDraggingBooth && !isDraggingVendor}
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
            </Layer>

            <Layer>
              {booths.map((booth) => (
                <BoothNode
                  key={booth.id}
                  node={booth}
                  isSelected={booth.id === selectedId}
                  onSelect={() => {
                    setIsCanvasSelected(false);
                    setSelectedId(booth.id);
                    if (mode === 'route' && routeMode === 'manual' && boothAssignments[booth.id]) {
                      toggleBoothInRoute(booth.id);
                    }
                  }}
                  onChange={handleChangeBooth}
                  onDelete={handleDeleteBooth}
                  assignedVendor={boothAssignments[booth.id] ? vendors.find((vendor) => vendor.id === boothAssignments[booth.id]) : null}
                  isDraggable={mode === 'layout'}
                  isOnRoute={visitRoute.includes(booth.id)}
                  routeNumber={visitRoute.includes(booth.id) ? visitRoute.indexOf(booth.id) + 1 : undefined}
                  onDragStart={() => setIsDraggingBooth(true)}
                  onDragEnd={() => setIsDraggingBooth(false)}
                />
              ))}
            </Layer>

            {mode === 'route' && visitRoute.length > 1 && (
              <Layer>
                <RouteVisualization route={visitRoute} booths={booths} />
              </Layer>
            )}

            {mode === 'assign' && (
              <Layer>
                {booths
                  .filter((booth) => booth.category === 'booth')
                  .map((booth) => (
                    <Rect
                      key={`drop-${booth.id}`}
                      x={booth.x}
                      y={booth.y}
                      width={booth.w * PX_PER_METER * booth.scaleX}
                      height={booth.h * PX_PER_METER * booth.scaleY}
                      rotation={booth.rotation}
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

          {mode === 'assign' && isDraggingVendor && (
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
            visible={mode === 'layout' && !!selectedBooth}
            title="Selected Widget"
            typeLabel={selectedBooth ? catalogLabelForType(selectedBooth.type) : ''}
            name={selectedBooth?.label || ''}
            onNameChange={(value) => selectedBooth && handleRenameBooth(selectedBooth.id, value)}
            onDelete={() => selectedBooth && handleDeleteBooth(selectedBooth.id)}
            canToggleOrientation={
              !!selectedBooth && (selectedBooth.type === 'window' || selectedBooth.type === 'blind_path')
            }
            isVertical={
              !!selectedBooth && (selectedBooth.orientation === 'vertical' || selectedBooth.h > selectedBooth.w)
            }
            onToggleOrientation={() => toggleOrientationForBooth(selectedBooth)}
          >
            {selectedBooth?.category && (
              <div style={{ fontSize: 12, color: COLORS.textLight }}>
                Category: <strong style={{ color: COLORS.text }}>{selectedBooth.category}</strong>
              </div>
            )}
          </SelectionInspector>

          <TipsCard mode={mode} />
          <ScaleIndicator zoom={zoom} pxPerMeter={PX_PER_METER} labelPrefix="Scale" />
        </div>
      </div>
    </div>
  );
}
