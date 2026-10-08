import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
  createProject,
  deleteProject,
  getMine,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/project.controller.js";
import {
  addMember,
  listMembers,
  removeMember,
  updateMember,
} from "../controllers/project-member.controller.js";
import { createTask, getProjectActivity, listTasks } from "../controllers/task.controller.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List scoped projects
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: take
 *         schema: { type: integer }
 *       - in: query
 *         name: skip
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Projects
 *   post:
 *     tags: [Projects]
 *     summary: Create project (SUPERADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               ownerId: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 */
projectRouter.get("/", listProjects);
projectRouter.post("/", requireRole("SUPERADMIN"), createProject);

/**
 * @openapi
 * /projects/mine:
 *   get:
 *     tags: [Projects]
 *     summary: My projects with roles and task counts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: My projects
 */
projectRouter.get("/mine", getMine);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *   patch:
 *     tags: [Projects]
 *     summary: Update project
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Projects]
 *     summary: Delete project (SUPERADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
projectRouter.get("/:id", getProject);
projectRouter.patch("/:id", updateProject);
projectRouter.delete("/:id", requireRole("SUPERADMIN"), deleteProject);

/**
 * @openapi
 * /projects/{id}/members:
 *   get:
 *     tags: [ProjectMembers]
 *     summary: List members
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Members
 *   post:
 *     tags: [ProjectMembers]
 *     summary: Add member (SUPERADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Added
 */
projectRouter.get("/:id/members", listMembers);
projectRouter.post("/:id/members", requireRole("SUPERADMIN"), addMember);

/**
 * @openapi
 * /projects/{id}/members/{userId}:
 *   patch:
 *     tags: [ProjectMembers]
 *     summary: Update member role (SUPERADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [ProjectMembers]
 *     summary: Remove member (SUPERADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Removed
 */
projectRouter.patch("/:id/members/:userId", requireRole("SUPERADMIN"), updateMember);
projectRouter.delete("/:id/members/:userId", requireRole("SUPERADMIN"), removeMember);

/**
 * @openapi
 * /projects/{id}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List project tasks
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string }
 *       - in: query
 *         name: assigneeId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tasks
 *   post:
 *     tags: [Tasks]
 *     summary: Create task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 */
projectRouter.get("/:id/tasks", listTasks);
projectRouter.post("/:id/tasks", createTask);

/**
 * @openapi
 * /projects/{id}/tasks/activity:
 *   get:
 *     tags: [Tasks]
 *     summary: Recent status activity across project tasks
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: take
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Activity logs
 */
projectRouter.get("/:id/tasks/activity", getProjectActivity);
