// Conference Planner main page

import React, { useState, useEffect, useRef } from "react";
import Toolbar from "../components/shared/Toolbar";
import StatisticsBar from "../components/shared/StatisticsBar";
import ElementToolbar from "../components/conference/ElementToolbar";
import ConferenceCanvas from "../components/conference/ConferenceCanvas";
import GuestPanel from "../components/conference/GuestPanel";
import PropertiesPanel from "../components/conference/PropertiesPanel";
import LoadSampleDataButton from "../components/shared/LoadSampleDataButton";
import {
  loadConferenceEvent,
  saveConferenceEvent,
  loadConferenceLayout,
  saveConferenceLayout,
  loadConferenceGuests,
  saveConferenceGuests,
  loadConferenceGroups,
} from "../lib/utils/storage";
import {
  parseGuestCSV,
  guestsToCSV,
  guestsToCSVFiltered,
  exportGuestsByGroup,
  downloadCSV,
} from "../lib/utils/csvParser";
import { jsPDF } from "jspdf";
import * as ConferenceAPI from "../server-actions/conference-planner";
import { useWebSocket } from "../lib/hooks/useWebSocket";

export default function ConferencePlanner() {
  const [event, setEvent] = useState(null);
  const [elements, setElements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [draggingGuestId, setDraggingGuestId] = useState(null);
  const normalizeGroup = (raw) => {
    if (!raw) return raw;
    return {
      ...raw,
      isSystem: raw.isSystem ?? raw.is_system ?? false,
    };
  };

  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load data from API on mount
  useEffect(() => {
    async function loadDataFromAPI() {
      try {
        // Try to load from API first
        const eventsResult = await ConferenceAPI.getAllEvents();
        
        if (eventsResult.success && eventsResult.data.length > 0) {
          // Use the first event
          const apiEvent = eventsResult.data[0];
          const eventData = {
            id: apiEvent.id,
            name: apiEvent.name,
            description: apiEvent.description,
            date: apiEvent.event_date,
            roomWidth: apiEvent.room_width,
            roomHeight: apiEvent.room_height,
          };
          setEvent(eventData);

          // Load elements
          const elementsResult = await ConferenceAPI.getAllElements(apiEvent.id);
          if (elementsResult.success) {
            const mappedElements = elementsResult.data.map(el => ({
              id: el.id,
              type: el.element_type,
              label: el.label,
              x: el.position_x,
              y: el.position_y,
              width: el.width,
              height: el.height,
              rotation: el.rotation || 0,
              capacity: el.capacity || 8,
              color: el.color || '#3B82F6',
            }));
            setElements(mappedElements);
          }

          // Load guests
          const guestsResult = await ConferenceAPI.getAllGuests(apiEvent.id);
          if (guestsResult.success) {
            const mappedGuests = guestsResult.data.map(g => ({
              id: g.id,
              name: g.name,
              email: g.email,
              group: g.group_name || 'General',
              dietaryPreference: g.dietary_requirements || 'None',
              tableNumber: g.table_number,
              seatNumber: g.seat_number,
              elementId: g.element,
              checkedIn: g.checked_in || false,
              attendance: g.attendance !== false,
              notes: g.notes || '',
            }));
            setGuests(mappedGuests);
          }

          // Load groups
          const groupsResult = await ConferenceAPI.getAllGroups(apiEvent.id);
          if (groupsResult.success) {
            setGroups(groupsResult.data.map(normalizeGroup));
          }
        } else {
          // No events in API, load from localStorage as fallback
          const loadedEvent = loadConferenceEvent();
          const loadedLayout = loadConferenceLayout();
          const loadedGuests = loadConferenceGuests();
          const loadedGroups = loadConferenceGroups();

          setEvent(loadedEvent);
          setElements(loadedLayout);
          setGuests(loadedGuests);
          setGroups(loadedGroups);
        }
      } catch (error) {
        console.error('Error loading from API, using localStorage:', error);
        // Fallback to localStorage
        const loadedEvent = loadConferenceEvent();
        const loadedLayout = loadConferenceLayout();
        const loadedGuests = loadConferenceGuests();
        const loadedGroups = loadConferenceGroups();

        setEvent(loadedEvent);
        setElements(loadedLayout);
        setGuests(loadedGuests);
        setGroups(loadedGroups);
      } finally {
        setLoading(false);
        setTimeout(() => setIsInitialLoad(false), 100);
      }
    }

    loadDataFromAPI();
  }, []);

  // Load groups from cloud when event is ready
  useEffect(() => {
    async function loadGroupsFromCloud() {
      if (event?.id && !isInitialLoad) {
        const result = await ConferenceAPI.getAllGroups(event.id);
        if (result.success) {
          setGroups(result.data.map(normalizeGroup)); // Use cloud data
        }
      }
    }
    loadGroupsFromCloud();
  }, [event?.id, isInitialLoad]);

  // Auto-save (skip during initial load to prevent overwriting)
  useEffect(() => {
    if (event && !isInitialLoad) {
      saveConferenceEvent(event);
    }
  }, [event, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveConferenceLayout(elements);
    }
  }, [elements, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveConferenceGuests(guests);
    }
  }, [guests, isInitialLoad]);

  // Groups are now saved to cloud via API calls
  // No need for localStorage auto-save

  // WebSocket for real-time updates
  const { isConnected, send } = useWebSocket('conference', event?.id || 'default', {
    element_update: (data) => {
      console.log('Received element update:', data);
      // Reload layout when other clients make changes
      const loadedLayout = loadConferenceLayout();
      setElements(loadedLayout);
    },
    guest_update: (data) => {
      console.log('Received guest update:', data);
      // Reload guests when other clients make changes
      const loadedGuests = loadConferenceGuests();
      setGuests(loadedGuests);
    },
  });

  // Handle sample data loaded from API
  const handleSampleDataLoaded = async (data) => {
    // Data is now in backend, reload from API
    try {
      const eventsResult = await ConferenceAPI.getAllEvents();
      if (eventsResult.success && eventsResult.data.length > 0) {
        const apiEvent = eventsResult.data.find(e => e.id === data.eventId) || eventsResult.data[0];
        
        // Reload all data from API
        const eventData = {
          id: apiEvent.id,
          name: apiEvent.name,
          description: apiEvent.description,
          date: apiEvent.event_date,
          roomWidth: apiEvent.room_width,
          roomHeight: apiEvent.room_height,
        };
        setEvent(eventData);

        // Load elements
        const elementsResult = await ConferenceAPI.getAllElements(apiEvent.id);
        if (elementsResult.success) {
          const mappedElements = elementsResult.data.map(el => ({
            id: el.id,
            type: el.element_type,
            label: el.label,
            x: el.position_x,
            y: el.position_y,
            width: el.width,
            height: el.height,
            rotation: el.rotation || 0,
            capacity: el.capacity || 8,
            color: el.color || '#3B82F6',
          }));
          setElements(mappedElements);
        }

        // Load guests
        const guestsResult = await ConferenceAPI.getAllGuests(apiEvent.id);
        if (guestsResult.success) {
          const mappedGuests = guestsResult.data.map(g => ({
            id: g.id,
            name: g.name,
            email: g.email,
            group: g.group_name || 'General',
            dietaryPreference: g.dietary_requirements || 'None',
            tableNumber: g.table_number,
            seatNumber: g.seat_number,
            elementId: g.element,
            checkedIn: g.checked_in || false,
            attendance: g.attendance !== false,
            notes: g.notes || '',
          }));
          setGuests(mappedGuests);
        }

        // Load groups
        const groupsResult = await ConferenceAPI.getAllGroups(apiEvent.id);
        if (groupsResult.success) {
          setGroups(groupsResult.data.map(normalizeGroup));
        }
      }
    } catch (error) {
      console.error('Error reloading from API:', error);
    }
  };

  // Get selected element
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Element operations
  const handleAddElement = (element) => {
    setElements([...elements, element]);
    setSelectedElementId(element.id);
  };

  const handleUpdateElement = (updatedElement) => {
    setElements(
      elements.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );
    
    // Broadcast to other clients via WebSocket
    if (isConnected) {
      send({
        type: 'element_update',
        action: 'update',
        element: updatedElement,
      });
    }
  };

  const handleDeleteElement = (elementId) => {
    setElements(elements.filter((el) => el.id !== elementId));
    setSelectedElementId(null);
  };

  const handleDuplicateElement = (element) => {
    const duplicate = {
      ...element,
      id: `${element.type}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      x: element.x + 1,
      y: element.y + 1,
    };
    setElements([...elements, duplicate]);
    setSelectedElementId(duplicate.id);
  };

  // Guest operations
  const handleAddGuest = (guest) => {
    setGuests((prevGuests) => [...prevGuests, guest]);
  };

  const handleUpdateGuest = (guestId, updates) => {
    setGuests((prevGuests) =>
      prevGuests.map((g) => (g.id === guestId ? { ...g, ...updates } : g))
    );
  };

  const handleDeleteGuest = (guestId) => {
    setGuests((prevGuests) => prevGuests.filter((g) => g.id !== guestId));
  };

  const handleGuestDragStart = (guestId) => {
    setDraggingGuestId(String(guestId));
  };

  const handleGuestDragEnd = () => {
    setDraggingGuestId(null);
  };

  // Save to cloud
  const handleSaveToCloud = async () => {
    try {
      // If event has ID, update it; otherwise create new
      if (event?.id) {
        const result = await ConferenceAPI.updateEvent(event.id, {
          name: event.name,
          description: event.description,
          event_date: event.date,
          room_width: event.roomWidth,
          room_height: event.roomHeight,
        });

        if (result.success) {
          alert("Event saved successfully!");
        } else {
          alert("Failed to save: " + result.error);
        }
      } else {
        const result = await ConferenceAPI.createEvent({
          name: event.name || "Untitled Event",
          description: event.description || "",
          event_date: event.date || new Date().toISOString().split("T")[0],
          room_width: event.roomWidth || 24,
          room_height: event.roomHeight || 16,
        });

        if (result.success) {
          // Update event with the ID from backend
          const newEvent = { ...event, id: result.data.id };
          setEvent(newEvent);
          saveConferenceEvent(newEvent);
          alert("Event saved to cloud! You can now create groups.");
        } else {
          alert("Failed to save: " + result.error);
        }
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // Group operations
  const handleAddGroup = async (group) => {
    // If no event ID, prompt user to save event first
    if (!event?.id) {
      alert(
        'Please save the event to cloud first before creating groups.\n\nClick the "Save" button in the toolbar.'
      );
      setGroups((prev) => [...prev, normalizeGroup(group)]);
      return;
    }

    // Call backend API to create group
    const result = await ConferenceAPI.createGroup(event.id, {
      name: group.name,
      color: group.color,
      isSystem: group.isSystem || false,
    });

    if (result.success) {
      // Use the group returned from backend (with proper ID)
      setGroups((prev) => [...prev, normalizeGroup(result.data)]);
      alert('Group "' + group.name + '" created successfully!');
    } else {
      // Fallback to local only if API fails
      setGroups((prev) => [...prev, normalizeGroup(group)]);
      alert(
        "Failed to save group to cloud: " +
          result.error +
          "\n\nSaved locally only."
      );
    }
  };

  const handleUpdateGroup = async (groupId, updates) => {
    // Update local state immediately for responsive UI
    setGroups(groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)));

    // Sync to backend if event exists
    if (event?.id) {
      await ConferenceAPI.updateGroup(groupId, updates);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    // Update local state immediately
    setGroups(groups.filter((g) => g.id !== groupId));
    // Note: Guests with this group will keep the group name, but it won't be in the managed list

    // Sync to backend if event exists
    if (event?.id) {
      await ConferenceAPI.deleteGroup(groupId);
    }
  };

  const handleAssignGuestToElement = (guestId, element) => {
    if (!element) return;
    const normalizedGuestId = String(guestId);

    setGuests((prevGuests) =>
      prevGuests.map((guest) =>
        String(guest.id) === normalizedGuestId
          ? {
              ...guest,
              elementId: element.id,
              tableNumber: element.label || null,
              seatNumber: null,
            }
          : guest
      )
    );
    setDraggingGuestId(null);
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
      if (importedGuests.length === 0) {
        alert("No valid guest information found, please check CSV content");
      } else {
        setGuests((prevGuests) => [...prevGuests, ...importedGuests]);
        alert(`Successfully imported ${importedGuests.length} guest(s)!`);
      }
    } catch (error) {
      console.error("CSV import error:", error);
      alert("Import failed, please check CSV format");
    }

    // Reset input
    e.target.value = "";
  };

  // CSV Export
  const handleExportCSV = () => {
    const csv = guestsToCSV(guests);
    downloadCSV(csv, `conference-guests-${Date.now()}.csv`);
  };

  // CSV Export Filtered by Dietary Preference
  const handleExportCSVFiltered = (dietaryPreference) => {
    const csv = guestsToCSVFiltered(guests, dietaryPreference);
    downloadCSV(
      csv,
      `conference-guests-${dietaryPreference.toLowerCase()}-${Date.now()}.csv`
    );
  };

  // Excel Export by Group with Highlighting
  const handleExportCSVByGroup = () => {
    exportGuestsByGroup(guests);
  };

  // PDF Export
  const handleExportPDF = () => {
    const exportTools = canvasRef.current;
    if (!exportTools || typeof exportTools.exportLayoutImage !== "function") {
      alert("Unable to export at this time, please try again later");
      return;
    }

    const imageData = exportTools.exportLayoutImage();
    if (!imageData) {
      alert("No layout content to export");
      return;
    }

    const { dataURL, width, height } = imageData;

    const orientation = width >= height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
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

    pdf.addImage(dataURL, "PNG", offsetX, offsetY, renderWidth, renderHeight);
    pdf.save(`conference-layout-${Date.now()}.pdf`);
  };

  // Share
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/kiosk/conference`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Share link copied to clipboard:\n${shareUrl}`);
  };

  // Clear
  const handleClear = () => {
    if (
      confirm(
        "Are you sure you want to clear the canvas? This action cannot be undone!"
      )
    ) {
      setElements([]);
      setSelectedElementId(null);
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-gray-100"
      style={{
        minheight: "100vh",
        width: "100vw",
      }}
    >
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
        onSave={handleSaveToCloud}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onExportCSVFiltered={handleExportCSVFiltered}
        onExportCSVByGroup={handleExportCSVByGroup}
        onImportCSV={handleImportCSV}
        onShare={handleShare}
        onClear={handleClear}
      >
        {/* Load Sample Data Button */}
        <LoadSampleDataButton onDataLoaded={handleSampleDataLoaded} />
        
        {/* WebSocket Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </Toolbar>

      {/* Statistics Bar */}
      <StatisticsBar guests={guests} />

      {/* Canvas Size Input */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          Canvas Size:
        </label>
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
        <span className="text-xs text-gray-500">
          Tip: Drag corner points to adjust for irregular shapes
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Element toolbar */}
        <ElementToolbar onAddElement={handleAddElement} />

        {/* Center: Canvas */}
        <div className="flex-1 min-w-0 p-4">
          <ConferenceCanvas
            ref={canvasRef}
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

        {/* Right: Properties and Guest panel */}
        <div className="w-96 flex flex-col overflow-hidden">
          <div
            className="flex-shrink-0 overflow-y-auto"
            style={{ height: "250px" }}
          >
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
            />
          </div>
          <div className="flex-1 min-h-0 border-t border-gray-200">
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
