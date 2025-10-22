// LocalStorage utility functions for data persistence

import {
  normalizeConferenceGuest,
  normalizeTradeshowVendor,
  normalizeConferenceElement,
  normalizeTradeshowBooth,
} from './normalizers';

// Storage keys
export const STORAGE_KEYS = {
  // Conference
  CONFERENCE_EVENT: 'conference-event',
  CONFERENCE_LAYOUT: 'conference-layout',
  CONFERENCE_GUESTS: 'conference-guests',
  CONFERENCE_GROUPS: 'conference-groups',
  CONFERENCE_SESSIONS: 'conference-sessions',

  // Tradeshow
  TRADESHOW_EVENT: 'tradeshow-event',
  TRADESHOW_LAYOUT: 'tradeshow-layout',
  TRADESHOW_VENDORS: 'tradeshow-vendors',
  TRADESHOW_ROUTES: 'tradeshow-routes',
  TRADESHOW_SESSIONS: 'tradeshow-sessions',
};

// Generic storage functions
export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return { success: false, error: error.message };
  }
}

export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return { success: false, error: error.message };
  }
}

export function clearStorage() {
  try {
    localStorage.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return { success: false, error: error.message };
  }
}

// Conference-specific functions
export function saveConferenceEvent(eventData) {
  return saveToStorage(STORAGE_KEYS.CONFERENCE_EVENT, eventData);
}

export function loadConferenceEvent() {
  return loadFromStorage(STORAGE_KEYS.CONFERENCE_EVENT, {
    name: 'New Conference Event',
    description: '',
    date: new Date().toISOString().split('T')[0],
    roomWidth: 24,
    roomHeight: 16,
  });
}

export function saveConferenceLayout(elements) {
  const normalized = Array.isArray(elements)
    ? elements.map(normalizeConferenceElement).filter(Boolean)
    : [];
  return saveToStorage(STORAGE_KEYS.CONFERENCE_LAYOUT, normalized);
}

export function loadConferenceLayout() {
  const stored = loadFromStorage(STORAGE_KEYS.CONFERENCE_LAYOUT, []);
  return Array.isArray(stored)
    ? stored.map(normalizeConferenceElement).filter(Boolean)
    : [];
}

export function saveConferenceGuests(guests) {
  const normalized = Array.isArray(guests)
    ? guests.map(normalizeConferenceGuest).filter(Boolean)
    : [];
  return saveToStorage(STORAGE_KEYS.CONFERENCE_GUESTS, normalized);
}

export function loadConferenceGuests() {
  const stored = loadFromStorage(STORAGE_KEYS.CONFERENCE_GUESTS, []);
  return Array.isArray(stored)
    ? stored.map(normalizeConferenceGuest).filter(Boolean)
    : [];
}

export function saveConferenceGroups(groups) {
  return saveToStorage(STORAGE_KEYS.CONFERENCE_GROUPS, groups);
}

export function loadConferenceGroups() {
  // Default groups
  const defaultGroups = [
    { id: 'vip', name: 'VIP', color: '#8B5CF6', isSystem: true },
    { id: 'general', name: 'General', color: '#3B82F6', isSystem: true },
    { id: 'staff', name: 'Staff', color: '#10B981', isSystem: true },
    { id: 'speaker', name: 'Speaker', color: '#F59E0B', isSystem: true },
  ];

  const savedGroups = loadFromStorage(STORAGE_KEYS.CONFERENCE_GROUPS, null);

  // If no saved groups, return defaults
  if (!savedGroups) {
    return defaultGroups;
  }

  // Merge: keep system groups, add custom groups
  const systemGroups = defaultGroups;
  const customGroups = savedGroups.filter(g => !g.isSystem);

  return [...systemGroups, ...customGroups];
}

// Tradeshow-specific functions
export function saveTradeshowEvent(eventData) {
  return saveToStorage(STORAGE_KEYS.TRADESHOW_EVENT, eventData);
}

export function loadTradeshowEvent() {
  return loadFromStorage(STORAGE_KEYS.TRADESHOW_EVENT, {
    name: 'New Tradeshow Event',
    description: '',
    date: new Date().toISOString().split('T')[0],
    hallWidth: 40,
    hallHeight: 30,
  });
}

export function saveTradeshowLayout(booths) {
  const normalized = Array.isArray(booths)
    ? booths.map(normalizeTradeshowBooth).filter(Boolean)
    : [];
  return saveToStorage(STORAGE_KEYS.TRADESHOW_LAYOUT, normalized);
}

export function loadTradeshowLayout() {
  const stored = loadFromStorage(STORAGE_KEYS.TRADESHOW_LAYOUT, []);
  return Array.isArray(stored)
    ? stored.map(normalizeTradeshowBooth).filter(Boolean)
    : [];
}

export function saveTradeshowVendors(vendors) {
  const normalized = Array.isArray(vendors)
    ? vendors.map(normalizeTradeshowVendor).filter(Boolean)
    : [];
  return saveToStorage(STORAGE_KEYS.TRADESHOW_VENDORS, normalized);
}

export function loadTradeshowVendors() {
  const stored = loadFromStorage(STORAGE_KEYS.TRADESHOW_VENDORS, []);
  return Array.isArray(stored)
    ? stored.map(normalizeTradeshowVendor).filter(Boolean)
    : [];
}

export function saveTradeshowRoutes(routes) {
  return saveToStorage(STORAGE_KEYS.TRADESHOW_ROUTES, routes);
}

export function loadTradeshowRoutes() {
  return loadFromStorage(STORAGE_KEYS.TRADESHOW_ROUTES, []);
}

// ========================================
// Schedule/Session storage
// ========================================
export function saveConferenceSessions(sessions) {
  return saveToStorage(STORAGE_KEYS.CONFERENCE_SESSIONS, sessions);
}

export function loadConferenceSessions() {
  return loadFromStorage(STORAGE_KEYS.CONFERENCE_SESSIONS, []);
}

export function saveTradeshowSessions(sessions) {
  return saveToStorage(STORAGE_KEYS.TRADESHOW_SESSIONS, sessions);
}

export function loadTradeshowSessions() {
  return loadFromStorage(STORAGE_KEYS.TRADESHOW_SESSIONS, []);
}

// ========================================
// Kiosk Event ID Management
// ========================================
export const KIOSK_EVENT_ID_KEY = 'kiosk_last_event_id';

export function getLastKioskEventId() {
  return localStorage.getItem(KIOSK_EVENT_ID_KEY);
}

export function setLastKioskEventId(eventId) {
  if (eventId) {
    localStorage.setItem(KIOSK_EVENT_ID_KEY, eventId);
  } else {
    localStorage.removeItem(KIOSK_EVENT_ID_KEY);
  }
}

// Export all data (for backup/restore)
export function exportAllData() {
  const data = {};
  Object.values(STORAGE_KEYS).forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      data[key] = JSON.parse(value);
    }
  });
  return data;
}

// Import all data (for backup/restore)
export function importAllData(data) {
  try {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
}
