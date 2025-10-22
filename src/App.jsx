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
import ShareView from "./pages/ShareView.jsx";
import EditorDesign from "./pages/EditorDesign.jsx";

// Planner pages
import ConferencePlanner from "./pages/ConferencePlanner.jsx";
import TradeshowPlanner from "./pages/TradeshowPlanner.jsx";

// Kiosk pages
import KioskConference from "./pages/KioskConference.jsx";
import KioskTradeshow from "./pages/KioskTradeshow.jsx";

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
      {/* Routes with shared layout */}
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/conference-kiosk" element={<KioskConference />} />
        <Route path="/tradeshow-kiosk" element={<KioskTradeshow />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/event"
          element={<RequireAuth><EventVenue /></RequireAuth>}
        />
        <Route
          path="/profile"
          element={<RequireAuth><Profile /></RequireAuth>}
        />
        <Route
          path="/share/:shareId"
          element={<RequireAuth><ShareView /></RequireAuth>}
        />
        <Route
          path="/qrcode"
          element={<RequireAuth><QRCode /></RequireAuth>}
        />
        <Route
          path="/about"
          element={<RequireAuth><About /></RequireAuth>}
        />
        <Route
          path="/conference"
          element={<RequireAuth><ConferencePlanner /></RequireAuth>}
        />
        <Route
          path="/tradeshow"
          element={<RequireAuth><TradeshowPlanner /></RequireAuth>}
        />
        <Route
          path="/editor/:designId"
          element={<RequireAuth><EditorDesign /></RequireAuth>}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
