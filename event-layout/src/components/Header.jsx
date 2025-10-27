import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import * as AuthAPI from "../server-actions/auth";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");

  // Check auth status on mount and whenever location changes
  useEffect(() => {
    const checkAuth = () => {
      const token = AuthAPI.getAuthToken();
      setAuthed(!!token);
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        setUserName(u?.name || "");
      } catch {}
    };

    checkAuth();

    const onStorage = () => {
      checkAuth();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [location.pathname]);

  const link = ({ isActive }) => (isActive ? "active" : "");

  const guardNavigate = (path) => (event) => {
    if (!authed) {
      event.preventDefault();
      const redirect = encodeURIComponent(path);
      navigate(`/login?redirect=${redirect}`);
    }
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <span className="logo">CLOVER 4 your tableplanner</span>
        <nav className="main-nav">
          <NavLink to="/" end className={link}>
            Home
          </NavLink>
          <NavLink to="/conference" className={link} onClick={guardNavigate("/conference")}>
            Conference
          </NavLink>
          <NavLink to="/tradeshow" className={link} onClick={guardNavigate("/tradeshow")}>
            Trade Show
          </NavLink>
          {!authed ? (
            <>
              <NavLink to="/login" className={link}>
                Admin Login
              </NavLink>
              <NavLink to="/signup" className={link}>
                Sign Up
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/profile" className={link}>
                Profile
              </NavLink>
              <button
                className="link-like"
                onClick={async () => {
                  await AuthAPI.logout();
                  setAuthed(false);
                  navigate("/login");
                }}
                style={{ marginLeft: 8 }}
              >
                Log Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
