// components/FriendRequestCard.js
// Component to display an incoming friend request with accept/deny actions

'use client'

import { memo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { formatTimeAgo } from '@/lib/utils/timeFormatting'

function FriendRequestCard({ request, onAccept, onDeny, loading = false }) {
  if (!request || !request.user) {
    return null
  }

  const { user, created_at } = request

  const handleAccept = useCallback(() => {
    onAccept?.(request)
  }, [onAccept, request])

  const handleDeny = useCallback(() => {
    onDeny?.(request)
  }, [onDeny, request])

  return (
    <Card variant="default" className="p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar
          src={user.profile_pic}
          alt={user.name}
          size="lg"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-dark truncate">
            {user.name}
          </h3>
          {user.year && (
            <p className="text-sm text-gray-medium">
              Year {user.year}
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
            onClick={handleAccept}
            disabled={loading}
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleDeny}
            disabled={loading}
          >
            Deny
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default memo(FriendRequestCard)

