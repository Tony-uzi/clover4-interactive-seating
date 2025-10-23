// Guest management panel for conference planner

import React, { useMemo, useState } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import GroupManager from './GroupManager';
import SystemGroups from './SystemGroups';

export default function GuestPanel({
  guests,
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddGuest,
  onUpdateGuest,
  onDeleteGuest,
  onGuestDragStart,
  onGuestDragEnd,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [editingGuest, setEditingGuest] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const systemGroups = useMemo(
    () => groups.filter(group => group.isSystem),
    [groups]
  );
  const customGroups = useMemo(
    () => groups.filter(group => !group.isSystem),
    [groups]
  );

  const normalizeString = (value) => (value ?? '').toString().trim();
  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Filter guests (guard against missing fields from imports)
  const filteredGuests = guests.filter(guest => {
    const name = normalizeString(guest?.name).toLowerCase();
    const email = normalizeString(guest?.email).toLowerCase();
    const company = normalizeString(guest?.company).toLowerCase();
    const groupName = normalizeString(guest?.group);

    const matchesSearch =
      normalizedSearch.length === 0 ||
      name.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      company.includes(normalizedSearch) ||
      groupName.toLowerCase().includes(normalizedSearch);

    const matchesGroup =
      filterGroup === 'all' ||
      groupName === filterGroup ||
      groupName.toLowerCase() === filterGroup.toLowerCase();

    return matchesSearch && matchesGroup;
  });

  // Count assigned guests, attending guests, and checked in guests
  const assignedCount = guests.filter(g => g.tableNumber || g.elementId).length;
  const attendingCount = guests.filter(g => g.attendance !== false).length;
  const checkedInCount = guests.filter(g => g.checkedIn).length;

  // Guest form component
  const GuestForm = ({ guest, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
      guest || {
        name: '',
        group: 'General',
        dietaryPreference: 'None',
        attendance: true,
        notes: '',
      }
    );

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="text"
          placeholder="Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />

        <select
          value={formData.group}
          onChange={(e) => setFormData({ ...formData, group: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {groups.map(group => (
            <option key={group.id} value={group.name}>
              {group.name}
            </option>
          ))}
        </select>

        <select
          value={formData.dietaryPreference}
          onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="None">No Restriction</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Vegan">Vegan</option>
          <option value="Halal">Halal</option>
          <option value="Kosher">Kosher</option>
        </select>

        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.attendance}
            onChange={(e) => setFormData({ ...formData, attendance: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Will Attend</span>
        </label>

        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="2"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

  const handleDragStart = (event, guest) => {
    if (!onGuestDragStart) return;
    const guestId = String(guest.id);
    const dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      dataTransfer.setData('text/plain', guestId);
      if (typeof dataTransfer.setDragImage === 'function') {
        dataTransfer.setDragImage(event.currentTarget, 20, 20);
      }
      dataTransfer.setData('application/guest-id', guestId);
      dataTransfer.effectAllowed = 'move';
    }
    onGuestDragStart(guestId);
  };

  const handleDragEnd = () => {
    onGuestDragEnd?.();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Guest Management</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FiUserPlus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600 text-xs">Total</div>
            <div className="text-lg font-bold text-gray-800">{guests.length}</div>
          </div>
          <div className="bg-teal-50 p-2 rounded">
            <div className="text-teal-600 text-xs">Checked In</div>
            <div className="text-lg font-bold text-teal-800">{checkedInCount}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-emerald-50 p-2 rounded">
            <div className="text-emerald-600 text-xs">Attending</div>
            <div className="text-lg font-bold text-emerald-800">{attendingCount}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-blue-600 text-xs">Assigned</div>
            <div className="text-lg font-bold text-blue-800">{assignedCount}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-2">
          <FiFilter className="text-gray-400" />
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Guests</option>
            {systemGroups.length > 0 && (
              <optgroup label="System Groups">
                {systemGroups.map(group => (
                  <option key={group.id} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </optgroup>
            )}
            {customGroups.length > 0 && (
              <optgroup label="Custom Groups">
                {customGroups.map(group => (
                  <option key={group.id} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Group overview */}
      <div className="px-0">
        <div className="mx-4 mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">Group Overview</h3>
            <p className="text-xs text-gray-500">
              Use system groups for quick filtering, or create custom groups tailored to your event.
            </p>
          </div>
          <SystemGroups groups={groups} guests={guests} />
          <div className="border-t border-gray-200 bg-white">
            <GroupManager
              groups={groups}
              systemGroups={systemGroups}
              onAddGroup={onAddGroup}
              onUpdateGroup={onUpdateGroup}
              onDeleteGroup={onDeleteGroup}
            />
          </div>
        </div>
      </div>

      {/* Content area with scroll */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Add form */}
        {showAddForm && (
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white shadow-sm">
            <GuestForm
              onSave={(guestData) => {
                onAddGuest({
                  ...guestData,
                  id: Date.now(),
                  tableNumber: null,
                  seatNumber: null,
                  checkedIn: false, // Default check-in status for new guests
                });
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Guest list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filteredGuests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? 'No matching guests found' : 'No guests yet, click "Add" to start'}
            </div>
          ) : (
            filteredGuests.map(guest => (
              <div
                key={guest.id}
                className="mx-4 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                draggable={!!onGuestDragStart}
                onDragStart={(event) => handleDragStart(event, guest)}
                onDragEnd={handleDragEnd}
              >
                {editingGuest?.id === guest.id ? (
                  <GuestForm
                    guest={editingGuest}
                    onSave={(updatedGuest) => {
                      onUpdateGuest(guest.id, updatedGuest);
                      setEditingGuest(null);
                    }}
                    onCancel={() => setEditingGuest(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{guest.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingGuest(guest)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <FiEdit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this guest?')) {
                              onDeleteGuest(guest.id);
                            }
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 text-xs mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {guest.group}
                      </span>
                      {guest.dietaryPreference !== 'None' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          🥗 {guest.dietaryPreference}
                        </span>
                      )}
                      {guest.tableNumber && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          📍 Table: {guest.tableNumber}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded ${guest.attendance ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {guest.attendance ? '✓ Attending' : '✗ Not Attending'}
                      </span>
                      <span className={`px-2 py-1 rounded ${guest.checkedIn ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
                        {guest.checkedIn ? '✓ Checked In' : '○ Not Checked In'}
                      </span>
                    </div>

                    {guest.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">💬 {guest.notes}</p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
