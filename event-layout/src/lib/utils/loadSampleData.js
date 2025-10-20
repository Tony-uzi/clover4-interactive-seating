// Utility to load sample data into the application

import {
  saveConferenceEvent,
  saveConferenceLayout,
  saveConferenceGuests,
  saveConferenceGroups,
} from './storage';
import { parseGuestCSV } from './csvParser';

/**
 * Load sample conference data
 */
export async function loadSampleConferenceData() {
  try {
    // Load sample layout
    const layoutResponse = await fetch('/sample-conference-layout.json');
    const layoutData = await layoutResponse.json();

    // Save event
    saveConferenceEvent(layoutData.event);

    // Save layout elements
    saveConferenceLayout(layoutData.elements);

    // Load and parse sample guests CSV
    const guestsResponse = await fetch('/sample-guests.csv');
    const guestsCSV = await guestsResponse.text();
    const parsedGuests = parseGuestCSV(guestsCSV);

    // Assign guests to tables (distribute evenly)
    const tables = layoutData.elements.filter(el => 
      el.type === 'round-table' || el.type === 'rect-table'
    );

    const guestsWithAssignments = parsedGuests.map((guest, index) => {
      const tableIndex = index % tables.length;
      const table = tables[tableIndex];
      const seatNumber = Math.floor(index / tables.length) + 1;

      return {
        ...guest,
        id: `guest_${Date.now()}_${index}`,
        tableNumber: table.label,
        elementId: table.id,
        seatNumber: seatNumber <= (table.capacity || 8) ? seatNumber : null,
        checkedIn: false,
      };
    });

    saveConferenceGuests(guestsWithAssignments);

    // Save default groups (they will be loaded from storage.js defaults)
    const defaultGroups = [
      { id: 'vip', name: 'VIP', color: '#8B5CF6', isSystem: true },
      { id: 'general', name: 'General', color: '#3B82F6', isSystem: true },
      { id: 'staff', name: 'Staff', color: '#10B981', isSystem: true },
      { id: 'speaker', name: 'Speaker', color: '#F59E0B', isSystem: true },
    ];
    saveConferenceGroups(defaultGroups);

    return {
      success: true,
      message: `Loaded ${guestsWithAssignments.length} guests and ${layoutData.elements.length} layout elements`,
      data: {
        event: layoutData.event,
        elements: layoutData.elements,
        guests: guestsWithAssignments,
        groups: defaultGroups,
      },
    };
  } catch (error) {
    console.error('Error loading sample data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clear all conference data
 */
export function clearConferenceData() {
  try {
    localStorage.removeItem('conference-event');
    localStorage.removeItem('conference-layout');
    localStorage.removeItem('conference-guests');
    localStorage.removeItem('conference-groups');

    return {
      success: true,
      message: 'All conference data cleared',
    };
  } catch (error) {
    console.error('Error clearing data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
