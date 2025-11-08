import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle, X, ChevronRight, User, Phone, Heart, Mail, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchWithAuth } from '../../utils/api'

const ListOfAppointments = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const appointmentsPerPage = 5

  // Fetch appointments function (extracted for reuse)
  const fetchAppointments = async (isInitialLoad = false) => {
    const userId = localStorage.getItem('userId')
    // Try backend first
    if (userId) {
      try {
        const res = await fetchWithAuth(`/appointment/user/${userId}`)
        if (res.ok) {
          const body = await res.json()
          // Expecting a wrapper with data, but gracefully handle raw arrays
          const list = Array.isArray(body) ? body : (body?.data ?? [])
          console.log('📅 Appointments received:', list)
          if (list.length > 0) {
            console.log('📋 First appointment structure:', list[0])
            console.log('📅 Date fields available:', {
              appointmentDate: list[0].appointmentDate,
              visitationDate: list[0].visitationDate,
              dateToday: list[0].dateToday,
              date: list[0].date,
              createdAt: list[0].createdAt
            })
          }
          setAppointments(Array.isArray(list) ? list : [])
        } else {
          // Fallback to localStorage
          const stored = JSON.parse(localStorage.getItem('userAppointments') || '[]')
          console.log('📂 Using localStorage appointments:', stored)
          setAppointments(stored)
        }
      } catch (e) {
        console.error('❌ Error fetching appointments:', e)
        // Fallback to localStorage on error
        const stored = JSON.parse(localStorage.getItem('userAppointments') || '[]')
        setAppointments(stored)
      }
    } else {
      // No user, fallback to localStorage
      const stored = JSON.parse(localStorage.getItem('userAppointments') || '[]')
      setAppointments(stored)
    }
  }

  // Initial fetch on component mount
  useEffect(() => {
    fetchAppointments(true)

    // Show success message if navigated from confirmation
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      setShowSuccessMessage(true)

      // Hide message after 5 seconds
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments(false)
    }, 5000) // 5 seconds

    return () => clearInterval(intervalId)
  }, [])

  const handleShowDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (err) {
      return 'Invalid date'
    }
  }

  const formatDateShort = (dateString) => {
    if (!dateString) return 'No date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'No date'
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch (err) {
      return 'No date'
    }
  }

  // Get the best available date from appointment object
  const getAppointmentDate = (appointment) => {
    // Try multiple date sources in order of preference
    return appointment.appointmentDate || 
           appointment.visitationDate || 
           appointment.dateToday || 
           appointment.date ||
           appointment.createdAt
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (err) {
      return timeString
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-700' // Yellow for pending/scheduled
      case 'Completed':
        return 'bg-green-100 text-green-700'   // Green for completed
      case 'Cancelled':
        return 'bg-red-100 text-red-700'       // Red for cancelled
      default:
        return 'bg-gray-100 text-gray-700'     // Gray for unknown status
    }
  }

  // Details Modal Component
  const DetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-7xl w-full overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-red-600 p-4 sm:p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-lg sm:text-2xl font-bold pr-8 sm:pr-0">Appointment Details</h2>
            {getAppointmentDate(appointment) && (
              <p className="text-white/80 mt-1 text-sm sm:text-base">
                Scheduled on {formatDate(getAppointmentDate(appointment))}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Appointment ID Section */}
            {appointment.id && (
              <div className="mb-4 sm:mb-6 bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm text-gray-600">Appointment ID:</span>
                  <span className="font-mono text-sm font-medium text-gray-800 break-all">{appointment.id}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Appointment Info */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 text-base sm:text-lg border-b border-gray-200 pb-2">
                  Appointment Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">
                        {formatDate(getAppointmentDate(appointment))}
                      </p>
                      {appointment.appointmentTime && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {formatTime(appointment.appointmentTime)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-700 text-sm">Donation Center</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                        {appointment.donationCenter}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${getStatusStyle(appointment.status)}`}>
                      {appointment.status || 'Scheduled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 text-base sm:text-lg border-b border-blue-200 pb-2">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Full Name:</span>
                    <span className="font-medium text-gray-800 text-sm break-words">
                      {appointment.firstName} {appointment.middleInitial && `${appointment.middleInitial}. `}{appointment.surname}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Blood Type:</span>
                    <span className="font-semibold text-red-600 text-sm">{appointment.bloodType}</span>
                  </div>
                  {appointment.age && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Age:</span>
                      <span className="font-medium text-gray-800 text-sm">{appointment.age} years old</span>
                    </div>
                  )}
                  {appointment.birthday && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Birthday:</span>
                      <span className="font-medium text-gray-800 text-sm break-words">
                        {formatDate(appointment.birthday)}
                      </span>
                    </div>
                  )}
                  {appointment.sex && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Sex:</span>
                      <span className="font-medium text-gray-800 text-sm">{appointment.sex}</span>
                    </div>
                  )}
                  {appointment.civilStatus && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Civil Status:</span>
                      <span className="font-medium text-gray-800 text-sm">{appointment.civilStatus}</span>
                    </div>
                  )}
                  {appointment.occupation && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Occupation:</span>
                      <span className="font-medium text-gray-800 text-sm break-words">{appointment.occupation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 bg-green-50 p-4 rounded-lg md:col-span-2 xl:col-span-1">
                <h3 className="font-semibold text-gray-800 text-base sm:text-lg border-b border-green-200 pb-2">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {appointment.phoneNumber && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Mobile Phone:</span>
                      <span className="font-medium text-gray-800 text-sm break-all">{appointment.phoneNumber}</span>
                    </div>
                  )}
                  {appointment.officePhone && appointment.officePhone !== 'N/A' && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Office Phone:</span>
                      <span className="font-medium text-gray-800 text-sm break-all">{appointment.officePhone}</span>
                    </div>
                  )}
                  {/* Email Display - Check if homeAddress contains email */}
                  {appointment.homeAddress && appointment.homeAddress.includes('@') && appointment.homeAddress.includes('.') && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Email:</span>
                      <span className="font-medium text-gray-800 text-sm break-all">{appointment.homeAddress}</span>
                    </div>
                  )}
                  {/* Address Display - Only show if homeAddress doesn't look like email */}
                  {appointment.homeAddress && !(appointment.homeAddress.includes('@') && appointment.homeAddress.includes('.')) && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Address:</span>
                      <span className="font-medium text-gray-800 text-sm break-words">{appointment.homeAddress}</span>
                    </div>
                  )}
                  {appointment.patientName && appointment.patientName !== appointment.firstName + ' ' + appointment.surname && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Patient Name:</span>
                      <span className="font-medium text-gray-800 text-sm break-words">{appointment.patientName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {appointment.notes && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Additional Notes:</h3>
                <p className="text-sm text-blue-700">{appointment.notes}</p>
              </div>
            )}

            {/* Important Reminders */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Important Reminders:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Please arrive 15 minutes before your scheduled appointment time</li>
                <li>• Bring a valid ID and this confirmation</li>
                <li>• Eat a healthy meal and stay hydrated before donation</li>
                <li>• Get adequate rest the night before your appointment</li>
                <li>• Avoid alcohol and smoking before donation</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-sm"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-green-800 text-sm sm:text-base">Success!</h3>
                <p className="text-green-700 text-sm mt-1 break-words">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                My Appointments
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your blood donation appointments
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs sm:text-sm text-gray-500 block">Total Appointments</span>
                <span className="text-lg sm:text-xl font-bold text-red-600">{appointments.length}</span>
              </div>
              {appointments.length > 0 && (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
              )}
            </div>
          </div>

          {appointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No appointments yet</h3>
              <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Your blood donation appointments will appear here once you schedule them. 
                Start by finding a donation center near you.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => navigate('/donation-center')}
                  className="
                    inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white 
                    rounded-lg hover:bg-red-700 transition-colors font-medium
                    shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                  "
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Appointment
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="space-y-4">
                {appointments
                  .slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage)
                  .map((appointment) => (
                <motion.div
                  key={appointment.id || appointment.appointmentId || appointment._id || `${appointment.appointmentDate}-${appointment.bloodBankId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-red-200 transition-all duration-200 bg-white group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Main content */}
                    <div className="flex-1 space-y-3">
                      {/* Date and time row */}
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                        <div className="flex items-center gap-2 text-gray-800">
                          <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <span className="font-semibold text-sm sm:text-base">
                            {formatDateShort(getAppointmentDate(appointment))}
                          </span>
                        </div>
                        {appointment.appointmentTime && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">{formatTime(appointment.appointmentTime)}</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base break-words leading-relaxed">
                          {appointment.donationCenter}
                        </span>
                      </div>

                      {/* Additional info on mobile */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 sm:hidden">
                        {appointment.bloodType && (
                          <span className="bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium">
                            {appointment.bloodType}
                          </span>
                        )}
                        {appointment.firstName && (
                          <span>
                            {appointment.firstName} {appointment.surname}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status and action button */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2">
                      <span className={`
                        px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap
                        ${getStatusStyle(appointment.status || 'Scheduled')}
                      `}>
                        {appointment.status || 'Scheduled'}
                      </span>
                      
                      <button
                        onClick={() => handleShowDetails(appointment)}
                        className="
                          flex items-center gap-1 text-red-600 hover:text-red-700 
                          transition-all duration-200 text-sm font-medium 
                          hover:bg-red-50 px-2 py-1 rounded-lg
                          group-hover:translate-x-1
                        "
                        aria-label={`View details for appointment on ${formatDateShort(getAppointmentDate(appointment))}`}
                      >
                        <span className="hidden xs:inline">View Details</span>
                        <span className="xs:hidden">Details</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="mt-8 border-t pt-6">
                {/* Mobile-first pagination info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * appointmentsPerPage + 1, appointments.length)}</span> to{' '}
                    <span className="font-semibold text-gray-900">{Math.min(currentPage * appointmentsPerPage, appointments.length)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{appointments.length}</span> appointments
                  </div>
                  
                  {/* Pagination buttons with enhanced responsive design */}
                  <div className="flex items-center justify-center sm:justify-end">
                    <nav className="flex items-center space-x-1" aria-label="Pagination">
                      {/* Previous button */}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`
                          inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg 
                          border transition-all duration-200 min-w-[90px] 
                          ${currentPage === 1
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200 shadow-none'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm hover:shadow-md active:scale-95'
                          }
                        `}
                        aria-label="Go to previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden xs:inline">Previous</span>
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center space-x-1 mx-2">
                        {Array.from(
                          { length: Math.ceil(appointments.length / appointmentsPerPage) },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`
                              inline-flex items-center justify-center w-10 h-10 text-sm font-semibold rounded-lg 
                              border transition-all duration-200 
                              ${currentPage === page
                                ? 'bg-red-600 text-white border-red-600 shadow-md hover:bg-red-700 ring-2 ring-red-200'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm hover:shadow-md active:scale-95'
                              }
                            `}
                            aria-label={`Go to page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, Math.ceil(appointments.length / appointmentsPerPage))
                          )
                        }
                        disabled={currentPage === Math.ceil(appointments.length / appointmentsPerPage)}
                        className={`
                          inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg 
                          border transition-all duration-200 min-w-[90px] 
                          ${currentPage === Math.ceil(appointments.length / appointmentsPerPage)
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200 shadow-none'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm hover:shadow-md active:scale-95'
                          }
                        `}
                        aria-label="Go to next page"
                      >
                        <span className="hidden xs:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <DetailsModal
            appointment={selectedAppointment}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedAppointment(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ListOfAppointments 