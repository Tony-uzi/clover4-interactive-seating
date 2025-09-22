// src/pages/Home.jsx
import { NavLink } from "react-router-dom";

export default function Home() {
  return (
    <>
      {/* Hero 区 */}
      <section className="hero">
        {/* 背景图在 CSS 里设置；图片放 /public/images/conference-bg.jpg */}
        <div className="hero__inner">
          <h1>Visualize Your Event Layouts</h1>
          <p>
            Clover 4 helps you create dynamic seating plans, organize
            participants, and keep everything updated effortlessly.
          </p>
          <div className="hero-buttons">
            <NavLink to="/conference" className="btn hero-btn conference">
              Conference Planner
            </NavLink>
            <NavLink to="/tradeshow" className="btn hero-btn tradeshow">
              Trade Show Planner
            </NavLink>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="container features">
        <div className="feature-item">
          <i className="fas fa-th-large" />
          <div>
            <h3>Venue Layout Design</h3>
            <p>
              Design and customize event spaces with interactive tools to
              arrange tables, stages, and booths.
            </p>
          </div>
        </div>
        <div className="feature-item">
          <i className="fas fa-users" />
          <div>
            <h3>Guest Management</h3>
            <p>
              Easily add, import, and organize guest information with smart seat
              assignments.
            </p>
          </div>
        </div>
        <div className="feature-item">
          <i className="fas fa-tags" />
          <div>
            <h3>Grouping & Tagging</h3>
            <p>
              Label and categorize guests or exhibitors (e.g., VIP, Media,
              Sponsors) for quick filtering and search.
            </p>
          </div>
        </div>
        <div className="feature-item">
          <i className="fas fa-sync-alt" />
          <div>
            <h3>Live Updates</h3>
            <p>
              Track seating changes, check-ins, and event updates in real time
              to keep everything on schedule.
            </p>
          </div>
        </div>
        <div className="feature-item">
          <i className="fas fa-qrcode" />
          <div>
            <h3>QR Code Check-In</h3>
            <p>
              Generate and scan QR codes so guests can instantly find their
              seats or event details.
            </p>
          </div>
        </div>
        <div className="feature-item">
          <i className="fas fa-user-cog" />
          <div>
            <h3>User Accounts & Roles</h3>
            <p>
              Manage admin and guest logins with secure access controls and
              role-based tools.
            </p>
          </div>
        </div>
      </section>

      {/* 两个事件类型卡片 */}
      <section className="event-type">
        <div className="event-card">
          {/* 放到 /public/images/conference.jpg */}
          <img src="/images/conference.jpg" alt="conference layout" />
          <h3>Create the perfect conference layout</h3>
          <p>
            Design your dream conference layout with our easy-to-use planner.
          </p>
          <NavLink to="/conference" className="btn btn-primary">
            Start Planning
          </NavLink>
        </div>

        <div className="event-card">
          {/* 放到 /public/images/tradeshow.jpg */}
          <img src="/images/tradeshow.jpg" alt="Tradeshow layout" />
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
    </>
  );
}
