"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronLeft, CheckCircle, AlertCircle, Info, Plus, Trash2, Clock } from "lucide-react"
import Header from "../Header"
import LogoSignup from "../../assets/LogoSignup.png"

export default function NewRequest() {
  const [requestDate, setRequestDate] = useState("")
  const [dateNeeded, setDateNeeded] = useState("")
  const [bloodRequests, setBloodRequests] = useState([{ id: 1, bloodType: "", unitsRequested: "" }])
  const [formError, setFormError] = useState(false)
  const [errors, setErrors] = useState({})
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [selectedAdminId, setSelectedAdminId] = useState("")
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [countdownActive, setCountdownActive] = useState(false)
  const navigate = useNavigate()

  const bloodTypeLimits = {
  "O+": 15,
  "A+": 10,
  "B+": 10,
  "AB+": 7, // upper bound of 5–7
};

  // Mock data for blood admin centers
  const bloodAdminCenters = [
    {
      id: "admin1",
      name: "RedSource Central Blood Bank",
      location: "Downtown Medical District",
      inventory: [
        { type: "A+", available: 25 },
        { type: "A-", available: 12 },
        { type: "B+", available: 18 },
        { type: "B-", available: 8 },
        { type: "AB+", available: 5 },
        { type: "AB-", available: 3 },
        { type: "O+", available: 30 },
        { type: "O-", available: 15 },
      ],
    },
    {
      id: "admin2",
      name: "City Regional Blood Center",
      location: "North Hospital Complex",
      inventory: [
        { type: "A+", available: 15 },
        { type: "A-", available: 7 },
        { type: "B+", available: 10 },
        { type: "B-", available: 4 },
        { type: "AB+", available: 2 },
        { type: "AB-", available: 1 },
        { type: "O+", available: 20 },
        { type: "O-", available: 8 },
      ],
    },
    {
      id: "admin3",
      name: "Metro Blood Network",
      location: "East Medical Plaza",
      inventory: [
        { type: "A+", available: 18 },
        { type: "A-", available: 9 },
        { type: "B+", available: 12 },
        { type: "B-", available: 5 },
        { type: "AB+", available: 3 },
        { type: "AB-", available: 0 },
        { type: "O+", available: 22 },
        { type: "O-", available: 6 },
      ],
    },
  ]

  // Get all available blood types across all centers
  const allAvailableBloodTypes = bloodAdminCenters.reduce((types, center) => {
    center.inventory.forEach((item) => {
      if (item.available > 0 && !types.includes(item.type)) {
        types.push(item.type)
      }
    })
    return types
  }, [])

  // Get total available units for a specific blood type
  const getTotalAvailable = (type) => {
    return bloodAdminCenters.reduce((total, center) => {
      const inventory = center.inventory.find((item) => item.type === type)
      return total + (inventory?.available || 0)
    }, 0)
  }

  const handleRequestDateChange = (e) => {
    const selectedDate = e.target.value
    // Prevent selecting past dates
    if (selectedDate >= today) {
      setRequestDate(selectedDate)
      setErrors({ ...errors, requestDate: "" })
    } else {
      // Reset to empty if trying to select past date
      e.target.value = ''
      setRequestDate('')
    }
  }

  const handleDateNeededChange = (e) => {
    const selectedDate = e.target.value
    // Prevent selecting past dates
    if (selectedDate >= today) {
      setDateNeeded(selectedDate)
      setErrors({ ...errors, dateNeeded: "" })
    } else {
      // Reset to empty if trying to select past date
      e.target.value = ''
      setDateNeeded('')
    }
  }

  const handleBloodTypeChange = (index, e) => {
    const newBloodRequests = [...bloodRequests]
    newBloodRequests[index].bloodType = e.target.value

    // Reset units requested if changing blood type
    newBloodRequests[index].unitsRequested = ""

    setBloodRequests(newBloodRequests)

    // Clear error for this specific blood request
    const newErrors = { ...errors }
    delete newErrors[`bloodType_${index}`]
    delete newErrors[`unitsRequested_${index}`]
    setErrors(newErrors)
  }

  const handleUnitsRequestedChange = (index, e) => {
    const value = Math.max(0, Number(e.target.value))
    const newBloodRequests = [...bloodRequests]
    newBloodRequests[index].unitsRequested = value
    setBloodRequests(newBloodRequests)

    // Clear error for this specific blood request
    const newErrors = { ...errors }
    delete newErrors[`unitsRequested_${index}`]

    // Validate against available units
    const bloodType = newBloodRequests[index].bloodType
    if (bloodType && value > getTotalAvailable(bloodType)) {
      newErrors[`unitsRequested_${index}`] = `Only ${getTotalAvailable(bloodType)} units available`
      setErrors(newErrors)
    }
  }

  const addBloodRequest = () => {
    const newId = bloodRequests.length > 0 ? Math.max(...bloodRequests.map((req) => req.id)) + 1 : 1

    setBloodRequests([...bloodRequests, { id: newId, bloodType: "", unitsRequested: "" }])
  }

  const removeBloodRequest = (index) => {
    if (bloodRequests.length === 1) {
      // Don't remove the last blood request, just reset it
      setBloodRequests([{ id: 1, bloodType: "", unitsRequested: "" }])
      return
    }

    const newBloodRequests = [...bloodRequests]
    newBloodRequests.splice(index, 1)
    setBloodRequests(newBloodRequests)

    // Clear errors for this specific blood request
    const newErrors = { ...errors }
    delete newErrors[`bloodType_${index}`]
    delete newErrors[`unitsRequested_${index}`]
    setErrors(newErrors)
  }

  const handleAdminSelect = (adminId) => {
    setSelectedAdminId(adminId)
    setShowAvailabilityModal(false)

    // Reset blood requests when changing blood center
    setBloodRequests([{ id: 1, bloodType: "", unitsRequested: "" }])
  }

  useEffect(() => {
    let timer
    if (countdownActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prevCount => prevCount - 1)
      }, 1000)
    } else if (countdownActive && countdown === 0) {
      // Cancel request when timer reaches 0
      resetConfirmation()
    }
    
    return () => clearTimeout(timer)
  }, [countdown, countdownActive])

  const resetConfirmation = () => {
    setShowConfirmationModal(false)
    setCountdown(30)
    setCountdownActive(false)
  }

  const handleConfirmSubmit = () => {
    resetConfirmation()
    navigate("/successful-request", {
      state: {
        bloodRequests,
        requestDate,
        dateNeeded,
        bloodSource: bloodAdminCenters.find((admin) => admin.id === selectedAdminId)?.name,
      },
    })
  }

 const handleSubmit = () => {
  const newErrors = {}

  // Validate each blood request
  bloodRequests.forEach((request, index) => {
    if (!request.bloodType) newErrors[`bloodType_${index}`] = "Blood type is required"
    if (!request.unitsRequested) newErrors[`unitsRequested_${index}`] = "Units requested is required"

    // Check if requested units exceed available
    if (request.bloodType && request.unitsRequested > getTotalAvailable(request.bloodType)) {
      newErrors[`unitsRequested_${index}`] = `Only ${getTotalAvailable(request.bloodType)} units available`
    }

    // Enforce maximum hospital request limits per blood type
    const bloodTypeLimits = {
      "O+": 15,
      "A+": 10,
      "B+": 10,
      "AB+": 7,
    }
    const limit = bloodTypeLimits[request.bloodType]
    if (limit && Number(request.unitsRequested) > limit) {
      newErrors[`unitsRequested_${index}`] = `Maximum allowed for ${request.bloodType} is ${limit} units`
    }
  })

  // Validate request timeline fields
  if (!requestDate) newErrors.requestDate = "Request date is required"
  if (!dateNeeded) newErrors.dateNeeded = "Date needed is required"
  if (!selectedAdminId) newErrors.bloodSource = "Blood source is required"

  // Check for duplicate blood types
  const bloodTypes = bloodRequests.map((req) => req.bloodType).filter((type) => type !== "")
  const uniqueBloodTypes = new Set(bloodTypes)
  if (bloodTypes.length !== uniqueBloodTypes.size) {
    newErrors.duplicateBloodTypes = "Duplicate blood types are not allowed. Please combine quantities instead."
  }

  // ⚠️ Reminder about expiration risk
  if (requestDate && dateNeeded) {
    const reqDate = new Date(requestDate)
    const needDate = new Date(dateNeeded)
    if (needDate.getTime() - reqDate.getTime() > 5 * 24 * 60 * 60 * 1000) {
      // more than 5 days apart (example threshold)
      newErrors.expiration = "⚠️ Reminder: Please consider blood expiration risk before requesting."
    }
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors)
    setFormError(true)
    return
  }

  setFormError(false)

  // Show confirmation modal instead of navigating directly
  setShowConfirmationModal(true)
  setCountdownActive(true)
}

  // Get the selected admin details
  const selectedAdmin = bloodAdminCenters.find((admin) => admin.id === selectedAdminId)

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <Header />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link to="/hospital" className="inline-flex">
            <button className="flex items-center text-red-600 hover:text-red-700 transition-all duration-200 text-sm font-medium bg-white hover:bg-red-50 rounded-xl py-3 px-5 shadow-sm hover:shadow-md border border-red-100">
              <ChevronLeft className="mr-2 w-4 h-4" /> 
              Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8">
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-full p-4 inline-block mb-4">
              <Plus className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">New Blood Request</h1>
            <p className="text-gray-600 text-lg">Submit a new blood request for your hospital</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white shadow-2xl rounded-3xl border border-red-100 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
            <div className="flex items-center text-white">
              <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Request Details</h2>
                <p className="text-red-100">Please provide the following information</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              {/* Hospital Information Section */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  Hospital Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
                    <input
                      type="text"
                      className="w-full p-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      value="Riverside Community Medical Center"
                      readOnly
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Address</label>
                      <input
                        type="text"
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        value="456 River Ave., Townsville"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                      <input
                        type="text"
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        value="(555) 987-6543"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Blood Source Section */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  Blood Source
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Blood Center</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full p-4 border ${errors.bloodSource ? "border-red-500" : "border-gray-200"} rounded-xl cursor-pointer hover:border-red-500 transition-all shadow-sm bg-white font-medium`}
                      value={selectedAdmin ? selectedAdmin.name : "Choose Blood Center"}
                      onClick={() => setShowAvailabilityModal(true)}
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <ChevronLeft className="w-5 h-5 transform rotate-90 text-red-600" />
                    </div>
                    {errors.bloodSource && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.bloodSource}</p>}
                  </div>
                </div>
              </div>

              {/* Blood Requests Section */}
              <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <Plus className="w-4 h-4 text-red-600" />
                    </div>
                    Blood Requests
                  </h3>
                  <button
                    type="button"
                    onClick={addBloodRequest}
                    className="flex items-center text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl py-3 px-5 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    disabled={!selectedAdminId}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Blood Type
                  </button>
                </div>

                {errors.duplicateBloodTypes && (
                  <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm flex items-start mb-4">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="font-medium">{errors.duplicateBloodTypes}</div>
                  </div>
                )}

                <div className="space-y-4">
                  {bloodRequests.map((request, index) => (
                    <div
                      key={request.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <div className="bg-red-100 p-2 rounded-full mr-3">
                            <span className="text-red-600 font-bold text-sm">#{index + 1}</span>
                          </div>
                          Blood Request {index + 1}
                        </h4>
                        {bloodRequests.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBloodRequest(index)}
                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl p-2 transition-all hover:scale-105"
                            aria-label="Remove blood request"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                          <select
                            className={`w-full p-4 border ${errors[`bloodType_${index}`] ? "border-red-500" : "border-gray-200"} rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${!selectedAdminId ? "bg-gray-100 text-gray-500" : "bg-white text-gray-700"}`}
                            value={request.bloodType}
                            onChange={(e) => handleBloodTypeChange(index, e)}
                            disabled={!selectedAdminId}
                          >
                            <option value="">Select Blood Type</option>
                            {selectedAdmin
                              ? selectedAdmin.inventory
                                  .filter((item) => item.available > 0)
                                  .map((item) => (
                                    <option key={item.type} value={item.type}>
                                      {item.type} - {item.available} units available
                                    </option>
                                  ))
                              : allAvailableBloodTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type} - {getTotalAvailable(type)} units available
                                  </option>
                                ))}
                          </select>
                          {errors[`bloodType_${index}`] && (
                            <p className="text-red-500 text-sm mt-2 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors[`bloodType_${index}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Units Requested</label>
                          <div className="relative">
                            <input
                              type="number"
                              className={`w-full p-4 border ${errors[`unitsRequested_${index}`] ? "border-red-500" : "border-gray-200"} rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${!request.bloodType ? "bg-gray-100 text-gray-500" : "bg-white text-gray-700"}`}
                              value={request.unitsRequested}
                              onChange={(e) => handleUnitsRequestedChange(index, e)}
                              placeholder="Enter Units"
                              min="0"
                              disabled={!request.bloodType}
                            />
                            {request.bloodType && (
                              <div className="flex items-center text-sm text-blue-600 mt-2 bg-blue-50 p-3 rounded-lg">
                                <Info className="w-4 h-4 mr-2" />
                                Available: {getTotalAvailable(request.bloodType)} units
                              </div>
                            )}
                            {errors[`unitsRequested_${index}`] && (
                              <p className="text-red-500 text-sm mt-2 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors[`unitsRequested_${index}`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Fields Section */}
              <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  Request Timeline
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Request Date</label>
                    <input
                      type="date"
                      className={`w-full p-4 border ${errors.requestDate ? "border-red-500" : "border-gray-200"} rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                      value={requestDate}
                      onChange={handleRequestDateChange}
                      min={today}
                    />
                    {errors.requestDate && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.requestDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Needed</label>
                    <input
                      type="date"
                      className={`w-full p-4 border ${errors.dateNeeded ? "border-red-500" : "border-gray-200"} rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                      value={dateNeeded}
                      onChange={handleDateNeededChange}
                      min={today}
                    />
                    {errors.dateNeeded && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.dateNeeded}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {formError && Object.keys(errors).some((key) => !key.includes("_") && key !== "duplicateBloodTypes") && (
                <div className="mt-8 p-6 bg-red-100 border border-red-300 rounded-2xl text-red-700 flex items-start">
                  <AlertCircle className="w-6 h-6 mr-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-lg mb-2">Please correct the following errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(errors)
                        .filter(([key]) => !key.includes("_") && key !== "duplicateBloodTypes")
                        .map(([key, error], index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-10 text-center">
                <button
                  onClick={handleSubmit}
                  className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-5 px-12 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 flex items-center justify-center mx-auto"
                >
                  <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4 group-hover:bg-opacity-30 transition-all">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  Submit Blood Request
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Blood Source Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border-t-4 border-[#C91C1C]">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-[#C91C1C] flex items-center">
                  <span className="w-8 h-8 bg-[#C91C1C] text-white rounded-full flex items-center justify-center mr-2">
                    <Info className="w-4 h-4" />
                  </span>
                  Select Blood Source
                </h2>
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {bloodAdminCenters.map((admin) => (
                  <div
                    key={admin.id}
                    className={`p-5 border-2 rounded-xl cursor-pointer hover:border-[#C91C1C] transition-all ${
                      selectedAdminId === admin.id ? "bg-[#FFF5F5] border-[#C91C1C]" : "border-gray-200"
                    }`}
                    onClick={() => handleAdminSelect(admin.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-bold text-lg text-gray-800">{admin.name}</div>
                        <div className="text-gray-600 text-sm flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          {admin.location}
                        </div>
                      </div>
                      {selectedAdminId === admin.id && (
                        <div className="mt-2 sm:mt-0">
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center w-fit">
                            <CheckCircle className="w-3 h-3 mr-1" /> Selected
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {admin.inventory.map((item) => (
                        <div
                          key={item.type}
                          className={`p-3 rounded-lg text-center flex flex-col items-center ${
                            item.available > 0
                              ? "bg-green-50 text-green-800 border border-green-100"
                              : "bg-gray-50 text-gray-400 border border-gray-100"
                          }`}
                        >
                          <div className="text-lg font-bold">{item.type}</div>
                          <div className="text-sm mt-1">{item.available} units</div>
                          {item.available === 0 && <div className="text-xs mt-1 text-red-500">Unavailable</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="bg-[#C91C1C] hover:bg-[#A81A1A] text-white py-2 px-6 rounded-lg font-semibold transition-colors shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-0 max-w-lg w-full shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#C91C1C] to-[#8B0000] text-white p-5 text-center relative">
                <img src={LogoSignup} alt="RedSource Logo" className="h-20 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Confirm Blood Request</h2>
                <p className="text-white/80 text-sm mt-1">Please verify your submission</p>
                <button
                  onClick={resetConfirmation}
                  className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-5 text-center">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <p className="font-medium text-gray-800 text-lg mb-4">Are you sure you want to submit this blood request?</p>
                    
                    <div className="inline-flex items-center justify-center gap-3 bg-white py-2 px-4 rounded-lg border border-red-200 shadow-sm">
                      <div className="text-sm font-medium text-gray-700">Auto-cancel in:</div>
                      <div className="text-xl font-bold text-[#C91C1C] flex items-center">
                        <Clock className="w-5 h-5 mr-1.5 text-[#C91C1C]" />
                        <span>{countdown}</span>
                        <span className="text-sm ml-0.5">sec</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={resetConfirmation}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors border border-gray-200"
                    >
                      Cancel Request
                    </button>
                    <button
                      onClick={handleConfirmSubmit}
                      className="bg-[#C91C1C] hover:bg-[#A81A1A] text-white py-3 px-6 rounded-lg font-medium transition-colors shadow-md border border-[#C91C1C]"
                    >
                      Confirm Submission
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};