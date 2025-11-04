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
import { Star } from 'lucide-react';
import { fetchWithAuth } from '../../utils/api';
import { toast } from 'react-toastify';

const HospitalRewards = () => {
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
      const response = await fetchWithAuth(`/reward-points/hospital/vouchers/validate/${voucherCode}`);
      
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
    if (!validationResult?.id) {
      toast.error('No voucher to accept');
      return;
    }

    try {
      const hospitalId = localStorage.getItem('userId');
      const response = await fetchWithAuth(`/reward-points/hospital/vouchers/${validationResult.id}/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'PROCESSING',
          hospitalId: hospitalId
        })
      });

      if (response.ok) {
        toast.success('Voucher accepted successfully!');
        setShowValidationModal(false);
        setVoucherCode('');
        setValidationResult(null);
        // Refresh history
        fetchRedemptionHistory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to accept voucher');
      }
    } catch (error) {
      console.error('Error accepting voucher:', error);
      toast.error('Failed to accept voucher');
    }
  };

  const handleMarkCompleted = async (voucherId) => {
    if (!window.confirm('Mark this voucher as completed?')) {
      return;
    }

    try {
      const hospitalId = localStorage.getItem('userId');
      const response = await fetchWithAuth(`/reward-points/hospital/vouchers/${voucherId}/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'COMPLETED',
          hospitalId: hospitalId
        })
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
    // Close validation modal if it's open
    if (showValidationModal) {
      setShowValidationModal(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      const hospitalId = localStorage.getItem('userId');
      const response = await fetchWithAuth(`/reward-points/hospital/vouchers/${voucherToCancel.id}/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'CANCELLED',
          hospitalId: hospitalId,
          notes: cancelReason
        })
      });

      if (response.ok) {
        toast.success('Voucher cancelled successfully!');
        setShowCancelModal(false);
        setVoucherToCancel(null);
        setCancelReason('');
        // Refresh history
        fetchRedemptionHistory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to cancel voucher');
      }
    } catch (error) {
      console.error('Error cancelling voucher:', error);
      toast.error('Failed to cancel voucher');
    }
  };

  const fetchRedemptionHistory = async () => {
    setLoadingHistory(true);
    try {
      const hospitalId = localStorage.getItem('userId');
      const response = await fetchWithAuth(`/reward-points/hospital/${hospitalId}/validations`);
      
      if (response.ok) {
        const data = await response.json();
        const vouchers = data.data || [];
        
        // Sort by date (newest first)
        const sortedVouchers = vouchers.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
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
      case 'DELIVERED':
      case 'COMPLETED':
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
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Reward Vouchers
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Validate and accept donor reward vouchers
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
            <FiKey className="w-6 h-6 text-blue-600" />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
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
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <span>Accept the voucher if valid and process the reward</span>
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
              <FiClock className="w-6 h-6 text-blue-600" />
              Validation History
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : redemptionHistory.length === 0 ? (
            <div className="text-center py-12">
              <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No validation history yet</p>
              <p className="text-gray-400 text-sm mt-2">Accepted vouchers will appear here</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Voucher Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reward</th>
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
                              {new Date(voucher.updatedAt || voucher.createdAt).toLocaleDateString()}
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
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <FiCheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleCancelVoucher(voucher)}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <FiXCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </button>
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
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
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

      {/* Validation Result Modal */}
      {showValidationModal && validationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {validationResult.isValid ? (
                    <FiCheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <FiXCircle className="w-6 h-6 text-red-600" />
                  )}
                  Voucher Details
                </h3>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Voucher Info */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Voucher Code</p>
                      <p className="text-lg font-semibold text-gray-900">{validationResult.voucherCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(validationResult.status)}`}>
                        {validationResult.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Reward Type</p>
                      <p className="text-lg font-semibold text-gray-900">{validationResult.rewardType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Points Cost</p>
                      <p className="text-lg font-semibold text-gray-900">{validationResult.pointsCost} points</p>
                    </div>
                    {validationResult.redeemableAt && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Redeemable At</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          validationResult.redeemableAt === 'HOSPITAL' ? 'bg-green-100 text-green-800' :
                          validationResult.redeemableAt === 'BLOODBANK' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {validationResult.redeemableAt === 'HOSPITAL' ? 'Hospital Only' :
                           validationResult.redeemableAt === 'BLOODBANK' ? 'Blood Bank Only' :
                           'Both Locations'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Donor Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-blue-600" />
                    Donor Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Name</p>
                      <p className="text-base font-medium text-gray-900">{validationResult.donorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-base font-medium text-gray-900">{validationResult.donorEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiCalendar className="w-5 h-5 text-green-600" />
                    Important Dates
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Redeemed Date</p>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(validationResult.redeemedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                      <p className="text-base font-medium text-gray-900">
                        {validationResult.expiryDate 
                          ? new Date(validationResult.expiryDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Close
                </button>
                {validationResult.isValid && (
                  <>
                    <button
                      onClick={() => handleCancelVoucher(validationResult)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleAcceptVoucher}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold"
                    >
                      Accept Voucher
                    </button>
                  </>
                )}
              </div>
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
                  <h3 className="text-2xl font-bold text-gray-900">
                    Cancel Voucher
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
                      <span className="text-sm text-gray-600">Reward:</span>
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
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please provide a reason for cancelling this voucher..."
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
                  Cancel Voucher
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HospitalRewards;
