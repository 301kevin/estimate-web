// src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: false,
});

// 토큰 설정 헬퍼
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("accessToken");
  }
}

// 앱 시작할 때 localStorage에 토큰 있으면 헤더에 넣기
const stored = localStorage.getItem("accessToken");
if (stored) {
  api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
}

// 401 인터셉터: 토큰 만료/인증 오류 → 자동 로그아웃 + /login 이동
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // 토큰/유저명 제거
      setAuthToken(null);
      localStorage.removeItem("adminUsername");

      // 이미 /login 이 아니면 로그인 화면으로 강제 이동
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { api };
