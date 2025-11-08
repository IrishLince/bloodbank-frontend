import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const getStatusStyle = (status) => {
  switch (status) {
    case 'Fulfilled':
      return 'bg-green-100 text-green-700 ring-1 ring-green-400';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400';
    case 'Rejected':
      return 'bg-red-100 text-red-700 ring-1 ring-red-400';
    default:
      return 'bg-gray-100 text-gray-700 ring-1 ring-gray-400';
  }
};

const DonationHistory = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const fetchDonations = async () => {
      const data = [
        { date: '2025-04-20', location: 'St. Mary’s General Hospital', quantity: '5', status: 'Pending' },
        { date: '2025-01-20', location: 'Cityview Medical Center', quantity: '10', status: 'Fulfilled' },
        { date: '2024-10-15', location: 'Pinecrest Medical Center', quantity: '9', status: 'Fulfilled' },
        { date: '2024-07-10', location: 'Mount Hope Regional Hospital', quantity: '12', status: 'Rejected' },
        { date: '2024-03-10', location: 'Cityview Medical Center', quantity: '7', status: 'Fulfilled' },
        { date: '2023-12-01', location: 'Lakeside General Hospital', quantity: '6', status: 'Rejected' },
        { date: '2023-08-15', location: 'St. Mary’s General Hospital', quantity: '8', status: 'Fulfilled' },
        { date: '2023-05-01', location: 'Cityview Medical Center', quantity: '11', status: 'Rejected' },
        { date: '2023-01-10', location: 'Pinecrest Medical Center', quantity: '10', status: 'Fulfilled' },
        { date: '2022-10-25', location: 'Mount Hope Regional Hospital', quantity: '13', status: 'Rejected' },
        { date: '2022-06-01', location: 'Cityview Medical Center', quantity: '8', status: 'Fulfilled' },
        { date: '2022-02-01', location: 'Lakeside General Hospital', quantity: '5', status: 'Rejected' },
      ];

      const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setDonations(sortedData);
    };

    fetchDonations();
  }, []);

  const handleBack = () => {
    navigate('/profile-page');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-10 px-6">
      <button
        onClick={handleBack}
        className="flex items-center text-black-600 font-semibold mb-6 hover:underline"
      >
        <ChevronLeft className="mr-2" />
        Back to Profile
      </button>

      <div className="flex justify-center mb-8">
        <div className="bg-[#F2F2F2] px-6 py-3 rounded-full shadow-sm border border-red-100">
          <h1 className="text-2xl font-bold text-center text-red-600">
            Donation History
          </h1>
        </div>
      </div>

      {donations.length > 0 ? (
        <div className="overflow-x-auto max-w-6xl mx-auto">
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full bg-white shadow-md rounded-xl overflow-hidden">
              <thead className="bg-red-500 text-white text-sm font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left border-r border-gray-200">Date</th>
                  <th className="px-6 py-4 text-left border-r border-gray-200">Location</th>
                  <th className="px-6 py-4 text-left border-r border-gray-200">Quantity</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                {donations.map((donation, index) => (
                  <tr key={index} className="border-b last:border-none hover:bg-gray-50">
                    <td className="px-6 py-4 border-r border-gray-200">{donation.date}</td>
                    <td className="px-6 py-4 border-r border-gray-200">{donation.location}</td>
                    <td className="px-6 py-4 border-r border-gray-200">{donation.quantity} units</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(donation.status)}`}>
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No donation history found.</p>
      )}
    </div>
  );
};

export default DonationHistory;
