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

  const mapBackendVendor = (vendor) => ({
    id: vendor.id,
    companyName: vendor.company_name,
    contactName: vendor.contact_name,
    contactEmail: vendor.contact_email,
    contactPhone: vendor.contact_phone,
    category: vendor.category,
    boothSizePreference: vendor.booth_size_preference,
    website: vendor.website,
    logoUrl: vendor.logo_url,
    description: vendor.description,
    boothId: vendor.booth_info?.booth_id ?? vendor.booth_id ?? null,
    boothNumber: vendor.booth_info?.booth_label ?? vendor.booth_label ?? null,
    boothAssignmentId: vendor.booth_info?.assignment_id ?? vendor.assignment_id ?? null,
    checkedIn: vendor.checked_in || false,
  });

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
          const layoutResp = await TradeshowAPI.loadLayout(ensuredEvent.id);
          if (layoutResp.success && Array.isArray(layoutResp.data) && layoutResp.data.length > 0) {
            const normalized = layoutResp.data.map(b => ({
              id: b.id,  // Use the backend UUID directly
              type: b.booth_type,
              label: b.label || '',
              x: b.position_x ?? b.x ?? 0,
              y: b.position_y ?? b.y ?? 0,
              width: b.width || 1,
              height: b.height || 1,
              rotation: b.rotation || 0,
            }));
            setBooths(normalized);
            saveTradeshowLayout(normalized);
          }
        }
      } catch (e) {
        console.warn('Load tradeshow backend layout failed:', e);
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
    const tempVendor = {
      ...vendor,
      id: vendor.id || `temp_${Date.now()}`,
    };
    setVendors(prevVendors => [...prevVendors, tempVendor]);
    
    // Try to save to backend if event exists
    if (event?.id) {
      try {
        const result = await TradeshowAPI.createVendor(event.id, vendor);
        if (result.success && result.data) {
          // Replace temp vendor with backend vendor (which has real UUID)
          const backendVendor = mapBackendVendor(result.data);
          setVendors(prevVendors => 
            prevVendors.map(v => v.id === tempVendor.id ? backendVendor : v)
          );
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
    setVendors(vendors.map(v => (v.id === vendorId ? { ...v, ...updates } : v)));
  };

  const handleDeleteVendor = (vendorId) => {
    setVendors(vendors.filter(v => v.id !== vendorId));
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
          setVendors(prevVendors => 
            prevVendors.map(v => v.id === normalizedVendorId ? backendVendor : v)
          );
          saveTradeshowVendors(vendors.map(v => v.id === normalizedVendorId ? backendVendor : v));
          console.log('✓ Vendor saved to backend with UUID:', validVendorId);
        }
        
        // Check if booth has a valid UUID (from backend)
        let validBoothId = booth.id;
        
        if (!isValidUUID(booth.id)) {
          // Booth has a temporary frontend ID, need to save layout first
          console.log('Booth has temporary ID, saving layout to get backend UUID...');
          
          // Save the layout
          const saveResult = await TradeshowAPI.saveLayout(event.id, booths);
          if (!saveResult.success) {
            throw new Error('Failed to save layout before assignment');
          }
          
          // Reload booths from backend to get real UUIDs
          const boothsResp = await TradeshowAPI.getBooths(event.id);
          if (!boothsResp.success || !boothsResp.data.length) {
            throw new Error('Failed to reload booths after saving');
          }
          
          const backendBooths = boothsResp.data.map(b => ({
            id: b.id,
            type: b.booth_type,
            label: b.label,
            category: b.category,
            x: b.position_x,
            y: b.position_y,
            width: b.width,
            height: b.height,
            rotation: b.rotation || 0,
          }));
          
          // Find the matching booth by label and position
          const matchingBooth = backendBooths.find(b => 
            b.label === booth.label && 
            Math.abs(b.x - booth.x) < 0.1 && 
            Math.abs(b.y - booth.y) < 0.1
          );
          
          if (!matchingBooth) {
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
      setVendors([...vendors, ...importedVendors]);
      alert(`Successfully imported ${importedVendors.length} vendor(s)!`);
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

  // Clear
  const handleClear = () => {
    if (confirm('Are you sure you want to clear the canvas? This action cannot be undone!')) {
      setBooths([]);
      setSelectedBoothId(null);
      setDraggingVendorId(null);
      saveTradeshowLayout([]);
      if (event?.id) {
        TradeshowAPI.saveLayout(event.id, []).catch((e) => {
          console.warn('Failed to persist cleared tradeshow layout:', e);
        });
      }
      setCanvasVersion((prev) => prev + 1);
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
