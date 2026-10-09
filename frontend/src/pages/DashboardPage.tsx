import { useAuth } from "../auth/AuthContext";
import AdminDashboardPage from "./dashboard/AdminDashboardPage";
import MemberDashboardPage from "./dashboard/MemberDashboardPage";

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "SUPERADMIN") return <AdminDashboardPage />;
  return <MemberDashboardPage />;
}
