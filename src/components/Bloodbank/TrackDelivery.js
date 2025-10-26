import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Package, 
  CalendarCheck, 
  Clock, 
  Building, 
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function TrackDelivery({ delivery, onClose, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  if (!delivery) return null;
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    // Add a small delay to show the animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };
  
  // Get status step (0 = Pending, 1 = Scheduled, 2 = In Transit, 3 = Complete)
  const getStatusStep = (status) => {
    const normalizedStatus = status?.toUpperCase();
    switch(normalizedStatus) {
      case 'PENDING': return 0;
      case 'SCHEDULED': return 1;
      case 'IN_TRANSIT': 
      case 'IN TRANSIT': return 2;
      case 'COMPLETE': 
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };
  
  const currentStep = getStatusStep(delivery.status);
  
  // Get ETA text based on status
  const getETAText = () => {
    const normalizedStatus = delivery.status?.toUpperCase();
    switch(normalizedStatus) {
      case 'PENDING': return 'Not scheduled yet';
      case 'SCHEDULED': return `Scheduled for ${delivery.date} at ${delivery.estimatedTime}`;
      case 'IN_TRANSIT':
      case 'IN TRANSIT': return `Expected by ${delivery.estimatedTime}`;
      case 'COMPLETE':
      case 'DELIVERED': return 'Delivered';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-500 p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-white text-lg font-medium flex items-center">
            <Truck className="mr-2 h-5 w-5" /> Track Delivery
          </h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 relative">
          {/* Loading Overlay */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-b-lg">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Refreshing delivery status...</p>
              </div>
            </div>
          )}
          
          {/* Delivery ID and Hospital */}
          <div className="flex flex-col md:flex-row md:items-center mb-6 border-b pb-4">
            <div className="font-bold text-xl text-gray-800 md:mr-4">
              {delivery.id}
            </div>
            <div className="flex items-center text-gray-600">
              <Building className="h-4 w-4 mr-1.5" />
              {delivery.hospital}
            </div>
          </div>
          
          {/* Status Tracker */}
          <div className="mb-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 z-0" />
            
            <div className="flex justify-between relative z-10">
              {/* Pending */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep >= 0 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">Pending</span>
              </div>
              
              {/* Scheduled */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep >= 1 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">Scheduled</span>
              </div>
              
              {/* In Transit */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Truck className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">In Transit</span>
              </div>
              
              {/* Complete */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">Complete</span>
              </div>
            </div>
          </div>
          
          {/* Delivery Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-3">Delivery Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Blood Products</p>
                <div className="space-y-1">
                  {delivery.items.split(', ').map((item, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Package className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Estimated Time</p>
                <p className="text-sm font-medium flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  {getETAText()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Current Status */}
          <div className={`rounded-lg p-4 mb-6 ${
            getStatusStep(delivery.status) === 3 ? 'bg-green-50 border border-green-200' :
            getStatusStep(delivery.status) === 2 ? 'bg-blue-50 border border-blue-200' :
            getStatusStep(delivery.status) === 1 ? 'bg-yellow-50 border border-yellow-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <h3 className="font-medium text-gray-800 mb-3">Current Status</h3>
            
            <div className="flex items-start">
              {getStatusStep(delivery.status) === 3 ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
              ) : getStatusStep(delivery.status) === 2 ? (
                <Truck className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
              ) : getStatusStep(delivery.status) === 1 ? (
                <CalendarCheck className="h-5 w-5 mr-2 text-yellow-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500 mt-0.5" />
              )}
              
              <div>
                <p className="font-medium text-gray-800">
                  {getStatusStep(delivery.status) === 3 ? 'Delivery completed' :
                   getStatusStep(delivery.status) === 2 ? 'Delivery in progress' :
                   getStatusStep(delivery.status) === 1 ? 'Delivery scheduled' :
                   'Awaiting scheduling'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {getStatusStep(delivery.status) === 3 ? 'The blood products have been successfully delivered.' :
                   getStatusStep(delivery.status) === 2 ? 'The blood products are currently being transported to the destination.' :
                   getStatusStep(delivery.status) === 1 ? 'The delivery has been scheduled and is awaiting dispatch.' :
                   'The delivery request is pending and needs to be scheduled.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center transition-all ${
                isRefreshing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}