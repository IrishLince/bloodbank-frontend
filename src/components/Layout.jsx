import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideHeaderPaths = ['/login', '/signup', '/forgot-password'];
  const isHeaderHidden = hideHeaderPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!isHeaderHidden && <Header />}
      <main className={`flex-grow ${!isHeaderHidden ? 'pt-16' : ''}`}>
      <div
          key={location.pathname}
          className="animate-fadeIn"
        >
          {children}
        </div>
      </main>
    </div>
  );
};

