import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Group,
  Circle,
  Transformer,
  Arc,
} from "react-konva";

/**
 * ConferencePlanner.jsx (JavaScript, React + Konva)
 * -------------------------------------------------------------------
 * 1) Non-rectangular rooms: Rectangle | Polygon | Sector (fan)
 * 2) Facilities (door/window/exit/egress) true resize via Transformer
 *    - Drag corners to resize (non-proportional allowed)
 *    - Drag body to move; double-click to delete
 * 3) Save / Load / AutoSave to localStorage
 */

// ----------------------------- Constants ------------------------------
const PX_PER_METER = 40; // 1m ≈ 40px
const GRID_SIZE_M = 0.5; // grid every 0.5 m
const GRID_SIZE_PX = GRID_SIZE_M * PX_PER_METER;
const STORAGE_KEY = "confplanner_state_v1";

const CATALOG = [
  {
    key: "round-table",
    label: "Round Table",
    type: "table_round",
    w: 1.8,
    h: 1.8,
  },
  {
    key: "rect-table",
    label: "Rect Table",
    type: "table_rect",
    w: 1.8,
    h: 0.8,
  },
  { key: "chair", label: "Chair", type: "chair", w: 0.5, h: 0.5 },
  { key: "podium", label: "Podium", type: "podium", w: 0.7, h: 0.6 },
  { key: "stage", label: "Stage", type: "stage", w: 4.0, h: 2.0 },
  { key: "lounge", label: "Lounge Area", type: "lounge", w: 3.0, h: 2.0 },
  { key: "service", label: "Service Desk", type: "service", w: 2.0, h: 0.9 },
  {
    key: "catering",
    label: "Catering Table",
    type: "catering",
    w: 2.0,
    h: 0.8,
  },
];

const FAC_CATALOG = [
  { kind: "door", label: "Door" },
  { kind: "window", label: "Window" },
  { kind: "exit", label: "Exit" },
  { kind: "egress", label: "Egress" },
];

// ------------------------------ Helpers -------------------------------
function mToPx(m) {
  return m * PX_PER_METER;
}
function pxToM(px) {
  return px / PX_PER_METER;
}
function snapPx(v) {
  return Math.round(v / GRID_SIZE_PX) * GRID_SIZE_PX;
}
function rid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
function btn() {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: "4px 8px",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  };
}
function inpt() {
  return {
    width: 72,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "2px 6px",
  };
}

// ------------------------------ Presets -------------------------------
const PRESET_ROOMS = [
  {
    // Rectangle
    id: "auditorium",
    name: "Auditorium A",
    shape: { kind: "rect", w: 24, h: 16 },
    capacity: 300,
    seatMax: 260,
    facilities: [
      { id: rid(), kind: "door", x: 2, y: 0, w: 2, h: 0.2, label: "Door" },
      { id: rid(), kind: "door", x: 20, y: 0, w: 2, h: 0.2, label: "Door" },
      { id: rid(), kind: "exit", x: 0, y: 8, w: 0.2, h: 2, label: "Exit" },
      { id: rid(), kind: "exit", x: 23.8, y: 8, w: 0.2, h: 2, label: "Exit" },
      {
        id: rid(),
        kind: "egress",
        x: 12,
        y: 15.6,
        w: 10,
        h: 0.4,
        label: "Egress",
      },
      {
        id: rid(),
        kind: "window",
        x: 8,
        y: 15.8,
        w: 8,
        h: 0.2,
        label: "Window",
      },
    ],
  },
  {
    // Polygon (trapezoid example)
    id: "hall-b",
    name: "Conference Hall B",
    shape: {
      kind: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 18, y: 0 },
        { x: 16, y: 12 },
        { x: 2, y: 12 },
      ],
    },
    capacity: 180,
    seatMax: 150,
    facilities: [
      { id: rid(), kind: "door", x: 0, y: 4, w: 0.2, h: 2, label: "Door" },
      { id: rid(), kind: "exit", x: 17.8, y: 6, w: 0.2, h: 2, label: "Exit" },
      { id: rid(), kind: "window", x: 4, y: 0, w: 10, h: 0.2, label: "Window" },
      {
        id: rid(),
        kind: "egress",
        x: 0,
        y: 11.6,
        w: 18,
        h: 0.4,
        label: "Egress",
      },
    ],
  },
  {
    // Sector (fan)
    id: "breakout-c",
    name: "Breakout C",
    shape: { kind: "sector", cx: 6, cy: 6, r: 8, startDeg: -45, endDeg: 60 },
    capacity: 80,
    seatMax: 60,
    facilities: [
      { id: rid(), kind: "door", x: 5, y: 0.5, w: 2, h: 0.2, label: "Door" },
      {
        id: rid(),
        kind: "window",
        x: 2,
        y: 7.8,
        w: 8,
        h: 0.2,
        label: "Window",
      },
    ],
  },
];

