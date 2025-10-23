// Tradeshow Planner main page

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  const routeStepsForCanvas = useMemo(() => {
    if (!activeRouteId || !routes?.length) return [];
    const activeRoute = routes.find(route => String(route.id) === String(activeRouteId));
    if (!activeRoute || !activeRoute.boothOrder?.length) return [];

    const getBooth = (boothId) =>
      booths.find(booth => String(booth.id) === String(boothId)) || null;

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
          vendorName: vendor?.name || '',
          step: index + 1,
        };
      })
      .filter(Boolean);
  }, [activeRouteId, routes, booths, vendors]);

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

      const params = new URLSearchParams(location.search);
      const urlEventId = params.get('eventId');

      if (!urlEventId) {
        setEvent(defaultEvent);
        setBooths([]);
        setVendors([]);
        setRoutes([]);
        setIsInitialLoad(false);
        return;
      }

      let ensuredEvent = defaultEvent;

      try {
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
          console.warn('Event ID in URL not found or inaccessible');
          setEvent(defaultEvent);
          setBooths([]);
          setVendors([]);
          setRoutes([]);
          setIsInitialLoad(false);
          return;
        }
      } catch (e) {
        console.warn('Ensure tradeshow event failed:', e);
        setEvent(defaultEvent);
        setBooths([]);
        setVendors([]);
        setRoutes([]);
        setIsInitialLoad(false);
        return;
      }

      setEvent(ensuredEvent);
      setVendors([]);
      setRoutes([]);

      try {
        if (ensuredEvent?.id) {
          // ALWAYS load from backend
          let normalized = [];
          const layoutResp = await TradeshowAPI.loadLayout(ensuredEvent.id);
          if (layoutResp.success) {
            normalized = layoutResp.data
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

          // Load routes from backend
          const routesResp = await TradeshowAPI.getRoutes(ensuredEvent.id);
          if (routesResp.success) {
            // Create a Set of valid booth IDs for filtering
            const validBoothIds = new Set(normalized.map(b => b.id));

            const backendRoutes = routesResp.data.map(route => {
              // Filter booth_order to only include valid booth IDs that exist in the layout
              const filteredBoothOrder = (route.booth_order || []).filter(boothId => {
                const isValid = validBoothIds.has(boothId);
                if (!isValid) {
                  console.warn(`Route "${route.name}" contains invalid booth ID: ${boothId}, removing it`);
                }
                return isValid;
              });

              return {
                id: route.id,
                name: route.name,
                description: route.description || '',
                color: route.color || '#3B82F6',
                boothOrder: filteredBoothOrder,
                routeType: route.route_type || 'custom',
              };
            });
            setRoutes(backendRoutes);
            console.log(`✓ Loaded ${backendRoutes.length} routes from backend`);
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
  const handleAddRoute = async (route) => {
    if (!event?.id) {
      alert('No event selected. Please save the event first.');
      return;
    }

    try {
      const response = await TradeshowAPI.createRoute({
        eventId: event.id,
        name: route.name,
        description: route.description || '',
        routeType: route.routeType || 'custom',
        boothOrder: route.boothOrder || [],
        color: route.color || '#3B82F6',
      });

      if (response.success) {
        const newRoute = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          color: response.data.color || '#3B82F6',
          boothOrder: response.data.booth_order || [],
          routeType: response.data.route_type || 'custom',
        };
        setRoutes([...routes, newRoute]);
        console.log('✓ Route created successfully');
      } else {
        throw new Error(response.error || 'Failed to create route');
      }
    } catch (error) {
      console.error('Failed to create route:', error);
      alert(`Failed to create route: ${error.message}`);
    }
  };

  const handleUpdateRoute = async (routeId, updates) => {
    if (!event?.id) {
      alert('No event selected.');
      return;
    }

    try {
      const response = await TradeshowAPI.updateRoute(event.id, routeId, {
        name: updates.name,
        description: updates.description || '',
        routeType: updates.routeType || 'custom',
        boothOrder: updates.boothOrder || [],
        color: updates.color || '#3B82F6',
      });

      if (response.success) {
        const updatedRoute = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          color: response.data.color || '#3B82F6',
          boothOrder: response.data.booth_order || [],
          routeType: response.data.route_type || 'custom',
        };
        setRoutes(routes.map(r => (r.id === routeId ? updatedRoute : r)));
        console.log('✓ Route updated successfully');
      } else {
        throw new Error(response.error || 'Failed to update route');
      }
    } catch (error) {
      console.error('Failed to update route:', error);
      alert(`Failed to update route: ${error.message}`);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!event?.id) {
      alert('No event selected.');
      return;
    }

    if (!confirm('Are you sure you want to delete this route?')) {
      return;
    }

    try {
      const response = await TradeshowAPI.deleteRoute(event.id, routeId);

      if (response.success) {
        setRoutes(routes.filter(r => r.id !== routeId));
        if (activeRouteId === routeId) {
          setActiveRouteId(null);
        }
        console.log('✓ Route deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete route');
      }
    } catch (error) {
      console.error('Failed to delete route:', error);
      alert(`Failed to delete route: ${error.message}`);
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
  // console.log("active route id::", activeRouteId)

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
            const currentValues = event || {};
            let currentEventId = currentValues.id || null;

            if (!currentEventId) {
              const createResp = await TradeshowAPI.createEvent({
                name: currentValues.name || 'New Tradeshow Event',
                description: currentValues.description || '',
                hallWidth: currentValues.hallWidth,
                hallHeight: currentValues.hallHeight,
                date: currentValues.date,
              });
              if (!createResp.success || !createResp.data?.id) {
                throw new Error(createResp.error || 'Failed to create event');
              }
              const created = createResp.data;
              currentEventId = created.id;
              const normalized = {
                id: created.id,
                name: created.name || currentValues.name || 'New Tradeshow Event',
                description: created.description || currentValues.description || '',
                date: created.date || currentValues.date || new Date().toISOString().split('T')[0],
                hallWidth: created.hall_width ?? currentValues.hallWidth ?? 40,
                hallHeight: created.hall_height ?? currentValues.hallHeight ?? 30,
              };
              setEvent(normalized);
              navigate(`/tradeshow?eventId=${created.id}`, { replace: true });
            }

            const updateResult = await TradeshowAPI.updateEvent(currentEventId, {
              name: currentValues.name,
              description: currentValues.description,
              hallWidth: currentValues.hallWidth,
              hallHeight: currentValues.hallHeight,
            });
            if (!updateResult.success) {
              throw new Error(updateResult.error || 'Failed to update event details');
            }
            if (updateResult.data) {
              const updated = updateResult.data;
              setEvent(prev => ({
                ...prev,
                name: updated.name ?? prev?.name,
                description: updated.description ?? prev?.description,
                hallWidth: Number(updated.hall_width ?? prev?.hallWidth ?? 40),
                hallHeight: Number(updated.hall_height ?? prev?.hallHeight ?? 30),
              }));
            }

            // Create a mapping of old (temp) IDs to booth data for later matching
            const oldBoothsMap = new Map();
            booths.forEach(booth => {
              // Use position and type as matching key
              const key = `${booth.type}_${booth.x}_${booth.y}_${booth.width}_${booth.height}`;
              oldBoothsMap.set(booth.id, { booth, matchKey: key });
            });

            // Save booths to backend
            const saveResult = await TradeshowAPI.saveLayout(currentEventId, booths);
            if (saveResult.success) {
              // Reload booths from backend to get UUIDs
              const layoutResp = await TradeshowAPI.loadLayout(currentEventId);
              if (layoutResp.success) {
                const backendBooths = layoutResp.data
                  .map(normalizeTradeshowBooth)
                  .filter(Boolean);
                
                // Create ID mapping: oldID -> newID
                const idMapping = new Map();
                backendBooths.forEach(newBooth => {
                  const newKey = `${newBooth.type}_${newBooth.x}_${newBooth.y}_${newBooth.width}_${newBooth.height}`;
                  // Find the old booth with matching key
                  for (const [oldId, { matchKey }] of oldBoothsMap.entries()) {
                    if (matchKey === newKey && !idMapping.has(oldId)) {
                      idMapping.set(oldId, newBooth.id);
                      break;
                    }
                  }
                });

                // Update routes with new booth IDs
                // Create a Set of valid booth IDs for quick lookup
                const validBoothIds = new Set(backendBooths.map(b => b.id));

                const updatedRoutes = routes.map(route => {
                  const updatedBoothOrder = route.boothOrder
                    .map(oldBoothId => {
                      // Try to get the mapped ID first
                      const newId = idMapping.get(oldBoothId);
                      if (newId) return newId;
                      // If no mapping exists, check if the ID is valid (exists in current booths)
                      return validBoothIds.has(oldBoothId) ? oldBoothId : null;
                    })
                    .filter(Boolean);  // Remove null/undefined values (invalid booth IDs)

                  // Always save if booth order is different OR if it contains invalid IDs
                  const needsUpdate = JSON.stringify(updatedBoothOrder) !== JSON.stringify(route.boothOrder);
                  if (needsUpdate) {
                    // Update route in backend asynchronously
                    TradeshowAPI.updateRoute(currentEventId, route.id, {
                      name: route.name,
                      description: route.description,
                      routeType: route.routeType,
                      boothOrder: updatedBoothOrder,
                      color: route.color,
                    }).then(response => {
                      if (response.success) {
                        console.log(`✓ Updated route "${route.name}" - cleaned ${route.boothOrder.length - updatedBoothOrder.length} invalid booth IDs`);
                      }
                    }).catch(err => {
                      console.error(`Failed to update route ${route.name}:`, err);
                    });
                  }

                  return {
                    ...route,
                    boothOrder: updatedBoothOrder,
                  };
                });

                setBooths(backendBooths);
                setRoutes(updatedRoutes);
                console.log(`✓ Saved ${saveResult.data.saved} booths and updated routes`);
                alert(`✓ Saved ${saveResult.data.saved} booths to event`);
              }
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
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Event Name:</label>
          <input
            type="text"
            value={event.name}
            onChange={(e) => setEvent({ ...event, name: e.target.value })}
            className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter event name"
          />
        </div>
        <div className="h-6 w-px bg-gray-200 hidden md:block" />
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
            routeSteps={routeStepsForCanvas}
            activeRouteId={activeRouteId}
            draggingVendorId={draggingVendorId}
            onAssignVendor={handleAssignVendorToBooth}
            onVendorDragEnd={handleVendorDragEnd}
          />
        </div>

        {/* Right: Properties, Routes, and Vendor panels - improved layout */}
        <div className="w-[480px] flex flex-col overflow-hidden border-l border-gray-200 bg-white">
          {selectedBooth && (
            <div className="flex-shrink-0 border-b border-gray-200" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <PropertiesPanel
                selectedElement={selectedBooth}
                onUpdateElement={handleUpdateBooth}
                onDeleteElement={handleDeleteBooth}
                onDuplicateElement={handleDuplicateBooth}
              />
            </div>
          )}
          <div className="flex-shrink-0 border-b border-gray-200" style={{ maxHeight: '450px', overflowY: 'auto' }}>
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
