import { useEffect, useState } from "react";
import { api, backendMessage } from "../lib/api";
import { Avatar, ErrorAlert, SkeletonRows, STATUS_LABEL, StatusDot, formatDateTime } from "./ui";
import type { Task } from "../types";

export default function TaskHistory({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load(): Promise<void> {
      try {
        const res = await api.get<Task>(`/tasks/${taskId}`);
        if (alive) setTask(res.data);
      } catch (err: unknown) {
        if (alive) setError(backendMessage(err, "Không tải được lịch sử"));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [taskId]);

  if (loading) return <SkeletonRows rows={3} />;
  if (error) return <ErrorAlert message={error} />;
  if (!task || !task.statusLogs || task.statusLogs.length === 0)
    return <p className="text-xs text-slate-500">Chưa có lịch sử.</p>;

  return (
    <ul className="space-y-2">
      {task.statusLogs.map((l) => {
        const who = l.changedBy ? (l.changedBy.name ?? l.changedBy.email) : "Tài khoản đã xóa";
        return (
          <li key={l.id} className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
            <Avatar name={l.changedBy?.name} email={l.changedBy?.email} />
            <div className="min-w-0">
              <p className="text-xs text-slate-800">
                <span className="font-medium text-slate-900">{who}</span>{" "}
                {l.fromStatus ? (
                  <span className="inline-flex items-center gap-1">
                    đã chuyển {STATUS_LABEL[l.fromStatus]} → <StatusDot status={l.toStatus} />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    đã tạo task ở <StatusDot status={l.toStatus} />
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 tnum">{formatDateTime(l.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
