// src/App.tsx
import * as React from "react";
import { Routes, Route, NavLink } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminCakes from "./pages/AdminCakes";
import AdminCakeOptions from "./pages/AdminCakeOptions";
import AdminEstimates from "./pages/AdminEstimates";
import ProtectedRoute from "./components/ProtectedRoute";
import { setAuthToken } from "./api";

const App: React.FC = () => {
  React.useEffect(() => {
    const saved = localStorage.getItem("accessToken");
    if (saved) {
      setAuthToken(saved);
    }
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `app-nav-link${isActive ? " active" : ""}`;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-mark" />
          <div>
            <div>Estimate API</div>
            <div className="app-logo-sub">케이크 견적 · 관리자 콘솔</div>
          </div>
        </div>

        <nav className="app-nav">
          <NavLink to="/" className={navLinkClass} end>
            홈
          </NavLink>
          <NavLink to="/login" className={navLinkClass}>
            로그인
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            계정
          </NavLink>
          <NavLink to="/admin/cakes" className={navLinkClass}>
            케이크
          </NavLink>
          <NavLink to="/admin/cake-options" className={navLinkClass}>
            옵션
          </NavLink>
          <NavLink to="/admin/estimates" className={navLinkClass}>
            견적
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cakes"
            element={
              <ProtectedRoute>
                <AdminCakes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cake-options"
            element={
              <ProtectedRoute>
                <AdminCakeOptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/estimates"
            element={
              <ProtectedRoute>
                <AdminEstimates />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
