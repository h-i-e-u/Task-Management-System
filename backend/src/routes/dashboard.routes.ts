import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Dashboard stats (GLOBAL for SUPERADMIN, PROJECTS + PERSONAL otherwise)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dashboard
 */
dashboardRouter.get("/", getDashboard);
