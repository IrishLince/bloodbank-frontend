import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Phone,
  Droplet,
  Calendar,
  Clock,
  Printer
} from 'lucide-react';
import Header from '../Header'

export default function RequestSheet() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    selectedHospital,
    selectedRequest,
    appointmentDate,
    appointmentTime, 
  } = location.state || {};

  const handleBackClick = () => {
    navigate('/schedule', { state: { selectedHospital, selectedRequest } });
  };

  const handleProceedClick = () => {
    navigate('/hospital'); 
  };
  
  const handleCancel = () => {
    navigate('/hospital');
  };

  const handlePrint = () => {
    // Add a small delay to ensure styles are applied before printing
    const originalTitle = document.title;
    document.title = `Blood Request - ${selectedHospital?.name || 'Hospital'}`;
    
    // Add a print-only class to the body to trigger print-specific styles
    document.body.classList.add('printing-mode');
    
    // Hide all non-printable elements before printing
    setTimeout(() => {
      window.print();
      
      // Remove the print class and restore title after printing
      setTimeout(() => {
        document.body.classList.remove('printing-mode');
        document.title = originalTitle;
      }, 100);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="no-print">
        <Header />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-6">
        {/* Back button - No Print */}
        <div className="no-print">
          <button 
            onClick={handleBackClick} 
            className="flex items-center text-gray-700 hover:text-[#C91C1C] mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Schedule</span>
          </button>
        </div>

        {/* Page title - No Print for the button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#C91C1C]">
            Request Sheet
          </h1>
          <div className="no-print">
            <button 
              onClick={handlePrint}
              className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE CONTENT - This is the only part that will print */}
        <div id="printable-content" className="bg-red-50 rounded-lg p-6 mb-10">
          <div className="max-w-3xl mx-auto">
            {/* Print Header - only visible when printing */}
            <div className="print-only mb-8 hidden">
              <div className="text-center">
                <h1 className="text-[#C91C1C] text-3xl font-bold mb-2">RedSource Blood Bank</h1>
                <p className="text-gray-600 mb-1">123 Makati Ave., Makati City</p>
                <p className="text-gray-600 mb-4">(555) 765-4321</p>
                <div className="border-b-2 border-gray-300 w-full max-w-xs mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-800">Blood Delivery Request Form</h2>
                <p className="text-sm text-gray-500 mt-1">Official Delivery Documentation</p>
              </div>
            </div>
            
            {/* Document ID */}
            <div className="text-right text-xs text-gray-500 mb-2 font-mono">
              REF: BLR-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
            </div>

            {/* Hospital Section */}
            <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
              <h3 className="text-gray-900 font-medium mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2 text-[#C91C1C]" />
                Hospital Details
              </h3>
              
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Name:</span>
                  <span className="font-medium">{selectedHospital?.name || 'Hospital Name'}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Location:</span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {selectedHospital?.location || 'Hospital Address'}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-28 text-sm text-gray-500">Contact:</span>
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {selectedHospital?.phone || 'Hospital Contact'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Request Section */}
            <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
              <h3 className="text-gray-900 font-medium mb-3 flex items-center">
                <Droplet className="w-4 h-4 mr-2 text-[#C91C1C]" />
                Request Details
              </h3>
              
              <div className="space-y-3">
                
                {/* Blood Type and Units Summary */}
                <div className="flex flex-col sm:flex-row sm:items-start pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500 mt-1">Blood Type Summary:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest?.availableBloodTypes && selectedRequest.availableBloodTypes.split(', ').map((type, index) => {
                      // Get units for this blood type from the blood type summary if available
                      let unitsForType = 0;
                      
                      if (selectedRequest.bloodTypeSummary && selectedRequest.bloodTypeSummary[type]) {
                        // Use the exact units from the blood type summary
                        unitsForType = selectedRequest.bloodTypeSummary[type];
                      } else {
                        // Fallback: distribute the total units evenly
                        const totalUnits = selectedRequest?.totalUnits || 2;
                        const bloodTypeCount = selectedRequest.availableBloodTypes.split(', ').length;
                        unitsForType = Math.max(1, Math.round(totalUnits / bloodTypeCount));
                      }
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center px-3 py-1.5 rounded ${
                            type === selectedRequest?.bloodType 
                              ? 'bg-red-100 border border-red-200' 
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span className={`font-medium ${type === selectedRequest?.bloodType ? 'text-red-700' : 'text-gray-700'}`}>
                            {type}
                          </span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span className="text-sm">
                            {unitsForType} {unitsForType === 1 ? 'unit' : 'units'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Display available blood types if they exist - Hide this since we're showing the summary above */}
                {/* {selectedRequest?.availableBloodTypes && selectedRequest.availableBloodTypes !== selectedRequest.bloodType && (
                  <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                    <span className="w-28 text-sm text-gray-500">Blood Types:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedRequest.availableBloodTypes.split(', ').map((type, index) => (
                        <span 
                          key={index}
                          className={`text-xs px-2 py-0.5 rounded ${
                            type === selectedRequest.bloodType 
                              ? 'bg-red-100 text-red-700 font-medium' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )} */}
                
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Total Units:</span>
                  <div className="flex items-center">
                    <span className="font-medium text-[#C91C1C]">
                      {selectedRequest?.totalUnits || 2}
                    </span>
                    <span className="ml-1 text-gray-700">total units</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Request ID:</span>
                  <span className="font-medium">{selectedRequest?.id || 'N/A'}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {selectedRequest?.status || 'Scheduled'}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Delivery Date:</span>
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {appointmentDate ? appointmentDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Delivery Date'}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-28 text-sm text-gray-500">Delivery Time:</span>
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {appointmentTime || 'Delivery Time'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Bloodbank Section */}
            <div className="bg-white rounded-lg p-5 shadow-sm">
              <h3 className="text-gray-900 font-medium mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2 text-[#C91C1C]" />
                Bloodbank Details
              </h3>
              
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Name:</span>
                  <span className="font-medium">RedSource BloodBank</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center pb-2 border-b border-gray-100">
                  <span className="w-28 text-sm text-gray-500">Location:</span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    123 Makati Ave., Makati City
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-28 text-sm text-gray-500">Contact:</span>
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    (555) 765-4321
                  </span>
                </div>
              </div>
            </div>

            {/* Important notes */}
            <div className="mt-4 text-sm text-gray-600">
              <p>Please be ready to present valid ID upon delivery. Contact BloodBank for any changes.</p>
            </div>

            {/* Verification Section - Appears in print */}
            <div className="print-only hidden mt-8 justify-between items-center border-t border-gray-200 pt-4">
              <div className="flex-1">
                <h4 className="text-gray-800 font-medium mb-2">Verification</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Blood Bank Officer:</p>
                    <div className="mt-2 border-b border-gray-300 w-40 h-6"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hospital Representative:</p>
                    <div className="mt-2 border-b border-gray-300 w-40 h-6"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Received:</p>
                    <div className="mt-2 border-b border-gray-300 w-40 h-6"></div>
                  </div>
                </div>
              </div>
              <div className="w-32 h-32 border border-gray-300 flex items-center justify-center bg-gray-50">
                <div className="w-24 h-24 flex items-center justify-center border border-dashed border-gray-300">
                  QR Code
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom buttons - No Print */}
        <div className="flex justify-between no-print">
          <button 
            onClick={handleCancel}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleProceedClick}
            className="px-6 py-2 bg-[#C91C1C] text-white font-medium rounded-md hover:bg-red-700 flex items-center"
          >
            Confirm
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style>
        {`
        /* For page breaks and header/footer */
        @page {
          size: A4 portrait;
          margin: 0.8cm;
        }
        
        /* Global print styles */
        @media print {
          /* Hide all page elements by default */
          body * {
            visibility: hidden;
          }
          
          /* Only show the printable content */
          #printable-content, #printable-content * {
            visibility: visible;
          }
          
          /* Position the printable content at the top */
          #printable-content {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            background-color: white !important;
            transform-origin: top left;
            transform: scale(0.9); /* Scale down slightly to fit */
          }
          
          /* Override background colors */
          .bg-red-50, .bg-gray-50, .bg-white, .bg-red-100 {
            background-color: white !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          /* Make sure text appears correctly */
          .text-[#C91C1C], .text-red-700 {
            color: #C91C1C !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          /* Fix max width for proper scaling */
          .max-w-3xl {
            max-width: 100% !important;
          }
          
          /* Make print-only elements visible */
          .print-only {
            display: block !important;
            visibility: visible !important;
          }
          
          .print-only.hidden {
            display: flex !important;
            visibility: visible !important;
          }
          
          /* Remove shadows and borders for cleaner print */
          .shadow-sm, .rounded-lg {
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
          }
          
          /* Make each section more compact */
          .mb-4, .mb-8, .mb-10 {
            margin-bottom: 0.5rem !important;
          }
          
          .p-5, .p-6 {
            padding: 0.5rem !important;
          }
          
          /* Adjust spacing for print */
          .space-y-3 > * {
            margin-top: 0.3rem !important;
            margin-bottom: 0.3rem !important;
          }
          
          .border-b {
            border-bottom: none !important;
          }
          
          .pb-2 {
            padding-bottom: 0.2rem !important;
          }
          
          /* Adjust font sizes for print */
          body {
            font-size: 10pt !important;
          }
          
          h1 {
            font-size: 14pt !important;
            margin-bottom: 0.3rem !important;
          }
          
          h3 {
            font-size: 12pt !important;
            margin-bottom: 0.3rem !important;
          }
          
          .text-sm {
            font-size: 9pt !important;
          }
          
          /* Hide non-essential elements for printing */
          header, .no-print, nav, footer {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Make the blood type summary more compact */
          .flex.flex-wrap.gap-2 {
            gap: 0.3rem !important;
          }
          
          .px-3 {
            padding-left: 0.3rem !important;
            padding-right: 0.3rem !important;
          }
          
          .py-1\.5 {
            padding-top: 0.1rem !important;
            padding-bottom: 0.1rem !important;
          }
          
          /* Make verification section more compact */
          .mt-8 {
            margin-top: 0.5rem !important;
          }
          
          .pt-4 {
            padding-top: 0.3rem !important;
          }
          
          .w-32.h-32 {
            width: 1.5in !important;
            height: 1.5in !important;
          }
          
          .w-24.h-24 {
            width: 1.2in !important;
            height: 1.2in !important;
          }
          
          /* Remove any gap causing extra page */
          .print-only.mt-8 {
            page-break-before: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}
      </style>

      {/* Secondary print styles for specific targeting */}
      <style>
        {`
        @media print {
          /* Hide header specifically by ID and class */
          #root > header, header, div[class*="header"], .header {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          /* Target specific header classes */
          nav, .navbar, [class*="navbar"], [class*="nav-"] {
            display: none !important;
            visibility: hidden !important;
          }
        }
        `}
      </style>
    </div>
  );
}
