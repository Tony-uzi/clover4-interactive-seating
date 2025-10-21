import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import { loadConferenceEvent, loadConferenceGuests } from '../lib/utils/storage';

export default function QRCodePage() {
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [eventType, setEventType] = useState('conference'); // 'conference' or 'tradeshow'

  useEffect(() => {
    // Load conference data by default
    const loadedEvent = loadConferenceEvent();
    const loadedGuests = loadConferenceGuests();
    
    if (loadedEvent) {
      setEvent(loadedEvent);
      setGuests(loadedGuests || []);
    }
  }, []);

  const generateQRData = (guestId) => {
    if (!event) return '';
    
    // Generate QR code data with guest ID and event ID
    // Format: checkin://{eventType}/{eventId}/{guestId}
    return `checkin://${eventType}/${event.id || 'demo'}/${guestId}`;
  };

  const handlePrintAll = () => {
    window.print();
  };

  const handleDownloadQR = (guestId, guestName) => {
    const svg = document.getElementById(`qr-${guestId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.drawImage(img, 0, 0, 300, 300);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${guestName.replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">No event loaded. Please create or load an event first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">QR Code Generator</h1>
        <p className="text-gray-600">
          Generate QR codes for {eventType === 'conference' ? 'guest' : 'vendor'} check-in
        </p>
      </div>

      {/* Event Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{event.name}</h2>
            {event.description && (
              <p className="text-gray-600 mt-1">{event.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Total {eventType === 'conference' ? 'Guests' : 'Vendors'}: {guests.length}
            </p>
          </div>
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <FiPrinter className="w-5 h-5" />
            Print All QR Codes
          </button>
        </div>
      </div>

      {/* QR Codes Grid */}
      {guests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            No {eventType === 'conference' ? 'guests' : 'vendors'} found for this event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 qr-card"
            >
              <div className="text-center">
                {/* Guest Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{guest.name}</h3>
                  {guest.email && (
                    <p className="text-sm text-gray-600 mt-1">{guest.email}</p>
                  )}
                  {guest.tableNumber && (
                    <p className="text-sm text-blue-600 mt-1">
                      Table: {guest.tableNumber}
                    </p>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <QRCodeSVG
                      id={`qr-${guest.id}`}
                      value={generateQRData(guest.id)}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* QR Code Label */}
                <p className="text-xs text-gray-500 mb-3">
                  Scan to check in
                </p>

                {/* Download Button */}
                <button
                  onClick={() => handleDownloadQR(guest.id, guest.name)}
                  className="no-print w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .qr-card {
            page-break-inside: avoid;
            border: 1px solid #ddd;
            margin-bottom: 20px;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
