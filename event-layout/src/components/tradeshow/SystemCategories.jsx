import React from 'react';
import { FiTag } from 'react-icons/fi';

const DEFAULT_CATEGORIES = [
  { name: 'Technology', color: '#3B82F6' },
  { name: 'Energy', color: '#10B981' },
  { name: 'Research', color: '#8B5CF6' },
  { name: 'Manufacturing', color: '#F59E0B' },
  { name: 'Services', color: '#EC4899' },
  { name: 'Other', color: '#6B7280' },
];

const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

export default function SystemCategories({ vendors }) {
  const getCount = (categoryName) =>
    vendors.filter(vendor => normalize(vendor?.category) === normalize(categoryName)).length;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <FiTag className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-800">Default Categories</h3>
        <span className="text-xs text-gray-500">
          ({DEFAULT_CATEGORIES.length})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEFAULT_CATEGORIES.map(category => (
          <div
            key={category.name}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm font-medium text-gray-800">
                {category.name}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">
              {getCount(category.name)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Categories help visitors understand exhibitor focus areas. Add custom tags in the vendor form if you need more detail.
      </p>
    </div>
  );
}
