import { NavLink } from "react-router-dom";

export default function Header() {
  const link = ({ isActive }) => (isActive ? "active" : "");
  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" className="logo">
          Clover Events
        </NavLink>
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
          <NavLink to="/kiosk" className={link}>
            Kiosk
          </NavLink>
          <NavLink to="/signup" className={link}>
            Sign Up
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
