"use client"

import { useState, useEffect } from "react"
import { Gift, Award, Clock, ChevronRight, Check, AlertCircle, X, Download, TrendingUp, Star, Medal, Trophy, Heart, Stethoscope, Activity, Zap, Building2 } from "lucide-react"
import { FiX, FiCornerUpRight, FiGift, FiCheckCircle, FiClock, FiDownload, FiPackage, FiPrinter, FiAward, FiCheck } from "react-icons/fi"
import { toast } from "react-toastify"
import { fetchWithAuth } from "../../utils/api"

const RewardsSystem = () => {
  const [activeTab, setActiveTab] = useState("available")
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [selectedVoucherAmount, setSelectedVoucherAmount] = useState(1)
  const [selectedBloodType, setSelectedBloodType] = useState("A+")
  const [showBloodBagRequestsTab, setShowBloodBagRequestsTab] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [newAchievement, setNewAchievement] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visibleVoucherCodes, setVisibleVoucherCodes] = useState({})
  
  // Pagination state for Points History
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Real data from backend
  const [donorName, setDonorName] = useState("")
  const [donorId, setDonorId] = useState("")
  const [userPoints, setUserPoints] = useState(0)
  const [totalDonations, setTotalDonations] = useState(0)
  const [donorTier, setDonorTier] = useState("NEW")
  const [pointsHistory, setPointsHistory] = useState([])
  const [redeemedRewards, setRedeemedRewards] = useState([])
  const [availableRewards, setAvailableRewards] = useState([])

  // Fetch user data and reward points on component mount
  useEffect(() => {
    fetchRewardPointsData()
  }, [])
  
  // Reset pagination when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      setCurrentPage(1)
    }
  }, [activeTab])

  const fetchRewardPointsData = async () => {
    try {
      setIsLoading(true)
      
      // Get user profile with reward points
      const userResponse = await fetchWithAuth('/auth/me')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setDonorName(userData.name || "")
        setDonorId(userData.id || "")
        setUserPoints(userData.rewardPoints || 0)
        setTotalDonations(userData.totalDonations || 0)
        setDonorTier(userData.donorTier || "NEW")
      }

      // Fetch available rewards from backend
      const rewardsResponse = await fetchWithAuth('/rewards/active')
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json()
        if (rewardsData.data) {
          setAvailableRewards(rewardsData.data)
        }
      }

      // Get point history
      const userId = localStorage.getItem('userId')
      if (userId) {
        const historyResponse = await fetchWithAuth(`/reward-points/donor/${userId}/history`)
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          if (historyData.data) {
            // Transform backend data to match frontend format
            const transformedHistory = historyData.data.map(item => ({
              id: item.id,
              event: item.description,
              points: item.points,
              date: new Date(item.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })
            }))
            setPointsHistory(transformedHistory)
          }
        }

        // Get redemption history
        const redemptionResponse = await fetchWithAuth(`/reward-points/donor/${userId}/redemptions`)
        if (redemptionResponse.ok) {
          const redemptionData = await redemptionResponse.json()
          if (redemptionData.data) {
            // Separate blood bag vouchers from other redemptions
            const bloodBagVouchers = []
            const otherRedemptions = []
            const seenIds = new Set() // Track IDs to prevent duplicates
            
            redemptionData.data.forEach(item => {
              // Skip duplicates
              if (seenIds.has(item.id)) {
                return;
              }
              seenIds.add(item.id);
              
              // Include cancelled vouchers so donors can see them
              // Don't skip cancelled vouchers - donors should see their complete history
              
              if (item.rewardType === 'BLOOD_BAG_VOUCHER') {
                // Extract blood type from title (e.g., "Blood Bag Voucher - A+")
                const bloodType = item.rewardTitle.split(' - ')[1] || 'Unknown'
                const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null
                const isExpired = expiryDate && expiryDate < new Date()
                const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0
                
                bloodBagVouchers.push({
                  id: item.id,
                  status: isExpired ? 'Expired' : (item.status === 'PENDING' ? 'Pending' : 
                          item.status === 'PROCESSING' ? 'Accepted' : 
                          item.status === 'COMPLETED' ? 'Complete' : 
                          item.status === 'CANCELLED' ? 'Cancelled' : item.status),
                  requestDate: new Date(item.redeemedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }),
                  units: 1,
                  pointsUsed: item.pointsCost,
                  bloodBank: item.status === 'PENDING' ? null : (item.bloodBankInfo ? item.bloodBankInfo.name : 'RedSource Blood Center'),
                  bloodBankInfo: item.bloodBankInfo || null,
                  bloodType: bloodType,
                  voucherCode: item.voucherCode,
                  acceptedDate: item.deliveredDate ? new Date(item.deliveredDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : null,
                  expiryDate: expiryDate ? expiryDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : null,
                  isExpired,
                  isExpiringSoon,
                  daysUntilExpiry,
                  completedDate: item.status === 'COMPLETED' ? new Date(item.updatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : null,
                  notes: item.notes || null, // Add notes field for cancellation/rejection reasons
                  cancelledDate: item.status === 'CANCELLED' ? new Date(item.updatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : null
                })
              } else {
                // For other redemptions (medical services, etc.)
                const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null
                const isExpired = expiryDate && expiryDate < new Date()
                const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0
                
                otherRedemptions.push({
                  id: item.id,
                  title: item.rewardTitle,
                  redeemedDate: new Date(item.redeemedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }),
                  expiryDate: expiryDate ? expiryDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : null,
                  isExpired,
                  isExpiringSoon,
                  daysUntilExpiry,
                  status: isExpired ? 'Expired' : (item.status === 'COMPLETED' ? 'Complete' : 
                          item.status === 'CANCELLED' ? 'Cancelled' : 
                          item.status === 'PROCESSING' ? 'Processing' : item.status),
                  tier: item.tier || null, // Use actual tier from backend, not rewardType
                  voucherCode: item.voucherCode,
                  rewardType: item.rewardType,
                  hospitalInfo: item.hospitalInfo || null,
                  notes: item.notes || null, // Add notes field for cancellation reasons
                  acceptedDate: item.hospitalInfo?.acceptedDate ? new Date(item.hospitalInfo.acceptedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : null
                })
              }
            })
            
            setBloodBagRequests(bloodBagVouchers)
            setRedeemedRewards(otherRedemptions)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reward points data:', error)
      toast.error('Failed to load reward points data')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Blood bag requests state
  const [bloodBagRequests, setBloodBagRequests] = useState([])

  // Tiered rewards system
  // Toggle voucher code visibility
  const toggleVoucherCodeVisibility = (requestId) => {
    setVisibleVoucherCodes(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }))
  }

  const getDonorTier = (donations) => {
    if (donations >= 25) return { tier: 'gold', name: 'Gold Donor', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
    if (donations >= 10) return { tier: 'silver', name: 'Silver Donor', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
    if (donations >= 5) return { tier: 'bronze', name: 'Bronze Donor', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' }
    if (donations >= 1) return { tier: 'certified', name: 'Certified Donor', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
    return { tier: 'new', name: 'New Donor', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
  }

  const currentTier = getDonorTier(totalDonations)
  const nextMilestone = totalDonations < 5 ? 5 : totalDonations < 10 ? 10 : totalDonations < 25 ? 25 : null
  const progressToNext = nextMilestone ? ((totalDonations % (nextMilestone === 5 ? 5 : nextMilestone === 10 ? 5 : 15)) / (nextMilestone === 5 ? 5 : nextMilestone === 10 ? 5 : 15)) * 100 : 100

  // Blood type options
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  // Group rewards by redeemable location
  const rewardsByLocation = availableRewards.reduce((acc, reward) => {
    const location = reward.redeemableAt || 'BOTH'
    if (!acc[location]) {
      acc[location] = []
    }
    acc[location].push(reward)
    return acc
  }, {})

  const handleRedeemClick = (reward) => {
    if (reward.rewardType === "BLOOD_BAG_VOUCHER") {
      setSelectedReward(reward)
      setShowVoucherModal(true)
    } else {
      setSelectedReward(reward)
      setShowRedeemModal(true)
    }
  }

  const toggleVoucherVisibility = (rewardId) => {
    setVisibleVoucherCodes(prev => ({
      ...prev,
      [rewardId]: !prev[rewardId]
    }))
  }

  const handleConfirmRedeem = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId || !selectedReward) return

      // Use rewardType from backend, fallback to mapping if not present
      let rewardType = selectedReward.rewardType || "GENERAL"
      if (!rewardType) {
        if (selectedReward.medicalService) {
          rewardType = "MEDICAL_SERVICE"
        } else if (selectedReward.autoUnlock) {
          rewardType = "BADGE"
        } else if (selectedReward.title.includes("Gift Card")) {
          rewardType = "GIFT_CARD"
        } else if (selectedReward.title.includes("Priority")) {
          rewardType = "PRIORITY_BOOKING"
        }
      }

      const response = await fetchWithAuth(`/reward-points/donor/${userId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({
          rewardTitle: selectedReward.title,
          rewardType: rewardType,
          pointsCost: selectedReward.pointsCost,
          tier: selectedReward.tier,
          redeemableAt: selectedReward.redeemableAt
        })
      })

      if (response.ok) {
        const redemptionData = await response.json()
        const voucherCode = redemptionData.data?.voucherCode
        
        // If medical service or gift card, show voucher code
        if ((selectedReward.medicalService || selectedReward.rewardType === "MEDICAL_SERVICE" || selectedReward.rewardType === "GIFT_CARD") && voucherCode) {
          setSelectedReward({...selectedReward, voucherCode: voucherCode})
        }
        
        setRedeemSuccess(true)
        toast.success(`Successfully redeemed ${selectedReward.title}!`)
        
        // Refresh data after redemption
        setTimeout(async () => {
          await fetchRewardPointsData()
          setRedeemSuccess(false)
          setShowRedeemModal(false)
        }, 2000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to redeem reward')
        setShowRedeemModal(false)
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast.error('Failed to redeem reward')
      setShowRedeemModal(false)
    }
  }

  const getRewardIcon = (imageName) => {
    switch (imageName) {
      case "health-checkup":
        return <Award className="w-8 h-8 text-red-600" />
      case "gift-card":
        return <Gift className="w-8 h-8 text-red-600" />
      case "priority":
        return <Clock className="w-8 h-8 text-red-600" />
      case "certificate":
        return <Award className="w-8 h-8 text-blue-600" />
      case "bronze-badge":
        return <Medal className="w-8 h-8 text-orange-600" />
      case "silver-badge":
        return <Medal className="w-8 h-8 text-gray-600" />
      case "gold-badge":
        return <Trophy className="w-8 h-8 text-yellow-600" />
      case "laboratory":
        return <Activity className="w-8 h-8 text-green-600" />
      case "xray":
        return <Zap className="w-8 h-8 text-blue-600" />
      case "mri":
        return <Stethoscope className="w-8 h-8 text-purple-600" />
      case "blood-bag":
        return <FiPackage className="w-8 h-8 text-red-600" />
      default:
        return <Gift className="w-8 h-8 text-red-600" />
    }
  }

  // Helper functions for tiered system
  const isRewardUnlocked = (reward) => {
    const tier = reward.tier?.toLowerCase()
    
    if (reward.autoUnlock) {
      switch (tier) {
        case 'certified': return totalDonations >= 1
        case 'bronze': return totalDonations >= 5
        case 'silver': return totalDonations >= 10
        case 'gold': return totalDonations >= 25
        default: return true
      }
    }
    if (tier) {
      switch (tier) {
        case 'bronze': return totalDonations >= 5
        case 'silver': return totalDonations >= 10
        case 'gold': return totalDonations >= 25
        default: return true
      }
    }
    return true
  }

  const isRewardAlreadyEarned = (reward) => {
    if (reward.autoUnlock) {
      // Auto-unlock badges are automatically earned when unlocked
      return isRewardUnlocked(reward)
    }
    return redeemedRewards.some(r => r.id === reward.id)
  }

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'gold': return <Trophy className="w-5 h-5" />
      case 'silver': return <Medal className="w-5 h-5" />
      case 'bronze': return <Medal className="w-5 h-5" />
      case 'certified': return <Award className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  const getRedeemableAtIcon = (redeemableAt) => {
    switch (redeemableAt) {
      case 'HOSPITAL': return <Building2 className="w-4 h-4 text-blue-600" />
      case 'BLOODBANK': return <Heart className="w-4 h-4 text-red-600" />
      case 'BOTH': return <Gift className="w-4 h-4 text-purple-600" />
      default: return <Gift className="w-4 h-4 text-gray-600" />
    }
  }

  const getRedeemableAtLabel = (redeemableAt) => {
    switch (redeemableAt) {
      case 'HOSPITAL': return 'Hospital Only'
      case 'BLOODBANK': return 'Blood Bank Only'
      case 'BOTH': return 'Both Locations'
      default: return 'Unknown'
    }
  }

  const handleCreateBloodBagRequest = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) return

      const response = await fetchWithAuth(`/reward-points/donor/${userId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({
          rewardTitle: `Blood Bag Voucher - ${selectedBloodType}`,
          rewardType: "BLOOD_BAG_VOUCHER",
          pointsCost: 100,
          tier: selectedReward?.tier || null,
          redeemableAt: "BLOODBANK"
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Blood bag voucher created successfully for ${selectedBloodType} blood type!`)
        
        // Add the new request to the list
        const newRequest = {
          id: result.data.id,
          status: result.data.status,
          requestDate: new Date(result.data.redeemedDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          units: selectedVoucherAmount,
          pointsUsed: 100,
          bloodBank: null,
          bloodType: selectedBloodType,
          voucherCode: result.data.voucherCode
        }
        
        setBloodBagRequests(prev => [newRequest, ...prev])
        setShowVoucherModal(false)
        setShowBloodBagRequestsTab(true)
        setActiveTab("bloodBagRequests")
        
        // Refresh data to update points balance
        await fetchRewardPointsData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to create blood bag voucher')
      }
    } catch (error) {
      console.error('Error creating blood bag request:', error)
      toast.error('Failed to create blood bag voucher')
    }
  }

  const handlePrintVoucher = (request) => {
    // Create the voucher content as a new window
    const voucherWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Use the voucher code from the database
    const validationCode = request.voucherCode || `${request.id}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Get current date for the voucher issue date
    const issueDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });

    // Format the expiry date
    const expiryDate = new Date(request.expiryDate).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Write the voucher HTML
    voucherWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Blood Bag Voucher - ${request.id}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 1.5cm;
            }
            .no-print {
              display: none;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          
          .voucher-container {
            max-width: 800px;
            margin: 20px auto;
            background-color: white;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
          }
          
          .color-bar {
            height: 8px;
            background: #C91C1C;
            width: 100%;
          }
          
          .container {
            padding: 30px;
            position: relative;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .brand-name {
            font-size: 28px;
            font-weight: bold;
            color: #C91C1C;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          
          .title {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
            color: #222;
          }
          
          .voucher-id {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
            padding: 5px 10px;
            background-color: #f8f8f8;
            border-radius: 4px;
            display: inline-block;
          }
          
          .section {
            margin-bottom: 25px;
            background-color: #fff;
            border-radius: 6px;
            padding: 20px;
            border: 1px solid #eee;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-top: 0;
            margin-bottom: 15px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .info-item {
            margin-bottom: 12px;
          }
          
          .info-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 4px;
            font-size: 14px;
          }
          
          .info-value {
            font-weight: bold;
            color: #333;
            font-size: 16px;
          }

          .blood-type-section {
            background-color: #FFF5F5;
            border-left: 4px solid #C91C1C;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }

          .blood-type-value {
            font-size: 36px;
            font-weight: bold;
            color: #C91C1C;
            margin: 10px 0;
          }
          
          .validation-section {
            background-color: #f7f7f7;
            border: 2px dashed #ccc;
            border-radius: 6px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          
          .validation-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 10px;
          }
          
          .validation-code {
            font-family: 'Courier New', monospace;
            font-size: 20px;
            letter-spacing: 3px;
            font-weight: bold;
            background-color: white;
            padding: 10px 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
            display: inline-block;
          }
          
          .validation-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 15px;
          }
          
          .validation-text {
            flex: 1;
            text-align: left;
            padding-right: 20px;
          }
          
          .validation-note {
            font-size: 13px;
            color: #666;
            margin-top: 8px;
            text-align: left;
          }
          
          .qr-code {
            background-color: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          
          .notice {
            background-color: #FFF5F5;
            border-left: 4px solid #C91C1C;
            padding: 15px;
            margin: 25px 0;
            border-radius: 6px;
          }
          
          .notice-title {
            font-weight: bold;
            color: #C91C1C;
            margin-bottom: 8px;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 14px;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          
          .stamp {
            border: 2px dashed #C91C1C;
            color: #C91C1C;
            display: inline-block;
            padding: 10px 20px;
            font-size: 18px;
            font-weight: bold;
            transform: rotate(-5deg);
            position: absolute;
            right: 40px;
            top: 80px;
            background-color: rgba(255, 245, 245, 0.8);
          }
          
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            width: 45%;
          }
          
          .signature-line {
            border-top: 1px solid #ddd;
            margin-top: 40px;
            margin-bottom: 10px;
          }
          
          .signature-name {
            font-size: 14px;
            text-align: center;
            color: #555;
          }
          
          .print-button {
            background-color: #C91C1C;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 20px auto;
            transition: background-color 0.2s;
          }
          
          .print-button:hover {
            background-color: #A91515;
          }
          
          .print-button svg {
            margin-right: 8px;
          }

          .print-instructions {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
          }
          
        </style>
      </head>
      <body>
        <div class="voucher-container">
          <div class="color-bar"></div>
          <div class="container">
            <div class="header">
              <div class="brand-name">RedSource</div>
              <h1 class="title">Blood Bag Voucher</h1>
              <div class="voucher-id">Voucher ID: ${request.id}</div>
            </div>
            
            <div class="stamp">AUTHORIZED</div>
            
            <div class="section">
              <h3 class="section-title">Donor Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Donor Name</div>
                  <div class="info-value">${donorName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Donor ID</div>
                  <div class="info-value">${donorId}</div>
                </div>
              </div>
            </div>

            <div class="blood-type-section">
              <div class="info-label">Blood Type to Claim</div>
              <div class="blood-type-value">${request.bloodType || selectedBloodType}</div>
            </div>
            
            <div class="section">
              <h3 class="section-title">Voucher Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Blood Bag Units</div>
                  <div class="info-value">${request.units}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Points Used</div>
                  <div class="info-value">${request.pointsUsed} points</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Request Date</div>
                  <div class="info-value">${request.requestDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Acceptance Date</div>
                  <div class="info-value">${request.acceptedDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Issue Date</div>
                  <div class="info-value">${issueDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Valid Until</div>
                  <div class="info-value">${expiryDate}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">Blood Bank Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Blood Bank Name</div>
                  <div class="info-value">${request.bloodBank}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Location</div>
                  <div class="info-value">${request.bloodBankInfo?.address || 'Main Branch'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Contact</div>
                  <div class="info-value">${request.bloodBankInfo?.phone || '(02) 8123-4567'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Hours</div>
                  <div class="info-value">${request.bloodBankInfo?.operatingHours || 'Monday - Saturday, 8:00 AM - 5:00 PM'}</div>
                </div>
              </div>
            </div>
            
            <div class="validation-section">
              <div class="validation-label">Validation Code</div>
              <div class="validation-container">
                <div class="validation-text">
                  <div class="validation-code">${validationCode}</div>
                  <div class="validation-note">Present this code when claiming your blood bags. This code confirms your voucher's authenticity.</div>
                </div>
                <div class="qr-code">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(validationCode)}" alt="QR Code for validation" width="120" height="120" />
                </div>
              </div>
            </div>
            
            <div class="notice">
              <div class="notice-title">Important Notice</div>
              <p>This voucher entitles the donor to claim blood bag units as specified.
              Present this voucher along with a valid ID at the blood bank mentioned above.
              This voucher is valid until the expiry date shown and is non-transferable.</p>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-name">Authorized Signature</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-name">Donor Signature</div>
              </div>
            </div>
            
            <div class="footer">
              <p>RedSource Blood Bank Management System</p>
              <p>For verification, please contact: verification@redsource.com</p>
              <p>This document is void if tampered or modified</p>
            </div>
          </div>
          <div class="color-bar"></div>
        </div>

        <div class="print-instructions no-print">
          Press the button below to print your voucher.<br>
          For best results, use landscape orientation.
        </div>
        
        <button class="print-button no-print" onclick="window.print();return false;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print Voucher
        </button>
      </body>
      </html>
    `);
    
    voucherWindow.document.close();
    
    toast.success(`Voucher generated for ${request.id}. Please print it and present at ${request.bloodBank}.`);
  };

  const renderVoucherConversionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
          <h3 className="text-lg font-medium">Convert Points to Blood Bag Voucher</h3>
          <button 
            onClick={() => setShowVoucherModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center justify-center mb-6">
            <FiPackage className="text-red-600 w-16 h-16 mb-3" />
            <p className="text-center text-gray-700 mb-2">
              You are about to convert <span className="font-bold text-red-600">100 points</span> into a blood bag voucher
            </p>
            <p className="text-sm text-gray-500 text-center">
              Once created, your request will be visible to blood banks and can be claimed when approved.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Donor Name:</span>
              <span className="font-medium">{donorName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Donor ID:</span>
              <span className="font-medium">{donorId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Points Cost:</span>
              <span className="font-medium">100 points</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Blood Bag Units:</span>
              <span className="font-medium">1 unit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blood Type:</span>
              <select
                value={selectedBloodType}
                onChange={(e) => setSelectedBloodType(e.target.value)}
                className="font-medium border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowVoucherModal(false)}
              className="px-4 py-2 border rounded text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBloodBagRequest}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Create Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBloodBagRequests = () => (
    <div className="space-y-4">
      {bloodBagRequests.length > 0 ? (
        bloodBagRequests.map((request) => (
          <div key={request.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl mr-4 ${
                  request.status === 'Pending' ? 'bg-yellow-50' : 
                  request.status === 'Accepted' ? 'bg-green-50' : 'bg-green-50'
                }`}>
                  {request.status === 'Pending' ? 
                    <FiClock className={`w-6 h-6 text-yellow-600`} /> : 
                    request.status === 'Accepted' ? 
                    <FiCheckCircle className={`w-6 h-6 text-green-600`} /> :
                    <FiCheckCircle className={`w-6 h-6 text-green-600`} />
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{request.id}</h3>
                  <p className="text-sm text-gray-600">Requested on {request.requestDate}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-lg text-xs font-medium ${
                request.status === 'Expired' ? 'bg-red-100 text-red-800' :
                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                request.status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                request.status === 'Complete' || request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                request.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.status}
              </span>
            </div>
            
            {/* Expiration Warning for Blood Bag Requests */}
            {request.isExpiringSoon && !request.isExpired && (
              <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Expiring Soon!</p>
                    <p className="text-xs text-yellow-700">
                      This voucher expires in {request.daysUntilExpiry} day{request.daysUntilExpiry !== 1 ? 's' : ''} on {request.expiryDate}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Expired Notice for Blood Bag Requests */}
            {request.isExpired && (
              <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                <div className="flex items-center">
                  <X className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Expired</p>
                    <p className="text-xs text-red-700">
                      This voucher expired on {request.expiryDate}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-100 pt-3 mt-3">
              {/* Voucher Code Display - Prominent with Show/Hide */}
              {request.voucherCode && (
                <div className={`mb-4 p-4 border-2 rounded-lg ${
                  request.status === 'Cancelled' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' :
                  request.status === 'Complete' || request.status === 'Completed' || request.status === 'Accepted' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                  'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                }`}>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Your Voucher Code</p>
                    {visibleVoucherCodes[request.id] ? (
                      <p className={`text-2xl font-bold tracking-wider font-mono ${
                        request.status === 'Cancelled' ? 'text-red-600' :
                        request.status === 'Complete' || request.status === 'Completed' || request.status === 'Accepted' ? 'text-green-600' :
                        'text-yellow-600'
                      }`}>{request.voucherCode}</p>
                    ) : (
                      <p className="text-2xl font-bold text-gray-400 tracking-wider font-mono">••••••••••••</p>
                    )}
                    <button
                      onClick={() => toggleVoucherCodeVisibility(request.id)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline flex items-center justify-center mx-auto"
                    >
                      {visibleVoucherCodes[request.id] ? (
                        <>
                          <FiX className="mr-1" size={12} /> Hide Code
                        </>
                      ) : (
                        <>
                          <FiCheck className="mr-1" size={12} /> Show Code
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Show this code to the blood bank for redemption</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-sm">
                  <span className="text-gray-500">Blood Bag Units:</span>
                  <span className="ml-2 font-medium">{request.units}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Points Used:</span>
                  <span className="ml-2 font-medium">{request.pointsUsed}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Blood Type:</span>
                  <span className="ml-2 font-medium text-red-600">{request.bloodType}</span>
                </div>
                {request.bloodBank && (
                  <div className="text-sm col-span-2">
                    <span className="text-gray-500">Blood Bank:</span>
                    <span className="ml-2 font-medium">{request.bloodBank}</span>
                    {request.bloodBankInfo && (
                      <div className="mt-1 text-xs text-gray-400">
                        {request.bloodBankInfo.address && (
                          <div>📍 {request.bloodBankInfo.address}</div>
                        )}
                        {request.bloodBankInfo.phone && (
                          <div>📞 {request.bloodBankInfo.phone}</div>
                        )}
                        {request.bloodBankInfo.operatingHours && (
                          <div>🕒 {request.bloodBankInfo.operatingHours}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {request.acceptedDate && (
                  <div className="text-sm col-span-2">
                    <span className="text-gray-500">Accepted Date:</span>
                    <span className="ml-2 font-medium">{request.acceptedDate}</span>
                  </div>
                )}
                {request.expiryDate && (
                  <div className="text-sm col-span-2">
                    <span className="text-gray-500">Valid Until:</span>
                    <span className="ml-2 font-medium">{request.expiryDate}</span>
                  </div>
                )}
                {request.completedDate && (
                  <div className="text-sm col-span-2">
                    <span className="text-gray-500">Completed Date:</span>
                    <span className="ml-2 font-medium">{request.completedDate}</span>
                  </div>
                )}
                {request.cancelledDate && request.status === 'Cancelled' && (
                  <div className="text-sm col-span-2">
                    <span className="text-gray-500">Cancelled Date:</span>
                    <span className="ml-2 font-medium">{request.cancelledDate}</span>
                  </div>
                )}
              </div>
              
              {/* Rejection/Cancellation Reason - Blood Bank Information */}
              {request.status === 'Cancelled' && request.bloodBankInfo && (
                <div className="mt-3 border-2 rounded-lg p-4 bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-red-100">
                      <FiX className="w-4 h-4 text-red-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-red-800">
                      Rejected by Blood Bank
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600 font-medium w-24">🏥 Blood Bank:</span>
                      <span className="text-gray-900 font-semibold">{request.bloodBankInfo.name || request.bloodBank}</span>
                    </div>
                    
                    {request.bloodBankInfo.address && (
                      <div className="flex items-start text-sm">
                        <span className="text-gray-600 font-medium w-24">📍 Address:</span>
                        <span className="text-gray-700">{request.bloodBankInfo.address}</span>
                      </div>
                    )}
                    
                    {request.bloodBankInfo.phone && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 font-medium w-24">📞 Phone:</span>
                        <span className="text-gray-700">{request.bloodBankInfo.phone}</span>
                      </div>
                    )}
                    
                    {request.notes && (
                      <div className="flex items-start text-sm">
                        <span className="text-gray-600 font-medium w-24">❌ Reason:</span>
                        <span className="text-red-700 font-medium">
                          {request.notes.replace(/ \[Blood Bank ID: [^\]]+\]/g, '')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Rejection Reason Only (if no blood bank info) */}
              {request.status === 'Cancelled' && !request.bloodBankInfo && request.notes && (
                <div className="mt-3 border-2 rounded-lg p-4 bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-red-100">
                      <FiX className="w-4 h-4 text-red-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-red-800">
                      Request Cancelled
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start text-sm">
                      <span className="text-gray-600 font-medium w-24">❌ Reason:</span>
                      <span className="text-red-700 font-medium">
                        {request.notes.replace(/ \[Blood Bank ID: [^\]]+\]/g, '')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                {request.status === 'Pending' && (
                  <div className="text-sm text-gray-500 italic">Waiting for a blood bank to accept your request...</div>
                )}
                {request.status === 'Accepted' && (
                  <button
                    onClick={() => handlePrintVoucher(request)}
                    className="w-full py-2 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <FiPrinter className="mr-2" /> Print Voucher
                  </button>
                )}
                {request.status === 'Complete' && (
                  <div className="text-center">
                    <div className="text-sm text-green-600 font-medium">
                      Blood bag voucher successfully redeemed
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FiPackage className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-700 font-medium text-lg">No blood bag requests yet</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
            Convert your points to blood bag vouchers to see your requests here.
          </p>
          <button 
            onClick={() => {
              setActiveTab("available");
              setShowVoucherModal(true);
            }}
            className="mt-4 px-5 py-2 bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white rounded-lg text-sm font-medium hover:shadow-md">
            Convert Points Now
          </button>
        </div>
      )}
    </div>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your rewards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-full h-32 bg-[#C91C1C] rounded-b-[30%] opacity-5" />
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#C91C1C] rounded-full blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2" />
      
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center">
            <div className="bg-red-50 p-2 md:p-3 rounded-full mr-3 md:mr-4">
              <Gift className="w-5 h-5 md:w-6 md:h-6 text-[#C91C1C]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Rewards Center</h2>
          </div>
          
          <div className="bg-gradient-to-r from-[#C91C1C] to-[#FF5757] w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 rounded-xl flex items-center justify-between sm:justify-start shadow-md">
            <div>
              <span className="text-white/80 text-xs md:text-sm block">Points Balance</span>
              <span className="text-white font-bold text-xl md:text-2xl">{userPoints}</span>
            </div>
            <div className="ml-4 pl-4 border-l border-white/20">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Donor Tier Status */}
        <div className={`mb-6 p-4 md:p-6 rounded-xl border-2 ${currentTier.borderColor} ${currentTier.bgColor}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${currentTier.bgColor} border ${currentTier.borderColor}`}>
                <div className={currentTier.color}>
                  {getTierIcon(currentTier.tier)}
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTier.color}`}>{currentTier.name}</h3>
                <p className="text-sm text-gray-600">{totalDonations} donation{totalDonations !== 1 ? 's' : ''} completed</p>
              </div>
            </div>
            
            {nextMilestone && (
              <div className="flex-1 max-w-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progress to next milestone</span>
                  <span className="text-sm font-medium text-gray-700">{totalDonations}/{nextMilestone}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#C91C1C] to-[#FF5757] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(totalDonations / nextMilestone) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {nextMilestone - totalDonations} more donation{nextMilestone - totalDonations !== 1 ? 's' : ''} to unlock {nextMilestone === 5 ? 'Bronze' : nextMilestone === 10 ? 'Silver' : 'Gold'} tier
                </p>
              </div>
            )}
            
            {!nextMilestone && (
              <div className="text-center">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">Maximum Tier Achieved!</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">You've unlocked all donation milestones</p>
              </div>
            )}
          </div>
          
          {/* Earned Achievement Badges */}
          {availableRewards.filter(reward => reward.autoUnlock && isRewardAlreadyEarned(reward)).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Your Achievement Badges:</p>
              <div className="flex flex-wrap gap-2">
                {availableRewards.filter(reward => reward.autoUnlock && isRewardAlreadyEarned(reward)).map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="text-green-600">
                      {getRewardIcon(reward.image)}
                    </div>
                    <span className="text-sm font-medium text-green-800">{reward.title}</span>
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-nowrap overflow-x-auto pb-1 border-b border-gray-200 mb-6 gap-1 no-scrollbar">
          <button
            className={`px-4 py-2 md:px-5 md:py-3 font-medium text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "available" 
                ? "bg-red-50 text-red-600 border-b-2 border-red-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("available")}
          >
            Rewards & Achievements
          </button>
          <button
            className={`px-4 py-2 md:px-5 md:py-3 font-medium text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "redeemed" 
                ? "bg-red-50 text-red-600 border-b-2 border-red-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("redeemed")}
          >
            Redeemed Rewards
          </button>
          <button
            className={`px-4 py-2 md:px-5 md:py-3 font-medium text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "bloodBagRequests" 
                ? "bg-red-50 text-red-600 border-b-2 border-red-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("bloodBagRequests")}
          >
            Blood Bag Requests
          </button>
          <button
            className={`px-4 py-2 md:px-5 md:py-3 font-medium text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "history" 
                ? "bg-red-50 text-red-600 border-b-2 border-red-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Points History
          </button>
        </div>

        {activeTab === "available" && (
          <div className="space-y-8">
            {/* Rewards grouped by location */}
            {Object.keys(rewardsByLocation).map((location) => (
              <div key={location}>
                {/* Location Header */}
                <div className={`mb-4 p-4 rounded-xl ${
                  location === 'HOSPITAL' ? 'bg-blue-50 border-2 border-blue-200' :
                  location === 'BLOODBANK' ? 'bg-red-50 border-2 border-red-200' :
                  'bg-purple-50 border-2 border-purple-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      location === 'HOSPITAL' ? 'bg-blue-100' :
                      location === 'BLOODBANK' ? 'bg-red-100' :
                      'bg-purple-100'
                    }`}>
                      {getRedeemableAtIcon(location)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {getRedeemableAtLabel(location)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {rewardsByLocation[location].length} reward{rewardsByLocation[location].length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewardsByLocation[location].map((reward) => {
                    const unlocked = isRewardUnlocked(reward)
                    const earned = isRewardAlreadyEarned(reward)
                    const isMedicalService = reward.rewardType === "MEDICAL_SERVICE"
                    const isBloodBag = reward.rewardType === "BLOOD_BAG_VOUCHER"
                    const isAutoUnlock = reward.autoUnlock
                    
                    return (
                      <div
                        key={reward.id}
                        className={`border-2 rounded-xl p-4 transition-all ${
                          earned ? 'border-green-200 bg-green-50' :
                          unlocked && isAutoUnlock ? 'border-blue-200 bg-blue-50' :
                          unlocked ? 'border-gray-200 bg-white shadow-sm hover:shadow-md' :
                          'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-xl ${
                            earned ? 'bg-green-100' :
                            unlocked && isAutoUnlock ? 'bg-blue-100' :
                            unlocked ? 'bg-red-50' :
                            'bg-gray-100'
                          }`}>
                            {getRewardIcon(reward.image)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800">{reward.title}</h4>
                              {earned && <Check className="w-4 h-4 text-green-600" />}
                              {unlocked && !earned && isAutoUnlock && <Star className="w-4 h-4 text-blue-600" />}
                              {reward.tier && !isAutoUnlock && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  reward.tier.toLowerCase() === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                                  reward.tier.toLowerCase() === 'silver' ? 'bg-gray-100 text-gray-800' :
                                  reward.tier.toLowerCase() === 'bronze' ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {reward.tier.charAt(0).toUpperCase() + reward.tier.slice(1).toLowerCase()} Tier
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                            
                            <div className="flex items-center justify-between">
                              {isAutoUnlock ? (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  earned ? 'bg-green-100 text-green-800' :
                                  unlocked ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {earned ? 'Earned' : unlocked ? 'Unlocked' : reward.unlockCondition}
                                </span>
                              ) : (
                                <>
                                  <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-sm">
                                    {reward.pointsCost} points
                                  </span>
                                  <button
                                    onClick={() => handleRedeemClick(reward)}
                                    disabled={userPoints < reward.pointsCost || !unlocked}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                      userPoints >= reward.pointsCost && unlocked
                                        ? "bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white hover:shadow-md"
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    }`}
                                  >
                                    {!unlocked ? `Requires ${reward.tier?.toLowerCase()} Tier` :
                                     userPoints >= reward.pointsCost ? "Redeem" : "Not Enough Points"}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "redeemed" && (
          <div className="space-y-4">
            {redeemedRewards.length > 0 ? (
              redeemedRewards.map((reward) => (
                <div key={reward.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        reward.status === 'Cancelled' ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        {reward.status === 'Cancelled' ? (
                          <FiX className="w-5 h-5 text-red-600" />
                        ) : (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 text-lg">{reward.title}</h3>
                          {reward.tier && reward.tier !== 'gift_card' && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              reward.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                              reward.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                              reward.tier === 'bronze' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {reward.tier.charAt(0).toUpperCase() + reward.tier.slice(1)} Achievement
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Redeemed on {reward.redeemedDate}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        reward.status === "Expired" ? "bg-red-100 text-red-800" :
                        reward.status === "Complete" || reward.status === "Completed" ? "bg-green-100 text-green-800" : 
                        reward.status === "Cancelled" ? "bg-red-100 text-red-800" :
                        reward.status === "Processing" ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {reward.status}
                    </span>
                  </div>
                  
                  {/* Expiration Warning */}
                  {reward.isExpiringSoon && !reward.isExpired && (
                    <div className="mb-3 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-800">Expiring Soon!</p>
                          <p className="text-xs text-yellow-700">
                            This reward expires in {reward.daysUntilExpiry} day{reward.daysUntilExpiry !== 1 ? 's' : ''} on {reward.expiryDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Expired Notice */}
                  {reward.isExpired && (
                    <div className="mb-3 bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                      <div className="flex items-center">
                        <X className="w-5 h-5 text-red-600 mr-2" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">Expired</p>
                          <p className="text-xs text-red-700">
                            This reward expired on {reward.expiryDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Voucher code section for medical services and gift cards */}
                  {reward.voucherCode && (reward.rewardType === 'MEDICAL_SERVICE' || reward.rewardType === 'GIFT_CARD') && (
                    <div className={`mt-3 border-2 rounded-lg p-4 ${
                      reward.status === 'Cancelled' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' :
                      reward.status === 'Complete' || reward.status === 'Completed' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                      'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                    }`}>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-2">Your Voucher Code</p>
                        {visibleVoucherCodes[reward.id] ? (
                          <p className={`text-2xl font-bold tracking-wider font-mono ${
                            reward.status === 'Cancelled' ? 'text-red-600' :
                            reward.status === 'Complete' || reward.status === 'Completed' ? 'text-green-600' :
                            'text-yellow-600'
                          }`}>
                            {reward.voucherCode}
                          </p>
                        ) : (
                          <p className="text-2xl font-bold text-gray-400 tracking-wider">
                            •••••••••••••••
                          </p>
                        )}
                        <button
                          onClick={() => toggleVoucherVisibility(reward.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline flex items-center justify-center mx-auto"
                        >
                          {visibleVoucherCodes[reward.id] ? (
                            <>
                              <X className="mr-1 w-3 h-3" /> Hide Code
                            </>
                          ) : (
                            <>
                              <Check className="mr-1 w-3 h-3" /> Show Code
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          {reward.rewardType === 'MEDICAL_SERVICE' 
                            ? 'Show this code to the hospital for redemption'
                            : 'Use this code to redeem your reward'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hospital information section for medical services */}
                  {reward.rewardType === 'MEDICAL_SERVICE' && reward.hospitalInfo && (
                    <div className={`mt-3 border-2 rounded-lg p-4 ${
                      reward.status === 'Cancelled' 
                        ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' 
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                    }`}>
                      <div className="flex items-center mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          reward.status === 'Cancelled' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {reward.status === 'Cancelled' ? (
                            <FiX className="w-4 h-4 text-red-600" />
                          ) : (
                            <Building2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <h4 className={`text-sm font-semibold ${
                          reward.status === 'Cancelled' ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {reward.status === 'Cancelled' ? 'Rejected by Hospital' : 'Accepted by Hospital'}
                        </h4>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 font-medium w-20">🏥 Hospital:</span>
                          <span className="text-gray-900 font-semibold">{reward.hospitalInfo.name}</span>
                        </div>
                        
                        {reward.hospitalInfo.address && (
                          <div className="flex items-start text-sm">
                            <span className="text-gray-600 font-medium w-20">📍 Address:</span>
                            <span className="text-gray-700">{reward.hospitalInfo.address}</span>
                          </div>
                        )}
                        
                        {reward.hospitalInfo.phone && (
                          <div className="flex items-center text-sm">
                            <span className="text-gray-600 font-medium w-20">📞 Phone:</span>
                            <span className="text-gray-700">{reward.hospitalInfo.phone}</span>
                          </div>
                        )}
                        
                        {reward.status === 'Cancelled' && reward.notes && (
                          <div className="flex items-start text-sm">
                            <span className="text-gray-600 font-medium w-20">❌ Reason:</span>
                            <span className="text-red-700 font-medium">
                              {reward.notes.replace(/ \[Hospital ID: [^\]]+\]/g, '')}
                            </span>
                          </div>
                        )}
                        
                        {reward.acceptedDate && reward.status !== 'Cancelled' && (
                          <div className="flex items-center text-sm">
                            <span className="text-gray-600 font-medium w-20">📅 Accepted:</span>
                            <span className="text-gray-700 font-medium">{reward.acceptedDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pending validation message for medical services without hospital info */}
                  {reward.rewardType === 'MEDICAL_SERVICE' && !reward.hospitalInfo && reward.status === 'Processing' && (
                    <div className="mt-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <Clock className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-800">Pending Hospital Validation</h4>
                          <p className="text-xs text-yellow-700 mt-1">
                            Present your voucher code to a participating hospital for validation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Gift className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-700 font-medium text-lg">No redeemed rewards yet</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                  Redeem your points to see your rewards here. Every blood donation earns you valuable points!
                </p>
                <button 
                  onClick={() => setActiveTab("available")}
                  className="mt-4 px-5 py-2 bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white rounded-lg text-sm font-medium hover:shadow-md">
                  Browse Available Rewards
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "bloodBagRequests" && renderBloodBagRequests()}

        {activeTab === "history" && (() => {
          // Calculate pagination
          const indexOfLastItem = currentPage * itemsPerPage
          const indexOfFirstItem = indexOfLastItem - itemsPerPage
          const currentItems = pointsHistory.slice(indexOfFirstItem, indexOfLastItem)
          const totalPages = Math.ceil(pointsHistory.length / itemsPerPage)
          
          return (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700">Your Points Activity</h3>
                <button className="flex items-center text-[#C91C1C] hover:text-[#A01515] text-sm font-medium">
                  <Download size={14} className="mr-1" />
                  Export
                </button>
              </div>
              
              {pointsHistory.length > 0 ? (
                <>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Event
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Points
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((item) => (
                              <tr key={item.id} className="hover:bg-red-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.event}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.points >= 0 ? '+' : ''}{item.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gradient-to-r from-[#FFEBEB] to-white">
                              <td colSpan="2" className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                Total Points:
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-red-600">{userPoints}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4">
                      <div className="text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, pointsHistory.length)} of {pointsHistory.length} entries
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Previous
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    currentPage === page
                                      ? 'bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white'
                                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return <span key={page} className="text-gray-400">...</span>
                            }
                            return null
                          })}
                        </div>
                        
                        {/* Next Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-700 font-medium text-lg">No points history yet</h3>
                  <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                    Start donating blood to earn points and see your activity here!
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        {/* How to Earn Points Section */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-white rounded-xl p-5 shadow-sm border border-red-100">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            How to Earn More Points
          </h3>
          <ul className="space-y-3 text-sm text-gray-700 mt-3">
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Blood Donation:</span>
                <span className="ml-1">Earn 100 points for each successful blood donation</span>
              </div>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Referrals:</span>
                <span className="ml-1">Earn 50 points when someone you refer completes their first donation</span>
              </div>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Milestone Achievements:</span>
                <span className="ml-1">Unlock exclusive badges and medical services at 5, 10, and 25 donations</span>
              </div>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Tiered Benefits:</span>
                <span className="ml-1">Bronze (5+): Lab tests • Silver (10+): X-rays • Gold (25+): MRI scans</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Redeem Confirmation Modal */}
        {showRedeemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 p-4 md:p-6 shadow-lg">
              {!redeemSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <Gift className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Confirm Redemption</h3>
                    <p className="text-gray-600 mt-2">
                      Are you sure you want to redeem <span className="font-medium">{selectedReward?.title}</span> for{" "}
                      <span className="font-medium text-red-600">{selectedReward?.pointsCost} points</span>?
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowRedeemModal(false)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRedeem}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white rounded-lg hover:from-[#B91818] hover:to-[#E54545] font-medium shadow-sm hover:shadow-md"
                    >
                      Confirm Redemption
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Redemption Successful!</h3>
                  <p className="text-gray-600 mt-2">Your reward has been successfully redeemed.</p>
                  
                  {/* Show voucher code for medical services */}
                  {selectedReward?.medicalService && selectedReward?.voucherCode && (
                    <div className="mt-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Your Voucher Code:</p>
                      <p className="text-2xl font-bold text-[#C91C1C] tracking-wider font-mono">
                        {selectedReward.voucherCode}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Present this code at any partner hospital to redeem your service
                      </p>
                    </div>
                  )}
                  
                  {!selectedReward?.medicalService && (
                    <p className="text-gray-500 text-sm mt-4">You will receive further details via email shortly.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showVoucherModal && renderVoucherConversionModal()}
        
        {/* Achievement Celebration Modal */}
        {showAchievementModal && newAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl animate-bounce">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
                <h4 className="text-lg font-semibold text-[#C91C1C] mb-3">{newAchievement.title}</h4>
                <p className="text-gray-600 mb-6">{newAchievement.description}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowAchievementModal(false)
                      setNewAchievement(null)
                      setActiveTab('redeemed')
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    View My Achievements
                  </button>
                  <button
                    onClick={() => {
                      setShowAchievementModal(false)
                      setNewAchievement(null)
                    }}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RewardsSystem
