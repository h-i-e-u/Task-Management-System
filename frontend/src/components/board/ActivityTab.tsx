import { useEffect, useState } from "react";
import { api, backendMessage } from "../../lib/api";
import { Avatar, EmptyState, ErrorAlert, SkeletonRows, STATUS_LABEL, formatDateTime } from "../ui";
import type { ActivityLog } from "../../types";

export default function ActivityTab({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load(): Promise<void> {
      try {
        const res = await api.get<ActivityLog[]>(`/projects/${projectId}/tasks/activity`, {
          params: { take: 30 },
        });
        if (alive) setLogs(res.data);
      } catch (err: unknown) {
        if (alive) setError(backendMessage(err, "Không tải được hoạt động"));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [projectId]);

  if (loading) return <SkeletonRows rows={6} />;
  if (error) return <ErrorAlert message={error} />;
  if (logs.length === 0) return <EmptyState title="Chưa có hoạt động nào" />;

  return (
    <ul className="space-y-2.5">
      {logs.map((l) => {
        const who = l.changedBy ? (l.changedBy.name ?? l.changedBy.email) : "Tài khoản đã xóa";
        const from = l.fromStatus ? STATUS_LABEL[l.fromStatus] : null;
        return (
          <li key={l.id} className="flex items-start gap-3 rounded-[10px] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.06)]">
            <Avatar name={l.changedBy?.name} email={l.changedBy?.email} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-800">
                <span className="font-medium text-slate-900">{who}</span>{" "}
                {from ? (
                  <>
                    đã chuyển <span className="font-medium text-slate-900">{l.task?.title ?? "task"}</span> từ{" "}
                    {from} → {STATUS_LABEL[l.toStatus]}
                  </>
                ) : (
                  <>
                    đã tạo <span className="font-medium text-slate-900">{l.task?.title ?? "task"}</span> ở{" "}
                    {STATUS_LABEL[l.toStatus]}
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 tnum">{formatDateTime(l.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
