import React, { useState, useEffect } from 'react';
import { IoArrowBack } from "react-icons/io5";
import flagLogo from '../assets/Logophonenumber.png';
import cover from '../assets/cover.png';
import LogoSignup from '../assets/LogoSignup.png';
import { useNavigate, useLocation } from 'react-router-dom';
import RefreshLink from './RefreshLink';
import { navigateWithRefresh } from '../utils/navigation';

// Import API base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState(''); // Store the phone for display
  const location = useLocation();

  // Helper function to strip country code from phone number
  const stripCountryCode = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 12 && cleaned.startsWith('63')) {
      return cleaned.substring(2); // Remove '63' prefix, return 10 digits
    } else if (cleaned.length === 10) {
      return cleaned; // Already 10 digits, return as is
    } else if (cleaned.length > 12 && cleaned.startsWith('63')) {
      return cleaned.slice(-10); // Get last 10 digits
    } else if (cleaned.length > 10) {
      return cleaned.slice(-10); // Get last 10 digits
    }
    
    return cleaned; // Return whatever we have
  };

  // Helper function to format phone for display with +63 prefix
  const formatPhoneForDisplay = (phone) => {
    const stripped = stripCountryCode(phone);
    return stripped.length === 10 ? `+63 ${stripped}` : phone;
  };

  useEffect(() => {
    let timer;
    if (!canResend && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    if (countdown === 0) {
      setCanResend(true);
      setCountdown(60);
    }
    return () => clearInterval(timer);
  }, [canResend, countdown]);

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/(?=.*[0-9])/.test(newPassword)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    if (!/(?=.*[!@#$%^&*])/.test(newPassword)) {
      setPasswordError('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate phone number input
      const cleaned = stripCountryCode(phoneNumber);
      if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/send-forgot-password-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleaned // Send clean 10-digit number
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserPhoneNumber(formatPhoneForDisplay(phoneNumber));
        setStep(3);
        setSuccessMessage(data.message || 'OTP sent successfully');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (canResend) {
      setCanResend(false);
      setCountdown(60);
      
      try {
        const cleaned = stripCountryCode(phoneNumber);
        
        const response = await fetch(`${API_BASE_URL}/auth/send-forgot-password-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: cleaned
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setSuccessMessage(data.message || 'OTP resent successfully');
          setError('');
        } else {
          setError(data.message || 'Failed to resend OTP');
        }
      } catch (error) {
        setError('Network error. Please try again.');
      }
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // First check if OTP is 6 digits
    if (verificationCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      setLoading(false);
      return;
    }
    
    try {
      const cleaned = stripCountryCode(phoneNumber);
      
      // Verify OTP with backend using dedicated verification endpoint - SECURITY CRITICAL!
      const response = await fetch(`${API_BASE_URL}/auth/verify-forgot-password-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleaned,
          otpCode: verificationCode
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // OTP is valid - proceed to password creation
        setStep(4);
        setError('');
        setSuccessMessage('OTP verified successfully. Please create your new password.');
      } else {
        // OTP is invalid - show error and stay on verification step
        if (data.message.includes('Maximum attempts reached')) {
          setError('Maximum OTP attempts reached. Please request a new code.');
          setVerificationCode('');
          // Reset to step 1 to request new OTP
          setStep(1);
        } else {
          setError(data.message || 'Invalid verification code. Please try again.');
        }
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (validatePasswords()) {
      setLoading(true);
      setError('');
      
      try {
        const cleaned = stripCountryCode(phoneNumber);
        
        const response = await fetch(`${API_BASE_URL}/auth/reset-password-with-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: cleaned,
            otpCode: verificationCode,
            newPassword: newPassword
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStep(5);
          setSuccessMessage(data.message || 'Password reset successfully');
        } else {
          setError(data.message || 'Failed to reset password');
        }
      } catch (error) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(''); // Clear errors when going back
    } else {
      navigateWithRefresh('/login');
    }
  };

  const handleContinue = () => {
    navigateWithRefresh('/login');
  };

  const backgroundStyle = {
    backgroundImage: `url(${cover})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={backgroundStyle}>
      <div className="w-full max-w-md p-6 bg-pink-50 rounded-3xl shadow-xl mx-4">
        <div className="flex items-center justify-between mb-6">
          {step !== 5 && (
            <button
              onClick={handleBack}
              className="text-gray-800 flex items-center hover:text-gray-600 transition-colors"
              aria-label="Go back"
            >
              <IoArrowBack size={24} />
            </button>
          )}
          
          <RefreshLink to="/homepage" className="mx-auto">
            <img 
              src={LogoSignup} 
              alt="BloodBank Logo" 
              className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity" 
            />
          </RefreshLink>
          
          <div className="w-6"></div> {/* Empty div for spacing */}
        </div>

        {step < 4 && (
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {step === 3 ? 'Enter Verification Code' : 'Forgot your password?'}
          </h1>
        )}

        {step === 3 && (
          <>
            <p className="text-gray-600 text-sm mb-6">
              A verification code has been sent to your contact number {userPhoneNumber}.
              Please enter the code below to reset your password.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 text-sm rounded-lg">
                {successMessage}
              </div>
            )}
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter 6-digit verification code"
                  maxLength="6"
                />
              </div>
              {!canResend && (
                <p className="text-sm text-gray-600 mt-2">
                  You can request a new code in {countdown} seconds.
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'VERIFYING...' : 'VERIFY CODE'}
              </button>
            </form>
            <button
              onClick={handleResendCode}
              className={`w-full text-center mt-4 text-sm ${canResend ? 'text-red-600 hover:text-red-700' : 'text-gray-400'}`}
              disabled={!canResend}
            >
              <span className="text-red-600">Didn't receive the code?</span>{' '}
              <strong className={`${canResend ? 'text-red-600' : 'text-gray-400'}`}>Resend Code.</strong>
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Create New Password</h1>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                      setError('');
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter password"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must contain at least 8 characters, one uppercase letter, one number, and one special character.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm your new password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                      setError('');
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'RESETTING PASSWORD...' : 'CONFIRM'}
              </button>
            </form>
          </>
        )}

        {step === 5 && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Successful!</h1>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">You have successfully reset your password.</p>
            <p className="text-gray-600 mb-6">You can now log in with your new password.</p>
            <button
              onClick={handleContinue}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              CONTINUE
            </button>
          </div>
        )}

        {step === 1 && (
          <>
            <p className="text-gray-600 text-sm mb-6">
              Enter your registered contact number to receive a password reset code.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <img
                    src={flagLogo}
                    alt="PH flag"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-4"
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow digits and limit to 10 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(value);
                      setError('');
                    }}
                    className="w-full pl-12 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="9394123330"
                    maxLength="10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit phone number (e.g., 9394123330)
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'SENDING CODE...' : 'SEND CODE'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

