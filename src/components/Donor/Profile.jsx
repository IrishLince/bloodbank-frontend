"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Eye, EyeOff, Gift, User, Shield, ChevronRight, X, UserCheck, Clock, Loader2, Check, Camera } from "lucide-react"
import Header from "../Header"
import RewardsSystem from "./RewardsSystem"
import DonationHistory from "./DonationHistory"
import { fetchWithAuth } from "../../utils/api"
import { uploadProfilePhoto } from "../../utils/profileImage"
import ProfileAvatar from "../ProfileAvatar"
import flagLogo from "../../assets/Logophonenumber.png"

// Import API base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

// Add a CSS block for global styles
const globalStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const ProfileManagement = () => {
  const [activeTab, setActiveTab] = useState("details")
  const [showEditModal, setShowEditModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [hasUpdatedBloodType, setHasUpdatedBloodType] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordOtpSent, setPasswordOtpSent] = useState(false)
  const [passwordOtp, setPasswordOtp] = useState('')
  
  // Phone verification states - with OTP for security
  const [isChangingPhone, setIsChangingPhone] = useState(false)
  const [originalPhone, setOriginalPhone] = useState('')
  const [newPhone, setNewPhone] = useState()
  const [phoneVerificationStep, setPhoneVerificationStep] = useState('edit') // 'edit', 'verify'
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState('')
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneOtpAttempts, setPhoneOtpAttempts] = useState(0)
  
  // Password fields state - SEPARATE from formData for persistence
  // These fields remain persistent across modal closes/opens until manually cleared
  const [passwordFields, setPasswordFields] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    oldPassword: { isValid: null, message: '' },
    newPassword: { isValid: null, message: '' },
    confirmPassword: { isValid: null, message: '' }
  })
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
    age: "",
    bloodType: "Unknown",
    sex: "",
    profilePhotoUrl: "",
    accountStatus: "ACTIVE",
    createdAt: null,
    lastDonationDate: null
  })
  
  // Modal state for profile picture actions
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate()

  // Blood type confirmation modal state
  const [showBloodTypeConfirmModal, setShowBloodTypeConfirmModal] = useState(false)
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState(null)

  // Add effect to prevent body scrolling when modals are open
  useEffect(() => {
    if (showEditModal || showArchiveModal || showArchiveConfirmModal || showBloodTypeConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showEditModal, showArchiveModal, showArchiveConfirmModal, showBloodTypeConfirmModal]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (window.profilePhoneValidationTimeout) {
        clearTimeout(window.profilePhoneValidationTimeout);
      }
    };
  }, []);

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to format date for form input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to strip country code from phone number
  const stripCountryCode = (phone) => {
    if (!phone) return '';
    // Remove all non-digits first
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats:
    // 639394123330 (13 digits) -> 9394123330 (10 digits)
    // 9394123330 (10 digits) -> 9394123330 (stay as is)
    // 63639394123330 (14+ digits, double country code) -> 9394123330 (10 digits)
    
    if (cleaned.length === 13 && cleaned.startsWith('63')) {
      return cleaned.substring(2); // Remove '63' prefix, return 10 digits
    } else if (cleaned.length === 10) {
      return cleaned; // Already 10 digits, return as is
    } else if (cleaned.length > 13 && cleaned.startsWith('63')) {
      // Handle double country code like 63639394123330
      return cleaned.slice(-10); // Get last 10 digits
    } else if (cleaned.length > 10) {
      return cleaned.slice(-10); // Get last 10 digits
    }
    
    return cleaned; // Return whatever we have
  };

  // Helper function to ensure proper country code format
  const formatPhoneForBackend = (phone) => {
    if (!phone) return '';
    const stripped = stripCountryCode(phone);
    return stripped.length === 10 ? `63${stripped}` : phone;
  };

  // Helper function to convert userData to formData format
  const prepareFormData = (userData) => {
    // Split name into firstName, middleInitial, and lastName
    const nameParts = userData.name ? userData.name.trim().split(' ') : [];
    let firstName = nameParts[0] || '';
    let middleInitial = '';
    let lastName = '';
    
    // Handle name parts properly - use same logic as EligibilityCheck
    if (nameParts.length === 3) {
      // If there are exactly 3 parts, assume middle initial is in the middle
      middleInitial = nameParts[1] || '';
      lastName = nameParts[2] || '';
    } else if (nameParts.length > 3) {
      // More than 3 parts - assume second part is middle initial, rest is last name
      middleInitial = nameParts[1] || '';
      lastName = nameParts.slice(2).join(' ') || '';
    } else if (nameParts.length === 2) {
      // Only first and last name
      lastName = nameParts[1] || '';
    }
    // If only 1 part, just firstName is set above
    
    return {
      ...userData,
      firstName: firstName,
      middleInitial: middleInitial,
      lastName: lastName,
      phone: stripCountryCode(userData.phone), // Strip country code for form display
      birthDate: userData.rawBirthDate ? formatDateForInput(userData.rawBirthDate) : "",
      age: userData.rawBirthDate ? calculateAge(userData.rawBirthDate).replace(' years', '') : "",
      role: userData.role || "DONOR" // Ensure role is included
    };
  };

  // Helper function to calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return `${age} years`;
  };

  // Helper function to format "Active Since" date
  const formatActiveSince = (createdAt) => {
    if (!createdAt) return "Active since N/A";
    const date = new Date(createdAt);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `Active since ${date.toLocaleDateString('en-US', options)}`;
  };

  // Helper function to format "Last Donation" relative time
  const formatLastDonation = (lastDonationDate) => {
    if (!lastDonationDate) return "No donations yet";
    
    const now = new Date();
    const lastDonation = new Date(lastDonationDate);
    const diffTime = Math.abs(now - lastDonation);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffYears > 0) {
      return `Last donation: ${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    } else if (diffMonths > 0) {
      return `Last donation: ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    } else if (diffDays > 0) {
      return `Last donation: ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return "Last donation: Today";
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      

      
      const response = await fetchWithAuth('/auth/me');
      
      
      
      // Handle authentication issues gracefully
      if (response.status === 401 || response.status === 403) {
        
        throw new Error('Authentication required - please refresh the page');
      }
      
      if (response.ok) {
        const data = await response.json();

        
        const formattedUserData = {
          id: data.id || "",
          name: data.name || "",
          email: data.email || "",
          username: data.username || "",
          phone: data.contactInformation || "",
          address: data.address || "",
          birthDate: formatDateForDisplay(data.dateOfBirth), // For display
          age: calculateAge(data.dateOfBirth) || (data.age ? `${data.age} years` : "Age not set"),
          bloodType: data.bloodType || "Unknown",
          sex: data.sex || "",
          role: data.role || "DONOR", // Ensure role is stored
          profilePhotoUrl: data.profilePhotoUrl || "",
          rawBirthDate: data.dateOfBirth, // Keep raw date for calculations
          accountStatus: data.accountStatus || "ACTIVE",
          createdAt: data.createdAt || null,
          lastDonationDate: data.lastDonationDate || null
        };
        
        // Extract name parts including potential middle initial
        const nameParts = data.name ? data.name.trim().split(' ') : [];
        let firstName = nameParts[0] || '';
        let middleInitial = '';
        let lastName = '';
        
        if (nameParts.length === 1) {
          // Only first name
          firstName = nameParts[0];
        } else if (nameParts.length === 2) {
          // First name and last name only
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else if (nameParts.length >= 3) {
          // First name, potential middle initial, and last name(s)
          firstName = nameParts[0];
          const potentialMiddleInitial = nameParts[1];
          
          // Check if the second part looks like a middle initial
          // (single letter, single letter with period, or short name that could be middle initial)
          if (potentialMiddleInitial.length === 1 || 
              (potentialMiddleInitial.length === 2 && potentialMiddleInitial.endsWith('.')) ||
              (potentialMiddleInitial.length <= 4 && !/\d/.test(potentialMiddleInitial))) {
            // Treat as middle initial
            middleInitial = potentialMiddleInitial.replace('.', ''); // Remove period if present
            lastName = nameParts.slice(2).join(' '); // Everything after middle initial is last name
          } else {
            // No middle initial, treat second part onwards as last name
            middleInitial = '';
            lastName = nameParts.slice(1).join(' ');
          }
        }
        
        const formData = {
          id: data.id || "",
          name: data.name || "",
          firstName: firstName,
          middleInitial: middleInitial,
          lastName: lastName,
          email: data.email || "",
          username: data.username || "",
          phone: data.contactInformation || "",
          address: data.address || "",
          birthDate: formatDateForInput(data.dateOfBirth), // For form input (YYYY-MM-DD)
          age: calculateAge(data.dateOfBirth).replace(' years', '') || (data.age ? data.age.toString() : ""),
          bloodType: data.bloodType || "Unknown",
          sex: data.sex || "",
          role: data.role || "DONOR", // Include role in form data
          rawBirthDate: data.dateOfBirth
        };
        
        setUserData(formattedUserData);
        setFormData(formData);
        

        
        // Check if blood type has been updated
        if (data.bloodType && data.bloodType !== "Unknown") {
          setHasUpdatedBloodType(true);
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to fetch profile data (${response.status}): ${errorText}`);
      }
    } catch (error) {
      setError(error.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (file) => {
    try {
      setIsUpdating(true);
      setError(null);

      const result = await uploadProfilePhoto(userData.id, file);
      
      if (result.success) {
        // Update local state
        setUserData(prev => ({
          ...prev,
          profilePhotoUrl: result.photoUrl
        }));

        // Update localStorage to sync with header
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUserData = {
          ...currentUserData,
          profilePhotoUrl: result.photoUrl
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Dispatch custom event to notify header of update
        window.dispatchEvent(new CustomEvent('userDataUpdated'));

        // Show success message
        // You could add a success state here if needed
      } else {
        setError(result.error || 'Failed to upload profile photo');
      }
    } catch (error) {
      setError('Failed to upload profile photo: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update user profile in backend
  const updateUserProfile = async (updatedData) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      
      
      // Format data for backend - NEVER include password or email in profile updates
      const backendData = {
        name: updatedData.firstName && updatedData.lastName 
              ? `${updatedData.firstName.trim()}${updatedData.middleInitial ? 
                  (updatedData.middleInitial.trim().length === 1 ? ` ${updatedData.middleInitial.trim()}.` : ` ${updatedData.middleInitial.trim()}`) 
                  : ''} ${updatedData.lastName.trim()}`.trim()
              : updatedData.firstName?.trim() || updatedData.lastName?.trim() || userData.name,
        // 🔒 SECURITY: Email is NEVER included in updates to prevent JWT token invalidation
        // email: updatedData.email || userData.email, // REMOVED FOR SECURITY
        username: updatedData.username || userData.username,
        contactInformation: updatedData.phone ? formatPhoneForBackend(updatedData.phone) : userData.phone,
        address: updatedData.address || userData.address,
        bloodType: updatedData.bloodType || userData.bloodType,
        sex: updatedData.sex || userData.sex,
        // Convert birth date back to proper format if needed
        dateOfBirth: updatedData.birthDate ? new Date(updatedData.birthDate).toISOString() : (userData.rawBirthDate || null),
        // Calculate and send age as well
        age: updatedData.birthDate ? parseInt(calculateAge(updatedData.birthDate).replace(' years', '')) : (userData.age ? parseInt(userData.age.replace(' years', '')) : null),
        // Include role to prevent backend validation errors
        role: userData.role || 'DONOR',
        // 🖼️ IMPORTANT: Preserve profile photo URL during profile updates
        profilePhotoUrl: userData.profilePhotoUrl || null
        // 🔒 IMPORTANT: Password and Email are NOT included here
        // - Password will be preserved by backend
        // - Email is immutable for JWT token security
        // Password changes are handled separately via the password change functionality
    };
      
      const response = await fetchWithAuth(`/user/${userData.id}`, {
        method: 'PUT',
        body: JSON.stringify(backendData)
      });
      
      if (response.ok) {

        
        // REAL-TIME FETCH: Immediately update profile data after successful save
        try {
          setIsSyncing(true);
          
          // First update local state immediately for instant feedback
          const updatedUserData = {
            ...userData,
            name: formData.firstName && formData.lastName 
                  ? `${formData.firstName.trim()}${formData.middleInitial ? 
                      (formData.middleInitial.trim().length === 1 ? ` ${formData.middleInitial.trim()}.` : ` ${formData.middleInitial.trim()}`) 
                      : ''} ${formData.lastName.trim()}`.trim()
                  : formData.firstName?.trim() || formData.lastName?.trim() || userData.name,
            // email: formData.email || userData.email, // NEVER update email locally
            username: formData.username || userData.username,
            phone: formData.phone ? formatPhoneForBackend(formData.phone) : userData.phone,
            address: formData.address || userData.address,
            bloodType: formData.bloodType || userData.bloodType,
            sex: formData.sex || userData.sex,
            // 🖼️ IMPORTANT: Preserve profile photo URL during updates
            profilePhotoUrl: userData.profilePhotoUrl
          };
          setUserData(updatedUserData);
  
          
          // Then fetch fresh data from backend to ensure consistency
          // Multiple retry attempts to ensure real-time sync
          let fetchSuccess = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
    
              await new Promise(resolve => setTimeout(resolve, attempt * 200)); // Progressive delay
              await fetchUserProfile();
              fetchSuccess = true;
  
              break;
            } catch (fetchError) {
              if (attempt === 3) {
    
              }
            }
          }
        } catch (error) {
        } finally {
          setIsSyncing(false);
        }
        
        return true;
      } else {
        const errorData = await response.text();
        let errorMessage = 'Failed to update profile';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
        } catch (e) {
          // If not JSON, use raw text
          errorMessage = errorData || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update profile';
      setError(errorMessage);
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Send OTP for phone number change using regular OTP endpoint
  const sendPhoneOTP = async () => {
    try {
      setIsChangingPhone(true);
      setError(null);
      
      // Get API base URL from environment variables
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
      
      // Use regular OTP endpoint for new phone number verification
      // We'll send a request to verify the new phone number without email
      const response = await fetch(`${API_BASE_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          phoneNumber: formatPhoneForBackend(newPhone), // Send new phone number: 639394123330
          userId: userData.id // Include user ID for verification
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhoneOtpSent(true);
        setPhoneVerificationStep('verify');
      } else {
        // If phone-specific endpoint doesn't exist, try the regular send-otp with just phone
        try {
          const altResponse = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber: formatPhoneForBackend(newPhone) // Only send phone number
            })
          });
          
          if (altResponse.ok) {
            setPhoneOtpSent(true);
            setPhoneVerificationStep('verify');
          } else {
            const errorData = await altResponse.text();
            throw new Error('Unable to send verification code to new phone number');
          }
        } catch (altError) {
          const errorData = await response.text();
          throw new Error('Failed to send verification code for phone change');
        }
      }
    } catch (error) {
      setError(error.message || 'Failed to send verification code');
    } finally {
      setIsChangingPhone(false);
    }
  };

  // Verify OTP and change phone number
  const verifyPhoneOTP = async () => {
    try {
      setIsChangingPhone(true);
      setError(null);
      
      const response = await fetchWithAuth(`/user/${userData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: userData.name,
          username: userData.username,
          contactInformation: formatPhoneForBackend(newPhone), // Ensure proper format
          address: userData.address,
          bloodType: userData.bloodType,
          sex: userData.sex,
          dateOfBirth: userData.rawBirthDate,
          age: userData.age ? parseInt(userData.age.replace(' years', '')) : null,
          role: userData.role || 'DONOR',
          profilePhotoUrl: userData.profilePhotoUrl, // Include profile photo URL to prevent it from being lost
          otpCode: phoneOtp // Use same field name as password change
        })
      });
      
      if (response.ok) {
        // Update local state
        setUserData(prev => ({ ...prev, phone: formatPhoneForBackend(newPhone) }));
        
        // Split name into firstName, middleInitial, and lastName for formData
        const nameParts = userData.name ? userData.name.trim().split(' ') : [];
        let firstName = nameParts[0] || '';
        let middleInitial = '';
        let lastName = '';
        
        // Handle name parts properly - use same logic as EligibilityCheck
        if (nameParts.length === 3) {
          // If there are exactly 3 parts, assume middle initial is in the middle
          middleInitial = nameParts[1] || '';
          lastName = nameParts[2] || '';
        } else if (nameParts.length > 3) {
          // More than 3 parts - assume second part is middle initial, rest is last name
          middleInitial = nameParts[1] || '';
          lastName = nameParts.slice(2).join(' ') || '';
        } else if (nameParts.length === 2) {
          // Only first and last name
          lastName = nameParts[1] || '';
        }
        // If only 1 part, just firstName is set above
        
        setFormData(prev => ({ 
          ...prev, 
          phone: newPhone,
          firstName: firstName,
          middleInitial: middleInitial,
          lastName: lastName
        }));
        
        // Reset phone verification states
        setPhoneVerificationStep('edit');
        setPhoneOtpSent(false);
        setPhoneOtp('');
        setOriginalPhone('');
        setNewPhone(undefined);
        setPhoneError('');
        setPhoneOtpAttempts(0);
        
        // Refresh profile data
        await fetchUserProfile();
        
      } else {
        // Increment attempt counter
        const newAttempts = phoneOtpAttempts + 1;
        setPhoneOtpAttempts(newAttempts);
        
        const errorData = await response.text();
        let errorMessage = 'Failed to verify OTP and change phone number';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
        } catch (e) {
          errorMessage = errorData || errorMessage;
        }
        
        // Check if max attempts reached
        if (newAttempts >= 3) {
          setPhoneError('Maximum OTP attempts reached. Please try again later.');
          // Auto-close modal after 2 seconds
          setTimeout(() => {
            setShowEditModal(false);
            // Reset all phone verification states
            setPhoneVerificationStep('edit');
            setPhoneOtpSent(false);
            setPhoneOtp('');
            setOriginalPhone('');
            setNewPhone(undefined);
            setPhoneError('');
            setPhoneOtpAttempts(0);
            setIsChangingPhone(false);
          }, 2000);
        } else {
          setPhoneError(`${errorMessage} (${newAttempts}/3 attempts)`);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (phoneOtpAttempts < 3) {
        setError(error.message || 'Failed to verify OTP and change phone number');
      }
    } finally {
      if (phoneOtpAttempts < 3) {
        setIsChangingPhone(false);
      }
    }
  };

  // Check phone number availability
  const checkPhoneAvailability = async (phone) => {
    if (!phone || !/^\d{10}$/.test(phone)) return;
    
    // Skip check if it's the same as current phone (compare stripped versions)
    if (phone === stripCountryCode(userData.phone)) {
      setPhoneError('');
      return;
    }
    
    try {
      setIsCheckingPhone(true);
      const response = await fetch(`${API_BASE_URL}/auth/check-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone }), // Send only 10 digits
      });

      const result = await response.json();
      
      if (!response.ok) {
        setPhoneError(result.message || 'Phone number is already in use');
      } else {
        setPhoneError('');
      }
    } catch (error) {
      setPhoneError('Error checking phone availability');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      // Auto-calculate age when birthDate changes
      ...(field === 'birthDate' && { age: calculateAge(value).replace(' years', '') })
    }));
  };

  // Add function to handle blood type update
  const handleBloodTypeUpdate = (newBloodType) => {
    // Only allow changes if the original saved blood type is "Unknown"
    if (userData.bloodType === "Unknown") {
      handleInputChange('bloodType', newBloodType);
    }
  };

  // Password validation functions
  const validateOldPassword = async (password) => {
    if (!password) {
      setPasswordValidation(prev => ({
        ...prev,
        oldPassword: { isValid: null, message: '' }
      }));
      return;
    }
    
    if (password.length < 6) {
      setPasswordValidation(prev => ({
        ...prev,
        oldPassword: { isValid: false, message: 'Current password is too short' }
      }));
      return;
    }
    
    // Basic client-side validation passed
    setPasswordValidation(prev => ({
      ...prev,
      oldPassword: { isValid: true, message: 'Ready for verification' }
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
    
    // Check minimum length first
    if (password.length < 8) {
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: { isValid: false, message: 'Must be at least 8 characters long' }
      }));
      return;
    }
    
    // Check if same as old password
    if (password === passwordFields.oldPassword && passwordFields.oldPassword) {
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: { isValid: false, message: 'Must be different from current password' }
      }));
      return;
    }
    
    // Check password strength requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    const missingRequirements = [];
    if (!hasUpperCase) missingRequirements.push('uppercase letter');
    if (!hasLowerCase) missingRequirements.push('lowercase letter'); 
    if (!hasNumbers) missingRequirements.push('number');
    
    if (missingRequirements.length > 0) {
      setPasswordValidation(prev => ({
        ...prev,
        newPassword: { isValid: false, message: `Missing: ${missingRequirements.join(', ')}` }
      }));
      return;
    }
    
    // All requirements met
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
    
    // Don't validate if new password is empty
    if (!passwordFields.newPassword) {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: { isValid: null, message: 'Enter new password first' }
      }));
      return;
    }
    
    // Check if passwords match
    if (confirmPassword !== passwordFields.newPassword) {
      setPasswordValidation(prev => ({
        ...prev,
        confirmPassword: { isValid: false, message: 'Passwords do not match' }
      }));
      return;
    }
    
    // Only show success if new password is valid
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

  // Send OTP for password change verification
  const sendPasswordOTP = async () => {
    try {
      setIsChangingPassword(true);
      setError(null);
      

      
      const response = await fetchWithAuth('/auth/send-password-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          phone: userData.phone // Send phone in same format as stored in DB (12 digits: 639394123330)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPasswordOtpSent(true);


      } else {
        const errorData = await response.text();
        throw new Error('Failed to send OTP for password change');
      }
    } catch (error) {
      setError(error.message || 'Failed to send OTP');
      
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Change password with OTP verification
  const changePasswordWithOTP = async () => {
    try {
      setIsChangingPassword(true);
      setError(null);
      
      // SECURITY: Check if new password is the same as old password
      if (passwordFields.oldPassword === passwordFields.newPassword) {
        setError('New password must be different from your current password');
        setPasswordValidation(prev => ({
          ...prev,
          newPassword: { isValid: false, message: 'Password must be different from current password' }
        }));
        return;
      }

      
      const response = await fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          phone: userData.phone, // Send phone in same format as stored in DB (12 digits: 639394123330)
          otpCode: passwordOtp,
          oldPassword: passwordFields.oldPassword,
          newPassword: passwordFields.newPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();

        
        // Clear password fields and reset OTP state
        setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordOtp('');
        setPasswordOtpSent(false);
        // Reset password validation states
        setPasswordValidation({
          oldPassword: { isValid: null, message: '' },
          newPassword: { isValid: null, message: '' },
          confirmPassword: { isValid: null, message: '' }
        });
        
        // SECURITY: Auto logout after password change for safety
        setTimeout(() => {
          localStorage.removeItem('userToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }, 1000);
      } else {
        const errorData = await response.text();
        let errorMessage = 'Failed to change password';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
        } catch (e) {
          errorMessage = errorData || errorMessage;
        }
        
        // Check for specific error types and update validation accordingly
        if (errorMessage.toLowerCase().includes('current password is incorrect') || 
            errorMessage.toLowerCase().includes('incorrect password') ||
            errorMessage.toLowerCase().includes('wrong password')) {
          setPasswordValidation(prev => ({
            ...prev,
            oldPassword: { isValid: false, message: 'Current password is incorrect' }
          }));
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      setError(error.message || 'Failed to change password');
      
      // Error handling without alerts - validation messages are shown in UI
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle form submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Check if blood type has changed
    const bloodTypeChanged = formData.bloodType && 
                            formData.bloodType !== userData.bloodType && 
                            userData.bloodType === "Unknown";
    
    if (bloodTypeChanged) {
      // Show confirmation modal for blood type change
      setPendingProfileUpdate(formData);
      setShowBloodTypeConfirmModal(true);
      return; // Don't proceed with save yet
    }
    
    // If no blood type change, proceed normally
    const success = await updateUserProfile(formData);
    if (success) {
      setShowEditModal(false);
      // Clear any existing errors since the update was successful
      setError(null);
      // Password fields remain persistent in their separate state
      // Don't clear password fields - they should remain for user convenience
    }
  };

  // Handle confirmed blood type change
  const handleConfirmedBloodTypeChange = async () => {
    setShowBloodTypeConfirmModal(false);
    
    const success = await updateUserProfile(pendingProfileUpdate);
    if (success) {
      setShowEditModal(false);
      setError(null);
      setPendingProfileUpdate(null);
    }
  };

  // Handle cancelled blood type change
  const handleCancelledBloodTypeChange = () => {
    setShowBloodTypeConfirmModal(false);
    setPendingProfileUpdate(null);
    // Reset blood type to original value
    setFormData(prev => ({ ...prev, bloodType: userData.bloodType }));
  };

  // Handle account archiving
  const handleArchiveAccount = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetchWithAuth(`/user/${userData.id}/archive`, {
        method: 'PUT'
      });

      if (response.ok) {
        // Account archived successfully - log out user
        localStorage.clear();
        navigate('/login');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to archive account');
      }
    } catch (error) {
      console.error('Error archiving account:', error);
      setError(error.message || 'Failed to archive account');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle account activation
  const handleActivateAccount = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetchWithAuth(`/user/${userData.id}/activate`, {
        method: 'PUT'
      });

      if (response.ok) {
        // Update local state
        setUserData(prev => ({ ...prev, accountStatus: "ACTIVE" }));
        alert('Your account has been activated successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to activate account');
      }
    } catch (error) {
      console.error('Error activating account:', error);
      setError(error.message || 'Failed to activate account');
    } finally {
      setIsUpdating(false);
    }
  };

  // Render profile picture modal
  const renderProfilePictureModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Profile Picture</h3>
          <button 
            onClick={() => setShowProfileModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setShowProfileModal(false);
              // Use setTimeout to ensure modal closes before triggering file input
              setTimeout(() => {
                const fileInput = document.getElementById('profile-photo-input');
                if (fileInput) {
                  fileInput.click();
                }
              }, 100);
            }}
            className="flex items-center gap-3 w-full p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <Camera className="text-red-600" size={20} />
            <span className="text-red-700 font-medium">Change Picture</span>
          </button>
          
          {userData.profilePhotoUrl && (
            <button
              onClick={async () => {
                try {
                  setIsUpdating(true);
                  
                  // Call remove photo function
                  const token = localStorage.getItem('userToken') || localStorage.getItem('accessToken');
                  const response = await fetch(`${API_BASE_URL}/user/${userData.id}/photo`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });

                  if (response.ok) {
                    // Update local state
                    setUserData(prev => ({ ...prev, profilePhotoUrl: '' }));
                    
                    // Update localStorage
                    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                    storedUserData.profilePhotoUrl = '';
                    localStorage.setItem('userData', JSON.stringify(storedUserData));
                    
                    // Dispatch event to notify header of update
                    window.dispatchEvent(new CustomEvent('userDataUpdated'));

                    // Show success message
                    // You could add a success state here if needed
                  } else {
                    // Error handled by UI state
                  }
                } catch (error) {
                  // Error handled by UI state
                } finally {
                  setIsUpdating(false);
                }
                setShowProfileModal(false);
              }}
              className="flex items-center gap-3 w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
              disabled={isUpdating}
            >
              <X className="text-gray-600" size={20} />
              <span className="text-gray-700 font-medium">
                {isUpdating ? 'Removing...' : 'Remove Photo'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderEditProfileModal = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/70 to-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl mx-auto animate-fadeIn border border-gray-100 relative overflow-hidden">
        {/* Enhanced Modal Header with subtle pattern */}
        <div className="bg-gradient-to-r from-[#C91C1C] via-[#E53E3E] to-[#C91C1C] text-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-wide">Edit Profile</h1>
                <p className="text-white/90 text-sm font-medium">Update your personal information</p>
              </div>
            </div>
            <button 
              onClick={() => {
                // Reset phone verification states when closing modal
                setPhoneVerificationStep('edit');
                setPhoneOtpSent(false);
                setPhoneOtp('');
                setOriginalPhone('');
                setNewPhone(undefined);
                setPhoneError('');
                setPhoneOtpAttempts(0);
                setIsChangingPhone(false);
                setShowEditModal(false);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Enhanced Form with better styling */}
        <div className="max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <form className="p-8 space-y-8">
            {/* Personal Details Section with enhanced styling */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Personal Details</h2>
                  <p className="text-sm text-gray-600">Update your basic information</p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      First Name
                    </label>
                  <input
                    type="text"
                      value={formData.firstName || ""}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white hover:border-gray-300 transition-all duration-200 shadow-sm"
                      placeholder="Enter your first name"
                  />
                </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Middle Initial
                    </label>
                  <input
                    type="text"
                      value={formData.middleInitial || ""}
                      onChange={(e) => {
                        // Allow any letter characters without forcing uppercase
                        const value = e.target.value.replace(/[^A-Za-z]/g, '');
                        handleInputChange('middleInitial', value);
                      }}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white hover:border-gray-300 transition-all duration-200 shadow-sm"
                      placeholder="Middle Initial"
                  />
                </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                      Last Name
                    </label>
                  <input
                    type="text"
                      value={formData.lastName || ""}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white hover:border-gray-300 transition-all duration-200 shadow-sm"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username || ""}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-sm bg-white hover:border-gray-300 transition-all duration-200 shadow-sm"
                    placeholder="Choose a unique username"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Contact Number
                      {phoneVerificationStep === 'verify' && (
                        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">Verifying</span>
                      )}
                    </label>
                    
                    {phoneVerificationStep === 'edit' ? (
                      <div className="relative">
                        <div className="flex">
                          <div className="bg-gray-50 p-4 rounded-l-xl border-2 border-r-0 border-gray-200 flex items-center shadow-sm">
                            <img src={flagLogo} alt="Philippines flag" className="w-5 h-4 mr-2" />
                            <span className="text-gray-800 text-sm font-medium">+63</span>
                          </div>
                    <input
                      type="tel"
                            value={newPhone !== undefined ? newPhone : stripCountryCode(formData.phone || "")}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                              setNewPhone(value);
                              setOriginalPhone(stripCountryCode(formData.phone));
                              
                              // Clear previous timeout
                              if (window.profilePhoneValidationTimeout) {
                                clearTimeout(window.profilePhoneValidationTimeout);
                              }
                              
                              if (value.length === 10) {
                                if (value !== stripCountryCode(formData.phone)) {
                                  // Debounce validation by 500ms
                                  window.profilePhoneValidationTimeout = setTimeout(() => {
                                    checkPhoneAvailability(value);
                                  }, 500);
                                } else {
                                  setPhoneError('');
                                }
                              } else if (value.length > 10) {
                                // For invalid formats, show error immediately
                                setPhoneError('Phone number must be exactly 10 digits');
                              } else {
                                setPhoneError('');
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length === 10 && value !== stripCountryCode(formData.phone)) {
                                checkPhoneAvailability(value);
                              }
                            }}
                            onInput={(e) => {
                              // Handle browser autofill
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length === 10 && value !== stripCountryCode(formData.phone)) {
                                setTimeout(() => checkPhoneAvailability(value), 100);
                              }
                            }}
                            onFocus={() => {
                              // Initialize newPhone state when user starts editing (only if not already set)
                              if (newPhone === undefined) {
                                setNewPhone(stripCountryCode(formData.phone || ''));
                                setOriginalPhone(stripCountryCode(formData.phone));
                              }
                            }}
                            className={`flex-1 p-4 rounded-r-xl border-2 transition-all duration-300 ${
                              phoneError 
                                ? 'border-red-500 bg-red-50 focus:border-red-600' 
                                : isCheckingPhone
                                ? 'border-yellow-500 bg-yellow-50 focus:border-yellow-600'
                                : newPhone && !phoneError && /^\d{10}$/.test(newPhone) && newPhone !== stripCountryCode(formData.phone)
                                ? 'border-green-500 bg-green-50 focus:border-green-600'
                                : 'border-gray-200 focus:border-red-500'
                            } focus:ring-4 ${
                              phoneError 
                                ? 'focus:ring-red-100' 
                                : isCheckingPhone
                                ? 'focus:ring-yellow-100'
                                : newPhone && !phoneError && /^\d{10}$/.test(newPhone) && newPhone !== stripCountryCode(formData.phone)
                                ? 'focus:ring-green-100'
                                : 'focus:ring-red-500/20'
                            } focus:outline-none text-sm pr-12 bg-white hover:border-gray-300 shadow-sm`}
                            placeholder="Phone number (10 digits)"
                            maxLength={10}
                    />
                  </div>
                        {/* Status indicator */}
                        {isCheckingPhone && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                          </div>
                        )}
                        {!isCheckingPhone && newPhone && !phoneError && /^\d{10}$/.test(newPhone) && newPhone !== stripCountryCode(formData.phone) && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check size={16} className="text-green-600" />
                          </div>
                        )}
                        {!isCheckingPhone && phoneError && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X size={16} className="text-red-600" />
                          </div>
                        )}
                        
                        {/* Phone validation messages */}
                        {isCheckingPhone && (
                          <p className="text-yellow-600 text-xs mt-2 flex items-center bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-2"></div>
                            <span>Checking phone availability...</span>
                          </p>
                        )}
                        {!isCheckingPhone && newPhone && !phoneError && /^\d{10}$/.test(newPhone) && newPhone !== stripCountryCode(formData.phone) && (
                          <p className="text-green-600 text-xs mt-2 flex items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                            <Check size={12} className="mr-1 flex-shrink-0" /> <span>Phone number is available!</span>
                          </p>
                        )}
                        {phoneError && (
                          <p className="text-red-500 text-xs mt-2 flex items-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                            <X size={12} className="mr-1 flex-shrink-0" /> <span>{phoneError}</span>
                          </p>
                        )}
                        
                        {/* Send OTP Button - With verification required */}
                        {newPhone && newPhone !== stripCountryCode(formData.phone) && !phoneError && /^\d{10}$/.test(newPhone) && !isCheckingPhone && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={sendPhoneOTP}
                              disabled={isChangingPhone}
                              className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isChangingPhone ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Sending Verification Code...</span>
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  <span>Send Verification Code</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // OTP Verification Step
                      <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <p className="text-sm font-medium text-red-800">
                              <strong>Verification Required:</strong> We've sent a verification code to: +63 {newPhone}
                            </p>
                          </div>
                          <p className="text-xs text-red-600 ml-7">
                            Enter the 6-digit code to confirm your new phone number.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1.5 font-medium">Enter Verification Code</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={phoneOtp}
                              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm shadow-sm transition-all"
                              placeholder="Enter 6-digit code"
                              maxLength="6"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v-8" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneVerificationStep('edit');
                              setPhoneOtpSent(false);
                              setPhoneOtp('');
                            }}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Edit</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={verifyPhoneOTP}
                            disabled={!phoneOtp || phoneOtp.length !== 6 || isChangingPhone}
                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isChangingPhone ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                                </svg>
                                <span>Verify & Update Phone</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      disabled
                      className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-sm text-gray-500 shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Email cannot be changed for security reasons
                    </p>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Location Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm bg-white hover:border-gray-300 transition-all duration-200 shadow-sm"
                    placeholder="Enter your complete address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Date of Birth
                    </label>
                      <input
                      type="date"
                      value={formData.birthDate || ""}
                      disabled
                      className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-sm text-gray-500 shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Cannot be changed once set
                    </p>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className={`w-2 h-2 ${userData.bloodType === "Unknown" ? 'bg-orange-500' : 'bg-gray-400'} rounded-full mr-2`}></span>
                      Blood Type
                      {userData.bloodType !== "Unknown" && (
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Set</span>
                      )}
                      {userData.bloodType === "Unknown" && (
                        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">One-time</span>
                      )}
                    </label>
                    <select 
                      value={formData.bloodType || "Unknown"}
                      onChange={(e) => handleBloodTypeUpdate(e.target.value)}
                      disabled={userData.bloodType !== "Unknown"}
                      className={`w-full p-4 border-2 rounded-xl text-sm shadow-sm transition-all duration-200 ${
                        userData.bloodType !== "Unknown" 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-500' 
                          : 'border-gray-200 bg-white hover:border-orange-300 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500'
                      }`}
                    >
                      <option value="Unknown" disabled>Select Blood Type</option>
                      <option value="A+">A+ (A Positive)</option>
                      <option value="A-">A- (A Negative)</option>
                      <option value="B+">B+ (B Positive)</option>
                      <option value="B-">B- (B Negative)</option>
                      <option value="AB+">AB+ (AB Positive)</option>
                      <option value="AB-">AB- (AB Negative)</option>
                      <option value="O+">O+ (O Positive)</option>
                      <option value="O-">O- (O Negative)</option>
                    </select>
                    {userData.bloodType === "Unknown" && (
                      <p className="text-xs text-orange-600 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Can only be set once
                      </p>
                    )}
                    {userData.bloodType !== "Unknown" && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Cannot be changed once set
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Sex
                    </label>
                    <select
                      value={formData.sex || ""}
                      disabled
                      className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-sm text-gray-500 shadow-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Cannot be changed once set
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Security Settings</span>
              </div>
            </div>

            {/* Enhanced Password Section */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-100">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
                  <p className="text-sm text-gray-600">Update your account security</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">Optional</span>
                </div>
              </div>

              {/* Enhanced Info message */}
              <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Optional:</span> Only fill these fields if you want to change your password. Leave empty to keep current password.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-700">
                    Password changes require <span className="font-semibold">OTP verification</span> sent to your phone for security.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-700">
                    For security, you'll be <span className="font-semibold">automatically logged out</span> after changing your password.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Old password</label>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={passwordFields.oldPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPasswordFields(prev => ({ ...prev, oldPassword: value }));
                      validateOldPassword(value);
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#C91C1C] focus:border-transparent pr-10 text-sm shadow-sm transition-all ${
                      passwordValidation.oldPassword.isValid === false 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                        : passwordValidation.oldPassword.isValid === true 
                        ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                        : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-[34px]"
                  >
                    {showOldPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {/* Old Password Validation Message */}
                {passwordValidation.oldPassword.message && (
                  <div className={`mt-2 text-xs flex items-center gap-1 ${
                    passwordValidation.oldPassword.isValid === false 
                      ? 'text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1' 
                      : passwordValidation.oldPassword.isValid === true
                      ? 'text-green-600 bg-green-50 border border-green-200 rounded-md px-2 py-1'
                      : 'text-gray-500'
                  }`}>
                    {passwordValidation.oldPassword.isValid === false && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {passwordValidation.oldPassword.isValid === true && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {passwordValidation.oldPassword.message}
                  </div>
                )}

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">New password</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordFields.newPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPasswordFields(prev => ({ ...prev, newPassword: value }));
                      validateNewPassword(value);
                      // Re-validate confirm password if it exists
                      if (passwordFields.confirmPassword) {
                        validateConfirmPassword(passwordFields.confirmPassword);
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#C91C1C] focus:border-transparent pr-10 text-sm shadow-sm transition-all ${
                      passwordValidation.newPassword.isValid === false 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                        : passwordValidation.newPassword.isValid === true 
                        ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                        : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-[34px]"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {/* New Password Validation Message */}
                {passwordValidation.newPassword.message && (
                  <div className={`mt-2 text-xs flex items-center gap-1 ${
                    passwordValidation.newPassword.isValid === false 
                      ? 'text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1' 
                      : passwordValidation.newPassword.isValid === true
                      ? 'text-green-600 bg-green-50 border border-green-200 rounded-md px-2 py-1'
                      : 'text-gray-500'
                  }`}>
                    {passwordValidation.newPassword.isValid === false && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {passwordValidation.newPassword.isValid === true && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {passwordValidation.newPassword.message}
                  </div>
                )}

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Confirm new password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordFields.confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPasswordFields(prev => ({ ...prev, confirmPassword: value }));
                      validateConfirmPassword(value);
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#C91C1C] focus:border-transparent pr-10 text-sm shadow-sm transition-all ${
                      passwordValidation.confirmPassword.isValid === false 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                        : passwordValidation.confirmPassword.isValid === true 
                        ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                        : passwordValidation.confirmPassword.isValid === null && passwordValidation.confirmPassword.message
                        ? 'border-amber-300 bg-amber-50 focus:ring-amber-500'
                        : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[34px]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {/* Confirm Password Validation Message */}
                {passwordValidation.confirmPassword.message && (
                  <div className={`mt-2 text-xs flex items-center gap-1 ${
                    passwordValidation.confirmPassword.isValid === false 
                      ? 'text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1' 
                      : passwordValidation.confirmPassword.isValid === true
                      ? 'text-green-600 bg-green-50 border border-green-200 rounded-md px-2 py-1'
                      : 'text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1'
                  }`}>
                    {passwordValidation.confirmPassword.isValid === false && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {passwordValidation.confirmPassword.isValid === true && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {passwordValidation.confirmPassword.isValid === null && passwordValidation.confirmPassword.message && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {passwordValidation.confirmPassword.message}
              </div>
                )}

                {/* OTP Input Field - Show when OTP is sent */}
                {passwordOtpSent && (
                  <div className="mt-5">
                    <label className="block text-sm text-gray-600 mb-1.5 font-medium">Enter OTP from SMS</label>
                    <input
                      type="text"
                      value={passwordOtp}
                      onChange={(e) => setPasswordOtp(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C91C1C] focus:border-transparent text-sm shadow-sm transition-all"
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                    />
                    <p className="text-xs text-gray-500 mt-1">Check your phone for the verification code</p>
            </div>
                )}

                {/* Password Action Buttons - Only show when user has input */}
                {(passwordFields.oldPassword || passwordFields.newPassword || passwordFields.confirmPassword) && (
                  <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordOtp('');
                  setPasswordOtpSent(false);
                  // Reset password validation states
                  setPasswordValidation({
                    oldPassword: { isValid: null, message: '' },
                    newPassword: { isValid: null, message: '' },
                    confirmPassword: { isValid: null, message: '' }
                  });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm hover:shadow transition-all text-sm"
              >
                Clear Password Fields
              </button>
                    
                    {!passwordOtpSent ? (
              <button
                        type="button"
                        onClick={() => {
                          // Validate all password fields before sending OTP
                          validateOldPassword(passwordFields.oldPassword);
                          validateNewPassword(passwordFields.newPassword);
                          validateConfirmPassword(passwordFields.confirmPassword);
                          
                          // Check if all fields are filled
                          if (!passwordFields.oldPassword || !passwordFields.newPassword || !passwordFields.confirmPassword) {
                            return;
                          }
                          
                          // Check validation states
                          if (passwordValidation.oldPassword.isValid === false) {
                            return;
                          }
                          
                          if (passwordValidation.newPassword.isValid === false) {
                            return;
                          }
                          
                          if (passwordValidation.confirmPassword.isValid === false) {
                            return;
                          }
                          
                          // All validations passed, send OTP
                          sendPasswordOTP();
                        }}
                        disabled={!passwordFields.oldPassword || !passwordFields.newPassword || !passwordFields.confirmPassword || isChangingPassword}
                        className="flex-1 px-4 py-2.5 bg-[#C91C1C] hover:bg-[#B71C1C] text-white rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Sending OTP...
                          </>
                        ) : (
                          'Send OTP for Password Change'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                                                  if (!passwordOtp || passwordOtp.length !== 6) {
                          return;
                        }
                          changePasswordWithOTP();
                        }}
                        disabled={!passwordOtp || passwordOtp.length !== 6 || isChangingPassword}
                        className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Changing Password...
                          </>
                        ) : (
                          'Verify OTP & Change Password'
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Show helpful message when fields are empty */}
                {!passwordFields.oldPassword && !passwordFields.newPassword && !passwordFields.confirmPassword && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                      Start typing in the password fields above to change your password
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Help text */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800 font-medium">
                  This will save your profile information. Use the password section above to change your password.
                </p>
              </div>
            </div>

            {/* Enhanced Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  // Reset phone verification states when closing modal
                  setPhoneVerificationStep('edit');
                  setPhoneOtpSent(false);
                  setPhoneOtp('');
                  setOriginalPhone('');
                  setNewPhone(undefined);
                  setPhoneError('');
                  setShowEditModal(false);
                }}
                className="group px-8 py-3.5 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 font-semibold shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                onClick={handleSaveProfile}
                disabled={isUpdating}
                className="group px-8 py-3.5 bg-gradient-to-r from-[#C91C1C] via-[#E53E3E] to-[#C91C1C] text-white rounded-xl hover:from-[#B91818] hover:via-[#D53E3E] hover:to-[#B91818] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105 disabled:hover:scale-100"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>

            {/* Enhanced Archive/Activate Account */}
            <div className="text-center mt-8 pt-6">
              {userData.accountStatus === "ARCHIVED" ? (
                <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-green-600 font-medium">Account Status</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleActivateAccount}
                    disabled={isUpdating}
                    className="px-6 py-2.5 text-sm text-green-600 bg-white/60 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Activating...' : 'Activate Account'}
                  </button>
                </div>
              ) : (
                <div className="inline-block bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-red-600 font-medium">Danger Zone</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setShowArchiveModal(true);
                    }}
                    className="px-6 py-2.5 text-sm text-red-600 bg-white/60 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 font-medium shadow-sm"
                  >
                    Archive Account
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  const renderArchiveConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md mx-4 shadow-xl animate-fadeIn">
        <div className="flex items-center mb-6">
          <button onClick={() => setShowArchiveModal(false)} className="flex items-center text-[#C91C1C] hover:bg-red-50 p-2 rounded-lg transition-colors">
            <ArrowLeft className="mr-1 w-5 h-5" />
            <span>BACK</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-red-100 shadow-md">
            <img src="/path-to-user-avatar.png" alt="" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{userData.name.toUpperCase()}</h2>
          <p className="text-gray-600 mb-6 text-center">Are you sure you want to archive your account? This action will hide your profile but preserve your data.</p>
          <button
            onClick={() => {
              setShowArchiveModal(false);
              setShowArchiveConfirmModal(true);
            }}
            className="w-full bg-gradient-to-r from-[#880000] to-[#C91C1C] text-white rounded-lg py-3 font-medium hover:from-[#770000] hover:to-[#B91818] shadow-md hover:shadow-lg transition-all"
          >
            I WANT TO ARCHIVE THIS ACCOUNT
          </button>
        </div>
      </div>
    </div>
  )

  const renderArchiveConfirmationInput = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md mx-4 shadow-xl animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-red-100 shadow-md">
            <img src="/path-to-user-avatar.png" alt="" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{userData.name.toUpperCase()}</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 w-full">
            <p className="text-sm text-amber-800 text-center mb-2">
              <strong>Important:</strong> You are about to archive your account. To confirm, type "{userData.name.toUpperCase()}" in the box below
            </p>
            <p className="text-xs text-amber-700 text-center">
              This action cannot be undone. Are you sure this is correct?
            </p>
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-[#C91C1C] focus:border-transparent shadow-sm"
            placeholder="Type your full name here"
          />
          <button
            onClick={() => {
              if (confirmText === userData.name.toUpperCase()) {
                handleArchiveAccount();
                setShowArchiveConfirmModal(false);
              } else {
                setError('Name does not match. Please type your full name exactly as shown.');
              }
            }}
            disabled={confirmText !== userData.name.toUpperCase()}
            className="w-full bg-gradient-to-r from-[#880000] to-[#C91C1C] text-white rounded-lg py-3 font-medium hover:from-[#770000] hover:to-[#B91818] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            ARCHIVE THIS ACCOUNT
          </button>
        </div>
      </div>
    </div>
  )

  const renderDetailsContent = () => (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Username */}
      <div className="bg-white p-4 rounded-lg">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">USERNAME</p>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-[#C91C1C]" />
          <span className="text-gray-900 font-medium">{userData.username || 'Not set'}</span>
        </div>
      </div>

      {/* Email */}
      <div className="bg-white p-4 rounded-lg">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">EMAIL ADDRESS</p>
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-[#C91C1C]" />
          <span className="text-gray-900 font-medium">{userData.email}</span>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white p-4 rounded-lg">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">ADDRESS</p>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#C91C1C] mt-0.5" />
          <div>
            <span className="text-gray-900 font-medium">{userData.address}</span>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-gray-400" />
              Only shared with blood banks during donation appointments
            </p>
          </div>
        </div>
      </div>

      {/* Phone */}
      <div className="bg-white p-4 rounded-lg">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">PHONE NUMBER</p>
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-[#C91C1C]" />
          <span className="text-gray-900 font-medium">{userData.phone}</span>
        </div>
      </div>

      {/* Blood Type */}
      <div className="bg-white p-4 rounded-lg">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">BLOOD TYPE</p>
        <div className="flex items-center gap-3">
          {userData.bloodType === "Unknown" ? (
            <div className="bg-gray-400 w-7 h-7 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">?</span>
            </div>
          ) : (
            <div className="bg-[#C91C1C] w-7 h-7 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{userData.bloodType}</span>
            </div>
          )}
          <div>
            <span className="text-gray-900 font-medium">
              {userData.bloodType === "Unknown" ? "Unknown Blood Type" : `Type ${userData.bloodType}`}
            </span>
            {userData.bloodType !== "Unknown" && (
              <p className="text-xs text-gray-500">Compatible with: {userData.bloodType}, AB+</p>
            )}
            {userData.bloodType === "Unknown" && (
              <p className="text-xs text-red-500">Click Edit to update your blood type</p>
            )}
          </div>
        </div>
      </div>

      {/* Birth Date */}
      <div className="bg-white p-4 rounded-lg">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">DATE OF BIRTH</p>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#C91C1C]" />
          <div>
            <span className="text-gray-900 font-medium">{userData.birthDate}</span>
            <p className="text-xs text-gray-500">Age: {userData.age}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  // Update the card header and container
  const renderDetailsCard = () => (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#C91C1C]" />
            <h2 className="text-gray-900 font-semibold">Personal Information</h2>
            {isSyncing && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setFormData(prepareFormData(userData)); // Reset form data to current user data
              // Reset phone verification states
              setPhoneVerificationStep('edit');
              setPhoneOtpSent(false);
              setPhoneOtp('');
              setOriginalPhone('');
              setNewPhone(undefined);
              setPhoneError('');
              setShowEditModal(true);
            }}
            className="text-[#C91C1C] hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Edit
          </button>
        </div>
        
        <div className="p-6 bg-gray-50">
          {renderDetailsContent()}
          
          {/* Security Notice */}
          <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              Your personal information is protected and only used for donation purposes. For security, we recommend updating your password regularly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBloodTypeConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md mx-4 shadow-xl animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Confirm Blood Type Change</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 w-full">
            <p className="text-sm text-amber-800 text-center mb-2">
              <strong>Important:</strong> You are about to change your blood type from <span className="font-bold text-red-600">{userData.bloodType}</span> to <span className="font-bold text-red-600">{pendingProfileUpdate?.bloodType}</span>.
            </p>
            <p className="text-xs text-amber-700 text-center">
              This change is permanent and cannot be undone. Are you sure this is correct?
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleCancelledBloodTypeChange}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm hover:shadow transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmedBloodTypeChange}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#C91C1C] to-[#E53E3E] text-white rounded-lg font-medium hover:from-[#B91818] hover:to-[#D53E3E] shadow-sm hover:shadow transition-all"
            >
              Yes, Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFEBEB] to-white flex flex-col antialiased">
      {/* Apply global styles */}
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      
      <Header />
      <div className="flex-1 container px-4 sm:px-6 mx-auto max-w-6xl">
        {/* Profile Header - Fully Responsive */}
        <div className="relative z-10 mt-2 sm:mt-4 md:mt-6 lg:mt-8">
          <div className="bg-gradient-to-r from-[#C91C1C] to-[#FF5757] rounded-xl md:rounded-[2rem] shadow-lg overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-60 md:h-60 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 md:w-40 md:h-40 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="absolute top-1/2 right-1/4 w-8 h-8 sm:w-12 sm:h-12 md:w-20 md:h-20 bg-white/10 rounded-full" />
            
            <div className="relative p-4 sm:p-6 md:p-8 lg:p-10 z-10">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                <div className="relative group">
                  {/* Profile Image with Size Adjustments */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-white rounded-full border-4 border-white shadow-xl overflow-hidden transition-transform group-hover:scale-105">
                    <ProfileAvatar 
                      user={{ 
                        name: userData.name || 'User', 
                        profilePhotoUrl: userData.profilePhotoUrl 
                      }}
                      size="3xl"
                      className="w-full h-full"
                    />
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="absolute bottom-1 right-1 bg-white rounded-full p-1 sm:p-1.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer"
                  >
                    <div className="bg-gradient-to-r from-green-500 to-green-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center">
                      <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                    </div>
                  </button>
                </div>
                
                <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-wide drop-shadow-sm">
                        {isLoading ? (
                          <div className="w-48 h-8 bg-white/20 rounded animate-pulse" />
                        ) : (
                          userData.name.toUpperCase() || "USER NAME"
                        )}
                      </h2>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 md:mt-3">
                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                          {isLoading ? (
                            <div className="w-24 h-4 bg-white/20 rounded animate-pulse inline-block" />
                          ) : (
                            formatActiveSince(userData.createdAt)
                          )}
                        </span>
                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                          {isLoading ? (
                            <div className="w-32 h-4 bg-white/20 rounded animate-pulse inline-block" />
                          ) : (
                            <>
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> {formatLastDonation(userData.lastDonationDate)}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setFormData(prepareFormData(userData));
                        // Reset phone verification states
                        setPhoneVerificationStep('edit');
                        setPhoneOtpSent(false);
                        setPhoneOtp('');
                        setOriginalPhone('');
                        setNewPhone(undefined);
                        setPhoneError('');
                        setShowEditModal(true);
                      }}
                      className="hidden sm:flex items-center bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg backdrop-blur-sm shadow-md transition-all text-sm"
                    >
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Edit Button - Positioned for Better Mobile Experience */}
          <div className="sm:hidden -mt-4 mb-4 text-center">
            <button 
              onClick={() => {
                setFormData(prepareFormData(userData));
                // Reset phone verification states
                setPhoneVerificationStep('edit');
                setPhoneOtpSent(false);
                setPhoneOtp('');
                setOriginalPhone('');
                setNewPhone(undefined);
                setPhoneError('');
                setShowEditModal(true);
              }}
              className="inline-flex items-center bg-white shadow-md text-[#C91C1C] px-4 py-1.5 rounded-full transition-colors text-sm font-medium"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Responsive Tabs with Sizing Adjustments */}
        <div className="mt-4 sm:mt-6 md:mt-8 max-w-3xl mx-auto">
          <div className="overflow-x-auto no-scrollbar pb-0.5">
            <div className="grid grid-cols-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-w-[350px]">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-2 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                  activeTab === "details" 
                    ? "text-white bg-[#C91C1C]" 
                    : "text-gray-600 hover:text-[#C91C1C] hover:bg-red-50"
                }`}
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm">Details</span>
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`px-2 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                  activeTab === "rewards" 
                    ? "text-white bg-[#C91C1C]" 
                    : "text-gray-600 hover:text-[#C91C1C] hover:bg-red-50"
                }`}
              >
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm">Rewards</span>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-2 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                  activeTab === "history" 
                    ? "text-white bg-[#C91C1C]" 
                    : "text-gray-600 hover:text-[#C91C1C] hover:bg-red-50"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm">History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area with Responsive Spacing */}
        <div className="py-4 sm:py-6 md:py-8 px-0 sm:px-4">
          {/* Error Message */}
          {error && (
            <div className="max-w-5xl mx-auto mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                    {error.includes('Failed to fetch profile data') && (
                      <button
                        onClick={() => {
                          setError(null);
                          fetchUserProfile();
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Try refreshing profile data
                      </button>
                    )}
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg">
                        <div className="w-16 h-3 bg-gray-200 rounded mb-2 animate-pulse" />
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Content Tabs */
            <>
          {/* Details Tab */}
          {activeTab === "details" ? (
            renderDetailsCard()
          ) : activeTab === "rewards" ? (
            <div>
              <RewardsSystem />
            </div>
          ) : (
            <div>
              <DonationHistory />
            </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Hidden file input for profile photo */}
      <input
        type="file"
        id="profile-photo-input"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleProfilePhotoUpload(file);
          }
          // Reset the input so the same file can be selected again
          e.target.value = '';
        }}
        className="sr-only"
        disabled={isUpdating}
      />

      {/* Modals */}
      {showEditModal && renderEditProfileModal()}
      {showArchiveModal && renderArchiveConfirmation()}
      {showArchiveConfirmModal && renderArchiveConfirmationInput()}
      {showProfileModal && renderProfilePictureModal()}
      {showBloodTypeConfirmModal && renderBloodTypeConfirmationModal()}
      
      {/* Archived Account Overlay */}
      {userData.accountStatus === "ARCHIVED" && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Archived</h2>
              <p className="text-gray-600 mb-6">
                Your account is currently archived. All features are disabled until you reactivate your account.
              </p>
              <button
                onClick={handleActivateAccount}
                disabled={isUpdating}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg py-3 px-6 font-semibold hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isUpdating ? 'Activating...' : 'Activate My Account'}
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }}
                className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileManagement