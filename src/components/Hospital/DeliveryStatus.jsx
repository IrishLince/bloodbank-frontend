"use client"

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Truck, Package, Eye, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, ArrowRight, MapPin, Building, RefreshCw, Droplet } from 'lucide-react';
import Header from '../Header';
import { fetchWithAuth } from '../../utils/api';
import Pagination from '../Pagination';

// Delivery status constants
const DELIVERY_STATUS = {
  SCHEDULED: 'SCHEDULED',
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryToComplete, setDeliveryToComplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDeliveries = async () => {
      setIsLoading(true);
      try {
        const hospitalId = localStorage.getItem('userId');
        console.log('Fetching deliveries for hospital:', hospitalId);
        
        if (hospitalId) {
          // Fetch all deliveries and filter for this hospital
          const response = await fetchWithAuth('/deliveries');

          console.log('Response status:', response.status);
          console.log('Response ok:', response.ok);

          if (response.ok) {
            const allDeliveries = await response.json();
            console.log('All deliveries data:', allDeliveries);
            
            // For now, we'll show all deliveries since we don't have proper hospital linking yet
            // In a real system, this would filter by hospital ID or hospital requests
            const deliveriesArray = Array.isArray(allDeliveries) ? allDeliveries : [];
            
            // Transform the data to match the expected format
            const transformedDeliveries = deliveriesArray.map(delivery => ({
              id: delivery.id || delivery._id,
              requestId: delivery.requestId || delivery.request_id,
              hospitalName: delivery.hospitalName || delivery.hospital_name,
              bloodBankName: delivery.bloodBankName || delivery.blood_bank_name,
              bloodBankAddress: delivery.bloodBankAddress || delivery.blood_bank_address,
              bloodBankPhone: delivery.bloodBankPhone || delivery.blood_bank_phone,
              bloodBankEmail: delivery.bloodBankEmail || delivery.blood_bank_email,
              contactInfo: delivery.contactInfo || delivery.contact_info || delivery.bloodBankPhone || delivery.blood_bank_phone,
              itemsSummary: delivery.itemsSummary || delivery.items_summary,
              bloodItems: delivery.bloodItems || delivery.blood_items || [],
              status: delivery.status === 'PENDING' ? 'SCHEDULED' : (delivery.status || 'SCHEDULED'),
              scheduledDate: delivery.scheduledDate || delivery.scheduled_date || new Date().toISOString(),
              estimatedTime: delivery.estimatedTime || delivery.estimated_time || 'TBD',
              priority: delivery.priority || 'Normal',
              driverName: delivery.driverName || delivery.driver_name,
              driverContact: delivery.driverContact || delivery.driver_contact,
              vehicleId: delivery.vehicleId || delivery.vehicle_id,
              deliveredDate: delivery.deliveredDate || delivery.delivered_date,
              deliveredTime: delivery.deliveredTime || delivery.delivered_time,
              notes: delivery.notes || '',
              trackingHistory: delivery.trackingHistory || delivery.tracking_history || []
            }));
            
            console.log('Transformed deliveries:', transformedDeliveries);
            setDeliveries(transformedDeliveries);
            setFilteredDeliveries(transformedDeliveries);
          } else {
            console.error('Failed to fetch deliveries. Status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            setDeliveries([]);
            setFilteredDeliveries([]);
          }
        } else {
          console.error('No hospital ID found');
          setDeliveries([]);
          setFilteredDeliveries([]);
        }
      } catch (error) {
        console.error('Failed to fetch deliveries:', error);
        setDeliveries([]);
        setFilteredDeliveries([]);
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
        (delivery.id && delivery.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (delivery.requestId && delivery.requestId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (delivery.bloodBankName && delivery.bloodBankName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (delivery.itemsSummary && delivery.itemsSummary.toLowerCase().includes(searchTerm.toLowerCase()))
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
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [deliveries, searchTerm, statusFilter, dateFilter]);

  // Pagination logic
  const totalItems = filteredDeliveries.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeliveries = filteredDeliveries.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case DELIVERY_STATUS.SCHEDULED:
        return <Clock className="w-4 h-4 text-yellow-500" />;
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
      case DELIVERY_STATUS.SCHEDULED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      case DELIVERY_STATUS.SCHEDULED:
        return 0;
      case DELIVERY_STATUS.IN_TRANSIT:
        return 1;
      case DELIVERY_STATUS.COMPLETE:
        return 2;
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

  const handleMarkAsComplete = (delivery) => {
    setDeliveryToComplete(delivery);
    setShowConfirmModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!deliveryToComplete) return;

    try {
      // Call the API to update the delivery status
      const response = await fetchWithAuth(`/deliveries/${deliveryToComplete.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: DELIVERY_STATUS.COMPLETE
        }),
      });

      if (response.ok) {
        // Update the local state
        const updatedDeliveries = deliveries.map(d =>
          d.id === deliveryToComplete.id 
            ? { 
                ...d, 
                status: DELIVERY_STATUS.COMPLETE,
                deliveredDate: new Date().toISOString(),
                deliveredTime: new Date().toLocaleTimeString()
              } 
            : d
        );
        setDeliveries(updatedDeliveries);
        
        // Show success message (you can add a toast notification here)
        console.log('Delivery marked as complete successfully');
        
        // Close the confirmation modal
        setShowConfirmModal(false);
        setDeliveryToComplete(null);
      } else {
        throw new Error('Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error marking delivery as complete:', error);
      // You can add error handling/notification here
      setShowConfirmModal(false);
      setDeliveryToComplete(null);
    }
  };

  const handleCancelComplete = () => {
    setShowConfirmModal(false);
    setDeliveryToComplete(null);
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
          <div className="grid grid-cols-3 gap-4 mb-3">
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
                    {paginatedDeliveries.map((delivery, index) => (
                      <tr key={delivery.id} className={`hover:bg-red-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-red-25'}`}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {delivery.id}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-semibold">
                          {delivery.requestId || 'N/A'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{delivery.bloodBankName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">
                            {delivery.bloodBankAddress || delivery.contactInfo || 'Contact information not available'}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {delivery.bloodItems && delivery.bloodItems.length > 0 ? (
                              delivery.bloodItems.map((item, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-2 py-1 bg-red-50 text-red-800 rounded-lg text-xs font-medium border border-red-200"
                                >
                                  <Droplet className="w-3 h-3 mr-1 text-red-600" />
                                  {item.bloodType} ({item.units} units)
                                </span>
                              ))
                            ) : delivery.itemsSummary ? (
                              delivery.itemsSummary.split(', ').map((item, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-2 py-1 bg-red-50 text-red-800 rounded-lg text-xs font-medium border border-red-200"
                                >
                                  <Droplet className="w-3 h-3 mr-1 text-red-600" />
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No items specified</span>
                            )}
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetails(delivery)}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Track
                            </button>
                            {delivery.status === DELIVERY_STATUS.IN_TRANSIT && (
                              <button
                                onClick={() => handleMarkAsComplete(delivery)}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-1 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg text-xs"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </button>
                            )}
                          </div>
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
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-red-600" />
                    Delivery Progress
                  </h4>
                  <div className="flex items-center justify-between px-4">
                    {Object.values(DELIVERY_STATUS).map((status, index) => {
                      const currentStep = getStatusStep(selectedDelivery.status);
                      const isActive = index <= currentStep;
                      const isCurrent = index === currentStep;
                      
                      return (
                        <div key={status} className="flex flex-col items-center flex-1 relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-3 shadow-lg transition-all duration-300 ${
                            isActive 
                              ? isCurrent 
                                ? status === 'SCHEDULED' 
                                  ? 'bg-yellow-500 border-yellow-500 text-white shadow-yellow-200' 
                                  : status === 'IN TRANSIT'
                                  ? 'bg-blue-500 border-blue-500 text-white shadow-blue-200'
                                  : 'bg-green-500 border-green-500 text-white shadow-green-200'
                                : 'bg-gray-100 border-gray-300 text-gray-500'
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}>
                            <div className={`${isActive && isCurrent ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                              {status === 'SCHEDULED' ? (
                                <Clock className="w-5 h-5" />
                              ) : status === 'IN TRANSIT' ? (
                                <Truck className="w-5 h-5" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                          <div className={`mt-3 text-xs font-semibold text-center ${
                            isActive ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {status}
                          </div>
                          {index < Object.values(DELIVERY_STATUS).length - 1 && (
                            <div className={`absolute top-6 left-1/2 w-full h-1 rounded-full transition-all duration-500 ${
                              index < currentStep 
                                ? 'bg-gradient-to-r from-yellow-400 to-green-400' 
                                : 'bg-gray-200'
                            }`} style={{ transform: 'translateX(50%)', zIndex: -1 }} />
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
                  {selectedDelivery.bloodItems && selectedDelivery.bloodItems.length > 0 ? (
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
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-gray-600">{selectedDelivery.itemsSummary || 'No items specified'}</p>
                    </div>
                  )}
                  
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

      {/* Confirmation Modal for Completing Delivery */}
      {showConfirmModal && deliveryToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-0 border w-11/12 max-w-md shadow-2xl rounded-2xl bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Confirm Delivery
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Confirmation Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you have received this delivery?
                  </p>
                  <p className="text-sm text-gray-600">
                    By confirming, you acknowledge that all items have been received and inspected.
                  </p>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Delivery Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Delivery ID:</span> {deliveryToComplete.id}</p>
                    <p><span className="font-medium">Request ID:</span> {deliveryToComplete.requestId || 'N/A'}</p>
                    <p><span className="font-medium">Blood Bank:</span> {deliveryToComplete.bloodBankName}</p>
                    <p><span className="font-medium">Scheduled Date:</span> {new Date(deliveryToComplete.scheduledDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Blood Items Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">Items to Confirm:</h4>
                  {deliveryToComplete.bloodItems && deliveryToComplete.bloodItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {deliveryToComplete.bloodItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-white border-2 border-red-300 rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:border-red-400"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-gradient-to-br from-red-500 to-red-600 p-2.5 rounded-lg mr-3 shadow-sm">
                                <Droplet className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xl font-bold text-red-600">{item.bloodType}</p>
                                <p className="text-xs text-gray-600 font-medium">Blood Type</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-red-600">{item.units}</p>
                              <p className="text-xs text-gray-600 font-medium">units</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : deliveryToComplete.itemsSummary ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">{deliveryToComplete.itemsSummary}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">No items specified</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCancelComplete}
                  className="flex-1 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmComplete}
                  className="flex-1 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}