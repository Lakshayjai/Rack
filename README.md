# Wardrobe Designer

A free, self-hosted **wardrobe manager and drag-and-drop outfit designer**. Photograph your clothes, the app removes the background automatically, organize items by category/color/style, then compose outfits on an interactive canvas and track when you wear them.

Minimal, editorial, dark-by-default UI. Personal alternative to paid apps like Acloset/Fits — full data ownership, no subscription.

> Architecture, conventions, and the phase roadmap live in [CLAUDE.md](./CLAUDE.md).

## Features
- **Auth** — register / login / logout, JWT in an HTTP-only cookie
- **Wardrobe** — upload photos (JPG/PNG/WebP, ≤5MB), automatic background removal, categories/colors/styles/occasions, grid with search + filters, edit/delete
- **Designer** — Fabric.js canvas: drag items in, layer, undo/redo, drop-zone guides, save/load, export a PNG preview
- **Gallery** — grid + calendar of saved outfits, worn-date tracking, detail view, sort (newest / most worn / A–Z)
- **Polish** — dark mode default (+ light toggle), skeletons, error boundary, toasts, mobile bottom-nav + responsive canvas

## Tech stack
Next.js 16 (App Router) · NestJS 11 · PostgreSQL + Prisma · Fabric.js v6 · Tailwind v4 · Zustand · Cloudinary (optional) · local `rembg` · pnpm workspaces.

## Prerequisites
- **Node 20+** and **pnpm 9+** (`npm i -g pnpm`)
- **Docker Desktop** (PostgreSQL)
- **Python 3.11+** (the `rembg` background-removal service)
- *(Optional)* a free **Cloudinary** account — without it, images are stored locally on disk

## Setup
```bash
pnpm install

# env files
cp apps/api/.env.example apps/api/.env        # optionally fill CLOUDINARY_* (else local storage is used)
cp apps/web/.env.example apps/web/.env.local

# database (Postgres on host port 5433 to avoid clashing with a native Postgres on 5432)
pnpm db:up
pnpm --filter shared-types build
cd apps/api && pnpm exec prisma migrate dev && cd ../..

# background-removal service (first run downloads a ~176MB model)
cd services/rembg
python -m venv .venv && .venv\Scripts\pip install -r requirements.txt   # Windows
# (macOS/Linux: source .venv/bin/activate && pip install -r requirements.txt)
python app.py            # http://localhost:7000  — leave running
```

Then, in the repo root:
```bash
pnpm dev                 # web → http://localhost:3000, api → http://localhost:3005/api
```

Register an account, upload a clothing photo, and start designing.

## Image storage
- **Local (default):** if Cloudinary env vars are absent, processed images are saved to `apps/api/uploads/` and served at `/uploads` (CORS-enabled for the canvas). Works with zero signup.
- **Cloudinary:** set `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` in `apps/api/.env` to use the CDN + transforms instead.

## Background removal
Runs against the local `rembg` service (`REMBG_URL`). If it's unreachable and `REMOVE_BG_API_KEY` is set, the API falls back to remove.bg; otherwise the resized image is stored without removal so uploads never hard-fail.

## Scripts
```bash
pnpm dev            # run web + api
pnpm dev:web        # web only
pnpm dev:api        # api only
pnpm build          # build shared-types, api, web
pnpm db:up / db:down
pnpm rembg          # run the Python service (venv must be set up)
```

## Ports
| Service | Port |
|---|---|
| Web (Next.js) | 3000 |
| API (NestJS) | 3005 |
| rembg | 7000 |
| PostgreSQL | 5433 |

## Project layout
```
apps/web            Next.js frontend
apps/api            NestJS API (auth, users, items, outfits, upload, image-processing, prisma)
packages/shared-types   types shared across web + api
services/rembg      Python background-removal microservice
docker-compose.yml  PostgreSQL
```
