import { useMemo, useState } from "react";
import { FiDownload, FiExternalLink } from "react-icons/fi";

/**
 * QR Code Generator for Event Check-in
 * Generates QR codes that link to Kiosk mode for guest check-in
 */
export default function QRCodePage() {
  const [eventType, setEventType] = useState("conference");
  const [customUrl, setCustomUrl] = useState("");

  // Generate the appropriate URL based on selection
  const targetUrl = useMemo(() => {
    if (customUrl) return customUrl;

    const baseUrl = window.location.origin;
    return eventType === "conference"
      ? `${baseUrl}/conference-kiosk`
      : `${baseUrl}/tradeshow-kiosk`;
  }, [eventType, customUrl]);

  // Generate QR code image URL
  const qrSrc = useMemo(() => {
    const encoded = encodeURIComponent(targetUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}&margin=20`;
  }, [targetUrl]);

  // Download QR code
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `qrcode-${eventType}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Event QR Code Generator
          </h1>
          <p className="text-gray-600">
            Generate QR codes for event check-in and guest navigation.
            Display these codes at the entrance or print them for easy access.
          </p>
        </div>

        {/* Event Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setEventType("conference")}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                eventType === "conference"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📊 Conference
            </button>
            <button
              onClick={() => setEventType("tradeshow")}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                eventType === "tradeshow"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏢 Tradeshow
            </button>
          </div>
        </div>

        {/* Custom URL (Optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom URL (Optional)
          </label>
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Leave empty to use default kiosk URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Override the default URL with a custom link (e.g., share link with token)
          </p>
        </div>

        {/* Generated URL Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target URL
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-gray-800 break-all">
              {targetUrl}
            </code>
            <button
              onClick={() => window.open(targetUrl, "_blank")}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Open in new tab"
            >
              <FiExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
            <img
              src={qrSrc}
              alt="QR code"
              className="w-80 h-80"
            />
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Scan this QR code to access the {eventType === "conference" ? "conference" : "tradeshow"} kiosk
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiDownload className="w-5 h-5" />
            Download QR Code
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(targetUrl)}
            className="flex-1 py-3 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Copy URL
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Usage Instructions:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Conference Mode:</strong> Guests can search their name and find their assigned seats</li>
            <li>• <strong>Tradeshow Mode:</strong> Visitors can search for vendors and locate booth positions</li>
            <li>• <strong>Check-in:</strong> Staff can use the kiosk to mark guests as checked in</li>
            <li>• <strong>Display:</strong> Show QR code on entrance screens or print for physical display</li>
            <li>• <strong>Auto-refresh:</strong> Kiosk mode automatically refreshes data every 60 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
