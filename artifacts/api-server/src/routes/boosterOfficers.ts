import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, boosterOfficersTable } from "@workspace/db";
import { requireAdmin } from "./admin";

const router: IRouter = Router();

router.get("/booster-officers", async (req, res): Promise<void> => {
  const officers = await db.select().from(boosterOfficersTable).orderBy(boosterOfficersTable.sortOrder);
  res.json(officers);
});

router.post("/booster-officers", requireAdmin, async (req, res): Promise<void> => {
  const { name, role, email, sortOrder } = req.body;
  if (!name || !role || !email) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [officer] = await db
    .insert(boosterOfficersTable)
    .values({ name, role, email, sortOrder: sortOrder ?? 0 })
    .returning();
  res.status(201).json(officer);
});

router.patch("/booster-officers/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, role, email, sortOrder } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (email !== undefined) updates.email = email;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const [officer] = await db.update(boosterOfficersTable).set(updates).where(eq(boosterOfficersTable.id, id)).returning();
  if (!officer) { res.status(404).json({ error: "Not found" }); return; }
  res.json(officer);
});

router.delete("/booster-officers/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [officer] = await db.delete(boosterOfficersTable).where(eq(boosterOfficersTable.id, id)).returning();
  if (!officer) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
