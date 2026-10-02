import { createHash, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/* ------------------------------------------------------------------ */
/* CORS                                                                */
/* ------------------------------------------------------------------ */

/**
 * The public site calls `/api/*` on its own origin, so it needs no CORS
 * headers at all. Cross-origin access is therefore denied by default and only
 * granted to origins explicitly listed in the ALLOWED_ORIGINS environment
 * variable (comma-separated, e.g. "https://example.org,https://www.example.org").
 */
function allowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  return new Set(
    raw
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, "").toLowerCase())
      .filter(Boolean),
  );
}

export function setCors(res: VercelResponse): void {
  // Responses vary by Origin, so caches must not mix them up.
  res.setHeader("Vary", "Origin");

  const originHeader = res.req?.headers?.origin;
  const origin = typeof originHeader === "string" ? originHeader.replace(/\/+$/, "").toLowerCase() : "";
  if (!origin || !allowedOrigins().has(origin)) return; // no CORS headers => browser blocks cross-origin use

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Admin-Key");
  res.setHeader("Access-Control-Max-Age", "600");
}

/* ------------------------------------------------------------------ */
/* Admin authentication                                                */
/* ------------------------------------------------------------------ */

/**
 * Returns the configured admin password, or null if it is missing/blank.
 * There is intentionally NO fallback value: if ADMIN_PASSWORD is not set,
 * every admin operation is refused.
 */
function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (typeof pw !== "string" || pw.trim() === "") return null;
  return pw;
}

/** Constant-time string comparison (hashing first so lengths don't leak). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export type PasswordCheck = "ok" | "invalid" | "unconfigured";

export function checkAdminPassword(candidate: unknown): PasswordCheck {
  const expected = getAdminPassword();
  if (expected === null) return "unconfigured";
  if (typeof candidate !== "string" || candidate.length === 0 || candidate.length > 512) return "invalid";
  return safeEqual(candidate, expected) ? "ok" : "invalid";
}

/** Sends the appropriate error response for a failed check. */
export function rejectPasswordCheck(res: VercelResponse, result: Exclude<PasswordCheck, "ok">): void {
  if (result === "unconfigured") {
    // Details go to server logs only; the client just learns admin is unavailable.
    console.error("ADMIN_PASSWORD environment variable is not set; refusing admin request.");
    res.status(503).json({ error: "Admin access is not configured" });
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const result = checkAdminPassword(req.headers["x-admin-key"]);
  if (result === "ok") return true;
  rejectPasswordCheck(res, result);
  return false;
}
