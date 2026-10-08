import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  deleteTask,
  getTask,
  updateTask,
  updateTaskStatus,
} from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.use(requireAuth);

/**
 * @openapi
 * /tasks/{taskId}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task with status logs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
taskRouter.get("/:taskId", getTask);
taskRouter.patch("/:taskId", updateTask);
taskRouter.delete("/:taskId", deleteTask);

/**
 * @openapi
 * /tasks/{taskId}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Kanban status move
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *     responses:
 *       200:
 *         description: Updated
 */
taskRouter.patch("/:taskId/status", updateTaskStatus);
