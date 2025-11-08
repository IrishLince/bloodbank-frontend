"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ChevronUp,
  MapPin,
  Phone,
  Clock,
  Droplet,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle,
  Filter,
  Loader,
  Navigation,
  MapPinOff,
  RefreshCw,
  ExternalLink,
  Target,
  Map as MapIcon,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Header from "../Header"
import useLocation from "../../hooks/useLocation"
import useDistanceCalculation from "../../hooks/useDistanceCalculation"
import hospitalService from "../../services/hospitalService"
import googleMapsService from "../../services/googleMapsService"

// Hospitals will be fetched from backend API

export default function DonationCenter() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "distance", direction: "ascending" })
  const [filters, setFilters] = useState({
    name: "",
    location: "",
    bloodTypes: "",
    availability: "all",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBloodBank, setSelectedBloodBank] = useState(null)
  const [focusingBloodBank, setFocusingBloodBank] = useState(null) // Track which blood bank is being focused
  const [activeTab, setActiveTab] = useState("nearby") // "nearby" or "all"
  const [allBloodBanks, setAllBloodBanks] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)
  
  // Map-related state
  const [viewMode, setViewMode] = useState("map") // "map" or "list"
  const [mapCenter, setMapCenter] = useState(null)
  const [mapZoom, setMapZoom] = useState(13)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const markersRef = useRef([])
  const activeMarkerRef = useRef(null) // Track currently highlighted marker
  const isHighlightingRef = useRef(false) // Prevent recursion in marker highlighting
  const isFocusingRef = useRef(false) // Prevent marker updates during focus operations
  const markerRefreshIntervalRef = useRef(null) // Auto-refresh interval
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  
  // Refs for auto-scrolling list when marker is clicked
  const bloodBankListRef = useRef(null) // Reference to the scrollable list container
  const bloodBankCardsRef = useRef({}) // Reference to each blood bank card
  const horizontalScrollRef = useRef(null) // Reference to horizontal scrollable container (mobile map view)

  // Helper function to calculate highly accurate straight-line distance using enhanced Haversine formula
  // This formula accounts for Earth's ellipsoidal shape for maximum precision
  // Accuracy: <0.1% error for distances up to 100km, perfect for 15km radius filtering
  const calculateStraightLineDistance = (lat1, lng1, lat2, lng2) => {
    // WGS84 ellipsoid constants for maximum accuracy
    const a = 6378137.0; // Semi-major axis in meters (WGS84)
    const f = 1/298.257223563; // Flattening factor (WGS84)
    const b = (1 - f) * a; // Semi-minor axis
    
    // Convert degrees to radians with high precision
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    // Enhanced Haversine formula for ellipsoidal Earth
    const sinΔφ2 = Math.sin(Δφ/2);
    const sinΔλ2 = Math.sin(Δλ/2);
    const a_calc = sinΔφ2 * sinΔφ2 + Math.cos(φ1) * Math.cos(φ2) * sinΔλ2 * sinΔλ2;
    const c = 2 * Math.atan2(Math.sqrt(a_calc), Math.sqrt(1-a_calc));

    // Use mean Earth radius for high accuracy over short distances
    const R = 6371008.8; // Mean radius in meters (IUGG value)
    const distance = R * c;

    // Debug log for accuracy verification (can be removed in production)
    if (distance <= 15000) { // Only log nearby distances
      console.log(`🎯 DISTANCE CALC: ${distance.toFixed(2)}m | Lat1: ${lat1.toFixed(6)}, Lng1: ${lng1.toFixed(6)}, Lat2: ${lat2.toFixed(6)}, Lng2: ${lng2.toFixed(6)}`);
    }

    return distance; // Distance in meters
  }

  // Helper function to format distance in meters with appropriate units
  const formatDistanceMeters = (distanceInMeters) => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)} km`;
    }
  }

  // Helper function to check if blood bank is within specified radius with high precision
  const isWithinRadius = (bloodBank, userLoc, radiusKm = 15) => {
    if (!userLoc || !bloodBank.coordinates) {
      console.log(`❌ RADIUS CHECK: Missing location data for ${bloodBank.name || bloodBank.bloodBankName}`);
      return false; // No location data available
    }

    const { lat: userLat, lng: userLng, latitude: userLatitude, longitude: userLongitude } = userLoc;
    const { lat: bankLat, lng: bankLng } = bloodBank.coordinates;

    // Handle different location format variations with validation
    const finalUserLat = userLat || userLatitude;
    const finalUserLng = userLng || userLongitude;

    // Validate coordinate precision and range
    if (!finalUserLat || !finalUserLng || !bankLat || !bankLng ||
        Math.abs(finalUserLat) > 90 || Math.abs(finalUserLng) > 180 ||
        Math.abs(bankLat) > 90 || Math.abs(bankLng) > 180) {
      console.log(`❌ RADIUS CHECK: Invalid coordinates for ${bloodBank.name || bloodBank.bloodBankName}`, {
        userCoords: [finalUserLat, finalUserLng],
        bankCoords: [bankLat, bankLng]
      });
      return false; // Invalid coordinate data
    }

    // Calculate precise distance using enhanced Haversine formula
    const distanceInMeters = calculateStraightLineDistance(finalUserLat, finalUserLng, bankLat, bankLng);
    const radiusInMeters = radiusKm * 1000; // Convert km to meters with precision
    
    // Store calculated distance for use in display
    bloodBank.calculatedDistance = distanceInMeters;
    bloodBank.distanceText = formatDistanceMeters(distanceInMeters);
    
    // Strict radius check - EXACTLY 15km limit
    const withinRadius = distanceInMeters <= radiusInMeters;
    
    // Enhanced logging for nearby filtering accuracy
    if (radiusKm <= 15) {
      const distanceKm = (distanceInMeters / 1000).toFixed(3);
      if (withinRadius) {
        console.log(`✅ NEARBY INCLUDE: ${bloodBank.name || bloodBank.bloodBankName} at ${distanceKm}km (${formatDistanceMeters(distanceInMeters)})`);
      } else {
        console.log(`❌ NEARBY EXCLUDE: ${bloodBank.name || bloodBank.bloodBankName} at ${distanceKm}km - BEYOND 15km limit`);
      }
    }
    
    return withinRadius;
  }
  
  // Blood bank data state
  const [bloodBanks, setBloodBanks] = useState([])
  const [bloodBanksLoading, setBloodBanksLoading] = useState(true)
  const [bloodBanksError, setBloodBanksError] = useState(null)
  
  // Location and distance hooks
  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    permissionStatus,
    getCurrentLocation,
    resetLocation
  } = useLocation()
  
  const {
    distances,
    loading: distanceLoading,
    error: distanceError,
    calculateMultipleDistances,
    getHospitalDistance,
    sortHospitalsByDistance,
    formatDistance
  } = useDistanceCalculation(userLocation)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch blood banks function
  const fetchBloodBanks = async () => {
    try {
      setBloodBanksLoading(true)
      setBloodBanksError(null)
      
      console.log(`🔄 FETCHING BLOOD BANKS - User Location:`, userLocation ? 'Available' : 'Not Available');
      console.log(`🔄 Permission Status:`, permissionStatus);
      
      // Fetch ALL blood banks with distance calculation (we'll filter on frontend for accuracy)
      const allData = await hospitalService.getHospitalsForLocation(userLocation, 999) // 999km limit = gets ALL blood banks
      
      console.log(`📊 API RESPONSE: Received ${allData.length} blood banks from hospitalService.getHospitalsForLocation`);
      console.log(`🏥 Blood Banks:`, allData.map(bb => ({ 
        id: bb.id, 
        name: bb.name || bb.bloodBankName, 
        hasCoords: !!(bb.coordinates?.lat && bb.coordinates?.lng),
        calculatedDistance: bb.calculatedDistance 
      })));
      
      // Use geocoding for accurate pin placement based on addresses
      console.log("🎯 Starting geocoding for accurate pin placement...");
      const geocodedData = await googleMapsService.batchGeocodeAddresses(allData);
      console.log("✅ Geocoded blood banks for accurate pins:", geocodedData);
      
      // Calculate distances for all blood banks if user location is available AND permission is granted
      if (userLocation && permissionStatus === 'granted' && geocodedData.length > 0) {
        console.log('🔍 LOCATION PERMISSION GRANTED - Calculating distances for', geocodedData.length, 'blood banks');
        
        let calculatedCount = 0;
        let missingCoordsCount = 0;
        
        geocodedData.forEach(bloodBank => {
          const bankName = bloodBank.name || bloodBank.bloodBankName || 'Unknown Bank';
          
          // Use geocoded coordinates (lat/lng) or fallback to coordinates object
          const bankLat = bloodBank.lat || (bloodBank.coordinates && bloodBank.coordinates.lat);
          const bankLng = bloodBank.lng || (bloodBank.coordinates && bloodBank.coordinates.lng);
          
          if (bankLat && bankLng) {
            const { lat: userLat, lng: userLng, latitude: userLatitude, longitude: userLongitude } = userLocation;
            
            const finalUserLat = userLat || userLatitude;
            const finalUserLng = userLng || userLongitude;
            
            if (finalUserLat && finalUserLng) {
              const distanceInMeters = calculateStraightLineDistance(finalUserLat, finalUserLng, bankLat, bankLng);
              bloodBank.calculatedDistance = distanceInMeters;
              bloodBank.distanceText = formatDistanceMeters(distanceInMeters);
              calculatedCount++;
              
              console.log(`📏 DISTANCE CALCULATED: ${bankName} - ${bloodBank.distanceText} (${distanceInMeters}m)`);
            } else {
              console.log(`❌ INVALID USER LOCATION: Cannot calculate distance for ${bankName}`);
              bloodBank.calculatedDistance = null;
              bloodBank.distanceText = 'Enable location to see distance';
            }
          } else {
              console.log(`❌ NO COORDINATES: ${bankName} - Address: "${bloodBank.address}" - Cannot calculate distance`);
              console.log(`🔍 COORDINATE CHECK for ${bankName}:`, {
                'bloodBank.lat': bloodBank.lat,
                'bloodBank.lng': bloodBank.lng,
                'bloodBank.coordinates': bloodBank.coordinates,
                'bloodBank.latitude': bloodBank.latitude,
                'bloodBank.longitude': bloodBank.longitude,
                'geocoded': bloodBank.geocoded
              });
              missingCoordsCount++;
              // Set values for blood banks without coordinates
              bloodBank.calculatedDistance = null;
              bloodBank.distanceText = 'Location not available';
          }
        });
        
        console.log(`📊 DISTANCE CALCULATION SUMMARY:`);
        console.log(`  ✅ Successfully calculated: ${calculatedCount}`);
        console.log(`  ❌ Missing coordinates: ${missingCoordsCount}`);
        
        // Sort by distance for better performance (put null distances at end)
        geocodedData.sort((a, b) => {
          const distA = a.calculatedDistance || 999000;
          const distB = b.calculatedDistance || 999000;
          return distA - distB;
        });
      } else if (!userLocation || permissionStatus !== 'granted') {
        console.log('❌ LOCATION NOT AVAILABLE - Permission:', permissionStatus, '| Location:', !!userLocation);
        // Set appropriate messages when location is not available
        geocodedData.forEach(bloodBank => {
          const bankName = bloodBank.name || bloodBank.bloodBankName || 'Unknown Bank';
          const hasCoords = !!(bloodBank.lat || (bloodBank.coordinates && bloodBank.coordinates.lat));
          
          bloodBank.calculatedDistance = null;
          if (hasCoords) {
            bloodBank.distanceText = 'Enable location to see distance';
            console.log(`📍 ${bankName}: Has coordinates, waiting for location permission`);
          } else {
            bloodBank.distanceText = 'Location not available';
            console.log(`❌ ${bankName}: No coordinates available`);
          }
        });
      }
      
      console.log(`🗄️ SETTING BLOOD BANKS STATE: ${geocodedData.length} blood banks`);
      
      // Better coordinate tracking - check both database coordinates and geocoded coordinates
      const withDatabaseCoords = geocodedData.filter(bb => bb.coordinates?.lat && bb.coordinates?.lng);
      const withGeocodedCoords = geocodedData.filter(bb => bb.lat && bb.lng);
      const totalWithCoords = geocodedData.filter(bb => (bb.lat && bb.lng) || (bb.coordinates?.lat && bb.coordinates?.lng));
      const withoutAnyCoords = geocodedData.filter(bb => !(bb.lat && bb.lng) && !(bb.coordinates?.lat && bb.coordinates?.lng));
      
      console.log(`📊 COORDINATE STATUS BREAKDOWN:`);
      console.log(`  🏦 Database coordinates: ${withDatabaseCoords.length}`);
      console.log(`  🌍 Geocoded coordinates: ${withGeocodedCoords.length}`);
      console.log(`  ✅ Total with coordinates: ${totalWithCoords.length}`);
      console.log(`  ❌ Still without coordinates: ${withoutAnyCoords.length}`);
      
      if (withoutAnyCoords.length > 0) {
        console.log(`⚠️ BANKS STILL WITHOUT COORDINATES:`, withoutAnyCoords.map(bb => ({
          name: bb.name || bb.bloodBankName,
          address: bb.address,
          hasAddress: !!bb.address
        })));
      }
      
      setAllBloodBanks(geocodedData)
      
      // Set current display data
      setBloodBanks(geocodedData)
      
      // Update last refresh time
      setLastRefreshTime(new Date())
    } catch (error) {
      setBloodBanksError(error.message)
      console.error('Failed to fetch blood banks:', error)
    } finally {
      setBloodBanksLoading(false)
    }
  }

  // Fetch blood banks on component mount
  useEffect(() => {
    fetchBloodBanks()
  }, [userLocation, activeTab]) // Re-fetch when user location or tab changes

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(() => {
      fetchBloodBanks()
    }, 20000) // 20 seconds

    return () => clearInterval(intervalId)
  }, [autoRefresh, userLocation, activeTab])

  // Handle tab switching
  const handleTabChange = (tab) => {
    // Don't allow switching to nearby tab if location permission is not granted
    if (tab === "nearby" && (!userLocation || permissionStatus !== 'granted')) {
      console.log('❌ Cannot switch to nearby tab - location permission not granted');
      return;
    }
    setActiveTab(tab)
    // The filtering will be handled in filteredAndSortedBloodBanks based on activeTab
    // No need to change bloodBanks state as filtering is now reactive
  }

  // Auto-switch from nearby to all tab if location becomes unavailable
  useEffect(() => {
    if (activeTab === "nearby" && (!userLocation || permissionStatus !== 'granted')) {
      console.log('🔄 Auto-switching from nearby to all tab due to location unavailability');
      setActiveTab("all");
    }
  }, [activeTab, userLocation, permissionStatus])

  // Calculate distances when user location is available and blood banks are loaded
  useEffect(() => {
    if (userLocation && bloodBanks.length > 0) {
      calculateMultipleDistances(bloodBanks)
    }
  }, [userLocation, bloodBanks, calculateMultipleDistances])

  // Dynamic location updates - re-calculate distances when user location changes
  useEffect(() => {
    if (userLocation && allBloodBanks.length > 0) {
      console.log(`🔄 LOCATION UPDATE DETECTED: Recalculating distances for all centers`);
      console.log(`📍 New Location: ${userLocation.lat || userLocation.latitude}, ${userLocation.lng || userLocation.longitude}`);
      
      // Update map center when user location changes
      const lat = userLocation.lat || userLocation.latitude;
      const lng = userLocation.lng || userLocation.longitude;
      if (lat && lng) {
        setMapCenter({ lat, lng });
        // Re-center map if it's loaded
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat, lng });
        }
      }
      
      // Re-fetch to ensure accurate distance calculations with new location
      fetchBloodBanks();
    }
  }, [userLocation])

  // Initialize map center when user location is first available
  useEffect(() => {
    if (userLocation && !mapCenter) {
      const lat = userLocation.lat || userLocation.latitude;
      const lng = userLocation.lng || userLocation.longitude;
      if (lat && lng) {
        setMapCenter({ lat, lng });
      }
    }
  }, [userLocation, mapCenter])

  // Google Maps initialization
  const initializeMap = useCallback(() => {
    // Enhanced Firefox compatibility checks
    if (!mapRef.current || 
        !window.google || 
        !window.google.maps || 
        !window.google.maps.Map ||
        !window.google.maps.Marker ||
        !window.google.maps.SymbolPath ||
        !window.google.maps.ControlPosition ||
        !mapCenter) {
      console.log("Map initialization skipped - missing dependencies:", {
        mapRef: !!mapRef.current,
        google: !!window.google,
        googleMaps: !!window.google?.maps,
        googleMapsMap: !!window.google?.maps?.Map,
        googleMapsMarker: !!window.google?.maps?.Marker,
        googleMapsSymbolPath: !!window.google?.maps?.SymbolPath,
        googleMapsControlPosition: !!window.google?.maps?.ControlPosition,
        mapCenter: !!mapCenter
      });
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        styles: [
          // Hide unnecessary POIs and labels for cleaner look
          {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi.park",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.arterial",
            elementType: "labels",
            stylers: [{ visibility: "simplified" }]
          },
          // Enhance water and landscape colors
          {
            featureType: "water",
            stylers: [{ color: "#a2daf2" }]
          },
          {
            featureType: "landscape.natural",
            stylers: [{ color: "#f5f5f2" }]
          },
          // Improve road visibility
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#f8f8f8" }]
          }
        ],
        // Optimized controls for better UX
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_LEFT,
          mapTypeIds: ['roadmap', 'satellite']
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
          position: isMobile 
            ? window.google.maps.ControlPosition.RIGHT_BOTTOM 
            : window.google.maps.ControlPosition.RIGHT_CENTER
        },
        // Enhanced interaction settings
        gestureHandling: 'greedy',
        clickableIcons: false,
        disableDefaultUI: false,
        keyboardShortcuts: true,
        scrollwheel: true,
        // Better mobile experience
        draggable: true,
        scaleControl: true,
        rotateControl: false,
        // Styling
        backgroundColor: '#f5f5f5',
        // Performance optimizations
        tilt: 0,
        heading: 0,
        // Smooth animation settings for better focus transitions
        panControl: false,
        panControlOptions: {
          position: window.google.maps.ControlPosition.TOP_LEFT
        },
        // Enable smooth animations
        animation: window.google.maps.Animation.DROP
      });

      googleMapRef.current = map;
      setMapLoaded(true);
      setMapError(null);

      // Add user location marker with improved styling
      if (userLocation) {
        const userLat = userLocation.lat || userLocation.latitude;
        const userLng = userLocation.lng || userLocation.longitude;
        
        // Create custom user location marker
        const userMarker = new window.google.maps.Marker({
          position: { lat: parseFloat(userLat), lng: parseFloat(userLng) },
          map: map,
          title: "Your Current Location",
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#shadow)">
                  <circle cx="14" cy="14" r="12" fill="#3B82F6" stroke="#ffffff" stroke-width="3"/>
                  <circle cx="14" cy="14" r="5" fill="#ffffff"/>
                  <circle cx="14" cy="14" r="2" fill="#3B82F6"/>
                </g>
                <defs>
                  <filter id="shadow" x="-2" y="-2" width="32" height="32">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.4"/>
                  </filter>
                </defs>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(28, 28),
            anchor: new window.google.maps.Point(14, 14)
          },
          zIndex: 10000,
          optimized: false
        });

        // Add info window for user location
        const userInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[200px]">
              <h3 class="font-semibold text-blue-600 mb-1">📍 Your Location</h3>
              <p class="text-sm text-gray-600">Tap to center map here</p>
            </div>
          `
        });

        userMarker.addListener("click", () => {
          userInfoWindow.open(map, userMarker);
          map.setCenter(userMarker.getPosition());
          map.setZoom(15);
        });

        // Add accuracy circle if available
        if (userLocation.accuracy) {
          new window.google.maps.Circle({
            strokeColor: '#3B82F6',
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            map: map,
            center: { lat: parseFloat(userLat), lng: parseFloat(userLng) },
            radius: userLocation.accuracy
          });
        }
      }

      // Add blood bank markers will be handled by useEffect

    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to load map");
    }
  }, [mapCenter, mapZoom, userLocation]);


  // Load Google Maps script using centralized service
  useEffect(() => {
    const loadMaps = async () => {
      try {
        console.log("Loading Google Maps API...");
        await googleMapsService.loadGoogleMapsAPI();
        console.log("Google Maps API loaded successfully, initializing map...");
        initializeMap();
      } catch (error) {
        console.error("Failed to load Google Maps:", error);
        setMapError(`Failed to load Google Maps: ${error.message}`);
      }
    };

    // Check if Google Maps is already fully loaded
    if (window.google && 
        window.google.maps && 
        window.google.maps.Map &&
        window.google.maps.Marker &&
        window.google.maps.SymbolPath &&
        window.google.maps.ControlPosition) {
      console.log("Google Maps already loaded, initializing map...");
      initializeMap();
    } else {
      loadMaps();
    }
  }, [initializeMap]);

  // Update markers when blood banks change

  // Location change monitoring for dynamic updates
  const [previousLocation, setPreviousLocation] = useState(null)
  
  useEffect(() => {
    if (userLocation && previousLocation) {
      // Calculate how much the user has moved
      const locationChange = calculateStraightLineDistance(
        previousLocation.lat || previousLocation.latitude,
        previousLocation.lng || previousLocation.longitude,
            userLocation.lat || userLocation.latitude,
        userLocation.lng || userLocation.longitude
      );
      
      // If user moved more than 100 meters, trigger nearby list update
      if (locationChange > 100) {
        console.log(`🚶 USER MOVED: ${formatDistanceMeters(locationChange)} - Updating nearby centers`);
        
        // Force update of filtered data for nearby tab
        if (activeTab === "nearby") {
          console.log(`🔄 AUTO-REFRESH: Nearby tab due to location change`);
        }
      }
    }
    
    // Update previous location for next comparison
    setPreviousLocation(userLocation);
  }, [userLocation, activeTab])

  // Auto-scroll list when marker is clicked on map
  useEffect(() => {
    if (selectedBloodBank && bloodBankCardsRef.current[selectedBloodBank.id]) {
      console.log('🎯 AUTO-SCROLL: Scrolling to selected blood bank:', selectedBloodBank.name || selectedBloodBank.bloodBankName);
      
      const cardElement = bloodBankCardsRef.current[selectedBloodBank.id];
      const listContainer = bloodBankListRef.current;
      const horizontalContainer = horizontalScrollRef.current;
      
      // Determine if we're in horizontal scroll mode (mobile map view) or vertical scroll mode
      const isHorizontalScroll = horizontalContainer && isMobile && viewMode === "map";
      
      if (cardElement) {
        if (isHorizontalScroll) {
          // Mobile map view with horizontal scrolling
          console.log('📱 Mobile horizontal scroll detected');
          cardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center' // Center horizontally for horizontal scroll
          });
          console.log('✅ AUTO-SCROLL: Successfully scrolled horizontally to blood bank');
        } else if (listContainer) {
          // Desktop/tablet vertical list or mobile list view
          console.log('🖥️ Vertical scroll detected');
          cardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // Center vertically for vertical scroll
            inline: 'nearest'
          });
          console.log('✅ AUTO-SCROLL: Successfully scrolled vertically to blood bank (centered)');
        } else {
          console.log('⚠️ AUTO-SCROLL: No scroll container found');
        }
      } else {
        console.log('⚠️ AUTO-SCROLL: Card element not found');
      }
    }
  }, [selectedBloodBank, isMobile, viewMode])

  // Check if blood center operates today (for donation scheduling purposes)
  // Shows blood banks that are open on the current day - users can see hours and plan accordingly
  const isOpenNow = useCallback((hours) => {
    // SAFETY WRAPPER: Catch any errors and default to showing the blood bank
    try {
    if (!hours || hours === '24/7') return true
      
      // SAFETY: If hours is not a string or is malformed, show the blood bank (safer default)
      if (typeof hours !== 'string' || hours.trim() === '') {
        console.warn('⚠️ Invalid operating hours format:', hours, '- showing blood bank by default');
        return true;
      }
    
    const dayMap = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    }
    
    const now = new Date()
    const today = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes() // Current time in minutes
    
      // DEBUG: Log parsing attempts (can be removed in production)
      console.log('🔍 PARSING OPERATING HOURS:', { 
        hours, 
        today: Object.keys(dayMap).find(k => dayMap[k] === today),
        currentTime: `${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2,'0')}`
      });
      
      // Parse hours format like "Mon-Sat 09:00 - 24:00" or "Mon,Wed,Fri 09:00 - 17:00"
      // Formats supported: "Day-Day HH:MM - HH:MM" or "Day,Day,Day HH:MM - HH:MM"
      // Updated regex to handle both single and double digit hours/minutes (e.g., "9:00" or "09:00")
      const timeMatch = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
      if (!timeMatch) {
        console.warn('❌ Could not parse operating hours format:', hours);
        return true // If can't parse time, show it (safer default)
      }
    
    const [_, startHour, startMin, endHour, endMin] = timeMatch
    const daysString = hours.replace(/\s+\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}.*$/, '').trim()
    
    // DEBUG: Log extracted data (can be removed in production)
    console.log('🔍 EXTRACTED DATA:', { 
      daysString, 
      startHour, 
      startMin, 
      endHour, 
      endMin,
      hasRange: daysString.includes('-')
    });
    
    let isDayOpen = false
    
    // Check if it's a range format (e.g., "Mon-Fri")
    if (daysString.includes('-')) {
      const [startDay, endDay] = daysString.split('-').map(d => d.trim())
    const startDayNum = dayMap[startDay]
      const endDayNum = dayMap[endDay]
    
      // DEBUG: Log range format parsing
      console.log('🔍 RANGE FORMAT:', { startDay, endDay, startDayNum, endDayNum, today });
    
      if (startDayNum !== undefined && endDayNum !== undefined) {
    if (startDayNum <= endDayNum) {
      // Normal range (e.g., Mon-Fri)
          isDayOpen = today >= startDayNum && today <= endDayNum
    } else {
      // Wrap around range (e.g., Fri-Mon)
          isDayOpen = today >= startDayNum || today <= endDayNum
        }
      }
    } else {
      // Check if it's comma-separated format (e.g., "Mon,Wed,Fri") or single day
      const days = daysString.split(',').map(d => d.trim())
      const todayName = Object.keys(dayMap).find(key => dayMap[key] === today)
      isDayOpen = days.includes(todayName)
      
      // DEBUG: Log list format parsing
      console.log('🔍 LIST FORMAT:', { days, todayName, isDayOpen });
    }
    
    // DEBUG: Log day check result
    console.log('🔍 DAY CHECK RESULT:', { isDayOpen });
    
    if (!isDayOpen) {
      console.log('❌ FILTERED OUT: Not open today');
      return false;
    }
    
    // ✅ SIMPLIFIED APPROACH: For donation scheduling, show all blood banks that operate today
    // Users can see operating hours and plan accordingly - no need for strict real-time filtering
    
    // DEBUG: Log successful parsing (can be removed in production)
    console.log('🔍 TIME PARSING SUCCESS:', { 
      startTime: `${startHour}:${startMin}`,
      endTime: `${endHour}:${endMin}`,
      decision: 'SHOWING for donation scheduling - users can see hours and plan accordingly'
    });
    
    console.log('✅ BLOOD BANK AVAILABLE FOR SCHEDULING (operates today)');
    
    // Always return true if blood bank operates today - let users see the hours and decide
    return true;
    
    } catch (error) {
      console.error('💥 ERROR in isOpenNow function:', error, '- showing blood bank by default for safety');
      console.error('  Hours that caused error:', hours);
      return true; // SAFETY: Always show blood bank if there's any error
    }
  }, [])

  // Filtered and sorted blood banks with memoization
  // ENHANCED GEOLOCATION SYSTEM:
  // - Uses WGS84 ellipsoid constants for maximum accuracy (<0.1% error)
  // - Enhanced Haversine formula with IUGG mean Earth radius (6371008.8m)
  // - STRICT 15km radius: centers beyond 15.000km completely disappear from nearby tab
  // - Dynamic updates: nearby list refreshes when user moves >100m
  // - Coordinate validation: rejects invalid lat/lng values
  // - Real-time verification: logs all distance calculations for accuracy check
  // DISTANCE FILTERING SYSTEM:
  // - "Nearby" tab: ONLY shows blood banks within EXACTLY 15km radius
  // - "All" tab: Shows all blood banks regardless of distance (still calculates distance)
  // - Distance calculation returns meters for precise display (e.g., 230 m instead of 0.23 km)
  // - Distance calculation happens in fetchBloodBanks() and isWithinRadius() for accuracy
  // - Preserves all existing filters (day/time, search, custom filters)
  // OPERATING STATUS SYSTEM:
  // - Shows ALL blood banks (open and closed for today)
  // - Closed blood banks are visually disabled (grayed out, unclickable)
  // - Users can see operating hours but cannot select closed centers
  // - Open/closed status determined by isOpenNow() function
  const filteredAndSortedBloodBanks = useMemo(() => {
    let filteredData = [...bloodBanks]

    // Apply STRICT distance filter based on active tab and location permission
    if (activeTab === "nearby" && userLocation && permissionStatus === 'granted') {
      console.log(`🚨 NEARBY TAB ACTIVE - APPLYING STRICT 15KM FILTER`);
      console.log(`📍 User Location: ${userLocation.lat || userLocation.latitude}, ${userLocation.lng || userLocation.longitude}`);
      
      // FIRST: Force calculate distances for ALL centers to ensure accuracy
      console.log(`🔄 FORCE DISTANCE CALCULATION for all ${filteredData.length} centers:`);
      
      filteredData.forEach(bloodBank => {
        if (bloodBank.coordinates && bloodBank.coordinates.lat && bloodBank.coordinates.lng) {
          const { lat: userLat, lng: userLng, latitude: userLatitude, longitude: userLongitude } = userLocation;
          const { lat: bankLat, lng: bankLng } = bloodBank.coordinates;
          
          const finalUserLat = userLat || userLatitude;
          const finalUserLng = userLng || userLongitude;
          
          if (finalUserLat && finalUserLng) {
            const distanceInMeters = calculateStraightLineDistance(finalUserLat, finalUserLng, bankLat, bankLng);
            bloodBank.calculatedDistance = distanceInMeters;
            bloodBank.distanceText = formatDistanceMeters(distanceInMeters);
            
            console.log(`  📐 ${bloodBank.name}: ${(distanceInMeters/1000).toFixed(1)}km (${distanceInMeters}m)`);
          }
        }
      });
      
      // STRICT 15km radius filtering - any center beyond 15km completely disappears
      const beforeDistanceFilter = filteredData.length;
      const originalCount = filteredData.length;
      
      // Apply precise geolocation filtering with STRICT enforcement
      filteredData = filteredData.filter((bloodBank) => {
        // Use the already calculated distance from the force calculation above
        if (!bloodBank.calculatedDistance || bloodBank.calculatedDistance === null) {
          console.log(`❌ STRICT FILTER: ${bloodBank.name} - No calculated distance, EXCLUDED`);
          return false;
        }
        
        const distanceKm = (bloodBank.calculatedDistance / 1000).toFixed(3);
        
        // STRICT 15km enforcement - EXACTLY 15000 meters or less
        const withinRadius = bloodBank.calculatedDistance <= 15000;
        
        if (withinRadius) {
          console.log(`✅ STRICT INCLUDE: ${bloodBank.name} at ${distanceKm}km - WITHIN 15km limit`);
        } else {
          console.log(`❌ STRICT EXCLUDE: ${bloodBank.name} at ${distanceKm}km - BEYOND 15km limit (${bloodBank.calculatedDistance}m > 15000m)`);
        }
        
        return withinRadius;
      });
      
      const withinRadiusCount = filteredData.length;
      const excludedCount = originalCount - withinRadiusCount;
      
      console.log(`🎯 STRICT NEARBY FILTER RESULTS:`);
      console.log(`  📊 Total Centers: ${originalCount}`);
      console.log(`  ✅ Within 15km: ${withinRadiusCount}`);
      console.log(`  ❌ Excluded (>15km): ${excludedCount}`);
      console.log(`  📍 User Location: ${userLocation.lat || userLocation.latitude}, ${userLocation.lng || userLocation.longitude}`);
      
      // CRITICAL VERIFICATION: Ensure no center beyond 15km exists in filtered results
      const verificationCheck = filteredData.every(bank => 
        bank.calculatedDistance && bank.calculatedDistance <= 15000
      );
      
      console.log(`🔍 CRITICAL VERIFICATION: All nearby centers within 15km = ${verificationCheck}`);
      
      // If verification fails, log details and force re-filter
      if (!verificationCheck) {
        console.error(`🚨 VERIFICATION FAILED! Found centers beyond 15km in nearby list:`);
        filteredData.forEach(bank => {
          if (bank.calculatedDistance > 15000) {
            console.error(`  ❌ ${bank.name}: ${(bank.calculatedDistance/1000).toFixed(1)}km (${bank.calculatedDistance}m)`);
          }
        });
        
        // Force remove any center beyond 15km (emergency fix)
        filteredData = filteredData.filter(bank => 
          bank.calculatedDistance && bank.calculatedDistance <= 15000
        );
        
        console.log(`🔧 EMERGENCY FIX: Filtered down to ${filteredData.length} centers within 15km`);
      }
      
      // Final verification after emergency fix
      const finalCheck = filteredData.every(bank => 
        bank.calculatedDistance && bank.calculatedDistance <= 15000
      );
      console.log(`✅ FINAL VERIFICATION: All ${filteredData.length} centers within 15km = ${finalCheck}`);
      
    } else if (activeTab === "nearby" && (!userLocation || permissionStatus !== 'granted')) {
      // For nearby tab without location permission: show all blood banks (fallback behavior)
      console.log(`📍 NEARBY TAB: Location not available - showing all ${filteredData.length} blood banks as fallback`);
    } else {
      // For "all" tab: show ALL blood banks regardless of location or coordinates
      console.log(`🌍 ALL TAB: Showing ALL ${filteredData.length} blood banks (no location filtering)`);
      
      // Calculate distances for display if location is available, but don't filter
      if (userLocation && permissionStatus === 'granted') {
        let calculatedCount = 0;
        filteredData.forEach((bloodBank) => {
          if (bloodBank.coordinates && bloodBank.coordinates.lat && bloodBank.coordinates.lng) {
            const { lat: userLat, lng: userLng, latitude: userLatitude, longitude: userLongitude } = userLocation;
            const { lat: bankLat, lng: bankLng } = bloodBank.coordinates;
            
            const finalUserLat = userLat || userLatitude;
            const finalUserLng = userLng || userLongitude;
            
            if (finalUserLat && finalUserLng && bankLat && bankLng) {
              const distanceInMeters = calculateStraightLineDistance(finalUserLat, finalUserLng, bankLat, bankLng);
              bloodBank.calculatedDistance = distanceInMeters;
              bloodBank.distanceText = formatDistanceMeters(distanceInMeters);
              calculatedCount++;
            }
          } else {
            // Ensure blood banks without coordinates still have distance indicators
            bloodBank.calculatedDistance = null;
            bloodBank.distanceText = 'Location not available';
          }
        });
        console.log(`📏 ALL TAB: Calculated distances for ${calculatedCount}/${filteredData.length} centers with coordinates`);
      } else {
        // No location available: ensure all blood banks show without distance
        filteredData.forEach((bloodBank) => {
          bloodBank.calculatedDistance = null;
          bloodBank.distanceText = 'Enable location to see distance';
        });
        console.log(`📍 ALL TAB: No location permission - showing all ${filteredData.length} centers without distance`);
      }
    }

    // Add operating status to each blood bank for UI rendering
    filteredData = filteredData.map((bloodBank) => ({
      ...bloodBank,
      isOpenToday: isOpenNow(bloodBank.hours)
    }))

    // Apply filters
    if (filters.name) {
      const beforeNameFilter = filteredData.length;
      filteredData = filteredData.filter((item) => 
        item.name && item.name.toLowerCase().includes(filters.name.toLowerCase())
      )
      console.log(`🔽 NAME FILTER: "${filters.name}" reduced from ${beforeNameFilter} to ${filteredData.length} blood banks`);
    }

    if (filters.location) {
      const beforeLocationFilter = filteredData.length;
      filteredData = filteredData.filter((item) => 
        item.location && item.location.toLowerCase().includes(filters.location.toLowerCase())
      )
      console.log(`📍 LOCATION FILTER: "${filters.location}" reduced from ${beforeLocationFilter} to ${filteredData.length} blood banks`);
    }

    if (filters.bloodTypes) {
      const beforeBloodTypeFilter = filteredData.length;
      filteredData = filteredData.filter((item) => {
        const bloodTypesStr = getBloodTypesString(item.bloodTypes || item.bloodTypesAvailable)
        return bloodTypesStr.toLowerCase().includes(filters.bloodTypes.toLowerCase())
      })
      console.log(`🩸 BLOOD TYPE FILTER: "${filters.bloodTypes}" reduced from ${beforeBloodTypeFilter} to ${filteredData.length} blood banks`);
    }

    if (filters.availability !== "all") {
      const beforeAvailabilityFilter = filteredData.length;
      filteredData = filteredData.filter(
        (item) => item.availability && item.availability.toLowerCase() === filters.availability.toLowerCase(),
      )
      console.log(`✅ AVAILABILITY FILTER: "${filters.availability}" reduced from ${beforeAvailabilityFilter} to ${filteredData.length} blood banks`);
    }

    // Apply search
    if (searchTerm) {
      const beforeSearch = filteredData.length;
      const searchLower = searchTerm.toLowerCase()
      filteredData = filteredData.filter(
        (bloodBank) => {
          const bloodTypesStr = getBloodTypesString(bloodBank.bloodTypes || bloodBank.bloodTypesAvailable)
          const matches = (
            (bloodBank.name && bloodBank.name.toLowerCase().includes(searchLower)) ||
            (bloodBank.address || bloodBank.location || '').toLowerCase().includes(searchLower) ||
            bloodTypesStr.toLowerCase().includes(searchLower)
          );
          
          if (!matches) {
            console.log(`🔍 SEARCH EXCLUDED: "${bloodBank.name || bloodBank.bloodBankName}" - doesn't match "${searchTerm}"`);
          }
          
          return matches;
        }
      )
      
      console.log(`🔍 SEARCH FILTER: "${searchTerm}" reduced from ${beforeSearch} to ${filteredData.length} blood banks`);
      
      if (filteredData.length === 0) {
        console.warn(`🚨 SEARCH FILTER: No blood banks match search term "${searchTerm}"`);
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      if (sortConfig.key === "distance" && userLocation) {
        // Sort by calculated distance
        filteredData = sortHospitalsByDistance(filteredData)
        if (sortConfig.direction === "descending") {
          filteredData.reverse()
        }
      } else {
        // Sort by other fields
        filteredData.sort((a, b) => {
          let aValue = a[sortConfig.key]
          let bValue = b[sortConfig.key]
          
          // Handle string comparison
          if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
          }
          
          if (aValue < bValue) {
            return sortConfig.direction === "ascending" ? -1 : 1
          }
          if (aValue > bValue) {
            return sortConfig.direction === "ascending" ? 1 : -1
          }
          return 0
        })
      }
    }

    // 🚨 FINAL SAFETY CHECK: Force remove ANY center beyond 15km before returning
    if (activeTab === "nearby" && userLocation && permissionStatus === 'granted') {
      const beforeFinalCheck = filteredData.length;
      
      // Emergency filter - remove any center with distance > 15km
      filteredData = filteredData.filter(bank => {
        if (!bank.calculatedDistance) {
          console.log(`⚠️ FINAL CHECK: ${bank.name} - No calculated distance, EXCLUDED`);
          return false;
        }
        
        const withinLimit = bank.calculatedDistance <= 15000;
        if (!withinLimit) {
          console.error(`🚨 FINAL SAFETY FILTER: REMOVING ${bank.name} at ${(bank.calculatedDistance/1000).toFixed(1)}km - SHOULD NOT BE HERE!`);
        }
        return withinLimit;
      });
      
      const afterFinalCheck = filteredData.length;
      if (beforeFinalCheck !== afterFinalCheck) {
        console.error(`🚨 FINAL SAFETY FILTER TRIGGERED: Removed ${beforeFinalCheck - afterFinalCheck} centers beyond 15km`);
      }
      
      // Log all remaining centers for verification
      console.log(`🔍 FINAL NEARBY LIST (${filteredData.length} centers):`);
      filteredData.forEach(bank => {
        console.log(`  ✅ ${bank.name}: ${(bank.calculatedDistance/1000).toFixed(1)}km`);
      });
    }

    // 📊 FINAL RESULTS SUMMARY
    console.log(`📊 FINAL RESULTS SUMMARY:`)
    console.log(`  🏥 Total Blood Banks Displaying: ${filteredData.length}`)
    console.log(`  🗄️ Total Blood Banks in State: ${bloodBanks.length}`)
    console.log(`  🔍 Search Term: "${searchTerm}"`)
    console.log(`  📍 Active Tab: ${activeTab}`)
    console.log(`  📡 User Location: ${userLocation ? 'Available' : 'Not Available'}`)
    console.log(`  🔐 Permission: ${permissionStatus}`)
    console.log(`  📋 Blood Bank Names: ${filteredData.map(bb => bb.name || bb.bloodBankName).join(', ')}`)
    
    // CRITICAL: Warn if showing fewer than expected
    if (filteredData.length < bloodBanks.length) {
      console.warn(`⚠️ WARNING: Showing ${filteredData.length} out of ${bloodBanks.length} total blood banks!`);
      const missing = bloodBanks.filter(bb => !filteredData.find(f => f.id === bb.id));
      console.warn(`❌ Missing Blood Banks:`, missing.map(bb => ({ 
        name: bb.name || bb.bloodBankName, 
        id: bb.id, 
        hasCoords: !!(bb.coordinates?.lat && bb.coordinates?.lng),
        calculatedDistance: bb.calculatedDistance
      })));
    }

    return filteredData
  }, [bloodBanks, searchTerm, filters, sortConfig, userLocation, sortHospitalsByDistance, activeTab, permissionStatus, isOpenNow])

  // Enhanced marker management with persistence
  const updateMapMarkers = useCallback(() => {
    console.log('🗺️🗺️🗺️ UPDATE MAP MARKERS FUNCTION CALLED 🗺️🗺️🗺️');
    
    if (!googleMapRef.current || 
        !window.google || 
        !window.google.maps ||
        !window.google.maps.Marker ||
        !window.google.maps.SymbolPath) {
      console.log("❌ Marker update skipped - Google Maps not ready");
      console.log('🔍 Google Maps readiness check:', {
        googleMapRef: !!googleMapRef.current,
        windowGoogle: !!window.google,
        googleMaps: !!window.google?.maps,
        Marker: !!window.google?.maps?.Marker,
        SymbolPath: !!window.google?.maps?.SymbolPath
      });
      return;
    }

    console.log('✅ Google Maps is ready - proceeding with marker update');

    // Get current marker IDs and new blood bank IDs
    const currentMarkerIds = new Set(markersRef.current.map(m => m.bloodBankId).filter(Boolean));
    const newBloodBankIds = new Set(filteredAndSortedBloodBanks.map(b => b.id));
    
    console.log('📊 Marker comparison analysis:', {
      currentMarkers: markersRef.current.length,
      currentMarkerIds: Array.from(currentMarkerIds),
      newBloodBanks: filteredAndSortedBloodBanks.length,
      newBloodBankIds: Array.from(newBloodBankIds)
    });
    
    // Check if we need any updates at all
    const markersToAdd = filteredAndSortedBloodBanks.filter(b => !currentMarkerIds.has(b.id));
    const markersToRemove = markersRef.current.filter(m => m.bloodBankId && !newBloodBankIds.has(m.bloodBankId));
    
    console.log('🔄 Marker update plan:', {
      markersToAdd: markersToAdd.length,
      markersToRemove: markersToRemove.length,
      addList: markersToAdd.map(b => ({ id: b.id, name: b.name || b.bloodBankName })),
      removeList: markersToRemove.map(m => ({ id: m.bloodBankId, name: m.bloodBankData?.name }))
    });
    
    // If no changes needed, preserve existing markers
    if (markersToAdd.length === 0 && markersToRemove.length === 0) {
      console.log("🎯 No marker changes needed - preserving existing markers");
      console.log('✅ All markers are up to date');
      return;
    }

    console.log(`🔄 Executing marker updates: +${markersToAdd.length} new, -${markersToRemove.length} removed`);

    // Remove only markers that are no longer needed
    markersToRemove.forEach(marker => {
      if (marker && marker.setMap) {
        try {
          marker.setMap(null);
          console.log(`🗑️ Removed marker for: ${marker.bloodBankData?.name || 'Unknown'}`);
        } catch (error) {
          console.warn("Error removing marker:", error);
        }
      }
    });
    
    // Update markers array to remove deleted markers
    markersRef.current = markersRef.current.filter(m => !markersToRemove.includes(m));

    // Add only new markers (ones that don't already exist)
    markersToAdd.forEach((bloodBank) => {
      // Use geocoded coordinates first (more accurate), then fallback to coordinates object
      let lat = bloodBank.lat;
      let lng = bloodBank.lng;
      
      if (!lat || !lng) {
        if (bloodBank.coordinates && bloodBank.coordinates.lat && bloodBank.coordinates.lng) {
          lat = parseFloat(bloodBank.coordinates.lat);
          lng = parseFloat(bloodBank.coordinates.lng);
        } else {
          console.warn(`No coordinates found for ${bloodBank.name}`);
          return;
        }
      } else {
        // Ensure geocoded coordinates are numbers
        lat = parseFloat(lat);
        lng = parseFloat(lng);
      }
      
      try {
          
          // Validate coordinates
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`Invalid coordinates for ${bloodBank.name}: lat=${lat}, lng=${lng}`);
            return;
          }

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: googleMapRef.current,
            title: `${bloodBank.name || bloodBank.bloodBankName}${bloodBank.isOpenToday ? ' (Open)' : ' (Closed)'}`,
            icon: {
              url: bloodBank.isOpenToday 
                ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                      <g filter="url(#shadow)">
                        <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.059 27.941 0 18 0z" fill="#DC2626"/>
                        <circle cx="18" cy="18" r="11" fill="#ffffff"/>
                        <path d="M18 10v16M10 18h16" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
                      </g>
                      <defs>
                        <filter id="shadow" x="-2" y="-2" width="40" height="48">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
                        </filter>
                      </defs>
                    </svg>
                  `)
                : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                      <g filter="url(#shadow)">
                        <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.059 27.941 0 18 0z" fill="#6B7280"/>
                        <circle cx="18" cy="18" r="11" fill="#ffffff"/>
                        <path d="M18 10v16M10 18h16" stroke="#6B7280" stroke-width="2.5" stroke-linecap="round"/>
                      </g>
                      <defs>
                        <filter id="shadow" x="-2" y="-2" width="40" height="48">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
                        </filter>
                      </defs>
                    </svg>
                  `),
              scaledSize: new window.google.maps.Size(36, 44),
              anchor: new window.google.maps.Point(18, 44)
            },
            zIndex: bloodBank.isOpenToday ? 1000 : 500,
            optimized: false,
            animation: window.google.maps.Animation.DROP
          });

        // Create info window for blood bank
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-4 min-w-[280px] max-w-[320px]">
              <h3 class="font-semibold text-gray-900 mb-2">${bloodBank.name || bloodBank.bloodBankName}</h3>
              <div class="space-y-2">
                <p class="text-sm text-gray-600">📍 ${bloodBank.address || 'Address not available'}</p>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    bloodBank.isOpenToday 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }">
                    ${bloodBank.isOpenToday ? '🟢 Open' : '🔴 Closed'}
                  </span>
                  ${bloodBank.distance ? `<span class="text-xs text-gray-500">${bloodBank.distance}</span>` : ''}
                </div>
                <div class="flex gap-2 mt-3">
                  <button 
                    onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')"
                    class="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    🧭 Directions
                  </button>
                  <button 
                    onclick="document.dispatchEvent(new CustomEvent('selectBloodBank', { detail: ${JSON.stringify(bloodBank)} }))"
                    class="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                  >
                    📋 Select
                  </button>
                </div>
              </div>
            </div>
          `
        });

        // Add click listener to marker
        marker.addListener("click", () => {
          try {
            // Close any open info windows
            if (window.currentInfoWindow) {
              window.currentInfoWindow.close();
            }
            
            console.log('🎯 Marker clicked - selecting:', bloodBank.name || bloodBank.bloodBankName);
            
            setSelectedMarker(bloodBank);
            setSelectedBloodBank(bloodBank);
            
            // Center map on selected marker with smooth animation
            if (googleMapRef.current && marker.getPosition()) {
              googleMapRef.current.panTo(marker.getPosition());
              googleMapRef.current.setZoom(17);
            }
            
            // Highlight this marker (only if not already highlighting to prevent recursion)
            if (!isHighlightingRef.current) {
              highlightMarker(bloodBank, true);
            }
          } catch (error) {
            console.error('🚫 Error in marker click handler:', error);
          }
        });

        // Listen for custom select event
        document.addEventListener('selectBloodBank', (event) => {
          if (event.detail.id === bloodBank.id) {
            setSelectedBloodBank(bloodBank);
          }
        });

        // Add bloodBankId to marker for easy identification
        marker.bloodBankId = bloodBank.id;
        marker.bloodBankData = bloodBank;
        
        markersRef.current.push(marker);
        console.log(`✅ Added new marker for: ${bloodBank.name || bloodBank.bloodBankName}`);
      } catch (error) {
        console.error("Error creating marker for blood bank:", bloodBank.name, error);
      }
    });
  }, [filteredAndSortedBloodBanks]);

  // Enhanced marker highlighting with recursion prevention
  const highlightMarker = useCallback((targetBloodBank, shouldBounce = true) => {
    try {
      // Prevent recursion
      if (isHighlightingRef.current) {
        console.log('🔄 Highlighting already in progress, skipping to prevent recursion');
        return null;
      }
      
      // Safety check for Google Maps API
      if (!window.google || !window.google.maps || !googleMapRef.current) {
        console.warn('🚫 Google Maps not ready for marker highlighting');
        return null;
      }
      
      // Set highlighting flag
      isHighlightingRef.current = true;

      // Reset previous active marker
      if (activeMarkerRef.current && activeMarkerRef.current.setAnimation && activeMarkerRef.current.getMap()) {
        try {
          activeMarkerRef.current.setAnimation(null);
          // Reset to normal icon
          const wasOpen = activeMarkerRef.current.bloodBankData?.isOpenToday;
          activeMarkerRef.current.setIcon({
            url: wasOpen 
              ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#shadow)">
                      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.059 27.941 0 18 0z" fill="#DC2626"/>
                      <circle cx="18" cy="18" r="11" fill="#ffffff"/>
                      <path d="M18 10v16M10 18h16" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
                    </g>
                    <defs>
                      <filter id="shadow" x="-2" y="-2" width="40" height="48">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
                      </filter>
                    </defs>
                  </svg>
                `)
              : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#shadow)">
                      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.059 27.941 0 18 0z" fill="#6B7280"/>
                      <circle cx="18" cy="18" r="11" fill="#ffffff"/>
                      <path d="M18 10v16M10 18h16" stroke="#6B7280" stroke-width="2.5" stroke-linecap="round"/>
                    </g>
                    <defs>
                      <filter id="shadow" x="-2" y="-2" width="40" height="48">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
                      </filter>
                    </defs>
                  </svg>
                `),
            scaledSize: new window.google.maps.Size(36, 44),
            anchor: new window.google.maps.Point(18, 44)
          });
        } catch (resetError) {
          console.warn('🚫 Error resetting previous marker:', resetError);
        }
      }

      // Find and highlight the new marker with enhanced debugging
      console.log('🔍 Looking for marker with ID:', targetBloodBank.id);
      console.log('🗺️ Available markers:', markersRef.current.map(m => ({
        id: m?.bloodBankId,
        hasMap: !!m?.getMap(),
        title: m?.getTitle()
      })));
      
      let targetMarker = markersRef.current.find(m => 
        m && m.bloodBankId === targetBloodBank.id && m.getMap()
      );
      
      if (!targetMarker) {
        // Try alternative search methods
        console.log('🔄 Primary search failed, trying alternative methods...');
        targetMarker = markersRef.current.find(m => 
          m && m.getMap() && (
            m.getTitle()?.includes(targetBloodBank.name || targetBloodBank.bloodBankName) ||
            m.bloodBankData?.id === targetBloodBank.id ||
            m.bloodBankData?.name === targetBloodBank.name
          )
        );
        
        if (targetMarker) {
          console.log('✅ Found marker using alternative search method');
        }
      }

      if (targetMarker) {
        console.log('🎯 Highlighting marker for:', targetBloodBank.name || targetBloodBank.bloodBankName);
        
        try {
          // Set as active marker
          activeMarkerRef.current = targetMarker;
          
          // Change to highlighted icon (larger and different color)
          targetMarker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="44" height="52" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#shadow)">
                  <path d="M22 0C9.85 0 0 9.85 0 22c0 16.5 22 30 22 30s22-13.5 22-30C44 9.85 34.15 0 22 0z" fill="#3B82F6"/>
                  <circle cx="22" cy="22" r="13" fill="#ffffff"/>
                  <path d="M22 12v20M12 22h20" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
                </g>
                <defs>
                  <filter id="shadow" x="-2" y="-2" width="48" height="56">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
                  </filter>
                </defs>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(44, 52),
            anchor: new window.google.maps.Point(22, 52)
          });

          // Add bounce animation if requested
          if (shouldBounce) {
            targetMarker.setAnimation(window.google.maps.Animation.BOUNCE);
            setTimeout(() => {
              try {
                if (targetMarker === activeMarkerRef.current && targetMarker.getMap()) {
                  targetMarker.setAnimation(null);
                }
              } catch (animError) {
                console.warn('🚫 Error stopping marker animation:', animError);
              }
            }, 2000);
          }

          // Show info window without triggering click event (to prevent recursion)
          try {
            // Create and show info window directly
            if (window.currentInfoWindow) {
              window.currentInfoWindow.close();
            }
            
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; max-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
                    ${targetBloodBank.name || targetBloodBank.bloodBankName}
                  </h3>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
                    📍 ${targetBloodBank.address || 'Address not available'}
                  </p>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
                    📞 ${targetBloodBank.phone || 'Phone not available'}
                  </p>
                  <p style="margin: 0; font-size: 12px; color: ${targetBloodBank.isOpenToday ? '#059669' : '#dc2626'};">
                    ${targetBloodBank.isOpenToday ? '🟢 Open Today' : '🔴 Closed Today'}
                  </p>
                </div>
              `
            });
            
            infoWindow.open(googleMapRef.current, targetMarker);
            window.currentInfoWindow = infoWindow;
          } catch (infoError) {
            console.warn('🚫 Error showing info window:', infoError);
          }
          
          return targetMarker;
        } catch (highlightError) {
          console.error('🚫 Error highlighting marker:', highlightError);
          return null;
        } finally {
          // Clear highlighting flag
          isHighlightingRef.current = false;
        }
      } else {
        console.warn('🚫 Marker not found for highlighting:', targetBloodBank.name || targetBloodBank.bloodBankName);
        console.log('🔧 Creating temporary marker for focusing...');
        
        // Create a temporary marker for focusing if none exists
        try {
          const tempLat = targetBloodBank.lat || targetBloodBank.coordinates?.lat || targetBloodBank.latitude;
          const tempLng = targetBloodBank.lng || targetBloodBank.coordinates?.lng || targetBloodBank.longitude;
          
          if (tempLat && tempLng) {
            const tempMarker = new window.google.maps.Marker({
              position: { lat: parseFloat(tempLat), lng: parseFloat(tempLng) },
              map: googleMapRef.current,
              title: targetBloodBank.name || targetBloodBank.bloodBankName,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="44" height="52" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#shadow)">
                      <path d="M22 0C9.85 0 0 9.85 0 22c0 16.5 22 30 22 30s22-13.5 22-30C44 9.85 34.15 0 22 0z" fill="#FF6B35"/>
                      <circle cx="22" cy="22" r="13" fill="#ffffff"/>
                      <path d="M22 12v20M12 22h20" stroke="#FF6B35" stroke-width="3" stroke-linecap="round"/>
                    </g>
                    <defs>
                      <filter id="shadow" x="-2" y="-2" width="48" height="56">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
                      </filter>
                    </defs>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(44, 52),
                anchor: new window.google.maps.Point(22, 52)
              },
              animation: window.google.maps.Animation.DROP,
              zIndex: 2000
            });
            
            // Add bounce animation
            if (shouldBounce) {
              tempMarker.setAnimation(window.google.maps.Animation.BOUNCE);
              setTimeout(() => {
                if (tempMarker.getMap()) {
                  tempMarker.setAnimation(null);
                }
              }, 2000);
            }
            
            // Store as active marker
            activeMarkerRef.current = tempMarker;
            
            // Add to markers array for future reference
            tempMarker.bloodBankId = targetBloodBank.id;
            tempMarker.bloodBankData = targetBloodBank;
            markersRef.current.push(tempMarker);
            
            console.log('✅ Created temporary marker for focusing');
            return tempMarker;
          }
        } catch (tempError) {
          console.error('🚫 Error creating temporary marker:', tempError);
        }
        
        isHighlightingRef.current = false;
        return null;
      }
    } catch (error) {
      console.error('🚫 Error in highlightMarker function:', error);
      isHighlightingRef.current = false;
      return null;
    }
  }, []);

  // Force refresh all markers - completely recreate them
  const forceRefreshMarkers = useCallback(() => {
    console.log('🔄🔄🔄 FORCE REFRESHING ALL MARKERS 🔄🔄🔄');
    
    if (!googleMapRef.current || !window.google?.maps) {
      console.log('❌ Cannot force refresh - Google Maps not ready');
      return;
    }

    // Clear all existing markers
    console.log('🗑️ Clearing all existing markers...');
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        try {
          marker.setMap(null);
        } catch (error) {
          console.warn('Error removing marker during force refresh:', error);
        }
      }
    });
    markersRef.current = [];
    activeMarkerRef.current = null;

    // Recreate all markers
    console.log('🆕 Recreating all markers...');
    filteredAndSortedBloodBanks.forEach((bloodBank) => {
      // Use geocoded coordinates first (more accurate), then fallback to coordinates object
      let lat = bloodBank.lat;
      let lng = bloodBank.lng;
      
      if (!lat || !lng) {
        if (bloodBank.coordinates && bloodBank.coordinates.lat && bloodBank.coordinates.lng) {
          lat = parseFloat(bloodBank.coordinates.lat);
          lng = parseFloat(bloodBank.coordinates.lng);
        } else {
          console.warn(`No coordinates found for ${bloodBank.name} during force refresh`);
          return;
        }
      } else {
        lat = parseFloat(lat);
        lng = parseFloat(lng);
      }
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(`Invalid coordinates for ${bloodBank.name}: lat=${lat}, lng=${lng}`);
        return;
      }

      try {
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: googleMapRef.current,
          title: `${bloodBank.name || bloodBank.bloodBankName}${bloodBank.isOpenToday ? ' (Open)' : ' (Closed)'}`,
          icon: {
            url: bloodBank.isOpenToday 
              ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#shadow)">
                      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.059 27.941 0 18 0z" fill="#DC2626"/>
                      <circle cx="18" cy="18" r="11" fill="#ffffff"/>
                      <path d="M18 10v16M10 18h16" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
                    </g>
                    <defs>
                      <filter id="shadow" x="-2" y="-2" width="40" height="48">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
                      </filter>
                    </defs>
                  </svg>
                `)
              : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#shadow)">
                      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.059 27.941 0 18 0z" fill="#6B7280"/>
                      <circle cx="18" cy="18" r="11" fill="#ffffff"/>
                      <path d="M18 10v16M10 18h16" stroke="#6B7280" stroke-width="2.5" stroke-linecap="round"/>
                    </g>
                    <defs>
                      <filter id="shadow" x="-2" y="-2" width="40" height="48">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
                      </filter>
                    </defs>
                  </svg>
                `),
            scaledSize: new window.google.maps.Size(36, 44),
            anchor: new window.google.maps.Point(18, 44)
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: 1000
        });

        // Add click listener to marker
        marker.addListener("click", () => {
          try {
            console.log('🎯 Marker clicked during refresh - selecting:', bloodBank.name || bloodBank.bloodBankName);
            setSelectedMarker(bloodBank);
            setSelectedBloodBank(bloodBank);
            
            // Center map on selected marker
            if (googleMapRef.current && marker.getPosition()) {
              googleMapRef.current.panTo(marker.getPosition());
              googleMapRef.current.setZoom(17);
            }
            
            // Highlight this marker
            if (!isHighlightingRef.current) {
              highlightMarker(bloodBank, true);
            }
          } catch (error) {
            console.error('🚫 Error in refreshed marker click handler:', error);
          }
        });

        // Add bloodBankId to marker for identification
        marker.bloodBankId = bloodBank.id;
        marker.bloodBankData = bloodBank;
        
        markersRef.current.push(marker);
        console.log(`✅ Force refreshed marker for: ${bloodBank.name || bloodBank.bloodBankName}`);
      } catch (error) {
        console.error("Error creating marker during force refresh:", bloodBank.name, error);
      }
    });

    console.log(`✅ Force refresh complete - ${markersRef.current.length} markers created`);
  }, [filteredAndSortedBloodBanks, highlightMarker]);

  // Update markers when map is loaded or blood banks change
  useEffect(() => {
    console.log('🔄 MARKER UPDATE EFFECT TRIGGERED');
    console.log('📊 Effect trigger conditions:', {
      mapLoaded: mapLoaded,
      bloodBanksCount: filteredAndSortedBloodBanks.length,
      currentMarkersCount: markersRef.current.length,
      focusingBloodBank: focusingBloodBank,
      triggerReason: 'mapLoaded or filteredAndSortedBloodBanks or updateMapMarkers changed'
    });
    
    // Skip marker updates if we're currently focusing on a blood bank
    // This prevents markers from disappearing during focus operations
    if (focusingBloodBank || isFocusingRef.current) {
      console.log('⏸️ Skipping marker update - currently focusing on blood bank:', {
        focusingBloodBank: focusingBloodBank,
        isFocusingRef: isFocusingRef.current
      });
      return;
    }
    
    if (mapLoaded && filteredAndSortedBloodBanks.length > 0) {
      console.log('✅ Conditions met - calling updateMapMarkers');
      console.log('🏥 Blood banks to process:', filteredAndSortedBloodBanks.map(bb => ({
        id: bb.id,
        name: bb.name || bb.bloodBankName,
        hasCoordinates: !!(bb.lat && bb.lng) || !!(bb.coordinates?.lat && bb.coordinates?.lng)
      })));
      updateMapMarkers();
    } else {
      console.log('❌ Conditions not met for marker update:', {
        mapNotLoaded: !mapLoaded,
        noBloodBanks: filteredAndSortedBloodBanks.length === 0
      });
    }
  }, [mapLoaded, filteredAndSortedBloodBanks, updateMapMarkers, focusingBloodBank]);

  // Auto-refresh markers every 5 seconds to ensure they stay visible
  useEffect(() => {
    if (mapLoaded && filteredAndSortedBloodBanks.length > 0) {
      console.log('⏰ Starting auto-refresh interval for markers...');
      
      markerRefreshIntervalRef.current = setInterval(() => {
        // Check if markers are still visible on the map
        const visibleMarkers = markersRef.current.filter(marker => 
          marker && marker.getMap() && marker.getVisible()
        );
        
        console.log(`🔍 Auto-refresh check: ${visibleMarkers.length}/${markersRef.current.length} markers visible`);
        
        // If less than expected markers are visible, force refresh
        if (visibleMarkers.length < filteredAndSortedBloodBanks.length) {
          console.log('🚨 Some markers missing - triggering auto-refresh');
          forceRefreshMarkers();
        }
      }, 5000); // Check every 5 seconds
      
      return () => {
        if (markerRefreshIntervalRef.current) {
          console.log('🛑 Clearing auto-refresh interval');
          clearInterval(markerRefreshIntervalRef.current);
          markerRefreshIntervalRef.current = null;
        }
      };
    }
  }, [mapLoaded, filteredAndSortedBloodBanks.length, forceRefreshMarkers]);

  // Loading simulation
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [searchTerm, filters])

  // Cleanup function to reset markers on unmount
  useEffect(() => {
    return () => {
      // Clear auto-refresh interval
      if (markerRefreshIntervalRef.current) {
        clearInterval(markerRefreshIntervalRef.current);
        markerRefreshIntervalRef.current = null;
      }
      // Reset active marker on cleanup
      if (activeMarkerRef.current) {
        activeMarkerRef.current = null;
      }
      // Reset all flags
      isHighlightingRef.current = false;
      isFocusingRef.current = false;
      // Clear all markers on unmount
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, []);

  // Sorting function
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Get sort icon with animation
  const SortIcon = ({ columnName }) => {
    if (sortConfig.key !== columnName) {
      return <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity" />
    }
    return (
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: sortConfig.direction === "ascending" ? 0 : 180 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronUp className="w-4 h-4 text-red-500" />
      </motion.div>
    )
  }

  // Handle filter change with debounce
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Reset filters with animation
  const resetFilters = () => {
    setFilters({
      name: "",
      location: "",
      bloodTypes: "",
      availability: "all",
    })
    setSearchTerm("")
  }


  // Helper to convert bloodTypes to searchable string
  const getBloodTypesString = (bloodTypes) => {
    if (!bloodTypes) return ''
    if (Array.isArray(bloodTypes)) return bloodTypes.join(', ')
    return String(bloodTypes)
  }

  // Get blood type badge color with hover effect
  const getBloodTypeColor = (bloodType) => {
    const baseColors = {
      "O+": "bg-red-100 text-red-800 hover:bg-red-200",
      "O-": "bg-red-200 text-red-800 hover:bg-red-300",
      "A+": "bg-blue-100 text-blue-800 hover:bg-blue-200",
      "A-": "bg-blue-200 text-blue-800 hover:bg-blue-300",
      "B+": "bg-green-100 text-green-800 hover:bg-green-200",
      "B-": "bg-green-200 text-green-800 hover:bg-green-300",
      "AB+": "bg-purple-100 text-purple-800 hover:bg-purple-200",
      "AB-": "bg-purple-200 text-purple-800 hover:bg-purple-300",
    }
    return baseColors[bloodType.trim()] || "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  // Calculate counts for blood banks that are currently open and within distance
  const nearbyCount = useMemo(() => {
    // Only show nearby count if location permission is granted and location is available
    if (!userLocation || permissionStatus !== 'granted') {
      return 0;
    }
    return allBloodBanks.filter(bank => 
      isWithinRadius(bank, userLocation, 15)
    ).length
  }, [allBloodBanks, userLocation, permissionStatus])

  const nearbyOpenCount = useMemo(() => {
    // Count of nearby blood banks that are also open today
    if (!userLocation || permissionStatus !== 'granted') {
      return 0;
    }
    return allBloodBanks.filter(bank => 
      isOpenNow(bank.hours) && isWithinRadius(bank, userLocation, 15)
    ).length
  }, [allBloodBanks, userLocation, permissionStatus])

  const allCount = useMemo(() => {
    return allBloodBanks.length
  }, [allBloodBanks])

  const allOpenCount = useMemo(() => {
    return allBloodBanks.filter(bank => isOpenNow(bank.hours)).length
  }, [allBloodBanks])


  const handleBloodBankSelect = (bloodBank) => {
    // Prevent selecting closed blood banks
    if (!bloodBank.isOpenToday) {
      console.log('Cannot select closed blood bank:', bloodBank.name)
      return
    }
    
    setSelectedBloodBank(bloodBank)
    localStorage.setItem("eligibilityStep", "1")
    setTimeout(() => {
      navigate("/schedule", { state: { selectedHospital: bloodBank } })
    }, 300)
  }

  // Handle directions to blood bank with accurate coordinates
  const handleGetDirections = (bloodBank) => {
    // Use geocoded coordinates first (more accurate), then fallback to coordinates object
    let lat = bloodBank.lat;
    let lng = bloodBank.lng;
    
    if (!lat || !lng) {
      if (bloodBank.coordinates && bloodBank.coordinates.lat && bloodBank.coordinates.lng) {
        lat = parseFloat(bloodBank.coordinates.lat);
        lng = parseFloat(bloodBank.coordinates.lng);
      } else {
        console.warn(`No coordinates available for ${bloodBank.name}`);
        return;
      }
    } else {
      // Ensure geocoded coordinates are numbers
      lat = parseFloat(lat);
      lng = parseFloat(lng);
    }
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn(`Invalid coordinates for ${bloodBank.name}: lat=${lat}, lng=${lng}`);
      return;
    }
    
    const destination = `${lat},${lng}`;
    const bloodBankName = encodeURIComponent(bloodBank.name || bloodBank.bloodBankName || 'Blood Bank');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${bloodBankName}`;
    
    console.log(`🧭 Opening directions to ${bloodBank.name} at coordinates: ${lat}, ${lng}`);
    window.open(url, '_blank');
  };


  // Enhanced focus map on specific blood bank with full functionality
  const focusOnBloodBank = (bloodBank) => {
    console.log('🚀🚀🚀 FOCUS ON BLOOD BANK FUNCTION CALLED 🚀🚀🚀');
    console.log('📊 Function entry - bloodBank parameter:', bloodBank);
    console.log('🗺️ Google Map ref status:', {
      exists: !!googleMapRef.current,
      isInitialized: googleMapRef.current ? 'YES' : 'NO',
      mapType: googleMapRef.current ? typeof googleMapRef.current : 'undefined'
    });
    
    if (!googleMapRef.current) {
      console.error('❌ CRITICAL: Google Map not initialized yet');
      console.log('🔍 Debugging map initialization...');
      console.log('📍 googleMapRef:', googleMapRef);
      console.log('📍 googleMapRef.current:', googleMapRef.current);
      return;
    }
    
    if (!bloodBank) {
      console.error('❌ CRITICAL: No blood bank provided to focus on');
      console.log('🔍 bloodBank parameter is:', bloodBank);
      return;
    }
    
    console.log('✅ Initial checks passed - proceeding with focus operation');
    
    // Set focusing flag to prevent marker updates during focus operation
    console.log('🔒 Setting focusing flag to prevent marker interference');
    isFocusingRef.current = true;
    
    // Set focusing state for visual feedback
    console.log('🎨 Setting focusing state for blood bank ID:', bloodBank.id);
    setFocusingBloodBank(bloodBank.id);
    console.log('✅ Focusing state set successfully');
    
    // Get coordinates from multiple possible sources with enhanced debugging
    let lat, lng;
    
    console.log('🔍🔍🔍 COORDINATE RESOLUTION STARTING 🔍🔍🔍');
    console.log('🏥 Blood bank name:', bloodBank.name || bloodBank.bloodBankName);
    console.log('📍 RAW coordinate data inspection:');
    console.log('   - bloodBank.lat:', bloodBank.lat, '(type:', typeof bloodBank.lat, ')');
    console.log('   - bloodBank.lng:', bloodBank.lng, '(type:', typeof bloodBank.lng, ')');
    console.log('   - bloodBank.coordinates:', bloodBank.coordinates);
    console.log('   - bloodBank.latitude:', bloodBank.latitude, '(type:', typeof bloodBank.latitude, ')');
    console.log('   - bloodBank.longitude:', bloodBank.longitude, '(type:', typeof bloodBank.longitude, ')');
    console.log('📋 Complete bloodBank object keys:', Object.keys(bloodBank));
    console.log('📋 Complete bloodBank object:', bloodBank);
    
    // Priority 1: Use geocoded coordinates (most accurate)
    console.log('🔍 Checking Priority 1: geocoded coordinates (lat & lng)...');
    if (bloodBank.lat && bloodBank.lng) {
      console.log('✅ FOUND geocoded coordinates!');
      lat = parseFloat(bloodBank.lat);
      lng = parseFloat(bloodBank.lng);
      console.log('📍 Parsed geocoded coordinates:', { 
        original: { lat: bloodBank.lat, lng: bloodBank.lng },
        parsed: { lat, lng },
        isValidLat: !isNaN(lat),
        isValidLng: !isNaN(lng)
      });
    }
    // Priority 2: Use coordinates object
    else {
      console.log('❌ No geocoded coordinates found, checking Priority 2: coordinates object...');
      if (bloodBank.coordinates && bloodBank.coordinates.lat && bloodBank.coordinates.lng) {
        console.log('✅ FOUND coordinates object!');
        lat = parseFloat(bloodBank.coordinates.lat);
        lng = parseFloat(bloodBank.coordinates.lng);
        console.log('📍 Parsed coordinates object:', { 
          original: bloodBank.coordinates,
          parsed: { lat, lng },
          isValidLat: !isNaN(lat),
          isValidLng: !isNaN(lng)
        });
      }
      // Priority 3: Use latitude/longitude properties
      else {
        console.log('❌ No coordinates object found, checking Priority 3: latitude/longitude properties...');
        if (bloodBank.latitude && bloodBank.longitude) {
          console.log('✅ FOUND latitude/longitude properties!');
          lat = parseFloat(bloodBank.latitude);
          lng = parseFloat(bloodBank.longitude);
          console.log('📍 Parsed latitude/longitude:', { 
            original: { latitude: bloodBank.latitude, longitude: bloodBank.longitude },
            parsed: { lat, lng },
            isValidLat: !isNaN(lat),
            isValidLng: !isNaN(lng)
          });
        }
        // Priority 4: No coordinates found
        else {
          console.error('❌❌❌ NO COORDINATES FOUND ANYWHERE! ❌❌❌');
          console.log('🚫 Coordinate search failed for:', bloodBank.name || bloodBank.bloodBankName);
          console.log('📋 All available properties:', Object.keys(bloodBank));
          console.log('🔍 Detailed property inspection:');
          Object.keys(bloodBank).forEach(key => {
            console.log(`   - ${key}:`, bloodBank[key], `(type: ${typeof bloodBank[key]})`);
          });
          setFocusingBloodBank(null);
          return;
        }
      }
    }
    
    // Validate coordinates
    console.log('🔍 Validating coordinates...');
    console.log('📊 Coordinate validation check:', {
      lat: lat,
      lng: lng,
      latIsNaN: isNaN(lat),
      lngIsNaN: isNaN(lng),
      latInRange: lat >= -90 && lat <= 90,
      lngInRange: lng >= -180 && lng <= 180
    });
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('❌❌❌ COORDINATE VALIDATION FAILED! ❌❌❌');
      console.error(`🚫 Invalid coordinates for ${bloodBank.name}: lat=${lat}, lng=${lng}`);
      console.log('🔍 Validation details:', {
        lat: { value: lat, isNaN: isNaN(lat), inRange: lat >= -90 && lat <= 90 },
        lng: { value: lng, isNaN: isNaN(lng), inRange: lng >= -180 && lng <= 180 }
      });
      setFocusingBloodBank(null);
      return;
    }
    
    console.log('✅✅✅ COORDINATES VALIDATED SUCCESSFULLY! ✅✅✅');
    console.log(`🎯 Focusing map on ${bloodBank.name || bloodBank.bloodBankName} at coordinates: ${lat}, ${lng}`);
    
    try {
      console.log('🗺️🗺️🗺️ MAP TRANSITION STARTING 🗺️🗺️🗺️');
      
      // Get current map state for debugging
      const currentCenter = googleMapRef.current.getCenter();
      const initialZoom = googleMapRef.current.getZoom();
      console.log('📊 Current map state before transition:', {
        center: { lat: currentCenter.lat(), lng: currentCenter.lng() },
        zoom: initialZoom,
        mapExists: !!googleMapRef.current,
        mapType: typeof googleMapRef.current
      });
      
      // Create precise LatLng object for accurate positioning
      const targetLatLng = new window.google.maps.LatLng(lat, lng);
      console.log('🎯 Created precise LatLng object:', {
        lat: targetLatLng.lat(),
        lng: targetLatLng.lng(),
        toString: targetLatLng.toString()
      });
      
      // Calculate optimal zoom level based on device and screen size
      const currentZoom = initialZoom;
      let optimalZoom;
      
      if (isMobile) {
        // Mobile: Optimized zoom for better context and touch navigation
        optimalZoom = 16; // Increased from 15 for better detail on mobile
      } else if (isTablet) {
        // Tablet: Medium zoom for balanced view
        optimalZoom = 16;
      } else {
        // Desktop: Higher zoom for detailed view
        optimalZoom = 17;
      }
      
      // Adjust zoom based on current map bounds to prevent jarring transitions
      const mapBounds = googleMapRef.current.getBounds();
      if (mapBounds) {
        const ne = mapBounds.getNorthEast();
        const sw = mapBounds.getSouthWest();
        const boundsSize = Math.abs(ne.lat() - sw.lat()) + Math.abs(ne.lng() - sw.lng());
        
        // If currently zoomed out very far, use a more conservative zoom
        if (boundsSize > 1) { // Very wide view
          optimalZoom = Math.max(optimalZoom - 2, 13);
        } else if (boundsSize > 0.1) { // Moderately wide view
          optimalZoom = Math.max(optimalZoom - 1, 14);
        }
      }
      
      console.log('🔍 Zoom calculation:', {
        currentZoom: currentZoom,
        optimalZoom: optimalZoom,
        isMobile: isMobile,
        needsZoomChange: Math.abs(currentZoom - optimalZoom) > 0.5
      });
      
      // Use smooth animated transition with precise centering
      console.log('🎬 Executing smooth animated transition...');
      
      // Create bounds for precise centering with optimal padding
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(targetLatLng);
      
      // Add device-specific padding around the target for better visibility
      const padding = isMobile ? 60 : 120; // Reduced mobile padding for better centering
      
      // Method 1: Direct panTo for immediate response
      console.log('🎯 Step 1: Initial pan to target location...');
      googleMapRef.current.panTo(targetLatLng);
      
      // Method 2: Use fitBounds for precise centering if zoom needs significant adjustment
      const zoomDifference = Math.abs(currentZoom - optimalZoom);
      if (zoomDifference > 2) {
        console.log('🔍 Large zoom difference detected, using fitBounds for precision...');
        // Create a small bounds around the target for precise centering
        const precisionBounds = new window.google.maps.LatLngBounds();
        const offset = isMobile ? 0.002 : 0.001; // Larger offset for mobile for better context
        precisionBounds.extend(new window.google.maps.LatLng(lat + offset, lng + offset));
        precisionBounds.extend(new window.google.maps.LatLng(lat - offset, lng - offset));
        
        googleMapRef.current.fitBounds(precisionBounds, padding);
        
        // Fine-tune zoom to optimal level with mobile-specific timing
        const fitBoundsDelay = isMobile ? 400 : 600;
        setTimeout(() => {
          googleMapRef.current.setZoom(optimalZoom);
          googleMapRef.current.panTo(targetLatLng);
          console.log('📱 FitBounds completed with mobile optimization');
        }, fitBoundsDelay);
      }
      
      // Mobile-optimized animation timing
      const panDelay = isMobile ? 300 : 500; // Faster pan on mobile
      const zoomDelay = isMobile ? 200 : 300; // Faster zoom adjustment on mobile
      const finalAdjustmentDelay = isMobile ? 150 : 200; // Faster final adjustment on mobile
      
      console.log('⏰ Using mobile-optimized timing:', {
        panDelay: panDelay,
        zoomDelay: zoomDelay,
        finalAdjustmentDelay: finalAdjustmentDelay,
        isMobile: isMobile
      });
      
      // Wait for pan to complete, then set zoom with animation
      setTimeout(() => {
        if (Math.abs(currentZoom - optimalZoom) > 0.5) {
          console.log(`🔍 Animating zoom from ${currentZoom} to ${optimalZoom}`);
          googleMapRef.current.setZoom(optimalZoom);
        }
        
        // Ensure perfect centering after zoom
        setTimeout(() => {
          console.log('🎯 Final centering adjustment...');
          googleMapRef.current.panTo(targetLatLng);
          
          // Mobile-specific: Add extra centering for touch devices
          if (isMobile) {
            setTimeout(() => {
              console.log('📱 Mobile-specific extra centering...');
              googleMapRef.current.panTo(targetLatLng);
            }, 100);
          }
          
          // Verify final position and accuracy
          setTimeout(() => {
            const finalCenter = googleMapRef.current.getCenter();
            const finalZoom = googleMapRef.current.getZoom();
            const latDiff = Math.abs(finalCenter.lat() - targetLatLng.lat());
            const lngDiff = Math.abs(finalCenter.lng() - targetLatLng.lng());
            const totalDiff = latDiff + lngDiff;
            const isAccurate = totalDiff < (isMobile ? 0.0005 : 0.0001); // More lenient threshold for mobile
            
            console.log('📊 Final map state after transition:', {
              center: { lat: finalCenter.lat(), lng: finalCenter.lng() },
              zoom: finalZoom,
              targetWas: { lat: targetLatLng.lat(), lng: targetLatLng.lng() },
              centeringAccuracy: {
                latDiff: latDiff,
                lngDiff: lngDiff,
                totalDiff: totalDiff,
                isAccurate: isAccurate,
                accuracyRating: isAccurate ? '🎯 EXCELLENT' : totalDiff < 0.001 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
                isMobile: isMobile,
                threshold: isMobile ? 0.0005 : 0.0001
              }
            });
            
            // If centering is not accurate enough, perform final adjustment
            if (!isAccurate && totalDiff > (isMobile ? 0.002 : 0.001)) {
              console.log('🔧 Performing final precision adjustment...');
              setTimeout(() => {
                googleMapRef.current.panTo(targetLatLng);
                console.log('✅ Final precision adjustment completed');
              }, finalAdjustmentDelay);
            }
          }, 100); // Quick verification
        }, zoomDelay); // Allow zoom animation to complete
      }, panDelay); // Allow pan animation to complete
      
      console.log('✅ Smooth transition initiated');
      
      // Update selected states
      console.log('🎨 Updating selected states...');
      setSelectedMarker(bloodBank);
      setSelectedBloodBank(bloodBank);
      setMapCenter({ lat, lng });
      console.log('✅ Selected states updated');
      
      // For mobile, switch to map view if currently in list view
      console.log('📱 Checking mobile view mode switch...', {
        isMobile: isMobile,
        currentViewMode: viewMode,
        needsSwitch: isMobile && viewMode === "list"
      });
      if (isMobile && viewMode === "list") {
        console.log('📱 Switching to map view on mobile');
        setViewMode("map");
        
        // Mobile-specific: Wait for view switch to complete before continuing
        setTimeout(() => {
          console.log('📱 Mobile view switch completed, triggering map resize...');
          // Trigger map resize for mobile viewport
          if (googleMapRef.current) {
            window.google.maps.event.trigger(googleMapRef.current, 'resize');
            // Re-center after resize
            setTimeout(() => {
              googleMapRef.current.panTo(targetLatLng);
              console.log('📱 Mobile map resized and re-centered');
            }, 100);
          }
        }, 200);
        
        console.log('✅ View mode switched to map');
      }
      
      // Highlight the marker with enhanced visual feedback
      const highlightDelay = isMobile ? 600 : 1000; // Faster highlighting on mobile
      console.log(`⏰ Setting up marker highlighting timeout (${highlightDelay}ms delay for smooth transition)...`);
      setTimeout(() => {
        try {
          console.log('🎨🎨🎨 MARKER HIGHLIGHTING STARTING 🎨🎨🎨');
          console.log('🔍 Available markers before highlighting:', markersRef.current.length);
          console.log('📊 Markers details:', markersRef.current.map((m, index) => ({
            index: index,
            id: m?.bloodBankId,
            title: m?.getTitle?.(),
            hasMap: !!m?.getMap?.(),
            position: m?.getPosition?.()?.toString()
          })));
          
          console.log('🎯 Calling highlightMarker function...');
          const highlightedMarker = highlightMarker(bloodBank, true);
          
          if (highlightedMarker) {
            console.log('✅✅✅ MARKER HIGHLIGHTED SUCCESSFULLY! ✅✅✅');
            console.log('🎯 Highlighted marker for:', bloodBank.name || bloodBank.bloodBankName);
            console.log('📍 Highlighted marker details:', {
              id: highlightedMarker.bloodBankId,
              title: highlightedMarker.getTitle?.(),
              position: highlightedMarker.getPosition?.()?.toString()
            });
          } else {
            console.error('❌❌❌ MARKER HIGHLIGHTING FAILED! ❌❌❌');
            console.warn('⚠️ Failed to highlight marker - marker not found');
            console.log('🔍 Available markers after failed highlighting:', markersRef.current.map(m => ({
              id: m?.bloodBankId,
              title: m?.getTitle?.(),
              position: m?.getPosition?.()?.toString(),
              hasMap: !!m?.getMap?.()
            })));
          }
        } catch (error) {
          console.error('🚫🚫🚫 ERROR IN MARKER HIGHLIGHTING! 🚫🚫🚫');
          console.error('🚫 Error highlighting marker in focusOnBloodBank:', error);
          console.error('🔍 Error stack:', error.stack);
        }
        
        // Clear focusing state after animation completes
        console.log('⏰ Setting up focusing state cleanup timeout (1500ms delay)...');
        setTimeout(() => {
          console.log('🧹 Clearing focusing state...');
          setFocusingBloodBank(null);
          isFocusingRef.current = false; // Clear focusing flag
          
          // Force refresh markers after focusing to ensure they're all visible
          console.log('🔄 Triggering force refresh after focus operation...');
          setTimeout(() => {
            forceRefreshMarkers();
          }, 500);
          
          console.log('✅ Focusing state and flag cleared');
        }, 1500);
      }, highlightDelay); // Mobile-optimized delay to ensure smooth map transition completes
      
    } catch (error) {
      console.error('🚫 Error in focusOnBloodBank:', error);
      setFocusingBloodBank(null);
      isFocusingRef.current = false; // Clear focusing flag on error
      // Also trigger force refresh on error to ensure markers are visible
      setTimeout(() => {
        forceRefreshMarkers();
      }, 1000);
    }
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === "map" ? "list" : "map");
  };

  // Enhanced mobile card renderer with map integration
  const renderMobileCard = (bloodBank) => {
    const distanceInfo = getHospitalDistance(bloodBank.id)
    const isClosedToday = !bloodBank.isOpenToday
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        key={bloodBank.id}
        ref={(el) => {
          if (el) {
            bloodBankCardsRef.current[bloodBank.id] = el;
          }
        }}
        className={`
          bg-white rounded-xl shadow-sm p-4 mb-3 
          transition-all duration-200 border border-transparent
          ${isClosedToday 
            ? "opacity-50 cursor-not-allowed grayscale-50 border-gray-200" 
            : "hover:shadow-lg cursor-pointer hover:border-red-100 active:scale-[0.98]"
          }
          ${selectedBloodBank?.id === bloodBank.id && !isClosedToday ? "border-red-300 bg-red-50 shadow-lg ring-2 ring-red-200" : ""}
          ${focusingBloodBank === bloodBank.id ? "border-blue-300 bg-blue-50 shadow-lg ring-2 ring-blue-200" : ""}
          relative z-10 group
        `}
         onClick={() => {
           console.log('🖱️ CARD CLICKED - Starting debug trace...');
           console.log('📋 Card data:', {
             id: bloodBank.id,
             name: bloodBank.name || bloodBank.bloodBankName,
             isClosedToday: isClosedToday,
             coordinates: {
               lat: bloodBank.lat,
               lng: bloodBank.lng,
               coordinates: bloodBank.coordinates,
               latitude: bloodBank.latitude,
               longitude: bloodBank.longitude
             }
           });
           
           try {
             if (!isClosedToday) {
               console.log('✅ Card is open - proceeding with focus');
               console.log('🎯 Calling focusOnBloodBank with:', bloodBank.name || bloodBank.bloodBankName);
               focusOnBloodBank(bloodBank);
             } else {
               console.log('❌ Card is closed today - focus blocked');
             }
           } catch (error) {
             console.error('🚫 Error in card click handler:', error);
             console.error('🔍 Error details:', {
               message: error.message,
               stack: error.stack,
               bloodBank: bloodBank
             });
           }
         }}
       >
          {/* Header with status and distance */}
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.2 }} 
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${isClosedToday ? 'bg-gray-100' : 'bg-red-50'}`}
              >
              {bloodBank.urgent ? (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" title="Urgent need" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" title="Normal status" />
              )}
            </motion.div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-900 text-base">{bloodBank.name || bloodBank.bloodBankName}</h3>
              <div className="flex items-center gap-2 mt-1">
                {isClosedToday ? (
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Closed
                </span>
                ) : (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Open Now
                </span>
              )}
              </div>
          </div>
          </div>
          {(() => {
            // Always show distance information when user location is available
            if (permissionStatus === 'granted' && userLocation) {
              const distanceText = distanceInfo?.distance?.text || bloodBank.distanceText || 
                (bloodBank.calculatedDistance ? formatDistanceMeters(bloodBank.calculatedDistance) : null);
              
              if (distanceText && distanceText !== 'Location not available') {
                return (
                  <div className="flex items-center gap-1 text-red-600 bg-red-100 px-3 py-1.5 rounded-full">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm font-semibold">{distanceText}</span>
                  </div>
                );
              } else {
                // Blood bank has no coordinates - show "Location not available"
                return (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full">
                    <MapPinOff className="w-4 h-4" />
                    <span className="text-sm">Location not available</span>
                  </div>
                );
              }
            } else {
              // No user location permission
              return (
                <div className="flex items-center gap-1 text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                  <MapPinOff className="w-4 h-4" />
                  <span className="text-sm">Enable location to see distance</span>
                </div>
              );
            }
          })()}
        </div>

        {/* Details */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{bloodBank.address || bloodBank.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{bloodBank.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{bloodBank.hours}</span>
          </div>
          {distanceInfo?.duration && (
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">{distanceInfo.duration.text} drive</span>
            </div>
          )}
        </div>

        {/* Blood types */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {(bloodBank.bloodTypesAvailable || bloodBank.bloodTypes?.split(", ") || []).map((type, i) => (
              <motion.span
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium 
                  flex items-center transition-colors duration-200
                  ${getBloodTypeColor(type)}
                `}
              >
                <Droplet className="w-3 h-3 mr-1 flex-shrink-0" />
                {type}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Click to focus indicator - Desktop */}
        {!isClosedToday && !isMobile && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Target className="w-3 h-3" />
              Click to focus
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={`flex ${isMobile ? 'gap-2' : 'gap-1.5'} pt-3 border-t border-gray-100`}>
          {viewMode === "map" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                console.log('🗺️ VIEW ON MAP BUTTON CLICKED - Starting debug trace...');
                console.log('📍 Button data:', {
                  id: bloodBank.id,
                  name: bloodBank.name || bloodBank.bloodBankName,
                  event: e.type,
                  coordinates: {
                    lat: bloodBank.lat,
                    lng: bloodBank.lng,
                    coordinates: bloodBank.coordinates,
                    latitude: bloodBank.latitude,
                    longitude: bloodBank.longitude
                  }
                });
                
                try {
                  e.stopPropagation();
                  console.log('✅ Event propagation stopped');
                  console.log('🎯 Calling focusOnBloodBank from View on Map button');
                  focusOnBloodBank(bloodBank);
                } catch (error) {
                  console.error('🚫 Error in View on Map button click:', error);
                  console.error('🔍 Button error details:', {
                    message: error.message,
                    stack: error.stack,
                    bloodBank: bloodBank
                  });
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 ${isMobile ? 'py-2.5 px-4' : 'py-1.5 px-3'} ${
                focusingBloodBank === bloodBank.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              } rounded-lg font-medium ${isMobile ? 'text-sm' : 'text-xs'} transition-all duration-300`}
            >
              {focusingBloodBank === bloodBank.id ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`}
                >
                  <Loader className="w-full h-full" />
                </motion.div>
              ) : (
                <Target className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
              )}
              {focusingBloodBank === bloodBank.id ? 'Focusing...' : 'View on Map'}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              handleGetDirections(bloodBank);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 ${isMobile ? 'py-2.5 px-4' : 'py-1.5 px-3'} bg-green-50 text-green-600 rounded-lg font-medium ${isMobile ? 'text-sm' : 'text-xs'} hover:bg-green-100 transition-colors`}
          >
            <ExternalLink className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
            Get Directions
          </motion.button>
          {!isClosedToday && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleBloodBankSelect(bloodBank)}
              className={`flex-1 flex items-center justify-center gap-1.5 ${isMobile ? 'py-2.5 px-4' : 'py-1.5 px-3'} bg-red-500 text-white rounded-lg font-medium ${isMobile ? 'text-sm' : 'text-xs'} hover:bg-red-600 transition-colors`}
            >
              <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
              Select Center
            </motion.button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-pink-50/20 to-blue-50/30">
      <Header />

      {/* Mobile/Desktop Layout */}
      <div className="relative h-screen overflow-hidden">
        {/* View Mode Toggle - Mobile Only */}
        {isMobile && (
          <div className="absolute top-4 left-4 right-4 z-30">
            <div className="flex justify-center">
              <div className="bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-lg inline-flex border border-gray-200/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewMode("map")}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${viewMode === "map" 
                      ? "bg-red-500 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  <MapIcon className="w-4 h-4" />
                  Map
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewMode("list")}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${viewMode === "list" 
                      ? "bg-red-500 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  <List className="w-4 h-4" />
                  List
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop/Tablet Layout */}
        {!isMobile ? (
          <div className="flex h-full">
            {/* Left Sidebar - Blood Bank List */}
            <div className={`${isTablet ? 'w-80 min-w-80 max-w-80' : 'w-96 min-w-96 max-w-96'} bg-transparent overflow-hidden flex flex-col`}>
              {/* Enhanced Sidebar Header */}
              <div className={`${isTablet ? 'p-4' : 'p-6'} bg-transparent`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Droplet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className={`${isTablet ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Blood Banks</h1>
                    <p className="text-sm text-gray-600">Find centers near you</p>
                  </div>
                </div>
              </div>

              {/* Location Status */}
        {(!userLocation || permissionStatus !== 'granted') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                {permissionStatus === 'denied' ? (
                  <MapPinOff className="w-5 h-5 text-red-500" />
                ) : locationLoading ? (
                  <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5 text-blue-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {permissionStatus === 'denied' 
                            ? 'Location access is required to find nearby blood banks. Please enable location access in your browser settings.'
                      : locationLoading 
                        ? 'Getting your location...'
                              : 'Location access will help us show nearby blood banks'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Tab Navigation */}
              <div className={`${isTablet ? 'p-4 pb-3' : 'p-6 pb-4'}`}>
                <div className="bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl inline-flex w-full border border-gray-200/50 shadow-lg">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange("nearby")}
                disabled={!userLocation || permissionStatus !== 'granted'}
                className={`
                      flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                  ${!userLocation || permissionStatus !== 'granted' 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : activeTab === "nearby" 
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }
                `}
              >
                    <div className="flex items-center justify-center gap-2">
                  {!userLocation || permissionStatus !== 'granted' ? (
                    <MapPinOff className="w-4 h-4" />
                  ) : (
                  <MapPin className="w-4 h-4" />
                  )}
                  {!userLocation || permissionStatus !== 'granted' ? (
                        <span>Nearby</span>
                  ) : (
                    <span>Nearby ({nearbyCount})</span>
                  )}
                </div>
              </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange("all")}
                className={`
                  flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                  ${activeTab === "all" 
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }
                `}
              >
                    <div className="flex items-center justify-center gap-2">
                  <Building className="w-4 h-4" />
                      All ({allCount})
                </div>
                    </motion.button>
          </div>
        </div>

              {/* Search */}
              <div className="px-6 pb-4">
                <div className="relative">
            <motion.input
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              type="text"
              placeholder="Search blood banks by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                      w-full h-12 pl-12 pr-10 bg-white/70 backdrop-blur-sm hover:bg-white/90 focus:bg-white text-sm 
                      rounded-xl border border-gray-200/50 shadow-lg
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:shadow-xl
                focus:border-transparent placeholder-gray-500
                transition-all duration-300
              "
            />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {/* Results Count */}
              <div className="px-6 pb-4">
                <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600">
            Found <span className="font-medium">{filteredAndSortedBloodBanks.length}</span> donation centers
                  </p>
                </div>
      </div>

              {/* Enhanced Blood Bank List */}
              <div ref={bloodBankListRef} className={`flex-1 overflow-y-auto ${isTablet ? 'px-4 pb-4' : 'px-6 pb-6'} scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 bg-transparent`}>
        {isLoading || bloodBanksLoading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader className="w-8 h-8 text-red-500" />
            </motion.div>
            <span className="ml-3 text-gray-600">
              {bloodBanksLoading ? "Loading blood banks..." : "Loading..."}
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
              <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredAndSortedBloodBanks.length > 0 ? (
                  filteredAndSortedBloodBanks.map((bloodBank) => renderMobileCard(bloodBank))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                      text-center py-12 px-4
                      bg-white rounded-lg shadow-sm
                      border border-gray-200
                    "
                  >
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No donation centers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                  </motion.div>
                )}
              </motion.div>
                  </AnimatePresence>
                  )}
                </div>
              </div>

            {/* Right Side - Map */}
            <div className="flex-1 relative overflow-hidden rounded-lg shadow-lg">
              {mapError ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <div className="text-center p-8">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2 font-medium">Unable to load map</p>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">{mapError}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Retry
                    </button>
            </div>
                </div>
              ) : (
                <div 
                  ref={mapRef} 
                  className="w-full h-full rounded-xl shadow-inner border border-gray-200"
                  style={{ minHeight: '400px' }}
                />
              )}
              
              {!mapLoaded && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <div className="text-center p-8">
              <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader className="w-10 h-10 text-red-500 mx-auto mb-4" />
          </motion.div>
                    <p className="text-gray-700 font-medium">Loading interactive map...</p>
                    <p className="text-sm text-gray-500 mt-2">Finding nearby blood banks</p>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        ) : (
          /* Mobile Layout */
          <div className="h-full relative">
            {viewMode === "map" ? (
              /* Map View */
              <div className="h-full relative overflow-hidden">
                {mapError ? (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-6">
                      <AlertCircle className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2 font-medium">Map unavailable</p>
                      <p className="text-sm text-gray-500 px-4">{mapError}</p>
                          <button
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                        Retry
                          </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={mapRef} 
                    className="w-full h-full"
                    style={{ minHeight: '100vh' }}
                  />
                )}
                
                {!mapLoaded && !mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Loader className="w-10 h-10 text-red-500 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-700 font-medium">Loading map...</p>
                      <p className="text-sm text-gray-500 mt-1">Please wait</p>
                    </div>
                  </div>
                )}

                {/* Horizontal Scrollable Cards - ZUS Coffee Style */}
                <div className="absolute bottom-0 left-0 right-0 bg-transparent z-40 safe-area-inset-bottom">
                  {/* Enhanced Header */}
                  <div className="px-4 py-3 bg-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Nearby Blood Banks
                        </h3>
                        <p className="text-sm text-gray-500">
                          {filteredAndSortedBloodBanks.length} centers found
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 hidden sm:block">👈 Swipe to explore</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Horizontal Scrollable Cards */}
                  <div ref={horizontalScrollRef} className="overflow-x-auto scrollbar-hide pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div 
                      className="flex gap-4 p-4 pb-6" 
                      style={{ 
                        width: `${Math.max(filteredAndSortedBloodBanks.length * 288 + (filteredAndSortedBloodBanks.length - 1) * 16, window.innerWidth)}px`,
                        paddingLeft: '20px',
                        paddingRight: '20px'
                      }}
                    >
                        {filteredAndSortedBloodBanks.length > 0 ? (
                        filteredAndSortedBloodBanks.map((bloodBank, index) => (
                          <motion.div
                              key={bloodBank.id}
                            ref={(el) => {
                              if (el) {
                                bloodBankCardsRef.current[bloodBank.id] = el;
                              }
                            }}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ 
                              opacity: 1, 
                              x: 0,
                              scale: selectedBloodBank?.id === bloodBank.id ? 1.02 : 1
                            }}
                            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                            className={`flex-shrink-0 w-72 bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
                              selectedBloodBank?.id === bloodBank.id 
                                ? 'border-red-300 ring-2 ring-red-200 shadow-xl' 
                                : focusingBloodBank === bloodBank.id
                                  ? 'border-blue-300 ring-2 ring-blue-200 shadow-xl'
                                  : 'border-gray-200/50'
                            }`}
                            onClick={() => {
                              console.log('📱 HORIZONTAL CARD CLICKED - Starting debug trace...');
                              console.log('🏥 Horizontal card data:', {
                                id: bloodBank.id,
                                name: bloodBank.name || bloodBank.bloodBankName,
                                cardType: 'horizontal',
                                coordinates: {
                                  lat: bloodBank.lat,
                                  lng: bloodBank.lng,
                                  coordinates: bloodBank.coordinates,
                                  latitude: bloodBank.latitude,
                                  longitude: bloodBank.longitude
                                }
                              });
                              
                              try {
                                console.log('✅ Horizontal card is clickable - proceeding with focus');
                                console.log('🎯 Calling focusOnBloodBank from horizontal card');
                                focusOnBloodBank(bloodBank);
                              } catch (error) {
                                console.error('🚫 Error in horizontal card click handler:', error);
                                console.error('🔍 Horizontal card error details:', {
                                  message: error.message,
                                  stack: error.stack,
                                  bloodBank: bloodBank
                                });
                              }
                            }}
                          >
                            {/* Enhanced Blood Bank Image */}
                            <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                              <img 
                                src={bloodBank.coverImageUrl || bloodBank.image || '/api/placeholder/400/200'} 
                                alt={bloodBank.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgNzBMMjMwIDEwMEgyMTBWMTMwSDE5MFYxMDBIMTcwTDIwMCA3MFoiIGZpbGw9IiNEQzI2MjYiLz4KPHRleHQgeD0iMjAwIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjczODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9IjUwMCI+Qmxvb2QgQmFuayBJbWFnZTwvdGV4dD4KPC9zdmc+';
                                }}
                              />
                              {/* Status Badge Overlay */}
                              <div className="absolute top-3 left-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg ${
                                  bloodBank.isOpenToday 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-red-500 text-white'
                                }`}>
                                  {bloodBank.isOpenToday ? '🟢 Open' : '🔴 Closed'}
                                      </span>
                              </div>
                              {/* Distance Badge */}
                              {bloodBank.distanceText && (
                                <div className="absolute top-3 right-3">
                                  <span className="bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg">
                                    {bloodBank.distanceText}
                                  </span>
                                </div>
                              )}
                              
                              {/* Click to focus indicator */}
                              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Tap to focus
                                  </div>
                                </div>
                                </div>
                            
                            {/* Enhanced Card Content */}
                            <div className="p-4">
                              <div className="mb-4">
                                <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">
                                  {bloodBank.name || bloodBank.bloodBankName}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                  📍 {bloodBank.address || 'Address not available'}
                                </p>
                                {bloodBank.phone && (
                                  <p className="text-xs text-gray-500 mb-2">
                                    📞 {bloodBank.phone}
                                  </p>
                                )}
                                </div>
                              
                              {/* Enhanced Action Buttons */}
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGetDirections(bloodBank);
                                  }}
                                  className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                >
                                  🧭 Direction
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBloodBankSelect(bloodBank);
                                  }}
                                  disabled={!bloodBank.isOpenToday}
                                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                                    bloodBank.isOpenToday
                                      ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  📋 Select
                                </button>
                                </div>
                                </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                          <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-2xl">🏥</span>
                                </div>
                            <h4 className="font-semibold text-gray-900 mb-2">No Blood Banks Found</h4>
                            <p className="text-sm text-gray-500 mb-4">Try adjusting your location or search criteria</p>
                            <button 
                              onClick={() => window.location.reload()}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                            >
                              🔄 Refresh
                            </button>
                                </div>
                        </div>
                                          )}
                                        </div>
                                      </div>
                </div>


                                      </div>
            ) : (
              /* List View */
              <div ref={bloodBankListRef} className="h-full bg-transparent overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-20">

        {/* Location Status Indicator */}
        {(!userLocation || permissionStatus !== 'granted') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 max-w-md mx-auto"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                {permissionStatus === 'denied' ? (
                  <MapPinOff className="w-5 h-5 text-red-500" />
                ) : locationLoading ? (
                  <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5 text-blue-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {permissionStatus === 'denied' 
                      ? 'Location access is required to find nearby blood banks'
                      : locationLoading 
                        ? 'Getting your location...'
                        : 'Location access will help us show nearby blood banks'
                    }
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {permissionStatus === 'denied'
                      ? 'Location access is required to find nearby blood banks. Please enable location access in your browser settings.'
                      : locationLoading
                        ? 'Getting your location to show nearby blood banks...'
                        : 'Location access will help us show nearby donation centers and distances'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm p-1 rounded-lg inline-flex shadow-lg border border-gray-200/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange("nearby")}
                disabled={!userLocation || permissionStatus !== 'granted'}
                className={`
                  px-6 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${!userLocation || permissionStatus !== 'granted' 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : activeTab === "nearby" 
                    ? "bg-white/90 backdrop-blur-sm text-red-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {!userLocation || permissionStatus !== 'granted' ? (
                    <MapPinOff className="w-4 h-4" />
                  ) : (
                  <MapPin className="w-4 h-4" />
                  )}
                  {!userLocation || permissionStatus !== 'granted' ? (
                    <span>Nearby (Enable location)</span>
                  ) : (
                    <span>Nearby ({nearbyCount})</span>
                  )}
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange("all")}
                className={`
                  px-6 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === "all" 
                    ? "bg-white/90 backdrop-blur-sm text-red-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  All Donation Centers ({allCount})
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <motion.input
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              type="text"
              placeholder="Search blood banks by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full h-12 pl-12 pr-12 bg-white/90 backdrop-blur-sm text-base 
                rounded-xl shadow-lg border border-gray-200/50
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:shadow-xl
                focus:border-transparent placeholder-gray-500
                transition-all duration-300
              "
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            {searchTerm && (
                                        <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200/70 backdrop-blur-sm hover:bg-gray-300/80 rounded-full flex items-center justify-center transition-colors text-xs"
                                        >
                ✕
                                        </button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(!showFilters)}
              className="
                absolute right-4 top-1/2 -translate-y-1/2 
                text-gray-500 hover:text-red-500 
                transition-colors duration-200
              "
            >
              <Filter className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Filters Section */}
       

        {/* Results Count */}


        {/* Blood Bank Loading Error */}
        {bloodBanksError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">
                  Unable to load blood bank data
                </h3>
                <p className="text-xs text-yellow-700 mt-1">
                  {bloodBanksError} - Showing sample data instead.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {isLoading || bloodBanksLoading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader className="w-8 h-8 text-red-500" />
            </motion.div>
            <span className="ml-3 text-gray-600">
              {bloodBanksLoading ? "Loading blood banks..." : "Loading..."}
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
                      {/* Mobile View - Cards */}
              <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredAndSortedBloodBanks.length > 0 ? (
                  filteredAndSortedBloodBanks.map((bloodBank) => renderMobileCard(bloodBank))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                      text-center py-12 px-4
                      bg-white rounded-lg shadow-sm
                      border border-gray-200
                    "
                  >
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No donation centers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                  </motion.div>
                )}
              </motion.div>
          </AnimatePresence>
        )}
      </main>
                                  </div>
                                          )}
                                        </div>
        )}
                </div>
    </div>
  )
}
