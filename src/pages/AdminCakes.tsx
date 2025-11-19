// src/pages/AdminCakes.tsx
import * as React from "react";
import { api } from "../api";

interface Cake {
  id: number;
  name: string;
  price: number;
}

const AdminCakes: React.FC = () => {
  const [cakes, setCakes] = React.useState<Cake[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  // 새 케이크 추가 폼
  const [newName, setNewName] = React.useState("");
  const [newPrice, setNewPrice] = React.useState<string>("0");
  const [creating, setCreating] = React.useState(false);

  // 편집 상태
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editPrice, setEditPrice] = React.useState<string>("0");
  const [savingEdit, setSavingEdit] = React.useState(false);

  // 목록 불러오기
  const loadCakes = React.useCallback(() => {
    setLoading(true);
    setErr("");

    api
      .get<Cake[]>("/api/cakes")
      .then((res) => {
        setCakes(res.data);
      })
      .catch((error) => {
        console.error("load cakes error:", error);
        setErr("케이크 목록을 불러오지 못했습니다. (권한/서버 상태를 확인하세요)");
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadCakes();
  }, [loadCakes]);

  // 새 케이크 추가
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErr("케이크 이름을 입력해주세요.");
      return;
    }

    const priceValue = Number(newPrice);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      setErr("가격은 0 이상 숫자로 입력해주세요.");
      return;
    }

    setCreating(true);
    setErr("");

    try {
      const res = await api.post<Cake>("/api/cakes", {
        name: newName.trim(),
        price: priceValue,
      });

      setCakes((prev) => [res.data, ...prev]);
      setNewName("");
      setNewPrice("0");
    } catch (error: any) {
      console.error("create cake error:", error);
      const status = error.response?.status;
      if (status === 400) {
        setErr("입력값을 다시 확인해주세요. (길이/검증 제약 위반)");
      } else {
        setErr("케이크 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setCreating(false);
    }
  };

  // 편집 시작
  const startEdit = (cake: Cake) => {
    setEditingId(cake.id);
    setEditName(cake.name);
    setEditPrice(String(cake.price));
    setErr("");
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("0");
  };

  // 편집 저장
  const saveEdit = async (id: number) => {
    if (!editName.trim()) {
      setErr("케이크 이름을 입력해주세요.");
      return;
    }

    const priceValue = Number(editPrice);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      setErr("가격은 0 이상 숫자로 입력해주세요.");
      return;
    }

    setSavingEdit(true);
    setErr("");

    try {
      const res = await api.put<Cake>(`/api/cakes/${id}`, {
        name: editName.trim(),
        price: priceValue,
      });

      setCakes((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      );
      cancelEdit();
    } catch (error: any) {
      console.error("update cake error:", error);
      const status = error.response?.status;
      if (status === 400) {
        setErr("입력값을 다시 확인해주세요. (길이/검증 제약 위반)");
      } else if (status === 404) {
        setErr("해당 케이크를 찾을 수 없습니다. (이미 삭제되었을 수 있음)");
      } else {
        setErr("케이크 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm("정말로 이 케이크를 삭제할까요?")) return;

    try {
      await api.delete(`/api/cakes/${id}`);
      setCakes((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
    } catch (error) {
      console.error("delete cake error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1.3fr)", gap: 18 }}>
      {/* 케이크 목록 */}
      <section className="card">
        <div className="card-header">
          <h1 className="card-title">케이크 상품 관리</h1>
          <p className="card-sub">
            매장에서 판매하는 케이크의 기본 정보를 관리합니다.
            <br />
            이름과 기본 가격만 먼저 정리해두고, 상세 옵션은 별도 화면에서 관리할 수 있습니다.
          </p>
        </div>

        {err && (
          <p className="text-error" style={{ marginBottom: 8 }}>
            {err}
          </p>
        )}

        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
          등록된 케이크 수: <strong>{cakes.length}</strong> 개
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>이름</th>
                <th style={{ width: 120 }}>기본 가격(원)</th>
                <th style={{ width: 140, textAlign: "right" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 20, paddingBottom: 16 }}>
                    케이크 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : cakes.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 20, paddingBottom: 16 }}>
                    아직 등록된 케이크가 없습니다. 오른쪽에서 첫 케이크를 추가해보세요.
                  </td>
                </tr>
              ) : (
                cakes.map((cake) => {
                  const isEditing = editingId === cake.id;
                  return (
                    <tr key={cake.id}>
                      <td>{cake.id}</td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          cake.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            type="number"
                            min={0}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        ) : (
                          cake.price.toLocaleString()
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              type="button"
                              onClick={() => saveEdit(cake.id)}
                              disabled={savingEdit}
                            >
                              {savingEdit ? "저장 중..." : "저장"}
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingEdit}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <button
                              className="btn"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              type="button"
                              onClick={() => startEdit(cake)}
                            >
                              편집
                            </button>
                            <button
                              className="btn"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              type="button"
                              onClick={() => handleDelete(cake.id)}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 새 케이크 추가 */}
      <section className="card card-compact">
        <div className="card-header">
          <h2 className="card-section-title">새 케이크 추가</h2>
          <p className="card-section-sub">
            가장 자주 판매하는 케이크부터 차근차근 등록해두면,
            <br />
            옵션/견적 화면에서 바로 사용할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <div className="form-field">
            <label className="form-label">케이크 이름</label>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 초코 생크림, 딸기 생크림"
            />
          </div>

          <div className="form-field">
            <label className="form-label">기본 가격(원)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="예: 35000"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 6 }}
            disabled={creating}
          >
            {creating ? "추가 중..." : "새 케이크 등록"}
          </button>
        </form>

        <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af" }}>
          <p style={{ margin: 0 }}>
            기본 가격은 “옵션이 전혀 없는 상태”의 가격입니다.
            <br />
            사이즈/토핑/문구 같은 추가 금액은 옵션 화면에서 따로 설정합니다.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AdminCakes;
