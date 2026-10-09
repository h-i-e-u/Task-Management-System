import { AccountCard, DashboardState, HeroStats, MyProjectsTable, UpcomingTable, useDashboardData } from "./shared";

export default function MemberDashboardPage() {
  const { data, me, mine, loading, error } = useDashboardData();

  if (loading || error || !data) return <DashboardState loading={loading} error={error} data={data} />;

  return (
    <div className="space-y-6">
      <AccountCard me={me} />

      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Cần làm ngay</h1>

      <HeroStats data={data} />

      <MyProjectsTable mine={mine} />

      <UpcomingTable upcoming={data.upcoming} />
    </div>
  );
}
