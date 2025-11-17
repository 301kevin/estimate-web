// src/pages/AdminCakes.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api";

interface Cake {
  id: number;
  name: string;
  price: number;
}

const AdminCakes: React.FC = () => {
  const [cakes, setCakes] = React.useState<Cake[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  // 추가 폼 상태
  const [newName, setNewName] = React.useState("");
  const [newPrice, setNewPrice] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createErr, setCreateErr] = React.useState("");

  // 삭제 진행 중인 ID
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const navigate = useNavigate();
  const currentUsername = localStorage.getItem("adminUsername");

  // 공통: 인증 에러 처리
  const handleAuthError = (status?: number) => {
    if (status === 401) {
      setAuthToken(null);
      localStorage.removeItem("adminUsername");
      navigate("/login");
    }
  };

  // 케이크 목록 불러오기
  const loadCakes = React.useCallback(() => {
    setLoading(true);
    api
      .get<Cake[]>("/api/cakes") // ⚠️ 백엔드 엔드포인트 그대로 사용
      .then((r) => {
        setCakes(r.data);
        setErr("");
      })
      .catch((error) => {
        console.error("load cakes error:", error);
        const status = error.response?.status;
        handleAuthError(status);

        if (status === 403) {
          setErr("관리자 권한이 없습니다.");
        } else if (status !== 401) {
          setErr("케이크 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  React.useEffect(() => {
    loadCakes();
  }, [loadCakes]);

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("adminUsername");
    navigate("/login");
  };

  // 케이크 추가
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr("");

    const name = newName.trim();
    const priceNum = parseInt(newPrice, 10);

    if (!name) {
      setCreateErr("케이크 이름을 입력해주세요.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setCreateErr("가격을 0 이상 숫자로 입력해주세요.");
      return;
    }

    setCreateLoading(true);
    try {
      // ⚠️ 백엔드에서 받는 필드 이름 확인 (name, price 맞음)
      await api.post("/api/cakes", {
        name,
        price: priceNum,
      });

      setNewName("");
      setNewPrice("");
      await loadCakes();
    } catch (error: any) {
      console.error("create cake error:", error);
      const status = error.response?.status;
      if (status === 400) {
        setCreateErr("입력값이 형식에 맞지 않습니다.");
      } else {
        setCreateErr("케이크를 추가하지 못했습니다.");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // 케이크 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm(`정말로 케이크 ID ${id}를 삭제할까요?`)) return;

    setDeletingId(id);
    try {
      await api.delete(`/api/cakes/${id}`);
      setCakes((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("delete cake error:", error);
      alert("케이크 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "32px auto", fontFamily: "system-ui" }}>
      {/* 상단 바 */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Estimate API</div>
          <h1 style={{ fontSize: 20, margin: 0 }}>케이크 관리</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {currentUsername && (
            <span style={{ fontSize: 14, color: "#4b5563" }}>
              {currentUsername} 님
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 케이크 추가 섹션 */}
      <section
        style={{
          marginBottom: 32,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>
          케이크 추가
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          견적에서 사용할 기본 케이크 이름과 가격을 등록합니다.
        </p>

        <form
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr auto",
            gap: 8,
          }}
        >
          <input
            placeholder="케이크 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              padding: 8,
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
          <input
            placeholder="가격 (원)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            style={{
              padding: 8,
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
          <button
            type="submit"
            disabled={createLoading}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              borderRadius: 999,
              border: "none",
              background: "#4f46e5",
              color: "white",
              cursor: createLoading ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {createLoading ? "추가 중..." : "추가"}
          </button>
        </form>

        {createErr && (
          <p style={{ marginTop: 8, fontSize: 13, color: "crimson" }}>
            {createErr}
          </p>
        )}
      </section>

      {/* 케이크 목록 섹션 */}
      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>케이크 목록</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          등록된 케이크 리스트입니다. (옵션/견적과 연결 예정)
        </p>

        {err && (
          <p style={{ color: "crimson", fontSize: 13, marginBottom: 12 }}>
            {err}
          </p>
        )}

        {loading ? (
          <p style={{ fontSize: 13, color: "#6b7280" }}>불러오는 중...</p>
        ) : cakes.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            아직 등록된 케이크가 없습니다.
          </p>
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              background: "white",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    ID
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    이름
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    가격
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {cakes.map((c) => (
                  <tr key={c.id}>
                    <td
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#4b5563",
                      }}
                    >
                      {c.id}
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#111827",
                      }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#4b5563",
                      }}
                    >
                      {c.price.toLocaleString()} 원
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        style={{
                          padding: "4px 10px",
                          fontSize: 12,
                          borderRadius: 999,
                          border: "1px solid #fecaca",
                          background:
                            deletingId === c.id ? "#fee2e2" : "white",
                          color: "#b91c1c",
                          cursor:
                            deletingId === c.id ? "default" : "pointer",
                        }}
                      >
                        {deletingId === c.id ? "삭제 중..." : "삭제"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminCakes;
