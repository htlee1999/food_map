# Singapore Food Map

A Vue.js application for tracking and rating food places in Singapore with an interactive Google Maps integration. Organize restaurants by cuisine type, rate them using a tier system, and share ratings with your friends — like Google reviews, but scoped to people whose taste you actually trust.

## Features

- Interactive Google Maps showing restaurant locations in Singapore (OneMap fallback)
- Category filtering by cuisine type (Zi Char, Chinese, Ramen, Korean, etc.)
- Tier-based rating system (S, A, B, C, D, F)
- **Friend groups** - Sign in with Google, create a group, share an invite link, and see how your friends rate every place
- **Public / Friends map toggle** - Pins colored by the editorial tier, or by your group's median tier
- **Friend-added places** - Friends can add spots visible only to their groups; the public map stays curated
- **"Up to you" spin wheel** - Can't decide? Let the wheel pick a random restaurant (group-scoped in friends view)
- **Public voting system** - Visitors can agree/disagree with ratings using thumbs up/down
- Search and filter by name, address, or tier
- Address geocoding with Google Maps API
- Responsive mobile-first design with dedicated mobile controls

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Backend**: Node.js + Express (Vercel Serverless)
- **Database**: PostgreSQL (Neon)
- **Maps**: Google Maps JavaScript API
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Development Setup

### Prerequisites

- Node.js (^20.19.0 || >=22.12.0)
- pnpm
- Google Maps API key
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository

2. Install dependencies:
```sh
pnpm install
```

3. Set up environment variables:
```sh
# Create .env.local file with:
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
VITE_GOOGLE_MAP_API=your_google_maps_api_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id   # for "Sign in with Google"
SESSION_SECRET=any_long_random_string               # signs session cookies
```

4. Run database migrations:
```sh
pnpm run migrate
```

### Development

```sh
pnpm dev
```

### Build for Production

```sh
pnpm build
```

### Code Quality

```sh
# Lint JavaScript and Vue files
pnpm run lint

# Auto-fix linting issues
pnpm run lint:fix
```

## Deployment

This application is configured for deployment on Vercel with automatic database migrations.

1. **Set up Neon Database** via [Vercel Marketplace](https://vercel.com/marketplace) or [neon.tech](https://neon.tech)

2. **Add Environment Variables** in Vercel:
   - `DATABASE_URL` - PostgreSQL connection string
   - `VITE_GOOGLE_MAP_API` - Google Maps API key
   - `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID (sign-in)
   - `SESSION_SECRET` - signs session cookies (required in production)
   - `ADMIN_SECRET` - legacy admin URL key (required in production)

3. **Deploy**:
```sh
git push origin main
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
src/
├── components/
│   ├── MapContainer.vue  # Map orchestrator (Google Maps / OneMap providers)
│   ├── map/              # Map providers + PlacePopup component
│   ├── Sidebar.vue       # Categories, account, add place
│   ├── AuthControl.vue   # Google sign-in
│   ├── GroupsModal.vue   # Friend groups + invite links
│   └── ...               # AdminPanel, ViewAllModal, SpinWheel, Blog, etc.
├── composables/
│   ├── useFoodTracker.js # Places state
│   ├── useAuth.js        # Session user (Google sign-in)
│   ├── useRatings.js     # Friend ratings + group-tier summary
│   ├── useGroups.js      # Friend groups + invites
│   ├── useAdmin.js       # Admin state
│   └── ...               # useConfig, useVoting, useBlog, useMethodology
├── services/
│   └── api.js            # API client

api/
├── index.js              # App assembly (Vercel serverless entry)
├── _lib/                 # Auth/session helpers, shared constants
└── _routes/              # One Express router per domain

database/
├── db.js                 # Database connection pool
├── migrate.js            # Migration runner (applies schema.sql)
├── schema.sql            # Full schema (users, places, ratings, groups, ...)
└── migrations/           # Numbered change documentation
```

See [documentations/ARCHITECTURE.md](./documentations/ARCHITECTURE.md) for the full architecture reference.

## API Endpoints

### Public Endpoints
- `GET /api/places` - Get all restaurants
- `GET /api/places/:id/comments` - Get comments for a restaurant
- `GET /api/places/:id/votes` - Get vote counts for a restaurant
- `POST /api/places/:id/votes` - Submit a vote (thumbs up/down)
- `DELETE /api/places/:id/votes` - Remove a vote
- `GET /api/health` - Health check with database status

### Auth Endpoints (Google sign-in)
- `POST /api/auth/google` - Exchange a Google ID token for a session cookie
- `GET /api/auth/me` - Get the current signed-in user (`{ user: null }` when signed out)
- `POST /api/auth/logout` - Clear the session cookie

### Friend Rating Endpoints (requires sign-in)
- `GET /api/places/:id/ratings` - Ratings from your friend groups (empty when signed out)
- `GET /api/ratings/summary` - Per-place group median tier for the friends map view
- `PUT /api/places/:id/rating` - Create/update your rating (`{ tier, review }`)
- `DELETE /api/places/:id/rating` - Remove your rating

Signed-in users can also `POST /api/places`: friend-added places are visible only
to their groups (`created_by` set), while admin-added places are public/editorial.

### Group Endpoints (requires sign-in)
- `GET /api/groups` - Your groups with members
- `POST /api/groups` - Create a group (`{ name }`); you become the first member
- `POST /api/groups/join` - Join via `{ invite_code }` (shareable as `?join=CODE` link)
- `DELETE /api/groups/:id/members/me` - Leave a group (deleted when the last member leaves)

### Admin Endpoints (admin account session, or legacy `x-admin-key` header)
- `POST /api/places` - Add a new restaurant
- `PUT /api/places/:id` - Update a restaurant
- `DELETE /api/places/:id` - Delete a restaurant
- `POST /api/places/:id/comments` - Add a comment/review
- `DELETE /api/comments/:id` - Delete a comment

## Admin Access

Two ways to get admin features (add/edit/delete restaurants and reviews):

1. **Admin account (preferred):** sign in with Google using an account whose
   `users.is_admin` flag is set (`UPDATE users SET is_admin = TRUE WHERE id = ...`)
2. **Legacy secret URL:** set the `ADMIN_SECRET` environment variable and visit
   the app with `?admin=YOUR_SECRET` in the URL; the session persists until you
   close the browser

**Admin features:**
- Add Place button in sidebar
- Edit/Delete buttons in View All modal
- Add/Delete review buttons on map popups

**Public features:**
- View all restaurants and reviews
- Thumbs up/down voting on each restaurant

## Tier Rating System

| Tier | Description |
|------|-------------|
| S | Would bring gf's parents |
| A | Worth the Grab ride |
| B | If nearby, why not |
| C | Last resort makan |
| D | Leftovers > this |
| F | Avoid like GST hikes |

## License

MIT
