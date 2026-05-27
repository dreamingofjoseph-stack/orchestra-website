# NCHS Orchestra Website

A public-facing multi-page school orchestra website with a CMS admin panel for managing all content.

## Run & Operate

- `pnpm --filter @workspace/nchs-orchestra run dev` — run the frontend (Vite dev server)
- `pnpm --filter @workspace/api-server run dev` — run the local admin API server (Express, JSON file–based)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/nchs-orchestra)
- Local admin API: Express 5, reads/writes JSON files (no database)
- Production API: Vercel serverless functions in `api/` using `@neondatabase/serverless` (raw SQL)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nchs-orchestra/` — public-facing React + Vite site
- `artifacts/api-server/` — local-only Express API server (reads/writes JSON files)
- `api/` — Vercel serverless functions (production, uses Neon PostgreSQL)
- `api/_db.ts` — shared `getSql()` / `camel()` / `nullish()` helpers for serverless functions
- `api/_auth.ts` — shared `setCors()` / `requireAdmin()` helpers
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for API shape)
- `lib/api-client-react/` — generated React Query hooks (used by all pages + admin panel)
- `lib/api-zod/` — generated Zod schemas
- `lib/db/` — Drizzle schema + `drizzle-kit push` for creating Neon tables
- `vercel.json` — Vercel deployment config (workspace root)

## Architecture decisions

- **Dual API layer.** Locally, `artifacts/api-server` (Express, JSON files) handles all `/api/*` requests via the Replit proxy. On Vercel, `api/` serverless functions handle those same routes using Neon PostgreSQL.
- **Public site uses API hooks.** All public pages use `useListXxx` hooks from `@workspace/api-client-react`, which call `/api/*`. Works both locally (hits Express) and on Vercel (hits serverless functions).
- **Admin is a slide-in drawer.** Accessible via More → Edit Site in the nav. Uses the same API hooks with `X-Admin-Key` header. Password stored in `localStorage` after login.
- **Vercel deployment:** `vercel.json` at the repo root points to the Vite build output. The `/((?!api/).*)` rewrite sends all non-API routes to `index.html` for client-side routing.
- **BASE_PATH aware.** `vite.config.ts` reads `BASE_PATH` env var (defaults to `/`) so the same build works in Replit (sub-path) and on Vercel (root).

## Product

- **Home** — hero + upcoming concerts pulled from API
- **Concerts** — full concert listings with date/venue/status
- **Concert Programs** — digital program booklet archive
- **Events** — upcoming department events
- **Opportunities** — student auditions, competitions, special ensembles
- **Orchestra Board & Leaders** — board member cards
- **Boosters/Fundraisers** — donation link (Zeffy) + booster officers contact list
- **Admin panel** (More → Edit Site) — password-gated CMS for all content types

## User preferences

- Purple/silver theme throughout
- Admin password: `NCHSORCHESTRAADMIN`
- Booster officers pre-seeded: Donna Fischer (President), Tina Erickson (Secretary), Susan Carroll (Orchestra Representative)

## Vercel + Neon Setup (one-time)

1. Create a Neon project at neon.tech and copy the connection string.
2. In Vercel project settings → Environment Variables, add:
   - `DATABASE_URL` — your Neon connection string
   - `ADMIN_PASSWORD` — `NCHSORCHESTRAADMIN` (or custom)
3. Create tables: set `DATABASE_URL` locally then run `pnpm --filter @workspace/db run push`
4. Seed initial data from JSON files: `pnpm --filter @workspace/scripts run seed-db`
5. Deploy: push to GitHub and Vercel auto-deploys.

## Gotchas

- The local Express server (`api-server`) and the Vercel serverless functions (`api/`) are two separate implementations of the same API contract. Edits via admin locally update JSON files; edits on Vercel update the Neon DB.
- The `api/` serverless functions require `DATABASE_URL` env var. If not set, they throw a clear error.
- `DATA_DIR` env var overrides the default JSON data directory path in the local API server.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
