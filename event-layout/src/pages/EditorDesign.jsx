import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FiEdit3, FiLoader } from 'react-icons/fi';
import CanvasEditor from "../components/CanvasEditor.jsx";
import { getLatestDesign } from "../lib/api.js";

export default function EditorDesign() {
  const { designId } = useParams();
  const location = useLocation();
  const initialFromState = location.state?.items || null;
  const [loading, setLoading] = useState(!initialFromState);
  const [items, setItems] = useState(Array.isArray(initialFromState) ? initialFromState : null);
  const [meta, setMeta] = useState({ name: location.state?.name || "", kind: location.state?.kind || "custom" });

  useEffect(() => {
    let mounted = true;
    if (!initialFromState) {
      (async () => {
        try {
          setLoading(true);
          const latest = await getLatestDesign(designId);
          const next = Array.isArray(latest.data) ? latest.data : latest.data.items || [];
          if (mounted) setItems(next);
        } catch (e) {
          alert(e.message || "Failed to load");
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }
    return () => (mounted = false);
  }, [designId, initialFromState]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FiEdit3 className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {meta.name || `Design #${designId}`}
            </h1>
          </div>
          <p className="text-gray-600 ml-12">
            Continue editing and save new versions of your design
          </p>
        </div>

        {/* Editor canvas */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-gray-200">
            <FiLoader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading your design...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="grid-bg rounded-xl overflow-hidden">
              <CanvasEditor
                storageKey={`layout.design.${designId}`}
                remoteName={meta.kind || "custom"}
                initialItems={items || []}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


