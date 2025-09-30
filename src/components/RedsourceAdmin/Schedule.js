import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Check,
  Calendar,
  Building,
  MapPin
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Header from '../Header';

export default function Schedule() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedHospital, selectedRequest } = location.state || {};
  const [date, setDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [isTimeError, setIsTimeError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    return availableTimeSlots.filter(slot => !isTimeSlotInPast(slot.time, date));
  };

  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (selectedTime && isTimeSlotInPast(selectedTime, date)) {
      setSelectedTime('');
      setIsTimeError(false);
    }
  }, [date, selectedTime]);

  const handleConfirm = () => {
    if (selectedTime) {
      setIsTimeError(false);
      setIsSubmitting(true);
      
      // Parse blood type summary from URL if available
      let parsedBloodTypeSummary = {};
      let parsedTotalUnits = totalUnits;
      
      if (bloodTypeSummary) {
        bloodTypeSummary.split(',').forEach(item => {
          const [type, units] = item.split(':');
          parsedBloodTypeSummary[type] = parseInt(units, 10);
        });
      }
      
      if (!parsedTotalUnits) {
        // Calculate total units from parsedBloodTypeSummary if available
        if (Object.keys(parsedBloodTypeSummary).length > 0) {
          parsedTotalUnits = Object.values(parsedBloodTypeSummary).reduce((sum, units) => sum + units, 0);
        } else {
          // Use the default from selected hospital or request
          parsedTotalUnits = selectedHospital?.requests || selectedRequest?.units || 2;
        }
      }
      
      // Determine the blood type(s) to include
      let bloodTypes = '';
      if (Object.keys(parsedBloodTypeSummary).length > 0) {
        bloodTypes = Object.keys(parsedBloodTypeSummary).join(', ');
      } else if (selectedRequest?.bloodType) {
        bloodTypes = selectedRequest.bloodType;
      } else if (selectedHospital?.bloodTypes) {
        bloodTypes = selectedHospital.bloodTypes;
      } else {
        bloodTypes = 'O+';
      }
      
      // Get hospital data from URL or selected hospital
      const queryParams = new URLSearchParams(window.location.search);
      const hospitalName = queryParams.get('hospitalName') || selectedHospital?.name || 'Hospital Name';
      const hospitalLocation = queryParams.get('hospitalLocation') || selectedHospital?.location || 'Hospital Location';
      const hospitalContact = queryParams.get('hospitalContact') || selectedHospital?.phone || 'Hospital Contact';
      
      // Ensure we have all required data
      const requestData = {
        selectedHospital: {
          ...selectedHospital,
          // Make sure all hospital fields are present with actual values
          name: hospitalName,
          location: hospitalLocation,
          phone: hospitalContact,
          bloodTypes: selectedHospital?.bloodTypes || '',
          deliveryStatus: selectedHospital?.deliveryStatus || 'Pending',
          // Pass the actual total units
          totalUnits: parsedTotalUnits
        },
        selectedRequest: {
          ...selectedRequest,
          // Make sure all request fields are present
          bloodType: bloodTypes.split(', ')[0], // Use first blood type as primary
          // Include the full list of available blood types
          availableBloodTypes: bloodTypes,
          // Use the calculated total units
          units: parsedTotalUnits,
          totalUnits: parsedTotalUnits,
          // Include blood type summary for proper distribution
          bloodTypeSummary: parsedBloodTypeSummary,
          requestDate: selectedRequest?.requestDate || new Date().toISOString().split('T')[0],
          id: requestId || selectedRequest?.id || `REQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          status: 'Scheduled'
        },
        appointmentDate: date,
        appointmentTime: selectedTime
      };
      
      // Simulate loading
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/request-sheet', { state: requestData });
      }, 300);
    } else {
      setIsTimeError(true);
      // Smooth scroll to time selection
      document.getElementById('time-selection')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleBackClick = () => {
    navigate('/requests', { state: { selectedHospital } });
  };
  
  const handleCancel = () => {
    // Navigate directly to hospital directory
    navigate('/hospital');
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1440px] mx-auto px-4 py-6">
       

        {/* Page title */}
        <h1 className="text-2xl font-bold text-[#C91C1C] mb-6">
          Schedule Blood Delivery
        </h1>

        {/* Hospital info */}
        {selectedHospital && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Building className="w-5 h-5 text-[#C91C1C]" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{selectedHospital.name}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-0.5">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" /> 
                  {selectedHospital.location}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-green-50 text-green-700 rounded-full px-3 py-1 flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  Standard Delivery
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="text-[#C91C1C] mr-2.5">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delivery Schedule Information</h2>
          </div>
          <p className="text-gray-600 mb-6">Please select your preferred delivery date and time</p>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Date selection */}
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-gray-900 font-medium mb-4 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-[#C91C1C]" />
                  Select Delivery Date
                </h3>
                
                <div className="flex justify-center mb-4">
                  <DatePicker
                    selected={date}
                    onChange={(newDate) => setDate(newDate)}
                    inline
                    minDate={new Date()} 
                    className="shadow-sm border border-gray-200 rounded"
                  />
                </div>
                
                {date && (
                  <div className="flex items-center bg-green-50 p-3 rounded-lg">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Selected date:</p>
                      <p className="text-[#C91C1C] font-medium">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Time selection */}
              <div 
                id="time-selection"
                className={`bg-white p-5 rounded-lg shadow-sm ${
                  isTimeError ? 'ring-1 ring-red-500' : ''
                }`}
              >
                <h3 className="text-gray-900 font-medium mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-[#C91C1C]" />
                  Select Delivery Time
                </h3>
                
                {isTimeError && (
                  <div className="text-sm text-red-600 mb-3 flex items-center">
                    <span>Please select a delivery time to continue</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {getAvailableTimeSlots().map((slot) => (
                    <label
                      key={slot.time}
                      className={`flex items-center p-3 border rounded cursor-pointer ${
                        selectedTime === slot.time 
                          ? 'border-[#C91C1C] bg-red-50' 
                          : 'border-gray-200 hover:bg-gray-50'
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
                        className="w-4 h-4 text-[#C91C1C] focus:ring-[#C91C1C]"
                      />
                      <div className="ml-2">
                        <div className="text-sm font-medium">{slot.time}</div>
                        <div className="mt-0.5">
                          {getAvailabilityLabel(slot.availability)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 italic">
                  All times are in local timezone (GMT+8)
                </p>
              </div>
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
                    <p className="font-medium">{formatDate(date)}</p>
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
        <div className="flex justify-between mt-8">
          <button 
            onClick={handleCancel}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#C91C1C] text-white font-medium rounded-md hover:bg-red-700 flex items-center"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
            {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}