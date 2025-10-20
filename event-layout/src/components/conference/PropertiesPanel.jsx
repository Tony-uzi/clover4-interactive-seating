// Properties panel for selected element

import React, { useState, useEffect } from 'react';
import { FiTrash2, FiCopy } from 'react-icons/fi';

export default function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
}) {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (selectedElement) {
      setFormData(selectedElement);
    }
  }, [selectedElement]);

  if (!selectedElement || !formData) {
    return (
      <div className="h-full bg-white border-b border-gray-200 p-4">
        <div className="text-center text-gray-500 py-8">
          <p>Select an element</p>
          <p className="text-sm mt-2">to view and edit properties</p>
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
  };

  const handleApply = () => {
    onUpdateElement(formData);
  };

  const isTable = formData.type.includes('table');

  return (
    <div className="h-full bg-white border-b border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Properties</h2>
          <div className="flex gap-1">
            <button
              onClick={() => onDuplicateElement(selectedElement)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Duplicate"
            >
              <FiCopy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this element?')) {
                  onDeleteElement(selectedElement.id);
                }
              }}
              className="p-2 hover:bg-red-100 rounded"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={formData.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              onBlur={handleApply}
              placeholder="e.g. Table 1, Area A..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.x}
                onChange={(e) => handleChange('x', parseFloat(e.target.value))}
                onBlur={handleApply}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.y}
                onChange={(e) => handleChange('y', parseFloat(e.target.value))}
                onBlur={handleApply}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.width}
                onChange={(e) => handleChange('width', parseFloat(e.target.value))}
                onBlur={handleApply}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.height}
                onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                onBlur={handleApply}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Seats (only for tables) */}
          {isTable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seats
              </label>
              <input
                type="number"
                min="0"
                value={formData.seats || 0}
                onChange={(e) => handleChange('seats', parseInt(e.target.value))}
                onBlur={handleApply}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Rotation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rotation (deg)
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={formData.rotation || 0}
              onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
              onMouseUp={handleApply}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">{formData.rotation || 0}°</div>
          </div>

          {/* Element info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{formData.type}</span>
              </div>
              <div className="flex justify-between">
                <span>ID:</span>
                <span className="font-mono text-xs">{formData.id.slice(0, 12)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
