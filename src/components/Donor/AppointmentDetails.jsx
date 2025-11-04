"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Calendar, User, Phone, AlertTriangle, CheckCircle, Heart, X } from "lucide-react"
import { fetchWithAuth } from "../../utils/api"

const AppointmentDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [appointmentData, setAppointmentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    // Try to get data from multiple sources
    let data = null

    // First, try from navigation state
    if (location.state) {
      data = location.state
    }

    // If no data from navigation, try localStorage
    if (!data) {
      try {
        const storedData = localStorage.getItem("appointmentData")
        if (storedData) {
          data = JSON.parse(storedData)
        }
      } catch (err) {
        // Error handled by setting error state
      }
    }

    if (data) {
      // Normalize the data structure to handle different formats
      const normalizedData = {
        // Personal Information
        surname: data.surname || data.formData?.surname || "",
        firstName: data.firstName || data.formData?.firstName || "",
        middleInitial: data.middleInitial || data.formData?.middleInitial || "",
        bloodType: data.bloodType || data.formData?.bloodType || "",
        dateToday: data.dateToday || data.formData?.date || data.date || "",
        birthday: data.birthday || data.formData?.birthday || "",
        age: data.age || data.formData?.age || "",
        sex: data.sex || data.formData?.sex || "",
        civilStatus: data.civilStatus || data.formData?.civilStatus || "",

        // Contact Information
        homeAddress: data.homeAddress || data.formData?.homeAddress || "",
        phoneNumber: data.phoneNumber || data.formData?.phoneNumber || "",
        officePhone: data.officePhone || data.formData?.officePhone || "N/A",

        // Additional Information
        occupation: data.occupation || data.formData?.occupation || "",
        patientName: data.patientName || data.formData?.patientName || "",

        // Appointment Details
        donationCenter: data.donationCenter || data.appointmentDetails?.donationCenter || data.selectedHospital?.name || data.selectedHospital?.bloodBankName || "",
        bloodBankId: data.bloodBankId || data.selectedHospital?.id || data.selectedHospital?.bloodBankId || "",
        appointmentDate: data.appointmentDate || data.appointmentDetails?.appointmentDate || "",
        appointmentTime: data.appointmentTime || data.appointmentDetails?.timeSlot || "",
        notes: data.notes || data.appointmentDetails?.notes || "",

        // Medical History
        medicalHistory: data.medicalHistory || {},
      }

      // Validate required fields
      const requiredFields = [
        "surname",
      ]

      const missingFields = requiredFields.filter((field) => !normalizedData[field])

      if (missingFields.length > 0) {
        setError({
          type: "missing_data",
          message: "Please complete the following information:",
          details: missingFields.join(", ")
        })
        return
      } else {
        setAppointmentData(normalizedData)
      }
    } else {
      setError({
        type: "no_data",
        message: "No appointment data found. Please start the eligibility check process again.",
        details: ""
      })
    }

    setLoading(false)
  }, [location.state])

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (err) {
      return dateString
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return "Not specified"
    try {
      const [hours, minutes] = timeString.split(":")
      const date = new Date()
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch (err) {
      return timeString
    }
  }

  const handleConfirmAppointment = async () => {
    try {
      // Get user ID from localStorage (consistent with existing app auth system)
      let userId = localStorage.getItem('userId') || ""
      
      // Fallback: try to get from userData object if userId is not available
      if (!userId) {
        try {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}')
          userId = userData.id || ""
        } catch (e) {
          // Ignore parsing errors
        }
      }

      const toISODateTime = (dateStr, timeStr) => {
        try {
          console.log('🕐 APPOINTMENT DATE DEBUG:', {
            dateStr: dateStr,
            timeStr: timeStr,
            type: typeof dateStr
          })
          
          let date
          
          // Handle Date object
          if (dateStr instanceof Date) {
            // Create a new date with the same date but with time from timeStr
            const dateOnly = new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate())
            
            // Parse time string (e.g., "9:00 AM" or "14:30")
            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
            if (timeMatch) {
              let hours = parseInt(timeMatch[1])
              const minutes = parseInt(timeMatch[2])
              const ampm = timeMatch[3]
              
              // Convert to 24-hour format if AM/PM is specified
              if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours !== 12) {
                  hours += 12
                } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
                  hours = 0
                }
              }
              
              date = new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), hours, minutes)
            } else {
              // Fallback: use the original date
              date = dateStr
            }
          } else {
            // Handle string date
            date = new Date(`${dateStr} ${timeStr}`)
            if (isNaN(date.getTime())) {
              // Handle formats like "Thursday, August 28, 2025"
              const cleanedDate = String(dateStr || "")
                .replace(/^\s*[A-Za-z]+,\s*/,'') // strip weekday and comma
                .trim()
              date = new Date(`${cleanedDate} ${timeStr}`)
            }
          }
          
          const result = isNaN(date.getTime()) ? null : date.toISOString()
          console.log('🕐 PARSED RESULT:', result)
          return result
        } catch (error) {
          console.error('🕐 DATE PARSING ERROR:', error)
          return null
        }
      }

      const appointmentISO = toISODateTime(appointmentData?.appointmentDate, appointmentData?.appointmentTime)

      // Debug logging to verify IDs
      console.log('🩸 Appointment Debug Info:', {
        userId: userId,
        appointmentData_bloodBankId: appointmentData?.bloodBankId,
        selectedHospital_id: appointmentData?.selectedHospital?.id,
        donationCenter: appointmentData?.donationCenter,
        appointmentISO: appointmentISO
      });

      const backendPayload = {
        // Core backend fields
        donorId: userId, // Use the current user's ID as donor_id
        bloodBankId: appointmentData?.bloodBankId ? String(appointmentData.bloodBankId) : "",
        // appointmentDate: appointmentISO, // Temporarily commented out to test
        status: "Scheduled",
        userId: userId || "",
        visitationDate: appointmentISO, // Try using visitationDate instead
        notes: appointmentData?.notes || "",

        // Extended summary fields
        surname: appointmentData?.surname || "",
        firstName: appointmentData?.firstName || "",
        middleInitial: appointmentData?.middleInitial || "",
        bloodType: appointmentData?.bloodType || "",
        dateToday: appointmentISO || appointmentData?.dateToday || "",
        birthday: appointmentData?.birthday || "",
        age: appointmentData?.age || "",
        sex: appointmentData?.sex || "",
        civilStatus: appointmentData?.civilStatus || "",
        homeAddress: appointmentData?.homeAddress || "",
        phoneNumber: appointmentData?.phoneNumber || "",
        officePhone: appointmentData?.officePhone || "",
        occupation: appointmentData?.occupation || "",
        patientName: appointmentData?.patientName || "",
        donationCenter: appointmentData?.donationCenter || "",
        appointmentTime: appointmentData?.appointmentTime || "",
        medicalHistory: appointmentData?.medicalHistory || {},
      }

      console.log('📤 BACKEND PAYLOAD:', backendPayload)
      console.log('📅 APPOINTMENT DATE SAVED:', {
        appointmentDate: backendPayload.appointmentDate,
        appointmentTime: backendPayload.appointmentTime,
        status: backendPayload.status
      })

      // Call backend API to persist in MongoDB
      try {
        const res = await fetchWithAuth('/appointment', {
          method: 'POST',
          body: JSON.stringify(backendPayload),
        })
        if (!res.ok) {
          // Error is handled by proceeding with local save
        }
      } catch (apiErr) {
        // Error is handled by proceeding with local save
      }

      // Create appointment record with status for local storage and UI
      const appointmentRecord = {
        ...appointmentData,
        status: "Scheduled",
        confirmationDate: new Date().toISOString(),
        appointmentId: generateAppointmentId(),
      }

      // Get existing appointments from localStorage or initialize empty array
      const existingAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]')
      const updatedAppointments = [...existingAppointments, appointmentRecord]
      localStorage.setItem('userAppointments', JSON.stringify(updatedAppointments))

      // Navigate to list of appointments
      navigate("/list-of-appointments", {
        state: {
          message: "Appointment scheduled successfully!",
          newAppointment: appointmentRecord,
        },
      })
    } catch (error) {
      // Error is handled by the UI state
    }
  }

  // Generate unique appointment ID
  const generateAppointmentId = () => {
    const timestamp = new Date().getTime()
    const random = Math.floor(Math.random() * 1000)
    return `APT-${timestamp}-${random}`
  }

  const handleGoBack = () => {
    navigate("/donation-center")
  }

  const handleReturnToDonationCenter = () => {
    navigate("/donation-center")
  }

  const handleGoHome = () => {
    navigate("/")
  }

  const handleConfirmClick = () => {
    setShowConfirmModal(true)
    setCountdown(30)
  }

  const handleCancelClick = () => {
    setShowCancelModal(true)
  }

  useEffect(() => {
    let timer
    if (showConfirmModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      handleConfirmAppointment()
    }
    return () => clearInterval(timer)
  }, [showConfirmModal, countdown])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-600"></div>
            <span className="text-base sm:text-lg text-gray-600 text-center">Loading appointment details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Oops!</h2>

            {error.type === "missing_data" ? (
              <div>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{error.message}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-6">
                  <p className="text-red-800 font-medium mb-2 text-sm sm:text-base">Missing Information:</p>
                  <p className="text-red-700 text-xs sm:text-sm">{error.fields?.join(", ")}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 mb-6">{error.message}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleReturnToDonationCenter}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
              >
                Return to Donation Center
              </button>
              <button
                onClick={handleGoHome}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Appointment Confirmation</h1>
          <p className="text-sm sm:text-base text-gray-600">Please review your appointment details below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="text-sm sm:text-base">Personal Information</span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Full Name:</span>
                <span className="font-medium text-sm sm:text-base text-right">
                  {appointmentData.firstName} {appointmentData.middleInitial && `${appointmentData.middleInitial}. `}
                  {appointmentData.surname}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Blood Type:</span>
                <span className="font-medium text-red-600 text-sm sm:text-base">{appointmentData.bloodType}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Age:</span>
                <span className="font-medium text-sm sm:text-base">{appointmentData.age} years old</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Sex:</span>
                <span className="font-medium text-sm sm:text-base">{appointmentData.sex}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Civil Status:</span>
                <span className="font-medium text-sm sm:text-base">{appointmentData.civilStatus}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Birthday:</span>
                <span className="font-medium text-sm sm:text-base text-right">{formatDate(appointmentData.birthday)}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="text-sm sm:text-base">Contact Information</span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Phone:</span>
                <span className="font-medium text-sm sm:text-base">{appointmentData.phoneNumber}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Office Phone:</span>
                <span className="font-medium text-sm sm:text-base">{appointmentData.officePhone}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Address:</span>
                <span className="font-medium text-sm sm:text-base text-right break-words">{appointmentData.homeAddress}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Occupation:</span>
                <span className="font-medium text-sm sm:text-base text-right">{appointmentData.occupation}</span>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-red-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-red-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="text-sm sm:text-base">Appointment Details</span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Donation Center:</span>
                <span className="font-medium text-sm sm:text-base text-right break-words">{appointmentData.donationCenter}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Date:</span>
                <span className="font-medium text-sm sm:text-base text-right">{formatDate(appointmentData.appointmentDate)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Time:</span>
                <span className="font-medium text-sm sm:text-base">{formatTime(appointmentData.appointmentTime)}</span>
              </div>
            </div>
          </div>

          {/* Donation Information */}
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="text-sm sm:text-base">Donation Information</span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Patient Name:</span>
                <span className="font-medium text-sm sm:text-base text-right break-words">{appointmentData.patientName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">Application Date:</span>
                <span className="font-medium text-sm sm:text-base text-right">{formatDate(appointmentData.dateToday)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History Summary */}
        {appointmentData.medicalHistory && (
          <div className="mt-6 sm:mt-8 bg-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span className="text-sm sm:text-base">Medical History Status</span>
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <span className="text-green-700 font-medium text-sm sm:text-base">Medical history questionnaire completed</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">All eligibility requirements have been reviewed and approved.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={handleCancelClick}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
          >
            Cancel Appointment
          </button>
          <button
            onClick={handleConfirmClick}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-sm sm:text-base"
          >
            Confirm Appointment
          </button>
        </div>

        {/* Important Notes */}
        <div className="mt-6 sm:mt-8 bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <h3 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Important Reminders:</h3>
          <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
            <li>• Please arrive 15 minutes before your scheduled appointment time</li>
            <li>• Bring a valid ID and this confirmation</li>
            <li>• Eat a healthy meal and stay hydrated before donation</li>
            <li>• Get adequate rest the night before your appointment</li>
            <li>• Avoid alcohol and smoking before donation</li>
          </ul>
        </div>

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full border border-red-100">
              <div className="text-center">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Confirm Appointment</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Are you sure you want to confirm this blood donation appointment? This action cannot be undone.
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                  Automatically confirming in {countdown} seconds...
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleConfirmAppointment}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
                  >
                    Yes, Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false)
                      setCountdown(30)
                    }}
                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full border border-red-100">
              <div className="text-center">
                <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Cancel Appointment</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Are you sure you want to cancel this blood donation appointment? This action cannot be undone.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleGoBack}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentDetails
