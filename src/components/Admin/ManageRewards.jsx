import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, Edit, Trash2, Power, ArrowLeft, X, Save, Award, Stethoscope, Package, Clock, CreditCard, Building2, Activity, Zap, Trophy, Medal, Heart, Search } from 'lucide-react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import { toast } from 'react-toastify';

const ManageRewards = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [filterRedeemable, setFilterRedeemable] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsCost: 0,
    rewardType: 'BADGE',
    tier: 'NEW',
    autoUnlock: false,
    unlockCondition: '',
    image: 'certificate',
    isActive: true,
    redeemableAt: 'BOTH'
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await fetchWithAuth('/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewards(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        title: reward.title || '',
        description: reward.description || '',
        pointsCost: reward.pointsCost || 0,
        rewardType: reward.rewardType || 'BADGE',
        tier: reward.tier || 'NEW',
        autoUnlock: reward.autoUnlock || false,
        unlockCondition: reward.unlockCondition || '',
        image: reward.image || 'certificate',
        isActive: reward.isActive !== undefined ? reward.isActive : true,
        redeemableAt: reward.redeemableAt || 'BOTH'
      });
    } else {
      setEditingReward(null);
      setFormData({
        title: '',
        description: '',
        pointsCost: 0,
        rewardType: 'BADGE',
        tier: 'NEW',
        autoUnlock: false,
        unlockCondition: '',
        image: 'certificate',
        isActive: true,
        redeemableAt: 'BOTH'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReward(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingReward ? `/rewards/${editingReward.id}` : '/rewards';
      const method = editingReward ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Reward ${editingReward ? 'updated' : 'created'} successfully!`);
        await fetchRewards();
        handleCloseModal();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save reward');
      }
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reward?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/rewards/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Reward deleted successfully!');
        await fetchRewards();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete reward');
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const response = await fetchWithAuth(`/rewards/${id}/toggle-active`, {
        method: 'PATCH'
      });

      if (response.ok) {
        toast.success('Reward status updated!');
        await fetchRewards();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update reward');
      }
    } catch (error) {
      console.error('Error toggling reward:', error);
      toast.error('Failed to update reward');
    }
  };

  const getRewardIcon = (imageName) => {
    switch (imageName) {
      case "certificate": return <Award className="w-6 h-6 text-blue-600" />;
      case "bronze-badge": return <Medal className="w-6 h-6 text-orange-600" />;
      case "silver-badge": return <Medal className="w-6 h-6 text-gray-600" />;
      case "gold-badge": return <Trophy className="w-6 h-6 text-yellow-600" />;
      case "laboratory": return <Activity className="w-6 h-6 text-green-600" />;
      case "xray": return <Zap className="w-6 h-6 text-blue-600" />;
      case "mri": return <Stethoscope className="w-6 h-6 text-purple-600" />;
      case "blood-bag": return <Package className="w-6 h-6 text-red-600" />;
      case "gift-card": return <CreditCard className="w-6 h-6 text-green-600" />;
      case "priority": return <Clock className="w-6 h-6 text-purple-600" />;
      default: return <Gift className="w-6 h-6 text-red-600" />;
    }
  };

  const getRedeemableAtIcon = (redeemableAt) => {
    switch (redeemableAt) {
      case 'HOSPITAL': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'BLOODBANK': return <Heart className="w-4 h-4 text-red-600" />;
      case 'BOTH': return <Gift className="w-4 h-4 text-purple-600" />;
      default: return <Gift className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRedeemableAtLabel = (redeemableAt) => {
    switch (redeemableAt) {
      case 'HOSPITAL': return 'Hospital Only';
      case 'BLOODBANK': return 'Blood Bank Only';
      case 'BOTH': return 'Both';
      default: return 'Unknown';
    }
  };

  // Filter and group rewards
  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = 
      reward.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.rewardType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.tier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterRedeemable === 'all' || reward.redeemableAt === filterRedeemable;
    
    return matchesSearch && matchesFilter;
  });

  // Group rewards by redeemableAt
  const groupedRewards = filteredRewards.reduce((acc, reward) => {
    const key = reward.redeemableAt || 'UNKNOWN';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(reward);
    return acc;
  }, {});

  const groupOrder = ['HOSPITAL', 'BLOODBANK', 'BOTH'];
  const sortedGroups = Object.keys(groupedRewards).sort((a, b) => {
    const indexA = groupOrder.indexOf(a);
    const indexB = groupOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <Header />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl" />
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Gift className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Manage Rewards
                </h1>
                <p className="text-gray-600 text-lg">
                  
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Reward</span>
            </button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, description, type, or tier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                value={filterRedeemable}
                onChange={(e) => setFilterRedeemable(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Redeemable Locations</option>
                <option value="HOSPITAL">Hospital Only</option>
                <option value="BLOODBANK">Blood Bank Only</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Separate Tables for Hospital and Blood Bank Rewards */}
        <div className="space-y-8">
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center py-12"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading rewards...</p>
            </motion.div>
          ) : (
            <>
              {/* Hospital Rewards Table */}
              {sortedGroups.includes('HOSPITAL') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Hospital Rewards</h2>
                          <p className="text-sm text-gray-600">
                            {groupedRewards['HOSPITAL'].length} reward{groupedRewards['HOSPITAL'].length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="bg-blue-50 border-b border-blue-100">
                        <tr>
                          <th className="w-16 px-4 py-4 text-center text-sm font-semibold text-gray-700">Icon</th>
                          <th className="w-48 px-4 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="w-40 px-4 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                          <th className="w-24 px-4 py-4 text-center text-sm font-semibold text-gray-700">Points</th>
                          <th className="w-32 px-4 py-4 text-center text-sm font-semibold text-gray-700">Tier</th>
                          <th className="w-32 px-4 py-4 text-center text-sm font-semibold text-gray-700">Auto Unlock</th>
                          <th className="w-28 px-4 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                          <th className="w-32 px-4 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {groupedRewards['HOSPITAL'].map((reward, index) => (
                          <motion.tr
                            key={reward.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className={`hover:bg-gray-50 transition-colors ${
                              !reward.isActive ? 'opacity-60' : ''
                            }`}
                          >
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <div className={`p-2 rounded-lg ${
                                  reward.isActive ? 'bg-purple-100' : 'bg-gray-100'
                                }`}>
                                  {getRewardIcon(reward.image)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-gray-900 truncate" title={reward.title}>
                                {reward.title}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600 truncate" title={reward.description}>
                                {reward.description}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {reward.rewardType}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="text-sm font-bold text-purple-600">{reward.pointsCost}</div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                reward.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                                reward.tier === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                                reward.tier === 'BRONZE' ? 'bg-orange-100 text-orange-800' :
                                reward.tier === 'CERTIFIED' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {reward.tier}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {reward.autoUnlock ? (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  Yes
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => handleToggleActive(reward.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  reward.isActive 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={reward.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {reward.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleOpenModal(reward)}
                                  className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(reward.id)}
                                  className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Blood Bank Rewards Table */}
              {sortedGroups.includes('BLOODBANK') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="bg-red-50 border-b-2 border-red-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-red-100">
                          <Heart className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Blood Bank Rewards</h2>
                          <p className="text-sm text-gray-600">
                            {groupedRewards['BLOODBANK'].length} reward{groupedRewards['BLOODBANK'].length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="bg-red-50 border-b border-red-100">
                        <tr>
                          <th className="w-16 px-4 py-4 text-center text-sm font-semibold text-gray-700">Icon</th>
                          <th className="w-48 px-4 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="w-40 px-4 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                          <th className="w-24 px-4 py-4 text-center text-sm font-semibold text-gray-700">Points</th>
                          <th className="w-32 px-4 py-4 text-center text-sm font-semibold text-gray-700">Tier</th>
                          <th className="w-32 px-4 py-4 text-center text-sm font-semibold text-gray-700">Auto Unlock</th>
                          <th className="w-28 px-4 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                          <th className="w-32 px-4 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {groupedRewards['BLOODBANK'].map((reward, index) => (
                          <motion.tr
                            key={reward.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className={`hover:bg-gray-50 transition-colors ${
                              !reward.isActive ? 'opacity-60' : ''
                            }`}
                          >
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <div className={`p-2 rounded-lg ${
                                  reward.isActive ? 'bg-purple-100' : 'bg-gray-100'
                                }`}>
                                  {getRewardIcon(reward.image)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-gray-900 truncate" title={reward.title}>
                                {reward.title}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600 truncate" title={reward.description}>
                                {reward.description}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {reward.rewardType}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="text-sm font-bold text-purple-600">{reward.pointsCost}</div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                reward.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                                reward.tier === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                                reward.tier === 'BRONZE' ? 'bg-orange-100 text-orange-800' :
                                reward.tier === 'CERTIFIED' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {reward.tier}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {reward.autoUnlock ? (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  Yes
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => handleToggleActive(reward.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  reward.isActive 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={reward.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {reward.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleOpenModal(reward)}
                                  className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(reward.id)}
                                  className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* No Results */}
              {filteredRewards.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center py-12 bg-white rounded-2xl shadow-lg"
                >
                  <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No rewards found</p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingReward ? 'Edit Reward' : 'Add New Reward'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Cost *
                    </label>
                    <input
                      type="number"
                      value={formData.pointsCost}
                      onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reward Type *
                    </label>
                    <select
                      value={formData.rewardType}
                      onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="BADGE">Badge</option>
                      <option value="MEDICAL_SERVICE">Medical Service</option>
                      <option value="GIFT_CARD">Gift Card</option>
                      <option value="PRIORITY_BOOKING">Priority Booking</option>
                      <option value="BLOOD_BAG_VOUCHER">Blood Bag Voucher</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tier *
                    </label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="NEW">New</option>
                      <option value="CERTIFIED">Certified</option>
                      <option value="BRONZE">Bronze</option>
                      <option value="SILVER">Silver</option>
                      <option value="GOLD">Gold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redeemable At *
                    </label>
                    <select
                      value={formData.redeemableAt}
                      onChange={(e) => setFormData({ ...formData, redeemableAt: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="HOSPITAL">Hospital Only</option>
                      <option value="BLOODBANK">Blood Bank Only</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <select
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="certificate">Certificate</option>
                    <option value="bronze-badge">Bronze Badge</option>
                    <option value="silver-badge">Silver Badge</option>
                    <option value="gold-badge">Gold Badge</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="xray">X-Ray</option>
                    <option value="mri">MRI</option>
                    <option value="blood-bag">Blood Bag</option>
                    <option value="gift-card">Gift Card</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unlock Condition
                  </label>
                  <input
                    type="text"
                    value={formData.unlockCondition}
                    onChange={(e) => setFormData({ ...formData, unlockCondition: e.target.value })}
                    placeholder="e.g., Complete 5 donations"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoUnlock"
                    checked={formData.autoUnlock}
                    onChange={(e) => setFormData({ ...formData, autoUnlock: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="autoUnlock" className="text-sm font-medium text-gray-700">
                    Auto Unlock (automatically earned when conditions are met)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active (visible to donors)
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingReward ? 'Update' : 'Create'} Reward</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageRewards;

