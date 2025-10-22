// Tradeshow canvas component with Konva

import React, { useRef, useState, useEffect } from 'react';
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
  selectedBoothId,
  onSelectBooth,
  vendors = [],
  routes = [],
  activeRouteId = null,
  readOnly = false,
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

  // Hall boundary points (vertices that can be dragged to create irregular shapes)
  const [hallVertices, setHallVertices] = useState(() => [
    { x: 0, y: 0, id: 0 },
    { x: hallWidth, y: 0, id: 1 },
    { x: hallWidth, y: hallHeight, id: 2 },
    { x: 0, y: hallHeight, id: 3 },
  ]);

  // Track if vertices have been manually modified
  const [verticesModified, setVerticesModified] = useState(false);

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
          const length = Math.sqrt(
            Math.pow(nextV.x - v.x, 2) + Math.pow(nextV.y - v.y, 2)
          );

          const midX = (v.x + nextV.x) / 2 * PIXELS_PER_METER;
          const midY = (v.y + nextV.y) / 2 * PIXELS_PER_METER;

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

  // Render route arrows
  const renderRoutes = () => {
    if (!activeRouteId || routes.length === 0) {
      console.log('No active route or routes empty:', { activeRouteId, routesCount: routes.length });
      return null;
    }

    const route = routes.find(r => r.id === activeRouteId);
    if (!route || !route.boothOrder || route.boothOrder.length < 2) {
      console.warn('Route not renderable:', {
        route: route?.name,
        boothOrderLength: route?.boothOrder?.length,
        boothOrder: route?.boothOrder,
        activeRouteId,
        routesCount: routes.length
      });
      return null;
    }

    console.log('Rendering route:', route.name, 'boothOrder:', route.boothOrder);
    console.log('Available booths:', booths.map(b => ({ id: b.id, label: b.label, type: b.type })));

    const arrows = [];

    for (let i = 0; i < route.boothOrder.length - 1; i++) {
      const startBoothId = route.boothOrder[i];
      const endBoothId = route.boothOrder[i + 1];

      const startBooth = booths.find(b => String(b.id) === String(startBoothId));
      const endBooth = booths.find(b => String(b.id) === String(endBoothId));

      if (!startBooth || !endBooth) {
        console.error('❌ Booth not found for route segment:', {
          startBoothId,
          endBoothId,
          startBooth: startBooth?.label || 'NOT FOUND',
          endBooth: endBooth?.label || 'NOT FOUND',
          allBoothIds: booths.map(b => b.id)
        });
        continue;
      }

      // Validate booth coordinates before rendering
      const isValidNumber = (val) => typeof val === 'number' && !isNaN(val) && isFinite(val);

      if (!isValidNumber(startBooth.x) || !isValidNumber(startBooth.y) ||
          !isValidNumber(startBooth.width) || !isValidNumber(startBooth.height)) {
        console.error('❌ Start booth has invalid coordinates:', {
          boothId: startBoothId,
          label: startBooth.label,
          x: startBooth.x,
          y: startBooth.y,
          width: startBooth.width,
          height: startBooth.height
        });
        continue;
      }

      if (!isValidNumber(endBooth.x) || !isValidNumber(endBooth.y) ||
          !isValidNumber(endBooth.width) || !isValidNumber(endBooth.height)) {
        console.error('❌ End booth has invalid coordinates:', {
          boothId: endBoothId,
          label: endBooth.label,
          x: endBooth.x,
          y: endBooth.y,
          width: endBooth.width,
          height: endBooth.height
        });
        continue;
      }

      const startX = (startBooth.x + startBooth.width / 2) * PIXELS_PER_METER;
      const startY = (startBooth.y + startBooth.height / 2) * PIXELS_PER_METER;
      const endX = (endBooth.x + endBooth.width / 2) * PIXELS_PER_METER;
      const endY = (endBooth.y + endBooth.height / 2) * PIXELS_PER_METER;

      // Final validation of calculated coordinates
      if (!isValidNumber(startX) || !isValidNumber(startY) ||
          !isValidNumber(endX) || !isValidNumber(endY)) {
        console.error('❌ Calculated coordinates are invalid:', {
          startX, startY, endX, endY,
          startBooth: { id: startBoothId, x: startBooth.x, y: startBooth.y },
          endBooth: { id: endBoothId, x: endBooth.x, y: endBooth.y }
        });
        continue;
      }

      console.log(`✓ Rendering arrow ${i}: (${startX.toFixed(1)}, ${startY.toFixed(1)}) -> (${endX.toFixed(1)}, ${endY.toFixed(1)})`);

      arrows.push(
        <Arrow
          key={`arrow-${i}`}
          points={[startX, startY, endX, endY]}
          stroke={route.color || '#3B82F6'}
          strokeWidth={3}
          fill={route.color || '#3B82F6'}
          pointerLength={10}
          pointerWidth={10}
          dash={[10, 5]}
        />
      );
    }

    console.log(`✓ Total arrows rendered: ${arrows.length} out of ${route.boothOrder.length - 1} segments`);
    return arrows;
  };

  // Render booth
  const renderBooth = (booth) => {
    const config = getElementConfig(booth.type);
    if (!config) return null;

    const x = booth.x * PIXELS_PER_METER;
    const y = booth.y * PIXELS_PER_METER;
    const width = booth.width * PIXELS_PER_METER;
    const height = booth.height * PIXELS_PER_METER;
    const isSelected = selectedBoothId === booth.id;
    const isDropTarget = dropTargetId === booth.id;

    // Find assigned vendor
    const vendor = vendors.find(v => v.boothNumber === booth.label || v.boothId === booth.id);

    // Check if booth is in active route
    const isInRoute =
      activeRouteId &&
      routes.find(r => r.id === activeRouteId)?.boothOrder?.some(id => String(id) === String(booth.id));

    const fillColor = isInRoute ? '#FFF9C4' : config.color;
    const strokeColor = isSelected ? '#2196F3' : isDropTarget ? '#FF9800' : isInRoute ? '#FF9800' : config.stroke;
    const strokeWidth = isSelected || isDropTarget ? 4 : isInRoute ? 3 : 2;

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
