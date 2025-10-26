import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Check,
  Calendar,
  Building,
  MapPin,
  Droplet,
  AlertTriangle
} from 'lucide-react';
import Header from '../Header';
import { deliveryAPI, fetchWithAuth, hospitalRequestAPI } from '../../utils/api';

export default function Schedule() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedHospital, selectedRequest } = location.state || {};
  const [selectedTime, setSelectedTime] = useState('');
  const [isTimeError, setIsTimeError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Get the needed date from the request
  const neededDate = selectedRequest?.dateNeeded ? new Date(selectedRequest.dateNeeded) : new Date();
  
  // Parse URL parameters
  const queryParams = new URLSearchParams(location.search);
  const bloodTypeSummary = queryParams.get('bloodTypeSummary');
  const totalUnits = queryParams.get('totalUnits') ? parseInt(queryParams.get('totalUnits'), 10) : null;
  const requestId = queryParams.get('requestId');
  const requestIds = queryParams.get('requestIds') ? queryParams.get('requestIds').split(',') : [];

  const availableTimeSlots = [
    { time: "8:00 AM", availability: "high" },
    { time: "10:00 AM", availability: "medium" },
    { time: "12:00 PM", availability: "low" },
    { time: "2:00 PM", availability: "high" },
    { time: "4:00 PM", availability: "medium" },
    { time: "6:00 PM", availability: "high" }
  ];

  // Helper function to check if a time slot is in the past
  const isTimeSlotInPast = (timeSlot, selectedDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // If selected date is in the future, all time slots are valid
    if (selectedDay > today) {
      return false;
    }
    
    // If selected date is not today, all time slots are valid
    if (selectedDay.getTime() !== today.getTime()) {
      return false;
    }
    
    // For today, check if the time slot is in the past
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hour24, minutes || 0, 0, 0);
    
    return slotDateTime <= now;
  };

  // Filter available time slots to exclude past times
  const getAvailableTimeSlots = () => {
    return availableTimeSlots.filter(slot => !isTimeSlotInPast(slot.time, neededDate));
  };

  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (selectedTime && isTimeSlotInPast(selectedTime, neededDate)) {
      setSelectedTime('');
      setIsTimeError(false);
    }
  }, [neededDate, selectedTime]);

  const handleConfirm = () => {
    if (selectedTime) {
      setIsTimeError(false);
      setShowSummary(true);
    } else {
      setIsTimeError(true);
      // Smooth scroll to time selection
      document.getElementById('time-selection')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
      
    try {
      // Get blood bank info from localStorage
      const bloodBankId = localStorage.getItem('userId');
      const bloodBankName = localStorage.getItem('bloodBankName') || 'Blood Bank';
      
      // Fetch hospital requests to get the actual request ID
      let actualRequestId = selectedRequest?.requestId || requestId;
      
      // Get delivery data using the same logic as summary
      const deliveryInfo = getDeliveryData();
      
      // Get hospital data from URL or selected hospital
      const queryParams = new URLSearchParams(window.location.search);
      const hospitalName = queryParams.get('hospitalName') || selectedHospital?.name || 'Hospital Name';
      const hospitalLocation = queryParams.get('hospitalLocation') || selectedHospital?.location || 'Hospital Location';
      const hospitalContact = queryParams.get('hospitalContact') || selectedHospital?.phone || 'Hospital Contact';
      
      // Get blood bank details from user profile or localStorage
      const bloodBankDetails = {
        name: localStorage.getItem('userName') || localStorage.getItem('bloodBankName') || 'Blood Bank',
        address: localStorage.getItem('userAddress') || localStorage.getItem('bloodBankAddress') || '123 Main St, City',
        phone: localStorage.getItem('userPhone') || localStorage.getItem('bloodBankPhone') || '(555) 123-4567',
        email: localStorage.getItem('userEmail') || localStorage.getItem('bloodBankEmail') || 'contact@bloodbank.com'
      };
      
      // Create delivery data for backend
      const deliveryData = {
        requestId: actualRequestId,
        bloodBankId: bloodBankId,
        bloodBankName: bloodBankDetails.name,
        hospitalName: hospitalName,
        bloodBankAddress: bloodBankDetails.address,
        contactInfo: hospitalContact,
        bloodBankPhone: bloodBankDetails.phone,
        bloodBankEmail: bloodBankDetails.email,
        itemsSummary: deliveryInfo.itemsSummary,
        bloodItems: deliveryInfo.bloodItems,
        scheduledDate: neededDate,
        estimatedTime: selectedTime,
        status: 'SCHEDULED',
        priority: 'NORMAL',
        notes: `Delivery scheduled for ${hospitalName} - ${deliveryInfo.itemsSummary}`
      };
      
      console.log('Creating delivery:', deliveryData);
      
      // Create delivery via API
      const response = await deliveryAPI.create(deliveryData);
      console.log('Delivery created:', response);
      
      // Update hospital request status to SCHEDULED
      if (actualRequestId) {
        try {
          await hospitalRequestAPI.updateStatus(actualRequestId, 'SCHEDULED');
          console.log('Request status updated to SCHEDULED');
        } catch (error) {
          console.error('Error updating request status:', error);
          // Continue anyway, delivery was created successfully
        }
      }
      
      setIsSubmitting(false);
      
      // Navigate to hospital list with success message
      navigate('/hospital', { 
        state: { 
          message: 'Delivery scheduled successfully!',
          deliveryId: response.id
        } 
      });
    } catch (error) {
      console.error('Error creating delivery:', error);
      setIsSubmitting(false);
      alert('Failed to create delivery: ' + error.message);
    }
  };

  const handleBackClick = () => {
    navigate('/requests', { state: { selectedHospital } });
  };
  
  const handleCancel = () => {
    // Navigate directly to hospital directory
    navigate('/hospital');
  };

  const handleBackToSchedule = () => {
    setShowSummary(false);
  };

  // Helper function to get delivery summary data
  const getDeliveryData = () => {
    // Debug: Log the selectedRequest to understand its structure
    console.log('selectedRequest data:', selectedRequest);
    
    // First, try to get blood items from selectedRequest
    let bloodItems = [];
    let parsedTotalUnits = 0;
    
    if (selectedRequest?.bloodItems && Array.isArray(selectedRequest.bloodItems)) {
      // Use blood items from the selected request
      bloodItems = selectedRequest.bloodItems.map(item => ({
        bloodType: item.bloodType,
        units: parseInt(item.units) || 0
      }));
      parsedTotalUnits = bloodItems.reduce((sum, item) => sum + item.units, 0);
    } else if (bloodTypeSummary) {
      // Fallback to URL parameters if no bloodItems in request
      const parsedBloodTypeSummary = {};
      bloodTypeSummary.split(',').forEach(item => {
        const [type, units] = item.split(':');
        parsedBloodTypeSummary[type] = parseInt(units, 10);
      });
      
      bloodItems = Object.entries(parsedBloodTypeSummary).map(([bloodType, units]) => ({
        bloodType,
        units
      }));
      parsedTotalUnits = Object.values(parsedBloodTypeSummary).reduce((sum, units) => sum + units, 0);
    } else if (totalUnits) {
      // Use URL totalUnits parameter
      parsedTotalUnits = totalUnits;
    } else {
      // Final fallback
      parsedTotalUnits = 2;
    }

    // Create items summary string
    const itemsSummary = bloodItems.length > 0 
      ? bloodItems.map(item => `${item.bloodType} (${item.units} units)`).join(', ')
      : `Blood (${parsedTotalUnits} units)`;

    const queryParams = new URLSearchParams(window.location.search);
    const hospitalName = queryParams.get('hospitalName') || selectedHospital?.name || 'Hospital Name';
    const hospitalLocation = queryParams.get('hospitalLocation') || selectedHospital?.location || 'Hospital Location';

    return {
      hospitalName,
      hospitalLocation,
      itemsSummary,
      bloodItems,
      totalUnits: parsedTotalUnits
    };
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get availability label
  const getAvailabilityLabel = (availability) => {
    switch(availability) {
      case 'high':
        return <span className="text-xs text-green-700 bg-green-50 rounded px-2 py-0.5">High availability</span>;
      case 'medium':
        return <span className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5">Medium availability</span>;
      case 'low':
        return <span className="text-xs text-red-700 bg-red-50 rounded px-2 py-0.5">Low availability</span>;
      default:
        return null;
    }
  };

  // Get delivery data for summary
  const deliveryData = getDeliveryData();

  // Show summary page if showSummary is true
  if (showSummary) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Page title */}
          <h1 className="text-xl sm:text-2xl font-bold text-[#C91C1C] mb-4 sm:mb-6">
            Delivery Summary
          </h1>

          {/* Hospital info */}
          {selectedHospital && (
            <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg flex-shrink-0">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-[#C91C1C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{selectedHospital.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-0.5">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-gray-400 flex-shrink-0" /> 
                    <span className="truncate">{selectedHospital.location}</span>
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs bg-green-50 text-green-700 rounded-full px-2 sm:px-3 py-1 flex items-center">
                    <Check className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Standard </span>Delivery
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Content */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 lg:p-8 mb-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="text-[#C91C1C] mr-2 sm:mr-3">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Confirm Delivery Details</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Delivery Information */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#C91C1C]" />
                  Delivery Information
                </h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Delivery Date</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words">{formatDate(neededDate)}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Delivery Time</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{selectedTime}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Hospital</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words">{deliveryData.hospitalName}</p>
                    <p className="text-xs sm:text-sm text-gray-500 break-words">{deliveryData.hospitalLocation}</p>
                  </div>
                </div>
              </div>

              {/* Blood Items */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Droplet className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#C91C1C]" />
                  Blood Items
                </h3>
                
                <div className="space-y-2 sm:space-y-3">
                  {deliveryData.bloodItems.length > 0 ? (
                    deliveryData.bloodItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-red-50 rounded-lg">
                        <span className="text-sm sm:text-base font-medium text-gray-900 break-words">Blood Type {item.bloodType}</span>
                        <span className="text-[#C91C1C] font-bold text-sm sm:text-base whitespace-nowrap ml-2">{item.units} units</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                      <p className="text-sm sm:text-base text-gray-900 break-words">{deliveryData.itemsSummary}</p>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 sm:pt-3 mt-3 sm:mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Total Units:</span>
                      <span className="text-lg sm:text-xl font-bold text-[#C91C1C]">{deliveryData.totalUnits}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="mt-4 sm:mt-6 lg:mt-8 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-yellow-800">Please review all details carefully</p>
                  <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                    Once confirmed, this delivery will be scheduled and the hospital will be notified.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
            <button 
              onClick={handleBackToSchedule}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center text-sm sm:text-base"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Schedule
            </button>
            
            <button
              onClick={handleFinalConfirm}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2 bg-[#C91C1C] text-white font-medium rounded-md hover:bg-red-700 flex items-center justify-center text-sm sm:text-base"
            >
              {isSubmitting ? 'Scheduling...' : 'Confirm Delivery'}
              {!isSubmitting && <Check className="ml-2 w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Page title */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#C91C1C] mb-4 sm:mb-6">
          Schedule Blood Delivery
        </h1>

        {/* Hospital info */}
        {selectedHospital && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg flex-shrink-0">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-[#C91C1C]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{selectedHospital.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-0.5">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-gray-400 flex-shrink-0" /> 
                  <span className="truncate">{selectedHospital.location}</span>
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs bg-green-50 text-green-700 rounded-full px-2 sm:px-3 py-1 flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Standard </span>Delivery
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="text-[#C91C1C] mr-2 sm:mr-2.5">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Schedule Information</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Please select your preferred delivery time</p>

          <div className="bg-red-50 rounded-lg p-3 sm:p-4 lg:p-6">
            {/* Blood Needed Date Display */}
            <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-sm mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base text-gray-900 font-medium mb-3 sm:mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-[#C91C1C]" />
                Blood Needed Date
              </h3>
              
              <div className="flex items-center bg-blue-50 p-3 sm:p-4 rounded-lg">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <p className="text-[#C91C1C] font-bold text-sm sm:text-base lg:text-lg break-words">
                    {formatDate(neededDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Time selection */}
            <div 
              id="time-selection"
              className={`bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-sm ${
                isTimeError ? 'ring-1 ring-red-500' : ''
              }`}
            >
                <h3 className="text-sm sm:text-base text-gray-900 font-medium mb-3 sm:mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-[#C91C1C]" />
                  Select Delivery Time
                </h3>
                
                {isTimeError && (
                  <div className="text-xs sm:text-sm text-red-600 mb-3 flex items-center">
                    <span>Please select a delivery time to continue</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {getAvailableTimeSlots().map((slot) => (
                    <label
                      key={slot.time}
                      className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTime === slot.time 
                          ? 'border-[#C91C1C] bg-red-50 shadow-md transform scale-105' 
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name="timeSlot"
                        value={slot.time}
                        checked={selectedTime === slot.time}
                        onChange={(e) => {
                          setSelectedTime(e.target.value);
                          setIsTimeError(false);
                        }}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-[#C91C1C] focus:ring-[#C91C1C] focus:ring-2"
                      />
                      <div className="ml-2 sm:ml-3">
                        <div className="text-sm sm:text-base font-semibold text-gray-800">{slot.time}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 italic">
                  All times are in local timezone (GMT+8)
                </p>
              </div>
            
            {/* Selected info */}
            {selectedTime && (
              <div className="mt-6 bg-white p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Delivery Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Date:</p>
                    <p className="font-medium">{formatDate(neededDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Time:</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
          <button 
            onClick={handleCancel}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-[#C91C1C] text-white font-medium rounded-md hover:bg-red-700 flex items-center justify-center text-sm sm:text-base"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
            {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}