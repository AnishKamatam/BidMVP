// components/PeopleYouMet.js
// Component to display people user might have met at events

'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

/**
 * Format time ago string
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted time ago string
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recently'
  
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  const weeks = Math.floor(diffDays / 7)
  if (weeks < 4) return `${weeks}w ago`
  
  const months = Math.floor(diffDays / 30)
  return `${months}mo ago`
}

export default function PeopleYouMet({ 
  suggestions = [], 
  onSendRequest, 
  loading = false,
  eventId = null 
}) {
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
        <Card key={suggestion.id} variant="default" className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Avatar
              src={suggestion.profile_pic}
              alt={suggestion.name}
              size="lg"
            />

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-dark truncate">
                {suggestion.name}
              </h3>
              {suggestion.year && (
                <p className="text-sm text-gray-medium">
                  Year {suggestion.year}
                </p>
              )}
              
              {/* Event Context */}
              {suggestion.event_name && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="tag" className="text-xs">
                    Met at {suggestion.event_name}
                  </Badge>
                  {suggestion.met_at && (
                    <span className="text-xs text-gray-medium">
                      {formatTimeAgo(suggestion.met_at)}
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

