import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Task Management API", version: "1.0.0", description: "Team task management backend" },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string" },
            name: { type: "string", nullable: true },
            role: { type: "string", enum: ["SUPERADMIN", "MEMBER"] },
            status: { type: "string", enum: ["ACTIVE", "LOCKED"] },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            ownerId: { type: "string", format: "uuid" },
          },
        },
        ProjectMember: {
          type: "object",
          properties: {
            projectId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            role: { type: "string", enum: ["LEAD", "MEMBER"] },
            joinedAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
            dueDate: { type: "string", format: "date-time", nullable: true },
            projectId: { type: "string", format: "uuid" },
            creatorId: { type: "string", format: "uuid", nullable: true },
            assigneeId: { type: "string", format: "uuid", nullable: true },
          },
        },
        TaskStatusLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            fromStatus: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"], nullable: true },
            toStatus: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
            taskId: { type: "string", format: "uuid" },
            changedById: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
});
