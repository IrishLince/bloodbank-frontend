import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Heart, Search } from 'lucide-react';
import Header from './Header';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Animated 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-9xl md:text-[12rem] font-bold text-red-600 opacity-20 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 bg-red-100 rounded-full mb-6 animate-pulse">
                  <Search className="w-12 h-12 md:w-16 md:h-16 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-4 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be incorrect.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
            <button
              onClick={() => navigate('/homepage')}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Homepage
            </button>
          </div>

          {/* Helpful Links */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <button
                onClick={() => navigate('/homepage')}
                className="p-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/about-us')}
                className="p-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                About Us
              </button>
              <button
                onClick={() => navigate('/faqs')}
                className="p-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                FAQs
              </button>
              <button
                onClick={() => navigate('/login')}
                className="p-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Login
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute h-16 w-16 md:h-24 md:w-24 border border-red-200 rounded-full opacity-20 animate-pulse"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${10 + i * 20}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

