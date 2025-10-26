"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Mail, Phone, MapPin, Shield, Eye, EyeOff, User, Pencil, Clock, CheckCircle } from "lucide-react"


const ProfileManagement = () => {
  const [view, setView] = useState("profile")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [userData, setUserData] = useState({
    fullName: "REDSOURCE ADMIN",
    email: "admin@redsource.org",
    phone: "+63 2 1234 5678",
    address: "Red Cross Building, Bonifacio Drive, Port Area, Manila",
    role: "Super Administrator",
    adminId: "ADMIN-001",
    status: "Active"
  })
  const navigate = useNavigate()

  // Add state for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: ""
  });
  
  // Add state for showing success message
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = () => {
      try {
        // Try to get user data from localStorage
        const storedUser = localStorage.getItem('userData');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const updatedUserData = {
            ...userData,
            fullName: parsedUser.fullName || parsedUser.name || userData.fullName,
            email: parsedUser.email || userData.email,
            phone: parsedUser.phone || userData.phone,
            adminId: parsedUser.adminId || parsedUser.id || userData.adminId,
            // Keep other defaults if not provided
          };
          
          setUserData(updatedUserData);
          setFormData({
            fullName: updatedUserData.fullName,
            email: updatedUserData.email,
            phone: updatedUserData.phone,
            address: updatedUserData.address
          });
        }
      } catch (error) {
        // Error is handled by the UI state
      }
    };
    
    fetchUserData();
  }, []);

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

  // Handle input changes in the edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      // Get existing user data
      const existingData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Update with new form data
      const updatedUserData = {
        ...existingData,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };
      
      // Save back to localStorage
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      // Update state
      setUserData(prev => ({
        ...prev,
        ...formData
      }));
      
      // Show success message
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setView("profile");
      }, 3000);
      
    } catch (error) {
      // Error is handled by the UI state
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
              <Shield className="w-14 h-14 sm:w-16 sm:h-16 text-red-600" />
              <div className="absolute bottom-1 right-1 bg-red-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            
            {/* Admin Info & Tags */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">{userData.fullName}</h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2 sm:mt-3">
                <span className="bg-white/20 text-white text-xs sm:text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5" /> {userData.role}
                </span>
                <span className="bg-white/20 text-white text-xs sm:text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5" /> Active since 2020
                </span>
              </div>
            </div>
            
            {/* Edit Button */}
            <button
              onClick={() => setView("editDetails")}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5" /> Edit Profile
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <User className="w-5 h-5 mr-2 text-red-600" />
              Admin Information
            </h3>
            <button 
              onClick={() => setView("editDetails")}
              className="text-red-600 hover:text-red-700 text-sm font-medium border border-red-600 rounded-lg px-3 py-1 flex items-center"
            >
              Edit <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Email</p>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium">{userData.email}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Phone</p>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium">{userData.phone}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Admin ID</p>
                <span className="font-medium">{userData.adminId}</span>
              </div>
            </div>
            
            <div>
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Address</p>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{userData.address}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Role</p>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium">{userData.role}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <p className="text-sm text-gray-500 uppercase mb-1">Status</p>
                <span className="font-medium text-green-600">{userData.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEditDetails = () => (
    <div className="min-h-screen bg-gray-50 pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 sm:px-0 overflow-hidden">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 sm:p-4 flex items-center">
          <button onClick={() => setView("profile")} className="flex items-center hover:bg-red-700/50 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="font-medium text-sm sm:text-base">Back to Profile</span>
          </button>
          <h1 className="text-center flex-1 font-bold mr-8 sm:mr-12 text-base sm:text-lg">Edit Admin Details</h1>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 p-3 text-green-800 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* Form */}
        <form className="p-4 sm:p-6 overflow-x-hidden" onSubmit={handleSubmit}>
          {/* Admin Details Section */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800 flex items-center">
              <User className="mr-2 h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
              Admin Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Admin ID</label>
                <input
                  type="text"
                  defaultValue={userData.adminId}
                  className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Admin ID cannot be changed</p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-shadow"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Office Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  defaultValue={userData.role}
                  className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800 flex items-center">
              <Shield className="mr-2 h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
              Change Password
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? (
                      <EyeOff className="w-4 sm:w-5 h-4 sm:h-5" />
                    ) : (
                      <Eye className="w-4 sm:w-5 h-4 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 sm:w-5 h-4 sm:h-5" />
                    ) : (
                      <Eye className="w-4 sm:w-5 h-4 sm:h-5" />
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
                    className="w-full p-2 sm:p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 text-sm transition-shadow"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 sm:w-5 h-4 sm:h-5" />
                    ) : (
                      <Eye className="w-4 sm:w-5 h-4 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p>As an administrator, please ensure your password is strong and changed regularly for security purposes.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-gray-200 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={() => setView("profile")}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const renderArchiveConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-xl">
        <div className="flex items-center mb-6">
          <button onClick={() => setView("profile")} className="flex items-center text-red-600 hover:text-red-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-medium">BACK</span>
          </button>
        </div>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full mb-4 flex items-center justify-center">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">ADMIN ACCOUNT</h3>
          <p className="text-red-600 mt-4">
            Admin accounts cannot be deactivated through this interface.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Please contact system support for account changes.
          </p>
        </div>
        
        <button
          onClick={() => setView("profile")}
          className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          RETURN TO PROFILE
        </button>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {view === "profile" && renderProfile()}
      {view === "editDetails" && renderEditDetails()}
      {view === "archiveConfirmation" && renderArchiveConfirmation()}
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