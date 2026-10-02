import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql, camel, nullish } from "./_db";
import { setCors, requireAdmin } from "./_auth";
import { validateBody, opportunitySchema } from "./_validate";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM opportunities ORDER BY created_at ASC`;
      return res.json(rows.map(camel));
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return;
      const v = validateBody(req.body, opportunitySchema, "create");
      if (!v.ok) return res.status(400).json({ error: v.error });
      const { title, description = "", deadline, link, imageUrl } = v.data as Record<string, any>;
      const rows = await sql`
        INSERT INTO opportunities (title, description, deadline, link, image_url)
        VALUES (${title}, ${description}, ${nullish(deadline)}, ${nullish(link)}, ${nullish(imageUrl)})
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
