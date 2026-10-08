import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, backendMessage } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  SectionTitle,
  SkeletonRows,
  StatusDot,
  formatDate,
} from "../components/ui";
import type { DashboardData, MyProject, SafeUser, Task } from "../types";

interface DashboardRaw {
  scope: "GLOBAL" | "PROJECTS";
  global?: {
    total: number;
    byStatus: DashboardData["byStatus"];
    overdue: number;
    dueSoon: number;
    upcoming: Task[];
  };
  users?: NonNullable<DashboardData["users"]>;
  byProject?: DashboardData["byProject"];
  personal?: {
    total: number;
    byStatus: DashboardData["byStatus"];
    overdue: number;
    dueSoon: number;
    upcoming: Task[];
  };
}

function normalize(raw: DashboardRaw): DashboardData {
  if (raw.scope === "GLOBAL" && raw.global) {
    return {
      scope: "GLOBAL",
      total: raw.global.total,
      byStatus: raw.global.byStatus,
      overdue: raw.global.overdue,
      dueSoonCount: raw.global.dueSoon,
      upcoming: raw.global.upcoming,
      byProject: raw.byProject,
      users: raw.users,
    };
  }
  const p = raw.personal;
  return {
    scope: "PROJECTS",
    total: p?.total ?? 0,
    byStatus: p?.byStatus ?? {},
    overdue: p?.overdue ?? 0,
    dueSoonCount: p?.dueSoon ?? 0,
    upcoming: p?.upcoming ?? [],
    byProject: raw.byProject,
  };
}

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-indigo-600 text-white",
  LEAD: "bg-indigo-100 text-indigo-700",
  MEMBER: "bg-slate-100 text-slate-600",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [me, setMe] = useState<SafeUser | null>(user);
  const [mine, setMine] = useState<MyProject[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load(): Promise<void> {
      try {
        const [d, m, p] = await Promise.all([
          api.get<DashboardRaw>("/dashboard"),
          api.get<SafeUser>("/auth/me"),
          api.get<MyProject[]>("/projects/mine"),
        ]);
        if (!alive) return;
        setData(normalize(d.data));
        setMe(m.data);
        setMine(p.data);
      } catch (err: unknown) {
        if (alive) setError(backendMessage(err, "Không tải được dashboard"));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <SkeletonRows rows={8} />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return <EmptyState title="Không có dữ liệu" />;

  const done = data.byStatus.DONE ?? 0;
  const open = data.total - done;
  const isGlobal = data.scope === "GLOBAL";

  return (
    <div className="space-y-6">
      <Card className="flex items-center gap-3 p-4">
        <Avatar name={me?.name} email={me?.email} />
        <div>
          <p className="text-sm font-semibold text-slate-900">{me?.email}</p>
          <p className="text-xs text-slate-500">
            {me?.role} · {me?.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
          </p>
        </div>
      </Card>

      <h1 className="text-xl font-semibold tracking-tight text-slate-900">
        {isGlobal ? "Tổng quan hệ thống" : "Cần làm ngay"}
      </h1>

      {isGlobal && data.users && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Tổng người dùng", data.users.total],
            ["Superadmin", data.users.superadmin],
            ["Thành viên", data.users.member],
            ["Đã khóa", data.users.locked],
          ].map(([label, value]) => (
            <Card key={label as string} className="p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tnum">{value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="rounded-[10px] bg-indigo-600 p-5 text-white lg:col-span-1">
          <p className="text-sm font-medium text-indigo-100">Quá hạn, chưa xong</p>
          <p className="mt-1 font-bold tnum" style={{ fontSize: 36, lineHeight: 1.1 }}>
            {data.overdue}
          </p>
        </div>
        {[
          ["Tổng việc", data.total],
          ["Chưa xong", open],
          ["Sắp hạn (7 ngày)", data.dueSoonCount],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tnum">{value}</p>
          </Card>
        ))}
      </div>

      {data.byProject && data.byProject.length > 0 && (
        <div>
          <SectionTitle>Bảng project</SectionTitle>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Project</th>
                  <th className="px-4 py-2.5 text-right font-medium">Thành viên</th>
                  <th className="px-4 py-2.5 text-right font-medium">Việc</th>
                  <th className="px-4 py-2.5 font-medium">Cần làm / Đang làm / Xong</th>
                  <th className="px-4 py-2.5 text-right font-medium">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {data.byProject.map((p) => {
                  const t = p.byStatus.TODO ?? 0;
                  const ing = p.byStatus.IN_PROGRESS ?? 0;
                  const d = p.byStatus.DONE ?? 0;
                  const pct = p.total === 0 ? 0 : Math.round((d / p.total) * 100);
                  return (
                    <tr key={p.projectId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        <Link to={`/projects/${p.projectId}/board`} className="hover:text-indigo-700">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right tnum">{p.members}</td>
                      <td className="px-4 py-2.5 text-right tnum">{p.total}</td>
                      <td className="px-4 py-2.5 text-slate-600 tnum">
                        {t} / {ing} / {d}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-600 tnum">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {!isGlobal && (
        <div>
          <SectionTitle>Project của tôi</SectionTitle>
          {mine.length === 0 ? (
            <EmptyState title="Chưa tham gia project nào" />
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Project</th>
                    <th className="px-4 py-2.5 font-medium">Vai trò</th>
                    <th className="px-4 py-2.5 font-medium">Tham gia</th>
                    <th className="px-4 py-2.5 text-right font-medium">Việc dở / Tổng</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {mine.map((m) => (
                    <tr key={m.projectId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{m.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[m.myRole]}`}>
                          {m.myRole === "OWNER" ? "Owner" : m.myRole}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 tnum">
                        {m.joinedAt ? formatDate(m.joinedAt) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 tnum">
                        {m.myOpenTasks} / {m.totalTasks}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link to={`/projects/${m.projectId}/board`}>
                          <Button variant="ghost" className="px-2 py-1 text-xs">
                            Mở
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      <div>
        <SectionTitle>Sắp đến hạn</SectionTitle>
        {data.upcoming.length === 0 ? (
          <EmptyState title="Không có việc sắp đến hạn" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Việc</th>
                  <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right font-medium">Hạn</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{t.title}</td>
                    <td className="px-4 py-2.5">
                      <StatusDot status={t.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600 tnum">{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
