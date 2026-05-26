import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD env var is not set");
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  if (password !== adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({ success: true });
});

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || key !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export default router;
