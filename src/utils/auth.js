// Authentication utility functions that work with existing localStorage structure

// Check if user is authenticated (compatible with existing userToken)
export const isAuthenticated = () => {
  const token = localStorage.getItem('userToken') || localStorage.getItem('accessToken');
  return !!token;
};

// Get user token (check both old and new token names)
export const getToken = () => {
  return localStorage.getItem('userToken') || localStorage.getItem('accessToken');
};

// Get refresh token
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// Set tokens (maintaining backward compatibility)
export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('userToken', accessToken); // Keep existing structure
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// Remove tokens from localStorage
export const removeTokens = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('email');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  localStorage.removeItem('userData');
};

// Refresh access token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    setTokens(data.accessToken, refreshToken);
    return data.accessToken;
  } catch (error) {
    removeTokens();
    window.location.href = '/login';
    throw error;
  }
};

// Enhanced authentication check that validates with backend
export const validateTokenWithBackend = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return true;
    } else if (response.status === 401) {
      // Try to refresh token
      try {
        await refreshAccessToken();
        return true;
      } catch {
        return false;
      }
    }
    return response.ok;
  } catch (error) {
    return false;
  }
};
