import { prisma } from "../db/prisma.js";

export interface ProjectAccess {
  projectId: string;
  isOwner: boolean;
  memberRole: "LEAD" | "MEMBER" | null;
}

export async function getProjectAccess(
  projectId: string,
  user: { id: string; role: "SUPERADMIN" | "MEMBER" },
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId: user.id } } },
  });
  if (!project) return null;
  if (user.role === "SUPERADMIN") {
    const m = project.members[0];
    return {
      projectId,
      isOwner: project.ownerId === user.id,
      memberRole: m ? m.role : project.ownerId === user.id ? "LEAD" : null,
    };
  }
  if (project.ownerId === user.id) {
    const m = project.members[0];
    return { projectId, isOwner: true, memberRole: m ? m.role : null };
  }
  const m = project.members[0];
  if (!m) return null;
  return { projectId, isOwner: false, memberRole: m.role };
}
