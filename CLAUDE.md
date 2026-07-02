# Wardrobe Designer App — Project Guide (CLAUDE.md)

A free, self-hosted **wardrobe manager + outfit designer**. Users upload clothing photos, backgrounds are auto-removed, items are organized by category/color/style, and a drag-and-drop Fabric.js canvas is used to compose, save, and track outfits. Personal alternative to Acloset/Fits.

## Stack
- **Frontend:** `apps/web` — Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Zustand, React Hook Form + Zod, Fabric.js v6, Radix UI, Lucide icons.
- **Backend:** `apps/api` — NestJS 11, TypeScript (strict), Prisma, Passport JWT, class-validator, @nestjs/throttler.
- **Shared:** `packages/shared-types` — domain types shared by both apps (built to `dist/` before use).
- **DB:** PostgreSQL via Docker (`docker-compose.yml`), host port **5433** (native Postgres occupies 5432).
- **Storage:** Cloudinary (user supplies keys in `apps/api/.env`).
- **Background removal:** local Python `rembg` microservice (`services/rembg`, port 7000); `remove.bg` API optional fallback.
- **Monorepo:** pnpm workspaces.

## Key local facts / decisions
- API runs on **port 3005** (spec said 3001, but another local app occupies 3001). Web on **3000**.
- Auth: JWT in an HTTP-only cookie (`access_token`), bcrypt 12 rounds. API and web are different origins; the authoritative auth check is a client call to `/auth/me` in `AuthGuard` (not middleware), since the cookie is host-scoped to `localhost`.
- All API routes are under `/api`; every route except `/auth/login` and `/auth/register` requires `JwtAuthGuard`; every query is scoped to `req.user.id`.
- Fonts (override of original spec): **Cinzel** (display/headings/logo), **Original Surfer** (accent), **Inter** (body). Loaded in `apps/web/src/app/layout.tsx`.
- Design tokens + dark-default/light theme live in `apps/web/src/app/globals.css` (`.light` class toggles light mode via `useTheme`).

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
