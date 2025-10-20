/**
 * Tradeshow Live Display - Large Screen View
 * 
 * Purpose: Read-only display for large screens/TVs at trade show venue
 * Shows: Real-time floor plan, vendor list, booth status
 */

import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPackage, FiTrendingUp } from 'react-icons/fi';
import TradeshowCanvas from '../components/tradeshow/TradeshowCanvas';
import {
  loadTradeshowEvent,
  loadTradeshowLayout,
  loadTradeshowVendors,
} from '../lib/utils/storage';
import { useWebSocket } from '../lib/hooks/useWebSocket';

export default function TradeshowLiveDisplay() {
  const [event, setEvent] = useState(null);
  const [booths, setBooths] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load data
  const loadData = () => {
    const loadedEvent = loadTradeshowEvent();
    const loadedLayout = loadTradeshowLayout();
    const loadedVendors = loadTradeshowVendors();

    setEvent(loadedEvent);
    setBooths(loadedLayout);
    setVendors(loadedVendors);
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket for real-time updates
  useWebSocket('tradeshow', event?.id || 'default', {
    booth_update: () => {
      console.log('Booth updated via WebSocket');
      loadData();
    },
    vendor_update: () => {
      console.log('Vendor updated via WebSocket');
      loadData();
    },
  });

  // Calculate statistics
  const totalBooths = booths.length;
  const occupiedBooths = booths.filter(b => b.vendorId).length;
  const availableBooths = totalBooths - occupiedBooths;
  const occupancyRate = totalBooths > 0 ? ((occupiedBooths / totalBooths) * 100).toFixed(1) : 0;

  // Category distribution
  const categories = [...new Set(vendors.map(v => v.category).filter(Boolean))];
  const categoryDist = categories.map(cat => ({
    name: cat,
    count: vendors.filter(v => v.category === cat).length,
  }));

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-green-900 text-white">
        <div className="text-center">
          <div className="text-3xl font-bold mb-4">Loading Display...</div>
          <div className="text-lg opacity-75">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600/30 to-blue-600/30 backdrop-blur-xl border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
            {event.description && (
              <p className="text-xl text-green-200">{event.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
            <div className="text-xl text-green-200 mt-1">
              {currentTime.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-8 py-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-green-500/30 p-3 rounded-xl">
                <FiPackage className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-green-200 font-medium">Total Booths</div>
                <div className="text-sm text-green-300">Exhibition Space</div>
              </div>
            </div>
            <div className="text-5xl font-bold">{totalBooths}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-blue-500/30 p-3 rounded-xl">
                <FiMapPin className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-blue-200 font-medium">Exhibitors</div>
                <div className="text-sm text-blue-300">{occupancyRate}% Occupied</div>
              </div>
            </div>
            <div className="text-5xl font-bold text-blue-400">{vendors.length}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-purple-500/30 p-3 rounded-xl">
                <FiTrendingUp className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-purple-200 font-medium">Categories</div>
                <div className="text-sm text-purple-300">Industry Sectors</div>
              </div>
            </div>
            <div className="text-5xl font-bold text-purple-400">{categories.length}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-8 overflow-hidden">
        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <TradeshowCanvas
            booths={booths}
            onBoothsChange={() => {}}
            hallWidth={event.hallWidth}
            hallHeight={event.hallHeight}
            selectedBoothId={null}
            onSelectBooth={() => {}}
            vendors={vendors}
            readOnly={true}
          />
        </div>

        <div className="w-96 space-y-6">
          {/* Categories */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-2xl font-bold mb-4">Categories</h3>
            <div className="space-y-3">
              {categoryDist.map((cat) => (
                <div key={cat.name} className="bg-black/20 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{cat.name}</span>
                    <span className="text-2xl font-bold">{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Indicator */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl border border-green-400/30 p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xl font-bold">LIVE</span>
            </div>
            <p className="text-sm text-green-200">Real-time updates</p>
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
            <span>📍 Clover Events - Tradeshow Display Mode</span>
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
