import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql, camel, nullish } from "./_db";
import { setCors, requireAdmin } from "./_auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM concerts ORDER BY date ASC`;
      return res.json(rows.map(camel));
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return;
      const { title, date, time, venue, description, status = "upcoming", imageUrl } = req.body ?? {};
      if (!title || !date || !time || !venue || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const rows = await sql`
        INSERT INTO concerts (title, date, time, venue, description, status, image_url)
        VALUES (${title}, ${date}, ${time}, ${venue}, ${description}, ${status}, ${nullish(imageUrl)})
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
