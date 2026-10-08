import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { requireRole } from "./requireRole.js";

function mockReq(user?: Request["user"]) {
  return { user } as Request;
}

describe("requireRole", () => {
  it("calls next() without error for an allowed role", () => {
    const next = vi.fn();
    requireRole("SUPERADMIN")(mockReq({ id: "1", email: "a@b.co", role: "SUPERADMIN", status: "ACTIVE" }), {} as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });

  it("returns 401 when unauthenticated", () => {
    const next = vi.fn();
    requireRole("SUPERADMIN")(mockReq(undefined), {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as { status: number };
    expect(err.status).toBe(401);
  });

  it("returns 403 for the wrong role", () => {
    const next = vi.fn();
    requireRole("SUPERADMIN")(mockReq({ id: "1", email: "a@b.co", role: "MEMBER", status: "ACTIVE" }), {} as Response, next as NextFunction);
    const err = next.mock.calls[0][0] as { status: number };
    expect(err.status).toBe(403);
  });
});
