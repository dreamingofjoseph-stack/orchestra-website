import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/jsonStore";
import { requireAdmin } from "./admin";

interface Booster {
  id: number;
  title: string;
  description: string;
  type: string;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const router: IRouter = Router();

router.get("/boosters", (_req, res): void => {
  const items = readStore<Booster>("boosters");
  items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(items);
});

router.post("/boosters", requireAdmin, (req, res): void => {
  const { title, description, type, imageUrl, sortOrder } = req.body;
  if (!title || description == null || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const items = readStore<Booster>("boosters");
  const now = new Date().toISOString();
  const booster: Booster = {
    id: nextId(items), title, description, type,
    imageUrl: imageUrl ?? null, sortOrder: sortOrder ?? 0,
    createdAt: now, updatedAt: now,
  };
  items.push(booster);
  writeStore("boosters", items);
  res.status(201).json(booster);
});

router.patch("/boosters/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const items = readStore<Booster>("boosters");
  const idx = items.findIndex((b) => b.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { title, description, type, imageUrl, sortOrder } = req.body;
  const booster = items[idx];
  if (title !== undefined) booster.title = title;
  if (description !== undefined) booster.description = description;
  if (type !== undefined) booster.type = type;
  if (imageUrl !== undefined) booster.imageUrl = imageUrl;
  if (sortOrder !== undefined) booster.sortOrder = sortOrder;
  booster.updatedAt = new Date().toISOString();
  writeStore("boosters", items);
  res.json(booster);
});

router.delete("/boosters/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const items = readStore<Booster>("boosters");
  const idx = items.findIndex((b) => b.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  items.splice(idx, 1);
  writeStore("boosters", items);
  res.sendStatus(204);
});

export default router;
