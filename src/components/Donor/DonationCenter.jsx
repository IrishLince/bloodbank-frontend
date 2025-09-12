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
} from "lucide-react"
import Header from "../Header"

const hospitals = [
  {
    id: 1,
    name: "St. Mary's General Hospital",
    location: "123 Maple St., Cityville",
    phone: "(555) 123-4567",
    hours: "10:00 AM - 4:00 PM",
    bloodTypes: "O+, A+, B-",
    urgent: true,
    availability: "High",
    distance: "2.5 km",
  },
  {
    id: 2,
    name: "Riverside Community Medical Center",
    location: "456 River Ave., Townsville",
    phone: "(555) 987-6543",
    hours: "8:30 AM - 5:30 PM",
    bloodTypes: "AB+, O-",
    urgent: false,
    availability: "Medium",
    distance: "4.1 km",
  },
  // Add more sample data here
]

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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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
          hospital.location.toLowerCase().includes(searchLower) ||
          hospital.bloodTypes.toLowerCase().includes(searchLower),
      )
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredData
  }, [hospitals, searchTerm, filters, sortConfig])

  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital)
    localStorage.setItem("eligibilityStep", "1")
    setTimeout(() => {
      navigate("/schedule", { state: { selectedHospital: hospital } })
    }, 300)
  }

  // Mobile card renderer with animations
  const renderMobileCard = (hospital) => (
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
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{hospital.location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{hospital.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{hospital.hours}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          {hospital.bloodTypes.split(", ").map((type, i) => (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
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
            {searchTerm && (
              <span className="ml-1">
                matching "<span className="text-red-600">{searchTerm}</span>"
              </span>
            )}
          </p>
        </motion.div>

        {/* Results Section */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader className="w-8 h-8 text-red-500" />
            </motion.div>
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
                                  <span className="text-sm text-gray-600">{hospital.location}</span>
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
                                  {hospital.bloodTypes.split(", ").map((type, i) => (
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
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5">
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
