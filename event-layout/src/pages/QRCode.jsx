import { useMemo, useState } from "react";

/**
 * 说明：
 * 1) 这里不引第三方库，先用 <img> 引用在线二维码 API 的方式演示，
 *    生产环境建议改为本地生成（如 qrcode、qrcode.react），避免外网依赖。
 * 2) 也可以把图片换成活动现场的入口链接、桌号信息等。
 */
export default function QRCodePage() {
  const [text, setText] = useState("https://clover4.example.com/event/123");

  // 这里仅作演示：生成一个简单的二维码图片地址
  const qrSrc = useMemo(() => {
    const encoded = encodeURIComponent(text);
    // 你也可以换成自己后端的 /qrcode?text=... 接口
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
