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


