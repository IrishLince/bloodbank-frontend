import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiCalendar,
  FiUser,
  FiArrowRight,
  FiCheck,
  FiArrowLeft,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiPackage,
  FiFilter,
  FiInfo
} from 'react-icons/fi';

// Status card component
const StatusCard = ({ title, count, icon, bgColor, textColor }) => (
  <div className="bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
      <div className={`p-3 ${bgColor} rounded-full`}>
        {icon}
      </div>
    </div>
  </div>
);

// Table header component with sorting functionality
const SortableTableHeader = ({ title, column, sortConfig, onSort }) => (
  <th 
    scope="col" 
    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
    onClick={() => onSort(column)}
    aria-sort={
      sortConfig.key === column 
        ? sortConfig.direction === 'asc' ? 'ascending' : 'descending' 
        : 'none'
    }
  >
    <div className="flex items-center">
      {title}
      {sortConfig.key === column && (
        sortConfig.direction === 'asc' 
          ? <FiChevronUp className="ml-1" aria-hidden="true" /> 
          : <FiChevronDown className="ml-1" aria-hidden="true" />
      )}
    </div>
  </th>
);

// Empty state component
const EmptyState = ({ searchTerm }) => (
  <div className="text-center py-12">
    <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
    <h3 className="text-lg font-medium text-gray-500">No blood bag requests found</h3>
    <p className="mt-2 text-sm text-gray-400">
      {searchTerm ? 'Try adjusting your search or filter criteria' : 'There are no requests at this time'}
    </p>
  </div>
);

