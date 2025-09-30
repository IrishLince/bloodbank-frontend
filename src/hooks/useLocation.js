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
      setError(err.message);
      if (err.message.includes('denied')) {
        setPermissionStatus('denied');
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

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionStatus(result.state);
            if (result.state === 'denied') {
              setLocation(null);
              setError('Location access denied');
            }
          });
        })
        .catch(() => {
          // Fallback if permissions API is not supported
          setPermissionStatus('prompt');
        });
    }
  }, []);

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
