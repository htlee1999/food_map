# Google Maps API Setup Guide

This guide will help you set up Google Maps API for your Singapore Food Places Tracker application.

## Step 1: Get Your Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (for displaying the map)
   - **Geocoding API** (for converting addresses to coordinates)
   - **Places API** (optional, for enhanced location search)

## Step 2: Configure Your API Key

### Environment Variable Configuration (Recommended)

1. Create a `.env.local` file in your project root:
   ```bash
   VITE_GOOGLE_MAP_API=your_actual_api_key_here
   ```

2. Replace `your_actual_api_key_here` with your actual Google Maps API key

3. Restart your development server:
   ```bash
   npm run dev
   ```

**Note**: The application now automatically reads the API key from the `.env.local` file using the `VITE_GOOGLE_MAP_API` environment variable.

## Step 3: Secure Your API Key

**Important**: Always restrict your API key to prevent unauthorized usage:

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Set up **Application restrictions**:
   - Choose **HTTP referrers** for web applications
   - Add your domain (e.g., `https://yourwebsite.com/*`, `http://localhost:*`)
4. Set up **API restrictions**:
   - Select **Restrict key**
   - Choose only the APIs you need (Maps JavaScript API, Geocoding API)

## Step 4: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Open your browser and check the console for:
   - ✅ "Google Maps API loaded successfully"
   - Any error messages about API key configuration

## Free Tier Limits

Google Maps API offers generous free usage limits:

- **Maps JavaScript API**: Up to 28,000 map loads per month
- **Geocoding API**: Up to 40,000 requests per month
- **Places API**: Approximately 5,000 requests per month

## Troubleshooting

### Common Issues:

1. **"Google Maps API key not configured"**
   - Make sure you've replaced the placeholder with your actual API key

2. **"REQUEST_DENIED" error**
   - Check that your API key restrictions allow your domain
   - Verify that the required APIs are enabled

3. **"OVER_QUERY_LIMIT" error**
   - You've exceeded the free tier limits
   - Consider setting up billing or optimizing your usage

4. **Map not loading**
   - Check browser console for JavaScript errors
   - Verify your API key is correct and has proper permissions

## Cost Management Tips

1. **Monitor Usage**: Check your usage in Google Cloud Console
2. **Set Quotas**: Set daily quotas to prevent unexpected costs
3. **Cache Results**: Implement caching for geocoding requests
4. **Optimize Requests**: Only make API calls when necessary

## Migration from OneMap

This application has been migrated from OneMap to Google Maps. The key changes include:

- **Map Rendering**: Now uses Google Maps instead of Leaflet/OneMap tiles
- **Geocoding**: Uses Google Geocoding API instead of OneMap search API
- **Styling**: Custom markers and info windows adapted for Google Maps
- **Bounds**: Singapore-specific bounds maintained for better user experience

The migration maintains all existing functionality while providing better geocoding accuracy and a more polished map experience.
