// Axios client with JWT in-memory access token + silent refresh via httpOnly cookie.
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./config";
import { tokenStore } from "./tokenStore";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send refresh-token httpOnly cookie
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

// ---- Silent refresh ----
type Pending = { resolve: (v: string | null) => void; reject: (e: unknown) => void };
let refreshing: Promise<string | null> | null = null;
const queue: Pending[] = [];

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const token: string | null = data?.accessToken ?? null;
      tokenStore.set(token);
      queue.forEach((p) => p.resolve(token));
      queue.length = 0;
      return token;
    } catch (err) {
      tokenStore.clear();
      queue.forEach((p) => p.reject(err));
      queue.length = 0;
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    // Don't try to refresh on auth endpoints themselves
    if (status === 401 && original && !original._retry && !/\/auth\/(login|refresh|register)/.test(url)) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
        return http.request(original);
      }
    }
    return Promise.reject(error);
  },
);

export async function bootstrapAuth(): Promise<string | null> {
  // Called once on app start to attempt silent login via refresh cookie.
  return refreshAccessToken();
}
