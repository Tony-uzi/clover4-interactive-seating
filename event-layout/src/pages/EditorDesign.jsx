import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import CanvasEditor from "../components/CanvasEditor.jsx";
import { getLatestDesign, createShareLink, inviteUser } from "../lib/api.js";

export default function EditorDesign() {
  const { designId } = useParams();
  const location = useLocation();
  const initialFromState = location.state?.items || null;
  const [loading, setLoading] = useState(!initialFromState);
  const [items, setItems] = useState(Array.isArray(initialFromState) ? initialFromState : null);
  const [meta, setMeta] = useState({ name: location.state?.name || "", kind: location.state?.kind || "custom" });
  const [shareBusy, setShareBusy] = useState(false);

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
    <section className="page">
      <div className="container">
        <h1 className="editor-head">Edit: {meta.name || `Design #${designId}`}</h1>
        <p className="editor-subtitle">You can continue editing and save new versions.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button
            disabled={shareBusy}
            onClick={async () => {
              const role = prompt('Share link role: view or edit', 'view');
              if (!role) return;
              try {
                setShareBusy(true);
                const { token } = await createShareLink(designId, role.toLowerCase() === 'edit' ? 'edit' : 'view');
                const url = `${window.location.origin}/share/${encodeURIComponent(`link-${designId}-${token}`)}`;
                await navigator.clipboard.writeText(url);
                alert('Share link copied to clipboard');
              } catch (e) {
                alert(e.message || 'Create link failed');
              } finally {
                setShareBusy(false);
              }
            }}
          >
            Create Share Link
          </button>
          <button
            disabled={shareBusy}
            onClick={async () => {
              const email = prompt('Invite user email');
              if (!email) return;
              const role = prompt('Invite role: view or edit', 'view');
              if (!role) return;
              try {
                setShareBusy(true);
                await inviteUser(designId, email, role.toLowerCase() === 'edit' ? 'edit' : 'view');
                alert('Invitation created');
              } catch (e) {
                alert(e.message || 'Invite failed');
              } finally {
                setShareBusy(false);
              }
            }}
          >
            Invite by Email
          </button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="editor-canvas">
            <div className="grid-bg">
              <CanvasEditor
                storageKey={`layout.design.${designId}`}
                remoteName={meta.kind || "custom"}
                initialItems={items || []}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


