import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { api, backendMessage } from "../../lib/api";
import { Avatar, ErrorAlert, PriorityBadge, SkeletonRows, STATUS_LABEL, formatDate, isOverdue } from "../ui";
import CreateTaskModal from "./CreateTaskModal";
import type { Task, TaskStatus } from "../../types";
import type { BoardProject } from "./types";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200 active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <p className="text-sm font-medium text-slate-900">{task.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <Avatar name={task.assignee?.name} email={task.assignee?.email} />
      </div>
      <p className={`mt-1.5 text-xs tnum ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
        {task.dueDate ? formatDate(task.dueDate) : "Chưa có hạn"}
        {overdue ? " · trễ hạn" : ""}
      </p>
    </div>
  );
}

function Column({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`min-h-[320px] flex-1 rounded-lg bg-accent-tint p-3 ${isOver ? "ring-2 ring-indigo-400" : ""}`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-slate-800">{STATUS_LABEL[status]}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 tnum">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  project: BoardProject;
  assignees: Array<{ id: string; name: string | null; email: string }>;
  canCreate: boolean;
}

export default function KanbanTab({ project, assignees, canCreate }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropError, setDropError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    let alive = true;
    async function load(): Promise<void> {
      try {
        const res = await api.get<{ items: Task[] }>(`/projects/${project.id}/tasks`, {
          params: { take: 100 },
        });
        if (alive) setTasks(res.data.items);
      } catch (err: unknown) {
        if (alive) setError(backendMessage(err, "Không tải được tasks"));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [project.id]);

  async function onDragEnd(e: DragEndEvent): Promise<void> {
    setDropError("");
    const { active, over } = e;
    if (!over) return;
    const to = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === to) return;
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status: to } : t)));
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: to });
    } catch (err: unknown) {
      setTasks(prev);
      setDropError(backendMessage(err, "Đổi trạng thái thất bại, đã hoàn tác"));
    }
  }

  if (loading) return <SkeletonRows rows={5} />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="relative">
      {dropError && (
        <div className="mb-3">
          <ErrorAlert message={dropError} />
        </div>
      )}
      <DndContext sensors={sensors} onDragEnd={(e) => void onDragEnd(e)}>
        <div className="flex flex-col gap-3 md:flex-row">
          {COLUMNS.map((c) => (
            <Column key={c} status={c} tasks={tasks.filter((t) => t.status === c)} />
          ))}
        </div>
      </DndContext>
      {canCreate && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="Tạo task mới"
          title="Tạo task mới"
          className="fixed right-6 bottom-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors hover:bg-indigo-700"
        >
          <Plus size={22} />
        </button>
      )}
      {showCreate && (
        <CreateTaskModal
          project={project}
          assignees={assignees}
          onClose={() => setShowCreate(false)}
          onCreated={(t) => setTasks((cur) => [t, ...cur])}
        />
      )}
    </div>
  );
}
