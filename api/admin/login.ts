import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors, checkAdminPassword, rejectPasswordCheck } from "../_auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const password = req.body && typeof req.body === "object" ? (req.body as { password?: unknown }).password : undefined;
  const result = checkAdminPassword(password);

  if (result === "ok") return res.json({ ok: true });
  if (result === "unconfigured") return rejectPasswordCheck(res, result);
  return res.status(401).json({ error: "Incorrect password" });
}
