import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // .env.local 에서 세팅
});

// 토큰 설정/해제 헬퍼
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("accessToken");
  }
}

// 앱 시작 시 localStorage에 이전 토큰 있으면 자동으로 복구
const saved = localStorage.getItem("accessToken");
if (saved) {
  api.defaults.headers.common["Authorization"] = `Bearer ${saved}`;
}
