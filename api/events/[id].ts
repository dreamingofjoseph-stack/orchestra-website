import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql, camel, nullish } from "../_db";
import { setCors, requireAdmin } from "../_auth";
import { validateBody, eventSchema } from "../_validate";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const id = parseInt(req.query.id as string, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const sql = getSql();

    if (req.method === "PATCH") {
      if (!requireAdmin(req, res)) return;
      const v = validateBody(req.body, eventSchema, "update");
      if (!v.ok) return res.status(400).json({ error: v.error });
      const { title, date, time, description, category, imageUrl } = v.data as Record<string, any>;
      const rows = await sql`
        UPDATE events SET
          title = COALESCE(${title ?? null}::text, title),
          date = COALESCE(${date ?? null}::text, date),
          time = COALESCE(${time ?? null}::text, time),
          description = COALESCE(${description ?? null}::text, description),
          category = COALESCE(${category ?? null}::text, category),
          image_url = CASE WHEN ${imageUrl !== undefined} THEN ${nullish(imageUrl)} ELSE image_url END,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(camel(rows[0]));
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req, res)) return;
      await sql`DELETE FROM events WHERE id = ${id}`;
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
