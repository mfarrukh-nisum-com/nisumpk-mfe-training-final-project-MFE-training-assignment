# Final MFE Project — Micro-Storefront Platform

## Overview

A production-shaped Micro Frontend platform for a small storefront: a **Gateway/Shell**
composes three independently built, independently deployable Micro Frontends
(**Product**, **Cart**, **Orders**) at runtime via **Webpack Module Federation**,
backed by an **Express + JSON-file** API. Cross-MFE communication uses both a
**shared Zustand store** and a **global browser event bus** (`window.NISUM`),
and the whole thing lives in one **npm-workspaces + Nx** monorepo with CI/CD
via GitHub Actions (build, test, and — for CD — a real Docker image push to
GitHub Container Registry).

## Business Scenario

An e-commerce storefront split by team ownership:

| MFE | Business responsibility | Owning team (hypothetical) |
|---|---|---|
| Gateway | Shell, layout, nav, routing, remote composition | Team C (Platform) |
| Product MFE | Browse products, add to cart | Team A |
| Cart MFE | View/edit cart, checkout | Team B |
| Orders MFE | Order history | Team B2 (spun off from Cart once checkout existed) |
| API | Product catalog, cart, and order persistence | Team D |
| `libs/*` | Shared contracts, UI kit, state, events | Team E |

Three MFEs (not two) exist here specifically to prove the pattern scales:
Orders was added *after* Product and Cart, and needed zero changes to either
of them — it only needed to know one event name (`order:created`) and one
backend endpoint (`GET /api/orders`).

## Architecture

```text
                         ┌──────────────────────┐
                         │    Gateway / Shell    │
                         │   (Module Fed. HOST)  │
                         │  nav · routing · layout│
                         └───────────┬───────────┘
                                     │ remote import at runtime
                          Module Federation
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                     │
         ┌──────▼──────┐      ┌──────▼──────┐      ┌───────▼──────┐
         │ Product MFE  │      │  Cart MFE   │      │  Orders MFE  │
         │  (REMOTE)    │      │  (REMOTE)   │      │   (REMOTE)   │
         └──────┬───────┘      └──────┬──────┘      └───────┬──────┘
                │                     │                      │
                │     window.NISUM (events) — cart:item-added,│
                ├────────────────────►│ order:created, etc. ◄─┤
                │                     │                      │
                │   Shared Zustand store — cart contents      │
                ├────────────────────►│◄─────────────────────┘
                │                     │
                └─────────────────────┴──────────┐
                                                   │  fetch()
                                                   ▼
                                             Backend API
                                          (Express, /api/*)
                                                   │
                                                   ▼
                                   JSON files (products/cart/orders)
                                 (swap for a real DB — see Backend/API)
```

## Architecture Diagram

See the diagram above, and `docker-compose.yml` for how the five runtime
services (gateway, mfe-product, mfe-cart, mfe-orders, api) wire together for
local/demo use.

## Technologies Used

- **React 18 + TypeScript** for every app
- **Webpack 5 Module Federation** for runtime composition
- **Zustand** for shared/global state
- **Native `CustomEvent`/`EventTarget`** for the `window.NISUM` event bus
- **Express** for the backend API, with a **JSON-file persistence layer** standing in for a database
- **Tailwind CSS** for styling, compiled per-app via PostCSS
- **npm workspaces + Nx** (real `project.json` targets, `nx affected`, `nx graph`) for the monorepo
- **Jest + React Testing Library + Supertest** for tests
- **GitHub Actions** for CI/CD, pushing Docker images to **GitHub Container Registry** for CD
- **Docker / docker-compose** for containerization

## Project Structure

```text
final-mfe-project/
├── apps/
│   ├── gateway/       # Module Federation HOST — shell, nav, routing
│   ├── mfe-product/   # Module Federation REMOTE — product catalog
│   ├── mfe-cart/      # Module Federation REMOTE — cart + checkout
│   ├── mfe-orders/    # Module Federation REMOTE — order history (3rd MFE)
│   └── api/           # Express backend, JSON-file persistence
├── libs/
│   ├── shared-types/  # Product, CartItem, Order, User, NisumEventMap
│   ├── shared-ui/     # Button, Card, Loader, ErrorMessage
│   ├── state/         # Zustand store (shared singleton)
│   ├── events/        # window.NISUM event bus
│   └── utilities/     # formatCurrency, getEnv
├── .github/workflows/ # ci.yml, cd.yml
├── docker-compose.yml
├── nx.json
└── package.json
```

## Applications

