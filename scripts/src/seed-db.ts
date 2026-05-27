/**
 * Seeds the Neon database with initial data from the JSON files.
 * Run after creating the tables with: pnpm --filter @workspace/db run push
 *
 * Usage: pnpm --filter @workspace/scripts run seed-db
 *
 * Requires DATABASE_URL environment variable to be set.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../artifacts/nchs-orchestra/public/data");

function readJson<T>(file: string): T[] {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8")) as T[];
  } catch {
    return [];
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  console.log("Connected to database. Seeding...\n");

  const concerts = readJson<any>("concerts.json");
  for (const c of concerts) {
    await sql`INSERT INTO concerts (title, date, time, venue, description, status, image_url, created_at, updated_at)
              VALUES (${c.title}, ${c.date}, ${c.time}, ${c.venue}, ${c.description}, ${c.status ?? "upcoming"}, ${c.imageUrl ?? null}, NOW(), NOW())
              ON CONFLICT DO NOTHING`;
  }
  console.log(`✓ Inserted ${concerts.length} concert(s)`);

  const programs = readJson<any>("programs.json");
  for (const p of programs) {
    await sql`INSERT INTO programs (title, date, description, file_url, image_url, created_at, updated_at)
              VALUES (${p.title}, ${p.date}, ${p.description ?? ""}, ${p.fileUrl ?? null}, ${p.imageUrl ?? null}, NOW(), NOW())
              ON CONFLICT DO NOTHING`;
  }
  console.log(`✓ Inserted ${programs.length} program(s)`);

  const events = readJson<any>("events.json");
  for (const e of events) {
    await sql`INSERT INTO events (title, date, time, description, category, image_url, created_at, updated_at)
              VALUES (${e.title}, ${e.date}, ${e.time}, ${e.description ?? ""}, ${e.category ?? "general"}, ${e.imageUrl ?? null}, NOW(), NOW())
              ON CONFLICT DO NOTHING`;
  }
  console.log(`✓ Inserted ${events.length} event(s)`);

  const opps = readJson<any>("opportunities.json");
  for (const o of opps) {
    await sql`INSERT INTO opportunities (title, description, deadline, link, image_url, created_at, updated_at)
              VALUES (${o.title}, ${o.description ?? ""}, ${o.deadline ?? null}, ${o.link ?? null}, ${o.imageUrl ?? null}, NOW(), NOW())
              ON CONFLICT DO NOTHING`;
  }
  console.log(`✓ Inserted ${opps.length} opportunity(ies)`);

  const board = readJson<any>("board.json");
  for (const m of board) {
    await sql`INSERT INTO board_members (name, role, bio, image_url, sort_order, created_at, updated_at)
              VALUES (${m.name}, ${m.role}, ${m.bio ?? ""}, ${m.imageUrl ?? null}, ${m.sortOrder ?? 0}, NOW(), NOW())
              ON CONFLICT DO NOTHING`;
  }
  console.log(`✓ Inserted ${board.length} board member(s)`);

  const boosters = readJson<any>("boosters.json");
  for (const b of boosters) {
    await sql`INSERT INTO boosters (title, description, type, image_url, sort_order, created_at, updated_at)
              VALUES (${b.title}, ${b.description ?? ""}, ${b.type ?? "general"}, ${b.imageUrl ?? null}, ${b.sortOrder ?? 0}, NOW(), NOW())
              ON CONFLICT DO NOTHING`;
  }
  console.log(`✓ Inserted ${boosters.length} booster activity(ies)`);

  const officers = readJson<any>("booster-officers.json");
  for (const o of officers) {
    await sql`INSERT INTO booster_officers (name, role, email, sort_order, created_at, updated_at)
              VALUES (${o.name}, ${o.role}, ${o.email}, ${o.sortOrder ?? 0}, NOW(), NOW())
              ON CONFLICT DO NOTHING`;
  }
  console.log(`✓ Inserted ${officers.length} booster officer(s)`);

  console.log("\nDone! Database seeded successfully.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
