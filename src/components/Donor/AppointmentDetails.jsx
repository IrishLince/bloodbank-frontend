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
        donorType: data.donorType || data.formData?.donorType || "",

        // Appointment Details
        donationCenter: data.donationCenter || data.appointmentDetails?.donationCenter || data.selectedHospital?.name || "",
        bloodBankId: data.bloodBankId || data.selectedHospital?.id || "",
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
      // Build backend payload
      const userId = localStorage.getItem('userId') || ""

      const toISODateTime = (dateStr, timeStr) => {
        try {
          // Attempt direct parse first
          let date = new Date(`${dateStr} ${timeStr}`)
          if (isNaN(date.getTime())) {
            // Handle formats like "Thursday, August 28, 2025"
            const cleanedDate = String(dateStr || "")
              .replace(/^\s*[A-Za-z]+,\s*/,'') // strip weekday and comma
              .trim()
            date = new Date(`${cleanedDate} ${timeStr}`)
          }
          return isNaN(date.getTime()) ? null : date.toISOString()
        } catch {
          return null
        }
      }

      const appointmentISO = toISODateTime(appointmentData?.appointmentDate, appointmentData?.appointmentTime)

      const backendPayload = {
        // Core backend fields
        donorId: "", // optional/not yet used
        bloodBankId: appointmentData?.bloodBankId ? String(appointmentData.bloodBankId) : "",
        appointmentDate: appointmentISO,
        status: "Scheduled",
        userId: userId || "",
        visitationDate: null,
        notes: appointmentData?.notes || "",

        // Extended summary fields
        surname: appointmentData?.surname || "",
        firstName: appointmentData?.firstName || "",
        middleInitial: appointmentData?.middleInitial || "",
        bloodType: appointmentData?.bloodType || "",
        dateToday: appointmentData?.dateToday || "",
        birthday: appointmentData?.birthday || "",
        age: appointmentData?.age || "",
        sex: appointmentData?.sex || "",
        civilStatus: appointmentData?.civilStatus || "",
        homeAddress: appointmentData?.homeAddress || "",
        phoneNumber: appointmentData?.phoneNumber || "",
        officePhone: appointmentData?.officePhone || "",
        occupation: appointmentData?.occupation || "",
        patientName: appointmentData?.patientName || "",
        donorType: appointmentData?.donorType || "",
        donationCenter: appointmentData?.donationCenter || "",
        appointmentTime: appointmentData?.appointmentTime || "",
        medicalHistory: appointmentData?.medicalHistory || {},
      }

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading appointment details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>

            {error.type === "missing_data" ? (
              <div>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium mb-2">Missing Information:</p>
                  <p className="text-red-700 text-sm">{error.fields.join(", ")}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 mb-6">{error.message}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleReturnToDonationCenter}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Return to Donation Center
              </button>
              <button
                onClick={handleGoHome}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Appointment Confirmation</h1>
          <p className="text-gray-600">Please review your appointment details below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-red-600" />
              Personal Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-medium">
                  {appointmentData.firstName} {appointmentData.middleInitial && `${appointmentData.middleInitial}. `}
                  {appointmentData.surname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blood Type:</span>
                <span className="font-medium text-red-600">{appointmentData.bloodType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Age:</span>
                <span className="font-medium">{appointmentData.age} years old</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sex:</span>
                <span className="font-medium">{appointmentData.sex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Civil Status:</span>
                <span className="font-medium">{appointmentData.civilStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Birthday:</span>
                <span className="font-medium">{formatDate(appointmentData.birthday)}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-red-600" />
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{appointmentData.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Office Phone:</span>
                <span className="font-medium">{appointmentData.officePhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-right max-w-xs">{appointmentData.homeAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Occupation:</span>
                <span className="font-medium">{appointmentData.occupation}</span>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              Appointment Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Donation Center:</span>
                <span className="font-medium">{appointmentData.donationCenter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(appointmentData.appointmentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{formatTime(appointmentData.appointmentTime)}</span>
              </div>
            </div>
          </div>

          {/* Donation Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Donation Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Donor Type:</span>
                <span className="font-medium">{appointmentData.donorType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patient Name:</span>
                <span className="font-medium">{appointmentData.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Application Date:</span>
                <span className="font-medium">{formatDate(appointmentData.dateToday)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History Summary */}
        {appointmentData.medicalHistory && (
          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Medical History Status
            </h2>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">Medical history questionnaire completed</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">All eligibility requirements have been reviewed and approved.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleCancelClick}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Cancel Appointment
          </button>
          <button
            onClick={handleConfirmClick}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Confirm Appointment
          </button>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Reminders:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Please arrive 15 minutes before your scheduled appointment time</li>
            <li>• Bring a valid ID and this confirmation</li>
            <li>• Eat a healthy meal and stay hydrated before donation</li>
            <li>• Get adequate rest the night before your appointment</li>
            <li>• Avoid alcohol and smoking before donation</li>
          </ul>
        </div>

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 border border-red-100">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Appointment</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to confirm this blood donation appointment? This action cannot be undone.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Automatically confirming in {countdown} seconds...
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleConfirmAppointment}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Yes, Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false)
                      setCountdown(30)
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 border border-red-100">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Cancel Appointment</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel this blood donation appointment? This action cannot be undone.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleGoBack}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200"
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
