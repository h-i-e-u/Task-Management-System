import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const REFRESH_KEY = "tms.refreshToken";

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setTokenPair(access: string, refresh: string): void {
  accessToken = access;
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  accessToken = null;
  refreshPromise = null;
  localStorage.removeItem(REFRESH_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
});

async function doRefresh(): Promise<string> {
  if (!refreshPromise) {
    const stored = getStoredRefreshToken();
    if (!stored) return Promise.reject(new Error("No refresh token"));
    refreshPromise = api
      .post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken: stored })
      .then((res) => {
        setTokenPair(res.data.accessToken, res.data.refreshToken);
        return res.data.accessToken;
      })
      .catch((err: unknown) => {
        clearTokens();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isAuthEndpoint(url = ""): boolean {
  return url.includes("/auth/login") || url.includes("/auth/refresh");
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    if (!config || status !== 401 || config._retried || isAuthEndpoint(config.url)) {
      return Promise.reject(error);
    }
    config._retried = true;
    try {
      const fresh = await doRefresh();
      config.headers.set("Authorization", `Bearer ${fresh}`);
      return api.request(config);
    } catch {
      clearTokens();
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
      return Promise.reject(error);
    }
  },
);

export function backendMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
}
