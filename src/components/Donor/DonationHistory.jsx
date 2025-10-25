import React, { useState, useEffect } from 'react';
import { Filter, Download, ArrowUpDown, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import Header from '../Header';
import Pagination from '../Pagination';
import { fetchWithAuth } from '../../utils/api';

const DonationHistory = () => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [mobileTableView, setMobileTableView] = useState(window.innerWidth < 640);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch appointments from API
  useEffect(() => {
    const fetchDonationHistory = async () => {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('userId');
      
      if (userId) {
        try {
          const res = await fetchWithAuth(`/appointment/user/${userId}`);
          if (res.ok) {
            const body = await res.json();
            const list = Array.isArray(body) ? body : (body?.data ?? []);
            
            // Debug: Log first appointment to see structure
            if (list.length > 0) {
              console.log('First appointment data:', list[0]);
            }
            
            // Transform appointments to donation history format
            const donations = list.map(appointment => {
              // Ensure date is properly formatted
              const dateValue = appointment.appointmentDate || appointment.date || new Date().toISOString();
              
              console.log('Appointment date field:', appointment.appointmentDate, 'Final date value:', dateValue);
              
              return {
                date: dateValue,
                location: appointment.donationCenter || appointment.bloodBankName || 'N/A',
                status: appointment.status === 'Scheduled' ? 'Pending' : 
                       appointment.status === 'Complete' || appointment.status === 'Completed' ? 'Complete' : 
                       appointment.status === 'Missed' ? 'Missed' :
                       appointment.status === 'Cancelled' ? 'Deferred' :
                       appointment.status === 'Deferred' ? 'Deferred' : 'Pending'
              };
            });
            
            setAllDonations(donations);
          } else {
            throw new Error('Failed to fetch appointments');
          }
        } catch (e) {
          console.error('Error fetching donation history:', e);
          setError('Unable to load donation history. Please try again later.');
          setAllDonations([]);
        }
      } else {
        setError('User not logged in');
        setAllDonations([]);
      }
      
      setLoading(false);
    };

    fetchDonationHistory();
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setMobileTableView(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    }
    return 0;
  });

  // Pagination logic
  const totalItems = sortedDonations.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDonations = sortedDonations.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Missed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Deferred':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Missed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Deferred':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Location', 'Status'];
    const csvContent = [
      headers.join(','),
      ...sortedDonations.map(donation => [
        donation.date,
        `"${donation.location}"`,
        donation.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donation-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Donation History</h1>
          <p className="text-gray-600">Track your blood donation contributions over time</p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Status</option>
                <option value="Complete">Complete</option>
                <option value="Pending">Pending</option>
                <option value="Missed">Missed</option>
                <option value="Deferred">Deferred</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">This Year</option>
              </select>
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Complete</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allDonations.filter(d => d.status === 'Complete').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allDonations.filter(d => d.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Missed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allDonations.filter(d => d.status === 'Missed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deferred</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allDonations.filter(d => d.status === 'Deferred').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Donation Records ({filteredDonations.length})
            </h3>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30 hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export CSV</span>
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading donation history...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No donations found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="w-1/4 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th className="w-1/2 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="w-1/4 px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedDonations.map((donation, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(donation.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {donation.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(donation.status)}`}>
                            {getStatusIcon(donation.status)}
                            {donation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden">
                {paginatedDonations.map((donation, index) => (
                  <div key={index} className="p-5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDate(donation.date)}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(donation.status)}`}>
                        {getStatusIcon(donation.status)}
                        {donation.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">{donation.location}</div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  className="border-t"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationHistory;