// components/PhotoUpload.js
// Photo upload component with preview and validation
// Props:
//   - value: string (current photo URL)
//   - onChange: function (called with file or URL)
//   - required: boolean (default: false)
//   - error: string (error message to display)

'use client'

import { useState, useRef } from 'react'
import { mockUploadProfilePhoto } from '@/lib/mocks/userFunctions'

export default function PhotoUpload({ value, onChange, required = false, error }) {
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

    setUploadError(null)
    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Upload file (using mock for now)
      const result = await mockUploadProfilePhoto(file)
      onChange(result.url)
    } catch (err) {
      setUploadError(err.message || 'Failed to upload photo')
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
      <label className="block text-sm font-semibold mb-2">
        Profile Photo {required && <span className="text-red-500">*</span>}
      </label>

      {/* Upload area */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-all
          ${hasError 
            ? 'border-red-500 bg-red-50' 
            : 'border-black hover:bg-gray-50'
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
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
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
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400"
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
                <p className="text-sm font-semibold">Click to upload photo</p>
                <p className="text-xs text-gray-500">JPEG, PNG, or WebP (max 5MB)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  )
}

