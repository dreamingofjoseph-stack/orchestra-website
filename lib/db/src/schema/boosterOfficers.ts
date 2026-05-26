import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const boosterOfficersTable = pgTable("booster_officers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBoosterOfficerSchema = createInsertSchema(boosterOfficersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBoosterOfficer = z.infer<typeof insertBoosterOfficerSchema>;
export type BoosterOfficer = typeof boosterOfficersTable.$inferSelect;
