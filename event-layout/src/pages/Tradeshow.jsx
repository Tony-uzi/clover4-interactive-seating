import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Arrow, Circle } from 'react-konva';
import COLORS from '../components/planner/colors.js';
import { mToPx, PX_PER_METER } from '../components/planner/utils.js';

const STORAGE_KEY = 'tradeshow_planner_integrated_v1';

const CATEGORY_COLORS = {
  booth: COLORS.booth,
  facility: COLORS.facility,
  structure: '#e2e8f0'
};

function boothSize(booth) {
  const scaleX = booth.scaleX || 1;
  const scaleY = booth.scaleY || 1;
  return {
    width: (booth.w || 0) * PX_PER_METER * scaleX,
    height: (booth.h || 0) * PX_PER_METER * scaleY
  };
}

function boothCenter(booth) {
  const { width, height } = boothSize(booth);
  return {
    x: (booth.x || 0) + width / 2,
    y: (booth.y || 0) + height / 2
  };
}

function loadTradeshowData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { booths: [], vendors: [], boothAssignments: {}, hallWidth: 40, hallHeight: 30 };
    }
    const parsed = JSON.parse(stored);
    return {
      booths: Array.isArray(parsed.booths) ? parsed.booths : [],
      vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
      boothAssignments: parsed.boothAssignments || {},
      hallWidth: parsed.hallWidth || 40,
      hallHeight: parsed.hallHeight || 30
    };
  } catch (error) {
    console.warn('Failed to load tradeshow kiosk data', error);
    return { booths: [], vendors: [], boothAssignments: {}, hallWidth: 40, hallHeight: 30 };
  }
}

