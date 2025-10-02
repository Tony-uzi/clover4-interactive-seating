import { NavLink, Link } from "react-router-dom";

export default function Header() {
  const link = ({ isActive }) => (isActive ? "active" : "");
  return (
    <header className="site-header">
      <div className="container header-inner">
        <span className="logo">CLOVER 4 your tableplanner</span>
        <nav className="main-nav">
          <NavLink to="/" end className={link}>
            Home
          </NavLink>
          <NavLink to="/conference" className={link}>
            Conference
          </NavLink>
          <NavLink to="/conference-planner" className={link}>
            Conference Planner
          </NavLink>
          <NavLink to="/tradeshow" className={link}>
            Trade Show
          </NavLink>
          <NavLink to="/tradeshow-planner" className={link}>
            Trade Show Planner
          </NavLink>
          {/* <NavLink to="/event" className={link}>
            Event Venue
          </NavLink>
          <NavLink to="/qrcode" className={link}>
            QRCode
          </NavLink>
          <NavLink to="/profile" className={link}>
            Profile
          </NavLink>
          <NavLink to="/about" className={link}>
            About
          </NavLink>
          <NavLink to="/login" className={link}>
            Login
          </NavLink>
          <NavLink to="/signup" className={link}>
            Sign Up
          </NavLink> */}
        </nav>
      </div>
    </header>
  );
}
