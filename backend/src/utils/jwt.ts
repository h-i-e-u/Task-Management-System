import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessPayload {
  sub: string;
}

export interface ResetPayload {
  sub: string;
  purpose: "password-reset";
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshTokenJwt(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessPayload;
}

export function signPasswordResetToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "password-reset" }, env.JWT_RESET_SECRET, {
    expiresIn: "15m",
  });
}

export function verifyPasswordResetToken(token: string): ResetPayload {
  const payload = jwt.verify(token, env.JWT_RESET_SECRET) as ResetPayload;
  if (payload.purpose !== "password-reset") throw new Error("Invalid reset token");
  return payload;
}
