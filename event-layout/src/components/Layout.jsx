// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function Layout() {
  return (
    // 新增 page-shell：flex 列布局，撑满视口高度
    <div className="page-shell">
      <Header />
      {/* main 占据剩余高度 */}
      <main className="page container" style={{ marginTop: 22 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
