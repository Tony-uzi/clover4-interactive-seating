// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

// Application pages
import Home from "./pages/Home.jsx";
import EventVenue from "./pages/EventVenue.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import QRCode from "./pages/QRCode.jsx";
import Profile from "./pages/Profile.jsx";

// Planner pages
import ConferencePlanner from "./pages/ConferencePlanner.jsx";
import TradeshowPlanner from "./pages/TradeshowPlanner.jsx";

// Shared view pages (public)
import ConferenceSharedView from "./pages/ConferenceSharedView.jsx";
import TradeshowSharedView from "./pages/TradeshowSharedView.jsx";

// Kiosk pages
import Kiosk from "./pages/Kiosk.jsx";
import KioskConference from "./pages/KioskConference.jsx";
import KioskTradeshow from "./pages/KioskTradeshow.jsx";
import KioskDirectory from "./pages/KioskDirectory.jsx";
import KioskSchedule from "./pages/KioskSchedule.jsx";

// 404 component
function NotFound() {
  return (
    <div className="page container">
      <h1>404</h1>
      <p>Page not found.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public shared view routes (no auth, no layout/header) */}
      <Route path="/conference/share/:shareToken" element={<ConferenceSharedView />} />
      <Route path="/tradeshow/share/:shareToken" element={<TradeshowSharedView />} />

      {/* Kiosk routes (no auth, no layout/header) */}
      <Route path="/kiosk" element={<Kiosk />} />
      {/* <Route path="/kiosk-conference" element={<KioskConference />} /> */}
      {/* <Route path="/kiosk-tradeshow" element={<KioskTradeshow />} /> */}
      <Route path="/kiosk-directory" element={<KioskDirectory />} />
      <Route path="/kiosk-schedule" element={<KioskSchedule />} />

      {/* Protected routes with Layout (requires auth) */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        
        <Route path="/event" element={<EventVenue />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/qrcode" element={<QRCode />} />
        <Route path="/about" element={<About />} />
        <Route path="/conference" element={<ConferencePlanner />} />
        <Route path="/tradeshow" element={<TradeshowPlanner />} />
      </Route>

      {/* Public auth routes with Layout (no auth required) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
