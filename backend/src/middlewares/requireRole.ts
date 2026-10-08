import type { NextFunction, Request, Response } from "express";
import { httpError } from "./errorHandler.js";

export function requireRole(...roles: Array<"SUPERADMIN" | "MEMBER">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(httpError(401, "Unauthorized"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(httpError(403, "Forbidden"));
      return;
    }
    next();
  };
}
