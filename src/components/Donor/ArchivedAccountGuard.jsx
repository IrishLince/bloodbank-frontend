import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchWithAuth } from "../../utils/api"

const ArchivedAccountGuard = ({ children }) => {
  const [accountStatus, setAccountStatus] = useState(null)
  const [userId, setUserId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAccountStatus()
  }, [])

  const checkAccountStatus = async () => {
    try {
      const response = await fetchWithAuth('/auth/me')
      if (response.ok) {
        const data = await response.json()
        setAccountStatus(data.accountStatus || "ACTIVE")
        setUserId(data.id)
      }
    } catch (error) {
      console.error('Error checking account status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivate = async () => {
    try {
      const response = await fetchWithAuth(`/user/${userId}/activate`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        alert('Your account has been activated successfully!')
        setAccountStatus("ACTIVE")
      } else {
        const error = await response.json()
        alert('Failed to activate account: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error activating account:', error)
      alert('Failed to activate account. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (accountStatus === "ARCHIVED") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Archived</h2>
            <p className="text-gray-600 mb-6">
              Your account is currently archived. All features are disabled until you reactivate your account.
            </p>
            <button
              onClick={handleActivate}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg py-3 px-6 font-semibold hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Activate My Account
            </button>
            <button
              onClick={handleLogout}
              className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ArchivedAccountGuard
