// Tradeshow Planner main page

import React, { useState, useEffect, useRef } from "react";
import Toolbar from "../components/shared/Toolbar";
import BoothToolbar from "../components/tradeshow/BoothToolbar";
import TradeshowCanvas from "../components/tradeshow/TradeshowCanvas";
import VendorPanel from "../components/tradeshow/VendorPanel";
import RouteManager from "../components/tradeshow/RouteManager";
import PropertiesPanel from "../components/conference/PropertiesPanel";
import {
  loadTradeshowEvent,
  saveTradeshowEvent,
  loadTradeshowLayout,
  saveTradeshowLayout,
  loadTradeshowVendors,
  saveTradeshowVendors,
  loadTradeshowRoutes,
  saveTradeshowRoutes,
} from "../lib/utils/storage";
import {
  parseVendorCSV,
  vendorsToCSV,
  downloadCSV,
} from "../lib/utils/csvParser";
import { jsPDF } from "jspdf";

export default function TradeshowPlanner() {
  const [event, setEvent] = useState(null);
  const [booths, setBooths] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBoothId, setSelectedBoothId] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [draggingVendorId, setDraggingVendorId] = useState(null);
  const fileInputRef = useRef(null);

  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadedEvent = loadTradeshowEvent();
    const loadedLayout = loadTradeshowLayout();
    const loadedVendors = loadTradeshowVendors();
    const loadedRoutes = loadTradeshowRoutes();

    setEvent(loadedEvent);
    setBooths(loadedLayout);
    setVendors(loadedVendors);
    setRoutes(loadedRoutes);

    // Mark initial load as complete after a brief delay
    setTimeout(() => setIsInitialLoad(false), 100);
  }, []);

  // Auto-save (skip during initial load to prevent overwriting)
  useEffect(() => {
    if (event && !isInitialLoad) {
      saveTradeshowEvent(event);
    }
  }, [event, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveTradeshowLayout(booths);
    }
  }, [booths, isInitialLoad]);

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
  const selectedBooth = booths.find((b) => b.id === selectedBoothId);

  // Booth operations
  const handleAddBooth = (booth) => {
    setBooths([...booths, booth]);
    setSelectedBoothId(booth.id);
  };

  const handleUpdateBooth = (updatedBooth) => {
    setBooths(booths.map((b) => (b.id === updatedBooth.id ? updatedBooth : b)));
  };

  const handleDeleteBooth = (boothId) => {
    setBooths(booths.filter((b) => b.id !== boothId));
    setSelectedBoothId(null);
  };

  const handleDuplicateBooth = (booth) => {
    const duplicate = {
      ...booth,
      id: `${booth.type}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      x: booth.x + 2,
      y: booth.y + 2,
    };
    setBooths([...booths, duplicate]);
    setSelectedBoothId(duplicate.id);
  };

  // Vendor operations
  const handleAddVendor = (vendor) => {
    setVendors([...vendors, vendor]);
  };

  const handleUpdateVendor = (vendorId, updates) => {
    setVendors(
      vendors.map((v) => (v.id === vendorId ? { ...v, ...updates } : v))
    );
  };

  const handleDeleteVendor = (vendorId) => {
    setVendors(vendors.filter((v) => v.id !== vendorId));
  };

  const handleVendorDragStart = (vendorId) => {
    setDraggingVendorId(String(vendorId));
  };

  const handleVendorDragEnd = () => {
    setDraggingVendorId(null);
  };

  const handleAssignVendorToBooth = (vendorId, booth) => {
    if (!booth) return;
    const normalizedVendorId = String(vendorId);

    setVendors((prevVendors) =>
      prevVendors.map((vendor) =>
        String(vendor.id) === normalizedVendorId
          ? {
              ...vendor,
              boothId: booth.id,
              boothNumber: booth.label || null,
            }
          : vendor
      )
    );
    setDraggingVendorId(null);
  };

  // Route operations
  const handleAddRoute = (route) => {
    setRoutes([...routes, route]);
  };

  const handleUpdateRoute = (routeId, updates) => {
    setRoutes(routes.map((r) => (r.id === routeId ? { ...r, ...updates } : r)));
  };

  const handleDeleteRoute = (routeId) => {
    setRoutes(routes.filter((r) => r.id !== routeId));
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
      console.error("CSV import error:", error);
      alert("Import failed, please check CSV format");
    }

    e.target.value = "";
  };

  // CSV Export
  const handleExportCSV = () => {
    const csv = vendorsToCSV(vendors);
    downloadCSV(csv, `tradeshow-vendors-${Date.now()}.csv`);
  };

  // PDF Export
  const handleExportPDF = () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add title
    pdf.setFontSize(20);
    pdf.text(event?.name || "Tradeshow Layout", 20, 20);

    // Add date
    pdf.setFontSize(10);
    pdf.text(`Export Time: ${new Date().toLocaleString()}`, 20, 30);

    // Add statistics
    const assignedCount = vendors.filter((v) => v.boothNumber).length;

    pdf.text(`Hall Size: ${event?.hallWidth}m × ${event?.hallHeight}m`, 20, 40);
    pdf.text(`Total Booths: ${booths.length}`, 20, 46);
    pdf.text(`Assigned Vendors: ${assignedCount} / ${vendors.length}`, 20, 52);
    pdf.text(`Visit Routes: ${routes.length}`, 20, 58);

    // Get canvas as image
    const stage = document.querySelector("canvas");
    if (stage) {
      const imgData = stage.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 20, 65, 250, 140);
    }

    // Save PDF
    pdf.save(`tradeshow-layout-${Date.now()}.pdf`);
  };

  // Share
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/kiosk/tradeshow`;
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
      setBooths([]);
      setSelectedBoothId(null);
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
        // height: 'calc(100vh - 20px)',
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
        onSave={() => alert("Auto-saved!")}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onShare={handleShare}
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
        <span className="text-xs text-gray-500">
          Tip: Drag corner points to adjust for irregular shapes
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Booth toolbar */}
        <BoothToolbar onAddBooth={handleAddBooth} />

        {/* Center: Canvas */}
        <div className="flex-1 min-w-0 p-4">
          <TradeshowCanvas
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

        {/* Right: Properties, Routes, and Vendor panels */}
        <div className="w-96 flex flex-col overflow-hidden">
          <div
            className="flex-shrink-0 overflow-y-auto border-b border-gray-200"
            style={{ height: "140px" }}
          >
            <PropertiesPanel
              selectedElement={selectedBooth}
              onUpdateElement={handleUpdateBooth}
              onDeleteElement={handleDeleteBooth}
              onDuplicateElement={handleDuplicateBooth}
            />
          </div>
          <div
            className="flex-shrink-0 border-b border-gray-200"
            style={{ height: "28%", minHeight: "400px" }}
          >
            <div className="h-full overflow-y-auto">
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
          </div>
          <div className="flex-1 min-h-0">
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
