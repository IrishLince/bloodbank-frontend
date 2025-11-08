import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Clock, 
  Building, 
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Package
} from 'lucide-react';

export default function UpdateDelivery({ delivery, onClose, onUpdate }) {
  const [status, setStatus] = useState(delivery?.status || 'Pending');
  const [estimatedTime, setEstimatedTime] = useState(delivery?.estimatedTime || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!delivery) return null;
  
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Prepare updated delivery data
    const updatedDelivery = {
      ...delivery,
      status,
      estimatedTime,
      notes: notes ? `${notes} (Updated: ${new Date().toLocaleString()})` : '',
      lastUpdated: new Date().toISOString()
    };
    
    // Simulate API call
    setTimeout(() => {
      onUpdate(updatedDelivery);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-white text-lg font-medium flex items-center">
            <ArrowRight className="mr-2 h-5 w-5" /> Update Delivery Status
          </h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
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
          
          {/* Current Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-3">Current Delivery Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                <p className="text-sm font-medium flex items-center">
                  {delivery.status === 'Complete' ? (
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                  ) : delivery.status === 'In Transit' ? (
                    <Truck className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  ) : delivery.status === 'Scheduled' ? (
                    <CalendarCheck className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                  )}
                  {delivery.status}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Blood Products</p>
                <div className="flex flex-wrap">
                  {delivery.items.split(', ').map((item, index) => (
                    <span key={index} className="mr-2 text-sm flex items-center">
                      <Package className="h-3 w-3 mr-1 text-red-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Update Form */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-4">Update Delivery Status</h3>
            
            <div className="space-y-4">
              {/* Status Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Transit">In Transit</option>
                </select>
              </div>
              
              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Time
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="e.g. 3:00 PM"
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional information about this update..."
                  className="w-full p-2 border border-gray-300 rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
              {isSubmitting ? 'Updating...' : 'Update Status'}
              {!isSubmitting && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 