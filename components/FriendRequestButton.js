// components/FriendRequestButton.js
// Reusable button component that handles different friendship states
// Can use context for status, or accept status as prop

'use client'

import { useState, useEffect } from 'react'
import { useFriend } from '@/contexts/FriendContext'
import Button from '@/components/ui/Button'

export default function FriendRequestButton({
  userId,
  friendId,
  status: propsStatus = null, // If null, use context
  onSendRequest: propsOnSendRequest = null, // If null, use context
  onCancelRequest: propsOnCancelRequest = null, // If null, use context
  onAcceptRequest: propsOnAcceptRequest = null, // If null, use context
  loading = false,
  size = 'small',
  className = ''
}) {
  // Always call hook (React requires hooks to be called unconditionally)
  // If props are provided, they take precedence over context
  const friendContext = useFriend()

  // Get status from context if props not provided
  const [statusState, setStatusState] = useState(propsStatus || 'none')
  const status = propsStatus !== null ? propsStatus : statusState

  // Fetch status from context if not provided as prop
  useEffect(() => {
    if (propsStatus !== null || !friendId) return

    const fetchStatus = async () => {
      if (!friendContext) return
      const { status: fetchedStatus } = await friendContext.getFriendshipStatus(friendId)
      setStatusState(fetchedStatus || 'none')
    }

    // Check cache first
    const cachedStatus = friendContext?.friendshipStatuses?.get(friendId)
    if (cachedStatus) {
      setStatusState(cachedStatus)
    } else if (friendContext) {
      fetchStatus()
    }
  }, [friendId, propsStatus, friendContext])

  // Use context functions if props not provided
  const onSendRequest = propsOnSendRequest || friendContext?.sendFriendRequest || (() => {})
  const onCancelRequest = propsOnCancelRequest || friendContext?.cancelFriendRequest || (() => {})
  const onAcceptRequest = propsOnAcceptRequest || friendContext?.acceptFriendRequest || (() => {})
  // Handle different states
  switch (status) {
    case 'accepted':
      return (
        <Button
          variant="secondary"
          size={size}
          disabled
          className={className}
          iconLeft={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        >
          Friends
        </Button>
      )

    case 'pending_sent':
      return (
        <Button
          variant="secondary"
          size={size}
          disabled={loading}
          onClick={() => onCancelRequest && onCancelRequest(friendId)}
          className={className}
        >
          {loading ? 'Canceling...' : 'Request Sent'}
        </Button>
      )

    case 'pending_received':
      return (
        <Button
          variant="primary"
          size={size}
          disabled={loading}
          onClick={() => onAcceptRequest && onAcceptRequest(friendId)}
          className={className}
        >
          {loading ? 'Accepting...' : 'Accept Request'}
        </Button>
      )

    case 'blocked':
      return (
        <Button
          variant="secondary"
          size={size}
          disabled
          className={className}
        >
          Blocked
        </Button>
      )

    case 'none':
    default:
      return (
        <Button
          variant="primary"
          size={size}
          disabled={loading || !userId || !friendId}
          onClick={() => onSendRequest && onSendRequest(friendId)}
          className={className}
        >
          {loading ? 'Sending...' : 'Send Request'}
        </Button>
      )
  }
}

