# Google Maps API Setup Guide

This guide will help you set up Google Maps API integration for the blood bank donation center distance calculation feature.

## Prerequisites

1. Google Cloud Platform account
2. Credit card (required for Google Maps API, but has generous free tier)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `bloodbank-maps-api`
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API** (for map functionality)
   - **Distance Matrix API** (for distance calculations)
   - **Geocoding API** (for address to coordinates conversion)
   - **Places API** (optional, for enhanced location search)

## Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Click "Restrict Key" to secure it

## Step 4: Configure API Key Restrictions

### Application Restrictions
- Select "HTTP referrers (web sites)"
- Add your domains:
  ```
  http://localhost:3000/*
  https://yourdomain.com/*
  https://*.yourdomain.com/*
  ```

### API Restrictions
- Select "Restrict key"
- Choose these APIs:
  - Maps JavaScript API
  - Distance Matrix API
  - Geocoding API
  - Places API (if enabled)

## Step 5: Set Up Environment Variables

### For Development (.env.development)
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### For Production (.env.production)
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### For Local Development (.env.local)
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Step 6: Enable Billing (Required)

1. Go to "Billing" in Google Cloud Console
2. Link a billing account to your project
3. **Note**: Google Maps has a generous free tier:
   - Maps JavaScript API: 28,000 loads per month free
   - Distance Matrix API: $5 per 1000 requests (first $200/month free)
   - Geocoding API: $5 per 1000 requests (first $200/month free)

## Step 7: Test the Integration

1. Add your API key to the environment file
2. Restart your React development server
3. Navigate to the Donation Center page
4. Click "Enable Location" to test the functionality

## Security Best Practices

### 1. API Key Security
- Never commit API keys to version control
- Use environment variables for all environments
- Regularly rotate API keys
- Monitor API usage in Google Cloud Console

### 2. Domain Restrictions
- Always restrict API keys to specific domains
- Use HTTPS in production
- Regularly review and update allowed domains

### 3. Usage Monitoring
- Set up billing alerts in Google Cloud Console
- Monitor API usage regularly
- Implement rate limiting if needed

## Troubleshooting

### Common Issues

1. **"This API project is not authorized to use this API"**
   - Ensure the required APIs are enabled in Google Cloud Console
   - Check that billing is enabled for the project

2. **"The provided API key is invalid"**
   - Verify the API key is correct in your environment file
   - Check that the API key restrictions allow your domain
   - Ensure the key has access to the required APIs

3. **"Geolocation access denied"**
   - This is a browser/user permission issue, not an API issue
   - Ensure your site is served over HTTPS in production
   - Provide clear instructions to users about enabling location

4. **Distance calculations not working**
   - Check browser console for API errors
   - Verify Distance Matrix API is enabled
   - Ensure addresses in hospital data are valid and complete

### Testing Checklist

- [ ] API key is set in environment variables
- [ ] All required APIs are enabled in Google Cloud Console
- [ ] Billing is enabled for the Google Cloud project
- [ ] API key restrictions are properly configured
- [ ] Location permission works in browser
- [ ] Distance calculations display correctly
- [ ] Sorting by distance functions properly

## API Usage Estimates

For a typical blood bank application:
- **Maps JavaScript API**: ~1,000 loads/month (well within free tier)
- **Distance Matrix API**: ~500 requests/month (within free tier)
- **Geocoding API**: ~100 requests/month (within free tier)

Total estimated cost: **$0/month** (within free tier limits)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review Google Cloud Console logs
3. Verify API quotas and billing status
4. Test with a simple HTML page to isolate React-specific issues

## Environment File Template

Create a `.env.local` file in your project root:

```env
# Google Maps API Configuration
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Optional: Enable debug mode for development
REACT_APP_DEBUG_MAPS=true
```

Remember to add `.env.local` to your `.gitignore` file to prevent committing sensitive information.
