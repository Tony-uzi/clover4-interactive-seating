import { NavLink } from "react-router-dom";
import {
  FiLayout, FiUsers, FiTag, FiRefreshCw,
  FiCamera, FiUserCheck, FiCalendar, FiGrid,
  FiArrowRight, FiCheckCircle, FiZap, FiTrendingUp,
  FiBook, FiClock
} from 'react-icons/fi';

export default function Home() {
  const features = [
    {
      icon: <FiLayout className="w-8 h-8" />,
      title: "Venue Layout Design",
      description: "Design and customize event spaces with interactive drag-and-drop tools to arrange tables, stages, and booths.",
      color: "blue"
    },
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Guest Management",
      description: "Easily add, import, and organize guest information with smart seat assignments and batch operations.",
      color: "green"
    },
    {
      icon: <FiTag className="w-8 h-8" />,
      title: "Grouping & Tagging",
      description: "Label and categorize guests or exhibitors (VIP, Media, Sponsors) for quick filtering and search.",
      color: "purple"
    },
    {
      icon: <FiRefreshCw className="w-8 h-8" />,
      title: "Live Updates",
      description: "Track seating changes, check-ins, and event updates in real time to keep everything on schedule.",
      color: "orange"
    },
    {
      icon: <FiCamera className="w-8 h-8" />,
      title: "QR Code Check-In",
      description: "Generate and scan QR codes for instant guest check-in and seat finding at your event.",
      color: "red"
    },
    {
      icon: <FiUserCheck className="w-8 h-8" />,
      title: "Kiosk Mode",
      description: "Self-service kiosks with QR scanning for attendees to check-in and find their seats independently.",
      color: "indigo"
    }
  ];

  const eventTypes = [
    {
      icon: <FiCalendar className="w-16 h-16" />,
      title: "Conference Planner",
      subtitle: "Create the perfect conference layout",
      description: "Design your dream conference layout with our easy-to-use planner. Manage seating, groups, and check-ins effortlessly.",
      features: ["Table Arrangements", "Guest Seating", "Dietary Preferences", "Real-time Check-in"],
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600",
      link: "/conference"
    },
    {
      icon: <FiGrid className="w-16 h-16" />,
      title: "Tradeshow Planner",
      subtitle: "Optimize your trade show space",
      description: "Arrange booths, manage traffic flow, and enhance exhibitor visibility to create an engaging event experience.",
      features: ["Booth Management", "Vendor Tracking", "Route Planning", "Space Optimization"],
      color: "green",
      bgGradient: "from-green-500 to-green-600",
      link: "/tradeshow"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-70"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <FiZap className="w-4 h-4" />
              <span>Powerful Event Planning Platform</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Visualize Your
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Event Layouts
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Clover 4 helps you create dynamic seating plans, organize participants, 
              and keep everything updated effortlessly with our intuitive drag-and-drop interface.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <NavLink 
                to="/conference" 
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FiCalendar className="w-5 h-5" />
                Conference Planner
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </NavLink>
              
              <NavLink 
                to="/tradeshow" 
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FiGrid className="w-5 h-5" />
                Trade Show Planner
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </NavLink>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">500+</div>
                <div className="text-sm text-gray-600">Events Planned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">10K+</div>
                <div className="text-sm text-gray-600">Guests Managed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">99%</div>
                <div className="text-sm text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Every Event
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to plan, manage, and execute successful events
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 bg-${feature.color}-100 text-${feature.color}-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Event Type
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the planner that best fits your needs
            </p>
          </div>

          {/* Event type cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {eventTypes.map((event, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                {/* Gradient header */}
                <div className={`relative bg-gradient-to-r ${event.bgGradient} p-8 text-white`}>
                  <div className="absolute top-0 right-0 opacity-10">
                    <div className="text-white transform scale-150">
                      {event.icon}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="mb-4">
                      {event.icon}
                    </div>
                    <h3 className="text-3xl font-bold mb-2">{event.title}</h3>
                    <p className="text-white/90 text-lg">{event.subtitle}</p>
                  </div>
                </div>

                {/* Card content */}
                <div className="p-8">
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Features list */}
                  <div className="space-y-3 mb-8">
                    {event.features.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <FiCheckCircle className={`w-5 h-5 text-${event.color}-600 flex-shrink-0`} />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA button */}
                  <NavLink 
                    to={event.link}
                    className={`group/btn w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r ${event.bgGradient} hover:shadow-lg text-white rounded-xl font-semibold text-lg transition-all duration-300`}
                  >
                    Start Planning
                    <FiArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </NavLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kiosk Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Kiosk Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Self-service kiosks for seamless event experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NavLink
              to="/kiosk-conference"
              className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="inline-flex p-4 bg-blue-100 text-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <FiCalendar className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Conference Seating</h3>
                <p className="text-sm text-gray-600">Find your seat and check-in</p>
              </div>
            </NavLink>

            <NavLink
              to="/kiosk-tradeshow"
              className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="inline-flex p-4 bg-green-100 text-green-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <FiGrid className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Tradeshow Map</h3>
                <p className="text-sm text-gray-600">Navigate booth locations</p>
              </div>
            </NavLink>

            <NavLink
              to="/kiosk-directory"
              className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="inline-flex p-4 bg-purple-100 text-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <FiBook className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Directory</h3>
                <p className="text-sm text-gray-600">Search attendees & vendors</p>
              </div>
            </NavLink>

            <NavLink
              to="/kiosk-schedule"
              className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="inline-flex p-4 bg-orange-100 text-orange-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <FiClock className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Event Schedule</h3>
                <p className="text-sm text-gray-600">View sessions & agenda</p>
              </div>
            </NavLink>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NavLink
              to="/qrcode"
              className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <FiCamera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">QR Codes</h3>
                  <p className="text-sm text-gray-600">Generate check-in codes</p>
                </div>
              </div>
            </NavLink>

            <NavLink
              to="/kiosk-conference"
              className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                  <FiUserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Kiosk Mode</h3>
                  <p className="text-sm text-gray-600">Self-service check-in</p>
                </div>
              </div>
            </NavLink>

            <NavLink
              to="/about"
              className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                  <FiTrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Learn More</h3>
                  <p className="text-sm text-gray-600">About Clover 4</p>
                </div>
              </div>
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
}
