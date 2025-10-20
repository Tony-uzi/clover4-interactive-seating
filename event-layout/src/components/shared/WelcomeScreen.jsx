import { useEffect, useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';

/**
 * Welcome Screen Component
 * Displays after successful check-in with auto-return countdown
 */
export default function WelcomeScreen({ guest, onClose, autoReturnSeconds = 3 }) {
  const [countdown, setCountdown] = useState(autoReturnSeconds);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 animate-gradient">
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.5s ease-out;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Content Card */}
      <div className="relative animate-fade-in-scale">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />

        {/* Main Card */}
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-16 text-center max-w-2xl">
          {/* Success Icon */}
          <div className="mb-8 flex justify-center animate-float">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50" />
              <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-8">
                <FiCheckCircle className="w-24 h-24 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Check-in Successful!
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Welcome to the Event
          </p>

          {/* Guest Info */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
            <p className="text-gray-600 mb-2">Welcome</p>
            <p className="text-4xl font-bold text-gray-800 mb-4">
              {guest.name}
            </p>
            
            {guest.tableNumber && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="bg-white px-6 py-3 rounded-full shadow-md">
                  <span className="text-gray-600">Your Seat:</span>
                  <span className="text-2xl font-bold text-blue-600 ml-2">
                    {guest.tableNumber}
                  </span>
                  {guest.seatNumber && (
                    <span className="text-xl text-gray-600 ml-2">
                      - {guest.seatNumber}
                    </span>
                  )}
                </div>
              </div>
            )}

            {guest.group && (
              <div className="mt-4">
                <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {guest.group}
                </span>
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-4 text-gray-500">
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-blue-500"
                  strokeDasharray={`${(countdown / autoReturnSeconds) * 175.93} 175.93`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">{countdown}</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-lg font-medium">Auto return in</p>
              <p className="text-sm">{countdown} seconds</p>
            </div>
          </div>

          {/* Manual Return Button */}
          <button
            onClick={onClose}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full font-semibold hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-105 active:scale-95"
          >
            Return Now
          </button>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" />
        <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
}
