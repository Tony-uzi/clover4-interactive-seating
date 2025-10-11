// Canvas shape definitions and configurations

// Conference element types
export const CONFERENCE_ELEMENTS = {
  // Tables
  TABLE_ROUND: {
    type: 'table_round',
    name: 'Round Table',
    icon: '⭕',
    defaultWidth: 1.8,
    defaultHeight: 1.8,
    defaultSeats: 8,
    color: '#E8F4FD',
    stroke: '#2196F3',
  },
  TABLE_RECT: {
    type: 'table_rect',
    name: 'Rectangle Table',
    icon: '▭',
    defaultWidth: 2.4,
    defaultHeight: 1.2,
    defaultSeats: 6,
    color: '#FFF3E0',
    stroke: '#FF9800',
  },
  TABLE_SQUARE: {
    type: 'table_square',
    name: 'Square Table',
    icon: '▢',
    defaultWidth: 1.5,
    defaultHeight: 1.5,
    defaultSeats: 4,
    color: '#F3E5F5',
    stroke: '#9C27B0',
  },
  CHAIR: {
    type: 'chair',
    name: 'Chair',
    icon: '💺',
    defaultWidth: 0.6,
    defaultHeight: 0.6,
    defaultSeats: 1,
    color: '#E3F2FD',
    stroke: '#1976D2',
  },
  // Decorations
  STAGE: {
    type: 'stage',
    name: 'Stage',
    icon: '🎭',
    defaultWidth: 4,
    defaultHeight: 2,
    color: '#FFEBEE',
    stroke: '#F44336',
  },
  PODIUM: {
    type: 'podium',
    name: 'Podium',
    icon: '🎤',
    defaultWidth: 1.5,
    defaultHeight: 1,
    color: '#E8EAF6',
    stroke: '#3F51B5',
  },
  DOOR1: {
    type: 'door1',
    name: 'Door (Style 1)',
    icon: '🚪',
    defaultWidth: 1.2,
    defaultHeight: 0.8,
    image: '/door1.jpg',
    color: '#E0F2F1',
    stroke: '#009688',
  },
  DOOR2: {
    type: 'door2',
    name: 'Door (Style 2)',
    icon: '🚪',
    defaultWidth: 1.2,
    defaultHeight: 0.8,
    image: '/door2.jpg',
    color: '#E0F2F1',
    stroke: '#009688',
  },
  POWER_OUTLET: {
    type: 'power_outlet',
    name: 'Power Outlet',
    icon: '🔌',
    defaultWidth: 0.3,
    defaultHeight: 0.3,
    image: '/plugin.jpg',
    color: '#FFF9C4',
    stroke: '#F57C00',
  },
  WINDOW: {
    type: 'window',
    name: 'Window',
    icon: '🪟',
    defaultWidth: 2,
    defaultHeight: 0.3,
    color: '#E1F5FE',
    stroke: '#03A9F4',
  },
  TACTILE_PAVING: {
    type: 'tactile_paving',
    name: 'Tactile Paving',
    icon: '🦯',
    defaultWidth: 1,
    defaultHeight: 5,
    color: '#FFF9C4',
    stroke: '#F9A825',
    pattern: 'dots', // Special pattern for tactile paving
  },
  CUSTOM: {
    type: 'custom',
    name: 'Custom Element',
    icon: '✨',
    defaultWidth: 2,
    defaultHeight: 2,
    color: '#F5F5F5',
    stroke: '#757575',
  },
};