// ------------------------------ Grid ----------------------------------
function Grid({ bbox, visible }) {
  if (!visible) return null;
  const { wPx, hPx } = bbox;
  const lines = [];
  for (let x = 0; x <= wPx; x += GRID_SIZE_PX)
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, hPx]}
        stroke="#e5e7eb"
        strokeWidth={1}
        listening={false}
      />
    );
  for (let y = 0; y <= hPx; y += GRID_SIZE_PX)
    lines.push(
      <Line
        key={`h${y}`}
        points={[0, y, wPx, y]}
        stroke="#e5e7eb"
        strokeWidth={1}
        listening={false}
      />
    );
  return <>{lines}</>;
}

// --------------------------- Room Rendering ----------------------------
function roomBBox(shape) {
  if (shape.kind === "rect")
    return { wPx: mToPx(shape.w), hPx: mToPx(shape.h) };
  if (shape.kind === "polygon") {
    const xs = shape.points.map((p) => p.x),
      ys = shape.points.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    return { wPx: mToPx(w), hPx: mToPx(h) };
  }
  if (shape.kind === "sector") {
    const d = shape.r * 2;
    return { wPx: mToPx(d), hPx: mToPx(d) };
  }
  return { wPx: 800, hPx: 600 };
}

function RoomShape({ shape, editable, onChange }) {
  if (shape.kind === "rect") {
    return (
      <Rect
        x={0}
        y={0}
        width={mToPx(shape.w)}
        height={mToPx(shape.h)}
        fill="#fff"
        stroke="#111827"
        strokeWidth={2}
        cornerRadius={6}
        listening={false}
      />
    );
  }
  if (shape.kind === "polygon") {
    const pts = shape.points.flatMap((p) => [mToPx(p.x), mToPx(p.y)]);
    return (
      <>
        <Line
          points={pts}
          closed
          stroke="#111827"
          strokeWidth={2}
          fill="#fff"
          listening={false}
        />
        {editable &&
          shape.points.map((p, idx) => (
            <Group
              key={idx}
              draggable
              x={mToPx(p.x)}
              y={mToPx(p.y)}
              onDragMove={(e) => {
                const nx = pxToM(e.target.x());
                const ny = pxToM(e.target.y());
                const next = {
                  ...shape,
                  points: shape.points.map((q, i) =>
                    i === idx ? { x: nx, y: ny } : q
                  ),
                };
                onChange(next);
              }}
            >
              <Circle radius={6} fill="#3b82f6" />
              <Text
                x={8}
                y={-6}
                text={`P${idx + 1}`}
                fontSize={12}
                fill="#3b82f6"
              />
            </Group>
          ))}
      </>
    );
  }
  if (shape.kind === "sector") {
    const rot = shape.startDeg;
    const angle = shape.endDeg - shape.startDeg;
    return (
      <Group>
        <Arc
          x={mToPx(shape.cx)}
          y={mToPx(shape.cy)}
          innerRadius={0}
          outerRadius={mToPx(shape.r)}
          angle={angle}
          rotation={rot}
          fill="#fff"
          stroke="#111827"
          strokeWidth={2}
        />
      </Group>
    );
  }
  return null;
}

// ------------------------- Facilities Layers ---------------------------
function FacilitiesStatic({ facilities }) {
  return (
    <>
      {facilities.map((f) => {
        const x = mToPx(f.x),
          y = mToPx(f.y),
          w = mToPx(f.w),
          h = mToPx(f.h);
        let color = "#111827";
        if (f.kind === "door") color = "#2563eb";
        else if (f.kind === "exit") color = "#16a34a";
        else if (f.kind === "window") color = "#06b6d4";
        else if (f.kind === "egress") color = "#f97316";
        return (
          <Group key={f.id}>
            <Rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              opacity={0.25}
              cornerRadius={2}
              listening={false}
            />
            <Text
              x={x}
              y={y - 14}
              text={f.label}
              fontSize={12}
              fill={color}
              listening={false}
            />
          </Group>
        );
      })}
    </>
  );
}

