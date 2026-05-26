import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/jsonStore";
import { requireAdmin } from "./admin";

interface Concert {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  status: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const router: IRouter = Router();

router.get("/concerts", (_req, res): void => {
  const concerts = readStore<Concert>("concerts");
  concerts.sort((a, b) => a.date.localeCompare(b.date));
  res.json(concerts);
});

router.post("/concerts", requireAdmin, (req, res): void => {
  const { title, date, time, venue, description, status, imageUrl } = req.body;
  if (!title || !date || !time || !venue || !description || !status) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const concerts = readStore<Concert>("concerts");
  const now = new Date().toISOString();
  const concert: Concert = {
    id: nextId(concerts), title, date, time, venue, description, status,
    imageUrl: imageUrl ?? null, createdAt: now, updatedAt: now,
  };
  concerts.push(concert);
  writeStore("concerts", concerts);
  res.status(201).json(concert);
});

router.patch("/concerts/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const concerts = readStore<Concert>("concerts");
  const idx = concerts.findIndex((c) => c.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { title, date, time, venue, description, status, imageUrl } = req.body;
  const concert = concerts[idx];
  if (title !== undefined) concert.title = title;
  if (date !== undefined) concert.date = date;
  if (time !== undefined) concert.time = time;
  if (venue !== undefined) concert.venue = venue;
  if (description !== undefined) concert.description = description;
  if (status !== undefined) concert.status = status;
  if (imageUrl !== undefined) concert.imageUrl = imageUrl;
  concert.updatedAt = new Date().toISOString();
  writeStore("concerts", concerts);
  res.json(concert);
});

router.delete("/concerts/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const concerts = readStore<Concert>("concerts");
  const idx = concerts.findIndex((c) => c.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  concerts.splice(idx, 1);
  writeStore("concerts", concerts);
  res.sendStatus(204);
});

export default router;
