// Profile image utility functions
import { fetchWithAuth } from './api'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api'

/**
 * Get the full URL for a profile image
 * @param {string} profilePhotoUrl - The relative URL from the backend
 * @returns {string} - Full URL for the image
 */
export const getProfileImageUrl = (profilePhotoUrl) => {
  if (!profilePhotoUrl) return null
  
  // If it's already a full URL, return as is
  if (profilePhotoUrl.startsWith('http')) {
    return profilePhotoUrl
  }
  
  // If it starts with /uploads/, construct the full URL
  if (profilePhotoUrl.startsWith('/uploads/')) {
    return `http://localhost:8080${profilePhotoUrl}`
  }
  
  // Otherwise, assume it's a relative path and construct the URL
  return `http://localhost:8080/uploads/${profilePhotoUrl}`
}

/**
 * Fetch user profile photo URL
 * @param {string} userId - The user ID
 * @returns {Promise<string|null>} - Promise that resolves to the photo URL or null
 */
export const fetchUserProfilePhoto = async (userId) => {
  try {
    const response = await fetchWithAuth(`/user/${userId}/photo`)
    if (response.ok) {
      const data = await response.json()
      return data?.data?.profilePhotoUrl || null
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * Upload a new profile photo
 * @param {string} userId - The user ID
 * @param {File} photoFile - The photo file to upload
 * @returns {Promise<{success: boolean, photoUrl?: string, error?: string}>}
 */
export const uploadProfilePhoto = async (userId, photoFile) => {
  try {
    const formData = new FormData()
    formData.append('photo', photoFile)

    const response = await fetchWithAuth(`/user/${userId}/upload-photo`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, let the browser set it for FormData
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        photoUrl: data?.data?.profilePhotoUrl || null,
        user: data?.data?.user || null
      }
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      return {
        success: false,
        error: errorData?.message || 'Failed to upload photo'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to upload photo: ' + error.message
    }
  }
}

/**
 * Get initials from a name for fallback avatar
 * @param {string} name - The user's name
 * @returns {string} - Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return 'U'
  
  const words = name.trim().split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

/**
 * Generate a consistent color for the user based on their name
 * @param {string} name - The user's name
 * @returns {string} - CSS gradient class
 */
export const getAvatarColor = (name) => {
  if (!name) return 'from-gray-400 to-gray-500'
  
  const colors = [
    'from-red-400 to-red-500',
    'from-blue-400 to-blue-500',
    'from-green-400 to-green-500',
    'from-purple-400 to-purple-500',
    'from-pink-400 to-pink-500',
    'from-indigo-400 to-indigo-500',
    'from-yellow-400 to-yellow-500',
    'from-teal-400 to-teal-500'
  ]
  
  // Use the first character's char code to determine color
  const charCode = name.charAt(0).toUpperCase().charCodeAt(0)
  return colors[charCode % colors.length]
}
