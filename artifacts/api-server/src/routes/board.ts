import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, boardMembersTable } from "@workspace/db";
import { requireAdmin } from "./admin";

const router: IRouter = Router();

router.get("/board", async (req, res): Promise<void> => {
  const members = await db.select().from(boardMembersTable).orderBy(boardMembersTable.sortOrder);
  res.json(members);
});

router.post("/board", requireAdmin, async (req, res): Promise<void> => {
  const { name, role, bio, imageUrl, sortOrder } = req.body;
  if (!name || !role || bio == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [member] = await db
    .insert(boardMembersTable)
    .values({ name, role, bio, imageUrl: imageUrl ?? null, sortOrder: sortOrder ?? 0 })
    .returning();
  res.status(201).json(member);
});

router.patch("/board/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, role, bio, imageUrl, sortOrder } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (bio !== undefined) updates.bio = bio;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const [member] = await db.update(boardMembersTable).set(updates).where(eq(boardMembersTable.id, id)).returning();
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(member);
});

router.delete("/board/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [member] = await db.delete(boardMembersTable).where(eq(boardMembersTable.id, id)).returning();
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
