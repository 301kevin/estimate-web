// src/api.ts
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8080" // 로컬 개발할 때 백엔드 주소
    : "https://api.estimate-api.shop"); // 배포용 백엔드 주소 (★ 중요)

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("accessToken");
  }
};
