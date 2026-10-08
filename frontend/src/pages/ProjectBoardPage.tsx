import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, backendMessage } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { ErrorAlert, SkeletonRows } from "../components/ui";
import ProjectHeader from "../components/board/ProjectHeader";
import ProjectTabs from "../components/board/ProjectTabs";
import KanbanTab from "../components/board/KanbanTab";
import TaskListTab from "../components/board/TaskListTab";
import MembersTab from "../components/board/MembersTab";
import ActivityTab from "../components/board/ActivityTab";
import type { BoardProject, BoardTab } from "../components/board/types";

export default function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<BoardProject | null>(null);
  const [tab, setTab] = useState<BoardTab>("board");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMeta = useCallback(async (): Promise<void> => {
    if (!id) return;
    try {
      const res = await api.get<BoardProject>(`/projects/${id}`);
      setProject(res.data);
      setError("");
    } catch (err: unknown) {
      setError(backendMessage(err, "Không tải được project"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void loadMeta();
  }, [loadMeta]);

  const { assignees, canCreate, canManage } = useMemo(() => {
    if (!project || !user) return { assignees: [], canCreate: false, canManage: false };
    const map = new Map<string, { id: string; name: string | null; email: string }>();
    if (project.owner) map.set(project.owner.id, { id: project.owner.id, name: project.owner.name, email: project.owner.email });
    else map.set(project.ownerId, { id: project.ownerId, name: null, email: "" });
    for (const m of project.members ?? []) {
      if (m.user) map.set(m.userId, { id: m.userId, name: m.user.name, email: m.user.email });
    }
    const isSuper = user.role === "SUPERADMIN";
    const isOwner = project.ownerId === user.id;
    const myMember = project.members?.find((m) => m.userId === user.id);
    const manage = isSuper || isOwner || myMember?.role === "LEAD";
    return { assignees: [...map.values()], canCreate: manage, canManage: manage };
  }, [project, user]);

  if (loading) return <SkeletonRows rows={8} />;
  if (error || !project) return <ErrorAlert message={error || "Không tìm thấy project"} />;

  return (
    <div className="space-y-4">
      <ProjectHeader project={project} onInvite={() => setTab("members")} />
      <ProjectTabs tab={tab} onChange={setTab} />
      <div key={tab}>
        {tab === "board" && <KanbanTab project={project} assignees={assignees} canCreate={canCreate} />}
        {tab === "list" && <TaskListTab project={project} assignees={assignees} canManage={canManage} />}
        {tab === "activity" && <ActivityTab projectId={project.id} />}
        {tab === "members" && <MembersTab project={project} onChanged={loadMeta} />}
      </div>
    </div>
  );
}
