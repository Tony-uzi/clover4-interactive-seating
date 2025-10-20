import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiCheckCircle, FiClock, FiGrid } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function KioskHome() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const buttons = [
    {
      id: 'find-seat',
      title: 'Find My Seat',
      subtitle: 'Locate Your Seating',
      icon: FiSearch,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      path: '/conference-kiosk',
    },
    {
      id: 'seating-chart',
      title: 'Seating Chart',
      subtitle: 'View Full Layout',
      icon: FiGrid,
      color: 'from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
      path: '/conference-display',
    },
    {
      id: 'find-vendor',
      title: 'Find Exhibitors',
      subtitle: 'Browse Vendors',
      icon: FiMapPin,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      path: '/tradeshow-kiosk',
    },
    {
      id: 'checkin',
      title: 'Check In',
      subtitle: 'Guest Registration',
      icon: FiCheckCircle,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      path: '/conference-kiosk?action=checkin',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Event Information System
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Clover Events Management Platform
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600">
                <FiClock className="w-6 h-6" />
                <div className="text-3xl font-bold text-gray-800">
                  {currentTime.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </div>
              </div>
              <div className="text-gray-500 mt-1">
                {currentTime.toLocaleDateString('zh-CN', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-6xl w-full">
          {/* Instruction Text */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Please Select a Service
            </h2>
            <p className="text-xl text-gray-600">
              Choose an option to continue
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {buttons.map((button) => {
              const Icon = button.icon;
              return (
                <button
                  key={button.id}
                  onClick={() => navigate(button.path)}
                  className={`
                    group relative overflow-hidden
                    bg-gradient-to-br ${button.color} ${button.hoverColor}
                    rounded-3xl shadow-2xl
                    transform transition-all duration-300
                    hover:scale-105 hover:shadow-3xl
                    active:scale-95
                    p-12
                  `}
                  style={{ minHeight: '320px' }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                      backgroundSize: '30px 30px'
                    }} />
                  </div>

                  {/* Content */}
                  <div className="relative flex flex-col items-center justify-center h-full text-white">
                    {/* Icon */}
                    <div className="mb-6 transform transition-transform group-hover:scale-110">
                      <Icon className="w-24 h-24" strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <h3 className="text-3xl font-bold mb-3 text-center">
                      {button.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-lg opacity-90 text-center">
                      {button.subtitle}
                    </p>

                    {/* Hover Arrow */}
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg 
                        className="w-8 h-8 animate-bounce" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Instructions */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-md rounded-full px-8 py-4 shadow-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <p className="text-gray-700 text-lg">
                Touch screen to select your service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-6">
              <span>📍 Clover Events Information System</span>
              <span>•</span>
              <span>Smart Event Management Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
