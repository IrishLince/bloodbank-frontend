import React, { useState, useEffect } from 'react'
import { UserCircle2, Camera, Upload } from 'lucide-react'
import { getProfileImageUrl, getInitials, getAvatarColor } from '../utils/profileImage'

const ProfileAvatar = ({ 
  user, 
  size = 'md', 
  editable = false, 
  onImageChange = null,
  showUploadIcon = false,
  className = ''
}) => {
  const [imageUrl, setImageUrl] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Size configurations - removed size classes to let parent container control sizing
  const sizes = {
    xs: 'w-full h-full',
    sm: 'w-full h-full', 
    md: 'w-full h-full',
    lg: 'w-full h-full',
    xl: 'w-full h-full',
    '2xl': 'w-full h-full',
    '3xl': 'w-full h-full'
  }

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    '2xl': 'w-12 h-12',
    '3xl': 'w-14 h-14'
  }

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  }

  useEffect(() => {
    if (user?.profilePhotoUrl) {
      const fullUrl = getProfileImageUrl(user.profilePhotoUrl)
      setImageUrl(fullUrl)
      setImageError(false)
    } else {
      setImageUrl(null)
      setImageError(false)
    }
  }, [user?.profilePhotoUrl])

  const handleImageError = () => {
    setImageError(true)
    setImageUrl(null)
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !onImageChange) return

    setIsLoading(true)
    try {
      await onImageChange(file)
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsLoading(false)
    }
  }

  const renderImage = () => {
    if (imageUrl && !imageError) {
      return (
        <img
          src={imageUrl}
          alt={`${user?.name || 'User'}'s profile`}
          className="w-full h-full object-cover object-center"
          onError={handleImageError}
          onLoad={() => setImageError(false)}
        />
      )
    }

    // Fallback to initials or default icon
    if (user?.name) {
      const initials = getInitials(user.name)
      const colorClass = getAvatarColor(user.name)
      
      return (
        <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
          <span className={`font-semibold text-white ${textSizes[size]}`}>
            {initials}
          </span>
        </div>
      )
    }

    // Default icon fallback
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
        <UserCircle2 className={`text-white ${iconSizes[size]}`} />
      </div>
    )
  }

  const avatarContent = (
    <div className={`${sizes[size]} rounded-full overflow-hidden ${className} ${editable ? 'cursor-pointer' : ''} ${isLoading ? 'opacity-50' : ''} relative`}>
      <div className="w-full h-full">
        {renderImage()}
      </div>
      
      {/* Upload overlay for editable avatars */}
      {editable && showUploadIcon && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
          <Camera className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )

  if (editable) {
    return (
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          id="profile-photo-upload"
          disabled={isLoading}
        />
        <label htmlFor="profile-photo-upload" className="cursor-pointer">
          {avatarContent}
        </label>
        
        {showUploadIcon && (
          <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1.5 border-2 border-white shadow-lg">
            <Upload className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    )
  }

  return avatarContent
}

export default ProfileAvatar
