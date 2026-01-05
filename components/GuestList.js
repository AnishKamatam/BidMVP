// components/GuestList.js
// Component for displaying approved guest list with user info and safety tiers

'use client'

import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import SafetyBadge from '@/components/SafetyBadge'
import Button from '@/components/ui/Button'

/**
 * Format time ago string
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted time ago string
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recently'
  
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  const weeks = Math.floor(diffDays / 7)
  if (weeks < 4) return `${weeks}w ago`
  
  const months = Math.floor(diffDays / 30)
  return `${months}mo ago`
}

export default function GuestList({
  guests,
  onRemoveGuest,
  onViewProfile,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="default" className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-light rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-light rounded w-32 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-light rounded w-24 animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!guests || guests.length === 0) {
    return (
      <Card variant="default" className="p-8 text-center">
        <p className="text-bodySmall text-gray-medium">
          No guests yet. Approve requests to add guests to the list.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {guests.map((guest) => {
        const { user, safety_tier, requested_at, responded_at } = guest

        if (!user) return null

        return (
          <Card key={guest.id} variant="default" className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <Avatar
                src={user.profile_pic}
                alt={user.name}
                size="lg"
              />

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-dark truncate">
                    {user.name}
                  </h3>
                  {safety_tier?.tier && (
                    <SafetyBadge
                      tier={safety_tier.tier}
                      score={safety_tier.score}
                      size="sm"
                    />
                  )}
                </div>
                {user.year && (
                  <p className="text-sm text-gray-medium">
                    Year {user.year}
                  </p>
                )}
                <p className="text-xs text-gray-medium mt-1">
                  Approved {formatTimeAgo(responded_at || requested_at)}
                </p>
              </div>

              {/* Actions */}
              {onRemoveGuest && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => onRemoveGuest(guest.id)}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

