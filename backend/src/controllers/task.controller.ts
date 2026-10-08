import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import {
  createTaskSchema,
  listTaskQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../schemas/task.schema.js";
import { getProjectAccess } from "../middlewares/projectScope.js";
import { httpError } from "../middlewares/errorHandler.js";
import { param } from "../utils/params.js";

const detailInclude = {
  assignee: { select: { id: true, email: true, name: true } },
  creator: { select: { id: true, email: true, name: true } },
  statusLogs: { include: { changedBy: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: "asc" as const } },
} as const;

async function canManageProject(projectId: string, user: { id: string; role: string }): Promise<boolean> {
  if (user.role === "SUPERADMIN") return true;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId: user.id } } },
  });
  if (!project) return false;
  if (project.ownerId === user.id) return true;
  const m = project.members[0];
  return m?.role === "LEAD";
}

async function validateAssignee(projectId: string, assigneeId: string): Promise<void> {
  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!assignee) throw httpError(404, "Assignee not found");
  if (assignee.status !== "ACTIVE") throw httpError(400, "Assignee is not active");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError(404, "Project not found");
  if (project.ownerId === assigneeId) return;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
  });
  if (!membership) throw httpError(400, "Assignee must be a project member or owner");
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const projectId = param(req, "id");
  const access = await getProjectAccess(projectId, req.user!);
  if (!access) throw httpError(404, "Project not found");
  const q = listTaskQuerySchema.parse(req.query);

  const where: Prisma.TaskWhereInput = { projectId };
  if (q.status) where.status = q.status;
  if (q.priority) where.priority = q.priority;
  if (q.assigneeId) where.assigneeId = q.assigneeId;
  if (q.search) {
    where.OR = [
      { title: { contains: q.search, mode: "insensitive" } },
      { description: { contains: q.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { assignee: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: q.take,
      skip: q.skip,
    }),
    prisma.task.count({ where }),
  ]);
  res.json({ items, total, take: q.take, skip: q.skip });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const projectId = param(req, "id");
  const access = await getProjectAccess(projectId, req.user!);
  if (!access) throw httpError(404, "Project not found");
  if (!(await canManageProject(projectId, req.user!))) throw httpError(403, "Forbidden");

  const data = createTaskSchema.parse(req.body);
  if (data.assigneeId) await validateAssignee(projectId, data.assigneeId);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status ?? "TODO",
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      projectId,
      creatorId: req.user!.id,
      assigneeId: data.assigneeId,
      statusLogs: { create: { fromStatus: null, toStatus: data.status ?? "TODO", changedById: req.user!.id } },
    },
    include: detailInclude,
  });
  res.status(201).json(task);
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: param(req, "taskId") }, include: detailInclude });
  if (!task) throw httpError(404, "Task not found");
  const access = await getProjectAccess(task.projectId, req.user!);
  if (!access) throw httpError(404, "Task not found");
  res.json(task);
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: param(req, "taskId") } });
  if (!task) throw httpError(404, "Task not found");
  const access = await getProjectAccess(task.projectId, req.user!);
  if (!access) throw httpError(404, "Task not found");

  const data = updateTaskSchema.parse(req.body);
  const full = await canManageProject(task.projectId, req.user!);
  const isCreator = task.creatorId === req.user!.id;

  if (!full && !isCreator) {
    const keys = Object.keys(data).filter((k) => (data as Record<string, unknown>)[k] !== undefined);
    const onlyStatus = keys.length === 1 && keys[0] === "status";
    const ownTask = task.assigneeId === req.user!.id;
    if (!(onlyStatus && ownTask)) throw httpError(403, "Forbidden");
  }

  if (data.assigneeId !== undefined && data.assigneeId !== null) {
    await validateAssignee(task.projectId, data.assigneeId);
  }

  const statusChanged = data.status !== undefined && data.status !== task.status;

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate === null ? null : new Date(data.dueDate),
      assigneeId: data.assigneeId === undefined ? undefined : data.assigneeId,
    },
    include: detailInclude,
  });

  if (statusChanged) {
    await prisma.taskStatusLog.create({
      data: { taskId: task.id, fromStatus: task.status, toStatus: data.status!, changedById: req.user!.id },
    });
    const withLog = await prisma.task.findUnique({ where: { id: task.id }, include: detailInclude });
    res.json(withLog);
    return;
  }
  res.json(updated);
}

export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: param(req, "taskId") } });
  if (!task) throw httpError(404, "Task not found");
  const access = await getProjectAccess(task.projectId, req.user!);
  if (!access) throw httpError(404, "Task not found");

  const { status } = updateTaskStatusSchema.parse(req.body);
  const full = await canManageProject(task.projectId, req.user!);
  const isAssignee = task.assigneeId === req.user!.id;
  const isCreator = task.creatorId === req.user!.id;
  if (!full && !isAssignee && !isCreator) throw httpError(403, "Forbidden");
  if (!full && !isAssignee && isCreator) {
    // creator without manage rights can still change status of own created task
  }

  if (status === task.status) {
    const same = await prisma.task.findUnique({ where: { id: task.id }, include: detailInclude });
    res.json(same);
    return;
  }

  await prisma.task.update({ where: { id: task.id }, data: { status } });
  await prisma.taskStatusLog.create({
    data: { taskId: task.id, fromStatus: task.status, toStatus: status, changedById: req.user!.id },
  });
  const withLog = await prisma.task.findUnique({ where: { id: task.id }, include: detailInclude });
  res.json(withLog);
}

export async function getProjectActivity(req: Request, res: Response): Promise<void> {
  const projectId = param(req, "id");
  const access = await getProjectAccess(projectId, req.user!);
  if (!access) throw httpError(404, "Project not found");
  const qTake = req.query.take;
  const first = Array.isArray(qTake) ? qTake[0] : qTake;
  const takeStr = typeof first === "string" ? first : "";
  const rawTake = Number.parseInt(takeStr, 10);
  const take = Number.isNaN(rawTake) ? 30 : Math.min(Math.max(rawTake, 1), 100);
  const logs = await prisma.taskStatusLog.findMany({
    where: { task: { projectId } },
    include: {
      task: { select: { id: true, title: true } },
      changedBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  res.json(logs);
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: param(req, "taskId") } });
  if (!task) throw httpError(404, "Task not found");
  const access = await getProjectAccess(task.projectId, req.user!);
  if (!access) throw httpError(404, "Task not found");
  if (!(await canManageProject(task.projectId, req.user!))) throw httpError(403, "Forbidden");
  await prisma.task.delete({ where: { id: task.id } });
  res.status(204).send();
}
