# Technical Architecture Documentation

> Singapore Food Map - A Vue 3 + Express food rating application with friend groups

## Table of Contents
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Friend Groups & Visibility Model](#friend-groups--visibility-model)
- [Database Design](#database-design)
- [Design Patterns](#design-patterns)
- [Code Quality Guidelines](#code-quality-guidelines)

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Vue 3 (Composition API) | 3.5.x |
| **Build Tool** | Vite | 7.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **HTTP Client** | Axios | 1.x |
| **Backend** | Express | 5.x |
| **Auth** | Google Identity Services + JWT session cookie | - |
| **Database** | PostgreSQL (Neon) | 12+ |
| **Maps** | Google Maps JS API, OneMap (Leaflet) fallback | - |
| **Deployment** | Vercel (Serverless) | - |
| **Package Manager** | pnpm | - |

---

## Project Structure

```
food_map/
├── src/
│   ├── components/
│   │   ├── MapContainer.vue      # Map orchestrator (provider lifecycle, markers, popup mounting)
│   │   ├── map/
│   │   │   ├── googleMapProvider.js  # Google Maps provider (init/markers/popup/focus)
│   │   │   ├── oneMapProvider.js     # OneMap/Leaflet fallback provider (same interface)
│   │   │   └── PlacePopup.vue        # Marker popup (tier, votes, friend ratings, reviews)
│   │   ├── Sidebar.vue           # Categories, account section, add place
│   │   ├── CuisinePanel.vue      # Cuisine detail list panel
│   │   ├── AuthControl.vue       # Google sign-in button / signed-in user chip
│   │   ├── GroupsModal.vue       # Create/join/leave friend groups, invite links
│   │   ├── AddPlaceForm.vue      # Add place form (admins + signed-in friends)
│   │   ├── AdminPanel.vue        # Configuration management (cuisines/tiers/blog)
│   │   ├── ViewAllModal.vue      # View/edit all places modal
│   │   ├── SpinWheelModal.vue    # "Up to you" random picker
│   │   ├── BlogModal.vue         # Blog posts
│   │   └── MethodologyModal.vue
│   ├── composables/              # State management (Composition API singletons)
│   │   ├── useFoodTracker.js     # Places state + CRUD (per-instance, owned by App)
│   │   ├── useAuth.js            # Session user (Google sign-in)
│   │   ├── useAdmin.js           # isAdmin (legacy ?admin= key OR admin account)
│   │   ├── useRatings.js         # Friend ratings + group-tier summary for pins
│   │   ├── useGroups.js          # Friend groups, ?join=CODE invite flow
│   │   ├── useVoting.js          # Public thumbs voting with caching
│   │   ├── useConfig.js          # Cuisines, tiers, tags
│   │   ├── useBlog.js            # Blog content
│   │   └── useMethodology.js     # Methodology content
│   ├── services/
│   │   └── api.js                # Axios wrapper: placesApi, authApi, ratingsApi, groupsApi, ...
│   ├── main.js
│   └── style.css
├── api/
│   ├── index.js                  # App assembly only: middleware + router mounting
│   ├── dev.js                    # Local dev entrypoint (app.listen)
│   ├── _lib/                     # Shared helpers (underscore = not deployed as functions)
│   │   ├── env.js                # dotenv loading (imported first)
│   │   ├── auth.js               # Session/JWT helpers, requireUser, requireAdmin
│   │   └── constants.js          # VISIBLE_USERS_SQL, shared limits
│   └── _routes/                  # One Express router per domain
│       ├── auth.js               # /api/auth/* (Google sign-in, session)
│       ├── places.js             # Places CRUD + visibility scoping
│       ├── ratings.js            # Friend ratings + /api/ratings/summary
│       ├── groups.js             # Groups, membership, invite codes
│       ├── comments.js           # Editorial reviews
│       ├── votes.js              # Public thumbs votes
│       ├── config.js             # Cuisines/tags/tiers
│       ├── settings.js           # Site settings key-value store
│       └── blog.js               # Blog posts + image upload (Vercel Blob)
├── database/
│   ├── db.js                     # PostgreSQL connection pool
│   ├── migrate.js                # Applies schema.sql (idempotent; runs on deploy)
│   ├── schema.sql                # Full schema (CREATE IF NOT EXISTS + upgrade ALTERs)
│   └── migrations/               # Numbered files documenting each schema change
├── vite.config.js                # Dev proxy: /api -> localhost:3001
├── tailwind.config.js
└── vercel.json                   # buildCommand runs migrations + build
```

---

## Frontend Architecture

### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| `App.vue` | Root layout, modal orchestration, Public/Friends view toggle |
| `Sidebar.vue` | Category nav, account section (AuthControl + Groups), add place |
| `MapContainer.vue` | Thin orchestrator: chooses provider, renders markers, mounts popups |
| `map/PlacePopup.vue` | Everything inside a marker popup, as a real Vue component |
| `map/*Provider.js` | Map-engine specifics behind one interface: `init / addMarker / clearMarkers / openPopup / focusOn / destroy` |
| `AuthControl.vue` | Renders Google sign-in button or the signed-in user + sign out |
| `GroupsModal.vue` | Group CRUD, member list, copyable invite links |

The two map providers implement the same interface, so `MapContainer` is
engine-agnostic. Google Maps is primary; when its tiles fail to render
(detected ~5s after init) or `gm_authFailure` fires, the container tears it
down and starts the OneMap/Leaflet provider.

Popups are mounted with `createApp(PlacePopup, props)` into a detached
element handed to the active provider. The popup fetches its own data
(comments, votes, friend ratings) on mount and emits `loaded`, at which
point the provider opens it. Because content is rendered by Vue templates,
user-generated text is escaped by construction.

### State Management: Composables

Most composables use a **singleton pattern** (module-level refs shared by
every consumer). `useFoodTracker` is the exception: it creates per-instance
state and is only instantiated by `App.vue`, which passes data down as props.

| Composable | Purpose | Singleton |
|------------|---------|-----------|
| `useAuth` | Current session user, login/logout | yes |
| `useAdmin` | `isAdmin` = legacy `?admin=` key OR `user.is_admin` | yes |
| `useRatings` | Rating CRUD + `ratingsSummary` (place → group tier) | yes (summary) |
| `useGroups` | Group list, create/join/leave, `?join=CODE` invites | yes |
| `useConfig` | Cuisines, tiers, tags | yes |
| `useVoting` | Anonymous thumbs votes (localStorage voter id) | per-instance cache |
| `useFoodTracker` | Places list + CRUD | no (App-owned) |

### View Modes

Signed-in users toggle between two map views (state lives in `App.vue`):

- **public** — pins colored by `places.tier` (the owner's editorial rating)
- **friends** — pins colored by the user's group median tier from
  `GET /api/ratings/summary`; the spin wheel is scoped to group-rated places

Anonymous visitors always get the public view.

---

## Backend Architecture

### Structure

`api/index.js` only assembles the app: JSON/cookie middleware, one
`app.use(router)` per domain, and the health endpoint. Each domain router in
`api/_routes/` declares its full `/api/...` paths and imports shared helpers
from `api/_lib/`. The underscore-prefixed directories prevent Vercel from
deploying each module as its own serverless function; the `vercel.json`
rewrite sends every `/api/*` request to `api/index.js`.

### Endpoint Summary

#### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/places` | Places (visibility-scoped by session, see below) |
| GET | `/api/places/:id/comments` | Editorial reviews |
| GET/POST/DELETE | `/api/places/:id/votes` | Anonymous thumbs voting |
| GET | `/api/config` | Cuisines, tiers, tags |
| GET | `/api/settings/:key` | Site setting |
| GET | `/api/blog`, `/api/blog/:id` | Blog posts |
| GET | `/api/health` | Health check |
| POST | `/api/auth/google` | Exchange Google ID token for session cookie |
| GET | `/api/auth/me` | Current user (`{ user: null }` when signed out) |
| POST | `/api/auth/logout` | Clear session cookie |

#### Signed-in users (session cookie)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/places/:id/ratings` | Friend ratings (empty when signed out) |
| PUT/DELETE | `/api/places/:id/rating` | Upsert/remove own rating |
| GET | `/api/ratings/summary` | Per-place group median tier |
| GET/POST | `/api/groups` | List / create groups |
| POST | `/api/groups/join` | Join via invite code |
| DELETE | `/api/groups/:id/members/me` | Leave (group deleted when empty) |
| POST | `/api/places` | Friends add group-visible places (admins add public ones) |

#### Admin (`x-admin-key` header OR admin account session)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT/DELETE | `/api/places/:id` | Edit/delete places |
| POST | `/api/places/:id/comments` | Add editorial review |
| DELETE | `/api/comments/:id` | Delete review |
| POST/PUT/DELETE | `/api/cuisines*`, `/api/tags/:id`, `/api/tiers*` | Config management |
| PUT | `/api/settings/:key` | Update site setting |
| POST/PUT/DELETE | `/api/blog*` | Blog management + image upload |

---

## Authentication & Authorization

### User sessions (Google sign-in)

1. `AuthControl.vue` loads Google Identity Services and renders the button
2. Google returns an ID token (credential) to the browser
3. `POST /api/auth/google` verifies the token server-side
   (`google-auth-library`, audience = `VITE_GOOGLE_CLIENT_ID`) and upserts
   the user by their stable `google_sub`
4. The server signs a JWT (`{ userId }`, `SESSION_SECRET`, 30 days) and sets
   it as an **httpOnly, SameSite=Lax cookie** — never readable from JS
5. Every request resolves the cookie via `getSessionUser()`; `requireUser`
   middleware gates user-only endpoints

The app is same-origin in both dev (Vite proxies `/api` to the Express dev
server) and production (Vercel rewrite), so no CORS layer exists.

### Admin

Two equivalent tracks, both accepted by `requireAdmin`:

- **Admin account** (preferred): a signed-in user with `users.is_admin = TRUE`
- **Legacy secret**: `?admin=SECRET` URL param → sessionStorage →
  `x-admin-key` header, compared against `ADMIN_SECRET`

Secrets **fail fast**: in production the server refuses to start if
`ADMIN_SECRET` or `SESSION_SECRET` is unset (dev uses known fallbacks).

---

## Friend Groups & Visibility Model

The core rule, defined once as `VISIBLE_USERS_SQL` (`api/_lib/constants.js`):
a user sees content from **themselves plus anyone sharing at least one group
with them**.

| Content | Anonymous | Signed-in |
|---------|-----------|-----------|
| Places with `created_by NULL` (editorial) | visible | visible |
| Places with `created_by` set (friend-added) | hidden | visible if creator is in your groups |
| Friend ratings | hidden | own + group members' |
| Editorial tier, comments, votes, blog | visible | visible |

Mechanics:

- **Invites** are shareable links (`?join=CODE`). The code is stashed in
  sessionStorage until the visitor signs in, then consumed automatically.
- **Group tier** (friends-view pin color) is the *median* visible rating,
  computed by selecting the actual middle rating row ordered by
  `tiers.sort_order` (ties broken by code, best-biased on even counts).
- A friend's chosen tier when **adding a place** doubles as their personal
  rating; groups **self-delete** when the last member leaves.

---

## Database Design

### Schema Overview

```
users ──< group_members >── groups
  │
  ├──< ratings >── places ──< comments
  │                  │
  │                  └──< votes
  └─ is_admin        └─ created_by → users (soft link)

cuisines ──< cuisine_tags     tiers     site_settings     blog_posts
```

### Table Definitions

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `places` | Restaurants | name, coords (JSONB), cuisine_type, tier, tags (JSONB), region, `created_by` (NULL = editorial/public) |
| `users` | Accounts | google_sub (unique), email, display_name, avatar_url, is_admin |
| `ratings` | Per-user friend ratings | user_id, place_id, tier, review — UNIQUE(user, place) |
| `groups` | Friend groups | name, invite_code (unique), created_by |
| `group_members` | Membership | group_id, user_id — UNIQUE pair |
| `comments` | Editorial reviews | place_id, content |
| `votes` | Anonymous thumbs | place_id, vote_type, voter_id (localStorage id) |
| `cuisines` / `cuisine_tags` | Categories + nested tags | name, sort_order |
| `tiers` | Rating levels | code, description, color_class, color_hex, sort_order |
| `site_settings` | Key-value store | setting_key, setting_value (JSONB) |
| `blog_posts` | Blog content | title, content (JSONB), sort_order |

### Migrations

`database/schema.sql` is the source of truth: idempotent
`CREATE TABLE IF NOT EXISTS` plus `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
upgrade lines for columns added after a table shipped. `pnpm migrate` applies
it, and the Vercel build (`vercel-build`) runs it on every deploy. The
numbered files in `database/migrations/` document each change for reference.

### Database Features

- **Auto-timestamps**: triggers update `updated_at` on row changes
- **Cascade deletes**: ratings/memberships/comments deleted with parent
- **Connection pooling**: max 20 connections, 30s idle timeout

---

## Design Patterns

### 1. Singleton Composables

Module-level refs shared across all consumers — `useAuth`, `useConfig`,
`useRatings`, `useGroups`, `useAdmin`.

### 2. Provider Interface (Strategy)

`MapContainer` depends on a small interface, not a map engine:

```javascript
{ init, addMarker, clearMarkers, openPopup, focusOn, destroy }
```

`googleMapProvider` and `oneMapProvider` are interchangeable implementations,
which is what makes the automatic Google → OneMap failover a one-line swap.

### 3. Router-per-Domain

Each Express router owns one resource family; cross-cutting concerns
(sessions, admin checks, visibility SQL) live in `api/_lib/` and are imported
where needed.

### 4. Guard Clauses (Fail Fast)

Validation at the top of every handler; missing production secrets abort
startup rather than degrade to insecure defaults.

### 5. Separation of Concerns

| Layer | Responsibility | Location |
|-------|----------------|----------|
| Presentation | Rendering, events | `components/` |
| Business Logic | State, transformations | `composables/` |
| Data Access | HTTP abstraction | `services/api.js` |
| API | Routes, middleware | `api/_routes/`, `api/_lib/` |
| Persistence | Connection, queries | `database/` |

---

## Code Quality Guidelines

### DRY
- One `VISIBLE_USERS_SQL` definition drives all group-visibility queries
- API wrapper functions (`request`, `adminRequest`); shared auth helpers

### KISS
- Session = one signed JWT cookie; no refresh tokens or token rotation
- Invite links instead of email infrastructure
- REST, no GraphQL; composables, no Pinia

### YAGNI
- No TypeScript (current scope), no WebSockets, no offline mode
- Friend places are group-visible only — no moderation queue until needed

### SOLID

| Principle | Application |
|-----------|-------------|
| **SRP** | One router per domain; one composable per concern; popup is its own component |
| **OCP** | New map engines implement the provider interface without touching MapContainer |
| **LSP** | Both map providers are drop-in substitutes |
| **ISP** | PlacePopup receives only the callbacks it uses |
| **DIP** | Components depend on composables, not axios or SQL |

---

## Key Files Reference

| Purpose | File |
|---------|------|
| App entry / view toggle | `src/App.vue` |
| Map orchestration | `src/components/MapContainer.vue` |
| Popup UI | `src/components/map/PlacePopup.vue` |
| API client | `src/services/api.js` |
| API assembly | `api/index.js` |
| Session/admin auth | `api/_lib/auth.js` |
| Visibility rule | `api/_lib/constants.js` |
| Schema | `database/schema.sql` |
| Deployment config | `vercel.json` |
