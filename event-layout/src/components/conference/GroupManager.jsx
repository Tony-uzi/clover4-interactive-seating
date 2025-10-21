// Group management component for organizing guests

import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers } from 'react-icons/fi';

export default function GroupManager({ groups, onAddGroup, onUpdateGroup, onDeleteGroup }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const GroupForm = ({ group, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
      group || {
        name: '',
        color: '#3B82F6',
      }
    );

    const colors = [
      { value: '#3B82F6', label: 'Blue' },
      { value: '#8B5CF6', label: 'Purple' },
      { value: '#EC4899', label: 'Pink' },
      { value: '#10B981', label: 'Green' },
      { value: '#F59E0B', label: 'Amber' },
      { value: '#EF4444', label: 'Red' },
      { value: '#06B6D4', label: 'Cyan' },
      { value: '#84CC16', label: 'Lime' },
    ];

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name.trim()) return;
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group Name *
          </label>
          <input
            type="text"
            placeholder="e.g., Bob's Family"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {colors.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`h-10 rounded-lg border-2 transition-all ${
                  formData.color === color.value
                    ? 'border-gray-800 scale-105'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {group ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const customGroups = groups.filter(g => !g.isSystem);

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiUsers className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-800">Custom Groups</h3>
          <span className="text-xs text-gray-500">({customGroups.length})</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
        >
          <FiPlus className="w-3 h-3" />
          New Group
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-3">
          <GroupForm
            onSave={(groupData) => {
              const newGroup = {
                ...groupData,
                id: `custom-${Date.now()}`,
                isSystem: false,
              };
              onAddGroup(newGroup);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Custom groups list */}
      {customGroups.length > 0 ? (
        <div className="space-y-1">
          {customGroups.map(group => (
            <div key={group.id}>
              {editingGroup?.id === group.id ? (
                <GroupForm
                  group={editingGroup}
                  onSave={(updatedData) => {
                    onUpdateGroup(group.id, updatedData);
                    setEditingGroup(null);
                  }}
                  onCancel={() => setEditingGroup(null)}
                />
              ) : (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {group.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingGroup(group)}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title="Edit group"
                    >
                      <FiEdit2 className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete group "${group.name}"? Guests in this group will not be deleted.`)) {
                          onDeleteGroup(group.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      title="Delete group"
                    >
                      <FiTrash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500">
          No custom groups yet. Click "New Group" to create one.
        </div>
      )}
    </div>
  );
}
