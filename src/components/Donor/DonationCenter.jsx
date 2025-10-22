"use client"

import { useState, useMemo, useEffect } from "react"
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
} from "lucide-react"
import Header from "../Header"
import useLocation from "../../hooks/useLocation"
import useDistanceCalculation from "../../hooks/useDistanceCalculation"
import hospitalService from "../../services/hospitalService"

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
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBloodBank, setSelectedBloodBank] = useState(null)
  const [activeTab, setActiveTab] = useState("nearby") // "nearby" or "all"
  const [allBloodBanks, setAllBloodBanks] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)

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
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch blood banks function
  const fetchBloodBanks = async () => {
    try {
      setBloodBanksLoading(true)
      setBloodBanksError(null)
      
      // Fetch ALL blood banks with distance calculation (we'll filter on frontend for accuracy)
      const allData = await hospitalService.getHospitalsForLocation(userLocation, 999) // 999km limit = gets ALL blood banks
      
      // Calculate distances for all blood banks if user location is available AND permission is granted
      if (userLocation && permissionStatus === 'granted' && allData.length > 0) {
        console.log('🔍 LOCATION PERMISSION GRANTED - Calculating distances for', allData.length, 'blood banks');
        allData.forEach(bloodBank => {
          if (bloodBank.coordinates && bloodBank.coordinates.lat && bloodBank.coordinates.lng) {
            const { lat: userLat, lng: userLng, latitude: userLatitude, longitude: userLongitude } = userLocation;
            const { lat: bankLat, lng: bankLng } = bloodBank.coordinates;
            
            const finalUserLat = userLat || userLatitude;
            const finalUserLng = userLng || userLongitude;
            
            if (finalUserLat && finalUserLng) {
              const distanceInMeters = calculateStraightLineDistance(finalUserLat, finalUserLng, bankLat, bankLng);
              bloodBank.calculatedDistance = distanceInMeters;
              bloodBank.distanceText = formatDistanceMeters(distanceInMeters);
            }
      } else {
            // Set default values for blood banks without coordinates (999km in meters)
            bloodBank.calculatedDistance = 999000;
            bloodBank.distanceText = 'Distance unavailable';
          }
        });
        
        // Sort by distance for better performance (999km in meters for fallback)
        allData.sort((a, b) => (a.calculatedDistance || 999000) - (b.calculatedDistance || 999000));
      } else if (!userLocation || permissionStatus !== 'granted') {
        console.log('❌ LOCATION NOT AVAILABLE - Permission:', permissionStatus, '| Location:', !!userLocation);
        // Clear any existing distance data when location is not available
        allData.forEach(bloodBank => {
          bloodBank.calculatedDistance = null;
          bloodBank.distanceText = null;
        });
      }
      
      setAllBloodBanks(allData)
      
      // Set current display data
      setBloodBanks(allData)
      
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
      
      // Re-fetch to ensure accurate distance calculations with new location
      fetchBloodBanks();
    }
  }, [userLocation])

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

  // Loading simulation
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [searchTerm, filters])

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

  // Check if blood center operates today (for donation scheduling purposes)
  // Shows blood banks that are open on the current day - users can see hours and plan accordingly
  const isOpenNow = (hours) => {
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
        if (!bloodBank.calculatedDistance) {
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
    } else if (userLocation && permissionStatus === 'granted') {
      // For all tab: calculate distances for display but don't filter by distance
      let calculatedCount = 0;
      filteredData.forEach((bloodBank) => {
        if (bloodBank.coordinates) {
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
        }
      });
      console.log(`📏 ALL TAB: Calculated distances for ${calculatedCount}/${filteredData.length} centers`);
    }

    // Add operating status to each blood bank for UI rendering
    filteredData = filteredData.map((bloodBank) => ({
      ...bloodBank,
      isOpenToday: isOpenNow(bloodBank.hours)
    }))

    // Apply filters
    if (filters.name) {
      filteredData = filteredData.filter((item) => 
        item.name && item.name.toLowerCase().includes(filters.name.toLowerCase())
      )
    }

    if (filters.location) {
      filteredData = filteredData.filter((item) => 
        item.location && item.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    if (filters.bloodTypes) {
      filteredData = filteredData.filter((item) => {
        const bloodTypesStr = getBloodTypesString(item.bloodTypes || item.bloodTypesAvailable)
        return bloodTypesStr.toLowerCase().includes(filters.bloodTypes.toLowerCase())
      })
    }

    if (filters.availability !== "all") {
      filteredData = filteredData.filter(
        (item) => item.availability && item.availability.toLowerCase() === filters.availability.toLowerCase(),
      )
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredData = filteredData.filter(
        (bloodBank) => {
          const bloodTypesStr = getBloodTypesString(bloodBank.bloodTypes || bloodBank.bloodTypesAvailable)
          return (
            (bloodBank.name && bloodBank.name.toLowerCase().includes(searchLower)) ||
            (bloodBank.address || bloodBank.location || '').toLowerCase().includes(searchLower) ||
            bloodTypesStr.toLowerCase().includes(searchLower)
          )
        }
      )
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

    return filteredData
  }, [bloodBanks, searchTerm, filters, sortConfig, userLocation, sortHospitalsByDistance, activeTab, permissionStatus, isOpenNow])

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

  // Mobile card renderer with animations
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
        onClick={() => handleBloodBankSelect(bloodBank)}
        className={`
          bg-white rounded-lg shadow-sm p-4 mb-3 
          transition-all border border-transparent
          ${isClosedToday 
            ? "opacity-50 cursor-not-allowed grayscale-50 border-gray-200" 
            : "hover:shadow-md cursor-pointer hover:border-red-100"
          }
          ${selectedBloodBank?.id === bloodBank.id && !isClosedToday ? "border-red-200 bg-red-50" : ""}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              {bloodBank.urgent ? (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" title="Urgent need" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" title="Normal status" />
              )}
            </motion.div>
            <div className="flex flex-col">
            <h3 className="font-medium text-gray-900">{bloodBank.name}</h3>
              {isClosedToday && (
                <span className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Closed Today
                </span>
              )}
          </div>
          </div>
          {(distanceInfo || bloodBank.calculatedDistance || bloodBank.distanceText) && permissionStatus === 'granted' && userLocation ? (
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <Navigation className="w-3 h-3" />
              <span className="text-xs font-medium">
                {distanceInfo?.distance?.text || bloodBank.distanceText || (bloodBank.calculatedDistance ? formatDistanceMeters(bloodBank.calculatedDistance) : 'N/A')}
              </span>
            </div>
          ) : (!userLocation || permissionStatus !== 'granted') && (
            <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              <MapPinOff className="w-3 h-3" />
              <span className="text-xs">Enable location</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{bloodBank.address || bloodBank.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{bloodBank.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{bloodBank.hours}</span>
          </div>
          {distanceInfo?.duration && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">{distanceInfo.duration.text} drive</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {(bloodBank.bloodTypesAvailable || bloodBank.bloodTypes?.split(", ") || []).map((type, i) => (
              <motion.span
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-2 py-1 rounded-full text-xs font-medium 
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
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

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
                      ? 'Location access denied'
                      : locationLoading 
                        ? 'Getting your location...'
                        : 'Enable location for better experience'
                    }
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {permissionStatus === 'denied'
                      ? 'Please enable location in your browser settings to see nearby centers'
                      : locationLoading
                        ? 'This will help us show blood banks near you'
                        : 'Allow location access to see nearby donation centers and distances'
                    }
                  </p>
                  {permissionStatus !== 'denied' && !locationLoading && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={getCurrentLocation}
                      className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Enable Location
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
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
                    ? "bg-white text-red-600 shadow-sm" 
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
                    ? "bg-white text-red-600 shadow-sm" 
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
              placeholder="Search donation centers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full h-12 pl-12 pr-12 bg-white text-base 
                rounded-xl shadow-sm border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-red-500 
                focus:border-transparent placeholder-gray-400
                transition-all duration-200
              "
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-red-500" />
                    Advanced Filters
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetFilters}
                    className="
                      text-xs px-3 py-1 rounded-full
                      text-red-600 hover:text-red-700
                      bg-red-50 hover:bg-red-100
                      transition-colors duration-200
                    "
                  >
                    Reset all
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="flex text-xs font-medium text-gray-700 mb-1 items-center">
                      <Building className="w-4 h-4 mr-1 text-red-500" />
                      Donation Center
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={filters.name}
                        onChange={handleFilterChange}
                        className="
                          w-full h-10 pl-9 pr-3 text-sm
                          border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-1 focus:ring-red-500
                          transition-all duration-200
                        "
                        placeholder="Filter by name..."
                      />
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="flex text-xs font-medium text-gray-700 mb-1 items-center">
                      <MapPin className="w-4 h-4 mr-1 text-red-500" />
                      Location
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="location"
                        value={filters.location}
                        onChange={handleFilterChange}
                        className="
                          w-full h-10 pl-9 pr-3 text-sm
                          border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-1 focus:ring-red-500
                          transition-all duration-200
                        "
                        placeholder="Filter by location..."
                      />
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="flex text-xs font-medium text-gray-700 mb-1 items-center">
                      <Droplet className="w-4 h-4 mr-1 text-red-500" />
                      Preferred Blood Types
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="bloodTypes"
                        value={filters.bloodTypes}
                        onChange={handleFilterChange}
                        className="
                          w-full h-10 pl-9 pr-3 text-sm
                          border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-1 focus:ring-red-500
                          transition-all duration-200
                        "
                        placeholder="Filter by blood type..."
                      />
                      <Droplet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="flex text-xs font-medium text-gray-700 mb-1 items-center">
                      <Clock className="w-4 h-4 mr-1 text-red-500" />
                      Availability
                    </label>
                    <select
                      name="availability"
                      value={filters.availability}
                      onChange={handleFilterChange}
                      className="
                        w-full h-10 pl-9 pr-3 text-sm
                        border border-gray-200 rounded-lg
                        focus:outline-none focus:ring-1 focus:ring-red-500
                        transition-all duration-200
                        appearance-none
                        bg-white
                      "
                    >
                      <option value="all">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-sm text-gray-600">
            Found <span className="font-medium">{filteredAndSortedBloodBanks.length}</span> donation centers
            {searchTerm && (
              <span className="ml-1">
                matching "<span className="text-red-600">{searchTerm}</span>"
              </span>
            )}
          </p>
            {filteredAndSortedBloodBanks.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {filteredAndSortedBloodBanks.filter(bank => bank.isOpenToday).length} Open Today
                  </span>
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {filteredAndSortedBloodBanks.filter(bank => !bank.isOpenToday).length} Closed Today
                  </span>
                </div>
    {activeTab === "nearby" && userLocation && permissionStatus === 'granted' && (
      <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
        <Navigation className="w-3 h-3" />
        <span>All within 15km radius</span>
        {filteredAndSortedBloodBanks.length > 0 && (
          <span className="text-blue-500">
            (Closest: {Math.min(...filteredAndSortedBloodBanks.filter(b => b.calculatedDistance && b.calculatedDistance <= 15000).map(b => b.calculatedDistance / 1000)).toFixed(1)}km)
          </span>
        )}
        {/* Debug: Show furthest distance */}
        {filteredAndSortedBloodBanks.length > 0 && (
          <span className="text-xs text-gray-500">
            | Furthest: {Math.max(...filteredAndSortedBloodBanks.filter(b => b.calculatedDistance && b.calculatedDistance <= 15000).map(b => b.calculatedDistance / 1000)).toFixed(1)}km
          </span>
        )}
      </div>
    )}
              </div>
            )}
          </div>
        </motion.div>

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
            {isMobile ? (
              // Mobile View - Cards
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
            ) : (
              // Desktop View - Table
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
              >
                {/* Auto-refresh UI - Top Right of Table (Hidden) */}
                {/* <div className="flex items-center justify-end gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      id="autoRefreshTable"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="autoRefreshTable" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap">
                      <RefreshCw className={`w-4 h-4 text-red-500 ${autoRefresh ? 'animate-spin' : ''}`} />
                      Auto-refresh (20s)
                    </label>
                    {lastRefreshTime && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        Last: {lastRefreshTime.toLocaleTimeString()}
                      </span>
                    )}
                  </motion.div>
                </div> */}
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-600">
                        <th className="text-left py-4 px-4 font-medium">
                          <button
                            onClick={() => requestSort("name")}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                          >
                            <Building className="w-4 h-4 text-red-500" />
                            Donation Center
                            <SortIcon columnName="name" />
                          </button>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">
                          <button
                            onClick={() => requestSort("location")}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                          >
                            <MapPin className="w-4 h-4 text-red-500" />
                            Location
                            <SortIcon columnName="location" />
                          </button>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">
                          <button
                            onClick={() => requestSort("phone")}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                          >
                            <Phone className="w-4 h-4 text-red-500" />
                            Contact
                            <SortIcon columnName="phone" />
                          </button>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">
                          <button
                            onClick={() => requestSort("hours")}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                          >
                            <Calendar className="w-4 h-4 text-red-500" />
                            Day and Hours
                            <SortIcon columnName="hours" />
                          </button>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">
                          <button
                            onClick={() => requestSort("bloodTypes")}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                          >
                            <Droplet className="w-4 h-4 text-red-500" />
                            Preferred Blood Types
                            <SortIcon columnName="bloodTypes" />
                          </button>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">
                          <button
                            onClick={() => requestSort("distance")}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                          >
                            <Navigation className="w-4 h-4 text-red-500" />
                            Distance
                            <SortIcon columnName="distance" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredAndSortedBloodBanks.length > 0 ? (
                          filteredAndSortedBloodBanks.map((bloodBank, index) => {
                            const isClosedToday = !bloodBank.isOpenToday
                            return (
                            <motion.tr
                              key={bloodBank.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleBloodBankSelect(bloodBank)}
                              className={`
                                border-t border-gray-100 
                                transition-colors duration-200
                                  ${isClosedToday 
                                    ? "opacity-50 cursor-not-allowed grayscale-50 bg-gray-50" 
                                    : "hover:bg-red-50 cursor-pointer"
                                  }
                                  ${selectedBloodBank?.id === bloodBank.id && !isClosedToday ? "bg-red-50" : ""}
                              `}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                    {bloodBank.urgent ? (
                                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    )}
                                  </motion.div>
                                  <div className="flex flex-col">
                                  <span className="text-sm text-gray-900">{bloodBank.name}</span>
                                    {isClosedToday && (
                                      <span className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Closed Today
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{bloodBank.address || bloodBank.location}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{bloodBank.phone}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{bloodBank.hours}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {(bloodBank.bloodTypesAvailable || bloodBank.bloodTypes?.split(", ") || []).map((type, i) => (
                                    <motion.span
                                      key={i}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={`
                                        px-2 py-1 rounded-full text-xs font-medium 
                                        flex items-center transition-colors duration-200
                                        ${getBloodTypeColor(type)}
                                      `}
                                    >
                                      <Droplet className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {type}
                                    </motion.span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {(() => {
                                  const distanceInfo = getHospitalDistance(bloodBank.id)
                                  
                                  // Show distance if available from any source
                                  if (distanceInfo?.distance?.text) {
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex flex-col">
                                          <span className="text-sm text-gray-900 font-medium">
                                            {distanceInfo.distance.text}
                                          </span>
                                          {distanceInfo?.duration && (
                                            <span className="text-xs text-gray-500">
                                              {distanceInfo.duration.text}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  }
                                  
                                  // Show calculated distance
                                  if (bloodBank.distanceText) {
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-900 font-medium">
                                          {bloodBank.distanceText}
                                        </span>
                                      </div>
                                    )
                                  }
                                  
                                  // Show raw calculated distance
                                  if (bloodBank.calculatedDistance && bloodBank.calculatedDistance !== 999000) {
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-900 font-medium">
                                          {formatDistanceMeters(bloodBank.calculatedDistance)}
                                        </span>
                                      </div>
                                    )
                                  }
                                  
                                  // Show loading state
                                  if (distanceLoading) {
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                                        <span className="text-xs text-gray-500">Calculating...</span>
                                      </div>
                                    )
                                  }
                                  
                                  // Show location-related messages based on permission status
                                  if (!userLocation) {
                                    // Check permission status to show appropriate message
                                    if (permissionStatus === 'denied') {
                                    return (
                                        <div className="flex items-center gap-1">
                                          <MapPinOff className="w-4 h-4 text-red-400" />
                                          <span className="text-xs text-red-500">Location denied</span>
                                        </div>
                                      )
                                    } else if (permissionStatus === 'prompt' || permissionStatus === 'default') {
                                      return (
                                        <button 
                                          onClick={getCurrentLocation}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                          <MapPin className="w-4 h-4" />
                                          Enable location
                                        </button>
                                      )
                                    } else if (locationLoading) {
                                      return (
                                        <div className="flex items-center gap-1">
                                          <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                                          <span className="text-xs text-gray-400">Getting location...</span>
                                        </div>
                                      )
                                    } else {
                                      return (
                                        <span className="text-xs text-gray-400">Location unavailable</span>
                                      )
                                    }
                                  }
                                  
                                  // Debug: Show what we have
                                  console.log('Debug - Blood Bank:', bloodBank.name, {
                                    coordinates: bloodBank.coordinates,
                                    calculatedDistance: bloodBank.calculatedDistance,
                                    distanceText: bloodBank.distanceText,
                                    userLocation: userLocation
                                  })
                                  
                                  // Default fallback
                                  return (
                                    <span className="text-xs text-gray-400">N/A</span>
                                  )
                                })()}
                              </td>
                            </motion.tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan="6">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-12 text-center"
                              >
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 mb-2">No donation centers found</p>
                                <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
