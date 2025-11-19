// src/pages/Login.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErr("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const res = await api.post("/api/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      const token: string = res.data.accessToken;
      setAuthToken(token);
      localStorage.setItem("adminUsername", username.trim());

      navigate("/admin", { replace: true });
    } catch (error: any) {
      console.error("login error:", error);
      const status = error.response?.status;

      if (status === 401) {
        setErr("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setErr("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="card-header">
          <h1 className="card-title">Estimate Admin</h1>
          <p className="card-sub">
            케이크 / 옵션 / 견적 관리를 위한 관리자 전용 로그인입니다.
          </p>
        </div>

        {err && <p className="text-error" style={{ marginBottom: 10 }}>{err}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">아이디</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
            />
          </div>

          <div className="form-field">
            <label className="form-label">비밀번호</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
