import { useEffect, useState } from "react";
import { api, backendMessage } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, Button, EmptyState, ErrorAlert, SelectInput, SkeletonRows } from "../ui";
import type { ProjectMember, SafeUser } from "../../types";
import type { BoardProject } from "./types";

interface Props {
  project: BoardProject;
  onChanged: () => Promise<void>;
}

export default function MembersTab({ project, onChanged }: Props) {
  const { user } = useAuth();
  const isSuper = user?.role === "SUPERADMIN";
  const [members, setMembers] = useState<ProjectMember[]>(project.members ?? []);
  const [candidates, setCandidates] = useState<SafeUser[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMembers(project.members ?? []);
  }, [project]);

  useEffect(() => {
    if (!isSuper) return;
    let alive = true;
    async function loadUsers(): Promise<void> {
      try {
        const res = await api.get<SafeUser[]>("/admin/users");
        if (alive) setCandidates(res.data);
      } catch {
        // dropdown invite chỉ là tiện ích thêm
      }
    }
    void loadUsers();
    return () => {
      alive = false;
    };
  }, [isSuper]);

  const memberIds = new Set(members.map((m) => m.userId));
  const options = candidates.filter(
    (u) => !memberIds.has(u.id) && u.id !== project.ownerId && u.status === "ACTIVE" && u.role !== "SUPERADMIN",
  );

  async function reload(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<ProjectMember[]>(`/projects/${project.id}/members`);
      setMembers(res.data);
      await onChanged();
    } catch (err: unknown) {
      setError(backendMessage(err, "Không tải được thành viên"));
    } finally {
      setLoading(false);
    }
  }

  async function onInvite(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/projects/${project.id}/members`, { userId: selected });
      setSelected("");
      await reload();
    } catch (err: unknown) {
      setError(backendMessage(err, "Thêm thành viên thất bại"));
    } finally {
      setBusy(false);
    }
  }

  async function onRole(userId: string, role: "LEAD" | "MEMBER"): Promise<void> {
    setError("");
    try {
      await api.patch(`/projects/${project.id}/members/${userId}`, { role });
      await reload();
    } catch (err: unknown) {
      setError(backendMessage(err, "Đổi vai trò thất bại"));
    }
  }

  async function onRemove(m: ProjectMember): Promise<void> {
    if (!window.confirm(`Xóa ${m.user?.email ?? "thành viên"} khỏi project? Họ sẽ mất quyền xem task của project.`))
      return;
    setError("");
    try {
      await api.delete(`/projects/${project.id}/members/${m.userId}`);
      await reload();
    } catch (err: unknown) {
      setError(backendMessage(err, "Xóa thành viên thất bại"));
    }
  }

  return (
    <div className="space-y-4">
      {isSuper && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-52 flex-1">
            <SelectInput
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full"
              aria-label="Chọn người để mời"
            >
              <option value="">Chọn người chưa tham gia…</option>
              {options.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                </option>
              ))}
            </SelectInput>
          </div>
          <Button onClick={() => void onInvite()} disabled={busy || !selected}>
            {busy ? "Đang mời…" : "Mời vào project"}
          </Button>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <SkeletonRows rows={4} />
      ) : members.length === 0 ? (
        <EmptyState title="Chưa có thành viên nào" />
      ) : (
        <div className="overflow-x-auto rounded-[10px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.06)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Thành viên</th>
                <th className="px-4 py-2.5 font-medium">Vai trò</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isOwner = m.userId === project.ownerId;
                return (
                  <tr key={m.userId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.user?.name} email={m.user?.email} />
                        <div>
                          <p className="font-medium text-slate-900">{m.user?.name ?? m.user?.email}</p>
                          {m.user?.name && <p className="text-xs text-slate-500">{m.user.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {isOwner ? (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                          Owner
                        </span>
                      ) : isSuper ? (
                        <SelectInput
                          value={m.role}
                          onChange={(e) => void onRole(m.userId, e.target.value as "LEAD" | "MEMBER")}
                          aria-label={`Vai trò của ${m.user?.email}`}
                          className="text-xs"
                        >
                          <option value="LEAD">LEAD</option>
                          <option value="MEMBER">MEMBER</option>
                        </SelectInput>
                      ) : (
                        <span className="text-xs text-slate-600">{m.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isSuper && !isOwner && (
                        <Button variant="dangerText" className="px-2 py-1 text-xs" onClick={() => void onRemove(m)}>
                          Xóa
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
