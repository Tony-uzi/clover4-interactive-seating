// Unified Kiosk Mode - Combines Conference and Tradeshow kiosks with mode toggle

import React, { useState, useEffect, useCallback } from 'react';
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

const REFRESH_INTERVAL = 60000; // 60 seconds
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

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
        showNotice('error', '此嘉宾尚未同步到后台，无法签到。请先保存并同步。');
      } else if (!event?.id) {
        showNotice('error', '未找到活动编号，无法签到。请刷新页面或重新同步。');
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
          const fallbackMessage = response.data?.message || response.error || '签到失败，请稍后重试。';
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
          ? response.data?.message || (wasAlreadyChecked ? `${guest.name} 已经签到。` : `${guest.name} 签到成功！`)
          : `${guest.name} 签到成功！`;
        showNotice(wasAlreadyChecked ? 'info' : 'success', message);
      }
    } catch (error) {
      console.error('Guest check-in update failed:', error);
      if (!silent) {
        showNotice('error', '签到更新失败，请稍后再试。');
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
      showNotice('info', `${selectedGuest.name} 已经签到。`);
      return;
    }
    checkInGuest(selectedGuest);
  };

  const handleQuickGuestCheckIn = (guest) => {
    if (!guest) return;
    if (guest.checkedIn) {
      showNotice('info', `${guest.name} 已经签到。`);
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
                      需先同步到后台
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
                    {guest.checkedIn ? '已签到' : 'Check In'}
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
                  ? '签到成功'
                  : checkInNotice.type === 'error'
                  ? '签到失败'
                  : '提示'}
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
          <span>Auto-refresh: Every 60 seconds</span>
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
          color: route.color,
          boothIds: route.booth_ids || [],
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
        showNotice('error', '此展商尚未同步到后台，无法签到。');
      } else if (!event?.id) {
        showNotice('error', '未找到展会编号，无法签到。');
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
          const fallbackMessage = response.data?.message || response.error || '签到失败，请稍后重试。';
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
          ? response.data?.message || (wasAlreadyChecked ? `${vendor.name} 已经签到。` : `${vendor.name} 签到成功！`)
          : `${vendor.name} 签到成功！`;
        showNotice(wasAlreadyChecked ? 'info' : 'success', message);
      }
    } catch (error) {
      console.error('Vendor check-in update failed:', error);
      if (!silent) {
        showNotice('error', '签到更新失败，请稍后再试。');
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

  const handleVendorCheckIn = () => {
    if (!selectedVendor) return;
    if (selectedVendor.checkedIn) {
      showNotice('info', `${selectedVendor.name} 已经签到。`);
      return;
    }
    checkInVendor(selectedVendor);
  };

  const handleQuickVendorCheckIn = (vendor) => {
    if (!vendor) return;
    if (vendor.checkedIn) {
      showNotice('info', `${vendor.name} 已经签到。`);
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
                onChange={(e) => setActiveRouteId(e.target.value ? parseInt(e.target.value, 10) : null)}
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
                      需先同步到后台
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
                    {vendor.checkedIn ? '已签到' : 'Check In'}
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
            selectedBoothId={highlightedBoothId}
            onSelectBooth={() => {}}
            vendors={vendors}
            routes={routes}
            activeRouteId={activeRouteId}
            readOnly={true}
          />
        </div>

        {selectedVendor && (
          <div className="w-96 bg-white border-l border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Vendor Information</h2>
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
                  disabled={selectedVendor.checkedIn}
                  className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
                    selectedVendor.checkedIn
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {selectedVendor.checkedIn ? 'Checked In' : 'Check In'}
                </button>
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
          <span>Auto-refresh: Every 60 seconds</span>
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
        onGenerateToken={TradeshowAPI.generateShareToken || ConferenceAPI.generateShareToken}
        guests={vendors}
      />
    </div>
  );
}
