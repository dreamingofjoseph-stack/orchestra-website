/**
 * Minimal, dependency-free request body validation for admin endpoints.
 *
 * Design notes:
 * - Only fields declared in the schema are returned; unknown fields are dropped.
 * - "create" mode enforces required fields. "update" (PATCH) mode only
 *   validates fields that are present, but required fields may not be blank.
 * - Absent optional fields come back as `undefined` so handlers can keep
 *   applying their existing defaults / "leave unchanged" behaviour.
 * - Values are length-capped and URL schemes are restricted to http(s) so that
 *   stored values can never be `javascript:` / `data:` URLs.
 */

type TextSpec = { kind: "text"; required?: boolean; max: number; nullable?: boolean };
type EnumSpec = { kind: "enum"; required?: boolean; values: readonly string[] };
type EmailSpec = { kind: "email"; required?: boolean; max?: number };
type DateSpec = { kind: "date"; required?: boolean };
type UrlSpec = { kind: "url"; required?: boolean; nullable?: boolean };
type ImageSpec = { kind: "image"; required?: boolean; nullable?: boolean };
type IntSpec = { kind: "int"; required?: boolean; min: number; max: number };

export type FieldSpec = TextSpec | EnumSpec | EmailSpec | DateSpec | UrlSpec | ImageSpec | IntSpec;
export type Schema = Record<string, FieldSpec>;
export type Mode = "create" | "update";

export type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

const MAX_URL_LENGTH = 2048;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
// Control characters other than tab / newline / carriage return.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const isBlank = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

