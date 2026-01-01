// components/FriendRequestButton.js
// Reusable button component that handles different friendship states

'use client'

import Button from '@/components/ui/Button'

export default function FriendRequestButton({
  userId,
  friendId,
  status = 'none', // 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  loading = false,
  size = 'small',
  className = ''
}) {
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

