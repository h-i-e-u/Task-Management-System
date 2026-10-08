import crypto from "node:crypto";

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyRefreshToken(token: string, hexHash: string): boolean {
  const digest = crypto.createHash("sha256").update(token, "utf8").digest();
  let expected: Buffer;
  try {
    expected = Buffer.from(hexHash, "hex");
  } catch {
    return false;
  }
  if (expected.length !== digest.length) return false;
  return crypto.timingSafeEqual(digest, expected);
}
