import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getLatestByToken } from "../lib/api.js";
import { Stage, Layer, Rect, Group, Text } from "react-konva";

export default function ShareView() {
  const { shareId } = useParams();
  const [items, setItems] = useState([]);
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    // Support two formats:
    // 1) Local share: id stored in localStorage (legacy)
    // 2) Link share: "link-<designId>-<token>"
    const localArr = JSON.parse(localStorage.getItem("shares") || "[]");
    const local = localArr.find((x) => x.id === shareId);
    if (local) {
      setItems(local.items || []);
      return;
    }
    const m = /^link-(\d+)-(.*)$/i.exec(shareId || "");
    if (m) {
      const designId = m[1];
      const token = m[2];
      (async () => {
        try {
          const tokenStored = localStorage.getItem('token');
          if (!tokenStored) {
            const redirect = encodeURIComponent(`/share/${encodeURIComponent(shareId)}`);
            window.location.href = `/login?redirect=${redirect}`;
            return;
          }
          const latest = await getLatestByToken(designId, token);
          const next = Array.isArray(latest.data) ? latest.data : latest.data.items || [];
          setItems(next);
        } catch (e) {
          alert(e.message || "Failed to load shared content");
        }
      })();
    } else {
      setItems([]);
    }
  }, [shareId]);

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

  const W = size.w || 960;
  const H = size.h || 560;

  return (
    <section className="page">
      <div className="container">
        <h1 className="editor-head">Shared Layout</h1>
        <p className="editor-subtitle">Read-only view for screens or sharing</p>

        <div
          className="editor-stagewrap grid-bg"
          ref={containerRef}
          style={{
            minHeight: 560,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fafafa",
            padding: 12,
            overflow: "auto",
          }}
        >
          <Stage ref={stageRef} width={W} height={H}>
            <Layer listening={false}>
              <Rect x={0} y={0} width={W} height={H} fill="#fafafa" />
            </Layer>
            <Layer>
              {items.map((it) => (
                <Group key={it.id} x={it.x} y={it.y} rotation={it.rotation}>
                  <Rect
                    width={it.w}
                    height={it.h}
                    fill={it.fill}
                    stroke={it.stroke}
                    cornerRadius={it.type === "path" ? 4 : 8}
                  />
                  {it.type !== "path" && (
                    <Text
                      text={it.text || ""}
                      width={it.w}
                      height={it.h}
                      align="center"
                      verticalAlign="middle"
                      fontSize={14}
                    />
                  )}
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </section>
  );
}


