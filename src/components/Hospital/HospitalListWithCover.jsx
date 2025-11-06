import React, { useState, useEffect } from 'react';
import HospitalCover from './HospitalCover';
import { Search, Filter, MapPin, Clock } from 'lucide-react';

const HospitalListWithCover = () => {
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Sample hospital data - replace with your API call
  const sampleHospitals = [
    {
      id: 1,
      hospitalName: "Pasay City General Hospital",
      address: "Pasay City General Hospital, P. Burgos St, Pasay City, Metro Manila",
      phone: "09394123330",
      distance: "5.1km",
      status: "Open",
      coverImage: null, // Add cover image URL here
      bloodTypesAvailable: ["A+", "B+", "O+", "AB+"],
      urgentNeed: false
    },
    {
      id: 2,
      hospitalName: "Manila General Hospital",
      address: "Taft Avenue, Manila, Metro Manila",
      phone: "02-8554-8400",
      distance: "8.2km",
      status: "Open",
      coverImage: null,
      bloodTypesAvailable: ["A+", "A-", "B+", "O+"],
      urgentNeed: true
    },
    {
      id: 3,
      hospitalName: "Makati Medical Center",
      address: "2 Amorsolo Street, Legaspi Village, Makati City",
      phone: "02-8888-8999",
      distance: "12.5km",
      status: "Open",
      coverImage: null,
      bloodTypesAvailable: ["All Types"],
      urgentNeed: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    setHospitals(sampleHospitals);
    setSelectedHospital(sampleHospitals[0]); // Default to Pasay Hospital
  }, []);

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCoverImageUpload = (hospitalId, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setHospitals(prev => prev.map(hospital => 
          hospital.id === hospitalId 
            ? { ...hospital, coverImage: e.target.result }
            : hospital
        ));
        
        if (selectedHospital?.id === hospitalId) {
          setSelectedHospital(prev => ({ ...prev, coverImage: e.target.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Hospital Directory
          </h1>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search hospitals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Hospital List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Available Hospitals</h2>
                <p className="text-sm text-gray-600">{filteredHospitals.length} hospitals found</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onClick={() => setSelectedHospital(hospital)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedHospital?.id === hospital.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">
                        {hospital.hospitalName}
                      </h3>
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {hospital.distance}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{hospital.address.split(',')[0]}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">{hospital.status}</span>
                      </div>
                      
                      {hospital.urgentNeed && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hospital Cover Display */}
          <div className="lg:col-span-2">
            {selectedHospital ? (
              <div className="space-y-6">
                <HospitalCover
                  hospitalName={selectedHospital.hospitalName}
                  address={selectedHospital.address}
                  phone={selectedHospital.phone}
                  distance={selectedHospital.distance}
                  status={selectedHospital.status}
                  coverImage={selectedHospital.coverImage}
                  isEditable={true}
                  onCoverImageChange={(file) => handleCoverImageUpload(selectedHospital.id, file)}
                />
                
                {/* Additional Hospital Info */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Blood Types Available</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHospital.bloodTypesAvailable.map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  
                  {selectedHospital.urgentNeed && (
                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                      <p className="text-red-700 font-medium">⚠️ Urgent Blood Need</p>
                      <p className="text-red-600 text-sm mt-1">
                        This hospital has an urgent need for blood donations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500">Select a hospital to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalListWithCover;
