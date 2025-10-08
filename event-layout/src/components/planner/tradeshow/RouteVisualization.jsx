import React from 'react';
import { Arrow } from 'react-konva';
import COLORS from '../colors';
import { PX_PER_METER } from '../utils';

export default function RouteVisualization({ route, booths }) {
  if (!route || route.length === 0) return null;

  const entrance = booths.find((booth) => booth.type === 'entrance');
  const pathIds = entrance ? [entrance.id, ...route] : [...route];
  if (pathIds.length < 2) return null;

  const arrows = [];
  for (let index = 0; index < pathIds.length - 1; index += 1) {
    const fromBooth = booths.find((booth) => booth.id === pathIds[index]);
    const toBooth = booths.find((booth) => booth.id === pathIds[index + 1]);
    if (!fromBooth || !toBooth) continue;

    const fromX = fromBooth.x + (fromBooth.w * PX_PER_METER * fromBooth.scaleX) / 2;
    const fromY = fromBooth.y + (fromBooth.h * PX_PER_METER * fromBooth.scaleY) / 2;
    const toX = toBooth.x + (toBooth.w * PX_PER_METER * toBooth.scaleX) / 2;
    const toY = toBooth.y + (toBooth.h * PX_PER_METER * toBooth.scaleY) / 2;

    arrows.push(
      <Arrow
        key={`route-arrow-${index}`}
        points={[fromX, fromY, toX, toY]}
        stroke={COLORS.accent}
        strokeWidth={3}
        fill={COLORS.accent}
        pointerLength={10}
        pointerWidth={10}
        listening={false}
      />
    );
  }

  return <>{arrows}</>;
}
