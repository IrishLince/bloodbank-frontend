"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Droplet, Package, Eye, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '../Header';

const REQUEST_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing', 
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled'
};

export default function RequestStatus() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for blood requests with different statuses
  const mockRequests = [
    {
      id: 'REQ-001',
      bloodBankName: 'Central Blood Bank',
      bloodBankAddress: '123 Main Street, Downtown',
      contactInfo: '(555) 123-4567',
      email: 'contact@centralbloodbank.com',
      bloodRequests: [
        { bloodType: 'A+', unitsRequested: 3, unitsFulfilled: 3 },
        { bloodType: 'O-', unitsRequested: 2, unitsFulfilled: 2 }
      ],
      requestDate: '2023-11-15',
      dateNeeded: '2023-11-20',
      status: REQUEST_STATUS.FULFILLED,
      priority: 'High',
      notes: 'Emergency surgery requirement',
      fulfilledDate: '2023-11-19'
    },
    {
      id: 'REQ-002',
      bloodBankName: 'Regional Blood Center',
      bloodBankAddress: '456 Oak Avenue, Northside',
      contactInfo: '(555) 987-6543',
      email: 'info@regionalblood.org',
      bloodRequests: [
        { bloodType: 'O-', unitsRequested: 5, unitsFulfilled: 0 }
      ],
      requestDate: '2023-11-16',
      dateNeeded: '2023-11-21',
      status: REQUEST_STATUS.PROCESSING,
      priority: 'Medium',
      notes: 'Regular inventory replenishment',
      estimatedFulfillment: '2023-11-20'
    },
    {
      id: 'REQ-003',
      bloodBankName: 'National Blood Services',
      bloodBankAddress: '789 Pine Road, Eastville',
      contactInfo: '(555) 765-4321',
      email: 'support@nationalblood.com',
      bloodRequests: [
        { bloodType: 'B+', unitsRequested: 2, unitsFulfilled: 0 },
        { bloodType: 'AB-', unitsRequested: 1, unitsFulfilled: 0 },
        { bloodType: 'A-', unitsRequested: 3, unitsFulfilled: 0 }
      ],
      requestDate: '2023-11-17',
      dateNeeded: '2023-11-22',
      status: REQUEST_STATUS.PENDING,
      priority: 'Low',
      notes: 'Routine stock maintenance'
    },
    {
      id: 'REQ-004',
      bloodBankName: 'Metro Blood Bank',
      bloodBankAddress: '321 Elm Street, Westside',
      contactInfo: '(555) 456-7890',
      email: 'requests@metroblood.com',
      bloodRequests: [
        { bloodType: 'O+', unitsRequested: 10, unitsFulfilled: 0 }
      ],
      requestDate: '2023-11-18',
      dateNeeded: '2023-11-23',
      status: REQUEST_STATUS.CANCELLED,
      priority: 'High',
      notes: 'Request cancelled due to alternative source found',
      cancelledDate: '2023-11-18',
      cancelReason: 'Alternative source secured'
    },
    {
      id: 'REQ-005',
      bloodBankName: 'City Hospital Blood Bank',
      bloodBankAddress: '654 Maple Ave, Central',
      contactInfo: '(555) 321-9876',
      email: 'blood@cityhospital.com',
      bloodRequests: [
        { bloodType: 'A+', unitsRequested: 4, unitsFulfilled: 2 },
        { bloodType: 'B-', unitsRequested: 2, unitsFulfilled: 0 }
      ],
      requestDate: '2023-11-19',
      dateNeeded: '2023-11-24',
      status: REQUEST_STATUS.PROCESSING,
      priority: 'High',
      notes: 'Partial fulfillment in progress',
      estimatedFulfillment: '2023-11-22'
    }
  ];

  useEffect(() => {
    // Load requests from localStorage cache
    setIsLoading(true);
    const cachedRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
    setRequests(cachedRequests);
    setFilteredRequests(cachedRequests);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let filtered = requests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.bloodBankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.bloodRequests.some(br => br.bloodType.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'All') {
      const today = new Date();
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.requestDate);
        switch (dateFilter) {
          case 'Today':
            return requestDate.toDateString() === today.toDateString();
          case 'This Week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return requestDate >= weekAgo;
          case 'This Month':
            return requestDate.getMonth() === today.getMonth() && requestDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, dateFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case REQUEST_STATUS.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case REQUEST_STATUS.PROCESSING:
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case REQUEST_STATUS.FULFILLED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case REQUEST_STATUS.CANCELLED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case REQUEST_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case REQUEST_STATUS.PROCESSING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case REQUEST_STATUS.FULFILLED:
        return 'bg-green-100 text-green-800 border-green-200';
      case REQUEST_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTotalUnitsRequested = (bloodRequests) => {
    return bloodRequests.reduce((total, req) => total + req.unitsRequested, 0);
  };

  const getTotalUnitsFulfilled = (bloodRequests) => {
    return bloodRequests.reduce((total, req) => total + (req.unitsFulfilled || 0), 0);
  };

  const checkBusinessRules = (request) => {
    let issues = [];

    // Enforce max units for specific blood types
    const bloodTypeLimits = { "O+": 15, "A+": 10, "B+": 10, "AB+": 7 };

    request.bloodRequests.forEach((br) => {
      const limit = bloodTypeLimits[br.bloodType];
      if (limit && br.unitsRequested > limit) {
        issues.push(`Exceeded max limit for ${br.bloodType} (max ${limit})`);
      }
    });

    // Expiration risk if request date + 5 days < date needed
    const reqDate = new Date(request.requestDate);
    const needDate = new Date(request.dateNeeded);
    if (needDate.getTime() - reqDate.getTime() > 5 * 24 * 60 * 60 * 1000) {
      issues.push("Expiration risk: Date needed is more than 5 days after request.");
    }

    // Placeholder for form, cooler, payment requirements
    if (!request.formCompleted) issues.push("Blood Request Form not completed");
    if (!request.coolerProvided) issues.push("Cooler with ice not provided");
    if (!request.paymentStatus || request.paymentStatus !== "Paid") {
      issues.push("Payment not settled");
    }

    return issues;
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <Header />
      <div className="pt-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          {/* Header Section */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-1">Request Status</h1>
            <p className="text-gray-600 text-sm">Track the status of your blood requests</p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-3 mb-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-gradient-to-r from-red-50 to-white"
                >
                  <option value="All">All Status</option>
                  <option value={REQUEST_STATUS.PENDING}>Pending</option>
                  <option value={REQUEST_STATUS.PROCESSING}>Processing</option>
                  <option value={REQUEST_STATUS.FULFILLED}>Fulfilled</option>
                  <option value={REQUEST_STATUS.CANCELLED}>Cancelled</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-gradient-to-r from-red-50 to-white"
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {Object.values(REQUEST_STATUS).map((status) => {
              const count = requests.filter(req => req.status === status).length;
              return (
                <div key={status} className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg border border-red-100 p-3 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{status}</p>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                    </div>
                    <div className={`p-1.5 rounded-lg ${getStatusColor(status)} shadow-md`}>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5">
              <h3 className="text-base font-bold text-white flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Blood Requests ({filteredRequests.length})
              </h3>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No requests found</h3>
                <p className="text-gray-600 text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-red-100">
                  <thead className="bg-gradient-to-r from-red-50 to-red-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Blood Source
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Blood Types
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Units
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Date Needed
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-50">
                    {filteredRequests.map((request, index) => (
                      <tr key={request.id} className={`hover:bg-red-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-red-25'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {request.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{request.bloodSource || request.bloodBankName}</div>
                          <div className="text-xs text-gray-500">{request.contactInfo || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {request.bloodRequests.map((br, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                              >
                                <Droplet className="w-3 h-3 mr-1" />
                                {br.bloodType}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-bold">Req: {getTotalUnitsRequested(request.bloodRequests)}</span>
                            {request.status === REQUEST_STATUS.PROCESSING || request.status === REQUEST_STATUS.FULFILLED ? (
                              <span className="text-green-600 font-semibold text-xs">Ful: {getTotalUnitsFulfilled(request.bloodRequests)}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-red-400" />
                            <span className="font-semibold">{new Date(request.dateNeeded).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-0 border w-11/12 max-w-2xl shadow-2xl rounded-2xl bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Request Details - {selectedRequest.id}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-red-200 bg-white bg-opacity-20 rounded-lg p-1 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold border shadow-md ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-2">{selectedRequest.status}</span>
                  </span>
                </div>

                {/* Blood Source Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Blood Source Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedRequest.bloodSource || selectedRequest.bloodBankName}</p>
                    <p><span className="font-medium">Address:</span> {selectedRequest.bloodBankAddress || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedRequest.contactInfo || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedRequest.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Blood Requests */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Blood Requirements</h4>
                  <div className="space-y-2">
                    {selectedRequest.bloodRequests.map((br, index) => (
                      <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <Droplet className="w-5 h-5 text-red-500 mr-2" />
                          <span className="font-medium">{br.bloodType}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedRequest.status === REQUEST_STATUS.PROCESSING || selectedRequest.status === REQUEST_STATUS.FULFILLED ? (
                            <span>{br.unitsFulfilled || 0} / {br.unitsRequested} units</span>
                          ) : (
                            <span>{br.unitsRequested} units requested</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Rule Validation */}
                   <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                     <h4 className="font-medium text-red-800 mb-2">Business Rule Check ⚠️</h4>
                   <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {checkBusinessRules(selectedRequest).length === 0 ? (
                     <li className="text-green-700">✅ All requirements met</li>
                      ) : (
                      checkBusinessRules(selectedRequest).map((issue, idx) => (
                     <li key={idx}>{issue}</li>
                       ))
                     )}
                  </ul>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Request Date</p>
                    <p className="text-sm text-gray-600">{new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date Needed</p>
                    <p className="text-sm text-gray-600">{new Date(selectedRequest.dateNeeded).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Additional Information */}
                {selectedRequest.fulfilledDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fulfilled Date</p>
                    <p className="text-sm text-gray-600">{new Date(selectedRequest.fulfilledDate).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedRequest.estimatedFulfillment && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estimated Fulfillment</p>
                    <p className="text-sm text-gray-600">{new Date(selectedRequest.estimatedFulfillment).toLocaleDateString()}</p>
                  </div>
                )}


                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Notes</p>
                    <p className="text-sm text-gray-600">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
