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

      console.log('📍 Getting your ACTUAL GPS location with high accuracy...');

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
          
          console.log('✅ Got your ACTUAL GPS location:', {
            coordinates: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
            accuracy: `${location.accuracy.toFixed(0)} meters`,
            timestamp: new Date(location.timestamp).toLocaleString()
          });
          
          // Warn if accuracy is poor
          if (location.accuracy > 100) {
            console.warn('⚠️ GPS accuracy is LOW:', location.accuracy.toFixed(0), 'meters');
            console.warn('💡 Try moving to an open area or check if GPS is enabled');
          } else if (location.accuracy < 50) {
            console.log('✅ GPS accuracy is EXCELLENT:', location.accuracy.toFixed(0), 'meters');
          }
          
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
      enableHighAccuracy: true,  // ✅ Use GPS
      timeout: 10000,
      maximumAge: 0              // ✅ Always fresh location
    };

    console.log('👀 Started watching your location...');

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        this.currentUserLocation = location;
        console.log('📍 Location updated:', {
          coordinates: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
          accuracy: `${location.accuracy.toFixed(0)}m`
        });
        
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

  // ✅ ACCURATE Haversine formula for distance calculation
  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!this.isValidCoordinate(lat1, lng1) || !this.isValidCoordinate(lat2, lng2)) {
      console.warn('Invalid coordinates for distance calculation');
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
      console.log('🌍 Fetching hospitals based on your ACTUAL GPS location...');
      
      // ✅ Step 1: Get ACTUAL GPS location if not provided
      let actualLocation = userLocation;
      
      if (!actualLocation || !this.extractCoordinates(actualLocation)) {
        console.log('📍 No valid location provided, getting ACTUAL GPS location...');
        try {
          actualLocation = await this.getCurrentLocation();
          console.log('✅ Successfully got GPS location');
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

      // ✅ Step 2: Fetch all hospitals
      const allHospitals = await this.getAllHospitals();
      console.log(`📊 Total hospitals from backend: ${allHospitals.length}`);

      // ✅ Step 3: Extract and validate user coordinates
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

      console.log(`📍 Your ACTUAL location: ${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}`);
      
      // ✅ Step 4: Calculate REAL distance for each hospital based on GPS coordinates
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
            const hospitalName = hospital.hospitalName || hospital.name;
            console.log(
              `🏥 [${index + 1}/${allHospitals.length}] ${hospitalName}: ${this.formatDistance(distance)} away`
            );
            
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
        
        console.log(`⚠️ ${hospital.hospitalName || hospital.name}: No valid coordinates`);
        
        return {
          ...hospital,
          calculatedDistance: Infinity,
          distanceText: 'Distance unavailable',
          hasValidCoordinates: false
        };
      });

      // ✅ Step 5: Filter hospitals within radius and sort by distance
      const nearbyHospitals = hospitalsWithDistance
        .filter(h => h.hasValidCoordinates && h.calculatedDistance <= maxDistanceKm)
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

      // ✅ Step 6: Log results
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ RESULTS: Found ${nearbyHospitals.length} hospitals within ${maxDistanceKm}km`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (nearbyHospitals.length > 0) {
        console.log('🏆 TOP 5 NEAREST HOSPITALS:');
        nearbyHospitals.slice(0, 5).forEach((h, i) => {
          console.log(`  ${i + 1}. ${h.hospitalName || h.name} - ${h.distanceText}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        console.log(`⚠️ No hospitals found within ${maxDistanceKm}km radius`);
        console.log(`💡 Try increasing the radius or check if hospital coordinates are correct`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return nearbyHospitals;
      
    } catch (error) {
      console.error('❌ Error in location-based filtering:', error);
      // Fallback: Return all hospitals without distance
      const allHospitals = await this.getAllHospitals();
      return allHospitals.map(h => ({
        ...h,
        calculatedDistance: null,
        distanceText: 'Error calculating distance',
        hasValidCoordinates: false
      }));
    }
  }

  // ✅ Get N nearest hospitals from your ACTUAL GPS location
  async getNearestHospitals(userLocation = null, limit = 5) {
    try {
      console.log(`📍 Finding ${limit} nearest hospitals from your ACTUAL location...`);
      
      // Get actual GPS location if not provided
      let actualLocation = userLocation;
      if (!actualLocation || !this.extractCoordinates(actualLocation)) {
        console.log('📍 Getting ACTUAL GPS location...');
        actualLocation = await this.getCurrentLocation();
      }

      const allHospitals = await this.getAllHospitals();
      const userCoords = this.extractCoordinates(actualLocation);
      
      if (!userCoords) {
        console.log('❌ Could not get valid coordinates');
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
        console.log(`  ${i + 1}. ${h.hospitalName || h.name} - ${h.distanceText}`);
      });

      return hospitalsWithDistance;
      
    } catch (error) {
      console.error('❌ Error fetching nearest hospitals:', error);
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

      console.log('📊 Hospitals by distance:');
      console.log(`  🟢 Very Near (< 5km): ${ranges.veryNear.length}`);
      console.log(`  🟡 Near (5-10km): ${ranges.near.length}`);
      console.log(`  🟠 Moderate (10-15km): ${ranges.moderate.length}`);
      console.log(`  🔴 Far (> 15km): ${ranges.far.length}`);

      return ranges;
    } catch (error) {
      console.error('Error getting hospitals by range:', error);
      throw error;
    }
  }
}

// Create singleton instance
const hospitalService = new HospitalService();
export default hospitalService;