import * as React from "react";

interface PaginationProps {
  page: number;             // 0 기반 페이지 번호
  totalPages: number;
  totalElements?: number;   // 선택
  size?: number;            // 선택
  onPrev: () => void;
  onNext: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalElements,
  size,
  onPrev,
  onNext,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        fontSize: 12,
        color: "#9ca3af",
      }}
    >
      {/* 왼쪽: 정보 텍스트 */}
      <span>
        {totalElements !== undefined && size !== undefined
          ? `총 ${totalElements}건 / ${page + 1} / ${totalPages} 페이지`
          : `${page + 1} / ${totalPages} 페이지`}
      </span>

      {/* 오른쪽: 버튼 */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          className="btn"
          onClick={onPrev}
          disabled={page <= 0}
        >
          이전
        </button>
        <button
          type="button"
          className="btn"
          onClick={onNext}
          disabled={page >= totalPages - 1}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default Pagination;
