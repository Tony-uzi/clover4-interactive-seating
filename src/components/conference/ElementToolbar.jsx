// Element toolbar for adding tables and decorations

import React from 'react';
import { CONFERENCE_ELEMENTS, createElement } from '../../lib/canvas/shapes';

export default function ElementToolbar({ onAddElement }) {
  const handleAddElement = (elementType) => {
    // Create element at center of view (will be adjusted)
    const newElement = createElement(elementType.type, 5, 5);
    onAddElement(newElement);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto" style={{ minWidth: '256px', maxWidth: '256px' }}>
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Element Catalog</h2>

        {/* Tables Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Table Types</h3>
          <div className="space-y-2">
            {[
              CONFERENCE_ELEMENTS.TABLE_ROUND,
              CONFERENCE_ELEMENTS.TABLE_RECT,
              CONFERENCE_ELEMENTS.TABLE_SQUARE,
              CONFERENCE_ELEMENTS.CHAIR,
            ].map((element) => (
              <button
                key={element.type}
                onClick={() => handleAddElement(element)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors text-left"
              >
                <span className="text-2xl">{element.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{element.name}</div>
                  <div className="text-xs text-gray-500">
                    {element.defaultSeats} seats
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Decorations Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Decorations</h3>
          <div className="space-y-2">
            {[
              CONFERENCE_ELEMENTS.STAGE,
              CONFERENCE_ELEMENTS.PODIUM,
              CONFERENCE_ELEMENTS.DOOR1,
              CONFERENCE_ELEMENTS.DOOR2,
              CONFERENCE_ELEMENTS.POWER_OUTLET,
              CONFERENCE_ELEMENTS.WINDOW,
              CONFERENCE_ELEMENTS.TACTILE_PAVING,
              CONFERENCE_ELEMENTS.CUSTOM,
            ].map((element) => (
              <button
                key={element.type}
                onClick={() => handleAddElement(element)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors text-left"
              >
                <span className="text-2xl">{element.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{element.name}</div>
                  <div className="text-xs text-gray-500">
                    {element.defaultWidth}m × {element.defaultHeight}m
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Click element to add to canvas</li>
            <li>• Drag to move position</li>
            <li>• Scroll wheel to zoom view</li>
            <li>• Click to select and edit properties</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
