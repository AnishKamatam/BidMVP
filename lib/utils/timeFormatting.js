// lib/utils/timeFormatting.js
// Time formatting helper functions for displaying relative time
// Used across components for consistent time display

/**
 * Format time ago string (e.g., "2m ago", "1h ago", "3d ago")
 * @param {string} timestamp - ISO timestamp
 * @param {string} fallback - Fallback text if timestamp is invalid (default: 'Recently')
 * @returns {string} - Formatted time string
 */
export function formatTimeAgo(timestamp, fallback = 'Recently') {
  if (!timestamp) return fallback
  
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

/**
 * Format message time - shows time for today, relative time for recent, date for older
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted time string
 */
export function formatMessageTime(timestamp) {
  if (!timestamp) return ''
  
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  // Show time if today
  if (diffMins < 60 && diffDays < 1) {
    return then.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Show relative time for recent messages
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  // Show date for older messages
  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined
  })
}

