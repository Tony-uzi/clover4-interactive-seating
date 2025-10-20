/**
 * Design System API
 * Handles save, versioning, and sharing for designs
 * 
 * Note: For conference/tradeshow APIs, use server-actions modules
 */

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
  const res = await fetch('/api/designs/', { 
    headers: { Authorization: `Bearer ${getAuthToken()}` } 
  });
  if (!res.ok) throw new Error('Failed to fetch designs');
  return res.json();
}

export async function createOrGetDesign(name, kind = 'custom') {
  const res = await fetch('/api/designs/', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, kind }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to create design');
  return data;
}

export async function saveDesignVersion(designId, data, note = '') {
  const res = await fetch(`/api/designs/${designId}/versions/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ data, note }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || 'Failed to save version');
  return result;
}

export async function getLatestDesign(designId) {
  const res = await fetch(`/api/designs/${designId}/latest/`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to get latest version');
  return data;
}

export async function getDesignVersions(designId) {
  const res = await fetch(`/api/designs/${designId}/versions/`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error('Failed to get versions');
  return res.json();
}

export async function getLatestByToken(designId, token) {
  const res = await fetch(`/api/designs/${designId}/latest/?token=${encodeURIComponent(token)}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Fetch by token failed');
  return data;
}

export async function listSharedDesigns() {
  const res = await fetch('/api/designs/shared/', {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch shared designs');
  return res.json();
}

export async function createShareLink(designId, role = 'view') {
  const res = await fetch(`/api/designs/${designId}/share-link/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to create share link');
  return data;
}

export async function inviteUser(designId, email, role = 'view') {
  const res = await fetch(`/api/designs/${designId}/invite/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Invite failed');
  return data;
}


