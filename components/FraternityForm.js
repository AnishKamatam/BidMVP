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

import { useState } from 'react'
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
  const [photo, setPhoto] = useState(null)
  const [description, setDescription] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

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

    // Type validation
    if (!type || !['Fraternity', 'Sorority', 'Other'].includes(type)) {
      errors.type = 'Type is required'
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

    // Check for duplicate name (this would be handled by backend, but we can show warning)
    // For now, we'll submit and let backend handle duplicate detection
    // If backend returns duplicate error, we can show the warning modal
    
    const fraternityData = {
      name: name.trim(),
      type,
      school_id: schoolId,
      verification_email: verificationEmail.trim() || null,
      photo: photo || null,
      description: description.trim() || null,
    }

    setPendingSubmit(true)
    try {
      await onSubmit(fraternityData)
    } catch (err) {
      // If duplicate error, show warning
      if (err.message?.toLowerCase().includes('duplicate')) {
        setShowDuplicateWarning(true)
      }
      setPendingSubmit(false)
    }
  }

  const handleContinueAnyway = async () => {
    setShowDuplicateWarning(false)
    const fraternityData = {
      name: name.trim(),
      type,
      school_id: schoolId,
      verification_email: verificationEmail.trim() || null,
      photo: photo || null,
      description: description.trim() || null,
      flagged: true, // Flag for review
    }
    await onSubmit(fraternityData)
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
            value={photo}
            onChange={setPhoto}
            userId={userId}
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

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-heading2 text-neutral-black mb-2">
              Duplicate Name Detected
            </h3>
            <p className="text-bodySmall text-gray-dark mb-6">
              A fraternity with this name already exists at your school. Are you sure you want to create another?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDuplicateWarning(false)}
                variant="secondary"
                size="large"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinueAnyway}
                variant="primary"
                size="large"
                className="flex-1"
              >
                Continue Anyway
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

