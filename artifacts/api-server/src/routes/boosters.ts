import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, boostersTable } from "@workspace/db";
import { requireAdmin } from "./admin";

const router: IRouter = Router();

router.get("/boosters", async (req, res): Promise<void> => {
  const boosters = await db.select().from(boostersTable).orderBy(boostersTable.sortOrder);
  res.json(boosters);
});

router.post("/boosters", requireAdmin, async (req, res): Promise<void> => {
  const { title, description, type, imageUrl, sortOrder } = req.body;
  if (!title || description == null || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [booster] = await db
    .insert(boostersTable)
    .values({ title, description, type, imageUrl: imageUrl ?? null, sortOrder: sortOrder ?? 0 })
    .returning();
  res.status(201).json(booster);
});

router.patch("/boosters/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, description, type, imageUrl, sortOrder } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (type !== undefined) updates.type = type;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const [booster] = await db.update(boostersTable).set(updates).where(eq(boostersTable.id, id)).returning();
  if (!booster) { res.status(404).json({ error: "Not found" }); return; }
  res.json(booster);
});

router.delete("/boosters/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booster] = await db.delete(boostersTable).where(eq(boostersTable.id, id)).returning();
  if (!booster) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
