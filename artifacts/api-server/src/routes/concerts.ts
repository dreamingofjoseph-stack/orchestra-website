import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, concertsTable } from "@workspace/db";
import { requireAdmin } from "./admin";

const router: IRouter = Router();

router.get("/concerts", async (req, res): Promise<void> => {
  const concerts = await db.select().from(concertsTable).orderBy(concertsTable.date);
  res.json(concerts);
});

router.post("/concerts", requireAdmin, async (req, res): Promise<void> => {
  const { title, date, time, venue, description, status, imageUrl } = req.body;
  if (!title || !date || !time || !venue || !description || !status) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [concert] = await db
    .insert(concertsTable)
    .values({ title, date, time, venue, description, status, imageUrl: imageUrl ?? null })
    .returning();
  res.status(201).json(concert);
});

router.patch("/concerts/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, date, time, venue, description, status, imageUrl } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (date !== undefined) updates.date = date;
  if (time !== undefined) updates.time = time;
  if (venue !== undefined) updates.venue = venue;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;

  const [concert] = await db.update(concertsTable).set(updates).where(eq(concertsTable.id, id)).returning();
  if (!concert) { res.status(404).json({ error: "Not found" }); return; }
  res.json(concert);
});

router.delete("/concerts/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [concert] = await db.delete(concertsTable).where(eq(concertsTable.id, id)).returning();
  if (!concert) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
