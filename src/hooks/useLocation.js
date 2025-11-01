import { useState, useEffect, useCallback } from 'react';
import googleMapsService from '../services/googleMapsService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'

  // Check if geolocation is supported
  const isGeolocationSupported = 'geolocation' in navigator;

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await googleMapsService.getCurrentLocation();
      setLocation(position);
      setPermissionStatus('granted');
      return position;
    } catch (err) {
      if (err.message.includes('denied') || err.code === 1) {
        setError('Location access is required to find nearby blood banks. Please enable location access in your browser settings.');
        setPermissionStatus('denied');
      } else if (err.message.includes('unavailable') || err.code === 2) {
        setError('Location is currently unavailable. Please check your device settings and try again.');
      } else if (err.message.includes('timeout') || err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Unable to access your location. Please enable location services to find nearby blood banks.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [isGeolocationSupported]);

  // Watch position changes
  const watchPosition = useCallback(() => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setPermissionStatus('granted');
        setError(null);
      },
      (err) => {
        setError(err.message);
        if (err.message.includes('denied')) {
          setPermissionStatus('denied');
        }
      },
      options
    );

    return watchId;
  }, [isGeolocationSupported]);

  // Clear watch
  const clearWatch = useCallback((watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Reset location state
  const resetLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    setPermissionStatus('prompt');
  }, []);

  // Check permission status and automatically request location on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state);
          
          // Automatically request location if permission is granted or prompt
          if (result.state === 'granted' || result.state === 'prompt') {
            getCurrentLocation();
          } else if (result.state === 'denied') {
            setError('Location access is required to find nearby blood banks. Please enable location access in your browser settings.');
          }
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionStatus(result.state);
            if (result.state === 'denied') {
              setLocation(null);
              setError('Location access is required to find nearby blood banks. Please enable location access in your browser settings.');
            } else if (result.state === 'granted') {
              getCurrentLocation();
            }
          });
        })
        .catch(() => {
          // Fallback if permissions API is not supported - automatically request location
          setPermissionStatus('prompt');
          getCurrentLocation();
        });
    } else {
      // If permissions API is not supported, automatically request location
      getCurrentLocation();
    }
  }, [getCurrentLocation]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    isGeolocationSupported,
    getCurrentLocation,
    watchPosition,
    clearWatch,
    resetLocation
  };
};

export default useLocation;
