import React, { useEffect, useMemo, useState } from 'react';

export default function CanvasEditor({ storageKey, remoteName = 'custom', initialItems = [] }) {
  const [items, setItems] = useState(() => initialItems);
  const [dirty, setDirty] = useState(false);

  // Load from localStorage if available (once)
  useEffect(() => {
    try {
      if (!storageKey) return;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
        else if (Array.isArray(parsed?.items)) setItems(parsed.items);
      }
    } catch {}
  }, [storageKey]);

  // Persist to localStorage on change
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  const summary = useMemo(() => ({ count: Array.isArray(items) ? items.length : 0 }), [items]);

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <b>Editor</b>
          <span style={{ marginLeft: 8, color: '#64748b' }}>mode: {remoteName}</span>
          <span style={{ marginLeft: 8, color: '#64748b' }}>items: {summary.count}</span>
        </div>
        {dirty && <span style={{ color: '#2563eb' }}>Unsaved changes</span>}
      </div>

      <div style={{ marginTop: 12 }}>
        <textarea
          value={JSON.stringify(items, null, 2)}
          onChange={(e) => {
            try {
              const next = JSON.parse(e.target.value || '[]');
              if (Array.isArray(next)) {
                setItems(next);
                setDirty(true);
              }
            } catch {}
          }}
          style={{ width: '100%', minHeight: 360, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12 }}
        />
      </div>
    </div>
  );
}


