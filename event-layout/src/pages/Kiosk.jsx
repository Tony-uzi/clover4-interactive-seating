// Unified Kiosk Mode - Combines Conference and Tradeshow kiosks with mode toggle

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiGrid,
  FiSearch,
  FiX,
  FiMapPin,
  FiCheckCircle,
  FiRepeat,
  FiShare2,
  FiPlayCircle,
  FiArrowRightCircle,
  FiRotateCcw,
  FiSkipForward,
  FiCornerUpLeft,
} from 'react-icons/fi';
import ConferenceCanvas from '../components/conference/ConferenceCanvas';
import TradeshowCanvas from '../components/tradeshow/TradeshowCanvas';
import EventSelectorModal from '../components/EventSelectorModal';
import ShareModal from '../components/conference/ShareModal';
// Import localStorage helpers for event ID management
import * as ConferenceAPI from '../server-actions/conference-planner';
import * as TradeshowAPI from '../server-actions/tradeshow-planner';
import { normalizeConferenceGuest, normalizeTradeshowVendor, normalizeConferenceElement, normalizeTradeshowBooth } from '../lib/utils/normalizers';
import { getLastKioskEventId, setLastKioskEventId } from '../lib/utils/storage';

const REFRESH_INTERVAL = 5000; // 5 seconds
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const directionFromAngle = (angle) => {
  const normalized = angle < 0 ? angle + 360 : angle;
  const ranges = [
    { limit: 22.5, label: 'East' },
    { limit: 67.5, label: 'South-East' },
    { limit: 112.5, label: 'South' },
    { limit: 157.5, label: 'South-West' },
    { limit: 202.5, label: 'West' },
    { limit: 247.5, label: 'North-West' },
    { limit: 292.5, label: 'North' },
    { limit: 337.5, label: 'North-East' },
    { limit: 360, label: 'East' },
  ];
  return ranges.find(r => normalized <= r.limit)?.label || 'East';
};

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getBoothCenter = (booth) => {
  if (!booth) return null;
  const x = toNumber(booth.x);
  const y = toNumber(booth.y);
  const width = toNumber(booth.width);
  const height = toNumber(booth.height);
  if ([x, y, width, height].some(val => val === null)) return null;
  return {
    x: x + (width || 0) / 2,
    y: y + (height || 0) / 2,
  };
};

const buildGuidanceForStep = (fromBooth, toBooth) => {
  const fromCenter = getBoothCenter(fromBooth);
  const toCenter = getBoothCenter(toBooth);
  if (!fromCenter || !toCenter) return null;

  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    distance,
    direction: directionFromAngle(angle),
  };
};

const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

