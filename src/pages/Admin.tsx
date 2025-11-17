// src/pages/Admin.tsx
import * as React from "react";
import { api, setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";

const Admin: React.FC = () => {
  const [rows, setRows] = React.useState<any[] | null>(null);
  const [err, setErr] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    api
      .get("/api/admin/users")
      .then((r) => setRows(r.data))
      .catch((error) => {
        console.error("admin users error:", error);

        const status = error.response?.status;
        if (status === 401) {
          setErr("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
          setAuthToken(null);
          navigate("/login");
        } else if (status === 403) {
          setErr("관리자 권한이 없습니다.");
        } else {
          setErr("목록을 불러오지 못했습니다.");
        }
      });
  }, [navigate]);

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", fontFamily: "system-ui" }}>
      <h2>관리자 사용자 목록</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <pre>{rows ? JSON.stringify(rows, null, 2) : "불러오는 중..."}</pre>
    </div>
  );
};

export default Admin;
