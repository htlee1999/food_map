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

## Setting up Google Sign-In (OAuth)

Friend accounts sign in with Google. In the same Google Cloud project:

1. **APIs & Services → OAuth consent screen**: configure as External, add app
   name and contact email. Publish the app (basic sign-in needs no review),
   or stay in Testing mode and list your friends as test users.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   type **Web application**.
3. Under **Authorized JavaScript origins** add `http://localhost:5173` and
   your production URL. No redirect URIs are needed (popup flow).
4. Copy the client ID (ends in `.apps.googleusercontent.com`) into
   `VITE_GOOGLE_CLIENT_ID`.

## Environment Variables

Add these environment variables in your Vercel dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `VITE_GOOGLE_MAP_API` | yes | Google Maps API key |
| `VITE_GOOGLE_CLIENT_ID` | yes | Google OAuth client ID (sign-in) |
| `SESSION_SECRET` | yes | Signs session cookies — generate with `openssl rand -hex 32` |
| `ADMIN_SECRET` | yes | Legacy `?admin=` URL access key |
| `BLOB_READ_WRITE_TOKEN` | for blog images | Vercel Blob storage token |

> **The server refuses to start in production if `SESSION_SECRET` or
> `ADMIN_SECRET` is missing** — this is deliberate, so a misconfigured deploy
> can never run with forgeable sessions. Changing `SESSION_SECRET` signs
> everyone out (harmless).

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
   - Migrations run automatically during build: `vercel.json` sets
     `buildCommand` to `pnpm run vercel-build`, which applies the idempotent
     `database/schema.sql` before building the frontend

## Testing Your Deployment

After deployment, verify these endpoints:

- `https://your-app.vercel.app/api/health` - Should return database status
- `https://your-app.vercel.app/api/places` - Should return restaurants array

## Local Development

Create a `.env.local` file in the project root:

```
DATABASE_URL=your_database_connection_string
VITE_GOOGLE_MAP_API=your_google_maps_api_key
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id
SESSION_SECRET=any_long_random_string
ADMIN_SECRET=your_admin_key
```

Then run:
```bash
pnpm dev
```

This starts the Express API on port 3001 and Vite on port 5173 (which
proxies `/api` to the API, so cookies work same-origin).

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` is correctly set
- Check if database is accessible (not paused on free tier)

### Google Maps Not Loading
- Verify `VITE_GOOGLE_MAP_API` is set
- Check API key restrictions in Google Cloud Console
- Ensure Maps JavaScript API and Geocoding API are enabled

### Google Sign-In Not Working
- Verify `VITE_GOOGLE_CLIENT_ID` is set (the button hides itself when missing)
- Check the site's origin is listed under Authorized JavaScript origins
- If the consent screen is in Testing mode, the signer must be a listed test user

### Build Failures
- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- A production function that exits immediately usually means `SESSION_SECRET`
  or `ADMIN_SECRET` is missing (see Environment Variables)

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
