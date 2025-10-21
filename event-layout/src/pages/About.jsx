import { FiCheckCircle, FiLayout, FiUsers, FiServer, FiZap } from 'react-icons/fi';

export default function About() {
  const features = [
    {
      icon: <FiLayout className="w-6 h-6" />,
      title: "Drag-and-drop Layout",
      description: "Intuitive drag-and-drop interface for arranging tables, booths, stages, and more"
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: "Group Management",
      description: "Organize guests by groups and zones with support for access control and dietary preferences"
    },
    {
      icon: <FiServer className="w-6 h-6" />,
      title: "API Integration",
      description: "Seamless backend integration with Django REST Framework for data persistence"
    },
    {
      icon: <FiZap className="w-6 h-6" />,
      title: "Advanced Features",
      description: "QR code check-in, kiosk mode, and real-time updates for enhanced event management"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <span className="text-3xl">🍀</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            About Clover 4
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full mb-6"></div>
        </div>

        {/* Main description */}
        <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-12 mb-12">
          <p className="text-xl text-gray-700 leading-relaxed mb-8">
            Clover 4 is an <span className="font-semibold text-blue-600">interactive event planning platform</span> designed 
            to help organizers create stunning venue layouts and manage seating arrangements effortlessly.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Our intuitive tools enable you to quickly design floor plans, organize participants, 
            and provide attendees with real-time information during events. Whether you're planning 
            a conference, trade show, or gala dinner, Clover 4 streamlines the entire process.
          </p>
        </div>

        {/* Features grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology stack */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Built with Modern Technology
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Frontend", value: "React 19 + Vite" },
              { label: "Styling", value: "Tailwind CSS 4" },
              { label: "Canvas", value: "React Konva" },
              { label: "Backend", value: "Django REST Framework" },
              { label: "Database", value: "PostgreSQL" },
              { label: "Icons", value: "React Icons" }
            ].map((tech, index) => (
              <div key={index} className="flex items-center gap-3">
                <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900">{tech.label}:</span>
                  <span className="text-gray-600 ml-2">{tech.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Version 2.0 • Updated October 2024</p>
        </div>
      </div>
    </div>
  );
}