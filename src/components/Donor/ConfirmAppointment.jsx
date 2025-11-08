import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, User, Mail, Phone, Droplet, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
import { formatDonorPhone } from '../../utils/phoneFormatter'
import logo from '../../assets/Logo.png';
import Header from '../Header'
import RefreshLink from '../RefreshLink'
import { navigateWithRefresh } from '../../utils/navigation'

export default function ConfirmAppointment() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedHospital, appointmentDate, appointmentTime, formData } = location.state || {}

  const [showSuccess, setShowSuccess] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [donorInfo, setDonorInfo] = useState({
    fullName: 'Daniel Padilla',
    email: 'danielpadilla@gmail.com',
    contactNumber: '639676543210',
    bloodType: 'A+',
    dateOfBirth: 'April 26, 1995',
    medicalConditions: 'N/A',
  })

  useEffect(() => {
    let timer
    if (showSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1)
      }, 1000)
    } else if (countdown === 0) {
      handleCloseSuccess()
    }
    return () => clearInterval(timer)
  }, [showSuccess, countdown])

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowSuccess(true)
  }

  const handleCancel = () => {
    navigateWithRefresh('/')
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    navigateWithRefresh('/appointment-details', {
      state: {
        // Preserve hospital context so AppointmentDetails can save bloodBankId
        selectedHospital,
        bloodBankId: selectedHospital?.id,
        donorInfo,
        appointmentDetails: {
          donationCenter: selectedHospital?.name,
          appointmentDate: appointmentDate?.toDateString(),
          timeSlot: appointmentTime,
          notes: 'N/A'
        }
      }
    })
  }

  if (!donorInfo || !appointmentDate || !appointmentTime) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-white relative overflow-hidden">
        {/* Floating blood drop shapes - Mobile optimized */}
        <div className="absolute top-10 left-10 w-32 sm:w-40 lg:w-48 h-32 sm:h-40 lg:h-48 bg-red-200 opacity-30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-48 sm:w-60 lg:w-72 h-48 sm:h-60 lg:h-72 bg-red-300 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 px-3 sm:px-4 lg:px-0">
          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-10 flex flex-col items-center border border-white/20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Droplet className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-red-500" />
            </div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-red-700 mb-2 text-center">No appointment details available</div>
            <div className="text-xs sm:text-sm lg:text-base text-gray-600 mb-6 text-center max-w-sm">Please book an appointment first to continue with the confirmation process.</div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base shadow-lg hover:from-red-700 hover:to-red-600 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 font-medium"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              <span>Back to Booking</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-white relative overflow-hidden">
      {/* Floating blood drop shapes - Mobile optimized */}
      <div className="absolute top-0 left-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-red-200 opacity-30 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 lg:w-[480px] h-64 sm:h-96 lg:h-[480px] bg-red-300 opacity-20 rounded-full blur-3xl animate-pulse" />
      <Header />

      <main className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-4 sm:mb-8">
          <RefreshLink 
            to="/eligibility" 
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-red-600 hover:bg-red-50 transition-all duration-300 shadow-sm hover:shadow-md text-xs sm:text-sm lg:text-base border border-red-100"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            <span className="font-medium">Back</span>
          </RefreshLink>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 rounded-full px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-white hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-xs sm:text-sm lg:text-base font-medium"
          >
            <span>Confirm Appointment</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          </button>
        </div>

        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800 mb-2">
            Confirm Appointment
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">Please review your appointment details before confirming</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Personal Info Card */}
            <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border-l-4 border-red-400 fade-in-up transition-transform duration-300 hover:-translate-y-1 hover:shadow-3xl border border-white/20">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6 text-red-600">
                <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> 
                <span>Personal Information</span>
              </h2>
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base font-semibold block">{donorInfo.fullName}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base break-words">{donorInfo.email}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base">{formatDonorPhone(donorInfo.contactNumber)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <Droplet className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs sm:text-sm lg:text-base font-semibold">Blood Type:</span>
                    <span className="bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs font-bold shadow flex-shrink-0">{donorInfo.bloodType}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base font-semibold">Date of Birth: </span>
                    <span className="text-xs sm:text-sm lg:text-base">{donorInfo.dateOfBirth}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base font-semibold">Medical Conditions: </span>
                    <span className="text-xs sm:text-sm lg:text-base">{donorInfo.medicalConditions}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Info Card */}
            <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border-l-4 border-red-400 fade-in-up transition-transform duration-300 hover:-translate-y-1 hover:shadow-3xl border border-white/20">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6 text-red-600">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> 
                <span>Appointment Details</span>
              </h2>
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base font-semibold">Donation Center:</span>
                    <span className="text-xs sm:text-sm lg:text-base block mt-0.5 break-words">{selectedHospital?.name}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base font-semibold">Date:</span>
                    <span className="text-xs sm:text-sm lg:text-base block mt-0.5">{appointmentDate?.toDateString()}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 text-gray-700">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm lg:text-base font-semibold">Time:</span>
                    <span className="text-xs sm:text-sm lg:text-base block mt-0.5">{appointmentTime}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 lg:mt-8 p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-100">
                <p className="text-red-600 font-semibold mb-1 text-xs sm:text-sm lg:text-base flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  REMINDER:
                </p>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">Please arrive 15 minutes before your scheduled appointment time.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="w-full max-w-md bg-gradient-to-r from-green-50 to-green-100 rounded-lg sm:rounded-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-inner border border-green-200">
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium text-center">Current Eligibility Status</p>
              <div className="flex items-center justify-center gap-2 text-green-600 font-bold mt-1">
                <Droplet className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                <span className="text-xs sm:text-sm lg:text-base">ELIGIBLE TO DONATE</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal - Mobile optimized */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-md w-full relative zoom-in border border-white/20">
            <button 
              onClick={handleCloseSuccess}
              className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 hover:bg-red-50 p-1.5 sm:p-2 rounded-full transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-500" />
            </button>
            
            <div className="text-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-2">Congratulations!</h2>
              <p className="text-base sm:text-lg lg:text-xl mb-4 sm:mb-6">You have successfully booked your appointment!</p>
              
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto mb-4 sm:mb-6 relative">
                <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center">
                    <RefreshLink to="/homepage">
                      <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 cursor-pointer hover:opacity-80 transition-opacity" />
                    </RefreshLink>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6 lg:mb-8">
                You will receive a confirmation message<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>and more information via SMS.
              </p>

              <div className="flex flex-col gap-3 justify-center mb-3 sm:mb-4 lg:mb-6">
                <button 
                  onClick={handleCloseSuccess}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-xs sm:text-sm lg:text-base font-medium"
                >
                  Proceed to Details
                </button>
                <button 
                  onClick={handleCancel}
                  className="w-full bg-white text-red-600 border-2 border-red-500 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-full hover:bg-red-50 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-xs sm:text-sm lg:text-base font-medium"
                >
                  Cancel Appointment
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Redirecting you to appointment details in {countdown}s
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}