import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, programsTable } from "@workspace/db";
import { requireAdmin } from "./admin";

const router: IRouter = Router();

router.get("/programs", async (req, res): Promise<void> => {
  const programs = await db.select().from(programsTable).orderBy(programsTable.date);
  res.json(programs);
});

router.post("/programs", requireAdmin, async (req, res): Promise<void> => {
  const { title, date, description, fileUrl, imageUrl } = req.body;
  if (!title || !date || description == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [program] = await db
    .insert(programsTable)
    .values({ title, date, description, fileUrl: fileUrl ?? null, imageUrl: imageUrl ?? null })
    .returning();
  res.status(201).json(program);
});

router.patch("/programs/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, date, description, fileUrl, imageUrl } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (date !== undefined) updates.date = date;
  if (description !== undefined) updates.description = description;
  if (fileUrl !== undefined) updates.fileUrl = fileUrl;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;

  const [program] = await db.update(programsTable).set(updates).where(eq(programsTable.id, id)).returning();
  if (!program) { res.status(404).json({ error: "Not found" }); return; }
  res.json(program);
});

router.delete("/programs/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [program] = await db.delete(programsTable).where(eq(programsTable.id, id)).returning();
  if (!program) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
