// components/FraternityRequiredModal.js
// Event creation guard modal
// Props:
//   - isOpen: Boolean
//   - onClose: Function()
//   - onJoin: Function() → Navigate to join page
//   - onCreate: Function() → Navigate to create page
//   - userFraternities: Array of user's fraternities (optional)
//   - onAddMembers: Function() → Navigate to add members (optional)

'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import VerificationStatus from '@/components/VerificationStatus'

export default function FraternityRequiredModal({ 
  isOpen, 
  onClose, 
  onJoin, 
  onCreate,
  userFraternities = [],
  onAddMembers
}) {
  if (!isOpen) {
    return null
  }

  const hasFraternity = userFraternities.length > 0
  const hasUnverifiedFraternity = hasFraternity && userFraternities.some(
    frat => (frat.quality_member_count || 0) < 7
  )
  const unverifiedFraternity = hasUnverifiedFraternity 
    ? userFraternities.find(frat => (frat.quality_member_count || 0) < 7)
    : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <h3 className="text-heading2 text-neutral-black mb-2">
          Verification Required
        </h3>

        {!hasFraternity ? (
          // No fraternity
          <>
            <p className="text-bodySmall text-gray-dark mb-6">
              You need a verified fraternity to create events.
            </p>
            <div className="space-y-3">
              <Button
                onClick={onJoin}
                variant="primary"
                size="large"
                className="w-full"
              >
                Join Fraternity
              </Button>
              <Button
                onClick={onCreate}
                variant="secondary"
                size="large"
                className="w-full"
              >
                Create Fraternity
              </Button>
              <Button
                onClick={onClose}
                variant="text"
                size="medium"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : hasUnverifiedFraternity ? (
          // Has fraternity but not verified
          <>
            <p className="text-bodySmall text-gray-dark mb-4">
              Your fraternity needs to be verified before you can create events.
            </p>
            
            {/* Verification Status */}
            <div className="mb-6 p-4 bg-gray-light rounded-md">
              <VerificationStatus 
                fraternity={unverifiedFraternity} 
                variant="detailed" 
              />
            </div>

            <div className="space-y-3">
              {onAddMembers && (
                <Button
                  onClick={onAddMembers}
                  variant="primary"
                  size="large"
                  className="w-full"
                >
                  Add Members
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="secondary"
                size="large"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          // Has verified fraternity (shouldn't show modal, but handle gracefully)
          <>
            <p className="text-bodySmall text-gray-dark mb-6">
              Your fraternity is verified. You can create events!
            </p>
            <Button
              onClick={onClose}
              variant="primary"
              size="large"
              className="w-full"
            >
              Continue
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}

