# Singapore Food Tracker

A Vue.js application for tracking and rating food places in Singapore with an interactive Google Maps integration. Organize restaurants by cuisine type (Zi Char, Ramen) and rate them using a tier system.

## Features

- Interactive Google Maps showing restaurant locations in Singapore
- Category filtering (Zi Char / Ramen)
- Tier-based rating system (S, A, B, C, D, F)
- **Admin-only management** - Only authenticated users can add, edit, and delete restaurants
- **Public voting system** - Visitors can agree/disagree with ratings using thumbs up/down
- Search and filter by name, address, or tier
- Address geocoding with Google Maps API
- Responsive mobile-first design
- Real-time data synchronization with PostgreSQL

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
ADMIN_SECRET=your_secret_key_for_admin_access
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
   - `ADMIN_SECRET` - Secret key for admin access

3. **Deploy**:
```sh
git push origin main
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
src/
├── components/
│   ├── MapContainer.vue # Google Maps with markers and info windows
│   ├── AddPlaceForm.vue # Add new restaurant form (admin only)
│   ├── Sidebar.vue      # Sidebar with filters and list
│   └── ViewAllModal.vue # Modal for viewing/editing all places
├── composables/
│   ├── useFoodTracker.js # Main app state management
│   ├── useAdmin.js       # Admin authentication state
│   └── useVoting.js      # Public voting functionality
├── services/
│   └── api.js           # API client with admin headers

api/                     # Vercel serverless API
database/                # Database utilities
├── db.js               # Database connection
├── migrate.js          # Migration script
└── schema.sql          # Database schema (places, comments, votes)
```

## API Endpoints

### Public Endpoints
- `GET /api/places` - Get all restaurants
- `GET /api/places/:id/comments` - Get comments for a restaurant
- `GET /api/places/:id/votes` - Get vote counts for a restaurant
- `POST /api/places/:id/votes` - Submit a vote (thumbs up/down)
- `DELETE /api/places/:id/votes` - Remove a vote
- `GET /api/health` - Health check with database status

### Admin Endpoints (requires `x-admin-key` header)
- `POST /api/places` - Add a new restaurant
- `PUT /api/places/:id` - Update a restaurant
- `DELETE /api/places/:id` - Delete a restaurant
- `POST /api/places/:id/comments` - Add a comment/review
- `DELETE /api/comments/:id` - Delete a comment

## Admin Access

To access admin features (add/edit/delete restaurants and reviews):

1. Set your `ADMIN_SECRET` environment variable
2. Visit the app with `?admin=YOUR_SECRET` in the URL:
   ```
   https://yoursite.com?admin=your-secret-key
   ```
3. The admin session persists until you close the browser

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
