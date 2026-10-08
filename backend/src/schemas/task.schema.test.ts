import { describe, expect, it } from "vitest";
import {
  createTaskSchema,
  listTaskQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./task.schema.js";

describe("createTaskSchema", () => {
  it("requires only a title", () => {
    expect(createTaskSchema.parse({ title: "Do it" })).toMatchObject({ title: "Do it" });
  });

  it("rejects bad ISO dates", () => {
    expect(() => createTaskSchema.parse({ title: "T", dueDate: "not-a-date" })).toThrow();
  });

  it("accepts ISO date strings", () => {
    expect(createTaskSchema.parse({ title: "T", dueDate: "2026-12-31" })).toMatchObject({
      dueDate: "2026-12-31",
    });
  });
});

describe("updateTaskSchema", () => {
  it("is fully optional and nullable for unsetting", () => {
    expect(updateTaskSchema.parse({})).toEqual({});
    expect(updateTaskSchema.parse({ description: null, dueDate: null, assigneeId: null })).toEqual({
      description: null,
      dueDate: null,
      assigneeId: null,
    });
  });
});

describe("updateTaskStatusSchema", () => {
  it("accepts the three kanban states only", () => {
    expect(updateTaskStatusSchema.parse({ status: "DONE" })).toEqual({ status: "DONE" });
    expect(() => updateTaskStatusSchema.parse({ status: "ARCHIVED" })).toThrow();
  });
});

describe("listTaskQuerySchema", () => {
  it("rejects take above 100 with sane defaults", () => {
    expect(listTaskQuerySchema.parse({})).toMatchObject({ take: 20, skip: 0 });
    expect(() => listTaskQuerySchema.parse({ take: 500 })).toThrow();
  });

  it("coerces string query params", () => {
    expect(listTaskQuerySchema.parse({ take: "10", skip: "5" })).toMatchObject({ take: 10, skip: 5 });
  });
});
