import { NavLink } from "react-router-dom";

export default function Home() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="section hero">
        <div>
          <h1>Visualize Your Event Layouts</h1>
          <p>
            Create dynamic seating plans, organize participants, and keep
            everything updated effortlessly with our powerful event planning tools.
          </p>
          <div className="hero-buttons">
            <NavLink to="/conference" className="btn btn-primary">
              Conference Planner
            </NavLink>
            <NavLink to="/tradeshow" className="btn btn-secondary">
              Trade Show Planner
            </NavLink>
          </div>
        </div>

        <div>
          <div className="hero-img">
            <div style={{ textAlign: 'center' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="white" opacity="0.9">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
              <p style={{ marginTop: '16px', fontSize: '16px' }}>
                Event Layout Preview
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="features">
          <div className="feature">
            <div className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>
              </svg>
            </div>
            <h3>Venue Layout Design</h3>
            <p>
              Design and customize event spaces with interactive tools to
              arrange tables, stages, and booths.
            </p>
          </div>

          <div className="feature">
            <div className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <h3>Guest Management</h3>
            <p>
              Easily add, import, and organize guest information with smart
              seat assignments.
            </p>
          </div>

          <div className="feature">
            <div className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
              </svg>
            </div>
            <h3>Grouping & Tagging</h3>
            <p>
              Label and categorize guests or exhibitors (e.g., VIP, Media,
              Sponsors) for quick filtering and search.
            </p>
          </div>

          <div className="feature">
            <div className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
            </div>
            <h3>Live Updates</h3>
            <p>
              Track seating changes, check-ins, and event updates in real time
              to keep everything on schedule.
            </p>
          </div>

          <div className="feature">
            <div className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM18 13h-2v3h-3v2h3v3h2v-3h3v-2h-3z"/>
              </svg>
            </div>
            <h3>QR Code Check-In</h3>
            <p>
              Generate and scan QR codes so guests can instantly find their
              seats or event details.
            </p>
          </div>

          <div className="feature">
            <div className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h3>User Accounts & Roles</h3>
            <p>
              Manage admin and guest logins with secure access controls and
              role-based tools.
            </p>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="section event-type">
        <div className="event-card">
          <div style={{
            width: '100%',
            height: '200px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="white" opacity="0.8">
              <path d="M20 7h-4V5l-2-2h-4L8 5v2H4c-1.1 0-2 .9-2 2v5c0 .75.4 1.38 1 1.73V19c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2v-3.28c.59-.35 1-.99 1-1.72V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5zM4 9h16v5h-5v-2H9v2H4V9z"/>
            </svg>
          </div>
          <h3>Create the perfect conference layout</h3>
          <p>
            Design your dream conference layout with our easy-to-use planner.
          </p>
          <NavLink to="/conference" className="btn btn-primary">
            Start Planning
          </NavLink>
        </div>

        <div className="event-card">
          <div style={{
            width: '100%',
            height: '200px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="white" opacity="0.8">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm9 16H6V4h1v9l3-2.25L13 13V4h5v16z"/>
            </svg>
          </div>
          <h3>Optimize your trade show space</h3>
          <p>
            Arrange booths, manage traffic flow, and enhance exhibitor
            visibility to create an engaging event.
          </p>
          <NavLink to="/tradeshow" className="btn btn-primary">
            Start Planning
          </NavLink>
        </div>
      </section>
    </div>
  );
}
