import React, { useState } from 'react';
import { MapPin, Phone, Navigation, CheckCircle, Clock, Camera, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

const HospitalCover = ({ 
  hospitalName = "Pasay City General Hospital",
  address = "Pasay City General Hospital, P. Burgos St, Pasay City, Metro Manila", 
  phone = "09394123330",
  distance = "5.1km",
  status = "Open",
  coverImage = null, // URL ng cover image
  isEditable = false, // Kung pwedeng mag-edit
  onCoverImageChange = null
}) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && onCoverImageChange) {
      onCoverImageChange(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Desktop & Tablet View */}
      <div className="hidden md:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden bg-white"
        >
          {/* Cover Image Section */}
          <div className="relative h-64 lg:h-80">
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={`${hospitalName} Cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                {/* Medical Pattern Overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Cpath d='M20 20h20v20H20V20zm-20 0h20v20H0V20z'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Edit Cover Button */}
            {isEditable && onCoverImageChange && (
              <button
                onClick={() => document.getElementById('cover-upload').click()}
                className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                title="Change Cover Image"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
            
            {/* Hospital Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl lg:text-4xl font-bold text-white">
                      {hospitalName}
                    </h1>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'Open' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'Open' ? 'bg-white' : 'bg-white'
                      }`}></div>
                      {status}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-blue-100 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm lg:text-base">{address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-blue-100">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm lg:text-base">{phone}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white text-lg lg:text-2xl font-bold mb-2">
                    {distance}
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                      <Navigation className="w-4 h-4" />
                      Direction
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Mobile Cover Header */}
          <div className="relative h-48">
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={`${hospitalName} Cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800">
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Cpath d='M10 10h10v10H10V10zM0 0h10v10H0V0z'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            {/* Mobile Edit Button */}
            {isEditable && onCoverImageChange && (
              <button
                onClick={() => document.getElementById('cover-upload').click()}
                className="absolute top-3 right-3 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            
            {/* Mobile Distance Badge */}
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {distance}
            </div>
          </div>
          
          {/* Mobile Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900 flex-1">
                {hospitalName}
              </h2>
              <div className={`ml-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                status === 'Open' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  status === 'Open' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {status}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{address}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{phone}</span>
              </div>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                <Navigation className="w-4 h-4" />
                Direction
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition-all">
                Select
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden File Input */}
      {isEditable && onCoverImageChange && (
        <input
          id="cover-upload"
          type="file"
          accept="image/*"
          onChange={handleCoverImageUpload}
          className="hidden"
        />
      )}
    </div>
  );
};

export default HospitalCover;
