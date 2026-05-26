import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/jsonStore";
import { requireAdmin } from "./admin";

interface BoardMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const router: IRouter = Router();

router.get("/board", (_req, res): void => {
  const members = readStore<BoardMember>("board");
  members.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(members);
});

router.post("/board", requireAdmin, (req, res): void => {
  const { name, role, bio, imageUrl, sortOrder } = req.body;
  if (!name || !role || bio == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const members = readStore<BoardMember>("board");
  const now = new Date().toISOString();
  const member: BoardMember = {
    id: nextId(members), name, role, bio,
    imageUrl: imageUrl ?? null, sortOrder: sortOrder ?? 0,
    createdAt: now, updatedAt: now,
  };
  members.push(member);
  writeStore("board", members);
  res.status(201).json(member);
});

router.patch("/board/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const members = readStore<BoardMember>("board");
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { name, role, bio, imageUrl, sortOrder } = req.body;
  const member = members[idx];
  if (name !== undefined) member.name = name;
  if (role !== undefined) member.role = role;
  if (bio !== undefined) member.bio = bio;
  if (imageUrl !== undefined) member.imageUrl = imageUrl;
  if (sortOrder !== undefined) member.sortOrder = sortOrder;
  member.updatedAt = new Date().toISOString();
  writeStore("board", members);
  res.json(member);
});

router.delete("/board/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const members = readStore<BoardMember>("board");
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  members.splice(idx, 1);
  writeStore("board", members);
  res.sendStatus(204);
});

export default router;
