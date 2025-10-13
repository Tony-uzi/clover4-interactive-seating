// Route management panel for tradeshow planner

import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { getElementConfig } from '../../lib/canvas/shapes';

const ROUTE_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export default function RouteManager({
  routes,
  booths,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute,
  activeRouteId,
  onSetActiveRoute,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // Helper function to get booth display name
  const getBoothDisplayName = (booth) => {
    if (!booth) return 'Unknown Booth';
    if (booth.label) return booth.label;

    // Fallback to booth type name
    const config = getElementConfig(booth.type);
    const typeName = config?.name || 'Booth';

    // Add position info if available
    return `${typeName} (${booth.x.toFixed(1)}m, ${booth.y.toFixed(1)}m)`;
  };

  // Route form component
  const RouteForm = ({ route, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
      route || {
        name: '',
        description: '',
        boothOrder: [],
        color: ROUTE_COLORS[0],
      }
    );

    const [selectedBooths, setSelectedBooths] = useState(formData.boothOrder || []);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...formData,
        boothOrder: selectedBooths,
      });
    };

    const handleToggleBooth = (boothId) => {
      if (selectedBooths.includes(boothId)) {
        setSelectedBooths(selectedBooths.filter(id => id !== boothId));
      } else {
        setSelectedBooths([...selectedBooths, boothId]);
      }
    };

    const moveBoothUp = (index) => {
      if (index === 0) return;
      const newOrder = [...selectedBooths];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setSelectedBooths(newOrder);
    };

    const moveBoothDown = (index) => {
      if (index === selectedBooths.length - 1) return;
      const newOrder = [...selectedBooths];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setSelectedBooths(newOrder);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="text"
          placeholder="Route Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />

        <textarea
          placeholder="Route Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          rows="2"
        />

        {/* Color picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Route Color</label>
          <div className="flex gap-2">
            {ROUTE_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded border-2 ${
                  formData.color === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Booth selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Booths (click to select, drag to sort)
          </label>

          {/* Selected booths order */}
          {selectedBooths.length > 0 && (
            <div className="mb-2 p-2 bg-white border border-gray-300 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Visit Order:</div>
              {selectedBooths.map((boothId, index) => {
                const booth = booths.find(b => b.id === boothId);
                return (
                  <div
                    key={boothId}
                    className="flex items-center justify-between py-1 text-sm"
                  >
                    <span>
                      {index + 1}. {getBoothDisplayName(booth)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveBoothUp(index)}
                        disabled={index === 0}
                        className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBoothDown(index)}
                        disabled={index === selectedBooths.length - 1}
                        className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Available booths */}
          <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
            {booths.length === 0 ? (
              <p className="text-xs text-gray-500">Please add booths first</p>
            ) : (
              booths.map(booth => (
                <label
                  key={booth.id}
                  className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-100 rounded px-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedBooths.includes(booth.id)}
                    onChange={() => handleToggleBooth(booth.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{getBoothDisplayName(booth)}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-b border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Visit Routes</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Statistics */}
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-orange-700">
            <div className="font-semibold mb-1">Total Routes: {routes.length}</div>
            {activeRouteId && (
              <div className="text-xs">
                Viewing: {routes.find(r => r.id === activeRouteId)?.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="p-4 border-b border-gray-200">
          <RouteForm
            onSave={(routeData) => {
              onAddRoute({
                ...routeData,
                id: Date.now(),
              });
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Routes list - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {routes.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              No routes yet, click "Add" to create
            </div>
          ) : (
            routes.map((route) => (
              <div
                key={route.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-400 transition-colors"
              >
                {editingRoute?.id === route.id ? (
                  <RouteForm
                    route={editingRoute}
                    onSave={(updatedRoute) => {
                      onUpdateRoute(route.id, updatedRoute);
                      setEditingRoute(null);
                    }}
                    onCancel={() => setEditingRoute(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: route.color }}
                          />
                          <h3 className="font-semibold text-gray-800">{route.name}</h3>
                        </div>
                        {route.description && (
                          <p className="text-xs text-gray-500 mt-1">{route.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onSetActiveRoute(activeRouteId === route.id ? null : route.id)}
                          className={`p-1 rounded ${
                            activeRouteId === route.id
                              ? 'bg-orange-100 text-orange-600'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          title={activeRouteId === route.id ? 'Hide Route' : 'Show Route'}
                        >
                          {activeRouteId === route.id ? (
                            <FiEyeOff className="w-4 h-4" />
                          ) : (
                            <FiEye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingRoute(route)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <FiEdit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this route?')) {
                              onDeleteRoute(route.id);
                            }
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {route.boothOrder && route.boothOrder.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Booths:</span> {route.boothOrder.length}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Tips */}
      <div className="p-4 border-t border-gray-200">
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="text-sm font-semibold text-orange-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-orange-700 space-y-1">
            <li>• Create multiple visit routes</li>
            <li>• Click eye icon to view route</li>
            <li>• Routes display on canvas</li>
            <li>• Adjust booth order to optimize path</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
