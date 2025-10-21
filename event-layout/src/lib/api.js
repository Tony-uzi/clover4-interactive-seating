// ==================== Design System API ====================
// 设计稿系统API（云端保存、版本控制、分享功能）
// 
// 注意：会议和展会的API请使用 server-actions 目录中的模块：
// - import * as ConferenceAPI from '@/server-actions/conference-planner'
// - import * as TradeshowAPI from '@/server-actions/tradeshow-planner'
// - import * as AuthAPI from '@/server-actions/auth'

export function getAuthToken() {
  return localStorage.getItem('token') || '';
}

function authHeaders() {
  const token = getAuthToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

// ==================== Design Management ====================

export async function listDesigns() {
  const res = await fetch('/api/designs/', { headers: { Authorization: `Bearer ${getAuthToken()}` } });
  if (!res.ok) throw new Error('Failed to fetch cloud file list');
  return res.json();
}

export async function createOrGetDesign(name, kind = 'custom') {
  const res = await fetch('/api/designs/', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, kind }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to create/get design');
  return data; // {id, name, kind, latest_version, updated_at}
}

export async function updateDesign(designId, { name, kind }) {
  const res = await fetch(`/api/designs/${designId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ name, kind }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update design');
  return data;
}

export async function deleteDesign(designId) {
  const res = await fetch(`/api/designs/${designId}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete design');
  return true;
}

export async function saveDesignVersion(designId, data, note = '') {
  const res = await fetch(`/api/designs/${designId}/versions/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ data, note }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.detail || 'Failed to save version');
  return out; // {version, created_at, note}
}

export async function getLatestDesign(designId) {
  const res = await fetch(`/api/designs/${designId}/latest/`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.detail || 'Failed to get latest version');
  return out; // {version, data}
}

export async function getDesignVersions(designId) {
  const res = await fetch(`/api/designs/${designId}/versions/`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error('Failed to get version list');
  return res.json(); // [{version, note, created_at}]
}

export async function getLatestByToken(designId, token) {
  const res = await fetch(`/api/designs/${designId}/latest/?token=${encodeURIComponent(token)}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.detail || 'Fetch by token failed');
  return out; // {version, data}
}



