import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Search, Filter, ArrowLeft, X, ChevronRight, Building2, Heart } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';

const AllRewardRedemptions = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'hospital' or 'bloodbank'
  const [currentPage, setCurrentPage] = useState(1);
  const [modalPage, setModalPage] = useState(1);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterStatus, setModalFilterStatus] = useState('all');
  const [modalFilterType, setModalFilterType] = useState('all');
  const itemsPerPage = 10;
  const modalItemsPerPage = 10;

  useEffect(() => {
    fetchGroupedRedemptions();
  }, []);

  const fetchGroupedRedemptions = async () => {
    try {
      const response = await fetchWithAuth('/reward-points/admin/redemptions');
      if (response.ok) {
        const data = await response.json();
        const groupedData = data.data || data;
        
        // Convert objects to arrays for easier handling
        const hospitalArray = Object.values(groupedData.hospitals || {});
        const bloodBankArray = Object.values(groupedData.bloodBanks || {});
        
        setHospitals(hospitalArray);
        setBloodBanks(bloodBankArray);
      }
    } catch (error) {
      console.error('Error fetching grouped redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'VALIDATED': return 'text-green-600 bg-green-50';
      case 'EXPIRED': return 'text-red-600 bg-red-50';
      case 'CANCELLED': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'BLOOD_BAG_VOUCHER': return 'text-red-600 bg-red-50';
      case 'MEDICAL_SERVICE': return 'text-blue-600 bg-blue-50';
      case 'GIFT_CARD': return 'text-purple-600 bg-purple-50';
      case 'PRIORITY_BOOKING': return 'text-orange-600 bg-orange-50';
      case 'BADGE': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Filter hospitals and blood banks
  const filteredHospitals = hospitals.filter(hospital => 
    hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBloodBanks = bloodBanks.filter(bloodBank => 
    bloodBank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bloodBank.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for hospitals
  const totalHospitalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const hospitalStartIndex = (currentPage - 1) * itemsPerPage;
  const hospitalEndIndex = hospitalStartIndex + itemsPerPage;
  const currentHospitals = filteredHospitals.slice(hospitalStartIndex, hospitalEndIndex);

  // Pagination for blood banks
  const totalBloodBankPages = Math.ceil(filteredBloodBanks.length / itemsPerPage);
  const bloodBankStartIndex = (currentPage - 1) * itemsPerPage;
  const bloodBankEndIndex = bloodBankStartIndex + itemsPerPage;
  const currentBloodBanks = filteredBloodBanks.slice(bloodBankStartIndex, bloodBankEndIndex);

  const openModal = (entity, type) => {
    setSelectedEntity(entity);
    setModalType(type);
    setShowModal(true);
    setModalPage(1);
    setModalSearchTerm('');
    setModalFilterStatus('all');
    setModalFilterType('all');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEntity(null);
    setModalType('');
  };

  // Modal filtering
  const modalRedemptions = selectedEntity ? selectedEntity.redemptions || [] : [];
  const filteredModalRedemptions = modalRedemptions.filter(redemption => {
    const matchesSearch = redemption.rewardTitle?.toLowerCase().includes(modalSearchTerm.toLowerCase());
    
    const matchesStatus = modalFilterStatus === 'all' || redemption.status === modalFilterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const modalTotalPages = Math.ceil(filteredModalRedemptions.length / modalItemsPerPage);
  const modalStartIndex = (modalPage - 1) * modalItemsPerPage;
  const modalEndIndex = modalStartIndex + modalItemsPerPage;
  const currentModalRedemptions = filteredModalRedemptions.slice(modalStartIndex, modalEndIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <Header />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-green-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/20 to-transparent rounded-full blur-3xl" />
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
            <div className="bg-green-100 p-3 rounded-xl">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              All Reward Redemptions
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            View reward redemption history grouped by hospitals and blood banks
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by hospital or blood bank name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {hospitals.reduce((sum, h) => sum + h.totalRedemptions, 0)}
            </div>
            <div className="text-sm text-gray-600">Hospital Redemptions</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {bloodBanks.reduce((sum, b) => sum + b.totalRedemptions, 0)}
            </div>
            <div className="text-sm text-gray-600">Blood Bank Redemptions</div>
          </div>
        </motion.div>

        {/* Hospitals Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Hospitals</h2>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading hospitals...</p>
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hospitals with redemptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                    <thead className="bg-blue-50 border-b border-blue-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hospital Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Redemptions</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentHospitals.map((hospital, index) => (
                    <motion.tr
                      key={hospital.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-base font-medium text-gray-900">
                            {hospital.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-semibold text-blue-600">{hospital.totalRedemptions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openModal(hospital, 'hospital')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
                        >
                          <span>View Redemptions</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Blood Banks Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Blood Banks</h2>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading blood banks...</p>
            </div>
          ) : filteredBloodBanks.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No blood banks with redemptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                    <thead className="bg-red-50 border-b border-red-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Blood Bank Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Redemptions</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentBloodBanks.map((bloodBank, index) => (
                    <motion.tr
                      key={bloodBank.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <Heart className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="text-base font-medium text-gray-900">
                            {bloodBank.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-semibold text-red-600">{bloodBank.totalRedemptions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openModal(bloodBank, 'bloodbank')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
                        >
                          <span>View Redemptions</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {(totalHospitalPages > 1 || totalBloodBankPages > 1) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4"
          >
            <div className="text-sm text-gray-600">
              Showing hospitals and blood banks with redemptions
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.max(totalHospitalPages, totalBloodBankPages)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {/* Modal for Entity Redemptions */}
        <AnimatePresence>
          {showModal && selectedEntity && (
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
                className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${modalType === 'hospital' ? 'bg-blue-100' : 'bg-red-100'}`}>
                      {modalType === 'hospital' ? 
                        <Building2 className="w-6 h-6 text-blue-600" /> : 
                        <Heart className="w-6 h-6 text-red-600" />
                      }
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedEntity.name}</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {filteredModalRedemptions.length} redemption(s)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Modal Search and Filter */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by reward title..."
                        value={modalSearchTerm}
                        onChange={(e) => setModalSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={modalFilterStatus}
                        onChange={(e) => setModalFilterStatus(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                      >
                        <option value="all">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-green-50 border-b border-green-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reward Title</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentModalRedemptions.map((redemption, index) => (
                          <motion.tr
                            key={redemption.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {modalStartIndex + index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{redemption.rewardTitle}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(redemption.status)}`}>
                                {redemption.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {redemption.redeemedDate ? new Date(redemption.redeemedDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Pagination */}
                {modalTotalPages > 1 && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {modalStartIndex + 1} to {Math.min(modalEndIndex, filteredModalRedemptions.length)} of {filteredModalRedemptions.length} redemptions
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setModalPage(prev => Math.max(1, prev - 1))}
                          disabled={modalPage === 1}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {modalPage} of {modalTotalPages}
                        </span>
                        <button
                          onClick={() => setModalPage(prev => Math.min(modalTotalPages, prev + 1))}
                          disabled={modalPage === modalTotalPages}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AllRewardRedemptions;