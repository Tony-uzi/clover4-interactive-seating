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
          <NavLink to="/tradeshow" className={link}>
            Trade Show
          </NavLink>
          <NavLink to="/conference-kiosk" className={link}>
            Conference Kiosk
          </NavLink>
          <NavLink to="/tradeshow-kiosk" className={link}>
            Trade Show Kiosk
          </NavLink>
          <NavLink to="/signup" className={link}>
            Sign Up
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
