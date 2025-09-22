# Singapore Food Tracker

A Vue.js application for tracking food places in Singapore with interactive maps and place management features.

## Features

- 🗺️ Interactive map with Leaflet
- 📍 Add and manage food places
- 📊 Statistics and analytics
- 📱 Responsive design with Tailwind CSS
- 🔄 Real-time data synchronization
- 📁 CSV import/export functionality

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Maps**: Leaflet
- **UI Components**: Reka UI
- **Deployment**: Vercel (serverless)

## Development Setup

### Prerequisites
- Node.js (^20.19.0 || >=22.12.0)
- pnpm

### Installation

```sh
pnpm install
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

### Build for Production

```sh
pnpm build
```

## Deployment

This application is configured for deployment on Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to a Git repository
2. Import the project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Deploy automatically

## Project Structure

```
src/
├── components/          # Vue components
│   ├── ui/             # Reusable UI components
│   ├── MapContainer.vue # Main map component
│   ├── PlaceList.vue   # Places list
│   └── ...
├── composables/         # Vue composables
├── services/           # API services
└── lib/               # Utilities

api/                    # Serverless API functions
backend/               # Express server (development)
```

## Environment Variables

- `VITE_API_URL`: API base URL (defaults to localhost:3001 for development)

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## License

MIT
