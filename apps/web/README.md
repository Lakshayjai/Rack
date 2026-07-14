# web — Next.js frontend

The Wardrobe app UI: wardrobe grid with garment-extraction uploads, the outfit builder, the Fabric.js designer canvas, and the lookbook. Talks to the NestJS API (default `http://localhost:3005`) with credentialed requests.

Full setup is in the [root README](../../README.md).

## Run
```bash
pnpm --filter web dev        # http://localhost:3000
pnpm --filter web build
pnpm --filter web typecheck
pnpm --filter web lint
```

Copy `.env.example` → `.env.local` (just `NEXT_PUBLIC_API_URL`).

## Layout
- `src/app` — App Router pages: `(auth)` login/register, `(dashboard)` wardrobe / designer / outfits / outfits/new / settings. The root `/` redirects to `/outfits/new`.
- `src/components` — grouped by feature: `ui/` (design-system primitives), `layout/` (shell + nav), `canvas/` (Fabric.js designer), `wardrobe/` (grid, upload wizard, mask editor), `outfits/` (lookbook, calendar).
- `src/hooks` — data + session hooks (`useWardrobe`, `useOutfits`, `useAuth`, `useTheme`).
- `src/stores` — Zustand stores (auth session mirror, sessionStorage-persisted wardrobe cache).
- `src/lib` — `api.ts` fetch wrapper (all API calls go through it), `outfit-layout.ts` flat-lay geometry, `outfit-preview.ts` offscreen PNG rendering, constants.

Conventions: TypeScript strict; env access only via `src/lib/env.ts`; toasts via `useToast`; design system is the light "Atelier" ivory theme with an optional `.dark` espresso theme (`useTheme`).
