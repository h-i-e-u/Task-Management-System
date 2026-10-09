import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2, Plus } from "lucide-react";
import { api, backendMessage } from "../../lib/api";
import { Avatar, ErrorAlert, PriorityBadge, SkeletonRows, STATUS_LABEL, formatDate, isOverdue } from "../ui";
import CreateTaskModal from "./CreateTaskModal";
import type { Task, TaskStatus } from "../../types";
import type { BoardProject } from "./types";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function CardBody({ task }: { task: Task }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <>
      <p className="text-sm font-medium text-slate-900">{task.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <Avatar name={task.assignee?.name} email={task.assignee?.email} />
      </div>
      <p className={`mt-1.5 text-xs tnum ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
        {task.dueDate ? formatDate(task.dueDate) : "Chưa có hạn"}
        {overdue ? " · trễ hạn" : ""}
      </p>
    </>
  );
}

function DraggableCard({ task, saving, allowed }: { task: Task; saving: boolean; allowed: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: saving || !allowed,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={allowed ? `Kéo để đổi trạng thái · Thực hiện: ${task.assignee?.name ?? task.assignee?.email ?? "Chưa gán"}` : "Bạn không có quyền đổi task này"}
      className={`group relative rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200 transition-opacity select-none ${
        saving ? "cursor-wait opacity-70" : allowed ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"
      } ${isDragging ? "opacity-30" : ""}`}
    >
      <TaskTooltip task={task} allowed={allowed} />
      <CardBody task={task} />
      {saving && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-indigo-600">
          <Loader2 size={12} className="animate-spin" aria-hidden />
          Đang lưu…
        </p>
      )}
    </div>
  );
}

function Column({
  status,
  tasks,
  savingId,
  isActiveTarget,
  canManage,
  currentUserId,
}: {
  status: TaskStatus;
  tasks: Task[];
  savingId: string | null;
  isActiveTarget: boolean;
  canManage: boolean;
  currentUserId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const hot = isOver || isActiveTarget;
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[320px] flex-1 rounded-lg p-3 transition-colors ${
        hot ? "bg-indigo-100 ring-2 ring-indigo-500" : "bg-accent-tint"
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className={`text-sm font-semibold ${hot ? "text-indigo-800" : "text-slate-800"}`}>
          {STATUS_LABEL[status]}
        </p>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 tnum">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <DraggableCard
            key={t.id}
            task={t}
            saving={savingId === t.id}
            allowed={canInteract(t, canManage, currentUserId)}
          />
        ))}
        {tasks.length === 0 && (
          <p
            className={`rounded-md border border-dashed px-3 py-6 text-center text-xs ${
              hot ? "border-indigo-400 text-indigo-600" : "border-slate-300 text-slate-400"
            }`}
          >
            {hot ? "Thả vào đây" : "Kéo task vào cột này"}
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  project: BoardProject;
  assignees: Array<{ id: string; name: string | null; email: string }>;
  canCreate: boolean;
  canManage: boolean;
  currentUserId: string;
}

function canInteract(task: Task, canManage: boolean, userId: string): boolean {
  return canManage || task.assigneeId === userId || task.creatorId === userId;
}

function TaskTooltip({ task, allowed }: { task: Task; allowed: boolean }) {
  const assignee = task.assignee ? (task.assignee.name ?? task.assignee.email) : "Chưa gán";
  const creator = task.creator ? (task.creator.name ?? task.creator.email) : "—";
  return (
    <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 hidden w-56 rounded-md bg-slate-900 p-2.5 text-left shadow-lg group-hover:block">
      <span className="block text-xs font-medium text-white">Thực hiện: {assignee}</span>
      <span className="mt-0.5 block text-[11px] text-slate-300">Tạo bởi: {creator}</span>
      <span className="mt-1.5 block border-t border-slate-700 pt-1.5 text-[11px] text-slate-300">
        {allowed ? "Kéo thả thẻ sang cột khác để đổi trạng thái." : "Bạn chỉ được xem task này."}
      </span>
    </span>
  );
}

export default function KanbanTab({ project, assignees, canCreate, canManage, currentUserId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropError, setDropError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

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

  function onDragStart(e: DragStartEvent): void {
    setActiveId(String(e.active.id));
    setDropError("");
  }

  function onDragCancel(): void {
    setActiveId(null);
    setOverColumn(null);
  }

  async function onDragEnd(e: DragEndEvent): Promise<void> {
    const { active, over } = e;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;
    const to = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === to) return;
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status: to } : t)));
    setSavingId(task.id);
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: to });
    } catch (err: unknown) {
      setTasks(prev);
      setDropError(backendMessage(err, "Đổi trạng thái thất bại, đã hoàn tác"));
    } finally {
      setSavingId(null);
    }
  }

  const activeTask = activeId ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  if (loading) return <SkeletonRows rows={5} />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="relative">
      {dropError && (
        <div className="mb-3">
          <ErrorAlert message={dropError} />
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragCancel={onDragCancel}
        onDragOver={(e) => setOverColumn(e.over ? (e.over.id as TaskStatus) : null)}
        onDragEnd={(e) => void onDragEnd(e)}
      >
        <div className="flex flex-col gap-3 md:flex-row">
          {COLUMNS.map((c) => (
            <Column
              key={c}
              status={c}
              tasks={tasks.filter((t) => t.status === c)}
              savingId={savingId}
              isActiveTarget={overColumn === c && activeTask?.status !== c}
              canManage={canManage}
              currentUserId={currentUserId}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeTask ? (
            <div className="w-64 rotate-2 rounded-md bg-white p-3 opacity-95 shadow-xl ring-1 ring-indigo-300">
              <CardBody task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
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
