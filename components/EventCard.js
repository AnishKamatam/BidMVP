// components/EventCard.js
// Event card component for displaying event information in the feed

'use client'

import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import BidPurchaseButton from '@/components/BidPurchaseButton'
import { formatEventDate } from '@/lib/utils/dateFormatting'

/**
 * Event Card Component
 * @param {object} props
 * @param {object} props.event - Event object
 * @param {string} props.event.id - Event ID
 * @param {string} props.event.title - Event title
 * @param {string} props.event.date - Local time string (YYYY-MM-DDTHH:MM:SS)
 * @param {string|null} props.event.end_time - End time or null
 * @param {string} props.event.event_type - 'party' | 'mixer' | 'rush' | 'invite-only'
 * @param {string} props.event.visibility - 'public' | 'invite-only' | 'rush-only'
 * @param {number} props.event.bid_price - Bid price
 * @param {number|null} props.event.max_bids - Maximum bids or null
 * @param {number|null} props.event.line_skip_price - Line skip price or null
 * @param {string} props.event.location - Event location
 * @param {string|null} props.event.description - Description or null
 * @param {string|null} props.event.image_url - Image URL or null
 * @param {object|null} props.event.fraternity - Fraternity object
 * @param {function} props.onClick - Optional click handler
 * @param {string} props.variant - 'default' | 'compact'
 */
export default function EventCard({ event, onClick, variant = 'default' }) {
  const router = useRouter()

  if (!event) {
    return null
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Navigate to event detail page (future implementation)
      router.push(`/events/${event.id}`)
    }
  }

  // Get event type label
  const getEventTypeLabel = (type) => {
    const labels = {
      'party': 'Party',
      'mixer': 'Mixer',
      'rush': 'Rush Event',
      'invite-only': 'Invite Only'
    }
    return labels[type] || type
  }

  // Get visibility label
  const getVisibilityLabel = (visibility) => {
    const labels = {
      'public': 'Public',
      'invite-only': 'Invite Only',
      'rush-only': 'Rush Only'
    }
    return labels[visibility] || visibility
  }

  // Get visibility badge variant
  const getVisibilityBadgeVariant = (visibility) => {
    if (visibility === 'rush-only') {
      return 'tag' // Could be styled differently
    }
    return 'tag'
  }

  // Truncate description
  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return null
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  // Truncate location
  const truncateLocation = (text, maxLength = 50) => {
    if (!text) return null
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const isCompact = variant === 'compact'

  return (
    <Card 
      className="mb-4 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className={`space-y-3 ${isCompact ? 'space-y-2' : ''}`}>
        {/* Event Image */}
        {event.image_url && (
          <div className={`relative w-full ${isCompact ? 'h-32' : 'h-48'} rounded-lg overflow-hidden bg-gray-light`}>
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header: Fraternity Info and Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {event.fraternity && (
              <>
                <Avatar
                  src={event.fraternity.photo_url}
                  alt={event.fraternity.name}
                  size={isCompact ? 'sm' : 'md'}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-gray-dark truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
                    {event.fraternity.name}
                  </p>
                  {event.fraternity.type && (
                    <p className="text-xs text-gray-medium capitalize">
                      {event.fraternity.type}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant="tag">
              {getEventTypeLabel(event.event_type)}
            </Badge>
            <Badge variant={getVisibilityBadgeVariant(event.visibility)}>
              {getVisibilityLabel(event.visibility)}
            </Badge>
          </div>
        </div>

        {/* Event Title */}
        <h3 className={`font-bold text-gray-dark ${isCompact ? 'text-base' : 'text-lg'}`}>
          {event.title}
        </h3>

        {/* Date and Time */}
        <div className="flex items-center text-sm text-gray-medium">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatEventDate(event.date)}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start text-sm text-gray-medium">
            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="flex-1">{truncateLocation(event.location)}</span>
          </div>
        )}

        {/* Description */}
        {event.description && !isCompact && (
          <p className="text-sm text-gray-medium overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {truncateDescription(event.description, 100)}
          </p>
        )}

        {/* Bid Purchase Button */}
        {event.bid_price > 0 && (
          <div className="pt-2 border-t border-gray-light">
            <BidPurchaseButton
              eventId={event.id}
              event={event}
              variant="button"
              onSuccess={() => {
                // Refresh or navigate on success
                window.location.reload()
              }}
              onError={(error) => {
                console.error('Bid purchase error:', error)
              }}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

