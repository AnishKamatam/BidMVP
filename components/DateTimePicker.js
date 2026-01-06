// components/DateTimePicker.js
// Date and time selection component with support for combined date/time display

'use client'

import { useState, useRef, useEffect } from 'react'
import Input from '@/components/ui/Input'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function DateTimePicker({
  type = 'datetime', // 'date' | 'time' | 'datetime'
  value, // ISO date/time string
  onChange, // Function(value) - Called with ISO string
  label,
  required = false,
  error = null,
  minDate,
  maxDate,
  placeholder,
  displayFormat = 'pill', // 'pill' | 'input'
  showTime = true, // For datetime type
  baseDate = null // For time-only mode, the date to use when combining
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('')
  const pickerRef = useRef(null)

  // Parse value into date and time components
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        // Format date as YYYY-MM-DD for date input
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        setDateValue(`${year}-${month}-${day}`)

        // Format time as HH:MM for time input
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        setTimeValue(`${hours}:${minutes}`)
      }
    } else {
      setDateValue('')
      setTimeValue('')
    }
  }, [value])

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Get min date (today) if not provided
  const getMinDate = () => {
    if (minDate) return minDate
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Format date/time for display
  const formatDisplay = () => {
    if (!value) return placeholder || 'Select date and time'

    const date = new Date(value)
    if (isNaN(date.getTime())) return placeholder || 'Select date and time'

    if (type === 'time') {
      // Time only: "9:00 PM"
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    } else if (type === 'date') {
      // Date only: "Sun, Jan 4"
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } else {
      // Date + Time: "Sun, Jan 4 at 7:00 PM"
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  // Combine date and time into local timezone string (not UTC)
  // IMPORTANT: We store the time as the user entered it in their local timezone
  // Format: "YYYY-MM-DDTHH:MM:SS" (without timezone indicator)
  const combineDateTime = (dateStr, timeStr) => {
    if (type === 'time') {
      // For time-only mode, use baseDate
      if (!baseDate) return null
      if (!timeStr) return null
      const base = new Date(baseDate)
      const [hours, minutes] = timeStr.split(':').map(Number)
      // Set hours/minutes in local timezone
      base.setHours(hours || 0, minutes || 0, 0, 0)
      // Format as local time string (YYYY-MM-DDTHH:MM:SS)
      const year = base.getFullYear()
      const month = String(base.getMonth() + 1).padStart(2, '0')
      const day = String(base.getDate()).padStart(2, '0')
      const h = String(base.getHours()).padStart(2, '0')
      const m = String(base.getMinutes()).padStart(2, '0')
      const s = String(base.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${h}:${m}:${s}`
    }
    if (type === 'date') {
      // Date only - create at midnight local time
      if (!dateStr) return null
      // Return as local time string (YYYY-MM-DDTHH:MM:SS)
      return `${dateStr}T00:00:00`
    }
    // DateTime mode
    if (!dateStr) return null
    if (!timeStr) {
      // If no time, use midnight local time
      return `${dateStr}T00:00:00`
    }
    // Combine date and time - format as local time string
    // Format: "YYYY-MM-DDTHH:MM:SS" (no timezone conversion)
    const [hours, minutes] = timeStr.split(':').map(Number)
    const h = String(hours || 0).padStart(2, '0')
    const m = String(minutes || 0).padStart(2, '0')
    return `${dateStr}T${h}:${m}:00`
  }

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value
    setDateValue(newDate)
    const combined = combineDateTime(newDate, timeValue)
    if (combined) {
      onChange(combined)
    }
  }

  // Handle time change
  const handleTimeChange = (e) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    const combined = combineDateTime(dateValue, newTime)
    if (combined) {
      onChange(combined)
    }
  }

  // Handle pill button click
  const handlePillClick = () => {
    setIsOpen(!isOpen)
  }

  if (displayFormat === 'pill') {
    return (
      <div className="relative" ref={pickerRef}>
        <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
          {label} {required && <span className="text-error">*</span>}
        </label>
        <button
          type="button"
          onClick={handlePillClick}
          className={`
            w-full rounded-full border px-4 py-2.5 text-left text-bodySmall
            transition-all flex items-center justify-between
            ${error
              ? 'border-error bg-red-50'
              : 'border-gray-border bg-white hover:bg-gray-light'
            }
            ${required && !value ? 'border-primary-ui' : ''}
          `}
        >
          <span className={value ? 'text-neutral-black' : 'text-gray-medium'}>
            {formatDisplay()}
          </span>
          {type === 'time' ? (
            <ClockIcon className="w-5 h-5 text-gray-medium" />
          ) : (
            <CalendarIcon className="w-5 h-5 text-gray-medium" />
          )}
        </button>

        {/* Picker Modal */}
        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-border rounded-lg shadow-lg p-4 min-w-[280px]">
            {type !== 'time' && (
              <div className="mb-4">
                <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                  Date
                </label>
                <Input
                  type="date"
                  value={dateValue}
                  onChange={handleDateChange}
                  min={getMinDate()}
                  max={maxDate}
                />
              </div>
            )}
            {(type === 'time' || showTime) && (
              <div>
                <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                  Time
                </label>
                <Input
                  type="time"
                  value={timeValue}
                  onChange={handleTimeChange}
                />
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-primary-ui text-white rounded-md text-bodySmall hover:bg-[#2563EB] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-bodySmall text-error mt-1">{error}</p>
        )}
      </div>
    )
  }

  // Input format (for future use)
  return (
    <div>
      <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {type !== 'time' && (
        <Input
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          min={getMinDate()}
          max={maxDate}
          error={error}
          className="mb-2"
        />
      )}
      {(type === 'time' || showTime) && (
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          error={error}
        />
      )}
      {error && (
        <p className="text-bodySmall text-error mt-1">{error}</p>
      )}
    </div>
  )
}

