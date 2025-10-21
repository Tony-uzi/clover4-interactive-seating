// Kiosk mode for Event Schedule/Agenda (read-only display with time-based organization)

import React, { useState, useEffect } from 'react';
import { FiClock, FiMapPin, FiUser, FiCalendar } from 'react-icons/fi';

const REFRESH_INTERVAL = 60000; // 60 seconds

export default function KioskSchedule() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('all');
  const [isOnline] = useState(true);

  // Sample schedule data - in production, this would come from backend API
  const [scheduleData] = useState({
    eventName: 'Tech Innovation Conference 2025',
    eventDescription: 'Annual gathering of technology leaders and innovators',
    dates: ['2025-03-15', '2025-03-16', '2025-03-17'],
    sessions: [
      {
        id: 1,
        title: 'Opening Keynote: The Future of AI',
        speaker: 'Dr. Sarah Johnson',
        speakerTitle: 'Chief AI Officer, Tech Corp',
        date: '2025-03-15',
        startTime: '09:00',
        endTime: '10:30',
        location: 'Main Hall',
        description: 'Explore the latest developments in artificial intelligence and machine learning.',
        category: 'Keynote',
        capacity: 500,
      },
      {
        id: 2,
        title: 'Workshop: Building Scalable Cloud Architecture',
        speaker: 'Michael Chen',
        speakerTitle: 'Senior Cloud Architect, CloudBase',
        date: '2025-03-15',
        startTime: '11:00',
        endTime: '12:30',
        location: 'Workshop Room A',
        description: 'Hands-on workshop covering best practices for cloud infrastructure.',
        category: 'Workshop',
        capacity: 50,
      },
      {
        id: 3,
        title: 'Lunch & Networking',
        speaker: null,
        speakerTitle: null,
        date: '2025-03-15',
        startTime: '12:30',
        endTime: '14:00',
        location: 'Dining Hall',
        description: 'Network with peers and enjoy a catered lunch.',
        category: 'Break',
        capacity: 500,
      },
      {
        id: 4,
        title: 'Panel Discussion: Ethical AI Development',
        speaker: 'Various Speakers',
        speakerTitle: null,
        date: '2025-03-15',
        startTime: '14:00',
        endTime: '15:30',
        location: 'Main Hall',
        description: 'Industry leaders discuss the ethical implications of AI technology.',
        category: 'Panel',
        capacity: 500,
      },
      {
        id: 5,
        title: 'Tech Demo: Next-Gen IoT Devices',
        speaker: 'Lisa Martinez',
        speakerTitle: 'Product Manager, IoT Solutions',
        date: '2025-03-15',
        startTime: '16:00',
        endTime: '17:00',
        location: 'Demo Area',
        description: 'Live demonstrations of cutting-edge IoT devices and applications.',
        category: 'Demo',
        capacity: 100,
      },
      // Day 2
      {
        id: 6,
        title: 'Morning Keynote: Blockchain Revolution',
        speaker: 'David Park',
        speakerTitle: 'CEO, CryptoChain Inc',
        date: '2025-03-16',
        startTime: '09:00',
        endTime: '10:30',
        location: 'Main Hall',
        description: 'Understanding blockchain technology and its real-world applications.',
        category: 'Keynote',
        capacity: 500,
      },
      {
        id: 7,
        title: 'Workshop: Cybersecurity Best Practices',
        speaker: 'Jennifer Williams',
        speakerTitle: 'Security Expert, SecureNet',
        date: '2025-03-16',
        startTime: '11:00',
        endTime: '12:30',
        location: 'Workshop Room B',
        description: 'Learn essential cybersecurity practices for modern organizations.',
        category: 'Workshop',
        capacity: 50,
      },
      {
        id: 8,
        title: 'Closing Ceremony & Awards',
        speaker: 'Conference Organizers',
        speakerTitle: null,
        date: '2025-03-17',
        startTime: '16:00',
        endTime: '18:00',
        location: 'Main Hall',
        description: 'Celebrating innovation and recognizing outstanding contributions.',
        category: 'Ceremony',
        capacity: 500,
      },
    ],
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Filter sessions by selected date
  const filteredSessions = selectedDate === 'all'
    ? scheduleData.sessions
    : scheduleData.sessions.filter(session => session.date === selectedDate);

  // Group sessions by date
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = [];
    }
    acc[session.date].push(session);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(sessionsByDate).sort();

  // Check if a session is happening now
  const isSessionNow = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHour, startMinute] = session.startTime.split(':').map(Number);
    const [endHour, endMinute] = session.endTime.split(':').map(Number);

    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(startHour, startMinute);

    const sessionEnd = new Date(sessionDate);
    sessionEnd.setHours(endHour, endMinute);

    return now >= sessionStart && now <= sessionEnd;
  };

  // Check if a session is upcoming (within next 30 minutes)
  const isSessionUpcoming = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHour, startMinute] = session.startTime.split(':').map(Number);

    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(startHour, startMinute);

    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);

    return sessionStart > now && sessionStart <= thirtyMinutesFromNow;
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Keynote': 'bg-blue-100 text-blue-700 border-blue-300',
      'Workshop': 'bg-green-100 text-green-700 border-green-300',
      'Panel': 'bg-purple-100 text-purple-700 border-purple-300',
      'Demo': 'bg-orange-100 text-orange-700 border-orange-300',
      'Break': 'bg-gray-100 text-gray-700 border-gray-300',
      'Ceremony': 'bg-pink-100 text-pink-700 border-pink-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col bg-gray-100" style={{
      minHeight: 'calc(100vh - 64px)',
      margin: '0 calc(-50vw + 50%)',
      width: '100vw'
    }}>
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-4">
        <h1 className="text-2xl font-bold">{scheduleData.eventName}</h1>
        <p className="text-indigo-100 mt-1">{scheduleData.eventDescription}</p>
        <div className="flex items-center gap-4 mt-2 text-indigo-200 text-sm">
          <span className="flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            {formatDate(scheduleData.dates[0])} - {formatDate(scheduleData.dates[scheduleData.dates.length - 1])}
          </span>
          <span className="flex items-center gap-1">
            <FiClock className="w-4 h-4" />
            Current Time: {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedDate('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedDate === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Days
          </button>
          {scheduleData.dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedDate === date
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {sortedDates.map(date => (
            <div key={date} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-600">
                {formatDate(date)}
              </h2>

              <div className="space-y-4">
                {sessionsByDate[date].map(session => {
                  const isNow = isSessionNow(session);
                  const isUpcoming = isSessionUpcoming(session);

                  return (
                    <div
                      key={session.id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                        isNow ? 'ring-4 ring-green-500 shadow-lg' : ''
                      } ${isUpcoming ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(session.category)}`}>
                                {session.category}
                              </span>
                              {isNow && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white animate-pulse">
                                  🔴 LIVE NOW
                                </span>
                              )}
                              {isUpcoming && !isNow && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">
                                  ⏰ Starting Soon
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{session.title}</h3>
                          </div>

                          <div className="text-right ml-4">
                            <div className="flex items-center gap-1 text-lg font-bold text-indigo-600">
                              <FiClock className="w-5 h-5" />
                              {session.startTime}
                            </div>
                            <div className="text-sm text-gray-500">to {session.endTime}</div>
                          </div>
                        </div>

                        {session.speaker && (
                          <div className="flex items-center gap-2 mb-2">
                            <FiUser className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-700">{session.speaker}</span>
                            {session.speakerTitle && (
                              <span className="text-sm text-gray-500">- {session.speakerTitle}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <FiMapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{session.location}</span>
                          <span className="text-sm text-gray-500">• Capacity: {session.capacity}</span>
                        </div>

                        <p className="text-gray-600 leading-relaxed">{session.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 px-6 py-3 text-center text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>📅 Event Schedule Information</span>
          <span>•</span>
          <span>Auto-refresh: Every 60 seconds</span>
          <span>•</span>
          <span className={isOnline ? 'text-green-400' : 'text-yellow-400'}>
            {isOnline ? '🟢 Online' : '🟡 Offline (Cached)'}
          </span>
          <span>•</span>
          <span>Total Sessions: {scheduleData.sessions.length}</span>
        </div>
      </div>
    </div>
  );
}
