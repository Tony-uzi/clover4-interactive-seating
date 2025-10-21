// Tradeshow Planner main page

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Toolbar from '../components/shared/Toolbar';
import BoothToolbar from '../components/tradeshow/BoothToolbar';
import TradeshowCanvas from '../components/tradeshow/TradeshowCanvas';
import VendorPanel from '../components/tradeshow/VendorPanel';
import RouteManager from '../components/tradeshow/RouteManager';
import PropertiesPanel from '../components/conference/PropertiesPanel';
import {
  loadTradeshowEvent,
  saveTradeshowEvent,
  loadTradeshowLayout,
  saveTradeshowLayout,
  loadTradeshowVendors,
  saveTradeshowVendors,
  loadTradeshowRoutes,
  saveTradeshowRoutes,
} from '../lib/utils/storage';
import { parseVendorCSV, vendorsToCSV, downloadCSV } from '../lib/utils/csvParser';
import { jsPDF } from 'jspdf';
import * as TradeshowAPI from '../server-actions/tradeshow-planner';
import { createOrGetDesign, saveDesignVersion } from '../lib/api';
import { normalizeTradeshowVendor, normalizeTradeshowBooth } from '../lib/utils/normalizers';

export default function TradeshowPlanner() {
  const location = useLocation();
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
  const [designId, setDesignId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [canvasVersion, setCanvasVersion] = useState(0);
  
  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const mapBackendVendor = normalizeTradeshowVendor;

  // Load data on mount and ensure backend event exists
  useEffect(() => {
    (async () => {
      const loadedEvent = loadTradeshowEvent();
      const loadedLayout = loadTradeshowLayout();
      const loadedVendors = loadTradeshowVendors();
      const loadedRoutes = loadTradeshowRoutes();

      let ensuredEvent = loadedEvent;
      try {
        if (!loadedEvent?.id) {
          const resp = await TradeshowAPI.createEvent(loadedEvent);
          if (resp.success) {
            ensuredEvent = {
              ...loadedEvent,
              id: resp.data.id,
              hallWidth: resp.data.hall_width ?? loadedEvent.hallWidth,
              hallHeight: resp.data.hall_height ?? loadedEvent.hallHeight,
            };
            saveTradeshowEvent(ensuredEvent);
          }
        }
      } catch (e) {
        console.warn('Ensure tradeshow event failed:', e);
      }

      // Set initial state from localStorage (will be overwritten by backend data if available)
      setEvent(ensuredEvent);
      setBooths(loadedLayout);
      setVendors(loadedVendors);
      setRoutes(loadedRoutes);

      try {
        const params = new URLSearchParams(location.search);
        const providedDesignId = params.get('designId');
        if (providedDesignId) {
          const { getLatestDesign } = await import('../lib/api');
          const latest = await getLatestDesign(providedDesignId);
          const items = Array.isArray(latest.data) ? latest.data : latest.data.items || [];
          if (Array.isArray(items) && items.length) {
            setBooths(items);
            saveTradeshowLayout(items);
            setDesignId(parseInt(providedDesignId, 10));
            try { localStorage.setItem('designId.tradeshow', String(providedDesignId)); } catch {}
          }
        } else if (ensuredEvent?.id) {
          // ALWAYS load from backend - backend is source of truth
          const layoutResp = await TradeshowAPI.loadLayout(ensuredEvent.id);
          if (layoutResp.success) {
            const normalized = layoutResp.data
              .map(normalizeTradeshowBooth)
              .filter(Boolean);
            setBooths(normalized);
            saveTradeshowLayout(normalized);
            console.log(`✓ Loaded ${normalized.length} booths from backend (source of truth)`);
          } else {
            console.warn('Failed to load layout from backend:', layoutResp.error);
            // If backend fails, use empty array to avoid confusion
            setBooths([]);
            saveTradeshowLayout([]);
          }
        }
      } catch (e) {
        console.error('Load tradeshow backend layout failed:', e);
        // On error, clear booths to avoid showing stale localStorage data
        setBooths([]);
        saveTradeshowLayout([]);
      }

      setTimeout(() => setIsInitialLoad(false), 100);
    })();
  }, [location.search]);

  // Auto-save (skip during initial load to prevent overwriting)
  useEffect(() => {
    if (event && !isInitialLoad) {
      saveTradeshowEvent(event);
      if (saveEventTimerRef.current) clearTimeout(saveEventTimerRef.current);
      if (event.id) {
        saveEventTimerRef.current = setTimeout(async () => {
          try {
            await TradeshowAPI.updateEvent(event.id, {
              name: event.name,
              description: event.description,
              hallWidth: event.hallWidth,
              hallHeight: event.hallHeight,
            });
          } catch (e) {
            console.warn('Auto-save tradeshow event failed:', e);
          }
        }, 600);
      }
    }
  }, [event, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveTradeshowLayout(booths);
      if (saveLayoutTimerRef.current) clearTimeout(saveLayoutTimerRef.current);
      if (event?.id) {
        saveLayoutTimerRef.current = setTimeout(async () => {
          try {
            await TradeshowAPI.saveLayout(event.id, booths);
          } catch (e) {
            console.warn('Auto-save tradeshow layout failed:', e);
          }
        }, 600);
      }
    }
  }, [booths, isInitialLoad, event?.id]);

  // Mark dirty on changes and guard beforeunload
  useEffect(() => {
    if (isInitialLoad) return;
    setDirty(true);
  }, [booths, event?.name, event?.hallWidth, event?.hallHeight, isInitialLoad]);

  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveTradeshowVendors(vendors);
    }
  }, [vendors, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveTradeshowRoutes(routes);
    }
  }, [routes, isInitialLoad]);

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
      saveTradeshowVendors(updated);
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
            ).map(normalizeTradeshowVendor).filter(Boolean);
            saveTradeshowVendors(updated);
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
        v.id === vendorId ? normalizeTradeshowVendor({ ...v, ...updates }) : v
      );
      saveTradeshowVendors(updated);
      return updated;
    });
  };

  const handleDeleteVendor = (vendorId) => {
    setVendors(prevVendors => {
      const updated = prevVendors.filter(v => v.id !== vendorId);
      saveTradeshowVendors(updated);
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
      const updated = prevVendors.map(vendor => {
        if (String(vendor.id) === normalizedVendorId) {
          return normalizeTradeshowVendor({
            ...vendor,
            boothAssignmentId: vendor.boothAssignmentId || null,
            boothId: booth.id,
            boothNumber: booth.label || null,
          });
        }
        return normalizeTradeshowVendor(vendor);
      }).filter(Boolean);
      saveTradeshowVendors(updated);
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
              v.id === normalizedVendorId ? backendVendor : normalizeTradeshowVendor(v)
            ).filter(Boolean);
            saveTradeshowVendors(updated);
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
          saveTradeshowLayout(backendBooths);
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
              if (vendorIdStr === normalizedVendorId || vendorIdStr === validVendorId) {
                return normalizeTradeshowVendor({
                  ...vendor,
                  id: validVendorId,
                  boothAssignmentId: assignmentResp.data.id,
                  boothId: validBoothId,
                  boothNumber: booth.label || null,
                });
              }
              return normalizeTradeshowVendor(vendor);
            }).filter(Boolean);
            saveTradeshowVendors(updated);
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
            saveTradeshowVendors(backendVendors);
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

    try {
      const importedVendors = await parseVendorCSV(file);
      const normalizedImported = importedVendors
        .map(normalizeTradeshowVendor)
        .filter(Boolean);

      if (normalizedImported.length === 0) {
        alert('No valid vendor information found, please check CSV content');
      } else {
        let importedCount = normalizedImported.length;
        let syncedWithBackend = false;

        if (event?.id) {
          try {
            const result = await TradeshowAPI.bulkImportVendors(event.id, file);
            if (result.success) {
              importedCount = result.data?.imported || result.data?.count || importedCount;
              syncedWithBackend = true;

              try {
                const refreshedVendorsResp = await TradeshowAPI.getVendors(event.id);
                if (refreshedVendorsResp.success) {
                  const backendVendors = refreshedVendorsResp.data
                    .map(mapBackendVendor)
                    .filter(Boolean);
                  setVendors(backendVendors);
                  saveTradeshowVendors(backendVendors);
                  console.log(`✓ Synced ${backendVendors.length} vendors from backend after import`);
                } else {
                  console.warn('Failed to refresh vendors: backend response unsuccessful');
                }
              } catch (refreshError) {
                console.warn('Failed to refresh vendors from backend after import:', refreshError);
              }
            } else {
              console.warn('Bulk vendor import API reported failure, using local storage only:', result.error);
            }
          } catch (backendError) {
            console.warn('Failed to save vendors to backend, saved to localStorage only:', backendError);
          }
        }

        if (!syncedWithBackend) {
          setVendors(prevVendors => {
            const updated = [...prevVendors, ...normalizedImported];
            saveTradeshowVendors(updated);
            return updated;
          });
        }

        alert(`Successfully imported ${importedCount} vendor(s)!${syncedWithBackend ? '' : '（仅保存在本地，尚未同步至后台）'}`);
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

  // Clear - clears both backend and localStorage
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear ALL layout elements? This will delete all booths and other elements from both the canvas and the backend. This action cannot be undone!')) {
      return;
    }
    
    try {
      // Clear local state first for immediate UI feedback
      setBooths([]);
      setSelectedBoothId(null);
      setDraggingVendorId(null);
      
      // Clear localStorage
      saveTradeshowLayout([]);
      
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
          if (dirty && !confirm('Not saved, leave anyway?')) return;
          window.location.href = '/';
        }}
        onSave={async () => {
          try {
            let desiredName = (event?.name || '').trim();
            const input = prompt('请输入要保存的文件名', desiredName || 'Untitled Tradeshow');
            if (!input) return;
            desiredName = input.trim();
            if (desiredName && desiredName !== event.name) {
              const next = { ...event, name: desiredName };
              setEvent(next);
            }
            let did = designId;
            if (!did) {
              const d = await createOrGetDesign(desiredName || event.name, 'tradeshow');
              did = d.id;
              setDesignId(did);
              try { localStorage.setItem('designId.tradeshow', String(did)); } catch {}
            }
            const payload = { items: booths, meta: { name: desiredName || event.name, kind: 'tradeshow', hallWidth: event.hallWidth, hallHeight: event.hallHeight } };
            await saveDesignVersion(did, payload, 'manual save');
            setDirty(false);
            alert('Saved to cloud');
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