// Accept modal component
const AcceptModal = ({ request, onConfirm, onCancel }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
    role="dialog" 
    aria-labelledby="accept-modal-title"
    aria-modal="true"
  >
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
        <h3 id="accept-modal-title" className="text-lg font-medium">Accept Blood Bag Request</h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Close dialog"
        >
          <FiX size={20} />
        </button>
      </div>
      
      <div className="p-6">
        <div className="mb-4 text-center">
          <div className="inline-flex items-center justify-center bg-blue-100 w-16 h-16 rounded-full text-blue-600 mb-4">
            <FiCheckCircle size={30} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Confirm Request Acceptance</h3>
          <p className="text-gray-600">
            Are you sure you want to accept the blood bag request from <strong>{request?.donorName}</strong>?
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Request ID</p>
              <p className="font-medium">{request?.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Donor ID</p>
              <p className="font-medium">{request?.donorId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Blood Type</p>
              <p className="font-medium">{request?.bloodType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Units</p>
              <p className="font-medium">{request?.units}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm Acceptance
          </button>
        </div>
      </div>
    </div>
  </div>
);

const BloodBagRequests = ({ 
  pendingRequests, 
  setPendingRequests, 
  setView, 
  setShowValidationModal, 
  formatDate, 
  getRequestStatusColor 
}) => {
  // State
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [requestSortConfig, setRequestSortConfig] = useState({ key: 'requestDate', direction: 'desc' });
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  
  // Handle sorting for requests
  const requestSort = useCallback((key) => {
    setRequestSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);
  
  // Filter and sort requests with useMemo for performance
  const filteredRequests = useMemo(() => {
    return pendingRequests.filter(request => {
      const matchesSearch = requestSearchTerm === '' || 
        request.id.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
        request.donorName.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
        request.donorId.toLowerCase().includes(requestSearchTerm.toLowerCase());
        
      const matchesStatus = filterStatus === 'All' || request.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [pendingRequests, requestSearchTerm, filterStatus]);
  
  // Sort requests with useMemo
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      if (a[requestSortConfig.key] < b[requestSortConfig.key]) {
        return requestSortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[requestSortConfig.key] > b[requestSortConfig.key]) {
        return requestSortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredRequests, requestSortConfig]);
  
  // Counts for summary cards
  const requestCounts = useMemo(() => {
    return {
      pending: pendingRequests.filter(req => req.status === "Pending").length,
      accepted: pendingRequests.filter(req => req.status === "Accepted").length,
      complete: pendingRequests.filter(req => req.status === "Complete").length
    };
  }, [pendingRequests]);
  
  // Handle accept request
  const handleAccept = useCallback((request) => {
    setCurrentRequest(request);
    setShowAcceptModal(true);
  }, []);
  
  // Handle confirm accept
  const handleConfirmAccept = useCallback(() => {
    if (!currentRequest) return;
    
    setPendingRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === currentRequest.id ? { ...req, status: 'Accepted' } : req
      )
    );
    
    setShowAcceptModal(false);
    setCurrentRequest(null);
  }, [currentRequest, setPendingRequests]);
  
  // Handle search input change with debounce
  const handleSearchChange = useCallback((e) => {
    setRequestSearchTerm(e.target.value);
  }, []);
  
  // Handle filter change
  const handleFilterChange = useCallback((e) => {
    setFilterStatus(e.target.value);
  }, []);
  
  // Handle back button click
  const handleBackClick = useCallback(() => {
    setView('inventory');
  }, [setView]);
  
  // Handle validate voucher click
  const handleValidateClick = useCallback(() => {
    setShowValidationModal(true);
  }, [setShowValidationModal]);
  
  return (
    <main className="flex-grow max-w-[1920px] mx-auto px-6 py-8">
      {/* Header with title and actions */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blood Bag Requests</h1>
          <p className="text-gray-600">View and manage blood bag requests from donors</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={handleBackClick}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg flex items-center shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            aria-label="Back to inventory"
          >
            <FiArrowLeft className="mr-2" aria-hidden="true" />
            Back to Inventory
          </button>
          <button 
            onClick={handleValidateClick}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center shadow-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            aria-label="Validate donor voucher"
          >
            <FiCheck className="mr-2" aria-hidden="true" />
            Validate Donor Voucher
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusCard 
          title="Pending Requests" 
          count={requestCounts.pending} 
          icon={<FiClock className="text-yellow-600 text-xl" />}
          bgColor="bg-yellow-100"
          textColor="text-yellow-600"
        />
        
        <StatusCard 
          title="Accepted Requests" 
          count={requestCounts.accepted} 
          icon={<FiCheckCircle className="text-blue-600 text-xl" />}
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
        
        <StatusCard 
          title="Completed Requests" 
          count={requestCounts.complete} 
          icon={<FiCheckCircle className="text-green-600 text-xl" />}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by ID, donor name or donor ID..."
              value={requestSearchTerm}
              onChange={handleSearchChange}
              className="w-full p-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Search requests"
            />
            <FiSearch className="absolute left-2.5 top-2.5 text-gray-400" aria-hidden="true" />
          </div>
          
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-400" aria-hidden="true" />
            <select
              value={filterStatus}
              onChange={handleFilterChange}
              className="border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Filter by status"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Complete">Complete</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200" aria-label="Blood bag requests">
            <thead className="bg-gray-50">
              <tr>
                <SortableTableHeader 
                  title="Request ID" 
                  column="id" 
                  sortConfig={requestSortConfig} 
                  onSort={requestSort} 
                />
                <SortableTableHeader 
                  title="Donor" 
                  column="donorName" 
                  sortConfig={requestSortConfig} 
                  onSort={requestSort} 
                />
                <SortableTableHeader 
                  title="Blood Type" 
                  column="bloodType" 
                  sortConfig={requestSortConfig} 
                  onSort={requestSort} 
                />
                <SortableTableHeader 
                  title="Units" 
                  column="units" 
                  sortConfig={requestSortConfig} 
                  onSort={requestSort} 
                />
                <SortableTableHeader 
                  title="Request Date" 
                  column="requestDate" 
                  sortConfig={requestSortConfig} 
                  onSort={requestSort} 
                />
                <SortableTableHeader 
                  title="Status" 
                  column="status" 
                  sortConfig={requestSortConfig} 
                  onSort={requestSort} 
                />
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-red-600" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{request.donorName}</div>
                        <div className="text-sm text-gray-500">{request.donorId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-medium">{request.bloodType}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.units}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1 text-gray-400" aria-hidden="true" />
                      {formatDate(request.requestDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRequestStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {request.status === 'Pending' ? (
                      <button 
                        onClick={() => handleAccept(request)}
                        className="text-blue-600 hover:text-blue-800 flex items-center justify-end w-full transition-colors focus:outline-none focus:underline"
                        aria-label={`Accept request from ${request.donorName}`}
                      >
                        <span>Accept</span>
                        <FiArrowRight className="ml-1" aria-hidden="true" />
                      </button>
                    ) : request.status === 'Accepted' ? (
                      <span className="text-gray-500 flex items-center justify-end">
                        <FiClock className="mr-1 text-gray-400" aria-hidden="true" />
                        Awaiting Donor
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center justify-end">
                        <FiCheckCircle className="mr-1" aria-hidden="true" />
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedRequests.length === 0 && (
            <EmptyState searchTerm={requestSearchTerm} />
          )}
        </div>
        
        {/* Informational footer */}
        {sortedRequests.length > 0 && (
          <div className="flex items-center justify-between py-3 border-t border-gray-200 mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <FiInfo className="mr-1" aria-hidden="true" />
              <span>Showing {sortedRequests.length} of {pendingRequests.length} total requests</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAcceptModal && (
        <AcceptModal 
          request={currentRequest}
          onConfirm={handleConfirmAccept}
          onCancel={() => setShowAcceptModal(false)}
        />
      )}
    </main>
  );
};

// PropTypes validation
BloodBagRequests.propTypes = {
  pendingRequests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      donorName: PropTypes.string.isRequired,
      donorId: PropTypes.string.isRequired,
      bloodType: PropTypes.string.isRequired,
      units: PropTypes.number.isRequired,
      requestDate: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired
    })
  ).isRequired,
  setPendingRequests: PropTypes.func.isRequired,
  setView: PropTypes.func.isRequired,
  setShowValidationModal: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  getRequestStatusColor: PropTypes.func.isRequired
};

export default BloodBagRequests;