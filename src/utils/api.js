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
