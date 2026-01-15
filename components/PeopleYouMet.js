// components/PeopleYouMet.js
// Component to display people user might have met at events
// Can use context for suggestions and actions, or accept as props

'use client'

import { useFriend } from '@/contexts/FriendContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatTimeAgo } from '@/lib/utils/timeFormatting'

export default function PeopleYouMet({ 
  suggestions: propsSuggestions, // If provided, use props; otherwise use context
  onSendRequest: propsOnSendRequest, // If provided, use props; otherwise use context
  loading: propsLoading, // If provided, use props; otherwise use context
  eventId = null 
}) {
  // Always call hook (React requires hooks to be called unconditionally)
  // If props are provided, they take precedence over context
  // Component requires FriendProvider if props are not provided
  const friendContext = useFriend()

  // Use props if provided, otherwise use context
  const suggestions = propsSuggestions !== undefined ? propsSuggestions : (friendContext?.suggestions || [])
  const onSendRequest = propsOnSendRequest !== undefined ? propsOnSendRequest : (friendContext?.sendFriendRequest || (() => {}))
  const loading = propsLoading !== undefined ? propsLoading : (friendContext?.loading || false)
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} variant="default" className="p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-light" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-light rounded mb-2" />
                <div className="h-3 w-24 bg-gray-light rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card variant="default" className="p-8 text-center">
        <p className="text-gray-medium">No suggestions yet</p>
        <p className="text-sm text-gray-medium mt-2">
          {eventId 
            ? "No one else checked into this event"
            : "Check into events to see people you might have met!"
          }
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id || suggestion.user?.id} variant="default" className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Avatar
              src={suggestion.profile_pic || suggestion.user?.profile_pic}
              alt={suggestion.name || suggestion.user?.name}
              size="lg"
            />

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-dark truncate">
                {suggestion.name || suggestion.user?.name}
              </h3>
              {(suggestion.year || suggestion.user?.year) && (
                <p className="text-sm text-gray-medium">
                  Year {suggestion.year || suggestion.user?.year}
                </p>
              )}
              
              {/* Event Context */}
              {suggestion.sharedEvents !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="tag" className="text-xs">
                    Attended {suggestion.sharedEvents} {suggestion.sharedEvents === 1 ? 'event' : 'events'} together
                  </Badge>
                  {suggestion.lastEventDate && (
                    <span className="text-xs text-gray-medium">
                      Last event: {formatTimeAgo(suggestion.lastEventDate)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Send Request Button */}
            <Button
              variant="primary"
              size="small"
              onClick={() => onSendRequest && onSendRequest(suggestion)}
              disabled={loading}
            >
              Send Request
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

