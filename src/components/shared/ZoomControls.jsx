// Zoom controls component for canvas

import React from 'react';
import { FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi';

export default function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom In (Ctrl + +)"
      >
        <FiZoomIn className="w-5 h-5 text-gray-700" />
      </button>

      <div className="text-center text-xs text-gray-600 py-1 border-t border-b border-gray-200">
        {Math.round(scale * 100)}%
      </div>

      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom Out (Ctrl + -)"
      >
        <FiZoomOut className="w-5 h-5 text-gray-700" />
      </button>

      <button
        onClick={onReset}
        className="p-2 hover:bg-gray-100 rounded transition-colors border-t border-gray-200"
        title="Reset View (Ctrl + 0)"
      >
        <FiMaximize2 className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}
