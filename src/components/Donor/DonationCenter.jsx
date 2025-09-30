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
  const [selectedHospital, setSelectedHospital] = useState(null)

  // Helper function to calculate straight-line distance between two coordinates
  const calculateStraightLineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
  
  // Hospital data state
  const [hospitals, setHospitals] = useState([])
  const [hospitalsLoading, setHospitalsLoading] = useState(true)
  const [hospitalsError, setHospitalsError] = useState(null)
  
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

  // Fetch hospitals on component mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true)
        setHospitalsError(null)
        
        // Get hospitals (will use location-based filtering if available)
        console.log('🏥 Fetching hospitals...', { userLocation })
        console.log('🏥 User location format check:', {
          lat: userLocation?.lat || userLocation?.latitude,
          lng: userLocation?.lng || userLocation?.longitude,
          hasCoordinates: !!(userLocation?.lat || userLocation?.latitude) && !!(userLocation?.lng || userLocation?.longitude)
        })
        const hospitalData = await hospitalService.getHospitalsForLocation(userLocation)
        console.log('🏥 Hospitals received:', hospitalData)
        console.log('🏥 First hospital data:', hospitalData[0])
        if (hospitalData[0]) {
          console.log('🏥 Hospital name field:', hospitalData[0].name)
          console.log('🏥 Hospital hospitalName field:', hospitalData[0].hospitalName)
          console.log('🏥 Hospital hours field:', hospitalData[0].hours)
          console.log('🏥 Hospital operatingHours field:', hospitalData[0].operatingHours)
          console.log('🏥 Hospital coordinates:', hospitalData[0].coordinates)
          console.log('🏥 Hospital calculated distance:', hospitalData[0].calculatedDistance)
          console.log('🏥 Hospital distance text:', hospitalData[0].distanceText)
        }
        setHospitals(hospitalData)
      } catch (error) {
        setHospitalsError(error.message)
        console.error('Failed to fetch hospitals:', error)
      } finally {
        setHospitalsLoading(false)
      }
    }

    fetchHospitals()
  }, [userLocation]) // Re-fetch when user location changes

  // Calculate distances when user location is available and hospitals are loaded
  useEffect(() => {
    if (userLocation && hospitals.length > 0) {
      calculateMultipleDistances(hospitals)
    }
  }, [userLocation, hospitals, calculateMultipleDistances])

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

  // Filtered and sorted hospitals with memoization
  const filteredAndSortedHospitals = useMemo(() => {
    let filteredData = [...hospitals]

    // Apply filters
    if (filters.name) {
      filteredData = filteredData.filter((item) => item.name.toLowerCase().includes(filters.name.toLowerCase()))
    }

    if (filters.location) {
      filteredData = filteredData.filter((item) => item.location.toLowerCase().includes(filters.location.toLowerCase()))
    }

    if (filters.bloodTypes) {
      filteredData = filteredData.filter((item) =>
        item.bloodTypes.toLowerCase().includes(filters.bloodTypes.toLowerCase()),
      )
    }

    if (filters.availability !== "all") {
      filteredData = filteredData.filter(
        (item) => item.availability.toLowerCase() === filters.availability.toLowerCase(),
      )
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredData = filteredData.filter(
        (hospital) =>
          hospital.name.toLowerCase().includes(searchLower) ||
          (hospital.address || hospital.location || '').toLowerCase().includes(searchLower) ||
          hospital.bloodTypes.toLowerCase().includes(searchLower),
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

    return filteredData
  }, [hospitals, searchTerm, filters, sortConfig, userLocation, sortHospitalsByDistance])

  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital)
    localStorage.setItem("eligibilityStep", "1")
    setTimeout(() => {
      navigate("/schedule", { state: { selectedHospital: hospital } })
    }, 300)
  }

  // Mobile card renderer with animations
  const renderMobileCard = (hospital) => {
    const distanceInfo = getHospitalDistance(hospital.id)
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        key={hospital.id}
        onClick={() => handleHospitalSelect(hospital)}
        className={`
          bg-white rounded-lg shadow-sm p-4 mb-3 
          hover:shadow-md transition-all cursor-pointer
          border border-transparent hover:border-red-100
          ${selectedHospital?.id === hospital.id ? "border-red-200 bg-red-50" : ""}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              {hospital.urgent ? (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" title="Urgent need" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" title="Normal status" />
              )}
            </motion.div>
            <h3 className="font-medium text-gray-900">{hospital.name}</h3>
          </div>
          {(distanceInfo || hospital.calculatedDistance) && (
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <Navigation className="w-3 h-3" />
              <span className="text-xs font-medium">
                {distanceInfo?.distance?.text || hospital.distanceText || `${hospital.calculatedDistance?.toFixed(1)} km`}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{hospital.address || hospital.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{hospital.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{hospital.hours}</span>
          </div>
          {distanceInfo && distanceInfo.duration && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">{distanceInfo.duration.text} drive</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {(hospital.bloodTypesAvailable || hospital.bloodTypes?.split(", ") || []).map((type, i) => (
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
        {/* Location Permission Section */}
        <div className="mb-6">
          <AnimatePresence>
            {!userLocation && permissionStatus !== 'denied' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
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
            
            {locationError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPinOff className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="text-sm font-medium text-red-900">
                        Location access unavailable
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
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {userLocation && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="text-sm font-medium text-green-900">
                        Location enabled
                      </h3>
                      <p className="text-xs text-green-700 mt-1">
                        Showing accurate distances to donation centers near your location
                        {distanceLoading && " • Calculating distances..."}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetLocation}
                    className="
                      px-3 py-1 text-green-700 text-xs font-medium 
                      hover:bg-green-100 rounded-lg transition-colors
                    "
                  >
                    Disable
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                      Blood Types
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
          <p className="text-sm text-gray-600">
            Found <span className="font-medium">{filteredAndSortedHospitals.length}</span> donation centers
            {userLocation && (
              <span className="ml-1 text-green-600">
                • Sorted by distance from your location
              </span>
            )}
            {searchTerm && (
              <span className="ml-1">
                matching "<span className="text-red-600">{searchTerm}</span>"
              </span>
            )}
          </p>
        </motion.div>

        {/* Hospital Loading Error */}
        {hospitalsError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">
                  Unable to load hospital data
                </h3>
                <p className="text-xs text-yellow-700 mt-1">
                  {hospitalsError} - Showing sample data instead.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {isLoading || hospitalsLoading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader className="w-8 h-8 text-red-500" />
            </motion.div>
            <span className="ml-3 text-gray-600">
              {hospitalsLoading ? "Loading hospitals..." : "Loading..."}
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {isMobile ? (
              // Mobile View - Cards
              <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredAndSortedHospitals.length > 0 ? (
                  filteredAndSortedHospitals.map((hospital) => renderMobileCard(hospital))
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
                            Hours
                            <SortIcon columnName="hours" />
                          </button>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">
                          <button
                            onClick={() => requestSort("bloodTypes")}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                          >
                            <Droplet className="w-4 h-4 text-red-500" />
                            Blood Types
                            <SortIcon columnName="bloodTypes" />
                          </button>
                        </th>
                        {userLocation && (
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
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredAndSortedHospitals.length > 0 ? (
                          filteredAndSortedHospitals.map((hospital, index) => (
                            <motion.tr
                              key={hospital.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleHospitalSelect(hospital)}
                              className={`
                                border-t border-gray-100 
                                hover:bg-red-50 cursor-pointer 
                                transition-colors duration-200
                                ${selectedHospital?.id === hospital.id ? "bg-red-50" : ""}
                              `}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                    {hospital.urgent ? (
                                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    )}
                                  </motion.div>
                                  <span className="text-sm text-gray-900">{hospital.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{hospital.address || hospital.location}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{hospital.phone}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{hospital.hours}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {(hospital.bloodTypesAvailable || hospital.bloodTypes?.split(", ") || []).map((type, i) => (
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
                              {userLocation && (
                                <td className="py-4 px-4">
                                  {(() => {
                                    const distanceInfo = getHospitalDistance(hospital.id)
                                    return distanceInfo ? (
                                      <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex flex-col">
                                          <span className="text-sm text-gray-900 font-medium">
                                            {distanceInfo?.distance?.text || hospital.distanceText || `${hospital.calculatedDistance?.toFixed(1)} km`}
                                          </span>
                                          {distanceInfo.duration && (
                                            <span className="text-xs text-gray-500">
                                              {distanceInfo.duration.text}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : distanceLoading ? (
                                      <div className="flex items-center gap-2">
                                        <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                                        <span className="text-xs text-gray-500">Calculating...</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">N/A</span>
                                    )
                                  })()}
                                </td>
                              )}
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={userLocation ? "6" : "5"}>
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
