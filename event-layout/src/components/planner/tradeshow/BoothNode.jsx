import React, { useEffect, useRef } from 'react';
import { Rect, Text, Transformer, Circle, Line } from 'react-konva';
import COLORS from '../colors';
import { PX_PER_METER, GRID_SIZE_PX, snapPx } from '../utils';

const TYPE_LABELS = {
  booth_small: '🏪',
  booth_medium: '🏬',
  booth_large: '🏢',
  entrance: '🚪',
  exit: '🚶',
  restroom: '🚻',
  info_desk: 'ℹ️',
  food_court: '🍽️',
  door: '🚪',
  window: '🪟',
  blind_path: '♿'
};

export default function BoothNode({
  node,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  assignedVendor,
  isDraggable,
  isOnRoute,
  routeNumber,
  onDragStart,
  onDragEnd
}) {
  const shapeRef = useRef();
  const transformerRef = useRef();

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleTransformStart = () => {
    if (onDragStart) onDragStart();
  };

  const widthPx = node.w * PX_PER_METER * node.scaleX;
  const heightPx = node.h * PX_PER_METER * node.scaleY;

  let fill = COLORS.booth;
  let strokeColor = COLORS.primary;

  if (node.category === 'facility') {
    fill = COLORS.facility;
    strokeColor = COLORS.secondary;
  }

  if (node.category === 'structure') {
    if (node.type === 'door') {
      fill = COLORS.warning;
      strokeColor = COLORS.warning;
    } else if (node.type === 'window') {
      fill = COLORS.primaryLight;
      strokeColor = COLORS.primaryLight;
    } else if (node.type === 'blind_path') {
      fill = '#fde68a';
      strokeColor = COLORS.warning;
    }
  }

  if (assignedVendor) {
    fill = COLORS.boothAssigned;
    strokeColor = COLORS.success;
  }

  if (isOnRoute) {
    fill = COLORS.boothRoute;
    strokeColor = COLORS.accent;
  }

  const handleDragEnd = (event) => {
    onChange({
      ...node,
      x: snapPx(event.target.x()),
      y: snapPx(event.target.y())
    });
    if (onDragEnd) onDragEnd();
  };

  const handleTransformEnd = () => {
    const ref = shapeRef.current;
    if (!ref) return;

    const scaleX = ref.scaleX();
    const scaleY = ref.scaleY();
    const rawWidth = node.w * PX_PER_METER * scaleX;
    const rawHeight = node.h * PX_PER_METER * scaleY;
    const snappedWidth = Math.max(GRID_SIZE_PX, snapPx(rawWidth));
    const snappedHeight = Math.max(GRID_SIZE_PX, snapPx(rawHeight));
    const nextScaleX = snappedWidth / (node.w * PX_PER_METER);
    const nextScaleY = snappedHeight / (node.h * PX_PER_METER);

    ref.scaleX(1);
    ref.scaleY(1);

    onChange({
      ...node,
      x: snapPx(ref.x()),
      y: snapPx(ref.y()),
      scaleX: nextScaleX,
      scaleY: nextScaleY,
      rotation: ref.rotation()
    });

    if (onDragEnd) onDragEnd();
  };

  const baseProps = {
    ref: shapeRef,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    onClick: onSelect,
    onTap: onSelect,
    draggable: isDraggable,
    onDragStart: onDragStart,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onDblClick: () => onDelete(node.id),
    onDblTap: () => onDelete(node.id)
  };

  return (
    <>
      <Rect
        {...baseProps}
        width={widthPx}
        height={heightPx}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={isOnRoute ? 3 : 2}
        cornerRadius={4}
      />
      {node.type === 'door' && (
        <Line
          x={node.x}
          y={node.y}
          points={[0, 0, 0, heightPx]}
          stroke={COLORS.text}
          strokeWidth={2}
          rotation={node.rotation}
          listening={false}
        />
      )}
      {node.type === 'window' && (
        <>
          <Line
            x={node.x}
            y={node.y + heightPx * 0.25}
            points={[0, 0, widthPx, 0]}
            stroke={COLORS.textLight}
            strokeWidth={2}
            rotation={node.rotation}
            listening={false}
          />
          <Line
            x={node.x}
            y={node.y + heightPx * 0.75}
            points={[0, 0, widthPx, 0]}
            stroke={COLORS.textLight}
            strokeWidth={2}
            rotation={node.rotation}
            listening={false}
          />
        </>
      )}
      {node.type === 'blind_path' && (
        <>
          <Line
            x={node.x + widthPx * 0.25}
            y={node.y}
            points={[0, 0, 0, heightPx]}
            stroke={COLORS.text}
            strokeWidth={1.5}
            dash={[6, 6]}
            rotation={node.rotation}
            listening={false}
          />
          <Line
            x={node.x + widthPx * 0.5}
            y={node.y}
            points={[0, 0, 0, heightPx]}
            stroke={COLORS.text}
            strokeWidth={1.5}
            dash={[6, 6]}
            rotation={node.rotation}
            listening={false}
          />
          <Line
            x={node.x + widthPx * 0.75}
            y={node.y}
            points={[0, 0, 0, heightPx]}
            stroke={COLORS.text}
            strokeWidth={1.5}
            dash={[6, 6]}
            rotation={node.rotation}
            listening={false}
          />
        </>
      )}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < GRID_SIZE_PX || Math.abs(newBox.height) < GRID_SIZE_PX) {
              return oldBox;
            }
            return newBox;
          }}
          onTransformStart={handleTransformStart}
        />
      )}
      <Text
        x={node.x}
        y={node.y - 20}
        text={`${TYPE_LABELS[node.type] || '📦'} ${node.label}`}
        fontSize={13}
        fill={COLORS.text}
        fontStyle="bold"
        listening={false}
      />
      {assignedVendor && (
        <Text
          x={node.x + 5}
          y={node.y + 5}
          text={assignedVendor.company}
          fontSize={11}
          fill={COLORS.text}
          fontStyle="bold"
          listening={false}
          width={widthPx - 10}
          wrap="word"
        />
      )}
      {isOnRoute && routeNumber !== undefined && (
        <>
          <Circle
            x={node.x + widthPx - 15}
            y={node.y + 15}
            radius={12}
            fill={COLORS.accent}
            stroke="white"
            strokeWidth={2}
          />
          <Text
            x={node.x + widthPx - 21}
            y={node.y + 8}
            text={`${routeNumber}`}
            fontSize={12}
            fill="white"
            fontStyle="bold"
            listening={false}
          />
        </>
      )}
    </>
  );
}
