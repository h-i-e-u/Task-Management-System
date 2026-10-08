import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const isSuper = req.user!.role === "SUPERADMIN";
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const rawProjectIds = req.query.projectId ?? req.query.projectIds;
  let filterIds: string[] | undefined;
  if (typeof rawProjectIds === "string" && rawProjectIds.length > 0) {
    filterIds = rawProjectIds.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const scopedProjects = isSuper
    ? await prisma.project.findMany({ include: { _count: { select: { members: true } } } })
    : await prisma.project.findMany({
        where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
        include: { _count: { select: { members: true } } },
      });
  const scopedIds = scopedProjects.map((p) => p.id);
  const effectiveIds = filterIds ? scopedIds.filter((id) => filterIds!.includes(id)) : scopedIds;

  const personalWhere = { assigneeId: userId, ...(filterIds ? { projectId: { in: filterIds } } : {}) };
  const [personalTotal, personalByStatus, personalOverdue, personalDueSoon, personalUpcoming] = await Promise.all([
    prisma.task.count({ where: personalWhere }),
    prisma.task.groupBy({ by: ["status"], where: personalWhere, _count: { _all: true } }),
    prisma.task.count({ where: { ...personalWhere, status: { not: "DONE" }, dueDate: { lt: now } } }),
    prisma.task.count({
      where: { ...personalWhere, status: { not: "DONE" }, dueDate: { gte: now, lte: soon } },
    }),
    prisma.task.findMany({
      where: { ...personalWhere, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: { project: { select: { id: true, name: true } } },
    }),
  ]);
  const personal = {
    total: personalTotal,
    byStatus: Object.fromEntries(personalByStatus.map((g) => [g.status, g._count._all])),
    overdue: personalOverdue,
    dueSoon: personalDueSoon,
    upcoming: personalUpcoming,
  };

  const projectWhere = (projectId: string) => ({ projectId });
  const byProject = await Promise.all(
    (isSuper ? scopedProjects : scopedProjects.filter((p) => effectiveIds.includes(p.id))).map(async (p) => {
      const [total, byStatus, overdue, dueSoon] = await Promise.all([
        prisma.task.count({ where: projectWhere(p.id) }),
        prisma.task.groupBy({ by: ["status"], where: projectWhere(p.id), _count: { _all: true } }),
        prisma.task.count({ where: { projectId: p.id, status: { not: "DONE" }, dueDate: { lt: now } } }),
        prisma.task.count({
          where: { projectId: p.id, status: { not: "DONE" }, dueDate: { gte: now, lte: soon } },
        }),
      ]);
      return {
        projectId: p.id,
        name: p.name,
        members: p._count.members,
        total,
        byStatus: Object.fromEntries(byStatus.map((g) => [g.status, g._count._all])),
        overdue,
        dueSoon,
      };
    }),
  );

  if (isSuper) {
    const [total, byStatus, overdue, dueSoon, upcoming, users] = await Promise.all([
      prisma.task.count(),
      prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.task.count({ where: { status: { not: "DONE" }, dueDate: { lt: now } } }),
      prisma.task.count({ where: { status: { not: "DONE" }, dueDate: { gte: now, lte: soon } } }),
      prisma.task.findMany({
        where: { status: { not: "DONE" } },
        orderBy: { dueDate: "asc" },
        take: 10,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.user.groupBy({ by: ["role", "status"], _count: { _all: true } }),
    ]);
    let totalUsers = 0;
    let superadmin = 0;
    let member = 0;
    let locked = 0;
    for (const g of users) {
      totalUsers += g._count._all;
      if (g.role === "SUPERADMIN") superadmin += g._count._all;
      if (g.role === "MEMBER") member += g._count._all;
      if (g.status === "LOCKED") locked += g._count._all;
    }
    res.json({
      scope: "GLOBAL",
      global: {
        total,
        byStatus: Object.fromEntries(byStatus.map((g) => [g.status, g._count._all])),
        overdue,
        dueSoon,
        upcoming,
      },
      users: { total: totalUsers, superadmin, member, locked },
      byProject,
      personal,
    });
    return;
  }

  res.json({ scope: "PROJECTS", byProject, personal, projects: byProject });
}
