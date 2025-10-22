import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiCalendar, FiGrid, FiEdit3, FiTrash2,
  FiFolder, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import * as ConferenceAPI from '../server-actions/conference-planner';
import * as TradeshowAPI from '../server-actions/tradeshow-planner';

export default function Profile() {
  const navigate = useNavigate();
  const [events, setEvents] = useState({ loading: false, conferenceEvents: [], tradeshowEvents: [], error: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setEvents((s) => ({ ...s, loading: true }));

        // Load conference events
        const confResp = await ConferenceAPI.getAllEvents();
        const conferenceEvents = confResp.success ? confResp.data : [];

        // Load tradeshow events
        const tradeResp = await TradeshowAPI.getAllEvents();
        const tradeshowEvents = tradeResp.success ? tradeResp.data : [];

        if (mounted) {
          setEvents({
            loading: false,
            conferenceEvents,
            tradeshowEvents,
            error: ""
          });
        }
      } catch (e) {
        if (mounted) {
          setEvents({
            loading: false,
            conferenceEvents: [],
            tradeshowEvents: [],
            error: e.message || "Failed to load events"
          });
        }
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleDeleteConferenceEvent = async (eventId, eventName) => {
    if (!confirm(`Delete event "${eventName}"? This cannot be undone.`)) return;

    try {
      const resp = await ConferenceAPI.deleteEvent(eventId);
      if (resp.success) {
        setEvents(prev => ({
          ...prev,
          conferenceEvents: prev.conferenceEvents.filter(e => e.id !== eventId)
        }));
        alert('Event deleted successfully');
      } else {
        alert(`Failed to delete event: ${resp.error}`);
      }
    } catch (e) {
      alert(`Error deleting event: ${e.message}`);
    }
  };

  const handleDeleteTradeshowEvent = async (eventId, eventName) => {
    if (!confirm(`Delete event "${eventName}"? This cannot be undone.`)) return;

    try {
      const resp = await TradeshowAPI.deleteEvent(eventId);
      if (resp.success) {
        setEvents(prev => ({
          ...prev,
          tradeshowEvents: prev.tradeshowEvents.filter(e => e.id !== eventId)
        }));
        alert('Event deleted successfully');
      } else {
        alert(`Failed to delete event: ${resp.error}`);
      }
    } catch (e) {
      alert(`Error deleting event: ${e.message}`);
    }
  };

  const totalEvents = events.conferenceEvents.length + events.tradeshowEvents.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
              <FiUser className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          </div>
          <p className="text-lg text-gray-600 ml-16">
            Manage your saved events and layouts
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiFolder className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {events.loading ? "..." : totalEvents}
                </div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCalendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {events.loading ? "..." : events.conferenceEvents.length}
                </div>
                <div className="text-sm text-gray-600">Conference Events</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiGrid className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {events.loading ? "..." : events.tradeshowEvents.length}
                </div>
                <div className="text-sm text-gray-600">Tradeshow Events</div>
              </div>
            </div>
          </div>
        </div>

        {/* Conference Events Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiCalendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Conference Events</h2>
          </div>

          {events.loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border-2 border-gray-100">
              <FiLoader className="w-8 h-8 text-blue-600 animate-spin mr-3" />
              <span className="text-gray-600">Loading events...</span>
            </div>
          ) : events.error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
              <FiAlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <p className="text-red-800 font-semibold">{events.error}</p>
            </div>
          ) : events.conferenceEvents.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">No conference events yet</p>
              <button
                onClick={() => navigate('/conference')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Your First Conference Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.conferenceEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {event.name}
                      </h3>
                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {event.event_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <FiCalendar className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <FiGrid className="w-4 h-4" />
                    <span>{event.room_width}m × {event.room_height}m</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/conference?eventId=${event.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEdit3 className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => handleDeleteConferenceEvent(event.id, event.name)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tradeshow Events Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FiGrid className="w-5 h-5 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tradeshow Events</h2>
          </div>

          {events.loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border-2 border-gray-100">
              <FiLoader className="w-8 h-8 text-purple-600 animate-spin mr-3" />
              <span className="text-gray-600">Loading events...</span>
            </div>
          ) : events.tradeshowEvents.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <FiGrid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">No tradeshow events yet</p>
              <button
                onClick={() => navigate('/tradeshow')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Create Your First Tradeshow Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.tradeshowEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {event.name}
                      </h3>
                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {event.event_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <FiCalendar className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <FiGrid className="w-4 h-4" />
                    <span>{event.hall_width}m × {event.hall_height}m</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/tradeshow?eventId=${event.id}`)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEdit3 className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => handleDeleteTradeshowEvent(event.id, event.name)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
