// components/FriendList.js
// Component to display a list of accepted friends

'use client'

import { memo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/contexts/ChatContext'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

function FriendList({ friends = [], onRemove, loading = false }) {
  const router = useRouter()
  const { createConversation } = useChat()
  const [messageLoading, setMessageLoading] = useState({})

  const handleMessage = useCallback(async (friend) => {
    const friendId = friend?.id || friend?.friend?.id
    if (!friendId || messageLoading[friendId]) return

    setMessageLoading(prev => ({ ...prev, [friendId]: true }))

    try {
      const conversation = await createConversation(friendId)
      if (conversation) {
        router.push(`/messages/${conversation.id}`)
      }
    } catch (err) {
      console.error('Error creating conversation:', err)
    } finally {
      setMessageLoading(prev => ({ ...prev, [friendId]: false }))
    }
  }, [createConversation, router])

  const handleRemove = useCallback((friend) => {
    if (onRemove) {
      onRemove(friend)
    }
  }, [onRemove])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} variant="default" className="p-4 animate-pulse">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-light" />
              <div className="h-4 w-20 bg-gray-light rounded" />
              <div className="h-3 w-16 bg-gray-light rounded" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <Card variant="default" className="p-8 text-center">
        <p className="text-gray-medium">No friends yet</p>
        <p className="text-sm text-gray-medium mt-2">
          Start connecting with people you meet at events!
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {friends.map((friend) => (
        <Card
          key={friend?.id || friend?.friend?.id}
          variant="default"
          className="p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col items-center gap-3">
            {/* Avatar */}
            <Avatar
              src={friend?.profile_pic || friend?.friend?.profile_pic}
              alt={friend?.name || friend?.friend?.name}
              size="lg"
            />

            {/* Name */}
            <div className="text-center w-full">
              <h3 className="font-semibold text-gray-dark truncate">
                {friend?.name || friend?.friend?.name}
              </h3>
              {(friend?.year || friend?.friend?.year) && (
                <p className="text-sm text-gray-medium">
                  Year {friend?.year || friend?.friend?.year}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 w-full">
              <Button
                variant="primary"
                size="small"
                onClick={() => handleMessage(friend)}
                disabled={messageLoading[friend?.id || friend?.friend?.id]}
                className="flex-1"
              >
                {messageLoading[friend?.id || friend?.friend?.id] ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Message'
                )}
              </Button>
              {onRemove && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleRemove(friend)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default memo(FriendList)