### Gateway
Module Federation **host**. Owns layout, top nav, and routing
(`react-router-dom`). Lazy-loads each remote's exposed component through
`RemoteLoader` (Suspense + error boundary), so a remote that's offline
shows "Unable to load ... It may be offline or not yet deployed" instead
of crashing the shell. Never imports remote source directly — only the
`exposes` entry points declared in each remote's `webpack.config.js`.

### MFE 1 — Product (`apps/mfe-product`)
Exposes `./ProductListApp`. Fetches `GET /api/products`, renders a grid
with loading/error states. On "Add to cart": updates the shared store
(instant UI feedback), emits `cart:item-added` + `notification:show` on
`NISUM`, **and** calls `POST /api/cart` to persist the item to the
backend — that last part is what makes checkout later have something
real to read, not just a client-side illusion of a cart.

### MFE 2 — Cart (`apps/mfe-cart`)
Exposes `./CartApp`. Reads cart contents from the **same** shared store
instance (via the Module Federation `shared` singleton), listens for
`cart:item-added` on `NISUM` to show a transient toast, and on **Remove**
both updates local state and calls `DELETE /api/cart/:productId` to keep
the backend in sync. **Checkout** calls `POST /api/orders`, which reads
the backend's current cart, turns it into a persisted order, and clears
the backend cart; on success, Cart clears the shared store and emits
`order:created` — which is the only thing the Orders MFE needs to know.

### MFE 3 — Orders (`apps/mfe-orders`)
Exposes `./OrdersApp`. Fetches `GET /api/orders` and renders order
history. Listens for `order:created` on `NISUM` and refetches when it
fires — it never imports anything from Cart, never reads the shared cart
state, and needed **zero changes to Product or Cart** when it was added.
This is the concrete proof of "communicate only through defined
mechanisms" from the project brief.

### Backend
Express app exposing `/api/products`, `/api/cart`, and `/api/orders`.
Every response follows one shape — `{ data }` on success,
`{ error: { message } }` on failure. See **Backend/API** below for the
persistence details.

## Module Federation

- **Gateway = Host.** Declares `remotes: { mfe_product, mfe_cart, mfe_orders }`
  pointing at URLs read from `REMOTE_PRODUCT_URL` / `REMOTE_CART_URL` /
  `REMOTE_ORDERS_URL` env vars — never hardcoded.
- **Product, Cart & Orders = Remotes.** Each exposes exactly one
  page-level component (`./ProductListApp`, `./CartApp`, `./OrdersApp`);
  internals stay private.
- **Shared singletons:** `react`, `react-dom`, `zustand`,
  `@final-mfe/state`, and `@final-mfe/events` are all marked
  `singleton: true` across every `webpack.config.js`. Without this, each
  remote would get its own React instance (breaking hooks) and its own
  store instance (breaking shared state).
- Remotes are loaded with `React.lazy(() => import("mfe_product/ProductListApp"))`
  at runtime — fetched from their deployed URL when the route is
  visited, never bundled into the Gateway at build time.

## Monorepo Architecture

A real **Nx workspace**: npm workspaces (`apps/*`, `libs/*`) handle
package installation/hoisting, and Nx owns orchestration — every project
has its own `project.json` with `serve`/`build`/`test`/`lint` targets,
wired through `nx:run-commands` to that project's own tooling (webpack,
Express, Jest). That gets you Nx's actual value on top of a hand-built
Module Federation setup:

- **Dependency graph** — `implicitDependencies` in each app's
  `project.json` declares which `libs/*` it depends on; `nx graph`
  visualizes it.
- **`nx affected`** — CI and CD only lint/test/build/deploy the projects
  that actually changed, computed from the Nx graph + git diff.
- **Caching** — `nx.json`'s `targetDefaults` mark `build`/`test`/`lint`
  as cacheable.
- **`nx run-many --target=serve --projects=api,gateway,mfe-product,mfe-cart,mfe-orders`**
  starts everything (this is what `npm run dev` calls).

## Shared Libraries

| Library | Contains | Why it's shared |
|---|---|---|
| `shared-types` | `Product`, `CartItem`, `Order`, `User`, `NisumEventMap` | One contract every emitting and listening app compiles against |
| `shared-ui` | `Button`, `Card`, `Loader`, `ErrorMessage` | Generic primitives only — no business-specific components, to avoid coupling MFEs' UI decisions together |
| `state` | Zustand store + actions (`addItem`, `removeItem`, `clearCart`) | The one place cart mutation logic lives |
| `events` | `NisumEventBus`, `window.NISUM` installer | One event contract, one place to test it |
| `utilities` | `formatCurrency`, `getEnv` | Small stateless helpers |

