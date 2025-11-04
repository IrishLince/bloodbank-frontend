import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Check, X, Upload } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';

const RegisterBloodBank = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    bloodBankName: '',
    licenseNumber: '',
    contactNumber: '',
    address: '',
    openingTime: '08:00',
    closingTime: '17:00',
    operatingDays: []
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
    // Clear operating days error when user makes changes
    if (errors.operatingDays) {
      setErrors(prev => ({ ...prev, operatingDays: '' }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Please select an image file' }));
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Image size must be less than 5MB' }));
        return;
      }
      
      setPhotoFile(file);
      setErrors(prev => ({ ...prev, photo: '' }));

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.bloodBankName) {
      newErrors.bloodBankName = 'Blood bank name is required';
    }

    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    }

    if (!formData.address) {
      newErrors.address = 'Address is required';
    }

    if (!formData.operatingDays || formData.operatingDays.length === 0) {
      newErrors.operatingDays = 'At least one operating day is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // Build FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('data', new Blob([JSON.stringify({
        email: formData.email,
        password: formData.password,
        bloodBankName: formData.bloodBankName,
        licenseNumber: formData.licenseNumber,
        contactNumber: formData.contactNumber,
        address: formData.address,
        operatingDays: formData.operatingDays,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime
      })], { type: 'application/json' }));
      
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }

      const response = await fetchWithAuth('/admin/register-bloodbank', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      } else {
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
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

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-4 rounded-xl">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Register Blood Bank</h1>
                  <p className="text-red-100 mt-1">Add a new blood bank to the system</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Account Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                      placeholder="bloodbank@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                      placeholder="09123456789"
                    />
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Picture Upload */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Picture</h2>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg mb-4 hover:border-red-300 transition-colors duration-300">
                    {previewImage ? (
                      <img src={previewImage} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Upload className="text-gray-400 w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-105 shadow-sm">
                    <Upload size={16} className="mr-2" />
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                  {errors.photo && (
                    <p className="mt-2 text-sm text-red-600">{errors.photo}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Optional - Upload a profile picture for this blood bank
                  </p>
                </div>
              </div>

              {/* Blood Bank Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Blood Bank Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Bank Name *
                    </label>
                    <input
                      type="text"
                      name="bloodBankName"
                      value={formData.bloodBankName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.bloodBankName ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                      placeholder="RedSource Blood Bank"
                    />
                    {errors.bloodBankName && (
                      <p className="mt-1 text-sm text-red-600">{errors.bloodBankName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                      placeholder="LIC-12345"
                    />
                    {errors.licenseNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                      placeholder="123 Main Street, City, Province"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
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
                              ${formData.operatingDays.includes(day)
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={formData.operatingDays.includes(day)}
                              onChange={() => handleDayToggle(day)}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">{day}</span>
                          </motion.label>
                        ))}
                      </div>
                      {errors.operatingDays && (
                        <p className="mt-1 text-sm text-red-600">{errors.operatingDays}</p>
                      )}
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
                          value={formData.openingTime}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Closing Time</label>
                        <input
                          type="time"
                          name="closingTime"
                          value={formData.closingTime}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Register Blood Bank</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">Blood Bank registered successfully</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RegisterBloodBank;
