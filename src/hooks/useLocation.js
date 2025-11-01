import { useState, useEffect, useCallback } from 'react';
import googleMapsService from '../services/googleMapsService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [retryCount, setRetryCount] = useState(0);

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
      console.log('📍 Requesting location from Google Maps service...');
      const position = await googleMapsService.getCurrentLocation();
      console.log('✅ Location obtained successfully:', position);
      setLocation(position);
      setPermissionStatus('granted');
      setError(null); // Clear any previous errors
      return position;
    } catch (err) {
      console.error('❌ Location request failed:', err);
      
      // Check error code first (more reliable than message)
      if (err.code === 1) {
        // PERMISSION_DENIED
        setError('Location access is required to find nearby blood banks. Please enable location access in your browser settings.');
        setPermissionStatus('denied');
      } else if (err.code === 2) {
        // POSITION_UNAVAILABLE
        setError('Location is currently unavailable. Please check your device settings and try again.');
        setPermissionStatus('prompt'); // Keep as prompt, might work later
      } else if (err.code === 3) {
        // TIMEOUT
        setError('Location request timed out. Please try again.');
        setPermissionStatus('prompt'); // Keep as prompt, might work later
      } else if (err.message && err.message.includes('denied')) {
        // Fallback message check
        setError('Location access is required to find nearby blood banks. Please enable location access in your browser settings.');
        setPermissionStatus('denied');
      } else {
        // Generic error
        setError('Unable to access your location. Please check your browser settings and try again.');
        setPermissionStatus('prompt'); // Keep as prompt, might work later
      }
      
      throw err; // Re-throw for the calling function to handle
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
    const requestLocationWithFallback = async () => {
      // Try to get location directly first (works better on mobile)
      try {
        console.log('🔍 Attempting to get location directly...');
        await getCurrentLocation();
        setRetryCount(0); // Reset retry count on success
        return; // Success, no need to check permissions API
      } catch (error) {
        console.log('📱 Direct location request failed, checking permissions API...');
        
        // If it's a timeout or unavailable error and we haven't retried much, try again
        if ((error.code === 2 || error.code === 3) && retryCount < 2) {
          console.log(`🔄 Retrying location request (attempt ${retryCount + 1})...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            getCurrentLocation().catch(() => {
              // If retry fails, continue with permissions API check
            });
          }, 2000);
          return;
        }
      }

      // Fallback to permissions API check
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          console.log('🔐 Permission status:', result.state);
          setPermissionStatus(result.state);
          
          // Only show error if explicitly denied
          if (result.state === 'denied') {
            setError('Location access is required to find nearby blood banks. Please enable location access in your browser settings.');
          } else if (result.state === 'granted') {
            // Try again if granted but first attempt failed
            getCurrentLocation();
          }
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            console.log('🔄 Permission changed to:', result.state);
            setPermissionStatus(result.state);
            if (result.state === 'denied') {
              setLocation(null);
              setError('Location access is required to find nearby blood banks. Please enable location access in your browser settings.');
            } else if (result.state === 'granted') {
              setError(null); // Clear any previous errors
              getCurrentLocation();
            }
          });
        } catch (permError) {
          console.log('⚠️ Permissions API not supported, trying direct location request...');
          // Permissions API failed, try direct location request
          getCurrentLocation();
        }
      } else {
        console.log('📍 Permissions API not available, using direct location request...');
        // If permissions API is not supported, try direct location request
        getCurrentLocation();
      }
    };

    requestLocationWithFallback();
  }, [getCurrentLocation, retryCount]);

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
