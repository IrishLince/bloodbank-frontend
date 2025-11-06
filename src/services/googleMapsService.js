// Google Maps API Service for distance calculations
class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.isLoaded = false;
    this.geocoder = null;
  }

  // Load Google Maps JavaScript API
  async loadGoogleMapsAPI() {
    if (this.isLoaded && window.google && window.google.maps && window.google.maps.Map) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error('Google Maps API key is not configured'));
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for existing script to load
        this.waitForGoogleMaps().then(resolve).catch(reject);
        return;
      }

      const script = document.createElement('script');
      // Use callback parameter for better Firefox compatibility
      const callbackName = 'initGoogleMaps' + Date.now();
      window[callbackName] = () => {
        this.waitForGoogleMaps().then(() => {
          this.isLoaded = true;
          delete window[callbackName]; // Clean up
          resolve();
        }).catch(reject);
      };
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=geometry,places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      // Fallback onload handler in case callback doesn't work
      script.onload = () => {
        // Only resolve if callback hasn't already resolved
        if (!this.isLoaded) {
          this.waitForGoogleMaps().then(() => {
            this.isLoaded = true;
            resolve();
          }).catch(reject);
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  // Wait for Google Maps to be fully loaded and ready
  async waitForGoogleMaps(maxAttempts = 50, delay = 100) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkGoogleMaps = () => {
        attempts++;
        
        if (window.google && 
            window.google.maps && 
            window.google.maps.Map && 
            window.google.maps.Marker &&
            window.google.maps.SymbolPath &&
            window.google.maps.ControlPosition) {
          // Initialize geocoder when Google Maps is ready
          if (!this.geocoder) {
            this.geocoder = new window.google.maps.Geocoder();
          }
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Google Maps API failed to load completely'));
          return;
        }
        
        setTimeout(checkGoogleMaps, delay);
      };
      
      checkGoogleMaps();
    });
  }

  // Geocode address to get accurate coordinates
  async geocodeAddress(address) {
    if (!this.geocoder) {
      await this.loadGoogleMapsAPI();
    }

    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formatted_address: results[0].formatted_address,
            place_id: results[0].place_id
          });
        } else {
          // Try fallback geocoding for common Philippine locations
          const fallbackCoords = this.getFallbackCoordinates(address);
          if (fallbackCoords) {
            console.log(`🔄 FALLBACK GEOCODING: Using estimated coordinates for "${address}"`);
            resolve(fallbackCoords);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      });
    });
  }

  // Fallback coordinates for common Philippine locations
  getFallbackCoordinates(address) {
    const addressLower = address.toLowerCase();
    
    // Manila area fallbacks
    if (addressLower.includes('manila') && !addressLower.includes('davao')) {
      return { lat: 14.5995, lng: 120.9842, formatted_address: address + ' (estimated)' };
    }
    if (addressLower.includes('makati')) {
      return { lat: 14.5547, lng: 121.0244, formatted_address: address + ' (estimated)' };
    }
    if (addressLower.includes('quezon city') || addressLower.includes('qc')) {
      return { lat: 14.6760, lng: 121.0437, formatted_address: address + ' (estimated)' };
    }
    if (addressLower.includes('pasay')) {
      return { lat: 14.5378, lng: 121.0014, formatted_address: address + ' (estimated)' };
    }
    if (addressLower.includes('las piñas') || addressLower.includes('las pinas')) {
      return { lat: 14.4642, lng: 120.9823, formatted_address: address + ' (estimated)' };
    }
    if (addressLower.includes('guadalupe') && addressLower.includes('makati')) {
      return { lat: 14.5651, lng: 121.0448, formatted_address: address + ' (estimated)' };
    }
    if (addressLower.includes('antipolo')) {
      return { lat: 14.5873, lng: 121.1759, formatted_address: address + ' (estimated)' };
    }
    
    // Other major cities
    if (addressLower.includes('davao')) {
      return { lat: 7.0731, lng: 125.6128, formatted_address: address + ' (estimated)' };
    }
    if (addressLower.includes('cebu')) {
      return { lat: 10.3157, lng: 123.8854, formatted_address: address + ' (estimated)' };
    }
    
    return null; // No fallback available
  }

  // Batch geocode multiple addresses for accurate pin placement
  async batchGeocodeAddresses(bloodBanks) {
    const geocodedBanks = [];
    
    console.log(`🌍 BATCH GEOCODING: Processing ${bloodBanks.length} blood banks`);
    
    for (const bank of bloodBanks) {
      try {
        const bankName = bank.name || bank.bloodBankName || 'Unknown Bank';
        
        // First check if coordinates already exist in the coordinates object (from database)
        if (bank.coordinates && bank.coordinates.lat && bank.coordinates.lng && 
            !isNaN(parseFloat(bank.coordinates.lat)) && !isNaN(parseFloat(bank.coordinates.lng))) {
          const lat = parseFloat(bank.coordinates.lat);
          const lng = parseFloat(bank.coordinates.lng);
          
          // Check if coordinates are reasonable (not 0,0 or obviously wrong)
          if (lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            console.log(`✅ EXISTING COORDS: ${bankName} - Using database coordinates: ${lat}, ${lng}`);
            geocodedBanks.push({
              ...bank,
              lat: lat,
              lng: lng,
              latitude: lat,
              longitude: lng,
              geocoded: false
            });
            continue;
          }
        }
        
        // Second, check if coordinates exist as separate latitude/longitude fields
        if (bank.latitude && bank.longitude && 
            !isNaN(parseFloat(bank.latitude)) && !isNaN(parseFloat(bank.longitude))) {
          const lat = parseFloat(bank.latitude);
          const lng = parseFloat(bank.longitude);
          
          // Check if coordinates are reasonable (not 0,0 or obviously wrong)
          if (lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            console.log(`✅ EXISTING LAT/LNG: ${bankName} - Using lat/lng fields: ${lat}, ${lng}`);
            geocodedBanks.push({
              ...bank,
              lat: lat,
              lng: lng,
              geocoded: false
            });
            continue;
          }
        }

        // Try to geocode using address for accurate pin placement
        if (bank.address) {
          console.log(`🔍 GEOCODING: ${bankName} - Address: "${bank.address}"`);
          try {
            const geocoded = await this.geocodeAddress(bank.address);
            console.log(`✅ GEOCODED SUCCESS: ${bankName} - Got coordinates: ${geocoded.lat}, ${geocoded.lng}`);
            
            geocodedBanks.push({
              ...bank,
              lat: geocoded.lat,
              lng: geocoded.lng,
              latitude: geocoded.lat,
              longitude: geocoded.lng,
              // Update coordinates object to match database structure
              coordinates: {
                lat: geocoded.lat,
                lng: geocoded.lng
              },
              formatted_address: geocoded.formatted_address,
              geocoded: true
            });
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (geocodeError) {
            console.error(`❌ GEOCODING FAILED: ${bankName} - ${geocodeError.message}`);
            console.log(`⚠️ KEEPING ORIGINAL: ${bankName} - Will show "Location not available"`);
            
            // Keep original bank data without coordinates
            geocodedBanks.push({
              ...bank,
              lat: null,
              lng: null,
              coordinates: bank.coordinates || null,
              geocoded: false
            });
          }
        } else {
          console.warn(`⚠️ NO ADDRESS: ${bankName} - Cannot geocode without address`);
          geocodedBanks.push({
            ...bank,
            lat: null,
            lng: null,
            coordinates: bank.coordinates || null,
            geocoded: false
          });
        }
      } catch (error) {
        console.error(`❌ GEOCODING ERROR: ${bank.name || bank.bloodBankName}:`, error);
        // Keep original coordinates if geocoding fails
        geocodedBanks.push(bank);
      }
    }
    
    // Summary logging
    const withCoords = geocodedBanks.filter(bank => bank.lat && bank.lng);
    const withoutCoords = geocodedBanks.filter(bank => !bank.lat || !bank.lng);
    const newlyGeocoded = geocodedBanks.filter(bank => bank.geocoded === true);
    
    console.log(`📊 GEOCODING SUMMARY:`);
    console.log(`  🏥 Total blood banks: ${geocodedBanks.length}`);
    console.log(`  ✅ With coordinates: ${withCoords.length}`);
    console.log(`  ❌ Without coordinates: ${withoutCoords.length}`);
    console.log(`  🆕 Newly geocoded: ${newlyGeocoded.length}`);
    
    if (withoutCoords.length > 0) {
      console.log(`⚠️ BANKS WITHOUT COORDINATES:`, withoutCoords.map(bank => ({
        name: bank.name || bank.bloodBankName,
        address: bank.address,
        reason: !bank.address ? 'No address' : 'Geocoding failed'
      })));
    }
    
    return geocodedBanks;
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
