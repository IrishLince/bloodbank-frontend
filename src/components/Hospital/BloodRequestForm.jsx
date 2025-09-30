import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiInfo, FiCheckCircle, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import LogoSignup from '../../assets/LogoSignup.png';
import { bloodBankAPI, hospitalRequestAPI } from '../../utils/api';

const BloodRequestForm = () => {
  const hospitalName = localStorage.getItem('userName') || 'Hospital';
  const hospitalId = localStorage.getItem('userId');
  const [bloodRequests, setBloodRequests] = useState([{ id: 1, bloodType: '', unitsRequested: '' }]);
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateNeeded, setDateNeeded] = useState('');
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [countdownActive, setCountdownActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeCalendar, setActiveCalendar] = useState('needed'); // 'request' or 'needed'
  const [showAddBloodModal, setShowAddBloodModal] = useState(false);
  const [newBloodType, setNewBloodType] = useState('');
  const [newUnitsRequested, setNewUnitsRequested] = useState('');
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();
  const [bloodAdminCenters, setBloodAdminCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBloodBanks = async () => {
      try {
        const response = await bloodBankAPI.getAll();
        setBloodAdminCenters(response.data || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBloodBanks();
  }, []);

  // Get today's date for date validation
  const today = new Date().toISOString().split('T')[0];

  // Calendar helper functions
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateForInput = (day, month, year) => {
    // Create date in local timezone to avoid timezone offset issues
    const date = new Date(year, month, day);
    const localYear = date.getFullYear();
    const localMonth = String(date.getMonth() + 1).padStart(2, '0');
    const localDay = String(date.getDate()).padStart(2, '0');
    return `${localYear}-${localMonth}-${localDay}`;
  };

  const isDateDisabled = (day, month, year) => {
    const date = new Date(year, month, day);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return date < todayDate;
  };

  const handleDateSelect = (day) => {
    const selectedDate = formatDateForInput(day, currentMonth, currentYear);
    
    // Only update dateNeeded, as requestDate is auto-selected
    setDateNeeded(selectedDate);
    // Clear errors
    const newErrors = { ...errors };
    delete newErrors.dateNeeded;
    setErrors(newErrors);
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isDisabled = isDateDisabled(day, currentMonth, currentYear);
      const dateStr = formatDateForInput(day, currentMonth, currentYear);
      const isSelected = (activeCalendar === 'request' && requestDate === dateStr) || 
                        (activeCalendar === 'needed' && dateNeeded === dateStr);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={`h-8 w-8 text-xs font-medium rounded-lg transition-all duration-200 ${
            isSelected
              ? 'bg-red-600 text-white shadow-lg'
              : isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-red-100 hover:text-red-600'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const addBloodRequest = () => {
    if (bloodRequests.length >= 7) {
      setErrors({ ...errors, maxRequests: 'Maximum 6 blood requests allowed' });
      return;
    }
    setShowAddBloodModal(true);
  };

  const handleAddBloodType = () => {
    const newErrors = {};
  
    // Validate blood type selection
    if (!newBloodType || newBloodType.trim() === '') {
      newErrors.newBloodType = 'Please select a blood type';
    }
  
    // Validate units
    if (!newUnitsRequested || newUnitsRequested.trim() === '') {
      newErrors.newUnitsRequested = 'Please enter the number of units';
    } else {
      const unitsNum = Number(newUnitsRequested);
      if (isNaN(unitsNum) || unitsNum <= 0) {
        newErrors.newUnitsRequested = 'Units must be a positive number';
      } else {
        // Apply hospital-specific maximum request limits
        const limits = { "O+": 15, "A+": 10, "B+": 10, "AB+": 7 };
        const unlimitedTypes = ["Whole Blood", "PRBC", "Platelet Concentrate", "FFP"];
  
        if (!unlimitedTypes.includes(newBloodType)) {
          const maxLimit = limits[newBloodType];
          if (maxLimit && unitsNum > maxLimit) {
            newErrors.newUnitsRequested = `Maximum ${maxLimit} units allowed for ${newBloodType}`;
          }
        }
      }
    }
  
    // Check for duplicates only if we're not at the max number of requests
    if (bloodRequests.length < 7) {
      const isDuplicate = bloodRequests.some(request => request.bloodType === newBloodType);
      if (isDuplicate) {
        newErrors.newBloodType = 'This blood type is already added';
      }
    }
  
    // Check availability if blood center is selected
    if (selectedAdmin && newBloodType) {
      const inventory = selectedAdmin.inventory.find(item => item.bloodType === newBloodType);
      if (!inventory || inventory.units === 0) {
        newErrors.newBloodType = 'This blood type is not available at selected center';
      } else if (newUnitsRequested && Number(newUnitsRequested) > inventory.units) {
        newErrors.newUnitsRequested = `Only ${inventory.units} units available`;
      }
    }
  
    // Check maximum requests limit - allow up to 7 blood requests in total
    if (bloodRequests.length >= 7) {
      newErrors.maxRequests = 'Maximum 7 blood requests allowed';
    }
  
    // If there are validation errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors({ ...errors, ...newErrors });
      return;
    }
  
    // Add new blood request
    const newId = bloodRequests.length > 0 ? Math.max(...bloodRequests.map(req => req.id)) + 1 : 1;
    setBloodRequests([...bloodRequests, { 
      id: newId, 
      bloodType: newBloodType, 
      unitsRequested: newUnitsRequested 
    }]);
  
    // Reset modal state
    setNewBloodType('');
    setNewUnitsRequested('');
    setShowAddBloodModal(false);
    
    // Clear all modal-related errors
    const clearedErrors = { ...errors };
    delete clearedErrors.maxRequests;
    delete clearedErrors.newBloodType;
    delete clearedErrors.newUnitsRequested;
    delete clearedErrors.bloodRequests;
    delete clearedErrors.duplicateBloodTypes;
    setErrors(clearedErrors);
  };

  const removeBloodRequest = (index) => {
    if (bloodRequests.length === 1) {
      setBloodRequests([{ id: 1, bloodType: '', unitsRequested: '' }]);
    } else {
      const newRequests = bloodRequests.filter((_, i) => i !== index);
      setBloodRequests(newRequests);
    }
  };

  const handleAdminSelect = (adminId) => {
    console.log('Selected Admin ID:', adminId);
    setSelectedAdminId(adminId);
    setShowAvailabilityModal(false);
    
    // Reset blood requests when changing blood center
    setBloodRequests([{ id: 1, bloodType: '', unitsRequested: '' }]);
    
    // Clear blood source error
    const newErrors = { ...errors };
    delete newErrors.bloodSource;
    setErrors(newErrors);
  };

  useEffect(() => {
    let timer;
    if (countdownActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prevCount => prevCount - 1);
      }, 1000);
    } else if (countdownActive && countdown === 0) {
      // Cancel request when timer reaches 0
      resetConfirmation();
    }
    
    return () => clearTimeout(timer);
  }, [countdown, countdownActive]);

  const resetConfirmation = () => {
    setShowConfirmationModal(false);
    setCountdown(30);
    setCountdownActive(false);
  };

  const handleConfirmSubmit = async () => {
    resetConfirmation();
    setIsSubmitting(true);

    const validBloodRequests = bloodRequests.filter(
      (request) => request.bloodType && request.unitsRequested
    );

    try {
      // Create blood items array in the required format
      const bloodItems = validBloodRequests.map(request => ({
        bloodType: request.bloodType,
        units: parseInt(request.unitsRequested, 10)
      }));

      // Get selected blood bank info
      const selectedBank = bloodAdminCenters.find(admin => admin.id === selectedAdminId);
      
      // Format dates to match backend's expected format: yyyy-MM-dd'T'HH:mm:ss'Z'
      const formatDateForBackend = (dateString) => {
        const date = new Date(dateString);
        const pad = (num) => num.toString().padStart(2, '0');
        
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      };

      // Create request data in the exact format expected by the backend
      const requestData = {
        hospitalId: hospitalId,
        hospitalName: hospitalName,
        bloodBankId: selectedAdminId,
        bloodBankName: selectedBank?.name || 'RedSource Blood Center',
        bloodBankAddress: selectedBank?.address || '123 Main St, City',
        bloodBankPhone: selectedBank?.phone || '',
        bloodBankEmail: selectedBank?.email || '',
        bloodItems: bloodItems,
        status: 'PENDING',
        requestDate: formatDateForBackend(requestDate),
        dateNeeded: formatDateForBackend(dateNeeded),
        notes: notes
      };

      console.log('Submitting request with data:', JSON.stringify(requestData, null, 2));
      const response = await hospitalRequestAPI.create(requestData);
      console.log('Request submitted successfully:', response);

      navigate('/successful-request', {
        state: {
          bloodRequests: validBloodRequests,
          requestDate,
          dateNeeded,
          bloodSource: bloodAdminCenters.find(
            (admin) => admin.id === selectedAdminId
          )?.name,
        },
      });
    } catch (error) {
      setErrors({ submission: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate dates
    // requestDate is now auto-selected and unchangeable, so no validation needed here.

    if (!dateNeeded) {
      newErrors.dateNeeded = 'Date needed is required';
    } else if (dateNeeded < today) {
      newErrors.dateNeeded = 'Date needed cannot be in the past';
    } else if (requestDate && dateNeeded < requestDate) {
      newErrors.dateNeeded = 'Date needed cannot be before request date';
    }

    // Validate blood center selection
    if (!selectedAdminId) {
      newErrors.bloodSource = 'Please select a blood center';
    }

    // Validate blood requests - check if we have any valid blood requests
    const validBloodRequests = bloodRequests.filter(request => request.bloodType && request.unitsRequested);
    if (validBloodRequests.length === 0) {
      newErrors.bloodRequests = 'At least one blood request is required';
    }

    // Validate each blood request that has data
    const bloodTypes = [];
    validBloodRequests.forEach((request, index) => {
      // Check for duplicates
      if (bloodTypes.includes(request.bloodType)) {
        newErrors.duplicateBloodTypes = 'Duplicate blood types are not allowed';
      } else {
        bloodTypes.push(request.bloodType);
      }

      // Validate units
      if (!request.unitsRequested || request.unitsRequested.trim() === '') {
        newErrors[`bloodType_${request.bloodType}`] = 'Units requested is required';
      } else if (isNaN(request.unitsRequested) || Number(request.unitsRequested) <= 0) {
        newErrors[`bloodType_${request.bloodType}`] = 'Units must be a positive number';
      } else if (Number(request.unitsRequested) > 50) {
        newErrors[`bloodType_${request.bloodType}`] = 'Maximum 50 units per blood type';
      }

      // Check availability if blood center is selected
      if (selectedAdmin && request.bloodType) {
        const inventory = selectedAdmin.inventory.find(item => item.bloodType === request.bloodType);
        if (!inventory || inventory.units === 0) {
          newErrors[`bloodType_${request.bloodType}`] = 'This blood type is not available';
        } else if (Number(request.unitsRequested) > inventory.units) {
          newErrors[`bloodType_${request.bloodType}`] = `Only ${inventory.units} units available`;
        }
      }
    });

    return newErrors;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError(true);
      setIsSubmitting(false);
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setFormError(false);
    setErrors({});
    setIsSubmitting(false);
    
    // Show confirmation modal
    setShowConfirmationModal(true);
    setCountdownActive(true);
  };

  // Get the selected admin details
  const selectedAdmin = bloodAdminCenters.find((admin) => admin.id === selectedAdminId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
      {/* Compact Hero Section */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl mb-4 shadow-xl">
              <FiInfo className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
              Blood Request Portal
            </h1>
            <p className="text-lg text-red-100 max-w-2xl mx-auto">
              Submit your blood request with our streamlined platform
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Compact Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="ml-2 text-xs font-medium text-gray-700">Hospital Info</div>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="ml-2 text-xs font-medium text-gray-700">Blood Source</div>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="ml-2 text-xs font-medium text-gray-700">Request Details</div>
            </div>
          </div>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          {/* Left Column - Hospital Info & Blood Source */}
          <div className="xl:col-span-1 space-y-4">
            {/* Hospital Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
                <div className="flex items-center text-white">
                  <div className="bg-white bg-opacity-20 p-1.5 rounded-lg mr-2">
                    <FiInfo className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Hospital Information</h2>
                    <p className="text-red-100 text-xs">Your hospital details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs font-bold text-gray-800 mb-1">Hospital Name</label>
                    <div className="text-sm font-semibold text-gray-900">Riverside Community Medical Center</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="block text-xs font-bold text-gray-800 mb-1">Hospital Address</label>
                      <div className="text-gray-900 font-medium text-sm">456 River Ave., Townsville</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="block text-xs font-bold text-gray-800 mb-1">Contact Information</label>
                      <div className="text-gray-900 font-medium">(555) 987-6543</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Blood Source */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
                <div className="flex items-center text-white">
                  <div className="bg-white bg-opacity-20 p-1.5 rounded-lg mr-2">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Blood Source</h2>
                    <p className="text-red-100 text-xs">Select your preferred blood bank</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2">Select Blood Center</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedAdmin ? selectedAdmin.name : "Choose Blood Center"}
                        className={`w-full p-3 border-2 ${errors.bloodSource ? 'border-red-500' : 'border-gray-200'} rounded-lg cursor-pointer hover:border-red-500 transition-all shadow-sm bg-white font-medium text-sm`}
                        onClick={() => setShowAvailabilityModal(true)}
                        readOnly
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <FiInfo className="w-4 h-4 transform rotate-90 text-red-600" />
                      </div>
                    </div>
                    {errors.bloodSource && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <FiInfo className="w-3 h-3 mr-1" />
                        {errors.bloodSource}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center text-blue-800">
                      <FiInfo className="w-3 h-3 mr-2" />
                      <span className="text-xs font-medium">
                        {selectedAdmin 
                          ? `Selected: ${selectedAdmin.name}` 
                          : "Click above to select a blood center and view available blood types"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row - Request Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
              <div className="flex items-center text-white">
                <div className="bg-white bg-opacity-20 p-1.5 rounded-lg mr-2">
                  <FiClock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Request Timeline</h2>
                  <p className="text-red-100 text-xs">Set your request and delivery dates</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Date Selection Buttons */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-800 mb-1">Request Date</label>
                    <button
                      type="button"
                      disabled
                      className={`w-full p-3 border-2 rounded-lg text-left font-medium text-sm transition-all ${
                        activeCalendar === 'request'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : errors.requestDate
                          ? 'border-red-500 bg-white text-gray-800'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-red-300'
                      }`}
                    >
                      {requestDate ? new Date(requestDate + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Select Request Date'}
                    </button>
                    {errors.requestDate && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <FiInfo className="w-3 h-3 mr-1" />
                        {errors.requestDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-800 mb-1">Date Needed</label>
                    <button
                      type="button"
                      onClick={() => setActiveCalendar('needed')}
                      className={`w-full p-3 border-2 rounded-lg text-left font-medium text-sm transition-all ${
                        activeCalendar === 'needed'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : errors.dateNeeded
                          ? 'border-red-500 bg-white text-gray-800'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-red-300'
                      }`}
                    >
                      {dateNeeded ? new Date(dateNeeded + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Select Date Needed'}
                    </button>
                    {errors.dateNeeded && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <FiInfo className="w-3 h-3 mr-1" />
                        {errors.dateNeeded}
                      </p>
                    )}
                  </div>
                </div>

                {/* Calendar Widget */}
                <div className="lg:col-span-2">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      <div className="text-center">
                        <h3 className="text-sm font-bold text-gray-800">
                          {monthNames[currentMonth]} {currentYear}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Selecting for: {activeCalendar === 'request' ? 'Request Date' : 'Date Needed'}
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Calendar Days Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="h-8 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">{day}</span>
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

           {/* Notes Section */}
           <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden transform hover:scale-105 transition-all duration-300">
             <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
               <div className="flex items-center text-white">
                 <div className="bg-white bg-opacity-20 p-1.5 rounded-lg mr-2">
                   <FiInfo className="w-4 h-4" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold">Additional Notes</h2>
                   <p className="text-red-100 text-xs">Any specific instructions or details</p>
                 </div>
               </div>
             </div>
             <div className="p-4">
               <textarea
                 className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                 rows="4"
                 placeholder="Enter any additional notes here..."
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
               ></textarea>
             </div>
           </div>

           {/* Bottom Row - Blood Requests (Full Width) */}
           <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
             <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
               <div className="flex items-center text-white">
                 <div className="bg-white bg-opacity-20 p-1.5 rounded-lg mr-2">
                   <FiPlus className="w-4 h-4" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold">Blood Requests</h2>
                   <p className="text-red-100 text-xs">Specify the blood types and quantities needed</p>
                 </div>
               </div>
             </div>

            <div className="p-6">
              {/* Blood Requests Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-base font-bold text-gray-900 mb-3">Selected Blood Types</h3>
                
                {bloodRequests.filter(request => request.bloodType && request.unitsRequested).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {bloodRequests
                      .filter(request => request.bloodType && request.unitsRequested)
                      .map((request, index) => (
                        <div key={request.id} className="flex items-center justify-between bg-white rounded-md p-2 border border-gray-200 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            <span className="font-medium text-gray-900">
                              {request.bloodType} - {request.unitsRequested} units
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBloodRequest(bloodRequests.findIndex(r => r.id === request.id))}
                            className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-md p-1 transition-all"
                          >
                            <FiPlus className="w-3 h-3 transform rotate-45" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 mb-2">
                      <FiInfo className="w-8 h-8 mx-auto mb-2" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">No blood types selected yet</p>
                    <p className="text-gray-400 text-xs">Click "Add Another Blood Type" to get started</p>
                  </div>
                )}
              </div>

              {/* Error Messages */}
              {errors.submission && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center text-red-700">
                    <FiInfo className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">{errors.submission}</span>
                  </div>
                </div>
              )}

              {errors.bloodRequests && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center text-red-700">
                    <FiInfo className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">{errors.bloodRequests}</span>
                  </div>
                </div>
              )}

              {errors.duplicateBloodTypes && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center text-red-700">
                    <FiInfo className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">{errors.duplicateBloodTypes}</span>
                  </div>
                </div>
              )}
              
              {errors.maxRequests && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center text-red-700">
                    <FiInfo className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">{errors.maxRequests}</span>
                  </div>
                </div>
              )}

              {/* Individual Blood Type Errors */}
              {Object.keys(errors).filter(key => key.startsWith('bloodType_')).map(errorKey => (
                <div key={errorKey} className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center text-red-700">
                    <FiInfo className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">
                      {errorKey.replace('bloodType_', '').toUpperCase()}: {errors[errorKey]}
                    </span>
                  </div>
                </div>
              ))}

              {/* Add Another Blood Type Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={addBloodRequest}
                  disabled={!selectedAdminId}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3 ${
                    selectedAdminId
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiPlus className="w-6 h-6" />
                  <span>Add Another Blood Type</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Submit Button */}
        <div className="mt-8">

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center mx-auto ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              }`}
            >
              <div className="bg-white bg-opacity-20 rounded-lg p-2 mr-3">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              {isSubmitting ? 'Submitting...' : 'Submit Blood Request'}
            </button>
          </div>
        </div>

        {/* Form Error Summary */}
        {formError && Object.keys(errors).length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start">
              <FiInfo className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Please correct the following errors:</h3>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  {Object.entries(errors)
                    .filter(([key]) => key !== 'duplicateBloodTypes' && key !== 'maxRequests')
                    .map(([key, error], index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Blood Source Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border-t-4 border-red-600">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-red-600 flex items-center">
                  <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mr-2">
                    <FiInfo className="w-4 h-4" />
                  </span>
                  Select Blood Source
                </h2>
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {loading ? (
                  <p>Loading blood banks...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  bloodAdminCenters.map((admin) => (
                    <div
                      key={admin.id}
                      className={`p-5 border-2 rounded-xl cursor-pointer hover:border-red-600 transition-all ${
                        selectedAdminId === admin.id ? "bg-red-50 border-red-600" : "border-gray-200"
                      }`}
                      onClick={() => handleAdminSelect(admin.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-bold text-lg text-gray-800">{admin.name}</div>
                          <div className="text-gray-600 text-sm flex items-center">
                            <FiInfo className="w-3 h-3 mr-1" />
                            {admin.location}
                          </div>
                        </div>
                        {selectedAdminId === admin.id && (
                          <div className="mt-2 sm:mt-0">
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center w-fit">
                              <FiCheckCircle className="w-3 h-3 mr-1" /> Selected
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {admin.inventory && admin.inventory.map((item) => (
                          <div
                            key={item.bloodType}
                            className={`p-3 rounded-lg text-center flex flex-col items-center ${
                              item.units > 0
                                ? "bg-green-50 text-green-800 border border-green-100"
                                : "bg-gray-50 text-gray-400 border border-gray-100"
                            }`}
                          >
                            <div className="text-lg font-bold">{item.bloodType}</div>
                            <div className="text-sm mt-1">{item.units} units</div>
                            {item.units === 0 && <div className="text-xs mt-1 text-red-500">Unavailable</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-0 max-w-lg w-full shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#C91C1C] to-[#8B0000] text-white p-5 text-center relative">
                <img src={LogoSignup} alt="RedSource Logo" className="h-20 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Confirm Blood Request</h2>
                <p className="text-white/80 text-sm mt-1">Please verify your submission</p>
                <button
                  onClick={resetConfirmation}
                  className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-5 text-center">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <p className="font-medium text-gray-800 text-lg mb-4">Are you sure you want to submit this blood request?</p>
                    
                    <div className="inline-flex items-center justify-center gap-3 bg-white py-2 px-4 rounded-lg border border-red-200 shadow-sm">
                      <div className="text-sm font-medium text-gray-700">Auto-cancel in:</div>
                      <div className="text-xl font-bold text-[#C91C1C] flex items-center">
                        <FiClock className="w-5 h-5 mr-1.5 text-[#C91C1C]" />
                        <span>{countdown}</span>
                        <span className="text-sm ml-0.5">sec</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={resetConfirmation}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors border border-gray-200"
                    >
                      Cancel Request
                    </button>
                    <button
                      onClick={handleConfirmSubmit}
                      className="bg-[#C91C1C] hover:bg-[#A81A1A] text-white py-3 px-6 rounded-lg font-medium transition-colors shadow-md border border-[#C91C1C]"
                    >
                      Confirm Submission
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Blood Type Modal */}
        {showAddBloodModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <FiPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Add Blood Type</h2>
                      <p className="text-red-100 text-sm">Select blood type and quantity</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddBloodModal(false);
                      setNewBloodType('');
                      setNewUnitsRequested('');
                      const newErrors = { ...errors };
                      delete newErrors.newBloodType;
                      delete newErrors.newUnitsRequested;
                      setErrors(newErrors);
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
                  >
                    <FiPlus className="w-5 h-5 transform rotate-45" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
  {/* ✅ Reminder for specific blood types */}
  {newBloodType && ["O+", "A+", "B+", "AB+"].includes(newBloodType) && (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-2 text-sm">
      Please note: Maximum allowed units for{" "}
      {newBloodType === "O+" && "O+ is 15 units"}
      {newBloodType === "A+" && "A+ is 10 units"}
      {newBloodType === "B+" && "B+ is 10 units"}
      {newBloodType === "AB+" && "AB+ is 7 units"}
    </div>
  )}

  {/* Blood Type Selection */}
  <div className="space-y-3">
    <label className="block text-sm font-bold text-gray-800">Blood Type</label>
    <select
      value={newBloodType}
      onChange={(e) => {
        setNewBloodType(e.target.value);
        const newErrors = { ...errors };
        delete newErrors.newBloodType;
        setErrors(newErrors);
      }}
      className={`w-full p-4 border-2 ${
        errors.newBloodType ? 'border-red-500' : 'border-gray-200'
      } rounded-lg font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer text-base`}
    >
      <option value="">Select Blood Type</option>
      {selectedAdmin && selectedAdmin.inventory
        ? selectedAdmin.inventory
            .filter((item) => item.units > 0)
            .map((item) => {
              const isAlreadyAdded = bloodRequests.some(req => req.bloodType === item.bloodType);
              return (
                <option 
                  key={item.bloodType} 
                  value={item.bloodType}
                  disabled={isAlreadyAdded}
                  className={isAlreadyAdded ? 'text-gray-400' : ''}
                >
                  🩸 {item.bloodType} - {item.units} units available
                  {isAlreadyAdded ? ' (already added)' : ''}
                </option>
              );
            })
        : null}
    </select>
    {errors.newBloodType && (
      <p className="text-red-500 text-sm mt-1 flex items-center">
        <FiInfo className="w-4 h-4 mr-1" />
        {errors.newBloodType}
      </p>
    )}
  </div>

                {/* Units Requested */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800">Units Requested</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newUnitsRequested}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (Number(value) >= 1 && Number(value) <= 50)) {
                          setNewUnitsRequested(value);
                          const newErrors = { ...errors };
                          delete newErrors.newUnitsRequested;
                          setErrors(newErrors);
                        }
                      }}
                      className={`w-full p-4 border-2 ${errors.newUnitsRequested ? 'border-red-500' : 'border-gray-200'} rounded-lg bg-white text-gray-800 font-medium text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all`}
                      placeholder="Enter Units (1-50)"
                      min="1"
                      max="50"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                      units
                    </div>
                  </div>
                  {errors.newUnitsRequested && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <FiInfo className="w-4 h-4 mr-1" />
                      {errors.newUnitsRequested}
                    </p>
                  )}
                </div>

                {/* Availability Info */}
                {newBloodType && selectedAdmin && (() => {
                  const inventory = selectedAdmin.inventory.find(item => item.bloodType === newBloodType);
                  return (
                    <div className={`rounded-lg p-4 border ${
                      inventory && inventory.units > 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`flex items-center ${
                        inventory && inventory.units > 0 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {inventory && inventory.units > 0 ? (
                          <FiCheckCircle className="w-5 h-5 mr-2" />
                        ) : (
                          <FiInfo className="w-5 h-5 mr-2" />
                        )}
                        <span className="font-medium">
                          {inventory 
                            ? `Available: ${inventory.units} units at ${selectedAdmin.name}`
                            : 'Not available'
                          }
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddBloodModal(false);
                    setNewBloodType('');
                    setNewUnitsRequested('');
                    const newErrors = { ...errors };
                    delete newErrors.newBloodType;
                    delete newErrors.newUnitsRequested;
                    setErrors(newErrors);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBloodType}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
                >
                  Add Blood Type
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodRequestForm;