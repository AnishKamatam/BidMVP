// components/EventForm.js
// Reusable event form component with DoorList-inspired layout

'use client'

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DateTimePicker from '@/components/DateTimePicker'
import EventTypeSelector from '@/components/EventTypeSelector'
import { DocumentTextIcon, PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const EventForm = forwardRef(function EventForm({
  fratId,
  userFraternities = [],
  onSubmit,
  onCancel,
  loading = false,
  error = null
}, ref) {
  const [selectedFratId, setSelectedFratId] = useState(fratId || null)
  const [isAutoSelected, setIsAutoSelected] = useState(false)
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('')
  const [date, setDate] = useState('')
  const [endTime, setEndTime] = useState(null)
  const [visibility, setVisibility] = useState('public')
  const [bidPrice, setBidPrice] = useState('')
  const [lineSkipPrice, setLineSkipPrice] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // Set selected fraternity when fratId prop changes
  useEffect(() => {
    if (fratId) {
      setSelectedFratId(fratId)
      setIsAutoSelected(true) // Pre-selected from query parameter or parent
    } else if (userFraternities.length === 1) {
      // Handle nested structure: { fraternity: {...}, role: 'admin' }
      const fraternityId = userFraternities[0].fraternity?.id || userFraternities[0].id
      setSelectedFratId(fraternityId)
      setIsAutoSelected(true) // Auto-selected because only one option
    } else {
      setIsAutoSelected(false)
    }
  }, [fratId, userFraternities])

  // Reset pendingSubmit when parent loading state changes to false
  useEffect(() => {
    if (!loading && pendingSubmit) {
      setPendingSubmit(false)
    }
  }, [loading, pendingSubmit])

  // Helper function to combine date and time into ISO 8601 TIMESTAMP
  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null
    if (!timeStr) {
      // If no time, use midnight
      const dateTime = new Date(`${dateStr}T00:00:00`)
      return dateTime.toISOString()
    }
    const dateTime = new Date(`${dateStr}T${timeStr}`)
    return dateTime.toISOString()
  }

  // Validate form
  const validate = () => {
    const errors = {}

    // Fraternity validation
    if (!selectedFratId) {
      errors.frat_id = 'Please select a fraternity'
    }

    // Title validation
    if (!title || !title.trim()) {
      errors.title = 'Event title is required'
    } else if (title.trim().length > 100) {
      errors.title = 'Title must be 100 characters or less'
    }

    // Event type validation
    if (!eventType) {
      errors.event_type = 'Event type is required'
    }

    // Date validation
    if (!date) {
      errors.date = 'Event date is required'
    } else {
      try {
        const eventDate = new Date(date)
        if (isNaN(eventDate.getTime())) {
          errors.date = 'Invalid date format'
        } else {
          const now = new Date()
          // Allow today's date (set time to start of day for comparison)
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
          
          if (eventDateOnly < today) {
            errors.date = 'Event date must be today or in the future'
          }
        }
      } catch (e) {
        errors.date = 'Invalid date format'
      }
    }

    // End time validation (if provided)
    if (endTime && date) {
      try {
        const startDate = new Date(date)
        let endDate = new Date(endTime)
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.end_time = 'Invalid date/time format'
        } else {
          // If end time is earlier than start time, assume it's the next day
          // This handles events that span midnight (e.g., 9 PM to 1 AM)
          if (endDate <= startDate) {
            // Check if end time is actually on the next day
            // Compare just the time portions (hours and minutes)
            const startTimeOnly = startDate.getHours() * 60 + startDate.getMinutes()
            const endTimeOnly = endDate.getHours() * 60 + endDate.getMinutes()
            
            // If end time is earlier in the day, it's likely the next day
            if (endTimeOnly < startTimeOnly) {
              // Add one day to end date
              endDate = new Date(endDate)
              endDate.setDate(endDate.getDate() + 1)
            } else {
              // End time is on same day but still before/equal to start - invalid
              errors.end_time = 'End time must be after start time'
            }
          }
          
          // Final check: end date should be after start date
          if (endDate <= startDate && !errors.end_time) {
            errors.end_time = 'End time must be after start time'
          }
        }
      } catch (e) {
        errors.end_time = 'Invalid date/time format'
      }
    }

    // Visibility validation
    if (!visibility) {
      errors.visibility = 'Visibility is required'
    }

    // Bid price validation (required)
    const trimmedBidPrice = bidPrice ? bidPrice.toString().trim() : ''
    if (!trimmedBidPrice) {
      errors.bid_price = 'Bid price is required'
    } else {
      const price = parseFloat(trimmedBidPrice)
      if (isNaN(price) || price < 0) {
        errors.bid_price = 'Bid price must be a valid number greater than or equal to 0'
      }
    }

    // Line skip price validation (optional, but must be valid if provided)
    if (lineSkipPrice && lineSkipPrice.trim()) {
      const trimmedLineSkipPrice = lineSkipPrice.toString().trim()
      const skipPrice = parseFloat(trimmedLineSkipPrice)
      if (isNaN(skipPrice) || skipPrice < 0) {
        errors.line_skip_price = 'Line skip price must be a valid number greater than or equal to 0'
      }
    }

    // Location validation (REQUIRED for automatic check-out)
    if (!location || !location.trim()) {
      errors.location = 'Location is required for automatic check-out'
    } else if (location.trim().length > 200) {
      errors.location = 'Location must be 200 characters or less'
    }

    // Description validation (optional, but check max length)
    if (description && description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Expose submit function to parent via ref
  const formRef = useRef(null)
  useImperativeHandle(ref, () => ({
    requestSubmit: () => {
      formRef.current?.requestSubmit()
    }
  }))

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setPendingSubmit(true)

    try {
      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Prepare event data
      const eventData = {
        frat_id: selectedFratId,
        title: title.trim(),
        date: date, // Local time string (YYYY-MM-DDTHH:MM:SS) from DateTimePicker
        end_time: endTime || null, // Local time string (YYYY-MM-DDTHH:MM:SS) from DateTimePicker
        event_type: eventType,
        visibility: visibility,
        bid_price: parseFloat(bidPrice.trim()),
        line_skip_price: lineSkipPrice && lineSkipPrice.trim() ? parseFloat(lineSkipPrice.trim()) : null,
        location: location.trim() || null,
        description: description.trim() || null,
        timezone: timezone
      }

      await onSubmit(eventData)
      // If onSubmit completes without error, reset pending state
      setPendingSubmit(false)
    } catch (err) {
      // Error handling is done by parent component
      setPendingSubmit(false)
    }
  }

  // Handle end time change (adjusts to next day if needed)
  const handleEndTimeChange = (isoString) => {
    if (!date) {
      setValidationErrors({
        ...validationErrors,
        end_time: 'Please set start date first'
      })
      return
    }

    if (!isoString) {
      setEndTime(null)
      return
    }

    const startDate = new Date(date)
    let endDate = new Date(isoString)
    
    // If end time is earlier than start time, assume it's the next day
    // This handles events that span midnight (e.g., 9 PM to 1 AM)
    if (endDate <= startDate) {
      const startTimeOnly = startDate.getHours() * 60 + startDate.getMinutes()
      const endTimeOnly = endDate.getHours() * 60 + endDate.getMinutes()
      
      // If end time is earlier in the day, it's the next day
      if (endTimeOnly < startTimeOnly) {
        endDate = new Date(endDate)
        endDate.setDate(endDate.getDate() + 1)
        // Update the endTime state with the adjusted date
        setEndTime(endDate.toISOString())
      } else {
        // Same day but still invalid - let validation handle it
        setEndTime(isoString)
      }
    } else {
      // End time is already after start time, use as-is
      setEndTime(isoString)
    }
    
    // Clear validation error if it exists
    if (validationErrors.end_time) {
      setValidationErrors({ ...validationErrors, end_time: null })
    }
  }

  // Get selected fraternity name for display
  const selectedFraternity = userFraternities.find((frat) => {
    const fraternityId = frat.fraternity?.id || frat.id
    return fraternityId === selectedFratId
  })
  const selectedFraternityName = selectedFraternity 
    ? (selectedFraternity.fraternity?.name || selectedFraternity.name)
    : null

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Fraternity Selection - Always show if there's a selection or multiple options */}
      {(selectedFratId || userFraternities.length > 1) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-bodySmall font-semibold text-neutral-black">
              Fraternity <span className="text-error">*</span>
            </label>
            {isAutoSelected && selectedFratId && (
              <Badge variant="status" status="active" className="text-xs flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" />
                Auto-selected
              </Badge>
            )}
          </div>
          
          {userFraternities.length > 1 ? (
            // Multiple fraternities - show dropdown
            <>
              <select
                value={selectedFratId || ''}
                onChange={(e) => {
                  setSelectedFratId(e.target.value)
                  setIsAutoSelected(false) // User manually selected, no longer auto-selected
                  if (validationErrors.frat_id) {
                    setValidationErrors({ ...validationErrors, frat_id: null })
                  }
                }}
                className={`
                  w-full rounded-md border px-4 py-3 text-base transition-all
                  bg-white
                  ${validationErrors.frat_id
                    ? 'border-error focus:border-error focus:ring-error'
                    : 'border-gray-border focus:border-primary-ui focus:ring-primary-ui'
                  }
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                `}
              >
                <option value="">Select a fraternity</option>
                {userFraternities.map((frat) => {
                  // Handle nested structure: { fraternity: {...}, role: 'admin' }
                  const fraternityId = frat.fraternity?.id || frat.id
                  const fraternityName = frat.fraternity?.name || frat.name
                  return (
                    <option key={fraternityId} value={fraternityId}>
                      {fraternityName}
                    </option>
                  )
                })}
              </select>
              {validationErrors.frat_id && (
                <p className="text-bodySmall text-error mt-1">{validationErrors.frat_id}</p>
              )}
            </>
          ) : (
            // Single fraternity - show as read-only display with option to change
            <div className={`
              w-full rounded-md border px-4 py-3 text-base
              bg-gray-light
              ${validationErrors.frat_id
                ? 'border-error'
                : 'border-gray-border'
              }
            `}>
              <div className="flex items-center justify-between">
                <span className="text-bodySmall text-neutral-black font-medium">
                  {selectedFraternityName || 'No fraternity selected'}
                </span>
                {isAutoSelected && (
                  <span className="text-caption text-gray-medium flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4 text-primary-ui" />
                    Selected automatically
                  </span>
                )}
              </div>
            </div>
          )}
          
          {isAutoSelected && selectedFratId && (
            <p className="text-caption text-gray-medium mt-2">
              {userFraternities.length === 1 
                ? 'This fraternity was automatically selected because it\'s the only verified fraternity you can create events for.'
                : 'This fraternity was pre-selected based on your current context. You can change it if needed.'
              }
            </p>
          )}
        </div>
      )}

      {/* Event Title */}
      <div>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          Event Title <span className="text-error">*</span>
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (validationErrors.title) {
              setValidationErrors({ ...validationErrors, title: null })
            }
          }}
          placeholder="e.g., Spring Formal, Rush Mixer, etc."
          error={validationErrors.title}
          maxLength={100}
        />
        {!validationErrors.title && (
          <p className="text-caption text-gray-medium mt-1">
            {title.length}/100 characters
          </p>
        )}
      </div>

      {/* Event Type */}
      <EventTypeSelector
        value={eventType}
        onChange={(value) => {
          setEventType(value)
          if (validationErrors.event_type) {
            setValidationErrors({ ...validationErrors, event_type: null })
          }
        }}
        error={validationErrors.event_type}
        required
      />

      {/* Starts/Ends Section with Visual Connection */}
      <div className="relative">
        {/* Starts Field */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                Starts<span className="text-error">*</span>
              </label>
              {/* Dotted line connector */}
              <div className="w-0.5 h-12 border-l-2 border-dashed border-gray-border"></div>
            </div>
            <div className="flex-1">
              <DateTimePicker
                type="datetime"
                value={date}
                onChange={(value) => {
                  setDate(value)
                  if (validationErrors.date) {
                    setValidationErrors({ ...validationErrors, date: null })
                  }
                  // If end time exists, update it to use same date
                  if (endTime) {
                    const endDate = new Date(value)
                    const oldEnd = new Date(endTime)
                    endDate.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0)
                    setEndTime(endDate.toISOString())
                  }
                }}
                label=""
                required
                error={validationErrors.date}
                displayFormat="pill"
                showTime={true}
              />
            </div>
          </div>
        </div>

        {/* Ends Field */}
        <div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                Ends
              </label>
            </div>
            <div className="flex-1">
              {date ? (
                <DateTimePicker
                  type="time"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  baseDate={endTime || date}
                  label=""
                  error={validationErrors.end_time}
                  displayFormat="pill"
                  placeholder="Select end time"
                />
              ) : (
                <div className="rounded-full border border-gray-border px-4 py-2.5 text-bodySmall text-gray-medium bg-gray-light">
                  Set start date first
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          Visibility <span className="text-error">*</span>
        </label>
        <div className="space-y-2">
          {[
            { value: 'public', label: 'Public' },
            { value: 'invite-only', label: 'Invite Only' },
            { value: 'rush-only', label: 'Rush Only' }
          ].map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer
                transition-all
                ${visibility === option.value
                  ? 'border-primary-ui bg-white'
                  : 'border-gray-border bg-white hover:bg-gray-light'
                }
              `}
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={(e) => {
                  setVisibility(e.target.value)
                  if (validationErrors.visibility) {
                    setValidationErrors({ ...validationErrors, visibility: null })
                  }
                }}
                className="w-4 h-4 text-primary-ui focus:ring-primary-ui"
              />
              <span className="text-bodySmall text-neutral-black">{option.label}</span>
            </label>
          ))}
        </div>
        {validationErrors.visibility && (
          <p className="text-bodySmall text-error mt-1">{validationErrors.visibility}</p>
        )}
      </div>

      {/* Bid Price */}
      <div>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          Bid Price <span className="text-error">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bodySmall text-gray-medium">
            $
          </span>
          <Input
            type="number"
            value={bidPrice}
            onChange={(e) => {
              setBidPrice(e.target.value)
              if (validationErrors.bid_price) {
                setValidationErrors({ ...validationErrors, bid_price: null })
              }
            }}
            placeholder="0.00"
            error={validationErrors.bid_price}
            min="0"
            step="0.01"
            className="pl-8"
          />
        </div>
        {validationErrors.bid_price && (
          <p className="text-bodySmall text-error mt-1">{validationErrors.bid_price}</p>
        )}
        {!validationErrors.bid_price && (
          <p className="text-caption text-gray-medium mt-1">
            Enter the bid price for this event
          </p>
        )}
      </div>

      {/* Line Skip Price */}
      <div>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          Line Skip Price <span className="text-gray-medium">(Optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bodySmall text-gray-medium">
            $
          </span>
          <Input
            type="number"
            value={lineSkipPrice}
            onChange={(e) => {
              setLineSkipPrice(e.target.value)
              if (validationErrors.line_skip_price) {
                setValidationErrors({ ...validationErrors, line_skip_price: null })
              }
            }}
            placeholder="0.00"
            error={validationErrors.line_skip_price}
            min="0"
            step="0.01"
            className="pl-8"
          />
        </div>
        {validationErrors.line_skip_price && (
          <p className="text-bodySmall text-error mt-1">{validationErrors.line_skip_price}</p>
        )}
        {!validationErrors.line_skip_price && (
          <p className="text-caption text-gray-medium mt-1">
            Price for users to skip the line at this event
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          Location <span className="text-error">*</span>
        </label>
        <Input
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value)
            if (validationErrors.location) {
              setValidationErrors({ ...validationErrors, location: null })
            }
          }}
          placeholder="Event address (required for automatic check-out)"
          error={validationErrors.location}
          maxLength={200}
          required
        />
        {!validationErrors.location && (
          <p className="text-caption text-gray-medium mt-1">
            {location.length}/200 characters - Enter event address (e.g., '123 Main St, Berkeley, CA') for automatic check-out
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          <DocumentTextIcon className="w-4 h-4 inline mr-1" />
          Description <span className="text-gray-medium">(Optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (validationErrors.description) {
              setValidationErrors({ ...validationErrors, description: null })
            }
          }}
          placeholder="Tell us about your event..."
          rows={4}
          maxLength={500}
          className={`
            w-full px-4 py-3 border rounded-md text-bodySmall text-neutral-black
            placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-offset-2
            resize-none transition-all
            ${validationErrors.description
              ? 'border-error focus:border-error focus:ring-error'
              : 'border-gray-border focus:border-primary-ui focus:ring-primary-ui'
            }
          `}
        />
        <div className="flex justify-between items-center mt-1">
          {validationErrors.description && (
            <p className="text-bodySmall text-error">{validationErrors.description}</p>
          )}
          <p className="text-caption text-gray-medium ml-auto">
            {description.length}/500
          </p>
        </div>
      </div>

      {/* Additional Options (DoorList-inspired horizontal pills) */}
      <div>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          Additional Options
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { label: 'Link', icon: '🔗' },
            { label: 'Photo Album', icon: '📷' },
            { label: 'Artist', icon: '🎤' },
            { label: 'Additional Info', icon: 'ℹ️' }
          ].map((option, index) => (
            <button
              key={index}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-border bg-white text-bodySmall text-neutral-black hover:bg-gray-light transition-colors whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 text-primary-ui" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <p className="text-caption text-gray-medium mt-2">
          Coming soon in future updates
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md text-bodySmall">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          disabled={loading || pendingSubmit}
          variant="secondary"
          size="large"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || pendingSubmit}
          variant="primary"
          size="large"
          className="flex-1"
        >
          {loading || pendingSubmit ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
})

export default EventForm

