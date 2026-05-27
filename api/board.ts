import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql, camel, nullish } from "./_db";
import { setCors, requireAdmin } from "./_auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM board_members ORDER BY sort_order ASC`;
      return res.json(rows.map(camel));
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return;
      const { name, role, bio = "", imageUrl, sortOrder = 0 } = req.body ?? {};
      if (!name || !role) return res.status(400).json({ error: "Missing required fields" });
      const rows = await sql`
        INSERT INTO board_members (name, role, bio, image_url, sort_order)
        VALUES (${name}, ${role}, ${bio}, ${nullish(imageUrl)}, ${Number(sortOrder)})
        RETURNING *
      `;
      return res.status(201).json(camel(rows[0]));
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
