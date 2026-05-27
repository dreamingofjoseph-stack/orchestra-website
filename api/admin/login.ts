import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../_auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body ?? {};
  const pw = process.env.ADMIN_PASSWORD ?? "NCHSORCHESTRAADMIN";
  if (password === pw) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Incorrect password" });
}
