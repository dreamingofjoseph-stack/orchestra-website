import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import { requireAdmin } from "./admin";

const router: IRouter = Router();

router.get("/events", async (req, res): Promise<void> => {
  const events = await db.select().from(eventsTable).orderBy(eventsTable.date);
  res.json(events);
});

router.post("/events", requireAdmin, async (req, res): Promise<void> => {
  const { title, date, time, description, category, imageUrl } = req.body;
  if (!title || !date || !time || description == null || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [event] = await db
    .insert(eventsTable)
    .values({ title, date, time, description, category, imageUrl: imageUrl ?? null })
    .returning();
  res.status(201).json(event);
});

router.patch("/events/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, date, time, description, category, imageUrl } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (date !== undefined) updates.date = date;
  if (time !== undefined) updates.time = time;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;

  const [event] = await db.update(eventsTable).set(updates).where(eq(eventsTable.id, id)).returning();
  if (!event) { res.status(404).json({ error: "Not found" }); return; }
  res.json(event);
});

router.delete("/events/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [event] = await db.delete(eventsTable).where(eq(eventsTable.id, id)).returning();
  if (!event) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
