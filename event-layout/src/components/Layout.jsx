// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function Layout() {
  return (
    // 灰色外背景
    <div className="page-bg">
      {/* 中间白色圆角大容器（整页：头/身/尾） */}
      <div className="page-shell">
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
