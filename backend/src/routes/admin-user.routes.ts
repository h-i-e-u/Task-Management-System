import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  lockUser,
  unlockUser,
  updateUser,
} from "../controllers/admin-user.controller.js";

export const adminUserRouter = Router();

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [AdminUsers]
 *     summary: List users
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User list
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/User' } }
 *   post:
 *     tags: [AdminUsers]
 *     summary: Create MEMBER user
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 */
adminUserRouter.get("/", listUsers);
adminUserRouter.post("/", createUser);

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     tags: [AdminUsers]
 *     summary: Get user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *   patch:
 *     tags: [AdminUsers]
 *     summary: Update user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated user
 *   delete:
 *     tags: [AdminUsers]
 *     summary: Delete user
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
adminUserRouter.get("/:id", getUser);
adminUserRouter.patch("/:id", updateUser);
adminUserRouter.delete("/:id", deleteUser);

/**
 * @openapi
 * /admin/users/{id}/lock:
 *   post:
 *     tags: [AdminUsers]
 *     summary: Lock user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Locked
 */
adminUserRouter.post("/:id/lock", lockUser);

/**
 * @openapi
 * /admin/users/{id}/unlock:
 *   post:
 *     tags: [AdminUsers]
 *     summary: Unlock user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Unlocked
 */
adminUserRouter.post("/:id/unlock", unlockUser);
