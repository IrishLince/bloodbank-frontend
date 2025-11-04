"use client"

import { useState, useEffect, useRef } from "react"
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaEye, FaTimes } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Printer, X } from "lucide-react"
import { fetchWithAuth } from "../../utils/api"

const DonationList = () => {
  const [donations, setDonations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterBloodType, setFilterBloodType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showMedicalModal, setShowMedicalModal] = useState(false)
  const [selectedMedicalHistory, setSelectedMedicalHistory] = useState(null)
  const [selectedDonorName, setSelectedDonorName] = useState("")
  const printRef = useRef(null)

  // Fetch appointments/donations from backend
  useEffect(() => {
    fetchDonations()
    
    // Set up automatic status checking every 5 minutes
    const interval = setInterval(() => {
      checkAndUpdateMissedAppointments()
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Check and update missed appointments
  const checkAndUpdateMissedAppointments = async () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
    
    // Check each donation for missed appointments
    for (const donation of donations) {
      if (donation.status === 'Scheduled' || donation.status === 'Pending') {
        try {
          // Parse appointment date and time
          const appointmentDate = new Date(donation.donationDate)
          const appointmentTime = donation.appointmentTime || '09:00' // Default time if not specified
          
          // Combine date and time
          const [hours, minutes] = appointmentTime.split(':')
          const appointmentDateTime = new Date(appointmentDate)
          appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          
          // Check if appointment is more than 1 hour past
          if (appointmentDateTime < oneHourAgo) {
            console.log(`Auto-marking missed appointment: ${donation.donorName} (${donation.id})`)
            
            // Update status to missed
            const response = await fetchWithAuth(`/appointment/${donation.id}/mark-missed`, {
              method: 'POST'
            })
            
            if (response.ok) {
              console.log(`Successfully marked as missed: ${donation.donorName}`)
              // Refresh the donations list
              fetchDonations()
            }
          }
        } catch (error) {
          console.error(`Error checking missed appointment for ${donation.donorName}:`, error)
        }
      }
    }
  }

  const fetchDonations = async () => {
    try {
      setIsLoading(true)
      
      // Get logged-in blood bank ID
      const userResponse = await fetchWithAuth('/auth/me')
      if (!userResponse.ok) {
        console.error('Failed to get user information')
        return
      }
      
      const userData = await userResponse.json()
      // Use the MongoDB _id, not the custom bloodBankId
      const bloodBankMongoId = userData.id
      
      if (!bloodBankMongoId) {
        console.error('Blood bank MongoDB ID not found')
        return
      }
      
      // Fetch appointments for this blood bank using MongoDB ID
      console.log('Fetching appointments for blood bank MongoDB ID:', bloodBankMongoId)
      const response = await fetchWithAuth(`/appointment/bloodbank/${bloodBankMongoId}`)
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Appointments response:', result)
        
        if (result.data && Array.isArray(result.data)) {
          // Transform appointments to donation format
          const transformedDonations = result.data.map(appointment => ({
            id: appointment.id,
            donorName: `${appointment.firstName || ''} ${appointment.surname || ''}`.trim() || 'Unknown',
            donorId: appointment.donorId || appointment.userId || 'N/A',
            bloodType: appointment.bloodType || 'Unknown',
              age: appointment.age || appointment.donorAge || 'Not specified',
            units: 1, // Default to 1 unit per appointment
            donationDate: appointment.appointmentDate ? 
              new Date(appointment.appointmentDate).toISOString().split('T')[0] : 
              appointment.visitationDate ? 
                new Date(appointment.visitationDate).toISOString().split('T')[0] :
                appointment.dateToday || new Date().toISOString().split('T')[0],
            status: appointment.status || 'Pending',
            phoneNumber: appointment.phoneNumber,
              notes: appointment.notes,
              medicalHistory: appointment.medicalHistory || {},
              appointmentTime: appointment.appointmentTime || '09:00' // Include appointment time
          }))
          
          console.log('Transformed donations:', transformedDonations)
          setDonations(transformedDonations)
        } else {
          console.log('No data or not an array:', result)
          setDonations([])
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch appointments:', response.status, errorText)
        setDonations([])
      }
    } catch (error) {
      console.error('Error fetching donations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort donations
  const filteredDonations = donations
    .filter((donation) => {
      const matchesSearch =
        donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.donorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.bloodType.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesBloodType = filterBloodType === "" || donation.bloodType === filterBloodType
      const matchesStatus = filterStatus === "" || donation.status === filterStatus

      return matchesSearch && matchesBloodType && matchesStatus
    })
    .sort((a, b) => {
      const dateA = new Date(a.donationDate)
      const dateB = new Date(b.donationDate)
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  // Handle mark donation as complete
  const handleMarkComplete = async (appointmentId) => {
    if (!window.confirm('Mark this donation as complete? This will award the donor +100 reward points.')) {
      return
    }

    try {
      const response = await fetchWithAuth(`/appointment/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Complete' })
      })

      if (response.ok) {
        alert('Donation marked as complete! Donor has been awarded +100 points.')
        // Refresh donations list
        fetchDonations()
      } else {
        const error = await response.json()
        alert('Failed to update status: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating donation status:', error)
      alert('Failed to update donation status. Please try again.')
    }
  }

  // Handle status change
  const handleStatusChange = async (appointmentId, newStatus) => {
    const statusMessages = {
      'Complete': 'Mark this donation as complete? This will award the donor +100 reward points.',
      'Missed': 'Mark this appointment as missed? The donor will not receive points.',
      'Deferred': 'Mark this appointment as deferred? The donor will not receive points.'
    }

    if (!window.confirm(statusMessages[newStatus] || `Change status to ${newStatus}?`)) {
      return
    }

    try {
      let response;
      if (newStatus === 'Complete') {
        response = await fetchWithAuth(`/appointment/${appointmentId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'Complete' })
        })
      } else if (newStatus === 'Missed') {
        response = await fetchWithAuth(`/appointment/${appointmentId}/mark-missed`, {
        method: 'POST'
      })
      } else if (newStatus === 'Deferred') {
        response = await fetchWithAuth(`/appointment/${appointmentId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'Deferred' })
        })
      }

      if (response && response.ok) {
        const successMessages = {
          'Complete': 'Donation marked as complete! Donor has been awarded +100 points.',
          'Missed': 'Appointment marked as missed.',
          'Deferred': 'Appointment marked as deferred.'
        }
        alert(successMessages[newStatus] || 'Status updated successfully.')
        // Refresh donations list
        fetchDonations()
      } else {
        const error = await response?.json()
        alert('Failed to update status: ' + (error?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      alert('Failed to update appointment status. Please try again.')
    }
  }

  // Handle view medical history
  const handleViewMedicalHistory = (donation) => {
        const medicalHistoryWithInfo = {
          ...donation.medicalHistory,
          bloodType: donation.bloodType,
          age: donation.age,
          appointmentDate: donation.donationDate,
          appointmentTime: donation.appointmentTime
        }
    setSelectedMedicalHistory(medicalHistoryWithInfo)
    setSelectedDonorName(donation.donorName)
    setShowMedicalModal(true)
  }

  // Close medical history modal
  const closeMedicalModal = () => {
    setShowMedicalModal(false)
    setSelectedMedicalHistory(null)
    setSelectedDonorName("")
  }

  // Handle print
  const handlePrint = () => {
    const printContent = document.getElementById("printable-content")
    if (!printContent) return

    const originalContents = document.body.innerHTML

    // Add print styles to hide URL
    const printStyles = `
      <style>
        @media print {
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      </style>
    `

    document.body.innerHTML = printStyles + printContent.innerHTML
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload() // Reload to restore React functionality
  }

  // Question mapping for proper display
  const getQuestionText = (key) => {
    const questionMap = {
      // Step 2 Medical History Questions
      'q1': 'Have you donated blood before? If yes, indicate the date and place of last donation',
      'q2': 'Have you ever donated or attempted to donate blood using a different name here or anywhere else?',
      'q3': 'Have you for any reason been deferred as a blood donor or told not to donate blood?',
      
      // Step 3 Blood Donor Interview Questions - Section 0
      'section0_q1': 'Have you within the last eighteen (18) months had any of the following: high blood pressure, night sweats, unexplained fever, unexplained weight loss, persistent diarrhea?',
      
      // Step 3 Blood Donor Interview Questions - Section 1
      'section1_q2': 'Any of the following: malaria, hepatitis, jaundice, syphilis, chicken pox, shingles, cold sores, serious accident',
      'section1_q3': 'Under the doctor\'s care or had a major illness or surgery?',
      'section1_q4': 'Taken prohibited drugs or cocaine through your nose?',
      'section1_q5': 'Received blood taken clotting factors concentrates for a bleeding problem such as hemophilia and had an organ or tissue transplant or graft?',
      'section1_q6': 'A tattoo applied, ear piercing, acupuncture, accidental needle-stick or has come in contact with someone else\'s blood?',
      'section1_q7': 'Engaged in homosexual activity or received an injection other than proper medical supervision?',
      'section1_q8': 'In personal contact with anyone who had hepatitis?',
      'section1_q9': 'Given money or drugs to anyone to have sex with you or had sex with anyone who has taken money drugs for sex?',
      'section1_q10': 'Had a sexual partner who is bisexual or is a medically unsupervised user of intravenous drug or who has taken clotting factor concentrates for bleeding problem or who has AIDS or has had a positive test for the AIDS virus?',
      'section1_q11': 'To malaria endemic areas like Palawan and Mindoro.',
      'section1_q12': 'In jail or prison?',
      
      // Step 3 Blood Donor Interview Questions - Section 2
      'section2_q1': 'In the past four (4) weeks have you taken any medications such as Isotretinoin (Accutane) or finasteride (Proscar), etretinate (Tegison) for psoriasis, Feldence, aspirin or other medicines?',
      'section2_q2': 'Have you ever had any of the following: cancer, a blood disease or a bleeding problem, heart disease recent or severe respiratory disease, kidney disease, syphilis, diabetes, asthma, epilepsy, TB?',
      'section2_q3': 'Have you ever received human pituitary-derived growth hormone, a brain covering graft, an organ or tissue transplant or graft?',
      'section2_q4': 'Have you ever had a tooth extraction last week?',
      'section2_q5': 'Have you within the last twenty four hours (24) had an intake of alcohol? If yes, how much?',
      'section2_q6': 'Do you intend to ride /pilot an airplane within twenty four (24) hours?',
      'section2_q7': 'Do you intend to drive a heavy transport vehicle within the next twelve (12) hours?',
      'section2_q8': 'Are you currently suffering from any illness, allergy, infectious disease?',
      'section2_q9': 'Are you giving blood because you want to be tested for HIV or the AIDS virus?',
      'section2_q10': 'Are you aware that if you have the AIDS virus, you can give it to someone?',
      'section2_q11': 'Were you born in, have you lived in or have you traveled to any African country since 1977?',
      
      // Step 3 Blood Donor Interview Questions - Section 3 (SECTION III)
      'section3_q1': 'In the past four (4) weeks have you taken any medications such as Isotretinoin (Accutane) or finasteride (Proscar), etretinate (Tegison) for psoriasis, Feldence, aspirin or other medicines?',
      'section3_q2': 'Have you ever had any of the following: cancer, a blood disease or a bleeding problem, heart disease recent or severe respiratory disease, kidney disease, syphilis, diabetes, asthma, epilepsy, TB?',
      'section3_q3': 'Have you ever received human pituitary-derived growth hormone, a brain covering graft, an organ or tissue transplant or graft?',
      'section3_q4': 'Have you ever had a tooth extraction last week?',
      'section3_q5': 'Have you within the last twenty four hours (24) had an intake of alcohol? If yes, how much?',
      'section3_q6': 'Do you intend to ride /pilot an airplane within twenty four (24) hours?',
      'section3_q7': 'Do you intend to drive a heavy transport vehicle within the next twelve (12) hours?',
      'section3_q8': 'Are you currently suffering from any illness, allergy, infectious disease?',
      'section3_q9': 'Are you giving blood because you want to be tested for HIV or the AIDS virus?',
      'section3_q10': 'Are you aware that if you have the AIDS virus, you can give it to someone?',
      
      // Additional fields
      'lastDonationDate': 'Last Donation Date',
      'lastDonationPlace': 'Last Donation Place',
      'donationType': 'Donation Type'
    }
    
    return questionMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-4 sm:mb-6">List of Donations</h1>

      {/* Donation Summary - Moved to top */}
      <div className="mb-4 sm:mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Donation Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Total Donations</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-600">{filteredDonations.length}</p>
          </div>
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Scheduled Donations</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {filteredDonations
                .filter((donation) => donation.status === "Scheduled" || donation.status === "Pending")
                .length}
            </p>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Complete Donations</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {filteredDonations
                .filter((donation) => donation.status === "Complete" || donation.status === "Completed")
                .length}
            </p>
          </div>
          <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Deferred Donations</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">
              {filteredDonations
                .filter((donation) => donation.status === "Deferred")
                .length}
            </p>
          </div>
          <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Missed Donations</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {filteredDonations
                .filter((donation) => donation.status === "Missed")
                .length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search by donor name, ID or blood type..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
          <div className="flex items-center">
            <FaFilter className="mr-2 text-red-600 flex-shrink-0" />
            <select
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filterBloodType}
              onChange={(e) => setFilterBloodType(e.target.value)}
            >
              <option value="">All Blood Types</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="flex items-center">
            <select
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Complete">Complete</option>
              <option value="Missed">Missed</option>
              <option value="Deferred">Deferred</option>
            </select>
          </div>

          <button
            className="flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            onClick={toggleSortOrder}
          >
            {sortOrder === "asc" ? <FaSortAmountUp className="mr-2" /> : <FaSortAmountDown className="mr-2" />}
            <span className="whitespace-nowrap">{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading donations...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Donations Table - Desktop */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Blood Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Appointment Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDonations.length > 0 ? (
              filteredDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{donation.donorId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.donorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {donation.bloodType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.units}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.donationDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        donation.status === "Complete" || donation.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : donation.status === "Missed"
                            ? "bg-red-100 text-red-800"
                            : donation.status === "Deferred"
                              ? "bg-orange-100 text-orange-800"
                            : donation.status === "Pending" || donation.status === "Scheduled"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    <div className="flex flex-col gap-2 w-fit">
                      {/* View Medical History Button - Always visible */}
                        <button
                        onClick={() => handleViewMedicalHistory(donation)}
                        className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaEye className="w-3 h-3 mr-1" />
                        Medical History
                        </button>
                      
                      {/* Status Change Dropdown */}
                      {(donation.status !== "Complete" && donation.status !== "Completed" && donation.status !== "Missed" && donation.status !== "Deferred") ? (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(donation.id, e.target.value)
                              e.target.value = '' // Reset dropdown
                            }
                          }}
                          className="inline-flex items-center px-2 py-1 bg-gray-600 text-white text-xs font-semibold rounded hover:bg-gray-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 border-0"
                        >
                          <option value="">Change Status</option>
                          <option value="Complete">Mark Complete</option>
                          <option value="Missed">Mark Missed</option>
                          <option value="Deferred">Mark Deferred</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                          donation.status === "Missed"
                            ? "bg-red-100 text-red-700"
                            : donation.status === "Deferred"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                        }`}>
                          {donation.status === "Missed" ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Missed
                            </>
                          ) : donation.status === "Deferred" ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Deferred
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed
                            </>
                          )}
                      </span>
                    )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No donations found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

          {/* Donations Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {filteredDonations.length > 0 ? (
              filteredDonations.map((donation) => (
                <div key={donation.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
                  {/* Donor Info Header */}
                  <div className="flex items-start justify-between border-b pb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{donation.donorName}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {donation.donorId}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                        donation.status === "Complete" || donation.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : donation.status === "Missed"
                            ? "bg-red-100 text-red-800"
                            : donation.status === "Deferred"
                              ? "bg-orange-100 text-orange-800"
                            : donation.status === "Pending" || donation.status === "Scheduled"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </div>

                  {/* Donation Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Blood Type</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {donation.bloodType}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Units</p>
                      <p className="font-medium text-gray-900 mt-1">{donation.units}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs">Appointment Date</p>
                      <p className="font-medium text-gray-900 mt-1">{donation.donationDate}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t space-y-2">
                    {/* View Medical History Button */}
                    <button
                      onClick={() => handleViewMedicalHistory(donation)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <FaEye className="w-4 h-4 mr-2" />
                      View Medical History
                    </button>
                    
                    {/* Status Change Dropdown or Status Display */}
                    {(donation.status !== "Complete" && donation.status !== "Completed" && donation.status !== "Missed" && donation.status !== "Deferred") ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleStatusChange(donation.id, e.target.value)
                            e.target.value = '' // Reset dropdown
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        <option value="">Change Status</option>
                        <option value="Complete">Mark Complete</option>
                        <option value="Missed">Mark Missed</option>
                        <option value="Deferred">Mark Deferred</option>
                      </select>
                    ) : (
                      <div className={`w-full inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg ${
                        donation.status === "Missed" 
                          ? "bg-red-100 text-red-700"
                          : donation.status === "Deferred"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                      }`}>
                        {donation.status === "Missed" ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Missed
                          </>
                        ) : donation.status === "Deferred" ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Deferred
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Completed
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No donations found matching your criteria.</p>
              </div>
            )}
          </div>

        </>
      )}

      {/* Medical History Modal */}
      <AnimatePresence>
        {showMedicalModal && (
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
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between z-10">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <span className="hidden sm:inline">Answer Review</span>
                  <span className="sm:hidden">Review</span>
                </h3>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Print Review"
                  >
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={closeMedicalModal}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div ref={printRef} id="printable-content">
                {selectedMedicalHistory && Object.keys(selectedMedicalHistory).length > 0 ? (
                  <div className="p-4 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Medical History Review</h2>
                      <p className="text-sm sm:text-base text-gray-600 mt-2">Blood Donation Eligibility Check</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Donor: {selectedDonorName}</p>
                    </div>

                    {/* Donor Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">Donor Information</h3>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between text-xs sm:text-sm flex-wrap gap-1">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{selectedDonorName}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm flex-wrap gap-1">
                          <span className="text-gray-600">Blood Type:</span>
                          <span className="font-medium">{selectedMedicalHistory.bloodType || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm flex-wrap gap-1">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-medium">{selectedMedicalHistory.age || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm flex-wrap gap-1">
                          <span className="text-gray-600">Appointment Date:</span>
                          <span className="font-medium">
                            {selectedMedicalHistory.appointmentDate ? 
                              new Date(selectedMedicalHistory.appointmentDate).toLocaleDateString() : 
                              'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm flex-wrap gap-1">
                          <span className="text-gray-600">Appointment Time:</span>
                          <span className="font-medium">
                            {selectedMedicalHistory.appointmentTime || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Step 2 Medical History */}
                      {selectedMedicalHistory.step2 && Object.keys(selectedMedicalHistory.step2).length > 0 && (
                        <div className="border-b pb-6">
                          <h3 className="font-semibold text-gray-800 mb-4">Previous Donation History</h3>
                          <div className="space-y-3">
                            {Object.entries(selectedMedicalHistory.step2).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600">{getQuestionText(key)}</span>
                                <span className={`font-medium ${value === "Yes" && (key === "q2" || key === "q3") ? "text-red-600" : ""}`}>
                                  {value === null || value === undefined || value === '' ? 
                                    <span className="text-gray-400 italic">—</span> :
                                    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 3 Blood Donor Interview */}
                      {selectedMedicalHistory.step3 && Object.keys(selectedMedicalHistory.step3).length > 0 && (
                        <div className="border-b pb-6">
                          <h3 className="font-semibold text-gray-800 mb-4">Blood Donor Interview</h3>
                          
                          {/* SECTION I: CONDITION */}
                          <div className="border-b pb-4 mb-4">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              SECTION I: CONDITION
                            </h4>
                            <div className="space-y-3">
                              {Object.entries(selectedMedicalHistory.step3)
                                .filter(([key]) => key.startsWith('section0_'))
                                .map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{getQuestionText(key)}</span>
                                  <span className={`font-medium ${value === "Yes" && key.includes("q") ? "text-red-600" : ""}`}>
                                    {value === null || value === undefined || value === '' ? 
                                      <span className="text-gray-400 italic">—</span> :
                                      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SECTION II: In the past twelve (12) months */}
                          <div className="border-b pb-4 mb-4">
                            <h4 className="font-semibold text-gray-800 mb-4">SECTION II: In the past twelve (12) months have you ever had/ever been:</h4>
                            <div className="space-y-3">
                              {Object.entries(selectedMedicalHistory.step3)
                                .filter(([key]) => key.startsWith('section1_'))
                                .map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{getQuestionText(key)}</span>
                                  <span className={`font-medium ${value === "Yes" && key.includes("q") ? "text-red-600" : ""}`}>
                                    {value === null || value === undefined || value === '' ? 
                                      <span className="text-gray-400 italic">—</span> :
                                      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SECTION III */}
                          <div className="border-b pb-4 mb-4">
                            <h4 className="font-semibold text-gray-800 mb-4">SECTION III:</h4>
                            <div className="space-y-3">
                              {Object.entries(selectedMedicalHistory.step3)
                                .filter(([key]) => key.startsWith('section2_'))
                                .map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{getQuestionText(key)}</span>
                                  <span className={`font-medium ${value === "Yes" && key.includes("q") ? "text-red-600" : ""}`}>
                                    {value === null || value === undefined || value === '' ? 
                                      <span className="text-gray-400 italic">—</span> :
                                      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SECTION IV: FEMALE DONORS */}
                          <div className="border-b pb-4 mb-4">
                            <h4 className="font-semibold text-gray-800 mb-4">SECTION IV: FEMALE DONORS</h4>
                            <div className="space-y-3">
                              {Object.entries(selectedMedicalHistory.step3)
                                .filter(([key]) => key.startsWith('section3_'))
                                .map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{getQuestionText(key)}</span>
                                  <span className={`font-medium ${value === "Yes" && key.includes("q") ? "text-red-600" : ""}`}>
                                    {value === null || value === undefined || value === '' ? 
                                      <span className="text-gray-400 italic">—</span> :
                                      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Raw Medical History (if available) */}
                      {!selectedMedicalHistory.step2 && !selectedMedicalHistory.step3 && (
                        <div className="border-b pb-6">
                          <h3 className="font-semibold text-gray-800 mb-4">Medical Information</h3>
                          <div className="space-y-3">
                            {Object.entries(selectedMedicalHistory).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600">{getQuestionText(key)}</span>
                                <span className="font-medium">
                                  {value === null || value === undefined || value === '' ? 
                                    "Not answered" :
                                    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show message if no medical data */}
                      {(!selectedMedicalHistory.step2 || Object.keys(selectedMedicalHistory.step2).length === 0) && 
                       (!selectedMedicalHistory.step3 || Object.keys(selectedMedicalHistory.step3).length === 0) && (
                        <div className="text-center py-8">
                          <div className="text-yellow-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Incomplete Medical History</h3>
                          <p className="text-gray-500">
                            This donor has not completed their medical history assessment or the data is not properly structured.
            </p>
          </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
          </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical History Available</h3>
                    <p className="text-gray-500">
                      No medical history data is available for this donor.
            </p>
          </div>
                )}
        </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
                <button
                  onClick={closeMedicalModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
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

export default DonationList
