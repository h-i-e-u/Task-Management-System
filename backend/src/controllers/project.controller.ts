import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { createProjectSchema, listProjectQuerySchema, updateProjectSchema } from "../schemas/task.schema.js";
import { getProjectAccess } from "../middlewares/projectScope.js";
import { httpError } from "../middlewares/errorHandler.js";
import { param } from "../utils/params.js";

export async function createProject(req: Request, res: Response): Promise<void> {
  const data = createProjectSchema.parse(req.body);
  const ownerId = data.ownerId ?? req.user!.id;
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) throw httpError(404, "Owner not found");
  if (owner.status !== "ACTIVE") throw httpError(400, "Owner is not active");

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId,
      members: {
        create: { userId: ownerId, role: "LEAD" },
      },
    },
    include: { owner: { select: { id: true, email: true, name: true } }, _count: { select: { members: true, tasks: true } } },
  });
  res.status(201).json(project);
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  const q = listProjectQuerySchema.parse(req.query);
  const where: Record<string, unknown> = {};
  if (q.search) where.name = { contains: q.search, mode: "insensitive" };

  if (req.user!.role === "SUPERADMIN") {
    const projects = await prisma.project.findMany({
      where,
      include: { owner: { select: { id: true, email: true, name: true } }, _count: { select: { members: true, tasks: true } } },
      orderBy: { createdAt: "desc" },
      take: q.take,
      skip: q.skip,
    });
    res.json(projects);
    return;
  }

  const scoped = await prisma.project.findMany({
    where: {
      ...where,
      OR: [{ ownerId: req.user!.id }, { members: { some: { userId: req.user!.id } } }],
    },
    include: { owner: { select: { id: true, email: true, name: true } }, _count: { select: { members: true, tasks: true } } },
    orderBy: { createdAt: "desc" },
    take: q.take,
    skip: q.skip,
  });
  res.json(scoped);
}

export async function getMine(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const [owned, memberships] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.projectMember.findMany({
      where: { userId },
      include: { project: { include: { _count: { select: { tasks: true } } } } },
    }),
  ]);

  const byId = new Map<string, { projectId: string; name: string; description: string | null; myRole: string; joinedAt: Date | null; totalTasks: number }>();
  for (const p of owned) {
    byId.set(p.id, { projectId: p.id, name: p.name, description: p.description, myRole: "OWNER", joinedAt: null, totalTasks: p._count.tasks });
  }
  for (const m of memberships) {
    if (!byId.has(m.projectId)) {
      byId.set(m.projectId, {
        projectId: m.projectId,
        name: m.project.name,
        description: m.project.description,
        myRole: m.role,
        joinedAt: m.joinedAt,
        totalTasks: m.project._count.tasks,
      });
    } else {
      const cur = byId.get(m.projectId)!;
      if (cur.myRole === "OWNER") cur.joinedAt = m.joinedAt;
      else cur.myRole = m.role;
    }
  }

  const projectIds = [...byId.keys()];
  const openGroups =
    projectIds.length === 0
      ? []
      : await prisma.task.groupBy({
          by: ["projectId", "assigneeId"],
          where: { projectId: { in: projectIds }, assigneeId: userId, status: { not: "DONE" } },
          _count: { _all: true },
        });

  const openByProject = new Map<string, number>();
  for (const g of openGroups) {
    openByProject.set(g.projectId, (openByProject.get(g.projectId) ?? 0) + g._count._all);
  }

  res.json(
    [...byId.values()].map((v) => ({
      ...v,
      myOpenTasks: openByProject.get(v.projectId) ?? 0,
    })),
  );
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const access = await getProjectAccess(param(req, "id"), req.user!);
  if (!access) throw httpError(404, "Project not found");
  const project = await prisma.project.findUnique({
    where: { id: param(req, "id") },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      members: { include: { user: { select: { id: true, email: true, name: true, status: true } } } },
      _count: { select: { members: true, tasks: true } },
    },
  });
  if (!project) throw httpError(404, "Project not found");
  res.json(project);
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const data = updateProjectSchema.parse(req.body);
  const project = await prisma.project.findUnique({ where: { id: param(req, "id") } });
  if (!project) throw httpError(404, "Project not found");

  const isSuper = req.user!.role === "SUPERADMIN";
  const isOwner = project.ownerId === req.user!.id;
  if (!isSuper && !isOwner) throw httpError(404, "Project not found");

  if (data.ownerId && data.ownerId !== project.ownerId) {
    const owner = await prisma.user.findUnique({ where: { id: data.ownerId } });
    if (!owner) throw httpError(404, "Owner not found");
    if (owner.status !== "ACTIVE") throw httpError(400, "Owner is not active");
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
    },
    include: { owner: { select: { id: true, email: true, name: true } } },
  });

  if (data.ownerId && data.ownerId !== project.ownerId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: data.ownerId } },
      create: { projectId: project.id, userId: data.ownerId, role: "LEAD" },
      update: { role: "LEAD" },
    });
  }

  res.json(updated);
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: param(req, "id") } });
  if (!project) throw httpError(404, "Project not found");
  await prisma.project.delete({ where: { id: project.id } });
  res.status(204).send();
}