## Global State

`libs/state` holds `{ user, cart }`. Loaded as a Module Federation shared
singleton, so `useAppStore` in the Gateway, Product, and Cart MFEs all
read/write the same in-memory store at runtime. **Orders deliberately
does not touch this store at all** — it has no reason to know the
client-side cart shape, only the `order:created` event and its own API
call. That asymmetry is intentional: shared state is for MFEs that
genuinely co-own a piece of data, not a blanket mechanism every MFE must plug into.

## Event-Driven Architecture

```text
Product MFE                     Cart MFE                      Orders MFE
     │  NISUM.emit(                  │  NISUM.emit(                  │
     │   "cart:item-added")          │   "order:created")            │
     ▼                               ▼                               │
   window (CustomEvent) ─────────────┴──── window (CustomEvent) ─────┤
                                                                      ▼
                                                        NISUM.listener("order:created")
                                                          → refetches /api/orders
```

Events implemented: `cart:item-added`, `cart:item-removed`, `cart:updated`,
`user:login`, `user:logout`, `product:selected`, `order:created`,
`notification:show`. Full payload types live in
`libs/shared-types/src/index.ts` (`NisumEventMap`).

## NISUM Event System

`libs/events/src/NisumEvents.ts` implements `window.NISUM` on top of native
`EventTarget` + `CustomEvent`, so it works regardless of which
framework/version any given remote uses internally:

```ts
NISUM.emit("cart:item-added", { productId: "p1", quantity: 1 });

const unsubscribe = NISUM.listener("cart:item-added", (data) => {
  console.log(data); // typed via NisumEventMap
});
unsubscribe(); // always called in useEffect cleanup — see Cart.tsx, OrdersList.tsx
```

`NISUM.once()` is also provided. Fully covered by
`libs/events/src/NisumEvents.test.ts` (emit, multiple listeners, payload
correctness, unsubscribe, once-semantics, event-name isolation).

## Data-Sharing Strategy

| Mechanism | Used for | Coupling | Persistence | Advantages | Limitations |
|---|---|---|---|---|---|
| Shared state (Zustand) | Cart contents, current user — Product & Cart only | Higher (consumers depend on store shape) | Runtime (in-memory) | Simple, synchronous, instant UI feedback | Every consuming MFE depends on the store's shape changing together; Orders deliberately opts out |
| Events (`window.NISUM`) | "Something happened" notifications (`cart:item-added`, `order:created`) | Low (only event name + payload contract) | Runtime, fire-and-forget | Loosely coupled — Orders was added without touching Product/Cart | Harder to trace/debug than a direct call; no delivery guarantee |
| Module Federation `shared` | React, Zustand, the state/events libs themselves | Medium (version negotiation) | Build/runtime | Avoids duplicate React instances / broken hooks, avoids duplicate store instances | Requires careful version alignment across independently-deployed remotes |
| Backend API | Product catalog, cart, order persistence | Low | Server-side (JSON files) | Single source of truth across devices/sessions; what Checkout actually reads | Network dependency, latency, needs error/loading handling |
| Browser storage | *(not used)* | Low | Persistent (survives refresh) | Would let cart survive a reload | Deliberately left out — see Future Improvements |

**Rule of thumb applied throughout:** state when multiple MFEs need the
*current value* of something and are willing to share its shape; events
when one MFE needs to *notify* others that something occurred, without
either needing to agree on anything beyond the event payload.

## Backend/API

