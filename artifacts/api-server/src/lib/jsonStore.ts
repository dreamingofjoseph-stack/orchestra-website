import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR =
  process.env.DATA_DIR ??
  join(process.cwd(), "../nchs-orchestra/public/data");

export function readStore<T>(name: string): T[] {
  const file = join(DATA_DIR, `${name}.json`);
  try {
    if (!existsSync(file)) return [];
    return JSON.parse(readFileSync(file, "utf-8")) as T[];
  } catch {
    return [];
  }
}

export function writeStore<T>(name: string, data: T[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2), "utf-8");
}

export function nextId<T extends { id: number }>(items: T[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}
