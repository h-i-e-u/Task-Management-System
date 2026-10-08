import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, backendMessage } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
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
import type { Project } from "../types";

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuper = user?.role === "SUPERADMIN";
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function load(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<Project[]>("/projects", { params: { take: 100 } });
      setProjects(res.data);
    } catch (err: unknown) {
      setError(backendMessage(err, "Không tải được danh sách project"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.owner?.email ?? "").toLowerCase().includes(q),
    );
  }, [projects, filter]);

  async function onCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await api.post("/projects", { name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      await load();
    } catch (err: unknown) {
      setCreateError(backendMessage(err, "Tạo project thất bại"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Projects</h1>
        <TextInput
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Lọc nhanh theo tên, mô tả, owner…"
          className="max-w-xs"
          aria-label="Lọc project"
        />
      </div>

      {isSuper && (
        <Card className="p-4">
          <SectionTitle>Tạo nhanh project</SectionTitle>
          <form onSubmit={(e) => void onCreate(e)} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <Field label="Tên project">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Website bán hàng" />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Mô tả">
                <TextInput
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn (không bắt buộc)"
                />
              </Field>
            </div>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? "Đang tạo…" : "Tạo"}
            </Button>
          </form>
          {createError && (
            <p className="mt-2 text-xs text-red-600">{createError}</p>
          )}
        </Card>
      )}

      {loading ? (
        <SkeletonRows rows={6} />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : visible.length === 0 ? (
        <EmptyState title="Chưa có project nào" hint="Project bạn sở hữu hoặc tham gia sẽ hiện ở đây." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Tên</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 text-right font-medium">Thành viên</th>
                <th className="px-4 py-2.5 text-right font-medium">Việc</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => void navigate(`/projects/${p.id}/board`)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.description && <p className="truncate text-xs text-slate-500">{p.description}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{p.owner?.email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tnum">{p._count?.members ?? 0}</td>
                  <td className="px-4 py-2.5 text-right tnum">{p._count?.tasks ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
