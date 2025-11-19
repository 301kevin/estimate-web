// src/pages/AdminEstimates.tsx
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

// 백엔드 EstimateDtos.Response 에 맞춘 타입
interface OptionLine {
  optionId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface EstimatePreview {
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

const AdminEstimates: React.FC = () => {
  const [cakes, setCakes] = React.useState<Cake[]>([]);
  const [selectedCakeId, setSelectedCakeId] = React.useState<number | null>(null);

  const [options, setOptions] = React.useState<CakeOption[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = React.useState<number[]>([]);

  const [quantity, setQuantity] = React.useState<string>("1");
  const [discountRatePct, setDiscountRatePct] = React.useState<string>("0");  // 10 → 10%
  const [taxRatePct, setTaxRatePct] = React.useState<string>("10");          // 기본 10%

  const [loadingCakes, setLoadingCakes] = React.useState(true);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [preview, setPreview] = React.useState<EstimatePreview | null>(null);
  const [err, setErr] = React.useState("");
  const [saveMsg, setSaveMsg] = React.useState("");

  // 케이크 목록
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

  // 옵션 목록
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

  React.useEffect(() => {
    loadCakes();
  }, [loadCakes]);

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

  // 프론트 임시 계산 (서버 미리보기 없을 때 사용)
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

  // 서버 미리보기 호출
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
      // ⚠️ EstimateDtos.Request 필드에 맞춰서 최소한만 보냄
      //   (cakeId, quantity, optionIds)
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
      // 컨트롤러: ResponseEntity<Long> 이라서 id 하나 온다고 가정
      const res = await api.post<number>("/api/estimates", payload, {
        headers: { "Idempotency-Key": idemKey },
      });
      const id = res.data;
      setSaveMsg(`견적이 저장되었습니다. (ID: ${id})`);
    } catch (error: any) {
      console.error("save error:", error);
      const status = error.response?.status;
      if (status === 400) setErr("입력값을 다시 확인해주세요. (검증 실패)");
      else if (status === 401 || status === 403)
        setErr("권한 오류입니다. 로그인 상태를 확인해주세요.");
      else setErr("견적 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
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

  // 서버 preview 기준 부가세 금액 계산 (Response에 taxAmount 없음)
  const previewTaxAmount = React.useMemo(() => {
    if (!preview) return null;
    const t = preview.finalTotal - Math.round(preview.finalTotal / (1 + preview.taxRate));
    return t;
  }, [preview]);

  return (
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

        {/* 수량 / 할인 / 부가세 (지금은 프론트 계산용) */}
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
            justifyContent: "flex-end",
          }}
        >
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

          {/* 옵션 리스트 (선택 기준) */}
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>기본 가격 × 수량</span>
                  <span>
                    {preview.baseUnitPrice.toLocaleString()}원 × {preview.quantity}개 ={" "}
                    {preview.itemsTotal.toLocaleString()}원
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>옵션 합계</span>
                  <span>{preview.optionsTotal.toLocaleString()}원</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>할인 전 합계</span>
                  <span>{preview.subtotal.toLocaleString()}원</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>할인율</span>
                  <span>{Math.round(preview.discountRate * 100)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>기본 가격 × 수량</span>
                  <span>
                    {fallbackCalc.base.toLocaleString()}원 × {quantityNum}개 ={" "}
                    {fallbackCalc.itemsTotal.toLocaleString()}원
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
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
  );
};

export default AdminEstimates;
