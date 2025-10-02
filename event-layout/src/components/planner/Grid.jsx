import React from 'react';
import { Line } from 'react-konva';
import { GRID_SIZE_PX } from './utils';

export default function Grid({ width, height, visible, gridSize = GRID_SIZE_PX }) {
  if (!visible) return null;

  const lines = [];
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, height]}
        stroke="#e5e7eb"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h${y}`}
        points={[0, y, width, y]}
        stroke="#e5e7eb"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
