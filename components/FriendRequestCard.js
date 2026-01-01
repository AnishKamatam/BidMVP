// components/FriendRequestCard.js
// Component to display an incoming friend request with accept/deny actions

'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'

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

export default function FriendRequestCard({ request, onAccept, onDeny, loading = false }) {
  if (!request || !request.requester) {
    return null
  }

  const { requester, created_at } = request

  return (
    <Card variant="default" className="p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar
          src={requester.profile_pic}
          alt={requester.name}
          size="lg"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-dark truncate">
            {requester.name}
          </h3>
          {requester.year && (
            <p className="text-sm text-gray-medium">
              Year {requester.year}
            </p>
          )}
          <p className="text-xs text-gray-medium mt-1">
            Sent {formatTimeAgo(created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => onAccept && onAccept(request)}
            disabled={loading}
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onDeny && onDeny(request)}
            disabled={loading}
          >
            Deny
          </Button>
        </div>
      </div>
    </Card>
  )
}

