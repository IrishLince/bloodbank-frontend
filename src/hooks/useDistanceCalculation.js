import { useState, useCallback, useEffect } from 'react';
import googleMapsService from '../services/googleMapsService';

export const useDistanceCalculation = (userLocation) => {
  const [distances, setDistances] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate distance for a single hospital
  const calculateSingleDistance = useCallback(async (hospital) => {
    if (!userLocation || !hospital.address) {
      return null;
    }

    try {
      const result = await googleMapsService.calculateDistance(
        userLocation,
        hospital.address
      );
      
      return {
        hospitalId: hospital.id,
        distance: result.distance,
        duration: result.duration
      };
    } catch (err) {
      console.warn(`Failed to calculate distance for ${hospital.name}:`, err.message);
      
      // Fallback to straight-line distance if coordinates are available
      if (hospital.coordinates) {
        const fallbackResult = googleMapsService.calculateStraightLineDistance(
          userLocation.lat,
          userLocation.lng,
          hospital.coordinates.lat,
          hospital.coordinates.lng
        );
        
        return {
          hospitalId: hospital.id,
          distance: fallbackResult.distance,
          duration: { text: 'N/A', value: 0 },
          isFallback: true
        };
      }
      
      return null;
    }
  }, [userLocation]);

  // Calculate distances for multiple hospitals
  const calculateMultipleDistances = useCallback(async (hospitals) => {
    if (!userLocation || !hospitals.length) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare destinations array
      const destinations = hospitals.map(hospital => hospital.address).filter(Boolean);
      
      if (destinations.length === 0) {
        setError('No valid addresses found for hospitals');
        return;
      }

      // Calculate distances using batch API
      const results = await googleMapsService.calculateMultipleDistances(
        userLocation,
        destinations
      );

      // Map results back to hospitals
      const distanceMap = new Map();
      
      results.forEach((result, index) => {
        const hospital = hospitals.find(h => h.address === result.destination);
        if (hospital) {
          distanceMap.set(hospital.id, {
            distance: result.distance,
            duration: result.duration,
            hospitalId: hospital.id
          });
        }
      });

      // Handle hospitals without addresses using fallback
      hospitals.forEach(hospital => {
        if (!hospital.address && hospital.coordinates) {
          const fallbackResult = googleMapsService.calculateStraightLineDistance(
            userLocation.lat,
            userLocation.lng,
            hospital.coordinates.lat,
            hospital.coordinates.lng
          );
          
          distanceMap.set(hospital.id, {
            distance: fallbackResult.distance,
            duration: { text: 'N/A', value: 0 },
            hospitalId: hospital.id,
            isFallback: true
          });
        }
      });

      setDistances(distanceMap);
    } catch (err) {
      setError(err.message);
      console.error('Distance calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // Get distance for a specific hospital
  const getHospitalDistance = useCallback((hospitalId) => {
    return distances.get(hospitalId) || null;
  }, [distances]);

  // Sort hospitals by distance
  const sortHospitalsByDistance = useCallback((hospitals) => {
    return [...hospitals].sort((a, b) => {
      const distanceA = distances.get(a.id);
      const distanceB = distances.get(b.id);
      
      if (!distanceA && !distanceB) return 0;
      if (!distanceA) return 1;
      if (!distanceB) return -1;
      
      return distanceA.distance.value - distanceB.distance.value;
    });
  }, [distances]);

  // Format distance text
  const formatDistance = useCallback((distanceValue) => {
    if (!distanceValue || distanceValue === Infinity) {
      return 'N/A';
    }
    
    if (distanceValue < 1000) {
      return `${Math.round(distanceValue)} m`;
    } else {
      return `${(distanceValue / 1000).toFixed(1)} km`;
    }
  }, []);

  // Clear all distances
  const clearDistances = useCallback(() => {
    setDistances(new Map());
    setError(null);
  }, []);

  // Auto-calculate when user location changes
  useEffect(() => {
    if (!userLocation) {
      clearDistances();
    }
  }, [userLocation, clearDistances]);

  return {
    distances,
    loading,
    error,
    calculateSingleDistance,
    calculateMultipleDistances,
    getHospitalDistance,
    sortHospitalsByDistance,
    formatDistance,
    clearDistances
  };
};

export default useDistanceCalculation;
