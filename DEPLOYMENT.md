# Deployment Guide

## Setting up Production Database

### Option 1: Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://username:password@hostname/database?sslmode=require`)

### Option 2: Supabase (Alternative - Free Tier Available)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string

## Environment Variables Setup

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
NODE_ENV=production
```

## Database Migration

The database will be automatically migrated when you deploy to Vercel thanks to the `vercel-build` script in package.json.

## Deployment Steps

1. **Set up your cloud database** (Neon or Supabase)
2. **Add environment variables** in Vercel dashboard
3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

## Testing Your Deployment

After deployment, test these endpoints:
- `https://your-app.vercel.app/api/health` - Should return database health status
- `https://your-app.vercel.app/api/places` - Should return empty array initially

## Troubleshooting

### Common Issues:

1. **Database connection errors**: Check your DATABASE_URL environment variable
2. **CORS errors**: The API is configured to allow all origins in production
3. **Build failures**: Ensure all dependencies are in package.json

### Local Development:

For local development, create a `.env.local` file:
```
DATABASE_URL=your_local_or_cloud_database_url
VITE_API_URL=http://localhost:3001/api
```

## Architecture

- **Frontend**: Static files served by Vercel
- **Backend**: Serverless functions on Vercel
- **Database**: Cloud PostgreSQL (Neon/Supabase)
- **API Routes**: `/api/*` handled by Express.js in serverless functions
