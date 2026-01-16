// components/FraternityCard.js
// Display component for fraternity information
// Props:
//   - fraternity: Fraternity object
//   - onClick: Optional click handler
//   - showMemberCount: Boolean (default: false)
//   - variant: 'default' | 'compact' | 'detailed' (default: 'default')

'use client'

import { memo, useMemo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import VerificationStatus from '@/components/VerificationStatus'
import Avatar from '@/components/ui/Avatar'

// Static type map - moved outside component
const TYPE_MAP = {
  'fraternity': 'Fraternity',
  'sorority': 'Sorority',
  'other': 'Other'
}

const getTypeLabel = (type) => {
  return TYPE_MAP[type?.toLowerCase()] || type || 'Other'
}

function FraternityCard({ 
  fraternity, 
  onClick, 
  showMemberCount = false, 
  variant = 'default' 
}) {
  if (!fraternity) {
    return null
  }

  // Memoize type label
  const typeLabel = useMemo(() => getTypeLabel(fraternity.type), [fraternity.type])

  // Memoize onClick handler - maintain original behavior (onClick called without params)
  const handleClick = useCallback((e) => {
    onClick?.(e)
  }, [onClick])

  // Compact variant - minimal info
  if (variant === 'compact') {
    return (
      <Card 
        variant="flat" 
        className={`border border-gray-border ${onClick ? 'cursor-pointer hover:border-primary-ui transition-colors' : ''}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          {fraternity.photo_url && (
            <Avatar 
              src={fraternity.photo_url} 
              alt={fraternity.name}
              size="sm"
              className="flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-black truncate">
              {fraternity.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="tag" className="text-xs">
                {typeLabel}
              </Badge>
              <VerificationStatus fraternity={fraternity} variant="compact" />
            </div>
            {showMemberCount && (
              <p className="text-bodySmall text-gray-medium mt-1">
                {fraternity.quality_member_count || 0}/{fraternity.member_count || 0} Members
              </p>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Detailed variant - full info
  if (variant === 'detailed') {
    return (
      <Card 
        variant="default" 
        className={`${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        onClick={handleClick}
      >
        <div className="space-y-4">
          {/* Header with photo and name */}
          <div className="flex items-start gap-4">
            {fraternity.photo_url && (
              <Avatar 
                src={fraternity.photo_url} 
                alt={fraternity.name}
                size="large"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-heading2 text-neutral-black mb-1">
                {fraternity.name}
              </h3>
              <Badge variant="tag" className="mb-2">
                {typeLabel}
              </Badge>
              {showMemberCount && (
                <p className="text-bodySmall text-gray-medium">
                  {fraternity.quality_member_count || 0} quality member{(fraternity.quality_member_count || 0) !== 1 ? 's' : ''}
                  {fraternity.member_count > (fraternity.quality_member_count || 0) && (
                    <span> ({fraternity.member_count} total)</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {fraternity.description && (
            <p className="text-bodySmall text-gray-dark">
              {fraternity.description}
            </p>
          )}

          {/* Verification status */}
          <VerificationStatus fraternity={fraternity} variant="detailed" />
        </div>
      </Card>
    )
  }

  // Default variant - standard card
  return (
    <Card 
      variant="flat" 
      className={`border border-gray-border ${onClick ? 'cursor-pointer hover:border-primary-ui transition-colors' : ''}`}
      onClick={handleClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {fraternity.photo_url && (
            <Avatar 
              src={fraternity.photo_url} 
              alt={fraternity.name}
              size="medium"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-heading3 text-neutral-black mb-1">
              {fraternity.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="tag">
                {typeLabel}
              </Badge>
              <VerificationStatus fraternity={fraternity} variant="compact" />
            </div>
          </div>
        </div>

        {/* Member count if enabled */}
        {showMemberCount && (
          <p className="text-bodySmall text-gray-medium">
            {fraternity.quality_member_count || 0} quality member{(fraternity.quality_member_count || 0) !== 1 ? 's' : ''}
            {fraternity.member_count > (fraternity.quality_member_count || 0) && (
              <span> ({fraternity.member_count} total)</span>
            )}
          </p>
        )}
      </div>
    </Card>
  )
}

export default memo(FraternityCard)

