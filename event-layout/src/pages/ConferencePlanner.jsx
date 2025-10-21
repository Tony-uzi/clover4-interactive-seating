// Conference Planner main page

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Toolbar from '../components/shared/Toolbar';
import ElementToolbar from '../components/conference/ElementToolbar';
import ConferenceCanvas from '../components/conference/ConferenceCanvas';
import GuestPanel from '../components/conference/GuestPanel';
import PropertiesPanel from '../components/conference/PropertiesPanel';
import {
  loadConferenceEvent,
  saveConferenceEvent,
  loadConferenceLayout,
  saveConferenceLayout,
  loadConferenceGuests,
  saveConferenceGuests,
  loadConferenceGroups,
  saveConferenceGroups,
} from '../lib/utils/storage';
import { parseGuestCSV, guestsToCSV, guestsToCSVFiltered, exportGuestsByGroup, downloadCSV } from '../lib/utils/csvParser';
import { jsPDF } from 'jspdf';
import * as ConferenceAPI from '../server-actions/conference-planner';
import { createOrGetDesign, saveDesignVersion } from '../lib/api';
import { normalizeConferenceGuest, normalizeConferenceElement } from '../lib/utils/normalizers';

export default function ConferencePlanner() {
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [elements, setElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [draggingGuestId, setDraggingGuestId] = useState(null);
  const saveLayoutTimerRef = useRef(null);
  const saveEventTimerRef = useRef(null);
  const [designId, setDesignId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [canvasVersion, setCanvasVersion] = useState(0);

  const mapBackendGuest = normalizeConferenceGuest;

  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load data on mount and ensure backend event exists
  useEffect(() => {
    (async () => {
      const loadedEvent = loadConferenceEvent();
      const loadedLayout = loadConferenceLayout();
      const loadedGuests = loadConferenceGuests();
      const loadedGroups = loadConferenceGroups();

      let ensuredEvent = loadedEvent;
      try {
        if (!loadedEvent?.id) {
          const resp = await ConferenceAPI.createEvent(loadedEvent);
          if (resp.success) {
            ensuredEvent = {
              ...loadedEvent,
              id: resp.data.id,
              roomWidth: resp.data.room_width ?? loadedEvent.roomWidth,
              roomHeight: resp.data.room_height ?? loadedEvent.roomHeight,
            };
            saveConferenceEvent(ensuredEvent);
          }
        }
      } catch (e) {
        console.warn('Ensure event failed:', e);
      }

      // Set initial state from localStorage (will be overwritten by backend data if available)
      setEvent(ensuredEvent);
      setElements(loadedLayout);
      setGuests(loadedGuests);
      setGroups(loadedGroups);

      // ALWAYS try to load from backend if event ID exists - backend is source of truth
      if (ensuredEvent?.id) {
        try {
          // Load guests from backend
          const guestsResp = await ConferenceAPI.getGuests(ensuredEvent.id);
          if (guestsResp.success) {
            const backendGuests = guestsResp.data.map(mapBackendGuest);
            setGuests(backendGuests);
            saveConferenceGuests(backendGuests);
            console.log(`✓ Loaded ${backendGuests.length} guests from backend (source of truth)`);
          } else {
            console.warn('Failed to load guests from backend:', guestsResp.error);
          }

          // Load elements from backend - ALWAYS use backend data, not localStorage
          const elementsResp = await ConferenceAPI.getElements(ensuredEvent.id);
          if (elementsResp.success) {
            const backendElements = elementsResp.data
              .map(normalizeConferenceElement)
              .filter(Boolean);
            setElements(backendElements);
            saveConferenceLayout(backendElements);
            console.log(`✓ Loaded ${backendElements.length} elements from backend (source of truth)`);
          } else {
            console.warn('Failed to load elements from backend:', elementsResp.error);
            // If backend fails, use empty array to avoid confusion
            setElements([]);
            saveConferenceLayout([]);
          }
        } catch (e) {
          console.error('Failed to load from backend:', e);
          // On error, clear elements to avoid showing stale localStorage data
          setElements([]);
          saveConferenceLayout([]);
        }
      }

      // If URL provides a designId, load from design system (this takes precedence)
      try {
        const params = new URLSearchParams(location.search);
        const providedDesignId = params.get('designId');
        if (providedDesignId) {
          // load from cloud design system
          const { getLatestDesign } = await import('../lib/api');
          const latest = await getLatestDesign(providedDesignId);
          const items = Array.isArray(latest.data) ? latest.data : latest.data.items || [];
          if (Array.isArray(items) && items.length) {
            setElements(items);
            saveConferenceLayout(items);
            setDesignId(parseInt(providedDesignId, 10));
            try { localStorage.setItem('designId.conference', String(providedDesignId)); } catch {}
          }
        }
      } catch (e) {
        console.warn('Load backend layout failed:', e);
      }

      setTimeout(() => setIsInitialLoad(false), 100);
    })();
  }, [location.search]);

  // Auto-save (skip during initial load to prevent overwriting)
  useEffect(() => {
    if (event && !isInitialLoad) {
      saveConferenceEvent(event);
      if (saveEventTimerRef.current) clearTimeout(saveEventTimerRef.current);
      if (event.id) {
        saveEventTimerRef.current = setTimeout(async () => {
          try {
            await ConferenceAPI.updateEvent(event.id, {
              name: event.name,
              description: event.description,
              roomWidth: event.roomWidth,
              roomHeight: event.roomHeight,
            });
          } catch (e) {
            console.warn('Auto-save event failed:', e);
          }
        }, 600);
      }
    }
  }, [event, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveConferenceLayout(elements);
      if (saveLayoutTimerRef.current) clearTimeout(saveLayoutTimerRef.current);
      if (event?.id) {
        saveLayoutTimerRef.current = setTimeout(async () => {
          try {
            await ConferenceAPI.saveLayout(event.id, elements);
          } catch (e) {
            console.warn('Auto-save layout failed:', e);
          }
        }, 600);
      }
    }
  }, [elements, isInitialLoad, event?.id]);

  // Mark dirty on changes
  useEffect(() => {
    if (isInitialLoad) return;
    setDirty(true);
  }, [elements, event?.name, event?.roomWidth, event?.roomHeight, isInitialLoad]);

  // beforeunload warning
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
      saveConferenceGuests(guests);
    }
  }, [guests, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveConferenceGroups(groups);
    }
  }, [groups, isInitialLoad]);

  // Get selected element
  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Element operations
  const handleAddElement = (element) => {
    setElements([...elements, element]);
    setSelectedElementId(element.id);
  };

  const handleUpdateElement = (updatedElement) => {
    setElements(elements.map(el => (el.id === updatedElement.id ? updatedElement : el)));
  };

  const handleDeleteElement = (elementId) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElementId(null);
  };

  const handleDuplicateElement = (element) => {
    const duplicate = {
      ...element,
      id: `${element.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 1,
      y: element.y + 1,
    };
    setElements([...elements, duplicate]);
    setSelectedElementId(duplicate.id);
  };

  // Guest operations
  const handleAddGuest = async (guest) => {
    // Add to local state immediately with temporary ID
    const tempGuest = {
      ...guest,
      id: guest.id || `temp_${Date.now()}`,
    };
    const normalizedTempGuest = normalizeConferenceGuest(tempGuest);
    setGuests(prevGuests => {
      const updated = [...prevGuests, normalizedTempGuest];
      saveConferenceGuests(updated);
      return updated;
    });
    
    // Try to save to backend if event exists
    if (event?.id) {
      try {
        const result = await ConferenceAPI.createGuest(event.id, guest);
        if (result.success && result.data) {
          // Replace temp guest with backend guest (which has real UUID)
          const backendGuest = mapBackendGuest(result.data);
          setGuests(prevGuests => {
            const updated = prevGuests.map(g => g.id === tempGuest.id ? backendGuest : g);
            saveConferenceGuests(updated);
            return updated;
          });
          console.log('✓ Guest created in backend with ID:', result.data.id);
        } else {
          console.warn('Failed to create guest in backend:', result.error);
        }
      } catch (error) {
        console.warn('Failed to save guest to backend:', error);
        // Keep the local guest even if backend fails
      }
    }
  };

  const handleUpdateGuest = (guestId, updates) => {
    setGuests(prevGuests => {
      const updated = prevGuests.map(g =>
        g.id === guestId ? normalizeConferenceGuest({ ...g, ...updates }) : g
      );
      saveConferenceGuests(updated);
      return updated;
    });
  };

  const handleDeleteGuest = (guestId) => {
    setGuests(prevGuests => prevGuests.filter(g => g.id !== guestId));
  };

  const handleGuestDragStart = (guestId) => {
    setDraggingGuestId(String(guestId));
  };

  const handleGuestDragEnd = () => {
    setDraggingGuestId(null);
  };

  // Group operations
  const handleAddGroup = (group) => {
    setGroups([...groups, group]);
  };

  const handleUpdateGroup = (groupId, updates) => {
    setGroups(groups.map(g => (g.id === groupId ? { ...g, ...updates } : g)));
  };

  const handleDeleteGroup = (groupId) => {
    setGroups(groups.filter(g => g.id !== groupId));
    // Note: Guests with this group will keep the group name, but it won't be in the managed list
  };

  const handleAssignGuestToElement = async (guestId, element) => {
    if (!element) return;
    const normalizedGuestId = String(guestId);

    const existingGuest = guests.find(g => String(g.id) === normalizedGuestId);
    const previousAssignmentId = existingGuest?.seatAssignmentId;

    // Helper to check if a string is a valid UUID
    const isValidUUID = (str) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    setGuests(prevGuests => {
      const updated = prevGuests.map(guest =>
        String(guest.id) === normalizedGuestId
          ? {
              ...guest,
              seatAssignmentId: guest.seatAssignmentId || null,
              elementId: element.id,
              tableNumber: element.label || null,
              seatNumber: null,
            }
          : guest
      );
      saveConferenceGuests(updated);
      return updated;
    });
    setDraggingGuestId(null);

    if (event?.id && existingGuest) {
      try {
        // Check if guest has a valid UUID (from backend)
        let validGuestId = normalizedGuestId;
        
        if (!isValidUUID(normalizedGuestId)) {
          // Guest has a temporary frontend ID, need to save guest first
          console.log('Guest has temporary ID, saving to backend to get UUID...');
          
          const result = await ConferenceAPI.createGuest(event.id, existingGuest);
          if (!result.success || !result.data) {
            throw new Error('Failed to create guest in backend before assignment');
          }
          
          const backendGuest = mapBackendGuest(result.data);
          validGuestId = backendGuest.id;
          
          // Update guest state with backend UUID
          setGuests(prevGuests => {
            const updated = prevGuests.map(g => g.id === normalizedGuestId ? backendGuest : g);
            saveConferenceGuests(updated);
            return updated;
          });
          console.log('✓ Guest saved to backend with UUID:', validGuestId);
        }
        
        // Check if element has a valid UUID (from backend)
        let validElementId = element.id;
        
        if (!isValidUUID(element.id)) {
          // Element has a temporary frontend ID, need to save layout first
          console.log('Element has temporary ID, saving layout to get backend UUID...');
          
          // Create a mapping of temp IDs to their original data for matching
          const tempIdMap = new Map();
          elements.forEach(el => {
            if (!isValidUUID(el.id)) {
              tempIdMap.set(el.id, {
                x: el.x,
                y: el.y,
                type: el.type,
                label: el.label
              });
            }
          });
          
          // Save the layout
          const saveResult = await ConferenceAPI.saveLayout(event.id, elements);
          if (!saveResult.success) {
            throw new Error('Failed to save layout before assignment');
          }
          
          // The saveLayout response includes the saved elements with UUIDs
          const savedElements = saveResult.data?.elements || [];
          
          if (!savedElements || savedElements.length === 0) {
            throw new Error('No elements returned from save layout');
          }
          
          // Map saved elements to frontend format
          const backendElements = savedElements
            .map(normalizeConferenceElement)
            .filter(Boolean);
          
          // Find matching element by comparing original temp element data with saved elements
          const tempData = tempIdMap.get(element.id);
          const matchingElement = backendElements.find(el => {
            return tempData && 
              Math.abs(parseFloat(el.x) - parseFloat(tempData.x)) < 0.01 && 
              Math.abs(parseFloat(el.y) - parseFloat(tempData.y)) < 0.01 &&
              (el.type === tempData.type || el.type === 'table_rectangle' && tempData.type === 'table_rect');
          });
          
          if (!matchingElement) {
            console.error('Failed to find matching element. Looking for:', tempData, 'in:', backendElements);
            throw new Error('Could not find matching element after saving layout');
          }
          
          validElementId = matchingElement.id;
          
          // Update elements state with backend UUIDs
          setElements(backendElements);
          saveConferenceLayout(backendElements);
          console.log('✓ Layout saved and reloaded with backend UUIDs');
        }
        
        // Now proceed with seat assignment using valid UUIDs
        if (previousAssignmentId) {
          await ConferenceAPI.deleteSeatAssignment(event.id, previousAssignmentId);
        }
        
        const assignmentResp = await ConferenceAPI.createSeatAssignment(event.id, {
          guestId: validGuestId,
          elementId: validElementId,
          seatNumber: null,
        });
        
        if (assignmentResp.success && assignmentResp.data?.id) {
          setGuests(prevGuests => {
            const updated = prevGuests.map(guest => {
              const guestIdStr = String(guest.id);
              // Match by either the original temp ID or the new valid ID
              if (guestIdStr === normalizedGuestId || guestIdStr === validGuestId) {
                return {
                  ...guest,
                  id: validGuestId,  // Ensure we use the valid UUID
                  seatAssignmentId: assignmentResp.data.id,
                  elementId: validElementId,
                  tableNumber: element.label || null,
                  seatNumber: assignmentResp.data.seat_number || null,
                };
              }
              return guest;
            });
            saveConferenceGuests(updated);
            return updated;
          });
          console.log(`✓ Saved guest assignment to backend`);
        } else if (!assignmentResp.success) {
          throw new Error(assignmentResp.error || 'Unknown assignment error');
        }
      } catch (backendError) {
        console.warn('Failed to save guest assignment to backend:', backendError);
        alert(`Failed to assign guest: ${backendError.message || 'Unknown error'}`);
        try {
          const refreshedGuestsResp = await ConferenceAPI.getGuests(event.id);
          if (refreshedGuestsResp.success) {
            const backendGuests = refreshedGuestsResp.data.map(mapBackendGuest);
            setGuests(backendGuests);
            saveConferenceGuests(backendGuests);
          }
        } catch (refreshError) {
          console.warn('Failed to refresh guests after assignment error:', refreshError);
        }
      }
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
      const importedGuests = await parseGuestCSV(file);
      const normalizedImported = importedGuests
        .map(normalizeConferenceGuest)
        .filter(Boolean);
      if (normalizedImported.length === 0) {
        alert('No valid guest information found, please check CSV content');
      } else {
        let importedCount = normalizedImported.length;
        let syncedWithBackend = false;

        if (event?.id) {
          try {
            const result = await ConferenceAPI.bulkImportGuests(event.id, file);
            if (result.success) {
              importedCount = result.data?.imported || result.data?.count || importedCount;
              syncedWithBackend = true;

              try {
                const refreshedGuestsResp = await ConferenceAPI.getGuests(event.id);
                if (refreshedGuestsResp.success) {
                  const backendGuests = refreshedGuestsResp.data.map(mapBackendGuest);
                  setGuests(backendGuests);
                  saveConferenceGuests(backendGuests);
                  console.log(`✓ Synced ${backendGuests.length} guests from backend after import`);
                } else {
                  console.warn('Failed to refresh guests: backend response unsuccessful');
                }
              } catch (refreshError) {
                console.warn('Failed to refresh guests from backend after import:', refreshError);
              }
            } else {
              console.warn('Bulk import API reported failure, falling back to local storage:', result.error);
            }
          } catch (backendError) {
            console.warn('Failed to save guests to backend, saved to localStorage only:', backendError);
          }
        }

        if (!syncedWithBackend) {
          setGuests(prevGuests => {
            const updated = [...prevGuests, ...normalizedImported];
            saveConferenceGuests(updated);
            return updated;
          });
        }

        alert(`Successfully imported ${importedCount} guest(s)!${syncedWithBackend ? '' : '（仅保存在本地，尚未同步至后台）'}`);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      alert('Import failed, please check CSV format');
    }

    // Reset input
    e.target.value = '';
  };

  // CSV Export
  const handleExportCSV = () => {
    const csv = guestsToCSV(guests);
    downloadCSV(csv, `conference-guests-${Date.now()}.csv`);
  };

  // CSV Export Filtered by Dietary Preference
  const handleExportCSVFiltered = (dietaryPreference) => {
    const csv = guestsToCSVFiltered(guests, dietaryPreference);
    downloadCSV(csv, `conference-guests-${dietaryPreference.toLowerCase()}-${Date.now()}.csv`);
  };

  // Excel Export by Group with Highlighting
  const handleExportCSVByGroup = () => {
    exportGuestsByGroup(guests);
  };

  // PDF Export
  const handleExportPDF = () => {
    const exportTools = canvasRef.current;
    if (!exportTools || typeof exportTools.exportLayoutImage !== 'function') {
      alert('Unable to export at this time, please try again later');
      return;
    }

    const imageData = exportTools.exportLayoutImage();
    if (!imageData) {
      alert('No layout content to export');
      return;
    }

    const { dataURL, width, height } = imageData;

    const orientation = width >= height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const aspectRatio = height / width;

    let renderWidth = availableWidth;
    let renderHeight = renderWidth * aspectRatio;

    if (renderHeight > availableHeight) {
      renderHeight = availableHeight;
      renderWidth = renderHeight / aspectRatio;
    }

    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    pdf.addImage(dataURL, 'PNG', offsetX, offsetY, renderWidth, renderHeight);
    pdf.save(`conference-layout-${Date.now()}.pdf`);
  };

  // Clear - clears both backend and localStorage
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear ALL layout elements? This will delete all tables, chairs, and other elements from both the canvas and the backend. This action cannot be undone!')) {
      return;
    }
    
    try {
      // Clear local state first for immediate UI feedback
      setElements([]);
      setSelectedElementId(null);
      setDraggingGuestId(null);
      
      // Clear localStorage
      saveConferenceLayout([]);
      
      // Clear backend by saving empty layout
      if (event?.id) {
        const result = await ConferenceAPI.saveLayout(event.id, []);
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
            // ask for name to create/get design consistently
            let desiredName = (event?.name || '').trim();
            const input = prompt('请输入要保存的文件名', desiredName || 'Untitled Conference');
            if (!input) return;
            desiredName = input.trim();
            if (desiredName && desiredName !== event.name) {
              const next = { ...event, name: desiredName };
              setEvent(next);
            }
            let did = designId;
            if (!did) {
              const d = await createOrGetDesign(desiredName || event.name, 'conference');
              did = d.id;
              setDesignId(did);
              try { localStorage.setItem('designId.conference', String(did)); } catch {}
            }
            const payload = { items: elements, meta: { name: desiredName || event.name, kind: 'conference', roomWidth: event.roomWidth, roomHeight: event.roomHeight } };
            await saveDesignVersion(did, payload, 'manual save');
            setDirty(false);
            alert('Saved to cloud');
          } catch (e) {
            alert(e.message || 'Save failed');
          }
        }}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onExportCSVFiltered={handleExportCSVFiltered}
        onExportCSVByGroup={handleExportCSVByGroup}
        onImportCSV={handleImportCSV}
        onClear={handleClear}
      />

      {/* Canvas Size Input */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Canvas Size:</label>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Width(m):</label>
          <input
            type="number"
            min="5"
            max="100"
            step="0.5"
            value={event.roomWidth}
            onChange={(e) => {
              const newWidth = parseFloat(e.target.value) || event.roomWidth;
              setEvent({ ...event, roomWidth: newWidth });
            }}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Height(m):</label>
          <input
            type="number"
            min="5"
            max="100"
            step="0.5"
            value={event.roomHeight}
            onChange={(e) => {
              const newHeight = parseFloat(e.target.value) || event.roomHeight;
              setEvent({ ...event, roomHeight: newHeight });
            }}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <span className="text-xs text-gray-500">Tip: Drag corner points to adjust for irregular shapes</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Element toolbar */}
        <ElementToolbar onAddElement={handleAddElement} />

        {/* Center: Canvas - now takes full height */}
        <div className="flex-1 min-w-0 flex flex-col">
          <ConferenceCanvas
            ref={canvasRef}
            key={canvasVersion}
            elements={elements}
            onElementsChange={setElements}
            roomWidth={event.roomWidth}
            roomHeight={event.roomHeight}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            guests={guests}
            draggingGuestId={draggingGuestId}
            onAssignGuest={handleAssignGuestToElement}
            onGuestDragEnd={handleGuestDragEnd}
            onRoomResize={(width, height) => {
              setEvent({ ...event, roomWidth: width, roomHeight: height });
            }}
          />
        </div>

        {/* Right: Properties and Guest panel - improved layout */}
        <div className="w-96 flex flex-col overflow-hidden border-l border-gray-200 bg-white">
          {selectedElement && (
            <div className="flex-shrink-0 border-b border-gray-200" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <PropertiesPanel
                selectedElement={selectedElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
              />
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-hidden">
            <GuestPanel
              guests={guests}
              groups={groups}
              onAddGroup={handleAddGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddGuest={handleAddGuest}
              onUpdateGuest={handleUpdateGuest}
              onDeleteGuest={handleDeleteGuest}
              onGuestDragStart={handleGuestDragStart}
              onGuestDragEnd={handleGuestDragEnd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
