// Scale ruler component showing canvas size vs real size

import React from 'react';

export default function ScaleRuler({ canvasWidth, canvasHeight, realWidth, realHeight, pixelsPerMeter, scale = 1 }) {
  // Calculate effective pixels per meter considering zoom scale
  const effectivePixelsPerMeter = pixelsPerMeter * scale;

  // Create a visual ruler (e.g., 100px on screen = X meters in real)
  const rulerPixels = 100; // Fixed ruler length on screen
  const rulerMeters = rulerPixels / effectivePixelsPerMeter;

  // Determine the best display format based on zoom level
  const getDisplayValue = () => {
    if (rulerMeters < 0.1) {
      return `${(rulerMeters * 100).toFixed(0)}cm`;
    } else if (rulerMeters < 1) {
      return `${(rulerMeters * 100).toFixed(0)}cm`;
    } else if (rulerMeters < 10) {
      return `${rulerMeters.toFixed(1)}m`;
    } else {
      return `${rulerMeters.toFixed(0)}m`;
    }
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-300 p-3">
      <div className="text-xs font-semibold text-gray-700 mb-2">Scale Ruler</div>

      {/* Visual ruler */}
      <div className="mb-2">
        <div
          className="border-t-2 border-l-2 border-r-2 border-gray-800 h-2 relative"
          style={{ width: `${rulerPixels}px` }}
        >
          {/* Tick marks */}
          <div className="absolute top-0 left-0 w-px h-3 bg-gray-800"></div>
          <div className="absolute top-0 right-0 w-px h-3 bg-gray-800"></div>
        </div>
        <div className="text-center text-xs text-gray-600 mt-1">
          {getDisplayValue()}
        </div>
      </div>

      {/* Scale info */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between gap-4">
          <span>Canvas Size:</span>
          <span className="font-mono">{canvasWidth}×{canvasHeight}px</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Real Size:</span>
          <span className="font-mono">{realWidth.toFixed(1)}×{realHeight.toFixed(1)}m</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-gray-200">
          <span>Current Scale:</span>
          <span className="font-mono">{effectivePixelsPerMeter.toFixed(1)}px = 1m</span>
        </div>
        {scale !== 1 && (
          <div className="flex justify-between gap-4 text-blue-600">
            <span>Zoom:</span>
            <span className="font-mono">{Math.round(scale * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
