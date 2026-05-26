import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const concertsTable = pgTable("concerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("upcoming"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertConcertSchema = createInsertSchema(concertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConcert = z.infer<typeof insertConcertSchema>;
export type Concert = typeof concertsTable.$inferSelect;
