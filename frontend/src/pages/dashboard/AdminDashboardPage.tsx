import { Card } from "../../components/ui";
import { AccountCard, AllProjectsTable, DashboardState, HeroStats, UpcomingTable, useDashboardData } from "./shared";

export default function AdminDashboardPage() {
  const { data, me, loading, error } = useDashboardData();

  if (loading || error || !data) return <DashboardState loading={loading} error={error} data={data} />;

  return (
    <div className="space-y-6">
      <AccountCard me={me} />

      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Tổng quan hệ thống</h1>

      {data.users && (
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

      <HeroStats data={data} />

      {data.byProject && data.byProject.length > 0 && <AllProjectsTable byProject={data.byProject} />}

      <UpcomingTable upcoming={data.upcoming} />
    </div>
  );
}
