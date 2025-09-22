export function getAuthToken() {
  return localStorage.getItem('token') || '';
}

function authHeaders() {
  const token = getAuthToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export async function listDesigns() {
  const res = await fetch('/api/designs/', { headers: { Authorization: `Bearer ${getAuthToken()}` } });
  if (!res.ok) throw new Error('无法获取云端文件列表');
  return res.json();
}

export async function createOrGetDesign(name, kind = 'custom') {
  const res = await fetch('/api/designs/', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, kind }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || '创建/获取设计失败');
  return data; // {id, name, kind, latest_version, updated_at}
}

export async function saveDesignVersion(designId, data, note = '') {
  const res = await fetch(`/api/designs/${designId}/versions/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ data, note }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.detail || '保存版本失败');
  return out; // {version, created_at, note}
}

export async function getLatestDesign(designId) {
  const res = await fetch(`/api/designs/${designId}/latest/`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.detail || '获取最新版本失败');
  return out; // {version, data}
}

export async function getDesignVersions(designId) {
  const res = await fetch(`/api/designs/${designId}/versions/`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error('获取版本列表失败');
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

export async function listSharedDesigns() {
  const res = await fetch('/api/designs/shared/', {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error('Fetch shared designs failed');
  return res.json();
}

export async function createShareLink(designId, role = 'view') {
  const res = await fetch(`/api/designs/${designId}/share-link/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.detail || 'Create share link failed');
  return out; // {token, role}
}

export async function inviteUser(designId, email, role = 'view') {
  const res = await fetch(`/api/designs/${designId}/invite/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, role }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.detail || 'Invite failed');
  return out; // {user_id, email, role}
}


