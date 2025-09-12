import React from 'react';
import { createRefreshUrl } from '../utils/navigation';

/**
 * RefreshLink component - A link that forces a full page refresh
 * Use this component instead of Link for consistent page rendering
 */
const RefreshLink = ({ 
  to, 
  children, 
  className = '', 
  onClick = null,
  ...props 
}) => {
  
  const handleClick = (e) => {
    // If there's a custom onClick, call it first
    if (onClick) {
      onClick(e);
    }
    
    // If the onClick didn't prevent default (e.g. form validation)
    if (!e.defaultPrevented) {
      e.preventDefault();
      
      // Force a full page reload by using window.location
      window.location.href = to;
    }
  };

  // Use a regular anchor tag to force browser navigation
  return (
    <a 
      href={to}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
};

export default RefreshLink; 