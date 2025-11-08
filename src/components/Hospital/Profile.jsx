import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Building, User, Mail, Phone, MapPin, Lock, FileText, 
  CheckCircle, Calendar, Clock, Camera, Loader2, AlertTriangle,
  ArrowLeft, Eye, EyeOff
} from "lucide-react"
import { hospitalProfileAPI, uploadHospitalProfilePhoto, removeHospitalProfilePhoto } from '../../utils/api'
import { formatLandlinePhone } from '../../utils/phoneFormatter'


const ProfileManagement = () => {
  const [view, setView] = useState("profile")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const navigate = useNavigate()
  const [hospitalData, setHospitalData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    currentPassword: { isValid: null, message: '' },
    newPassword: { isValid: null, message: '' },
    confirmPassword: { isValid: null, message: '' }
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        setLoading(true);
        const response = await hospitalProfileAPI.getCurrentProfile();
        const data = response.data || response;
        
        // Update localStorage with hospital data
        localStorage.setItem('hospitalData', JSON.stringify(data));
        
        setHospitalData(data);
        setError(null);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, []);

  const handleProfilePhotoUpload = async (file) => {
    setIsUpdating(true);
    try {
      setError(null);

      const result = await uploadHospitalProfilePhoto(hospitalData.id, file);
      
      if (result.success) {
        // Update local state
        setHospitalData(prev => ({
          ...prev,
          profilePhotoUrl: result.photoUrl
        }));

        // Update localStorage to sync with header
        const currentHospitalData = JSON.parse(localStorage.getItem('hospitalData') || '{}');
        const updatedHospitalData = {
          ...currentHospitalData,
          profilePhotoUrl: result.photoUrl
        };
        localStorage.setItem('hospitalData', JSON.stringify(updatedHospitalData));
        
        // Dispatch custom event to notify header of update
        window.dispatchEvent(new CustomEvent('hospitalDataUpdated'));

        setShowProfileModal(false);
      } else {
        setError(result.error || 'Failed to upload profile photo');
      }
    } catch (error) {
      setError('Failed to upload profile photo: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveProfilePhoto = async () => {
    setIsUpdating(true);
    try {
      await removeHospitalProfilePhoto(hospitalData.id);
      setHospitalData({ ...hospitalData, profilePhotoUrl: null });
      setShowProfileModal(false);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Password validation functions
  const validateCurrentPassword = (password) => {
    if (!password) {
      setPasswordValidation(prev => ({
        ...prev,
        currentPassword: { isValid: null, message: '' }
      }));
      return;
    }
    
    if (password.length < 8) {
      setPasswordValidation(prev => ({
        ...prev,
        currentPassword: { isValid: false, message: 'Current password is too short' }
      }));
      return;
    }
    
    setPasswordValidation(prev => ({
      ...prev,
      currentPassword: { isValid: true, message: 'Ready for verification' }
    }));
  };

  const validateNewPassword = (password) => {
    if (!password) {
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: { isValid: null, message: '' }
      }));
      return;
    }
    
    if (password.length < 8) {
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: { isValid: false, message: 'Must be at least 8 characters long' }
      }));
      return;
    }
    
    if (password === passwordData.currentPassword && passwordData.currentPassword) {
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: { isValid: false, message: 'Must be different from current password' }
      }));
      return;
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    const missingRequirements = [];
    if (!hasUpperCase) missingRequirements.push('uppercase letter');
    if (!hasLowerCase) missingRequirements.push('lowercase letter');
    if (!hasNumbers) missingRequirements.push('number');
    if (!hasSpecialChar) missingRequirements.push('special character (@$!%*?&)');
    
    if (missingRequirements.length > 0) {
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: { isValid: false, message: `Missing: ${missingRequirements.join(', ')}` }
      }));
      return;
    }
    
    setPasswordValidation(prev => ({
      ...prev,
      newPassword: { isValid: true, message: 'Strong password' }
    }));
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: { isValid: null, message: '' }
      }));
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: { isValid: null, message: 'Enter new password first' }
      }));
      return;
    }
    
    if (confirmPassword !== passwordData.newPassword) {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: { isValid: false, message: 'Passwords do not match' }
      }));
      return;
    }
    
    if (passwordValidation.newPassword?.isValid === true) {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: { isValid: true, message: 'Passwords match' }
      }));
    } else {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: { isValid: null, message: 'Passwords match, but new password needs fixing' }
      }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (!passwordData.confirmPassword) {
      setPasswordError('Please confirm your new password');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    const hasSpecialChar = /[@$!%*?&]/.test(passwordData.newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      await hospitalProfileAPI.updatePassword(hospitalData.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Reset validation states
      setPasswordValidation({
        currentPassword: { isValid: null, message: '' },
        newPassword: { isValid: null, message: '' },
        confirmPassword: { isValid: null, message: '' }
      });
      
      setPasswordSuccess('Password updated successfully! Redirecting to profile...');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        setView('profile');
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderProfile = () => (
    <div className="relative bg-gray-50 min-h-screen w-full max-w-full overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Hero Banner with Profile Image */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="relative p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
            {/* Profile Image */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-full border-4 border-white flex items-center justify-center relative -mt-4 sm:mt-0">
              {hospitalData.profilePhotoUrl ? (
                <img src={hospitalData.profilePhotoUrl} alt="Hospital Profile Photo" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Building className="w-14 h-14 sm:w-16 sm:h-16 text-red-600" />
              )}
              
              {/* Camera Button for Profile Photo */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="absolute bottom-0 right-0 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-105"
                title="Change Profile Photo"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Hospital Info */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">{hospitalData.hospitalName || 'Not provided'}</h2>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <User className="w-5 h-5 mr-2 text-red-600" />
              Hospital Information
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Email</p>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium">{hospitalData.email || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Phone</p>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium">{formatLandlinePhone(hospitalData.phone) || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Hospital ID</p>
                <span className="font-medium">{hospitalData.id || hospitalData.hospitalId || 'Not provided'}</span>
              </div>
            </div>
            
            <div>
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Address</p>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{hospitalData.address || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">License Number</p>
                <span className="font-medium">{hospitalData.licenseNumber || 'Not provided'}</span>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Hospital Name</p>
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium">{hospitalData.hospitalName || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Security Settings</h4>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-full mr-3 flex-shrink-0">
                  <Lock className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h5 className="font-medium">Password & Authentication</h5>
                  <p className="text-sm text-gray-500">Update your password and security settings</p>
                </div>
              </div>
              <button
                onClick={() => setView("editDetails")}
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
              >
                Change Password
              </button>
            </div>
          </div>
        </div> 
      </div>
    </div>
  )

  const renderEditDetails = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Blurred Background - Profile Content */}
      <div className="absolute inset-0 blur-sm pointer-events-none">
        {renderProfile()}
      </div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Modal Content */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center">
            <button onClick={() => setView("profile")} className="flex items-center hover:bg-red-700/50 rounded-lg px-3 py-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="font-medium">Back to Profile</span>
            </button>
            <h1 className="text-center flex-1 font-bold mr-12 text-lg">Edit Hospital Details</h1>
          </div>

          {/* Form - Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <form className="p-6" onSubmit={handlePasswordChange}>
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{passwordError}</p>
                </div>
              )}
              {/* Hospital Details Section */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                  <Building className="mr-2 h-5 w-5 text-red-600" />
                  Hospital Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                    <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                      {hospitalData.hospitalName || 'Not provided'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Hospital ID</label>
                    <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                      {hospitalData.id || hospitalData.hospitalId || 'Not provided'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                      {formatLandlinePhone(hospitalData.phone) || 'Not provided'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                      {hospitalData.email || 'Not provided'}
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Location Address</label>
                    <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                      {hospitalData.address || 'Not provided'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">License Number</label>
                    <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                      {hospitalData.licenseNumber || 'Not provided'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Hospital details are managed by system administrators and cannot be modified here.
                  </p>
                </div>
              </div>

              {/* Password Section */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                  <Lock className="mr-2 h-5 w-5 text-red-600" />
                  Change Password
                </h2>

                {passwordSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-green-700">{passwordSuccess}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Current Password Field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordData({...passwordData, currentPassword: value});
                          validateCurrentPassword(value);
                        }}
                        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow ${
                          passwordValidation.currentPassword.isValid === false 
                            ? 'border-red-300 bg-red-50' 
                            : passwordValidation.currentPassword.isValid === true 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter your current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {passwordValidation.currentPassword.message && (
                      <div className={`mt-1 text-xs flex items-center gap-1 ${
                        passwordValidation.currentPassword.isValid === false 
                          ? 'text-red-600' 
                          : passwordValidation.currentPassword.isValid === true
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}>
                        {passwordValidation.currentPassword.message}
                      </div>
                    )}
                  </div>

                  {/* New Password Field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordData({...passwordData, newPassword: value});
                          validateNewPassword(value);
                          if (passwordData.confirmPassword) {
                            validateConfirmPassword(passwordData.confirmPassword);
                          }
                        }}
                        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow ${
                          passwordValidation.newPassword.isValid === false 
                            ? 'border-red-300 bg-red-50' 
                            : passwordValidation.newPassword.isValid === true 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)</p>
                    {passwordValidation.newPassword.message && (
                      <div className={`mt-1 text-xs flex items-center gap-1 ${
                        passwordValidation.newPassword.isValid === false 
                          ? 'text-red-600' 
                          : passwordValidation.newPassword.isValid === true
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}>
                        {passwordValidation.newPassword.message}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordData({...passwordData, confirmPassword: value});
                          validateConfirmPassword(value);
                        }}
                        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow ${
                          passwordValidation.confirmPassword.isValid === false 
                            ? 'border-red-300 bg-red-50' 
                            : passwordValidation.confirmPassword.isValid === true 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {passwordValidation.confirmPassword.message && (
                      <div className={`mt-1 text-xs flex items-center gap-1 ${
                        passwordValidation.confirmPassword.isValid === false 
                          ? 'text-red-600' 
                          : passwordValidation.confirmPassword.isValid === true
                          ? 'text-green-600'
                          : passwordValidation.confirmPassword.isValid === null && passwordValidation.confirmPassword.message
                          ? 'text-amber-600'
                          : 'text-gray-500'
                      }`}>
                        {passwordValidation.confirmPassword.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center border-t border-gray-200 pt-6">
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setView("profile")}
                    className="w-1/2 sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-1/2 sm:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {view === "profile" && renderProfile()}
      {view === "editDetails" && renderEditDetails()}
      
      {/* Profile Picture Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Profile Picture</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => document.getElementById('hospital-profile-photo-input').click()}
                className="w-full flex items-center justify-center gap-3 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                disabled={isUpdating}
              >
                <Camera className="w-5 h-5" />
                Change Picture
              </button>
              
              {hospitalData.profilePhotoUrl && (
                <button
                  onClick={handleRemoveProfilePhoto}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  disabled={isUpdating}
                >
                  <AlertTriangle className="w-5 h-5" />
                  Remove Photo
                </button>
              )}
              
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden File Input */}
      <input
        id="hospital-profile-photo-input"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            handleProfilePhotoUpload(file);
            e.target.value = ''; // Reset input
          }
        }}
        className="hidden"
      />
    </div>
  )
}

export default ProfileManagement 

/* Add this CSS class to your global styles */
/* 
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
*/ 