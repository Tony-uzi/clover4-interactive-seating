// Kiosk mode for Conference (read-only display with search)

import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import ConferenceCanvas from '../components/conference/ConferenceCanvas';
import WelcomeScreen from '../components/shared/WelcomeScreen';
import {
  loadConferenceEvent,
  loadConferenceLayout,
  loadConferenceGuests,
  saveConferenceGuests,
} from '../lib/utils/storage';
import { useWebSocket } from '../lib/hooks/useWebSocket';
import * as ConferenceAPI from '../server-actions/conference-planner';

const REFRESH_INTERVAL = 60000; // 60 seconds (fallback)

export default function KioskConference() {
  const [event, setEvent] = useState(null);
  const [elements, setElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [highlightedElementId, setHighlightedElementId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [checkedInGuest, setCheckedInGuest] = useState(null);

  // Load data from API
  const loadData = async () => {
    try {
      // Try to load from API first
      const eventsResult = await ConferenceAPI.getAllEvents();
      
      if (eventsResult.success && eventsResult.data.length > 0) {
        const apiEvent = eventsResult.data[0];
        const eventData = {
          id: apiEvent.id,
          name: apiEvent.name,
          description: apiEvent.description,
          date: apiEvent.event_date,
          roomWidth: apiEvent.room_width,
          roomHeight: apiEvent.room_height,
        };
        setEvent(eventData);

        // Load elements
        const elementsResult = await ConferenceAPI.getAllElements(apiEvent.id);
        if (elementsResult.success) {
          const mappedElements = elementsResult.data.map(el => ({
            id: el.id,
            type: el.element_type,
            label: el.label,
            x: el.position_x,
            y: el.position_y,
            width: el.width,
            height: el.height,
            rotation: el.rotation || 0,
            capacity: el.capacity || 8,
            color: el.color || '#3B82F6',
          }));
          setElements(mappedElements);
        }

        // Load guests
        const guestsResult = await ConferenceAPI.getAllGuests(apiEvent.id);
        if (guestsResult.success) {
          const mappedGuests = guestsResult.data.map(g => ({
            id: g.id,
            name: g.name,
            email: g.email,
            group: g.group_name || 'General',
            dietaryPreference: g.dietary_requirements || 'None',
            tableNumber: g.table_number,
            seatNumber: g.seat_number,
            elementId: g.element,
            checkedIn: g.checked_in || false,
            attendance: g.attendance !== false,
            notes: g.notes || '',
          }));
          setGuests(mappedGuests);
        }
      } else {
        // Fallback to localStorage
        const loadedEvent = loadConferenceEvent();
        const loadedLayout = loadConferenceLayout();
        const loadedGuests = loadConferenceGuests();

        setEvent(loadedEvent);
        setElements(loadedLayout);
        setGuests(loadedGuests);
      }
    } catch (error) {
      console.error('Error loading from API, using localStorage:', error);
      // Fallback to localStorage
      const loadedEvent = loadConferenceEvent();
      const loadedLayout = loadConferenceLayout();
      const loadedGuests = loadConferenceGuests();

      setEvent(loadedEvent);
      setElements(loadedLayout);
      setGuests(loadedGuests);
    }
  };

  // Initial load and auto-refresh (fallback)
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      console.log('Auto-refreshing kiosk data...');
      loadData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time updates
  const { isConnected, send } = useWebSocket('conference', event?.id || 'default', {
    element_update: (data) => {
      console.log('Layout changed via WebSocket, reloading...');
      loadData();
    },
    guest_update: (data) => {
      console.log('Guest data changed via WebSocket, reloading...');
      loadData();
    },
    event_update: (data) => {
      console.log('Event changed via WebSocket, reloading...');
      loadData();
    },
  });

  // Filter guests based on search
  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle guest selection
  const handleSelectGuest = (guest) => {
    setSelectedGuest(guest);
    setSearchTerm(''); // Clear search to hide dropdown

    // Find the element this guest is assigned to
    // Priority: 1) elementId (direct assignment), 2) tableNumber match, 3) chair with matching label
    let assignedElement = null;
    
    if (guest.elementId) {
      assignedElement = elements.find(el => el.id === guest.elementId);
    }
    
    if (!assignedElement && guest.tableNumber) {
      // Try to find by table number or label
      assignedElement = elements.find(el => 
        el.label === guest.tableNumber || 
        el.label === String(guest.tableNumber)
      );
    }

    if (assignedElement) {
      setHighlightedElementId(assignedElement.id);
    } else {
      setHighlightedElementId(null);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedGuest(null);
    setHighlightedElementId(null);
    setSearchTerm('');
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!selectedGuest) return;

    try {
      // Update guest check-in status in API
      const result = await ConferenceAPI.updateGuest(selectedGuest.id, {
        checked_in: true,
      });

      if (result.success) {
        const updatedGuest = { ...selectedGuest, checkedIn: true };
        
        // Update local state
        const updatedGuests = guests.map(g => 
          g.id === selectedGuest.id ? updatedGuest : g
        );
        setGuests(updatedGuests);
        setSelectedGuest(updatedGuest);
        
        // Show welcome screen only for check-in (not cancel)
        if (!selectedGuest.checkedIn) {
          setCheckedInGuest(updatedGuest);
          setShowWelcome(true);
        }

        // Also save to localStorage as backup
        saveConferenceGuests(updatedGuests);

        // Broadcast the check-in update via WebSocket
        if (isConnected) {
          send({
            type: 'guest_update',
            action: 'checkin',
            guestId: selectedGuest.id,
          });
        }
      } else {
        console.error('Failed to check in guest:', result.error);
        alert('Failed to check in: ' + result.error);
      }
    } catch (error) {
      console.error('Error checking in guest:', error);
      alert('Error: ' + error.message);
    }
  };

  // Handle welcome screen close
  const handleWelcomeClose = () => {
    setShowWelcome(false);
    setCheckedInGuest(null);
    handleClearSelection();
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading...</div>
          <div className="text-gray-600">Loading conference information</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Screen Overlay */}
      {showWelcome && checkedInGuest && (
        <WelcomeScreen 
          guest={checkedInGuest} 
          onClose={handleWelcomeClose}
          autoReturnSeconds={3}
        />
      )}

      <div className="flex flex-col bg-gray-100" style={{ 
        minHeight: 'calc(100vh - 64px)',
        margin: '0 calc(-50vw + 50%)',
        width: '100vw'
      }}>
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        {event.description && (
          <p className="text-blue-100 mt-1">{event.description}</p>
        )}
        {event.date && (
          <p className="text-blue-200 text-sm mt-1">Date: {event.date}</p>
        )}
      </div>

      {/* Search bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 relative">
        <div className="max-w-2xl mx-auto relative">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search guest by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={handleClearSelection}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchTerm && filteredGuests.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredGuests.map(guest => (
                <button
                  key={guest.id}
                  onClick={() => handleSelectGuest(guest)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{guest.name}</div>
                      {guest.email && (
                        <div className="text-sm text-gray-600">{guest.email}</div>
                      )}
                      {guest.tableNumber && (
                        <div className="text-sm text-blue-600 mt-1">
                          Table: {guest.tableNumber}
                          {guest.seatNumber && ` - Seat ${guest.seatNumber}`}
                        </div>
                      )}
                    </div>
                    {guest.checkedIn && (
                      <div className="ml-3 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        <span>✓</span>
                        <span>Checked In</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchTerm && filteredGuests.length === 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-center text-gray-500">
              No matching guests found
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-6">
          <ConferenceCanvas
            elements={elements}
            onElementsChange={() => {}} // Read-only
            roomWidth={event.roomWidth}
            roomHeight={event.roomHeight}
            selectedElementId={highlightedElementId}
            onSelectElement={() => {}} // Read-only
            guests={guests}
            readOnly={true}
          />
        </div>

        {/* Info panel */}
        {selectedGuest && (
          <div className="w-96 bg-white border-l border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Guest Information</h2>
              <button
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Name
                </label>
                <div className="text-lg font-semibold text-gray-800">
                  {selectedGuest.name}
                </div>
              </div>

              {selectedGuest.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <div className="text-gray-800">{selectedGuest.email}</div>
                </div>
              )}

              {selectedGuest.group && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Group
                  </label>
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {selectedGuest.group}
                  </div>
                </div>
              )}

              {selectedGuest.tableNumber && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    Seating Information
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    Table: {selectedGuest.tableNumber}
                  </div>
                  {selectedGuest.seatNumber && (
                    <div className="text-lg text-blue-600 mt-1">
                      Seat: {selectedGuest.seatNumber}
                    </div>
                  )}
                </div>
              )}

              {selectedGuest.dietaryPreference && selectedGuest.dietaryPreference !== 'None' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Dietary Preference
                  </label>
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {selectedGuest.dietaryPreference}
                  </div>
                </div>
              )}

              {selectedGuest.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Notes
                  </label>
                  <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedGuest.notes}
                  </div>
                </div>
              )}

              {/* Check-in status */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Check-in Status
                </label>
                <div className={`p-4 rounded-lg border-2 mb-4 ${
                  selectedGuest.checkedIn
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">
                      {selectedGuest.checkedIn ? '✓' : '○'}
                    </span>
                    <span className={`text-lg font-semibold ${
                      selectedGuest.checkedIn
                        ? 'text-green-700'
                        : 'text-gray-600'
                    }`}>
                      {selectedGuest.checkedIn ? 'Checked In' : 'Not Checked In'}
                    </span>
                  </div>
                </div>

                {/* Check-in button */}
                {!selectedGuest.checkedIn && (
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-4 rounded-lg font-semibold text-lg transition-colors bg-green-600 hover:bg-green-700 text-white transform hover:scale-105 active:scale-95"
                  >
                    Check In Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 px-6 py-3 text-center text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>📍 Conference Information System</span>
          <span>•</span>
          <span>Auto-refresh: Every 60 seconds</span>
          <span>•</span>
          <span>Total Guests: {guests.length}</span>
          <span>•</span>
          <span className="text-green-400">✓ Checked In: {guests.filter(g => g.checkedIn).length}</span>
        </div>
      </div>
    </div>
    </>
  );
}
