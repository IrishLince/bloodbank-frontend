import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hospital, ArrowLeft, Search, Mail, Phone, MapPin, Calendar, Edit2, X, Check } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import Pagination from '../Pagination';

const HospitalsList = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHospital, setEditingHospital] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await fetchWithAuth('/admin/hospitals');
      if (response.ok) {
        const data = await response.json();
        setHospitals(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredHospitals.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHospitals = filteredHospitals.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEdit = (hospital) => {
    // Parse operating hours if it exists
    let openingTime = '08:00';
    let closingTime = '17:00';
    
    if (hospital.operatingHours) {
      const times = hospital.operatingHours.split(' - ');
      if (times.length === 2) {
        openingTime = times[0];
        closingTime = times[1];
      }
    }

    setEditFormData({
      ...hospital,
      openingTime,
      closingTime
    });
    setEditingHospital(hospital);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const response = await fetchWithAuth(`/admin/hospitals/${editingHospital.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editFormData,
          operatingHours: `${editFormData.openingTime} - ${editFormData.closingTime}`
        })
      });

      if (response.ok) {
        // Refresh hospitals list
        await fetchHospitals();
        setEditingHospital(null);
        setEditFormData({});
      } else {
        alert('Failed to update hospital');
      }
    } catch (error) {
      console.error('Error updating hospital:', error);
      alert('Error updating hospital');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingHospital(null);
    setEditFormData({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
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
              <div className="bg-blue-100 p-4 rounded-xl">
                <Hospital className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Hospitals</h1>
                <p className="text-gray-600 mt-1">
                  {loading ? 'Loading...' : `${filteredHospitals.length} hospital${filteredHospitals.length !== 1 ? 's' : ''} registered`}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Hospitals Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-12">
            <Hospital className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hospitals found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No hospitals have been registered yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHospitals.map((hospital, index) => (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {hospital.profilePhotoUrl ? (
                          <img 
                            src={hospital.profilePhotoUrl} 
                            alt={`${hospital.hospitalName || 'Hospital'} profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Hospital className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">
                        {hospital.hospitalName || 'Unnamed Hospital'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleEdit(hospital)}
                      className="ml-2 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Edit Hospital"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {hospital.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {hospital.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {hospital.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">
                          {hospital.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {hospital.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {hospital.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {hospital.licenseNumber && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">License Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {hospital.licenseNumber}
                      </p>
                    </div>
                  )}

                  {hospital.operatingHours && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Operating Hours</p>
                        <p className="text-sm font-medium text-gray-900">
                          {hospital.operatingHours}
                        </p>
                      </div>
                    </div>
                  )}

                  {hospital.isDonationCenter && (
                    <div className="pt-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Donation Center
                      </span>
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
          {editingHospital && (
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
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Hospital className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Edit Hospital</h2>
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
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      name="hospitalName"
                      value={editFormData.hospitalName || ''}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
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

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDonationCenter"
                      checked={editFormData.isDonationCenter || false}
                      onChange={handleEditChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      This hospital is a donation center
                    </label>
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
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
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

export default HospitalsList;