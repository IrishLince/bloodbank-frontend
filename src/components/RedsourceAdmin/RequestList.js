import React, { useState } from 'react';
import { 
  FiCheckCircle, 
  FiPackage, 
  FiClock,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiCalendar,
  FiArrowRight,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom'
import { IoIosArrowBack } from 'react-icons/io'
import Header from '../Header'

const RequestList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'requestDate', direction: 'desc' });
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showValidateVoucherModal, setShowValidateVoucherModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [validationCode, setValidationCode] = useState('');
  const [validationStatus, setValidationStatus] = useState(null);

  const navigate = useNavigate()
  const location = useLocation()
  const { selectedHospital } = location.state || {}

  if (!selectedHospital) {
    return <div className="min-h-screen bg-white flex flex-col">No Hospital Selected</div>
  }

  const generateRequests = (bloodTypes) => {
    return bloodTypes.split(', ').map(bloodType => ({
      bloodType,
      units: Math.floor(Math.random() * 5) + 1,
      requestDate: new Date().toISOString().split('T')[0]
    }))
  }

  const requests = generateRequests(selectedHospital.bloodTypes)

  // Blood bank info
  const bloodBankName = "City Blood Bank";

  // Mock blood bag requests data from donors
  const pendingRequests = [
    { 
      id: "REQ-001", 
      donorId: "D-4578",
      donorName: "Irish Lince",
      donorContact: "09123456789",
      status: "Pending", 
      requestDate: "2024-04-18", 
      units: 1, 
      pointsUsed: 100,
      bloodType: "O+"
    },
    { 
      id: "REQ-002", 
      donorId: "D-3692",
      donorName: "Jane Smith",
      donorContact: "09987654321",
      status: "Pending", 
      requestDate: "2024-04-17", 
      units: 2, 
      pointsUsed: 200,
      bloodType: "A-"
    },
    { 
      id: "REQ-003", 
      donorId: "D-5123",
      donorName: "Mark Johnson",
      donorContact: "09456789123",
      status: "Accepted", 
      requestDate: "2024-04-15", 
      units: 1, 
      pointsUsed: 100,
      bloodType: "AB+",
      acceptedBy: "City Blood Bank",
      acceptedDate: "2024-04-16",
      validationCode: "REQ-003-657890"
    },
    { 
      id: "REQ-004", 
      donorId: "D-4211",
      donorName: "Sarah Williams",
      donorContact: "09321654987",
      status: "Complete", 
      requestDate: "2024-04-10", 
      units: 1, 
      pointsUsed: 100,
      bloodType: "B+",
      acceptedBy: "City Blood Bank",
      acceptedDate: "2024-04-11",
      completedDate: "2024-04-14",
      validationCode: "REQ-004-123456"
    }
  ];

  // Filter requests based on search term and status
  const filteredRequests = pendingRequests.filter(request => {
    return (
      (searchTerm === '' || 
        request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.donorId.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'All' || request.status === filterStatus)
    );
  });

  // Sort function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Handle accepting a request
  const handleAccept = (request) => {
    setSelectedRequest(request);
    setShowAcceptModal(true);
  };

  // Handle confirming acceptance
  const handleConfirmAccept = () => {
    // In a real app, this would make an API call to accept the request
    setShowAcceptModal(false);

    // Update the request status (in a real app, this would be done through API)
    // For demo purpose, we're just logging the acceptance
  };

  // Handle validating a voucher
  const handleValidateVoucher = () => {
    setShowValidateVoucherModal(true);
  };

  // Handle voucher validation submission
  const handleSubmitValidation = () => {
    // In a real app, this would make an API call to validate the voucher
    const matchingRequest = pendingRequests.find(request => 
      request.validationCode === validationCode && request.status === "Accepted"
    );
    
    if (matchingRequest) {
      setValidationStatus({
        status: 'valid',
        request: matchingRequest
      });
    } else {
      setValidationStatus({
        status: 'invalid',
        message: 'Invalid validation code or voucher already redeemed'
      });
    }
  };

  // Handle completing a voucher
  const handleCompleteVoucher = () => {
    // In a real app, this would make an API call to mark the voucher as complete
    
    // Reset validation state
    setValidationStatus(null);
    setValidationCode('');
    setShowValidateVoucherModal(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Accepted': return 'bg-blue-100 text-blue-800';
      case 'Complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get formatted date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Modal for accepting request
  const renderAcceptModal = () => {
    if (!selectedRequest) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="bg-gradient-to-r from-red-700 to-red-500 px-6 py-4 rounded-t-lg">
            <h3 className="text-lg font-medium text-white">Accept Blood Bag Request</h3>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <FiPackage className="text-red-600 w-16 h-16 mb-3" />
              <p className="text-center text-gray-700 mb-2">
                You are accepting a blood bag request from:
              </p>
              <p className="text-center font-bold text-lg text-gray-900">
                {selectedRequest.donorName}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Donor ID:</span>
                <span className="font-medium">{selectedRequest.donorId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Blood Type:</span>
                <span className="font-medium">{selectedRequest.bloodType}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Units:</span>
                <span className="font-medium">{selectedRequest.units}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Request Date:</span>
                <span className="font-medium">{formatDate(selectedRequest.requestDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                <span className="font-medium">{selectedRequest.donorContact}</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="text-sm text-yellow-800">
                By accepting this request, you are committing to provide a blood bag to this donor.
                The donor will receive a voucher to claim the blood bag from your blood bank.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="px-4 py-2 border rounded text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Accept Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal for validating a voucher
  const renderValidateVoucherModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="bg-gradient-to-r from-red-700 to-red-500 px-6 py-4 rounded-t-lg">
            <h3 className="text-lg font-medium text-white">Validate Blood Bag Voucher</h3>
          </div>
          
          <div className="p-6">
            {!validationStatus ? (
              <>
                <div className="flex flex-col items-center justify-center mb-6">
                  <FiPackage className="text-red-600 w-16 h-16 mb-3" />
                  <p className="text-center text-gray-700 mb-2">
                    Enter the validation code from the donor's voucher
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Validation Code</label>
                  <input
                    type="text"
                    value={validationCode}
                    onChange={(e) => setValidationCode(e.target.value)}
                    placeholder="e.g. REQ-003-123456"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <p className="text-sm text-blue-800">
                    The validation code can be found on the donor's printed voucher.
                    Ask the donor to present their voucher along with a valid ID.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowValidateVoucherModal(false)}
                    className="px-4 py-2 border rounded text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitValidation}
                    disabled={!validationCode.trim()}
                    className={`px-4 py-2 ${validationCode.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'} text-white rounded`}
                  >
                    Validate
                  </button>
                </div>
              </>
            ) : validationStatus.status === 'valid' ? (
              <>
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <FiCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Valid Voucher</h3>
                  <p className="text-center text-gray-600 mt-1">
                    This voucher is valid and can be redeemed
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Donor Name:</span>
                    <span className="font-medium">{validationStatus.request.donorName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Donor ID:</span>
                    <span className="font-medium">{validationStatus.request.donorId}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Blood Type:</span>
                    <span className="font-medium">{validationStatus.request.bloodType}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Units:</span>
                    <span className="font-medium">{validationStatus.request.units}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Request Date:</span>
                    <span className="font-medium">{formatDate(validationStatus.request.requestDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium">{validationStatus.request.donorContact}</span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                  <p className="text-sm text-green-800">
                    Please provide the donor with the requested blood bag(s). Once completed, mark this voucher as redeemed.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setValidationStatus(null);
                      setValidationCode('');
                    }}
                    className="px-4 py-2 border rounded text-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCompleteVoucher}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark as Completed
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <FiAlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Invalid Voucher</h3>
                  <p className="text-center text-gray-600 mt-1">
                    {validationStatus.message}
                  </p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                  <p className="text-sm text-red-800">
                    This voucher code is invalid or has already been redeemed. Please verify the code and try again,
                    or ask the donor to provide the correct voucher.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setValidationStatus(null);
                      setValidationCode('');
                    }}
                    className="px-4 py-2 border rounded text-gray-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      setValidationStatus(null);
                      setValidationCode('');
                      setShowValidateVoucherModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

};

export default RequestList;
