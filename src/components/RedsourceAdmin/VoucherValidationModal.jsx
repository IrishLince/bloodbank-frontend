import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiMapPin, FiPackage, FiInfo } from 'react-icons/fi';
import { fetchWithAuth } from '../../utils/api';

const VoucherValidationModal = ({ 
  isOpen, 
  onClose, 
  onValidate
}) => {
  const [validationCode, setValidationCode] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [storageLocations, setStorageLocations] = useState([]);
  const [filteredStorageLocations, setFilteredStorageLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [requiredBloodType, setRequiredBloodType] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchStorageLocations();
      // Reset form when modal opens
      setValidationCode('');
      setSelectedStorage('');
      setValidationResult(null);
      setShowRejectModal(false);
      setRejectReason('');
    }
  }, [isOpen]);

  const fetchStorageLocations = async () => {
    setLoading(true);
    try {
      // Get current user (blood bank) ID
      const userResponse = await fetchWithAuth('/auth/me');
      const userData = await userResponse.json();
      const bloodBankId = userData.id;

      // Fetch all inventories for this blood bank using correct endpoint
      const response = await fetchWithAuth(`/blood-inventory/bloodbank/${bloodBankId}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Blood inventory response:', result);
        
        if (result.data && Array.isArray(result.data)) {
          // Create storage options with ID and location info
          const storageOptions = result.data.map(inv => ({
            id: inv.id,
            location: inv.storageLocation || 'Storage A', // Default if no location
            bloodType: inv.bloodTypeId,
            quantity: inv.quantity,
            status: inv.status
          }));
          
          console.log('Storage options:', storageOptions);
          setStorageLocations(storageOptions);
        } else {
          console.log('No inventory data found');
          setStorageLocations([]);
        }
      } else {
        console.error('Failed to fetch storage locations:', response.status);
        setStorageLocations([]);
      }
    } catch (error) {
      console.error('Error fetching storage locations:', error);
      setStorageLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // First step: Validate voucher code and get required blood type
  const handleValidateCode = async () => {
    if (!validationCode.trim()) {
      alert('Please enter a validation code');
      return;
    }

    setValidating(true);
    try {
      // Call the validation API with voucher code in URL path
      const response = await fetchWithAuth(`/reward-points/bloodbank/vouchers/validate/${validationCode.trim()}`, {
        method: 'GET'
      });

      if (response.ok) {
        const voucherData = await response.json();
        console.log('Voucher validation response:', voucherData);
        
        // Extract required blood type from voucher data
        let bloodType = '';
        if (voucherData.data?.voucher?.rewardTitle) {
          // Extract blood type from reward title like "Blood Bag Request - B+"
          const parts = voucherData.data.voucher.rewardTitle.split(' - ');
          if (parts.length > 1) {
            bloodType = parts[1].trim();
          }
        }
        
        console.log('Required blood type:', bloodType);
        setRequiredBloodType(bloodType);
        
        // Filter storage locations to only show matching blood type
        const filtered = storageLocations.filter(storage => storage.bloodType === bloodType);
        console.log('Filtered storage locations:', filtered);
        setFilteredStorageLocations(filtered);
        
        if (filtered.length === 0) {
          alert(`No available storage found for blood type ${bloodType}. Please check your inventory.`);
          return;
        }
        
        // Store voucher data for final validation and reject functionality
        window.currentVoucherData = voucherData;
        setValidationResult(voucherData);
        
      } else {
        const error = await response.json();
        alert('Validation failed: ' + (error.message || 'Invalid voucher code'));
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      alert('Failed to validate voucher. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  // Second step: Final validation with selected storage
  const handleValidate = async () => {
    if (!selectedStorage) {
      alert('Please select a storage location');
      return;
    }

    if (!window.currentVoucherData) {
      alert('Please validate the voucher code first');
      return;
    }

    try {
      // Parse selected storage data
      let storageData;
      try {
        storageData = JSON.parse(selectedStorage);
      } catch (e) {
        storageData = { location: selectedStorage };
      }
      
      // Pass the voucher data and parsed storage data to parent
      onValidate(window.currentVoucherData, storageData);
      onClose();
      
      // Clean up
      window.currentVoucherData = null;
      setRequiredBloodType('');
      setFilteredStorageLocations([]);
      
    } catch (error) {
      console.error('Error processing validation:', error);
      alert('Failed to process validation. Please try again.');
    }
  };

  const handleCancel = () => {
    setValidationCode('');
    setSelectedStorage('');
    setValidationResult(null);
    setShowRejectModal(false);
    setRejectReason('');
    onClose();
  };

  const handleReject = () => {
    if (!validationResult) return;
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const bloodBankId = localStorage.getItem('userId');
      const voucherId = validationResult.data?.voucher?.id;
      
      if (!voucherId) {
        alert('Error: Could not find voucher ID');
        return;
      }

      const response = await fetchWithAuth(`/reward-points/bloodbank/vouchers/${voucherId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectReason,
          bloodBankId: bloodBankId
        })
      });

      if (response.ok) {
        alert('Voucher rejected successfully!');
        setShowRejectModal(false);
        setRejectReason('');
        onClose(); // Close the main modal
      } else {
        const error = await response.json();
        alert('Failed to reject voucher: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting voucher:', error);
      alert('Failed to reject voucher. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Validate Donor Voucher
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Enter the validation code from the donor's voucher to verify its authenticity.
          </p>

          {/* Validation Code Input */}
          <div className="mb-6">
            <label htmlFor="validationCode" className="block text-sm font-medium text-gray-700 mb-2">
              Validation Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="validationCode"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                placeholder="e.g. REQ-1234-D-5678"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={validating}
              />
              <button
                onClick={handleValidateCode}
                disabled={validating || !validationCode.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {validating ? 'Validating...' : 'Validate'}
              </button>
            </div>
          </div>

          {/* Required Blood Type Display */}
          {requiredBloodType && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center text-blue-800">
                <FiInfo className="w-4 h-4 mr-2" />
                <span className="font-medium">Required Blood Type: {requiredBloodType}</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Only storage locations with {requiredBloodType} blood type are shown below.
              </p>
            </div>
          )}

          {/* Storage Selection */}
          <div className="mb-6">
            <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-2">
              <FiMapPin className="inline w-4 h-4 mr-1" />
              Storage Location
            </label>
            {loading ? (
              <div className="text-gray-500 text-sm">Loading storage locations...</div>
            ) : !requiredBloodType ? (
              <div className="text-gray-500 text-sm">Please validate the voucher code first to see available storage locations.</div>
            ) : filteredStorageLocations.length === 0 ? (
              <div className="text-red-500 text-sm">No storage locations available for blood type {requiredBloodType}.</div>
            ) : (
              <select
                id="storage"
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={validating}
              >
                <option value="">Select storage location for {requiredBloodType}</option>
                {filteredStorageLocations.map((storage, index) => (
                  <option key={index} value={JSON.stringify(storage)}>
                    ID: {storage.id} - {storage.location} ({storage.bloodType}, {storage.quantity} units, {storage.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Show Storage ID if selected */}
          {selectedStorage && (
            <div className="mb-6 p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-2">
                  <FiPackage className="w-4 h-4 mr-2" />
                  <span className="font-medium">Selected Storage Details:</span>
                </div>
                {(() => {
                  try {
                    const storage = JSON.parse(selectedStorage);
                    return (
                      <div className="ml-6 space-y-1">
                        <div><strong>ID:</strong> <span className="font-mono">{storage.id}</span></div>
                        <div><strong>Location:</strong> {storage.location}</div>
                        <div><strong>Blood Type:</strong> {storage.bloodType}</div>
                        <div><strong>Quantity:</strong> {storage.quantity} units</div>
                        <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${storage.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{storage.status}</span></div>
                      </div>
                    );
                  } catch (e) {
                    return <span className="ml-6 font-mono text-gray-800">{selectedStorage}</span>;
                  }
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={validating}
          >
            Cancel
          </button>
          {validationResult && (
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          )}
          <button
            onClick={handleValidate}
            disabled={validating || !requiredBloodType || !selectedStorage}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
          >
            {validating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Validate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reject Voucher</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to reject this voucher? This action cannot be undone.
                </p>
                
                {validationResult?.data?.voucher && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Voucher Code:</span>
                        <p className="font-medium">{validationResult.data.voucher.voucherCode}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Reward:</span>
                        <p className="font-medium">{validationResult.data.voucher.rewardTitle}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Donor:</span>
                        <p className="font-medium">{validationResult.data.donorName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Blood Type:</span>
                        <p className="font-medium">{requiredBloodType}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this voucher..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Keep Voucher
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Reject Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VoucherValidationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired
};

export default VoucherValidationModal;
