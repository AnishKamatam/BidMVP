// components/MessageList.js
// Component to display list of conversations

'use client'

import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatTimeAgo } from '@/lib/utils/timeFormatting'

export default function MessageList({ conversations = [], onSelect, loading = false }) {
  const router = useRouter()

  const handleSelect = (conversation) => {
    if (onSelect) {
      onSelect(conversation)
    } else {
      router.push(`/messages/${conversation.id}`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} variant="default" className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-light" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-light rounded mb-2" />
                <div className="h-3 w-48 bg-gray-light rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card variant="default" className="p-8 text-center">
        <p className="text-gray-medium">No conversations yet</p>
        <p className="text-sm text-gray-medium mt-2">
          Start a conversation to get messaging
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const otherUser = conversation.other_user
        const lastMessage = conversation.last_message
        const unreadCount = conversation.unread_count || 0

        return (
          <Card
            key={conversation.id}
            variant="default"
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSelect(conversation)}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <Avatar
                src={otherUser?.profile_pic}
                alt={otherUser?.name || 'User'}
                size="md"
              />

              {/* Conversation info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-dark truncate">
                    {otherUser?.name || 'Unknown User'}
                  </h3>
                  {lastMessage?.created_at && (
                    <p className="text-xs text-gray-medium ml-2 flex-shrink-0">
                      {formatTimeAgo(lastMessage.created_at)}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-medium truncate">
                    {lastMessage?.content || 'No messages yet'}
                  </p>
                  {unreadCount > 0 && (
                    <Badge variant="status" status="active" className="ml-2 flex-shrink-0">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

