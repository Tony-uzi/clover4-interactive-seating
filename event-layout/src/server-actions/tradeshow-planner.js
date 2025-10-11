// Tradeshow Planner API Actions with Fake Data
// TODO: Replace fake data with real API calls when backend is ready

// Fake data for development
const FAKE_VENDORS = [
  {
    id: 1,
    name: 'Tech Solutions Inc',
    contactName: 'John Doe',
    email: 'john@techsolutions.com',
    phone: '+1-555-0100',
    boothNumber: 'A101',
    category: 'Technology',
    notes: 'Premium sponsor'
  },
  {
    id: 2,
    name: 'Green Energy Co',
    contactName: 'Jane Smith',
    email: 'jane@greenenergy.com',
    phone: '+1-555-0200',
    boothNumber: 'B205',
    category: 'Energy',
    notes: ''
  },
  {
    id: 3,
    name: 'Innovation Labs',
    contactName: 'Mike Johnson',
    email: 'mike@innovationlabs.com',
    phone: '+1-555-0300',
    boothNumber: 'C301',
    category: 'Research',
    notes: 'Island booth required'
  }
];

const FAKE_EVENT = {
  id: 1,
  name: 'Tech Expo 2025',
  description: 'Annual technology trade show',
  date: '2025-12-20',
  hallWidth: 40,
  hallHeight: 30,
  shareToken: 'fake-tradeshow-token-456'
};

const FAKE_BOOTHS = [
  {
    id: 1,
    type: 'booth_standard',
    x: 3,
    y: 3,
    width: 3,
    height: 3,
    rotation: 0,
    label: 'A101',
    vendorId: 1
  },
  {
    id: 2,
    type: 'booth_large',
    x: 8,
    y: 3,
    width: 6,
    height: 3,
    rotation: 0,
    label: 'B205',
    vendorId: 2
  },
  {
    id: 3,
    type: 'booth_island',
    x: 16,
    y: 8,
    width: 6,
    height: 6,
    rotation: 0,
    label: 'C301',
    vendorId: 3
  }
];

const FAKE_ROUTES = [
  {
    id: 1,
    name: 'Main Route',
    description: 'Primary visitor path through hall',
    boothOrder: [1, 2, 3],
    color: '#3B82F6'
  },
  {
    id: 2,
    name: 'VIP Route',
    description: 'Premium sponsor route',
    boothOrder: [3, 1],
    color: '#EF4444'
  }
];

// Simulated delay for API calls
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all vendors for an event
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} List of vendors
 */
export async function getAllVendors(eventId) {
  await delay();
  console.log('Fetching vendors for event:', eventId);
  return { success: true, data: FAKE_VENDORS };
}

/**
 * Get a single vendor by ID
 * @param {number} vendorId - Vendor ID
 * @returns {Promise<Object>} Vendor details
 */
export async function getVendor(vendorId) {
  await delay();
  const vendor = FAKE_VENDORS.find(v => v.id === vendorId);
  return { success: !!vendor, data: vendor };
}

/**
 * Create a new vendor
 * @param {Object} vendorData - Vendor information
 * @returns {Promise<Object>} Created vendor
 */
export async function createVendor(vendorData) {
  await delay();
  const newVendor = {
    id: Math.max(...FAKE_VENDORS.map(v => v.id), 0) + 1,
    ...vendorData
  };
  FAKE_VENDORS.push(newVendor);
  return { success: true, data: newVendor };
}

/**
 * Update an existing vendor
 * @param {number} vendorId - Vendor ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} Updated vendor
 */
export async function updateVendor(vendorId, updates) {
  await delay();
  const index = FAKE_VENDORS.findIndex(v => v.id === vendorId);
  if (index !== -1) {
    FAKE_VENDORS[index] = { ...FAKE_VENDORS[index], ...updates };
    return { success: true, data: FAKE_VENDORS[index] };
  }
  return { success: false, error: 'Vendor not found' };
}

/**
 * Delete a vendor
 * @param {number} vendorId - Vendor ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteVendor(vendorId) {
  await delay();
  const index = FAKE_VENDORS.findIndex(v => v.id === vendorId);
  if (index !== -1) {
    FAKE_VENDORS.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: 'Vendor not found' };
}

/**
 * Get all booths for an event
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} List of booths
 */
export async function getBooths(eventId) {
  await delay();
  console.log('Fetching booths for event:', eventId);
  return { success: true, data: FAKE_BOOTHS };
}

/**
 * Save layout (booths and their positions)
 * @param {number} eventId - Event ID
 * @param {Array} booths - Array of booth data
 * @returns {Promise<Object>} Success status
 */
export async function saveLayout(eventId, booths) {
  await delay();
  console.log('Saving layout for event:', eventId, booths);
  // In real implementation, this would send to backend
  // For now, save to localStorage
  localStorage.setItem(`tradeshow-layout-${eventId}`, JSON.stringify(booths));
  return { success: true, data: { saved: booths.length } };
}

/**
 * Load saved layout from storage
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} Saved booths
 */
export async function loadLayout(eventId) {
  await delay();
  const saved = localStorage.getItem(`tradeshow-layout-${eventId}`);
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
 * Assign vendor to booth
 * @param {number} vendorId - Vendor ID
 * @param {string} boothNumber - Booth number
 * @returns {Promise<Object>} Success status
 */
export async function assignVendorToBooth(vendorId, boothNumber) {
  await delay();
  return updateVendor(vendorId, { boothNumber });
}

/**
 * Get all routes for an event
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} List of routes
 */
export async function getRoutes(eventId) {
  await delay();
  console.log('Fetching routes for event:', eventId);
  return { success: true, data: FAKE_ROUTES };
}

/**
 * Create a new route
 * @param {Object} routeData - Route information
 * @returns {Promise<Object>} Created route
 */
export async function createRoute(routeData) {
  await delay();
  const newRoute = {
    id: Math.max(...FAKE_ROUTES.map(r => r.id), 0) + 1,
    ...routeData,
    color: routeData.color || '#3B82F6'
  };
  FAKE_ROUTES.push(newRoute);
  return { success: true, data: newRoute };
}

/**
 * Update an existing route
 * @param {number} routeId - Route ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} Updated route
 */
export async function updateRoute(routeId, updates) {
  await delay();
  const index = FAKE_ROUTES.findIndex(r => r.id === routeId);
  if (index !== -1) {
    FAKE_ROUTES[index] = { ...FAKE_ROUTES[index], ...updates };
    return { success: true, data: FAKE_ROUTES[index] };
  }
  return { success: false, error: 'Route not found' };
}

/**
 * Delete a route
 * @param {number} routeId - Route ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteRoute(routeId) {
  await delay();
  const index = FAKE_ROUTES.findIndex(r => r.id === routeId);
  if (index !== -1) {
    FAKE_ROUTES.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: 'Route not found' };
}

/**
 * Apply preset layout to event
 * @param {number} eventId - Event ID
 * @param {string} presetId - Preset layout ID
 * @returns {Promise<Object>} Applied layout data
 */
export async function applyPresetLayout(eventId, presetId) {
  await delay();
  console.log('Applying preset layout:', presetId, 'to event:', eventId);
  // In real implementation, this would load preset from backend
  return { success: true, data: { presetId, applied: true } };
}

/**
 * Generate share token for event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Share token
 */
export async function generateShareToken(eventId) {
  await delay();
  const token = `share-tradeshow-${eventId}-${Date.now()}`;
  return { success: true, data: { shareToken: token } };
}
