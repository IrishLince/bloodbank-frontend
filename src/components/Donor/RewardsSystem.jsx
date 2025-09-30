"use client"

import { useState } from "react"
import { Gift, Award, Clock, ChevronRight, Check, AlertCircle, X, Download, TrendingUp, Star, Medal, Trophy, Heart, Stethoscope, Activity, Zap } from "lucide-react"
import { FiX, FiCornerUpRight, FiGift, FiCheckCircle, FiClock, FiDownload, FiPackage, FiPrinter, FiAward } from "react-icons/fi"
import { toast } from "react-toastify"

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

  // Donor information
  const donorName = "Irish Lince"
  const donorId = "D-4578"
  
  // Mock data - in a real app, this would come from an API
  const userPoints = 350
  const totalDonations = 12 // This would come from donation history API
  const pointsHistory = [
    { id: 1, event: "Blood Donation", points: 100, date: "Apr 15, 2024" },
    { id: 2, event: "Blood Donation", points: 100, date: "Feb 20, 2024" },
    { id: 3, event: "Referral Bonus", points: 50, date: "Feb 10, 2024" },
    { id: 4, event: "Blood Donation", points: 100, date: "Dec 05, 2023" },
    { id: 5, event: "Gold Donor Milestone Bonus", points: 500, date: "Nov 20, 2023" },
    { id: 6, event: "Silver Donor Milestone Bonus", points: 200, date: "Aug 15, 2023" },
    { id: 7, event: "Bronze Donor Milestone Bonus", points: 100, date: "May 10, 2023" },
  ]

  // Mock blood bag requests data
  const bloodBagRequests = [
    { 
      id: "REQ-001", 
      status: "Pending", 
      requestDate: "Apr 18, 2024", 
      units: 1, 
      pointsUsed: 100,
      bloodBank: null,
      bloodType: "A+"
    },
    { 
      id: "REQ-002", 
      status: "Accepted", 
      requestDate: "Apr 10, 2024", 
      units: 2, 
      pointsUsed: 200,
      bloodBank: "City Blood Bank",
      acceptedDate: "Apr 11, 2024",
      expiryDate: "Apr 25, 2024",
      bloodType: "A+"
    },
    { 
      id: "REQ-003", 
      status: "Complete", 
      requestDate: "Mar 25, 2024", 
      units: 1, 
      pointsUsed: 100,
      bloodBank: "Regional Medical Center",
      acceptedDate: "Mar 26, 2024",
      completedDate: "Mar 30, 2024",
      bloodType: "O-"
    }
  ]

  // Tiered rewards system
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

  const availableRewards = [
    {
      id: 1,
      title: "Certificate of Appreciation",
      description: "Official recognition for your first blood donation",
      pointsCost: 0,
      image: "certificate",
      tier: "certified",
      autoUnlock: true,
      unlockCondition: "Complete your first donation"
    },
    {
      id: 2,
      title: "Bronze Donor Badge",
      description: "Exclusive badge recognizing 5+ donations",
      pointsCost: 0,
      image: "bronze-badge",
      tier: "bronze",
      autoUnlock: true,
      unlockCondition: "Complete 5 donations"
    },
    {
      id: 3,
      title: "Silver Donor Badge",
      description: "Premium badge for dedicated donors with 10+ donations",
      pointsCost: 0,
      image: "silver-badge",
      tier: "silver",
      autoUnlock: true,
      unlockCondition: "Complete 10 donations"
    },
    {
      id: 4,
      title: "Gold Donor Badge + Special Recognition",
      description: "Elite status with special recognition and exclusive benefits",
      pointsCost: 0,
      image: "gold-badge",
      tier: "gold",
      autoUnlock: true,
      unlockCondition: "Complete 25 donations"
    },
    {
      id: 5,
      title: "Free Laboratory Tests",
      description: "Complete blood work and laboratory analysis",
      pointsCost: 400,
      image: "laboratory",
      tier: "bronze",
      medicalService: true
    },
    {
      id: 6,
      title: "Free X-Ray Examination",
      description: "Chest X-ray or other diagnostic imaging",
      pointsCost: 600,
      image: "xray",
      tier: "silver",
      medicalService: true
    },
    {
      id: 7,
      title: "Free MRI Scan",
      description: "Advanced MRI imaging at partner medical centers",
      pointsCost: 1200,
      image: "mri",
      tier: "gold",
      medicalService: true
    },
    {
      id: 8,
      title: "Free Health Check-up",
      description: "Comprehensive health screening at partner clinics",
      pointsCost: 300,
      image: "health-checkup",
    },
    {
      id: 9,
      title: "Gift Card",
      description: "₱500 gift card for use at partner stores",
      pointsCost: 500,
      image: "gift-card",
    },
    {
      id: 10,
      title: "Priority Booking",
      description: "Priority scheduling for your next donation",
      pointsCost: 150,
      image: "priority",
    },
    {
      id: 11,
      title: "Blood Bag Voucher",
      description: "Convert your points to donate a blood bag to hospitals in need",
      pointsCost: 100,
      image: "blood-bag",
    }
  ]

  const redeemedRewards = [
    {
      id: 1,
      title: "Certificate of Appreciation",
      redeemedDate: "Jan 15, 2024",
      status: "Delivered",
      tier: "certified"
    },
    {
      id: 2,
      title: "Bronze Donor Badge",
      redeemedDate: "May 10, 2023",
      status: "Delivered",
      tier: "bronze"
    },
    {
      id: 3,
      title: "Silver Donor Badge",
      redeemedDate: "Aug 15, 2023",
      status: "Delivered",
      tier: "silver"
    },
  ]

  // Blood type options
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  const handleRedeemClick = (reward) => {
    if (reward.title === "Blood Bag Voucher") {
      setSelectedReward(reward)
      setShowVoucherModal(true)
    } else {
      setSelectedReward(reward)
      setShowRedeemModal(true)
    }
  }

  const handleConfirmRedeem = () => {
    // In a real app, this would make an API call to redeem the reward
    setRedeemSuccess(true)
    setTimeout(() => {
      setRedeemSuccess(false)
      setShowRedeemModal(false)
    }, 2000)
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
    if (reward.autoUnlock) {
      switch (reward.tier) {
        case 'certified': return totalDonations >= 1
        case 'bronze': return totalDonations >= 5
        case 'silver': return totalDonations >= 10
        case 'gold': return totalDonations >= 25
        default: return true
      }
    }
    if (reward.tier) {
      switch (reward.tier) {
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
      return redeemedRewards.some(r => r.id === reward.id)
    }
    return false
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

  const handleCreateBloodBagRequest = () => {
    // In a real app, this would make an API call to create a blood bag request
    toast.success(`Blood bag voucher request created successfully for ${selectedBloodType} blood type. Your request is now pending.`);
    setShowVoucherModal(false);
    setShowBloodBagRequestsTab(true);
    setActiveTab("bloodBagRequests");
  }

  const handlePrintVoucher = (request) => {
    // Create the voucher content as a new window
    const voucherWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Generate a validation code (in a real app, this would be stored in the database)
    const validationCode = `${request.id}-${Math.floor(100000 + Math.random() * 900000)}`;
    
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
                  <div class="info-value">Main Branch</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Contact</div>
                  <div class="info-value">(02) 8123-4567</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Hours</div>
                  <div class="info-value">Monday - Saturday, 8:00 AM - 5:00 PM</div>
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
                  request.status === 'Accepted' ? 'bg-blue-50' : 'bg-green-50'
                }`}>
                  {request.status === 'Pending' ? 
                    <FiClock className={`w-6 h-6 text-yellow-600`} /> : 
                    request.status === 'Accepted' ? 
                    <FiCheckCircle className={`w-6 h-6 text-blue-600`} /> :
                    <FiCheckCircle className={`w-6 h-6 text-green-600`} />
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{request.id}</h3>
                  <p className="text-sm text-gray-600">Requested on {request.requestDate}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-lg text-xs font-medium ${
                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                request.status === 'Accepted' ? 'bg-blue-100 text-blue-800' : 
                'bg-green-100 text-green-800'
              }`}>
                {request.status}
              </span>
            </div>
            
            <div className="border-t border-gray-100 pt-3 mt-3">
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
                  <div className="text-sm col-span-1">
                    <span className="text-gray-500">Blood Bank:</span>
                    <span className="ml-2 font-medium">{request.bloodBank}</span>
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
              </div>
              
              <div className="mt-4">
                {request.status === 'Pending' && (
                  <div className="text-sm text-gray-500 italic">Waiting for a blood bank to accept your request...</div>
                )}
                {request.status === 'Accepted' && (
                  <button
                    onClick={() => handlePrintVoucher(request)}
                    className="w-full py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
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
          <div className="space-y-6">
            {/* Auto-unlock Achievements */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiAward className="text-[#C91C1C]" />
                Achievement Badges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRewards.filter(reward => reward.autoUnlock).map((reward) => {
                  const unlocked = isRewardUnlocked(reward)
                  const earned = isRewardAlreadyEarned(reward)
                  return (
                    <div
                      key={reward.id}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        earned ? 'border-green-200 bg-green-50' :
                        unlocked ? 'border-blue-200 bg-blue-50' :
                        'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-xl ${
                          earned ? 'bg-green-100' :
                          unlocked ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          {getRewardIcon(reward.image)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{reward.title}</h4>
                            {earned && <Check className="w-4 h-4 text-green-600" />}
                            {unlocked && !earned && <Star className="w-4 h-4 text-blue-600" />}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              earned ? 'bg-green-100 text-green-800' :
                              unlocked ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {earned ? 'Earned' : unlocked ? 'Available' : reward.unlockCondition}
                            </span>
                            {unlocked && !earned && (
                              <button
                                onClick={() => handleRedeemClick(reward)}
                                className="px-3 py-1 bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                              >
                                Claim
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Medical Services */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Stethoscope className="text-[#C91C1C]" />
                Medical Services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRewards.filter(reward => reward.medicalService).map((reward) => {
                  const unlocked = isRewardUnlocked(reward)
                  return (
                    <div
                      key={reward.id}
                      className={`border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all ${
                        !unlocked ? 'opacity-60' : ''
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${
                        unlocked ? 'bg-red-50' : 'bg-gray-100'
                      }`}>
                        {getRewardIcon(reward.image)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{reward.title}</h4>
                          {reward.tier && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              reward.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                              reward.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {reward.tier.charAt(0).toUpperCase() + reward.tier.slice(1)} Tier
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                        <div className="flex items-center justify-between">
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
                            {!unlocked ? `Requires ${reward.tier} Tier` :
                             userPoints >= reward.pointsCost ? "Redeem" : "Not Enough Points"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Regular Rewards */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Gift className="text-[#C91C1C]" />
                General Rewards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRewards.filter(reward => !reward.autoUnlock && !reward.medicalService).map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="bg-red-50 p-3 rounded-xl">{getRewardIcon(reward.image)}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-base">{reward.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-sm">
                          {reward.pointsCost} points
                        </span>
                        <button
                          onClick={() => handleRedeemClick(reward)}
                          disabled={userPoints < reward.pointsCost}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            userPoints >= reward.pointsCost
                              ? "bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white hover:shadow-md"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {userPoints >= reward.pointsCost ? "Redeem" : "Not Enough Points"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "redeemed" && (
          <div className="space-y-4">
            {redeemedRewards.length > 0 ? (
              redeemedRewards.map((reward) => (
                <div key={reward.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center shadow-sm hover:shadow-md transition-all">
                  <div className="bg-green-50 p-3 rounded-xl mr-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{reward.title}</h3>
                      {reward.tier && (
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
                    <p className="text-sm text-gray-600">Redeemed on {reward.redeemedDate}</p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${
                      reward.status === "Delivered" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {reward.status}
                  </span>
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

        {activeTab === "history" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">Your Points Activity</h3>
              <button className="flex items-center text-[#C91C1C] hover:text-[#A01515] text-sm font-medium">
                <Download size={14} className="mr-1" />
                Export
              </button>
            </div>
            
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
                      {pointsHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-red-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.event}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-right">
                            +{item.points}
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
          </div>
        )}

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
                  <p className="text-gray-500 text-sm mt-4">You will receive further details via email shortly.</p>
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
