import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SkeletonRows } from "./ui";
import type { Role } from "../types";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <SkeletonRows rows={6} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <p className="text-5xl font-bold text-slate-300 tnum">403</p>
        <p className="mt-2 text-sm text-slate-600">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }
  return <Outlet />;
}
