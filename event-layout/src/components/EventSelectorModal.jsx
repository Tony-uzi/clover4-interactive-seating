// EventSelectorModal.jsx - Modal for selecting event ID in Kiosk mode
import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiRefreshCw } from 'react-icons/fi';
import * as ConferenceAPI from '../server-actions/conference-planner';
import * as TradeshowAPI from '../server-actions/tradeshow-planner';

export default function EventSelectorModal({ 
  isOpen, 
  onClose, 
  onSelectEvent, 
  mode = 'conference',
  lastEventId = null 
}) {
  const [manualEventId, setManualEventId] = useState(lastEventId || '');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(lastEventId || '');
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState('');

  // Load available events from API
  useEffect(() => {
    if (isOpen) {
      loadAvailableEvents();
    }
  }, [isOpen, mode]);

  const loadAvailableEvents = async () => {
    setLoadingEvents(true);
    setError('');
    try {
      const API = mode === 'conference' ? ConferenceAPI : TradeshowAPI;
      const response = await API.getAllEvents();
      
      if (response.success && Array.isArray(response.data)) {
        setAvailableEvents(response.data);
      } else {
        console.warn('Failed to load events:', response.error);
        setAvailableEvents([]);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setAvailableEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleConnect = () => {
    const eventIdToUse = selectedEventId || manualEventId;

    if (!eventIdToUse || !eventIdToUse.trim()) {
      setError('Please enter or select an Event ID');
      return;
    }

    setError('');
    setLoading(true);

    // Call the parent callback with the selected event ID
    onSelectEvent(eventIdToUse.trim());
  };

  const handleEventSelect = (event) => {
    setSelectedEventId(event.id);
    setManualEventId(event.id);
    setError('');
  };

  const handleManualInputChange = (e) => {
    const value = e.target.value;
    setManualEventId(value);
    setSelectedEventId(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 ${
          mode === 'conference' ? 'bg-blue-50' : 'bg-green-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Select {mode === 'conference' ? 'Conference' : 'Tradeshow'} Event
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose an event from the list or enter an Event ID manually
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Manual Event ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Event ID
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={manualEventId}
                onChange={handleManualInputChange}
                placeholder="Enter event UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Available Events List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Or Select from Available Events
              </label>
              <button
                onClick={loadAvailableEvents}
                disabled={loadingEvents}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FiRefreshCw className={`w-4 h-4 ${loadingEvents ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingEvents ? (
              <div className="text-center py-8 text-gray-500">
                <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading events...</p>
              </div>
            ) : availableEvents.length > 0 ? (
              <div className="border-2 border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {availableEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                      selectedEventId === event.id
                        ? mode === 'conference'
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'bg-green-50 border-l-4 border-l-green-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{event.name}</div>
                    {event.description && (
                      <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                    )}
                    {event.date && (
                      <div className="text-xs text-gray-500 mt-1">
                        📅 {event.date}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1 font-mono">
                      ID: {event.id}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-gray-200 rounded-lg">
                <p>No events available</p>
                <p className="text-sm mt-1">Please enter an Event ID manually above</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Last Used Event ID Hint */}
          {lastEventId && !manualEventId && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
              <p>
                💡 <strong>Tip:</strong> Last used Event ID: <code className="font-mono bg-blue-100 px-2 py-1 rounded">{lastEventId}</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          {onClose && (
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConnect}
            disabled={loading || (!selectedEventId && !manualEventId)}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'conference'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <FiRefreshCw className="w-5 h-5 animate-spin" />
                Connecting...
              </span>
            ) : (
              'Connect to Event'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


