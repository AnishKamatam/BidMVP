// components/MessageRequestCard.js
// Component to display a message request with accept/decline actions

'use client'

import { memo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { formatTimeAgo } from '@/lib/utils/timeFormatting'

function MessageRequestCard({ request, onAccept, onDecline, loading = false }) {
  if (!request) {
    return null
  }

  // Request can have requester info or conversation info
  const requester = request.requester || request.user
  const created_at = request.created_at

  const handleAccept = useCallback(() => {
    onAccept?.(request)
  }, [onAccept, request])

  const handleDecline = useCallback(() => {
    onDecline?.(request)
  }, [onDecline, request])

  if (!requester) {
    return null
  }

  return (
    <Card variant="default" className="p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar
          src={requester.profile_pic}
          alt={requester.name || 'User'}
          size="lg"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-dark truncate">
            {requester.name || 'Unknown User'}
          </h3>
          {requester.year && (
            <p className="text-sm text-gray-medium">
              Year {requester.year}
            </p>
          )}
          <p className="text-xs text-gray-medium mt-1">
            {request.status === 'pending' ? 'Requested' : request.status === 'accepted' ? 'Accepted' : 'Declined'} {formatTimeAgo(created_at)}
          </p>
        </div>

        {/* Actions - only show if pending */}
        {request.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="small"
              onClick={handleAccept}
              disabled={loading}
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDecline}
              disabled={loading}
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default memo(MessageRequestCard)

