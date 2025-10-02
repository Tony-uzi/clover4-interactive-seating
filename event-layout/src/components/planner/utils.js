export const PX_PER_METER = 40;
export const GRID_SIZE_M = 0.5;
export const GRID_SIZE_PX = GRID_SIZE_M * PX_PER_METER;

export function mToPx(m) {
  return m * PX_PER_METER;
}

export function snapPx(v) {
  return Math.round(v / GRID_SIZE_PX) * GRID_SIZE_PX;
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}