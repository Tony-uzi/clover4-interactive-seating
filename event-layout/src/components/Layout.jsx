// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function Layout() {
  return (
    // Added page-shell: flex column layout covering full viewport height
    <div className="page-shell">
      <Header />
      {/* main takes up the remaining height */}
      <main className="page container" style={{ marginTop: 22 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
