import React, { useState } from "react";
import { api, setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", {
        username,
        password,
      });

      const token = res.data?.accessToken;
      if (!token) {
        throw new Error("토큰 없음");
      }

      // ✅ 토큰 저장
      setAuthToken(token);
      // ✅ 현재 로그인한 관리자 이름도 저장 (헤더에 표시용)
      localStorage.setItem("adminUsername", username);

      navigate("/admin");
    } catch (err: any) {
      console.error("login error:", err);
      if (err.response?.status === 401) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui" }}>
      <h2>관리자 로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            아이디
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              autoComplete="username"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 8,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
};

export default Login;
