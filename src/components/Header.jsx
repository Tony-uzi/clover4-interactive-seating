import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import * as AuthAPI from "../server-actions/auth";

export default function Header() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = AuthAPI.getAuthToken();
    setAuthed(!!token);
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      setUserName(u?.name || "");
    } catch {}

    const onStorage = () => {
      const t = AuthAPI.getAuthToken();
      setAuthed(!!t);
      try {
        const u2 = JSON.parse(localStorage.getItem("user") || "null");
        setUserName(u2?.name || "");
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
          <NavLink to="/conference-kiosk" className={link} onClick={guardNavigate("/conference-kiosk")}>
            Conference Kiosk
          </NavLink>
          <NavLink to="/tradeshow-kiosk" className={link} onClick={guardNavigate("/tradeshow-kiosk")}>
            Trade Show Kiosk
          </NavLink>
          {!authed ? (
            <>
              <NavLink to="/login" className={link}>
                Log In
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
