# NCHS Orchestra Website

A public-facing multi-page school orchestra website with a CMS admin panel for managing all content.

## Run & Operate

- `pnpm --filter @workspace/nchs-orchestra run dev` — run the frontend (Vite dev server)
- `pnpm --filter @workspace/api-server run dev` — run the local admin API server (JSON file–based, no database needed)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/nchs-orchestra)
- Local admin API: Express 5, reads/writes JSON files (no database)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nchs-orchestra/` — public-facing React + Vite site
- `artifacts/nchs-orchestra/public/data/` — **source-of-truth JSON data files** (concerts, events, programs, etc.)
- `artifacts/api-server/` — local-only admin API server (reads/writes the JSON files above)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for API shape)
- `lib/api-client-react/` — generated React Query hooks (used by admin panel)
- `lib/api-zod/` — generated Zod schemas
- `vercel.json` — Vercel deployment config (workspace root)

## Architecture decisions

- **No database required.** All data lives in `artifacts/nchs-orchestra/public/data/*.json` files committed to the repo. The public site reads from these static files directly via `fetch()` — no backend needed on Vercel.
- **Public site = static.** Pages use `src/lib/useData.ts` hooks (React Query + `fetch('/data/*.json')`), not the generated API client. Data URLs use `import.meta.env.BASE_URL` as a prefix so they work both locally (non-root base path) and on Vercel (root).
- **Admin is local-only.** The Express API server runs locally (no DB, just reads/writes the JSON files). After editing content via `/admin`, commit the updated JSON files and push — Vercel auto-redeploys. Admin password: `NCHSORCHESTRAADMIN`.
- **Vercel deployment:** `vercel.json` at the repo root points to the Vite build output (`artifacts/nchs-orchestra/dist/public`). All routes rewrite to `index.html` for client-side routing.
- **BASE_PATH aware.** `vite.config.ts` reads `BASE_PATH` env var (defaults to `/`) so the same build works in Replit (sub-path) and on Vercel (root).

## Product

- **Home** — hero + upcoming concerts pulled from JSON
- **Concerts** — full concert listings with date/venue/status
- **Concert Programs** — digital program booklet archive
- **Events** — upcoming department events (past events auto-hidden)
- **Opportunities** — student auditions, competitions, special ensembles
- **Orchestra Board & Leaders** — board member cards
- **Boosters/Fundraisers** — donation link (Zeffy) + booster officers contact list
- **Admin panel** (`/admin`) — password-gated CMS for all content types

## User preferences

- Purple/silver theme throughout
- Admin password: `NCHSORCHESTRAADMIN`
- Booster officers pre-seeded: Donna Fischer (President), Tina Erickson (Secretary), Susan Carroll (Orchestra Representative)

## Gotchas

- After editing data via the admin panel locally, commit and push the updated `public/data/*.json` files so Vercel picks up the changes.
- The admin panel uses the generated API client hooks (calls `/api/*`), which only work when the local API server is running. On Vercel, admin mutations will not work — admin is for local use only.
- `DATA_DIR` env var overrides the default JSON data directory path in the API server (useful if running the server from a non-standard location).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
