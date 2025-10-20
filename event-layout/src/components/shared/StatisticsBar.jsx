import { FiUsers, FiCheckCircle, FiClock, FiPieChart } from 'react-icons/fi';

/**
 * Statistics Bar Component
 * Displays guest statistics for conference events
 */
export default function StatisticsBar({ guests }) {
  // Calculate statistics
  const totalGuests = guests.length;
  const checkedInCount = guests.filter(g => g.checkedIn).length;
  const notCheckedInCount = totalGuests - checkedInCount;
  const checkInRate = totalGuests > 0 ? ((checkedInCount / totalGuests) * 100).toFixed(1) : 0;

  // Dietary preferences statistics
  const dietaryCounts = guests.reduce((acc, guest) => {
    const pref = guest.dietaryPreference || 'None';
    acc[pref] = (acc[pref] || 0) + 1;
    return acc;
  }, {});

  // Group statistics
  const groupCounts = guests.reduce((acc, guest) => {
    const group = guest.group || 'Unassigned';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    {
      id: 'total',
      label: 'Total Guests',
      sublabel: 'Registered',
      value: totalGuests,
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 'checked-in',
      label: 'Checked In',
      sublabel: 'Present',
      value: checkedInCount,
      icon: FiCheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      badge: `${checkInRate}%`,
    },
    {
      id: 'not-checked-in',
      label: 'Not Checked',
      sublabel: 'Pending',
      value: notCheckedInCount,
      icon: FiClock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      id: 'dietary',
      label: 'Dietary Stats',
      sublabel: 'Categories',
      value: Object.keys(dietaryCounts).length,
      icon: FiPieChart,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      details: dietaryCounts,
    },
  ];

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
      <div className="px-6 py-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`${stat.bgColor} ${stat.textColor} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">
                          {stat.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {stat.sublabel}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 mt-2">
                      <div className={`text-3xl font-bold ${stat.textColor}`}>
                        {stat.value}
                      </div>
                      {stat.badge && (
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${stat.bgColor} ${stat.textColor} mb-1`}>
                          {stat.badge}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details tooltip on hover */}
                {stat.details && Object.keys(stat.details).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">Distribution:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stat.details)
                        .filter(([key]) => key !== 'None')
                        .map(([key, count]) => (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs"
                          >
                            {key}: <strong>{count}</strong>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Group Distribution */}
        {Object.keys(groupCounts).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                <FiUsers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700">
                  Group Distribution
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(groupCounts)
                .filter(([key]) => key !== 'Unassigned')
                .map(([group, count]) => (
                  <div
                    key={group}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{group}</span>
                    <span className="px-2 py-0.5 bg-white rounded-full text-xs font-bold text-indigo-600">
                      {count}
                    </span>
                  </div>
                ))}
              {groupCounts['Unassigned'] > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-500">Unassigned</span>
                  <span className="px-2 py-0.5 bg-white rounded-full text-xs font-bold text-gray-600">
                    {groupCounts['Unassigned']}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
