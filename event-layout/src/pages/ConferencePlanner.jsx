// Conference Planner main page

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toolbar from '../components/shared/Toolbar';
import ElementToolbar from '../components/conference/ElementToolbar';
import ConferenceCanvas from '../components/conference/ConferenceCanvas';
import GuestPanel from '../components/conference/GuestPanel';
import PropertiesPanel from '../components/conference/PropertiesPanel';
import ShareModal from '../components/conference/ShareModal';
// Removed localStorage imports - all data now comes from backend only
import { parseGuestCSV, guestsToCSV, guestsToCSVFiltered, exportGuestsByGroup, downloadCSV } from '../lib/utils/csvParser';
import { jsPDF } from 'jspdf';
import * as ConferenceAPI from '../server-actions/conference-planner';
import { normalizeConferenceGuest, normalizeConferenceElement } from '../lib/utils/normalizers';

export default function ConferencePlanner() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  const mapBackendGuest = normalizeConferenceGuest;

  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load data on mount - BACKEND ONLY, use URL parameter for event ID
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(location.search);
      const urlEventId = params.get('eventId');

      // Default groups (hardcoded)
      const defaultGroups = [
        { id: 'vip', name: 'VIP', color: '#8B5CF6', isSystem: true },
        { id: 'general', name: 'General', color: '#3B82F6', isSystem: true },
        { id: 'staff', name: 'Staff', color: '#10B981', isSystem: true },
        { id: 'speaker', name: 'Speaker', color: '#F59E0B', isSystem: true },
      ];
      setGroups(defaultGroups);

      // Default event structure
      const defaultEvent = {
        name: 'New Conference Event',
        description: '',
        date: new Date().toISOString().split('T')[0],
        roomWidth: 24,
        roomHeight: 16,
        roomVertices: null, // Will be set by canvas if manually modified
      };

      if (!urlEventId) {
        setEvent(defaultEvent);
        setIsInitialLoad(false);
        return;
      }

      let ensuredEvent = defaultEvent;

      try {
        // Try to load existing event from backend using URL event ID
        const eventResp = await ConferenceAPI.getEvent(urlEventId);
        if (eventResp.success && eventResp.data) {
            ensuredEvent = {
              id: eventResp.data.id,
              name: eventResp.data.name || defaultEvent.name,
              description: eventResp.data.description || defaultEvent.description,
              date: eventResp.data.date || defaultEvent.date,
              roomWidth: eventResp.data.room_width ?? defaultEvent.roomWidth,
              roomHeight: eventResp.data.room_height ?? defaultEvent.roomHeight,
              roomVertices: eventResp.data.metadata?.roomVertices || null,
            };
            console.log('✓ Loaded existing event from URL:', ensuredEvent.id);
        } else {
          console.warn('Event ID in URL not found or inaccessible');
          setEvent(defaultEvent);
          setGuests([]);
          setElements([]);
          setIsInitialLoad(false);
          return;
        }
      } catch (e) {
        console.warn('Ensure event failed:', e);
        setEvent(defaultEvent);
        setGuests([]);
        setElements([]);
        setIsInitialLoad(false);
        return;
      }
      setEvent(ensuredEvent);

      // Load ALL data from backend ONLY
      if (ensuredEvent?.id) {
        try {
          // Load guests from backend
          const guestsResp = await ConferenceAPI.getGuests(ensuredEvent.id);
          if (guestsResp.success) {
            const backendGuests = guestsResp.data.map(mapBackendGuest);
            setGuests(backendGuests);
            console.log(`✓ Loaded ${backendGuests.length} guests from backend`);
          } else {
            console.warn('Failed to load guests from backend:', guestsResp.error);
            setGuests([]);
          }

          // Load elements from backend
          const elementsResp = await ConferenceAPI.getElements(ensuredEvent.id);
          if (elementsResp.success) {
            const backendElements = elementsResp.data
              .map(normalizeConferenceElement)
              .filter(Boolean);
            setElements(backendElements);
            console.log(`✓ Loaded ${backendElements.length} elements from backend`);
          } else {
            console.warn('Failed to load elements from backend:', elementsResp.error);
            setElements([]);
          }
        } catch (e) {
          console.error('Failed to load from backend:', e);
          setElements([]);
          setGuests([]);
        }
      }

      setTimeout(() => setIsInitialLoad(false), 100);
    })();
  }, [location.search]);

  // Auto-save disabled - users must manually save using the Save button
  // This prevents duplicate elements caused by React StrictMode double-rendering

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
        let currentEventId = event?.id;

        // If event doesn't exist yet, create it first
        if (!currentEventId) {
          try {
            const createResp = await ConferenceAPI.createEvent({
              name: event?.name || 'New Conference Event',
              description: event?.description || '',
              roomWidth: event?.roomWidth || 24,
              roomHeight: event?.roomHeight || 16,
              roomVertices: event?.roomVertices,
              eventDate: event?.date || new Date().toISOString().split('T')[0],
            });
            if (createResp.success && createResp.data?.id) {
              const created = createResp.data;
              currentEventId = created.id;
              const normalized = {
                id: created.id,
                name: created.name || event?.name || 'New Conference Event',
                description: created.description || event?.description || '',
                date: created.event_date || event?.date || new Date().toISOString().split('T')[0],
                roomWidth: created.room_width ?? event?.roomWidth ?? 24,
                roomHeight: created.room_height ?? event?.roomHeight ?? 16,
                roomVertices: created.metadata?.roomVertices || event?.roomVertices,
              };
              setEvent(normalized);
              navigate(`/conference?eventId=${created.id}`, { replace: true });
              console.log('✓ Created event before importing guests:', created.id);
            } else {
              throw new Error('Failed to create event for guest import');
            }
          } catch (createError) {
            console.error('Failed to create event:', createError);
            alert('Failed to create event. Guests saved locally only.');
          }
        }

        if (currentEventId) {
          try {
            const result = await ConferenceAPI.bulkImportGuests(currentEventId, file);
            if (result.success) {
              importedCount = result.data?.imported || result.data?.count || importedCount;
              syncedWithBackend = true;

              try {
                const refreshedGuestsResp = await ConferenceAPI.getGuests(currentEventId);
                if (refreshedGuestsResp.success) {
                  const backendGuests = refreshedGuestsResp.data.map(mapBackendGuest);
                  setGuests(backendGuests);
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
            return updated;
          });
        }

        alert(`Successfully imported ${importedCount} guest(s)!${syncedWithBackend ? '' : ' (Warning: saved locally only, please click Save to sync to backend)'}`);
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

  const handleShare = () => {
    if (!event?.id) {
      alert('Please save the event first before sharing');
      return;
    }
    setShowShareModal(true);
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
          window.location.href = '/';
        }}
        onSave={async () => {
          try {
            const currentValues = event || {};
            let currentEventId = currentValues.id || null;

            if (!currentEventId) {
              const createResp = await ConferenceAPI.createEvent({
                name: currentValues.name || 'New Conference Event',
                description: currentValues.description || '',
                roomWidth: currentValues.roomWidth,
                roomHeight: currentValues.roomHeight,
                roomVertices: currentValues.roomVertices,
                eventDate: currentValues.date,
              });
              if (!createResp.success || !createResp.data?.id) {
                throw new Error(createResp.error || 'Failed to create event');
              }
              const created = createResp.data;
              currentEventId = created.id;
              const normalized = {
                id: created.id,
                name: created.name || currentValues.name || 'New Conference Event',
                description: created.description || currentValues.description || '',
                date: created.event_date || currentValues.date || new Date().toISOString().split('T')[0],
                roomWidth: created.room_width ?? currentValues.roomWidth ?? 24,
                roomHeight: created.room_height ?? currentValues.roomHeight ?? 16,
                roomVertices: created.metadata?.roomVertices || currentValues.roomVertices,
              };
              setEvent(normalized);
              navigate(`/conference?eventId=${created.id}`, { replace: true });
            }

            const updateResult = await ConferenceAPI.updateEvent(currentEventId, {
              name: currentValues.name,
              description: currentValues.description,
              roomWidth: currentValues.roomWidth,
              roomHeight: currentValues.roomHeight,
              roomVertices: currentValues.roomVertices,
              eventDate: currentValues.date,
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
                roomWidth: Number(updated.room_width ?? prev?.roomWidth ?? 24),
                roomHeight: Number(updated.room_height ?? prev?.roomHeight ?? 16),
                roomVertices: updated.metadata?.roomVertices ?? prev?.roomVertices,
                date: updated.event_date ?? prev?.date,
              }));
            }

            // Check for unsaved guests (those with temporary IDs)
            const isValidUUID = (str) => {
              return str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            };
            const unsavedGuests = guests.filter(g => !isValidUUID(g.id));
            
            if (unsavedGuests.length > 0) {
              console.log(`Found ${unsavedGuests.length} unsaved guests, syncing to backend...`);
              let syncedCount = 0;
              const guestIdMapping = {};
              
              for (const guest of unsavedGuests) {
                try {
                  const result = await ConferenceAPI.createGuest(currentEventId, guest);
                  if (result.success && result.data) {
                    guestIdMapping[guest.id] = result.data.id;
                    syncedCount++;
                  }
                } catch (err) {
                  console.warn('Failed to sync guest:', guest.name, err);
                }
              }
              
              // Refresh guests from backend to get all with proper UUIDs
              if (syncedCount > 0) {
                try {
                  const refreshedGuestsResp = await ConferenceAPI.getGuests(currentEventId);
                  if (refreshedGuestsResp.success) {
                    const backendGuests = refreshedGuestsResp.data.map(mapBackendGuest);
                    setGuests(backendGuests);
                    console.log(`✓ Synced ${syncedCount} guests to backend`);
                  }
                } catch (refreshError) {
                  console.warn('Failed to refresh guests after sync:', refreshError);
                }
              }
            }

            // Save elements to backend
            const saveResult = await ConferenceAPI.saveLayout(currentEventId, elements);
            if (saveResult.success) {
              alert(`✓ Saved ${saveResult.data.saved} elements to event`);
            } else {
              throw new Error(saveResult.error || 'Failed to save layout');
            }
          } catch (e) {
            alert(e.message || 'Save failed');
          }
        }}
        onShare={handleShare}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onExportCSVFiltered={handleExportCSVFiltered}
        onExportCSVByGroup={handleExportCSVByGroup}
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
            className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter event name"
          />
        </div>
        <div className="h-6 w-px bg-gray-200 hidden md:block" />
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
            initialRoomVertices={event.roomVertices}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            guests={guests}
            draggingGuestId={draggingGuestId}
            onAssignGuest={handleAssignGuestToElement}
            onGuestDragEnd={handleGuestDragEnd}
            onRoomResize={(width, height, vertices) => {
              setEvent({ ...event, roomWidth: width, roomHeight: height, roomVertices: vertices });
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

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        eventId={event?.id}
        onGenerateToken={ConferenceAPI.generateShareToken}
        guests={guests}
      />
    </div>
  );
}
