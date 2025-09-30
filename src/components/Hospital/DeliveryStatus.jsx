"use client"

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Truck, Package, Eye, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, ArrowRight, MapPin, Building, RefreshCw } from 'lucide-react';
import Header from '../Header';
import { deliveryAPI, hospitalRequestAPI } from '../../utils/api';

// Delivery status constants
const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  IN_TRANSIT: 'IN TRANSIT',
  COMPLETE: 'COMPLETE'
};

export default function DeliveryStatus() {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      setIsLoading(true);
      try {
        const hospitalId = localStorage.getItem('userId');
        if (hospitalId) {
          // 1. Fetch all hospital requests for the current hospital
          const hospitalRequests = await hospitalRequestAPI.getHospitalRequests(hospitalId);
          console.log('Hospital Requests:', hospitalRequests);
          
          // 2. Extract request IDs
          const requestIds = hospitalRequests.map(req => req.id);
          console.log('Request IDs:', requestIds);

          if (requestIds.length > 0) {
            // 3. Fetch deliveries for each request ID and combine results
            const deliveryPromises = requestIds.map(id => 
              deliveryAPI.getDeliveriesByRequestId(id)
                .then(response => {
                  // Handle both array and single object responses
                  if (Array.isArray(response)) {
                    return response;
                  } else if (response) {
                    return [response];
                  }
                  return [];
                })
                .catch(error => {
                  console.error(`Error fetching deliveries for request ${id}:`, error);
                  return [];
                })
            );
            
            const deliveriesResults = await Promise.all(deliveryPromises);
            // Flatten the array of arrays into a single array of deliveries
            const allDeliveries = deliveriesResults.flat();
            console.log('All Deliveries:', allDeliveries);
            
            setDeliveries(allDeliveries);
            setFilteredDeliveries(allDeliveries);
          } else {
            setDeliveries([]);
            setFilteredDeliveries([]);
          }
        } else {
          setDeliveries([]);
          setFilteredDeliveries([]);
        }
      } catch (error) {
        console.error('Failed to fetch deliveries:', error);
        // Optionally set an error state to display to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  useEffect(() => {
    let filtered = deliveries;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(delivery =>
        delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.bloodBankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.items.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'All') {
      const today = new Date();
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.scheduledDate);
        switch (dateFilter) {
          case 'Today':
            return deliveryDate.toDateString() === today.toDateString();
          case 'This Week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return deliveryDate >= weekAgo;
          case 'This Month':
            return deliveryDate.getMonth() === today.getMonth() && deliveryDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, searchTerm, statusFilter, dateFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case DELIVERY_STATUS.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case DELIVERY_STATUS.PROCESSING:
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case DELIVERY_STATUS.IN_TRANSIT:
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case DELIVERY_STATUS.COMPLETE:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case DELIVERY_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case DELIVERY_STATUS.PROCESSING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case DELIVERY_STATUS.IN_TRANSIT:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case DELIVERY_STATUS.COMPLETE:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case DELIVERY_STATUS.PENDING:
        return 0;
      case DELIVERY_STATUS.PROCESSING:
        return 1;
      case DELIVERY_STATUS.IN_TRANSIT:
        return 2;
      case DELIVERY_STATUS.COMPLETE:
        return 3;
      default:
        return 0;
    }
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedDelivery(null);
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-1">Delivery Status</h1>
            <p className="text-gray-600 text-sm">Track your blood delivery status from blood banks</p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-3 mb-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search deliveries..."
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
                  <option value={DELIVERY_STATUS.PENDING}>Pending</option>
                  <option value={DELIVERY_STATUS.PROCESSING}>Processing</option>
                  <option value={DELIVERY_STATUS.IN_TRANSIT}>In Transit</option>
                  <option value={DELIVERY_STATUS.COMPLETE}>Complete</option>
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
          <div className="grid grid-cols-4 gap-2 mb-3">
            {Object.values(DELIVERY_STATUS).map((status) => {
              const count = deliveries.filter(del => del.status === status).length;
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

          {/* Deliveries Table */}
          <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5">
              <h3 className="text-base font-bold text-white flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Deliveries ({filteredDeliveries.length})
              </h3>
            </div>

            {filteredDeliveries.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No deliveries found</h3>
                <p className="text-gray-600 text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-red-100">
                  <thead className="bg-gradient-to-r from-red-50 to-red-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Delivery ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Blood Bank
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Scheduled Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-50">
                    {filteredDeliveries.map((delivery, index) => (
                      <tr key={delivery.id} className={`hover:bg-red-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-red-25'}`}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {delivery.id}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-semibold">
                          {delivery.requestId}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{delivery.bloodBankName}</div>
                          <div className="text-xs text-gray-500">{delivery.contactInfo}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate font-medium" title={delivery.itemsSummary}>
                            {delivery.bloodItems.reduce((total, item) => total + item.units, 0)} units
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${getStatusColor(delivery.status)}`}>
                            {getStatusIcon(delivery.status)}
                            <span className="ml-1">{delivery.status}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-red-400" />
                            <span className="font-semibold">{new Date(delivery.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          {delivery.estimatedTime !== 'TBD' && (
                            <div className="text-xs text-gray-500 font-medium">{delivery.estimatedTime}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(delivery)}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Track
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

      {/* Delivery Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-0 border w-11/12 max-w-4xl shadow-2xl rounded-2xl bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Delivery Tracking - {selectedDelivery.id}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-red-200 bg-white bg-opacity-20 rounded-lg p-1 transition-all"
                >
                  <Package className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">

              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedDelivery.status)}`}>
                    {getStatusIcon(selectedDelivery.status)}
                    <span className="ml-2">{selectedDelivery.status}</span>
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedDelivery.priority)}`}>
                    {selectedDelivery.priority} Priority
                  </span>
                </div>

                {/* Progress Tracker */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Delivery Progress</h4>
                  <div className="flex items-center justify-between">
                    {Object.values(DELIVERY_STATUS).map((status, index) => {
                      const currentStep = getStatusStep(selectedDelivery.status);
                      const isActive = index <= currentStep;
                      const isCurrent = index === currentStep;
                      
                      return (
                        <div key={status} className="flex flex-col items-center flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            isActive 
                              ? isCurrent 
                                ? 'bg-red-600 border-red-600 text-white' 
                                : 'bg-green-600 border-green-600 text-white'
                              : 'bg-gray-200 border-gray-300 text-gray-400'
                          }`}>
                            {getStatusIcon(status)}
                          </div>
                          <div className={`mt-2 text-xs font-medium ${
                            isActive ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {status}
                          </div>
                          {index < Object.values(DELIVERY_STATUS).length - 1 && (
                            <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                              index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                            }`} style={{ transform: 'translateX(50%)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Delivery Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-red-600" />
                      Delivery Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Request ID:</span> {selectedDelivery.requestId}</p>
                      <p><span className="font-medium">Scheduled Date:</span> {new Date(selectedDelivery.scheduledDate).toLocaleDateString()}</p>
                      <p><span className="font-medium">Estimated Time:</span> {selectedDelivery.estimatedTime}</p>
                      {selectedDelivery.driverName && (
                        <p><span className="font-medium">Driver:</span> {selectedDelivery.driverName}</p>
                      )}
                      {selectedDelivery.driverContact && (
                        <p><span className="font-medium">Driver Contact:</span> {selectedDelivery.driverContact}</p>
                      )}
                      {selectedDelivery.vehicleId && (
                        <p><span className="font-medium">Vehicle ID:</span> {selectedDelivery.vehicleId}</p>
                      )}
                    </div>
                  </div>

                  {/* Blood Bank Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-red-600" />
                      Blood Bank Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedDelivery.bloodBankName}</p>
                      <p><span className="font-medium">Address:</span> {selectedDelivery.bloodBankAddress}</p>
                      <p><span className="font-medium">Phone:</span> {selectedDelivery.bloodBankPhone || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {selectedDelivery.bloodBankEmail || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Blood Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Blood Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedDelivery.bloodItems.map((item, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-red-600 mr-2" />
                            <span className="font-medium text-red-800">{item.bloodType}</span>
                          </div>
                          <span className="text-sm text-red-600">{item.units} units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedDelivery.pendingItems && selectedDelivery.pendingItems.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Pending Items:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedDelivery.pendingItems.map((item, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                                <span className="font-medium text-yellow-800">{item.bloodType}</span>
                              </div>
                              <span className="text-sm text-yellow-600">{item.units} units</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Status */}
                {selectedDelivery.status === DELIVERY_STATUS.IN_TRANSIT && selectedDelivery.currentLocation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Current Location
                    </h4>
                    <p className="text-blue-800">{selectedDelivery.currentLocation}</p>
                    {selectedDelivery.estimatedArrival && (
                      <p className="text-sm text-blue-600 mt-1">
                        Estimated arrival: {selectedDelivery.estimatedArrival}
                      </p>
                    )}
                  </div>
                )}

                {/* Delivery Complete */}
                {selectedDelivery.status === DELIVERY_STATUS.COMPLETE && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Delivery Completed
                    </h4>
                    <p className="text-green-800">
                      Delivered on {new Date(selectedDelivery.deliveredDate).toLocaleDateString()} at {selectedDelivery.deliveredTime}
                    </p>
                  </div>
                )}

                {/* Tracking History */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tracking History</h4>
                  <div className="space-y-3">
                    {selectedDelivery.trackingHistory.map((event, index) => (
                      <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-200 last:border-b-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{event.status}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{event.location}</p>
                          <p className="text-sm text-gray-500">{event.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedDelivery.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Notes</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-1">{selectedDelivery.notes}</p>
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
