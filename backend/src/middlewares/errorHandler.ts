import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export interface HttpError extends Error {
  status?: number;
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Not Found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ message: "Validation failed", issues: err.issues });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "Resource already exists" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "Resource not found" });
      return;
    }
  }
  if (err instanceof Error) {
    const status = (err as HttpError).status;
    if (typeof status === "number" && status >= 400 && status < 600) {
      res.status(status).json({ message: err.message });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
}

export function httpError(status: number, message: string): HttpError {
  const e = new Error(message) as HttpError;
  e.status = status;
  return e;
}
