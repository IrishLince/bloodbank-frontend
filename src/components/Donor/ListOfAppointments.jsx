import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle, X, ChevronRight, User, Phone, Heart, Mail, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchWithAuth } from '../../utils/api'

const ListOfAppointments = () => {
  const location = useLocation()
  const [appointments, setAppointments] = useState([])
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const appointmentsPerPage = 5

  useEffect(() => {
    const load = async () => {
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

    load()

    // Show success message if navigated from confirmation
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      setShowSuccessMessage(true)

      // Hide message after 5 seconds
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state])

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-6xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-red-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold">Appointment Details</h2>
            {getAppointmentDate(appointment) && (
              <p className="text-white/80 mt-1">
                Scheduled on {formatDate(getAppointmentDate(appointment))}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Appointment ID Section */}
            {appointment.id && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Appointment ID:</span>
                  <span className="font-mono text-sm font-medium text-gray-800">{appointment.id}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Appointment Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Appointment Details</h3>
                <div className="flex items-center gap-2 text-gray-800">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium">{formatDate(getAppointmentDate(appointment))}</p>
                    <p className="text-sm text-gray-500">{formatTime(appointment.appointmentTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-800">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium">Donation Center</p>
                    <p className="text-sm text-gray-500">{appointment.donationCenter}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(appointment.status)}`}>
                    {appointment.status || 'Scheduled'}
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium text-right">
                      {appointment.firstName} {appointment.middleInitial && `${appointment.middleInitial}. `}{appointment.surname}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Blood Type:</span>
                    <span className="font-medium text-red-600">{appointment.bloodType}</span>
                  </div>
                  {appointment.age && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium text-right">{appointment.age} years old</span>
                    </div>
                  )}
                  {appointment.birthday && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Birthday:</span>
                      <span className="font-medium text-right">{formatDate(appointment.birthday)}</span>
                    </div>
                  )}
                  {appointment.sex && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Sex:</span>
                      <span className="font-medium text-right">{appointment.sex}</span>
                    </div>
                  )}
                  {appointment.civilStatus && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Civil Status:</span>
                      <span className="font-medium text-right">{appointment.civilStatus}</span>
                    </div>
                  )}
                  {appointment.occupation && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Occupation:</span>
                      <span className="font-medium text-right">{appointment.occupation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Contact Information</h3>
                <div className="space-y-3">
                  {appointment.phoneNumber && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Mobile Phone:</span>
                      <span className="font-medium text-right">{appointment.phoneNumber}</span>
                    </div>
                  )}
                  {appointment.officePhone && appointment.officePhone !== 'N/A' && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Office Phone:</span>
                      <span className="font-medium text-right">{appointment.officePhone}</span>
                    </div>
                  )}
                  {/* Email Display - Check if homeAddress contains email */}
                  {appointment.homeAddress && appointment.homeAddress.includes('@') && appointment.homeAddress.includes('.') && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-right">{appointment.homeAddress}</span>
                    </div>
                  )}
                  {/* Address Display - Only show if homeAddress doesn't look like email */}
                  {appointment.homeAddress && !(appointment.homeAddress.includes('@') && appointment.homeAddress.includes('.')) && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium text-right">{appointment.homeAddress}</span>
                    </div>
                  )}
                  {appointment.patientName && appointment.patientName !== appointment.firstName + ' ' + appointment.surname && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Patient Name:</span>
                      <span className="font-medium text-right">{appointment.patientName}</span>
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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800">Success!</h3>
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
            <span className="text-sm text-gray-500">
              Total Appointments: {appointments.length}
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No appointments yet</h3>
              <p className="text-gray-500 mt-2">Your blood donation appointments will appear here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {appointments
                  .slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage)
                  .map((appointment) => (
                <div
                  key={appointment.id || appointment.appointmentId || appointment._id || `${appointment.appointmentDate}-${appointment.bloodBankId}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <span className="font-medium">
                          {formatDateShort(getAppointmentDate(appointment))}
                        </span>
                      </div>
                      {appointment.appointmentTime && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-5 h-5 flex-shrink-0" />
                          <span>{formatTime(appointment.appointmentTime)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-5 h-5 flex-shrink-0" />
                        <span className="line-clamp-1">{appointment.donationCenter}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(appointment.status || 'Scheduled')}`}>
                        {appointment.status || 'Scheduled'}
                      </span>
                      <button
                        onClick={() => handleShowDetails(appointment)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {Math.min((currentPage - 1) * appointmentsPerPage + 1, appointments.length)} to{' '}
                    {Math.min(currentPage * appointmentsPerPage, appointments.length)} of {appointments.length} appointments
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.ceil(appointments.length / appointmentsPerPage) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg border transition-colors ${
                            currentPage === page
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, Math.ceil(appointments.length / appointmentsPerPage))
                        )
                      }
                      disabled={currentPage === Math.ceil(appointments.length / appointmentsPerPage)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                        currentPage === Math.ceil(appointments.length / appointmentsPerPage)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
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