import { z } from "zod";

const uuid = z.string().uuid();
const isoDate = z
  .string()
  .min(1)
  .max(100)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid ISO date" });

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(20000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: isoDate.optional(),
  assigneeId: uuid.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(20000).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: isoDate.nullable().optional(),
  assigneeId: uuid.nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

export const listTaskQuerySchema = z.object({
  search: z.string().max(500).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: uuid.optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(20000).optional(),
  ownerId: uuid.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(20000).nullable().optional(),
  ownerId: uuid.optional(),
});

export const listProjectQuerySchema = z.object({
  search: z.string().max(500).optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

export const addMemberSchema = z
  .object({
    userId: uuid.optional(),
    email: z.string().email().max(255).optional(),
    role: z.enum(["LEAD", "MEMBER"]).optional(),
  })
  .refine((v) => v.userId !== undefined || v.email !== undefined, {
    message: "Either userId or email is required",
  });

export const updateMemberSchema = z.object({
  role: z.enum(["LEAD", "MEMBER"]),
});
