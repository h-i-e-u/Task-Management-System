import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Users, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "./ui";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout(): Promise<void> {
    await logout();
    navigate("/login");
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-slate-50" style={{ width: 240 }}>
        <div className="flex items-center gap-2 px-5 pt-6 pb-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-base font-bold text-white">
            1i
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Task Manager</span>
        </div>
        <nav className="flex flex-col gap-1 px-3" aria-label="Chính">
          <NavLink to="/dashboard" className={linkCls}>
            <LayoutDashboard size={17} aria-hidden />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={linkCls}>
            <FolderKanban size={17} aria-hidden />
            <span>Projects</span>
          </NavLink>
          {user?.role === "SUPERADMIN" && (
            <NavLink to="/admin/users" className={linkCls}>
              <Users size={17} aria-hidden />
              <span>Admin Users</span>
            </NavLink>
          )}
        </nav>
        <div className="mt-auto border-t border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name} email={user?.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-900">{user?.email}</p>
              <p className="text-[11px] text-slate-500">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200"
            >
              <LogOut size={16} aria-hidden />
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
