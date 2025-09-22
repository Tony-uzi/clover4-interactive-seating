// src/components/Layout.jsx
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function Layout({ children }) {
  return (
    // 新增 page-shell：flex 列布局，撑满视口高度
    <div className="page-shell">
      <Header />
      {/* main 占据剩余高度 */}
      <main className="page container" style={{ marginTop: 22 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
