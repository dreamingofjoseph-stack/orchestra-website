import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export function getSql(): NeonQueryFunction<false, false> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

type Row = Record<string, unknown>;

export function camel(row: Row): Row {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()),
      v,
    ])
  );
}

export const nullish = (v: unknown): unknown =>
  v === "" || v === undefined ? null : v;
