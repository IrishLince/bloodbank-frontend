import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiTruck, 
  FiPackage, 
  FiCalendar, 
  FiFilter, 
  FiRefreshCw, 
  FiSearch,
  FiPlus,
  FiMap,
  FiPhoneCall,
  FiDroplet,
  FiActivity,
  FiClock,
  FiEye,
  FiCheck,
  FiArrowRight,
  FiMenu,
  FiChevronRight,
  FiDatabase
} from 'react-icons/fi'
import TrackDelivery from './TrackDelivery'
import UpdateDelivery from './UpdateDelivery'
import CreateDelivery from './CreateDelivery'
import ViewRequests from './ViewRequests'
import { fetchWithAuth, deliveryAPI } from '../../utils/api'
import Pagination from '../Pagination'

// Delivery status constants
const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN TRANSIT',
  COMPLETE: 'COMPLETE'
};

export default function HospitalList() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('hospitals')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryError, setDeliveryError] = useState(null);
  
  // Pagination states
  const [hospitalsCurrentPage, setHospitalsCurrentPage] = useState(1);
  const [deliveriesCurrentPage, setDeliveriesCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current blood bank ID from localStorage
  const bloodBankId = localStorage.getItem('userId');

  // Fetch hospital requests from backend
  useEffect(() => {
    const fetchHospitalRequests = async () => {
      if (!bloodBankId) {
        setError('Blood bank ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Fetching requests for blood bank: ${bloodBankId}`);
        
        const response = await fetchWithAuth(`/hospital-requests/bloodbank/${bloodBankId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Hospital requests response:', data);
          
          const hospitalRequests = data.data || [];
          
          // Group requests by hospital
          const hospitalMap = {};
          hospitalRequests.forEach(request => {
            const hospitalId = request.hospital_id || request.hospitalId;
            if (!hospitalMap[hospitalId]) {
              hospitalMap[hospitalId] = {
                id: hospitalId,
                name: request.hospital_name || request.hospitalName,
                location: request.hospital_address || request.hospitalAddress || request.contactInformation || 'N/A',
                phone: request.contact_information || request.contactInformation || request.hospital_phone || request.hospitalPhone || 'N/A',
                bloodTypes: [],
                requests: 0,
                deliveryStatus: request.status || 'PENDING',
                dateNeeded: new Date(request.date_needed || request.dateNeeded).toLocaleString(),
                dateRequest: new Date(request.request_date || request.requestDate).toLocaleString()
              };
            }
            
            // Add blood types from this request
            const bloodItems = request.blood_items || request.bloodItems || [];
            bloodItems.forEach(item => {
              const bloodType = item.blood_type || item.bloodType;
              if (!hospitalMap[hospitalId].bloodTypes.includes(bloodType)) {
                hospitalMap[hospitalId].bloodTypes.push(bloodType);
              }
              
              // Sum up the actual units from each blood item
              const units = item.units || 0;
              hospitalMap[hospitalId].requests += units;
            });
          });
          
          // Convert map to array and format blood types
          const hospitalsArray = Object.values(hospitalMap).map(hospital => ({
            ...hospital,
            bloodTypes: hospital.bloodTypes.join(', ')
          }));
          
          console.log('Transformed hospitals:', hospitalsArray);
          setHospitals(hospitalsArray);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch hospital requests');
        }
      } catch (err) {
        console.error('Error fetching hospital requests:', err);
        setError('Failed to load hospital requests');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalRequests();
  }, [bloodBankId]);

  // Fetch deliveries function
  const fetchDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      console.log('Fetching all deliveries');
      
      const response = await fetchWithAuth('/deliveries');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw deliveries response:', data);
        
        // Handle different response structures
        let deliveriesArray = [];
        if (Array.isArray(data)) {
          deliveriesArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          deliveriesArray = data.data;
        } else if (data.deliveries && Array.isArray(data.deliveries)) {
          deliveriesArray = data.deliveries;
        }
        
        console.log('Deliveries array:', deliveriesArray);
        
        // Transform delivery data
        const transformedDeliveries = deliveriesArray.map(delivery => {
          console.log('Processing delivery:', delivery);
          console.log('Available fields:', Object.keys(delivery));
          console.log('Hospital name field:', delivery.hospitalName);
          console.log('Items summary field:', delivery.itemsSummary);
          console.log('Scheduled date field:', delivery.scheduledDate);
          console.log('Status field:', delivery.status);
          
          // Determine items display
          let itemsDisplay = 'Blood products pending';
          
          if (delivery.bloodItems && delivery.bloodItems.length > 0) {
            itemsDisplay = delivery.bloodItems.map(item => `${item.bloodType} (${item.units} units)`).join(', ');
          } else if (delivery.itemsSummary && delivery.itemsSummary !== 'undefined' && delivery.itemsSummary.trim() !== '') {
            itemsDisplay = delivery.itemsSummary;
          } else if (delivery.items_summary && delivery.items_summary !== 'undefined' && delivery.items_summary.trim() !== '') {
            itemsDisplay = delivery.items_summary;
          }
          
          return {
            id: delivery.id || delivery._id,
            hospital: delivery.hospitalName || delivery.hospital_name || 'City General Hospital',
            date: delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleDateString() : new Date().toLocaleDateString(),
            status: delivery.status || 'PENDING',
            items: itemsDisplay,
            estimatedTime: delivery.estimatedTime || delivery.estimated_time || 'TBD'
          };
        });
        
        console.log('Transformed deliveries:', transformedDeliveries);
        setDeliveries(transformedDeliveries);
      } else {
        const errorData = await response.json();
        setDeliveryError(errorData.message || 'Failed to fetch deliveries');
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setDeliveryError('Failed to load deliveries: ' + err.message);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Fetch deliveries from backend on component mount
  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleViewRequests = (hospital) => {
    setSelectedHospital(hospital);
    setShowRequestsModal(true);
  }


  const getStatusColor = (status) => {
    const normalizedStatus = status?.toUpperCase();
    switch(normalizedStatus) {
      case 'COMPLETE': 
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
      case 'IN TRANSIT': 
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SCHEDULED': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toUpperCase();
    switch(normalizedStatus) {
      case 'COMPLETE': 
      case 'COMPLETED': return <FiCheck className="mr-1.5" />
      case 'IN TRANSIT': 
      case 'IN_TRANSIT': return <FiTruck className="mr-1.5" />
      case 'SCHEDULED': return <FiCalendar className="mr-1.5" />
      case 'PENDING': return <FiClock className="mr-1.5" />
      default: return null
    }
  }

  const filteredHospitals = hospitals
    .filter(h => filterStatus === 'all' || h.deliveryStatus === filterStatus)
    .filter(h => 
      searchTerm === '' || 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.bloodTypes.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const filteredDeliveries = deliveries
    .filter(d => filterStatus === 'all' || d.status === filterStatus)
    .filter(d => 
      searchTerm === '' || 
      d.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

  // Pagination logic for hospitals
  const hospitalsStartIndex = (hospitalsCurrentPage - 1) * itemsPerPage
  const hospitalsEndIndex = hospitalsStartIndex + itemsPerPage
  const paginatedHospitals = filteredHospitals.slice(hospitalsStartIndex, hospitalsEndIndex)

  // Pagination logic for deliveries
  const deliveriesStartIndex = (deliveriesCurrentPage - 1) * itemsPerPage
  const deliveriesEndIndex = deliveriesStartIndex + itemsPerPage
  const paginatedDeliveries = filteredDeliveries.slice(deliveriesStartIndex, deliveriesEndIndex)

  const handleHospitalsPageChange = (page) => {
    setHospitalsCurrentPage(page)
  }

  const handleDeliveriesPageChange = (page) => {
    setDeliveriesCurrentPage(page)
  }

  const formatBloodTypes = (bloodTypesStr) => {
    return bloodTypesStr.split(', ').map((type, index) => {
      // Use consistent red styling for all blood types to match design
      const bgColor = 'bg-red-50 text-red-800 border border-red-200';
      
      return (
        <span 
          key={index} 
          className={`inline-flex items-center px-2 py-0.5 mr-1.5 mb-1 rounded-full text-xs font-medium ${bgColor}`}
        >
          <FiDroplet className="mr-1 w-3 h-3 text-red-600" />
          {type}
        </span>
      );
    });
  }

  const toggleMobileFilters = () => {
    setMobileFilterVisible(!mobileFilterVisible);
  }

  const handleMarkAsInTransit = async (delivery) => {
    const originalDeliveries = deliveries;
    try {
      // Optimistically update the UI
      const updatedDeliveries = deliveries.map(d =>
        d.id === delivery.id ? { ...d, status: DELIVERY_STATUS.IN_TRANSIT } : d
      );
      setDeliveries(updatedDeliveries);

      // Call the API to update the status
      const response = await fetchWithAuth(`/deliveries/${delivery.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: DELIVERY_STATUS.IN_TRANSIT }),
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery status');
      }

    } catch (error) {
      console.error('Error updating delivery status:', error);
      // Revert the UI change if the API call fails
      setDeliveries(originalDeliveries);
      alert('Failed to update delivery status.');
    }
  };

  // Track delivery handler
  const handleTrackDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowTrackModal(true);
  };
  
  // Refresh single delivery in modal
  const handleRefreshDelivery = async () => {
    if (!selectedDelivery) return;
    
    try {
      console.log('Refreshing delivery:', selectedDelivery.id);
      
      const response = await fetchWithAuth(`/deliveries/${selectedDelivery.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Refreshed delivery data:', data);
        
        // Handle different response structures
        let delivery = data;
        if (data.data) {
          delivery = data.data;
        }
        
        // Determine items display
        let itemsDisplay = 'Blood products pending';
        
        if (delivery.bloodItems && delivery.bloodItems.length > 0) {
          itemsDisplay = delivery.bloodItems.map(item => `${item.bloodType} (${item.units} units)`).join(', ');
        } else if (delivery.itemsSummary && delivery.itemsSummary !== 'undefined' && delivery.itemsSummary.trim() !== '') {
          itemsDisplay = delivery.itemsSummary;
        } else if (delivery.items_summary && delivery.items_summary !== 'undefined' && delivery.items_summary.trim() !== '') {
          itemsDisplay = delivery.items_summary;
        }
        
        // Update selected delivery with fresh data
        const updatedDelivery = {
          id: delivery.id || delivery._id,
          hospital: delivery.hospitalName || delivery.hospital_name || 'City General Hospital',
          date: delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleDateString() : new Date().toLocaleDateString(),
          status: delivery.status || 'PENDING',
          items: itemsDisplay,
          estimatedTime: delivery.estimatedTime || delivery.estimated_time || 'TBD'
        };
        
        setSelectedDelivery(updatedDelivery);
        
        // Also update in the deliveries list
        setDeliveries(prev => prev.map(d => 
          d.id === updatedDelivery.id ? updatedDelivery : d
        ));
        
        console.log('Delivery refreshed successfully');
      } else {
        console.error('Failed to refresh delivery');
      }
    } catch (error) {
      console.error('Error refreshing delivery:', error);
    }
  };
  
  // Create new delivery
  const createNewDelivery = (newDelivery) => {
    // In a real app, this would call an API
    // For demo, we'll just add it to the state
    
    // Show success notification (optional)
    alert(`Delivery ${newDelivery.id} has been created successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Desktop pattern background */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none z-0 opacity-5">
        <div className="absolute right-0 top-0 w-1/3 h-1/3">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-500">
            <circle cx="80" cy="20" r="20" fill="currentColor" />
            <path d="M0 100 L100 0" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="absolute left-0 bottom-0 w-1/3 h-1/3">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-500">
            <circle cx="20" cy="80" r="20" fill="currentColor" />
            <path d="M0 0 L100 100" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <main className="flex-grow w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-8 pb-16 relative z-10">
        {/* Enhanced header with background effect for desktop */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 text-gray-800">
            <span className="bg-white shadow-md px-6 sm:px-10 lg:px-16 py-2 sm:py-3 lg:py-4 rounded-full inline-block text-[#C91C1C] relative">
              <span className="hidden lg:block absolute -left-4 -top-4 w-10 h-10 bg-red-50 rounded-full border-4 border-white"></span>
              <span className="hidden lg:block absolute -right-4 -bottom-4 w-10 h-10 bg-red-50 rounded-full border-4 border-white"></span>
              Blood Delivery Management
            </span>
          </h1>
          
          <div className="flex flex-wrap justify-center mt-4 sm:mt-6 gap-2 sm:gap-4 lg:gap-6">
            <button 
              onClick={() => setActiveTab('hospitals')}
              className={`px-4 sm:px-8 lg:px-10 py-2 sm:py-2.5 lg:py-3 rounded-full font-medium transition-all duration-300 flex items-center shadow-sm text-sm sm:text-base lg:text-lg ${
                activeTab === 'hospitals' 
                  ? 'bg-[#C91C1C] text-white hover:bg-[#b01818]' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiActivity className="mr-1.5 sm:mr-2 lg:mr-3 lg:w-5 lg:h-5" />
              Hospital Requests
            </button>
            <button 
              onClick={() => setActiveTab('deliveries')}
              className={`px-4 sm:px-8 lg:px-10 py-2 sm:py-2.5 lg:py-3 rounded-full font-medium transition-all duration-300 flex items-center shadow-sm text-sm sm:text-base lg:text-lg ${
                activeTab === 'deliveries' 
                  ? 'bg-[#C91C1C] text-white hover:bg-[#b01818]' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiTruck className="mr-1.5 sm:mr-2 lg:mr-3 lg:w-5 lg:h-5" />
              Delivery Management
            </button>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button 
            onClick={toggleMobileFilters}
            className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between text-gray-700"
          >
            <span className="flex items-center">
              <FiFilter className="mr-2" />
              Filters & Search
            </span>
            <FiMenu />
          </button>
        </div>

        {/* Search & Filter Bar - Enhanced for desktop */}
        <div className={`
          flex flex-col md:flex-row md:items-center gap-4 mb-6 lg:mb-8
          ${mobileFilterVisible || 'md:flex' ? 'flex' : 'hidden'}
          ${mobileFilterVisible ? 'mb-6' : 'md:mb-6 hidden md:flex'}
        `}>
          <div className="relative w-full md:w-80 lg:w-96">
            <input
              type="text"
              placeholder={`Search ${activeTab === 'hospitals' ? 'hospitals' : 'deliveries'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 lg:py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none lg:text-base"
            />
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 lg:w-5 lg:h-5" />
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 items-start sm:items-center lg:gap-4">
            <label className="text-sm lg:text-base font-medium text-gray-600 whitespace-nowrap">Filter by status:</label>
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2.5 lg:py-3 pr-8 text-sm lg:text-base focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none w-full sm:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN TRANSIT">In Transit</option>
              <option value="COMPLETE">Complete</option>
            </select>
            <button 
              className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2.5 lg:py-3 rounded-lg hover:bg-gray-50 transition-all text-sm lg:text-base w-full sm:w-auto justify-center"
              onClick={() => { setFilterStatus('all'); setSearchTerm(''); }}
            >
              <FiRefreshCw className="mr-1.5" /> Reset
            </button>
          </div>
        </div>

        {activeTab === 'hospitals' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-200 lg:transition-all lg:hover:shadow-xl">
            <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200 flex justify-between items-center bg-white">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold flex items-center text-gray-800">
                <FiActivity className="mr-2 lg:mr-3 text-[#C91C1C] lg:w-6 lg:h-6" /> 
                Hospital Requests
              </h2>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden">
              {paginatedHospitals.length > 0 ? paginatedHospitals.map((hospital, index) => (
                <div key={index} className="p-4 border-b last:border-b-0">
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-800">{hospital.name}</h3>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <FiPhoneCall className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      {hospital.phone}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700 text-sm mb-3">
                    <FiMap className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    {hospital.location}
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Blood Types</div>
                    <div className="flex flex-wrap">
                      {formatBloodTypes(hospital.bloodTypes)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Units</div>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-medium ${
                        hospital.requests > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hospital.requests}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewRequests(hospital)}
                        className="px-3 py-1.5 text-xs text-white bg-[#F05B5B] rounded-lg hover:bg-[#e04d4d] transition-all shadow-sm flex items-center"
                      >
                        <FiEye className="mr-1" /> View
                      </button>
                    </div>
                  </div>
                </div>
              )) : loading ? (
                <div className="p-8 text-center text-gray-500">
                  <FiClock className="w-12 h-12 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-medium">Loading hospital requests...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <p className="text-lg font-medium mb-2">Error loading requests</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : hospitals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiDatabase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No hospital requests yet</p>
                  <p className="text-sm mt-2">Hospital requests will appear here once they are submitted.</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No hospitals match your search criteria. Try adjusting your filters.
                </div>
              )}
            </div>
            
            {/* Enhanced Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-sm lg:text-base text-gray-600">
                    <th className="text-left p-4 lg:p-5 border-b font-semibold">Hospital</th>
                    <th className="text-left p-4 lg:p-5 border-b font-semibold">Location</th>
                    <th className="text-left p-4 lg:p-5 border-b font-semibold">Blood Types</th>
                    <th className="text-left p-4 lg:p-5 border-b font-semibold">Units</th>
                    <th className="p-4 lg:p-5 border-b text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHospitals.length > 0 ? (
                    paginatedHospitals.map((hospital, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors lg:transition-all lg:cursor-pointer group">
                        <td className="p-4 lg:p-5">
                          <div className="font-medium text-gray-800 lg:text-lg">{hospital.name}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <FiPhoneCall className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {hospital.phone}
                          </div>
                        </td>
                        <td className="p-4 lg:p-5">
                          <div className="flex items-center text-gray-700 lg:text-base">
                            <FiMap className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            {hospital.location}
                          </div>
                        </td>
                        <td className="p-4 lg:p-5">
                          <div className="flex flex-wrap">
                            {formatBloodTypes(hospital.bloodTypes)}
                          </div>
                        </td>
                        <td className="p-4 lg:p-5">
                          <span className={`inline-flex items-center justify-center w-7 h-7 lg:w-9 lg:h-9 rounded-full font-medium lg:text-base ${
                            hospital.requests > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {hospital.requests}
                          </span>
                        </td>
                        <td className="p-4 lg:p-5">
                          <div className="flex justify-center space-x-1.5 lg:space-x-2 opacity-90 group-hover:opacity-100">
                            <button
                              onClick={() => handleViewRequests(hospital)}
                              className="px-2 py-1 lg:px-3 lg:py-1.5 text-xs lg:text-sm text-white bg-[#F05B5B] rounded-md hover:bg-[#e04d4d] transition-all shadow-sm flex items-center"
                            >
                              <FiEye className="mr-1 lg:mr-1.5 w-3 h-3 lg:w-4 lg:h-4" /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 lg:p-12 text-center text-gray-500 lg:text-lg">
                        No hospitals match your search criteria. Try adjusting your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Hospitals Pagination */}
            {filteredHospitals.length > 0 && (
              <Pagination
                currentPage={hospitalsCurrentPage}
                totalItems={filteredHospitals.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handleHospitalsPageChange}
                className="border-t"
              />
            )}
          </div>
        )}

        {activeTab === 'deliveries' && (
          <>
           
            
            
            
            {/* Deliveries Table/Cards Section - Enhanced for Desktop */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-200 lg:transition-all lg:hover:shadow-xl">
              <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold flex items-center text-gray-800">
                  <FiTruck className="mr-2 lg:mr-3 text-[#C91C1C] lg:w-6 lg:h-6" /> Manage Blood Deliveries
                </h2>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden">
                {loadingDeliveries ? (
                  <div className="p-8 text-center text-gray-500">
                    <FiClock className="w-12 h-12 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-medium">Loading deliveries...</p>
                  </div>
                ) : deliveryError ? (
                  <div className="p-8 text-center text-red-500">
                    <p className="text-lg font-medium mb-2">Error loading deliveries</p>
                    <p className="text-sm">{deliveryError}</p>
                  </div>
                ) : deliveries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FiDatabase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No deliveries yet</p>
                    <p className="text-sm mt-2">Scheduled deliveries will appear here.</p>
                  </div>
                ) : paginatedDeliveries.length > 0 ? paginatedDeliveries.map((delivery, index) => (
                  <div key={index} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-medium text-gray-800">{delivery.id}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center border ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        {delivery.status}
                      </span>
                    </div>
                    
                    <div className="text-gray-700 mb-2">{delivery.hospital}</div>
                    
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 mb-1">Blood Products</div>
                      <div className="flex flex-wrap gap-1">
                        {delivery.items.split(', ').map((item, i) => (
                          <span 
                            key={i} 
                            className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-800 rounded-lg text-xs font-medium border border-red-200"
                          >
                            <FiDroplet className="mr-1 w-3 h-3 text-red-600" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Date</div>
                        <div className="text-sm">{delivery.date}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Time</div>
                        <div className="text-sm flex items-center">
                          <FiClock className="w-3 h-3 mr-1" />
                          {delivery.estimatedTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center shadow-sm"
                        onClick={() => handleTrackDelivery(delivery)}
                      >
                        <FiEye className="mr-1 w-3 h-3" /> Track
                      </button>
                      <button 
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center shadow-sm ${
                          delivery.status === DELIVERY_STATUS.IN_TRANSIT || delivery.status === DELIVERY_STATUS.COMPLETE
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        onClick={() => handleMarkAsInTransit(delivery)}
                        disabled={delivery.status === DELIVERY_STATUS.IN_TRANSIT || delivery.status === DELIVERY_STATUS.COMPLETE}
                      >
                        <FiTruck className="mr-1 w-3 h-3" /> Mark as In Transit
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-gray-500">
                    No deliveries match your search criteria. Try adjusting your filters.
                  </div>
                )}
              </div>
              
              {/* Enhanced Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-sm lg:text-base text-gray-600">
                      <th className="text-left p-4 lg:p-5 border-b font-semibold">Delivery ID</th>
                      <th className="text-left p-4 lg:p-5 border-b font-semibold">Hospital</th>
                      <th className="text-left p-4 lg:p-5 border-b font-semibold">Blood Products</th>
                      <th className="text-left p-4 lg:p-5 border-b font-semibold">Date &amp; Time</th>
                      <th className="text-left p-4 lg:p-5 border-b font-semibold">Request Status</th>
                      <th className="p-4 lg:p-5 border-b text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDeliveries ? (
                      <tr>
                        <td colSpan="6" className="p-8 lg:p-12 text-center text-gray-500 lg:text-lg">
                          <FiClock className="w-12 h-12 mx-auto mb-4 animate-spin" />
                          <p className="text-lg font-medium">Loading deliveries...</p>
                        </td>
                      </tr>
                    ) : deliveryError ? (
                      <tr>
                        <td colSpan="6" className="p-8 lg:p-12 text-center text-red-500 lg:text-lg">
                          <p className="text-lg font-medium mb-2">Error loading deliveries</p>
                          <p className="text-sm">{deliveryError}</p>
                        </td>
                      </tr>
                    ) : deliveries.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 lg:p-12 text-center text-gray-500 lg:text-lg">
                          <FiDatabase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No deliveries yet</p>
                          <p className="text-sm mt-2">Scheduled deliveries will appear here.</p>
                        </td>
                      </tr>
                    ) : paginatedDeliveries.length > 0 ? (
                      paginatedDeliveries.map((delivery, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 transition-colors lg:transition-all lg:cursor-pointer group">
                          <td className="p-4 lg:p-5 font-medium text-gray-800 lg:text-lg">{delivery.id}</td>
                          <td className="p-4 lg:p-5 text-gray-700 lg:text-base">{delivery.hospital}</td>
                          <td className="p-4 lg:p-5">
                            <div className="flex flex-wrap gap-1">
                              {delivery.items.split(', ').map((item, i) => (
                                <span 
                                  key={i} 
                                  className="inline-flex items-center px-2 py-0.5 lg:px-3 lg:py-1 bg-red-50 text-red-800 rounded-lg text-xs lg:text-sm font-medium border border-red-200"
                                >
                                  <FiDroplet className="mr-1 w-3 h-3 lg:w-4 lg:h-4 text-red-600" />
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 lg:p-5">
                            <div className="text-gray-800 lg:text-base">{delivery.date}</div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <FiClock className="w-3.5 h-3.5 mr-1.5" />
                              {delivery.estimatedTime}
                            </div>
                          </td>
                          <td className="p-4 lg:p-5">
                            <span className={`px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full text-xs lg:text-sm font-medium inline-flex items-center border ${getStatusColor(delivery.status)}`}>
                              {getStatusIcon(delivery.status)}
                              {delivery.status}
                            </span>
                          </td>
                          <td className="p-4 lg:p-5">
                            <div className="flex justify-center space-x-2 lg:space-x-3 opacity-90 group-hover:opacity-100">
                              <button 
                                className="px-3 py-1.5 lg:px-4 lg:py-2 text-sm lg:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center shadow-sm lg:shadow-md"
                                onClick={() => handleTrackDelivery(delivery)}
                              >
                                <FiEye className="mr-1.5 w-3.5 h-3.5 lg:w-4 lg:h-4" /> Track
                              </button>
                              <button 
                                className={`px-3 py-1.5 lg:px-4 lg:py-2 text-sm lg:text-base rounded-lg transition-all flex items-center shadow-sm lg:shadow-md ${
                                  delivery.status === DELIVERY_STATUS.IN_TRANSIT || delivery.status === DELIVERY_STATUS.COMPLETE
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                                onClick={() => handleMarkAsInTransit(delivery)}
                                disabled={delivery.status === DELIVERY_STATUS.IN_TRANSIT || delivery.status === DELIVERY_STATUS.COMPLETE}
                              >
                                <FiTruck className="mr-1.5 w-3.5 h-3.5 lg:w-4 lg:h-4" /> Mark as In Transit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-8 lg:p-12 text-center text-gray-500 lg:text-lg">
                          No deliveries match your search criteria. Try adjusting your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Deliveries Pagination */}
              {filteredDeliveries.length > 0 && (
                <Pagination
                  currentPage={deliveriesCurrentPage}
                  totalItems={filteredDeliveries.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handleDeliveriesPageChange}
                  className="border-t"
                />
              )}
            </div>
            
            
          </>
        )}
      </main>
      
      {/* Track Delivery Modal */}
      {showTrackModal && selectedDelivery && (
        <TrackDelivery 
          delivery={selectedDelivery} 
          onClose={() => setShowTrackModal(false)}
          onRefresh={handleRefreshDelivery}
        />
      )}
      
      {/* Create Delivery Modal */}
      {showCreateModal && (
        <CreateDelivery 
          onClose={() => setShowCreateModal(false)}
          onCreateDelivery={createNewDelivery}
        />
      )}
      
      {/* View Requests Modal */}
      {showRequestsModal && selectedHospital && (
        <ViewRequests 
          hospital={selectedHospital} 
          onClose={() => setShowRequestsModal(false)}
        />
      )}
      
    </div>
  );
}