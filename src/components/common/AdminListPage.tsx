import * as React from "react";

interface Props {
  title: string;
  description?: string;
  toolbar?: React.ReactNode;  // 검색/버튼 영역
  children: React.ReactNode;  // 테이블/목록
  footer?: React.ReactNode;   // 페이지네이션 등
}

const AdminListPage: React.FC<Props> = ({
  title,
  description,
  toolbar,
  children,
  footer,
}) => {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-section-title">{title}</h2>
        {description && (
          <p className="card-section-sub">{description}</p>
        )}
      </div>

      {toolbar && (
        <div style={{ marginBottom: 12 }}>
          {toolbar}
        </div>
      )}

      {children}

      {footer && (
        <div style={{ marginTop: 10 }}>
          {footer}
        </div>
      )}
    </section>
  );
};

export default AdminListPage;
