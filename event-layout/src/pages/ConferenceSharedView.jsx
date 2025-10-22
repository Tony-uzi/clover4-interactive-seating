// Public shared view of conference layout with dietary filters

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ConferenceCanvas from '../components/conference/ConferenceCanvas';
import { FiEye, FiFilter } from 'react-icons/fi';
import { normalizeConferenceElement, normalizeConferenceGuest } from '../lib/utils/normalizers';

export default function ConferenceSharedView() {
  const { shareToken } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [allElements, setAllElements] = useState([]);
  const [filteredElements, setFilteredElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    loadSharedData();
  }, [shareToken]);

  useEffect(() => {
    // Parse filters from URL query params
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    if (filterParam) {
      setActiveFilters(filterParam.split(',').map(f => f.trim().toLowerCase()));
    }
  }, [location.search]);

  useEffect(() => {
    // Apply filters when filters or data change
    if (allElements.length > 0) {
      applyFilters();
    }
  }, [activeFilters, allElements, guests]);

  const loadSharedData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/conference/share/${shareToken}/`);
      
      if (!response.ok) {
        throw new Error('Failed to load shared event data');
      }
      
      const data = await response.json();

      // Normalize elements and guests from backend format
      const normalizedElements = (data.elements || [])
        .map(normalizeConferenceElement)
        .filter(Boolean);

      const normalizedGuests = (data.guests || [])
        .map(normalizeConferenceGuest)
        .filter(Boolean);

      setEvent(data.event);
      setAllElements(normalizedElements);
      setGuests(normalizedGuests);
    } catch (err) {
      console.error('Error loading shared data:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (activeFilters.length === 0) {
      // No filters, show all elements
      setFilteredElements(allElements);
      return;
    }

    // Get all guests that match the dietary filters
    const matchingGuests = guests.filter(guest => {
      // Try multiple field name variations for dietary preferences
      const dietary = (
        guest.dietaryPreference ||
        guest.dietary_preference ||
        guest.dietary_requirements ||
        ''
      ).toLowerCase().trim();

      return activeFilters.some(filter => {
        const filterLower = filter.toLowerCase().trim();
        if (filterLower === 'none') {
          return dietary === '' || dietary === 'none';
        }
        return dietary.includes(filterLower);
      });
    });

    // Get element IDs that have matching guests assigned
    const matchingElementIds = new Set();
    matchingGuests.forEach(guest => {
      // Check both elementId and seat_info for element assignment
      let elementId = guest.elementId || guest.element_id;

      // Also check seat_info if available
      if (!elementId && guest.seat_info) {
        elementId = guest.seat_info.element_id;
      }

      if (elementId) {
        matchingElementIds.add(String(elementId));
      }
    });

    // Filter elements to show only:
    // 1. Tables/chairs that have matching guests
    // 2. Non-seating elements (doors, outlets, podium, etc.) for context
    const filtered = allElements.filter(element => {
      const type = (element.type || element.element_type || '').toLowerCase();
      const isSeatingElement =
        type.includes('table') ||
        type === 'chair' ||
        type === 'seat';

      if (isSeatingElement) {
        // Only show seating elements that have matching guests
        return matchingElementIds.has(String(element.id));
      }

      // Show non-seating elements for context (doors, outlets, stage, etc.)
      return true;
    });

    setFilteredElements(filtered);
  };

  const getFilterDisplayText = () => {
    if (activeFilters.length === 0) {
      return 'All Guests';
    }
    return activeFilters
      .map(f => f.charAt(0).toUpperCase() + f.slice(1))
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Failed to Load Event</h2>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-4">
              The link may be invalid or the event may have been deleted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FiEye className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">{event.name}</h1>
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
            {event.date && (
              <p className="text-sm text-gray-500 mt-1">
                {new Date(event.date).toLocaleDateString()}
              </p>
            )}
          </div>
          
          {/* Filter Badge */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <FiFilter className="w-4 h-4 text-blue-600" />
              <div className="text-sm">
                <span className="font-semibold text-blue-900">Filtered View:</span>
                <span className="ml-2 text-blue-700">{getFilterDisplayText()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs font-bold">i</span>
            </div>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Read-Only Shared View</p>
            <p className="text-blue-700 mt-1">
              {activeFilters.length === 0 
                ? 'Displaying all tables and assigned guests.'
                : `Displaying only tables with guests matching: ${getFilterDisplayText()}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <ConferenceCanvas
          elements={filteredElements}
          guests={guests}
          selectedElementId={null}
          onSelectElement={() => {}} // Read-only
          onUpdateElement={() => {}} // Read-only
          onDeleteElement={() => {}} // Read-only
          onDuplicateElement={() => {}} // Read-only
          onElementsChange={() => {}} // Read-only
          onGuestDrop={() => {}} // Read-only
          draggingGuestId={null}
          roomWidth={event.room_width || event.roomWidth}
          roomHeight={event.room_height || event.roomHeight}
          readOnly={true}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {filteredElements.filter(e => e.type === 'table').length} tables
            {activeFilters.length > 0 && ` (filtered from ${allElements.filter(e => e.type === 'table').length} total)`}
          </div>
          <div>
            {guests.filter(g => {
              const dietary = (
                g.dietaryPreference ||
                g.dietary_preference ||
                g.dietary_requirements ||
                ''
              ).toLowerCase().trim();
              if (activeFilters.length === 0) return true;
              return activeFilters.some(filter => {
                const filterLower = filter.toLowerCase().trim();
                if (filterLower === 'none') return dietary === '' || dietary === 'none';
                return dietary.includes(filterLower);
              });
            }).length} guests
            {activeFilters.length > 0 && ` (filtered from ${guests.length} total)`}
          </div>
        </div>
      </div>
    </div>
  );
}

