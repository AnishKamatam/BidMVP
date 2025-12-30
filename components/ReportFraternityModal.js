// components/ReportFraternityModal.js
// Modal for reporting fake/duplicate/inappropriate fraternities
// Props:
//   - isOpen: Boolean
//   - onClose: Function()
//   - fraternityId: String
//   - fraternityName: String

'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { reportFraternityAction } from '@/app/actions/fraternity'

export default function ReportFraternityModal({ 
  isOpen, 
  onClose, 
  fraternityId,
  fraternityName
}) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!reason) {
      setError('Please select a reason')
      return
    }

    const finalReason = reason === 'Other' ? otherReason : reason
    if (!finalReason.trim()) {
      setError('Please provide a reason')
      return
    }

    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a description (at least 10 characters)')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { data, error: reportError } = await reportFraternityAction(
        fraternityId,
        finalReason,
        description.trim()
      )

      if (reportError) {
        setError(reportError.message || 'Failed to submit report')
        setSubmitting(false)
        return
      }

      if (data?.success) {
        setSuccess(true)
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
          // Reset form
          setReason('')
          setDescription('')
          setOtherReason('')
          setSuccess(false)
        }, 2000)
      } else {
        setError('Failed to submit report')
        setSubmitting(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report')
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onClose()
      // Reset form
      setReason('')
      setDescription('')
      setOtherReason('')
      setError(null)
      setSuccess(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        {success ? (
          <>
            <h3 className="text-heading2 text-neutral-black mb-2">
              Report Submitted
            </h3>
            <p className="text-bodySmall text-gray-dark mb-6">
              Report submitted. Thank you for helping keep the platform safe.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-heading2 text-neutral-black mb-2">
              Report Fraternity
            </h3>
            <p className="text-bodySmall text-gray-dark mb-4">
              Report "{fraternityName}" for review
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason Dropdown */}
              <div>
                <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                  Reason <span className="text-error">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value)
                    setError(null)
                  }}
                  className="w-full px-4 py-3 border border-gray-border rounded-md text-bodySmall text-neutral-black focus:outline-none focus:ring-2 focus:ring-primary-ui focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  <option value="Fake fraternity">Fake fraternity</option>
                  <option value="Duplicate name">Duplicate name</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Other Reason Input */}
              {reason === 'Other' && (
                <div>
                  <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                    Please specify <span className="text-error">*</span>
                  </label>
                  <Input
                    type="text"
                    value={otherReason}
                    onChange={(e) => {
                      setOtherReason(e.target.value)
                      setError(null)
                    }}
                    placeholder="Enter reason"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                  Description <span className="text-error">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setError(null)
                  }}
                  placeholder="Please provide details about why you're reporting this fraternity (at least 10 characters)..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-border rounded-md text-bodySmall text-neutral-black placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-primary-ui focus:border-transparent resize-none"
                />
                <p className="text-caption text-gray-medium mt-1">
                  {description.length} / 10 minimum characters
                </p>
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
                  onClick={handleClose}
                  disabled={submitting}
                  variant="secondary"
                  size="large"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                  size="large"
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}

