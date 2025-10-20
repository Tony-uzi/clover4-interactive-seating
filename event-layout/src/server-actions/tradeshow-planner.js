/**
 * Tradeshow Planner API
 * 展会规划器后端API调用封装
 * 
 * 包括：展会事件、展位、展商、展位分配、参观路线
 */

// ==================== 辅助函数 ====================

/**
 * 从LocalStorage获取JWT Token
 * @returns {string} Token字符串
 */
function getAuthToken() {
  return localStorage.getItem('token') || '';
}

/**
 * 构建请求头（包含Token认证）
 * @returns {object} Headers对象
 */
function authHeaders() {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// ==================== 展会事件 API ====================

/**
 * 获取当前用户的所有展会事件
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getAllEvents() {
  try {
    const response = await fetch('/api/tradeshow/events/', {
      method: 'GET',
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '获取展会列表失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 获取单个展会事件详情
 * @param {string} eventId - 展会ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getEvent(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/`, {
      method: 'GET',
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '获取展会详情失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建新的展会事件
 * @param {object} eventData - 展会数据 { name, description, event_date_start, event_date_end, hall_width, hall_height, preset_layout }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createEvent(eventData) {
  try {
    const response = await fetch('/api/tradeshow/events/', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(eventData)
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '创建展会失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新展会事件
 * @param {string} eventId - 展会ID
 * @param {object} updates - 要更新的字段
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateEvent(eventId, updates) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '更新展会失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 删除展会事件
 * @param {string} eventId - 展会ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteEvent(eventId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.detail || '删除展会失败' };
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== 展位 API ====================

/**
 * 批量创建展位
 * @param {string} eventId - 展会ID
 * @param {array} booths - 展位数组
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function batchCreateBooths(eventId, booths) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/booths/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ booths })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '批量创建展位失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建单个展位
 * @param {object} boothData - 展位数据 { event, booth_type, category, label, position_x, position_y, width, height, ... }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createBooth(boothData) {
  try {
    // 注意：如果后端有单个创建展位的端点，使用它；否则使用批量创建
    const response = await fetch(`/api/tradeshow/events/${boothData.event}/booths/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ booths: [boothData] })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '创建展位失败' };
    }

    return { success: true, data: data.booths?.[0] || data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 注意：后端未提供单个展位的更新/删除端点
 * 需要通过重新批量创建来更新展位布局
 */

// 以下函数暂不可用，后端未注册 booths ViewSet
// export async function updateBooth(boothId, updates) { ... }
// export async function deleteBooth(boothId) { ... }

// ==================== 展商 API ====================

/**
 * 批量导入展商
 * @param {string} eventId - 展会ID
 * @param {array} vendors - 展商数组
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function batchImportVendors(eventId, vendors) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/vendors_import/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ vendors })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '批量导入展商失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建单个展商
 * @param {object} vendorData - 展商数据 { event, company_name, contact_name, contact_email, contact_phone, category, ... }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createVendor(vendorData) {
  try {
    const response = await fetch(`/api/tradeshow/events/${vendorData.event}/vendors_import/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ vendors: [vendorData] })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '创建展商失败' };
    }

    return { success: true, data: data.vendors?.[0] || data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 注意：后端未提供单个展商的更新/删除端点
 * 需要通过重新批量导入来更新展商信息
 */

// 以下函数暂不可用，后端未注册 vendors ViewSet
// export async function updateVendor(vendorId, updates) { ... }
// export async function deleteVendor(vendorId) { ... }
// export async function getAllVendors(eventId) { ... }

// ==================== 展位分配 API ====================

/**
 * 创建展位分配
 * @param {string} eventId - 展会ID
 * @param {object} assignmentData - 分配数据 { booth, vendor }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createBoothAssignment(eventId, assignmentData) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/assignments/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(assignmentData)
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '创建展位分配失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 注意：后端未提供单个分配的删除/查询端点
 * 只能通过事件创建新分配
 */

// 以下函数暂不可用，后端未注册 assignments ViewSet
// export async function deleteBoothAssignment(assignmentId) { ... }
// export async function getAllAssignments(eventId) { ... }

// ==================== 参观路线 API ====================

/**
 * 创建参观路线
 * @param {string} eventId - 展会ID
 * @param {object} routeData - 路线数据 { name, route_type, booth_order }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createRoute(eventId, routeData) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/routes/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(routeData)
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '创建参观路线失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 注意：后端未提供单个路线的更新/删除/查询端点
 * 只能通过事件创建新路线
 */

// 以下函数暂不可用，后端未注册 routes ViewSet
// export async function updateRoute(routeId, updates) { ... }
// export async function deleteRoute(routeId) { ... }
// export async function getAllRoutes(eventId) { ... }

// ==================== 预设布局 API ====================

/**
 * 应用预设布局
 * @param {string} eventId - 展会ID
 * @param {string} presetId - 预设布局ID (如 'standard', 'compact', 'premium')
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function applyPresetLayout(eventId, presetId) {
  try {
    const response = await fetch(`/api/tradeshow/events/${eventId}/presets/apply/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ preset_id: presetId })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '应用预设布局失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== 分享 API ====================

/**
 * 注意：后端未提供生成分享Token的端点
 * TradeshowEventViewSet 没有 share action
 */

// 以下函数暂不可用，后端未实现
// export async function generateShareToken(eventId) { ... }

/**
 * 通过分享Token获取展会（只读）
 * @param {string} shareToken - 分享Token
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getEventByShareToken(shareToken) {
  try {
    const response = await fetch(`/api/tradeshow/share/${shareToken}/`, {
      method: 'GET'
      // 注意：这个API不需要认证
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || '获取分享展会失败' };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
