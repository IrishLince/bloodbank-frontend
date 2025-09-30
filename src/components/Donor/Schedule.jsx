"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  CalendarIcon,
  Clock,
  Check,
  MapPin,
  Building,
  AlertCircle,
  X,
  Calendar,
  ChevronLeft,
  Loader,
} from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Header from "../Header"

// Enhanced date picker styles with animations
const customDatePickerStyles = `
  .react-datepicker {
    font-family: inherit;
    margin: 0 auto;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 1rem;
  }
  .react-datepicker__month-container {
    float: none;
    background: white;
    border-radius: 1rem;
    overflow: hidden;
  }
  .react-datepicker__header {
    background-color: white;
    border-bottom: 1px solid #F3F4F6;
    padding: 1rem;
  }
  .react-datepicker__day-name {
    color: #9CA3AF;
    font-weight: 500;
    width: 2.5rem;
    line-height: 2.5rem;
    margin: 0.2rem;
  }
  .react-datepicker__day {
    color: #1F2937;
    border-radius: 0.5rem;
    margin: 0.2rem;
    width: 2.5rem;
    line-height: 2.5rem;
    transition: all 0.2s ease;
  }
  .react-datepicker__day:hover {
    background-color: #FEE2E2;
    transform: scale(1.1);
  }
  .react-datepicker__day--selected {
    background-color: #DC2626 !important;
    color: white !important;
    transform: scale(1.1);
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #FEE2E2;
    color: #DC2626;
  }
  .react-datepicker__current-month {
    color: #1F2937;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .react-datepicker__navigation {
    top: 1rem;
    transition: transform 0.2s ease;
  }
  .react-datepicker__navigation:hover {
    transform: scale(1.2);
  }
  .react-datepicker__day--disabled {
    color: #D1D5DB;
    text-decoration: line-through;
  }
`

