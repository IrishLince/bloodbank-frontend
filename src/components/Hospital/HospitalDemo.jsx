import React, { useState } from 'react';
import HospitalCover from './HospitalCover';
import { ArrowLeft, Smartphone, Monitor } from 'lucide-react';

const HospitalDemo = () => {
  const [selectedView, setSelectedView] = useState('desktop');
  const [coverImage, setCoverImage] = useState(null);

  const handleCoverImageChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hospital Cover Component Demo
            </h1>
            <p className="text-gray-600">
              Responsive design na maganda sa mobile at desktop
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setSelectedView('mobile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                selectedView === 'mobile' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
            <button
              onClick={() => setSelectedView('desktop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                selectedView === 'desktop' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center">
            <div className={`transition-all duration-300 ${
              selectedView === 'mobile' 
                ? 'w-full max-w-sm' 
                : 'w-full max-w-4xl'
            }`}>
              <HospitalCover
                hospitalName="Pasay City General Hospital"
                address="Pasay City General Hospital, P. Burgos St, Pasay City, Metro Manila"
                phone="09394123330"
                distance="5.1km"
                status="Open"
                coverImage={coverImage}
                isEditable={true}
                onCoverImageChange={handleCoverImageChange}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How to Use:</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">📱 Mobile Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Compact vertical layout</li>
                <li>• Touch-friendly buttons</li>
                <li>• Optimized for small screens</li>
                <li>• Status badge sa top-right</li>
                <li>• Full-width action buttons</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🖥️ Desktop Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Large hero banner layout</li>
                <li>• Horizontal information display</li>
                <li>• Hover effects on buttons</li>
                <li>• Cover image overlay</li>
                <li>• Side-by-side action buttons</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Code */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Usage Code:</h3>
          <pre className="text-sm overflow-x-auto">
{`import HospitalCover from './components/Hospital/HospitalCover';

<HospitalCover
  hospitalName="Pasay City General Hospital"
  address="P. Burgos St, Pasay City, Metro Manila"
  phone="09394123330"
  distance="5.1km"
  status="Open"
  coverImage={coverImageUrl}
  isEditable={true}
  onCoverImageChange={handleImageUpload}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default HospitalDemo;
