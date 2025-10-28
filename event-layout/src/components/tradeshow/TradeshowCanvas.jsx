// Tradeshow canvas component with Konva

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Arrow, Circle, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import { TRADESHOW_BOOTHS, getElementConfig } from '../../lib/canvas/shapes';
import ScaleRuler from '../shared/ScaleRuler';

const PIXELS_PER_METER = 30; // 30 pixels = 1 meter (smaller scale for larger halls)
const GRID_SIZE = 1; // Grid every 1 meter

// Simple Konva image wrapper
function KonvaImage({ src, ...props }) {
  const [image] = useImage(src);
  return <Image image={image} {...props} />;
}

export default function TradeshowCanvas({
  booths,
  onBoothsChange,
  hallWidth = 40,
  hallHeight = 30,
  initialHallVertices = null,
  selectedBoothId,
  onSelectBooth,
  vendors = [],
  routes = [],
  activeRouteId = null,
  routeSteps = [],
  currentRouteBoothId = null,
  nextRouteBoothId = null,
  visitedBoothIds = [],
  skippedBoothIds = [],
  readOnly = false,
  onHallResize,
  draggingVendorId = null,
  onAssignVendor,
  onVendorDragEnd,
}) {
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 20, y: 20 });
  const [draggedBooth, setDraggedBooth] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const routeStepMap = useMemo(() => {
    const map = new Map();
    (routeSteps || []).forEach(step => {
      if (step?.boothId) {
        map.set(String(step.boothId), step);
      }
    });
    return map;
  }, [routeSteps]);
  const visitedBoothSet = useMemo(
    () => new Set((visitedBoothIds || []).map(id => String(id))),
    [visitedBoothIds]
  );
  const skippedBoothSet = useMemo(
    () => new Set((skippedBoothIds || []).map(id => String(id))),
    [skippedBoothIds]
  );

  const toNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  // Hall boundary points (vertices that can be dragged to create irregular shapes)
  const [hallVertices, setHallVertices] = useState(() => {
    if (initialHallVertices && Array.isArray(initialHallVertices) && initialHallVertices.length > 0) {
      return initialHallVertices;
    }
    return [
      { x: 0, y: 0, id: 0 },
      { x: hallWidth, y: 0, id: 1 },
      { x: hallWidth, y: hallHeight, id: 2 },
      { x: 0, y: hallHeight, id: 3 },
    ];
  });

  // Track if vertices have been manually modified
  const [verticesModified, setVerticesModified] = useState(() => {
    return initialHallVertices && Array.isArray(initialHallVertices) && initialHallVertices.length > 0;
  });

  // Track previous dimensions to detect changes
  const prevDimensionsRef = useRef({ width: hallWidth, height: hallHeight });

  // Update vertices when hallWidth/hallHeight changes (only if not manually modified)
  useEffect(() => {
    const prevDimensions = prevDimensionsRef.current;
    const dimensionsChanged = prevDimensions.width !== hallWidth || prevDimensions.height !== hallHeight;

    if (dimensionsChanged && !verticesModified) {
      setHallVertices([
        { x: 0, y: 0, id: 0 },
        { x: hallWidth, y: 0, id: 1 },
        { x: hallWidth, y: hallHeight, id: 2 },
        { x: 0, y: hallHeight, id: 3 },
      ]);
      prevDimensionsRef.current = { width: hallWidth, height: hallHeight };
    }
  }, [hallWidth, hallHeight, verticesModified]);

  // Calculate canvas bounds from vertices
  const canvasWidth = Math.max(...hallVertices.map(p => p.x)) * PIXELS_PER_METER + 100;
  const canvasHeight = Math.max(...hallVertices.map(p => p.y)) * PIXELS_PER_METER + 100;
  const realWidth = Math.max(...hallVertices.map(p => p.x));
  const realHeight = Math.max(...hallVertices.map(p => p.y));

  // Clear drop target when dragging ends
  useEffect(() => {
    if (!draggingVendorId) {
      setDropTargetId(null);
    }
  }, [draggingVendorId]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || readOnly) return;

    const stage = stageRef.current;
    if (!stage) return;

    const selectedNode = stage.findOne(`#booth-${selectedBoothId}`);

    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedBoothId, readOnly]);

  // Handle booth drag
  const handleDragStart = (e, booth) => {
    if (readOnly) return;
    setDraggedBooth(booth);
    onSelectBooth(booth.id);
  };

  const handleDragEnd = (e, booth) => {
    if (readOnly) return;
    const newBooths = booths.map(b =>
      b.id === booth.id
        ? {
            ...b,
            x: e.target.x() / PIXELS_PER_METER,
            y: e.target.y() / PIXELS_PER_METER,
          }
        : b
    );
    onBoothsChange(newBooths);
    setDraggedBooth(null);
  };

  // Handle booth transform (scale/rotate)
  const handleTransformEnd = (e, booth) => {
    if (readOnly) return;

    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newBooths = booths.map(b =>
      b.id === booth.id
        ? {
            ...b,
            x: node.x() / PIXELS_PER_METER,
            y: node.y() / PIXELS_PER_METER,
            width: Math.max(0.1, (node.width() * scaleX) / PIXELS_PER_METER),
            height: Math.max(0.1, (node.height() * scaleY) / PIXELS_PER_METER),
            rotation: node.rotation(),
          }
        : b
    );
    onBoothsChange(newBooths);
  };

  // Handle vertex drag (hall shape modification)
  const handleVertexDrag = (e, vertexId) => {
    const newX = e.target.x() / PIXELS_PER_METER;
    const newY = e.target.y() / PIXELS_PER_METER;

    const newVertices = hallVertices.map(v =>
      v.id === vertexId ? { ...v, x: newX, y: newY } : v
    );

    setHallVertices(newVertices);
    setVerticesModified(true); // Mark as manually modified

    // Update hall dimensions and vertices if callback exists
    if (onHallResize) {
      const maxX = Math.max(...newVertices.map(p => p.x));
      const maxY = Math.max(...newVertices.map(p => p.y));
      onHallResize(maxX, maxY, newVertices);
    }
  };

  // Vendor drag/drop helpers
  const getCanvasCoordinates = (clientX, clientY) => {
    if (!stageRef.current) return null;
    const stage = stageRef.current;
    const containerRect = stage.container().getBoundingClientRect();
    const pointerX = clientX - containerRect.left;
    const pointerY = clientY - containerRect.top;

    const stageX = (pointerX - stage.x()) / stage.scaleX();
    const stageY = (pointerY - stage.y()) / stage.scaleY();

    return { x: stageX, y: stageY };
  };

  const findDroppableBoothAt = (point) => {
    if (!point) return null;
    for (let i = booths.length - 1; i >= 0; i -= 1) {
      const booth = booths[i];
      if (!booth) continue;

      const bX = booth.x * PIXELS_PER_METER;
      const bY = booth.y * PIXELS_PER_METER;
      const bWidth = booth.width * PIXELS_PER_METER;
      const bHeight = booth.height * PIXELS_PER_METER;

      if (
        point.x >= bX &&
        point.x <= bX + bWidth &&
        point.y >= bY &&
        point.y <= bY + bHeight
      ) {
        return booth;
      }
    }
    return null;
  };

  const handleContainerDragOver = (event) => {
    if (readOnly || !draggingVendorId) return;
    event.preventDefault();

    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    const targetBooth = findDroppableBoothAt(coords);
    setDropTargetId(targetBooth ? targetBooth.id : null);

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = targetBooth ? 'move' : 'none';
    }
  };

  const handleContainerDragLeave = (event) => {
    if (!draggingVendorId) return;
    const related = event.relatedTarget;
    if (related && event.currentTarget.contains(related)) {
      return;
    }
    setDropTargetId(null);
  };

  const handleContainerDrop = (event) => {
    if (readOnly || !draggingVendorId) return;
    event.preventDefault();

    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    const targetBooth = findDroppableBoothAt(coords);

    const dataTransfer = event.dataTransfer || event.nativeEvent?.dataTransfer;
    const vendorIdFromData = dataTransfer?.getData('application/vendor-id') || dataTransfer?.getData('text/plain');
    const vendorId = vendorIdFromData || draggingVendorId;

    if (targetBooth && vendorId && typeof onAssignVendor === 'function') {
      onAssignVendor(vendorId, targetBooth);
    }

    setDropTargetId(null);
    onVendorDragEnd?.();
  };

  // Handle zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const limitedScale = Math.max(0.3, Math.min(3, newScale));

    setScale(limitedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    });
  };

  // Render grid
  const renderGrid = () => {
    const lines = [];
    const gridStep = GRID_SIZE * PIXELS_PER_METER;

    // Vertical lines
    for (let i = 0; i <= hallWidth / GRID_SIZE; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridStep, 0, i * gridStep, canvasHeight]}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= hallHeight / GRID_SIZE; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridStep, canvasWidth, i * gridStep]}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  // Render hall boundary as polygon with draggable vertices
  const renderHallBoundary = () => {
    const points = [];
    hallVertices.forEach(v => {
      points.push(v.x * PIXELS_PER_METER, v.y * PIXELS_PER_METER);
    });

    return (
      <>
        {/* Hall fill */}
        <Line
          points={points}
          fill="#ffffff"
          closed={true}
          listening={false}
        />

        {/* Hall boundary lines */}
        <Line
          points={points}
          stroke="#333"
          strokeWidth={2}
          closed={true}
          listening={false}
        />

        {/* Individual edges with labels */}
        {hallVertices.map((v, i) => {
          const nextV = hallVertices[(i + 1) % hallVertices.length];
          const vx = toNumber(v.x);
          const vy = toNumber(v.y);
          const nx = toNumber(nextV.x);
          const ny = toNumber(nextV.y);

          if (
            vx === null ||
            vy === null ||
            nx === null ||
            ny === null
          ) {
            return null;
          }

          const length = Math.sqrt(
            Math.pow(nx - vx, 2) + Math.pow(ny - vy, 2)
          );

          const midX = ((vx + nx) / 2) * PIXELS_PER_METER;
          const midY = ((vy + ny) / 2) * PIXELS_PER_METER;

          if (!Number.isFinite(midX) || !Number.isFinite(midY) || !Number.isFinite(length)) {
            return null;
          }

          return (
            <Text
              key={`edge-label-${i}`}
              x={midX - 20}
              y={midY - 10}
              text={`${length.toFixed(1)}m`}
              fontSize={12}
              fill="#666"
              listening={false}
            />
          );
        })}

        {/* Draggable vertices */}
        {!readOnly && hallVertices.map((vertex) => (
          <Circle
            key={`vertex-${vertex.id}`}
            x={vertex.x * PIXELS_PER_METER}
            y={vertex.y * PIXELS_PER_METER}
            radius={10}
            fill="#4CAF50"
            stroke="#fff"
            strokeWidth={2}
            draggable={true}
            name="hall-vertex"
            onDragMove={(e) => handleVertexDrag(e, vertex.id)}
            onMouseEnter={(e) => {
              const container = e.target.getStage().container();
              container.style.cursor = 'move';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage().container();
              container.style.cursor = 'default';
            }}
          />
        ))}
      </>
    );
  };

  // Render route arrows and labels
  const renderRoutes = () => {
    if (!activeRouteId || !routeSteps.length) return null;
    const route = routes.find(r => String(r.id) === String(activeRouteId));
    if (!route || routeSteps.length < 1) return null;

    const segments = [];
    
    const routeColor = route.color || '#3B82F6';
    for (let i = 0; i < routeSteps.length - 1; i += 1) {
      const startStop = routeSteps[i];
      const endStop = routeSteps[i + 1];
      const startBooth = startStop.booth || booths.find(b => String(b.id) === String(startStop.boothId));
      const endBooth = endStop.booth || booths.find(b => String(b.id) === String(endStop.boothId));
      if (!startBooth || !endBooth) continue;

      const startX = toNumber(startBooth.x);
      const startY = toNumber(startBooth.y);
      const startWidth = toNumber(startBooth.width);
      const startHeight = toNumber(startBooth.height);
      const endX = toNumber(endBooth.x);
      const endY = toNumber(endBooth.y);
      const endWidth = toNumber(endBooth.width);
      const endHeight = toNumber(endBooth.height);

      if ([startX, startY, startWidth, startHeight, endX, endY, endWidth, endHeight].some(val => val === null)) {
        continue;
      }

      const startCenterX = (startX + (startWidth || 0) / 2) * PIXELS_PER_METER;
      const startCenterY = (startY + (startHeight || 0) / 2) * PIXELS_PER_METER;
      const endCenterX = (endX + (endWidth || 0) / 2) * PIXELS_PER_METER;
      const endCenterY = (endY + (endHeight || 0) / 2) * PIXELS_PER_METER;
      const isActiveSegment =
        currentRouteBoothId && nextRouteBoothId &&
        String(currentRouteBoothId) === String(startStop.boothId) &&
        String(nextRouteBoothId) === String(endStop.boothId);

      segments.push(
        <Arrow
          key={`arrow-${startStop.boothId}-${endStop.boothId}`}
          points={[startCenterX, startCenterY, endCenterX, endCenterY]}
          stroke={routeColor}
          strokeWidth={isActiveSegment ? 5 : 3}
          fill={routeColor}
          pointerLength={12}
          pointerWidth={12}
          dash={isActiveSegment ? [] : [10, 5]}
          opacity={isActiveSegment ? 1 : 0.85}
        />
      );
    }

    routeSteps.forEach((stop) => {
      const booth = stop.booth || booths.find(b => String(b.id) === String(stop.boothId));
      if (!booth) return;

      const boothX = toNumber(booth.x);
      const boothY = toNumber(booth.y);
      const boothWidth = toNumber(booth.width);
      const boothHeight = toNumber(booth.height);
      if ([boothX, boothY, boothWidth, boothHeight].some(val => val === null)) return;

      const centerX = (boothX + (boothWidth || 0) / 2) * PIXELS_PER_METER;
      const centerY = (boothY + (boothHeight || 0) / 2) * PIXELS_PER_METER;
      let labelY = centerY - (boothHeight * PIXELS_PER_METER) / 2 - 30;
      labelY = Math.max(labelY, 30);
      let vendorLabelY = labelY - 26;
      vendorLabelY = Math.max(vendorLabelY, 6);

      const boothIdStr = String(stop.boothId);
      const isCurrent = currentRouteBoothId && String(currentRouteBoothId) === boothIdStr;
      const isNext = !isCurrent && nextRouteBoothId && String(nextRouteBoothId) === boothIdStr;
      const isVisited = visitedBoothSet.has(boothIdStr);
      const isSkipped = skippedBoothSet.has(boothIdStr);

      let circleFill = '#1F2937';
      if (isCurrent) circleFill = '#F97316';
      else if (isSkipped) circleFill = '#F87171';
      else if (isVisited) circleFill = '#22C55E';
      else if (isNext) circleFill = '#F59E0B';

      segments.push(
        <Group key={`route-label-${boothIdStr}`}>
          <Circle
            x={centerX}
            y={labelY}
            radius={14}
            fill={circleFill}
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.95}
          />
          <Text
            x={centerX - 7}
            y={labelY - 7}
            width={14}
            text={String(stop.step)}
            align="center"
            fontSize={12}
            fontStyle="bold"
            fill="#ffffff"
          />
          {stop.vendorName && (
            <Text
              x={centerX - 60}
              y={vendorLabelY}
              width={120}
              align="center"
              text={stop.vendorName}
              fontSize={11}
              fill="#374151"
            />
          )}
        </Group>
      );
    });

    return segments;
  };

  // Render booth
  const renderBooth = (booth) => {
    const config = getElementConfig(booth.type);
    if (!config) return null;

    const boothIdStr = String(booth.id);
    const boothX = toNumber(booth.x) ?? 0;
    const boothY = toNumber(booth.y) ?? 0;
    const boothWidth = toNumber(booth.width) ?? 1;
    const boothHeight = toNumber(booth.height) ?? 1;
    const x = boothX * PIXELS_PER_METER;
    const y = boothY * PIXELS_PER_METER;
    const width = boothWidth * PIXELS_PER_METER;
    const height = boothHeight * PIXELS_PER_METER;
    const isSelected = selectedBoothId === booth.id;
    const isDropTarget = dropTargetId === booth.id;

    // Find assigned vendor
    const vendor = vendors.find(v =>
      String(v.boothId) === boothIdStr ||
      (booth.label && String(v.boothNumber) === String(booth.label))
    );

    // Route state
    const stepInfo = routeStepMap.get(boothIdStr);
    const isInRoute = Boolean(stepInfo);
    const isCurrentRouteBooth =
      currentRouteBoothId && String(currentRouteBoothId) === boothIdStr;
    const isNextRouteBooth =
      nextRouteBoothId && String(nextRouteBoothId) === boothIdStr && !isCurrentRouteBooth;
    const isVisited = visitedBoothSet.has(boothIdStr);
    const isSkipped = skippedBoothSet.has(boothIdStr);

    let fillColor = config.color;
    if (isInRoute) {
      fillColor = '#FFF9C4';
    }
    if (isVisited) {
      fillColor = '#E6F4EA';
    }
    if (isSkipped) {
      fillColor = '#FEE2E2';
    }
    if (isNextRouteBooth) {
      fillColor = '#FFF7ED';
    }
    if (isCurrentRouteBooth) {
      fillColor = '#FFEDD5';
    }

    let strokeColor = config.stroke;
    let strokeWidth = 2;

    if (isDropTarget) {
      strokeColor = '#FF9800';
      strokeWidth = 4;
    }

    if (isSelected) {
      strokeColor = '#2196F3';
      strokeWidth = 4;
    }

    if (isInRoute) {
      strokeColor = '#FF9800';
      strokeWidth = Math.max(strokeWidth, 3);
    }

    if (isVisited) {
      strokeColor = '#22C55E';
      strokeWidth = Math.max(strokeWidth, 3);
    }

    if (isSkipped) {
      strokeColor = '#EF4444';
      strokeWidth = Math.max(strokeWidth, 3);
    }

    if (isNextRouteBooth) {
      strokeColor = '#F59E0B';
      strokeWidth = Math.max(strokeWidth, 4);
    }

    if (isCurrentRouteBooth) {
      strokeColor = '#F97316';
      strokeWidth = Math.max(strokeWidth, 5);
    }

    return (
      <Group
        key={booth.id}
        id={`booth-${booth.id}`}
        x={x}
        y={y}
        width={width}
        height={height}
        draggable={!readOnly}
        onDragStart={(e) => handleDragStart(e, booth)}
        onDragEnd={(e) => handleDragEnd(e, booth)}
        onTransformEnd={(e) => handleTransformEnd(e, booth)}
        onClick={() => !readOnly && onSelectBooth(booth.id)}
        onTap={() => !readOnly && onSelectBooth(booth.id)}
      >
        {/* Main booth shape */}
        {config.image ? (
          <>
            <Rect
              width={width}
              height={height}
              fill={fillColor}
              cornerRadius={4}
              listening={!readOnly}
            />
            <KonvaImage
              src={config.image}
              width={width}
              height={height}
              listening={!readOnly}
            />
            <Rect
              width={width}
              height={height}
              cornerRadius={4}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              listening={false}
            />
          </>
        ) : (
          <Rect
            width={width}
            height={height}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={4}
          />
        )}

        {(isCurrentRouteBooth || isNextRouteBooth) && (
          <Group x={width / 2 - 50} y={-28}>
            <Rect
              width={100}
              height={22}
              fill={isCurrentRouteBooth ? '#F97316' : '#F59E0B'}
              cornerRadius={11}
              opacity={0.9}
            />
            <Text
              text={isCurrentRouteBooth ? 'You are here' : 'Next stop'}
              width={100}
              height={22}
              align="center"
              y={4}
              fontSize={12}
              fontStyle="bold"
              fill="#ffffff"
            />
          </Group>
        )}

        {/* Booth number */}
        {booth.label && (
          <Text
            text={booth.label}
            x={0}
            y={10}
            width={width}
            align="center"
            fontSize={16}
            fontStyle="bold"
            fill="#333"
          />
        )}

        {/* Vendor name */}
        {vendor && (
          <Text
            text={vendor.name}
            x={5}
            y={height / 2 - 8}
            width={width - 10}
            align="center"
            fontSize={12}
            fill="#666"
          />
        )}

        {/* Vendor category */}
        {vendor?.category && (
          <Text
            text={vendor.category}
            x={5}
            y={height - 25}
            width={width - 10}
            align="center"
            fontSize={10}
            fill="#999"
          />
        )}

        {/* Assigned indicator */}
        {vendor && (
          <Group>
            <Circle
              x={width - 15}
              y={15}
              radius={8}
              fill="#4CAF50"
              stroke="#fff"
              strokeWidth={2}
            />
          </Group>
        )}
      </Group>
    );
  };

  // Auto-resize canvas based on container
  const [canvasDimensions, setCanvasDimensions] = React.useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('tradeshow-canvas-container');
      if (container) {
        setCanvasDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div
      id="tradeshow-canvas-container"
      className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden"
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      onDragLeave={handleContainerDragLeave}
    >
      <Stage
        ref={stageRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        draggable={!draggedBooth && !draggingVendorId}
      >
        <Layer>
          {/* Grid */}
          {renderGrid()}

          {/* Hall boundary (irregular polygon) */}
          {renderHallBoundary()}

          {/* Booths */}
          {booths.map(renderBooth)}

          {/* Routes */}
          {renderRoutes()}

          {/* Transformer for selected booth */}
          {!readOnly && <Transformer ref={transformerRef} />}
        </Layer>
      </Stage>

      {/* Scale indicator */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow text-sm">
        Zoom: {Math.round(scale * 100)}%
      </div>

      {/* Hall dimensions */}
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow text-sm">
        Hall Max Size: {realWidth.toFixed(1)}m × {realHeight.toFixed(1)}m
      </div>

      {/* Active route indicator */}
      {activeRouteId && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-100 border border-orange-400 px-3 py-2 rounded shadow text-sm text-orange-800">
          🛤️ Route Visualization Active
        </div>
      )}

      {/* Scale Ruler */}
      {!readOnly && (
        <ScaleRuler
          canvasWidth={Math.round(canvasWidth)}
          canvasHeight={Math.round(canvasHeight)}
          realWidth={realWidth}
          realHeight={realHeight}
          pixelsPerMeter={PIXELS_PER_METER}
          scale={scale}
        />
      )}
    </div>
  );
}
