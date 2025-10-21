// Kiosk mode for Directory (Guest/Vendor name directory with search)

import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiUser, FiBriefcase } from 'react-icons/fi';
import {
  loadConferenceEvent,
  loadConferenceGuests,
  loadTradeshowEvent,
  loadTradeshowVendors,
  saveConferenceEvent,
  saveConferenceGuests,
  saveTradeshowEvent,
  saveTradeshowVendors,
} from '../lib/utils/storage';
import * as ConferenceAPI from '../server-actions/conference-planner';
import * as TradeshowAPI from '../server-actions/tradeshow-planner';

const REFRESH_INTERVAL = 60000; // 60 seconds

export default function KioskDirectory() {
  const [viewMode, setViewMode] = useState('conference'); // 'conference' or 'tradeshow'
  const [conferenceEvent, setConferenceEvent] = useState(null);
  const [tradeshowEvent, setTradeshowEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('all');
  const [isOnline, setIsOnline] = useState(true);

  // Alphabet for filtering
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Load conference data from backend API with fallback to localStorage
  const loadConferenceData = async () => {
    try {
      const cachedEvent = loadConferenceEvent();
      const cachedGuests = loadConferenceGuests();

      const hasCachedGuests = Array.isArray(cachedGuests) && cachedGuests.length > 0;
      if (cachedEvent) {
        setConferenceEvent(cachedEvent);
      }
      if (hasCachedGuests) {
        setGuests(cachedGuests);
      }

      if (cachedEvent?.id) {
        const eventResponse = await ConferenceAPI.getEvent(cachedEvent.id);
        const guestsResponse = await ConferenceAPI.getGuests(cachedEvent.id);

        if (eventResponse.success && guestsResponse.success) {
          const updatedEvent = {
            id: eventResponse.data.id,
            name: eventResponse.data.name,
            description: eventResponse.data.description,
            date: eventResponse.data.date,
          };

          const updatedGuests = guestsResponse.data.map(g => ({
            id: g.id,
            name: g.name,
            email: g.email,
            group: g.group,
            tableNumber: g.table_number,
            seatNumber: g.seat_number,
            company: g.company || '',
            title: g.title || '',
          }));

          setConferenceEvent(updatedEvent);
          saveConferenceEvent(updatedEvent);

          // Prevent cached guests from being wiped out by an empty API payload
          if (updatedGuests.length > 0) {
            setGuests(updatedGuests);
            saveConferenceGuests(updatedGuests);
          } else if (hasCachedGuests && cachedEvent.id === updatedEvent.id) {
            console.info('Keeping cached conference guests (API returned empty list)');
            setGuests(cachedGuests);
          } else {
            setGuests(updatedGuests);
            saveConferenceGuests(updatedGuests);
          }

          setIsOnline(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load conference data from backend:', error);
      setIsOnline(false);
    }
  };

  // Load tradeshow data from backend API with fallback to localStorage
  const loadTradeshowData = async () => {
    try {
      const cachedEvent = loadTradeshowEvent();
      const cachedVendors = loadTradeshowVendors();

      const hasCachedVendors = Array.isArray(cachedVendors) && cachedVendors.length > 0;
      if (cachedEvent) {
        setTradeshowEvent(cachedEvent);
      }
      if (hasCachedVendors) {
        setVendors(cachedVendors);
      }

      if (cachedEvent?.id) {
        const eventResponse = await TradeshowAPI.getEvent(cachedEvent.id);
        const vendorsResponse = await TradeshowAPI.getVendors(cachedEvent.id);

        if (eventResponse.success && vendorsResponse.success) {
          const updatedEvent = {
            id: eventResponse.data.id,
            name: eventResponse.data.name,
            description: eventResponse.data.description,
            date: eventResponse.data.date,
          };

          const updatedVendors = vendorsResponse.data.map(v => ({
            id: v.id,
            name: v.name,
            contactName: v.contact_name,
            email: v.email,
            phone: v.phone,
            category: v.category,
            boothNumber: v.booth_number,
          }));

          setTradeshowEvent(updatedEvent);
          saveTradeshowEvent(updatedEvent);

          if (updatedVendors.length > 0) {
            setVendors(updatedVendors);
            saveTradeshowVendors(updatedVendors);
          } else if (hasCachedVendors && cachedEvent.id === updatedEvent.id) {
            console.info('Keeping cached tradeshow vendors (API returned empty list)');
            setVendors(cachedVendors);
          } else {
            setVendors(updatedVendors);
            saveTradeshowVendors(updatedVendors);
          }

          setIsOnline(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load tradeshow data from backend:', error);
      setIsOnline(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    loadConferenceData();
    loadTradeshowData();

    const interval = setInterval(() => {
      console.log('Auto-refreshing directory data...');
      loadConferenceData();
      loadTradeshowData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Current data based on view mode
  const currentEvent = viewMode === 'conference' ? conferenceEvent : tradeshowEvent;
  const currentData = viewMode === 'conference' ? guests : vendors;

  // Filter data based on search and letter
  const filteredData = currentData.filter(item => {
    const name = item.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.contactName && item.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLetter = selectedLetter === 'all' || name.charAt(0).toUpperCase() === selectedLetter;

    return matchesSearch && matchesLetter;
  });

  // Group by first letter
  const groupedData = filteredData.reduce((acc, item) => {
    const firstLetter = (item.name || '?').charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(item);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedData).sort();

  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading...</div>
          <div className="text-gray-600">Loading directory information</div>
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
      <div className={`${viewMode === 'conference' ? 'bg-blue-600' : 'bg-green-600'} text-white px-6 py-4`}>
        <h1 className="text-2xl font-bold">{currentEvent.name} - Directory</h1>
        {currentEvent.description && (
          <p className={`${viewMode === 'conference' ? 'text-blue-100' : 'text-green-100'} mt-1`}>
            {currentEvent.description}
          </p>
        )}
        {currentEvent.date && (
          <p className={`${viewMode === 'conference' ? 'text-blue-200' : 'text-green-200'} text-sm mt-1`}>
            Date: {currentEvent.date}
          </p>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => setViewMode('conference')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              viewMode === 'conference'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiUser className="w-5 h-5" />
            <span>Guest Directory</span>
          </button>
          <button
            onClick={() => setViewMode('tradeshow')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              viewMode === 'tradeshow'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
              <FiBriefcase className="w-5 h-5" />
            <span>Vendor Directory</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${viewMode === 'conference' ? 'guests' : 'vendors'} by name, email, or company...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Alphabet Filter */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 overflow-x-auto">
        <div className="flex gap-2 max-w-6xl mx-auto justify-center flex-wrap">
          <button
            onClick={() => setSelectedLetter('all')}
            className={`px-3 py-2 rounded font-medium transition-colors ${
              selectedLetter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`w-10 h-10 rounded font-medium transition-colors ${
                selectedLetter === letter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Directory List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {filteredData.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl">No entries found</p>
              {searchTerm && <p className="mt-2">Try a different search term</p>}
            </div>
          ) : (
            sortedLetters.map(letter => (
              <div key={letter} className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  {letter}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedData[letter].map(item => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h3>

                      {viewMode === 'conference' ? (
                        <>
                          {item.email && (
                            <p className="text-sm text-gray-600 mb-1">📧 {item.email}</p>
                          )}
                          {item.company && (
                            <p className="text-sm text-gray-600 mb-1">🏢 {item.company}</p>
                          )}
                          {item.title && (
                            <p className="text-sm text-gray-600 mb-1">💼 {item.title}</p>
                          )}
                          {item.group && (
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {item.group}
                            </span>
                          )}
                          {item.tableNumber && (
                            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                              <span className="font-semibold text-purple-700">
                                📍 Table: {item.tableNumber}
                                {item.seatNumber && ` - Seat ${item.seatNumber}`}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {item.contactName && (
                            <p className="text-sm text-gray-600 mb-1">👤 Contact: {item.contactName}</p>
                          )}
                          {item.email && (
                            <p className="text-sm text-gray-600 mb-1">📧 {item.email}</p>
                          )}
                          {item.phone && (
                            <p className="text-sm text-gray-600 mb-1">📞 {item.phone}</p>
                          )}
                          {item.category && (
                            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              {item.category}
                            </span>
                          )}
                          {item.boothNumber && (
                            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                              <span className="font-semibold text-purple-700">
                                📍 Booth: {item.boothNumber}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 px-6 py-3 text-center text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>📚 Directory Information System</span>
          <span>•</span>
          <span>Auto-refresh: Every 60 seconds</span>
          <span>•</span>
          <span className={isOnline ? 'text-green-400' : 'text-yellow-400'}>
            {isOnline ? '🟢 Online' : '🟡 Offline (Cached)'}
          </span>
          <span>•</span>
          <span>Total Entries: {currentData.length}</span>
        </div>
      </div>
    </div>
  );
}
