import * as React from "react";
import { api } from "../api";
import Pagination from "../components/common/Pagination";

interface Cake {
  id: number;
  name: string;
  price: number;
}

// 백엔드 CakeOptionDto.Summary 에 맞춘 타입
interface CakeOptionRow {
  id: number;
  cakeId: number;
  optionName: string;
  price: number;
}

// PageResult<T> 공통 타입
interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const AdminCakeOptions: React.FC = () => {
  const [cakes, setCakes] = React.useState<Cake[]>([]);
  const [selectedCakeId, setSelectedCakeId] = React.useState<number | null>(
    null
  );

  const [rows, setRows] = React.useState<CakeOptionRow[]>([]);
  const [page, setPage] = React.useState(0);
  const [size] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);

  const [query, setQuery] = React.useState("");
  const [loadingCakes, setLoadingCakes] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [infoMsg, setInfoMsg] = React.useState("");

  // 신규 옵션 입력
  const [newName, setNewName] = React.useState("");
  const [newPrice, setNewPrice] = React.useState("");

  // 케이크 목록 로드
  const loadCakes = React.useCallback(() => {
    setLoadingCakes(true);
    setErr("");
    api
      .get<Cake[]>("/api/cakes")
      .then((res) => {
        const list = res.data;
        setCakes(list);
        if (list.length > 0) {
          setSelectedCakeId((prev) => prev ?? list[0].id);
        } else {
          setSelectedCakeId(null);
        }
      })
      .catch((e) => {
        console.error("load cakes error:", e);
        setErr("케이크 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoadingCakes(false));
  }, []);

  // 케이크별 옵션 페이징 로드
  const loadOptionsPage = React.useCallback(
    (targetPage: number) => {
      if (!selectedCakeId) {
        setRows([]);
        setPage(0);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }
      setListLoading(true);
      setErr("");

      api
        .get<PageResult<CakeOptionRow>>(
          `/api/cakes/${selectedCakeId}/options`,
          {
            params: {
              page: targetPage,
              size,
              q: query || undefined,
            },
          }
        )
        .then((res) => {
          const data = res.data;
          setRows(data.content);
          setPage(data.page);
          setTotalPages(data.totalPages);
          setTotalElements(data.totalElements);
        })
        .catch((e) => {
          console.error("load options error:", e);
          setErr("옵션 목록을 불러오지 못했습니다.");
        })
        .finally(() => setListLoading(false));
    },
    [selectedCakeId, size, query]
  );

  // 초기 로드: 케이크 목록 + 첫 옵션 페이지
  React.useEffect(() => {
    loadCakes();
  }, [loadCakes]);

  // 케이크 변경 시 0페이지부터 다시
  React.useEffect(() => {
    if (selectedCakeId) {
      loadOptionsPage(0);
    } else {
      setRows([]);
      setPage(0);
      setTotalPages(0);
      setTotalElements(0);
    }
  }, [selectedCakeId, loadOptionsPage]);

  const handleCakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (!v) {
      setSelectedCakeId(null);
      return;
    }
    setSelectedCakeId(Number(v));
    setInfoMsg("");
    setErr("");
  };

  const handleSearch = () => {
    loadOptionsPage(0);
  };

  const handleResetFilters = () => {
    setQuery("");
    loadOptionsPage(0);
  };

  const handlePrevPage = () => {
    if (page <= 0) return;
    loadOptionsPage(page - 1);
  };

  const handleNextPage = () => {
    if (page >= totalPages - 1) return;
    loadOptionsPage(page + 1);
  };

  // 옵션 추가
  const handleCreate = async () => {
    if (!selectedCakeId) {
      setErr("먼저 케이크를 선택하세요.");
      return;
    }
    if (!newName.trim()) {
      setErr("옵션 이름을 입력하세요.");
      return;
    }
    const priceNum = Number(newPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setErr("가격은 0 이상 숫자로 입력하세요.");
      return;
    }

    setSaving(true);
    setErr("");
    setInfoMsg("");

    try {
      await api.post(`/api/cakes/${selectedCakeId}/options`, {
        optionName: newName.trim(),
        price: priceNum,
      });
      setNewName("");
      setNewPrice("");
      setInfoMsg("옵션이 추가되었습니다.");
      // 새로 추가된 게 보이도록 0페이지 다시 로드
      loadOptionsPage(0);
    } catch (e: any) {
      console.error("create option error:", e);
      const status = e.response?.status;
      if (status === 400) setErr("유효하지 않은 옵션 데이터입니다.");
      else if (status === 409) setErr("중복되었거나 제약 조건 위반입니다.");
      else setErr("옵션 추가 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 옵션 수정 (간단하게 prompt 사용)
  const handleEdit = async (row: CakeOptionRow) => {
    const name = window.prompt("옵션 이름 수정", row.optionName) ?? "";
    if (!name.trim()) return;

    const priceStr =
      window.prompt("옵션 가격 수정(원)", String(row.price)) ?? "";
    const priceNum = Number(priceStr);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      alert("가격은 0 이상 숫자로 입력해야 합니다.");
      return;
    }

    setSaving(true);
    setErr("");
    setInfoMsg("");

    try {
      await api.put(`/api/cakes/${row.cakeId}/options/${row.id}`, {
        optionName: name.trim(),
        price: priceNum,
      });
      setInfoMsg("옵션이 수정되었습니다.");
      loadOptionsPage(page);
    } catch (e: any) {
      console.error("edit option error:", e);
      const status = e.response?.status;
      if (status === 400) setErr("유효하지 않은 옵션 데이터입니다.");
      else if (status === 409) setErr("중복되었거나 제약 조건 위반입니다.");
      else setErr("옵션 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 옵션 삭제
  const handleDelete = async (row: CakeOptionRow) => {
    if (!window.confirm(`옵션 "${row.optionName}" 을(를) 삭제할까요?`)) return;

    setSaving(true);
    setErr("");
    setInfoMsg("");

    try {
      await api.delete(`/api/cakes/${row.cakeId}/options/${row.id}`);
      setInfoMsg("옵션이 삭제되었습니다.");
      // 현재 페이지에서 마지막 항목을 삭제했을 경우, 한 페이지 앞으로 당기는 것도 고려 가능
      loadOptionsPage(page);
    } catch (e: any) {
      console.error("delete option error:", e);
      setErr("옵션 삭제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 상단: 케이크 선택 + 신규 옵션 추가 */}
      <section className="card">
        <div className="card-header">
          <h1 className="card-title">케이크 옵션 관리</h1>
          <p className="card-sub">
            케이크별로 옵션을 등록·수정·삭제할 수 있습니다.
            <br />
            아래에서 케이크를 선택한 뒤, 옵션 목록을 관리하세요.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
            gap: 16,
          }}
        >
          {/* 왼쪽: 케이크 선택 */}
          <div>
            <label className="form-label">케이크 선택</label>
            {loadingCakes ? (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                케이크 목록 로딩 중...
              </div>
            ) : cakes.length === 0 ? (
              <div style={{ fontSize: 12, color: "#f97373" }}>
                등록된 케이크가 없습니다. 먼저 케이크 관리에서 추가해주세요.
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

          {/* 오른쪽: 신규 옵션 등록 */}
          <div>
            <label className="form-label">신규 옵션 추가</label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <input
                className="input"
                placeholder="옵션 이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ minWidth: 160 }}
              />
              <input
                className="input"
                placeholder="가격(원)"
                type="number"
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ width: 120 }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={saving || !selectedCakeId}
              >
                {saving ? "작업 중..." : "옵션 추가"}
              </button>
            </div>
          </div>
        </div>

        {err && (
          <p className="text-error" style={{ marginTop: 8 }}>
            {err}
          </p>
        )}
        {infoMsg && (
          <p style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>
            {infoMsg}
          </p>
        )}
      </section>

      {/* 하단: 옵션 목록 + 검색/페이징 */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-section-title">옵션 목록</h2>
          <p className="card-section-sub">
            선택한 케이크에 대해 등록된 옵션을 검색하고, 페이지별로 확인할 수 있습니다.
          </p>
        </div>

        {/* 검색 바 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#9ca3af" }}>검색어</label>
            <input
              className="input"
              placeholder="옵션 이름 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 200 }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={listLoading || !selectedCakeId}
            >
              검색
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleResetFilters}
              disabled={listLoading || !selectedCakeId}
            >
              초기화
            </button>
          </div>
        </div>

        {listLoading ? (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            옵션 목록 로딩 중...
          </div>
        ) : !selectedCakeId ? (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            케이크를 선택하면 옵션 목록이 표시됩니다.
          </div>
        ) : rows.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            조건에 맞는 옵션이 없습니다.
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #1f2937" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      옵션명
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      가격(원)
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid #111827" }}
                    >
                      <td
                        style={{
                          padding: "6px 8px",
                          color: "#9ca3af",
                        }}
                      >
                        {page * size + idx + 1}
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        {row.optionName}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                        }}
                      >
                        {row.price.toLocaleString()}원
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn"
                          style={{ fontSize: 11, padding: "4px 8px" }}
                          onClick={() => handleEdit(row)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            marginLeft: 6,
                          }}
                          onClick={() => handleDelete(row)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={size}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
            />

          </>
        )}
      </section>
    </div>
  );
};

export default AdminCakeOptions;
