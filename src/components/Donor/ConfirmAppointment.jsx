import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, User, Mail, Phone, Droplet, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
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
    contactNumber: '+63 967 654 3210',
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
        <div className="absolute top-10 left-10 w-32 sm:w-40 h-32 sm:h-40 bg-red-200 opacity-30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-48 sm:w-60 h-48 sm:h-60 bg-red-300 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 px-4 sm:px-0">
          <div className="backdrop-blur-xl bg-white/60 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col items-center">
            <Droplet className="w-10 sm:w-12 h-10 sm:h-12 text-red-500 mb-4" />
            <div className="text-lg sm:text-xl font-bold text-red-700 mb-2">No appointment details available.</div>
            <div className="text-sm sm:text-base text-gray-600 mb-6">Please book an appointment first.</div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base shadow-lg hover:from-red-700 hover:to-red-600 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300"
            >
              <ChevronLeft className="w-4 sm:w-6 h-4 sm:h-6" />
              <span className="font-medium">Back to Booking</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-white relative overflow-hidden">
      {/* Floating blood drop shapes - Mobile optimized */}
      <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-red-200 opacity-30 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-red-300 opacity-20 rounded-full blur-3xl animate-pulse" />
      <Header />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="flex justify-between items-center mb-4 sm:mb-8">
          <RefreshLink 
            to="/eligibility" 
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 text-red-600 hover:bg-red-50 transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="font-medium">Back</span>
          </RefreshLink>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-white hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-sm sm:text-base"
          >
            <span className="font-medium">Confirm</span>
            <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
            Confirm Appointment
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Please review your appointment details before confirming</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* Personal Info Card */}
            <div className="backdrop-blur-xl bg-white/70 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border-l-4 border-red-400 fade-in-up transition-transform duration-300 hover:-translate-y-1 hover:shadow-3xl">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6 text-red-600">
                <User className="w-5 sm:w-6 h-5 sm:h-6" /> Personal Information
              </h2>
              <div className="space-y-3 sm:space-y-5">
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <User className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base font-semibold">{donorInfo.fullName}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <Mail className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base">{donorInfo.email}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <Phone className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base">{donorInfo.contactNumber}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <Droplet className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base font-semibold">Blood Type:</span>
                  <span className="bg-red-100 text-red-700 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-bold shadow">{donorInfo.bloodType}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base font-semibold">Date of Birth:</span>
                  <span className="text-sm sm:text-base">{donorInfo.dateOfBirth}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base font-semibold">Medical Conditions:</span>
                  <span className="text-sm sm:text-base">{donorInfo.medicalConditions}</span>
                </div>
              </div>
            </div>

            {/* Appointment Info Card */}
            <div className="backdrop-blur-xl bg-white/70 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border-l-4 border-red-400 fade-in-up transition-transform duration-300 hover:-translate-y-1 hover:shadow-3xl">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6 text-red-600">
                <Calendar className="w-5 sm:w-6 h-5 sm:h-6" /> Appointment Details
              </h2>
              <div className="space-y-3 sm:space-y-5">
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base font-semibold">Donation Center:</span>
                  <span className="text-sm sm:text-base">{selectedHospital?.name}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base font-semibold">Date:</span>
                  <span className="text-sm sm:text-base">{appointmentDate?.toDateString()}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
                  <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                  <span className="text-sm sm:text-base font-semibold">Time:</span>
                  <span className="text-sm sm:text-base">{appointmentTime}</span>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-100">
                <p className="text-red-600 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">REMINDER:</p>
                <p className="text-sm sm:text-base text-gray-600">Please arrive 15 minutes before your scheduled appointment time.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="w-full sm:w-auto bg-gradient-to-r from-green-50 to-green-100 rounded-lg sm:rounded-full px-4 sm:px-8 py-3 sm:py-4 shadow-inner">
              <p className="text-sm sm:text-base text-gray-600 font-medium text-center">Current Eligibility Status</p>
              <div className="flex items-center justify-center gap-2 text-green-600 font-bold mt-1">
                <Droplet className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-sm sm:text-base">ELIGIBLE TO DONATE</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal - Mobile optimized */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full relative zoom-in">
            <button 
              onClick={handleCloseSuccess}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 hover:bg-red-50 p-2 rounded-full transition-colors"
            >
              <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-500" />
            </button>
            
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">Congratulations!</h2>
              <p className="text-lg sm:text-xl mb-6">You have successfully booked your appointment!</p>
              
              <div className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-6 relative">
                <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white rounded-full flex items-center justify-center">
                    <RefreshLink to="/homepage">
                      <img src={logo} alt="Logo" className="w-10 sm:w-12 h-10 sm:h-12 cursor-pointer hover:opacity-80 transition-opacity" />
                    </RefreshLink>
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                You will receive a confirmation message<br />
                and more information via SMS.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6">
                <button 
                  onClick={handleCloseSuccess}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-sm sm:text-base"
                >
                  Proceed to Details
                </button>
                <button 
                  onClick={handleCancel}
                  className="w-full sm:w-auto bg-white text-red-600 border-2 border-red-500 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:bg-red-50 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-sm sm:text-base"
                >
                  Cancel Appointment
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-500">
                Redirecting you to appointment details in {countdown}s
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}