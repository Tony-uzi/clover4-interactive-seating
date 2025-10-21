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

  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load data on mount and ensure backend event exists
  useEffect(() => {
    (async () => {
      const loadedEvent = loadConferenceEvent();
      const loadedLayout = [];
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

      setEvent(ensuredEvent);
      setElements(loadedLayout);
      setGuests(loadedGuests);
      setGroups(loadedGroups);

      // If URL provides a designId, load from design system; otherwise try backend event layout
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
  const handleAddGuest = (guest) => {
    setGuests(prevGuests => [...prevGuests, guest]);
  };

  const handleUpdateGuest = (guestId, updates) => {
    setGuests(prevGuests => prevGuests.map(g => (g.id === guestId ? { ...g, ...updates } : g)));
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

  const handleAssignGuestToElement = (guestId, element) => {
    if (!element) return;
    const normalizedGuestId = String(guestId);

    setGuests(prevGuests =>
      prevGuests.map(guest =>
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
        alert('No valid guest information found, please check CSV content');
      } else {
        setGuests(prevGuests => [...prevGuests, ...importedGuests]);
        alert(`Successfully imported ${importedGuests.length} guest(s)!`);
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

  // Share
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/kiosk/conference`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Share link copied to clipboard:\n${shareUrl}`);
  };

  // Clear
  const handleClear = () => {
    if (confirm('Are you sure you want to clear the canvas? This action cannot be undone!')) {
      setElements([]);
      setSelectedElementId(null);
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
        onShare={handleShare}
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
          <div className="flex-shrink-0 overflow-y-auto" style={{ height: '250px' }}>
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
