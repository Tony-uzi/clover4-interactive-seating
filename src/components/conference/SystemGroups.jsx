import React from 'react';
import { FiUsers } from 'react-icons/fi';

export default function SystemGroups({ groups }) {
  const systemGroups = groups.filter(g => g.isSystem);

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <FiUsers className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-bold text-gray-800">System Groups</h3>
        <span className="text-xs text-gray-500">({systemGroups.length})</span>
      </div>

      <div className="space-y-1">
        {systemGroups.map(group => (
          <div
            key={group.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <span className="text-sm font-medium text-gray-800">
              {group.name}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        System groups are predefined and available for all guests.
      </p>
    </div>
  );
}
