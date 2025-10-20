/**
 * Conference Live Display - Large Screen View
 * 
 * Purpose: Read-only display for large screens/TVs at event venue
 * Shows: Real-time layout, check-in statistics, guest distribution
 * 
 * Use case: Mount on wall/TV to show live event status
 */

import React, { useState, useEffect } from 'react';
import { FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';
import ConferenceCanvas from '../components/conference/ConferenceCanvas';
import {
  loadConferenceEvent,
  loadConferenceLayout,
  loadConferenceGuests,
  loadConferenceGroups,
} from '../lib/utils/storage';
import { useWebSocket } from '../lib/hooks/useWebSocket';
import * as ConferenceAPI from '../server-actions/conference-planner';

// Helper function to normalize group data
const normalizeGroup = (group) => ({
  id: group.id,
  name: group.name,
  color: group.color,
  isSystem: group.is_system || false,
});

export default function ConferenceLiveDisplay() {
  const [event, setEvent] = useState(null);
  const [elements, setElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

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

        // Load groups
        const groupsResult = await ConferenceAPI.getAllGroups(apiEvent.id);
        if (groupsResult.success) {
          setGroups(groupsResult.data.map(normalizeGroup));
        }
      } else {
        // Fallback to localStorage
        const loadedEvent = loadConferenceEvent();
        const loadedLayout = loadConferenceLayout();
        const loadedGuests = loadConferenceGuests();
        const loadedGroups = loadConferenceGroups();

        setEvent(loadedEvent);
        setElements(loadedLayout);
        setGuests(loadedGuests);
        setGroups(loadedGroups);
      }
    } catch (error) {
      console.error('Error loading from API, using localStorage:', error);
      // Fallback to localStorage
      const loadedEvent = loadConferenceEvent();
      const loadedLayout = loadConferenceLayout();
      const loadedGuests = loadConferenceGuests();
      const loadedGroups = loadConferenceGroups();

      setEvent(loadedEvent);
      setElements(loadedLayout);
      setGuests(loadedGuests);
      setGroups(loadedGroups);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket for real-time updates
  useWebSocket('conference', event?.id || 'default', {
    element_update: () => {
      console.log('Layout updated via WebSocket');
      loadData();
    },
    guest_update: () => {
      console.log('Guest data updated via WebSocket');
      loadData();
    },
    event_update: () => {
      console.log('Event updated via WebSocket');
      loadData();
    },
  });

  // Calculate statistics
  const totalGuests = guests.length;
  const checkedInCount = guests.filter(g => g.checkedIn).length;
  const notCheckedInCount = totalGuests - checkedInCount;
  const checkInRate = totalGuests > 0 ? ((checkedInCount / totalGuests) * 100).toFixed(1) : 0;

  // Group statistics
  const groupCounts = groups.map(group => ({
    name: group.name,
    color: group.color,
    count: guests.filter(g => g.group === group.name).length,
  })).filter(g => g.count > 0);

  // Table occupancy
  const tableElements = elements.filter(el => 
    el.type === 'round-table' || el.type === 'rect-table'
  );
  const totalCapacity = tableElements.reduce((sum, el) => sum + (el.capacity || 8), 0);
  const assignedSeats = guests.filter(g => g.elementId || g.tableNumber).length;
  const occupancyRate = totalCapacity > 0 ? ((assignedSeats / totalCapacity) * 100).toFixed(1) : 0;

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="text-center">
          <div className="text-3xl font-bold mb-4">Loading Event Display...</div>
          <div className="text-lg opacity-75">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white flex flex-col">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-xl border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Event Title */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
            {event.description && (
              <p className="text-xl text-blue-200">{event.description}</p>
            )}
            {event.date && (
              <p className="text-lg text-blue-300 mt-1">
                📅 {new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>

          {/* Clock */}
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
            <div className="text-xl text-blue-200 mt-1">
              {currentTime.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="px-8 py-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="grid grid-cols-4 gap-6">
          {/* Total Guests */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-blue-500/30 p-3 rounded-xl">
                <FiUsers className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-blue-200 font-medium">Total Guests</div>
                <div className="text-sm text-blue-300">Registered</div>
              </div>
            </div>
            <div className="text-5xl font-bold">{totalGuests}</div>
          </div>

          {/* Checked In */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-green-500/30 p-3 rounded-xl">
                <FiCheckCircle className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-green-200 font-medium">Checked In</div>
                <div className="text-sm text-green-300">{checkInRate}% Complete</div>
              </div>
            </div>
            <div className="text-5xl font-bold text-green-400">{checkedInCount}</div>
          </div>

          {/* Pending */}
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-orange-500/30 p-3 rounded-xl">
                <FiClock className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-orange-200 font-medium">Pending</div>
                <div className="text-sm text-orange-300">Not Checked In</div>
              </div>
            </div>
            <div className="text-5xl font-bold text-orange-400">{notCheckedInCount}</div>
          </div>

          {/* Occupancy */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-purple-500/30 p-3 rounded-xl">
                <span className="text-3xl">🪑</span>
              </div>
              <div>
                <div className="text-sm text-purple-200 font-medium">Seat Occupancy</div>
                <div className="text-sm text-purple-300">{assignedSeats}/{totalCapacity} seats</div>
              </div>
            </div>
            <div className="text-5xl font-bold text-purple-400">{occupancyRate}%</div>
          </div>
        </div>
      </div>

      {/* Main Content - Canvas and Seating Chart */}
      <div className="flex-1 flex gap-6 p-8 overflow-hidden">
        {/* Canvas - Shows tables with guest names */}
        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 overflow-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-white">Seating Chart</h2>
            <p className="text-lg text-blue-200">Guest names are displayed on tables</p>
          </div>
          <ConferenceCanvas
            elements={elements}
            onElementsChange={() => {}} // Read-only
            roomWidth={event.roomWidth}
            roomHeight={event.roomHeight}
            selectedElementId={null}
            onSelectElement={() => {}} // Read-only
            guests={guests}
            readOnly={true}
          />
        </div>

        {/* Side Panel - Groups */}
        <div className="w-96 space-y-6">
          {/* Group Distribution */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-2xl font-bold mb-4">Group Distribution</h3>
            <div className="space-y-3">
              {groupCounts.map((group) => (
                <div
                  key={group.name}
                  className="bg-black/20 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-semibold text-lg">{group.name}</span>
                    </div>
                    <span className="text-3xl font-bold">{group.count}</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: group.color,
                        width: `${(group.count / totalGuests) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-2xl font-bold mb-4">Recent Check-ins</h3>
            <div className="space-y-2">
              {guests
                .filter(g => g.checkedIn)
                .slice(-5)
                .reverse()
                .map((guest) => (
                  <div
                    key={guest.id}
                    className="bg-black/20 rounded-lg p-3 border border-green-500/30 flex items-center gap-3"
                  >
                    <FiCheckCircle className="w-5 h-5 text-green-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{guest.name}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {guest.tableNumber ? `Table ${guest.tableNumber}` : 'No seat assigned'}
                      </div>
                    </div>
                  </div>
                ))}
              {guests.filter(g => g.checkedIn).length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No check-ins yet
                </div>
              )}
            </div>
          </div>

          {/* Live Indicator */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl border border-green-400/30 p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xl font-bold">LIVE</span>
            </div>
            <p className="text-sm text-green-200">
              Updates automatically in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Footer with Navigation */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 px-8 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.location.href = '/kiosk'}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              ← Back to Kiosk Home
            </button>
            <span>📍 Clover Events Management System</span>
            <span>•</span>
            <span>Real-Time Display Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>System Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
