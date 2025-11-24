// src/pages/AdminEstimates.tsx
import * as React from "react";
import { api } from "../api";
import Pagination from "../components/common/Pagination";

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

interface OptionLine {
  optionId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

// 백엔드 EstimateDtos.Response 에 맞춘 타입
interface EstimatePreview {
    id?: number;
    createdAt?: string;
    itemName: string;
    baseUnitPrice: number;
    quantity: number;
    options: OptionLine[];
    itemsTotal: number;
    optionsTotal: number;
    subtotal: number;
    discountRate: number;
    taxRate: number;
    finalTotal: number;
}

// PageResult<T> 자바 레코드에 맞는 타입
interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const AdminEstimates: React.FC = () => {
  const [cakes, setCakes] = React.useState<Cake[]>([]);
  const [selectedCakeId, setSelectedCakeId] = React.useState<number | null>(null);

  const [options, setOptions] = React.useState<CakeOption[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = React.useState<number[]>([]);

  const [quantity, setQuantity] = React.useState<string>("1");
  const [discountRatePct, setDiscountRatePct] = React.useState<string>("0");
  const [taxRatePct, setTaxRatePct] = React.useState<string>("10");

  const [loadingCakes, setLoadingCakes] = React.useState(true);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [preview, setPreview] = React.useState<EstimatePreview | null>(null);
  const [err, setErr] = React.useState("");
  const [saveMsg, setSaveMsg] = React.useState("");

  const [lastSavedId, setLastSavedId] = React.useState<number | null>(null);

  // 🔽 견적 목록 상태
  const [listItems, setListItems] = React.useState<EstimatePreview[]>([]);
  const [listPage, setListPage] = React.useState(0);
  const [listSize] = React.useState(10);
  const [listTotalPages, setListTotalPages] = React.useState(0);
  const [listTotalElements, setListTotalElements] = React.useState(0);
  const [listLoading, setListLoading] = React.useState(false);

  // 🔍 검색 필터 상태
  const [query, setQuery] = React.useState("");
  const [minTotal, setMinTotal] = React.useState("");
  const [maxTotal, setMaxTotal] = React.useState("");

  // 🔽 날짜 필터 (작성일)
  const [fromDate, setFromDate] = React.useState(""); // "2025-11-01" 같은 형식
  const [toDate, setToDate] = React.useState("");

  // 🔽 옵션 있는 견적만
  const [onlyWithOptions, setOnlyWithOptions] = React.useState(false);

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
      .catch((error) => {
        console.error("load cakes error:", error);
        setErr("케이크 목록을 불러오지 못했습니다. (권한/서버 상태 확인)");
      })
      .finally(() => setLoadingCakes(false));
  }, []);

