// components/EventIllustrationUpload.js
// Event illustration/image upload component for header card

'use client'

import { useState, useRef } from 'react'
import { uploadEventImageAction } from '@/app/actions/events'
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function EventIllustrationUpload({ value, onChange, userId }) {
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

    // Validate userId
    if (!userId) {
      setUploadError('User ID is required. Please refresh the page and try again.')
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

      // Upload file using Server Action
      const formData = new FormData()
      formData.append('file', file)

      let result
      try {
        result = await uploadEventImageAction(formData, userId)
      } catch (fetchError) {
        console.error('EventIllustrationUpload: Server action call failed:', fetchError)
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
        console.error('EventIllustrationUpload: Server action returned no result')
        setUploadError('Server did not respond. Please try again.')
        setPreview(null)
        setUploading(false)
        return
      }

      if (result.error) {
        console.error('EventIllustrationUpload: Upload error:', result.error)
        setUploadError(result.error.message || 'Failed to upload image')
        setPreview(null)
        setUploading(false)
        return
      }

      // Success - update parent with image URL
      if (result.data?.url) {
        console.log('EventIllustrationUpload: Upload successful, URL:', result.data.url)
        onChange(result.data.url)
      } else {
        console.error('EventIllustrationUpload: Upload succeeded but no URL in result:', result)
        setUploadError('Upload succeeded but no URL was returned')
        setPreview(null)
      }
    } catch (err) {
      console.error('EventIllustrationUpload: Unexpected error:', err)
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

  // Handle remove image
  const handleRemove = (e) => {
    e.stopPropagation()
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        // Show preview with overlay upload button
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Event illustration"
            className="w-full h-full object-cover"
          />
          {!uploading && (
            <button
              type="button"
              onClick={handleClick}
              className="absolute bottom-3 right-3 bg-white rounded-lg p-2 shadow-md hover:bg-gray-light transition-colors"
              aria-label="Change image"
            >
              <PhotoIcon className="w-5 h-5 text-neutral-black" />
            </button>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-3 right-3 bg-error text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#DC2626] transition-colors"
              aria-label="Remove image"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        // Show upload prompt
        <div
          onClick={handleClick}
          className={`
            relative w-full h-48 rounded-lg border-2 border-dashed cursor-pointer
            transition-all flex items-center justify-center
            ${uploadError
              ? 'border-error bg-red-50'
              : 'border-gray-light hover:bg-gray-light'
            }
            ${uploading ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          {uploading ? (
            <div className="space-y-2 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-ui border-t-transparent mx-auto"></div>
              <p className="text-bodySmall text-gray-medium">Uploading...</p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <PhotoIcon className="w-8 h-8 text-gray-medium" />
                </div>
                <div className="ml-2 bg-primary-ui rounded-full p-1.5">
                  <PlusIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-bodySmall font-semibold text-neutral-black">Add Event Photo</p>
              <p className="text-caption text-gray-medium">JPEG, PNG, or WebP (max 5MB)</p>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <p className="text-bodySmall text-error mt-2 text-center">{uploadError}</p>
      )}
    </div>
  )
}

