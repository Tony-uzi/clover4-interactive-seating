/**
 * Conference Planner API
 * 会议规划器后端API调用
 *
 * 包括：会议事件、布局元素、嘉宾、分组、座位分配
 */

// 从浏览器里拿到你的登录凭证（JWT Token），然后把它放进每次请求需要的请求头里，以便后端识别“你是谁、有没有权限

/**
 * 从LocalStorage获取JWT Token
 * @returns {string} Token字符串
 */
// 去 localStorage 取出键名为 token 的值（通常是登录后保存的 JWT）。如果没有取到，就返回空字符串 ''。
function getAuthToken() {
  return localStorage.getItem("token") || "";
}

/**
 * 构建请求头（包含Token认证）
 * @returns {object} Headers对象
 * 先拿到 token。如果没有 token，就返回一个只包含 Content-Type 的 headers 对象
 * 如果有 token，就返回一个包含 Authorization 和 Content-Type 的 headers 对象
 */
function authHeaders() {
  const token = getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ==================== 会议事件 API ====================

// fetch逻辑：Django 项目在 clover/urls.py 中把 /api/ 前缀映射到 api.urls，
// 而 api/urls.py 注册了 conference/events 等 ViewSet，因此请求最终落在 ConferenceEventViewSet 的列表接口上。
/**
 * 获取当前用户的所有会议事件
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getAllEvents() {
  try {
    // 发起 GET 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch("/api/conference/events/", {
      method: "GET",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to obtain the conference list"
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to obtain the conference list",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 [{id: 1, name: "会议1"}, {id: 2, name: "会议2"}]
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 获取单个会议事件详情
 * 当getAllEvents()获取到所有会议后，需要获取单个会议的详情，就需要用到getEvent()。每个会议都有自己的ID，比如 1, 2, 3。且唯一。
 * @param {string} eventId - 会议ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getEvent(eventId) {
  try {
    // 发起 GET 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(`/api/conference/events/${eventId}/`, {
      method: "GET",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to obtain meeting details"
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to obtain meeting details",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建新的会议事件
 * @param {object} eventData - 会议数据 { name, description, event_date, room_width, room_height }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createEvent(eventData) {
  try {
    // 发起 POST 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch("/api/conference/events/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(eventData),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to create conference"
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to create conference",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新会议事件
 * @param {string} eventId - 会议ID
 * @param {object} updates - 要更新的字段
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateEvent(eventId, updates) {
  try {
    // 发起 PUT 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(`/api/conference/events/${eventId}/`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Update meeting failed"
    if (!response.ok) {
      return { success: false, error: data.detail || "Update meeting failed" };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 删除会议事件
 * @param {string} eventId - 会议ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteEvent(eventId) {
  try {
    // 发起 DELETE 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(`/api/conference/events/${eventId}/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    if (!response.ok) {
      const data = await response.json();
      // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to delete the meeting"
      return {
        success: false,
        error: data.detail || "Failed to delete the meeting",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== 布局元素 API ====================

/**
 * 获取所有布局元素（可选按事件过滤）
 * @param {string} [eventId] - 可选：会议ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getAllElements(eventId) {
  try {
    let url = "/api/conference/elements/";
    if (eventId) {
      url += `?event=${eventId}`;
    }
    // 发起 GET 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to get element list"
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to get element list",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 [{id: 1, name: "会议1"}, {id: 2, name: "会议2"}]
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建新的布局元素
 * @param {object} elementData - 元素数据 { event, element_type, label, position_x, position_y, width, height, ... }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createElement(elementData) {
  try {
    // 发起 POST 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch("/api/conference/elements/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(elementData),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to create element"
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to create element",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新布局元素
 * @param {string} elementId - 元素ID
 * @param {object} updates - 要更新的字段
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateElement(elementId, updates) {
  try {
    // 发起 PUT 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(`/api/conference/elements/${elementId}/`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to update element"
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to update element",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 删除布局元素
 * @param {string} elementId - 元素ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteElement(elementId) {
  try {
    // 发起 DELETE 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(`/api/conference/elements/${elementId}/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    if (!response.ok) {
      const data = await response.json();
      // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to delete element"
      return {
        success: false,
        error: data.detail || "Failed to delete element",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== Guest API ====================

/**
 * 获取所有嘉宾（可选按事件过滤）
 * @param {string} [eventId] - 可选：会议ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getAllGuests(eventId) {
  try {
    let url = "/api/conference/guests/";
    // 如果 eventId 存在，就添加 event 参数
    if (eventId) {
      url += `?event=${eventId}`;
    }
    // 发起 GET 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();

    if (!response.ok) {
      // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to obtain guest list"
      return {
        success: false,
        error: data.detail || "Failed to obtain guest list",
      };
    }

    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 [{id: 1, name: "会议1"}, {id: 2, name: "会议2"}]
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建新嘉宾
 * @param {object} guestData - 嘉宾数据 { event, name, email, group, dietary_requirements, ... }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createGuest(guestData) {
  try {
    // 发起 POST 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch("/api/conference/guests/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(guestData),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();

    if (!response.ok) {
      // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to create guest"
      return { success: false, error: data.detail || "Failed to create guest" };
    }

    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新嘉宾信息
 * @param {string} guestId - 嘉宾ID
 * @param {object} updates - 要更新的字段
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateGuest(guestId, updates) {
  try {
    // 发起 PUT 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(`/api/conference/guests/${guestId}/`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Update guest failed"
    if (!response.ok) {
      return { success: false, error: data.detail || "Update guest failed" };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 删除嘉宾
 * @param {string} guestId - 嘉宾ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteGuest(guestId) {
  try {
    // 发起 DELETE 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(`/api/conference/guests/${guestId}/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    if (!response.ok) {
      const data = await response.json();
      // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to delete guest"
      return { success: false, error: data.detail || "Failed to delete guest" };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== 分组 API ====================

/**
 * 获取所有分组（可选按事件过滤）
 * @param {string} [eventId] - 可选：会议ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getAllGroups(eventId) {
  try {
    let url = "/api/conference/groups/";
    // 如果 eventId 存在，就添加 event 参数
    if (eventId) {
      url += `?event=${eventId}`;
    }
    // 发起 GET 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to obtain the group list",
      };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 [{id: 1, name: "会议1"}, {id: 2, name: "会议2"}]
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建新分组
 * @param {string} eventId - 会议ID
 * @param {object} groupData - 分组数据 { name, color, isSystem }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createGroup(eventId, groupData) {
  try {
    // 发起 POST 请求到后端接口。 authHeaders() 会带上 Authorization: Bearer <token> 和 Content-Type，用于身份校验
    const response = await fetch("/api/conference/groups/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        event: eventId,
        name: groupData.name,
        color: groupData.color,
        is_system: groupData.isSystem || false,
      }),
    });
    // 等待服务器返回的响应，然后用 response.json() 把响应体（比如 JSON 数据）解析出来
    const data = await response.json();
    // 如果响应状态码不是 200 OK，就返回错误信息 data.detail 是后端返回的错误信息，比如 "Failed to create group"
    if (!response.ok) {
      return { success: false, error: data.detail || "Failed to create group" };
    }
    // 如果响应状态码是 200 OK，就返回成功信息 data 是后端返回的 JSON 数据，比如 {id: 1, name: "会议1", description: "会议1的描述", event_date: "2025-01-01", room_width: 10, room_height: 10}
    return { success: true, data };
    // 如果发生错误，就返回错误信息 error.message 是错误信息，比如 "Network error"
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新分组
 * @param {string} groupId - 分组ID
 * @param {object} updates - 要更新的字段 { name?, color? }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateGroup(groupId, updates) {
  try {
    const response = await fetch(`/api/conference/groups/${groupId}/`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || "Update group failed" };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 删除分组
 * @param {string} groupId - 分组ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteGroup(groupId) {
  try {
    const response = await fetch(`/api/conference/groups/${groupId}/`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.detail || "Delete group failed" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== 座位分配 API ====================

/**
 * 获取所有座位分配（可选按事件过滤）
 * @param {string} [eventId] - 可选：会议ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getAllAssignments(eventId) {
  try {
    let url = "/api/conference/assignments/";
    if (eventId) {
      url += `?event=${eventId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to retrieve seat assignment",
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建座位分配
 * @param {object} assignmentData - 分配数据 { event, element, guest, seat_number }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createAssignment(assignmentData) {
  try {
    const response = await fetch("/api/conference/assignments/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(assignmentData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to create seat assignment",
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 删除座位分配
 * @param {string} assignmentId - 分配ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteAssignment(assignmentId) {
  try {
    const response = await fetch(
      `/api/conference/assignments/${assignmentId}/`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.detail || "Deleting seat assignments failed",
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== 批量操作 API ====================

/**
 * 批量创建布局元素
 * @param {string} eventId - 会议ID
 * @param {array} elements - 元素数组
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function batchCreateElements(eventId, elements) {
  try {
    const response = await fetch(
      `/api/conference/events/${eventId}/elements/`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ elements }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to create elements in batches",
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 批量导入嘉宾
 * @param {string} eventId - 会议ID
 * @param {array} guests - 嘉宾数组
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function batchImportGuests(eventId, guests) {
  try {
    const response = await fetch(
      `/api/conference/events/${eventId}/guests_import/`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ guests }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Batch import of guests failed",
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 生成分享Token
 * @param {string} eventId - 会议ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function generateShareToken(eventId) {
  try {
    const response = await fetch(`/api/conference/events/${eventId}/share/`, {
      method: "POST",
      headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to generate sharing link",
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 通过分享Token获取会议（只读）
 * @param {string} shareToken - 分享Token
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getEventByShareToken(shareToken) {
  try {
    const response = await fetch(`/api/conference/share/${shareToken}/`, {
      method: "GET",
      // 注意：这个API不需要认证
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to obtain shared conference",
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