  // 옵션 목록 로드
  const loadOptions = React.useCallback((cakeId: number | null) => {
    if (!cakeId) {
      setOptions([]);
      setSelectedOptionIds([]);
      return;
    }

    setLoadingOptions(true);
    setErr("");

    api
      .get<CakeOption[]>(`/api/cakes/${cakeId}/options`)
      .then((res) => {
        setOptions(res.data);
        setSelectedOptionIds([]);
      })
      .catch((error) => {
        console.error("load options error:", error);
        setErr("옵션 목록을 불러오지 못했습니다. (권한/서버 상태 확인)");
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  // 견적 목록 로드
  const loadEstimateList = React.useCallback(
    (page: number) => {
      setListLoading(true);
      setErr("");

      api
        .get<PageResult<EstimatePreview>>("/api/estimates/search", {
          params: {
            page,
            size: listSize,
            query: query || undefined,
            minTotal: minTotal ? Number(minTotal) : undefined,
            maxTotal: maxTotal ? Number(maxTotal) : undefined,
            // 날짜: LocalDateTime ISO 형식으로 변환
            from: fromDate ? `${fromDate}T00:00:00` : undefined,
            to: toDate ? `${toDate}T23:59:59` : undefined,
            // 옵션 있는 견적만
            hasOptions: onlyWithOptions ? true : undefined,
          },
        })
        .then((res) => {
          const data = res.data;
          setListItems(data.content);
          setListPage(data.page);
          setListTotalPages(data.totalPages);
          setListTotalElements(data.totalElements);
        })
        .catch((error) => {
          console.error("load estimate list error:", error);
          setErr("견적 목록을 불러오지 못했습니다.");
        })
        .finally(() => setListLoading(false));
    },
    [listSize, query, minTotal, maxTotal, fromDate, toDate, onlyWithOptions]
  );



  React.useEffect(() => {
    loadCakes();
    // 화면 처음 열릴 때 견적 목록도 같이 로드
    loadEstimateList(0);
  }, [loadCakes, loadEstimateList]);

  React.useEffect(() => {
    loadOptions(selectedCakeId);
    setPreview(null);
    setSaveMsg("");
    setErr("");
  }, [selectedCakeId, loadOptions]);

  const selectedCake = React.useMemo(
    () => cakes.find((c) => c.id === selectedCakeId) ?? null,
    [cakes, selectedCakeId]
  );

  const selectedOptions = React.useMemo(
    () => options.filter((o) => selectedOptionIds.includes(o.id)),
    [options, selectedOptionIds]
  );

  const quantityNum = React.useMemo(() => {
    const n = Number(quantity);
    if (Number.isNaN(n) || n <= 0) return 1;
    return n;
  }, [quantity]);

  const discountDecimal = React.useMemo(() => {
    const n = Number(discountRatePct);
    if (Number.isNaN(n) || n < 0) return 0;
    return n / 100;
  }, [discountRatePct]);

  const taxDecimal = React.useMemo(() => {
    const n = Number(taxRatePct);
    if (Number.isNaN(n) || n < 0) return 0;
    return n / 100;
  }, [taxRatePct]);

  // 프론트 임시 계산 (서버 미리보기 없을 때만 사용)
  const fallbackCalc = React.useMemo(() => {
    if (!selectedCake) return null;
    const base = selectedCake.price;
    const opts = selectedOptions.reduce((sum, o) => sum + o.price, 0);
    const itemsTotal = base * quantityNum;
    const optionsTotal = opts;
    const subtotal = itemsTotal + optionsTotal;
    const afterDiscount = subtotal * (1 - discountDecimal);
    const finalTotal = Math.round(afterDiscount * (1 + taxDecimal));
    return { base, itemsTotal, optionsTotal, subtotal, finalTotal };
  }, [selectedCake, selectedOptions, quantityNum, discountDecimal, taxDecimal]);

  const toggleOption = (id: number) => {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setPreview(null);
    setSaveMsg("");
  };

  // 서버 미리보기
  const handlePreview = async () => {
    if (!selectedCakeId) {
      setErr("먼저 케이크를 선택해주세요.");
      return;
    }
    const q = quantityNum;
    if (!q || q <= 0) {
      setErr("수량은 1 이상이어야 합니다.");
      return;
    }

    setPreviewLoading(true);
    setErr("");
    setSaveMsg("");

    try {
      const payload = {
        cakeId: selectedCakeId,
        quantity: q,
        optionIds: selectedOptionIds,
      };

      const res = await api.post<EstimatePreview>("/api/estimates/preview", payload);
      setPreview(res.data);
    } catch (error: any) {
      console.error("preview error:", error);
      const status = error.response?.status;
      if (status === 400) setErr("입력값을 다시 확인해주세요. (검증 실패)");
      else if (status === 401 || status === 403)
        setErr("권한 오류입니다. 로그인 상태를 확인해주세요.");
      else setErr("견적 미리보기 중 오류가 발생했습니다.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // 견적 저장
  const handleSave = async () => {
    if (!selectedCakeId) {
      setErr("먼저 케이크를 선택해주세요.");
      return;
    }
    const q = quantityNum;
    if (!q || q <= 0) {
      setErr("수량은 1 이상이어야 합니다.");
      return;
    }

    setSaving(true);
    setErr("");
    setSaveMsg("");

    const payload = {
      cakeId: selectedCakeId,
      quantity: q,
      optionIds: selectedOptionIds,
    };

    const idemKey =
      (window.crypto && "randomUUID" in window.crypto
        ? (window.crypto as any).randomUUID()
        : `estimate-${Date.now()}-${Math.random()}`);

    try {
      const res = await api.post<number>("/api/estimates", payload, {
        headers: { "Idempotency-Key": idemKey },
      });
      const id = res.data;

      setLastSavedId(id);
      setSaveMsg(`견적이 저장되었습니다. (ID: ${id})`);

      // 🔽 저장 성공 후 목록 갱신 (첫 페이지로)
      loadEstimateList(0);
    } catch (error: any) {
      console.error("save error:", error);
      const status = error.response?.status;
      if (status === 400) setErr("입력값을 다시 확인해주세요. (검증 실패)");
      else if (status === 401 || status === 403)
        setErr("권한 오류입니다. 로그인 상태를 다시 확인해주세요.");
      else setErr("견적 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // CSV 다운로드
  const handleDownloadCsv = async () => {
    setErr("");
    try {
      const res = await api.get<Blob>("/api/estimates/export.csv", {
        responseType: "blob",
      });

      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `estimates-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("csv download error:", error);
      setErr("CSV 다운로드 중 오류가 발생했습니다.");
    }
  };

  // PDF 다운로드 (마지막 저장 기준)
  const handleDownloadPdf = async () => {
    if (!lastSavedId) {
      setErr("먼저 견적을 저장한 뒤 PDF를 다운로드할 수 있습니다.");
      return;
    }
    setErr("");
    try {
      const res = await api.get<Blob>(`/api/estimates/${lastSavedId}/export.pdf`, {
        responseType: "blob",
      });

      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimate-${lastSavedId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("pdf download error:", error);
      setErr("PDF 다운로드 중 오류가 발생했습니다.");
    }
  };

 const handleRowPdf = async (id?: number) => {
   if (!id) {
     setErr("해당 견적 ID를 찾을 수 없습니다.");
     return;
   }
   setErr("");
   try {
     const res = await api.get<Blob>(`/api/estimates/${id}/export.pdf`, {
       responseType: "blob",
     });

     const blob = res.data;
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `estimate-${id}.pdf`;
     document.body.appendChild(a);
     a.click();
     a.remove();
     window.URL.revokeObjectURL(url);
   } catch (error: any) {
     console.error("row pdf download error:", error);
     setErr("PDF 다운로드 중 오류가 발생했습니다.");
   }
 };


  const handleCakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setSelectedCakeId(null);
      return;
    }
    setSelectedCakeId(Number(value));
  };

  const previewTaxAmount = React.useMemo(() => {
    if (!preview) return null;
    const t = preview.finalTotal - Math.round(preview.finalTotal / (1 + preview.taxRate));
    return t;
  }, [preview]);

  const handlePrevPage = () => {
    if (listPage <= 0) return;
    loadEstimateList(listPage - 1);
  };

  const handleNextPage = () => {
    if (listPage >= listTotalPages - 1) return;
    loadEstimateList(listPage + 1);
  };

  const handleSearch = () => {
    loadEstimateList(0);
  };

  const handleResetFilters = () => {
    setQuery("");
    setMinTotal("");
    setMaxTotal("");
    setFromDate("");
    setToDate("");
    setOnlyWithOptions(false);
    loadEstimateList(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 상단: 입력 + 요약 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1.3fr)",
          gap: 18,
        }}
      >
        {/* 왼쪽: 입력 폼 */}
        <section className="card">
          <div className="card-header">
            <h1 className="card-title">케이크 견적 생성</h1>
            <p className="card-sub">
              케이크, 옵션, 수량을 선택하고 서버에서 견적을 계산합니다.
              <br />
              “미리보기”로 결과를 확인한 뒤 “견적 저장”을 눌러보세요.
            </p>
          </div>

          {/* 케이크 선택 */}
          <div className="form-field">
            <label className="form-label">케이크 선택</label>
            {loadingCakes ? (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>목록 로딩 중...</div>
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

          {/* 옵션 선택 */}
          <div className="form-field">
            <label className="form-label">옵션 선택</label>
            {selectedCakeId == null ? (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                케이크를 먼저 선택하면 옵션 목록이 표시됩니다.
              </div>
            ) : loadingOptions ? (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>옵션 로딩 중...</div>
            ) : options.length === 0 ? (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                이 케이크에 등록된 옵션이 없습니다.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid #1f2937",
                  background: "#020617",
                }}
              >
                {options.map((opt) => {
                  const selected = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(opt.id)}
                      className="chip"
                      style={{
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                        cursor: "pointer",
                        border: selected ? "1px solid #22c55e" : "1px solid #374151",
                        background: selected ? "#022c22" : "#020617",
                      }}
                    >
                      {opt.optionName}{" "}
                      <span style={{ opacity: 0.8 }}>
                        (+{opt.price.toLocaleString()}원)
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 수량 / 할인 / 부가세 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div className="form-field">
              <label className="form-label">수량</label>
              <input
                className="input"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">할인율(%)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={discountRatePct}
                onChange={(e) => setDiscountRatePct(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">부가세(%)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(e.target.value)}
              />
            </div>
          </div>

          {err && (
            <p className="text-error" style={{ marginBottom: 8 }}>
              {err}
            </p>
          )}
          {saveMsg && (
            <p style={{ fontSize: 12, color: "#4ade80", marginBottom: 8 }}>{saveMsg}</p>
          )}

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 4,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* 왼쪽: CSV/PDF */}
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn" onClick={handleDownloadCsv}>
                CSV 다운로드
              </button>
              <button type="button" className="btn" onClick={handleDownloadPdf}>
                PDF 다운로드
              </button>
            </div>

            {/* 오른쪽: 미리보기 / 저장 */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={handlePreview}
                disabled={previewLoading || !selectedCakeId}
              >
                {previewLoading ? "계산 중..." : "미리보기"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !selectedCakeId}
              >
                {saving ? "저장 중..." : "견적 저장"}
              </button>
            </div>
          </div>
        </section>

        {/* 오른쪽: 요약 카드 */}
        <section className="card card-compact">
          <div className="card-header">
            <h2 className="card-section-title">견적 요약</h2>
            <p className="card-section-sub">
              서버 미리보기 결과가 있으면 그 값을 기준으로, 없으면 임시 계산 결과를 보여줍니다.
            </p>
          </div>

          <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* 케이크 정보 */}
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>케이크</div>
              <div>
                {preview ? (
                  <>
                    <strong>{preview.itemName}</strong>{" "}
                    <span style={{ color: "#9ca3af" }}>
                      ({preview.baseUnitPrice.toLocaleString()}원)
                    </span>
                  </>
                ) : selectedCake ? (
                  <>
                    <strong>{selectedCake.name}</strong>{" "}
                    <span style={{ color: "#9ca3af" }}>
                      ({selectedCake.price.toLocaleString()}원)
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#9ca3af" }}>
                    케이크를 선택하면 정보가 표시됩니다.
                  </span>
                )}
              </div>
            </div>

            {/* 옵션 리스트 */}
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>
                선택된 옵션
              </div>
              {selectedOptions.length === 0 ? (
                <div style={{ color: "#9ca3af" }}>선택된 옵션이 없습니다.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {selectedOptions.map((opt) => (
                    <li key={opt.id}>
                      {opt.optionName}{" "}
                      <span style={{ color: "#9ca3af" }}>
                        (+{opt.price.toLocaleString()}원)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 금액 요약 */}
            <div
              style={{
                borderTop: "1px solid #1f2937",
                paddingTop: 10,
                marginTop: 4,
              }}
            >
              {preview ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>기본 가격 × 수량</span>
                    <span>
                      {preview.baseUnitPrice.toLocaleString()}원 × {preview.quantity}개 ={" "}
                      {preview.itemsTotal.toLocaleString()}원
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>옵션 합계</span>
                    <span>{preview.optionsTotal.toLocaleString()}원</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>할인 전 합계</span>
                    <span>{preview.subtotal.toLocaleString()}원</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>할인율</span>
                    <span>{Math.round(preview.discountRate * 100)}%</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>부가세율</span>
                    <span>{Math.round(preview.taxRate * 100)}%</span>
                  </div>
                  {previewTaxAmount !== null && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span>부가세 금액(추정)</span>
                      <span>{previewTaxAmount.toLocaleString()}원</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px dashed #374151",
                    }}
                  >
                    <span>최종 결제 금액</span>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>
                      {preview.finalTotal.toLocaleString()}원
                    </span>
                  </div>
                </>
              ) : fallbackCalc ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>기본 가격 × 수량</span>
                    <span>
                      {fallbackCalc.base.toLocaleString()}원 × {quantityNum}개 ={" "}
                      {fallbackCalc.itemsTotal.toLocaleString()}원
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>옵션 합계</span>
                    <span>{fallbackCalc.optionsTotal.toLocaleString()}원</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px dashed #374151",
                    }}
                  >
                    <span>임시 계산 최종 금액</span>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>
                      {fallbackCalc.finalTotal.toLocaleString()}원
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ color: "#9ca3af" }}>
                  케이크와 옵션, 수량을 선택하면 금액이 계산됩니다.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 하단: 견적 목록 */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-section-title">견적 목록</h2>
          <p className="card-section-sub">
            최근 저장된 견적들을 간단히 확인합니다. (페이지당 {listSize}건)
          </p>
        </div>

          {/* 🔍 검색 / 필터 바 */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
              marginTop: 4,
              alignItems: "flex-end",
            }}
          >
            {/* 검색어 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#9ca3af" }}>검색어</label>
              <input
                className="input"
                placeholder="케이크 이름 / 옵션명 등"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ minWidth: 180 }}
              />
            </div>

            {/* 최소 금액 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#9ca3af" }}>최소 금액(최종)</label>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="ex) 20000"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                style={{ width: 120 }}
              />
            </div>

            {/* 최대 금액 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#9ca3af" }}>최대 금액(최종)</label>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="ex) 100000"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
                style={{ width: 120 }}
              />
            </div>

            {/* 날짜 from */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#9ca3af" }}>작성일 From</label>
              <input
                className="input"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ width: 150 }}
              />
            </div>

            {/* 날짜 to */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#9ca3af" }}>작성일 To</label>
              <input
                className="input"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ width: 150 }}
              />
            </div>

            {/* 옵션 있는 견적만 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <label style={{ fontSize: 11, color: "#9ca3af" }}>
                <input
                  type="checkbox"
                  checked={onlyWithOptions}
                  onChange={(e) => setOnlyWithOptions(e.target.checked)}
                  style={{ marginRight: 4 }}
                />
                옵션 있는 견적만
              </label>
            </div>

            {/* 검색 / 초기화 버튼 */}
            <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSearch}
              >
                검색
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleResetFilters}
              >
                초기화
              </button>
            </div>
          </div>



        {listLoading ? (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>목록 로딩 중...</div>
        ) : listItems.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            아직 저장된 견적이 없습니다.
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
                      케이크
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      수량
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      상품 합계
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      옵션 합계
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      최종 금액
                    </th>
                    <th
                          style={{
                            textAlign: "left",
                            padding: "6px 8px",
                            fontWeight: 500,
                            color: "#9ca3af",
                          }}
                        >
                          작성일시
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "6px 8px",
                            fontWeight: 500,
                            color: "#9ca3af",
                          }}
                        >
                          PDF
                        </th>
                  </tr>
                </thead>
                <tbody>
                  {listItems.map((est, idx) => {
                    // 👇 여기서 id 들어오는지 확인용
                    console.log("estimate row:", est);

                    return (
                      <tr
                        key={est.id ?? idx}
                        style={{
                          borderBottom: "1px solid #111827",
                        }}
                      >
                        <td style={{ padding: "6px 8px", color: "#9ca3af" }}>
                          {listPage * listSize + idx + 1}
                        </td>
                        <td style={{ padding: "6px 8px" }}>{est.itemName}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>
                          {est.quantity}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>
                          {est.itemsTotal.toLocaleString()}원
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>
                          {est.optionsTotal.toLocaleString()}원
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          {est.finalTotal.toLocaleString()}원
                        </td>

                        {/* 작성일시 */}
                        <td style={{ padding: "6px 8px" }}>
                          {est.createdAt
                            ? new Date(est.createdAt).toLocaleString("ko-KR", {
                                timeZone: "Asia/Seoul",
                              })
                            : "-"}
                        </td>

                        {/* 행별 PDF 버튼 */}
                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ fontSize: 11, padding: "4px 8px" }}
                            onClick={() => handleRowPdf(est.id)}
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>

            {/* 페이지네이션 */}
            <Pagination
              page={listPage}
              totalPages={listTotalPages}
              totalElements={listTotalElements}
              size={listSize}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
            />

          </>
        )}
      </section>
    </div>
  );
};

export default AdminEstimates;
