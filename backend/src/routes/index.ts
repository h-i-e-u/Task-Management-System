import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { adminUserRouter } from "./admin-user.routes.js";
import { projectRouter } from "./project.routes.js";
import { taskRouter } from "./task.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin/users", requireAuth, requireRole("SUPERADMIN"), adminUserRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/dashboard", dashboardRouter);

apiRouter.post("/users", (_req, res) => {
  res.status(410).json({ message: "Gone. Use POST /api/admin/users instead." });
});
