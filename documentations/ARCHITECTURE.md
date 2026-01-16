# Technical Architecture Documentation

> Singapore Food Tracker - A Vue 3 + Express food rating application

## Table of Contents
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Design](#database-design)
- [Design Patterns](#design-patterns)
- [Code Quality Guidelines](#code-quality-guidelines)

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Vue 3 (Composition API) | 3.5.18 |
| **Build Tool** | Vite | 7.0.6 |
| **Styling** | Tailwind CSS | 3.4.17 |
| **HTTP Client** | Axios | 1.12.2 |
| **Backend** | Express | 5.1.0 |
| **Database** | PostgreSQL | 12+ |
| **Deployment** | Vercel (Serverless) | - |
| **Package Manager** | pnpm | - |

---

## Project Structure

```
food_map/
├── src/
│   ├── components/           # Vue 3 SFC components
│   │   ├── MapContainer.vue  # Google Maps integration
│   │   ├── Sidebar.vue       # Filters, search, place list
│   │   ├── AddPlaceForm.vue  # Admin form for adding places
│   │   ├── AdminPanel.vue    # Configuration management
│   │   ├── ViewAllModal.vue  # View/edit all places modal
│   │   └── MethodologyModal.vue
│   ├── composables/          # State management (Composition API)
│   │   ├── useFoodTracker.js # Main app state + API
│   │   ├── useAdmin.js       # Authentication singleton
│   │   ├── useVoting.js      # Public voting with caching
│   │   ├── useConfig.js      # Configuration state
│   │   └── useMethodology.js # Methodology content
│   ├── services/
│   │   └── api.js            # Axios HTTP client wrapper
│   ├── main.js               # Vue app entry point
│   └── style.css             # Tailwind imports
├── api/
│   └── index.js              # Express backend (Vercel serverless)
├── database/
│   ├── db.js                 # PostgreSQL connection pool
│   ├── migrate.js            # Migration runner
│   └── schema.sql            # Database schema
├── vite.config.js
├── tailwind.config.js
└── vercel.json               # Deployment config
```

---

## Frontend Architecture

### Component Design

All components use **Vue 3 Composition API** with the setup() pattern:

```javascript
export default {
  name: 'ComponentName',
  props: { /* typed props */ },
  emits: ['event-name'],
  setup(props, { emit }) {
    // Reactive state with ref()
    // Computed properties with computed()
    // Event handlers
    return { /* exposed bindings */ }
  }
}
```

### Component Responsibilities

| Component | Purpose | Key Props/Emits |
|-----------|---------|-----------------|
| `App.vue` | Root layout, modal orchestration | - |
| `Sidebar.vue` | Filters, search, place list | Props: places, filters / Emits: updates |
| `MapContainer.vue` | Google Maps, markers, popups | Props: places, callbacks |
| `AdminPanel.vue` | Config management (tabs) | Props: isOpen / Emits: close |
| `ViewAllModal.vue` | Table view of all places | Props: places / Emits: CRUD events |

### State Management: Composables

The app uses a **singleton composable pattern** for shared state:

```javascript
// Module-level state (singleton)
const sharedState = ref(initialValue)

export function useComposable() {
  const method = () => { /* operate on sharedState */ }
  return { sharedState, method }
}
```

#### Key Composables

| Composable | Purpose | Singleton State |
|------------|---------|-----------------|
| `useFoodTracker` | Place CRUD, comments | places, loading |
| `useAdmin` | Authentication | adminKey, isAdmin |
| `useConfig` | Cuisines, tiers, tags | cuisines, tiers, loaded |
| `useVoting` | Vote management | voterId, votesCache |
| `useMethodology` | Methodology content | methodology, loaded |

### Data Flow

```
Component (template)
    ↓ @emit events
Component (script)
    ↓ composable methods
Composables (useFoodTracker, etc.)
    ↓ API calls
Services (api.js)
    ↓ HTTP requests
Backend (api/index.js)
    ↓ SQL queries
Database (PostgreSQL)
```

### Styling Approach

- **Utility-first** with Tailwind CSS
- **Mobile-first** responsive design (`lg:` breakpoint at 1024px)
- **Color palette**: Slate neutrals, tier-based semantics (pink, emerald, amber, rose)
- **Minimal custom CSS**: Only `.scrollbar-hide` scoped styles

---

## Backend Architecture

### API Design

**Pattern**: RESTful with middleware-based admin authentication

```javascript
// Admin middleware
function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
```

### Endpoint Summary

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/places` | Get all restaurants |
| GET | `/api/places/:id/comments` | Get comments for a place |
| GET | `/api/places/:id/votes` | Get vote counts |
| POST | `/api/places/:id/votes` | Submit a vote |
| DELETE | `/api/places/:id/votes` | Remove a vote |
| GET | `/api/config` | Get cuisines, tiers, tags |
| GET | `/api/settings/:key` | Get site setting |
| GET | `/api/health` | Health check |

#### Admin Endpoints (require `x-admin-key` header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/places` | Add a place |
| PUT | `/api/places/:id` | Update a place |
| DELETE | `/api/places/:id` | Delete a place |
| POST | `/api/places/:id/comments` | Add a review |
| DELETE | `/api/comments/:id` | Delete a review |
| POST/PUT/DELETE | `/api/cuisines/:id` | Manage cuisines |
| POST/DELETE | `/api/tags/:id` | Manage tags |
| POST/PUT/DELETE | `/api/tiers/:id` | Manage tiers |
| PUT | `/api/settings/:key` | Update site setting |

### Authentication Flow

1. Admin accesses app with `?admin=SECRET_KEY` URL parameter
2. `useAdmin` composable stores key in `sessionStorage`
3. `api.js` attaches `x-admin-key` header to admin requests
4. Backend `requireAdmin` middleware validates the key

---

## Database Design

### Schema Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   places    │────<│  comments   │     │    votes    │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │            ┌─────────────┐     ┌─────────────┐
       └───────────<│cuisine_tags │────<│  cuisines   │
                    └─────────────┘     └─────────────┘

┌─────────────┐     ┌───────────────┐
│    tiers    │     │ site_settings │
└─────────────┘     └───────────────┘
```

### Table Definitions

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `places` | Restaurants | name, address, coords (JSONB), cuisine_type, tier, tags (JSONB) |
| `comments` | Reviews | place_id (FK), content |
| `votes` | Public voting | place_id (FK), vote_type, voter_id |
| `cuisines` | Categories | name, sort_order |
| `cuisine_tags` | Nested tags | cuisine_id (FK), name |
| `tiers` | Rating levels | code, description, color_class, color_hex |
| `site_settings` | Key-value store | setting_key, setting_value (JSONB) |

### Database Features

- **Auto-timestamps**: Triggers update `updated_at` on row changes
- **Cascade deletes**: Comments/tags deleted with parent
- **JSONB**: Flexible storage for coords, tags, settings
- **Connection pooling**: Max 20 connections, 30s idle timeout

---

## Design Patterns

### 1. Singleton Pattern

Used for shared state across components:

```javascript
// Module-level (composables)
const cuisines = ref([])
const loaded = ref(false)

export function useConfig() {
  // All components share the same refs
  return { cuisines, loaded }
}
```

**Applied in**: `useAdmin`, `useConfig`, `useMethodology`, `db.js`

### 2. Composition over Inheritance

Functions return reactive objects instead of class inheritance:

```javascript
// Composable composition
const { places, addPlace } = useFoodTracker()
const { isAdmin } = useAdmin()
const { tiers, getTierBadgeClass } = useConfig()
```

### 3. Separation of Concerns

| Layer | Responsibility | Location |
|-------|----------------|----------|
| Presentation | Rendering, events | `components/` |
| Business Logic | State, transformations | `composables/` |
| Data Access | HTTP abstraction | `services/api.js` |
| API | Routes, middleware | `api/index.js` |
| Persistence | Connection, queries | `database/` |

### 4. Guard Clauses (Fail Fast)

```javascript
function requireAdmin(req, res, next) {
  if (adminKey !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
```

### 5. Middleware Pattern

Express middleware chain for cross-cutting concerns:

```javascript
app.use(cors())
app.use(express.json())
app.post('/api/places', requireAdmin, handler)
```

### 6. Factory Pattern

Creating derived objects from raw data:

```javascript
tierOptions: computed(() => tiers.value.map(t => ({
  code: t.code,
  label: `${t.code} - ${t.description}`,
  colorClass: t.color_class,
})))
```

---

## Code Quality Guidelines

This project adheres to the principles defined below

### DRY (Don't Repeat Yourself)
- API wrapper functions (`request`, `adminRequest`)
- Reusable composables across components
- Computed properties for derived state

### KISS (Keep It Simple)
- Header-based auth (no JWT complexity)
- localStorage fallback (no complex offline sync)
- REST API (no GraphQL overhead)

### YAGNI (You Aren't Gonna Need It)
- No TypeScript (not needed for current scope)
- No Vuex/Pinia (composables sufficient)
- No WebSockets (REST adequate for update frequency)
- No user accounts (simple admin session)

### SOLID Principles

| Principle | Application |
|-----------|-------------|
| **SRP** | Each composable has one responsibility |
| **OCP** | Config system extensible without code changes |
| **LSP** | All API calls follow consistent patterns |
| **ISP** | Props are specific to component needs |
| **DIP** | Components depend on composable abstractions |

---

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_SECRET` | Admin authentication key |
| `VITE_API_URL` | API base URL (optional) |

### Build Process

```bash
pnpm install        # Install dependencies
pnpm lint           # Run ESLint
pnpm build          # Vite production build
pnpm migrate        # Run database migrations
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| App entry | `src/App.vue` |
| Main state | `src/composables/useFoodTracker.js` |
| API client | `src/services/api.js` |
| Backend routes | `api/index.js` |
| DB connection | `database/db.js` |
| Schema | `database/schema.sql` |
| Build config | `vite.config.js` |
| Styling | `tailwind.config.js` |
