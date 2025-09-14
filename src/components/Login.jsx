import React, { useState } from 'react';
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import LogoSignup from '../assets/LogoSignup.png';
import Background from './Background';
import RefreshLink from './RefreshLink';
import { setTokens } from '../utils/auth';

export default function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Authenticate user
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const authData = await response.json();

      // 2. Store tokens and basic user data
      const userData = {
        token: authData.token,
        refreshToken: authData.refreshToken,
        id: authData.id,
        email: authData.email,
        name: authData.name || authData.email.split('@')[0],
        role: authData.roles?.[0],
        profilePhotoUrl: authData.profilePhotoUrl || '',
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // For backward compatibility and new auth system
      setTokens(authData.token, authData.refreshToken); // This handles both userToken and accessToken
      if (authData.id) localStorage.setItem('userId', authData.id);
      if (authData.email) localStorage.setItem('email', authData.email);
      if (authData.roles?.[0]) localStorage.setItem('userRole', authData.roles[0]);
      if (userData.name) localStorage.setItem('userName', userData.name);

      // 3. Try to fetch additional user profile data
      try {
        const profileResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          
          // Update user data with profile information if available
          if (profileData?.name) {
            // Merge profile data with existing user data
            Object.assign(userData, {
              name: profileData.name,
              profilePhotoUrl: profileData.profilePhotoUrl || userData.profilePhotoUrl
            });
            
            // Update local storage with merged data
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('userName', profileData.name);
            
            // Dispatch event to notify other components
            window.dispatchEvent(new Event('userDataUpdated'));
          }
        }
      } catch (profileError) {
      }
      
      // Update parent component's state
      if (setIsLoggedIn) setIsLoggedIn(true);
      
      // Force a full page reload to ensure all components get the latest data
      window.location.href = '/';
      
    } catch (error) {
      setError(error.message || 'Invalid email or password');
    }
  };

  return (
    <Background>
      <div className="min-h-full w-full flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-white p-10">
          <div className="text-center">
            <RefreshLink to="/homepage">
              <img 
                src={LogoSignup} 
                alt="Blood Bank Logo" 
                className="mx-auto h-24 w-24 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </RefreshLink>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form 
            className="mt-8 space-y-6" 
            onSubmit={handleSubmit}
          >
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  >
                    {showPassword ? (
                      <RiEyeOffLine className="h-5 w-5" />
                    ) : (
                      <RiEyeLine className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label 
                  htmlFor="remember-me" 
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <RefreshLink
                  to="/forgot-password"
                  className="font-medium text-red-600 hover:text-red-500"
                >
                  Forgot your password?
                </RefreshLink>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <RefreshLink
                to="/signup"
                className="font-medium text-red-600 hover:text-red-500"
              >
                Sign up
              </RefreshLink>
            </div>
          </div>
        </div>
      </div>
    </Background>
  );
};