// Tradeshow booth types
export const TRADESHOW_BOOTHS = {
  STANDARD: {
    type: 'booth_standard',
    name: 'Standard Booth',
    icon: '📦',
    defaultWidth: 3,
    defaultHeight: 3,
    color: '#E8F5E9',
    stroke: '#4CAF50',
  },
  LARGE: {
    type: 'booth_large',
    name: 'Large Booth',
    icon: '📦📦',
    defaultWidth: 6,
    defaultHeight: 3,
    color: '#FFF9C4',
    stroke: '#FBC02D',
  },
  ISLAND: {
    type: 'booth_island',
    name: 'Island Booth',
    icon: '🏝️',
    defaultWidth: 6,
    defaultHeight: 6,
    color: '#FCE4EC',
    stroke: '#E91E63',
  },
  AISLE: {
    type: 'aisle',
    name: 'Aisle',
    icon: '➡️',
    defaultWidth: 2,
    defaultHeight: 10,
    color: '#FAFAFA',
    stroke: '#9E9E9E',
  },
  TACTILE_PAVING: {
    type: 'tactile_paving',
    name: 'Tactile Paving',
    icon: '🦯',
    defaultWidth: 1,
    defaultHeight: 10,
    color: '#FFF9C4',
    stroke: '#F9A825',
    pattern: 'dots', // Special pattern for tactile paving
  },
  DOOR1: {
    type: 'door1',
    name: 'Door (Style 1)',
    icon: '🚪',
    defaultWidth: 1.2,
    defaultHeight: 0.8,
    image: '/door1.jpg',
    color: '#E0F2F1',
    stroke: '#009688',
  },
  DOOR2: {
    type: 'door2',
    name: 'Door (Style 2)',
    icon: '🚪',
    defaultWidth: 1.2,
    defaultHeight: 0.8,
    image: '/door2.jpg',
    color: '#E0F2F1',
    stroke: '#009688',
  },
  POWER_OUTLET: {
    type: 'power_outlet',
    name: 'Power Outlet',
    icon: '🔌',
    defaultWidth: 0.3,
    defaultHeight: 0.3,
    image: '/plugin.jpg',
    color: '#FFF9C4',
    stroke: '#F57C00',
  },
};

// Get element config by type
export function getElementConfig(type) {
  // Check conference elements
  for (const key in CONFERENCE_ELEMENTS) {
    if (CONFERENCE_ELEMENTS[key].type === type) {
      return CONFERENCE_ELEMENTS[key];
    }
  }
  // Check tradeshow booths
  for (const key in TRADESHOW_BOOTHS) {
    if (TRADESHOW_BOOTHS[key].type === type) {
      return TRADESHOW_BOOTHS[key];
    }
  }
  return null;
}

// Create a new element with default properties
export function createElement(type, x = 0, y = 0, options = {}) {
  const config = getElementConfig(type);
  if (!config) return null;

  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    x,
    y,
    width: options.width || config.defaultWidth,
    height: options.height || config.defaultHeight,
    rotation: options.rotation || 0,
    label: options.label || '',
    seats: config.defaultSeats || 0,
    ...options,
  };
}

// Calculate seat positions for tables
export function calculateSeatPositions(element, pixelsPerMeter = 40) {
  const { type, x, y, width, height, seats, rotation = 0 } = element;
  const positions = [];

  if (!seats || seats === 0) return positions;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  if (type === 'table_round') {
    // Circular arrangement
    const radius = (width / 2) * pixelsPerMeter;
    for (let i = 0; i < seats; i++) {
      const angle = (i / seats) * 2 * Math.PI - Math.PI / 2;
      positions.push({
        x: centerX * pixelsPerMeter + radius * Math.cos(angle),
        y: centerY * pixelsPerMeter + radius * Math.sin(angle),
        angle: angle + Math.PI / 2,
      });
    }
  } else if (type === 'table_rect' || type === 'table_square') {
    // Rectangular arrangement
    const w = width * pixelsPerMeter;
    const h = height * pixelsPerMeter;
    const baseX = x * pixelsPerMeter;
    const baseY = y * pixelsPerMeter;

    const seatsPerSide = Math.ceil(seats / 2);
    const spacing = w / (seatsPerSide + 1);

    // Top side
    for (let i = 0; i < Math.floor(seats / 2); i++) {
      positions.push({
        x: baseX + spacing * (i + 1),
        y: baseY - 15,
        angle: 0,
      });
    }

    // Bottom side
    for (let i = 0; i < Math.ceil(seats / 2); i++) {
      positions.push({
        x: baseX + spacing * (i + 1),
        y: baseY + h + 15,
        angle: Math.PI,
      });
    }
  }

  return positions;
}

// Check if point is inside element bounds
export function isPointInElement(point, element) {
  const { x, y } = point;
  const { x: ex, y: ey, width, height } = element;
  return x >= ex && x <= ex + width && y >= ey && y <= ey + height;
}

// Snap to grid
export function snapToGrid(value, gridSize = 0.2) {
  return Math.round(value / gridSize) * gridSize;
}

// Check collision between two elements
export function checkCollision(element1, element2) {
  return !(
    element1.x + element1.width < element2.x ||
    element1.x > element2.x + element2.width ||
    element1.y + element1.height < element2.y ||
    element1.y > element2.y + element2.height
  );
}
