import { describe, expect, it } from "vitest";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  loginSchema,
  refreshSchema,
} from "./auth.schema.js";

describe("loginSchema", () => {
  it("accepts a valid payload", () => {
    expect(loginSchema.parse({ email: "a@b.co", password: "secret1" })).toEqual({
      email: "a@b.co",
      password: "secret1",
    });
  });

  it("rejects bad email and short password", () => {
    expect(() => loginSchema.parse({ email: "nope", password: "secret1" })).toThrow();
    expect(() => loginSchema.parse({ email: "a@b.co", password: "12345" })).toThrow();
  });

  it("rejects passwords longer than 72 chars (bcrypt limit)", () => {
    expect(() => loginSchema.parse({ email: "a@b.co", password: "x".repeat(73) })).toThrow();
  });
});

describe("refreshSchema", () => {
  it("accepts a non-empty token", () => {
    expect(refreshSchema.parse({ refreshToken: "tok" })).toEqual({ refreshToken: "tok" });
  });

  it("rejects empty token", () => {
    expect(() => refreshSchema.parse({ refreshToken: "" })).toThrow();
  });
});

describe("adminCreateUserSchema", () => {
  it("always creates MEMBER (no role field accepted)", () => {
    const parsed = adminCreateUserSchema.parse({
      email: "m@x.co",
      password: "secret1",
      role: "SUPERADMIN",
    });
    expect(parsed).not.toHaveProperty("role");
  });
});

describe("adminUpdateUserSchema", () => {
  it("accepts partial updates and nullable name", () => {
    expect(adminUpdateUserSchema.parse({ status: "LOCKED" })).toEqual({ status: "LOCKED" });
    expect(adminUpdateUserSchema.parse({ name: null })).toEqual({ name: null });
  });

  it("has no role field", () => {
    expect(adminUpdateUserSchema.parse({ role: "SUPERADMIN" })).toEqual({});
  });
});
