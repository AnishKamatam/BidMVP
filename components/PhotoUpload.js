// components/PhotoUpload.js
// Photo upload component with preview and validation
// Props:
//   - value: string (current photo URL)
//   - onChange: function (called with file or URL)
//   - required: boolean (default: false)
//   - error: string (error message to display)
//   - userId: string (optional) - User ID for profile photo upload
//   - fraternityId: string (optional) - Fraternity ID for fraternity photo upload
//   - uploadType: 'profile' | 'fraternity' (default: 'profile')

'use client'

import { useState, useRef } from 'react'
import { uploadProfilePhoto } from '@/app/actions/profile'
import { uploadFraternityPhotoAction } from '@/app/actions/profile'

export default function PhotoUpload({ value, onChange, required = false, error, userId, fraternityId, uploadType = 'profile' }) {
  const [preview, setPreview] = useState(value || null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setUploadError('File size too large. Maximum size is 5MB.')
      return
    }

    // Validate required ID based on upload type
    if (uploadType === 'profile' && !userId) {
      setUploadError('User ID is required for profile photo upload. Please refresh the page and try again.')
      console.error('PhotoUpload: userId is missing for profile upload', { userId, uploadType })
      return
    }
    // For fraternity uploads: fraternityId is optional (for creation), but userId is required for temp path
    if (uploadType === 'fraternity' && !userId) {
      setUploadError('User ID is required for fraternity photo upload')
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Upload file using Server Action based on type
      const formData = new FormData()
      formData.append('file', file)
      
      let result
      try {
        result = uploadType === 'fraternity'
          ? await uploadFraternityPhotoAction(fraternityId || null, formData, userId)
          : await uploadProfilePhoto(userId, formData)
      } catch (fetchError) {
        // Handle fetch/network errors
        console.error('PhotoUpload: Server action call failed:', fetchError)
        setUploadError(
          fetchError.message || 
          'Network error: Could not connect to server. Please check your internet connection and try again.'
        )
        setPreview(null)
        setUploading(false)
        return
      }
      
      // Check if result is valid
      if (!result) {
        console.error('PhotoUpload: Server action returned no result')
        setUploadError('Server did not respond. Please try again.')
        setPreview(null)
        setUploading(false)
        return
      }
      
      if (result.error) {
        console.error('PhotoUpload: Upload error:', result.error)
        setUploadError(result.error.message || 'Failed to upload photo')
        setPreview(null)
        setUploading(false)
        return
      }

      // Success - update parent with photo URL
      if (result.data?.url) {
        console.log('PhotoUpload: Upload successful, URL:', result.data.url)
        onChange(result.data.url)
      } else {
        console.error('PhotoUpload: Upload succeeded but no URL in result:', result)
        setUploadError('Upload succeeded but no URL was returned')
        setPreview(null)
      }
    } catch (err) {
      console.error('PhotoUpload: Unexpected error:', err)
      setUploadError(err.message || 'An unexpected error occurred. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  // Handle click on upload area
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Handle remove photo
  const handleRemove = (e) => {
    e.stopPropagation()
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasError = error || uploadError
  const displayError = error || uploadError

  return (
    <div className="space-y-2">
      <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
        Profile Photo {required && <span className="text-error">*</span>}
      </label>

      {/* Upload area */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-all
          ${hasError 
            ? 'border-error bg-red-50' 
            : 'border-gray-light hover:bg-gray-light'
          }
          ${uploading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {preview ? (
          // Show preview
          <div className="relative">
            <img
              src={preview}
              alt="Profile preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-error text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#DC2626] transition-colors"
                aria-label="Remove photo"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          // Show upload prompt
          <div className="text-center">
            {uploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-accent border-t-transparent mx-auto"></div>
                <p className="text-bodySmall text-gray-medium">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="w-12 h-12 mx-auto text-gray-medium"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-bodySmall font-semibold text-neutral-black">Click to upload photo</p>
                <p className="text-caption text-gray-medium">JPEG, PNG, or WebP (max 5MB)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-bodySmall text-error">{displayError}</p>
      )}
    </div>
  )
}

