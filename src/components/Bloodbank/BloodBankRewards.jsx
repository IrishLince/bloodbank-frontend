import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiSearch, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiAlertCircle,
  FiKey,
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiRefreshCw
} from 'react-icons/fi';
import { Star, ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '../../utils/api';
import { toast } from 'react-toastify';

const BloodBankRewards = () => {
  const navigate = useNavigate();
  const [voucherCode, setVoucherCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [voucherToCancel, setVoucherToCancel] = useState(null);
  const itemsPerPage = 10;

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setShowValidationModal(false);
    
    try {
      console.log('Validating voucher:', voucherCode);
      const response = await fetchWithAuth(`/reward-points/bloodbank/vouchers/validate/${voucherCode}`);
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Validation successful:', data);
        setValidationResult(data.data);
        setShowValidationModal(true);
      } else {
        const errorData = await response.json();
        console.log('Validation failed:', errorData);
        const errorMsg = errorData.message || errorData.error || 'Invalid voucher code';
        
        // Show error modal
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
        
        setValidationResult(null);
        setShowValidationModal(false);
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      toast.error('Failed to validate voucher. Please try again.');
      setValidationResult(null);
      setShowValidationModal(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAcceptVoucher = async () => {
    if (!validationResult?.voucher) {
      toast.error('No voucher to accept');
      return;
    }

    console.log('Accepting voucher:', validationResult.voucher.rewardType);

    // If it's a blood bag voucher, show inventory selection modal
    if (validationResult.voucher.rewardType === 'BLOOD_BAG_VOUCHER') {
      console.log('Blood bag voucher detected, fetching inventory...');
      await fetchInventoryForBloodBag();
      return;
    }

    console.log('Non-blood bag voucher, accepting directly...');
    // For other voucher types, accept directly
    await acceptVoucherDirectly();
  };

  const fetchInventoryForBloodBag = async () => {
    setLoadingInventory(true);
    try {
      const bloodBankId = localStorage.getItem('userId');
      console.log('Fetching inventory for blood bank:', bloodBankId);
      
      // Extract blood type from voucher title (e.g., "Blood Bag Voucher - A+")
      const voucherTitle = validationResult.voucher.rewardTitle;
      const bloodType = voucherTitle.split(' - ')[1] || null;
      console.log('Required blood type:', bloodType);
      
      const response = await fetchWithAuth(`/blood-inventory/bloodbank/${bloodBankId}`);
      console.log('Inventory response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Inventory data:', data);
        const inventory = data.data || [];
        
        // Filter only available blood bags matching the required blood type
        const availableInventory = inventory.filter(item => {
          const isAvailable = (item.quantity > 0 || item.availableUnits > 0) && 
                             (item.status === 'Available' || item.status === 'AVAILABLE');
          const matchesBloodType = !bloodType || item.bloodTypeId === bloodType;
          return isAvailable && matchesBloodType;
        });
        
        console.log('Available inventory (filtered):', availableInventory);
        
        if (availableInventory.length === 0) {
          toast.error(`No available inventory for blood type ${bloodType || 'unknown'}`);
          setLoadingInventory(false);
          return;
        }
        
        setInventoryList(availableInventory);
        setShowInventoryModal(true);
        setShowValidationModal(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch inventory:', errorData);
        toast.error('Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  const acceptVoucherDirectly = async () => {
    try {
      const bloodBankId = localStorage.getItem('userId');
      const response = await fetchWithAuth(`/reward-points/bloodbank/vouchers/${validationResult.voucher.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ bloodBankId })
      });

      if (response.ok) {
        const isBloodBagVoucher = validationResult.voucher.rewardType === 'BLOOD_BAG_VOUCHER';
        
        toast.success('Voucher accepted successfully!');
        setShowValidationModal(false);
        setShowInventoryModal(false);
        setVoucherCode('');
        setValidationResult(null);
        setSelectedInventory(null);
        setInventoryList([]);
        
        // Refresh history
        fetchRedemptionHistory();
        
        // Redirect to inventory/blood bag requests for blood bag vouchers
        if (isBloodBagVoucher) {
          setTimeout(() => {
            navigate('/inventory', { state: { view: 'requests' } });
          }, 1000);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to accept voucher');
      }
    } catch (error) {
      console.error('Error accepting voucher:', error);
      toast.error('Failed to accept voucher');
    }
  };

  const handleConfirmInventorySelection = async () => {
    if (!selectedInventory) {
      toast.error('Please select an inventory item');
      return;
    }

    // Accept the voucher with the selected inventory
    await acceptVoucherDirectly();
    
    // Close inventory modal
    setShowInventoryModal(false);
    setSelectedInventory(null);
    setInventoryList([]);
    
    // Redirect will happen in acceptVoucherDirectly for blood bag vouchers
  };

  const handleMarkCompleted = async (voucherId) => {
    if (!window.confirm('Mark this voucher as completed?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/reward-points/bloodbank/vouchers/${voucherId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Voucher marked as completed!');
        // Refresh history
        fetchRedemptionHistory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to mark as completed');
      }
    } catch (error) {
      console.error('Error marking voucher as completed:', error);
      toast.error('Failed to mark as completed');
    }
  };

  const handleCancelVoucher = (voucher) => {
    setVoucherToCancel(voucher);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      const bloodBankId = localStorage.getItem('userId');
      const response = await fetchWithAuth(`/reward-points/bloodbank/vouchers/${voucherToCancel.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          reason: cancelReason,
          bloodBankId: bloodBankId
        })
      });

      if (response.ok) {
        toast.success('Voucher rejected successfully!');
        setShowCancelModal(false);
        setVoucherToCancel(null);
        setCancelReason('');
        // Refresh history
        fetchRedemptionHistory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to reject voucher');
      }
    } catch (error) {
      console.error('Error rejecting voucher:', error);
      toast.error('Failed to reject voucher');
    }
  };

  const fetchRedemptionHistory = async () => {
    setLoadingHistory(true);
    try {
      const bloodBankId = localStorage.getItem('userId');
      const response = await fetchWithAuth(`/reward-points/bloodbank/vouchers?bloodBankId=${bloodBankId}`);
      
      if (response.ok) {
        const data = await response.json();
        const vouchers = data.data || [];
        
        // Sort by date (newest first)
        const sortedVouchers = vouchers.sort((a, b) => 
          new Date(b.redeemedDate) - new Date(a.redeemedDate)
        );
        
        setRedemptionHistory(sortedVouchers);
        setTotalPages(Math.ceil(sortedVouchers.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching redemption history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRedemptionHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
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
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Incentive Vouchers
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Validate and accept donor incentive vouchers
          </p>
        </motion.div>

        {/* Validation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiKey className="w-6 h-6 text-red-600" />
            Validate Donor Voucher
          </h2>
          
          <p className="text-gray-600 mb-6">
            Enter the validation code from the donor's voucher to verify its authenticity and redeemability.
          </p>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Enter voucher code (e.g., RDS-XXXXXXXX)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleValidateVoucher();
                  }
                }}
              />
            </div>
            <button
              onClick={handleValidateVoucher}
              disabled={isValidating}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Validating...
                </>
              ) : (
                <>
                  <FiSearch className="w-5 h-5" />
                  Validate
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Instructions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5 text-blue-600" />
            How to Validate Vouchers
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">1.</span>
              <span>Ask the donor for their voucher code (typically starts with "RDS-")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">2.</span>
              <span>Enter the code in the validation field above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">3.</span>
              <span>Review the voucher details and donor information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">4.</span>
              <span>Accept the voucher if valid and process the incentive</span>
            </li>
          </ul>
        </motion.div>

        {/* Redemption History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiClock className="w-6 h-6 text-red-600" />
              Redemption History
            </h2>
            <button
              onClick={fetchRedemptionHistory}
              disabled={loadingHistory}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FiRefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : redemptionHistory.length === 0 ? (
            <div className="text-center py-12">
              <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No redemption history yet</p>
              <p className="text-gray-400 text-sm mt-2">Accepted vouchers will appear here</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Voucher Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Incentive</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Donor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptionHistory
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((voucher, index) => (
                        <motion.tr
                          key={voucher.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {voucher.voucherCode}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-700">
                              {voucher.rewardTitle}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-gray-900">
                              {voucher.donorName || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-700">
                              {new Date(voucher.redeemedDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(voucher.status)}`}>
                              {voucher.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {voucher.status === 'PENDING' ? (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleAcceptVoucher()}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <FiCheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </button>
                                {voucher.rewardType === 'BLOOD_BAG_VOUCHER' && (
                                  <button
                                    onClick={() => handleCancelVoucher(voucher)}
                                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    <FiXCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </button>
                                )}
                              </div>
                            ) : voucher.status === 'PROCESSING' ? (
                              <button
                                onClick={() => handleMarkCompleted(voucher.id)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <FiCheckCircle className="w-4 h-4 mr-1" />
                                Mark as Completed
                              </button>
                            ) : voucher.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-600 text-xs font-semibold rounded-md">
                                <FiCheckCircle className="w-4 h-4 mr-1" />
                                Completed
                              </span>
                            ) : voucher.status === 'CANCELLED' ? (
                              <span className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-600 text-xs font-semibold rounded-md">
                                <FiXCircle className="w-4 h-4 mr-1" />
                                Cancelled
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                  {/* Page Info */}
                  <div className="text-sm text-gray-600 order-2 sm:order-1">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, redemptionHistory.length)} of {redemptionHistory.length} results
                  </div>
                  
                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        
                        if (!showPage) {
                          // Show ellipsis
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="px-2 text-gray-400">...</span>
                          }
                          return null
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white shadow-md'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Validation Result Modal */}
      {showValidationModal && validationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {validationResult.isValid ? (
                    <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  ) : (
                    <FiXCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  )}
                  Voucher Details
                </h3>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <FiXCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Voucher Info */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Voucher Code</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 break-all">{validationResult.voucher.voucherCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(validationResult.voucher.status)}`}>
                        {validationResult.voucher.status}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Incentive Type</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                        {validationResult.voucher.rewardType.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Points Cost</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{validationResult.voucher.pointsCost} points</p>
                    </div>
                    {validationResult.voucher.redeemableAt && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Redeemable At</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          validationResult.voucher.redeemableAt === 'HOSPITAL' ? 'bg-red-100 text-red-800' :
                          validationResult.voucher.redeemableAt === 'BLOODBANK' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {validationResult.voucher.redeemableAt === 'HOSPITAL' ? 'Hospital Only' :
                           validationResult.voucher.redeemableAt === 'BLOODBANK' ? 'Blood Bank Only' :
                           'Both Locations'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Donor Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Donor Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Name</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{validationResult.donorName}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-all">{validationResult.donorEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    Important Dates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Redeemed Date</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {new Date(validationResult.voucher.redeemedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {validationResult.voucher.expiryDate 
                          ? new Date(validationResult.voucher.expiryDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {validationResult.isValid && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setVoucherToCancel({
                        id: validationResult.voucher.id,
                        voucherCode: validationResult.voucher.voucherCode,
                        rewardTitle: validationResult.voucher.rewardTitle,
                        rewardType: validationResult.voucher.rewardType,
                        donorName: validationResult.donorName
                      });
                      setShowValidationModal(false);
                      setShowCancelModal(true);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold"
                  >
                    Reject Voucher
                  </button>
                  <button
                    onClick={handleAcceptVoucher}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold"
                  >
                    Accept Voucher
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-full">
                    <FiAlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Validation Failed
                  </h3>
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Error Message */}
              <div className="mb-6">
                <p className="text-gray-700 text-lg">
                  {errorMessage}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Inventory Selection Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-full">
                    <FiCreditCard className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Select Inventory
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowInventoryModal(false);
                    setSelectedInventory(null);
                    setInventoryList([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Please select which blood bag from your inventory to allocate for this voucher.
                </p>
                {validationResult?.voucher?.rewardTitle && (
                  <p className="text-sm font-semibold text-blue-900 mt-2">
                    Required Blood Type: <span className="text-red-600">{validationResult.voucher.rewardTitle.split(' - ')[1] || 'Unknown'}</span>
                  </p>
                )}
              </div>

              {/* Inventory List */}
              {loadingInventory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : inventoryList.length === 0 ? (
                <div className="text-center py-12">
                  <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No available inventory</p>
                  <p className="text-gray-400 text-sm mt-2">Please add blood bags to your inventory first</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {inventoryList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedInventory(item)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedInventory?.id === item.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedInventory?.id === item.id
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedInventory?.id === item.id && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Blood Type: {item.bloodTypeId || item.bloodType}</h4>
                            <p className="text-sm text-gray-600">Batch ID: {item.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{item.quantity || item.availableUnits || 0} units</p>
                          <p className="text-xs text-gray-500">{item.status || 'Available'}</p>
                        </div>
                      </div>
                      {selectedInventory?.id === item.id && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-sm text-red-700">
                            ✓ This blood bag will be allocated for the voucher
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowInventoryModal(false);
                    setSelectedInventory(null);
                    setInventoryList([]);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInventorySelection}
                  disabled={!selectedInventory}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && voucherToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-full">
                    <FiXCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Reject Voucher
                  </h3>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Voucher Info */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Voucher Details</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Code:</span>
                      <span className="ml-2 font-mono text-sm font-semibold text-gray-900">
                        {voucherToCancel.voucherCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Incentive:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {voucherToCancel.rewardTitle}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Donor:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {voucherToCancel.donorName || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {voucherToCancel.rewardType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this voucher..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {cancelReason.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Keep Voucher
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold"
                >
                  Reject Voucher
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BloodBankRewards;

