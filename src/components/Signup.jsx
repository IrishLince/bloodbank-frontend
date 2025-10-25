import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Upload, Check, X, MessageSquare, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Background from './Background';
import flagLogo from '../assets/Logophonenumber.png';
import LogoSignup from '../assets/LogoSignup.png';
import RefreshLink from './RefreshLink';
import { navigateWithRefresh } from '../utils/navigation';
import { setTokens } from '../utils/auth';

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1); // 1: form, 2: OTP verification, 3: success
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpExpirationCountdown, setOtpExpirationCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    contactInformation: '',
    bloodType: '',
    role: 'DONOR',
    profilePicture: 'profile.png',
    address: '',
    age: '',
    sex: '',
    birthDate: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Password strength criteria
  const passwordCriteria = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const passwordStrength = Object.values(passwordCriteria).filter(Boolean).length;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (window.phoneValidationTimeout) {
        clearTimeout(window.phoneValidationTimeout);
      }
      if (window.emailValidationTimeout) {
        clearTimeout(window.emailValidationTimeout);
      }
      if (window.usernameValidationTimeout) {
        clearTimeout(window.usernameValidationTimeout);
      }
    };
  }, []);

  // Calculate age from birthdate
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) return;
    
    try {
      setIsCheckingUsername(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        setErrors(prev => ({ ...prev, username: result.message || 'Username is already taken' }));
      } else {
        // Username is available, clear any existing error
        setErrors(prev => ({ ...prev, username: '' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, username: 'Error checking username availability' }));
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Check email availability
  const checkEmailAvailability = async (email) => {
    if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) return;
    
    try {
      setIsCheckingEmail(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        setErrors(prev => ({ ...prev, email: result.message || 'Email is already in use' }));
      } else {
        // Email is available, clear any existing error
        setErrors(prev => ({ ...prev, email: '' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, email: 'Error checking email availability' }));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Check phone number availability
  const checkPhoneAvailability = async (phone) => {
    // Must be exactly 10 digits AND start with 9
    if (!phone || !/^9\d{9}$/.test(phone)) {
      return;
    }
    
    try {
      setIsCheckingPhone(true);
      // Send with country code format to match database storage
      const phoneWithCountryCode = `63${phone}`;
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/check-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneWithCountryCode }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        setErrors(prev => ({ ...prev, contactInformation: result.message || 'Phone number is already in use' }));
      } else {
        // Phone is available, clear any existing error
        setErrors(prev => ({ ...prev, contactInformation: '' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, contactInformation: 'Error checking phone availability' }));
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (passwordStrength <= 4) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-green-500 to-emerald-600';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
    setShowPassword((prev) => !prev);
    } else {
      setShowConfirmPassword((prev) => !prev);
    }
  };
  
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setFormData((prev) => ({
        ...prev,
        profilePicture: file.name
      }));

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
    
    // Email validation
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Username validation
    if (!formData.username?.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Password validation
    if (!formData.password?.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!passwordCriteria.hasUpperCase || !passwordCriteria.hasLowerCase || 
               !passwordCriteria.hasNumber || !passwordCriteria.hasSpecialChar) {
      newErrors.password = "Password must contain uppercase, lowercase, number, and special character";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Phone number validation - STRICT 10 digits starting with 9
    if (!formData.contactInformation?.trim()) {
      newErrors.contactInformation = "Contact number is required";
    } else if (!/^9\d{9}$/.test(formData.contactInformation)) {
      if (!/^\d{10}$/.test(formData.contactInformation)) {
        newErrors.contactInformation = "Contact number must be exactly 10 digits";
      } else if (!formData.contactInformation.startsWith('9')) {
        newErrors.contactInformation = "Contact number must start with 9 (e.g., 9394123330)";
      } else {
        newErrors.contactInformation = "Invalid contact number format";
      }
    }

    // Address validation
    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.length < 10) {
      newErrors.address = "Please provide a complete address";
    }

    // Age validation
    if (!formData.age?.trim()) {
      newErrors.age = "Age is required";
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 16 || age > 65) {
        newErrors.age = "Age must be between 16 and 65";
      }
    }

    // Birth date validation
    if (!formData.birthDate?.trim()) {
      newErrors.birthDate = "Birth date is required";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      
      if (birthDate > maxDate) {
        newErrors.birthDate = "You must be at least 16 years old";
      } else if (birthDate < minDate) {
        newErrors.birthDate = "Age cannot exceed 65 years";
      }
    }

    if (!formData.bloodType) newErrors.bloodType = "Blood type is required";
    if (!formData.sex) newErrors.sex = "Sex is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Check if any field is still being validated
    if (isCheckingUsername || isCheckingEmail || isCheckingPhone) {

      return;
    }
    
    if (!validateForm()) return;

      setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phoneNumber: `63${formData.contactInformation}` // Add country code for consistent format
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      setSignupStep(2);
      setOtpExpirationCountdown(300); // 5 minutes countdown
      setResendCountdown(60); // 1 minute countdown for resend
      setOtpAttempts(0); // Reset attempts
      setMaxAttemptsReached(false); // Reset max attempts flag
      
      // Start OTP expiration countdown timer
      const expirationTimer = setInterval(() => {
        setOtpExpirationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(expirationTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start resend countdown timer
      const resendTimer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(resendTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (maxAttemptsReached) {
      setOtpError('Maximum attempts reached. Please request a new OTP.');
      return;
    }
    
    if (!otpCode.trim()) {
      setOtpError('Please enter the OTP code');
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phoneNumber: `63${formData.contactInformation}`, // Add country code for consistent format
          otpCode: otpCode
        }),
      });

      const responseData = await response.json();
      
      // Update attempts tracking from response
      if (responseData.attempts !== undefined) {
        setOtpAttempts(responseData.attempts);
      }
      
      if (responseData.maxAttemptsReached) {
        setMaxAttemptsReached(true);
        setOtpError(responseData.message || 'Maximum attempts reached. Please request a new OTP.');
        return;
      }
      
      if (responseData.success) {
        // OTP verified, now proceed with signup
        await handleFinalSignup();
      } else {
        // Show specific error message from backend
        setOtpError(responseData.message || 'OTP verification failed');
        
        // Clear OTP input for next attempt (unless max attempts reached)
        if (!responseData.maxAttemptsReached) {
          setOtpCode('');
        }
      }
    } catch (error) {
      setOtpError(error.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSignup = async () => {
    try {
      // Include middle initial in the full name if provided
      // If middle initial is longer than 1 character, don't add a period
      const middleInitialPart = formData.middleInitial ? 
        (formData.middleInitial.length === 1 ? ` ${formData.middleInitial}.` : ` ${formData.middleInitial}`) : '';
      const fullName = `${formData.firstName}${middleInitialPart} ${formData.lastName}`.trim();
      const payload = {
        name: fullName,
        email: formData.email,
      username: formData.username,
        password: formData.password,
        contactInformation: `63${formData.contactInformation}`, // Add country code for consistent storage
        bloodType: formData.bloodType,
        role: formData.role,
        address: formData.address,
        age: parseInt(formData.age),
      sex: formData.sex,
      // Send yyyy-MM-dd to match backend @JsonFormat
      birthDate: formData.birthDate ? formData.birthDate : null
      };

      // Build multipart form data with JSON part and optional photo
      const fd = new FormData();
      fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      if (photoFile) {
        fd.append('photo', photoFile);
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/signup`, {
        method: 'POST',
        body: fd,
      });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Signup failed');
        }

      setSignupStep(3);
      setTimeout(() => {
        navigateWithRefresh('/login');
      }, 3000);
      } catch (error) {

      setSignupStep(1); // Go back to form
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phoneNumber: `63${formData.contactInformation}` // Add country code for consistent format
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to resend OTP');
      }

      setOtpExpirationCountdown(300); // Reset 5 minutes countdown
      setResendCountdown(60); // Reset 1 minute countdown for resend
      setOtpAttempts(0); // Reset attempts
      setMaxAttemptsReached(false); // Reset max attempts flag
      setOtpError(''); // Clear any previous errors
      
      // Start OTP expiration countdown timer
      const expirationTimer = setInterval(() => {
        setOtpExpirationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(expirationTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start resend countdown timer
      const resendTimer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(resendTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      
    } catch (error) {
      
      } finally {
        setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If birthdate is being changed, automatically calculate age
    if (name === 'birthDate') {
      const calculatedAge = calculateAge(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        age: calculatedAge
      }));
    } else {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 2: OTP Verification
  if (signupStep === 2) {
  return (
    <Background>
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8">
          <div className="mb-6">
          <RefreshLink to="/homepage">
            <img 
              src={LogoSignup} 
              alt="BloodBank Logo" 
                className="w-24 h-24 cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-105 drop-shadow-lg" 
            />
          </RefreshLink>
        </div>
          
          <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                Verify Your Phone
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We've sent a 6-digit verification code to<br />
                <span className="font-semibold text-gray-800">+63 {formData.contactInformation}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-3">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  disabled={maxAttemptsReached}
                  onChange={(e) => {
                    if (!maxAttemptsReached) {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setOtpError('');
                    }
                  }}
                  className={`w-full p-4 text-center text-2xl tracking-widest rounded-xl border-2 transition-all duration-300 ${
                    maxAttemptsReached
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : otpError 
                        ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-200'
                  } focus:ring-4 focus:outline-none font-mono`}
                  placeholder={maxAttemptsReached ? "BLOCKED" : "000000"}
                  maxLength={6}
                />
                {otpError && (
                  <p className="text-red-500 text-xs mt-2 flex items-center animate-pulse">
                    <X size={12} className="mr-1" /> {otpError}
                  </p>
                )}
              </div>

              {otpExpirationCountdown > 0 && (
                <div className="flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <Clock size={16} className="mr-2 text-gray-500" />
                  Code expires in <span className="font-mono font-semibold mx-1">{formatTime(otpExpirationCountdown)}</span>
                </div>
              )}

              {otpAttempts > 0 && !maxAttemptsReached && (
                <div className="text-center mb-4">
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                    ⚠️ Attempt {otpAttempts} of 3. {3 - otpAttempts} attempt(s) remaining.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6 || maxAttemptsReached}
                className={`w-full py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                  isLoading || otpCode.length !== 6 || maxAttemptsReached
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Verifying...
                  </div>
                ) : maxAttemptsReached ? (
                  'Maximum Attempts Reached'
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 mb-3">Didn't receive the code?</p>
              <button
                onClick={handleResendOTP}
                disabled={resendCountdown > 0}
                className={`text-sm font-semibold transition-all duration-300 ${
                  resendCountdown > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-700 hover:underline'
                }`}
              >
                {resendCountdown > 0 ? `Resend in ${formatTime(resendCountdown)}` : 'Resend Code'}
              </button>
            </div>

            <button
              onClick={() => setSignupStep(1)}
              className="w-full mt-6 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-300 py-2 hover:bg-gray-50 rounded-lg"
            >
              ← Back to registration form
            </button>
          </div>
        </div>
      </Background>
    );
  }

  // Step 3: Success
  if (signupStep === 3) {
    return (
      <Background>
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8">
          <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                <Check className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Registration Successful!
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your account has been created successfully. You will be redirected to the login page shortly.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          </div>
        </div>
      </Background>
    );
  }

  // Step 1: Registration Form
  return (
    <Background>
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8">
        <div className="mb-6">
          <RefreshLink to="/homepage">
            <img 
              src={LogoSignup} 
              alt="BloodBank Logo" 
              className="w-24 h-24 cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-105 drop-shadow-lg" 
            />
          </RefreshLink>
        </div>
        
        <form onSubmit={handleSendOTP} className="w-full max-w-5xl p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">Join our community and start making a difference</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Picture Upload */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-4">
                Profile Picture
              </label>
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
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  {formData.profilePicture !== 'profile.png' ? formData.profilePicture : 'Upload a profile picture'}
                </p>
              </div>
            </div>

            {/* First and Last Name */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-gray-700 text-sm font-semibold mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${errors.firstName ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-gray-300 focus:border-red-500'} focus:ring-4 focus:ring-red-100 focus:outline-none text-sm`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <X size={12} className="mr-1" /> {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="middleInitial" className="block text-gray-700 text-sm font-semibold mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middleInitial"
                  name="middleInitial"
                  value={formData.middleInitial}
                  onChange={(e) => {
                    // Allow any letter characters without forcing uppercase
                    const value = e.target.value.replace(/[^A-Za-z]/g, '');
                    // Use a custom event to maintain compatibility with handleChange
                    const customEvent = {
                      target: {
                        name: 'middleInitial',
                        value: value
                      }
                    };
                    handleChange(customEvent);
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${errors.middleInitial ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-gray-300 focus:border-red-500'} focus:ring-4 focus:ring-red-100 focus:outline-none text-sm`}
                  placeholder="Enter your middle name"
                />
                {errors.middleInitial && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <X size={12} className="mr-1" /> {errors.middleInitial}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-gray-700 text-sm font-semibold mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    errors.lastName 
                      ? 'border-red-500 bg-red-50 focus:border-red-600' 
                      : 'border-gray-300 focus:border-red-500'
                  } focus:ring-4 focus:ring-red-100 focus:outline-none text-sm`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <X size={12} className="mr-1" /> {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email and Username in same row */}
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
                Email Address *
              </label>
              <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => {
                  handleChange(e);
                  const value = e.target.value.trim();
                  
                  // Clear previous timeout
                  if (window.emailValidationTimeout) {
                    clearTimeout(window.emailValidationTimeout);
                  }
                  
                  // Clear previous error if exists
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                  
                  // Debounce validation by 800ms (longer for email as people type slower)
                  if (value && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                    window.emailValidationTimeout = setTimeout(() => {
                      checkEmailAvailability(value);
                    }, 800);
                  } else if (value && value.includes('@')) {
                    // For incomplete but potentially valid emails, don't show error yet
                    // Just clear any existing errors
                  }
                }}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                      checkEmailAvailability(value);
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    errors.email 
                      ? 'border-red-500 bg-red-50 focus:border-red-600' 
                      : isCheckingEmail
                      ? 'border-yellow-500 bg-yellow-50 focus:border-yellow-600'
                      : formData.email && !errors.email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
                      ? 'border-green-500 bg-green-50 focus:border-green-600'
                      : 'border-gray-300 focus:border-red-500'
                  } focus:ring-4 ${
                    errors.email 
                      ? 'focus:ring-red-100' 
                      : isCheckingEmail
                      ? 'focus:ring-yellow-100'
                      : formData.email && !errors.email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
                      ? 'focus:ring-green-100'
                      : 'focus:ring-red-100'
                  } focus:outline-none text-sm pr-12`}
                placeholder="Enter your email address"
              />
                {/* Status indicator */}
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  </div>
                )}
                {!isCheckingEmail && formData.email && !errors.email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-600" />
                  </div>
                )}
                {!isCheckingEmail && errors.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={16} className="text-red-600" />
                  </div>
                )}
              </div>
              {/* Email validation messages */}
              {isCheckingEmail && (
                <p className="text-yellow-600 text-xs mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-2"></div>
                  Checking email availability...
                </p>
              )}
              {!isCheckingEmail && formData.email && !errors.email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email) && (
                <p className="text-green-600 text-xs mt-2 flex items-center">
                  <Check size={12} className="mr-1" /> Email is available!
                </p>
              )}
              {errors.email && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">
                Username *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={(e) => {
                    handleChange(e);
                    const value = e.target.value.trim();
                    
                    // Clear previous timeout
                    if (window.usernameValidationTimeout) {
                      clearTimeout(window.usernameValidationTimeout);
                    }
                    
                    // Clear previous error if exists
                    if (errors.username) {
                      setErrors(prev => ({ ...prev, username: '' }));
                    }
                    
                    // Debounce validation by 600ms
                    if (value && value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value)) {
                      window.usernameValidationTimeout = setTimeout(() => {
                        checkUsernameAvailability(value);
                      }, 600);
                    } else if (value && (value.length < 3 || !/^[a-zA-Z0-9_]+$/.test(value))) {
                      // For invalid usernames, show format error immediately
                      setTimeout(() => {
                        if (value.length < 3) {
                          setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
                        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                          setErrors(prev => ({ ...prev, username: 'Username can only contain letters, numbers, and underscores' }));
                        }
                      }, 100);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value && value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value)) {
                      checkUsernameAvailability(value);
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    errors.username 
                      ? 'border-red-500 bg-red-50 focus:border-red-600' 
                      : isCheckingUsername
                      ? 'border-yellow-500 bg-yellow-50 focus:border-yellow-600'
                      : formData.username && !errors.username && formData.username.length >= 3
                      ? 'border-green-500 bg-green-50 focus:border-green-600'
                      : 'border-gray-300 focus:border-red-500'
                  } focus:ring-4 ${
                    errors.username 
                      ? 'focus:ring-red-100' 
                      : isCheckingUsername
                      ? 'focus:ring-yellow-100'
                      : formData.username && !errors.username && formData.username.length >= 3
                      ? 'focus:ring-green-100'
                      : 'focus:ring-red-100'
                  } focus:outline-none text-sm pr-12`}
                  placeholder="Enter your username"
                />
                {/* Status indicator */}
                {isCheckingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  </div>
                )}
                {!isCheckingUsername && formData.username && !errors.username && formData.username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-600" />
                  </div>
                )}
                {!isCheckingUsername && errors.username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={16} className="text-red-600" />
                  </div>
                )}
              </div>
              {/* Username validation messages */}
              {isCheckingUsername && (
                <p className="text-yellow-600 text-xs mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-2"></div>
                  Checking username availability...
                </p>
              )}
              {!isCheckingUsername && formData.username && !errors.username && formData.username.length >= 3 && (
                <p className="text-green-600 text-xs mt-2 flex items-center">
                  <Check size={12} className="mr-1" /> Username is available!
                </p>
              )}
              {errors.username && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.username}
                </p>
              )}
            </div>

            {/* Password fields */}
            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    errors.password 
                      ? 'border-red-500 bg-red-50 focus:border-red-600' 
                      : 'border-gray-300 focus:border-red-500'
                  } focus:ring-4 focus:ring-red-100 focus:outline-none text-sm pr-12`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Enhanced password strength indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 font-medium">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength <= 2 ? 'text-red-600' : 
                      passwordStrength <= 4 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPasswordStrengthColor()} transition-all duration-500 ease-out`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {Object.entries(passwordCriteria).map(([criterion, isValid]) => (
                      <div key={criterion} className="flex items-center text-xs">
                        <div className={`w-3 h-3 rounded-full mr-2 flex items-center justify-center ${
                          isValid ? 'bg-green-500' : 'bg-gray-300'
                        } transition-colors duration-300`}>
                          {isValid && <Check size={8} className="text-white" />}
                        </div>
                        <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
                        {criterion === 'minLength' && '8+ characters'}
                          {criterion === 'hasUpperCase' && 'Uppercase'}
                          {criterion === 'hasLowerCase' && 'Lowercase'}
                        {criterion === 'hasNumber' && 'Number'}
                          {criterion === 'hasSpecialChar' && 'Special char'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    errors.confirmPassword 
                      ? 'border-red-500 bg-red-50 focus:border-red-600' 
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-500 bg-green-50 focus:border-green-600'
                      : 'border-gray-300 focus:border-red-500'
                  } focus:ring-4 ${
                    errors.confirmPassword 
                      ? 'focus:ring-red-100' 
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'focus:ring-green-100'
                      : 'focus:ring-red-100'
                  } focus:outline-none text-sm pr-12`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-600" />
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Blood Type and Contact Number in same row */}
            <div>
              <label htmlFor="bloodType" className="block text-gray-700 text-sm font-semibold mb-2">
                Blood Type *
              </label>
              <select
                id="bloodType"
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                  errors.bloodType 
                    ? 'border-red-500 bg-red-50 focus:border-red-600' 
                    : 'border-gray-300 focus:border-red-500'
                } focus:ring-4 focus:ring-red-100 focus:outline-none text-sm`}
              >
                <option value="">Select blood type</option>
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodType && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.bloodType}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contactInformation" className="block text-gray-700 text-sm font-semibold mb-2">
                Contact Number *
              </label>
              <div className="relative">
                <div className="flex">
                  <div className="bg-gray-50 p-4 rounded-l-xl border-2 border-r-0 border-gray-300 flex items-center">
                    <img src={flagLogo} alt="Philippines flag" className="w-5 h-4 mr-2" />
                    <span className="text-gray-800 text-sm font-medium">+63</span>
                  </div>
              <input
                    type="tel"
                    id="contactInformation"
                    name="contactInformation"
                    value={formData.contactInformation}
                onChange={(e) => {
                      let rawValue = e.target.value;
                      
                      // Handle different input formats (autofill might include country codes)
                      let cleanValue = rawValue.replace(/\D/g, ''); // Remove all non-digits
                      
                      // If the number starts with 63 (country code), remove it
                      if (cleanValue.startsWith('63') && cleanValue.length > 10) {
                        cleanValue = cleanValue.substring(2);
                      }
                      // If it's still too long, take the last 10 digits
                      if (cleanValue.length > 10) {
                        cleanValue = cleanValue.slice(-10); // Take last 10 digits
                      }
                      
                      // Update form data with normalized value
                      setFormData(prev => ({ ...prev, contactInformation: cleanValue }));
                      
                      // Clear previous timeout
                      if (window.phoneValidationTimeout) {
                        clearTimeout(window.phoneValidationTimeout);
                      }
                      
                      // Clear previous error if exists
                      if (errors.contactInformation) {
                        setErrors(prev => ({ ...prev, contactInformation: '' }));
                      }
                      
                      // Debounce validation by 500ms
                      if (cleanValue && /^9\d{9}$/.test(cleanValue)) {
                        // Valid: 10 digits starting with 9
                        window.phoneValidationTimeout = setTimeout(() => {
                          checkPhoneAvailability(cleanValue);
                        }, 500);
                      } else if (cleanValue && cleanValue.length === 10) {
                        // 10 digits but doesn't start with 9
                        if (!cleanValue.startsWith('9')) {
                          setErrors(prev => ({ ...prev, contactInformation: 'Contact number must start with 9 (e.g., 9394123330)' }));
                        }
                      } else if (cleanValue && cleanValue.length > 10) {
                        // More than 10 digits
                        setErrors(prev => ({ ...prev, contactInformation: 'Contact number must be exactly 10 digits' }));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value && /^9\d{9}$/.test(value)) {
                        // Valid: 10 digits starting with 9
                        checkPhoneAvailability(value);
                      } else if (value && value.length === 10 && !value.startsWith('9')) {
                        // 10 digits but doesn't start with 9
                        setErrors(prev => ({ ...prev, contactInformation: 'Contact number must start with 9 (e.g., 9394123330)' }));
                      }
                    }}
                    onInput={(e) => {
                      // Handle browser autofill with longer delay and better format handling
                      setTimeout(() => {
                        const value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
                        
                        // Handle different autofill formats
                        let normalizedPhone = value;
                        if (value.startsWith('63') && value.length === 12) {
                          normalizedPhone = value.substring(2); // Remove country code
                        } else if (value.startsWith('+63') && value.length === 13) {
                          normalizedPhone = value.substring(3); // Remove +63
                        }
                        
                        if (normalizedPhone && /^9\d{9}$/.test(normalizedPhone)) {
                          // Valid: 10 digits starting with 9
                          setFormData(prev => ({ ...prev, contactInformation: normalizedPhone }));
                          checkPhoneAvailability(normalizedPhone);
                        } else if (normalizedPhone && normalizedPhone.length === 10 && !normalizedPhone.startsWith('9')) {
                          // 10 digits but doesn't start with 9
                          setFormData(prev => ({ ...prev, contactInformation: normalizedPhone }));
                          setErrors(prev => ({ ...prev, contactInformation: 'Contact number must start with 9 (e.g., 9394123330)' }));
                        }
                      }, 300); // Longer delay for autofill
                    }}
                    className={`flex-1 p-4 rounded-r-xl border-2 transition-all duration-300 ${
                      errors.contactInformation 
                        ? 'border-red-500 bg-red-50 focus:border-red-600' 
                        : isCheckingPhone
                        ? 'border-yellow-500 bg-yellow-50 focus:border-yellow-600'
                        : formData.contactInformation && !errors.contactInformation && /^9\d{9}$/.test(formData.contactInformation)
                        ? 'border-green-500 bg-green-50 focus:border-green-600'
                        : 'border-gray-300 focus:border-red-500'
                    } focus:ring-4 ${
                      errors.contactInformation 
                        ? 'focus:ring-red-100' 
                        : isCheckingPhone
                        ? 'focus:ring-yellow-100'
                        : formData.contactInformation && !errors.contactInformation && /^9\d{9}$/.test(formData.contactInformation)
                        ? 'focus:ring-green-100'
                        : 'focus:ring-red-100'
                    } focus:outline-none text-sm pr-12`}
                    placeholder="Must start with 9 (e.g., 9394123330)"
                    maxLength={10}
                  />
                </div>
                {/* Status indicator */}
                {isCheckingPhone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  </div>
                )}
                {!isCheckingPhone && formData.contactInformation && !errors.contactInformation && /^9\d{9}$/.test(formData.contactInformation) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-600" />
                  </div>
                )}
                {!isCheckingPhone && errors.contactInformation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={16} className="text-red-600" />
                  </div>
                )}
              </div>
              {/* Phone validation messages */}
              {isCheckingPhone && (
                <p className="text-yellow-600 text-xs mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-2"></div>
                  Checking phone availability...
                </p>
              )}
              {!isCheckingPhone && formData.contactInformation && !errors.contactInformation && /^9\d{9}$/.test(formData.contactInformation) && (
                <p className="text-green-600 text-xs mt-2 flex items-center">
                  <Check size={12} className="mr-1" /> Phone number is available!
                </p>
              )}
              {errors.contactInformation && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.contactInformation}
                </p>
              )}
            </div>

            {/* Complete Address and Sex in same row */}
              <div>
              <label htmlFor="address" className="block text-gray-700 text-sm font-semibold mb-2">
                Complete Address *
                </label>
                <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                  onChange={handleChange}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                  errors.address 
                    ? 'border-red-500 bg-red-50 focus:border-red-600' 
                    : 'border-gray-300 focus:border-red-500'
                } focus:ring-4 focus:ring-red-100 focus:outline-none text-sm`}
                placeholder="Enter your complete address (street, city, province)"
                />
              {errors.address && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.address}
                </p>
              )}
              </div>

              <div>
              <label htmlFor="sex" className="block text-gray-700 text-sm font-semibold mb-2">
                Sex *
                </label>
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                  errors.sex 
                    ? 'border-red-500 bg-red-50 focus:border-red-600' 
                    : 'border-gray-300 focus:border-red-500'
                } focus:ring-4 focus:ring-red-100 focus:outline-none text-sm`}
                >
                <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              {errors.sex && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.sex}
                </p>
              )}
            </div>

            {/* Birth Date and Age in same row */}
            <div>
              <label htmlFor="birthDate" className="block text-gray-700 text-sm font-semibold mb-2">
                Birth Date *
              </label>
                <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                  onChange={handleChange}
                max={new Date(new Date().getFullYear() - 16, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                min={new Date(new Date().getFullYear() - 65, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                  errors.birthDate 
                    ? 'border-red-500 bg-red-50 focus:border-red-600' 
                    : 'border-gray-300 focus:border-red-500'
                } focus:ring-4 focus:ring-red-100 focus:outline-none text-sm`}
              />
              {errors.birthDate && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.birthDate}
                </p>
              )}
              </div>

            <div>
              <label htmlFor="age" className="block text-gray-700 text-sm font-semibold mb-2">
                Age (Auto-calculated) *
              </label>
                <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                readOnly
                className="w-full p-4 rounded-xl border-2 border-gray-300 bg-gray-100 cursor-not-allowed text-sm text-gray-600"
                placeholder="Age will be calculated from birth date"
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <X size={12} className="mr-1" /> {errors.age}
                </p>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center">
            <button
              type="submit"
              disabled={isLoading || isCheckingUsername || isCheckingEmail || isCheckingPhone}
              className={`px-12 py-4 rounded-full text-white text-lg font-semibold transition-all duration-300 transform ${
                isLoading || isCheckingUsername || isCheckingEmail || isCheckingPhone
                  ? 'opacity-70 cursor-not-allowed bg-gray-400' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:scale-105 shadow-lg hover:shadow-xl'
              } focus:outline-none focus:ring-4 focus:ring-red-200 flex items-center justify-center min-w-[180px]`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Sending OTP...
                </div>
              ) : isCheckingUsername ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Checking Username...
                </div>
              ) : isCheckingEmail ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Checking Email...
                </div>
              ) : isCheckingPhone ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Checking Phone...
                </div>
              ) : (
                'Register'
              )}
            </button>

            <p className="mt-6 text-sm text-gray-600">
              Already have an account?{' '}
              <RefreshLink
                to="/login"
                className="text-red-600 hover:text-red-700 font-semibold transition-colors duration-200 hover:underline"
              >
                Login here
              </RefreshLink>
            </p>
          </div>
        </form>
      </div>
    </Background>
  );
}