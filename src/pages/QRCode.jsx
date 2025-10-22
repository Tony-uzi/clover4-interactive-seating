import { useMemo, useState } from "react";

/**
 * Notes:
 * 1) This demo skips third-party libraries and uses an <img> pointing to an online QR code API.
 *    For production, generate codes locally (e.g., qrcode or qrcode.react) to avoid external dependencies.
 * 2) Feel free to replace the rendered image with entry links, table information, or other event details.
 */
export default function QRCodePage() {
  const [text, setText] = useState("https://clover4.example.com/event/123");

  // Demo-only: build a simple QR code image URL
  const qrSrc = useMemo(() => {
    const encoded = encodeURIComponent(text);
    // Swap this for your own backend endpoint such as /qrcode?text=...
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
  }, [text]);

  return (
    <section className="page qr">
      <h1>Event QR Code</h1>
      <p>Enter the link or text to encode (e.g. event check-in page, table lookup page, etc.):</p>

      <div
        className="form-inline"
        style={{ display: "flex", gap: 8, marginTop: 8 }}
      >
        <input
          style={{ flex: 1 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste URL or text here…"
        />
        <button
          type="button"
          className="btn"
          onClick={() => window.open(text, "_blank")}
        >
          Open Link
        </button>
      </div>

      <div className="qr-preview" style={{ marginTop: 16 }}>
        <img src={qrSrc} alt="QR code" width={220} height={220} />
      </div>
    </section>
  );
}
