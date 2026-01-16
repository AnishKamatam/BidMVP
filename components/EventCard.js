// components/EventCard.js
// Event card component for displaying event information in the feed

'use client'

import { memo, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { formatEventDate } from '@/lib/utils/dateFormatting'

// Static helper functions - moved outside component
const getEventTypeLabel = (type) => {
  const labels = {
    'party': 'Party',
    'mixer': 'Mixer',
    'rush': 'Rush Event',
    'invite-only': 'Invite Only'
  }
  return labels[type] || type
}

const getVisibilityLabel = (visibility) => {
  const labels = {
    'public': 'Public',
    'invite-only': 'Invite Only',
    'rush-only': 'Rush Only'
  }
  return labels[visibility] || visibility
}

const getVisibilityBadgeVariant = (visibility) => {
  if (visibility === 'rush-only') {
    return 'tag'
  }
  return 'tag'
}

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
function EventCard({ event, onClick, variant = 'default' }) {
  const router = useRouter()

  const handleCardClick = useCallback((e) => {
    // Prevent navigation if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
      e.stopPropagation()
      return
    }

    if (onClick) {
      onClick()
    }
    // Navigate to event details page
    router.push(`/events/${event.id}`)
  }, [event.id, onClick, router])

  // Memoize computed values
  const isCompact = variant === 'compact'
  const eventTypeLabel = useMemo(() => getEventTypeLabel(event.event_type), [event.event_type])
  const visibilityLabel = useMemo(() => getVisibilityLabel(event.visibility), [event.visibility])
  const visibilityBadgeVariant = useMemo(() => getVisibilityBadgeVariant(event.visibility), [event.visibility])

  // Truncate description
  const truncateDescription = useCallback((text, maxLength = 100) => {
    if (!text) return null
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }, [])

  // Truncate location
  const truncateLocation = useCallback((text, maxLength = 50) => {
    if (!text) return null
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }, [])

  const truncatedDescription = useMemo(() => truncateDescription(event.description, 100), [truncateDescription, event.description])
  const truncatedLocation = useMemo(() => truncateLocation(event.location, 50), [truncateLocation, event.location])

  if (!event) {
    return null
  }

  return (
    <div 
      className="mb-4 cursor-pointer"
      onClick={handleCardClick}
    >
      <Card>
      <div className={`space-y-3 ${isCompact ? 'space-y-2' : ''}`}>
        {/* Event Image */}
        {event.image_url && (
          <div className={`relative w-full ${isCompact ? 'h-32' : 'h-48'} rounded-lg overflow-hidden bg-gray-light`}>
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={event.image_url?.startsWith('data:') || event.image_url?.startsWith('blob:')}
            />
          </div>
        )}

        {/* Header: Fraternity Info and Badges */}
        {/* Always prioritize fraternity name when available - never show admin/creator info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Only display fraternity information - fraternity name is the primary identifier */}
            {event.fraternity && event.fraternity.name && (
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
              {eventTypeLabel}
            </Badge>
            <Badge variant={visibilityBadgeVariant}>
              {visibilityLabel}
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
            <span className="flex-1">{truncatedLocation}</span>
          </div>
        )}

        {/* Description */}
        {event.description && !isCompact && (
          <p className="text-sm text-gray-medium overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {truncatedDescription}
          </p>
        )}

        {/* Price Indicator (for events with bid price) - Buy Bid button is on details page */}
        {event.bid_price > 0 && (
          <div className="pt-2 border-t border-gray-light">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-medium">Bid Price</span>
              <span className="text-base font-semibold text-primary-ui">
                ${event.bid_price.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
      </Card>
    </div>
  )
}

export default memo(EventCard)

