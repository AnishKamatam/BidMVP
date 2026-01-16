// components/MessageBubble.js
// Component to display an individual message bubble

'use client'

import { memo } from 'react'
import Avatar from '@/components/ui/Avatar'
import { formatMessageTime } from '@/lib/utils/timeFormatting'

function MessageBubble({ message, isOwn, showAvatar = true }) {
  if (!message) return null

  const sender = message.sender || {}
  const isReaction = message.type === 'reaction'

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar - only show for other messages */}
      {!isOwn && showAvatar && (
        <Avatar
          src={sender.profile_pic}
          alt={sender.name || 'User'}
          size="sm"
          className="flex-shrink-0"
        />
      )}

      {/* Message content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* Sender name - only for other messages */}
        {!isOwn && sender.name && (
          <p className="text-xs text-gray-medium mb-1 px-2">
            {sender.name}
          </p>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-primary-ui text-white'
              : 'bg-gray-light text-gray-dark'
          }`}
        >
          {isReaction ? (
            <div className="text-2xl">
              {message.reaction_type === 'thumbs_up' ? '👍' : '👎'}
            </div>
          ) : (
            <p className="text-bodySmall whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp and read status */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <p className="text-xs text-gray-medium">
            {formatMessageTime(message.created_at)}
          </p>
          {isOwn && message.read_at && (
            <span className="text-xs text-gray-medium">✓ Read</span>
          )}
        </div>
      </div>

      {/* Spacer for own messages */}
      {isOwn && !showAvatar && <div className="w-10" />}
    </div>
  )
}

export default memo(MessageBubble)

