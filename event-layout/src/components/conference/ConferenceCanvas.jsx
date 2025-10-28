// Conference canvas component with Konva - Enhanced version with irregular room shapes

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import { CONFERENCE_ELEMENTS, getElementConfig } from '../../lib/canvas/shapes';
import ZoomControls from '../shared/ZoomControls';
import ScaleRuler from '../shared/ScaleRuler';

const PIXELS_PER_METER = 40; // 40 pixels = 1 meter
const GRID_SIZE = 0.5; // Grid every 0.5 meters

// Image component for Konva
const KonvaImage = forwardRef(function KonvaImage({ src, ...props }, ref) {
  const [image] = useImage(src);
  return <Image image={image} ref={ref} {...props} />;
});

const ConferenceCanvas = forwardRef(function ConferenceCanvas(
  {
    elements,
    onElementsChange,
    roomWidth = 24,
    roomHeight = 16,
    initialRoomVertices = null,
    selectedElementId,
    onSelectElement,
    guests = [],
    readOnly = false,
    onRoomResize,
    draggingGuestId = null,
    onAssignGuest,
    onGuestDragEnd,
  },
  ref
) {
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 20, y: 20 });
  const [dropTargetId, setDropTargetId] = useState(null);

  // Room boundary points (vertices that can be dragged to create irregular shapes)
  const [roomVertices, setRoomVertices] = useState(() => {
    if (initialRoomVertices && Array.isArray(initialRoomVertices) && initialRoomVertices.length > 0) {
      return initialRoomVertices;
    }
    return [
      { x: 0, y: 0, id: 0 },
      { x: roomWidth, y: 0, id: 1 },
      { x: roomWidth, y: roomHeight, id: 2 },
      { x: 0, y: roomHeight, id: 3 },
    ];
  });

  // Track if vertices have been manually modified
  const [verticesModified, setVerticesModified] = useState(() => {
    return initialRoomVertices && Array.isArray(initialRoomVertices) && initialRoomVertices.length > 0;
  });

  // Track previous dimensions to detect changes
  const prevDimensionsRef = useRef({ width: roomWidth, height: roomHeight });

  // Update vertices when roomWidth/roomHeight changes (only if not manually modified)
  useEffect(() => {
    const prevDimensions = prevDimensionsRef.current;
    const dimensionsChanged = prevDimensions.width !== roomWidth || prevDimensions.height !== roomHeight;

    if (dimensionsChanged && !verticesModified) {
      setRoomVertices([
        { x: 0, y: 0, id: 0 },
        { x: roomWidth, y: 0, id: 1 },
        { x: roomWidth, y: roomHeight, id: 2 },
        { x: 0, y: roomHeight, id: 3 },
      ]);
      prevDimensionsRef.current = { width: roomWidth, height: roomHeight };
    }
  }, [roomWidth, roomHeight, verticesModified]);

  // Calculate canvas bounds from vertices
  const canvasWidth = Math.max(...roomVertices.map(p => p.x)) * PIXELS_PER_METER + 100;
  const canvasHeight = Math.max(...roomVertices.map(p => p.y)) * PIXELS_PER_METER + 100;
  const realWidth = Math.max(...roomVertices.map(p => p.x));
  const realHeight = Math.max(...roomVertices.map(p => p.y));

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || readOnly) return;

    const stage = stageRef.current;
    if (!stage) return;

    const selectedNode = stage.findOne(`#element-${selectedElementId}`);

    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementId, readOnly]);

  // Handle element drag
  const handleDragEnd = (e, element) => {
    if (readOnly) return;
    const newElements = elements.map(el =>
      el.id === element.id
        ? {
            ...el,
            x: e.target.x() / PIXELS_PER_METER,
            y: e.target.y() / PIXELS_PER_METER,
          }
        : el
    );
    onElementsChange(newElements);
  };

  // Handle element transform (resize/rotate)
  const handleTransformEnd = (e, element) => {
    if (readOnly) return;

    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newElements = elements.map(el =>
      el.id === element.id
        ? {
            ...el,
            x: node.x() / PIXELS_PER_METER,
            y: node.y() / PIXELS_PER_METER,
            width: Math.max(0.1, (node.width() * scaleX) / PIXELS_PER_METER),
            height: Math.max(0.1, (node.height() * scaleY) / PIXELS_PER_METER),
            rotation: node.rotation(),
          }
        : el
    );
    onElementsChange(newElements);
  };

  // Handle vertex drag (room shape modification)
  const handleVertexDrag = (e, vertexId) => {
    const newX = e.target.x() / PIXELS_PER_METER;
    const newY = e.target.y() / PIXELS_PER_METER;

    const newVertices = roomVertices.map(v =>
      v.id === vertexId ? { ...v, x: newX, y: newY } : v
    );

    setRoomVertices(newVertices);
    setVerticesModified(true); // Mark as manually modified

    // Update room dimensions and vertices if callback exists
    if (onRoomResize) {
      const maxX = Math.max(...newVertices.map(p => p.x));
      const maxY = Math.max(...newVertices.map(p => p.y));
      onRoomResize(maxX, maxY, newVertices);
    }
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

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(3, scale * 1.2);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.3, scale / 1.2);
    setScale(newScale);
  };

  const handleZoomReset = () => {
    setScale(1);
    setStagePos({ x: 20, y: 20 });
  };

  // Render grid
  const renderGrid = () => {
    const lines = [];
    const gridStep = GRID_SIZE * PIXELS_PER_METER;
    const maxX = Math.max(...roomVertices.map(p => p.x));
    const maxY = Math.max(...roomVertices.map(p => p.y));

    for (let i = 0; i <= maxX / GRID_SIZE + 2; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridStep, -gridStep, i * gridStep, (maxY + 2) * PIXELS_PER_METER]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    for (let i = 0; i <= maxY / GRID_SIZE + 2; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[-gridStep, i * gridStep, (maxX + 2) * PIXELS_PER_METER, i * gridStep]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return lines;
  };

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

  const findDroppableElementAt = (point) => {
    if (!point) return null;
    for (let i = elements.length - 1; i >= 0; i -= 1) {
      const element = elements[i];
      if (!element) continue;

      // Only allow dropping on chairs and tables with seats
      const isChair = element.type === 'chair';
      const hasSeats = element.seats && element.seats > 0;
      if (!isChair && !hasSeats) continue;

      const elX = element.x * PIXELS_PER_METER;
      const elY = element.y * PIXELS_PER_METER;
      const elWidth = element.width * PIXELS_PER_METER;
      const elHeight = element.height * PIXELS_PER_METER;

      if (element.type === 'table_round') {
        const centerX = elX + elWidth / 2;
        const centerY = elY + elHeight / 2;
        const radius = elWidth / 2;
        const distance = Math.sqrt(
          Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
        );
        if (distance <= radius) {
          return element;
        }
      } else {
        if (
          point.x >= elX &&
          point.x <= elX + elWidth &&
          point.y >= elY &&
          point.y <= elY + elHeight
        ) {
          return element;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (!draggingGuestId) {
      setDropTargetId(null);
    }
  }, [draggingGuestId]);

  const handleContainerDragOver = (event) => {
    if (readOnly || !draggingGuestId) return;
    event.preventDefault();

    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    const targetElement = findDroppableElementAt(coords);
    setDropTargetId(targetElement ? targetElement.id : null);

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = targetElement ? 'move' : 'none';
    } else if (event.nativeEvent?.dataTransfer) {
      event.nativeEvent.dataTransfer.dropEffect = targetElement ? 'move' : 'none';
    }
  };

  const handleContainerDragLeave = (event) => {
    if (!draggingGuestId) return;
    const related = event.relatedTarget;
    if (related && event.currentTarget.contains(related)) {
      return;
    }
    setDropTargetId(null);
  };

  const handleContainerDrop = (event) => {
    if (readOnly || !draggingGuestId) return;
    event.preventDefault();

    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    const targetElement = findDroppableElementAt(coords);

    const dataTransfer = event.dataTransfer || event.nativeEvent?.dataTransfer;
    const guestIdFromData = dataTransfer?.getData('application/guest-id') || dataTransfer?.getData('text/plain');
    const guestId = guestIdFromData || draggingGuestId;

    if (targetElement && guestId && typeof onAssignGuest === 'function') {
      onAssignGuest(guestId, targetElement);
    }

    setDropTargetId(null);
    onGuestDragEnd?.();
  };

  // Render element
  const renderElement = (element) => {
    const config = getElementConfig(element.type);
    if (!config) return null;

    const x = element.x * PIXELS_PER_METER;
    const y = element.y * PIXELS_PER_METER;
    const width = element.width * PIXELS_PER_METER;
    const height = element.height * PIXELS_PER_METER;
    const isSelected = selectedElementId === element.id;
    const isDropTarget = dropTargetId === element.id;

    const assignedGuests = guests.filter(
      g => g.tableNumber === element.label || g.elementId === element.id
    );

    const strokeColor = isSelected ? '#FF5722' : isDropTarget ? '#FF9800' : config.stroke;
    const strokeWidth = isSelected ? 4 : isDropTarget ? 3 : 2;

    const handleSelect = () => {
      if (readOnly) return;
      onSelectElement(element.id);
    };

    return (
      <Group
        key={element.id}
        id={`element-${element.id}`}
        x={x}
        y={y}
        width={width}
        height={height}
        draggable={!readOnly}
        onDragEnd={(e) => handleDragEnd(e, element)}
        onTransformEnd={(e) => handleTransformEnd(e, element)}
        onClick={handleSelect}
        onTap={handleSelect}
      >
        {/* Glow effect for selected element */}
        {isSelected && (
          element.type === 'table_round' ? (
            <Circle
              radius={width / 2 + 15}
              x={width / 2}
              y={height / 2}
              fill="rgba(33, 150, 243, 0.2)"
              shadowColor="#2196F3"
              shadowBlur={30}
              shadowOpacity={0.8}
              listening={false}
            />
          ) : (
            <Rect
              x={-10}
              y={-10}
              width={width + 20}
              height={height + 20}
              fill="rgba(33, 150, 243, 0.2)"
              cornerRadius={8}
              shadowColor="#2196F3"
              shadowBlur={30}
              shadowOpacity={0.8}
              listening={false}
            />
          )
        )}

        {config.image ? (
          <>
            <Rect
              width={width}
              height={height}
              fill={config.color || '#ffffff'}
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
        ) : element.type === 'table_round' ? (
          <Circle
            radius={width / 2}
            x={width / 2}
            y={height / 2}
            fill={config.color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor={isSelected ? '#FF5722' : undefined}
            shadowBlur={isSelected ? 20 : 0}
            shadowOpacity={isSelected ? 0.6 : 0}
          />
        ) : (
          <Rect
            width={width}
            height={height}
            fill={config.color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={4}
            shadowColor={isSelected ? '#FF5722' : undefined}
            shadowBlur={isSelected ? 20 : 0}
            shadowOpacity={isSelected ? 0.6 : 0}
          />
        )}

        {/* {element.label && (
          <Text
            text={element.label}
            x={0}
            y={height / 2 - 10}
            width={width}
            align="center"
            fontSize={14}
            fontStyle="bold"
            fill="#333"
            listening={false}
          />
        )} */}

        {assignedGuests.length > 0 && (
          <Group listening={false}>
            {element.type === 'chair' ? (
              <Text
                text={assignedGuests[0]?.name || ''}
                x={0}
                y={height / 2 - 5}
                width={width}
                align="center"
                fontSize={10}
                fill="#333"
                fontStyle="bold"
              />
            ) : (
              <>
                <Circle
                  x={width - 15}
                  y={15}
                  radius={12}
                  fill="#4CAF50"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <Text
                  text={assignedGuests.length.toString()}
                  x={width - 15 - 6}
                  y={15 - 6}
                  fontSize={10}
                  fill="#fff"
                  fontStyle="bold"
                />

                <Group x={5} y={height / 2 + 15}>
                  {assignedGuests.slice(0, 5).map((guest, index) => (
                    <Text
                      key={guest.id}
                      text={guest.name}
                      x={0}
                      y={index * 14}
                      fontSize={10}
                      fill="#333"
                      width={width - 10}
                      ellipsis={true}
                    />
                  ))}
                  {assignedGuests.length > 5 && (
                    <Text
                      text={`+${assignedGuests.length - 5} more...`}
                      x={0}
                      y={5 * 14}
                      fontSize={9}
                      fill="#666"
                      fontStyle="italic"
                    />
                  )}
                </Group>
              </>
            )}
          </Group>
        )}
      </Group>
    );
  };


  // Render room boundary as polygon with draggable vertices
  const renderRoomBoundary = () => {
    const points = [];
    roomVertices.forEach(v => {
      points.push(v.x * PIXELS_PER_METER, v.y * PIXELS_PER_METER);
    });

    return (
      <>
        {/* Room fill */}
        <Line
          points={points}
          fill="#ffffff"
          closed={true}
          listening={false}
        />

        {/* Room boundary lines */}
        <Line
          points={points}
          stroke="#333"
          strokeWidth={2}
          closed={true}
          listening={false}
        />

        {/* Individual edges with labels */}
        {roomVertices.map((v, i) => {
          const nextV = roomVertices[(i + 1) % roomVertices.length];
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
        {!readOnly && roomVertices.map((vertex) => (
          <Circle
            key={`vertex-${vertex.id}`}
            x={vertex.x * PIXELS_PER_METER}
            y={vertex.y * PIXELS_PER_METER}
            radius={10}
            fill="#2196F3"
            stroke="#fff"
            strokeWidth={2}
            draggable={true}
            name="room-vertex"
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

  useImperativeHandle(
    ref,
    () => ({
      exportLayoutImage: ({ pixelRatio = 2 } = {}) => {
        if (!stageRef.current) {
          return null;
        }

        const exportWidth = Math.max(canvasWidth, 1);
        const exportHeight = Math.max(canvasHeight, 1);
        const container = document.createElement('div');
        const clone = stageRef.current.clone({ container });

        clone.scale({ x: 1, y: 1 });
        clone.position({ x: 0, y: 0 });
        clone.size({ width: exportWidth, height: exportHeight });

        clone.find('Transformer').forEach(node => node.destroy());
        clone.find('.room-vertex').forEach(node => node.destroy());

        const dataURL = clone.toDataURL({ pixelRatio });
        clone.destroy();

        return {
          dataURL,
          width: exportWidth,
          height: exportHeight,
        };
      },
    }),
    [canvasWidth, canvasHeight]
  );

  // Auto-resize canvas based on container
  const [canvasDimensions, setCanvasDimensions] = React.useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('canvas-container');
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
      id="canvas-container"
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
        draggable={!draggingGuestId}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            onSelectElement(null);
          }
        }}
      >
        <Layer>
          {/* Grid */}
          {renderGrid()}

          {/* Room boundary (irregular polygon) */}
          {renderRoomBoundary()}

          {/* Elements */}
          {elements.map(renderElement)}

          {/* Transformer for selected element */}
          {!readOnly && <Transformer ref={transformerRef} />}
        </Layer>
      </Stage>

      {/* Scale indicator */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow text-sm">
        Zoom: {Math.round(scale * 100)}%
      </div>

      {/* Room dimensions */}
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow text-sm">
        Room Max Size: {realWidth.toFixed(1)}m × {realHeight.toFixed(1)}m
      </div>

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

      {/* Zoom controls */}
      {!readOnly && (
        <ZoomControls
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleZoomReset}
        />
      )}
    </div>
  );
});

export default ConferenceCanvas;
