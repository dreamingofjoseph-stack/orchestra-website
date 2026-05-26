import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/jsonStore";
import { requireAdmin } from "./admin";

interface Program {
  id: number;
  title: string;
  date: string;
  description: string;
  fileUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const router: IRouter = Router();

router.get("/programs", (_req, res): void => {
  const programs = readStore<Program>("programs");
  programs.sort((a, b) => a.date.localeCompare(b.date));
  res.json(programs);
});

router.post("/programs", requireAdmin, (req, res): void => {
  const { title, date, description, fileUrl, imageUrl } = req.body;
  if (!title || !date || description == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const programs = readStore<Program>("programs");
  const now = new Date().toISOString();
  const program: Program = {
    id: nextId(programs), title, date, description,
    fileUrl: fileUrl ?? null, imageUrl: imageUrl ?? null,
    createdAt: now, updatedAt: now,
  };
  programs.push(program);
  writeStore("programs", programs);
  res.status(201).json(program);
});

router.patch("/programs/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const programs = readStore<Program>("programs");
  const idx = programs.findIndex((p) => p.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { title, date, description, fileUrl, imageUrl } = req.body;
  const program = programs[idx];
  if (title !== undefined) program.title = title;
  if (date !== undefined) program.date = date;
  if (description !== undefined) program.description = description;
  if (fileUrl !== undefined) program.fileUrl = fileUrl;
  if (imageUrl !== undefined) program.imageUrl = imageUrl;
  program.updatedAt = new Date().toISOString();
  writeStore("programs", programs);
  res.json(program);
});

router.delete("/programs/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const programs = readStore<Program>("programs");
  const idx = programs.findIndex((p) => p.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  programs.splice(idx, 1);
  writeStore("programs", programs);
  res.sendStatus(204);
});

export default router;
