// Shared toolbar component for editor pages

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSave, FiDownload, FiUpload, FiTrash2, FiHome, FiChevronDown } from 'react-icons/fi';

export default function Toolbar({
  onSave,
  onExportPDF,
  onExportCSV,
  onExportCSVFiltered,
  onExportCSVByGroup,
  onImportCSV,
  onClear,
  title,
  onNavigateHome,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Home"
          >
            <FiHome className="w-5 h-5" />
            <span className="text-sm font-medium">Home</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {onImportCSV && (
            <button
              onClick={onImportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Import CSV"
            >
              <FiUpload className="w-4 h-4" />
              <span className="text-sm">Import</span>
            </button>
          )}

          {onExportCSV && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Export CSV"
              >
                <FiDownload className="w-4 h-4" />
                <span className="text-sm">Export CSV</span>
                <FiChevronDown className="w-3 h-3" />
              </button>

              {showExportMenu && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => { onExportCSV(); setShowExportMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    Export All Guests
                  </button>
                  {onExportCSVFiltered && (
                    <>
                      <div className="h-px bg-gray-200 my-1"></div>
                      <button
                        onClick={() => { onExportCSVFiltered('Vegetarian'); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        🥗 Export Vegetarians Only
                      </button>
                      <button
                        onClick={() => { onExportCSVFiltered('Vegan'); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        🌱 Export Vegans Only
                      </button>
                      <button
                        onClick={() => { onExportCSVFiltered('Halal'); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        🍖 Export Halal Only
                      </button>
                    </>
                  )}
                  {onExportCSVByGroup && (
                    <>
                      <div className="h-px bg-gray-200 my-1"></div>
                      <button
                        onClick={() => { onExportCSVByGroup(); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        📊 Export by Group (Highlighted)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export PDF"
            >
              <FiDownload className="w-4 h-4" />
              <span className="text-sm">Export PDF</span>
            </button>
          )}

          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Save"
            >
              <FiSave className="w-4 h-4" />
              <span className="text-sm">Save Now</span>
            </button>
          )}

          {onClear && (
            <button
              onClick={onClear}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Clear Canvas"
            >
              <FiTrash2 className="w-4 h-4" />
              <span className="text-sm">Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
