import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;
console.log("API BASE URL =", baseURL); // 디버깅용

export const api = axios.create({
  baseURL,
});

// 로그인/로그아웃 시 Authorization 헤더 + localStorage 관리
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("accessToken");
  }
}

// 앱 시작 시 localStorage에 토큰 있으면 자동 세팅
const saved = localStorage.getItem("accessToken");
if (saved) {
  api.defaults.headers.common["Authorization"] = `Bearer ${saved}`;
}
