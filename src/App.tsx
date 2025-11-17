import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminCakes from "./pages/AdminCakes";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <div style={{ fontFamily: "system-ui" }}>
      <header
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: 16,
        }}
      >
        <Link to="/">Estimate API</Link>
        <Link to="/login">관리자 로그인</Link>
        <Link to="/admin">관리자 계정</Link>
        <Link to="/admin/cakes">케이크 관리</Link>
      </header>

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

        {/* 케이크 관리 */}
        <Route
          path="/admin/cakes"
          element={
            <ProtectedRoute>
              <AdminCakes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
