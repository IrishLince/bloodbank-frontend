"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa"

const DonationList = () => {
  const [donations, setDonations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterBloodType, setFilterBloodType] = useState("")

  // Mock data - in a real application, this would come from an API
  useEffect(() => {
    const mockDonations = [
      {
        id: 1,
        donorName: "Derick Rose",
        donorId: "D001",
        bloodType: "A+",
        units: 2,
        donationDate: "2023-05-10",
        status: "Complete",
      },
      {
        id: 2,
        donorName: "Lebron James",
        donorId: "D002",
        bloodType: "O-",
        units: 1,
        donationDate: "2023-05-12",
        status: "Complete",
      },
      {
        id: 3,
        donorName: "Michael Jordan",
        donorId: "D003",
        bloodType: "B+",
        units: 3,
        donationDate: "2023-05-15",
        status: "Pending",
      },
      {
        id: 4,
        donorName: "Anthony Davis",
        donorId: "D004",
        bloodType: "AB+",
        units: 1,
        donationDate: "2023-05-18",
        status: "Pending",
      },
      {
        id: 5,
        donorName: "Luka Doncic",
        donorId: "D005",
        bloodType: "A-",
        units: 2,
        donationDate: "2023-05-20",
        status: "Complete",
      },
      {
        id: 6,
        donorName: "Tyrese Haliburton",
        donorId: "D006",
        bloodType: "O+",
        units: 1,
        donationDate: "2023-05-22",
        status: "Pending",
      },
      {
        id: 7,
        donorName: "Irish Lince",
        donorId: "D007",
        bloodType: "B-",
        units: 2,
        donationDate: "2023-05-25",
        status: "Complete",
      },
      {
        id: 8,
        donorName: "Isaac Newton",
        donorId: "D008",
        bloodType: "AB-",
        units: 1,
        donationDate: "2023-05-28",
        status: "Complete",
      },
    ]
    setDonations(mockDonations)
  }, [])

  // Filter and sort donations
  const filteredDonations = donations
    .filter((donation) => {
      const matchesSearch =
        donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.donorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.bloodType.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesBloodType = filterBloodType === "" || donation.bloodType === filterBloodType

      return matchesSearch && matchesBloodType
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

          <button
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            onClick={toggleSortOrder}
          >
            {sortOrder === "asc" ? <FaSortAmountUp className="mr-2" /> : <FaSortAmountDown className="mr-2" />}
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </button>
        </div>
      </div>

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
                        donation.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : donation.status === "Testing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
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
            <p className="text-sm text-gray-600">Available Units</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredDonations
                .filter((donation) => donation.status === "Available")
                .reduce((total, donation) => total + donation.units, 0)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Pending Units</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredDonations
                .filter((donation) => donation.status === "Testing" || donation.status === "Processed")
                .reduce((total, donation) => total + donation.units, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonationList
