import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Building, User, Mail, Phone, MapPin, Lock, FileText, 
  CheckCircle, Calendar, Clock, Camera, Loader2, AlertTriangle,
  ArrowLeft, Eye, EyeOff
} from "lucide-react"
import { hospitalProfileAPI, uploadHospitalProfilePhoto, removeHospitalProfilePhoto } from '../../utils/api'


const ProfileManagement = () => {
  const [view, setView] = useState("profile")
  const [activeTab, setActiveTab] = useState("details")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const navigate = useNavigate()
  const [hospitalData, setHospitalData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otpCode: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError('');
    
    try {
      await hospitalProfileAPI.updatePassword(hospitalData.id, {
        newPassword: passwordData.newPassword,
        otpCode: passwordData.otpCode
      });
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otpCode: ''
      });
      
      setView('profile');
      alert('Password updated successfully!');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendPasswordOTP = async () => {
    try {
      await hospitalProfileAPI.sendPasswordOTP(hospitalData.id);
      alert('OTP sent to your registered phone number');
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  // Check if the screen is mobile size on load and when resized
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

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
        
        {/* Tabs Navigation */}
        <div className="flex bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 px-4 py-3 text-sm sm:text-base font-medium flex justify-center items-center gap-2 transition-colors ${
              activeTab === "details" 
                ? "bg-red-600 text-white" 
                : "text-gray-600 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <User className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 px-4 py-3 text-sm sm:text-base font-medium flex justify-center items-center gap-2 transition-colors ${
              activeTab === "requests" 
                ? "bg-red-600 text-white" 
                : "text-gray-600 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            Request History
          </button>
        </div>

        {/* Content Area */}
        {activeTab === "details" ? (
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
                    <span className="font-medium">{hospitalData.phone || 'Not provided'}</span>
                  </div>
                </div>
                
                <div className="mb-5">
                  <p className="text-sm text-gray-500 uppercase mb-1">Hospital ID</p>
                  <span className="font-medium">{hospitalData.hospitalId || 'Not provided'}</span>
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
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Blood Request History</h3>
              <div className="flex space-x-2">
                <button className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm">Filter</button>
                <button className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm">Export</button>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-5">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Request #12345</h4>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" /> 12/05/2023
                      </div>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Completed</span>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Blood Type</div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center mr-1.5">
                          <span className="text-xs font-bold text-white">O+</span>
                        </div>
                        <span className="font-medium">O Positive</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Quantity</div>
                      <div className="font-medium">3 units</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Source</div>
                      <div className="font-medium">RedSource Central</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Request #12346</h4>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" /> 19/05/2023
                      </div>
                    </div>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2.5 py-1 rounded-full">Processing</span>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Blood Type</div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center mr-1.5">
                          <span className="text-xs font-bold text-white">AB-</span>
                        </div>
                        <span className="font-medium">AB Negative</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Quantity</div>
                      <div className="font-medium">1 unit</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Source</div>
                      <div className="font-medium">City Regional</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <button className="text-red-600 hover:text-red-800 font-medium flex items-center mx-auto">
                  View All Request History
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
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
                      {hospitalData.hospitalId || 'Not provided'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <div className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                      {hospitalData.phone || 'Not provided'}
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

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={passwordData.otpCode}
                        onChange={(e) => setPasswordData({...passwordData, otpCode: e.target.value})}
                        className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-shadow"
                        placeholder="Enter OTP code"
                      />
                      <button
                        type="button"
                        onClick={handleSendPasswordOTP}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Send OTP
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">An OTP will be sent to your registered phone number</p>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow"
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
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long and include a number and special character</p>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow"
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
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setView("archiveConfirmation")}
                  className="mt-3 sm:mt-0 text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Delete Account
                </button>

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


  const renderArchiveConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
          <div className="bg-red-100 p-2 sm:p-3 rounded-full mb-3 sm:mb-4">
            <AlertTriangle className="h-6 sm:h-8 w-6 sm:w-8 text-red-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Delete Account</h3>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
        </div>
        
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Type "delete" to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-shadow"
            placeholder="Type 'delete' here"
          />
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setView("editDetails")}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirmText !== "delete"}
            className={`w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 font-medium rounded-lg text-sm transition-colors ${
              confirmText === "delete" 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-red-300 cursor-not-allowed text-white"
            }`}
          >
            Delete Account
          </button>
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
      {view === "archiveConfirmation" && renderArchiveConfirmation()}
      
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