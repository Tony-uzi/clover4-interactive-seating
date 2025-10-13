// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

// 页面
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

// 404 组件
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
      {/* Protected routes with Layout (requires auth) */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Home />} />
        <Route path="/event" element={<EventVenue />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/share/:shareId" element={<ShareView />} />
        <Route path="/qrcode" element={<QRCode />} />
        <Route path="/about" element={<About />} />
        <Route path="/conference" element={<ConferencePlanner />} />
        <Route path="/tradeshow" element={<TradeshowPlanner />} />
        <Route path="/conference-kiosk" element={<KioskConference />} />
        <Route path="/tradeshow-kiosk" element={<KioskTradeshow />} />
        <Route path="/editor/:designId" element={<EditorDesign />} />
      </Route>

      {/* Public auth routes with Layout (no auth required) */}
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
