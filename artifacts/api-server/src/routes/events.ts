import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/jsonStore";
import { requireAdmin } from "./admin";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
  category: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const router: IRouter = Router();

router.get("/events", (_req, res): void => {
  const events = readStore<Event>("events");
  events.sort((a, b) => a.date.localeCompare(b.date));
  res.json(events);
});

router.post("/events", requireAdmin, (req, res): void => {
  const { title, date, time, description, category, imageUrl } = req.body;
  if (!title || !date || !time || description == null || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const events = readStore<Event>("events");
  const now = new Date().toISOString();
  const event: Event = {
    id: nextId(events), title, date, time, description, category,
    imageUrl: imageUrl ?? null, createdAt: now, updatedAt: now,
  };
  events.push(event);
  writeStore("events", events);
  res.status(201).json(event);
});

router.patch("/events/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const events = readStore<Event>("events");
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { title, date, time, description, category, imageUrl } = req.body;
  const event = events[idx];
  if (title !== undefined) event.title = title;
  if (date !== undefined) event.date = date;
  if (time !== undefined) event.time = time;
  if (description !== undefined) event.description = description;
  if (category !== undefined) event.category = category;
  if (imageUrl !== undefined) event.imageUrl = imageUrl;
  event.updatedAt = new Date().toISOString();
  writeStore("events", events);
  res.json(event);
});

router.delete("/events/:id", requireAdmin, (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const events = readStore<Event>("events");
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  events.splice(idx, 1);
  writeStore("events", events);
  res.sendStatus(204);
});

export default router;
