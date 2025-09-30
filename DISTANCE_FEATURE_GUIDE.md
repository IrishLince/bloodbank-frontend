# Distance Calculation Feature Guide

## Overview

The blood bank donation center now includes a powerful distance calculation feature that helps users find the nearest donation centers based on their current location using Google Maps API.

## Features Implemented

### 🗺️ **Location Services**
- **Automatic geolocation**: Requests user's current location with proper permission handling
- **Distance calculation**: Uses Google Maps Distance Matrix API for accurate driving distances
- **Fallback support**: Straight-line distance calculation if API fails
- **Real-time updates**: Distances update automatically when location changes

### 📱 **User Interface**
- **Permission prompts**: Clear UI for location access requests
- **Loading states**: Visual feedback during location and distance calculations
- **Error handling**: User-friendly error messages for various failure scenarios
- **Responsive design**: Works seamlessly on mobile and desktop

### 🔄 **Smart Sorting**
- **Distance-based sorting**: Automatically sorts hospitals by proximity when location is available
- **Fallback sorting**: Maintains original sorting when location is unavailable
- **Dynamic updates**: Re-sorts when new distance data becomes available

## How It Works

### 1. **Location Detection**
```javascript
// User clicks "Enable Location"
getCurrentLocation() → Browser requests permission → GPS coordinates obtained
```

### 2. **Distance Calculation**
```javascript
// For each hospital
calculateMultipleDistances(hospitals) → Google Maps API → Distance + Duration returned
```

### 3. **UI Updates**
```javascript
// Results displayed
Mobile: Distance badge on cards
Desktop: Distance column in table
```

## User Experience Flow

### First Visit
1. User navigates to Donation Center page
2. Blue banner appears: "Enable location to see nearby donation centers"
3. User clicks "Enable Location" button
4. Browser asks for location permission
5. If granted: Green banner shows "Location enabled"
6. Distances calculate and display automatically
7. Results sort by proximity (closest first)

### Subsequent Visits
- Location preference remembered by browser
- Automatic distance calculation if permission previously granted
- Option to disable location tracking anytime

### Error Scenarios
- **Permission denied**: Red banner with "Try Again" option
- **Location unavailable**: Graceful fallback to original view
- **API errors**: Fallback to straight-line distance calculation
- **Network issues**: Loading states with retry options

## Technical Implementation

### Files Created/Modified

#### **New Service Files**
- `src/services/googleMapsService.js` - Core Google Maps API integration
- `src/hooks/useLocation.js` - Location management hook
- `src/hooks/useDistanceCalculation.js` - Distance calculation hook

#### **Updated Components**
- `src/components/Donor/DonationCenter.jsx` - Main component with distance features

#### **Configuration Files**
- `.env.example` - Environment variable template
- `GOOGLE_MAPS_SETUP.md` - Complete API setup guide

### Key Features

#### **Google Maps Service**
```javascript
// Load Google Maps API dynamically
await googleMapsService.loadGoogleMapsAPI()

// Get user location
const location = await googleMapsService.getCurrentLocation()

// Calculate distances
const distances = await googleMapsService.calculateMultipleDistances(origin, destinations)
```

#### **Location Hook**
```javascript
const {
  location,           // Current user coordinates
  loading,           // Location request in progress
  error,             // Error message if any
  permissionStatus,  // 'granted', 'denied', 'prompt'
  getCurrentLocation // Function to request location
} = useLocation()
```

#### **Distance Hook**
```javascript
const {
  distances,                    // Map of hospital distances
  loading,                     // Distance calculation in progress
  calculateMultipleDistances,  // Batch calculate function
  sortHospitalsByDistance,     // Sort function
  getHospitalDistance         // Get specific hospital distance
} = useDistanceCalculation(userLocation)
```

## Setup Instructions

### 1. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env.local

# Add your Google Maps API key
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 2. **Google Maps API Setup**
Follow the complete guide in `GOOGLE_MAPS_SETUP.md`:
- Create Google Cloud project
- Enable required APIs
- Generate and restrict API key
- Set up billing (free tier available)

### 3. **Testing**
```bash
# Start development server
npm start

# Navigate to donation centers
# Click "Enable Location"
# Verify distances appear
```

## API Usage & Costs

### **Free Tier Limits**
- Maps JavaScript API: 28,000 loads/month
- Distance Matrix API: $5/1000 requests (first $200/month free)
- Geocoding API: $5/1000 requests (first $200/month free)

### **Estimated Usage**
For typical blood bank usage:
- **Monthly cost**: $0 (within free tier)
- **API calls per user session**: 1-3 requests
- **Expected monthly usage**: <1000 requests

## Browser Compatibility

### **Geolocation Support**
- ✅ Chrome 5+
- ✅ Firefox 3.5+
- ✅ Safari 5+
- ✅ Edge 12+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### **HTTPS Requirement**
- **Development**: Works on localhost (HTTP)
- **Production**: Requires HTTPS for geolocation

## Security Considerations

### **API Key Security**
- Environment variables only (never hardcoded)
- Domain restrictions enabled
- Regular key rotation recommended
- Usage monitoring enabled

### **User Privacy**
- Location permission required
- No location data stored
- Clear disable option provided
- Transparent about data usage

## Troubleshooting

### **Common Issues**

#### "Location access denied"
- **Cause**: User denied browser permission
- **Solution**: Click "Try Again" and allow permission
- **Prevention**: Clear explanation of why location is needed

#### "Distance calculation failed"
- **Cause**: Google Maps API error or network issue
- **Solution**: Automatic fallback to straight-line distance
- **Prevention**: Proper error handling implemented

#### "API key invalid"
- **Cause**: Missing or incorrect API key
- **Solution**: Check environment variables and API key setup
- **Prevention**: Follow setup guide carefully

### **Debug Mode**
Enable debug logging:
```env
REACT_APP_DEBUG_MAPS=true
```

## Future Enhancements

### **Potential Improvements**
- **Map visualization**: Interactive map showing hospital locations
- **Route directions**: Turn-by-turn navigation to selected hospital
- **Traffic-aware routing**: Real-time traffic consideration
- **Favorite locations**: Save frequently visited hospitals
- **Location history**: Remember previous search locations

### **Advanced Features**
- **Geofencing**: Notifications when near donation centers
- **Offline support**: Cached distances for offline use
- **Multi-modal transport**: Walking, public transit options
- **Accessibility**: Voice-guided navigation support

## Performance Optimization

### **Current Optimizations**
- **Batch API calls**: Multiple distances in single request
- **Caching**: Browser location caching (5 minutes)
- **Lazy loading**: Google Maps API loaded on demand
- **Debouncing**: Prevents excessive API calls
- **Fallback calculations**: Straight-line distance for offline scenarios

### **Monitoring**
- API usage tracking in Google Cloud Console
- Error logging for failed requests
- Performance metrics for distance calculations
- User interaction analytics

## Support

For technical issues:
1. Check browser console for errors
2. Verify API key setup in Google Cloud Console
3. Test with different browsers/devices
4. Review network connectivity
5. Check API quotas and billing status

For feature requests or bugs, please document:
- Browser and version
- Error messages (if any)
- Steps to reproduce
- Expected vs actual behavior