export default function Kiosk() {
  const [mode, setMode] = useState('conference'); // 'conference' or 'tradeshow'

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Mode Toggle Header */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={() => setMode('conference')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              mode === 'conference'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiCalendar className="w-6 h-6" />
            <span>Conference Kiosk</span>
          </button>
          <button
            onClick={() => setMode('tradeshow')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              mode === 'tradeshow'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiGrid className="w-6 h-6" />
            <span>Tradeshow Kiosk</span>
          </button>
        </div>
      </div>

      {/* Render the selected kiosk mode */}
      <div className="flex-1">
        {mode === 'conference' ? <ConferenceKiosk /> : <TradeshowKiosk />}
      </div>
    </div>
  );
}

export function ConferenceKiosk() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentEventId, setCurrentEventId] = useState(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [event, setEvent] = useState(null);
  const [elements, setElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [highlightedElementId, setHighlightedElementId] = useState(null);
  const [checkInNotice, setCheckInNotice] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const formatDateTime = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toLocaleString();
  };

  const loadData = useCallback(async () => {
    if (!currentEventId) {
      console.warn('No eventId available.');
      setIsOnline(false);
      return;
    }

    try {
      // Load data from backend using current event ID
      const eventResponse = await ConferenceAPI.getEvent(currentEventId);
      const guestsResponse = await ConferenceAPI.getGuests(currentEventId);
      
      if (eventResponse.success && guestsResponse.success) {
        const updatedEvent = {
          id: eventResponse.data.id,
          name: eventResponse.data.name,
          description: eventResponse.data.description,
          date: eventResponse.data.date,
          roomWidth: eventResponse.data.room_width,
          roomHeight: eventResponse.data.room_height,
          roomVertices: eventResponse.data.metadata?.roomVertices || null,
        };

        const updatedGuests = guestsResponse.data
          .map(normalizeConferenceGuest)
          .filter(Boolean);

        // Load elements from backend
        let updatedElements = [];
        {
          const elementsResponse = await ConferenceAPI.getElements(currentEventId);
          if (elementsResponse.success) {
            const normalizedElements = elementsResponse.data
              .map(normalizeConferenceElement)
              .filter(Boolean);
            const uniqueElementsMap = new Map();
            normalizedElements.forEach(el => {
              if (!uniqueElementsMap.has(el.id)) uniqueElementsMap.set(el.id, el);
            });
            const bySignature = new Map();
            Array.from(uniqueElementsMap.values()).forEach(el => {
              const sig = [
                el.type,
                el.label || '',
                Math.round((Number(el.x) || 0) * 100) / 100,
                Math.round((Number(el.y) || 0) * 100) / 100,
                Math.round((Number(el.width) || 0) * 100) / 100,
                Math.round((Number(el.height) || 0) * 100) / 100,
                Math.round((Number(el.rotation) || 0) % 360),
              ].join('|');
              if (!bySignature.has(sig)) bySignature.set(sig, el);
            });
            updatedElements = Array.from(bySignature.values());
            console.log(`✓ Loaded ${updatedElements.length} elements from backend`);
          }
        }

        setEvent(updatedEvent);
        setGuests(updatedGuests);
        setElements(updatedElements);
        setIsOnline(true);
        console.log('✓ Data loaded from backend API for event:', currentEventId);
      } else {
        console.warn('Failed to load event data from backend');
        // Set a placeholder event to break out of loading state
        setEvent({
          id: currentEventId,
          name: 'Event Not Found',
          description: 'Unable to load event data',
          date: '',
          roomWidth: 24,
          roomHeight: 16,
          roomVertices: null,
        });
        setGuests([]);
        setElements([]);
        setIsOnline(false);
      }
    } catch (error) {
      console.error('Failed to load from backend:', error);
      // Set a placeholder event to break out of loading state
      setEvent({
        id: currentEventId,
        name: 'Error Loading Event',
        description: error.message || 'Failed to connect to backend',
        date: '',
        roomWidth: 24,
        roomHeight: 16,
        roomVertices: null,
      });
      setGuests([]);
      setElements([]);
      setIsOnline(false);
    }
  }, [currentEventId, location.search]);

  // Initialize event ID on mount
  useEffect(() => {
    // Priority: URL parameter > localStorage > show modal
    const params = new URLSearchParams(location.search);
    let eventId = params.get('eventId');

    if (!eventId) {
      eventId = getLastKioskEventId();
    }

    if (eventId) {
      setCurrentEventId(eventId);
      setLastKioskEventId(eventId);
    } else {
      setShowEventSelector(true);
    }
  }, [location.search]);

  // Load data when currentEventId changes
  useEffect(() => {
    if (currentEventId) {
      loadData();

      const interval = setInterval(() => {
        console.log('Auto-refreshing kiosk data...');
        loadData();
      }, REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [currentEventId, loadData]);

  useEffect(() => {
    if (!checkInNotice) return;
    const timer = setTimeout(() => setCheckInNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [checkInNotice]);

  const handleEventSelect = (eventId) => {
    // Clear current data
    setEvent(null);
    setGuests([]);
    setElements([]);
    setSelectedGuest(null);
    setHighlightedElementId(null);

    // Update event ID
    setCurrentEventId(eventId);
    setLastKioskEventId(eventId);

    // Update URL with eventId
    const params = new URLSearchParams(location.search);
    params.set('eventId', eventId);
    const newUrl = `${location.pathname}?${params.toString()}`;
    navigate(newUrl, { replace: true });

    // Close modal
    setShowEventSelector(false);
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showNotice = (type, message) => {
    setCheckInNotice({ type, message });
  };

  const applyGuestPatch = (guestId, patch) => {
    setGuests(prevGuests => {
      const nextGuests = prevGuests.map(g => {
        if (String(g.id) === String(guestId)) {
          return normalizeConferenceGuest({ ...g, ...patch });
        }
        return g;
      });
      // No localStorage - data is only in state and backend
      return nextGuests;
    });

    setSelectedGuest(prev => {
      if (prev && String(prev.id) === String(guestId)) {
        return normalizeConferenceGuest({ ...prev, ...patch });
      }
      return prev;
    });
  };

  const hasGuestBackendIds = (guest) => {
    const eventId = event?.id;
    const guestId = guest?.id;
    return isUuid(eventId) && isUuid(guestId);
  };

  const checkInGuest = async (guest, options = {}) => {
    if (!guest || guest.checkedIn || !hasGuestBackendIds(guest)) {
      if (!guest?.id) {
        showNotice('error', 'This guest has not been synced to the backend yet. Please save and sync before checking in.');
      } else if (!event?.id) {
        showNotice('error', 'No event ID found. Please refresh the page or sync again before checking in.');
      }
      return;
    }

    const guestId = guest.id;
    const silent = options.silent ?? false;

    try {
      let response = await ConferenceAPI.checkInGuest(event.id, guestId);
      let usedPublicEndpoint = false;

      if (!response.success && (response.status === 401 || response.status === 403)) {
        response = await ConferenceAPI.publicGuestCheckIn(event.id, guestId);
        usedPublicEndpoint = true;
      }

      if (!response.success) {
        if (!silent) {
          const fallbackMessage = response.data?.message || response.error || 'Check-in failed. Please try again later.';
          showNotice('error', fallbackMessage);
        }
        return;
      }

      const guestPayload = usedPublicEndpoint ? response.data?.guest : response.data;
      const patch = {
        checkedIn: guestPayload?.checked_in ?? guestPayload?.checkedIn ?? true,
        checkInTime: guestPayload?.check_in_time || guestPayload?.checkInTime || guest.checkInTime || new Date().toISOString(),
      };
      applyGuestPatch(guestId, patch);

      if (!silent) {
        const wasAlreadyChecked = usedPublicEndpoint && response.data?.success === false;
        const message = usedPublicEndpoint
          ? response.data?.message || (wasAlreadyChecked ? `${guest.name} is already checked in.` : `${guest.name} checked in successfully!`)
          : `${guest.name} checked in successfully!`;
        showNotice(wasAlreadyChecked ? 'info' : 'success', message);
      }
    } catch (error) {
      console.error('Guest check-in update failed:', error);
      if (!silent) {
        showNotice('error', 'Failed to update check-in status. Please try again later.');
      }
    }
  };

  const handleSelectGuest = (guest) => {
    setSelectedGuest(guest);
    setSearchTerm('');

    let assignedElement = null;

    if (guest.elementId) {
      assignedElement = elements.find(el => el.id === guest.elementId);
    }

    if (!assignedElement && guest.tableNumber) {
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

  const handleClearSelection = () => {
    setSelectedGuest(null);
    setHighlightedElementId(null);
    setSearchTerm('');
  };

  const handleCheckIn = () => {
    if (!selectedGuest) return;
    if (selectedGuest.checkedIn) {
      showNotice('info', `${selectedGuest.name} is already checked in.`);
      return;
    }
    checkInGuest(selectedGuest);
  };

  const handleQuickGuestCheckIn = (guest) => {
    if (!guest) return;
    if (guest.checkedIn) {
      showNotice('info', `${guest.name} is already checked in.`);
      return;
    }
    checkInGuest(guest);
    handleSelectGuest(guest);
  };

  const selectedGuestCheckInLabel = selectedGuest?.checkInTime
    ? formatDateTime(selectedGuest.checkInTime)
    : null;

  // Always render the modal first, even if event is not loaded
  if (!event) {
    return (
      <>
        <EventSelectorModal
          isOpen={showEventSelector}
          onClose={currentEventId ? () => setShowEventSelector(false) : null}
          onSelectEvent={handleEventSelect}
          mode="conference"
          lastEventId={getLastKioskEventId()}
        />
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">Loading...</div>
            <div className="text-gray-600">Loading conference information</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col bg-gray-100" style={{
      minHeight: 'calc(100vh - 64px)',
      margin: '0 calc(-50vw + 50%)',
      width: '100vw'
    }}>
      <EventSelectorModal
        isOpen={showEventSelector}
        onClose={currentEventId ? () => setShowEventSelector(false) : null}
        onSelectEvent={handleEventSelect}
        mode="conference"
        lastEventId={getLastKioskEventId()}
      />
      
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            {event.description && (
              <p className="text-blue-100 mt-1">{event.description}</p>
            )}
            {event.date && (
              <p className="text-blue-200 text-sm mt-1">Date: {event.date}</p>
            )}
          </div>
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-sm transition-colors"
              title="Share this event"
            >
              <FiShare2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setShowEventSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg font-semibold text-sm transition-colors"
              title="Switch to a different event"
            >
              <FiRepeat className="w-4 h-4" />
              Switch Event
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-4 relative">
        <div className="max-w-2xl mx-auto relative">
          <div className="flex gap-2">
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
          </div>

          {searchTerm && filteredGuests.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredGuests.map(guest => (
                <div
                  key={guest.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectGuest(guest)}
                    className="flex-1 text-left"
                  >
                    <div className="font-semibold text-gray-800">{guest.name}</div>
                    {guest.tableNumber && (
                      <div className="text-sm text-blue-600 mt-1">
                        Table: {guest.tableNumber}
                        {guest.seatNumber && ` - Seat ${guest.seatNumber}`}
                      </div>
                    )}
                    {guest.checkedIn && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        <span>✓</span>
                        <span>Checked In</span>
                      </div>
                    )}
                  </button>
                  {!(hasGuestBackendIds(guest)) && (
                    <div className="px-3 py-2 text-xs text-red-600 bg-red-50 rounded-lg">
                      Sync with backend required
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleQuickGuestCheckIn(guest);
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      guest.checkedIn || !hasGuestBackendIds(guest)
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    disabled={guest.checkedIn || !hasGuestBackendIds(guest)}
                  >
                    {guest.checkedIn ? 'Checked In' : 'Check In'}
                  </button>
                </div>
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

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6">
          <ConferenceCanvas
            key={event.id}
            elements={elements}
            onElementsChange={() => {}}
            roomWidth={event.roomWidth}
            roomHeight={event.roomHeight}
            initialRoomVertices={event.roomVertices}
            selectedElementId={highlightedElementId}
            onSelectElement={() => {}}
            guests={guests}
            readOnly={true}
          />
        </div>

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

              {(selectedGuest.tableNumber || selectedGuest.seatNumber) && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Seat Assignment
                  </label>
                  <div className="text-gray-800">
                    {selectedGuest.tableNumber && (
                      <div>
                        Table: {selectedGuest.tableNumber}
                      </div>
                    )}
                    {selectedGuest.seatNumber && (
                      <div>
                        Seat: {selectedGuest.seatNumber}
                      </div>
                    )}
                  </div>
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
                  {selectedGuest.checkedIn && selectedGuestCheckInLabel && (
                    <div className="mt-2 text-sm text-green-700 text-center">
                      Checked at {selectedGuestCheckInLabel}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={selectedGuest.checkedIn}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                    selectedGuest.checkedIn
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {selectedGuest.checkedIn ? 'Checked In' : 'Check In'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {checkInNotice && (
        <div
          className={`fixed bottom-4 left-4 z-40 max-w-md border-2 rounded-lg shadow-lg p-4 transition-all ${
            checkInNotice.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-800'
              : checkInNotice.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold mb-1">
                {checkInNotice.type === 'success'
                  ? 'Check-in Successful'
                  : checkInNotice.type === 'error'
                  ? 'Check-in Failed'
                  : 'Notice'}
              </h4>
              <p className="text-sm">{checkInNotice.message}</p>
            </div>
            <button
              onClick={() => setCheckInNotice(null)}
              className="flex-shrink-0 text-current hover:opacity-70"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 text-gray-300 px-6 py-3 text-center text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>📍 Conference Information System</span>
          <span>•</span>
          <span>Auto-refresh: Every 10 seconds</span>
          <span>•</span>
          <span className={isOnline ? 'text-green-400' : 'text-yellow-400'}>
            {isOnline ? '🟢 Online' : '🟡 Offline (Cached)'}
          </span>
          <span>•</span>
          <span>Total Guests: {guests.length}</span>
          <span>•</span>
          <span className="text-green-400">
            ✓ Checked In: {guests.filter(g => g.checkedIn).length}
          </span>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        eventId={event?.id}
        onGenerateToken={ConferenceAPI.generateShareToken}
        guests={guests}
      />
    </div>
  );
}

export function TradeshowKiosk() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentEventId, setCurrentEventId] = useState(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [event, setEvent] = useState(null);
  const [booths, setBooths] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [highlightedBoothId, setHighlightedBoothId] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [visitedBoothIds, setVisitedBoothIds] = useState([]);
  const [skippedBoothIds, setSkippedBoothIds] = useState([]);
  const [checkInNotice, setCheckInNotice] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentEventId) {
      console.warn('No eventId available.');
      setIsOnline(false);
      return;
    }

    try {
      // Load data from backend using current event ID
      const eventResponse = await TradeshowAPI.getEvent(currentEventId);
      const vendorsResponse = await TradeshowAPI.getVendors(currentEventId);
      const routesResponse = await TradeshowAPI.getRoutes(currentEventId);
      
      if (eventResponse.success && vendorsResponse.success) {
        const updatedEvent = {
          id: eventResponse.data.id,
          name: eventResponse.data.name,
          description: eventResponse.data.description,
          date: eventResponse.data.date,
          hallWidth: eventResponse.data.hall_width,
          hallHeight: eventResponse.data.hall_height,
          hallVertices: eventResponse.data.metadata?.hallVertices || null,
        };

        const updatedVendors = vendorsResponse.data
          .map(normalizeTradeshowVendor)
          .filter(Boolean);

        // Load booths from backend
        let updatedBooths = [];
        {
          const boothsResponse = await TradeshowAPI.getBooths(currentEventId);
          if (boothsResponse.success) {
            const normalizedBooths = boothsResponse.data
              .map(normalizeTradeshowBooth)
              .filter(Boolean);
            const uniqueBoothsMap = new Map();
            normalizedBooths.forEach(b => {
              if (!uniqueBoothsMap.has(b.id)) uniqueBoothsMap.set(b.id, b);
            });
            const byBoothSignature = new Map();
            Array.from(uniqueBoothsMap.values()).forEach(b => {
              const sig = [
                b.type,
                b.label || '',
                Math.round((Number(b.x) || 0) * 100) / 100,
                Math.round((Number(b.y) || 0) * 100) / 100,
                Math.round((Number(b.width) || 0) * 100) / 100,
                Math.round((Number(b.height) || 0) * 100) / 100,
                Math.round((Number(b.rotation) || 0) % 360),
              ].join('|');
              if (!byBoothSignature.has(sig)) byBoothSignature.set(sig, b);
            });
            updatedBooths = Array.from(byBoothSignature.values());
            console.log(`✓ Loaded ${updatedBooths.length} booths from backend`);
          }
        }

        const updatedRoutes = routesResponse.success ? routesResponse.data.map(route => ({
          id: route.id,
          name: route.name,
          color: route.color || '#3B82F6',
          boothOrder: route.booth_order || [],
        })) : [];

        setEvent(updatedEvent);
        setVendors(updatedVendors);
        setBooths(updatedBooths);
        setRoutes(updatedRoutes);
        setIsOnline(true);
        console.log('✓ Data loaded from backend API for event:', currentEventId);
      } else {
        console.warn('Failed to load event data from backend');
        // Set a placeholder event to break out of loading state
        setEvent({
          id: currentEventId,
          name: 'Event Not Found',
          description: 'Unable to load event data',
          date: '',
          hallWidth: 40,
          hallHeight: 30,
          hallVertices: null,
        });
        setVendors([]);
        setBooths([]);
        setRoutes([]);
        setIsOnline(false);
      }
    } catch (error) {
      console.error('Failed to load from backend:', error);
      // Set a placeholder event to break out of loading state
      setEvent({
        id: currentEventId,
        name: 'Error Loading Event',
        description: error.message || 'Failed to connect to backend',
        date: '',
        hallWidth: 40,
        hallHeight: 30,
        hallVertices: null,
      });
      setVendors([]);
      setBooths([]);
      setRoutes([]);
      setIsOnline(false);
    }
  }, [currentEventId, location.search]);

  // Initialize event ID on mount
  useEffect(() => {
    // Priority: URL parameter > localStorage > show modal
    const params = new URLSearchParams(location.search);
    let eventId = params.get('eventId');

    if (!eventId) {
      eventId = getLastKioskEventId();
    }

    if (eventId) {
      setCurrentEventId(eventId);
      setLastKioskEventId(eventId);
    } else {
      setShowEventSelector(true);
    }
  }, [location.search]);

  // Load data when currentEventId changes
  useEffect(() => {
    if (currentEventId) {
      loadData();

      const interval = setInterval(() => {
        console.log('Auto-refreshing kiosk data...');
        loadData();
      }, REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [currentEventId, loadData]);

  useEffect(() => {
    if (!checkInNotice) return;
    const timer = setTimeout(() => setCheckInNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [checkInNotice]);

  const handleEventSelect = (eventId) => {
    // Clear current data
    setEvent(null);
    setVendors([]);
    setBooths([]);
    setRoutes([]);
    setSelectedVendor(null);
    setHighlightedBoothId(null);
    setActiveRouteId(null);
    setRouteStarted(false);
    setRouteCompleted(false);
    setCurrentRouteIndex(0);
    setVisitedBoothIds([]);
    setSkippedBoothIds([]);

    // Update event ID
    setCurrentEventId(eventId);
    setLastKioskEventId(eventId);

    // Update URL with eventId
    const params = new URLSearchParams(location.search);
    params.set('eventId', eventId);
    const newUrl = `${location.pathname}?${params.toString()}`;
    navigate(newUrl, { replace: true });

    // Close modal
    setShowEventSelector(false);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeRoute = useMemo(
    () => routes.find(route => String(route.id) === String(activeRouteId)),
    [routes, activeRouteId]
  );

  const routeStops = useMemo(() => {
    if (!activeRoute?.boothOrder?.length || booths.length === 0) return [];

    const stops = [];
    activeRoute.boothOrder.forEach((boothId) => {
      const booth = booths.find(b => String(b.id) === String(boothId));
      if (!booth) return;

      const boothIdStr = String(booth.id);
      const boothLabel = booth.label ? String(booth.label) : null;
      const vendor = vendors.find(vendorCandidate => {
        if (!vendorCandidate) return false;
        if (vendorCandidate.boothId && String(vendorCandidate.boothId) === boothIdStr) {
          return true;
        }
        if (boothLabel) {
          const vendorLabel = vendorCandidate.boothNumber ? String(vendorCandidate.boothNumber) : null;
          return vendorLabel === boothLabel;
        }
        return false;
      });

      stops.push({
        booth,
        boothId: boothIdStr,
        vendor,
        step: stops.length + 1,
      });
    });

    return stops;
  }, [activeRoute, booths, vendors]);

  const totalRouteStops = routeStops.length;
  const safeRouteIndex = totalRouteStops === 0 ? 0 : Math.min(currentRouteIndex, totalRouteStops - 1);
  const currentStop = totalRouteStops === 0
    ? null
    : (routeStarted || routeCompleted ? routeStops[safeRouteIndex] : routeStops[0]);
  const nextStop = (() => {
    if (totalRouteStops === 0) return null;
    if (routeStarted) {
      return routeStops[safeRouteIndex + 1] || null;
    }
    if (routeCompleted) {
      return null;
    }
    return routeStops[1] || null;
  })();
  const previousStop = routeStarted && safeRouteIndex > 0 ? routeStops[safeRouteIndex - 1] : null;

  const visitedSet = useMemo(
    () => new Set((visitedBoothIds || []).map(id => String(id))),
    [visitedBoothIds]
  );
  const skippedSet = useMemo(
    () => new Set((skippedBoothIds || []).map(id => String(id))),
    [skippedBoothIds]
  );

  const visitedCount = useMemo(() => {
    if (routeStops.length === 0) return 0;
    let count = 0;
    routeStops.forEach(stop => {
      if (visitedSet.has(stop.boothId)) count += 1;
    });
    return count;
  }, [routeStops, visitedSet]);

  const routeProgressCount = routeCompleted ? totalRouteStops : visitedCount;
  const progressPercent = totalRouteStops === 0
    ? 0
    : Math.min(100, Math.round((routeProgressCount / totalRouteStops) * 100));

  const routeStatusLabel = (() => {
    if (!activeRoute) return 'Select a visit route to begin';
    if (routeCompleted) return 'Route completed';
    if (!routeStarted) return 'Ready to start';
    return `Stop ${safeRouteIndex + 1} of ${totalRouteStops}`;
  })();

  const activeSegmentInfo = routeStarted && currentStop && nextStop
    ? buildGuidanceForStep(currentStop.booth, nextStop.booth)
    : null;
  const activeSegmentSummary = activeSegmentInfo
    ? `${activeSegmentInfo.direction} • ${Math.round(activeSegmentInfo.distance)}m`
    : null;

  const currentStopVendor = currentStop?.vendor || null;
  const upcomingStop = routeStarted ? nextStop : routeStops[0];
  const upcomingVendor = upcomingStop?.vendor || null;

  const formatBoothLabel = (booth) => {
    if (!booth) return 'Unknown Booth';
    return booth.label || `Booth ${booth.id}`;
  };

  useEffect(() => {
    setRouteStarted(false);
    setRouteCompleted(false);
    setCurrentRouteIndex(0);
    setVisitedBoothIds([]);
    setSkippedBoothIds([]);
  }, [activeRouteId]);

  useEffect(() => {
    if (totalRouteStops === 0) {
      if (routeStarted) setRouteStarted(false);
      if (routeCompleted) setRouteCompleted(false);
      if (currentRouteIndex !== 0) setCurrentRouteIndex(0);
      if (visitedBoothIds.length) setVisitedBoothIds([]);
      if (skippedBoothIds.length) setSkippedBoothIds([]);
      return;
    }

    if (currentRouteIndex >= totalRouteStops) {
      setCurrentRouteIndex(totalRouteStops - 1);
    }

    const validIds = new Set(routeStops.map(stop => stop.boothId));
    setVisitedBoothIds(prev => {
      const filtered = prev.filter(id => validIds.has(String(id)));
      return filtered.length === prev.length ? prev : filtered;
    });
    setSkippedBoothIds(prev => {
      const filtered = prev.filter(id => validIds.has(String(id)));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [
    totalRouteStops,
    routeStops,
    routeStarted,
    routeCompleted,
    currentRouteIndex,
    visitedBoothIds.length,
    skippedBoothIds.length,
  ]);

  const showNotice = (type, message) => {
    setCheckInNotice({ type, message });
  };

  const applyVendorPatch = (vendorId, patch) => {
    setVendors(prevVendors => {
      const nextVendors = prevVendors.map(v => {
        if (String(v.id) === String(vendorId)) {
          return normalizeTradeshowVendor({ ...v, ...patch });
        }
        return v;
      });
      // No localStorage - data is only in state and backend
      return nextVendors;
    });

    setSelectedVendor(prev => {
      if (prev && String(prev.id) === String(vendorId)) {
        return normalizeTradeshowVendor({ ...prev, ...patch });
      }
      return prev;
    });
  };

  const hasVendorBackendIds = (vendor) => {
    const eventId = event?.id;
    const vendorId = vendor?.id;
    return isUuid(eventId) && isUuid(vendorId);
  };

  const checkInVendor = async (vendor, options = {}) => {
    if (!vendor || vendor.checkedIn || !hasVendorBackendIds(vendor)) {
      if (!vendor?.id) {
        showNotice('error', 'This vendor has not been synced to the backend yet. Please save and sync before checking in.');
      } else if (!event?.id) {
        showNotice('error', 'No tradeshow ID found. Please refresh the page or sync again before checking in.');
      }
      return;
    }

    const vendorId = vendor.id;
    const silent = options.silent ?? false;

    try {
      let response = await TradeshowAPI.checkInVendor(event.id, vendorId);
      let usedPublicEndpoint = false;

      if (!response.success && (response.status === 401 || response.status === 403)) {
        response = await TradeshowAPI.publicVendorCheckIn(event.id, vendorId);
        usedPublicEndpoint = true;
      }

      if (!response.success) {
        if (!silent) {
          const fallbackMessage = response.data?.message || response.error || 'Check-in failed. Please try again later.';
          showNotice('error', fallbackMessage);
        }
        return;
      }

      const vendorPayload = usedPublicEndpoint ? response.data?.vendor : response.data;
      const patch = {
        checkedIn: vendorPayload?.checked_in ?? vendorPayload?.checkedIn ?? true,
        checkInTime: vendorPayload?.check_in_time || vendorPayload?.checkInTime || vendor.checkInTime || new Date().toISOString(),
      };
      applyVendorPatch(vendorId, patch);

      if (!silent) {
        const wasAlreadyChecked = usedPublicEndpoint && response.data?.success === false;
        const message = usedPublicEndpoint
          ? response.data?.message || (wasAlreadyChecked ? `${vendor.name} is already checked in.` : `${vendor.name} checked in successfully!`)
          : `${vendor.name} checked in successfully!`;
        showNotice(wasAlreadyChecked ? 'info' : 'success', message);
      }
    } catch (error) {
      console.error('Vendor check-in update failed:', error);
      if (!silent) {
        showNotice('error', 'Failed to update check-in status. Please try again later.');
      }
    }
  };

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setSearchTerm('');

    let assignedBooth = null;

    if (vendor.boothId) {
      assignedBooth = booths.find(booth => booth.id === vendor.boothId);
    }

    if (!assignedBooth && vendor.boothNumber) {
      assignedBooth = booths.find(booth =>
        booth.label === vendor.boothNumber ||
        booth.label === String(vendor.boothNumber)
      );
    }

    if (assignedBooth) {
      setHighlightedBoothId(assignedBooth.id);
    } else {
      setHighlightedBoothId(null);
    }
  };

  const handleClearSelection = () => {
    setSelectedVendor(null);
    setHighlightedBoothId(null);
    setSearchTerm('');
  };

  const handleStartRoute = () => {
    if (!totalRouteStops) return;
    setRouteStarted(true);
    setRouteCompleted(false);
    setCurrentRouteIndex(0);
    setVisitedBoothIds([]);
    setSkippedBoothIds([]);
    const firstStop = routeStops[0];
    if (firstStop?.booth?.id) {
      setHighlightedBoothId(firstStop.booth.id);
    }
    if (firstStop?.vendor) {
      setSelectedVendor(firstStop.vendor);
    }
  };

  const handleRestartRoute = () => {
    handleStartRoute();
  };

  const handleAdvanceRoute = () => {
    if (!routeStarted || !currentStop) return;
    const boothId = currentStop.boothId;
    setVisitedBoothIds(prev => (prev.includes(boothId) ? prev : [...prev, boothId]));

    if (currentRouteIndex < totalRouteStops - 1) {
      const nextIndex = currentRouteIndex + 1;
      setCurrentRouteIndex(nextIndex);
      const nextBooth = routeStops[nextIndex]?.booth;
      if (nextBooth?.id) {
        setHighlightedBoothId(nextBooth.id);
      }
      const nextVendor = routeStops[nextIndex]?.vendor;
      if (nextVendor) {
        setSelectedVendor(nextVendor);
      } else {
        setSelectedVendor(null);
      }
    } else {
      setRouteStarted(false);
      setRouteCompleted(true);
      setHighlightedBoothId(null);
      setSelectedVendor(null);
    }
  };

  const handleGoBack = () => {
    if (!routeStarted || currentRouteIndex === 0) return;
    const previousIndex = currentRouteIndex - 1;
    setCurrentRouteIndex(previousIndex);
    const previousBooth = routeStops[previousIndex]?.booth;
    if (previousBooth?.id) {
      setHighlightedBoothId(previousBooth.id);
    }
    const previousVendor = routeStops[previousIndex]?.vendor;
    if (previousVendor) {
      setSelectedVendor(previousVendor);
    } else {
      setSelectedVendor(null);
    }
  };

  const handleSkipCurrent = () => {
    if (!routeStarted || !currentStop) return;
    const boothId = currentStop.boothId;
    setSkippedBoothIds(prev => (prev.includes(boothId) ? prev : [...prev, boothId]));

    if (currentRouteIndex < totalRouteStops - 1) {
      const nextIndex = currentRouteIndex + 1;
      setCurrentRouteIndex(nextIndex);
      const nextBooth = routeStops[nextIndex]?.booth;
      if (nextBooth?.id) {
        setHighlightedBoothId(nextBooth.id);
      }
      const nextVendor = routeStops[nextIndex]?.vendor;
      if (nextVendor) {
        setSelectedVendor(nextVendor);
      } else {
        setSelectedVendor(null);
      }
    } else {
      setRouteStarted(false);
      setRouteCompleted(true);
      setHighlightedBoothId(null);
      setSelectedVendor(null);
    }
  };

  const handleVendorCheckIn = () => {
    if (!selectedVendor) return;
    if (selectedVendor.checkedIn) {
      showNotice('info', `${selectedVendor.name} is already checked in.`);
      return;
    }
    checkInVendor(selectedVendor);
  };

  const handleQuickVendorCheckIn = (vendor) => {
    if (!vendor) return;
    if (vendor.checkedIn) {
      showNotice('info', `${vendor.name} is already checked in.`);
      return;
    }
    checkInVendor(vendor);
    handleSelectVendor(vendor);
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toLocaleString();
  };

  const vendorIdEquals = (a, b) => a && b && String(a.id) === String(b.id);

  const vendorCards = [];
  const addVendorCard = (card) => {
    if (!card?.vendor) return;
    if (vendorCards.some(existing => vendorIdEquals(existing.vendor, card.vendor))) return;
    vendorCards.push(card);
  };

  if (routeStarted) {
    addVendorCard({
      key: currentStop ? `current-${currentStop.boothId}` : 'current',
      title: currentStop ? `Current Stop • ${formatBoothLabel(currentStop.booth)}` : 'Current Stop',
      vendor: currentStopVendor,
      step: currentStop?.step,
      boothLabel: currentStop ? formatBoothLabel(currentStop.booth) : null,
    });

    addVendorCard({
      key: nextStop ? `next-${nextStop.boothId}` : 'next',
      title: nextStop ? `Next Stop • ${formatBoothLabel(nextStop.booth)}` : 'Next Stop',
      vendor: nextStop?.vendor,
      step: nextStop?.step,
      boothLabel: nextStop ? formatBoothLabel(nextStop.booth) : null,
    });
  }

  if (!routeStarted && !routeCompleted) {
    addVendorCard({
      key: upcomingStop ? `first-${upcomingStop.boothId}` : 'first',
      title: upcomingStop ? `First Stop • ${formatBoothLabel(upcomingStop.booth)}` : 'First Stop',
      vendor: upcomingVendor,
      step: upcomingStop?.step || 1,
      boothLabel: upcomingStop ? formatBoothLabel(upcomingStop.booth) : null,
    });
  }

  const validRouteIds = useMemo(() => new Set(routeStops.map(stop => stop.boothId)), [routeStops]);
  const routeStepsForCanvas = useMemo(
    () =>
      routeStops.map(stop => ({
        boothId: stop.boothId,
        step: stop.step,
        booth: stop.booth,
        vendorName: stop.vendor?.name || '',
      })),
    [routeStops]
  );

  const currentRouteBoothIdForCanvas = routeStarted ? currentStop?.boothId || null : null;
  const nextRouteBoothIdForCanvas = routeStarted
    ? nextStop?.boothId || null
    : (!routeStarted && !routeCompleted ? upcomingStop?.boothId || null : null);
  const visitedBoothIdsForCanvas = Array.from(visitedSet).filter(id => validRouteIds.has(id));
  const skippedBoothIdsForCanvas = Array.from(skippedSet).filter(id => validRouteIds.has(id));

  const checkedInCount = vendors.filter(v => v.checkedIn).length;
  const vendorCheckInLabel = selectedVendor ? formatDateTime(selectedVendor.checkInTime) : null;

  // Always render the modal first, even if event is not loaded
  if (!event) {
    return (
      <>
        <EventSelectorModal
          isOpen={showEventSelector}
          onClose={currentEventId ? () => setShowEventSelector(false) : null}
          onSelectEvent={handleEventSelect}
          mode="tradeshow"
          lastEventId={getLastKioskEventId()}
        />
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">Loading...</div>
            <div className="text-gray-600">Loading tradeshow information</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col bg-gray-100" style={{
      minHeight: 'calc(100vh - 64px)',
      margin: '0 calc(-50vw + 50%)',
      width: '100vw'
    }}>
      <EventSelectorModal
        isOpen={showEventSelector}
        onClose={currentEventId ? () => setShowEventSelector(false) : null}
        onSelectEvent={handleEventSelect}
        mode="tradeshow"
        lastEventId={getLastKioskEventId()}
      />
      
      <div className="bg-green-600 text-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            {event.description && (
              <p className="text-green-100 mt-1">{event.description}</p>
            )}
            {event.date && (
              <p className="text-green-200 text-sm mt-1">Date: {event.date}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-green-100 text-sm">
              <span>Total Vendors: {vendors.length}</span>
              <span className="text-green-200">✓ Checked In: {checkedInCount}</span>
            </div>
          </div>
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm transition-colors"
              title="Share this event"
            >
              <FiShare2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setShowEventSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg font-semibold text-sm transition-colors"
              title="Switch to a different event"
            >
              <FiRepeat className="w-4 h-4" />
              Switch Event
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-4 relative">
        <div className="max-w-4xl mx-auto relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendor, contact or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

            {routes.length > 0 && (
              <select
                value={activeRouteId || ''}
                onChange={(e) => setActiveRouteId(e.target.value || null)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">Select Visit Route</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>
                    🛤️ {route.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {searchTerm && filteredVendors.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredVendors.map(vendor => (
                <div
                  key={vendor.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-green-50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectVendor(vendor)}
                    className="flex-1 text-left"
                  >
                    <div className="font-semibold text-gray-800">{vendor.name}</div>
                    {vendor.contactName && (
                      <div className="text-sm text-gray-600">Contact: {vendor.contactName}</div>
                    )}
                    {vendor.category && (
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                          {vendor.category}
                        </span>
                      </div>
                    )}
                    {vendor.checkedIn && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        <span>✓</span>
                        <span>Checked In</span>
                      </div>
                    )}
                    {vendor.boothNumber && (
                      <div className="mt-1 flex items-center gap-1 text-green-600 font-semibold">
                        <FiMapPin className="w-4 h-4" />
                        {vendor.boothNumber}
                      </div>
                    )}
                  </button>
                  {!(hasVendorBackendIds(vendor)) && (
                    <div className="px-3 py-2 text-xs text-red-600 bg-red-50 rounded-lg">
                      Sync with backend required
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleQuickVendorCheckIn(vendor);
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      vendor.checkedIn || !hasVendorBackendIds(vendor)
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    disabled={vendor.checkedIn || !hasVendorBackendIds(vendor)}
                  >
                    {vendor.checkedIn ? 'Checked In' : 'Check In'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchTerm && filteredVendors.length === 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-center text-gray-500">
              No matching vendors found
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6">
          <TradeshowCanvas
            key={event.id}
            booths={booths}
            onBoothsChange={() => {}}
            hallWidth={event.hallWidth}
            hallHeight={event.hallHeight}
            initialHallVertices={event.hallVertices}
            selectedBoothId={highlightedBoothId}
            onSelectBooth={() => {}}
            vendors={vendors}
            routes={routes}
            activeRouteId={activeRouteId}
            routeSteps={routeStepsForCanvas}
            currentRouteBoothId={currentRouteBoothIdForCanvas}
            nextRouteBoothId={nextRouteBoothIdForCanvas}
            visitedBoothIds={visitedBoothIdsForCanvas}
            skippedBoothIds={skippedBoothIdsForCanvas}
            readOnly={true}
          />
        </div>

        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <div className="space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Route Guidance</h2>
                  <div className="text-sm text-gray-500">{routeStatusLabel}</div>
                </div>

                {activeRoute ? (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm text-orange-800 mb-3">
                        <span>{activeRoute.name}</span>
                        <span>{totalRouteStops} stops</span>
                      </div>
                      <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-orange-700 mt-2">{progressPercent}% complete</div>
                    </div>

                    {routeStarted && currentStop ? (
                      <div className="space-y-3">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Current Stop
                          </div>
                          <div className="text-lg font-bold text-gray-800">
                            Stop {currentStop.step}: {formatBoothLabel(currentStop.booth)}
                          </div>
                          {currentStopVendor && (
                            <div className="text-sm text-gray-600 mt-1">{currentStopVendor.name}</div>
                          )}
                          {previousStop && (
                            <div className="text-xs text-gray-500 mt-2">
                              Previous: {formatBoothLabel(previousStop.booth)}
                            </div>
                          )}
                        </div>

                        {nextStop ? (
                          <div className="p-4 border border-dashed border-green-300 rounded-lg bg-green-50">
                            <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
                              Next Stop
                            </div>
                            <div className="text-base font-semibold text-green-700">
                              Stop {nextStop.step}: {formatBoothLabel(nextStop.booth)}
                            </div>
                            {nextStop.vendor && (
                              <div className="text-sm text-green-700 mt-1">{nextStop.vendor.name}</div>
                            )}
                            {activeSegmentSummary && (
                              <div className="text-xs text-green-600 mt-2">
                                Direction: {activeSegmentSummary}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 border border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-700">
                            <div className="text-sm font-semibold">This is the final stop.</div>
                            <div className="text-xs mt-1">Tap Complete to finish the route.</div>
                          </div>
                        )}
                      </div>
                    ) : routeCompleted ? (
                      <div className="p-4 border border-green-300 rounded-lg bg-green-50 text-green-700 space-y-2">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <FiCheckCircle className="w-5 h-5" />
                          Route complete!
                        </div>
                        <div className="text-sm">
                          You visited {visitedBoothIdsForCanvas.length} of {totalRouteStops} planned stops
                          {skippedBoothIdsForCanvas.length
                            ? ` and skipped ${skippedBoothIdsForCanvas.length}.`
                            : '.'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700">
                          Ready to guide visitors
                        </div>
                        {routeStops[0] ? (
                          <div className="text-xs text-gray-500 mt-2">
                            First stop: {formatBoothLabel(routeStops[0].booth)}
                            {routeStops[0].vendor ? ` • ${routeStops[0].vendor.name}` : ''}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-2">
                            No booths assigned to this route yet.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {!routeStarted && !routeCompleted && (
                        <button
                          onClick={handleStartRoute}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <FiPlayCircle className="w-5 h-5" />
                          Start Route
                        </button>
                      )}
                      {routeStarted && (
                        <>
                          <button
                            onClick={handleGoBack}
                            disabled={currentRouteIndex === 0}
                            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiCornerUpLeft className="w-4 h-4" />
                            Back
                          </button>
                          <button
                            onClick={handleSkipCurrent}
                            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2 border border-yellow-400 bg-yellow-100 rounded-lg text-yellow-800 hover:bg-yellow-200"
                          >
                            <FiSkipForward className="w-4 h-4" />
                            Skip
                          </button>
                          <button
                            onClick={handleAdvanceRoute}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FiArrowRightCircle className="w-5 h-5" />
                            {nextStop ? 'Next Stop' : 'Complete Route'}
                          </button>
                        </>
                      )}
                      {routeCompleted && (
                        <button
                          onClick={handleRestartRoute}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-orange-400 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <FiRotateCcw className="w-5 h-5" />
                          Restart Route
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600">
                    Select a predefined route from the dropdown to unlock full guidance.
                  </div>
                )}
              </div>
            </div>

            {vendorCards.length > 0 && (
              <div className="space-y-4">
                {vendorCards.map(card => {
                  const canCheckIn = hasVendorBackendIds(card.vendor) && !card.vendor.checkedIn;
                  return (
                    <div key={card.key} className="border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {card.title}
                      </div>
                      <div className="text-lg font-bold text-gray-800">{card.vendor.name}</div>
                      {card.step && (
                        <div className="text-xs text-gray-500 mt-1">Stop {card.step}</div>
                      )}
                      {card.boothLabel && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                          <FiMapPin className="w-5 h-5" />
                          <span className="text-sm font-semibold">{card.boothLabel}</span>
                        </div>
                      )}
                      {card.vendor.checkedIn && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          <span>✓</span>
                          <span>Checked In</span>
                        </div>
                      )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectVendor(card.vendor)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleQuickVendorCheckIn(card.vendor);
                          }}
                          disabled={!canCheckIn}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            canCheckIn
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {card.vendor.checkedIn ? 'Checked In' : 'Check In'}
                    </button>
                  </div>
                  {!hasVendorBackendIds(card.vendor) && (
                    <div className="mt-2 text-xs text-red-600">
                      Sync with backend required before check-in.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

            {selectedVendor ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Vendor Information</h2>
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
                      Company Name
                    </label>
                    <div className="text-lg font-semibold text-gray-800">
                      {selectedVendor.name}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        selectedVendor.checkedIn
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <FiCheckCircle
                            className={`w-6 h-6 ${
                              selectedVendor.checkedIn ? 'text-green-600' : 'text-gray-400'
                            }`}
                          />
                          <div>
                            <div
                              className={`text-lg font-semibold ${
                                selectedVendor.checkedIn ? 'text-green-700' : 'text-gray-600'
                              }`}
                            >
                              {selectedVendor.checkedIn ? 'Checked In' : 'Not Checked In'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedVendor.checkedIn && vendorCheckInLabel
                                ? `Checked at ${vendorCheckInLabel}`
                                : selectedVendor.checkedIn
                                ? 'Checked in earlier'
                                : 'Awaiting check-in'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleVendorCheckIn}
                      disabled={selectedVendor.checkedIn || !hasVendorBackendIds(selectedVendor)}
                      className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
                        selectedVendor.checkedIn || !hasVendorBackendIds(selectedVendor)
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {selectedVendor.checkedIn ? 'Checked In' : 'Check In'}
                    </button>
                    {!hasVendorBackendIds(selectedVendor) && (
                      <div className="text-xs text-red-600 mt-2">
                        Sync with backend required before check-in.
                      </div>
                    )}
                  </div>

                  {selectedVendor.boothNumber && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        Booth Location
                      </div>
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-6 h-6 text-green-600" />
                        <div className="text-2xl font-bold text-green-600">
                          {selectedVendor.boothNumber}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedVendor.contactName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Contact Person
                      </label>
                      <div className="text-gray-800">{selectedVendor.contactName}</div>
                    </div>
                  )}

                  {selectedVendor.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Email
                      </label>
                      <div className="text-gray-800">{selectedVendor.email}</div>
                    </div>
                  )}

                  {selectedVendor.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Phone
                      </label>
                      <div className="text-gray-800">📞 {selectedVendor.phone}</div>
                    </div>
                  )}

                  {selectedVendor.category && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Category
                      </label>
                      <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {selectedVendor.category}
                      </div>
                    </div>
                  )}

                  {selectedVendor.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Notes
                      </label>
                      <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedVendor.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500">
                Select a vendor to view full details and check-in controls.
              </div>
            )}
          </div>
        </div>
      </div>

      {checkInNotice && (
        <div
          className={`fixed bottom-4 left-4 z-40 max-w-md border-2 rounded-lg shadow-lg p-4 transition-all ${
            checkInNotice.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-800'
              : checkInNotice.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold mb-1">
                {checkInNotice.type === 'success'
                  ? 'Check-in Success'
                  : checkInNotice.type === 'error'
                  ? 'Check-in Failed'
                  : 'Notice'}
              </h4>
              <p className="text-sm">{checkInNotice.message}</p>
            </div>
            <button
              onClick={() => setCheckInNotice(null)}
              className="flex-shrink-0 text-current hover:opacity-70"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 text-gray-300 px-6 py-3 text-center text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>🏢 Tradeshow Information System</span>
          <span>•</span>
          <span>Auto-refresh: Every 10 seconds</span>
          <span>•</span>
          <span className={isOnline ? 'text-green-400' : 'text-yellow-400'}>
            {isOnline ? '🟢 Online' : '🟡 Offline (Cached)'}
          </span>
          <span>•</span>
          <span>Total Vendors: {vendors.length}</span>
          <span>•</span>
          <span>Total Booths: {booths.length}</span>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        eventId={event?.id}
        onGenerateToken={TradeshowAPI.generateShareToken}
        guests={vendors}
        mode="tradeshow"
      />
    </div>
  );
}
