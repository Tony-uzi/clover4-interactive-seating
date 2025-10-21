// Vendor management panel for tradeshow planner

import React, { useState } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';

export default function VendorPanel({
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onVendorDragStart,
  onVendorDragEnd,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingVendor, setEditingVendor] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Get unique categories
  const categories = ['all', ...new Set(vendors.map(v => v.category).filter(Boolean))];

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    // Safe string check
    const vendorName = vendor.name || '';
    const vendorContact = vendor.contactName || '';
    const vendorCategory = vendor.category || '';

    const matchesSearch =
      vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendorContact.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || vendorCategory === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Count assigned vendors
  const assignedCount = vendors.filter(v => v.boothNumber).length;

  // Drag handlers
  const handleDragStart = (event, vendor) => {
    if (!onVendorDragStart) return;
    const vendorId = String(vendor.id);
    const dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      dataTransfer.setData('text/plain', vendorId);
      if (typeof dataTransfer.setDragImage === 'function') {
        dataTransfer.setDragImage(event.currentTarget, 20, 20);
      }
      dataTransfer.setData('application/vendor-id', vendorId);
      dataTransfer.effectAllowed = 'move';
    }
    onVendorDragStart(vendorId);
  };

  const handleDragEnd = () => {
    onVendorDragEnd?.();
  };

  // Vendor form component
  const VendorForm = ({ vendor, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
      vendor || {
        name: '',
        contactName: '',
        email: '',
        phone: '',
        category: 'Technology',
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
          placeholder="Company Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />

        <input
          type="text"
          placeholder="Contact Person"
          value={formData.contactName}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />

        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />

        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="Technology">Technology</option>
          <option value="Energy">Energy</option>
          <option value="Research">Research</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Services">Services</option>
          <option value="Other">Other</option>
        </select>

        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          rows="2"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Vendor Management</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <FiUserPlus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Total Vendors</div>
            <div className="text-xl font-bold text-gray-800">{vendors.length}</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-green-600">Assigned</div>
            <div className="text-xl font-bold text-green-800">{assignedCount}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-2">
          <FiFilter className="text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content area with scroll */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Add form */}
        {showAddForm && (
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white shadow-sm">
            <VendorForm
              onSave={(vendorData) => {
                onAddVendor({
                  ...vendorData,
                  id: Date.now(),
                  boothNumber: null,
                });
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Vendor list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filteredVendors.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? 'No matching vendors found' : 'No vendors yet, click "Add" to start'}
            </div>
          ) : (
            filteredVendors.map(vendor => (
              <div
                key={vendor.id}
                className="mx-4 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-400 transition-colors cursor-move"
                draggable={!!onVendorDragStart}
                onDragStart={(event) => handleDragStart(event, vendor)}
                onDragEnd={handleDragEnd}
              >
                {editingVendor?.id === vendor.id ? (
                  <VendorForm
                    vendor={editingVendor}
                    onSave={(updatedVendor) => {
                      onUpdateVendor(vendor.id, updatedVendor);
                      setEditingVendor(null);
                    }}
                    onCancel={() => setEditingVendor(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{vendor.name}</h3>
                        {vendor.contactName && (
                          <p className="text-xs text-gray-500">Contact: {vendor.contactName}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingVendor(vendor)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <FiEdit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this vendor?')) {
                              onDeleteVendor(vendor.id);
                            }
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        {vendor.category}
                      </span>
                      {vendor.boothNumber && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          Booth: {vendor.boothNumber}
                        </span>
                      )}
                    </div>

                    {vendor.phone && (
                      <p className="text-xs text-gray-600 mt-2">📞 {vendor.phone}</p>
                    )}
                    {vendor.notes && (
                      <p className="text-xs text-gray-600 mt-1">{vendor.notes}</p>
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
