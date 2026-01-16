// components/ConversationHeader.js
// Header component for conversation page showing other user info

'use client'

import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

function ConversationHeader({ conversation, otherUser, messageRequestStatus }) {
  const router = useRouter()

  const handleBack = useCallback(() => {
    router.push('/messages')
  }, [router])

  if (!conversation && !otherUser) {
    return null
  }

  const user = otherUser || conversation?.other_user

  return (
    <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-border">
      {/* Back button */}
      <Button
        variant="text"
        onClick={handleBack}
        className="p-2"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      {/* User avatar */}
      <Avatar
        src={user?.profile_pic}
        alt={user?.name || 'User'}
        size="md"
      />

      {/* User info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-dark truncate">
          {user?.name || 'Unknown User'}
        </h2>
        {messageRequestStatus === 'pending' && (
          <p className="text-xs text-gray-medium">Message request pending</p>
        )}
        {messageRequestStatus === 'declined' && (
          <p className="text-xs text-red-600">Message request declined</p>
        )}
      </div>
    </div>
  )
}

export default memo(ConversationHeader)

