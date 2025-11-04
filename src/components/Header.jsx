import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Menu, X, UserCircle2, Settings, LogOut, User, Mail, Home, Calendar, Info, List, Star, FileText, Package, Building2, ClipboardList } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import logo from "../assets/Logo.png"
import RefreshLink from "./RefreshLink"
import { navigateWithRefresh } from "../utils/navigation"
import ProfileAvatar from "./ProfileAvatar"
import { fetchWithAuth } from "../utils/api"

// Constants

const HIDDEN_HEADER_PATHS = ["/login", "/signup", "/forgot-password"]

const STORAGE_KEYS = {
  TOKEN: "userToken",
  NAME: "userName",
  EMAIL: "email",
  ROLE: "userRole",
  USER_ID: "userId",
  REFRESH_TOKEN: "refreshToken",
  USER_DATA: "userData"
}

// Enhanced custom hook for authentication state with better error handling
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [userData, setUserData] = useState({
    id: "",
    name: "User",
    email: "",
    token: "",
    role: "",
    profilePhotoUrl: ""
  })
  const [isLoading, setIsLoading] = useState(true)

  const updateUserData = useCallback(() => {
    try {
      setIsLoading(true)
      let userData = {}
      
      // Try to get complete userData object first
      try {
        const userDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA)
        if (userDataStr && userDataStr !== 'undefined') {
          userData = JSON.parse(userDataStr)
        }
      } catch (e) {
        // Silently handle parsing error
      }
      
      // Fallback to individual items for backward compatibility
      if (!userData || Object.keys(userData).length === 0) {
        userData = {
          token: localStorage.getItem(STORAGE_KEYS.TOKEN),
          refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          id: localStorage.getItem(STORAGE_KEYS.USER_ID),
          email: localStorage.getItem(STORAGE_KEYS.EMAIL),
          name: localStorage.getItem(STORAGE_KEYS.NAME),
          role: localStorage.getItem(STORAGE_KEYS.ROLE)
        }
      }

      // Check if user is a hospital and get hospital-specific data
      const role = userData?.role || ''
      if (role === 'HOSPITAL' || role === 'ROLE_HOSPITAL') {
        try {
          const hospitalDataStr = localStorage.getItem('hospitalData')
          if (hospitalDataStr && hospitalDataStr !== 'undefined') {
            const hospitalData = JSON.parse(hospitalDataStr)
            // Use hospital-specific data for display
            userData = {
              ...userData,
              id: hospitalData.id || userData.id,
              name: hospitalData.hospitalName || hospitalData.name || userData.name,
              email: hospitalData.email || userData.email,
              profilePhotoUrl: hospitalData.profilePhotoUrl || userData.profilePhotoUrl
            }
          }
        } catch (e) {
          // Silently handle parsing error, fall back to regular userData
        }
      }
      
      // Determine display name priority: userData.name > email prefix > 'User'
      const displayName = userData?.name || 
                          (userData?.email ? userData.email.split('@')[0] : '') || 
                          'User'
      
      const newUserData = {
        id: userData?.id || '',
        name: displayName,
        email: userData?.email || '',
        token: userData?.token || '',
        role: role,
        profilePhotoUrl: userData?.profilePhotoUrl || ''
      }
      
      const isAuth = !!userData?.token
      
      // Only update if values actually changed to prevent unnecessary re-renders
      setUserData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newUserData)) {
          return newUserData
        }
        return prev
      })
      
      setIsAuthenticated(prev => prev !== isAuth ? isAuth : prev)
      setUserRole(prev => prev !== role ? role : prev)
      
    } catch (error) {
      // Reset to defaults on error
      setUserData({ name: "User", email: "", token: "", role: "" })
      setIsAuthenticated(false)
      setUserRole("")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch complete user profile data (skip for hospitals as they use different endpoints)
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return
    
    // Skip fetching for hospitals as they use hospital-specific endpoints
    const currentRole = localStorage.getItem(STORAGE_KEYS.ROLE)
    if (currentRole === 'HOSPITAL' || currentRole === 'ROLE_HOSPITAL') {
      return
    }

    try {
      const response = await fetchWithAuth(`/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        const user = data?.data
        
        if (user) {
          // Update localStorage with complete user data
          const completeUserData = {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            profilePhotoUrl: user.profilePhotoUrl,
            contactInformation: user.contactInformation,
            bloodType: user.bloodType,
            address: user.address,
            age: user.age,
            sex: user.sex,
            token: userData.token,
            refreshToken: userData.refreshToken
          }
          
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(completeUserData))
          
          // Update state
          setUserData(prev => ({
            ...prev,
            id: user.id,
            name: user.name,
            email: user.email,
            profilePhotoUrl: user.profilePhotoUrl
          }))
        }
      }
    } catch (error) {
      // Error is handled by the UI state
    }
  }, [userData.token, userData.refreshToken])

  useEffect(() => {
    updateUserData()
    
    // Fetch complete profile data if user is authenticated
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID)
    if (userId && userData.token) {
      fetchUserProfile(userId)
    }
    
    const handleStorageChange = (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key) || e.key === 'hospitalData') {
        updateUserData()
        // Also fetch profile data if user ID changed (but not for hospitals)
        if (e.key === STORAGE_KEYS.USER_ID && e.newValue && userRole !== 'HOSPITAL' && userRole !== 'ROLE_HOSPITAL') {
          fetchUserProfile(e.newValue)
        }
      }
    }
    
    const handleUserDataUpdated = () => {
      updateUserData()
    }

    const handleHospitalDataUpdated = () => {
      updateUserData()
    }
    
    // Reduced frequency to prevent excessive checks
    const authCheckInterval = setInterval(() => {
      const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const currentRole = localStorage.getItem(STORAGE_KEYS.ROLE)
      
      if ((!!currentToken !== isAuthenticated) || (currentRole !== userRole)) {
        updateUserData()
      }
    }, 3000) // Increased from 2000ms to 3000ms
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userDataUpdated', handleUserDataUpdated)
    window.addEventListener('hospitalDataUpdated', handleHospitalDataUpdated)
    window.addEventListener('profilePhotoUpdated', handleUserDataUpdated)
    window.addEventListener('popstate', updateUserData)
    
    return () => {
      clearInterval(authCheckInterval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userDataUpdated', handleUserDataUpdated)
      window.removeEventListener('hospitalDataUpdated', handleHospitalDataUpdated)
      window.removeEventListener('profilePhotoUpdated', handleUserDataUpdated)
      window.removeEventListener('popstate', updateUserData)
    }
  }, [updateUserData, isAuthenticated, userRole])

  const logout = useCallback(() => {
    try {
      // Clear all authentication data
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear hospital-specific data
      localStorage.removeItem('hospitalData')
      
      setIsAuthenticated(false)
      setUserRole("")
      setUserData({ name: "User", email: "", token: "", role: "" })
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('userDataUpdated'))
      
      navigateWithRefresh("/")
    } catch (error) {
      // Error is handled by the UI state
    }
  }, [])

  return {
    isAuthenticated,
    userRole,
    userData,
    logout,
    isLoading
  }
}

// Optimized scroll visibility hook with throttling
const useScrollVisibility = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollPos, setLastScrollPos] = useState(0)

  useEffect(() => {
    let ticking = false
    let timeoutId = null
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollPos = window.scrollY
          const isScrollingUp = currentScrollPos < lastScrollPos
          const isAtTop = currentScrollPos <= 10
          const scrolledSignificantly = Math.abs(currentScrollPos - lastScrollPos) > 5
          
          // Only update if scroll amount is significant to reduce glitches
          if (scrolledSignificantly) {
            setIsVisible(isScrollingUp || isAtTop)
            setLastScrollPos(currentScrollPos)
          }
          
          ticking = false
        })
        ticking = true
      }
      
      // Clear any existing timeout and set a new one
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsVisible(true)
      }, 150)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [lastScrollPos])

  return isVisible
}

// Enhanced ProfileDropdown Component with better event handling
const ProfileDropdown = ({ onLogout, userData, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = useCallback(() => setIsOpen(false), [])
  const handleToggle = useCallback(() => setIsOpen(prev => !prev), [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".profile-dropdown")) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
    document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative profile-dropdown z-40">
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-700 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors duration-200"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        disabled={isLoading}
      >
        <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 flex-shrink-0">
          <ProfileAvatar user={userData} size="sm" />
        </div>
      </button>

      <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
          >
           {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    <ProfileAvatar user={userData} size="md" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-sm text-gray-800 mb-1 font-medium">
                    <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="truncate">{userData.name}</span>
                  </div>
                  {userData.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{userData.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
          <div className="py-2">
            <RefreshLink
              to="/profile-page"
                onClick={handleClose}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
                <User className="w-4 h-4 text-gray-500" />
              <span>Profile Settings</span>
            </RefreshLink>

            <RefreshLink
              to="/settings"
                onClick={handleClose}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
                <Settings className="w-4 h-4 text-gray-500" />
              <span>Settings</span>
            </RefreshLink>

            <div className="border-t border-gray-200 my-2"></div>

            <button
                onClick={() => {
                  handleClose()
                  onLogout()
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

// Optimized animation variants
const headerVariants = {
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      opacity: { duration: 0.2 }
    }
  },
  hidden: {
    y: -100,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      opacity: { duration: 0.2 }
    }
  }
}

// Enhanced NavLink component with better performance
const NavLink = React.memo(({ to, children, isAuthenticated, isActive, icon, className = "" }) => {
  return (
    <RefreshLink
      to={to}
      className={`
        relative px-4 py-2 rounded-lg 
        flex items-center gap-2
        transition-all duration-200
        overflow-hidden
        group
        ${className}
        ${
          isActive
            ? "bg-white text-red-600 font-semibold shadow-sm"
            : "text-white hover:bg-white/10"
        }
      `}
    >
      <motion.span
        className={`
          flex items-center justify-center flex-shrink-0
          ${isActive ? 'text-red-600' : 'text-white'}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {icon}
      </motion.span>
      <span className="relative whitespace-nowrap">
        {children}
        {isActive && (
          <motion.div
            layoutId="navunderline"
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
      </span>
      <motion.div
        className="absolute inset-0 bg-white/5 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </RefreshLink>
  )
})

NavLink.displayName = 'NavLink'

// Helper function to normalize role names
const normalizeRole = (role) => {
  if (!role) return '';
  
  // Remove ROLE_ prefix if present
  const normalized = role.startsWith('ROLE_') ? role.substring(5) : role;
  return normalized.toUpperCase();
};

// Memoized navigation configurations to prevent unnecessary re-renders
const getNavigationConfig = (userRole, isAuthenticated) => {
  if (!isAuthenticated) {
    return {
      links: [
        { to: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
        { to: "/faqs", label: "FAQs", icon: <Info className="w-5 h-5" /> },
        { to: "/about-us", label: "About Us", icon: <Info className="w-5 h-5" /> }
      ],
      actions: [
        { to: "/signup", label: "Sign Up", className: "px-4 py-2 rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors duration-300 font-medium" },
        { to: "/login", label: "Log In", className: "px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors duration-300" }
      ]
    }
  }

  const baseLinks = [
    { to: "/", label: "Home", icon: <Home className="w-5 h-5" /> }
  ]

  // Normalize the role for comparison
  const normalizedRole = normalizeRole(userRole);
  
  switch (normalizedRole) {
    case 'BLOODBANK':
      return {
        links: [
          ...baseLinks,
          { to: "/hospital", label: "Hospital", icon: <Building2 className="w-5 h-5" /> },
          { to: "/list-of-donation", label: "List of Donation", icon: <List className="w-5 h-5" /> },
          { to: "/inventory", label: "Inventory", icon: <Package className="w-5 h-5" /> },
          { to: "/bloodbank/rewards", label: "Incentives", icon: <Star className="w-5 h-5" /> },
          { to: "/about-us", label: "About Us", icon: <Info className="w-5 h-5" /> }
        ]
      }
    
    case 'HOSPITAL':
      return {
        links: [
          ...baseLinks,
          { to: "/hospital", label: "Requests", icon: <FileText className="w-5 h-5" /> },
          { to: "/request-status", label: "Request Status", icon: <List className="w-5 h-5" /> },
          { to: "/delivery-status", label: "Delivery Status", icon: <Package className="w-5 h-5" /> },
          { to: "/hospital-rewards", label: "Rewards", icon: <Star className="w-5 h-5" /> },
          { to: "/about-us", label: "About Us", icon: <Info className="w-5 h-5" /> }
        ]
      }
    
    case 'ADMIN':
      return {
        links: [
          ...baseLinks,
          { to: "/admin/dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
          { to: "/admin/logging", label: "Logging", icon: <ClipboardList className="w-5 h-5" /> },
          { to: "/admin/rewards", label: "Manage Rewards", icon: <Star className="w-5 h-5" /> },
          { to: "/about-us", label: "About Us", icon: <Info className="w-5 h-5" /> }
        ]
      }
    
    default: // Donor
      return {
        links: [
          ...baseLinks,
          { to: "/donation-center", label: "Online Booking", icon: <Calendar className="w-5 h-5" /> },
          { to: "/list-of-appointments", label: "List of Appointments", icon: <List className="w-5 h-5" /> },
          { to: "/rewards", label: "Reward Points", icon: <Star className="w-5 h-5" /> },
          { to: "/about-us", label: "About Us", icon: <Info className="w-5 h-5" /> }
        ]
      }
  }
}

// Memoized Navigation Components
const NavigationLinks = React.memo(({ config, location, isAuthenticated }) => {
  return (
    <>
      {config.links?.map((link) => {
        const isActive = (link.to === "/" && (location.pathname === "/" || location.pathname === "/homepage")) || location.pathname === link.to;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            isAuthenticated={isAuthenticated}
            isActive={isActive}
            icon={link.icon}
          >
            {link.label}
          </NavLink>
        );
      })}
      
      {config.actions && (
        <div className="flex gap-2 ml-4">
          {config.actions.map((action) => (
            <RefreshLink
              key={action.to}
              to={action.to}
              className={action.className}
            >
              {action.label}
            </RefreshLink>
          ))}
        </div>
      )}
    </>
  )
})

NavigationLinks.displayName = 'NavigationLinks'

const MobileMenu = React.memo(({ isOpen, config, location, isAuthenticated, onLogout, userData }) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ 
        height: "auto", 
        opacity: 1,
        transition: {
          height: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }
      }}
      exit={{ 
        height: 0, 
        opacity: 0,
        transition: {
          height: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }
      }}
      className="md:hidden overflow-hidden bg-red-600/95 backdrop-blur-sm rounded-b-lg shadow-lg"
    >
      <nav className="flex flex-col space-y-1 px-2 pb-3 pt-2">
        {config.links?.map((link) => (
      <NavLink
            key={link.to}
            to={link.to}
        isAuthenticated={isAuthenticated}
            isActive={location.pathname === link.to}
            icon={link.icon}
            className="w-full justify-start"
      >
            {link.label}
      </NavLink>
        ))}
        
        {config.actions?.map((action) => (
          <RefreshLink
            key={action.to}
            to={action.to}
            className="px-4 py-2 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>{action.label}</span>
          </RefreshLink>
        ))}
        
        {isAuthenticated && (
          <div className="bg-red-50 rounded-lg shadow-lg border border-red-200 mx-3 mt-3 mb-2 overflow-hidden">
            {/* Bloodbank Profile Header */}
            <div className="px-4 py-4 text-center bg-red-50">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 bg-red-100 border-2 border-red-200">
                <ProfileAvatar user={userData} size="lg" />
              </div>
              <div className="text-base font-normal text-red-900 mb-1">
                Hi, {userData.name}!
              </div>
              <div className="text-sm text-red-700 mb-3">
                {userData.email}
              </div>
              <RefreshLink
                to="/profile-page"
                className="inline-block px-4 py-1.5 border border-red-300 rounded-full text-sm text-red-800 bg-white hover:bg-red-50 transition-colors"
              >
                Manage your Account
              </RefreshLink>
            </div>

            {/* Menu Items */}
            <div className="py-1 bg-red-50">
              <RefreshLink
                to="/settings"
                className="flex items-center px-4 py-2.5 text-red-800 hover:bg-red-100 transition-colors"
              >
                <Settings className="w-5 h-5 mr-3 text-red-600" />
                <span className="text-sm">Settings</span>
              </RefreshLink>

              <button
                onClick={onLogout}
                className="flex items-center w-full px-4 py-2.5 text-red-800 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-600" />
                <span className="text-sm">Sign out</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-red-100 border-t border-red-200">
              <div className="flex items-center justify-center space-x-2 text-xs text-red-600">
                <span>Privacy Policy</span>
                <span>•</span>
                <span>Terms of Service</span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </motion.div>
  )
})

MobileMenu.displayName = 'MobileMenu'

// Main Header Component with optimizations
const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false)
  
  // Use the custom hooks
  const { isAuthenticated, userRole, userData, logout, isLoading } = useAuth()
  const isVisible = useScrollVisibility()

  // Memoize navigation config to prevent unnecessary recalculations
  const navigationConfig = useMemo(() => 
    getNavigationConfig(userRole, isAuthenticated), 
    [userRole, isAuthenticated]
  )

  // Optimized handlers
  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
    setIsMobileProfileOpen(false) // Close profile when opening menu
  }, [])

  const handleMobileProfileToggle = useCallback(() => {
    setIsMobileProfileOpen(prev => !prev)
    setIsMobileMenuOpen(false) // Close menu when opening profile
  }, [])

  const handleLogout = useCallback(() => {
    setIsMobileMenuOpen(false)
    setIsMobileProfileOpen(false)
    logout()
  }, [logout])

  // Close mobile menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsMobileProfileOpen(false)
  }, [location.pathname])

  // Early return for hidden paths
  if (HIDDEN_HEADER_PATHS.includes(location.pathname)) {
    return null
  }

  // Show loading state briefly to prevent flashing
  if (isLoading) {
  return (
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-full items-center justify-between">
          <div className="flex-shrink-0">
              <RefreshLink to="/homepage">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
              </RefreshLink>
            </div>
            <div className="animate-pulse flex space-x-4">
              <div className="h-4 bg-white/20 rounded w-16"></div>
              <div className="h-4 bg-white/20 rounded w-16"></div>
              <div className="h-4 bg-white/20 rounded w-16"></div>
            </div>
          </div>
              </div>
      </header>
    )
  }

  return (
    <motion.header
      variants={headerVariants}
      initial="visible"
      animate={isVisible ? "visible" : "hidden"}
      className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg h-16 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <RefreshLink to="/">
              <img
                src={logo}
                alt="Logo"
                className="h-8 w-auto object-contain cursor-pointer hover:opacity-90 transition-all duration-300"
              />
            </RefreshLink>
          </motion.div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavigationLinks 
              config={navigationConfig} 
              location={location} 
              isAuthenticated={isAuthenticated} 
            />
          </nav>

          {/* Profile Dropdown */}
          {isAuthenticated && (
            <div className="hidden md:block">
              <ProfileDropdown 
                onLogout={handleLogout} 
                userData={userData} 
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Profile Avatar */}
            {isAuthenticated && (
              <motion.button
                onClick={handleMobileProfileToggle}
                className="rounded-full p-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                aria-label="Open profile menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 flex-shrink-0">
                  <div className="w-full h-full">
                    <ProfileAvatar user={userData} size="sm" />
                  </div>
                </div>
              </motion.button>
            )}
            
            {/* Mobile Menu Button */}
            <motion.button
              onClick={handleMobileMenuToggle}
              className="rounded-lg p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
          </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transition: {
                  height: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  height: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }
              }}
              className="md:hidden overflow-hidden bg-red-600/95 backdrop-blur-sm rounded-b-lg shadow-lg"
            >
              <nav className="flex flex-col px-3 py-2">
                {/* Navigation Links */}
                <div className="space-y-1 mb-3">
                  {navigationConfig.links?.map((link) => {
                    const isActive = (link.to === "/" && (location.pathname === "/" || location.pathname === "/homepage")) || location.pathname === link.to;
                    return (
                      <motion.div
                        key={link.to}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RefreshLink
                          to={link.to}
                          className={`w-full justify-start py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center space-x-2 group ${
                            isActive 
                              ? 'bg-white text-red-600 shadow-sm font-semibold' 
                              : 'text-white hover:bg-red-500/50 font-medium'
                          }`}
                        >
                          <span className="group-hover:scale-105 transition-transform duration-200">
                            {link.icon}
                          </span>
                          <span className="text-sm">{link.label}</span>
                        </RefreshLink>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Authentication Actions for non-authenticated users */}
                {!isAuthenticated && (
                  <div className="flex space-x-2">
                    {navigationConfig.actions?.map((action, index) => (
                      <motion.div
                        key={action.to}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1"
                      >
                        <RefreshLink
                          to={action.to}
                          className={`block w-full py-2 px-3 rounded-lg text-center font-medium text-sm transition-all duration-200 ${
                            index === 0 
                              ? 'bg-white text-red-600 hover:bg-red-50 shadow-sm' 
                              : 'bg-red-500/20 text-white border border-red-400/50 hover:bg-red-500/30'
                          }`}
                        >
                          {action.label}
                        </RefreshLink>
                      </motion.div>
                    ))}
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Profile Dropdown */}
        <AnimatePresence>
          {isMobileProfileOpen && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute right-4 top-16 z-50 md:hidden"
            >
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 overflow-hidden">
                {/* Profile Header */}
                <div className="px-4 py-4 text-center bg-white">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 bg-gray-100 border-2 border-gray-200">
                    <div className="w-full h-full">
                      <ProfileAvatar user={userData} size="xl" />
                    </div>
                  </div>
                  <div className="text-base font-normal text-gray-900 mb-1">
                    Hi, {userData.name}!
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    {userData.email}
                  </div>
                  <RefreshLink
                    to="/profile-page"
                    onClick={() => setIsMobileProfileOpen(false)}
                    className="inline-block px-4 py-1.5 border border-gray-300 rounded-full text-sm text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    Manage your Account
                  </RefreshLink>
                </div>

                {/* Menu Items */}
                <div className="py-1 bg-white">
                  <RefreshLink
                    to="/settings"
                    onClick={() => setIsMobileProfileOpen(false)}
                    className="flex items-center px-4 py-2.5 text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-5 h-5 mr-3 text-gray-600" />
                    <span className="text-sm">Settings</span>
                  </RefreshLink>

                  <button
                    onClick={() => {
                      setIsMobileProfileOpen(false)
                      handleLogout()
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3 text-gray-600" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
                    <span>Privacy Policy</span>
                    <span>•</span>
                    <span>Terms of Service</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

export default Header