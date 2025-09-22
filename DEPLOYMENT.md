# Vercel Deployment Guide

This guide will help you deploy your Singapore Food Tracker application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket
3. **Vercel CLI** (optional): `npm install -g vercel`

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect your Vue.js project

3. **Configure Environment Variables**
   - In your Vercel project dashboard, go to Settings → Environment Variables
   - Add the following variable:
     - `VITE_API_URL`: Leave empty (will use same domain for API)

4. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Your app will be available at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Confirm project settings
   - Wait for deployment

## Project Structure for Vercel

```
food_map/
├── api/                 # Serverless API functions
│   └── index.js         # Main API handler
├── src/                 # Vue.js frontend
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Important Notes

### Data Storage
- **Current Setup**: Uses temporary JSON files in `/tmp` directory
- **Limitation**: Data will be lost between serverless function invocations
- **Recommendation**: Migrate to a database (MongoDB Atlas, Supabase, etc.) for production

### Environment Variables
- Frontend: Use `VITE_` prefix for environment variables
- Backend: Use standard `process.env` variables
- Set in Vercel dashboard under Settings → Environment Variables

### API Routes
- All API routes are prefixed with `/api/`
- Frontend automatically uses the same domain for API calls
- CORS is configured for cross-origin requests

## Troubleshooting

### Build Issues
- Ensure all dependencies are in `package.json`
- Check that Node.js version is compatible (^20.19.0 || >=22.12.0)
- Verify `vercel.json` configuration

### API Issues
- Check Vercel function logs in dashboard
- Verify API routes are working: `https://your-app.vercel.app/api/health`
- Ensure CORS is properly configured

### Environment Variables
- Make sure `VITE_` prefix is used for frontend variables
- Check that variables are set in Vercel dashboard
- Restart deployment after adding new environment variables

## Next Steps

1. **Database Migration**: Consider migrating from JSON files to a proper database
2. **Custom Domain**: Add a custom domain in Vercel dashboard
3. **Analytics**: Enable Vercel Analytics for performance monitoring
4. **CI/CD**: Set up automatic deployments on Git push

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vue.js on Vercel](https://vercel.com/guides/deploying-vuejs-to-vercel)
- [Serverless Functions](https://vercel.com/docs/functions)
