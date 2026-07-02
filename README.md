# Wardrobe Designer

A free, self-hosted wardrobe manager and drag-and-drop outfit designer.

> Full architecture & conventions live in [CLAUDE.md](./CLAUDE.md).

## Prerequisites
- Node 20+ and pnpm 9+ (`npm i -g pnpm`)
- Docker Desktop (for PostgreSQL)
- Python 3.11+ (for the `rembg` background-removal service — Phase 2+)
- A free [Cloudinary](https://cloudinary.com) account (image storage)

## Setup
```bash
pnpm install

# env files
cp apps/api/.env.example apps/api/.env       # then fill CLOUDINARY_* values
cp apps/web/.env.example apps/web/.env.local

# database
pnpm db:up                                    # starts Postgres on host port 5433
pnpm --filter shared-types build
cd apps/api && pnpm exec prisma migrate dev && cd ../..

# run everything
pnpm dev                                      # web → http://localhost:3000, api → http://localhost:3005
```

## Apps
- `apps/web` — Next.js frontend (`http://localhost:3000`)
- `apps/api` — NestJS API (`http://localhost:3005/api`)
- `packages/shared-types` — types shared across web + api
- `services/rembg` — Python background-removal microservice (added in Phase 2)

## Status
Phase 1 (Foundation) complete: auth, dashboard shell, design system. See [CLAUDE.md](./CLAUDE.md) for the phase roadmap.
