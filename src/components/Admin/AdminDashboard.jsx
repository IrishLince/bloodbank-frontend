import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Hospital, Plus, TrendingUp, Package } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHospitals: 0,
    totalBloodBanks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetchWithAuth('/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Hospitals',
      value: stats.totalHospitals,
      icon: Hospital,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Blood Banks',
      value: stats.totalBloodBanks,
      icon: Building2,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    }
  ];

  const quickActions = [
    {
      title: 'Register Hospital',
      description: 'Add a new hospital to the system',
      icon: Hospital,
      color: 'from-blue-500 to-blue-600',
      path: '/admin/register-hospital'
    },
    {
      title: 'Register Blood Bank',
      description: 'Add a new blood bank to the system',
      icon: Building2,
      color: 'from-red-500 to-red-600',
      path: '/admin/register-bloodbank'
    },
  
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      <Header />
      
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-red-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                onClick={() => navigate(action.path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`bg-gradient-to-br ${action.color} p-4 rounded-xl shadow-lg`}>
                    <action.icon className="w-8 h-8 text-white" />
                  </div>
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600">
                  {action.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Management Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Hospitals Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <Hospital className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Hospitals</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Manage hospital registrations and view hospital information
            </p>
            <button
              onClick={() => navigate('/admin/hospitals')}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <span>View All Hospitals</span>
              <span>→</span>
            </button>
          </div>

          {/* Blood Banks Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-50 p-3 rounded-xl">
                  <Building2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Blood Banks</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Manage blood bank registrations and view blood bank information
            </p>
            <button
              onClick={() => navigate('/admin/bloodbanks')}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <span>View All Blood Banks</span>
              <span>→</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
