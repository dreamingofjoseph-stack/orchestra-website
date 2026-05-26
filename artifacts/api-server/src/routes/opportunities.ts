import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/jsonStore";
import { requireAdmin } from "./admin";

interface Opportunity {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  link: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const router: IRouter = Router();

router.get("/opportunities", (_req, res): void => {
  const items = readStore<Opportunity>("opportunities");
  items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json(items);
});

router.post("/opportunities", requireAdmin, (req, res): void => {
  const { title, description, deadline, link, imageUrl } = req.body;
  if (!title || description == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const items = readStore<Opportunity>("opportunities");
  const now = new Date().toISOString();
  const opp: Opportunity = {
    id: nextId(items), title, description,
    deadline: deadline ?? null, link: link ?? null, imageUrl: imageUrl ?? null,
    createdAt: now, updatedAt: now,
  };
  items.push(opp);
  writeStore("opportunities", items);
  res.status(201).json(opp);
});

router.patch("/opportunities/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const items = readStore<Opportunity>("opportunities");
  const idx = items.findIndex((o) => o.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { title, description, deadline, link, imageUrl } = req.body;
  const opp = items[idx];
  if (title !== undefined) opp.title = title;
  if (description !== undefined) opp.description = description;
  if (deadline !== undefined) opp.deadline = deadline;
  if (link !== undefined) opp.link = link;
  if (imageUrl !== undefined) opp.imageUrl = imageUrl;
  opp.updatedAt = new Date().toISOString();
  writeStore("opportunities", items);
  res.json(opp);
});

router.delete("/opportunities/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const items = readStore<Opportunity>("opportunities");
  const idx = items.findIndex((o) => o.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  items.splice(idx, 1);
  writeStore("opportunities", items);
  res.sendStatus(204);
});

export default router;
