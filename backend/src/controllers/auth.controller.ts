import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import { loginSchema, refreshSchema } from "../schemas/auth.schema.js";
import { signAccessToken, signRefreshToken, verifyRefreshTokenJwt } from "../utils/jwt.js";
import { hashRefreshToken, verifyRefreshToken } from "../utils/tokenHash.js";
import { httpError } from "../middlewares/errorHandler.js";

async function issuePair(userId: string) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: hashRefreshToken(refreshToken) },
  });
  return { accessToken, refreshToken };
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw httpError(401, "Invalid credentials");
  if (user.status === "LOCKED") throw httpError(403, "Account is locked");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw httpError(401, "Invalid credentials");
  const pair = await issuePair(user.id);
  res.json({ ...pair, user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = refreshSchema.parse(req.body);
  let sub: string;
  try {
    sub = verifyRefreshTokenJwt(refreshToken).sub;
  } catch {
    throw httpError(401, "Invalid refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user || !user.refreshTokenHash) throw httpError(401, "Invalid refresh token");
  if (!verifyRefreshToken(refreshToken, user.refreshTokenHash)) {
    throw httpError(401, "Invalid refresh token");
  }
  if (user.status === "LOCKED") {
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
    throw httpError(403, "Account is locked");
  }
  const pair = await issuePair(user.id);
  res.json(pair);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body ?? {});
  if (parsed.success) {
    try {
      const sub = verifyRefreshTokenJwt(parsed.data.refreshToken).sub;
      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (user?.refreshTokenHash && verifyRefreshToken(parsed.data.refreshToken, user.refreshTokenHash)) {
        await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
      }
    } catch {
      // fallthrough: always 200
    }
  } else if (req.user) {
    await prisma.user.update({ where: { id: req.user.id }, data: { refreshTokenHash: null } });
  }
  res.json({ message: "Logged out" });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw httpError(401, "User not found");
  res.json(user);
}
