import React, { useState } from 'react';
import { 
  X, 
  Droplet, 
  Calendar,
  Clock, 
  AlertTriangle,
  Building,
  CheckCircle,
  User,
  Phone,
  FileText,
  Download,
  Truck,
  Edit
} from 'lucide-react';

export default function ViewRequests({ hospital, onClose }) {
  // State for expanded details
  const [expandedDetails, setExpandedDetails] = useState(null);
  // State for tracking which requests are selected via checkboxes
  const [selectedRequests, setSelectedRequests] = useState([]);
  // State for showing view details
  const [showViewDelivery, setShowViewDelivery] = useState(false);
  // State for showing update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // State for showing schedule confirmation
  const [showScheduleConfirmation, setShowScheduleConfirmation] = useState(false);
  // State for tracking if schedule button is enabled
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  // State for showing approve confirmation
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  // State for the request being approved
  const [requestToApprove, setRequestToApprove] = useState(null);
  
  // State for tracking confirmation dialogs
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestToSchedule, setRequestToSchedule] = useState(null);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [requestToUpdate, setRequestToUpdate] = useState(null);
  
  // State for bulk confirmation dialog
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState([]);
  
  // State for tracking updated requests
  const [requests, setRequests] = useState([
    {
      id: "REQ-1001",
      bloodType: "O+",
      units: 2,
      requestedBy: "Dr. Sarah Johnson",
      contactNumber: "(555) 234-5678",
      requestDate: "2023-08-15",
      status: "Pending",
      notes: "Required for emergency surgery scheduled tomorrow morning."
    },
    {
      id: "REQ-1005",
      bloodType: "A+",
      units: 3,
      requestedBy: "Dr. Thomas Rivera",
      contactNumber: "(555) 123-4567",
      requestDate: "2023-08-18",
      status: "Pending",
      notes: "Patient undergoing major surgery requires blood transfusion during procedure."
    },
    {
      id: "REQ-1006",
      bloodType: "B-",
      units: 1,
      requestedBy: "Dr. Jessica Patel",
      contactNumber: "(555) 987-6543",
      requestDate: "2023-08-19",
      status: "Pending",
      notes: "Anemic patient requires transfusion. Urgent but not emergency."
    },
    {
      id: "REQ-1009",
      bloodType: "O-",
      units: 4,
      requestedBy: "Dr. Mark Williams",
      contactNumber: "(555) 555-5555",
      requestDate: "2023-08-20",
      status: "Pending",
      notes: "Multiple trauma patient in critical condition. High priority."
    },
    {
      id: "REQ-1012",
      bloodType: "AB+",
      units: 2,
      requestedBy: "Dr. Lisa Chen",
      contactNumber: "(555) 222-3333",
      requestDate: "2023-08-20",
      status: "Pending",
      notes: "Scheduled transfusion for chronic condition patient."
    },
    {
      id: "REQ-1002",
      bloodType: "A-",
      units: 3,
      requestedBy: "Dr. Michael Chen",
      contactNumber: "(555) 876-5432",
      requestDate: "2023-08-16",
      status: "Scheduled",
      notes: "Needed for scheduled transfusion next week."
    },
    {
      id: "REQ-1003",
      bloodType: "B+",
      units: 1,
      requestedBy: "Dr. Emily Roberts",
      contactNumber: "(555) 345-6789",
      requestDate: "2023-08-17",
      status: "In Transit",
      notes: "Patient with severe anemia requires immediate transfusion."
    },
    {
      id: "REQ-1004",
      bloodType: "AB-",
      units: 2,
      requestedBy: "Dr. James Wilson",
      contactNumber: "(555) 777-8888",
      requestDate: "2023-08-14",
      status: "Complete",
      notes: "Successful transfusion completed."
    }
  ]);
  
  if (!hospital) return null;
  
  // Filter requests based on hospital's delivery status
  const filteredRequests = requests.filter(request => {
    if (hospital.deliveryStatus === "Pending") {
      return request.status === "Pending";
    } else if (hospital.deliveryStatus === "Scheduled") {
      return request.status === "Scheduled";
    } else if (hospital.deliveryStatus === "In Transit") {
      return request.status === "In Transit";
    } else if (hospital.deliveryStatus === "Complete") {
      return request.status === "Complete";
    }
    return false;
  });
  
  // Toggle details view
  const handleToggleDetails = (requestId) => {
    if (expandedDetails === requestId) {
      setExpandedDetails(null);
    } else {
      setExpandedDetails(requestId);
    }
  };
  
  // Handle approve request
  const handleApprove = (requestId) => {
    setRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestId
          ? {...request, status: "Scheduled"}
          : request
      )
    );
    alert(`Request ${requestId} has been approved`);
  };
  
  
  // Open update confirmation
  const openUpdateConfirmation = (request) => {
    setRequestToUpdate(request);
    setShowUpdateConfirmation(true);
  };
  
  // Handle update to Approved
  const handleUpdateToApproved = () => {
    if (!requestToUpdate) return;
    
    setRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestToUpdate.id
          ? {...request, status: "Pending"}
          : request
      )
    );
    
    setShowUpdateConfirmation(false);
    setRequestToUpdate(null);
    alert(`Request ${requestToUpdate.id} has been updated to Pending`);
  };
  
  
  // Open schedule delivery confirmation
  const openScheduleConfirmation = (request) => {
    setRequestToSchedule(request);
    setShowConfirmation(true);
  };
  
  // Handle schedule delivery confirmation
  const handleScheduleDelivery = () => {
    if (!requestToSchedule) return;
    
    setRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestToSchedule.id
          ? {...request, status: "In Transit"}
          : request
      )
    );
    
    setShowConfirmation(false);
    setRequestToSchedule(null);
    alert(`Delivery for request ${requestToSchedule.id} has been scheduled`);
  };
  
  // Get status badge color
  const getStatusBadge = (status) => {
    switch(status.toLowerCase()) {
      case 'scheduled': 
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'complete': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'scheduled':
      case 'approved': 
      case 'complete': return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'in transit': return <Truck className="w-3 h-3 mr-1" />;
      case 'pending':
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };
  
  // Get blood type badge
  const getBloodTypeBadge = (bloodType) => {
    let bgColor;
    
    if (bloodType.includes('O-')) bgColor = 'bg-red-100 text-red-800';
    else if (bloodType.includes('O+')) bgColor = 'bg-red-50 text-red-800';
    else if (bloodType.includes('A-')) bgColor = 'bg-blue-100 text-blue-800';
    else if (bloodType.includes('A+')) bgColor = 'bg-blue-50 text-blue-800';
    else if (bloodType.includes('B-')) bgColor = 'bg-green-100 text-green-800';
    else if (bloodType.includes('B+')) bgColor = 'bg-green-50 text-green-800';
    else if (bloodType.includes('AB-')) bgColor = 'bg-purple-100 text-purple-800';
    else if (bloodType.includes('AB+')) bgColor = 'bg-purple-50 text-purple-800';
    else bgColor = 'bg-gray-100 text-gray-800';
    
    return bgColor;
  };
  
  // Toggle selection of a request
  const toggleRequestSelection = (requestId) => {
    setSelectedRequests(prev => {
      if (prev.includes(requestId)) {
        return prev.filter(id => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };
  
  // Handle approve confirmation
  const handleApproveConfirm = () => {
    if (!requestToApprove) return;
    
    setRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestToApprove.id
          ? {...request, status: "Scheduled"}
          : request
      )
    );
    
    setShowApproveConfirmation(false);
    setRequestToApprove(null);
    alert(`Request ${requestToApprove.id} has been approved`);
    
    // Create a blood type summary similar to bulk approval
    const bloodTypeSummary = {};
    bloodTypeSummary[requestToApprove.bloodType] = requestToApprove.units;
    
    // Convert blood type summary to string
    const summaryStr = Object.entries(bloodTypeSummary)
      .map(([type, units]) => `${type}:${units}`)
      .join(',');
    
    // Build URL with parameters using URLSearchParams for consistency
    const params = new URLSearchParams();
    params.append('bloodTypeSummary', summaryStr);
    params.append('totalUnits', requestToApprove.units);
    params.append('requestId', requestToApprove.id);
    
    // Add hospital information to the URL
    if (hospital) {
      params.append('hospitalName', hospital.name);
      params.append('hospitalLocation', hospital.location);
      params.append('hospitalContact', hospital.phone);
    }
    
    window.location.href = `/schedule?${params.toString()}`;
  };
  
  // Handle bulk approve of selected requests
  const handleBulkApprove = () => {
    if (selectedRequests.length === 0) {
      alert("Please select at least one request to approve");
      return;
    }
    
    // Get details of selected requests for confirmation
    const details = requests.filter(req => selectedRequests.includes(req.id));
    setSelectedRequestDetails(details);
    setShowBulkConfirmation(true);
  };
  
  
  // Handle bulk confirmation
  const handleBulkConfirm = () => {
    setRequests(prevRequests => 
      prevRequests.map(request => 
        selectedRequests.includes(request.id)
          ? {...request, status: "Scheduled"}
          : request
      )
    );
    
    alert(`${selectedRequests.length} request(s) have been approved`);
    
    // Calculate blood type summary and total units
    const bloodTypeSummary = {};
    let totalUnits = 0;
    
    selectedRequestDetails.forEach(request => {
      bloodTypeSummary[request.bloodType] = (bloodTypeSummary[request.bloodType] || 0) + request.units;
      totalUnits += request.units;
    });
    
    // Convert blood type summary to string
    const summaryStr = Object.entries(bloodTypeSummary)
      .map(([type, units]) => `${type}:${units}`)
      .join(',');
    
    // Build URL with parameters
    const params = new URLSearchParams();
    params.append('bloodTypeSummary', summaryStr);
    params.append('totalUnits', totalUnits);
    params.append('requestIds', selectedRequests.join(','));
    
    // Add hospital information to the URL
    if (hospital) {
      params.append('hospitalName', hospital.name);
      params.append('hospitalLocation', hospital.location);
      params.append('hospitalContact', hospital.phone);
    }
    
    window.location.href = `/schedule?${params.toString()}`;
    
    setSelectedRequests([]);
    setShowBulkConfirmation(false);
    setSelectedRequestDetails([]);
  };
  
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-red-50">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Building className="mr-2 text-[#C91C1C]" /> Blood Requests - {hospital.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Hospital Info with Status */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">Hospital Information</p>
              <h3 className="font-medium text-lg">{hospital.name}</h3>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <Phone className="w-4 h-4 mr-1.5 text-gray-400" /> {hospital.phone}
              </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end">
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center border ${getStatusBadge(hospital.deliveryStatus)}`}>
                {getStatusIcon(hospital.deliveryStatus)}
                {hospital.deliveryStatus}
              </span>
            </div>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {filteredRequests.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div className="flex items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-lg text-gray-800 mr-3">{request.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center border ${getStatusBadge(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                          Requested on {request.requestDate}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Details Button (for all statuses) */}
                      <button 
                        onClick={() => handleToggleDetails(request.id)}
                        className={`px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center shadow-sm ${
                          expandedDetails === request.id ? 'bg-blue-700' : ''
                        }`}
                      >
                        <FileText className="w-4 h-4 mr-1.5" /> Details
                      </button>
                      
                      
                      {/* Disabled Button (for In Transit) */}
                      {request.status === 'In Transit' && (
                        <button 
                          disabled
                          className="px-3 py-1.5 text-sm bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-70 flex items-center shadow-sm"
                        >
                          <Truck className="w-4 h-4 mr-1.5" /> In Transit
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Expandable Details Section */}
                  {expandedDetails === request.id && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Blood Type & Units</p>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium mr-3 ${getBloodTypeBadge(request.bloodType)}`}>
                            <Droplet className="mr-1.5 w-4 h-4" />
                            {request.bloodType}
                          </span>
                          <span className="text-lg font-medium">{request.units} unit{request.units > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Requested By</p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1.5 text-gray-400" />
                          <span>{request.requestedBy}</span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-1.5 text-gray-400" />
                          <span>{request.contactNumber}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{request.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No {hospital.deliveryStatus} Blood Requests</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                This hospital currently has no {hospital.deliveryStatus.toLowerCase()} blood requests.
              </p>
            </div>
          )}
        </div>
        
        {/* Footer with Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div></div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-[#C91C1C] rounded-lg hover:bg-[#b01818] transition-colors"
          >
            Close
          </button>
        </div>
        
        {/* Confirmation Dialog for Schedule Delivery */}
        {showConfirmation && requestToSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-3">Schedule Delivery Confirmation</h3>
              <p className="mb-4">
                Are you sure you want to schedule delivery for request <strong>{requestToSchedule.id}</strong>?
              </p>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <div className="flex items-center text-blue-800">
                  <Droplet className="w-4 h-4 mr-2" />
                  <span className="font-medium">{requestToSchedule.bloodType}</span>
                  <span className="mx-2">•</span>
                  <span>{requestToSchedule.units} unit{requestToSchedule.units > 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">For {requestToSchedule.requestedBy}</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setRequestToSchedule(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleDelivery}
                  className="px-4 py-2 text-white bg-[#C91C1C] rounded-lg hover:bg-[#b01818]"
                >
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Approve Confirmation Dialog */}
        {showApproveConfirmation && requestToApprove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Blood Request Approval</h3>
              
              <div className="mb-4">
                <div className="bg-gray-50 p-4 rounded-md mb-3">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      checked={true} 
                      className="mt-1 mr-3" 
                      readOnly
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{requestToApprove.id}</p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getBloodTypeBadge(requestToApprove.bloodType)}`}>
                          <Droplet className="mr-1 w-3 h-3" /> {requestToApprove.bloodType}
                        </span>
                        <span className="ml-2 text-sm">{requestToApprove.units} unit{requestToApprove.units > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Requested by: {requestToApprove.requestedBy}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{requestToApprove.requestDate}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleApproveConfirm}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Approved
                </button>
              </div>
            </div>
          </div>
        )}
        
        
        {/* Bulk Action Confirmation Dialog */}
        {showBulkConfirmation && selectedRequestDetails.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Approve Blood Requests
              </h3>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to approve the following {selectedRequestDetails.length} request(s)?
                </p>
                
                <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 mb-3">
                  {selectedRequestDetails.map((request) => (
                    <div key={request.id} className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-start">
                        <input 
                          type="checkbox" 
                          checked={true} 
                          className="mt-1 mr-3" 
                          readOnly
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{request.id}</p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getBloodTypeBadge(request.bloodType)}`}>
                              <Droplet className="mr-1 w-3 h-3" /> {request.bloodType}
                            </span>
                            <span className="ml-2 text-sm">{request.units} unit{request.units > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkConfirmation(false);
                    setSelectedRequestDetails([]);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkConfirm}
                  className="px-4 py-2 text-white rounded transition-colors bg-green-600 hover:bg-green-700"
                >
                  Approve All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 