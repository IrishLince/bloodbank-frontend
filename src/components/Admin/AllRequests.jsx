import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, MapPin, Droplet, Search, Filter, ArrowLeft, X, ChevronRight } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';

const AllRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalPage, setModalPage] = useState(1);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterStatus, setModalFilterStatus] = useState('all');
  const itemsPerPage = 10;
  const modalItemsPerPage = 10;

  // Helper function to clean up repeated hospital names
  const cleanHospitalName = (name) => {
    if (!name) return 'Unknown Hospital';
    // Split by the hospital name and take the first occurrence
    const firstOccurrence = name.split(' ').slice(0, 3).join(' ');
    return firstOccurrence;
  };

  // Fetch requests function (extracted for reuse)
  const fetchAllRequests = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const response = await fetchWithAuth('/hospital-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchAllRequests(true);
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAllRequests(false);
    }, 5000); // 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SCHEDULED': 'bg-yellow-100 text-yellow-800',
      'FULFILLED': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredRequests = requests.filter(request => {
    const hospitalName = request.hospitalName || request.hospital?.hospitalName || '';
    const requestId = request.id || request.requestId || '';
    
    // Check if any blood type matches the search
    const bloodTypes = request.bloodItems?.map(item => item.bloodType).filter(Boolean).join(' ') || '';
    const bloodTypeMatch = bloodTypes.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Calculate total quantity
    const totalQuantity = request.bloodItems?.reduce((sum, item) => sum + (item.units || item.quantity || 0), 0) || 0;
    
    const matchesSearch = 
      hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bloodTypeMatch ||
      requestId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      totalQuantity.toString().includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Group requests by hospital
  const groupedByHospital = filteredRequests.reduce((acc, request) => {
    const hospitalName = cleanHospitalName(request.hospitalName || request.hospital?.hospitalName || 'Unknown Hospital');
    
    if (!acc[hospitalName]) {
      acc[hospitalName] = [];
    }
    acc[hospitalName].push(request);
    return acc;
  }, {});

  const openModal = (hospitalName) => {
    setSelectedHospital(hospitalName);
    setModalPage(1);
    setModalSearchTerm('');
    setModalFilterStatus('all');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedHospital(null);
    setModalPage(1);
    setModalSearchTerm('');
    setModalFilterStatus('all');
  };

  const getHospitalStats = (hospitalRequests) => {
    const pending = hospitalRequests.filter(r => r.status === 'PENDING').length;
    const scheduled = hospitalRequests.filter(r => r.status === 'SCHEDULED').length;
    const fulfilled = hospitalRequests.filter(r => r.status === 'FULFILLED').length;
    const totalQuantity = hospitalRequests.reduce((sum, req) => 
      sum + (req.bloodItems?.reduce((s, item) => s + (item.units || item.quantity || 0), 0) || 0), 0
    );
    return { pending, scheduled, fulfilled, totalQuantity };
  };

  // Pagination logic
  const totalHospitals = Object.keys(groupedByHospital).length;
  const totalPages = Math.ceil(totalHospitals / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHospitals = Object.entries(groupedByHospital).slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <Header />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-purple-100 p-3 rounded-xl">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              All Requests
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Monitor all blood requests from hospitals
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by hospital, blood type, or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="FULFILLED">Fulfilled</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{filteredRequests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredRequests.filter(r => r.status === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredRequests.filter(r => r.status === 'SCHEDULED').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredRequests.filter(r => r.status === 'FULFILLED').length}
            </div>
            <div className="text-sm text-gray-600">Fulfilled</div>
          </div>
        </motion.div>

        {/* Hospitals Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : Object.keys(groupedByHospital).length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50 border-b border-purple-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hospital</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Requests</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Pending</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Scheduled</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fulfilled</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Units</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentHospitals.map(([hospitalName, hospitalRequests], index) => {
                    const stats = getHospitalStats(hospitalRequests);
                    return (
                      <motion.tr
                        key={hospitalName}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-base font-medium text-gray-900">
                              {hospitalName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base text-gray-900">{hospitalRequests.length}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-semibold text-yellow-600">{stats.pending}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-semibold text-purple-600">{stats.scheduled}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-semibold text-green-600">{stats.fulfilled}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-semibold text-red-600">{stats.totalQuantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openModal(hospitalName)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
                          >
                            <span>View Requests</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4 mt-4"
          >
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, totalHospitals)} of {totalHospitals} hospitals
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-500">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {/* Modal for Hospital Requests */}
        <AnimatePresence>
          {showModal && selectedHospital && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedHospital}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {groupedByHospital[selectedHospital]?.length} request(s)
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Modal Search and Filter */}
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search by blood type..."
                          value={modalSearchTerm}
                          onChange={(e) => {
                            setModalSearchTerm(e.target.value);
                            setModalPage(1);
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Filter */}
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          value={modalFilterStatus}
                          onChange={(e) => {
                            setModalFilterStatus(e.target.value);
                            setModalPage(1);
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="PENDING">Pending</option>
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="FULFILLED">Fulfilled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-y-auto p-6 flex-1">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-purple-50 border-b border-purple-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Blood Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {groupedByHospital[selectedHospital]
                            ?.filter(request => {
                              const bloodTypes = request.bloodItems?.map(item => item.bloodType).filter(Boolean).join(' ') || '';
                              
                              const matchesSearch = 
                                bloodTypes.toLowerCase().includes(modalSearchTerm.toLowerCase());
                              
                              const matchesFilter = modalFilterStatus === 'all' || request.status === modalFilterStatus;
                              
                              return matchesSearch && matchesFilter;
                            })
                            .slice((modalPage - 1) * modalItemsPerPage, modalPage * modalItemsPerPage)
                            .map((request, index) => (
                            <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-600">
                                  {(modalPage - 1) * modalItemsPerPage + index + 1}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col space-y-1">
                                  {request.bloodItems?.map((item, idx) => (
                                    <div key={idx} className="flex items-center space-x-1">
                                      <Droplet className="w-3 h-3 text-red-500" />
                                      <span className="text-sm">{item.bloodType || 'N/A'}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col space-y-1">
                                  {request.bloodItems?.map((item, idx) => (
                                    <div key={idx} className="text-sm text-gray-900">
                                      {item.units || item.quantity || 0} units
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Modal Pagination */}
                  {(() => {
                    const filteredRequests = groupedByHospital[selectedHospital]?.filter(request => {
                      const bloodTypes = request.bloodItems?.map(item => item.bloodType).filter(Boolean).join(' ') || '';
                      
                      const matchesSearch = 
                        bloodTypes.toLowerCase().includes(modalSearchTerm.toLowerCase());
                      
                      const matchesFilter = modalFilterStatus === 'all' || request.status === modalFilterStatus;
                      
                      return matchesSearch && matchesFilter;
                    }) || [];
                    const totalFilteredPages = Math.ceil(filteredRequests.length / modalItemsPerPage);
                    
                    return filteredRequests.length > modalItemsPerPage && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {((modalPage - 1) * modalItemsPerPage) + 1} to {Math.min(modalPage * modalItemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
                          </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setModalPage(prev => Math.max(1, prev - 1))}
                            disabled={modalPage === 1}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <div className="flex items-center space-x-1">
                            {[...Array(totalFilteredPages)].map((_, index) => {
                              const page = index + 1;
                              if (
                                page === 1 ||
                                page === totalFilteredPages ||
                                (page >= modalPage - 1 && page <= modalPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setModalPage(page)}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                      modalPage === page
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              } else if (page === modalPage - 2 || page === modalPage + 2) {
                                return <span key={page} className="px-2 text-gray-500">...</span>;
                              }
                              return null;
                            })}
                          </div>
                          <button
                            onClick={() => setModalPage(prev => Math.min(totalFilteredPages, prev + 1))}
                            disabled={modalPage === totalFilteredPages}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AllRequests;

