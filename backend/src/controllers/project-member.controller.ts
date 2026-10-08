import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { addMemberSchema, updateMemberSchema } from "../schemas/task.schema.js";
import { getProjectAccess } from "../middlewares/projectScope.js";
import { httpError } from "../middlewares/errorHandler.js";
import { param } from "../utils/params.js";

export async function listMembers(req: Request, res: Response): Promise<void> {
  const access = await getProjectAccess(param(req, "id"), req.user!);
  if (!access) throw httpError(404, "Project not found");
  const members = await prisma.projectMember.findMany({
    where: { projectId: param(req, "id") },
    include: { user: { select: { id: true, email: true, name: true, status: true, role: true } } },
    orderBy: { joinedAt: "asc" },
  });
  res.json(members);
}

export async function addMember(req: Request, res: Response): Promise<void> {
  const data = addMemberSchema.parse(req.body);
  const project = await prisma.project.findUnique({ where: { id: param(req, "id") } });
  if (!project) throw httpError(404, "Project not found");

  const target = data.userId
    ? await prisma.user.findUnique({ where: { id: data.userId } })
    : await prisma.user.findUnique({ where: { email: data.email! } });
  if (!target) throw httpError(404, "User not found");
  if (target.status === "LOCKED") throw httpError(400, "User is locked");
  if (target.role === "SUPERADMIN") throw httpError(400, "Cannot add SUPERADMIN as member");

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: target.id } },
  });
  if (existing) throw httpError(409, "User is already a member");

  const member = await prisma.projectMember.create({
    data: { projectId: project.id, userId: target.id, role: data.role ?? "MEMBER" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  res.status(201).json(member);
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  const data = updateMemberSchema.parse(req.body);
  const project = await prisma.project.findUnique({ where: { id: param(req, "id") } });
  if (!project) throw httpError(404, "Project not found");
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: param(req, "userId") } },
  });
  if (!member) throw httpError(404, "Member not found");
  const updated = await prisma.projectMember.update({
    where: { projectId_userId: { projectId: project.id, userId: param(req, "userId") } },
    data: { role: data.role },
  });
  res.json(updated);
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: param(req, "id") } });
  if (!project) throw httpError(404, "Project not found");
  if (param(req, "userId") === project.ownerId) throw httpError(400, "Cannot remove project owner");
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: param(req, "userId") } },
  });
  if (!member) throw httpError(404, "Member not found");
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: project.id, userId: param(req, "userId") } },
  });
  res.status(204).send();
}
