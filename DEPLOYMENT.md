# Deployment Guide

## Prerequisites

1. **PostgreSQL Database** (Neon recommended)
2. **Google Maps API Key** with the following APIs enabled:
   - Maps JavaScript API
   - Geocoding API

## Setting up the Database

### Option 1: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (format: `postgresql://username:password@hostname/database?sslmode=require`)

### Option 2: Vercel Marketplace

1. Go to your Vercel project dashboard
2. Navigate to Storage tab
3. Add Neon database from the marketplace
4. Connection string will be automatically added as `DATABASE_URL`

## Setting up Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

## Environment Variables

Add these environment variables in your Vercel dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `VITE_GOOGLE_MAP_API` | Google Maps API key |

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Import your repository at [vercel.com](https://vercel.com)
   - Add environment variables
   - Deploy

3. **Database Migration**:
   - Migrations run automatically during build via `vercel-build` script

## Testing Your Deployment

After deployment, verify these endpoints:

- `https://your-app.vercel.app/api/health` - Should return database status
- `https://your-app.vercel.app/api/places` - Should return restaurants array

## Local Development

Create a `.env.local` file in the project root:

```
DATABASE_URL=your_database_connection_string
VITE_GOOGLE_MAP_API=your_google_maps_api_key
```

Then run:
```bash
pnpm dev
```

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` is correctly set
- Check if database is accessible (not paused on free tier)

### Google Maps Not Loading
- Verify `VITE_GOOGLE_MAP_API` is set
- Check API key restrictions in Google Cloud Console
- Ensure Maps JavaScript API and Geocoding API are enabled

### Build Failures
- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vue.js App    │────▶│  Vercel Edge    │────▶│  Neon Postgres  │
│  (Static Files) │     │  (Serverless)   │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Google Maps    │
│      API        │
└─────────────────┘
```
