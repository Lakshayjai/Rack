# Wardrobe Designer

A free, self-hosted **wardrobe manager and drag-and-drop outfit designer**. Photograph your clothes (worn or flat-lay), the app extracts each garment and removes the person/background automatically, organizes pieces by category/color/style, and composes outfits as styled flat-lay collages on an interactive canvas — with worn-date tracking.

Light-luxury editorial UI ("Atelier": ivory by default, optional espresso evening theme). Personal alternative to paid apps like Acloset/Fits — full data ownership, no subscription.

> Architecture decisions, conventions, and the phase roadmap live in [CLAUDE.md](./CLAUDE.md). A record of the 2026-07 cleanup pass is in [docs/CLEANUP_AUDIT.md](./docs/CLEANUP_AUDIT.md).

## Features
- **Auth** — register / login / logout, JWT in an HTTP-only cookie (or set `AUTH_DISABLED=true` for a personal no-login setup)
- **Wardrobe ("The Collection")** — upload a photo (JPG/PNG/WebP, ≤5MB); garment extraction proposes cutouts (shirt AND pants from one worn photo), each refinable with a brush/eraser mask editor; categories, gender-tailored garment types, Indian/ethnic wear group, colors, styles, occasions, "pairs with" set linking, search + filters
- **Make Outfit** (home page) — pick pieces by slot and watch the flat-lay compose itself, then fine-tune in the designer
- **Designer ("Composition Room")** — Fabric.js canvas: drag items, layer, swap pieces, undo/redo, auto-arrange, save/load, PNG export on every save
- **Lookbook** — outfit grid + wear calendar, tags, duplicate, preview regeneration, sort (newest / most worn / A–Z)

## Tech stack
Next.js 16 (App Router) · NestJS 11 · PostgreSQL + Prisma · Fabric.js v6 · Tailwind v4 · Zustand · Cloudinary (optional) · Python FastAPI + rembg · pnpm workspaces.

## Prerequisites
- **Node 20+** and **pnpm 9+** (`npm i -g pnpm`)
- **Docker Desktop** (runs PostgreSQL via `docker-compose.yml`)
- **Python 3.11+** (the `rembg` garment-extraction service)
- *(Optional)* a free **Cloudinary** account — without it, images are stored locally on disk

## Setup

```bash
pnpm install

# 1. Env files — see the comments inside each example file
cp apps/api/.env.example apps/api/.env        # DB url, JWT secret, optional CLOUDINARY_* / REMBG_* overrides
cp apps/web/.env.example apps/web/.env.local  # NEXT_PUBLIC_API_URL (default http://localhost:3005)

# 2. Database (Postgres in Docker, host port 5433 to avoid clashing with a native Postgres on 5432)
pnpm db:up
pnpm --filter shared-types build              # shared types must be built before api/web
pnpm --filter api exec prisma migrate dev     # create tables

# 3. Garment-extraction service (first run downloads ~170MB per model into ~/.u2net)
cd services/rembg
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows  (macOS/Linux: source .venv/bin/activate && pip install -r requirements.txt)
cd ../..
pnpm rembg               # http://localhost:7000 — leave running
```

Then, in the repo root:
```bash
pnpm dev                 # web → http://localhost:3000, api → http://localhost:3005/api
```

Register an account, upload a clothing photo, and start designing.

## Running services individually
```bash
pnpm dev:web        # Next.js only (port 3000)
pnpm dev:api        # NestJS only (port 3005)
pnpm rembg          # Python extraction service (port 7000; venv must be set up)
pnpm db:up / pnpm db:down   # start/stop Postgres (docker compose up -d / down)
pnpm build          # build shared-types, then api, then web
```

## Image storage
- **Local (default):** if Cloudinary env vars are absent, processed images are saved to `apps/api/uploads/` and served at `/uploads` (CORS-enabled so the canvas can export untainted). Works with zero signup.
- **Cloudinary:** set `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` in `apps/api/.env` to use the CDN + transforms instead.

## Background removal / garment extraction
Uploads go to the local rembg service's `/extract` endpoint (cloth parsing + whole-foreground cutout, returned as candidates the user reviews). If the service is down, the API falls back to its legacy `/remove` endpoint, then to remove.bg (when `REMOVE_BG_API_KEY` is set), and finally stores the resized image as-is — uploads never hard-fail. See [services/rembg/README.md](./services/rembg/README.md).

## Ports
| Service | Port |
|---|---|
| Web (Next.js) | 3000 |
| API (NestJS) | 3005 |
| rembg (FastAPI) | 7000 |
| PostgreSQL (Docker) | 5433 |

## Monorepo layout — where to find what
```
apps/web                     Next.js frontend
  src/app/                   routes: (auth) login/register · (dashboard) wardrobe, designer, outfits, settings
  src/components/            by feature: ui/ layout/ canvas/ wardrobe/ outfits/
  src/hooks/                 useAuth, useWardrobe, useOutfits, useTheme
  src/stores/                Zustand stores (auth session, wardrobe cache)
  src/lib/                   api client, outfit flat-lay layout, preview renderer, constants
  src/types/canvas.ts        canvas controller contract + dimensions/zones
apps/api                     NestJS API — every module: *.module / *.controller / *.service / dto/
  src/auth                   JWT cookie auth (register/login/logout/me) + guard/strategy
  src/users                  profile + stats
  src/items                  wardrobe CRUD + /items/extract preview endpoint
  src/outfits                outfit CRUD, duplicate, export, worn dates
  src/upload                 Cloudinary / local-disk storage abstraction
  src/image-processing       sharp resize → rembg extraction → cutout normalization
  prisma/                    schema + migrations
packages/shared-types        domain types shared by web + api (build before either)
services/rembg               Python FastAPI garment-extraction microservice
docker-compose.yml           PostgreSQL
```
