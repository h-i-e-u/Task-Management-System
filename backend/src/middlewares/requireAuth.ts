import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { httpError } from "./errorHandler.js";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role: "SUPERADMIN" | "MEMBER";
      status: "ACTIVE" | "LOCKED";
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw httpError(401, "Missing or invalid Authorization header");
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) throw httpError(401, "Missing token");

    let sub: string;
    try {
      sub = verifyAccessToken(token).sub;
    } catch {
      throw httpError(401, "Invalid or expired token");
    }

    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) throw httpError(401, "User not found");
    if (user.status === "LOCKED") throw httpError(403, "Account is locked");

    req.user = { id: user.id, email: user.email, role: user.role, status: user.status };
    next();
  } catch (e) {
    next(e);
  }
}
