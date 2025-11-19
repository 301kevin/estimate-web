// src/pages/Admin.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api";

interface AdminUser {
  id: number;
  username: string;
  role: string;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem("adminUsername");

  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("ADMIN");
  const [creating, setCreating] = React.useState(false);

  // 관리자 목록 불러오기
  const loadUsers = React.useCallback(() => {
    setLoading(true);
    api
      .get<AdminUser[]>("/api/admin/users")
      .then((r) => {
        setUsers(r.data);
        setErr("");
      })
      .catch((error) => {
        console.error("load admin users error:", error);
        setErr("관리자 목록을 불러오지 못했습니다. (권한 / 토큰 확인)");
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 로그아웃
  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("adminUsername");
    navigate("/login");
  };

  // 관리자 추가
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErr("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setCreating(true);
    setErr("");

    try {
      await api.post("/api/admin/users", {
        username: username.trim(),
        password: password.trim(),
        role: role.trim() || "ADMIN",
      });

      setUsername("");
      setPassword("");
      setRole("ADMIN");
      loadUsers();
    } catch (error: any) {
      console.error("create admin user error:", error);
      const status = error.response?.status;

      if (status === 409) {
        setErr("이미 사용 중인 아이디입니다.");
      } else if (status === 400) {
        setErr("입력값을 다시 확인해주세요. (길이/형식 제약)");
      } else {
        setErr("관리자 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setCreating(false);
    }
  };

  // 관리자 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm("정말로 이 관리자를 삭제할까요?")) return;

    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error("delete admin user error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1.3fr)", gap: 18 }}>
      {/* 왼쪽: 관리자 목록 */}
      <section className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="card-title">관리자 계정 관리</h1>
            <p className="card-sub">
              Estimate API 관리자 로그인에 사용되는 계정 목록입니다.
              <br />
              운영자, 직원 등 역할에 따라 계정을 분리해서 사용할 수 있습니다.
            </p>
          </div>

          <div style={{ textAlign: "right", fontSize: 11 }}>
            {currentUsername && (
              <>
                <div style={{ marginBottom: 4 }}>
                  <span className="badge-admin">{currentUsername} 님</span>
                </div>
              </>
            )}
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }} onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>

        {err && (
          <p className="text-error" style={{ marginBottom: 10 }}>
            {err}
          </p>
        )}

        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
          현재 등록된 관리자 수: <strong>{users.length}</strong> 명
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>아이디</th>
                <th style={{ width: 90 }}>역할</th>
                <th style={{ width: 90, textAlign: "right" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 20, paddingBottom: 16 }}>
                    관리자 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 20, paddingBottom: 16 }}>
                    등록된 관리자가 없습니다. 오른쪽에서 첫 관리자를 생성해보세요.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>
                      <span className="chip">{u.role}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn"
                        style={{ fontSize: 11, padding: "4px 9px" }}
                        onClick={() => handleDelete(u.id)}
                        disabled={users.length === 1}
                        title={users.length === 1 ? "마지막 관리자 계정은 삭제하지 않는 것을 추천합니다." : ""}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 오른쪽: 새 관리자 추가 */}
      <section className="card card-compact">
        <div className="card-header">
          <h2 className="card-section-title">새 관리자 추가</h2>
          <p className="card-section-sub">
            매장에서 함께 일하는 직원이나 운영자를 위해 별도 계정을 만들어둘 수 있습니다.
            <br />
            아이디는 중복될 수 없으며, 비밀번호는 추후 DB에서 변경 가능합니다.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <div className="form-field">
            <label className="form-label">아이디</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="예: admin, ops1"
            />
          </div>

          <div className="form-field">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="로그인에 사용할 비밀번호"
            />
          </div>

          <div className="form-field">
            <label className="form-label">역할 (role)</label>
            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ADMIN">ADMIN (전체 관리)</option>
              <option value="OPS">OPS (운영 / 한정된 접근)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating}
            style={{ marginTop: 6, width: "100%" }}
          >
            {creating ? "생성 중..." : "새 관리자 계정 생성"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Admin;
