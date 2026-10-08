import { useEffect, useState, type FormEvent } from "react";
import { api, backendMessage } from "../lib/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  Field,
  SectionTitle,
  SkeletonRows,
  TextInput,
} from "../components/ui";
import type { SafeUser } from "../types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<SafeUser[]>("/admin/users");
      setUsers(res.data);
    } catch (err: unknown) {
      setError(backendMessage(err, "Không tải được danh sách người dùng"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await api.post("/admin/users", {
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      setEmail("");
      setPassword("");
      setName("");
      await load();
    } catch (err: unknown) {
      setCreateError(backendMessage(err, "Tạo người dùng thất bại"));
    } finally {
      setCreating(false);
    }
  }

  async function run(id: string, fn: () => Promise<void>): Promise<void> {
    setBusyId(id);
    setError("");
    try {
      await fn();
      await load();
    } catch (err: unknown) {
      setError(backendMessage(err, "Thao tác thất bại"));
    } finally {
      setBusyId(null);
    }
  }

  function onLock(u: SafeUser): void {
    if (!window.confirm(`Khóa tài khoản ${u.email}? Họ sẽ bị đăng xuất ngay và không thể đăng nhập cho đến khi mở khóa.`))
      return;
    void run(u.id, () => api.post(`/admin/users/${u.id}/lock`).then(() => undefined));
  }

  function onUnlock(u: SafeUser): void {
    void run(u.id, () => api.post(`/admin/users/${u.id}/unlock`).then(() => undefined));
  }

  function onDelete(u: SafeUser): void {
    if (
      !window.confirm(
        `Xóa vĩnh viễn tài khoản ${u.email}? Task do họ tạo sẽ mất người tạo, task được gán sẽ bị gỡ gán. Không thể hoàn tác.`,
      )
    )
      return;
    void run(u.id, () => api.delete(`/admin/users/${u.id}`).then(() => undefined));
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Admin Users</h1>

      <Card className="p-4">
        <SectionTitle>Tạo thành viên mới</SectionTitle>
        <form onSubmit={(e) => void onCreate(e)} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" required />
          </Field>
          <Field label="Mật khẩu">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" required minLength={6} />
          </Field>
          <Field label="Tên">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Không bắt buộc" />
          </Field>
          <Button type="submit" disabled={creating}>
            {creating ? "Đang tạo…" : "Tạo MEMBER"}
          </Button>
        </form>
        {createError && <p className="mt-2 text-xs text-red-600">{createError}</p>}
      </Card>

      {loading ? (
        <SkeletonRows rows={6} />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : users.length === 0 ? (
        <EmptyState title="Chưa có người dùng nào" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Tên</th>
                <th className="px-4 py-2.5 font-medium">Vai trò</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{u.email}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.role}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                      {u.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      {u.status === "ACTIVE" ? (
                        <Button variant="ghost" className="px-2 py-1 text-xs" disabled={busyId === u.id} onClick={() => onLock(u)}>
                          Khóa
                        </Button>
                      ) : (
                        <Button variant="ghost" className="px-2 py-1 text-xs" disabled={busyId === u.id} onClick={() => onUnlock(u)}>
                          Mở khóa
                        </Button>
                      )}
                      <Button variant="dangerText" className="px-2 py-1 text-xs" disabled={busyId === u.id} onClick={() => onDelete(u)}>
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
