"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckCircle, ChevronLeft, Calendar, Clock, Droplet, Building, Package, Info, AlertTriangle } from "lucide-react"
import Header from "../Header"

export default function SuccessfulRequest() {
  const location = useLocation()
  const navigate = useNavigate()
  const [requestData, setRequestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      // Check if we have data from the previous page
      if (location.state) {
        // Validate required data
        const { bloodRequests, requestDate, dateNeeded, bloodSource } = location.state
        
        if (!bloodRequests || !requestDate || !dateNeeded || !bloodSource) {
          throw new Error('Missing required request data')
        }
        
        // Validate blood requests array
        if (!Array.isArray(bloodRequests) || bloodRequests.length === 0) {
          throw new Error('Invalid blood requests data')
        }
        
        // Filter and validate blood requests (only check ones with data)
        const validBloodRequests = bloodRequests.filter(request => 
          request.bloodType && request.unitsRequested
        )
        
        const validRequests = validBloodRequests.length > 0 && validBloodRequests.every(request => 
          request.bloodType && request.unitsRequested && 
          !isNaN(request.unitsRequested) && Number(request.unitsRequested) > 0
        )
        
        if (!validRequests) {
          throw new Error('Invalid blood request details')
        }
        
        setRequestData(location.state)
        setLoading(false)
      } else {
        // If no data, redirect back to the request page
        navigate("/hospital")
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      // Redirect after showing error
      setTimeout(() => {
        navigate("/hospital")
      }, 3000)
    }
  }, [location, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-[#FFF5F5]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C91C1C] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-[#FFF5F5]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Request</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          <Link to="/hospital" className="inline-block mt-4">
            <button className="bg-[#C91C1C] hover:bg-[#A81A1A] text-white py-2 px-6 rounded-lg font-medium transition-colors">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Format dates for display with error handling
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Invalid Date'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      return date.toLocaleDateString("en-US", options)
    } catch (err) {
      return 'Invalid Date'
    }
  }

  // Generate a random request ID with error handling
  const generateRequestId = () => {
    try {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
      return `REQ-${timestamp}-${random}`
    } catch (err) {
      return `REQ-${Date.now()}`
    }
  }
  
  const requestId = generateRequestId()

  return (
    <div className="bg-gradient-to-b from-white to-[#FFF5F5] flex flex-col min-h-screen">
      <Header />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-4">
        

        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-[#FFD6D6] max-w-5xl mx-auto transform hover:scale-[1.01] transition-all duration-300">
          <div className="bg-gradient-to-r from-[#C91C1C] to-[#A81A1A] text-white py-6 px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Request Summary</h2>
                <p className="text-sm opacity-90 mt-1 font-medium">Request ID: {requestId}</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-4 text-center">
              <h1 className="text-xl font-bold text-white mb-2">Request Submitted Successfully!</h1>
              <p className="text-sm text-white opacity-90">
                Your blood request has been submitted and is being processed. You will receive updates on your dashboard.
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center p-4 bg-gradient-to-r from-[#FFF5F5] to-[#FFEFEF] rounded-lg border border-red-100 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C91C1C] to-[#A81A1A] rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Source</p>
                  <p className="font-bold text-sm text-gray-800">{requestData?.bloodSource || 'Unknown Source'}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request Date</p>
                  <p className="font-bold text-sm text-gray-800">{formatDate(requestData?.requestDate)}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Needed</p>
                  <p className="font-bold text-sm text-gray-800">{formatDate(requestData?.dateNeeded)}</p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {requestData?.notes && (
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <Info className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800 mb-1">Additional Notes</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{requestData.notes}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-[#C91C1C] to-[#A81A1A] rounded-full mr-2"></div>
                Blood Units Requested
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requestData?.bloodRequests && Array.isArray(requestData.bloodRequests) ? (
                    // Multiple blood requests
                    requestData.bloodRequests
                      .filter(request => request?.bloodType && request?.unitsRequested)
                      .map((request, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100 shadow-sm">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                              <Droplet className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-800">{request.bloodType}</p>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Type</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                              <Package className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-800">{request.unitsRequested} units</p>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : requestData?.bloodType && requestData?.unitsRequested ? (
                    // Legacy single blood request
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                          <Droplet className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-800">{requestData.bloodType}</p>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Type</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-800">{requestData.unitsRequested} units</p>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg shadow-sm">
                      <div className="flex items-center text-red-700">
                        <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center mr-3">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-bold text-sm">No valid blood requests found</span>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-blue-800 shadow-sm">
                <p className="flex items-start">
                  <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed">
                    You will receive a confirmation email shortly. Please check your dashboard for updates on your request status.
                  </span>
                </p>
              </div>
              
              <div className="sm:w-auto">
                <Link to="/hospital">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-[#C91C1C] to-[#A81A1A] hover:from-[#A81A1A] hover:to-[#8B1A1A] text-white py-3 px-8 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                    RETURN TO DASHBOARD
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
