import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import { adminCreateUserSchema, adminUpdateUserSchema } from "../schemas/auth.schema.js";
import { httpError } from "../middlewares/errorHandler.js";
import { param } from "../utils/params.js";

const publicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: "desc" } });
  res.json(users);
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: param(req, "id") }, select: publicSelect });
  if (!user) throw httpError(404, "User not found");
  res.json(user);
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const data = adminCreateUserSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { email: data.email, name: data.name, passwordHash, role: "MEMBER" },
    select: publicSelect,
  });
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const data = adminUpdateUserSchema.parse(req.body);
  const target = await prisma.user.findUnique({ where: { id: param(req, "id") } });
  if (!target) throw httpError(404, "User not found");

  const patch: Record<string, unknown> = {};
  if (data.email !== undefined) patch.email = data.email;
  if (data.name !== undefined) patch.name = data.name;
  if (data.status !== undefined) patch.status = data.status;
  if (data.password !== undefined) patch.passwordHash = await bcrypt.hash(data.password, 10);
  if (data.status === "LOCKED") patch.refreshTokenHash = null;

  const user = await prisma.user.update({ where: { id: target.id }, data: patch, select: publicSelect });
  res.json(user);
}

export async function lockUser(req: Request, res: Response): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: param(req, "id") } });
  if (!target) throw httpError(404, "User not found");
  if (target.id === req.user!.id) throw httpError(400, "Cannot lock yourself");
  if (target.role === "SUPERADMIN") throw httpError(400, "Cannot lock a SUPERADMIN");
  const user = await prisma.user.update({
    where: { id: target.id },
    data: { status: "LOCKED", refreshTokenHash: null },
    select: publicSelect,
  });
  res.json(user);
}

export async function unlockUser(req: Request, res: Response): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: param(req, "id") } });
  if (!target) throw httpError(404, "User not found");
  if (target.role === "SUPERADMIN") throw httpError(400, "Cannot change a SUPERADMIN");
  const user = await prisma.user.update({
    where: { id: target.id },
    data: { status: "ACTIVE" },
    select: publicSelect,
  });
  res.json(user);
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: param(req, "id") } });
  if (!target) throw httpError(404, "User not found");
  if (target.id === req.user!.id) throw httpError(400, "Cannot delete yourself");
  if (target.role === "SUPERADMIN") throw httpError(400, "Cannot delete a SUPERADMIN");
  await prisma.user.delete({ where: { id: target.id } });
  res.status(204).send();
}
