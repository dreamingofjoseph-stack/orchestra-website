import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/jsonStore";
import { requireAdmin } from "./admin";

interface BoosterOfficer {
  id: number;
  name: string;
  role: string;
  email: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const router: IRouter = Router();

router.get("/booster-officers", (_req, res): void => {
  const officers = readStore<BoosterOfficer>("booster-officers");
  officers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(officers);
});

router.post("/booster-officers", requireAdmin, (req, res): void => {
  const { name, role, email, sortOrder } = req.body;
  if (!name || !role || !email) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const officers = readStore<BoosterOfficer>("booster-officers");
  const now = new Date().toISOString();
  const officer: BoosterOfficer = {
    id: nextId(officers), name, role, email,
    sortOrder: sortOrder ?? 0, createdAt: now, updatedAt: now,
  };
  officers.push(officer);
  writeStore("booster-officers", officers);
  res.status(201).json(officer);
});

router.patch("/booster-officers/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const officers = readStore<BoosterOfficer>("booster-officers");
  const idx = officers.findIndex((o) => o.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { name, role, email, sortOrder } = req.body;
  const officer = officers[idx];
  if (name !== undefined) officer.name = name;
  if (role !== undefined) officer.role = role;
  if (email !== undefined) officer.email = email;
  if (sortOrder !== undefined) officer.sortOrder = sortOrder;
  officer.updatedAt = new Date().toISOString();
  writeStore("booster-officers", officers);
  res.json(officer);
});

router.delete("/booster-officers/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const officers = readStore<BoosterOfficer>("booster-officers");
  const idx = officers.findIndex((o) => o.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  officers.splice(idx, 1);
  writeStore("booster-officers", officers);
  res.sendStatus(204);
});

export default router;
