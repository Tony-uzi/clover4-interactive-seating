// Booth toolbar for adding different booth types

import React from 'react';
import { TRADESHOW_BOOTHS, createElement } from '../../lib/canvas/shapes';

export default function BoothToolbar({ onAddBooth }) {
  const handleAddBooth = (boothType) => {
    const newBooth = createElement(boothType.type, 5, 5);
    onAddBooth(newBooth);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto" style={{ minWidth: '256px', maxWidth: '256px' }}>
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Booth Types</h2>

        <div className="space-y-2">
          {[
            TRADESHOW_BOOTHS.STANDARD,
            TRADESHOW_BOOTHS.LARGE,
            TRADESHOW_BOOTHS.ISLAND,
            TRADESHOW_BOOTHS.AISLE,
            TRADESHOW_BOOTHS.TACTILE_PAVING,
            TRADESHOW_BOOTHS.DOOR1,
            TRADESHOW_BOOTHS.DOOR2,
            TRADESHOW_BOOTHS.POWER_OUTLET,
          ].map((booth) => (
            <button
              key={booth.type}
              onClick={() => handleAddBooth(booth)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-colors text-left"
            >
              <span className="text-2xl">{booth.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{booth.name}</div>
                <div className="text-xs text-gray-500">
                  {booth.defaultWidth}m × {booth.defaultHeight}m
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-green-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Click to add booth to canvas</li>
            <li>• Drag to adjust position</li>
            <li>• Scroll to zoom view</li>
            <li>• Use labels to identify booths</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
