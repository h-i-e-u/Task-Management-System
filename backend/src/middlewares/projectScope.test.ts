import { describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: { project: { findUnique: vi.fn() } },
}));

import { prisma } from "../db/prisma.js";
import { getProjectAccess } from "./projectScope.js";

const findUnique = prisma.project.findUnique as Mock;
const superadmin = { id: "admin", role: "SUPERADMIN" as const };
const member = { id: "mem", role: "MEMBER" as const };

describe("getProjectAccess", () => {
  it("returns null for a missing project", async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(getProjectAccess("nope", member)).resolves.toBeNull();
  });

  it("grants SUPERADMIN full access", async () => {
    findUnique.mockResolvedValueOnce({ ownerId: "someone", members: [] });
    const access = await getProjectAccess("p1", superadmin);
    expect(access).toMatchObject({ projectId: "p1", isOwner: false });
  });

  it("grants the owner access", async () => {
    findUnique.mockResolvedValueOnce({ ownerId: "mem", members: [] });
    const access = await getProjectAccess("p1", member);
    expect(access).toMatchObject({ projectId: "p1", isOwner: true });
  });

  it("grants project members access with their role", async () => {
    findUnique.mockResolvedValueOnce({ ownerId: "other", members: [{ role: "LEAD" }] });
    const access = await getProjectAccess("p1", member);
    expect(access).toMatchObject({ isOwner: false, memberRole: "LEAD" });
  });

  it("returns null for outsiders", async () => {
    findUnique.mockResolvedValueOnce({ ownerId: "other", members: [] });
    await expect(getProjectAccess("p1", member)).resolves.toBeNull();
  });
});
