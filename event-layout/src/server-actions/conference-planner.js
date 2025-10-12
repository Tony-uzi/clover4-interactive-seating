// Conference Planner API Actions with Fake Data
// TODO: Replace fake data with real API calls when backend is ready

// Fake data for development
const FAKE_GUESTS = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    group: 'VIP',
    dietaryPreference: 'Vegetarian',
    attendance: true,
    notes: 'Allergic to peanuts',
    tableNumber: 1,
    seatNumber: 1
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    group: 'General',
    dietaryPreference: 'None',
    attendance: true,
    notes: '',
    tableNumber: 1,
    seatNumber: 2
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    group: 'VIP',
    dietaryPreference: 'Vegan',
    attendance: false,
    notes: 'Late arrival expected',
    tableNumber: 2,
    seatNumber: 1
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    group: 'Staff',
    dietaryPreference: 'Halal',
    attendance: true,
    notes: '',
    tableNumber: 2,
    seatNumber: 2
  }
];

const FAKE_EVENT = {
  id: 1,
  name: 'Annual Conference 2025',
  description: 'Company annual conference',
  date: '2025-12-15',
  roomWidth: 24,
  roomHeight: 16,
  shareToken: 'fake-share-token-123'
};

const FAKE_ELEMENTS = [
  {
    id: 1,
    type: 'table_round',
    x: 5,
    y: 5,
    width: 1.8,
    height: 1.8,
    rotation: 0,
    seats: 8,
    label: 'Table 1'
  },
  {
    id: 2,
    type: 'table_rect',
    x: 10,
    y: 5,
    width: 1.8,
    height: 0.8,
    rotation: 0,
    seats: 6,
    label: 'Table 2'
  }
];

// Simulated delay for API calls
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all guests for an event
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} List of guests
 */
export async function getAllGuests(eventId) {
  await delay();
  console.log('Fetching guests for event:', eventId);
  return { success: true, data: FAKE_GUESTS };
}

/**
 * Get a single guest by ID
 * @param {number} guestId - Guest ID
 * @returns {Promise<Object>} Guest details
 */
export async function getGuest(guestId) {
  await delay();
  const guest = FAKE_GUESTS.find(g => g.id === guestId);
  return { success: !!guest, data: guest };
}

/**
 * Create a new guest
 * @param {Object} guestData - Guest information
 * @returns {Promise<Object>} Created guest
 */
export async function createGuest(guestData) {
  await delay();
  const newGuest = {
    id: Math.max(...FAKE_GUESTS.map(g => g.id), 0) + 1,
    ...guestData,
    attendance: guestData.attendance ?? true
  };
  FAKE_GUESTS.push(newGuest);
  return { success: true, data: newGuest };
}

/**
 * Update an existing guest
 * @param {number} guestId - Guest ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} Updated guest
 */
export async function updateGuest(guestId, updates) {
  await delay();
  const index = FAKE_GUESTS.findIndex(g => g.id === guestId);
  if (index !== -1) {
    FAKE_GUESTS[index] = { ...FAKE_GUESTS[index], ...updates };
    return { success: true, data: FAKE_GUESTS[index] };
  }
  return { success: false, error: 'Guest not found' };
}

/**
 * Delete a guest
 * @param {number} guestId - Guest ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteGuest(guestId) {
  await delay();
  const index = FAKE_GUESTS.findIndex(g => g.id === guestId);
  if (index !== -1) {
    FAKE_GUESTS.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: 'Guest not found' };
}

/**
 * Get all elements (tables, chairs, etc.) for an event
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} List of elements
 */
export async function getElements(eventId) {
  await delay();
  console.log('Fetching elements for event:', eventId);
  return { success: true, data: FAKE_ELEMENTS };
}

/**
 * Save layout (elements and their positions)
 * @param {number} eventId - Event ID
 * @param {Array} elements - Array of element data
 * @returns {Promise<Object>} Success status
 */
export async function saveLayout(eventId, elements) {
  await delay();
  console.log('Saving layout for event:', eventId, elements);
  // In real implementation, this would send to backend
  // For now, save to localStorage
  localStorage.setItem(`conference-layout-${eventId}`, JSON.stringify(elements));
  return { success: true, data: { saved: elements.length } };
}

/**
 * Load saved layout from storage
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} Saved elements
 */
export async function loadLayout(eventId) {
  await delay();
  const saved = localStorage.getItem(`conference-layout-${eventId}`);
  if (saved) {
    return { success: true, data: JSON.parse(saved) };
  }
  return { success: false, data: [] };
}

/**
 * Get event details
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event details
 */
export async function getEvent(eventId) {
  await delay();
  return { success: true, data: FAKE_EVENT };
}

/**
 * Update event details
 * @param {number} eventId - Event ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} Updated event
 */
export async function updateEvent(eventId, updates) {
  await delay();
  const updatedEvent = { ...FAKE_EVENT, ...updates };
  return { success: true, data: updatedEvent };
}

/**
 * Assign guest to seat
 * @param {number} guestId - Guest ID
 * @param {number} tableNumber - Table number
 * @param {number} seatNumber - Seat number
 * @returns {Promise<Object>} Success status
 */
export async function assignGuestToSeat(guestId, tableNumber, seatNumber) {
  await delay();
  return updateGuest(guestId, { tableNumber, seatNumber });
}

/**
 * Bulk import guests from CSV data
 * @param {number} eventId - Event ID
 * @param {Array} guestsData - Array of guest objects
 * @returns {Promise<Object>} Import result
 */
export async function bulkImportGuests(eventId, guestsData) {
  await delay();
  const imported = [];
  for (const guestData of guestsData) {
    const result = await createGuest(guestData);
    if (result.success) {
      imported.push(result.data);
    }
  }
  return { success: true, data: { imported: imported.length, guests: imported } };
}

/**
 * Export guests with filters
 * @param {number} eventId - Event ID
 * @param {Object} filters - Filter criteria (e.g., {dietaryPreference: 'Vegan', group: 'VIP'})
 * @returns {Promise<Array>} Filtered guests
 */
export async function exportGuestsFiltered(eventId, filters = {}) {
  await delay();
  let filtered = [...FAKE_GUESTS];

  if (filters.dietaryPreference) {
    filtered = filtered.filter(g => g.dietaryPreference === filters.dietaryPreference);
  }

  if (filters.group) {
    filtered = filtered.filter(g => g.group === filters.group);
  }

  if (filters.attendance !== undefined) {
    filtered = filtered.filter(g => g.attendance === filters.attendance);
  }

  return { success: true, data: filtered };
}

/**
 * Generate share token for event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Share token
 */
export async function generateShareToken(eventId) {
  await delay();
  const token = `share-${eventId}-${Date.now()}`;
  return { success: true, data: { shareToken: token } };
}
