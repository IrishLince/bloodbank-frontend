"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa"
import { fetchWithAuth } from "../../utils/api"

const DonationList = () => {
  const [donations, setDonations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterBloodType, setFilterBloodType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch appointments/donations from backend
  useEffect(() => {
    fetchDonations()
  }, [])

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
            units: 1, // Default to 1 unit per appointment
            donationDate: appointment.appointmentDate ? 
              new Date(appointment.appointmentDate).toISOString().split('T')[0] : 
              appointment.dateToday || new Date().toISOString().split('T')[0],
            status: appointment.status || 'Pending',
            phoneNumber: appointment.phoneNumber,
            notes: appointment.notes
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

  // Handle mark appointment as missed
  const handleMarkMissed = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as missed? The donor will not receive points.')) {
      return
    }

    try {
      const response = await fetchWithAuth(`/appointment/${appointmentId}/mark-missed`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Appointment marked as missed.')
        // Refresh donations list
        fetchDonations()
      } else {
        const error = await response.json()
        alert('Failed to mark as missed: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error marking appointment as missed:', error)
      alert('Failed to mark appointment as missed. Please try again.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-red-600 mb-6">List of Donations</h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search by donor name, ID or blood type..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center">
            <FaFilter className="mr-2 text-red-600" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Complete">Complete</option>
              <option value="Missed">Missed</option>
            </select>
          </div>

          <button
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            onClick={toggleSortOrder}
          >
            {sortOrder === "asc" ? <FaSortAmountUp className="mr-2" /> : <FaSortAmountDown className="mr-2" />}
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
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
          {/* Donations Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
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
                Donation Date
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
                            : donation.status === "Pending" || donation.status === "Scheduled"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(donation.status !== "Complete" && donation.status !== "Completed" && donation.status !== "Missed") ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkComplete(donation.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleMarkMissed(donation.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Mark Missed
                        </button>
                      </div>
                    ) : donation.status === "Missed" ? (
                      <span className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 text-xs font-semibold rounded-md">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Missed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-md">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed
                      </span>
                    )}
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

      {/* Summary */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Donation Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Donations</p>
            <p className="text-2xl font-bold text-red-600">{filteredDonations.length}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Units</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredDonations.reduce((total, donation) => total + donation.units, 0)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Pending Donations</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredDonations
                .filter((donation) => donation.status === "Pending" || donation.status === "Scheduled")
                .reduce((total, donation) => total + donation.units, 0)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Complete Donations</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredDonations
                .filter((donation) => donation.status === "Complete" || donation.status === "Completed")
                .reduce((total, donation) => total + donation.units, 0)}
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default DonationList
