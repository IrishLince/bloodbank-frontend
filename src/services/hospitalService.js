// Hospital API Service with ACCURATE Real-Time GPS Location
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

class HospitalService {
  constructor() {
    this.currentUserLocation = null;
    this.locationWatchId = null;
  }

  // ✅ Get user's ACTUAL current location using GPS with HIGH ACCURACY
  async getCurrentLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,  // ✅ CRITICAL: Force GPS usage
        timeout: 15000,            // ✅ Increased timeout for GPS lock
        maximumAge: 0              // ✅ CRITICAL: NEVER use cached location
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Getting GPS location with high accuracy

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed
          };
          
          this.currentUserLocation = location;
          
          resolve(location);
        },
        (error) => {
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
      return null;
    }

    const options = {
      enableHighAccuracy: true,  // ✅ Use GPS
      timeout: 10000,
      maximumAge: 0              // ✅ Always fresh location
    };

    // Started watching location

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        this.currentUserLocation = location;
        
        if (callback) callback(location);
      },
      (error) => {
        // Location watch error
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

  // Fetch all blood bank users from backend
  async getAllHospitals() {
    try {
      const response = await fetch(`${API_BASE_URL}/bloodbanks/donation-centers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const bloodBanks = await response.json();
      
      return bloodBanks.map(bloodBank => {
        // Extract preferred blood types from various possible field names
        // Priority: preferred_bloodtypes (DB field) > bloodTypesAvailable > preferredBloodTypes
        const preferredTypes = bloodBank.preferred_bloodtypes || 
                              bloodBank.bloodTypesAvailable || 
                              bloodBank.preferredBloodTypes || 
                              [];
        
        return {
          ...bloodBank,
          distance: null,
          address: bloodBank.address,
          name: bloodBank.bloodBankName || bloodBank.name,
          hours: bloodBank.operatingHours || '24/7',
          urgent: false,
          availability: 'Available',
          hospitalName: bloodBank.bloodBankName, // For compatibility
          phone: bloodBank.phone,
          email: bloodBank.email,
          bloodTypesAvailable: preferredTypes,
          preferredBloodTypes: preferredTypes // Also set this for clarity
        };
      });
    } catch (error) {
      throw new Error(`Failed to fetch blood bank centers: ${error.message}`);
    }
  }

  // ✅ ACCURATE Haversine formula for distance calculation
  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!this.isValidCoordinate(lat1, lng1) || !this.isValidCoordinate(lat2, lng2)) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    
    // Convert degrees to radians
    const toRad = (deg) => deg * (Math.PI / 180);
    
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

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

  // ✅ MAIN METHOD: Get hospitals with ACCURATE GPS-based filtering
  async getHospitalsForLocation(userLocation = null, maxDistanceKm = 15) {
    try {
      // Get ACTUAL GPS location if not provided
      let actualLocation = userLocation;
      
      if (!actualLocation || !this.extractCoordinates(actualLocation)) {
        try {
          actualLocation = await this.getCurrentLocation();
        } catch (locationError) {
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

      // Fetch all hospitals
      const allHospitals = await this.getAllHospitals();

      // Extract and validate user coordinates
      const userCoords = this.extractCoordinates(actualLocation);
      
      if (!userCoords) {
        return allHospitals.map(h => ({
          ...h,
          calculatedDistance: null,
          distanceText: 'Location not available',
          hasValidCoordinates: false
        }));
      }

      // Calculate REAL distance for each hospital based on GPS coordinates
      const hospitalsWithDistance = allHospitals.map((hospital, index) => {
        const hospitalCoords = this.extractCoordinates(hospital.coordinates);
        
        if (hospitalCoords) {
          const distance = this.calculateDistance(
            userCoords.lat,
            userCoords.lng,
            hospitalCoords.lat,
            hospitalCoords.lng
          );
          
          if (distance !== null) {
            return {
              ...hospital,
              calculatedDistance: distance,
              distanceText: this.formatDistance(distance),
              hasValidCoordinates: true,
              userLocation: userCoords,
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

      // Filter hospitals within radius and sort by distance
      // For maxDistanceKm >= 999 (get all), return all hospitals regardless of coordinates
      if (maxDistanceKm >= 999) {
        console.log(`🌍 GET ALL MODE (${maxDistanceKm}km) - Returning ALL ${hospitalsWithDistance.length} blood banks`);
        
        // Sort: valid coordinates first (by distance), then invalid coordinates
        const sortedHospitals = hospitalsWithDistance.sort((a, b) => {
          // Both have valid coordinates: sort by distance
          if (a.hasValidCoordinates && b.hasValidCoordinates) {
            return a.calculatedDistance - b.calculatedDistance;
          }
          // Only a has valid coordinates: a comes first
          if (a.hasValidCoordinates && !b.hasValidCoordinates) {
            return -1;
          }
          // Only b has valid coordinates: b comes first
          if (!a.hasValidCoordinates && b.hasValidCoordinates) {
            return 1;
          }
          // Neither has valid coordinates: maintain original order
          return 0;
        });
        
        return sortedHospitals;
      }
      
      // For specific radius filtering, only include hospitals with valid coordinates
      const nearbyHospitals = hospitalsWithDistance
        .filter(h => h.hasValidCoordinates && h.calculatedDistance <= maxDistanceKm)
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
      
      console.log(`🎯 RADIUS FILTER (${maxDistanceKm}km) - Returning ${nearbyHospitals.length} blood banks within radius`);
      return nearbyHospitals;
      
    } catch (error) {
      console.error('🚨 Error in getHospitalsForLocation:', error);
      
      // Fallback: Return all hospitals without distance
      try {
        const allHospitals = await this.getAllHospitals();
        const fallbackHospitals = allHospitals.map(h => ({
          ...h,
          calculatedDistance: null,
          distanceText: 'Error calculating distance',
          hasValidCoordinates: false
        }));
        
        console.log(`🔄 FALLBACK MODE - Returning ALL ${fallbackHospitals.length} blood banks without distance`);
        return fallbackHospitals;
      } catch (fallbackError) {
        console.error('🚨 Fallback failed:', fallbackError);
        return [];
      }
    }
  }

  // Get N nearest hospitals from your ACTUAL GPS location
  async getNearestHospitals(userLocation = null, limit = 5) {
    try {
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

      // Found nearest hospitals

      return hospitalsWithDistance;
      
    } catch (error) {
      throw error;
    }
  }

  // ✅ BONUS: Get hospitals by distance ranges
  async getHospitalsByDistanceRange(userLocation = null) {
    try {
      const allHospitals = await this.getHospitalsForLocation(userLocation, 999); // Get all with distances
      
      const ranges = {
        veryNear: allHospitals.filter(h => h.calculatedDistance < 5),      // < 5km
        near: allHospitals.filter(h => h.calculatedDistance >= 5 && h.calculatedDistance < 10), // 5-10km
        moderate: allHospitals.filter(h => h.calculatedDistance >= 10 && h.calculatedDistance < 15), // 10-15km
        far: allHospitals.filter(h => h.calculatedDistance >= 15)          // > 15km
      };

      // Hospitals categorized by distance ranges

      return ranges;
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
const hospitalService = new HospitalService();
export default hospitalService;