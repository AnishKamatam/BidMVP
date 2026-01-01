// components/FriendList.js
// Component to display a list of accepted friends

'use client'

import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

export default function FriendList({ friends = [], onRemove, loading = false }) {
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
          key={friend.id || friend.friendship_id}
          variant="default"
          className="p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col items-center gap-3">
            {/* Avatar */}
            <Avatar
              src={friend.profile_pic}
              alt={friend.name}
              size="lg"
            />

            {/* Name */}
            <div className="text-center w-full">
              <h3 className="font-semibold text-gray-dark truncate">
                {friend.name}
              </h3>
              {friend.year && (
                <p className="text-sm text-gray-medium">
                  Year {friend.year}
                </p>
              )}
            </div>

            {/* Remove button (if onRemove provided) */}
            {onRemove && (
              <Button
                variant="text"
                size="small"
                onClick={() => onRemove(friend)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

