import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api, backendMessage } from "../../lib/api";
import { Button, Field, SelectInput, STATUS_LABEL, TextInput } from "../ui";
import type { Priority, Task, TaskStatus } from "../../types";
import type { BoardProject } from "./types";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

interface Props {
  project: BoardProject;
  assignees: Array<{ id: string; name: string | null; email: string }>;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export default function CreateTaskModal({ project, assignees, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post<Task>(`/projects/${project.id}/tasks`, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        assigneeId: assigneeId || undefined,
      });
      onCreated(res.data);
      onClose();
    } catch (err: unknown) {
      setError(backendMessage(err, "Tạo task thất bại"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tạo task mới"
    >
      <div className="w-full max-w-lg rounded-[14px] bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight text-slate-900">Tạo task mới</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X size={17} />
          </button>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <Field label="Tiêu đề">
            <TextInput
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thiết kế trang chủ"
              required
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết (không bắt buộc)"
              rows={3}
              className="w-full rounded-[6px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cột">
              <SelectInput value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full">
                {COLUMNS.map((c) => (
                  <option key={c} value={c}>
                    {STATUS_LABEL[c]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Ưu tiên">
              <SelectInput value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full">
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </SelectInput>
            </Field>
            <Field label="Hạn hoàn thành">
              <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Người thực hiện">
              <SelectInput value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full">
                <option value="">Chưa gán</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.email}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy || !title.trim()}>
              {busy ? "Đang tạo…" : "Tạo task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
