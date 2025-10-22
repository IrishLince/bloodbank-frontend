import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Package, ArrowLeft, Droplet, Calendar, Gift } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';

const Logging = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');

  const tabs = [
    {
      id: 'requests',
      label: 'All Requests',
      icon: <FileText className="w-5 h-5" />,
      description: 'View all blood requests from hospitals',
      color: 'purple',
      path: '/admin/logging/requests'
    },
    {
      id: 'deliveries',
      label: 'All Deliveries',
      icon: <Package className="w-5 h-5" />,
      description: 'Track all delivery activities',
      color: 'orange',
      path: '/admin/logging/deliveries'
    },
    {
      id: 'donations',
      label: 'All Donations',
      icon: <Calendar className="w-5 h-5" />,
      description: 'View all donation appointments by blood bank',
      color: 'blue',
      path: '/admin/logging/donations'
    },
    {
      id: 'inventories',
      label: 'All Inventories',
      icon: <Droplet className="w-5 h-5" />,
      description: 'View all blood bank inventories',
      color: 'red',
      path: '/admin/inventories'
    },
    {
      id: 'redemptions',
      label: 'All Reward Redemptions',
      icon: <Gift className="w-5 h-5" />,
      description: 'View all reward redemptions by donors and hospitals',
      color: 'green',
      path: '/admin/logging/redemptions'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <Header />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-orange-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            System Logging
          </h1>
      
        </motion.div>

        {/* Tab Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(tab.path)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`bg-${tab.color}-50 p-4 rounded-xl shadow-lg`}>
                  <div className={`text-${tab.color}-600`}>
                    {tab.icon}
                  </div>
                </div>
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">→</span>
                </motion.div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {tab.label}
              </h3>
              <p className="text-gray-600 mb-4">
                {tab.description}
              </p>
              
              <div className={`inline-flex items-center px-4 py-2 rounded-lg bg-${tab.color}-600 text-white font-medium text-sm group-hover:bg-${tab.color}-700 transition-colors`}>
                <span>View Details</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Logging;
