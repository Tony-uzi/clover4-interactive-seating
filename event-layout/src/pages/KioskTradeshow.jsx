// Kiosk mode for Tradeshow (read-only display with search)

import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiMapPin, FiCamera } from 'react-icons/fi';
import TradeshowCanvas from '../components/tradeshow/TradeshowCanvas';
import QRScanner from '../components/QRScanner';
import {
  loadTradeshowEvent,
  loadTradeshowLayout,
  loadTradeshowVendors,
  loadTradeshowRoutes,
  saveTradeshowEvent,
  saveTradeshowLayout,
  saveTradeshowVendors,
  saveTradeshowRoutes,
} from '../lib/utils/storage';
import * as TradeshowAPI from '../server-actions/tradeshow-planner';

const REFRESH_INTERVAL = 60000; // 60 seconds

export default function KioskTradeshow() {
  const [event, setEvent] = useState(null);
  const [booths, setBooths] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [highlightedBoothId, setHighlightedBoothId] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Load data from backend API with fallback to localStorage
  const loadData = async () => {
    try {
      // Try to load from localStorage first for immediate display
      const cachedEvent = loadTradeshowEvent();
      const cachedLayout = loadTradeshowLayout();
      const cachedVendors = loadTradeshowVendors();
      const cachedRoutes = loadTradeshowRoutes();

      // Use cached data immediately if available
      if (cachedEvent) {
        setEvent(cachedEvent);
        setBooths(cachedLayout);
        setVendors(cachedVendors);
        setRoutes(cachedRoutes);
      }

      // Then fetch from backend API for latest data
      if (cachedEvent?.id) {
        const eventResponse = await TradeshowAPI.getEvent(cachedEvent.id);
        const vendorsResponse = await TradeshowAPI.getVendors(cachedEvent.id);
        const boothsResponse = await TradeshowAPI.getBooths(cachedEvent.id);
        const routesResponse = await TradeshowAPI.getRoutes(cachedEvent.id);

        if (eventResponse.success && vendorsResponse.success && boothsResponse.success) {
          const updatedEvent = {
            id: eventResponse.data.id,
            name: eventResponse.data.name,
            description: eventResponse.data.description,
            date: eventResponse.data.date,
            hallWidth: eventResponse.data.hall_width,
            hallHeight: eventResponse.data.hall_height,
          };

          const updatedVendors = vendorsResponse.data.map(v => ({
            id: v.id,
            name: v.name,
            contactName: v.contact_name,
            email: v.email,
            phone: v.phone,
            category: v.category,
            boothNumber: v.booth_number,
            notes: v.notes,
            boothId: v.booth_id,
          }));

          const updatedBooths = boothsResponse.data.map(booth => ({
            id: booth.id,
            type: booth.booth_type,
            x: booth.x,
            y: booth.y,
            width: booth.width,
            height: booth.height,
            rotation: booth.rotation || 0,
            label: booth.label,
          }));

          const updatedRoutes = routesResponse.success ? routesResponse.data.map(route => ({
            id: route.id,
            name: route.name,
            color: route.color,
            boothIds: route.booth_ids || [],
          })) : [];

          setEvent(updatedEvent);
          setBooths(updatedBooths);
          setVendors(updatedVendors);
          setRoutes(updatedRoutes);

          // Cache the updated data
          saveTradeshowEvent(updatedEvent);
          saveTradeshowLayout(updatedBooths);
          saveTradeshowVendors(updatedVendors);
          saveTradeshowRoutes(updatedRoutes);

          setIsOnline(true);
          console.log('✓ Data refreshed from backend API');
        }
      }
    } catch (error) {
      console.warn('Failed to load from backend, using cached data:', error);
      setIsOnline(false);

      // Fallback to localStorage
      const loadedEvent = loadTradeshowEvent();
      const loadedLayout = loadTradeshowLayout();
      const loadedVendors = loadTradeshowVendors();
      const loadedRoutes = loadTradeshowRoutes();

      setEvent(loadedEvent);
      setBooths(loadedLayout);
      setVendors(loadedVendors);
      setRoutes(loadedRoutes);
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

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle vendor selection
  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setSearchTerm(''); // Clear search to hide dropdown

    // Find the booth this vendor is assigned to
    // Priority: 1) boothId (direct assignment), 2) boothNumber match
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

  // Clear selection
  const handleClearSelection = () => {
    setSelectedVendor(null);
    setHighlightedBoothId(null);
    setSearchTerm('');
  };

  // Handle QR code scan
  const handleQRCodeScan = (qrData) => {
    setShowQRScanner(false);
    setScanError(null);

    try {
      // Parse QR code data
      // Expected format: checkin://tradeshow/{eventId}/{vendorId}
      const qrPattern = /^checkin:\/\/tradeshow\/([^/]+)\/([^/]+)$/;
      const match = qrData.match(qrPattern);

      if (!match) {
        setScanError('Invalid QR code format. Please use a valid check-in QR code.');
        return;
      }

      const [, eventId, vendorId] = match;

      // Find the vendor
      const vendor = vendors.find(v => v.id === vendorId || String(v.id) === vendorId);

      if (!vendor) {
        setScanError(`Vendor not found. QR code may be for a different event.`);
        return;
      }

      // Auto-select the vendor
      handleSelectVendor(vendor);

      // Note: For tradeshow, we just show the vendor info
      // You can add check-in logic here if needed
      console.log(`✓ ${vendor.name} identified via QR code`);
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
          <div className="text-gray-600">Loading tradeshow information</div>
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
      <div className="bg-green-600 text-white px-6 py-4">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        {event.description && (
          <p className="text-green-100 mt-1">{event.description}</p>
        )}
        {event.date && (
          <p className="text-green-200 text-sm mt-1">Date: {event.date}</p>
        )}
      </div>

      {/* Search, QR Scanner and Route bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 relative">
        <div className="max-w-4xl mx-auto relative">
          <div className="flex gap-2">
            {/* Search */}
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

            {/* QR Scan button */}
            <button
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 flex-shrink-0"
              title="Scan QR Code"
            >
              <FiCamera className="w-5 h-5" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            {/* Route selector */}
            {routes.length > 0 && (
              <select
                value={activeRouteId || ''}
                onChange={(e) => setActiveRouteId(e.target.value ? parseInt(e.target.value) : null)}
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

          {/* Search results dropdown */}
          {searchTerm && filteredVendors.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredVendors.map(vendor => (
                <button
                  key={vendor.id}
                  onClick={() => handleSelectVendor(vendor)}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                    </div>
                    {vendor.boothNumber && (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <FiMapPin className="w-4 h-4" />
                        {vendor.boothNumber}
                      </div>
                    )}
                  </div>
                </button>
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

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-6">
          <TradeshowCanvas
            booths={booths}
            onBoothsChange={() => {}} // Read-only
            hallWidth={event.hallWidth}
            hallHeight={event.hallHeight}
            selectedBoothId={highlightedBoothId}
            onSelectBooth={() => {}} // Read-only
            vendors={vendors}
            routes={routes}
            activeRouteId={activeRouteId}
            readOnly={true}
          />
        </div>

        {/* Info panel */}
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
    </div>
  );
}
