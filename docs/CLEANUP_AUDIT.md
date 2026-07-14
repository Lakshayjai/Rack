# Cleanup Audit — Rack monorepo

Audit date: 2026-07-14. Scope: every tracked file in `apps/web`, `apps/api`,
`services/rembg`, `packages/shared-types`, and the repo root.

Overall assessment: the codebase is small (~9k lines of source), consistently
styled, and already well-commented. There is no commented-out code, no TODO/FIXME
debt, and error handling is uniform (Nest exceptions on the API, `ApiError` +
toasts on the web). The cleanup below is therefore targeted, not structural.

---

## 1. Safe to delete

### Boilerplate never customized
| Path | Why |
|---|---|
| `apps/web/public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Default create-next-app assets; zero references anywhere in `src/`. |
| `apps/api/test/app.e2e-spec.ts` | Untouched Nest starter test. It asserts `GET /` returns `"Hello World!"` — that route does not exist (all routes live under `/api`), so it can never pass. |
| `apps/api/test/jest-e2e.json` | Config only for the deleted boilerplate spec. |
| `apps/api` scripts `test:e2e`, `test:debug`, `test:watch`, `test:cov` | Reference the deleted e2e config / ts-node. The plain `test` script stays (with `--passWithNoTests`) so unit testing remains one command away. |
| `apps/api/README.md`, `apps/web/README.md` contents | Framework-generated marketing text (NestJS sponsor links, create-next-app tutorial). Replaced with short real READMEs in Phase 4. |

### Unused dependencies
| Package | Where | Evidence |
|---|---|---|
| `react-window`, `@types/react-window` | web | No import in `src/`. |
| `@radix-ui/react-select`, `@radix-ui/react-popover` | web | Only `@radix-ui/react-dialog` is used (Modal). Selects are native `<select>`. |
| `supertest`, `@types/supertest` | api | Only used by the deleted boilerplate e2e spec. |
| `ts-loader` | api | Only needed for webpack builds; `nest build` here uses tsc. |
| `ts-node`, `tsconfig-paths` | api | Only referenced by the deleted `test:debug` script. |
| `source-map-support` | api | Never imported. |

### Unused exports (verified: no references in any workspace)
| Export | File |
|---|---|
| `ETHNIC_GROUP_ICON` | `apps/web/src/lib/wardrobe-constants.ts` |
| `HEX_BY_COLOR` | `apps/web/src/lib/wardrobe-constants.ts` |
| `setLoaded` store action | `apps/web/src/stores/wardrobeStore.ts` (`setItems` already sets `loaded`) |
| `isEthnicItem()` | `packages/shared-types/src/clothing.ts` (the API implements this filter directly in Prisma; the web never classifies client-side) |

### Debug logging
- `apps/api/src/main.ts` — one `console.log` (startup banner) with an eslint-disable.
  Replaced with Nest `Logger` (the only intentional logging style used everywhere else).

## 2. Needs refactor (behavior-preserving)

1. **`toPublicUser` duplicated 4×** — the Prisma `User` → `PublicUser` mapping is
   repeated in `auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, and
   `users.service.ts`. → extract one `toPublicUser()` helper (`users/public-user.mapper.ts`).
2. **`toStringArray` DTO transform duplicated** in `items/dto/create-item.dto.ts`
   and `items/dto/update-item.dto.ts` (with subtly different undefined-handling).
   → shared `common/dto-transforms.ts` with both variants documented.
3. **`UploadModal.tsx` is 697 lines** — a 3-step wizard in one file. → split the
   review and details steps into their own components under
   `components/wardrobe/upload/`, and move the shared chip/checkerboard helpers out.
4. **Small duplicated UI helpers** — `toggle()` (UploadModal + EditItemModal),
   `ChipRow`/`ChipField` (same component twice), the `CHECKER` transparency-
   checkerboard style (UploadModal + MaskEditor), and the outfit-tag preset chips
   block (designer page + outfits/new page). → one shared module each.
5. **`useAuth.refresh`** contains `if (401) setUser(null) else setUser(null)` —
   both branches identical. → collapse.
6. **`PaginatedItems` / `PaginatedOutfits` defined twice** — once in the API
   services, once in the web hooks. **`UserStats` defined twice** — in
   `users.service.ts` and inline in `settings/page.tsx`. → move a `Paginated<T>`
   envelope and `UserStats` into `packages/shared-types` (Phase 5).
7. **Stale docs**: root `README.md` still says "dark-by-default UI" (the Atelier
   redesign made light ivory the default); `shared-types/clothing.ts` says
   "DRESS is shown only for female users" (it is now the gender-neutral
   "Full-body" category); `services/rembg/README.md` doesn't document `/extract`.

## 3. Leave as-is (and why)

| Item | Why left alone |
|---|---|
| `Topbar` search input (does nothing) | Decorative element of the design system; wiring it up or removing it is a product decision, not cleanup. Flagged here so it isn't forgotten. |
| `categoriesFor(_gender)` ignoring its argument | Intentional and documented: every gender gets all categories since the "Full-body" rename; the signature is kept so call sites don't churn if per-gender lists return. |
| `EXTRACTION_LABELS` const in shared-types | Looks unused but derives the `ExtractionLabel` union type. |
| `cloudinaryTransform()` exported though only `thumb()` calls it | Reasonable public utility; unexporting saves nothing. |
| Designer / outfits-new pages (~350 lines each) | Page-level orchestrators with clear internal sections; splitting them would scatter tightly coupled state without making them easier to read. |
| `apps/web/.gitignore` | Redundant with the root ignore file except for `next-env.d.ts`; standard create-next-app file, harmless. |
| Service-only API modules (`upload`, `image-processing`, `prisma`) having no controller/dto | Deliberate: they are internal providers, not HTTP surfaces. The four HTTP modules (auth, users, items, outfits) all follow the full `module/controller/service/dto` shape. |
| Prisma `String` columns for enum-like fields (`category`, `gender`) | Changing to native enums means a migration; explicitly out of scope ("never change schema"). Validation is enforced at the DTO layer. |
| `(dto.x !== undefined && { x: dto.x })` spread pattern in update methods | Idiomatic Prisma partial-update style, used consistently. |
| Web `tsconfig`/`eslint`/`postcss`/`next.config.ts` | All customized and current; nothing generated left over. |

## 4. What changed

_Filled in at the end of the cleanup — see the final section of this file._
