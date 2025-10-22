import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowLeft, Search, Mail, Phone, MapPin, Calendar, Edit2, X, Check } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import Pagination from '../Pagination';

const BloodBanksList = () => {
  const navigate = useNavigate();
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBloodBank, setEditingBloodBank] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBloodBanks();
  }, []);

  const fetchBloodBanks = async () => {
    try {
      const response = await fetchWithAuth('/admin/bloodbanks');
      if (response.ok) {
        const data = await response.json();
        setBloodBanks(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching blood banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBloodBanks = bloodBanks.filter(bloodBank =>
    bloodBank.bloodBankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bloodBank.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bloodBank.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredBloodBanks.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBloodBanks = filteredBloodBanks.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEdit = (bloodBank) => {
    // Parse operating hours if it exists
    let openingTime = '08:00';
    let closingTime = '17:00';
    let operatingDays = [];
    
    if (bloodBank.operatingHours) {
      // Parse format like "Mon-Fri 09:00 - 17:00" or "Mon,Wed,Fri 08:00 - 18:00"
      const timeMatch = bloodBank.operatingHours.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
      if (timeMatch) {
        const [_, startHour, startMin, endHour, endMin] = timeMatch;
        openingTime = `${startHour}:${startMin}`;
        closingTime = `${endHour}:${endMin}`;
        
        // Extract days part
        const daysString = bloodBank.operatingHours.replace(/\s+\d{2}:\d{2}\s*-\s*\d{2}:\d{2}.*$/, '').trim();
        
        if (daysString.includes('-')) {
          // Range format (e.g., "Mon-Fri")
          const [startDay, endDay] = daysString.split('-').map(d => d.trim());
          const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const startIndex = dayOrder.indexOf(startDay);
          const endIndex = dayOrder.indexOf(endDay);
          
          if (startIndex !== -1 && endIndex !== -1) {
            if (startIndex <= endIndex) {
              for (let i = startIndex; i <= endIndex; i++) {
                operatingDays.push(dayOrder[i]);
              }
            } else {
              // Wrap around (e.g., Fri-Mon)
              for (let i = startIndex; i < dayOrder.length; i++) {
                operatingDays.push(dayOrder[i]);
              }
              for (let i = 0; i <= endIndex; i++) {
                operatingDays.push(dayOrder[i]);
              }
            }
          }
        } else if (daysString.includes(',')) {
          // Comma-separated format (e.g., "Mon,Wed,Fri")
          operatingDays = daysString.split(',').map(d => d.trim());
        } else if (daysString) {
          // Single day
          operatingDays = [daysString];
        }
      } else {
        // Fallback: try to parse old format "HH:MM - HH:MM"
        const times = bloodBank.operatingHours.split(' - ');
        if (times.length === 2) {
          openingTime = times[0];
          closingTime = times[1];
        }
        // Default to weekdays if no days specified
        operatingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      }
    } else {
      // Default to weekdays
      operatingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    }

    setEditFormData({
      ...bloodBank,
      openingTime,
      closingTime,
      operatingDays
    });
    setEditingBloodBank(bloodBank);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditDayToggle = (day) => {
    setEditFormData(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
  };

  // Helper function to construct operating hours (same as in AdminController)
  const constructOperatingHours = (operatingDays, openingTime, closingTime) => {
    if (!operatingDays || operatingDays.length === 0) {
      return `${openingTime} - ${closingTime}`;
    }
    
    // Sort days in proper order
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sortedDays = dayOrder.filter(day => operatingDays.includes(day));
    
    if (sortedDays.length === 0) {
      return `${openingTime} - ${closingTime}`;
    }
    
    // Check if days are consecutive for range format (e.g., Mon-Fri)
    let dayRange;
    if (sortedDays.length === 1) {
      dayRange = sortedDays[0];
    } else {
      // Check if consecutive
      const indices = sortedDays.map(day => dayOrder.indexOf(day));
      let consecutive = true;
      for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i-1] + 1) {
          consecutive = false;
          break;
        }
      }
      
      if (consecutive && sortedDays.length > 2) {
        // Use range format: Mon-Fri
        dayRange = `${sortedDays[0]}-${sortedDays[sortedDays.length - 1]}`;
      } else {
        // Use comma-separated format: Mon,Wed,Fri
        dayRange = sortedDays.join(',');
      }
    }
    
    return `${dayRange} ${openingTime} - ${closingTime}`;
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const operatingHours = constructOperatingHours(
        editFormData.operatingDays, 
        editFormData.openingTime, 
        editFormData.closingTime
      );

      const response = await fetchWithAuth(`/admin/bloodbanks/${editingBloodBank.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editFormData,
          operatingHours,
          // Also send the individual components for backend compatibility
          operatingDays: editFormData.operatingDays,
          openingTime: editFormData.openingTime,
          closingTime: editFormData.closingTime
        })
      });

      if (response.ok) {
        // Refresh blood banks list
        await fetchBloodBanks();
        setEditingBloodBank(null);
        setEditFormData({});
      } else {
        alert('Failed to update blood bank');
      }
    } catch (error) {
      console.error('Error updating blood bank:', error);
      alert('Error updating blood bank');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBloodBank(null);
    setEditFormData({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-4 rounded-xl">
                <Building2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Blood Banks</h1>
                <p className="text-gray-600 mt-1">
                  {loading ? 'Loading...' : `${filteredBloodBanks.length} blood bank${filteredBloodBanks.length !== 1 ? 's' : ''} registered`}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search blood banks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Blood Banks Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : filteredBloodBanks.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No blood banks found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No blood banks have been registered yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedBloodBanks.map((bloodBank, index) => (
              <motion.div
                key={bloodBank.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">
                        {bloodBank.bloodBankName || 'Unnamed Blood Bank'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleEdit(bloodBank)}
                      className="ml-2 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Edit Blood Bank"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {bloodBank.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {bloodBank.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {bloodBank.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">
                          {bloodBank.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {bloodBank.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {bloodBank.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {bloodBank.licenseNumber && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">License Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {bloodBank.licenseNumber}
                      </p>
                    </div>
                  )}

                  {bloodBank.operatingHours && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Operating Hours</p>
                        <p className="text-sm font-medium text-gray-900">
                          {bloodBank.operatingHours}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editingBloodBank && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCancelEdit}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Edit Blood Bank</h2>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Bank Name *
                    </label>
                    <input
                      type="text"
                      name="bloodBankName"
                      value={editFormData.bloodBankName || ''}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ''}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone || ''}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={editFormData.licenseNumber || ''}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={editFormData.address || ''}
                      onChange={handleEditChange}
                      rows="3"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operating Days *
                    </label>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">Select the days when the blood bank operates</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <motion.label
                            key={day}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                              flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                              ${editFormData.operatingDays?.includes(day)
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={editFormData.operatingDays?.includes(day) || false}
                              onChange={() => handleEditDayToggle(day)}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">{day}</span>
                          </motion.label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operating Hours *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Opening Time</label>
                        <input
                          type="time"
                          name="openingTime"
                          value={editFormData.openingTime || ''}
                          onChange={handleEditChange}
                          className="w-full px-4 py-3 rounded-lg border border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Closing Time</label>
                        <input
                          type="time"
                          name="closingTime"
                          value={editFormData.closingTime || ''}
                          onChange={handleEditChange}
                          className="w-full px-4 py-3 rounded-lg border border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BloodBanksList;