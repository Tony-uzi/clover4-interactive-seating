import React from 'react';
import { FiUsers } from 'react-icons/fi';

const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

export default function SystemGroups({ groups, guests }) {
  const systemGroups = groups.filter(group => group.isSystem);

  const getGuestCount = (groupName) => {
    const target = normalize(groupName);
    return guests.filter(guest => normalize(guest?.group) === target).length;
  };

  if (systemGroups.length === 0) {
    return (
      <div className="px-4 py-4">
        <p className="text-sm text-gray-500">
          System groups are not configured for this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <FiUsers className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-800">System Groups</h3>
        <span className="text-xs text-gray-500">
          ({systemGroups.length})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {systemGroups.map(group => (
          <div
            key={group.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-sm font-medium text-gray-800">
                {group.name}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">
              {getGuestCount(group.name)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        System groups (VIP, General, Staff, Speaker) are predefined labels you can use for quick filtering.
      </p>
    </div>
  );
}
