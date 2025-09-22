// src/components/CanvasEditor.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer } from "react-konva";

/** ========= Utils ========= */
const makeId = () => Math.random().toString(36).slice(2, 9);
const SNAP = 10;

/** Undo/Redo + Items State (回撤和恢复)*/
function useCanvasState(initialItems) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(null);

  // history record(有问题)
  const [history, setHistory] = useState([initialItems]);
  const [hIndex, setHIndex] = useState(0);

  const commit = (next) => {
    setItems(next);
    setHistory((h) => [...h.slice(0, hIndex + 1), next].slice(-50));
    setHIndex((i) => Math.min(i + 1, 49));
  };

  const undo = () => {
    if (hIndex <= 0) return;
    const idx = hIndex - 1;
    setHIndex(idx);
    setItems(history[idx]);
    setSelectedId(null);
  };

  const redo = () => {
    if (hIndex >= history.length - 1) return;
    const idx = hIndex + 1;
    setHIndex(idx);
    setItems(history[idx]);
    setSelectedId(null);
  };

  const updateItem = (id, patch) =>
    commit(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = (shape) => commit([...items, shape]);
  const removeItem = (id) => commit(items.filter((it) => it.id !== id));
  const duplicateItem = (id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    addItem({ ...it, id: makeId(), x: it.x + 20, y: it.y + 20 });
  };

  return {
    items,
    setItems, // 用于导入/加载
    selectedId,
    setSelectedId,
    updateItem,
    addItem,
    removeItem,
    duplicateItem,
    undo,
    redo,
    canUndo: hIndex > 0,
    canRedo: hIndex < history.length - 1,
  };
}

/**  Wheel Zoom (pinch/scroll)  */
function usePinchZoom(stageRef) {
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const scaleBy = 1.06;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      const dir = (e.deltaY ?? e.evt?.deltaY) > 0 ? 1 : -1;
      const newScale = dir > 0 ? oldScale / scaleBy : oldScale * scaleBy;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
      stage.batchDraw();
    };

    const container = stageRef.current?.container();
    if (!container) return;
    container.addEventListener("wheel", handler, { passive: false });
    return () => container.removeEventListener("wheel", handler);
  }, [stageRef]);
}

/** Grid */
function Grid({ width, height, step = 40 }) {
  const lines = [];
  for (let i = 0; i <= width / step; i++) {
    lines.push(
      <Rect
        key={`v${i}`}
        x={i * step}
        y={0}
        width={1}
        height={height}
        fill="#eee"
        listening={false}
      />
    );
  }
  for (let j = 0; j <= height / step; j++) {
    lines.push(
      <Rect
        key={`h${j}`}
        x={0}
        y={j * step}
        width={width}
        height={1}
        fill="#eee"
        listening={false}
      />
    );
  }
  return <Group>{lines}</Group>;
}

/*Draggable Item */
function DraggableItem({ shape, isSelected, onSelect, onChange, dim }) {
  const ref = useRef(null);

  const dragBound = (pos) => ({
    x: Math.round(pos.x / SNAP) * SNAP,
    y: Math.round(pos.y / SNAP) * SNAP,
  });

  return (
    <Group
      draggable
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      dragBoundFunc={dragBound}
      ref={ref}
      opacity={dim ? 0.22 : 1}
    >
      <Rect
        width={shape.w}
        height={shape.h}
        fill={shape.fill}
        stroke={isSelected ? "#1677ff" : shape.stroke}
        dash={isSelected ? [6, 4] : []}
        cornerRadius={shape.type === "path" ? 4 : 8}
        hitStrokeWidth={20}
      />
      {shape.type !== "path" && (
        <Text
          text={shape.text || ""}
          width={shape.w}
          height={shape.h}
          align="center"
          verticalAlign="middle"
          fontSize={14}
        />
      )}
      {isSelected && (
        <Transformer
          nodes={[ref.current]}
          rotateEnabled
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 40 || newBox.height < 40 ? oldBox : newBox
          }
          onTransformEnd={() => {
            const node = ref.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            onChange({
              w: Math.round(node.width() * scaleX),
              h: Math.round(node.height() * scaleY),
              rotation: node.rotation(),
            });
            node.scale({ x: 1, y: 1 });
          }}
        />
      )}
    </Group>
  );
}

