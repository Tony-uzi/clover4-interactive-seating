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
  let fill = TYPE_COLORS[node.type] || COLORS.booth;
  if (hasSeats && assignedGuests && assignedGuests.length > 0) {
    fill = '#fef3c7';
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
      {node.type === 'table_round' ? (
        <Circle
          {...baseProps}
          radius={Math.max(widthPx, heightPx) / 4}
          fill={fill}
          stroke={COLORS.text}
          strokeWidth={2}
        />
      ) : (
        <Rect
          {...baseProps}
          width={widthPx}
          height={heightPx}
          fill={fill}
          stroke={COLORS.text}
          strokeWidth={2}
          cornerRadius={4}
        />
      )}
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
