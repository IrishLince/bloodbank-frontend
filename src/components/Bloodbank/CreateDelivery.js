import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Calendar,
  Clock, 
  Building, 
  MapPin,
  Package,
  Droplet,
  Plus,
  Search
} from 'lucide-react';

// Delivery status constants
const DELIVERY_STATUS = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  IN_TRANSIT: 'In Transit',
  COMPLETE: 'Complete'
};

export default function CreateDelivery({ onClose, onCreateDelivery }) {
  const [selectedHospital, setSelectedHospital] = useState('');
  const [date, setDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [items, setItems] = useState('');
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize with today's date
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setDate(formattedDate);
  }, []);
  
  // Sample hospitals data
  const hospitals = [
    "St. Mary's General Hospital",
    "Riverside Community Medical Center",
    "Pinecrest Medical Center",
    "Mount Hope Regional Hospital",
    "Cityview Medical Center",
    "Lakeside General Hospital",
    "Sunrise Healthcare Facility",
    "Evergreen Medical Hospital"
  ];
  
  // Blood product options
  const bloodProducts = [
    "O+ (1 unit)",
    "O- (1 unit)",
    "A+ (1 unit)",
    "A- (1 unit)",
    "B+ (1 unit)",
    "B- (1 unit)",
    "AB+ (1 unit)",
    "AB- (1 unit)",
  ];
  
  // Filter hospitals based on search term
  const filteredHospitals = hospitals.filter(hospital => 
    hospital.toLowerCase().includes(hospitalSearchTerm.toLowerCase())
  );
  
  // Handle adding a blood product
  const handleAddBloodProduct = (product) => {
    const currentItems = items ? items.split(', ') : [];
    
    // Check if product is already in the list
    if (!currentItems.includes(product)) {
      const newItems = [...currentItems, product];
      setItems(newItems.join(', '));
    }
  };
  
  // Handle removing a blood product
  const handleRemoveBloodProduct = (productToRemove) => {
    const currentItems = items ? items.split(', ') : [];
    const newItems = currentItems.filter(item => item !== productToRemove);
    setItems(newItems.join(', '));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!selectedHospital || !date || !items) {
      alert("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    // Create a new delivery object
    const newDelivery = {
      id: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
      hospital: selectedHospital,
      date: date,
      status: DELIVERY_STATUS.SCHEDULED,
      items: items,
      estimatedTime: estimatedTime || "TBD"
    };
    
    // Simulate API call
    setTimeout(() => {
      onCreateDelivery(newDelivery);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-red-50">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Truck className="mr-2 text-[#C91C1C]" /> Create New Delivery
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Hospital Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Hospital*
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search hospitals..."
                value={hospitalSearchTerm}
                onChange={(e) => setHospitalSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-2 max-h-40 overflow-y-auto">
              {filteredHospitals.length > 0 ? (
                filteredHospitals.map((hospital, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedHospital(hospital);
                      setHospitalSearchTerm('');
                    }}
                    className={`w-full text-left p-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start ${
                      selectedHospital === hospital ? 'bg-red-50' : ''
                    }`}
                  >
                    <Building className="mr-2 text-gray-500 w-4 h-4 mt-0.5" />
                    <span>{hospital}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">
                  No hospitals found
                </div>
              )}
            </div>
            
            {selectedHospital && (
              <div className="bg-blue-50 p-3 rounded-lg flex items-start">
                <Building className="mr-2 text-blue-600 w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">{selectedHospital}</p>
                  <button 
                    onClick={() => setSelectedHospital('')}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date*
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <Clock className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
          
          {/* Blood Products */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Products*
            </label>
            
            <div className="border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-500 mb-2">Selected Products:</p>
              <div className="flex flex-wrap gap-2">
                {items ? (
                  items.split(', ').map((item, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-sm"
                    >
                      <Droplet className="mr-1.5 w-3.5 h-3.5" />
                      {item}
                      <button 
                        onClick={() => handleRemoveBloodProduct(item)}
                        className="ml-1.5 text-blue-800 hover:text-blue-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No products selected</p>
                )}
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">Add Blood Products:</p>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {bloodProducts.map((product, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddBloodProduct(product)}
                    className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                    {product}
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Click on a product to add it to your delivery. You can also specify a custom quantity.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedHospital || !date || !items}
            className={`px-5 py-2 text-white bg-[#C91C1C] rounded-lg flex items-center ${
              isSubmitting || !selectedHospital || !date || !items
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:bg-[#b01818] transition-colors'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <Truck className="mr-1.5 w-4 h-4" /> Create Delivery
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 