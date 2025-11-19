// src/pages/AdminCakeOptions.tsx
import * as React from "react";
import { api } from "../api";

interface Cake {
  id: number;
  name: string;
  price: number;
}

interface CakeOption {
  id: number;
  cakeId: number;
  optionName: string;
  price: number;
}

const AdminCakeOptions: React.FC = () => {
  const [cakes, setCakes] = React.useState<Cake[]>([]);
  const [selectedCakeId, setSelectedCakeId] = React.useState<number | null>(null);

  const [options, setOptions] = React.useState<CakeOption[]>([]);
  const [loadingCakes, setLoadingCakes] = React.useState(true);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [err, setErr] = React.useState("");

  // 새 옵션 추가 폼
  const [newName, setNewName] = React.useState("");
  const [newPrice, setNewPrice] = React.useState<string>("0");
  const [creating, setCreating] = React.useState(false);

  // 편집 상태
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editPrice, setEditPrice] = React.useState<string>("0");
  const [savingEdit, setSavingEdit] = React.useState(false);

  // 케이크 목록 불러오기
  const loadCakes = React.useCallback(() => {
    setLoadingCakes(true);
    setErr("");

    api
      .get<Cake[]>("/api/cakes")
      .then((res) => {
        const list = res.data;
        setCakes(list);
        if (list.length > 0) {
          // 선택된 케이크가 없으면 첫 번째 케이크 선택
          setSelectedCakeId((prev) => prev ?? list[0].id);
        } else {
          setSelectedCakeId(null);
        }
      })
      .catch((error) => {
        console.error("load cakes for options error:", error);
        setErr("케이크 목록을 불러오지 못했습니다. (권한/서버 상태를 확인하세요)");
      })
      .finally(() => setLoadingCakes(false));
  }, []);

  // 특정 케이크의 옵션 목록 불러오기
  const loadOptions = React.useCallback((cakeId: number | null) => {
    if (!cakeId) {
      setOptions([]);
      return;
    }

    setLoadingOptions(true);
    setErr("");

    api
      .get<CakeOption[]>(`/api/cakes/${cakeId}/options`)
      .then((res) => {
        setOptions(res.data);
      })
      .catch((error) => {
        console.error("load options error:", error);
        setErr("옵션 목록을 불러오지 못했습니다. (권한/서버 상태를 확인하세요)");
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  // 처음 마운트 시 케이크 목록 로딩
  React.useEffect(() => {
    loadCakes();
  }, [loadCakes]);

  // 선택된 케이크 변경 시 옵션 로딩
  React.useEffect(() => {
    loadOptions(selectedCakeId);
    // 케이크 바뀌면 편집 상태/에러 초기화
    setEditingId(null);
    setEditName("");
    setEditPrice("0");
    setErr("");
  }, [selectedCakeId, loadOptions]);

  const selectedCake = React.useMemo(
    () => cakes.find((c) => c.id === selectedCakeId) ?? null,
    [cakes, selectedCakeId]
  );

  // 새 옵션 추가
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCakeId) {
      setErr("먼저 상단에서 케이크를 선택해주세요.");
      return;
    }
    if (!newName.trim()) {
      setErr("옵션 이름을 입력해주세요.");
      return;
    }

    const priceValue = Number(newPrice);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      setErr("추가 금액은 0 이상 숫자로 입력해주세요.");
      return;
    }

    setCreating(true);
    setErr("");

    try {
      const res = await api.post<CakeOption>(
        `/api/cakes/${selectedCakeId}/options`,
        {
          optionName: newName.trim(),
          price: priceValue,
        }
      );

      setOptions((prev) => [res.data, ...prev]);
      setNewName("");
      setNewPrice("0");
    } catch (error: any) {
      console.error("create option error:", error);
      const status = error.response?.status;
      const code = error.response?.data?.code;

      if (status === 400) {
        setErr("입력값을 다시 확인해주세요. (길이/검증 제약 위반)");
      } else if (status === 409 && code === "DATA_INTEGRITY_VIOLATION") {
        setErr("중복되거나 유효하지 않은 옵션입니다. 이름/금액을 다시 확인해주세요.");
      } else {
        setErr("옵션 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setCreating(false);
    }
  };

  // 편집 시작
  const startEdit = (opt: CakeOption) => {
    setEditingId(opt.id);
    setEditName(opt.optionName);
    setEditPrice(String(opt.price));
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
    if (!selectedCakeId) return;

    if (!editName.trim()) {
      setErr("옵션 이름을 입력해주세요.");
      return;
    }

    const priceValue = Number(editPrice);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      setErr("추가 금액은 0 이상 숫자로 입력해주세요.");
      return;
    }

    setSavingEdit(true);
    setErr("");

    try {
      const res = await api.put<CakeOption>(
        `/api/cakes/${selectedCakeId}/options/${id}`,
        {
          optionName: editName.trim(),
          price: priceValue,
        }
      );

      setOptions((prev) =>
        prev.map((o) => (o.id === id ? res.data : o))
      );
      cancelEdit();
    } catch (error: any) {
      console.error("update option error:", error);
      const status = error.response?.status;
      const code = error.response?.data?.code;

      if (status === 400) {
        setErr("입력값을 다시 확인해주세요. (길이/검증 제약 위반)");
      } else if (status === 404) {
        setErr("해당 옵션을 찾을 수 없습니다. (이미 삭제되었을 수 있음)");
      } else if (status === 409 && code === "DATA_INTEGRITY_VIOLATION") {
        setErr("중복되거나 유효하지 않은 옵션입니다. 이름/금액을 다시 확인해주세요.");
      } else {
        setErr("옵션 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    if (!selectedCakeId) return;
    if (!window.confirm("정말로 이 옵션을 삭제할까요?")) return;

    try {
      await api.delete(`/api/cakes/${selectedCakeId}/options/${id}`);
      setOptions((prev) => prev.filter((o) => o.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
    } catch (error) {
      console.error("delete option error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 케이크 선택 변경
  const handleCakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setSelectedCakeId(null);
      return;
    }
    setSelectedCakeId(Number(value));
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1.3fr)",
        gap: 18,
      }}
    >
      {/* 왼쪽: 옵션 목록 */}
      <section className="card">
        <div className="card-header">
          <h1 className="card-title">케이크 옵션 관리</h1>
          <p className="card-sub">
            선택한 케이크에 연결되는 사이즈, 토핑, 문구 같은 옵션들을 관리합니다.
            <br />
            각 옵션은 기본 가격에 더해지는 추가 금액(원)으로 동작합니다.
          </p>
        </div>

        {/* 케이크 선택 영역 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 260 }}>
            <label className="form-label">대상 케이크 선택</label>
            {loadingCakes ? (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                케이크 목록을 불러오는 중입니다...
              </div>
            ) : cakes.length === 0 ? (
              <div style={{ fontSize: 12, color: "#f97373" }}>
                등록된 케이크가 없습니다. 먼저 케이크 관리 화면에서 상품을 추가해주세요.
              </div>
            ) : (
              <select
                className="select"
                value={selectedCakeId ?? ""}
                onChange={handleCakeChange}
              >
                {cakes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.price.toLocaleString()}원)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCake && (
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              <div>
                <span className="chip">
                  기준 케이크: {selectedCake.name} · {selectedCake.price.toLocaleString()}원
                </span>
              </div>
            </div>
          )}
        </div>

        {err && (
          <p className="text-error" style={{ marginBottom: 8 }}>
            {err}
          </p>
        )}

        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
          {selectedCakeId
            ? `등록된 옵션 수: ${options.length} 개`
            : "케이크를 선택하면 옵션 목록이 표시됩니다."}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>옵션 이름</th>
                <th style={{ width: 120 }}>추가 금액(원)</th>
                <th style={{ width: 140, textAlign: "right" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {!selectedCakeId ? (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 20, paddingBottom: 16 }}>
                    옵션을 관리할 케이크를 먼저 선택해주세요.
                  </td>
                </tr>
              ) : loadingOptions ? (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 20, paddingBottom: 16 }}>
                    옵션 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : options.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 20, paddingBottom: 16 }}>
                    아직 등록된 옵션이 없습니다. 오른쪽에서 첫 옵션을 추가해보세요.
                  </td>
                </tr>
              ) : (
                options.map((opt) => {
                  const isEditing = editingId === opt.id;
                  return (
                    <tr key={opt.id}>
                      <td>{opt.id}</td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          opt.optionName
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
                          opt.price.toLocaleString()
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 6,
                            }}
                          >
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              type="button"
                              onClick={() => saveEdit(opt.id)}
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
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 6,
                            }}
                          >
                            <button
                              className="btn"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              type="button"
                              onClick={() => startEdit(opt)}
                            >
                              편집
                            </button>
                            <button
                              className="btn"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              type="button"
                              onClick={() => handleDelete(opt.id)}
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

      {/* 오른쪽: 새 옵션 추가 */}
      <section className="card card-compact">
        <div className="card-header">
          <h2 className="card-section-title">새 옵션 추가</h2>
          <p className="card-section-sub">
            선택한 케이크에 연결되는 옵션을 추가합니다.
            <br />
            예: “1호(+5,000원)”, “레터링 문구(+3,000원)”, “생크림 변경(+2,000원)” 등
          </p>
        </div>

        {!selectedCakeId || cakes.length === 0 ? (
          <div style={{ fontSize: 12, color: "#f97373" }}>
            먼저 상단에서 케이크를 선택하거나, 케이크 관리 화면에서 상품을 추가해주세요.
          </div>
        ) : (
          <>
            <form onSubmit={handleCreate}>
              <div className="form-field">
                <label className="form-label">옵션 이름</label>
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 1호 사이즈, 레터링 추가, 생크림 변경"
                />
              </div>

              <div className="form-field">
                <label className="form-label">추가 금액(원)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="예: 5000"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 6 }}
                disabled={creating}
              >
                {creating ? "추가 중..." : "새 옵션 등록"}
              </button>
            </form>

            <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af" }}>
              <p style={{ margin: 0 }}>
                옵션 금액은 “기본 가격에 더해지는 값”입니다.
                <br />
                예를 들어 기본 35,000원 케이크에 “1호(+5,000)” 옵션을 선택하면 40,000원이 됩니다.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminCakeOptions;
