export const CONFERENCE_CATALOG = [
  { key: 'round-table', label: 'Round Table', type: 'table_round', w: 1.8, h: 1.8, seats: 8 },
  { key: 'rect-table', label: 'Rect Table', type: 'table_rect', w: 1.8, h: 0.8, seats: 6 },
  { key: 'chair', label: 'Chair', type: 'chair', w: 0.5, h: 0.5, seats: 1 },
  { key: 'podium', label: 'Podium', type: 'podium', w: 0.7, h: 0.6, seats: 0 },
  { key: 'stage', label: 'Stage', type: 'stage', w: 4.0, h: 2.0, seats: 0 },
  { key: 'door', label: 'Door', type: 'door', w: 1.2, h: 0.3, seats: 0 },
  { key: 'window', label: 'Window', type: 'window', w: 2.4, h: 0.25, seats: 0 },
  { key: 'blind-path', label: 'Tactile Path', type: 'blind_path', w: 0.6, h: 4.0, seats: 0 }
];

export const DEFAULT_ROOM_DIMENSIONS = { width: 24, height: 16 };
