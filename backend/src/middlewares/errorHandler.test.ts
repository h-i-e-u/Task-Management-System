import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { errorHandler, httpError, notFound } from "./errorHandler.js";
import { loginSchema } from "../schemas/auth.schema.js";

function mockRes() {
  const res = {} as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("db error", { code, clientVersion: "6.19.3" });
}

describe("errorHandler", () => {
  it("maps ZodError to 400 with issues", () => {
    const res = mockRes();
    let zodErr: ZodError | null = null;
    try {
      loginSchema.parse({ email: "bad", password: "x" });
    } catch (e) {
      zodErr = e as ZodError;
    }
    errorHandler(zodErr, {} as Request, res, () => undefined);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ issues: expect.any(Array) }),
    );
  });

  it("maps Prisma P2002 to 409 and P2025 to 404", () => {
    const res409 = mockRes();
    errorHandler(knownError("P2002"), {} as Request, res409, () => undefined);
    expect(res409.status).toHaveBeenCalledWith(409);

    const res404 = mockRes();
    errorHandler(knownError("P2025"), {} as Request, res404, () => undefined);
    expect(res404.status).toHaveBeenCalledWith(404);
  });

  it("respects Error.status for HTTP errors", () => {
    const res = mockRes();
    errorHandler(httpError(403, "Forbidden"), {} as Request, res, () => undefined);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  it("falls back to 500 for unknown errors", () => {
    const res = mockRes();
    errorHandler(new Error("boom"), {} as Request, res, () => undefined);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("notFound returns 404", () => {
    const res = mockRes();
    notFound({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
