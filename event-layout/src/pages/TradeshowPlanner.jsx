// Tradeshow Planner main page

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toolbar from '../components/shared/Toolbar';
import BoothToolbar from '../components/tradeshow/BoothToolbar';
import TradeshowCanvas from '../components/tradeshow/TradeshowCanvas';
import VendorPanel from '../components/tradeshow/VendorPanel';
import RouteManager from '../components/tradeshow/RouteManager';
import PropertiesPanel from '../components/conference/PropertiesPanel';
// Removed localStorage imports - all data now comes from backend only
import { parseVendorCSV, vendorsToCSV, downloadCSV } from '../lib/utils/csvParser';
import { jsPDF } from 'jspdf';
import * as TradeshowAPI from '../server-actions/tradeshow-planner';
import { normalizeTradeshowVendor, normalizeTradeshowBooth } from '../lib/utils/normalizers';

export default function TradeshowPlanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [booths, setBooths] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBoothId, setSelectedBoothId] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [draggingVendorId, setDraggingVendorId] = useState(null);
  const fileInputRef = useRef(null);
  const saveLayoutTimerRef = useRef(null);
  const saveEventTimerRef = useRef(null);
  const [canvasVersion, setCanvasVersion] = useState(0);
  
  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const mapBackendVendor = normalizeTradeshowVendor;

  // Load data on mount - BACKEND ONLY, use URL parameter for event ID
  useEffect(() => {
    (async () => {
      // Default event structure
      const defaultEvent = {
        name: 'New Tradeshow Event',
        description: '',
        date: new Date().toISOString().split('T')[0],
        hallWidth: 40,
        hallHeight: 30,
      };

      let ensuredEvent = defaultEvent;

      // Get event ID from URL parameter
      const params = new URLSearchParams(location.search);
      const urlEventId = params.get('eventId');

      try {
        if (urlEventId) {
          // Try to load existing event from backend using URL event ID
          const eventResp = await TradeshowAPI.getEvent(urlEventId);
          if (eventResp.success && eventResp.data) {
            ensuredEvent = {
              id: eventResp.data.id,
              name: eventResp.data.name || defaultEvent.name,
              description: eventResp.data.description || defaultEvent.description,
              date: eventResp.data.date || defaultEvent.date,
              hallWidth: eventResp.data.hall_width ?? defaultEvent.hallWidth,
              hallHeight: eventResp.data.hall_height ?? defaultEvent.hallHeight,
            };
            console.log('✓ Loaded existing event from URL:', ensuredEvent.id);
          } else {
            // Event doesn't exist, create new one and update URL
            console.warn('Event ID in URL not found, creating new event');
            const resp = await TradeshowAPI.createEvent(defaultEvent);
            if (resp.success) {
              ensuredEvent = {
                ...defaultEvent,
                id: resp.data.id,
                hallWidth: resp.data.hall_width ?? defaultEvent.hallWidth,
                hallHeight: resp.data.hall_height ?? defaultEvent.hallHeight,
              };
              navigate(`/tradeshow?eventId=${resp.data.id}`, { replace: true });
              console.log('✓ Created new event and updated URL:', resp.data.id);
            }
          }
        } else {
          // No event ID in URL, create new event and add to URL
          const resp = await TradeshowAPI.createEvent(defaultEvent);
          if (resp.success) {
            ensuredEvent = {
              ...defaultEvent,
              id: resp.data.id,
              hallWidth: resp.data.hall_width ?? defaultEvent.hallWidth,
              hallHeight: resp.data.hall_height ?? defaultEvent.hallHeight,
            };
            navigate(`/tradeshow?eventId=${resp.data.id}`, { replace: true });
            console.log('✓ Created new event and added to URL:', resp.data.id);
          }
        }
      } catch (e) {
        console.warn('Ensure tradeshow event failed:', e);
      }

      setEvent(ensuredEvent);
      setVendors([]);
      setRoutes([]);

      try {
        if (ensuredEvent?.id) {
          // ALWAYS load from backend
          const layoutResp = await TradeshowAPI.loadLayout(ensuredEvent.id);
          if (layoutResp.success) {
            const normalized = layoutResp.data
              .map(normalizeTradeshowBooth)
              .filter(Boolean);
            setBooths(normalized);
            console.log(`✓ Loaded ${normalized.length} booths from backend`);
          } else {
            console.warn('Failed to load layout from backend:', layoutResp.error);
            setBooths([]);
          }

          // Load vendors from backend
          const vendorsResp = await TradeshowAPI.getVendors(ensuredEvent.id);
          if (vendorsResp.success) {
            const backendVendors = vendorsResp.data.map(mapBackendVendor);
            setVendors(backendVendors);
            console.log(`✓ Loaded ${backendVendors.length} vendors from backend`);
          }
        }
      } catch (e) {
        console.error('Load tradeshow backend layout failed:', e);
        setBooths([]);
      }

      setTimeout(() => setIsInitialLoad(false), 100);
    })();
  }, [location.search]);

  // Auto-save disabled - users must manually save using the Save button
  // This prevents duplicate booths caused by React StrictMode double-rendering

  // Get selected booth
  const selectedBooth = booths.find(b => b.id === selectedBoothId);

  // Booth operations
  const handleAddBooth = (booth) => {
    setBooths([...booths, booth]);
    setSelectedBoothId(booth.id);
  };

  const handleUpdateBooth = (updatedBooth) => {
    setBooths(booths.map(b => (b.id === updatedBooth.id ? updatedBooth : b)));
  };

  const handleDeleteBooth = (boothId) => {
    setBooths(booths.filter(b => b.id !== boothId));
    setSelectedBoothId(null);
  };

  const handleDuplicateBooth = (booth) => {
    const duplicate = {
      ...booth,
      id: `${booth.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: booth.x + 2,
      y: booth.y + 2,
    };
    setBooths([...booths, duplicate]);
    setSelectedBoothId(duplicate.id);
  };

  // Vendor operations
  const handleAddVendor = async (vendor) => {
    // Add to local state immediately with temporary ID
    const tempVendor = normalizeTradeshowVendor({
      ...vendor,
      id: vendor.id || `temp_${Date.now()}`,
    });
    setVendors(prevVendors => {
      const updated = [...prevVendors, tempVendor];
      return updated;
    });
    
    // Try to save to backend if event exists
    if (event?.id) {
      try {
        const result = await TradeshowAPI.createVendor(event.id, vendor);
        if (result.success && result.data) {
          // Replace temp vendor with backend vendor (which has real UUID)
          const backendVendor = mapBackendVendor(result.data);
          setVendors(prevVendors => {
            const updated = prevVendors.map(v =>
              v.id === tempVendor.id ? backendVendor : v
            );
            return updated;
          });
          console.log('✓ Vendor created in backend with ID:', result.data.id);
        } else {
          console.warn('Failed to create vendor in backend:', result.error);
        }
      } catch (error) {
        console.warn('Failed to save vendor to backend:', error);
        // Keep the local vendor even if backend fails
      }
    }
  };

  const handleUpdateVendor = (vendorId, updates) => {
    setVendors(prevVendors => {
      const updated = prevVendors.map(v =>
        v.id === vendorId ? { ...v, ...updates } : v
      );
      return updated;
    });
  };

  const handleDeleteVendor = (vendorId) => {
    setVendors(prevVendors => {
      const updated = prevVendors.filter(v => v.id !== vendorId);
      return updated;
    });
  };

  const handleVendorDragStart = (vendorId) => {
    setDraggingVendorId(String(vendorId));
  };

  const handleVendorDragEnd = () => {
    setDraggingVendorId(null);
  };

  const handleAssignVendorToBooth = async (vendorId, booth) => {
    if (!booth) return;
    const normalizedVendorId = String(vendorId);

    const existingVendor = vendors.find(v => String(v.id) === normalizedVendorId);
    const previousAssignmentId = existingVendor?.boothAssignmentId;

    // Helper to check if a string is a valid UUID
    const isValidUUID = (str) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    setVendors(prevVendors => {
      const updated = prevVendors.map(vendor =>
        String(vendor.id) === normalizedVendorId
          ? {
              ...vendor,
              boothAssignmentId: vendor.boothAssignmentId || null,
              boothId: booth.id,
              boothNumber: booth.label || null,
            }
          : vendor
      );
      return updated;
    });
    setDraggingVendorId(null);

    if (event?.id && existingVendor) {
      try {
        // Check if vendor has a valid UUID (from backend)
        let validVendorId = normalizedVendorId;
        
        if (!isValidUUID(normalizedVendorId)) {
          // Vendor has a temporary frontend ID, need to save vendor first
          console.log('Vendor has temporary ID, saving to backend to get UUID...');
          
          const result = await TradeshowAPI.createVendor(event.id, existingVendor);
          if (!result.success || !result.data) {
            throw new Error('Failed to create vendor in backend before assignment');
          }
          
          const backendVendor = mapBackendVendor(result.data);
          validVendorId = backendVendor.id;
          
          // Update vendor state with backend UUID
          setVendors(prevVendors => {
            const updated = prevVendors.map(v =>
              v.id === normalizedVendorId ? backendVendor : v
            );
            return updated;
          });
          console.log('✓ Vendor saved to backend with UUID:', validVendorId);
        }
        
        // Check if booth has a valid UUID (from backend)
        let validBoothId = booth.id;
        
        if (!isValidUUID(booth.id)) {
          // Booth has a temporary frontend ID, need to save layout first
          console.log('Booth has temporary ID, saving layout to get backend UUID...');
          
          // Create a mapping of temp IDs to their original data for matching
          const tempIdMap = new Map();
          booths.forEach(b => {
            if (!isValidUUID(b.id)) {
              tempIdMap.set(b.id, {
                x: b.x,
                y: b.y,
                type: b.type,
                label: b.label
              });
            }
          });
          
          // Save the layout
          const saveResult = await TradeshowAPI.saveLayout(event.id, booths);
          if (!saveResult.success) {
            throw new Error('Failed to save layout before assignment');
          }
          
          // The saveLayout response includes the saved booths with UUIDs
          const savedBooths = saveResult.data?.booths || [];
          
          if (!savedBooths || savedBooths.length === 0) {
            throw new Error('No booths returned from save layout');
          }
          
          // Map saved booths to frontend format
          const backendBooths = savedBooths
            .map(normalizeTradeshowBooth)
            .filter(Boolean);
          
          // Find matching booth by comparing original temp booth data with saved booths
          const tempData = tempIdMap.get(booth.id);
          const matchingBooth = backendBooths.find(b => {
            return tempData && 
              Math.abs(parseFloat(b.x) - parseFloat(tempData.x)) < 0.01 && 
              Math.abs(parseFloat(b.y) - parseFloat(tempData.y)) < 0.01 &&
              (b.type === tempData.type || b.type === 'booth_premium' && tempData.type === 'booth_island');
          });
          
          if (!matchingBooth) {
            console.error('Failed to find matching booth. Looking for:', tempData, 'in:', backendBooths);
            throw new Error('Could not find matching booth after saving layout');
          }
          
          validBoothId = matchingBooth.id;
          
          // Update booths state with backend UUIDs
          setBooths(backendBooths);
          console.log('✓ Layout saved and reloaded with backend UUIDs');
        }
        
        // Now proceed with booth assignment using valid UUIDs
        if (previousAssignmentId) {
          await TradeshowAPI.deleteBoothAssignment(event.id, previousAssignmentId);
        }
        
        const assignmentResp = await TradeshowAPI.createBoothAssignment(event.id, {
          vendorId: validVendorId,
          boothId: validBoothId,
        });
        
        if (assignmentResp.success && assignmentResp.data?.id) {
          setVendors(prevVendors => {
            const updated = prevVendors.map(vendor => {
              const vendorIdStr = String(vendor.id);
              // Match by either the original temp ID or the new valid ID
              if (vendorIdStr === normalizedVendorId || vendorIdStr === validVendorId) {
                return {
                  ...vendor,
                  id: validVendorId,  // Ensure we use the valid UUID
                  boothAssignmentId: assignmentResp.data.id,
                  boothId: validBoothId,
                  boothNumber: booth.label || null,
                };
              }
              return vendor;
            });
            return updated;
          });
          console.log(`✓ Saved vendor booth assignment to backend`);
        } else if (!assignmentResp.success) {
          throw new Error(assignmentResp.error || 'Unknown assignment error');
        }
      } catch (backendError) {
        console.warn('Failed to save vendor booth assignment to backend:', backendError);
        alert(`Failed to assign vendor: ${backendError.message || 'Unknown error'}`);
        try {
          const refreshedVendorsResp = await TradeshowAPI.getVendors(event.id);
          if (refreshedVendorsResp.success) {
            const backendVendors = refreshedVendorsResp.data.map(mapBackendVendor);
            setVendors(backendVendors);
          }
        } catch (refreshError) {
          console.warn('Failed to refresh vendors after assignment error:', refreshError);
        }
      }
    }
  };

  // Route operations
  const handleAddRoute = (route) => {
    setRoutes([...routes, route]);
  };

  const handleUpdateRoute = (routeId, updates) => {
    setRoutes(routes.map(r => (r.id === routeId ? { ...r, ...updates } : r)));
  };

  const handleDeleteRoute = (routeId) => {
    setRoutes(routes.filter(r => r.id !== routeId));
    if (activeRouteId === routeId) {
      setActiveRouteId(null);
    }
  };

  // CSV Import
  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if event exists
    if (!event?.id) {
      alert('Please wait for the event to be created before importing vendors');
      return;
    }

    try {
      const importedVendors = await parseVendorCSV(file);
      const normalizedImported = importedVendors
        .map(normalizeTradeshowVendor)
        .filter(Boolean);

      if (normalizedImported.length === 0) {
        alert('No valid vendor information found, please check CSV content');
        return;
      }

      try {
        // Always use backend API
        const result = await TradeshowAPI.bulkImportVendors(event.id, file);
        if (result.success) {
          const importedCount = result.data?.imported || result.data?.count || normalizedImported.length;

          // Refresh vendors from backend to get UUIDs
          const refreshedVendorsResp = await TradeshowAPI.getVendors(event.id);
          if (refreshedVendorsResp.success) {
            const backendVendors = refreshedVendorsResp.data
              .map(mapBackendVendor)
              .filter(Boolean);
            setVendors(backendVendors);
            console.log(`✓ Successfully imported and synced ${backendVendors.length} vendors from backend`);
            alert(`Successfully imported ${importedCount} vendor(s)!`);
          } else {
            throw new Error('Failed to refresh vendors after import');
          }
        } else {
          throw new Error(result.error || 'Import API failed');
        }
      } catch (backendError) {
        console.error('Failed to import vendors to backend:', backendError);
        alert(`Import failed: ${backendError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      alert('Import failed, please check CSV format');
    }

    e.target.value = '';
  };

  // CSV Export
  const handleExportCSV = () => {
    const csv = vendorsToCSV(vendors);
    downloadCSV(csv, `tradeshow-vendors-${Date.now()}.csv`);
  };

  // PDF Export
  const handleExportPDF = () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Add title
    pdf.setFontSize(20);
    pdf.text(event?.name || 'Tradeshow Layout', 20, 20);

    // Add date
    pdf.setFontSize(10);
    pdf.text(`Export Time: ${new Date().toLocaleString()}`, 20, 30);

    // Add statistics
    const assignedCount = vendors.filter(v => v.boothNumber).length;

    pdf.text(`Hall Size: ${event?.hallWidth}m × ${event?.hallHeight}m`, 20, 40);
    pdf.text(`Total Booths: ${booths.length}`, 20, 46);
    pdf.text(`Assigned Vendors: ${assignedCount} / ${vendors.length}`, 20, 52);
    pdf.text(`Visit Routes: ${routes.length}`, 20, 58);

    // Get canvas as image
    const stage = document.querySelector('canvas');
    if (stage) {
      const imgData = stage.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, 65, 250, 140);
    }

    // Save PDF
    pdf.save(`tradeshow-layout-${Date.now()}.pdf`);
  };

  // Clear - clears backend layout
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear ALL layout elements? This will delete all booths and other elements from the canvas and the backend. This action cannot be undone!')) {
      return;
    }
    
    try {
      // Clear local state first for immediate UI feedback
      setBooths([]);
      setSelectedBoothId(null);
      setDraggingVendorId(null);
      
      // Clear backend by saving empty layout
      if (event?.id) {
        const result = await TradeshowAPI.saveLayout(event.id, []);
        if (result.success) {
          console.log('✓ Layout cleared from backend');
        } else {
          console.warn('Failed to clear layout from backend:', result.error);
          alert('Failed to clear layout from backend. Please try again.');
        }
      }
      
      // Force canvas refresh
      setCanvasVersion((prev) => prev + 1);
      
      alert('Canvas cleared successfully!');
    } catch (error) {
      console.error('Failed to clear canvas:', error);
      alert('Failed to clear canvas. Please try again.');
    }
  };

  if (!event) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col bg-gray-100" style={{
      // height: 'calc(100vh - 20px)',
      height: '120vh',
      margin: '0 calc(-50vw + 50%)',
      width: '100vw'
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toolbar */}
      <Toolbar
        title={event.name}
        onNavigateHome={() => {
          window.location.href = '/';
        }}
        onSave={async () => {
          try {
            if (!event?.id) {
              alert('Please create an event first');
              return;
            }

            // Save booths to backend
            const saveResult = await TradeshowAPI.saveLayout(event.id, booths);
            if (saveResult.success) {
              alert(`✓ Saved ${saveResult.data.saved} booths to event`);
            } else {
              throw new Error(saveResult.error || 'Failed to save layout');
            }
          } catch (e) {
            alert(e.message || 'Save failed');
          }
        }}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onClear={handleClear}
      />

      {/* Canvas Size Input */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Hall Size:</label>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Width(m):</label>
          <input
            type="number"
            min="10"
            max="200"
            step="1"
            value={event.hallWidth}
            onChange={(e) => {
              const newWidth = parseFloat(e.target.value) || event.hallWidth;
              setEvent({ ...event, hallWidth: newWidth });
            }}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Height(m):</label>
          <input
            type="number"
            min="10"
            max="200"
            step="1"
            value={event.hallHeight}
            onChange={(e) => {
              const newHeight = parseFloat(e.target.value) || event.hallHeight;
              setEvent({ ...event, hallHeight: newHeight });
            }}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <span className="text-xs text-gray-500">Tip: Drag corner points to adjust for irregular shapes</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Booth toolbar */}
        <BoothToolbar onAddBooth={handleAddBooth} />

        {/* Center: Canvas - now takes full height */}
        <div className="flex-1 min-w-0 flex flex-col">
          <TradeshowCanvas
            key={canvasVersion}
            booths={booths}
            onBoothsChange={setBooths}
            hallWidth={event.hallWidth}
            hallHeight={event.hallHeight}
            selectedBoothId={selectedBoothId}
            onSelectBooth={setSelectedBoothId}
            vendors={vendors}
            routes={routes}
            activeRouteId={activeRouteId}
            draggingVendorId={draggingVendorId}
            onAssignVendor={handleAssignVendorToBooth}
            onVendorDragEnd={handleVendorDragEnd}
          />
        </div>

        {/* Right: Properties, Routes, and Vendor panels - improved layout */}
        <div className="w-96 flex flex-col overflow-hidden border-l border-gray-200 bg-white">
          {selectedBooth && (
            <div className="flex-shrink-0 border-b border-gray-200" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <PropertiesPanel
                selectedElement={selectedBooth}
                onUpdateElement={handleUpdateBooth}
                onDeleteElement={handleDeleteBooth}
                onDuplicateElement={handleDuplicateBooth}
              />
            </div>
          )}
          <div className="flex-shrink-0 border-b border-gray-200" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <RouteManager
              routes={routes}
              booths={booths}
              onAddRoute={handleAddRoute}
              onUpdateRoute={handleUpdateRoute}
              onDeleteRoute={handleDeleteRoute}
              activeRouteId={activeRouteId}
              onSetActiveRoute={setActiveRouteId}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <VendorPanel
              vendors={vendors}
              onAddVendor={handleAddVendor}
              onUpdateVendor={handleUpdateVendor}
              onDeleteVendor={handleDeleteVendor}
              onVendorDragStart={handleVendorDragStart}
              onVendorDragEnd={handleVendorDragEnd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
