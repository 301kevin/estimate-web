// src/pages/Home.tsx
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div style={{ fontFamily: "system-ui", color: "#111", background: "#fafafa" }}>
      {/* 히어로 영역 */}
      <section
        style={{
          padding: "64px 16px 40px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <p style={{ fontSize: 14, color: "#6366f1", fontWeight: 600, marginBottom: 8 }}>
          BETA · estimate-api.shop
        </p>
        <h1
          style={{
            fontSize: 32,
            lineHeight: 1.3,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          케이크·카페 사장님을 위한
          <br />
          <span style={{ color: "#4f46e5" }}>자동 견적 API & 관리자 페이지</span>
        </h1>
        <p style={{ fontSize: 15, color: "#4b5563", marginBottom: 24 }}>
          “이 옵션 넣으면 얼마인가요?” 매번 계산하지 말고,
          <br />
          기본 가격과 옵션만 등록하면 견적이 자동으로 계산되도록 만든 서비스입니다.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <Link
            to="/login"
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "#4f46e5",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            관리자 로그인
          </Link>
          {/* 나중에 견적 데모 페이지 만들면 /demo 등으로 연결 */}
          <a
            href="#how-it-works"
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              color: "#111827",
              background: "white",
            }}
          >
            어떻게 동작하는지 보기
          </a>
        </div>

        <p style={{ fontSize: 12, color: "#9ca3af" }}>
          * 현재는 내부 운영 용도로 사용 중이며, 사장님용 화면은 준비 중입니다.
        </p>
      </section>

      {/* 기능 요약 */}
      <section
        style={{
          padding: "32px 16px 24px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          이런 상황에서 쓸 수 있어요
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "white",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              케이크 옵션이 너무 많을 때
            </h3>
            <p style={{ fontSize: 13, color: "#4b5563" }}>
              사이즈, 시트, 크림, 토핑, 문구 등 조합이 많을수록
              수동 계산이 어려워집니다. 옵션 가격만 등록해두면
              조합에 따라 자동으로 견적이 계산됩니다.
            </p>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "white",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              직원이 대신 응대할 때
            </h3>
            <p style={{ fontSize: 13, color: "#4b5563" }}>
              사장님이 없을 때도, 정해둔 옵션과 가격 기준으로
              직원이 안정적인 견적을 안내할 수 있습니다.
            </p>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "white",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              온라인 주문·상담을 받을 때
            </h3>
            <p style={{ fontSize: 13, color: "#4b5563" }}>
              인스타 DM, 카카오톡 채널, 폼 등을 통해 들어오는
              주문 문의에 대해, 같은 옵션이면 같은 가격으로
              빠르게 견적을 보내고 싶을 때 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 동작 방식 */}
      <section
        id="how-it-works"
        style={{
          padding: "24px 16px 40px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          어떻게 동작하나요?
        </h2>

        <ol style={{ fontSize: 14, color: "#4b5563", paddingLeft: 18 }}>
          <li style={{ marginBottom: 8 }}>
            <b>1. 관리자 로그인</b> – 상단의 <b>관리자 로그인</b> 버튼을 눌러
            내부 관리자 계정으로 로그인합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            <b>2. 케이크·옵션 정보 등록</b> – (추후) 관리자 화면에서 기본 케이크와
            옵션(사이즈, 맛, 데코 등)을 등록합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            <b>3. 견적 생성</b> – 선택한 옵션에 따라 견적이 자동 계산되고,
            이 결과를 고객에게 안내하거나, 다른 페이지/챗봇과 연동할 수 있습니다.
          </li>
        </ol>

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
          지금은 관리자·API 쪽 기능을 먼저 개발 중이며,
          사장님이 직접 사용하는 화면은 차례대로 추가할 예정입니다.
        </p>
      </section>

      {/* 푸터 */}
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "16px 16px 32px",
          fontSize: 12,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        <div>© {new Date().getFullYear()} estimate-api. All rights reserved.</div>
        <div style={{ marginTop: 4 }}>운영·테스트 중 · 내부용 관리자 페이지 연결</div>
      </footer>
    </div>
  );
};

export default Home;
