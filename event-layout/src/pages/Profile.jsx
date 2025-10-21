import { useEffect, useState } from "react";
import { listDesigns, deleteDesign } from "../lib/api.js";
import { useNavigate } from "react-router-dom";
import { 
  FiUser, FiCalendar, FiGrid, FiEdit3, FiTrash2, 
  FiFolder, FiLayers, FiAlertCircle, FiLoader 
} from 'react-icons/fi';

export default function Profile() {
  const navigate = useNavigate();
  const [cloud, setCloud] = useState({ loading: false, designs: [], error: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCloud((s) => ({ ...s, loading: true }));
        const list = await listDesigns();
        if (mounted) setCloud({ loading: false, designs: list, error: "" });
      } catch (e) {
        if (mounted) setCloud({ loading: false, designs: [], error: e.message || "" });
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
              <FiUser className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          </div>
          <p className="text-lg text-gray-600 ml-16">
            Manage your saved designs and event layouts
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiFolder className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {cloud.loading ? "..." : cloud.designs.length}
                </div>
                <div className="text-sm text-gray-600">Total Designs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCalendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {cloud.loading ? "..." : cloud.designs.filter(d => d.kind === 'conference').length}
                </div>
                <div className="text-sm text-gray-600">Conferences</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiGrid className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {cloud.loading ? "..." : cloud.designs.filter(d => d.kind === 'tradeshow').length}
                </div>
                <div className="text-sm text-gray-600">Tradeshows</div>
              </div>
            </div>
          </div>
        </div>

        {/* Designs list */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiLayers className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">My Designs</h2>
              </div>
              {!cloud.loading && (
                <span className="text-sm text-gray-600">
                  {cloud.designs.length} {cloud.designs.length === 1 ? 'design' : 'designs'}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Loading state */}
            {cloud.loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <FiLoader className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Loading your designs...</p>
              </div>
            )}

            {/* Error state */}
            {cloud.error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{cloud.error}</p>
              </div>
            )}

            {/* Empty state */}
            {!cloud.loading && !cloud.error && cloud.designs.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                  <FiFolder className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No designs yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start creating your first event layout
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/conference')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Conference
                  </button>
                  <button
                    onClick={() => navigate('/tradeshow')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Tradeshow
                  </button>
                </div>
              </div>
            )}

            {/* Designs grid */}
            {!cloud.loading && cloud.designs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cloud.designs.map((d) => (
                  <div
                    key={d.id}
                    className="group bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                  >
                    {/* Design header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        d.kind === 'conference' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {d.kind === 'conference' ? (
                          <FiCalendar className="w-5 h-5" />
                        ) : (
                          <FiGrid className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {d.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="capitalize">{d.kind}</span>
                          <span>•</span>
                          <span>v{d.latest_version || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const route = d.kind === 'tradeshow' ? '/tradeshow' : '/conference';
                            navigate(`${route}?designId=${d.id}`);
                          } catch (e) {
                            alert(e.message || "Open failed");
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <FiEdit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete design "${d.name}"? This cannot be undone.`)) return;
                          try {
                            await deleteDesign(d.id);
                            setCloud((s) => ({ ...s, designs: s.designs.filter(x => x.id !== d.id) }));
                          } catch (e) {
                            alert(e.message || 'Delete failed');
                          }
                        }}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        title="Delete design"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


