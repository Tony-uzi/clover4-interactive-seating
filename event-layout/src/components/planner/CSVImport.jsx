import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import COLORS from './colors';

export default function CSVImport({
  visible,
  csvText,
  onCsvTextChange,
  onProcess,
  itemCount,
  itemLabel = 'items',
  placeholder = 'Paste CSV here...',
  formatHint = 'CSV format: name,email,category'
}) {
  const fileInputRef = useRef(null);
  const [pasteVisible, setPasteVisible] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onProcess(results.data);
      }
    });
  };

  const handleProcessCsv = (rawCsv) => {
    const trimmed = rawCsv.trim();
    if (!trimmed) return;

    Papa.parse(trimmed, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onProcess(results.data);
        onCsvTextChange('');
        setPasteVisible(false);
      }
    });
  };

  if (!visible) return null;

  return (
    <div
      style={{
        padding: 16,
        background: '#f0f9ff',
        borderBottom: `1px solid ${COLORS.secondary}`
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.text
        }}
      >
        Import {itemLabel} ({itemCount} imported)
      </h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Upload CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => setPasteVisible((prev) => !prev)}
          style={{
            padding: '8px 16px',
            background: 'white',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            color: COLORS.text
          }}
        >
          {pasteVisible ? 'Hide' : 'Paste'} CSV
        </button>
      </div>

      {pasteVisible && (
        <div>
          <textarea
            value={csvText}
            onChange={(e) => onCsvTextChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight: 100,
              padding: 8,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              fontSize: 13,
              fontFamily: 'monospace',
              marginBottom: 8
            }}
          />
          <button
            onClick={() => handleProcessCsv(csvText)}
            disabled={!csvText.trim()}
            style={{
              padding: '6px 12px',
              background: COLORS.success,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: csvText.trim() ? 'pointer' : 'not-allowed',
              opacity: csvText.trim() ? 1 : 0.5,
              fontSize: 13
            }}
          >
            Process List
          </button>
        </div>
      )}

      {formatHint && (
        <div
          style={{
            fontSize: 12,
            color: COLORS.textLight,
            marginTop: 8
          }}
        >
          {formatHint}
        </div>
      )}
    </div>
  );
}
