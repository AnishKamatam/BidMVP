// components/VerificationStatus.js
// Display fraternity verification status and progress
// Props:
//   - fraternity: Fraternity object with verification fields
//   - variant: 'compact' | 'detailed' | 'progress' (default: 'compact')

'use client'

import Badge from '@/components/ui/Badge'

export default function VerificationStatus({ fraternity, variant = 'compact' }) {
  if (!fraternity) {
    return null
  }

  // Extract verification data
  const emailVerified = fraternity.email_verified || false
  const qualityMemberCount = fraternity.quality_member_count || 0
  const totalMemberCount = fraternity.total_member_count || 0
  const hasVerificationEmail = !!fraternity.verification_email
  const verified = fraternity.verified || false

  // Calculate verification status
  const isMemberVerified = qualityMemberCount >= 7
  const isFullyVerified = qualityMemberCount >= 10
  const membersNeeded = Math.max(0, 7 - qualityMemberCount)
  const membersNeededWithEmail = Math.max(0, 5 - qualityMemberCount)

  // Compact variant - just badges
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {emailVerified && hasVerificationEmail && (
          <Badge variant="status" status="active">
            Email Verified
          </Badge>
        )}
        {isMemberVerified && (
          <Badge variant="status" status="active">
            Member Verified
          </Badge>
        )}
        {isFullyVerified && (
          <Badge variant="status" status="active">
            Fully Verified
          </Badge>
        )}
        {!isMemberVerified && (
          <Badge variant="tag">
            {qualityMemberCount}/7 Members
          </Badge>
        )}
      </div>
    )
  }

  // Detailed variant - full status with progress
  if (variant === 'detailed') {
    return (
      <div className="space-y-3">
        {/* Verification badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {emailVerified && hasVerificationEmail && (
            <Badge variant="status" status="active">
              Email Verified ✓
            </Badge>
          )}
          {isMemberVerified && (
            <Badge variant="status" status="active">
              Member Verified ✓
            </Badge>
          )}
          {isFullyVerified && (
            <Badge variant="status" status="active">
              Fully Verified ✓
            </Badge>
          )}
        </div>

        {/* Status message */}
        <div className="space-y-2">
          {isFullyVerified ? (
            <p className="text-bodySmall font-semibold text-success">
              Fully verified ✓
            </p>
          ) : isMemberVerified ? (
            <p className="text-bodySmall font-semibold text-success">
              Ready to create events! ✓
            </p>
          ) : emailVerified && hasVerificationEmail ? (
            <div className="space-y-1">
              <p className="text-bodySmall font-semibold text-neutral-black">
                Email verified ✓ | Add {membersNeededWithEmail} more verified members (or {5 - qualityMemberCount}+ with email)
              </p>
              <p className="text-caption text-gray-medium">
                {qualityMemberCount}/7 quality members needed (or 5+ with email verification)
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-bodySmall font-semibold text-neutral-black">
                Add {membersNeeded} more verified members to unlock events
              </p>
              <p className="text-caption text-gray-medium">
                {qualityMemberCount}/7 quality members needed
              </p>
            </div>
          )}

          {/* Member count display */}
          <p className="text-caption text-gray-medium">
            {qualityMemberCount} quality member{qualityMemberCount !== 1 ? 's' : ''} 
            {totalMemberCount > qualityMemberCount && (
              <span> ({totalMemberCount} total)</span>
            )}
          </p>
          <p className="text-caption text-gray-medium">
            Only members with verified emails and completed profiles count
          </p>
        </div>
      </div>
    )
  }

  // Progress variant - progress bar style
  if (variant === 'progress') {
    const progress = isFullyVerified ? 100 : isMemberVerified ? 100 : Math.min(100, (qualityMemberCount / 7) * 100)
    
    return (
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="w-full bg-gray-border h-2 rounded-full overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isFullyVerified ? 'bg-success' : isMemberVerified ? 'bg-primary-ui' : 'bg-premium-orange'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between">
          <span className="text-bodySmall text-gray-dark">
            {qualityMemberCount}/7 quality members
          </span>
          {emailVerified && hasVerificationEmail && (
            <Badge variant="status" status="active" className="text-xs">
              Email ✓
            </Badge>
          )}
        </div>

        {/* Status message */}
        {isFullyVerified ? (
          <p className="text-bodySmall font-semibold text-success">
            Fully verified ✓
          </p>
        ) : isMemberVerified ? (
          <p className="text-bodySmall font-semibold text-success">
            Ready to create events! ✓
          </p>
        ) : emailVerified && hasVerificationEmail ? (
          <p className="text-bodySmall text-neutral-black">
            Email verified ✓ | Add {membersNeededWithEmail} more verified members (or 5+ with email)
          </p>
        ) : (
          <p className="text-bodySmall text-neutral-black">
            Add {membersNeeded} more verified members to unlock events
          </p>
        )}
      </div>
    )
  }

  return null
}

