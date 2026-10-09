import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  backendMessage,
  clearTokens,
  getStoredRefreshToken,
  setTokenPair,
} from "../lib/api";
import type { SafeUser } from "../types";

interface AuthState {
  user: SafeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    async function boot(): Promise<void> {
      try {
        const stored = getStoredRefreshToken();
        if (!stored) return;
        const ref = await api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
          refreshToken: stored,
        });
        setTokenPair(ref.data.accessToken, ref.data.refreshToken);
        const me = await api.get<SafeUser>("/auth/me");
        if (alive) setUser(me.data);
      } catch {
        clearTokens();
      } finally {
        if (alive) setLoading(false);
      }
    }
    void boot();
    return () => {
      alive = false;
    };
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<void> => {
      try {
        const res = await api.post<{ accessToken: string; refreshToken: string; user: SafeUser }>(
          "/auth/register",
          { email, password, name: name || undefined },
        );
        setTokenPair(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user);
        navigate("/dashboard");
      } catch (err: unknown) {
        throw new Error(backendMessage(err, "Đăng ký thất bại"));
      }
    },
    [navigate],
  );
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const res = await api.post<{ accessToken: string; refreshToken: string; user: SafeUser }>(
          "/auth/login",
          { email, password },
        );
        setTokenPair(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user);
        navigate("/dashboard");
      } catch (err: unknown) {
        throw new Error(backendMessage(err, "Đăng nhập thất bại"));
      }
    },
    [navigate],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      try {
        const res = await api.post<{ accessToken: string; refreshToken: string }>(
          "/auth/change-password",
          { currentPassword, newPassword },
        );
        setTokenPair(res.data.accessToken, res.data.refreshToken);
      } catch (err: unknown) {
        throw new Error(backendMessage(err, "Đổi mật khẩu thất bại"));
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {    try {
      const stored = getStoredRefreshToken();
      await api.post("/auth/logout", stored ? { refreshToken: stored } : {});
    } catch {
      // best-effort
    } finally {
      clearTokens();
      setUser(null);
      navigate("/login");
    }
  }, [navigate]);

  const value = useMemo(
    () => ({ user, loading, login, register, changePassword, logout }),
    [user, loading, login, register, changePassword, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
