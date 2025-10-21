// Kiosk mode for Conference (read-only display with search)

import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiCamera } from 'react-icons/fi';
import ConferenceCanvas from '../components/conference/ConferenceCanvas';
import QRScanner from '../components/QRScanner';
import {
  loadConferenceEvent,
  loadConferenceLayout,
  loadConferenceGuests,
  saveConferenceEvent,
  saveConferenceLayout,
  saveConferenceGuests,
} from '../lib/utils/storage';
import * as ConferenceAPI from '../server-actions/conference-planner';

const REFRESH_INTERVAL = 60000; // 60 seconds

export default function KioskConference() {
  const [event, setEvent] = useState(null);
  const [elements, setElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [highlightedElementId, setHighlightedElementId] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Load data from backend API with fallback to localStorage
  const loadData = async () => {
    try {
      // Try to load from localStorage first for immediate display
      const cachedEvent = loadConferenceEvent();
      const cachedLayout = loadConferenceLayout();
      const cachedGuests = loadConferenceGuests();

      // Use cached data immediately if available
      if (cachedEvent) {
        setEvent(cachedEvent);
        setElements(cachedLayout);
        setGuests(cachedGuests);
      }

      // Then fetch from backend API for latest data
      if (cachedEvent?.id) {
        const eventResponse = await ConferenceAPI.getEvent(cachedEvent.id);
        const guestsResponse = await ConferenceAPI.getGuests(cachedEvent.id);
        const elementsResponse = await ConferenceAPI.getElements(cachedEvent.id);

        if (eventResponse.success && guestsResponse.success && elementsResponse.success) {
          const updatedEvent = {
            id: eventResponse.data.id,
            name: eventResponse.data.name,
            description: eventResponse.data.description,
            date: eventResponse.data.date,
            roomWidth: eventResponse.data.room_width,
            roomHeight: eventResponse.data.room_height,
          };

          const updatedGuests = guestsResponse.data.map(g => ({
            id: g.id,
            name: g.name,
            email: g.email,
            group: g.group,
            tableNumber: g.table_number,
            seatNumber: g.seat_number,
            dietaryPreference: g.dietary_preference,
            attendance: g.attendance,
            notes: g.notes,
            checkedIn: g.checked_in || false,
            elementId: g.element_id,
          }));

          const updatedElements = elementsResponse.data.map(el => ({
            id: el.id,
            type: el.element_type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            rotation: el.rotation || 0,
            label: el.label,
            seats: el.seats,
          }));

          setEvent(updatedEvent);
          setElements(updatedElements);
          setGuests(updatedGuests);

          // Cache the updated data
          saveConferenceEvent(updatedEvent);
          saveConferenceLayout(updatedElements);
          saveConferenceGuests(updatedGuests);

          setIsOnline(true);
          console.log('✓ Data refreshed from backend API');
        }
      }
    } catch (error) {
      console.warn('Failed to load from backend, using cached data:', error);
      setIsOnline(false);

      // Fallback to localStorage
      const loadedEvent = loadConferenceEvent();
      const loadedLayout = loadConferenceLayout();
      const loadedGuests = loadConferenceGuests();

      setEvent(loadedEvent);
      setElements(loadedLayout);
      setGuests(loadedGuests);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      console.log('Auto-refreshing kiosk data...');
      loadData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

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
    if (!selectedGuest || !event?.id) return;

    const newCheckedInStatus = !selectedGuest.checkedIn;

    try {
      // Update backend first
      const response = await ConferenceAPI.updateGuest(event.id, selectedGuest.id, {
        checked_in: newCheckedInStatus,
      });

      if (response.success) {
        // Update local state
        const updatedGuests = guests.map(g => {
          if (g.id === selectedGuest.id) {
            const updatedGuest = { ...g, checkedIn: newCheckedInStatus };
            setSelectedGuest(updatedGuest); // Update selected guest in state
            return updatedGuest;
          }
          return g;
        });

        setGuests(updatedGuests);
        saveConferenceGuests(updatedGuests);
        console.log(`✓ ${selectedGuest.name} check-in status updated`);
      }
    } catch (error) {
      console.error('Failed to update check-in status:', error);
      // Fallback to local update if API fails
      const updatedGuests = guests.map(g => {
        if (g.id === selectedGuest.id) {
          const updatedGuest = { ...g, checkedIn: newCheckedInStatus };
          setSelectedGuest(updatedGuest);
          return updatedGuest;
        }
        return g;
      });

      setGuests(updatedGuests);
      saveConferenceGuests(updatedGuests);
    }
  };

  // Handle QR code scan
  const handleQRCodeScan = (qrData) => {
    setShowQRScanner(false);
    setScanError(null);

    try {
      // Parse QR code data
      // Expected format: checkin://conference/{eventId}/{guestId}
      const qrPattern = /^checkin:\/\/conference\/([^/]+)\/([^/]+)$/;
      const match = qrData.match(qrPattern);

      if (!match) {
        setScanError('Invalid QR code format. Please use a valid check-in QR code.');
        return;
      }

      const [, eventId, guestId] = match;

      // Find the guest
      const guest = guests.find(g => g.id === guestId || String(g.id) === guestId);

      if (!guest) {
        setScanError(`Guest not found. QR code may be for a different event.`);
        return;
      }

      // Auto-select the guest
      handleSelectGuest(guest);

      // Auto check-in if not already checked in
      if (!guest.checkedIn) {
        setTimeout(() => {
          const updatedGuests = guests.map(g => {
            if (g.id === guest.id) {
              return { ...g, checkedIn: true };
            }
            return g;
          });
          setGuests(updatedGuests);
          saveConferenceGuests(updatedGuests);
          
          // Show success message
          console.log(`✓ ${guest.name} checked in successfully via QR code`);
        }, 300);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanError('Failed to process QR code. Please try again.');
    }
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

      {/* Search and QR Scanner bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 relative">
        <div className="max-w-2xl mx-auto relative">
          <div className="flex gap-2">
            {/* Search input */}
            <div className="flex-1 relative">
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

            {/* QR Scan button */}
            <button
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              title="Scan QR Code"
            >
              <FiCamera className="w-5 h-5" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
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
                <button
                  onClick={handleCheckIn}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                    selectedGuest.checkedIn
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {selectedGuest.checkedIn ? 'Cancel Check-in' : 'Check In'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => {
          setShowQRScanner(false);
          setScanError(null);
        }}
        onScan={(data) => {
          console.log('QR Code scanned:', data);
          handleQRCodeScan(data);
        }}
        onError={(error) => {
          console.error('QR Scanner error:', error);
          setScanError(error);
        }}
      />

      {/* Scan Error Alert */}
      {scanError && (
        <div className="fixed bottom-4 right-4 z-40 max-w-md bg-red-50 border-2 border-red-300 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-red-600 text-2xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-1">Scan Error</h4>
              <p className="text-sm text-red-700">{scanError}</p>
            </div>
            <button
              onClick={() => setScanError(null)}
              className="flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 px-6 py-3 text-center text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>📍 Conference Information System</span>
          <span>•</span>
          <span>Auto-refresh: Every 60 seconds</span>
          <span>•</span>
          <span className={isOnline ? 'text-green-400' : 'text-yellow-400'}>
            {isOnline ? '🟢 Online' : '🟡 Offline (Cached)'}
          </span>
          <span>•</span>
          <span>Total Guests: {guests.length}</span>
          <span>•</span>
          <span className="text-green-400">✓ Checked In: {guests.filter(g => g.checkedIn).length}</span>
        </div>
      </div>
    </div>
  );
}
