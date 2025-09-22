# Singapore Food Tracker

A Vue.js application for tracking food places in Singapore with interactive maps, place management, and user preferences. Built with a modern tech stack and deployed on Vercel with PostgreSQL database integration.

## Features

- 🗺️ Interactive map with Leaflet showing food places in Singapore
- 📍 Add and manage food places with detailed information
- ⭐ Mark places as visited or want-to-visit
- 📝 Add personal notes to places
- 📊 View place statistics and ratings
- 📱 Responsive design with Tailwind CSS
- 🔄 Real-time data synchronization with PostgreSQL
- 📁 Batch import functionality for multiple places
- 🏪 Filter places by cuisine type, price range, and ratings
- 🔍 Search and filter capabilities

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **Maps**: Leaflet
- **UI Components**: Custom components with Tailwind CSS
- **Deployment**: Vercel (serverless functions)
- **Package Manager**: pnpm

## Development Setup

### Prerequisites
- Node.js (^20.19.0 || >=22.12.0)
- pnpm
- Neon database (created via Vercel Marketplace)

### Installation

1. Clone the repository
2. Install dependencies:
```sh
pnpm install
```

3. Set up environment variables:
```sh
cp .env.example .env
# Edit .env with your DATABASE_URL from Neon
```

4. Run database migrations:
```sh
pnpm run migrate
```

### Development

Run both frontend and backend:
```sh
pnpm dev:full
```

Or run separately:
```sh
# Frontend only
pnpm dev

# Backend only
pnpm dev:backend
```

### Database Management

```sh
# Run migrations
pnpm run migrate

# Alternative command
pnpm run db:migrate
```

### Build for Production

```sh
pnpm build
```

## Deployment

This application is configured for deployment on Vercel with automatic database migrations.

### Deploy to Vercel

1. **Set up Neon Database**:
   - Create a Neon database via [Vercel Marketplace](https://vercel.com/marketplace)
   - Connect it to your Vercel project in the Storage tab

2. **Deploy**:
   ```sh
   git add .
   git commit -m "Deploy Singapore Food Tracker"
   git push origin main
   ```

3. **Automatic Setup**:
   - Vercel will automatically run database migrations during build
   - Your app will be available at your Vercel domain

### Environment Variables

The following environment variables are automatically set by Vercel when you connect your Neon database:
- `DATABASE_URL`: PostgreSQL connection string

## Project Structure

```
src/
├── components/          # Vue components
│   ├── ui/             # Reusable UI components
│   ├── MapContainer.vue # Main map component
│   ├── PlaceItem.vue   # Individual place component
│   ├── AddPlaceForm.vue # Add new place form
│   ├── Sidebar.vue     # Sidebar navigation
│   └── ViewAllModal.vue # Modal for viewing all places
├── composables/         # Vue composables
│   └── useFoodTracker.js # Main app logic
├── services/           # API services
│   └── api.js          # API client
└── lib/               # Utilities
    └── utils.js       # Helper functions

api/                    # Vercel serverless API functions
backend/               # Express server (development)
database/              # Database utilities
├── db.js              # Database connection
├── migrate.js         # Migration script
└── schema.sql         # Database schema
```

## API Endpoints

- `GET /api/places` - Get all food places
- `POST /api/places` - Add a new place
- `POST /api/places/batch` - Import multiple places
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Save user preferences
- `GET /api/health` - Health check with database status

## Database Features

- **PostgreSQL Integration**: Robust database with ACID compliance
- **Automatic Migrations**: Database schema is created automatically on deployment
- **Connection Pooling**: Efficient database connections for better performance
- **Data Validation**: Input validation and sanitization
- **User Preferences**: Track visited/want-to-visit status with personal notes
- **Batch Operations**: Import multiple places at once
- **Health Monitoring**: Database health checks included in API endpoints

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## License

MIT
