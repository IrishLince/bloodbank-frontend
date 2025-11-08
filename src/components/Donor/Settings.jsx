"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  User, 
  Eye, 
  EyeOff, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Heart, 
  Globe, 
  Lock, 
  Trash2,
  Save,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Check,
  X
} from "lucide-react"
import Header from "../Header"
import { fetchWithAuth } from "../../utils/api"

const DonorSettings = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("notifications")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  
  // Settings state
  const [settings, setSettings] = useState({
    // Notification Settings
    notifications: {
      appointmentReminders: true,
      donationEligibility: true,
      rewardUpdates: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      soundEnabled: true,
      reminderTime: "24" // hours before appointment
    },
    
    // Privacy Settings
    privacy: {
      profileVisibility: "public", // public, private, donors-only
      showDonationHistory: true,
      showRewardPoints: false,
      allowContactFromHospitals: true,
      shareAnonymousData: true
    },
    
    // Account Settings
    account: {
      theme: "light", // light, dark, system
      language: "en",
      autoLogout: "30", // minutes
      twoFactorEnabled: false,
      emailUpdates: true
    },
    
    // Donation Preferences
    donation: {
      preferredDonationCenters: [],
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      preferredTimeSlots: ["morning", "afternoon"],
      emergencyDonations: true,
      travelDistance: "10" // km
    }
  })

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth('/user/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings
          }))
        }
      }
    } catch (error) {
      // Error handled by UI state
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      const response = await fetchWithAuth('/user/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings })
      })
      
      if (response.ok) {
        setSaveMessage("Settings saved successfully!")
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        setSaveMessage("Failed to save settings. Please try again.")
        setTimeout(() => setSaveMessage(""), 3000)
      }
    } catch (error) {
      setSaveMessage("Failed to save settings. Please try again.")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const toggleSetting = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }))
  }

  const tabs = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "account", label: "Account", icon: User },
    { id: "donation", label: "Donation Preferences", icon: Heart }
  ]

  const renderNotificationSettings = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-600 flex-shrink-0" />
          <span className="break-words">Notification Preferences</span>
        </h3>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Appointment Reminders */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-medium text-gray-900 break-words">Appointment Reminders</label>
              <p className="text-xs sm:text-sm text-gray-500 break-words">Get notified about upcoming donation appointments</p>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'appointmentReminders')}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                settings.notifications.appointmentReminders ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.appointmentReminders ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Reminder Time */}
          {settings.notifications.appointmentReminders && (
            <div className="ml-0 sm:ml-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Remind me
              </label>
              <select
                value={settings.notifications.reminderTime}
                onChange={(e) => updateSetting('notifications', 'reminderTime', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="1">1 hour before</option>
                <option value="6">6 hours before</option>
                <option value="24">24 hours before</option>
                <option value="48">2 days before</option>
              </select>
            </div>
          )}

          {/* Donation Eligibility */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-medium text-gray-900 break-words">Donation Eligibility</label>
              <p className="text-xs sm:text-sm text-gray-500 break-words">Notifications when you're eligible to donate again</p>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'donationEligibility')}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                settings.notifications.donationEligibility ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.donationEligibility ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Reward Updates */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-medium text-gray-900 break-words">Reward Points Updates</label>
              <p className="text-xs sm:text-sm text-gray-500 break-words">Get notified about reward points and achievements</p>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'rewardUpdates')}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                settings.notifications.rewardUpdates ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.rewardUpdates ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-600 flex-shrink-0" />
          <span className="break-words">Notification Channels</span>
        </h3>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Email Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-start sm:items-center min-w-0 flex-1">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0 mt-1 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-900 break-words">Email Notifications</label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Receive notifications via email</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'emailNotifications')}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 self-start sm:self-center ${
                settings.notifications.emailNotifications ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.emailNotifications ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* SMS Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-start sm:items-center min-w-0 flex-1">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0 mt-1 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-900 break-words">SMS Notifications</label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Receive notifications via text message</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'smsNotifications')}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 self-start sm:self-center ${
                settings.notifications.smsNotifications ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.smsNotifications ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-start sm:items-center min-w-0 flex-1">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0 mt-1 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-900 break-words">Push Notifications</label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Receive browser push notifications</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'pushNotifications')}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 self-start sm:self-center ${
                settings.notifications.pushNotifications ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.pushNotifications ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Sound */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-start sm:items-center min-w-0 flex-1">
              {settings.notifications.soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0 mt-1 sm:mt-0" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-400 flex-shrink-0 mt-1 sm:mt-0" />
              )}
              <div className="min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-900 break-words">Notification Sounds</label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Play sound with notifications</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'soundEnabled')}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 self-start sm:self-center ${
                settings.notifications.soundEnabled ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications.soundEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-red-600" />
          Privacy Controls
        </h3>
        
        <div className="space-y-4">
          {/* Profile Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Profile Visibility</label>
            <p className="text-sm text-gray-500 mb-3">Control who can see your profile information</p>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="public">Public - Anyone can see my profile</option>
              <option value="donors-only">Donors Only - Only other donors can see my profile</option>
              <option value="private">Private - Only I can see my profile</option>
            </select>
          </div>

          {/* Show Donation History */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Show Donation History</label>
              <p className="text-sm text-gray-500">Allow others to see your donation history</p>
            </div>
            <button
              onClick={() => toggleSetting('privacy', 'showDonationHistory')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.showDonationHistory ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.showDonationHistory ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Show Reward Points */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Show Reward Points</label>
              <p className="text-sm text-gray-500">Display your reward points on your profile</p>
            </div>
            <button
              onClick={() => toggleSetting('privacy', 'showRewardPoints')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.showRewardPoints ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.showRewardPoints ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Allow Contact from Hospitals */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Allow Hospital Contact</label>
              <p className="text-sm text-gray-500">Let hospitals contact you for urgent blood needs</p>
            </div>
            <button
              onClick={() => toggleSetting('privacy', 'allowContactFromHospitals')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.allowContactFromHospitals ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.allowContactFromHospitals ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Share Anonymous Data */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Share Anonymous Data</label>
              <p className="text-sm text-gray-500">Help improve blood donation services with anonymous usage data</p>
            </div>
            <button
              onClick={() => toggleSetting('privacy', 'shareAnonymousData')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.shareAnonymousData ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.shareAnonymousData ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-red-600" />
          Account Preferences
        </h3>
        
        <div className="space-y-4">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Theme</label>
            <p className="text-sm text-gray-500 mb-3">Choose your preferred theme</p>
            <div className="flex space-x-3">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateSetting('account', 'theme', value)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    settings.account.theme === value
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Logout */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Auto Logout</label>
            <p className="text-sm text-gray-500 mb-3">Automatically log out after inactivity</p>
            <select
              value={settings.account.autoLogout}
              onChange={(e) => updateSetting('account', 'autoLogout', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="0">Never</option>
            </select>
          </div>

          {/* Two Factor Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Two-Factor Authentication</label>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={() => toggleSetting('account', 'twoFactorEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.account.twoFactorEnabled ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.account.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Email Updates */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email Updates</label>
              <p className="text-sm text-gray-500">Receive important account updates via email</p>
            </div>
            <button
              onClick={() => toggleSetting('account', 'emailUpdates')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.account.emailUpdates ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.account.emailUpdates ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-red-200">
        <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
          <Trash2 className="w-5 h-5 mr-2" />
          Danger Zone
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-600">Permanently delete your account and all associated data</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // Handle account deletion
                  // Account deletion logic would go here
                }
              }}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDonationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-red-600" />
          Donation Preferences
        </h3>
        
        <div className="space-y-4">
          {/* Available Days */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Available Days</label>
            <p className="text-sm text-gray-500 mb-3">Select the days you're typically available to donate</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "monday", label: "Mon" },
                { value: "tuesday", label: "Tue" },
                { value: "wednesday", label: "Wed" },
                { value: "thursday", label: "Thu" },
                { value: "friday", label: "Fri" },
                { value: "saturday", label: "Sat" },
                { value: "sunday", label: "Sun" }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    const currentDays = settings.donation.availableDays
                    const newDays = currentDays.includes(value)
                      ? currentDays.filter(day => day !== value)
                      : [...currentDays, value]
                    updateSetting('donation', 'availableDays', newDays)
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    settings.donation.availableDays.includes(value)
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Time Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Preferred Time Slots</label>
            <p className="text-sm text-gray-500 mb-3">When do you prefer to donate?</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "morning", label: "Morning (8AM - 12PM)" },
                { value: "afternoon", label: "Afternoon (12PM - 5PM)" },
                { value: "evening", label: "Evening (5PM - 8PM)" }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    const currentSlots = settings.donation.preferredTimeSlots
                    const newSlots = currentSlots.includes(value)
                      ? currentSlots.filter(slot => slot !== value)
                      : [...currentSlots, value]
                    updateSetting('donation', 'preferredTimeSlots', newSlots)
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    settings.donation.preferredTimeSlots.includes(value)
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Maximum Travel Distance</label>
            <p className="text-sm text-gray-500 mb-3">How far are you willing to travel for donations?</p>
            <select
              value={settings.donation.travelDistance}
              onChange={(e) => updateSetting('donation', 'travelDistance', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
              <option value="unlimited">No limit</option>
            </select>
          </div>

          {/* Emergency Donations */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Emergency Donations</label>
              <p className="text-sm text-gray-500">Allow hospitals to contact you for emergency blood needs</p>
            </div>
            <button
              onClick={() => toggleSetting('donation', 'emergencyDonations')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.donation.emergencyDonations ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.donation.emergencyDonations ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "notifications":
        return renderNotificationSettings()
      case "privacy":
        return renderPrivacySettings()
      case "account":
        return renderAccountSettings()
      case "donation":
        return renderDonationSettings()
      default:
        return renderNotificationSettings()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => navigate(-1)}
                className="mr-3 sm:mr-4 p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center">
                  <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
                  <span className="truncate">Settings</span>
                </h1>
                <p className="text-red-100 mt-1 text-sm sm:text-base truncate">Customize your donation experience</p>
              </div>
            </div>
            
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-lg backdrop-blur-sm shadow-md transition-all flex items-center disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start flex-shrink-0"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
                  <span className="truncate">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4`}>
          <div className={`p-3 sm:p-4 rounded-lg flex items-start gap-2 ${
            saveMessage.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {saveMessage.includes('successfully') ? (
              <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm sm:text-base break-words">{saveMessage}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              {/* Mobile: Horizontal scroll tabs */}
              <nav className="lg:space-y-2">
                <div className="lg:hidden">
                  <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                            activeTab === tab.id
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <Icon className="w-3 h-3 mr-1.5" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                {/* Desktop: Vertical tabs */}
                <div className="hidden lg:block space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                        <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                        <span className="truncate">{tab.label}</span>
                    </button>
                  )
                })}
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorSettings
