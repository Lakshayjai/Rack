# Wardrobe Designer App — Project Guide (CLAUDE.md)

A free, self-hosted **wardrobe manager + outfit designer**. Users upload clothing photos, backgrounds are auto-removed, items are organized by category/color/style, and a drag-and-drop Fabric.js canvas is used to compose, save, and track outfits. Personal alternative to Acloset/Fits.

## Stack
- **Frontend:** `apps/web` — Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Zustand, React Hook Form + Zod, Fabric.js v6, Radix UI, Lucide icons.
- **Backend:** `apps/api` — NestJS 11, TypeScript (strict), Prisma, Passport JWT, class-validator, @nestjs/throttler.
- **Shared:** `packages/shared-types` — domain types shared by both apps (built to `dist/` before use).
- **DB:** PostgreSQL via Docker (`docker-compose.yml`), host port **5433** (native Postgres occupies 5432).
- **Storage:** Cloudinary (user supplies keys in `apps/api/.env`).
- **Background removal / garment extraction:** local Python microservice (`services/rembg`, port 7000). `POST /extract` runs `u2net_cloth_seg` (parses worn photos into upper/lower/full-body garment cutouts, removing the person) + `isnet-general-use` whole-foreground removal, with OpenCV mask cleanup and PyMatting alpha matting; returns JSON candidates. `POST /remove` is the legacy single-PNG endpoint; `remove.bg` API optional fallback. Models download to `~/.u2net` on first use (~170MB each).
- **Monorepo:** pnpm workspaces.

## Key local facts / decisions
- API runs on **port 3005** (spec said 3001, but another local app occupies 3001). Web on **3000**.
- Auth: JWT in an HTTP-only cookie (`access_token`), bcrypt 12 rounds. API and web are different origins; the authoritative auth check is a client call to `/auth/me` in `AuthGuard` (not middleware), since the cookie is host-scoped to `localhost`.
- All API routes are under `/api`; every route except `/auth/login` and `/auth/register` requires `JwtAuthGuard`; every query is scoped to `req.user.id`.
- Design system ("Atelier", redesigned 2026-07): **light-luxury ivory palette is the DEFAULT** (warm ivory surfaces, hairline taupe borders, ink text, antique-gold accent), sharp editorial edges (rounded-none), uppercase letter-spaced labels, `shadow-plume` soft shadows, `.eyebrow`/`.rule-gold` helpers. `.dark` class on `<html>` switches to an optional espresso "evening" theme via `useTheme`.
- Fonts: **Cinzel** (display/wordmark/titles), **Cormorant Garamond** (editorial serif italics — `font-serif`), **Jost** (body/UI). Loaded in `apps/web/src/app/layout.tsx`.
- Voice: pages are titled editorially — Wardrobe = "The Collection", Designer = "Composition Room", Outfits = "The Lookbook".
- Upload flow (2026-07): photo → `POST /api/items/extract` (candidate cutouts + confidence) → user picks/refines (brush/eraser `MaskEditor`) → `POST /api/items` with `imageData` (base64). Falls back to the classic file upload when the service is down. Cutouts are normalized server-side (`normalizeCutout`: trim + 4% pad + ≤800px).
- Category `DRESS` is displayed as **"Full-body"** (gender-neutral: dresses, jumpsuits, co-ord sets) via `CATEGORY_LABELS`; all categories are offered to every gender, subtypes stay gender-tailored.
- Outfit builder: `/outfits/new` (slot picker + live preview) → `/designer?items=…` auto-arranges via `apps/web/src/lib/outfit-layout.ts` (pure flat-lay layout fn, shared by preview + Fabric canvas). Outfits have `tags` (String[]); `POST /api/outfits/:id/duplicate` copies a look.
- Ethnic / Indian Wear (2026-07): garments live in `ETHNIC_WEAR` (shared-types) — each maps a subtype (saree, kurta, juttis, dupatta…) onto a structural category, so slots/zones/filters keep working. `styles` gained `ethnic`; `occasions` gained `wedding|festival|puja`. Upload modal + wardrobe filter show an "ethnic / indian" group (`GET /api/items?ethnic=true` matches ethnic subtype OR style). Dupatta/stole get their own `drape` layout role. Items can be linked as sets via `ClothingItem.pairedItemIds` (edit modal "Pairs with"; the builder badges + front-sorts paired pieces).
- Outfit previews: saving in the designer always exports the collage PNG (`lib/outfit-preview.ts` renders saved canvas states offscreen for the modal's "Regenerate preview" and the Lookbook's missing-preview backfill banner).
- **Home page is `/outfits/new`** ("Make Outfit", first nav item): root `/`, login, and wordmark links all land there. Fresh signups still go to `/wardrobe` (empty closet can't compose). Nav active-state uses `isNavActive` in `apps/web/src/components/layout/nav.ts` (longest-prefix wins, so `/outfits/new` doesn't also highlight "Outfits").

## Commands
```bash
pnpm install                      # install all workspaces
pnpm --filter shared-types build  # build shared types (needed before api/web build)
pnpm db:up                        # start Postgres (docker compose)
pnpm --filter api exec prisma migrate dev   # run migrations (from apps/api)
pnpm rembg                        # start the Python rembg service (Phase 2+)
pnpm dev                          # run web + api together
pnpm --filter web typecheck       # web type check
pnpm --filter api build           # api build/type check
```
Environment: copy `apps/api/.env.example` → `apps/api/.env` (fill Cloudinary), and `apps/web/.env.example` → `apps/web/.env.local`.

## Build phases
1. **Foundation** ✅ — monorepo, Prisma, auth (register/login/logout/me), dashboard shell, auth pages, design system.
2. **Wardrobe core** ✅ — items module, image pipeline (sharp → rembg → Cloudinary/local), wardrobe grid/upload/filters.
3. **Designer canvas** ✅ — Fabric.js v6 canvas, drag-drop, zones, layers, undo/redo, save/load, export PNG.
4. **Outfit gallery** ✅ — gallery grid, calendar (worn dates), detail modal, sort.
5. **Polish** ✅ — skeletons, error boundary, not-found, toasts, mobile bottom-nav, canvas CORS for local uploads, README.

## Storage note
Images use Cloudinary when `CLOUDINARY_*` is configured, otherwise a local-disk fallback served at `/uploads`
(with `Access-Control-Allow-Origin: *` so the Fabric canvas can load + export them untainted). Images are added with
`crossOrigin: 'anonymous'` so reloaded/exported canvases aren't tainted.

## Conventions
- TypeScript strict in both apps; avoid `any` (comment when unavoidable).
- Config only via typed modules: `apps/api/src/config/configuration.ts`, `apps/web/src/lib/env.ts`.
- Frontend API calls go through `apps/web/src/lib/api.ts` (sends credentials). Toasts via `useToast`.
- Never commit `.env*` (see `.gitignore`).
