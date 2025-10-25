"use client"

import { useState, useEffect, useMemo } from "react"
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
import { fetchWithAuth } from "../../utils/api"

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
    background-color: #F9FAFB;
    cursor: not-allowed;
  }
  .react-datepicker__day--disabled:hover {
    background-color: #F9FAFB !important;
    transform: none !important;
  }
`

export default function Schedule() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedHospital } = location.state || {}
  
  // Function to check if a date should be enabled based on blood bank operating days
  const isDateEnabled = (date) => {
    if (!selectedHospital?.hours) {
      return true // Enable all dates if no hours specified
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay()
    
    // Parse operating days from hours string (format: "Mon-Fri 09:00 - 17:00" or "Mon,Wed,Fri 08:00 - 18:00")
    const hours = selectedHospital.hours
    
    // Extract the days part (before the time)
    const daysString = hours.split(' ')[0] // Gets "Mon-Fri" or "Mon,Wed,Fri"
    
    // Convert day names to numbers
    const dayMap = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    }
    
    // Check if it's a range format (e.g., "Mon-Fri")
    if (daysString.includes('-')) {
      const [startDay, endDay] = daysString.split('-')
      const startDayNum = dayMap[startDay]
      const endDayNum = dayMap[endDay]
      
      // Check if current day is within the range
      return dayOfWeek >= startDayNum && dayOfWeek <= endDayNum
    } else {
      // Check if it's a list format (e.g., "Mon,Wed,Fri")
      const days = daysString.split(',').map(day => dayMap[day.trim()])
      return days.includes(dayOfWeek)
    }
  }
  
  // Get the next available date for booking (considering blood bank operating days)
  const getNextAvailableDate = () => {
    // If no hospital selected yet, just return tomorrow
    if (!selectedHospital?.hours) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return tomorrow
    }
    
    let date = new Date()
    date.setDate(date.getDate() + 1) // Start with tomorrow
    date.setHours(0, 0, 0, 0)
    
    // Keep checking days until we find one that's enabled
    let attempts = 0
    while (attempts < 7) { // Prevent infinite loop
      if (isDateEnabled(date)) {
        return date
      }
      date.setDate(date.getDate() + 1)
      attempts++
    }
    
    // Fallback to tomorrow if we can't find a valid date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }
  
  // Get tomorrow's date for minimum booking date
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }
  
  const [date, setDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  })
  const [selectedTime, setSelectedTime] = useState("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastAppointment, setLastAppointment] = useState(null)
  const [nextEligibleDate, setNextEligibleDate] = useState(null)
  const [showRestrictionModal, setShowRestrictionModal] = useState(false)

  // Helper function to check if 3 months have passed since last appointment
  const hasThreeMonthsPassed = (lastAppointmentDate) => {
    if (!lastAppointmentDate) return true
    
    const lastDate = new Date(lastAppointmentDate)
    const threeMonthsLater = new Date(lastDate)
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return today >= threeMonthsLater
  }

  // Get the next eligible donation date (3 months from last appointment)
  const getNextEligibleDate = (lastAppointmentDate) => {
    if (!lastAppointmentDate) return null
    
    const lastDate = new Date(lastAppointmentDate)
    const eligibleDate = new Date(lastDate)
    eligibleDate.setMonth(eligibleDate.getMonth() + 3)
    
    return eligibleDate
  }

  // Check for recent appointments on component mount
  useEffect(() => {
    const checkRecentAppointments = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetchWithAuth(`/appointment/user/${userId}`)
        if (res.ok) {
          const body = await res.json()
          const appointments = Array.isArray(body) ? body : (body?.data ?? [])
          
          // Filter for scheduled or completed appointments
          const relevantAppointments = appointments.filter(apt => 
            apt.status === 'Scheduled' || apt.status === 'Completed'
          )

          if (relevantAppointments.length > 0) {
            // Sort by appointment date (most recent first)
            const sortedAppointments = relevantAppointments.sort((a, b) => {
              const dateA = new Date(a.appointmentDate || a.dateToday || a.createdAt)
              const dateB = new Date(b.appointmentDate || b.dateToday || b.createdAt)
              return dateB - dateA
            })

            const mostRecentAppointment = sortedAppointments[0]
            const appointmentDate = mostRecentAppointment.appointmentDate || 
                                   mostRecentAppointment.dateToday || 
                                   mostRecentAppointment.createdAt

            setLastAppointment(mostRecentAppointment)
            
            // Check if 3 months have passed
            if (!hasThreeMonthsPassed(appointmentDate)) {
              const eligibleDate = getNextEligibleDate(appointmentDate)
              setNextEligibleDate(eligibleDate)
              setShowRestrictionModal(true)
            }
          }
        }
      } catch (error) {
        console.error('Error checking recent appointments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkRecentAppointments()
  }, [])

  // Loading simulation removed - now using actual data loading

  // Redirect if no hospital selected
  useEffect(() => {
    if (!selectedHospital) {
      navigate("/donation-center")
    }
  }, [selectedHospital, navigate])

  // Generate time slots with availability status - recalculates when date changes
  const availableTimeSlots = useMemo(() => {
    if (!selectedHospital?.hours) return []

    try {
      // Extract time portion from hours string (e.g., "Mon-Fri 10:00 - 20:00" -> "10:00 - 20:00")
      const timeRegex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
      const timeMatch = selectedHospital.hours.match(timeRegex)
      
      if (!timeMatch) {
        console.error('Could not parse time from hours:', selectedHospital.hours)
        // Fallback: Generate default time slots for common business hours
        console.log('Using fallback time slots')
        return [
          { time: "9:00 AM", availability: "available" },
          { time: "10:00 AM", availability: "available" },
          { time: "11:00 AM", availability: "available" },
          { time: "1:00 PM", availability: "available" },
          { time: "2:00 PM", availability: "available" },
          { time: "3:00 PM", availability: "available" },
          { time: "4:00 PM", availability: "available" },
          { time: "5:00 PM", availability: "available" }
        ]
      }

      const [, startTimeStr, endTimeStr] = timeMatch
      
      // Create date objects for time calculation
      const startTime = new Date(`2000/01/01 ${startTimeStr}`)
      const endTime = new Date(`2000/01/01 ${endTimeStr}`)

      // Check if dates are valid
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Invalid time format:', startTimeStr, endTimeStr)
        // Use fallback time slots
        return [
          { time: "9:00 AM", availability: "available" },
          { time: "10:00 AM", availability: "available" },
          { time: "11:00 AM", availability: "available" },
          { time: "1:00 PM", availability: "available" },
          { time: "2:00 PM", availability: "available" },
          { time: "3:00 PM", availability: "available" },
          { time: "4:00 PM", availability: "available" },
          { time: "5:00 PM", availability: "available" }
        ]
      }

      // Handle case where end time might be "24:00"
      if (endTimeStr === "24:00") {
        endTime.setHours(23, 59, 59, 999) // Set to end of day
      }

      const slots = []
      const currentTime = new Date(startTime)

      // Generate time slots with 1-hour intervals
      let slotCount = 0
      while (currentTime < endTime && slotCount < 8) {
        // All time slots are available
        const availability = "available"

        slots.push({
          time: currentTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          availability,
        })
        slotCount++
        
        // Move to next hour
        currentTime.setHours(currentTime.getHours() + 1)
      }

      console.log('Generated time slots:', slots) // Debug log
      return slots
    } catch (error) {
      console.error('Error generating time slots:', error)
      return []
    }
  }, [selectedHospital?.hours, date])

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
                    <span className="text-xs sm:text-sm">{selectedHospital.address || selectedHospital.location}</span>
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
                    minDate={getTomorrowDate()}
                    filterDate={isDateEnabled}
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
                {availableTimeSlots.length > 0 ? (
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
                          </div>
                        </motion.label>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No time slots available</p>
                    <p className="text-sm text-gray-400">
                      Please contact the blood center directly or try a different date
                    </p>
                    <div className="mt-4 text-xs text-gray-400">
                      Operating Hours: {selectedHospital?.hours}
                    </div>
                  </motion.div>
                )}
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
                      <span className="text-xs sm:text-sm text-gray-600">{selectedHospital.address || selectedHospital.location}</span>
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

        {/* Restriction Modal - 3 Month Waiting Period */}
        <AnimatePresence>
          {showRestrictionModal && nextEligibleDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full relative"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-14 sm:w-16 h-14 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <AlertCircle className="w-7 sm:w-8 h-7 sm:h-8 text-yellow-600" />
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-xl sm:text-2xl font-bold text-gray-800 mb-4"
                  >
                    Too Soon to Donate
                  </motion.h2>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4 mb-6"
                  >
                    <p className="text-gray-600">
                      For your health and safety, blood donations must be spaced at least <strong>3 months apart</strong>.
                    </p>

                    {lastAppointment && (
                      <div className="bg-yellow-50 rounded-lg p-4 text-left">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Last Appointment:</strong>
                        </p>
                        <p className="text-sm text-gray-800">
                          {new Date(lastAppointment.appointmentDate || lastAppointment.dateToday || lastAppointment.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    <div className="bg-green-50 rounded-lg p-4 text-left border-2 border-green-200">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Next Eligible Donation Date:</strong>
                      </p>
                      <p className="text-lg font-semibold text-green-700">
                        {nextEligibleDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <p className="text-sm text-gray-500">
                      Thank you for your continued dedication to saving lives through blood donation!
                    </p>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/donation-center")}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    Return to Donation Centers
                  </motion.button>
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