export default function Schedule() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedHospital } = location.state || {}
  const [date, setDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Redirect if no hospital selected
  useEffect(() => {
    if (!selectedHospital) {
      navigate("/donation-center")
    }
  }, [selectedHospital, navigate])

  // Generate time slots with availability status
  const generateTimeSlots = () => {
    if (!selectedHospital?.hours) return []

    const [start, end] = selectedHospital.hours.split(" - ")
    const startTime = new Date(`2000/01/01 ${start}`)
    const endTime = new Date(`2000/01/01 ${end}`)

    const slots = []
    const currentTime = startTime

    while (currentTime < endTime) {
      // Randomly assign availability status for demo
      const availability = Math.random() > 0.3 ? "available" : "limited"

      slots.push({
        time: currentTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        availability,
      })
      currentTime.setHours(currentTime.getHours() + 2)
    }

    return slots
  }

  const availableTimeSlots = generateTimeSlots()

  const handleConfirm = () => {
    if (selectedTime) {
      setShowConfirmModal(true)
    } else {
      // Show error animation for time slot selection
      const timeSection = document.querySelector("#time-section")
      if (timeSection) {
        timeSection.classList.add("shake-animation")
        setTimeout(() => timeSection.classList.remove("shake-animation"), 500)
      }
    }
  }

  const handleProceed = () => {
    localStorage.setItem("eligibilityStep", "2")
    navigate("/eligibility", {
      state: { selectedHospital, appointmentDate: date, appointmentTime: selectedTime },
    })
  }

  if (!selectedHospital) return null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Loader className="w-8 h-8 text-red-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-white relative overflow-hidden">
      <style>{customDatePickerStyles}</style>

      {/* Animated background elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-red-200 rounded-full blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-red-300 rounded-full blur-3xl"
      />

      <Header />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-4 sm:mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 text-red-600 hover:bg-red-50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Back</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-white hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
          >
            <span className="text-sm sm:text-base font-medium">Continue</span>
            <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6 sm:mb-12"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Schedule Your Donation</h1>
          <p className="text-sm sm:text-base text-gray-600">Choose your preferred date and time for blood donation</p>
        </motion.div>

        {/* Hospital Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-5xl mx-auto mb-4 sm:mb-8"
        >
          <div className="backdrop-blur-xl bg-white/70 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-red-400 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-3 sm:gap-4">
              <motion.div whileHover={{ scale: 1.1 }} className="p-2 sm:p-3 bg-red-50 rounded-lg sm:rounded-xl">
                <Building className="w-5 sm:w-6 h-5 sm:h-6 text-red-500" />
              </motion.div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{selectedHospital.name}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-xs sm:text-sm">{selectedHospital.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-xs sm:text-sm">{selectedHospital.hours}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-5xl mx-auto bg-white rounded-xl sm:rounded-3xl p-4 sm:p-8 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
            {/* Date Selection */}
            <div className="space-y-4 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-800 justify-center"
              >
                <CalendarIcon className="w-5 sm:w-6 h-5 sm:h-6 text-red-500" />
                <h2>Select Date</h2>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-red-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-inner flex justify-center"
              >
                <div className="inline-block">
                  <DatePicker
                    selected={date}
                    onChange={(date) => setDate(date)}
                    minDate={new Date()}
                    inline
                    calendarClassName="!font-sans"
                  />
                </div>
              </motion.div>
            </div>

            {/* Time Selection */}
            <div className="space-y-4 sm:space-y-6" id="time-section">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-800"
              >
                <Clock className="w-5 sm:w-6 h-5 sm:h-6 text-red-500" />
                <h2>Select Time</h2>
              </motion.div>
              <div className="bg-red-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <AnimatePresence>
                    {availableTimeSlots.map((slot) => (
                      <motion.label
                        key={slot.time}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          relative flex items-center justify-center p-3 sm:p-4 
                          rounded-lg sm:rounded-xl cursor-pointer
                          transition-all duration-300 
                          ${
                            selectedTime === slot.time
                              ? "bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg scale-[1.02]"
                              : "bg-white text-gray-700 hover:bg-red-50 hover:shadow"
                          }
                          ${slot.availability === "limited" ? "opacity-75" : ""}
                        `}
                      >
                        <input
                          type="radio"
                          name="timeSlot"
                          value={slot.time}
                          checked={selectedTime === slot.time}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          {selectedTime === slot.time ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-sm sm:text-base font-medium">{slot.time}</span>
                          {slot.availability === "limited" && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                              Limited
                            </span>
                          )}
                        </div>
                      </motion.label>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 sm:mt-12 flex flex-col items-center"
          >
            <div className="w-full sm:w-auto bg-gradient-to-r from-red-50 to-red-100 rounded-lg sm:rounded-full px-4 sm:px-8 py-3 sm:py-4 shadow-inner mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600 font-medium text-center">Selected Schedule:</p>
              <p className="text-sm sm:text-base text-red-600 font-bold mt-1 text-center">
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {selectedTime && ` at ${selectedTime}`}
              </p>
            </div>

            {/* Reminder Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-2 sm:gap-3 bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 w-full sm:max-w-lg"
            >
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-yellow-700 font-medium">Please Note:</p>
                <p className="text-xs sm:text-sm text-yellow-600">
                  Arrive 15 minutes before your scheduled time. Don't forget to bring a valid ID and avoid heavy meals
                  2-3 hours before donation.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full relative"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowConfirmModal(false)}
                  className="absolute top-3 sm:top-4 right-3 sm:right-4 hover:bg-red-50 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-500" />
                </motion.button>

                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-14 sm:w-16 h-14 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Calendar className="w-7 sm:w-8 h-7 sm:h-8 text-red-600" />
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-xl sm:text-2xl font-bold text-gray-800 mb-4"
                  >
                    Confirm Your Schedule
                  </motion.h2>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-red-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="w-4 sm:w-5 h-4 sm:h-5 text-red-500" />
                      <span className="text-sm sm:text-base font-medium text-gray-700">{selectedHospital.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-red-500" />
                      <span className="text-xs sm:text-sm text-gray-600">{selectedHospital.location}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="w-4 sm:w-5 h-4 sm:h-5 text-red-500" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {date.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-red-500" />
                      <span className="text-xs sm:text-sm text-gray-600">{selectedTime}</span>
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm sm:text-base text-gray-600 mb-6"
                  >
                    Are you sure you want to proceed with this schedule?
                  </motion.p>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleProceed}
                      className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-sm sm:text-base font-medium"
                    >
                      Confirm Schedule
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowConfirmModal(false)}
                      className="w-full sm:w-auto bg-white text-red-600 border-2 border-red-500 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:bg-red-50 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-sm sm:text-base font-medium"
                    >
                      Change Schedule
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
