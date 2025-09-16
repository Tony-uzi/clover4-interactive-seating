// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import CanvasEditor from "./components/CanvasEditor.jsx";

// 页面
import Home from "./pages/Home.jsx";
import EventVenue from "./pages/EventVenue.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import QRCode from "./pages/QRCode.jsx";
import Conference from "./pages/Conference.jsx";
import Tradeshow from "./pages/Tradeshow.jsx";

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
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event" element={<EventVenue />} />
        <Route path="/conference" element={<Conference />} />
        <Route path="/tradeshow" element={<Tradeshow />} />
        <Route path="/qrcode" element={<QRCode />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/editor" element={<CanvasEditor />} />

        {/* 如果是搜不到,就404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
