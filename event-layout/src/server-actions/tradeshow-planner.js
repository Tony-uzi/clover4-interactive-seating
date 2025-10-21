// Tradeshow Planner API Actions - Connected to Real Backend
// 展会规划器 - 已连接真实后端

// ========================================
// 工具函数
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
    throw new Error(error.detail || `HTTP Error ${response.status}`);
  }
  return response.json();
}

// ========================================
// 展会事件 API
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
// 展商管理 API
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
export async function createVendor(vendorData) {
  try {
    const response = await fetch('/api/tradeshow/vendors/', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        event: vendorData.eventId || vendorData.event,
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
export async function bulkImportVendors(eventId, vendorsData) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/vendors_import/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        vendors: vendorsData.map(v => ({
          company_name: v.name || v.company_name,
          contact_name: v.contactName || v.contact_name || '',
          contact_email: v.email || v.contact_email || '',
          contact_phone: v.phone || v.contact_phone || '',
          category: v.category || '',
          booth_preference: v.boothPreference || v.booth_preference || '',
          notes: v.notes || ''
        }))
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Bulk import vendors failed:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// 展位管理 API
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
    const response = await fetch(`/api/tradeshow/events/${eventId}/booths/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        booths: booths.map(b => ({
          booth_type: b.type || b.booth_type,
          category: b.category || 'booth',
          label: b.label || '',
          position_x: b.x !== undefined ? b.x : b.position_x,
          position_y: b.y !== undefined ? b.y : b.position_y,
          width: b.width,
          height: b.height,
          rotation: b.rotation || 0
        }))
      })
    });
    const data = await handleResponse(response);
    return { 
      success: true, 
      data: { saved: data.booths?.length || 0 }
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
// 展位分配 API
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
 * Get booth assignments for an event
 */
export async function getBoothAssignments(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/assignments/`, {
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
// 路线管理 API
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
export async function updateRoute(routeId, updates) {
  try {
    const response = await fetch(`/api/tradeshow/routes/${routeId}/`, {
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
export async function deleteRoute(routeId) {
  try {
    const response = await fetch(`/api/tradeshow/routes/${routeId}/`, {
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
// 预设和分享功能 API
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
