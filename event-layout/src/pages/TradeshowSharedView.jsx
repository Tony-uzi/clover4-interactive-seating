// Public shared view of tradeshow layout with vendor filters

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import TradeshowCanvas from '../components/tradeshow/TradeshowCanvas';
import { FiEye, FiFilter } from 'react-icons/fi';
import { normalizeTradeshowBooth, normalizeTradeshowVendor } from '../lib/utils/normalizers';

export default function TradeshowSharedView() {
  const { shareToken } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [allBooths, setAllBooths] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState(null);
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
    if (allBooths.length > 0) {
      applyFilters();
    }
  }, [activeFilters, allBooths, vendors]);

  // Calculate route steps for active route - MUST be at top level
  const routeStepsForCanvas = useMemo(() => {
    if (!activeRouteId || !routes.length) return [];
    const activeRoute = routes.find(route => String(route.id) === String(activeRouteId));
    if (!activeRoute || !activeRoute.boothOrder?.length) return [];

    const getBooth = (boothId) =>
      allBooths.find(booth => String(booth.id) === String(boothId)) || null;

    const getVendorForBooth = (booth) => {
      if (!booth) return null;
      const boothLabel = booth.label ? String(booth.label) : null;
      return (
        vendors.find(v => String(v.boothId) === String(booth.id)) ||
        (boothLabel
          ? vendors.find(v => String(v.boothNumber) === boothLabel)
          : null)
      );
    };

    return activeRoute.boothOrder
      .map((boothId, index) => {
        const booth = getBooth(boothId);
        if (!booth) return null;
        const vendor = getVendorForBooth(booth);
        return {
          boothId: String(boothId),
          booth,
          vendorName: vendor?.name || vendor?.companyName || '',
          step: index + 1,
        };
      })
      .filter(Boolean);
  }, [activeRouteId, routes, allBooths, vendors]);

  const loadSharedData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/tradeshow/share/${shareToken}/`);
      
      if (!response.ok) {
        throw new Error('Failed to load shared event data');
      }
      
      const data = await response.json();

      // Normalize booths and vendors from backend format
      const normalizedBooths = (data.booths || [])
        .map(normalizeTradeshowBooth)
        .filter(Boolean);

      const normalizedVendors = (data.vendors || [])
        .map(normalizeTradeshowVendor)
        .filter(Boolean);

      // Normalize routes
      const normalizedRoutes = (data.routes || []).map(route => ({
        id: route.id,
        name: route.name,
        color: route.color || '#3B82F6',
        boothOrder: route.booth_order || [],
      }));

      setEvent(data.event);
      setAllBooths(normalizedBooths);
      setVendors(normalizedVendors);
      setRoutes(normalizedRoutes);
      
      // Auto-activate the first route if only one exists
      if (normalizedRoutes.length === 1) {
        setActiveRouteId(normalizedRoutes[0].id);
      }
    } catch (err) {
      console.error('Error loading shared data:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (activeFilters.length === 0) {
      // No filters, show all booths
      setFilteredBooths(allBooths);
      return;
    }

    // Get all vendors that match the category filters
    const matchingVendors = vendors.filter(vendor => {
      const category = (
        vendor.category ||
        vendor.vendor_category ||
        ''
      ).toLowerCase().trim();

      return activeFilters.some(filter => {
        const filterLower = filter.toLowerCase().trim();
        if (filterLower === 'none') {
          return category === '' || category === 'none';
        }
        return category.includes(filterLower);
      });
    });

    // Get booth IDs that have matching vendors assigned
    const matchingBoothIds = new Set();
    matchingVendors.forEach(vendor => {
      let boothId = vendor.boothId || vendor.booth_id;

      if (boothId) {
        matchingBoothIds.add(String(boothId));
      }
    });

    // Filter booths to show only:
    // 1. Booths that have matching vendors
    // 2. Non-booth elements (doors, aisles, etc.) for context
    const filtered = allBooths.filter(booth => {
      const type = (booth.type || booth.booth_type || '').toLowerCase();
      const isVendorBooth =
        type.includes('booth');

      if (isVendorBooth) {
        // Only show booths that have matching vendors
        return matchingBoothIds.has(String(booth.id));
      }

      // Show non-booth elements for context (doors, aisles, etc.)
      return true;
    });

    setFilteredBooths(filtered);
  };

  const getFilterDisplayText = () => {
    if (activeFilters.length === 0) {
      return 'All Vendors';
    }
    return activeFilters
      .map(f => f.charAt(0).toUpperCase() + f.slice(1))
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
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
              <FiEye className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-800">{event.name}</h1>
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
            {(event.event_date_start || event.eventDateStart) && (
              <p className="text-sm text-gray-500 mt-1">
                {new Date(event.event_date_start || event.eventDateStart).toLocaleDateString()}
                {(event.event_date_end || event.eventDateEnd) && 
                  ` - ${new Date(event.event_date_end || event.eventDateEnd).toLocaleDateString()}`}
              </p>
            )}
          </div>
          
          {/* Filter Badge */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <FiFilter className="w-4 h-4 text-orange-600" />
              <div className="text-sm">
                <span className="font-semibold text-orange-900">Filtered View:</span>
                <span className="ml-2 text-orange-700">{getFilterDisplayText()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-orange-50 border-b border-orange-100 px-6 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xs font-bold">i</span>
            </div>
          </div>
          <div className="flex-1 text-sm text-orange-800">
            <p className="font-medium">Read-Only Shared View</p>
            <p className="text-orange-700 mt-1">
              {activeFilters.length === 0 
                ? 'Displaying all booths and assigned vendors.'
                : `Displaying only booths with vendors matching: ${getFilterDisplayText()}`
              }
            </p>
          </div>
          
          {/* Route Selector - if multiple routes */}
          {routes.length > 1 && (
            <div className="flex-shrink-0">
              <select
                value={activeRouteId || ''}
                onChange={(e) => setActiveRouteId(e.target.value || null)}
                className="px-3 py-1.5 border border-orange-300 rounded-lg text-sm bg-white text-orange-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">No Route</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>
                    🛤️ {route.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Route display - if single route */}
          {routes.length === 1 && (
            <div className="flex-shrink-0">
              <div className="px-3 py-1.5 bg-orange-100 border border-orange-300 rounded-lg text-sm text-orange-900 font-medium">
                🛤️ {routes[0].name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <TradeshowCanvas
          booths={filteredBooths}
          vendors={vendors}
          routes={routes}
          routeSteps={routeStepsForCanvas}
          activeRouteId={activeRouteId}
          selectedBoothId={null}
          onSelectBooth={() => {}} // Read-only
          onBoothsChange={() => {}} // Read-only
          onAssignVendor={() => {}} // Read-only
          draggingVendorId={null}
          hallWidth={event.hall_width || event.hallWidth}
          hallHeight={event.hall_height || event.hallHeight}
          readOnly={true}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {filteredBooths.filter(b => (b.type || '').includes('booth')).length} booths
            {activeFilters.length > 0 && ` (filtered from ${allBooths.filter(b => (b.type || '').includes('booth')).length} total)`}
          </div>
          <div>
            {vendors.filter(v => {
              const category = (
                v.category ||
                v.vendor_category ||
                ''
              ).toLowerCase().trim();
              if (activeFilters.length === 0) return true;
              return activeFilters.some(filter => {
                const filterLower = filter.toLowerCase().trim();
                if (filterLower === 'none') return category === '' || category === 'none';
                return category.includes(filterLower);
              });
            }).length} vendors
            {activeFilters.length > 0 && ` (filtered from ${vendors.length} total)`}
          </div>
        </div>
      </div>
    </div>
  );
}

