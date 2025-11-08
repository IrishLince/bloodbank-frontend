import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user data
        const response = await fetchWithAuth('/user/me');
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            profilePhotoUrl: userData.profilePhotoUrl,
          });
        } else {
          // If the token is invalid, clear it
          logout();
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens and user data
      localStorage.setItem('userToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Set user data in context
      setUser({
        id: data.id,
        email: data.email,
        name: data.name || email.split('@')[0],
        role: data.roles?.[0],
        profilePhotoUrl: data.profilePhotoUrl,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('userToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