**Persistence:** a small JSON-file store (`apps/api/src/db/jsonStore.ts`)
stands in for a real database, per the project brief ("keep the data in a
JSON file instead of a database for now"). `readCollection`/`writeCollection`
read and write `apps/api/data/{products,cart,orders}.json` — every route
handler goes through these two functions, so swapping in a real DB later
means replacing `jsonStore.ts` only; no route changes. `data/products.json`
is seeded from `data/seed.ts` on first run and then becomes the actual
source of truth — edit that file directly to change the catalog without
touching code.

**Routes:**
```text
GET    /api/products
GET    /api/products/:id
GET    /api/cart
POST   /api/cart              → { productId, quantity }
DELETE /api/cart/:productId
GET    /api/orders            → most recent first
POST   /api/orders             → reads the current cart, creates an order, clears the cart
```

Errors: `400` invalid input / empty-cart checkout, `404` not found, `409`
conflict (out of stock), `500` via centralized error middleware. All
responses share the `{ data }` / `{ error: { message } }` shape.

## Error Handling

| Failure | Handling |
|---|---|
| Remote MFE unavailable | `RemoteErrorBoundary` in the Gateway shows a retry-able message instead of crashing the shell |
| Remote still loading | `Suspense` fallback (`Loader`) |
| Backend unavailable / API error | Each MFE's fetch call catches the rejection, shows `ErrorMessage` with **Try again** |
| Invalid data (bad `productId`, empty-cart checkout) | `400`/`409` with a descriptive message |
| Backend cart-sync failure after an optimistic UI update | Product/Cart don't roll back the local UI (jarring); Product surfaces it as a `notification:show` error event instead |
| Event listener leaks | Every `NISUM.listener()` call is paired with `unsubscribe()` in a `useEffect` cleanup (tested in `Cart.test.tsx`, `OrdersList.test.tsx`) |

## Testing

- **`libs/events`** — emit/listener/unsubscribe/once, multiple listeners, event isolation.
- **`mfe-product`** — renders fetched products, error + retry state, emits `cart:item-added`, persists to the backend cart via `addToCartApi`, surfaces a notification if that backend call fails.
- **`mfe-cart`** — renders shared-state items, reacts to `cart:item-added`, removes an item (updates state + emits event + syncs backend), checks out (calls backend, clears cart, emits `order:created`), shows a retry-able error if checkout fails.
- **`mfe-orders`** — empty state, renders fetched orders, error + retry, refetches on `order:created`.
- **`gateway`** — shell renders, `/` redirects to `/products`, nav switches to the (mocked) Cart and Orders remotes.
- **`api`** — `GET /api/products` success + 404 path.

Run everything: `npm test`. Run only what changed: `npx nx affected --target=test`.

## CI/CD

- **`.github/workflows/ci.yml`** — on every push/PR to `main`: install →
  `nx affected --target=lint` → typecheck → `nx affected --target=test`
  (coverage) → `nx affected --target=build`, using `nrwl/nx-set-shas` to
  compute the affected range against `main`.
- **`.github/workflows/cd.yml`** — runs after CI succeeds on `main`.
  `nx show projects --affected --type=app` lists which app(s) actually
  changed; **only those** get built and pushed as Docker images to
  **GitHub Container Registry** (`ghcr.io/<repo>/<app>:<sha>` and `:latest`),
  authenticated with the repo's built-in `GITHUB_TOKEN` — no external
  secrets to configure, so this step genuinely runs and produces a real
  artifact rather than an `echo` placeholder. This is what makes "Gateway
  v1.0 / Product v1.4 / Cart v2.1 / Orders v1.0 deployed independently"
  real: shipping one app never rebuilds or republishes the others.
  Pulling those images onto an actual host (ECS, Cloud Run, a VM, etc.)
  is the one remaining step that's documented rather than automated,
  since there's no live hosting target connected to this repo — see
  **Deployment** below.

## Environment Configuration

See `.env.example`. Nothing is hardcoded:

```text
REMOTE_PRODUCT_URL, REMOTE_CART_URL, REMOTE_ORDERS_URL   → read by gateway/webpack.config.js
API_URL                                                    → read by every MFE via getEnv()
API_PORT, CORS_ORIGIN                                      → read by apps/api/src/server.ts
```

## Running the Application

```bash
npm install
npm run dev
```

runs `nx run-many --target=serve --projects=api,gateway,mfe-product,mfe-cart,mfe-orders --parallel=5`:

```text
✓ API           http://localhost:3000
✓ Gateway       http://localhost:4200
✓ Product MFE   http://localhost:4201  (standalone)
✓ Cart MFE      http://localhost:4202  (standalone)
✓ Orders MFE    http://localhost:4203  (standalone)
```

Open `http://localhost:4200` — the Gateway composes all three remotes
there (Products / Cart / Orders tabs). Each remote's own URL also works
standalone. Other useful commands: `npx nx graph`, `npx nx affected --target=test`,
`npx nx build gateway`.

**Or, with Docker:** `docker compose up --build` starts all five
containers, with the API's JSON-file data persisted in a named volume.

## Deployment

- Every `apps/*` has a `Dockerfile` that builds from the **monorepo
  root** as its context (required — each app depends on `libs/*` plus
  the root `nx.json`/`tsconfig.base.json`; building from just the app's
  own folder can't resolve any of that). `docker-compose.yml` and
  `.github/workflows/cd.yml` both point their build context at `.` for
  this reason.
- CD pushes each affected app's image to GHCR independently (see CI/CD
  above). For an actual production deploy, the remaining step is
  pointing a host at those images — e.g. an ECS/Cloud Run service per
  app pulling `ghcr.io/<repo>/<app>:latest`, or a static host serving
  the `gateway`/`mfe-product`/`mfe-cart`/`mfe-orders` nginx images and a
  container platform running `api`.
- After deploying a new Product MFE version, only `REMOTE_PRODUCT_URL`
  needs updating on the Gateway's environment — the Gateway itself
  doesn't need a rebuild.
- **Version compatibility:** shared singletons (`react`,
  `@final-mfe/state`, `@final-mfe/events`) are the compatibility
  boundary — a remote bumping a major version of one of these should
  bump `requiredVersion` in its `webpack.config.js` so Module Federation
  can warn on mismatch rather than silently loading two React copies.

## Architecture Decisions

- **Both state and events, deliberately** — chosen per data type (see
  Data-Sharing Strategy), not "pick one pattern for everything." Orders
  uses *only* events, on purpose, to prove a third MFE can plug in without
  buying into the Product/Cart state contract at all.
- **`window.NISUM` over a pure pub/sub library** — native `CustomEvent`
  means any MFE, regardless of internal framework version, can
  participate without importing a specific JS library version.
- **One exposed component per remote** — keeps the Module Federation
  contract small and stable; internal refactors inside a remote never
  require Gateway changes.
- **JSON files instead of a real database** — per the project's current
  scope, `db/jsonStore.ts` is the single seam where a real DB client
  would go; every route already goes through `readCollection`/`writeCollection`
  rather than touching files directly, specifically so that swap is
  contained to one file.
- **Optimistic local updates, non-blocking backend sync** — "Add to
  cart" updates the shared store immediately (instant feel) and *then*
  persists to the backend; a failed backend sync surfaces as a
  notification rather than rolling back the UI, which would feel broken
  to the user for what's usually a transient network issue.
- **Docker context at the monorepo root** — the only way to build any
  app's image correctly, since every app depends on `libs/*`.

## Challenges & Solutions

| Challenge | Solution |
|---|---|
| Avoiding duplicate React instances across independently-built bundles | `singleton: true` in every `webpack.config.js`'s `shared` block |
| Avoiding duplicate store instances (breaking "shared" state) | `@final-mfe/state` also marked `singleton: true` |
| One broken remote crashing the whole app | Per-remote `RemoteErrorBoundary` + `Suspense`, not one boundary around everything |
| Keeping the frontend's optimistic cart and the backend's persisted cart from drifting apart | Every cart mutation (add/remove) fires both the local state update and the matching backend call; checkout reads the backend's copy, not the frontend's, so it's the actual source of truth at the moment of purchase |
| Adding a third MFE without touching the first two | Orders only depends on one event name and one API endpoint — verified by the fact that adding it required zero diffs to `mfe-product` or `mfe-cart` |
| Docker builds failing to resolve workspace packages | Build context moved to the monorepo root for every `Dockerfile`, with `nx.json`/`tsconfig.base.json`/`libs/` copied in before `npm install` |
| Making CD do something real without any hosting secrets configured | Docker build + push to GitHub Container Registry using the repo's built-in `GITHUB_TOKEN` |

## Screenshots / Demo

See `/screenshots` (placeholder — replace with actual captures of: Gateway
shell on each of the three tabs, a completed checkout flow, a remote-offline
error state, and the CI/CD run) and the companion in-chat interactive React
demo for a live walkthrough of the same state/event flows without needing
to run the full stack.

## Future Improvements

- Replace `db/jsonStore.ts` with a real database client (Postgres/Mongo) —
  every route already goes through that one file, so this is a contained change.
- Persist the cart to `localStorage` in addition to the backend, and sync
  across browser tabs via the `storage` event.
- Real authentication (`user:login`/`user:logout` are already modeled in
  `NisumEventMap` and the store, just not wired to a real auth provider yet).
- Key the backend cart/orders by an authenticated user id instead of one
  shared demo cart.
- Feature flags per remote, loaded from the API, to control rollout independently of deployment.
- Structured logging + a health-check dashboard across all five services.
- Wire CD's published GHCR images to an actual hosting target (ECS/Cloud Run/etc.).

## Conclusion

This repository is a complete, working Micro Frontend platform: three
independently buildable/deployable apps (plus a host), composed at
runtime via Module Federation, sharing both persistent state and
transient notifications through two complementary, clearly-scoped
mechanisms, backed by a real (if simplified) persisted API, tested, and
wired into a CI/CD pipeline that produces real deployable artifacts.
