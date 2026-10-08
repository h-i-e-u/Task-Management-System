import { useCallback, useEffect, useState } from "react";
import { api, backendMessage } from "../../lib/api";
import {
  Button,
  EmptyState,
  ErrorAlert,
  PriorityBadge,
  SelectInput,
  SkeletonRows,
  StatusDot,
  TextInput,
  formatDate,
} from "../ui";
import TaskHistory from "../TaskHistory";
import type { Task, TaskStatus } from "../../types";
import type { BoardProject } from "./types";

const TAKE = 10;

interface Props {
  project: BoardProject;
  assignees: Array<{ id: string; name: string | null; email: string }>;
  canManage: boolean;
}

export default function TaskListTab({ project, assignees, canManage }: Props) {
  const [items, setItems] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [openHistory, setOpenHistory] = useState<string | null>(null);

  const load = useCallback(
    async (nextSkip: number, s: string, st: string, pr: string, asg: string): Promise<void> => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<{ items: Task[]; total: number }>(`/projects/${project.id}/tasks`, {
          params: {
            take: TAKE,
            skip: nextSkip,
            ...(s ? { search: s } : {}),
            ...(st ? { status: st } : {}),
            ...(pr ? { priority: pr } : {}),
            ...(asg ? { assigneeId: asg } : {}),
          },
        });
        setItems(res.data.items);
        setTotal(res.data.total);
        setSkip(nextSkip);
      } catch (err: unknown) {
        setError(backendMessage(err, "Không tải được tasks"));
      } finally {
        setLoading(false);
      }
    },
    [project.id],
  );

  useEffect(() => {
    void load(0, "", "", "", "");
  }, [load]);

  function onSearch(): void {
    setAppliedSearch(search);
    void load(0, search, status, priority, assigneeId);
  }

  async function onQuickCreate(): Promise<void> {
    if (!quickTitle.trim()) return;
    try {
      await api.post(`/projects/${project.id}/tasks`, { title: quickTitle.trim() });
      setQuickTitle("");
      await load(0, appliedSearch, status, priority, assigneeId);
    } catch (err: unknown) {
      setError(backendMessage(err, "Tạo task thất bại"));
    }
  }

  async function onStatusChange(task: Task, next: TaskStatus): Promise<void> {
    if (next === task.status) return;
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: next });
      await load(skip, appliedSearch, status, priority, assigneeId);
    } catch (err: unknown) {
      setError(backendMessage(err, "Đổi trạng thái thất bại"));
    }
  }

  async function onAssigneeChange(task: Task, next: string): Promise<void> {
    try {
      await api.patch(`/tasks/${task.id}`, { assigneeId: next || null });
      await load(skip, appliedSearch, status, priority, assigneeId);
    } catch (err: unknown) {
      setError(backendMessage(err, "Đổi người thực hiện thất bại"));
    }
  }

  async function onDelete(task: Task): Promise<void> {
    if (!window.confirm(`Xóa task "${task.title}"? Hành động này xóa luôn lịch sử trạng thái và không thể hoàn tác.`))
      return;
    try {
      await api.delete(`/tasks/${task.id}`);
      await load(items.length === 1 && skip > 0 ? skip - TAKE : skip, appliedSearch, status, priority, assigneeId);
    } catch (err: unknown) {
      setError(backendMessage(err, "Xóa task thất bại"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả…"
            aria-label="Tìm task"
          />
        </div>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái">
          <option value="">Mọi trạng thái</option>
          <option value="TODO">Cần làm</option>
          <option value="IN_PROGRESS">Đang làm</option>
          <option value="DONE">Xong</option>
        </SelectInput>
        <SelectInput value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Lọc ưu tiên">
          <option value="">Mọi ưu tiên</option>
          <option value="LOW">Thấp</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HIGH">Cao</option>
          <option value="URGENT">Khẩn cấp</option>
        </SelectInput>
        <SelectInput value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} aria-label="Lọc người thực hiện">
          <option value="">Mọi người</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name ?? a.email}
            </option>
          ))}
        </SelectInput>
        <Button onClick={onSearch}>Tìm</Button>
      </div>

      {canManage && (
        <div className="flex gap-2">
          <div className="flex-1">
            <TextInput
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Tạo nhanh: nhập tiêu đề rồi Enter…"
              aria-label="Tạo nhanh task"
              onKeyDown={(e) => {
                if (e.key === "Enter") void onQuickCreate();
              }}
            />
          </div>
          <Button onClick={() => void onQuickCreate()} disabled={!quickTitle.trim()}>
            Thêm
          </Button>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <SkeletonRows rows={6} />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có task nào" hint="Thử nới lỏng bộ lọc hoặc tạo task mới." />
      ) : (
        <div className="overflow-x-auto rounded-[10px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.06)]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Việc</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium">Ưu tiên</th>
                <th className="px-4 py-2.5 font-medium">Người thực hiện</th>
                <th className="px-4 py-2.5 text-right font-medium">Hạn</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td colSpan={6} className="border-b border-slate-100 p-0 last:border-0">
                    <div className="px-4 py-2.5 hover:bg-slate-50">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="min-w-40 flex-1 font-medium text-slate-900">{t.title}</span>
                        <SelectInput
                          value={t.status}
                          onChange={(e) => void onStatusChange(t, e.target.value as TaskStatus)}
                          aria-label={`Đổi trạng thái ${t.title}`}
                          className="text-xs"
                        >
                          <option value="TODO">Cần làm</option>
                          <option value="IN_PROGRESS">Đang làm</option>
                          <option value="DONE">Xong</option>
                        </SelectInput>
                        <PriorityBadge priority={t.priority} />
                        <SelectInput
                          value={t.assigneeId ?? ""}
                          onChange={(e) => void onAssigneeChange(t, e.target.value)}
                          aria-label={`Đổi người thực hiện ${t.title}`}
                          className="max-w-40 text-xs"
                        >
                          <option value="">Chưa gán</option>
                          {assignees.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name ?? a.email}
                            </option>
                          ))}
                        </SelectInput>
                        <span className="text-xs text-slate-500 tnum">{formatDate(t.dueDate)}</span>
                        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setOpenHistory((v) => (v === t.id ? null : t.id))}>
                          Lịch sử
                        </Button>
                        {canManage && (
                          <Button variant="dangerText" className="px-2 py-1 text-xs" onClick={() => void onDelete(t)}>
                            Xóa
                          </Button>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusDot status={t.status} />
                      </div>
                      {openHistory === t.id && (
                        <div className="mt-2 border-t border-slate-100 pt-2">
                          <TaskHistory taskId={t.id} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500">
            <span className="tnum">
              Hiển thị {items.length} / {total}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" className="px-2 py-1 text-xs" disabled={skip === 0} onClick={() => void load(Math.max(skip - TAKE, 0), appliedSearch, status, priority, assigneeId)}>
                Trước
              </Button>
              <Button variant="ghost" className="px-2 py-1 text-xs" disabled={items.length < TAKE} onClick={() => void load(skip + TAKE, appliedSearch, status, priority, assigneeId)}>
                Sau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
