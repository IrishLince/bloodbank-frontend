// Hospital API Service with ACCURATE Real-Time GPS Location
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

class HospitalService {
  constructor() {
    this.currentUserLocation = null;
    this.locationWatchId = null;
  }

  // Get user's ACTUAL current location using GPS
  async getCurrentLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true, // Use GPS for accurate location
        timeout: 10000,
        maximumAge: 0 // Don't use cached location
      };

      const finalOptions = { ...defaultOptions, ...options };

      console.log('📍 Getting your actual GPS location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          this.currentUserLocation = location;
          console.log('✅ Got your actual location:', location);
          console.log(`📍 Accuracy: ${location.accuracy.toFixed(0)} meters`);
          
          resolve(location);
        },
        (error) => {
          console.error('❌ Location error:', error.message);
          let errorMessage = 'Unable to get your location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable. Make sure GPS is enabled.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += error.message;
          }
          
          reject(new Error(errorMessage));
        },
        finalOptions
      );
    });
  }

  // Watch user's location for continuous updates
  startWatchingLocation(callback) {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        this.currentUserLocation = location;
        console.log('📍 Location updated:', location);
        
        if (callback) callback(location);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      options
    );

    return this.locationWatchId;
  }

  // Stop watching location
  stopWatchingLocation() {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
      console.log('📍 Stopped watching location');
    }
  }

  // Fetch all hospitals from backend
  async getAllHospitals() {
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals/donation-centers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hospitals = await response.json();
      
      return hospitals.map(hospital => ({
        ...hospital,
        distance: null,
        coordinates: hospital.coordinates || null,
        address: hospital.address || hospital.location,
        name: hospital.hospitalName || hospital.name,
        hours: hospital.operatingHours || hospital.hours || '24/7',
        urgent: hospital.urgentNeed || hospital.urgent || false,
        availability: hospital.availability || 'Medium'
      }));
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw new Error(`Failed to fetch hospitals: ${error.message}`);
    }
  }

  // Improved Haversine formula with higher precision
  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!this.isValidCoordinate(lat1, lng1) || !this.isValidCoordinate(lat2, lng2)) {
      console.warn('Invalid coordinates for distance calculation');
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    
    const toRad = (deg) => deg * (Math.PI / 180);
    
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  // Validate coordinate values
  isValidCoordinate(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      !isNaN(lat) && 
      !isNaN(lng) &&
      lat >= -90 && 
      lat <= 90 &&
      lng >= -180 && 
      lng <= 180
    );
  }

  // Extract coordinates from various formats
  extractCoordinates(location) {
    if (!location) return null;

    const lat = location.lat || location.latitude || location.coords?.latitude;
    const lng = location.lng || location.longitude || location.coords?.longitude;

    if (this.isValidCoordinate(lat, lng)) {
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    return null;
  }

  // Format distance for display
  formatDistance(distanceKm) {
    if (distanceKm === null || distanceKm === undefined) {
      return 'Distance unavailable';
    }

    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    } else {
      return `${Math.round(distanceKm)} km`;
    }
  }

  // Get hospitals using ACTUAL GPS location
  async getHospitalsForLocation(userLocation = null, maxDistanceKm = 15) {
    try {
      console.log('🌍 Fetching hospitals based on your ACTUAL location...');
      
      // If no location provided, get ACTUAL current GPS location
      let actualLocation = userLocation;
      
      if (!actualLocation || !this.extractCoordinates(actualLocation)) {
        console.log('📍 No location provided, getting your actual GPS location...');
        try {
          actualLocation = await this.getCurrentLocation();
        } catch (locationError) {
          console.error('❌ Could not get GPS location:', locationError.message);
          // Return all hospitals without distance
          const allHospitals = await this.getAllHospitals();
          return allHospitals.map(h => ({
            ...h,
            calculatedDistance: null,
            distanceText: 'Enable location to see distance',
            hasValidCoordinates: false
          }));
        }
      }

      const allHospitals = await this.getAllHospitals();
      const userCoords = this.extractCoordinates(actualLocation);
      
      if (!userCoords) {
        console.log('❌ Invalid user coordinates');
        return allHospitals.map(h => ({
          ...h,
          calculatedDistance: null,
          distanceText: 'Location not available',
          hasValidCoordinates: false
        }));
      }

      console.log(`📍 Your actual location: ${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}`);
      
      // Calculate REAL distance based on ACTUAL GPS coordinates
      const hospitalsWithDistance = allHospitals.map((hospital) => {
        const hospitalCoords = this.extractCoordinates(hospital.coordinates);
        
        if (hospitalCoords) {
          const distance = this.calculateDistance(
            userCoords.lat,
            userCoords.lng,
            hospitalCoords.lat,
            hospitalCoords.lng
          );
          
          if (distance !== null) {
            console.log(
              `🏥 ${hospital.hospitalName || hospital.name}: ${this.formatDistance(distance)} from your location`
            );
            
            return {
              ...hospital,
              calculatedDistance: distance,
              distanceText: this.formatDistance(distance),
              hasValidCoordinates: true,
              userLocation: userCoords, // Store user location for reference
              coordinates: hospitalCoords
            };
          }
        }
        
        return {
          ...hospital,
          calculatedDistance: Infinity,
          distanceText: 'Distance unavailable',
          hasValidCoordinates: false
        };
      });

      // Filter by max distance and sort by nearest
      const nearbyHospitals = hospitalsWithDistance
        .filter(h => h.hasValidCoordinates && h.calculatedDistance <= maxDistanceKm)
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

      console.log(`✅ Found ${nearbyHospitals.length} hospitals within ${maxDistanceKm}km of your actual location`);
      
      if (nearbyHospitals.length > 0) {
        console.log(
          `🏥 NEAREST: ${nearbyHospitals[0].hospitalName || nearbyHospitals[0].name} - ${nearbyHospitals[0].distanceText}`
        );
      } else {
        console.log(`⚠️ No hospitals found within ${maxDistanceKm}km. Try increasing the radius.`);
      }
      
      return nearbyHospitals;
      
    } catch (error) {
      console.error('❌ Error in location-based filtering:', error);
      const allHospitals = await this.getAllHospitals();
      return allHospitals.map(h => ({
        ...h,
        calculatedDistance: null,
        distanceText: 'Error calculating distance',
        hasValidCoordinates: false
      }));
    }
  }

  // Get N nearest hospitals from your ACTUAL location
  async getNearestHospitals(userLocation = null, limit = 5) {
    try {
      console.log('📍 Finding nearest hospitals from your actual location...');
      
      // Get actual GPS location if not provided
      let actualLocation = userLocation;
      if (!actualLocation || !this.extractCoordinates(actualLocation)) {
        actualLocation = await this.getCurrentLocation();
      }

      const allHospitals = await this.getAllHospitals();
      const userCoords = this.extractCoordinates(actualLocation);
      
      if (!userCoords) {
        return allHospitals.slice(0, limit);
      }

      console.log(`📍 Calculating from: ${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}`);

      const hospitalsWithDistance = allHospitals
        .map(hospital => {
          const hospitalCoords = this.extractCoordinates(hospital.coordinates);
          
          if (hospitalCoords) {
            const distance = this.calculateDistance(
              userCoords.lat,
              userCoords.lng,
              hospitalCoords.lat,
              hospitalCoords.lng
            );
            
            return {
              ...hospital,
              calculatedDistance: distance,
              distanceText: this.formatDistance(distance),
              hasValidCoordinates: true,
              userLocation: userCoords
            };
          }
          
          return {
            ...hospital,
            calculatedDistance: Infinity,
            distanceText: 'Distance unavailable',
            hasValidCoordinates: false
          };
        })
        .filter(h => h.hasValidCoordinates)
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance)
        .slice(0, limit);

      console.log(`✅ Found ${limit} nearest hospitals:`);
      hospitalsWithDistance.forEach((h, i) => {
        console.log(`${i + 1}. ${h.hospitalName || h.name} - ${h.distanceText}`);
      });

      return hospitalsWithDistance;
      
    } catch (error) {
      console.error('❌ Error fetching nearest hospitals:', error);
      throw error;
    }
  }
}

// Create singleton instance
const hospitalService = new HospitalService();
export default hospitalService;