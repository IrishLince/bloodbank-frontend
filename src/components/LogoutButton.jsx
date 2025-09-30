import React from 'react';
import { removeTokens } from '../utils/auth';

export default function LogoutButton({ className = "", children = "Logout", onLogout }) {
  const handleLogout = () => {
    // Clear all authentication data
    removeTokens();
    
    // Call any additional logout callback
    if (onLogout) {
      onLogout();
    }
    
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      className={`bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${className}`}
    >
      {children}
    </button>
  );
} 