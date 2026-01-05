// components/EventForm.js
// Reusable event form component with DoorList-inspired layout

'use client'

import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import DateTimePicker from '@/components/DateTimePicker'
import EventTypeSelector from '@/components/EventTypeSelector'
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function EventForm({
  fratId,
  userFraternities = [],
  onSubmit,
  onCancel,
  loading = false,
  error = null
}) {
  const [selectedFratId, setSelectedFratId] = useState(fratId || null)
  const [eventType, setEventType] = useState('')
  const [date, setDate] = useState('')
  const [endTime, setEndTime] = useState(null)
  const [visibility, setVisibility] = useState('public')
  const [description, setDescription] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // Set selected fraternity when fratId prop changes
  useEffect(() => {
    if (fratId) {
      setSelectedFratId(fratId)
    } else if (userFraternities.length === 1) {
      setSelectedFratId(userFraternities[0].id)
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

    // Event type validation
    if (!eventType) {
      errors.event_type = 'Event type is required'
    }

    // Date validation
    if (!date) {
      errors.date = 'Event date is required'
    } else {
      const eventDate = new Date(date)
      const now = new Date()
      // Allow today's date (set time to start of day for comparison)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      
      if (eventDateOnly < today) {
        errors.date = 'Event date must be today or in the future'
      }
    }

    // End time validation (if provided)
    if (endTime) {
      const startDate = new Date(date)
      const endDate = new Date(endTime)
      if (endDate <= startDate) {
        errors.end_time = 'End time must be after start time'
      }
    }

    // Visibility validation
    if (!visibility) {
      errors.visibility = 'Visibility is required'
    }

    // Description validation (optional, but check max length)
    if (description && description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

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
        date: date, // Already ISO 8601 TIMESTAMP from DateTimePicker
        end_time: endTime || null, // Already ISO 8601 TIMESTAMP from DateTimePicker
        event_type: eventType,
        visibility: visibility,
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

  // Handle end time change (uses same date as start)
  const handleEndTimeChange = (isoString) => {
    if (!date) {
      setValidationErrors({
        ...validationErrors,
        end_time: 'Please set start date first'
      })
      return
    }

    // DateTimePicker already returns ISO string, just set it
    setEndTime(isoString)
    if (validationErrors.end_time) {
      setValidationErrors({ ...validationErrors, end_time: null })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fraternity Selection (if multiple) */}
      {userFraternities.length > 1 && (
        <div>
          <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
            Fraternity <span className="text-error">*</span>
          </label>
          <select
            value={selectedFratId || ''}
            onChange={(e) => {
              setSelectedFratId(e.target.value)
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
            {userFraternities.map((frat) => (
              <option key={frat.id} value={frat.id}>
                {frat.name}
              </option>
            ))}
          </select>
          {validationErrors.frat_id && (
            <p className="text-bodySmall text-error mt-1">{validationErrors.frat_id}</p>
          )}
        </div>
      )}

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
                  baseDate={date}
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
}

