// app/actions/events.js
// Server Actions for event management
// These wrap the backend functions and can be called from client components

'use server'

import { createEvent, getEvent, updateEvent, deleteEvent, getCampusEvents } from '@/lib/supabase/events'
import { uploadEventImage } from '@/lib/storage/upload'
import { createClient } from '@/lib/supabase/server'

/**
 * Get current user ID from auth context
 */
async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

// ============================================
// Event CRUD Actions
// ============================================

/**
 * Create a new event
 * @param {object} eventData - Event data
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEventAction(eventData) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await createEvent(eventData, userId)
}

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getEventAction(eventId) {
  return await getEvent(eventId)
}

/**
 * Update event
 * @param {string} eventId - Event ID
 * @param {object} updates - Fields to update (partial)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateEventAction(eventId, updates) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await updateEvent(eventId, updates, userId)
}

/**
 * Delete event
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function deleteEventAction(eventId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await deleteEvent(eventId, userId)
}

// ============================================
// Event Image Upload Action
// ============================================

/**
 * Upload event image
 * @param {string} eventId - Event ID (optional, for existing events)
 * @param {FormData} formData - FormData containing the file
 * @param {string} userId - User ID (optional, will be fetched if not provided)
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadEventImageAction(eventId, formData, userId = null) {
  try {
    // Get current user ID if not provided
    if (!userId) {
      userId = await getCurrentUserId()
      if (!userId) {
        return { data: null, error: { message: 'Not authenticated' } }
      }
    }

    // Validate formData
    if (!formData) {
      return { data: null, error: { message: 'FormData is required' } }
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return { data: null, error: { message: 'No file provided' } }
    }

    return await uploadEventImage(eventId || null, file, userId)
  } catch (error) {
    console.error('uploadEventImageAction server action error:', error)
    return {
      data: null,
      error: {
        message: error.message || 'Failed to upload event image. Please try again.'
      }
    }
  }
}

// ============================================
// Event Feed Actions
// ============================================

/**
 * Get campus events for the current user
 * @param {object} filters - Filter options
 * @param {string | string[]} filters.event_type - Optional - filter by event type(s)
 * @param {string} filters.visibility - Optional - filter by visibility
 * @param {boolean} filters.rush_only - Optional - show only rush-only events
 * @param {number} filters.limit - Optional - limit results (default: 50)
 * @param {number} filters.offset - Optional - pagination offset
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getCampusEventsAction(filters = {}) {
  // Use existing getCurrentUserId helper function (already defined in this file)
  const userId = await getCurrentUserId()
  
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getCampusEvents(userId, filters)
}