function FacilitiesEditable({ facilities, onChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const shapeRef = useRef();
  const trRef = useRef();

  // Bind transformer to selected node
  useEffect(() => {
    if (selectedId && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  function updateF(upd) {
    onChange(facilities.map((f) => (f.id === upd.id ? upd : f)));
  }
  function delF(id) {
    onChange(facilities.filter((f) => f.id !== id));
    setSelectedId(null);
  }

  return (
    <>
      {facilities.map((f) => {
        const x = mToPx(f.x),
          y = mToPx(f.y),
          w = mToPx(f.w),
          h = mToPx(f.h);
        let color = "#111827";
        if (f.kind === "door") color = "#2563eb";
        else if (f.kind === "exit") color = "#16a34a";
        else if (f.kind === "window") color = "#06b6d4";
        else if (f.kind === "egress") color = "#f97316";
        const isSel = selectedId === f.id;
        return (
          <Group key={f.id}>
            <Rect
              ref={isSel ? shapeRef : null}
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              opacity={0.25}
              cornerRadius={2}
              draggable
              onDragEnd={(e) => {
                updateF({
                  ...f,
                  x: pxToM(e.target.x()),
                  y: pxToM(e.target.y()),
                });
              }}
              onClick={() => setSelectedId(f.id)}
              onTap={() => setSelectedId(f.id)}
              onDblClick={() => delF(f.id)}
              onDblTap={() => delF(f.id)}
            />
            <Text
              x={x}
              y={y - 14}
              text={f.label}
              fontSize={12}
              fill={color}
              listening={false}
            />
            {isSel && (
              <Transformer
                ref={trRef}
                rotateEnabled={false}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldB, newB) => {
                  const min = 6;
                  if (Math.abs(newB.width) < min || Math.abs(newB.height) < min)
                    return oldB;
                  return newB;
                }}
                onTransformEnd={() => {
                  // Commit scale to width/height so resizing is not locked to proportional
                  const n = shapeRef.current;
                  if (!n) return;
                  const sx = n.scaleX();
                  const sy = n.scaleY();
                  const nextW = Math.max(6, snapPx(n.width() * sx));
                  const nextH = Math.max(6, snapPx(n.height() * sy));
                  n.scaleX(1);
                  n.scaleY(1);
                  n.width(nextW);
                  n.height(nextH);
                  updateF({ ...f, w: pxToM(nextW), h: pxToM(nextH) });
                }}
              />
            )}
          </Group>
        );
      })}
    </>
  );
}

// --------------------------- Elements (furniture) ----------------------
function ElementNode({ node, isSelected, onSelect, onChange, onDelete }) {
  const shapeRef = useRef();
  const trRef = useRef();
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  const widthPx = node.w * PX_PER_METER * node.scaleX;
  const heightPx = node.h * PX_PER_METER * node.scaleY;
  const fills = {
    table_round: "#c7d2fe",
    table_rect: "#bfdbfe",
    chair: "#fde68a",
    podium: "#fca5a5",
    stage: "#a7f3d0",
    lounge: "#ddd6fe",
    service: "#fecaca",
    catering: "#bbf7d0",
  };
  const fill = fills[node.type] || "#e5e7eb";
  function onDragEnd(e) {
    onChange({ ...node, x: snapPx(e.target.x()), y: snapPx(e.target.y()) });
  }
  function onTransformEnd() {
    const ref = shapeRef.current;
    if (!ref) return;
    const sx = ref.scaleX(),
      sy = ref.scaleY();
    const rawW = node.w * PX_PER_METER * sx,
      rawH = node.h * PX_PER_METER * sy;
    const sw = Math.max(GRID_SIZE_PX, snapPx(rawW));
    const sh = Math.max(GRID_SIZE_PX, snapPx(rawH));
    const nSx = sw / (node.w * PX_PER_METER),
      nSy = sh / (node.h * PX_PER_METER);
    ref.scaleX(1);
    ref.scaleY(1);
    onChange({
      ...node,
      x: snapPx(ref.x()),
      y: snapPx(ref.y()),
      scaleX: nSx,
      scaleY: nSy,
      rotation: ref.rotation(),
    });
  }
  const base = {
    ref: shapeRef,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    onClick: onSelect,
    onTap: onSelect,
    draggable: true,
    onDragEnd,
    onTransformEnd,
    onDblClick: () => onDelete(node.id),
    onDblTap: () => onDelete(node.id),
  };
  return (
    <>
      {node.type === "table_round" ? (
        <Circle
          {...base}
          radius={Math.max(widthPx, heightPx) / 4}
          fill={fill}
          stroke="#374151"
          strokeWidth={1}
        />
      ) : (
        <Rect
          {...base}
          width={widthPx}
          height={heightPx}
          fill={fill}
          stroke="#374151"
          strokeWidth={1}
          cornerRadius={4}
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          boundBoxFunc={(o, n) => {
            const m = GRID_SIZE_PX;
            if (Math.abs(n.width) < m || Math.abs(n.height) < m) return o;
            return n;
          }}
        />
      )}
      <Text
        x={node.x}
        y={node.y - 16}
        text={node.label}
        fontSize={12}
        fill="#374151"
        listening={false}
      />
    </>
  );
}

// ------------------------------ UI parts -------------------------------
function Toolbar({
  rooms,
  activeRoomId,
  onChangeRoom,
  onAddItem,
  onResetRoom,
  zoom,
  onZoom,
  gridOn,
  setGridOn,
  facEdit,
  setFacEdit,
  roomEdit,
  setRoomEdit,
  onAddFacility,
  onPolygonVertex,
  onSave,
  onLoad,
  autoSave,
  setAutoSave,
}) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Room</label>
        <select
          value={activeRoomId}
          onChange={(e) => onChangeRoom(e.target.value)}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "4px 8px",
          }}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button
          onClick={onResetRoom}
          title="Clear layout for this room"
          style={{ marginLeft: 8, ...btn() }}
        >
          Clear layout
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginLeft: "auto",
        }}
      >
        <button onClick={() => onZoom(1 / 1.2)} style={btn()}>
          −
        </button>
        <div style={{ fontSize: 13, width: 56, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </div>
        <button onClick={() => onZoom(1.2)} style={btn()}>
          +
        </button>
        <label
          style={{
            marginLeft: 8,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="checkbox"
            checked={roomEdit}
            onChange={(e) => setRoomEdit(e.target.checked)}
          />{" "}
          Edit Room
        </label>
        <label
          style={{
            marginLeft: 8,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="checkbox"
            checked={gridOn}
            onChange={(e) => setGridOn(e.target.checked)}
          />{" "}
          Grid
        </label>
        <label
          style={{
            marginLeft: 8,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="checkbox"
            checked={facEdit}
            onChange={(e) => setFacEdit(e.target.checked)}
          />{" "}
          Edit Facilities
        </label>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        {CATALOG.map((c) => (
          <button key={c.key} onClick={() => onAddItem(c)} style={btn()}>
            + {c.label}
          </button>
        ))}
        {facEdit && (
          <>
            <span
              style={{
                marginLeft: 12,
                fontSize: 12,
                color: "#6b7280",
                alignSelf: "center",
              }}
            >
              Facilities:
            </span>
            {FAC_CATALOG.map((f) => (
              <button
                key={f.kind}
                onClick={() => onAddFacility(f.kind)}
                style={btn()}
              >
                + {f.label}
              </button>
            ))}
          </>
        )}
        {roomEdit &&
          rooms.find((r) => r.id === activeRoomId)?.shape.kind ===
            "polygon" && (
            <>
              <button
                onClick={() => onPolygonVertex("add")}
                style={{ ...btn(), borderColor: "#93c5fd" }}
              >
                + Add Vertex
              </button>
              <button
                onClick={() => onPolygonVertex("remove")}
                style={{ ...btn(), borderColor: "#fca5a5" }}
              >
                − Remove Last
              </button>
            </>
          )}
        {/* Save / Load / AutoSave */}
        <span style={{ marginLeft: "auto" }} />
        <button onClick={onSave} style={{ ...btn(), borderColor: "#10b981" }}>
          Save
        </button>
        <button onClick={onLoad} style={{ ...btn(), borderColor: "#60a5fa" }}>
          Load
        </button>
        <label
          style={{
            marginLeft: 8,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />{" "}
          AutoSave
        </label>
      </div>
    </div>
  );
}

function RoomStats({
  room,
  count,
  onRectChange,
  onSectorChange,
  onShapeKindChange,
}) {
  const kind = room.shape.kind;
  const areaHint =
    kind === "rect" ? Math.round(room.shape.w * room.shape.h) : "—";
  return (
    <div
      style={{
        padding: 12,
        borderRight: "1px solid #e5e7eb",
        width: 280,
        background: "#f9fafb",
      }}
    >
      <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Room Info</h3>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        <div>
          <span style={{ fontWeight: 600 }}>Name:</span> {room.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Shape:</span>
          <select
            value={kind}
            onChange={(e) => onShapeKindChange(e.target.value)}
            style={{ ...inpt(), width: 140 }}
          >
            <option value="rect">Rectangle</option>
            <option value="polygon">Polygon</option>
            <option value="sector">Sector (fan)</option>
          </select>
        </div>

        {kind === "rect" && (
          <div style={{ marginTop: 6 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>Dimensions:</span>
              <input
                type="number"
                step={0.5}
                value={room.shape.w}
                onChange={(e) =>
                  onRectChange(Number(e.target.value), room.shape.h)
                }
                style={inpt()}
              />{" "}
              m ×
              <input
                type="number"
                step={0.5}
                value={room.shape.h}
                onChange={(e) =>
                  onRectChange(room.shape.w, Number(e.target.value))
                }
                style={inpt()}
              />{" "}
              m
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Area:</span> {areaHint} m²
            </div>
          </div>
        )}

        {kind === "sector" && (
          <div
            style={{
              marginTop: 6,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 6,
            }}
          >
            <label>Center x (m)</label>
            <input
              type="number"
              step={0.5}
              value={room.shape.cx}
              onChange={(e) =>
                onSectorChange({ ...room.shape, cx: Number(e.target.value) })
              }
              style={inpt()}
            />
            <label>Center y (m)</label>
            <input
              type="number"
              step={0.5}
              value={room.shape.cy}
              onChange={(e) =>
                onSectorChange({ ...room.shape, cy: Number(e.target.value) })
              }
              style={inpt()}
            />
            <label>Radius (m)</label>
            <input
              type="number"
              step={0.5}
              value={room.shape.r}
              onChange={(e) =>
                onSectorChange({ ...room.shape, r: Number(e.target.value) })
              }
              style={inpt()}
            />
            <label>Start (°)</label>
            <input
              type="number"
              step={1}
              value={room.shape.startDeg}
              onChange={(e) =>
                onSectorChange({
                  ...room.shape,
                  startDeg: Number(e.target.value),
                })
              }
              style={inpt()}
            />
            <label>End (°)</label>
            <input
              type="number"
              step={1}
              value={room.shape.endDeg}
              onChange={(e) =>
                onSectorChange({
                  ...room.shape,
                  endDeg: Number(e.target.value),
                })
              }
              style={inpt()}
            />
          </div>
        )}

        {kind === "polygon" && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
            Drag blue anchors on canvas to reshape polygon. Use toolbar to
            add/remove vertices.
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <span style={{ fontWeight: 600 }}>Placed items:</span> {count}
        </div>
      </div>
    </div>
  );
}

// ------------------------------- Main ----------------------------------
export default function ConferencePlanner() {
  const [rooms, setRooms] = useState(() =>
    PRESET_ROOMS.map((r) => ({ ...r, facilities: [...r.facilities] }))
  );
  const [activeRoomId, setActiveRoomId] = useState(rooms[0].id);
  const [roomElements, setRoomElements] = useState(() => {
    const init = {};
    rooms.forEach((r) => (init[r.id] = []));
    return init;
  });

  const [gridOn, setGridOn] = useState(true);
  const [facEdit, setFacEdit] = useState(false);
  const [roomEdit, setRoomEdit] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const [zoom, setZoom] = useState(0.9);
  const [stagePos, setStagePos] = useState({ x: 40, y: 40 });
  const stageRef = useRef();
  const [selectedId, setSelectedId] = useState(null);

  // Load state at mount if any
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.rooms) setRooms(s.rooms);
        if (s.roomElements) setRoomElements(s.roomElements);
        if (s.activeRoomId) setActiveRoomId(s.activeRoomId);
      } catch (_) {}
    }
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (!autoSave) return;
    const snapshot = JSON.stringify({ rooms, roomElements, activeRoomId });
    localStorage.setItem(STORAGE_KEY, snapshot);
  }, [rooms, roomElements, activeRoomId, autoSave]);

  const roomIdx = rooms.findIndex((r) => r.id === activeRoomId);
  const room = rooms[roomIdx];
  const bbox = roomBBox(room.shape);
  const elements = roomElements[activeRoomId] || [];

  function updateRoom(fn) {
    setRooms((prev) => prev.map((r, i) => (i === roomIdx ? fn(r) : r)));
  }
  function updateElements(fn) {
    setRoomElements((prev) => ({
      ...prev,
      [activeRoomId]: fn(prev[activeRoomId] || []),
    }));
  }

  function handleChangeRoom(id) {
    setActiveRoomId(id);
    setSelectedId(null);
  }
  function handleResetRoom() {
    updateElements(() => []);
    setSelectedId(null);
  }

  // Add furniture
  function handleAddItem(cat) {
    const id = rid("n");
    const node = {
      id,
      type: cat.type,
      label: cat.label,
      x: snapPx(mToPx(2)),
      y: snapPx(mToPx(2)),
      w: cat.w,
      h: cat.h,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    updateElements((list) => [...list, node]);
    setSelectedId(id);
  }
  function handleChangeNode(node) {
    updateElements((list) => list.map((n) => (n.id === node.id ? node : n)));
  }
  function handleDeleteNode(id) {
    updateElements((list) => list.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // Grid/zoom/pan
  function handleStageMouseDown(e) {
    if (e.target === e.target.getStage()) setSelectedId(null);
  }
  function handleWheel(e) {
    e.evt.preventDefault();
    const scaleBy = 1.2;
    const stage = stageRef.current;
    const old = stage.scaleX();
    const p = stage.getPointerPosition();
    const mouse = { x: (p.x - stage.x()) / old, y: (p.y - stage.y()) / old };
    const dir = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    const ns = Math.min(3, Math.max(0.2, old * dir));
    const np = { x: p.x - mouse.x * ns, y: p.y - mouse.y * ns };
    setZoom(ns);
    setStagePos(np);
  }
  function zoomBy(f) {
    const stage = stageRef.current;
    const c = stage?.getPointerPosition() || { x: 400, y: 300 };
    const old = zoom;
    const mouse = { x: (c.x - stagePos.x) / old, y: (c.y - stagePos.y) / old };
    const ns = Math.min(3, Math.max(0.2, old * f));
    setZoom(ns);
    setStagePos({ x: c.x - mouse.x * ns, y: c.y - mouse.y * ns });
  }

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) handleDeleteNode(selectedId);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  // Facilities API
  function handleFacilitiesChange(list) {
    updateRoom((r) => ({ ...r, facilities: list }));
  }
  function handleAddFacility(kind) {
    const def = {
      door: { w: 2, h: 0.2, label: "Door" },
      window: { w: 3, h: 0.2, label: "Window" },
      exit: { w: 0.2, h: 2, label: "Exit" },
      egress: { w: 4, h: 0.4, label: "Egress" },
    }[kind];
    updateRoom((r) => ({
      ...r,
      facilities: [...r.facilities, { id: rid("f"), kind, x: 1, y: 1, ...def }],
    }));
  }

  // Shape change handlers
  function onShapeKindChange(kind) {
    if (kind === "rect")
      updateRoom((r) => ({ ...r, shape: { kind: "rect", w: 20, h: 12 } }));
    if (kind === "polygon")
      updateRoom((r) => ({
        ...r,
        shape: {
          kind: "polygon",
          points: [
            { x: 0, y: 0 },
            { x: 18, y: 0 },
            { x: 18, y: 10 },
            { x: 0, y: 10 },
          ],
        },
      }));
    if (kind === "sector")
      updateRoom((r) => ({
        ...r,
        shape: {
          kind: "sector",
          cx: 8,
          cy: 8,
          r: 10,
          startDeg: -30,
          endDeg: 60,
        },
      }));
  }
  function onRectChange(w, h) {
    const min = 4,
      max = 80;
    const nw = Math.max(min, Math.min(max, w || 20));
    const nh = Math.max(min, Math.min(max, h || 12));
    updateRoom((r) => ({ ...r, shape: { kind: "rect", w: nw, h: nh } }));
  }
  function onSectorChange(next) {
    updateRoom((r) => ({ ...r, shape: next }));
  }
  function onPolygonVertex(action) {
    const s = rooms[roomIdx].shape;
    if (s.kind !== "polygon") return;
    if (action === "add") {
      const last = s.points[s.points.length - 1];
      const newP = { x: last.x + 2, y: last.y };
      updateRoom((r) => ({
        ...r,
        shape: { ...s, points: [...s.points, newP] },
      }));
    } else if (action === "remove" && s.points.length > 3) {
      updateRoom((r) => ({
        ...r,
        shape: { ...s, points: s.points.slice(0, -1) },
      }));
    }
  }

  // Save / Load handlers
  function handleSave() {
    const snapshot = JSON.stringify({ rooms, roomElements, activeRoomId });
    localStorage.setItem(STORAGE_KEY, snapshot);
  }
  function handleLoad() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.rooms) setRooms(s.rooms);
      if (s.roomElements) setRoomElements(s.roomElements);
      if (s.activeRoomId) setActiveRoomId(s.activeRoomId);
    } catch (_) {}
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Toolbar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onChangeRoom={handleChangeRoom}
        onAddItem={handleAddItem}
        onResetRoom={handleResetRoom}
        zoom={zoom}
        onZoom={zoomBy}
        gridOn={gridOn}
        setGridOn={setGridOn}
        facEdit={facEdit}
        setFacEdit={setFacEdit}
        roomEdit={roomEdit}
        setRoomEdit={setRoomEdit}
        onAddFacility={handleAddFacility}
        onPolygonVertex={onPolygonVertex}
        onSave={handleSave}
        onLoad={handleLoad}
        autoSave={autoSave}
        setAutoSave={setAutoSave}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <RoomStats
          room={room}
          count={elements.length}
          onRectChange={onRectChange}
          onSectorChange={onSectorChange}
          onShapeKindChange={onShapeKindChange}
        />

        <div style={{ position: "relative", flex: 1, background: "#fff" }}>
          <Stage
            ref={stageRef}
            x={stagePos.x}
            y={stagePos.y}
            width={Math.max(800, window.innerWidth - 320)}
            height={Math.max(600, window.innerHeight - 120)}
            scaleX={zoom}
            scaleY={zoom}
            onWheel={handleWheel}
            draggable
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageMouseDown}
            style={{ background: "#fafafa" }}
          >
            <Layer>
              {/* Room boundary */}
              <RoomShape
                shape={room.shape}
                editable={roomEdit}
                onChange={(next) => updateRoom((r) => ({ ...r, shape: next }))}
              />
              {/* Grid (drawn over room's bbox) */}
              <Grid bbox={bbox} visible={gridOn} />
              {/* Facilities */}
              {facEdit ? (
                <FacilitiesEditable
                  facilities={room.facilities}
                  onChange={handleFacilitiesChange}
                />
              ) : (
                <FacilitiesStatic facilities={room.facilities} />
              )}
            </Layer>

            <Layer>
              {elements.map((n) => (
                <ElementNode
                  key={n.id}
                  node={n}
                  isSelected={n.id === selectedId}
                  onSelect={() => setSelectedId(n.id)}
                  onChange={handleChangeNode}
                  onDelete={handleDeleteNode}
                />
              ))}
            </Layer>
          </Stage>

          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              fontSize: 12,
              background: "rgba(255,255,255,.9)",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "4px 8px",
              boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            }}
          >
            <div>
              <b>Tips</b>: Double-click furniture/facility to delete. Scroll to
              zoom. Drag canvas to pan.
            </div>
            <div>
              Facilities: select to see corner handles; drag corners to resize
              (non-proportional). Drag body to move.
            </div>
            <div>
              Save/Load: buttons on toolbar; AutoSave stores to localStorage
              automatically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
