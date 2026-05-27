import type { VercelRequest, VercelResponse } from "@vercel/node";

export function setCors(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Admin-Key");
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const key = req.headers["x-admin-key"];
  const pw = process.env.ADMIN_PASSWORD ?? "NCHSORCHESTRAADMIN";
  if (key !== pw) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
