import React, { useState, useEffect } from 'react';
import { Filter, Download, ArrowUpDown, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import Header from '../Header';

const DonationHistory = () => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [mobileTableView, setMobileTableView] = useState(window.innerWidth < 640);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setMobileTableView(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

// Mock data for donation history
  const allDonations = [
  { date: '2025-04-20', location: "St. Mary's General Hospital", quantity: '5 units', status: 'Pending' },
  { date: '2025-04-20', location: "St. Mary's General Hospital", quantity: '5 units', status: 'Fulfilled' },
  { date: '2025-03-15', location: "Cityview Medical Center", quantity: '10 units', status: 'Fulfilled' },
  { date: '2025-03-15', location: "Cityview Medical Center", quantity: '10 units', status: 'Rejected' },
  { date: '2025-02-28', location: "Pinecrest Medical Center", quantity: '9 units', status: 'Fulfilled' },
  { date: '2025-01-10', location: "Mount Hope Regional Hospital", quantity: '12 units', status: 'Rejected' },
  { date: '2024-12-05', location: "Cityview Medical Center", quantity: '7 units', status: 'Fulfilled' },
  { date: '2024-11-12', location: "Lakeside General Hospital", quantity: '6 units', status: 'Rejected' },
];

  // Filter donations based on status and date
  const getFilteredDonations = () => {
    let filtered = [...allDonations];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      switch (dateFilter) {
        case 'month':
          // Current month
          filtered = filtered.filter(d => {
            const donationDate = new Date(d.date);
            return donationDate.getMonth() === currentMonth && 
                   donationDate.getFullYear() === currentYear;
          });
          break;
        case 'quarter':
          // Current quarter (3 months)
          filtered = filtered.filter(d => {
            const donationDate = new Date(d.date);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return donationDate >= threeMonthsAgo;
          });
          break;
        case 'year':
          // Current year
          filtered = filtered.filter(d => {
            const donationDate = new Date(d.date);
            return donationDate.getFullYear() === currentYear;
          });
          break;
        default:
          // All dates
          break;
      }
    }
    
    return filtered;
  };
  
  const filteredDonations = getFilteredDonations();
  
  // Sort donations
  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else if (sortField === 'quantity') {
      return sortDirection === 'asc'
        ? parseInt(a.quantity) - parseInt(b.quantity)
        : parseInt(b.quantity) - parseInt(a.quantity);
    }
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Fulfilled':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={14} className="mr-1" />;
      case 'Fulfilled':
        return <CheckCircle size={14} className="mr-1" />;
      case 'Rejected':
        return <AlertCircle size={14} className="mr-1" />;
      default:
        return null;
    }
  };

  const resetFilters = () => {
    setFilterStatus('all');
    setDateFilter('all');
  };

  // Function to export data to CSV/Excel
  const exportToExcel = () => {
    // Get the data to export (filtered & sorted)
    const dataToExport = sortedDonations;
    
    // Create CSV content
    const headers = ['Date', 'Location', 'Quantity', 'Status'];
    const csvContent = [
      headers.join(','), // Header row
      ...dataToExport.map(donation => [
        donation.date,
        `"${donation.location}"`, // Add quotes to handle commas in location names
        donation.quantity,
        donation.status
      ].join(','))
    ].join('\n');
    
    // Create a Blob containing the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    
    // Set the file name
    const fileName = `donation_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    
    // Append to the body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the URL object
    URL.revokeObjectURL(url);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render mobile card view for each donation
  const renderMobileCard = (donation, index) => (
    <div key={index} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm mb-3">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-gray-500">
          {formatDate(donation.date)}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusStyle(donation.status)}`}>
          {getStatusIcon(donation.status)}
          {donation.status}
        </span>
      </div>
      <div className="mb-2">
        <h4 className="font-medium text-gray-800 text-sm">{donation.location}</h4>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">Quantity:</span>
        <span className="text-sm font-medium">{donation.quantity}</span>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-b from-[#FFEBEB] to-white overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 md:pt-8 pb-12">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-transparent bg-clip-text inline-block">Donation History</h1>
          <div className="mt-1.5 w-20 sm:w-24 md:w-32 h-1 bg-gradient-to-r from-[#C91C1C] to-[#FF5757] mx-auto rounded-full"></div>
          <p className="text-gray-600 mt-1.5 text-xs sm:text-sm md:text-base">Your journey of saving lives through blood donation</p>
        </div>
        
        {/* Filters - More compact */}
        <div className="bg-white rounded-xl shadow-md p-2 sm:p-3 mb-4 sm:mb-5">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
            <button
              onClick={() => setShowDateFilter(false)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${!showDateFilter 
                ? 'bg-[#C91C1C] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Status
            </button>
            <button
              onClick={() => setShowDateFilter(true)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${showDateFilter 
                ? 'bg-[#C91C1C] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Date
            </button>
            <button
              onClick={resetFilters}
              className="ml-auto px-2 py-1 text-[#C91C1C] bg-red-50 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
            >
              Reset
            </button>
          </div>
        
          {/* Status Filter */}
          {!showDateFilter && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
              <div className="flex items-center mr-1.5 sm:mr-2">
                <Filter size={12} className="text-gray-400 mr-1" />
                <span className="text-gray-700 text-xs font-medium">Status:</span>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                <button 
                  onClick={() => setFilterStatus('all')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${filterStatus === 'all' 
                    ? 'bg-gray-900 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterStatus('Fulfilled')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all flex items-center ${filterStatus === 'Fulfilled' 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}
                >
                  <CheckCircle size={10} className="mr-1" />
                  Fulfilled
                </button>
                <button 
                  onClick={() => setFilterStatus('Pending')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all flex items-center ${filterStatus === 'Pending' 
                    ? 'bg-yellow-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'}`}
                >
                  <Clock size={10} className="mr-1" />
                  Pending
                </button>
                <button 
                  onClick={() => setFilterStatus('Rejected')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all flex items-center ${filterStatus === 'Rejected' 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                >
                  <AlertCircle size={10} className="mr-1" />
                  Rejected
                </button>
              </div>
            </div>
          )}
          
          {/* Date Filter */}
          {showDateFilter && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
              <div className="flex items-center mr-1.5 sm:mr-2">
                <Calendar size={12} className="text-gray-400 mr-1" />
                <span className="text-gray-700 text-xs font-medium">Period:</span>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                <button 
                  onClick={() => setDateFilter('all')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${dateFilter === 'all' 
                    ? 'bg-gray-900 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  All Time
                </button>
                <button 
                  onClick={() => setDateFilter('month')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${dateFilter === 'month' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
                >
                  This Month
                </button>
                <button 
                  onClick={() => setDateFilter('quarter')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${dateFilter === 'quarter' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
                >
                  Last 3 Months
                </button>
                <button 
                  onClick={() => setDateFilter('year')} 
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${dateFilter === 'year' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
                >
                  This Year
                </button>
              </div>
            </div>
          )}

          {/* Export Button */}
          <button 
            onClick={exportToExcel}
            className="mt-2 sm:mt-3 w-full sm:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <Download size={12} className="mr-1" />
            Export to Excel
          </button>
        </div>
        
        {/* Results and Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Results Summary */}
          <div className="p-2 sm:p-3 border-b border-gray-100 flex flex-wrap justify-between items-center gap-1 sm:gap-2">
            <div className="text-xs sm:text-sm text-gray-600">
              <span className="font-medium">{sortedDonations.length}</span> {sortedDonations.length === 1 ? 'record' : 'records'} found
              {filterStatus !== 'all' && ` • ${filterStatus}`}
              {dateFilter !== 'all' && ` • ${dateFilter === 'month' ? 'This Month' : dateFilter === 'quarter' ? 'Last 3M' : 'This Year'}`}
            </div>
          </div>
          
          {/* Mobile Card View */}
          {mobileTableView ? (
            <div className="p-2 sm:p-3">
              {sortedDonations.length > 0 ? (
                <div>
                  {sortedDonations.map((donation, index) => renderMobileCard(donation, index))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No donation records found matching your filters.
                </div>
              )}
            </div>
          ) : (
            /* Table View for larger screens */
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="p-3 font-medium cursor-pointer" onClick={() => handleSort('date')}>
                      <div className="flex items-center">
                        Date
                        {sortField === 'date' && (
                          <ArrowUpDown size={14} className={`ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th className="p-3 font-medium">Location</th>
                    <th className="p-3 font-medium cursor-pointer" onClick={() => handleSort('quantity')}>
                      <div className="flex items-center">
                        Quantity
                        {sortField === 'quantity' && (
                          <ArrowUpDown size={14} className={`ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDonations.length > 0 ? (
                    sortedDonations.map((donation, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 whitespace-nowrap">
                          {formatDate(donation.date)}
                        </td>
                        <td className="p-3">{donation.location}</td>
                        <td className="p-3 whitespace-nowrap">{donation.quantity}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusStyle(donation.status)}`}>
                            {getStatusIcon(donation.status)}
                            {donation.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-gray-500">
                        No donation records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationHistory;
