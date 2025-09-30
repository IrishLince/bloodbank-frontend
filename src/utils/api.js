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
    const response = await fetchWithAuth('/hospital/profile');
    if (!response.ok) {
      throw new Error('Failed to fetch hospital profile');
    }
    return response.json();
  },

  // Update hospital password
  updatePassword: async (hospitalId, passwordData) => {
    const response = await fetchWithAuth(`/hospital/${hospitalId}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update password');
    }
    return response.json();
  },

  // Send OTP for password change
  sendPasswordOTP: async (hospitalId) => {
    const response = await fetchWithAuth(`/hospital/${hospitalId}/send-password-otp`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send OTP');
    }
    return response.json();
  },

  // Update hospital profile
  updateProfile: async (hospitalId, profileData) => {
    const response = await fetchWithAuth(`/hospital/${hospitalId}`, {
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
  sendPhoneOTP: async (hospitalId, phone) => {
    const response = await fetchWithAuth(`/hospital/${hospitalId}/send-phone-otp`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: phone }),
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

// Profile photo upload function (for donors)
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

// Hospital profile photo upload function
export const uploadHospitalProfilePhoto = async (hospitalId, file) => {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetchWithAuth(`/hospital/${hospitalId}/upload-profile-photo`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, let the browser set it for FormData
    });

    if (response.ok) {
      const data = await response.json();
      
      // Update localStorage with new photo URL
      const hospitalData = JSON.parse(localStorage.getItem('hospitalData') || '{}');
      const photoUrl = data?.data?.profilePhotoUrl || data?.profilePhotoUrl;
      hospitalData.profilePhotoUrl = photoUrl;
      localStorage.setItem('hospitalData', JSON.stringify(hospitalData));
      
      // Dispatch event to update header
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
        detail: { profilePhotoUrl: photoUrl }
      }));
      
      return {
        success: true,
        photoUrl: photoUrl,
        hospital: data?.data?.hospital || data?.hospital || null
      };
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return {
        success: false,
        error: errorData?.message || 'Failed to upload photo'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to upload photo: ' + error.message
    };
  }
};

// Remove hospital profile photo function
export const removeHospitalProfilePhoto = async (hospitalId) => {
  const response = await fetchWithAuth(`/hospital/${hospitalId}/photo`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to remove profile photo');
  }
  
  // Update localStorage
  const hospitalData = JSON.parse(localStorage.getItem('hospitalData') || '{}');
  hospitalData.profilePhotoUrl = null;
  localStorage.setItem('hospitalData', JSON.stringify(hospitalData));
  
  // Dispatch event to update header
  window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
    detail: { profilePhotoUrl: null }
  }));
  
  return true;
};

// Delivery API functions
export const deliveryAPI = {
  getDeliveriesByRequestId: async (requestId) => {
    const response = await fetchWithAuth(`/deliveries/request/${requestId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch deliveries by request ID');
    }
    return response.json();
  },
  getDeliveriesByStatus: async (status) => {
    const response = await fetchWithAuth(`/deliveries/status/${status}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch deliveries by status');
    }
    return response.json();
  },
};

// Hospital Request API functions
export const hospitalRequestAPI = {
  create: async (requestData) => {
    const response = await fetchWithAuth('/hospital-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create hospital request');
    }
    return response.json();
  },
  getHospitalRequests: async (hospitalId) => {
    const response = await fetchWithAuth(`/hospital-requests/hospital/${hospitalId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch hospital requests');
    }
    return response.json();
  },
  fulfillRequestAndCreateDelivery: async (requestId) => {
    const response = await fetchWithAuth(`/hospital-requests/${requestId}/fulfill`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fulfill request and create delivery');
    }
    return response.json();
  },
};

// Blood Bank API functions
export const bloodBankAPI = {
  // Get all blood banks
  getAll: async () => {
    const response = await fetchWithAuth('/bloodbanks');
    if (!response.ok) {
      throw new Error('Failed to fetch blood banks');
    }
    return response.json();
  },
};