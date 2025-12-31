// components/FraternityForm.js
// Form for creating a new fraternity
// Props:
//   - schoolId: School ID (required)
//   - userId: User ID (required)
//   - onSubmit: Function(fraternityData) called on submit
//   - onCancel: Function() called on cancel
//   - loading: Boolean for loading state
//   - error: Error message string

'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PhotoUpload from '@/components/PhotoUpload'
import Card from '@/components/ui/Card'

export default function FraternityForm({ 
  schoolId,
  userId,
  onSubmit,
  onCancel,
  loading = false,
  error = null
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState('Fraternity')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [photo_url, setPhoto_url] = useState(null)
  const [description, setDescription] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [pendingSubmit, setPendingSubmit] = useState(false)
  
  // Debug: Log when photo state changes
  useEffect(() => {
    if (photo_url) {
      console.log('FraternityForm: Photo URL state updated to:', photo_url)
    }
  }, [photo_url])

  // Reset pendingSubmit when parent loading state changes to false
  // This ensures the form is enabled again after an error
  useEffect(() => {
    if (!loading && pendingSubmit) {
      setPendingSubmit(false)
    }
  }, [loading, pendingSubmit])

  const validate = () => {
    const errors = {}

    // Name validation
    if (!name.trim()) {
      errors.name = 'Name is required'
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters'
    }

    // Type validation - ensure type is set and valid
    if (!type || typeof type !== 'string' || !['Fraternity', 'Sorority', 'Other'].includes(type.trim())) {
      errors.type = 'Please select a type (Fraternity, Sorority, or Other)'
    }

    // Verification email validation (optional, but must be valid if provided)
    if (verificationEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationEmail.trim())) {
      errors.verificationEmail = 'Please enter a valid email address'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Duplicate detection is handled by backend - it will block creation if duplicate found
    
    // Ensure type is set before submitting
    // Double-check by reading from form element as fallback in case state is out of sync
    const form = e.currentTarget
    const checkedRadio = form.querySelector('input[name="type"]:checked')
    const formType = checkedRadio?.value || type
    
    if (!formType || typeof formType !== 'string' || !['Fraternity', 'Sorority', 'Other'].includes(formType.trim())) {
      setValidationErrors({ ...validationErrors, type: 'Please select a type (Fraternity, Sorority, or Other)' })
      setPendingSubmit(false)
      return
    }

    const fraternityData = {
      name: name.trim(),
      type: formType.trim(), // Use form value as source of truth
      school_id: schoolId,
      verification_email: verificationEmail.trim() || null,
      photo_url: photo_url || null,
      description: description.trim() || null,
    }

    // Debug logging (remove in production)
    console.log('FraternityForm submitting:', { 
      ...fraternityData, 
      photo_url: photo_url ? (photo_url.substring(0, 50) + '...') : null, 
      type: formType,
      photo_url_length: photo_url ? photo_url.length : 0
    })

    setPendingSubmit(true)
    try {
      await onSubmit(fraternityData)
      // If onSubmit completes without error, reset pending state
      // (Note: onSubmit may still show errors via the error prop from parent)
      setPendingSubmit(false)
    } catch (err) {
      // Error handling is done by parent component
      setPendingSubmit(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
            Fraternity Name <span className="text-error">*</span>
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (validationErrors.name) {
                setValidationErrors({ ...validationErrors, name: null })
              }
            }}
            placeholder="Alpha Phi"
            error={validationErrors.name}
            maxLength={100}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
            Type <span className="text-error">*</span>
          </label>
          <div className="space-y-2">
            {['Fraternity', 'Sorority', 'Other'].map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 p-3 border border-gray-border rounded-md cursor-pointer hover:bg-gray-light transition-colors"
              >
                <input
                  type="radio"
                  name="type"
                  value={option}
                  checked={type === option}
                  onChange={(e) => {
                    setType(e.target.value)
                    if (validationErrors.type) {
                      setValidationErrors({ ...validationErrors, type: null })
                    }
                  }}
                  className="w-4 h-4 text-primary-ui focus:ring-primary-ui"
                />
                <span className="text-bodySmall text-neutral-black">{option}</span>
              </label>
            ))}
          </div>
          {validationErrors.type && (
            <p className="text-bodySmall text-error mt-1">{validationErrors.type}</p>
          )}
        </div>

        {/* Verification Email (Optional) */}
        <div>
          <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
            Fraternity Contact Email <span className="text-gray-medium">(Optional)</span>
          </label>
          <Input
            type="email"
            value={verificationEmail}
            onChange={(e) => {
              setVerificationEmail(e.target.value)
              if (validationErrors.verificationEmail) {
                setValidationErrors({ ...validationErrors, verificationEmail: null })
              }
            }}
            placeholder="president@alphaphi.org (optional)"
            error={validationErrors.verificationEmail}
          />
          <p className="text-caption text-gray-medium mt-1">
            If your fraternity has an official email, we can verify it for faster verification. Otherwise, you'll be verified once you have 7+ verified members.
          </p>
        </div>

        {/* Photo (Optional) */}
        <div>
          <PhotoUpload
            value={photo_url}
            onChange={(url) => setPhoto_url(url)}
            userId={userId}
            uploadType="fraternity"
            required={false}
          />
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
            Description <span className="text-gray-medium">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your fraternity..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-border rounded-md text-bodySmall text-neutral-black placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-primary-ui focus:border-transparent resize-none"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading || pendingSubmit}
            variant="secondary"
            size="large"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || pendingSubmit}
            variant="primary"
            size="large"
            className="flex-1"
          >
            {loading || pendingSubmit ? 'Creating...' : 'Create Fraternity'}
          </Button>
        </div>
      </form>
    </>
  )
}