/** ========= Palette ========= */
function Palette({ onAdd }) {
  const add = (type) => {
    if (type === "table" || type === "booth") {
      onAdd({
        id: makeId(),
        type,
        x: 40,
        y: 40,
        w: type === "table" ? 120 : 100,
        h: type === "table" ? 60 : 100,
        rotation: 0,
        fill: type === "table" ? "#f3f3f3" : "#e6f7ff",
        stroke: "#333",
        text: type === "table" ? "Table" : "Booth",
        tags: [],
        group: "",
      });
    } else if (type === "stage") {
      onAdd({
        id: makeId(),
        type: "stage",
        x: 80,
        y: 80,
        w: 200,
        h: 80,
        rotation: 0,
        fill: "#fff7e6",
        stroke: "#b36b00",
        text: "Stage",
        tags: [],
        group: "",
      });
    } else if (type === "path") {
      onAdd({
        id: makeId(),
        type: "path",
        x: 60,
        y: 60,
        w: 220,
        h: 40,
        rotation: 0,
        fill: "#f0f0f0",
        stroke: "#666",
        text: "Pathway",
        tags: [],
        group: "",
      });
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button onClick={() => add("table")}>+ Table</button>
      <button onClick={() => add("booth")}>+ Booth</button>
      <button onClick={() => add("stage")}>+ Stage</button>
      <button onClick={() => add("path")}>+ Pathway</button>
    </div>
  );
}

/** Main method*/
export default function CanvasEditor({
  storageKey = "layout.default.v1",
  remoteName = "default",
  initialItems: initialItemsProp = null,
}) {
  /*初始example */
  const initialItems = useMemo(
    () =>
      initialItemsProp && Array.isArray(initialItemsProp)
        ? initialItemsProp
        : [
      {
        id: "t1",
        type: "table",
        x: 120,
        y: 120,
        w: 120,
        h: 60,
        rotation: 0,
        fill: "#f3f3f3",
        stroke: "#222",
        text: "Table A",
        tags: ["VIP"],
        group: "Group 1",
      },
      {
        id: "t2",
        type: "booth",
        x: 360,
        y: 280,
        w: 100,
        h: 100,
        rotation: 0,
        fill: "#e6f7ff",
        stroke: "#138",
        text: "Booth B",
        tags: ["Sponsor"],
        group: "Group 2",
      },
    ],
    [initialItemsProp]
  );

  const {
    items,
    setItems,
    selectedId,
    setSelectedId,
    updateItem,
    addItem,
    removeItem,
    duplicateItem,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCanvasState(initialItems);

  // When initialItemsProp changes from parent (e.g., after async load), sync into editor state
  useEffect(() => {
    if (initialItemsProp && Array.isArray(initialItemsProp)) {
      setItems(initialItemsProp);
    }
  }, [initialItemsProp, setItems]);

  // 自适应画布尺寸
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // ======= Capacity & Safety Warnings =======
  const [maxCapacity, setMaxCapacity] = useState(80); // 简易容量阈值
  const overlaps = useMemo(() => {
    // 简易 AABB 重叠检测
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const aabb = (r) => ({
          left: r.x,
          right: r.x + r.w,
          top: r.y,
          bottom: r.y + r.h,
        });
        const A = aabb(a);
        const B = aabb(b);
        const intersect = !(
          A.right <= B.left ||
          A.left >= B.right ||
          A.bottom <= B.top ||
          A.top >= B.bottom
        );
        if (intersect) count++;
      }
    }
    return count;
  }, [items]);
  const capacityExceeded = items.length > maxCapacity;
  const showWarning = capacityExceeded || overlaps > 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.max(0, width), h: Math.max(0, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  usePinchZoom(stageRef);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );

  /** 过滤（标签/分组） */
  const [filterTag, setFilterTag] = useState("");
  const [filterMode, setFilterMode] = useState("highlight"); // highlight | hide
  const isFiltered = !!filterTag;
  const matchByFilter = (it) => {
    if (!isFiltered) return true;
    const arr = [...(it.tags || []), it.group]
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    return arr.includes(filterTag.toLowerCase());
  };

  /** 侧栏聚合 */
  const allTags = useMemo(
    () => [...new Set(items.flatMap((i) => i.tags || []))],
    [items]
  );
  const allGroups = useMemo(
    () => [...new Set(items.map((i) => i.group).filter(Boolean))],
    [items]
  );

  /** 键盘快捷键：删除、复制、方向键 */
  useEffect(() => {
    const onKey = (e) => {
      if (!selectedId) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateItem(selectedId);
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      if (e.key === "Delete" || e.key === "Backspace") {
        removeItem(selectedId);
      } else if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const it = items.find((i) => i.id === selectedId);
        if (it) updateItem(it.id, { x: it.x + dx, y: it.y + dy });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, items, updateItem, removeItem, duplicateItem]);

  /** JSON IO */
  const fileRef = useRef(null);
  const saveLocal = () =>
    localStorage.setItem(storageKey, JSON.stringify(items));
  const loadLocal = () => {
    const v = localStorage.getItem(storageKey);
    if (v) {
      try {
        const parsed = JSON.parse(v);
        setItems(Array.isArray(parsed) ? parsed : parsed.items || []);
      } catch {
        alert("Local data corrupted.");
      }
    }
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ version: 1, items }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${remoteName}-layout.json`;
    a.click();
  };
  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result?.toString() || "{}";
        const data = JSON.parse(text);
        setItems(data.items || data);
      } catch {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
  };

  /** 画布尺寸(size)兜底 */
  const W = size.w || 960;
  const H = size.h || 560;

  // ======= Share =======
  const ensureSharesBucket = () => {
    const raw = localStorage.getItem("shares");
    if (!raw) localStorage.setItem("shares", JSON.stringify([]));
  };
  const saveShare = () => {
    ensureSharesBucket();
    const id = `${remoteName}-${Date.now()}`;
    const record = {
      id,
      name: `${remoteName} layout`,
      items,
      createdAt: new Date().toISOString(),
    };
    const arr = JSON.parse(localStorage.getItem("shares") || "[]");
    const next = [record, ...arr.filter((x) => x.id !== id)].slice(0, 50);
    localStorage.setItem("shares", JSON.stringify(next));
    return id;
  };
  const copyShareLink = (id) => {
    const url = `${window.location.origin}/share/${encodeURIComponent(id)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Link copied to clipboard"))
      .catch(() => {
        prompt("Copy failed, please copy manually:", url);
      });
  };

  return (
    <div
      className="editor-layout"
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        gridTemplateRows: "auto 1fr",
        gap: 12,
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* 顶部工具栏 */}
      <div
        className="editor-topbar"
        style={{
          gridColumn: "1 / 3",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
          flexWrap: "wrap",
        }}
      >
        {/* Warnings */}
        {showWarning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#b91c1c",
              borderRadius: 8,
            }}
          >
            <span>
              {capacityExceeded && `容量超出：${items.length}/${maxCapacity}`}
              {capacityExceeded && overlaps > 0 && " ・ "}
              {overlaps > 0 && `检测到可能重叠：${overlaps} 处`}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#991b1b", fontSize: 12 }}>调整阈值</span>
              <input
                type="number"
                min={10}
                max={1000}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value) || 0)}
                style={{ width: 90 }}
              />
            </div>
          </div>
        )}

        <Palette onAdd={addItem} />

        <button disabled={!selectedId} onClick={() => removeItem(selectedId)}>
          Delete
        </button>
        <button
          disabled={!selectedId}
          onClick={() => duplicateItem(selectedId)}
        >
          Duplicate
        </button>
        <button disabled={!canUndo} onClick={undo}>
          Undo
        </button>
        <button disabled={!canRedo} onClick={redo}>
          Redo
        </button>

        {/* 过滤 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#555" }}>Filter Tag</span>
          <input
            placeholder="e.g. VIP or Group 1"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            style={{ width: 170 }}
          />
          <button
            onClick={() =>
              setFilterMode((m) => (m === "highlight" ? "hide" : "highlight"))
            }
          >
            {filterMode === "highlight" ? "Mode: Highlight" : "Mode: Hide"}
          </button>
          {filterTag && <button onClick={() => setFilterTag("")}>Clear</button>}
        </div>

        {/* 导入/导出 */}
        <button
          onClick={() => {
            const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
            const a = document.createElement("a");
            a.href = uri;
            a.download = `${remoteName}-layout.png`;
            a.click();
          }}
        >
          Export PNG
        </button>
        <button onClick={exportJSON}>Export JSON</button>
        <button onClick={saveLocal}>Save Local</button>
        <button onClick={loadLocal}>Load Local</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
        />
        <button onClick={() => fileRef.current?.click()}>Import JSON</button>

        {/* Share */}
        <button
          onClick={() => {
            const id = saveShare();
            copyShareLink(id);
          }}
        >
          Share Link
        </button>
        <button
          onClick={() => {
            const id = saveShare();
            window.open(`/share/${encodeURIComponent(id)}`, "_blank");
          }}
        >
          Present
        </button>

        {/* Cloud Save/Load */}
        <CloudControls items={items} setItems={setItems} remoteName={remoteName} />
      </div>

      {/* Left side：Groups / Tags */}
      <aside
        className="editor-sidebar"
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
          padding: 12,
          overflow: "auto",
        }}
      >
        <h3 style={{ marginTop: 4 }}>Groups</h3>
        {allGroups.length ? (
          <ul style={{ marginTop: 6, paddingLeft: 18 }}>
            {allGroups.map((g) => (
              <li
                key={g}
                style={{ cursor: "pointer", lineHeight: 1.8 }}
                onClick={() => setFilterTag(g)}
                title="Filter by group"
              >
                {g}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: "#888" }}>No groups yet</div>
        )}

        <h3 style={{ marginTop: 16 }}>Tags</h3>
        {allTags.length ? (
          <ul style={{ marginTop: 6, paddingLeft: 18 }}>
            {allTags.map((t) => (
              <li
                key={t}
                style={{ cursor: "pointer", lineHeight: 1.8 }}
                onClick={() => setFilterTag(t)}
                title="Filter by tag"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: "#888" }}>No tags yet</div>
        )}
      </aside>

      {/* Right side:属性编辑 + 画布 */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        {selectedItem && (
          <div
            className="editor-props"
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#fff",
              padding: "8px 12px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <b>Selected:</b> {selectedItem.type} ({selectedItem.id.slice(0, 4)})
            {selectedItem.type !== "path" && (
              <>
                <label>Label</label>
                <input
                  value={selectedItem.text || ""}
                  onChange={(e) =>
                    updateItem(selectedItem.id, { text: e.target.value })
                  }
                  style={{ width: 160 }}
                />
              </>
            )}
            <label>Tags</label>
            <input
              placeholder="VIP, Sponsor"
              value={(selectedItem.tags || []).join(", ")}
              onChange={(e) =>
                updateItem(selectedItem.id, {
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              style={{ width: 280 }}
            />
            <label>Group</label>
            <input
              placeholder="Group 1"
              value={selectedItem.group || ""}
              onChange={(e) =>
                updateItem(selectedItem.id, { group: e.target.value })
              }
              style={{ width: 160 }}
            />
          </div>
        )}

        {/* 画布的容器 Canvas container */}
        <div
          className="editor-stagewrap grid-bg"
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: 560,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fafafa",
            padding: 12,
            overflow: "auto",
            minWidth: 0,
          }}
        >
          <Stage
            ref={stageRef}
            width={W}
            height={H}
            draggable
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
            onTouchStart={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer listening={false}>
              <Rect x={0} y={0} width={W} height={H} fill="#fafafa" />
              <Grid width={W} height={H} step={40} />
            </Layer>

            <Layer>
              {items.map((it) => {
                const match = matchByFilter(it);
                if (isFiltered && filterMode === "hide" && !match) return null;
                return (
                  <DraggableItem
                    key={it.id}
                    shape={it}
                    isSelected={it.id === selectedId}
                    onSelect={() => setSelectedId(it.id)}
                    onChange={(patch) => updateItem(it.id, patch)}
                    dim={isFiltered && filterMode === "highlight" && !match}
                  />
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

import { useState as _useState } from "react";
import { createOrGetDesign, saveDesignVersion, getLatestDesign } from "../lib/api.js";

function CloudControls({ items, setItems, remoteName }) {
  const [saving, setSaving] = _useState(false);
  const [loading, setLoading] = _useState(false);
  const [designMeta, setDesignMeta] = _useState(null); // {id, name, kind, latest_version}

  const doSave = async () => {
    const name = prompt("Enter a file name (e.g. My Conference Layout)", designMeta?.name || `${remoteName} layout`);
    if (!name) return;
    try {
      setSaving(true);
      const meta = await createOrGetDesign(name, remoteName);
      setDesignMeta(meta);
      const payload = { items };
      const note = prompt("Version note (optional)", "");
      await saveDesignVersion(meta.id, payload, note || "");
      alert("Saved to cloud");
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const doLoad = async () => {
    const name = prompt("Enter the file name to load", designMeta?.name || `${remoteName} layout`);
    if (!name) return;
    try {
      setLoading(true);
      const meta = await createOrGetDesign(name, remoteName);
      setDesignMeta(meta);
      const latest = await getLatestDesign(meta.id);
      const next = Array.isArray(latest.data) ? latest.data : latest.data.items || [];
      setItems(next);
      alert(`Loaded latest version v${latest.version}`);
    } catch (e) {
      alert(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={doSave} disabled={saving}>
        {saving ? "Saving..." : "Save to Cloud"}
      </button>
      <button onClick={doLoad} disabled={loading}>
        {loading ? "Loading..." : "Load from Cloud"}
      </button>
    </>
  );
}
