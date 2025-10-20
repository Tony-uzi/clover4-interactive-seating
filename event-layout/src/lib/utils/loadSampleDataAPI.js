/**
 * Load sample data using Backend API (not localStorage)
 * This version saves data to the Django database
 */

import * as ConferenceAPI from '../../server-actions/conference-planner';
import { parseGuestCSV } from './csvParser';

/**
 * Load sample conference data to backend database
 */
export async function loadSampleConferenceDataToAPI() {
  try {
    console.log('Loading sample data to backend API...');

    // Step 1: Load sample layout JSON
    const layoutResponse = await fetch('/sample-conference-layout.json');
    const layoutData = await layoutResponse.json();

    // Step 2: Create event in backend
    console.log('Creating event in backend...');
    const eventResult = await ConferenceAPI.createEvent({
      name: layoutData.event.name,
      description: layoutData.event.description,
      event_date: layoutData.event.date,
      room_width: layoutData.event.roomWidth,
      room_height: layoutData.event.roomHeight,
    });

    if (!eventResult.success) {
      throw new Error('Failed to create event: ' + eventResult.error);
    }

    const eventId = eventResult.data.id;
    console.log('✅ Event created with ID:', eventId);

    // Step 3: Create layout elements in backend
    console.log('Creating layout elements...');
    const elementsResult = await ConferenceAPI.batchCreateElements(
      eventId,
      layoutData.elements.map(el => ({
        event: eventId,
        element_type: el.type,
        label: el.label,
        position_x: el.x,
        position_y: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation || 0,
        capacity: el.capacity || 8,
        color: el.color || '#3B82F6',
      }))
    );

    if (!elementsResult.success) {
      throw new Error('Failed to create elements: ' + elementsResult.error);
    }

    console.log('✅ Created', elementsResult.data.length, 'elements');

    // Step 4: Load and parse guest CSV
    console.log('Loading guest data...');
    const guestsResponse = await fetch('/sample-guests.csv');
    const guestsCSV = await guestsResponse.text();
    const parsedGuests = parseGuestCSV(guestsCSV);

    // Assign guests to tables
    const tables = elementsResult.data.filter(el => 
      el.element_type.includes('table')
    );

    const guestsWithAssignments = parsedGuests.map((guest, index) => {
      const tableIndex = index % tables.length;
      const table = tables[tableIndex];
      const seatNumber = Math.floor(index / tables.length) + 1;

      return {
        event: eventId,
        name: guest.name,
        email: guest.email,
        group_name: guest.group,
        dietary_requirements: guest.dietaryPreference !== 'None' ? guest.dietaryPreference : '',
        notes: guest.notes || '',
        attendance: guest.attendance !== false,
        table_number: table.label,
        seat_number: seatNumber <= (table.capacity || 8) ? seatNumber : null,
        checked_in: false,
      };
    });

    // Step 5: Batch import guests
    console.log('Creating guests in backend...');
    const guestsResult = await ConferenceAPI.batchImportGuests(
      eventId,
      guestsWithAssignments
    );

    if (!guestsResult.success) {
      throw new Error('Failed to import guests: ' + guestsResult.error);
    }

    console.log('✅ Imported', guestsResult.data.length, 'guests');

    // Step 6: Create default groups
    console.log('Creating groups...');
    const defaultGroups = [
      { name: 'VIP', color: '#8B5CF6' },
      { name: 'General', color: '#3B82F6' },
      { name: 'Staff', color: '#10B981' },
      { name: 'Speaker', color: '#F59E0B' },
    ];

    for (const group of defaultGroups) {
      await ConferenceAPI.createGroup(eventId, group);
    }

    console.log('✅ All groups created');

    return {
      success: true,
      message: `Successfully loaded ${guestsResult.data.length} guests and ${elementsResult.data.length} elements to database`,
      data: {
        eventId: eventId,
        event: eventResult.data,
        elements: elementsResult.data,
        guests: guestsResult.data,
      },
    };
  } catch (error) {
    console.error('Error loading sample data to API:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clear all conference data from backend
 */
export async function clearConferenceDataFromAPI(eventId) {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Delete event (cascade will delete all related data)
    const result = await ConferenceAPI.deleteEvent(eventId);

    if (!result.success) {
      throw new Error('Failed to delete event: ' + result.error);
    }

    return {
      success: true,
      message: 'All conference data cleared from database',
    };
  } catch (error) {
    console.error('Error clearing data from API:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync localStorage data to backend API
 */
export async function syncLocalStorageToAPI() {
  // TODO: Implement migration from localStorage to API
  console.warn('syncLocalStorageToAPI not implemented yet');
}
