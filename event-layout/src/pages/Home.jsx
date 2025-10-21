import { NavLink } from "react-router-dom";
import { FiMonitor, FiLock, FiCalendar, FiGrid } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Clover 4</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Interactive Event Layout & Seating Management System
          </p>
        </div>

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Kiosk Mode Card */}
          <NavLink
            to="/kiosk"
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
          >
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-10 text-white">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <FiMonitor className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <FiMonitor className="w-16 h-16 mb-4" />
                <h2 className="text-3xl font-bold mb-2">Kiosk Mode</h2>
                <p className="text-blue-100 text-lg">Self-Service Check-in & Information</p>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Access the public kiosk interface for attendees to check-in, find their seats, 
                and view event information without logging in.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <FiCalendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Conference check-in & seating</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <FiGrid className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Tradeshow booth directory</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-lg group-hover:gap-3 transition-all">
                <span>Enter Kiosk Mode</span>
                <span className="text-2xl">→</span>
              </div>
            </div>
          </NavLink>

          {/* Admin Login Card */}
          <NavLink
            to="/login"
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
          >
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-r from-purple-500 to-purple-600 p-10 text-white">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <FiLock className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <FiLock className="w-16 h-16 mb-4" />
                <h2 className="text-3xl font-bold mb-2">Admin Login</h2>
                <p className="text-purple-100 text-lg">Event Planning & Management</p>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Login to access the full event management system. Create layouts, manage guests, 
                and control all aspects of your events.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 flex items-center justify-center text-purple-600 flex-shrink-0">✓</div>
                  <span>Design venue layouts</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 flex items-center justify-center text-purple-600 flex-shrink-0">✓</div>
                  <span>Manage guests & vendors</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 flex items-center justify-center text-purple-600 flex-shrink-0">✓</div>
                  <span>Track check-ins & attendance</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-purple-600 font-semibold text-lg group-hover:gap-3 transition-all">
                <span>Login to Dashboard</span>
                <span className="text-2xl">→</span>
              </div>
            </div>
          </NavLink>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Don't have an admin account? {' '}
            <NavLink to="/signup" className="text-purple-600 hover:text-purple-700 font-medium underline">
              Sign up here
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
