// Tradeshow Planner API Actions - Connected to Real Backend
// Tradeshow planner - wired to the production backend

// ========================================
// Utility functions
// ========================================

function getAuthToken() {
  return localStorage.getItem('token') || '';
}

function authHeaders() {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Handle different error formats
    if (error.detail) {
      throw new Error(error.detail);
    } else if (error.error) {
      throw new Error(error.error);
    } else if (typeof error === 'object') {
      // Serializer validation errors
      const errorMessages = Object.entries(error)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          }
          return `${field}: ${messages}`;
        })
        .join('; ');
      throw new Error(errorMessages || `HTTP Error ${response.status}`);
    }
    throw new Error(`HTTP Error ${response.status}`);
  }
  return response.json();
}

// ========================================
// Tradeshow event API
// ========================================

/**
 * Get all tradeshow events
 */
export async function getAllEvents() {
  try {
    const response = await fetch('/api/tradeshow/events/', {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get events failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get event failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new tradeshow event
 */
export async function createEvent(eventData) {
  try {
    const response = await fetch('/api/tradeshow/events/', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: eventData.name,
        description: eventData.description || '',
        hall_width: eventData.hallWidth || eventData.hall_width || 40.0,
        hall_height: eventData.hallHeight || eventData.hall_height || 30.0,
        event_date_start: eventData.dateStart || eventData.event_date_start || new Date().toISOString(),
        event_date_end: eventData.dateEnd || eventData.event_date_end || new Date().toISOString(),
        is_public: eventData.isPublic || eventData.is_public || false
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Create event failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(eventId, updates) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        hall_width: updates.hallWidth || updates.hall_width,
        hall_height: updates.hallHeight || updates.hall_height,
        event_date_start: updates.dateStart || updates.event_date_start,
        event_date_end: updates.dateEnd || updates.event_date_end,
        is_public: updates.isPublic || updates.is_public
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Update event failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete event failed:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// Vendor management API
// ========================================

/**
 * Get all vendors for an event
 */
export async function getAllVendors(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/vendors/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get vendors failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get a single vendor by ID
 */
export async function getVendor(vendorId) {
  try {
    const response = await fetch(`/api/tradeshow/vendors/${vendorId}/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get vendor failed:', error);
    return { success: false, error: error.message };
  }
}

// Backward-compatible alias
export const getVendors = getAllVendors;

/**
 * Create a new vendor
 */
export async function createVendor(eventId, vendorData) {
  try {
    const response = await fetch('/api/tradeshow/vendors/', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        event: eventId || vendorData.eventId || vendorData.event,
        company_name: vendorData.name || vendorData.company_name,
        contact_name: vendorData.contactName || vendorData.contact_name || '',
        contact_email: vendorData.email || vendorData.contact_email || '',
        contact_phone: vendorData.phone || vendorData.contact_phone || '',
        category: vendorData.category || '',
        booth_preference: vendorData.boothPreference || vendorData.booth_preference || '',
        notes: vendorData.notes || ''
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Create vendor failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing vendor
 */
export async function updateVendor(vendorId, updates) {
  try {
    const response = await fetch(`/api/tradeshow/vendors/${vendorId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        company_name: updates.name || updates.company_name,
        contact_name: updates.contactName || updates.contact_name,
        contact_email: updates.email || updates.contact_email,
        contact_phone: updates.phone || updates.contact_phone,
        category: updates.category,
        booth_preference: updates.boothPreference || updates.booth_preference,
        notes: updates.notes
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Update vendor failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Authenticated kiosk/staff vendor check-in
 */
export async function checkInVendor(eventId, vendorId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/vendors/${vendorId}/checkin/`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.detail || data.error || data.message || `HTTP Error ${response.status}`;
      return { success: false, error: message, status: response.status, data };
    }
    return { success: true, data, status: response.status };
  } catch (error) {
    console.error('Vendor check-in failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Public kiosk vendor check-in (no auth required)
 */
export async function publicVendorCheckIn(eventId, vendorId) {
  try {
    const response = await fetch(`/api/qr/tradeshow/${eventId}/vendor/${vendorId}/checkin/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.detail || data.error || data.message || `HTTP Error ${response.status}`;
      return { success: false, error: message, data };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Public vendor check-in failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a vendor
 */
export async function deleteVendor(vendorId) {
  try {
    const response = await fetch(`/api/tradeshow/vendors/${vendorId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete vendor failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk import vendors from CSV
 */
export async function bulkImportVendors(eventId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`/api/tradeshow/events/${eventId}/vendors/import/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Bulk import vendors failed:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// Booth management API
// ========================================

/**
 * Get all booths for an event
 */
export async function getBooths(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/booths/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get booths failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Save layout (booths and their positions)
 */
export async function saveLayout(eventId, booths) {
  try {
    // Map frontend booth types to backend types
    const mapBoothType = (type) => {
      // Backend supports most types directly now, only booth_island needs mapping
      const typeMap = {
        'booth_island': 'booth_island',  // Backend now supports booth_island
      };
      return typeMap[type] || type;  // Pass through all other types (door1, door2, power_outlet, etc.)
    };

    // Map frontend booth types to backend categories
    const mapCategory = (type) => {
      // Backend only accepts: 'booth', 'facility', 'structure'
      const categoryMap = {
        'booth_standard': 'booth',
        'booth_large': 'booth',
        'booth_premium': 'booth',
        'booth_island': 'booth',
        'aisle': 'facility',
        'tactile_paving': 'facility',
        'waiting_area': 'facility',
        'restroom': 'facility',
        'info_desk': 'facility',
        'door1': 'facility',  // Doors are facilities
        'door2': 'facility',
        'power_outlet': 'facility',  // Outlets are facilities
        'structure': 'structure',
      };
      return categoryMap[type] || 'booth';
    };

    // Round to 2 decimal places
    const roundTo2 = (num) => {
      if (num === undefined || num === null) return 0;
      return Math.round(num * 100) / 100;
    };

    // Generate default label based on booth type
    const generateLabel = (type, index) => {
      const typeLabels = {
        'booth_standard': 'Booth',
        'booth_large': 'Large Booth',
        'booth_premium': 'Premium Booth',
        'booth_island': 'Premium Booth',
        'aisle': 'Aisle',
        'tactile_paving': 'Tactile Paving',
        'waiting_area': 'Waiting Area',
        'restroom': 'Restroom',
        'info_desk': 'Info Desk',
      };
      const baseLabel = typeLabels[type] || 'Booth';
      return `${baseLabel} ${index + 1}`;
    };

    const response = await fetch(`/api/tradeshow/events/${eventId}/booths/bulk/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        booths: booths.map((b, index) => {
          const originalType = b.type || b.booth_type;
          const mapped = {
            event: eventId,
            booth_type: mapBoothType(originalType),
            category: mapCategory(originalType),  // Use mapCategory based on original type
            label: b.label || generateLabel(originalType, index),
            position_x: roundTo2(b.x !== undefined ? b.x : b.position_x),
            position_y: roundTo2(b.y !== undefined ? b.y : b.position_y),
            width: roundTo2(b.width),
            height: roundTo2(b.height),
            rotation: roundTo2(b.rotation || 0)
          };
          // Include ID if it exists and looks like a valid UUID
          if (b.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id)) {
            mapped.id = b.id;
          }
          return mapped;
        })
      })
    });
    const data = await handleResponse(response);
    return { 
      success: true, 
      data: { booths: data, saved: data?.length || 0 }
    };
  } catch (error) {
    console.error('Save layout failed:', error);
    return { success: false, error: error.message, data: { saved: 0 } };
  }
}

/**
 * Load saved layout from storage
 */
export async function loadLayout(eventId) {
  return getBooths(eventId);
}

// ========================================
// Booth assignment API
// ========================================

/**
 * Assign vendor to booth
 */
export async function assignVendorToBooth(vendorId, boothNumber) {
  try {
    return await updateVendor(vendorId, { 
      boothNumber 
    });
  } catch (error) {
    console.error('Assign vendor to booth failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a booth assignment
 */
export async function createBoothAssignment(eventId, { vendorId, boothId }) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/booth-assignments/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        event: eventId,
        vendor: vendorId,
        booth: boothId
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Create booth assignment failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a booth assignment
 */
export async function deleteBoothAssignment(eventId, assignmentId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/booth-assignments/${assignmentId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete booth assignment failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get booth assignments for an event
 */
export async function getBoothAssignments(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/booth-assignments/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get booth assignments failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// ========================================
// Route management API
// ========================================

/**
 * Get all routes for an event
 */
export async function getRoutes(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/routes/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get routes failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Create a new route
 */
export async function createRoute(routeData) {
  try {
    const eventId = routeData.eventId || routeData.event;
    const response = await fetch(`/api/tradeshow/events/${eventId}/routes/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: routeData.name,
        description: routeData.description || '',
        route_type: routeData.routeType || routeData.route_type || 'custom',
        booth_order: routeData.boothOrder || routeData.booth_order || [],
        color: routeData.color || '#3B82F6'
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Create route failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing route
 */
export async function updateRoute(eventId, routeId, updates) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/routes/${routeId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        booth_order: updates.boothOrder || updates.booth_order,
        color: updates.color
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Update route failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a route
 */
export async function deleteRoute(eventId, routeId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/routes/${routeId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete route failed:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// Preset and sharing API
// ========================================

/**
 * Apply preset layout to event
 */
export async function applyPresetLayout(eventId, presetId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/apply_preset/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ preset_id: presetId })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Apply preset layout failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate share token for event
 */
export async function generateShareToken(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/share/`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { 
      success: true, 
      data: { shareToken: data.share_token || data.token }
    };
  } catch (error) {
    console.error('Generate share token failed:', error);
    return { success: false, error: error.message };
  }
}
