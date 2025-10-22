import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiPackage, 
  FiSearch, 
  FiEye, 
  FiRefreshCw,
  FiDroplet,
  FiXCircle
} from 'react-icons/fi';
import { fetchWithAuth } from '../../utils/api';
import { toast } from 'react-toastify';

const AllInventories = () => {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBloodBank, setSelectedBloodBank] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalPage, setModalPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBloodType, setFilterBloodType] = useState('All');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterBloodType, setModalFilterBloodType] = useState('All');
  const itemsPerPage = 10;
  const modalItemsPerPage = 10;

  useEffect(() => {
    fetchBloodBanks();
    fetchAllInventories();
  }, []);

  const fetchBloodBanks = async () => {
    try {
      const response = await fetchWithAuth('/bloodbanks');
      if (response.ok) {
        const data = await response.json();
        setBloodBanks(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching blood banks:', error);
      toast.error('Failed to fetch blood banks');
    }
  };

  const fetchAllInventories = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/blood-inventory');
      if (response.ok) {
        const data = await response.json();
        setInventories(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching inventories:', error);
      toast.error('Failed to fetch inventories');
    } finally {
      setLoading(false);
    }
  };

  const getBloodBankStats = (bloodBankId) => {
    const bankInventories = inventories.filter(inv => inv.bloodBankId === bloodBankId);
    
    const stats = {
      totalUnits: bankInventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0),
      totalBatches: bankInventories.length,
      bloodTypes: {}
    };

    bankInventories.forEach(inv => {
      const bloodType = inv.bloodTypeId || 'Unknown';
      if (!stats.bloodTypes[bloodType]) {
        stats.bloodTypes[bloodType] = 0;
      }
      stats.bloodTypes[bloodType] += inv.quantity || 0;
    });

    return stats;
  };

  const openModal = (bloodBank) => {
    setSelectedBloodBank(bloodBank);
    setShowModal(true);
    setModalPage(1);
    setModalSearchTerm('');
    setModalFilterBloodType('All');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBloodBank(null);
    setModalPage(1);
  };

  const getBloodBankInventories = () => {
    if (!selectedBloodBank) return [];
    return inventories.filter(inv => inv.bloodBankId === selectedBloodBank.id);
  };

  const getFilteredInventories = () => {
    let filtered = getBloodBankInventories();

    // Apply search filter
    if (modalSearchTerm) {
      filtered = filtered.filter(inv => 
        (inv.bloodTypeId || '').toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        (inv.id || '').toLowerCase().includes(modalSearchTerm.toLowerCase())
      );
    }

    // Apply blood type filter
    if (modalFilterBloodType !== 'All') {
      filtered = filtered.filter(inv => inv.bloodTypeId === modalFilterBloodType);
    }

    return filtered;
  };

  const getFilteredBloodBanks = () => {
    let filtered = bloodBanks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(bb => 
        (bb.bloodBankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bb.address || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply blood type filter
    if (filterBloodType !== 'All') {
      filtered = filtered.filter(bb => {
        const stats = getBloodBankStats(bb.id);
        return stats.bloodTypes[filterBloodType] > 0;
      });
    }

    return filtered;
  };

  const filteredBloodBanks = getFilteredBloodBanks();
  const totalPages = Math.ceil(filteredBloodBanks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBloodBanks = filteredBloodBanks.slice(startIndex, endIndex);

  const filteredInventories = getFilteredInventories();
  const modalTotalPages = Math.ceil(filteredInventories.length / modalItemsPerPage);
  const modalStartIndex = (modalPage - 1) * modalItemsPerPage;
  const modalEndIndex = modalStartIndex + modalItemsPerPage;
  const paginatedInventories = filteredInventories.slice(modalStartIndex, modalEndIndex);

  // Get unique blood types for filter
  const uniqueBloodTypes = [...new Set(inventories.map(inv => inv.bloodTypeId))].filter(Boolean).sort();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Unavailable':
        return 'bg-red-100 text-red-800';
      case 'Expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-red-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
                <FiPackage className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  All Inventories
                </h1>
                <p className="text-gray-600 text-lg">
                  View and manage blood bank inventories
                </p>
              </div>
            </div>
            <button
              onClick={fetchAllInventories}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Blood Banks</p>
                <p className="text-3xl font-bold text-gray-900">{bloodBanks.length}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <FiPackage className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Inventory Batches</p>
                <p className="text-3xl font-bold text-gray-900">{inventories.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FiDroplet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Blood Units</p>
                <p className="text-3xl font-bold text-gray-900">
                  {inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <FiDroplet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by blood bank name or address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterBloodType}
              onChange={(e) => {
                setFilterBloodType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="All">All Blood Types</option>
              {uniqueBloodTypes.map(bloodType => (
                <option key={bloodType} value={bloodType}>{bloodType}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Blood Banks Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-red-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Blood Bank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Address</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Total Units</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Total Batches</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedBloodBanks.map((bloodBank, index) => {
                      const stats = getBloodBankStats(bloodBank.id);
                      return (
                        <motion.tr
                          key={bloodBank.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{bloodBank.bloodBankName}</p>
                              <p className="text-sm text-gray-500">{bloodBank.phone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{bloodBank.address}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                              {stats.totalUnits} units
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                              {stats.totalBatches} batches
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => openModal(bloodBank)}
                              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                              <FiEye className="w-4 h-4 mr-2" />
                              View Inventory
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Inventory Modal */}
      {showModal && selectedBloodBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedBloodBank.bloodBankName}</h3>
                  <p className="text-sm text-gray-600">{selectedBloodBank.address}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by blood type or batch ID..."
                      value={modalSearchTerm}
                      onChange={(e) => {
                        setModalSearchTerm(e.target.value);
                        setModalPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={modalFilterBloodType}
                  onChange={(e) => {
                    setModalFilterBloodType(e.target.value);
                    setModalPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="All">All Blood Types</option>
                  {uniqueBloodTypes.map(bloodType => (
                    <option key={bloodType} value={bloodType}>{bloodType}</option>
                  ))}
                </select>
              </div>

              {/* Inventory Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-red-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Blood Type</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batch ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedInventories.map((inventory, index) => (
                      <motion.tr
                        key={inventory.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {(modalPage - 1) * modalItemsPerPage + index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-semibold text-gray-900">{inventory.bloodTypeId}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            {inventory.quantity} units
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inventory.status)}`}>
                            {inventory.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-gray-600">{inventory.id}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Pagination */}
              {modalTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setModalPage(prev => Math.max(1, prev - 1))}
                    disabled={modalPage === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {modalPage} of {modalTotalPages}
                  </span>
                  <button
                    onClick={() => setModalPage(prev => Math.min(modalTotalPages, prev + 1))}
                    disabled={modalPage === modalTotalPages}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AllInventories;

