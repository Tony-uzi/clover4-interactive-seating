import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listDesigns, getLatestDesign, listSharedDesigns } from "../lib/api.js";
import { deleteDesign } from "../lib/api.js";
import { Link as RouterLink, useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [shares, setShares] = useState([]);
  const [cloud, setCloud] = useState({ loading: false, designs: [], error: "" });
  const [shared, setShared] = useState({ loading: false, designs: [], error: "" });
  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("shares") || "[]");
      setShares(Array.isArray(arr) ? arr : []);
    } catch {
      setShares([]);
    }
  }, []);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setShared((s) => ({ ...s, loading: true }));
        const list = await listSharedDesigns();
        if (mounted) setShared({ loading: false, designs: list, error: "" });
      } catch (e) {
        if (mounted) setShared({ loading: false, designs: [], error: e.message || "" });
      }
    })();
    return () => (mounted = false);
  }, []);

  const total = shares.length;

  return (
    <section className="page">
      <div className="container">
        <h1 className="editor-head">My Profile</h1>
        <p className="editor-subtitle">Saved share links and layouts</p>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>My Shares</b>
            <span style={{ color: "#475569" }}>{total} total</span>
      </div>

        {/* Shared with me */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            padding: 12,
            marginTop: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Shared With Me</b>
            <span style={{ color: "#475569" }}>
              {shared.loading ? "Loading..." : `${shared.designs.length} total`}
            </span>
          </div>

          {shared.error && (
            <div style={{ color: "#b91c1c", marginTop: 8 }}>{shared.error}</div>
          )}

          {!shared.loading && shared.designs.length === 0 ? (
            <div style={{ color: "#64748b", marginTop: 8 }}>No shared designs</div>
          ) : (
            <ul style={{ margin: 8, paddingLeft: 18 }}>
              {shared.designs.map((d) => (
                <li key={d.id} style={{ lineHeight: 1.9 }}>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>({d.kind})</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>v{d.latest_version || 0}</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>role: {d.role}</span>
                  <button
                    style={{ marginLeft: 12 }}
                    onClick={async () => {
                      try {
                        // Open in correct planner route
                        const route = d.kind === 'tradeshow' ? '/tradeshow' : '/conference';
                        navigate(`${route}?designId=${d.id}`);
                      } catch (e) {
                        alert(e.message || "Open failed");
                      }
                    }}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

          {total === 0 ? (
            <div style={{ color: "#64748b", marginTop: 8 }}>No shares yet</div>
          ) : (
            <ul style={{ margin: 8, paddingLeft: 18 }}>
              {shares.map((s) => {
                const url = `/share/${encodeURIComponent(s.id)}`;
                return (
                  <li key={s.id} style={{ lineHeight: 1.9 }}>
                    <Link to={url}>{s.name}</Link>
                    <span style={{ color: "#64748b", marginLeft: 8 }}>
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ marginLeft: 12 }}
                    >
                      Open
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Cloud files */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            padding: 12,
            marginTop: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>My Cloud Designs</b>
            <span style={{ color: "#475569" }}>
              {cloud.loading ? "Loading..." : `${cloud.designs.length} total`}
            </span>
          </div>

          {cloud.error && (
            <div style={{ color: "#b91c1c", marginTop: 8 }}>{cloud.error}</div>
          )}

          {!cloud.loading && cloud.designs.length === 0 ? (
            <div style={{ color: "#64748b", marginTop: 8 }}>No cloud files yet</div>
          ) : (
            <ul style={{ margin: 8, paddingLeft: 18 }}>
              {cloud.designs.map((d) => (
                <li key={d.id} style={{ lineHeight: 1.9 }}>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>({d.kind})</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>v{d.latest_version || 0}</span>
                  <button
                    style={{ marginLeft: 12 }}
                    onClick={async () => {
                      try {
                        const route = d.kind === 'tradeshow' ? '/tradeshow' : '/conference';
                        navigate(`${route}?designId=${d.id}`);
                      } catch (e) {
                        alert(e.message || "Open failed");
                      }
                    }}
                  >
                    Edit Latest
                  </button>
                  <button
                    style={{ marginLeft: 8, color: '#b91c1c' }}
                    onClick={async () => {
                      if (!confirm(`Delete design "${d.name}"? This cannot be undone.`)) return;
                      try {
                        await deleteDesign(d.id);
                        setCloud((s) => ({ ...s, designs: s.designs.filter(x => x.id !== d.id) }));
                      } catch (e) {
                        alert(e.message || 'Delete failed');
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}