function isRealIsoDate(value: string): boolean {
  const m = ISO_DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Returns a normalised http(s) URL string, or null if the value is not acceptable. */
function normaliseHttpUrl(raw: string): string | null {
  let value = raw.trim();
  if (value.length > MAX_URL_LENGTH || /\s/.test(value)) return null;
  if (value.startsWith("//")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    // Has an explicit scheme: only http / https are allowed.
    if (!/^https?:\/\//i.test(value)) return null;
  } else {
    // Admins often type "example.com/page" without a scheme.
    value = `https://${value}`;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * Image URLs may be an http(s) URL or a same-site relative path such as the
 * `/api/storage/objects/...` paths produced by the admin image uploader.
 */
function normaliseImageUrl(raw: string): string | null {
  const value = raw.trim();
  if (value.length > MAX_URL_LENGTH || /\s/.test(value)) return null;
  if (value.startsWith("/")) {
    if (value.startsWith("//") || value.includes("\\") || value.includes("..")) return null;
    return value;
  }
  if (!/^https?:\/\//i.test(value)) return null;
  return normaliseHttpUrl(value);
}

function validateField(name: string, spec: FieldSpec, value: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  const fail = (msg: string) => ({ ok: false as const, error: `${name}: ${msg}` });

  // Blank handling (empty string / null).
  if (isBlank(value)) {
    if (spec.required) return fail("is required");
    if (spec.kind === "text" || spec.kind === "url" || spec.kind === "image") {
      // Nullable columns store NULL; non-nullable text columns store "".
      return { ok: true, value: spec.nullable ? null : "" };
    }
    // Optional non-text fields (enum / int / date / email) treated as "not provided".
    return { ok: true, value: undefined };
  }

  switch (spec.kind) {
    case "text": {
      if (typeof value !== "string") return fail("must be a string");
      const v = value.trim();
      if (v.length > spec.max) return fail(`must be at most ${spec.max} characters`);
      if (CONTROL_CHARS_RE.test(v)) return fail("contains invalid characters");
      return { ok: true, value: v };
    }
    case "enum": {
      if (typeof value !== "string" || !spec.values.includes(value)) {
        return fail(`must be one of: ${spec.values.join(", ")}`);
      }
      return { ok: true, value };
    }
    case "email": {
      if (typeof value !== "string") return fail("must be a string");
      const v = value.trim();
      if (v.length > (spec.max ?? 254) || !EMAIL_RE.test(v)) return fail("must be a valid email address");
      return { ok: true, value: v };
    }
    case "date": {
      if (typeof value !== "string") return fail("must be a string");
      const v = value.trim();
      if (v.length > 40) return fail("is too long");
      if (ISO_DATE_RE.test(v)) {
        if (!isRealIsoDate(v)) return fail("is not a real calendar date");
      } else if (Number.isNaN(Date.parse(v))) {
        // The site also understands other human-readable dates, but the value must parse.
        return fail("must be a valid date (preferably YYYY-MM-DD)");
      }
      return { ok: true, value: v };
    }
    case "url": {
      if (typeof value !== "string") return fail("must be a string");
      const normalised = normaliseHttpUrl(value);
      if (!normalised) return fail("must be a valid http(s) URL");
      return { ok: true, value: normalised };
    }
    case "image": {
      if (typeof value !== "string") return fail("must be a string");
      const normalised = normaliseImageUrl(value);
      if (!normalised) return fail("must be an http(s) URL or an uploaded image path");
      return { ok: true, value: normalised };
    }
    case "int": {
      const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
      if (!Number.isInteger(n) || n < spec.min || n > spec.max) {
        return fail(`must be a whole number between ${spec.min} and ${spec.max}`);
      }
      return { ok: true, value: n };
    }
  }
}

export function validateBody(body: unknown, schema: Schema, mode: Mode): ValidationResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const input = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  for (const [name, spec] of Object.entries(schema)) {
    const present = Object.prototype.hasOwnProperty.call(input, name);

    if (!present) {
      if (mode === "create" && spec.required) {
        return { ok: false, error: `${name}: is required` };
      }
      continue; // leave undefined -> handler defaults / "unchanged" semantics
    }

    const result = validateField(name, spec, input[name]);
    if (!result.ok) return { ok: false, error: result.error };
    if (result.value !== undefined) data[name] = result.value;
  }

  return { ok: true, data };
}

/* ------------------------------------------------------------------ */
/* Per-resource schemas (kept in one place so POST and PATCH agree).   */
/* ------------------------------------------------------------------ */

export const concertSchema: Schema = {
  title: { kind: "text", required: true, max: 200 },
  date: { kind: "date", required: true },
  time: { kind: "text", required: true, max: 50 },
  venue: { kind: "text", required: true, max: 200 },
  description: { kind: "text", required: true, max: 5000 },
  status: { kind: "enum", values: ["upcoming", "past"] },
  imageUrl: { kind: "image", nullable: true },
};

export const eventSchema: Schema = {
  title: { kind: "text", required: true, max: 200 },
  date: { kind: "date", required: true },
  time: { kind: "text", required: true, max: 50 },
  description: { kind: "text", max: 5000 },
  category: { kind: "text", max: 100 },
  imageUrl: { kind: "image", nullable: true },
};

export const opportunitySchema: Schema = {
  title: { kind: "text", required: true, max: 200 },
  description: { kind: "text", max: 5000 },
  deadline: { kind: "text", max: 100, nullable: true },
  link: { kind: "url", nullable: true },
  imageUrl: { kind: "image", nullable: true },
};

export const programSchema: Schema = {
  title: { kind: "text", required: true, max: 200 },
  date: { kind: "date", required: true },
  description: { kind: "text", max: 5000 },
  fileUrl: { kind: "url", nullable: true },
  imageUrl: { kind: "image", nullable: true },
};

export const boardMemberSchema: Schema = {
  name: { kind: "text", required: true, max: 200 },
  role: { kind: "text", required: true, max: 200 },
  bio: { kind: "text", max: 5000 },
  imageUrl: { kind: "image", nullable: true },
  sortOrder: { kind: "int", min: -100000, max: 100000 },
};

export const boosterSchema: Schema = {
  title: { kind: "text", required: true, max: 200 },
  description: { kind: "text", max: 5000 },
  type: { kind: "text", required: true, max: 100 },
  imageUrl: { kind: "image", nullable: true },
  sortOrder: { kind: "int", min: -100000, max: 100000 },
};

export const boosterOfficerSchema: Schema = {
  name: { kind: "text", required: true, max: 200 },
  role: { kind: "text", required: true, max: 200 },
  email: { kind: "email", required: true },
  sortOrder: { kind: "int", min: -100000, max: 100000 },
};
