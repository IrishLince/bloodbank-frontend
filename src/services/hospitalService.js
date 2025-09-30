// Hospital API Service with Enhanced Distance Calculation
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

class HospitalService {
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

  // Fetch hospitals near a specific location (with radius)
  async getHospitalsNearLocation(latitude, longitude, radiusKm = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hospitals/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

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
      console.error('Error fetching nearby hospitals:', error);
      throw new Error(`Failed to fetch nearby hospitals: ${error.message}`);
    }
  }

  // Improved Haversine formula with higher precision
  calculateDistance(lat1, lng1, lat2, lng2) {
    // Validate inputs
    if (!this.isValidCoordinate(lat1, lng1) || !this.isValidCoordinate(lat2, lng2)) {
      console.warn('Invalid coordinates provided for distance calculation');
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    
    // Convert to radians
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
    const distance = R * c;

    return distance; // Returns distance in kilometers
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

    // Handle different coordinate formats
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

  // Get hospitals with REALTIME location-based filtering and accurate distances
  async getHospitalsForLocation(userLocation = null, maxDistanceKm = 15) {
    try {
      console.log('🌍 Fetching all hospitals for realtime distance calculation...');
      const allHospitals = await this.getAllHospitals();
      
      // Extract user coordinates
      const userCoords = this.extractCoordinates(userLocation);
      
      if (!userCoords) {
        console.log('🌍 No valid user location coordinates, returning all hospitals');
        console.log('🌍 User location received:', userLocation);
        return allHospitals.map(hospital => ({
          ...hospital,
          calculatedDistance: null,
          distanceText: 'Location not available',
          hasValidCoordinates: false
        }));
      }

      console.log(`🌍 User location:`, userCoords);
      
      // Calculate realtime distance for each hospital
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
            console.log(
              `🏥 ${hospital.hospitalName || hospital.name}: ${this.formatDistance(distance)} away`
            );
            
            return {
              ...hospital,
              calculatedDistance: distance,
              distanceText: this.formatDistance(distance),
              hasValidCoordinates: true,
              coordinates: hospitalCoords // Ensure normalized coordinates
            };
          }
        }
        
        console.log(`⚠️ ${hospital.hospitalName || hospital.name}: Invalid coordinates`, hospital.coordinates);
        
        return {
          ...hospital,
          calculatedDistance: Infinity,
          distanceText: 'Distance unavailable',
          hasValidCoordinates: false
        };
      });

      // Filter and sort hospitals
      const nearbyHospitals = hospitalsWithDistance
        .filter(hospital => {
          // Include hospitals with valid distances within range
          return hospital.hasValidCoordinates && 
                 hospital.calculatedDistance <= maxDistanceKm;
        })
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

      console.log(`🌍 Found ${nearbyHospitals.length} hospitals within ${maxDistanceKm}km`);
      
      if (nearbyHospitals.length > 0) {
        console.log(
          `🏥 Nearest: ${nearbyHospitals[0].hospitalName || nearbyHospitals[0].name} - ${nearbyHospitals[0].distanceText}`
        );
      } else {
        console.log(`⚠️ No hospitals found within ${maxDistanceKm}km radius`);
      }
      
      return nearbyHospitals;
      
    } catch (error) {
      console.error('Error in realtime location filtering:', error);
      // Fallback to all hospitals without distance calculation
      const allHospitals = await this.getAllHospitals();
      return allHospitals.map(hospital => ({
        ...hospital,
        calculatedDistance: null,
        distanceText: 'Error calculating distance',
        hasValidCoordinates: false
      }));
    }
  }

  // Get N nearest hospitals regardless of distance
  async getNearestHospitals(userLocation, limit = 5) {
    try {
      const allHospitals = await this.getAllHospitals();
      const userCoords = this.extractCoordinates(userLocation);
      
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
              hasValidCoordinates: true
            };
          }
          
          return {
            ...hospital,
            calculatedDistance: Infinity,
            distanceText: 'Distance unavailable',
            hasValidCoordinates: false
          };
        })
        .filter(hospital => hospital.hasValidCoordinates)
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance)
        .slice(0, limit);

      return hospitalsWithDistance;
      
    } catch (error) {
      console.error('Error fetching nearest hospitals:', error);
      throw error;
    }
  }
}

// Create singleton instance
const hospitalService = new HospitalService();
export default hospitalService;