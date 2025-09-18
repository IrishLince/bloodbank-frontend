import { navigateWithRefresh } from './navigation';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

// Helper function to handle API requests with auth
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('userToken');
  
  const headers = {
    ...options.headers,
  };

  // Only set Content-Type to application/json if not uploading FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // If token is expired, try to refresh it
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken,
            }),
          });

          if (refreshResponse.ok) {
            const { accessToken } = await refreshResponse.json();
            localStorage.setItem('userToken', accessToken);
            
            // Retry the original request with new token
            const retryHeaders = {
              ...options.headers,
            };
            
            // Only set Content-Type to application/json if not uploading FormData
            if (!(options.body instanceof FormData)) {
              retryHeaders['Content-Type'] = 'application/json';
            }
            
            retryHeaders['Authorization'] = `Bearer ${accessToken}`;
            
            const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
              ...options,
              headers: retryHeaders,
            });
            return retryResponse;
          }
        } catch (error) {
          // If refresh fails, redirect to login
          localStorage.clear();
          navigateWithRefresh('/login');
          throw new Error('Session expired. Please log in again.');
        }
      }
      
      // If we get here, the refresh token is invalid or missing
      localStorage.clear();
      navigateWithRefresh('/login');
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// Hospital Profile API functions
export const hospitalProfileAPI = {
  // Get current hospital profile
  getCurrentProfile: async () => {
    const response = await fetchWithAuth('/auth/me');
    if (!response.ok) {
      throw new Error('Failed to fetch hospital profile');
    }
    return response.json();
  },

  // Update hospital password
  updatePassword: async (passwordData) => {
    const response = await fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update password');
    }
    return response.json();
  },

  // Send OTP for password change
  sendPasswordOTP: async (email, phone) => {
    const response = await fetchWithAuth('/auth/send-password-otp', {
      method: 'POST',
      body: JSON.stringify({ email, phone }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send OTP');
    }
    return response.json();
  },

  // Update hospital profile
  updateProfile: async (userId, profileData) => {
    const response = await fetchWithAuth(`/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }
    return response.json();
  },

  // Send OTP for phone verification
  sendPhoneOTP: async (phone) => {
    const response = await fetchWithAuth('/auth/send-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send phone OTP');
    }
    return response.json();
  },

  // Verify phone OTP
  verifyPhoneOTP: async (phone, otp) => {
    const response = await fetchWithAuth('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to verify OTP');
    }
    return response.json();
  }
};

// Profile photo upload function
export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('profilePhoto', file);
  
  const response = await fetchWithAuth('/user/upload-profile-photo', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to upload profile photo');
  }
  
  const data = await response.json();
  
  // Update localStorage with new photo URL
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  userData.profilePhotoUrl = data.profilePhotoUrl;
  localStorage.setItem('userData', JSON.stringify(userData));
  
  // Dispatch event to update header
  window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
    detail: { profilePhotoUrl: data.profilePhotoUrl }
  }));
  
  return data.profilePhotoUrl;
};
