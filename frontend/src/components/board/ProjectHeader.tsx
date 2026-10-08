import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AvatarStack, Button } from "../ui";
import type { BoardProject } from "./types";

export default function ProjectHeader({
  project,
  onInvite,
}: {
  project: BoardProject;
  onInvite: () => void;
}) {
  const { user } = useAuth();
  const people =
    project.members?.map((m) => ({ name: m.user?.name, email: m.user?.email })) ??
    (project.owner ? [{ name: project.owner.name, email: project.owner.email }] : []);

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        <Link to="/projects" className="hover:text-indigo-700">
          Projects
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-700">{project.name}</span>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
          {project.description && <p className="mt-0.5 text-sm text-slate-500">{project.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack items={people} />
          {user?.role === "SUPERADMIN" && (
            <Button variant="ghost" onClick={onInvite} className="text-xs">
              <UserPlus size={15} aria-hidden />
              Invite
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
