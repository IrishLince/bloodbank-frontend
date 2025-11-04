"use client"

import { useState, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CheckCircle, XCircle, Calendar, User, AlertCircle, Printer, FileText, X } from "lucide-react"

const EligibilityCheck2 = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const previousFormData = location.state || {}

  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    lastDonationDate: "",
    lastDonationPlace: "",
    donationType: "",
  })
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [eligible, setEligible] = useState(null)
  const [reasons, setReasons] = useState([])
  const [showErrorSummary, setShowErrorSummary] = useState(false)

  // Add these new states
  const [showReviewModal, setShowReviewModal] = useState(false)
  const printRef = useRef(null)

  // Helper function to format date as DD/MM/YYYY
  const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const validateField = (name, value) => {
    let error = ""

    if (!value && name !== "lastDonationDate" && name !== "lastDonationPlace" && name !== "donationType") {
      return "This field is required"
    }

    if (name === "lastDonationDate" && answers.q1 === "Yes" && !value) {
      return "Please provide your last donation date"
    }

    // Validate 3-month waiting period for last donation date
    if (name === "lastDonationDate" && answers.q1 === "Yes" && value) {
      const lastDonationDate = new Date(value)
      const today = new Date()
      
      // Calculate the difference in months
      const monthsDiff = (today.getFullYear() - lastDonationDate.getFullYear()) * 12 + 
                         (today.getMonth() - lastDonationDate.getMonth())
      const daysDiff = today.getDate() - lastDonationDate.getDate()
      
      // If less than 3 full months have passed
      if (monthsDiff < 3 || (monthsDiff === 3 && daysDiff < 0)) {
        const nextEligibleDate = new Date(lastDonationDate)
        nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3)
        
        return `You must wait at least 3 months between donations. Next eligible date: ${formatDateDDMMYYYY(nextEligibleDate)}`
      }
    }

    if (name === "lastDonationPlace" && answers.q1 === "Yes" && !value) {
      return "Please provide your last donation place"
    }

    return error
  }

  const handleChange = (name, value) => {
    const updatedAnswers = { ...answers, [name]: value }
    setAnswers(updatedAnswers)

    if (touched[name]) {
      const fieldError = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: fieldError }))
    }

    // Clear error summary when user starts fixing fields
    setShowErrorSummary(false)

    // Check eligibility
    let isEligible = true
    const newReasons = []

    // Check if last donation was within 3 months
    if (updatedAnswers.q1 === "Yes" && updatedAnswers.lastDonationDate) {
      const lastDonationDate = new Date(updatedAnswers.lastDonationDate)
      const today = new Date()
      
      // Calculate the difference in months
      const monthsDiff = (today.getFullYear() - lastDonationDate.getFullYear()) * 12 + 
                         (today.getMonth() - lastDonationDate.getMonth())
      const daysDiff = today.getDate() - lastDonationDate.getDate()
      
      // If less than 3 full months have passed
      if (monthsDiff < 3 || (monthsDiff === 3 && daysDiff < 0)) {
        isEligible = false
        const nextEligibleDate = new Date(lastDonationDate)
        nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3)
        newReasons.push(`You must wait at least 3 months between donations. You will be eligible again on ${formatDateDDMMYYYY(nextEligibleDate)}`)
      }
    }

    if (updatedAnswers.q2 === "Yes") {
      isEligible = false
      newReasons.push("You have used an alias during past donation attempts")
    }
    if (updatedAnswers.q3 === "Yes") {
      isEligible = false
      newReasons.push("You have been deferred or advised not to donate blood")
    }

    setEligible(isEligible)
    setReasons(newReasons)
  }

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const fieldError = validateField(name, answers[name])
    setErrors((prev) => ({ ...prev, [name]: fieldError }))
  }

  const validateForm = () => {
    const newErrors = {}
    const newTouched = {}
    let isValid = true

    // Validate all required fields
    Object.keys(answers).forEach((field) => {
      newTouched[field] = true
      const error = validateField(field, answers[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(newTouched)
    setShowErrorSummary(!isValid)

    return isValid && eligible
  }

  const handleNextClick = () => {
    if (validateForm()) {
      // Combine all data from previous steps with current medical history
      const dataToPass = {
        ...previousFormData,
        medicalHistory: answers,
      }

      navigate("/eligibility-step3", {
        state: dataToPass,
      })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Add print function
  const handlePrint = () => {
    const printContent = document.getElementById("printable-content")
    const originalContents = document.body.innerHTML

    document.body.innerHTML = printContent.innerHTML
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload() // Reload to restore React functionality
  }

  // Add review summary component
  const ReviewSummary = () => (
    <div id="printable-content" className="p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Medical History Review - Part 1</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Blood Donation Eligibility Check</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="border-b pb-3 sm:pb-4">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Previous Donation History</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
              <span className="text-gray-600">Have you donated blood before?</span>
              <span className="font-medium">{answers.q1 || "Not answered"}</span>
            </div>
            {answers.q1 === "Yes" && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                  <span className="text-gray-600">Last Donation Date:</span>
                  <span className="font-medium break-words">{answers.lastDonationDate || "Not provided"}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                  <span className="text-gray-600">Last Donation Place:</span>
                  <span className="font-medium break-words">{answers.lastDonationPlace || "Not provided"}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-b pb-3 sm:pb-4">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Donation History Verification</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
              <span className="text-gray-600 break-words">Used different name for donation?</span>
              <span className={`font-medium ${answers.q2 === "Yes" ? "text-red-600" : ""}`}>
                {answers.q2 || "Not answered"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
              <span className="text-gray-600 break-words">Previously deferred from donation?</span>
              <span className={`font-medium ${answers.q3 === "Yes" ? "text-red-600" : ""}`}>
                {answers.q3 || "Not answered"}
              </span>
            </div>
          </div>
        </div>

        <div className="border-b pb-3 sm:pb-4">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Eligibility Status</h3>
          <div className="flex items-start sm:items-center gap-2">
            {eligible ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span className={`font-medium text-xs sm:text-sm break-words ${eligible ? "text-green-600" : "text-red-600"}`}>
              {eligible ? "Eligible to proceed" : "Not eligible to proceed"}
            </span>
          </div>
          {!eligible && reasons.length > 0 && (
            <div className="mt-2 sm:mt-3">
              <p className="text-xs sm:text-sm font-medium text-gray-700">Reasons for Ineligibility:</p>
              <ul className="mt-1 sm:mt-2 space-y-1">
                {reasons.map((reason, i) => (
                  <li key={i} className="text-xs sm:text-sm text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center pt-3 sm:pt-4">
          This document is part of your blood donation eligibility check.
          <br />
          Generated on {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  )

  const renderQuestion = (item, idx) => (
    <div
      key={idx}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md"
    >
      <p className="text-md text-gray-800 font-medium flex gap-2 items-start">
        <span className="bg-red-50 text-red-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
          {idx + 1}
        </span>
        <span>{item.q}</span>
      </p>
      {item.t && <p className="text-sm italic text-gray-500 mt-1 ml-8">{item.t}</p>}

      <div className="mt-4 ml-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          {["Yes", "No"].map((option) => (
            <label
              key={option}
              className={`
                flex items-center gap-2 cursor-pointer px-3 sm:px-4 py-2 rounded-lg
                transition-all duration-200 text-sm sm:text-base
                ${answers[item.name] === option ? "bg-red-50 text-red-600 font-medium" : "hover:bg-gray-50"}
              `}
            >
              <input
                type="radio"
                name={item.name}
                value={option}
                checked={answers[item.name] === option}
                onChange={() => handleChange(item.name, option)}
                onBlur={() => handleBlur(item.name)}
                className="form-radio text-red-600 focus:ring-red-500 w-3 h-3 sm:w-4 sm:h-4"
              />
              {option}
            </label>
          ))}
        </div>

        {errors[item.name] && touched[item.name] && (
          <p className="text-xs sm:text-sm text-red-500 flex items-start gap-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
            <span className="break-words">{errors[item.name]}</span>
          </p>
        )}

        {item.extra && answers.q1 === "Yes" && (
          <div className="space-y-3 sm:space-y-4 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  Date of Last Donation
                </label>
                <input
                  type="date"
                  value={answers.lastDonationDate}
                  onChange={(e) => handleChange("lastDonationDate", e.target.value)}
                  onBlur={() => handleBlur("lastDonationDate")}
                  className={`w-full p-2 border rounded-lg shadow-sm text-sm
                    ${
                      errors.lastDonationDate && touched.lastDonationDate
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    }`}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.lastDonationDate && touched.lastDonationDate && (
                  <p className="mt-1 text-xs text-red-500 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{errors.lastDonationDate}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  Place of Last Donation
                </label>
                <input
                  type="text"
                  value={answers.lastDonationPlace}
                  onChange={(e) => handleChange("lastDonationPlace", e.target.value)}
                  onBlur={() => handleBlur("lastDonationPlace")}
                  placeholder="Enter location"
                  className={`w-full p-2 border rounded-lg shadow-sm text-sm
                    ${
                      errors.lastDonationPlace && touched.lastDonationPlace
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    }`}
                />
                {errors.lastDonationPlace && touched.lastDonationPlace && (
                  <p className="mt-1 text-xs text-red-500 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{errors.lastDonationPlace}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-700 mb-4 sm:mb-6 text-center tracking-wide flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="text-2xl sm:text-3xl lg:text-4xl">🩺</span> 
          <span>Medical History</span>
        </h2>

        {showErrorSummary && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <p className="font-medium text-sm sm:text-base">Please correct the following errors:</p>
            </div>
            <ul className="mt-2 list-disc list-inside text-xs sm:text-sm text-red-600 space-y-1">
              {Object.entries(errors).map(([field, error]) =>
                error ? (
                  <li key={field} className="capitalize break-words">
                    {field.replace(/([A-Z])/g, " $1").trim()}: {error}
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {[
            {
              q: "Have you donated blood before? If yes, indicate the date and place of last donation",
              t: "Nakapagbigay ka na ba ng dugo? Kung Oo, isulat kung saan at kailan ang huling donasyon",
              name: "q1",
              extra: true,
            },
            {
              q: "Have you ever donated or attempted to donate blood using a different name here or anywhere else?",
              t: "Nakapagbigay ka na ba ng dugo na gumamit ng ibang pangalan dito o sa ibang lugar?",
              name: "q2",
            },
            {
              q: "Have you for any reason been deferred as a blood donor or told not to donate blood?",
              t: "Ikaw ba ay hindi natanggap o nasabihan na hindi pwedeng magbigay ng dugo sanhi ng ano mang kadahilanan?",
              name: "q3",
            },
          ].map((item, idx) => renderQuestion(item, idx))}
        </div>

        {eligible !== null && (
          <div
            className={`
            mt-6 sm:mt-8 rounded-lg p-4 sm:p-6 border-2 transition-all duration-300
            ${eligible ? "bg-green-50 border-green-500 text-green-800" : "bg-red-50 border-red-500 text-red-800"}
          `}
          >
            <div className="flex items-start gap-3">
              {eligible ? (
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base">
                  {eligible
                    ? "You are eligible to proceed with the donation process"
                    : "You are not eligible to proceed"}
                </p>
                {!eligible && reasons.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-xs sm:text-sm">Reason(s):</p>
                    <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 mt-1">
                      {reasons.map((reason, i) => (
                        <li key={i} className="break-words">{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 sm:pt-8 flex justify-center sm:justify-end">
          <button
            onClick={handleNextClick}
            disabled={!eligible}
            className={`
              w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold
              transition-all duration-200 transform text-sm sm:text-base
              ${
                !eligible
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }
            `}
          >
            <span>Proceed to Next Step</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto mx-3 sm:mx-0"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <span>Answer Review</span>
                </h3>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Print Review"
                  >
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div ref={printRef}>
                <ReviewSummary />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 flex justify-end">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EligibilityCheck2