export default function Tradeshow() {
  const [booths, setBooths] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [boothAssignments, setBoothAssignments] = useState({});
  const [hallWidth, setHallWidth] = useState(40);
  const [hallHeight, setHallHeight] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 960, height: 620 });

  useEffect(() => {
    const { booths: loadedBooths, vendors: loadedVendors, boothAssignments: loadedAssignments, hallWidth: width, hallHeight: height } = loadTradeshowData();
    setBooths(loadedBooths);
    setVendors(loadedVendors);
    setBoothAssignments(loadedAssignments);
    setHallWidth(width);
    setHallHeight(height);
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize({ width: Math.max(360, width), height: Math.max(380, height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const vendorAssignments = useMemo(() => {
    const map = new Map();
    Object.entries(boothAssignments || {}).forEach(([boothId, vendorId]) => {
      if (vendorId) {
        map.set(vendorId, boothId);
      }
    });
    return map;
  }, [boothAssignments]);

  const selectedVendor = useMemo(() => vendors.find((vendor) => vendor.id === selectedVendorId) || null, [vendors, selectedVendorId]);

  const selectedBooth = useMemo(() => {
    if (!selectedVendor) return null;
    const boothId = vendorAssignments.get(selectedVendor.id);
    if (!boothId) return null;
    return booths.find((booth) => booth.id === boothId) || null;
  }, [selectedVendor, vendorAssignments, booths]);

  const entrance = useMemo(() => {
    const entranceBooth = booths.find((booth) => booth.type === 'entrance');
    if (entranceBooth) return entranceBooth;
    return booths.find((booth) => booth.type === 'door') || null;
  }, [booths]);

  const suggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return vendors.slice(0, 10);
    return vendors
      .filter((vendor) => (vendor.company || '').toLowerCase().includes(term))
      .slice(0, 12);
  }, [vendors, searchTerm]);

  const pathPoints = useMemo(() => {
    if (!entrance || !selectedBooth) return null;
    const start = boothCenter(entrance);
    const end = boothCenter(selectedBooth);
    return [start.x, start.y, end.x, end.y];
  }, [entrance, selectedBooth]);

  const layoutWidth = mToPx(hallWidth || 40);
  const layoutHeight = mToPx(hallHeight || 30);
  const margin = 48;
  const availableWidth = Math.max(1, stageSize.width - margin);
  const availableHeight = Math.max(1, stageSize.height - margin);
  const scale = Math.min(availableWidth / layoutWidth, availableHeight / layoutHeight);
  const offsetX = Math.max(0, (stageSize.width - layoutWidth * scale) / 2);
  const offsetY = Math.max(0, (stageSize.height - layoutHeight * scale) / 2);

  const handleSelectVendor = (vendorId) => {
    setSelectedVendorId(vendorId);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (suggestions.length > 0) {
      handleSelectVendor(suggestions[0].id);
    }
  };

  const renderBooth = (booth) => {
    const { width, height } = boothSize(booth);
    const isSelected = selectedBooth && selectedBooth.id === booth.id;
    const baseColor = CATEGORY_COLORS[booth.category] || '#e2e8f0';
    const fill = isSelected ? COLORS.boothRoute : baseColor;
    const label = booth.label || '';

    const children = [
      <Rect
        key="shape"
        width={width}
        height={height}
        fill={fill}
        stroke={isSelected ? COLORS.accent : COLORS.border}
        strokeWidth={isSelected ? 3 : 1.5}
        cornerRadius={4}
      />
    ];

    if (booth.type === 'blind_path') {
      const lineCount = 3;
      for (let i = 0; i < lineCount; i += 1) {
        const ratio = (i + 1) / (lineCount + 1);
        children.push(
          <Line
            key={`blind-${i}`}
            points={[width * ratio, 0, width * ratio, height]}
            stroke={COLORS.text}
            strokeWidth={1}
            dash={[6, 6]}
            listening={false}
          />
        );
      }
    }

    if (label) {
      children.push(
        <Text
          key="label"
          text={label}
          width={width}
          height={Math.min(height, 48)}
          y={Math.max(0, height / 2 - 12)}
          align="center"
          verticalAlign="middle"
          fontSize={14}
          fill={COLORS.text}
          listening={false}
        />
      );
    }

    return (
      <Group key={booth.id} x={booth.x || 0} y={booth.y || 0} rotation={booth.rotation || 0}>
        {children}
      </Group>
    );
  };

  return (
    <section className="page" style={{ background: COLORS.background }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header>
          <h1 className="editor-head" style={{ marginBottom: 8 }}>
            Trade Show Navigator
          </h1>
          <p className="editor-subtitle">
            Help visitors search for exhibitors and navigate from the entrance directly to their booth.
          </p>
        </header>

        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'stretch',
            minHeight: 540,
            flexWrap: 'wrap'
          }}
        >
          <aside
            style={{
              flex: '0 0 320px',
              maxWidth: '100%',
              background: 'white',
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="tradeshow-search" style={{ fontWeight: 600, color: COLORS.text }}>
                Search Exhibitor
              </label>
              <input
                id="tradeshow-search"
                type="search"
                placeholder="Enter company name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14
                }}
              />
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Matches ({suggestions.length})</div>
              {suggestions.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.textLight }}>No exhibitors found. Confirm data in the planner.</div>
              )}
              {suggestions.map((vendor) => {
                const boothId = vendorAssignments.get(vendor.id);
                const booth = booths.find((item) => item.id === boothId);
                return (
                  <button
                    type="button"
                    key={vendor.id}
                    onClick={() => handleSelectVendor(vendor.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 4,
                      padding: '10px 12px',
                      background: selectedVendorId === vendor.id ? COLORS.boothRoute : 'white',
                      border: `1px solid ${selectedVendorId === vendor.id ? COLORS.accent : COLORS.border}`,
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{vendor.company}</span>
                    <span style={{ fontSize: 12, color: COLORS.textLight }}>{vendor.contact || 'Contact TBD'}</span>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                      {booth ? booth.label || 'Assigned booth' : 'Booth not assigned'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                background: COLORS.backgroundLight,
                borderRadius: 10,
                padding: 16,
                border: `1px solid ${COLORS.border}`
              }}
            >
              <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>Exhibitor Details</div>
              {!selectedVendor && <div style={{ fontSize: 13, color: COLORS.textLight }}>Select an exhibitor to view details.</div>}
              {selectedVendor && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{selectedVendor.company}</div>
                  {selectedVendor.category && (
                    <div style={{ fontSize: 13, color: COLORS.text }}>
                      Category: <strong>{selectedVendor.category}</strong>
                    </div>
                  )}
                  {selectedVendor.booth_size && (
                    <div style={{ fontSize: 13, color: COLORS.text }}>
                      Booth Size: <strong>{selectedVendor.booth_size}</strong>
                    </div>
                  )}
                  {selectedVendor.contact && (
                    <div style={{ fontSize: 13, color: COLORS.textLight }}>Contact: {selectedVendor.contact}</div>
                  )}
                  <div style={{ fontSize: 13, color: COLORS.text }}>
                    Booth: <strong>{selectedBooth ? selectedBooth.label || selectedBooth.type : 'Not assigned'}</strong>
                  </div>
                  {entrance && (
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      Route starts from: {entrance.label || 'Entrance'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          <div
            ref={containerRef}
            style={{
              flex: '1 1 560px',
              minHeight: 540,
              background: 'white',
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: 16,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
              position: 'relative'
            }}
          >
            {booths.length === 0 ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textLight,
                  fontSize: 14
                }}
              >
                No layout data found. Configure the tradeshow planner to enable kiosk navigation.
              </div>
            ) : (
              <Stage width={stageSize.width} height={stageSize.height} listening={false}>
                <Layer>
                  <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
                    <Rect
                      x={0}
                      y={0}
                      width={layoutWidth}
                      height={layoutHeight}
                      fill="#ffffff"
                      stroke={COLORS.border}
                      strokeWidth={2}
                      cornerRadius={16}
                    />

                    {pathPoints && (
                      <Arrow
                        points={pathPoints}
                        stroke={COLORS.accent}
                        fill={COLORS.accent}
                        strokeWidth={6}
                        pointerLength={16}
                        pointerWidth={16}
                        dash={[12, 12]}
                        listening={false}
                      />
                    )}

                    {entrance && (
                      <Group key="entrance-marker">
                        <Circle
                          x={boothCenter(entrance).x}
                          y={boothCenter(entrance).y}
                          radius={12}
                          fill={COLORS.success}
                          opacity={0.85}
                          listening={false}
                        />
                        <Text
                          text="Entrance"
                          x={boothCenter(entrance).x - 40}
                          y={boothCenter(entrance).y - 34}
                          width={80}
                          align="center"
                          fontSize={12}
                          fill={COLORS.success}
                          listening={false}
                        />
                      </Group>
                    )}

                    {booths.map((booth) => renderBooth(booth))}
                  </Group>
                </Layer>
              </Stage>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

