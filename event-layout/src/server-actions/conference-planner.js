// Conference Planner API Actions - Connected to Real Backend
// 会议规划器 - 已连接后端



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
// 事件管理 API
// ========================================

/**
 * Get all conference events
 */
export async function getAllEvents() {
  try {
    const response = await fetch('/api/conference/events/', {
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
    const response = await fetch(`/api/conference/events/${eventId}/`, {
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
 * Create a new conference event
 */
export async function createEvent(eventData) {
  try {
    const response = await fetch('/api/conference/events/', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: eventData.name,
        description: eventData.description || '',
        room_width: eventData.roomWidth || eventData.room_width || 24.0,
        room_height: eventData.roomHeight || eventData.room_height || 16.0,
        event_date: eventData.eventDate || eventData.event_date || new Date().toISOString(),
        canvas_shape: eventData.canvasShape || eventData.canvas_shape || 'rectangle',
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
    const response = await fetch(`/api/conference/events/${eventId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        room_width: updates.roomWidth || updates.room_width,
        room_height: updates.roomHeight || updates.room_height,
        event_date: updates.eventDate || updates.event_date,
        canvas_shape: updates.canvasShape || updates.canvas_shape,
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
    const response = await fetch(`/api/conference/events/${eventId}/`, {
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
// 嘉宾管理 API
// ========================================

/**
 * Get all guests for an event
 */
export async function getAllGuests(eventId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/guests/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get guests failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// Backward-compatible alias
export const getGuests = getAllGuests;

/**
 * Get a single guest by ID
 */
export async function getGuest(guestId) {
  try {
    const response = await fetch(`/api/conference/guests/${guestId}/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get guest failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new guest
 */
export async function createGuest(eventId, guestData) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/guests/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: guestData.name,
        email: guestData.email || '',
        company: guestData.company || '',
        phone: guestData.phone || '',
        dietary_requirements: guestData.dietaryPreference || guestData.dietary_requirements || '',
        notes: guestData.notes || '',
        group: guestData.group || '',
        attendance: guestData.attendance !== undefined ? guestData.attendance : true
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Create guest failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing guest
 */
export async function updateGuest(guestId, updates) {
  try {
    const response = await fetch(`/api/conference/guests/${guestId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: updates.name,
        email: updates.email,
        company: updates.company,
        phone: updates.phone,
        dietary_requirements: updates.dietaryPreference || updates.dietary_requirements,
        notes: updates.notes,
        group: updates.group,
        attendance: updates.attendance,
        checked_in: updates.checked_in !== undefined ? updates.checked_in : updates.checkedIn
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Update guest failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Authenticated kiosk/staff guest check-in
 */
export async function checkInGuest(eventId, guestId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/guests/${guestId}/checkin/`, {
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
    console.error('Guest check-in failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Public kiosk guest check-in (no auth required)
 */
export async function publicGuestCheckIn(eventId, guestId) {
  try {
    const response = await fetch(`/api/qr/conference/${eventId}/guest/${guestId}/checkin/`, {
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
    console.error('Public guest check-in failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a guest
 */
export async function deleteGuest(guestId) {
  try {
    const response = await fetch(`/api/conference/guests/${guestId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete guest failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk import guests from CSV data
 */
export async function bulkImportGuests(eventId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`/api/conference/events/${eventId}/guests/import/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await handleResponse(response);
    return { 
      success: true, 
      data: {
        imported: data.imported_count || data.guests?.length || 0,
        guests: data.guests || []
      }
    };
  } catch (error) {
    console.error('Bulk import failed:', error);
    return { success: false, error: error.message, data: { imported: 0, guests: [] } };
  }
}

/**
 * Export guests with filters
 */
export async function exportGuestsFiltered(eventId, filters = {}) {
  try {
    const result = await getAllGuests(eventId);
    
    if (!result.success) {
      return result;
    }
    
    let filtered = result.data;
    
    // Apply filters
    if (filters.dietaryPreference) {
      filtered = filtered.filter(g => 
        g.dietary_requirements === filters.dietaryPreference
      );
    }
    
    if (filters.company) {
      filtered = filtered.filter(g => g.company === filters.company);
    }
    
    if (filters.group) {
      filtered = filtered.filter(g => g.group === filters.group);
    }
    
    if (filters.attendance !== undefined) {
      filtered = filtered.filter(g => g.attendance === filters.attendance);
    }
    
    return { success: true, data: filtered };
  } catch (error) {
    console.error('Export filtered guests failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// ========================================
// 元素管理 API
// ========================================

/**
 * Get all elements (tables, chairs, etc.) for an event
 */
export async function getElements(eventId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/elements/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get elements failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Save layout (elements and their positions)
 */
export async function saveLayout(eventId, elements) {
  try {
    // Map frontend element types to backend types
    const mapElementType = (type) => {
      const typeMap = {
        'table_rect': 'table_rectangle',
        'table_square': 'table_rectangle',
      };
      return typeMap[type] || type;
    };

    // Round to 2 decimal places
    const roundTo2 = (num) => {
      if (num === undefined || num === null) return 0;
      return Math.round(num * 100) / 100;
    };

    // Generate default label based on element type
    const generateLabel = (type, index) => {
      const typeLabels = {
        'chair': 'Chair',
        'table_round': 'Table',
        'table_rectangle': 'Table',
        'table_rect': 'Table',
        'table_square': 'Table',
        'podium': 'Podium',
        'door': 'Door',
        'outlet': 'Outlet',
      };
      const baseLabel = typeLabels[type] || 'Element';
      return `${baseLabel} ${index + 1}`;
    };

    const response = await fetch(`/api/conference/events/${eventId}/elements/bulk/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        elements: elements.map((el, index) => {
          const elementType = mapElementType(el.type || el.element_type);
          const mapped = {
            event: eventId,
            element_type: elementType,
            label: el.label || generateLabel(el.type || el.element_type, index),
            seats: el.seats || 0,
            position_x: roundTo2(el.x !== undefined ? el.x : el.position_x),
            position_y: roundTo2(el.y !== undefined ? el.y : el.position_y),
            width: roundTo2(el.width),
            height: roundTo2(el.height),
            rotation: roundTo2(el.rotation || 0),
            scale_x: roundTo2(el.scaleX || el.scale_x || 1.0),
            scale_y: roundTo2(el.scaleY || el.scale_y || 1.0)
          };
          // Include ID if it exists and looks like a valid UUID
          if (el.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(el.id)) {
            mapped.id = el.id;
          }
          return mapped;
        })
      })
    });
    const data = await handleResponse(response);
    return { 
      success: true, 
      data: { elements: data, saved: data?.length || 0 }
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
  return getElements(eventId);
}

// ========================================
// 座位分配 API
// ========================================

/**
 * Assign guest to seat
 */
export async function assignGuestToSeat(guestId, tableNumber, seatNumber) {
  try {
    // Note: Backend might have different API structure
    // Adjust according to actual backend implementation
    return await updateGuest(guestId, { 
      tableNumber, 
      seatNumber 
    });
  } catch (error) {
    console.error('Assign guest to seat failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a seat assignment
 */
export async function createSeatAssignment(eventId, { guestId, elementId, seatNumber = null }) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/seat-assignments/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        event: eventId,
        guest: guestId,
        element: elementId,
        seat_number: seatNumber
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Create seat assignment failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a seat assignment
 */
export async function deleteSeatAssignment(eventId, assignmentId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/seat-assignments/${assignmentId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete seat assignment failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get seat assignments for an event
 */
export async function getSeatAssignments(eventId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/seat-assignments/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get seat assignments failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// ========================================
// 分享功能 API
// ========================================

/**
 * Generate share token for event
 */
export async function generateShareToken(eventId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/share/`, {
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

// ========================================
// 会议日程/议程 API
// ========================================

/**
 * Get all sessions for an event
 */
export async function getSessions(eventId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/sessions/`, {
      headers: authHeaders()
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Get sessions failed:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Create a new session
 */
export async function createSession(sessionData) {
  try {
    const response = await fetch(`/api/conference/events/${sessionData.eventId}/sessions/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: sessionData.title,
        speaker: sessionData.speaker || '',
        speaker_title: sessionData.speakerTitle || sessionData.speaker_title || '',
        session_date: sessionData.sessionDate || sessionData.session_date,
        start_time: sessionData.startTime || sessionData.start_time,
        end_time: sessionData.endTime || sessionData.end_time,
        location: sessionData.location || '',
        description: sessionData.description || '',
        category: sessionData.category || 'other',
        capacity: sessionData.capacity || 0
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Create session failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing session
 */
export async function updateSession(sessionId, updates) {
  try {
    const response = await fetch(`/api/conference/sessions/${sessionId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        title: updates.title,
        speaker: updates.speaker,
        speaker_title: updates.speakerTitle || updates.speaker_title,
        session_date: updates.sessionDate || updates.session_date,
        start_time: updates.startTime || updates.start_time,
        end_time: updates.endTime || updates.end_time,
        location: updates.location,
        description: updates.description,
        category: updates.category,
        capacity: updates.capacity
      })
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('Update session failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId) {
  try {
    const response = await fetch(`/api/conference/sessions/${sessionId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete session failed:', error);
    return { success: false, error: error.message };
  }
}
