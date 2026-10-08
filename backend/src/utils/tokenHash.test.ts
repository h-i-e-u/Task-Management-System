import { describe, expect, it } from "vitest";
import { hashRefreshToken, verifyRefreshToken } from "./tokenHash.js";

describe("hashRefreshToken", () => {
  it("returns a 64-char lowercase hex sha256 digest", () => {
    const h = hashRefreshToken("some-refresh-token");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", () => {
    expect(hashRefreshToken("abc")).toBe(hashRefreshToken("abc"));
  });

  it("differs for different inputs", () => {
    expect(hashRefreshToken("abc")).not.toBe(hashRefreshToken("abd"));
  });
});

describe("verifyRefreshToken", () => {
  it("accepts the matching token", () => {
    const token = "valid-token-value";
    expect(verifyRefreshToken(token, hashRefreshToken(token))).toBe(true);
  });

  it("rejects a different token", () => {
    expect(verifyRefreshToken("other", hashRefreshToken("original"))).toBe(false);
  });

  it("rejects malformed hashes", () => {
    expect(verifyRefreshToken("token", "not-hex")).toBe(false);
    expect(verifyRefreshToken("token", "")).toBe(false);
  });
});
