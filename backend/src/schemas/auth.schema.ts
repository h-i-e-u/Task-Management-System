import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).max(4096),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  name: z.string().min(1).max(255).optional(),
});

export const adminUpdateUserSchema = z.object({
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(72).optional(),
  name: z.string().min(1).max(255).nullable().optional(),
  status: z.enum(["ACTIVE", "LOCKED"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(6).max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(4096),
  newPassword: z.string().min(6).max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
