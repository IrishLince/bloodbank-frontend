// Google Maps API Service for distance calculations
class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.isLoaded = false;
  }

  // Load Google Maps JavaScript API
  async loadGoogleMapsAPI() {
    if (this.isLoaded || window.google) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error('Google Maps API key is not configured'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  // Get user's current location using browser geolocation
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  // Geocode address to get coordinates
  async geocodeAddress(address) {
    try {
      await this.loadGoogleMapsAPI();
      
      return new Promise((resolve, reject) => {
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: results[0].formatted_address
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Geocoding error: ${error.message}`);
    }
  }

  // Calculate distance between two points using Google Maps Distance Matrix API
  async calculateDistance(origin, destination) {
    try {
      await this.loadGoogleMapsAPI();
      
      return new Promise((resolve, reject) => {
        const service = new window.google.maps.DistanceMatrixService();
        
        service.getDistanceMatrix({
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === 'OK') {
            const element = response.rows[0].elements[0];
            
            if (element.status === 'OK') {
              resolve({
                distance: {
                  text: element.distance.text,
                  value: element.distance.value // in meters
                },
                duration: {
                  text: element.duration.text,
                  value: element.duration.value // in seconds
                }
              });
            } else {
              reject(new Error(`Distance calculation failed: ${element.status}`));
            }
          } else {
            reject(new Error(`Distance Matrix API error: ${status}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Distance calculation error: ${error.message}`);
    }
  }

  // Calculate straight-line distance using Haversine formula (fallback)
  calculateStraightLineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return {
      distance: {
        text: `${distance.toFixed(1)} km`,
        value: distance * 1000 // convert to meters
      }
    };
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Batch calculate distances for multiple destinations
  async calculateMultipleDistances(origin, destinations) {
    try {
      await this.loadGoogleMapsAPI();
      
      // Google Maps API has a limit of 25 destinations per request
      const batchSize = 25;
      const results = [];
      
      for (let i = 0; i < destinations.length; i += batchSize) {
        const batch = destinations.slice(i, i + batchSize);
        const batchResults = await this.calculateDistanceBatch(origin, batch);
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      throw new Error(`Batch distance calculation error: ${error.message}`);
    }
  }

  async calculateDistanceBatch(origin, destinations) {
    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [origin],
        destinations: destinations,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK') {
          const results = response.rows[0].elements.map((element, index) => {
            if (element.status === 'OK') {
              return {
                destination: destinations[index],
                distance: {
                  text: element.distance.text,
                  value: element.distance.value
                },
                duration: {
                  text: element.duration.text,
                  value: element.duration.value
                }
              };
            } else {
              // Fallback to straight-line distance if API fails
              console.warn(`Distance calculation failed for destination ${index}: ${element.status}`);
              return {
                destination: destinations[index],
                distance: {
                  text: 'N/A',
                  value: Infinity
                },
                duration: {
                  text: 'N/A',
                  value: Infinity
                }
              };
            }
          });
          
          resolve(results);
        } else {
          reject(new Error(`Distance Matrix API error: ${status}`));
        }
      });
    });
  }
}

// Create singleton instance
const googleMapsService = new GoogleMapsService();

export default googleMapsService;
