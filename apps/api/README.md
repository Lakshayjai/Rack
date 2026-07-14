# api — NestJS backend

REST API for the Wardrobe app: auth, wardrobe items, outfits, image processing and storage. All routes are prefixed with `/api`; every route except `/api/auth/login` and `/api/auth/register` requires the JWT auth cookie, and every query is scoped to the authenticated user.

Full setup (database, env, rembg service) is in the [root README](../../README.md).

## Run
```bash
pnpm --filter shared-types build   # once, before first build/run
pnpm --filter api start:dev        # watch mode on http://localhost:3005/api
pnpm --filter api build            # production build (also the type check)
pnpm --filter api lint
pnpm --filter api exec prisma migrate dev   # apply/create migrations
```

Copy `.env.example` → `.env` first. Notable flags: `AUTH_DISABLED=true` runs every request as the first DB user (personal/dev setups); `CLOUDINARY_*` switches storage from local disk to the CDN.

## Modules
| Module | Responsibility |
|---|---|
| `auth` | register/login/logout/me, JWT in an HTTP-only cookie, guard + strategy |
| `users` | profile updates (gender preference) and wardrobe stats |
| `items` | wardrobe CRUD, filtering/search, `/items/extract` cutout preview |
| `outfits` | outfit CRUD, duplicate, PNG export, worn-date tracking |
| `upload` | storage abstraction: Cloudinary when configured, else local `uploads/` |
| `image-processing` | sharp resize → rembg garment extraction → cutout normalization, with remove.bg fallback |
| `prisma` | global Prisma client tied to the Nest lifecycle |

HTTP modules follow the same shape: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`. Services throw Nest HTTP exceptions; controllers stay thin.
