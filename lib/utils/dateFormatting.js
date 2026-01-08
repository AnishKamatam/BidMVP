// lib/utils/dateFormatting.js
// Date/time formatting helper functions for displaying event dates
// Events are stored as local time strings (YYYY-MM-DDTHH:MM:SS)

/**
 * Format event date for display
 * Parses local time string and formats as "Dec 25, 2024 at 8:00 PM"
 * @param {string} dateString - Local time string (YYYY-MM-DDTHH:MM:SS)
 * @returns {string} Formatted date string
 */
export function formatEventDate(dateString) {
  if (!dateString) return 'Date TBD'
  
  // Parse as local time (no timezone conversion)
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  // Format as "Dec 25, 2024 at 8:00 PM"
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  return `${datePart} at ${timePart}`
}

/**
 * Format event date (date only, no time)
 * @param {string} dateString - Local time string (YYYY-MM-DDTHH:MM:SS)
 * @returns {string} Formatted date string (e.g., "Dec 25, 2024")
 */
export function formatEventDateOnly(dateString) {
  if (!dateString) return 'Date TBD'
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format event time only
 * @param {string} dateString - Local time string (YYYY-MM-DDTHH:MM:SS)
 * @returns {string} Formatted time string (e.g., "8:00 PM")
 */
export function formatEventTime(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return ''
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format event date range (start and end time)
 * @param {string} startDate - Start date string (YYYY-MM-DDTHH:MM:SS)
 * @param {string} endDate - End date string (YYYY-MM-DDTHH:MM:SS) or null
 * @returns {string} Formatted date range string
 */
export function formatEventDateRange(startDate, endDate) {
  if (!startDate) return 'Date TBD'
  
  const start = new Date(startDate)
  if (isNaN(start.getTime())) {
    return 'Invalid date'
  }
  
  const datePart = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  if (!endDate) {
    return `${datePart} at ${startTime}`
  }
  
  const end = new Date(endDate)
  if (isNaN(end.getTime())) {
    return `${datePart} at ${startTime}`
  }
  
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  return `${datePart} from ${startTime} to ${endTime}`
}

