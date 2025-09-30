// Hospital API Service
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
        credentials: 'include', // Include cookies for authentication if needed
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hospitals = await response.json();
      
      // Ensure each hospital has the required fields for distance calculation
      return hospitals.map(hospital => ({
        ...hospital,
        distance: null, // Will be calculated by Google Maps
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
        distance: null, // Will be calculated by Google Maps
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


  // Calculate accurate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  // Get hospitals with REALTIME location-based filtering
  async getHospitalsForLocation(userLocation = null, maxDistanceKm = 15) {
    try {
      // Always get ALL hospitals first
      console.log('🌍 Fetching all hospitals for realtime distance calculation...');
      const allHospitals = await this.getAllHospitals();
      
      if (!userLocation || !userLocation.lat || !userLocation.lng) {
        console.log('🌍 No user location available, returning all hospitals');
        return allHospitals;
      }

      console.log(`🌍 Calculating realtime distances from user location:`, userLocation);
      
      // Calculate realtime distance for each hospital
      const hospitalsWithDistance = allHospitals.map(hospital => {
        if (hospital.coordinates && hospital.coordinates.lat && hospital.coordinates.lng) {
          const distance = this.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            hospital.coordinates.lat,
            hospital.coordinates.lng
          );
          
          return {
            ...hospital,
            calculatedDistance: distance,
            distanceText: `${distance.toFixed(1)} km`
          };
        } else {
          // Hospital without coordinates - put at end
          return {
            ...hospital,
            calculatedDistance: 999,
            distanceText: 'Distance unavailable'
          };
        }
      });

      // Filter hospitals within max distance and sort by distance
      const nearbyHospitals = hospitalsWithDistance
        .filter(hospital => hospital.calculatedDistance <= maxDistanceKm)
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

      console.log(`🌍 Found ${nearbyHospitals.length} hospitals within ${maxDistanceKm}km`);
      console.log('🌍 Nearest hospital:', nearbyHospitals[0]?.hospitalName, nearbyHospitals[0]?.distanceText);
      
      return nearbyHospitals;
      
    } catch (error) {
      console.error('Error in realtime location filtering:', error.message);
      // Fallback to all hospitals
      return await this.getAllHospitals();
    }
  }
}

// Create singleton instance
const hospitalService = new HospitalService();

export default hospitalService;
