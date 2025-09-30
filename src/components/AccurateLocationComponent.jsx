import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccurateLocationComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // Check if location is already enabled on mount
  useEffect(() => {
    checkExistingLocation();
  }, []);

  const checkExistingLocation = async () => {
    if (navigator.geolocation && navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          // Auto-get location if already granted
          getCurrentLocation();
        }
      } catch (error) {
        console.log('Permission check not supported:', error);
      }
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    console.log('📍 Getting your ACTUAL GPS location...');

    const options = {
      enableHighAccuracy: true,  // ✅ Use GPS for accurate location
      timeout: 15000,            // ✅ 15 seconds timeout
      maximumAge: 0              // ✅ Don't use cached location - ALWAYS get fresh data
    };

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

        console.log('✅ Got ACCURATE GPS location:', {
          coordinates: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
          accuracy: `${location.accuracy.toFixed(0)} meters`,
          timestamp: new Date(location.timestamp).toLocaleString()
        });

        setUserLocation(location);
        setLocationAccuracy(location.accuracy);
        setIsLocationEnabled(true);
        setLocationLoading(false);
        setLocationError(null);

        // Log para makita mo kung accurate
        console.log('📊 Location Details:');
        console.log(`  Latitude: ${location.lat.toFixed(6)}`);
        console.log(`  Longitude: ${location.lng.toFixed(6)}`);
        console.log(`  Accuracy: ${location.accuracy.toFixed(0)} meters`);
        console.log(`  Time: ${new Date(location.timestamp).toLocaleString()}`);
        
        // Show accuracy warning kung malayo
        if (location.accuracy > 100) {
          console.warn('⚠️ Location accuracy is low. GPS signal might be weak.');
        }
      },
      (error) => {
        console.error('❌ Location Error:', error);
        
        let errorMessage = '';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Please allow location access in your browser settings';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Make sure GPS is enabled';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }

        setLocationError(errorMessage);
        setLocationLoading(false);
        setIsLocationEnabled(false);
        console.error('📍 Cannot get location:', errorMessage);
      },
      options
    );
  };

  const refreshLocation = () => {
    console.log('🔄 Refreshing location...');
    getCurrentLocation();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      {/* Location Status Banner */}
      <AnimatePresence>
        {!isLocationEnabled && !locationError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Enable location for personalized results
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    We'll find hospitals near you and calculate exact driving distances
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="
                  px-4 py-2 bg-blue-600 text-white text-sm font-medium 
                  rounded-lg hover:bg-blue-700 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                "
              >
                {locationLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Enable Location
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-medium text-red-900">
                    Location Error
                  </h3>
                  <p className="text-xs text-red-700 mt-1">
                    {locationError}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={getCurrentLocation}
                className="
                  px-4 py-2 bg-red-600 text-white text-sm font-medium 
                  rounded-lg hover:bg-red-700 transition-colors
                  flex items-center gap-2
                "
              >
                Try Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message with Location Details */}
      <AnimatePresence>
        {isLocationEnabled && userLocation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="text-sm font-medium text-green-900">
                      Location Enabled
                    </h3>
                    <p className="text-xs text-green-700 mt-1">
                      Showing hospitals near your current location
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={refreshLocation}
                  disabled={locationLoading}
                  className="
                    px-4 py-2 bg-green-600 text-white text-sm font-medium 
                    rounded-lg hover:bg-green-700 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  {locationLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Refresh
                    </>
                  )}
                </motion.button>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-200">
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-600">Latitude</p>
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {userLocation.lat.toFixed(6)}
                  </p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-600">Longitude</p>
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {userLocation.lng.toFixed(6)}
                  </p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-600">Accuracy</p>
                  <p className="text-sm font-medium text-gray-900">
                    ±{Math.round(locationAccuracy)} meters
                  </p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-600">Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(userLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Accuracy Warning */}
              {locationAccuracy > 100 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-xs text-yellow-800">
                    ⚠️ GPS accuracy is low ({Math.round(locationAccuracy)}m). Try moving to an open area for better signal.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
        <h4 className="font-medium mb-2">🔍 Debugging Tips:</h4>
        <ul className="space-y-1 text-xs">
          <li>• Check browser console for detailed location logs</li>
          <li>• Accuracy should be under 50m for best results (GPS enabled)</li>
          <li>• If accuracy is high (&gt;100m), you might be using Wi-Fi location</li>
          <li>• Make sure GPS/Location Services is ON in your device settings</li>
          <li>• HTTPS is required for accurate GPS location</li>
        </ul>
      </div>
    </div>
  );
};

export default AccurateLocationComponent;
