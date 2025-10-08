import React, { useEffect, useRef } from 'react';
import { Circle, Rect, Text, Transformer, Line, Group } from 'react-konva';
import { MdTableRestaurant, MdChair, MdRecordVoiceOver, MdTheaters, MdDoorFront, MdWindow } from 'react-icons/md';
import { FaWheelchair } from 'react-icons/fa';
import { TbTableOptions } from 'react-icons/tb';
import COLORS from '../colors';
import { PX_PER_METER, GRID_SIZE_PX, snapPx } from '../utils';

const TYPE_COLORS = {
  table_round: COLORS.booth,
  table_rect: COLORS.booth,
  chair: '#fde68a',
  podium: '#fca5a5',
  stage: '#a7f3d0',
  door: '#f59e0b',
  window: '#bae6fd',
  blind_path: '#facc15'
};

const TYPE_LABELS = {
  table_round: '⚪',
  table_rect: '▭',
  chair: '🪑',
  podium: '🎤',
  stage: '🎭',
  door: '🚪',
  window: '🪟',
  blind_path: '♿'
};

export default function ElementNode({
  node,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  assignedGuests,
  isDraggable,
  onDragStart,
  onDragEnd
}) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleTransformStart = () => {
    if (onDragStart) onDragStart();
  };

  const widthPx = node.w * PX_PER_METER * node.scaleX;
  const heightPx = node.h * PX_PER_METER * node.scaleY;
  const hasSeats = node.seats && node.seats > 0;
  const shapeType = node.shapeType || (node.type === 'table_round' ? 'circle' : 'rect');
  let fill = node.fillColor || TYPE_COLORS[node.type] || COLORS.booth;
  if (hasSeats && assignedGuests && assignedGuests.length > 0) {
    fill = '#fef3c7';
  }

  const handleDragEnd = (event) => {
    let nextX = event.target.x();
    let nextY = event.target.y();

    if (shapeType === 'circle') {
      const radius = Math.min(widthPx, heightPx) / 2;
      nextX -= radius;
      nextY -= radius;
    }

    onChange({
      ...node,
      x: snapPx(nextX),
      y: snapPx(nextY)
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
    let snappedWidth = Math.max(GRID_SIZE_PX, snapPx(rawWidth));
    let snappedHeight = Math.max(GRID_SIZE_PX, snapPx(rawHeight));

    if (shapeType === 'circle') {
      const size = Math.max(snappedWidth, snappedHeight);
      snappedWidth = size;
      snappedHeight = size;
    }

    let nextScaleX = snappedWidth / (node.w * PX_PER_METER);
    let nextScaleY = snappedHeight / (node.h * PX_PER_METER);

    if (shapeType === 'circle') {
      const sizeScale = snappedWidth / (node.w * PX_PER_METER);
      nextScaleX = sizeScale;
      nextScaleY = sizeScale;
    }

    ref.scaleX(1);
    ref.scaleY(1);

    let nextX = ref.x();
    let nextY = ref.y();

    if (shapeType === 'circle') {
      nextX -= snappedWidth / 2;
      nextY -= snappedHeight / 2;
    }

    onChange({
      ...node,
      x: snapPx(nextX),
      y: snapPx(nextY),
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

  const renderMainShape = () => {
    if (shapeType === 'circle') {
      return (
        <Circle
          {...baseProps}
          x={node.x + widthPx / 2}
          y={node.y + heightPx / 2}
          radius={Math.min(widthPx, heightPx) / 2}
          fill={fill}
          stroke={COLORS.text}
          strokeWidth={2}
        />
      );
    }

    if (shapeType === 'polygon' && Array.isArray(node.points) && node.points.length >= 3) {
      const polygonPoints = node.points.flatMap((point) => [point.x * widthPx, point.y * heightPx]);
      return (
        <Line
          {...baseProps}
          points={polygonPoints}
          closed
          fill={fill}
          stroke={COLORS.text}
          strokeWidth={2}
        />
      );
    }

    return (
      <Rect
        {...baseProps}
        width={widthPx}
        height={heightPx}
        fill={fill}
        stroke={COLORS.text}
        strokeWidth={2}
        cornerRadius={4}
      />
    );
  };

  return (
    <>
      {renderMainShape()}
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
            x={node.x + widthPx * 0.2}
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
            x={node.x + widthPx * 0.8}
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
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right'
          ]}
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
      {assignedGuests && assignedGuests.length > 0 && (
        <Text
          x={node.x + 5}
          y={node.y + 5}
          text={`👥 ${assignedGuests.length}`}
          fontSize={11}
          fill={COLORS.textLight}
          fontStyle="bold"
          listening={false}
        />
      )}
    </>
  );
}
