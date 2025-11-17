import * as React from "react";
import { api } from "../api";

const Admin: React.FC = () => {
  const [rows, setRows] = React.useState<any[] | null>(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    api
      .get("/api/admin/users")
      .then((r) => setRows(r.data))
      .catch((error) => {
        console.error(error);
        if (error.response?.status === 401) {
          setErr("로그인이 필요합니다.");
        } else if (error.response?.status === 403) {
          setErr("관리자 권한이 없습니다.");
        } else {
          setErr("목록을 불러오지 못했습니다.");
        }
      });
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", fontFamily: "system-ui" }}>
      <h2>관리자 사용자 목록</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <pre>{rows ? JSON.stringify(rows, null, 2) : "불러오는 중..."}</pre>
    </div>
  );
};

export default Admin;
