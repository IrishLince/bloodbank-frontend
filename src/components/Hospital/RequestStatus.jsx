"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Droplet, Package, Eye, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '../Header';
import { hospitalRequestAPI } from '../../utils/api';
import Pagination from '../Pagination';

const REQUEST_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  FULFILLED: 'FULFILLED'
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const hospitalId = localStorage.getItem('userId');
        console.log('Fetching requests for hospitalId:', hospitalId);
        console.log('Local storage contents:', JSON.stringify(localStorage, null, 2));
        
        if (!hospitalId) {
          console.error('No hospital ID found in localStorage');
          setRequests([]);
          setFilteredRequests([]);
          return;
        }

        console.log('Calling getHospitalRequests with hospitalId:', hospitalId);
        const response = await hospitalRequestAPI.getHospitalRequests(hospitalId);
        console.log('Raw response from getHospitalRequests:', JSON.stringify(response, null, 2));
        
        if (!response || !Array.isArray(response)) {
          console.error('Invalid response format - expected an array:', response);
          setRequests([]);
          setFilteredRequests([]);
          return;
        }
        
        if (response.length === 0) {
          console.log('No requests found for this hospital');
          setRequests([]);
          setFilteredRequests([]);
          return;
        }
          // Transform the data from the API response
          const transformedRequests = response.map(req => {
            // Ensure bloodItems is an array and map the items
            const bloodItems = Array.isArray(req.bloodItems) ? req.bloodItems : [];
            
            // Map blood items with proper structure
            const mappedBloodItems = bloodItems.map(item => ({
              id: item.id || Math.random().toString(36).substr(2, 9),
              bloodType: item.bloodType || 'Unknown',
              units: parseInt(item.units) || 0,
              unitsRequested: parseInt(item.units) || 0,
              unitsFulfilled: (req.status === REQUEST_STATUS.FULFILLED || req.status === 'COMPLETE') ? (parseInt(item.units) || 0) : 
                            (req.status === REQUEST_STATUS.PROCESSING || req.status === 'SCHEDULED' ? Math.floor((parseInt(item.units) || 0) / 2) : 0)
            }));
            
            return { 
              ...req, 
              bloodItems: mappedBloodItems,
              bloodBankName: req.bloodBankName || 'RedSource Blood Center',
              bloodBankAddress: req.bloodBankAddress || '123 Main St, City',
              hospitalName: req.hospitalName || 'Unknown Hospital',
              requestDate: req.requestDate || new Date().toISOString(),
              status: req.status || 'PENDING',
              // For backward compatibility
              bloodRequests: mappedBloodItems
            };
          });
          setRequests(transformedRequests || []);
          setFilteredRequests(transformedRequests || []);
      } catch (error) {
        console.error('Failed to fetch hospital requests:', error);
        setRequests([]);
        setFilteredRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
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
      filtered = filtered.filter(request => getDisplayStatus(request.status) === statusFilter);
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
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [requests, searchTerm, statusFilter, dateFilter]);

  // Pagination logic
  const totalItems = filteredRequests.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusIcon = (status) => {
    // Map backend statuses to frontend display statuses
    const displayStatus = getDisplayStatus(status);
    
    switch (displayStatus) {
      case REQUEST_STATUS.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case REQUEST_STATUS.PROCESSING:
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case REQUEST_STATUS.FULFILLED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    // Map backend statuses to frontend display statuses
    const displayStatus = getDisplayStatus(status);
    
    switch (displayStatus) {
      case REQUEST_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case REQUEST_STATUS.PROCESSING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case REQUEST_STATUS.FULFILLED:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisplayStatus = (status) => {
    // Map backend statuses to frontend display statuses
    if (status === 'SCHEDULED') return REQUEST_STATUS.PROCESSING;
    if (status === 'COMPLETE') return REQUEST_STATUS.FULFILLED;
    return status;
  };

  const getTotalUnitsRequested = (bloodRequests) => {
    return bloodRequests.reduce((total, req) => total + req.unitsRequested, 0);
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
    console.log('Selected Request for Details:', request);
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  if (isLoading) {
    const hospitalId = localStorage.getItem('userId');

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
                  {[
                    { value: 'All', label: 'All Status' },
                    { value: REQUEST_STATUS.PENDING, label: 'Pending' },
                    { value: REQUEST_STATUS.PROCESSING, label: 'Processing' },
                    { value: REQUEST_STATUS.FULFILLED, label: 'Fulfilled' }
                  ].map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
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
            {[
              { status: REQUEST_STATUS.PENDING, label: 'Pending' },
              { status: REQUEST_STATUS.PROCESSING, label: 'Processing' },
              { status: REQUEST_STATUS.FULFILLED, label: 'Fulfilled' }
            ].map(({ status, label }) => {
              const count = requests.filter(req => getDisplayStatus(req.status) === status).length;
              return (
                <div key={status} className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg border border-red-100 p-3 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
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
                    {paginatedRequests.map((request, index) => (
                      <tr key={request.id} className={`hover:bg-red-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-red-25'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {request.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {request.bloodBankName || 'RedSource Blood Center'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {request.bloodBankAddress || '123 Main St, City'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {request.bloodItems && request.bloodItems.length > 0 ? (
                              request.bloodItems.map((item, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                                >
                                  <Droplet className="w-3 h-3 mr-1" />
                                  {item.bloodType}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-xs">No blood types specified</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {request.bloodItems ? request.bloodItems.reduce((total, item) => total + (parseInt(item.units) || 0), 0) : 0} units
                            </span>
                            {request.bloodItems && request.bloodItems.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {request.bloodItems.map((item, i) => (
                                  <div key={i}>
                                    {item.bloodType}: {item.units || 0} units
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{getDisplayStatus(request.status)}</span>
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

            {/* Pagination */}
            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                className="mt-4"
              />
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
                    <span className="ml-2">{getDisplayStatus(selectedRequest.status)}</span>
                  </span>
                </div>

                {/* Blood Source Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Blood Source Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedRequest.bloodSource || selectedRequest.bloodBankName}</p>
                    <p><span className="font-medium">Address:</span> {selectedRequest.bloodBankAddress || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedRequest.bloodBankPhone || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedRequest.bloodBankEmail || 'N/A'}</p>
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
                          {selectedRequest.status === REQUEST_STATUS.PROCESSING || selectedRequest.status === 'SCHEDULED' || selectedRequest.status === REQUEST_STATUS.FULFILLED || selectedRequest.status === 'COMPLETE' ? (
                            <span>{br.unitsFulfilled || 0} / {br.units} units</span>
                          ) : (
                            <span>{br.units} units requested</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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