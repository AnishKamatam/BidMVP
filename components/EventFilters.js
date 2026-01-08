// components/EventFilters.js
// Filter UI component for event feed

'use client'

import Button from '@/components/ui/Button'
import Toggle from '@/components/ui/Toggle'

/**
 * Event Filters Component
 * @param {object} props
 * @param {object} props.filters - Current filter state
 * @param {string|null} props.filters.event_type - Selected event type or null for all
 * @param {string|null} props.filters.visibility - Selected visibility or null for all
 * @param {boolean} props.filters.rush_only - Show only rush-only events
 * @param {function} props.onChange - Callback when filters change
 */
export default function EventFilters({ filters, onChange }) {
  const eventTypes = [
    { value: null, label: 'All Types' },
    { value: 'party', label: 'Party' },
    { value: 'mixer', label: 'Mixer' },
    { value: 'rush', label: 'Rush Event' },
    { value: 'invite-only', label: 'Invite Only' }
  ]

  const visibilityTypes = [
    { value: null, label: 'All' },
    { value: 'public', label: 'Public' },
    { value: 'invite-only', label: 'Invite Only' },
    { value: 'rush-only', label: 'Rush Only' }
  ]

  const handleEventTypeChange = (type) => {
    onChange({
      ...filters,
      event_type: type === filters.event_type ? null : type
    })
  }

  const handleVisibilityChange = (visibility) => {
    onChange({
      ...filters,
      visibility: visibility === filters.visibility ? null : visibility,
      // If selecting rush-only visibility, also enable rush_only toggle
      rush_only: visibility === 'rush-only' ? true : filters.rush_only
    })
  }

  const handleRushOnlyToggle = (checked) => {
    onChange({
      ...filters,
      rush_only: checked,
      // If enabling rush_only, set visibility to rush-only
      visibility: checked ? 'rush-only' : filters.visibility === 'rush-only' ? null : filters.visibility
    })
  }

  const handleClearFilters = () => {
    onChange({
      event_type: null,
      visibility: null,
      rush_only: false
    })
  }

  const hasActiveFilters = filters.event_type !== null || filters.visibility !== null || filters.rush_only

  return (
    <div className="bg-white border-b border-gray-light sticky top-0 z-10">
      <div className="px-4 py-3 space-y-3">
        {/* Event Type Filter - Horizontal Scrollable Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {eventTypes.map((type) => {
            const isActive = filters.event_type === type.value
            return (
              <Button
                key={type.value || 'all'}
                variant={isActive ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleEventTypeChange(type.value)}
                className={`flex-shrink-0 whitespace-nowrap ${isActive ? 'font-semibold' : ''}`}
              >
                {type.label}
              </Button>
            )
          })}
        </div>

        {/* Visibility Filter and Rush-Only Toggle Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Visibility Filter - Optional, can be hidden */}
          <div className="flex items-center gap-2 overflow-x-auto flex-1 hide-scrollbar">
            {visibilityTypes.map((vis) => {
              const isActive = filters.visibility === vis.value
              return (
                <Button
                  key={vis.value || 'all'}
                  variant={isActive ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleVisibilityChange(vis.value)}
                  className={`flex-shrink-0 whitespace-nowrap ${isActive ? 'font-semibold' : ''}`}
                >
                  {vis.label}
                </Button>
              )
            })}
          </div>

          {/* Rush-Only Toggle */}
          <div className="flex-shrink-0">
            <Toggle
              checked={filters.rush_only || false}
              onChange={handleRushOnlyToggle}
              label="Rush Only"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="small"
              onClick={handleClearFilters}
              className="text-xs"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

