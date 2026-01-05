// lib/supabase/events.js
// Event management functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { randomUUID } from 'crypto'
import { generateQRCode } from '../qr/generator'
import { checkIsAdmin } from './groupMembers'
import { canCreateEvents } from './fraternities'

// Helper function to serialize Supabase errors to plain objects
// This ensures errors can be passed from Server Components to Client Components
function serializeError(error, defaultMessage = 'An unexpected error occurred') {
  if (!error) return { message: defaultMessage }
  return {
    message: error.message || defaultMessage,
    code: error.code || null,
    statusCode: error.statusCode || null,
    details: error.details || null,
    hint: error.hint || null,
  }
}

/**
 * Create a new event
 * @param {object} eventData - Event data
 * @param {string} eventData.frat_id - Fraternity ID (required)
 * @param {string} eventData.date - Event date/time as ISO 8601 TIMESTAMP (required)
 * @param {string} eventData.end_time - End time as ISO 8601 TIMESTAMP (optional)
 * @param {string} eventData.event_type - Event type: 'party', 'mixer', 'rush', 'invite-only' (required)
 * @param {string} eventData.visibility - Visibility: 'public', 'invite-only', 'rush-only' (required, default: 'public')
 * @param {string} eventData.description - Description (optional)
 * @param {string} eventData.image_url - Image URL (optional)
 * @param {string} eventData.timezone - User's timezone for validation (optional)
 * @param {string} creatorUserId - User ID creating the event
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEvent(eventData, creatorUserId) {
  try {
    const supabase = await createClient()

    // Authentication & Authorization
    if (!creatorUserId) {
      return { data: null, error: { message: 'User ID is required' } }
    }

    // Validate required fields
    if (!eventData.frat_id) {
      return { data: null, error: { message: 'Fraternity ID is required' } }
    }

    if (!eventData.date) {
      return { data: null, error: { message: 'Event date is required' } }
    }

    if (!eventData.event_type) {
      return { data: null, error: { message: 'Event type is required' } }
    }

    // Validate user is admin of the fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(creatorUserId, eventData.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can create events' } }
    }

    // Validate fraternity is verified
    const { data: canCreate, error: verifyError } = await canCreateEvents(eventData.frat_id)
    if (verifyError || !canCreate?.canCreate) {
      return {
        data: null,
        error: {
          message: canCreate?.reason || 'Fraternity must be verified to create events',
          membersNeeded: canCreate?.membersNeeded || 7,
          qualityMemberCount: canCreate?.qualityMemberCount || 0
        }
      }
    }

    // Validate frat_id is valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventData.frat_id)) {
      return { data: null, error: { message: 'Invalid fraternity ID format' } }
    }

    // Validate event_type
    const validEventTypes = ['party', 'mixer', 'rush', 'invite-only']
    if (!validEventTypes.includes(eventData.event_type)) {
      return { data: null, error: { message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` } }
    }

    // Validate visibility (default to 'public' if not provided)
    const validVisibility = ['public', 'invite-only', 'rush-only']
    const visibility = eventData.visibility || 'public'
    if (!validVisibility.includes(visibility)) {
      return { data: null, error: { message: `Invalid visibility. Must be one of: ${validVisibility.join(', ')}` } }
    }

    // Validate date is ISO 8601 TIMESTAMP
    let eventDate
    try {
      eventDate = new Date(eventData.date)
      if (isNaN(eventDate.getTime())) {
        return { data: null, error: { message: 'Invalid date format. Must be ISO 8601 TIMESTAMP' } }
      }
    } catch (e) {
      return { data: null, error: { message: 'Invalid date format. Must be ISO 8601 TIMESTAMP' } }
    }

    // Validate date is today or in the future
    // Allow events for today (same day), but prevent past dates
    const now = new Date()
    // Get start of today in UTC for comparison
    const todayStart = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z')
    // Get start of event date in UTC for comparison
    const eventDateStart = new Date(eventDate.toISOString().split('T')[0] + 'T00:00:00.000Z')
    
    // Allow today or future dates
    if (eventDateStart < todayStart) {
      return { data: null, error: { message: 'Event date must be today or in the future' } }
    }

    // Validate end_time if provided
    let endTime = null
    if (eventData.end_time) {
      try {
        endTime = new Date(eventData.end_time)
        if (isNaN(endTime.getTime())) {
          return { data: null, error: { message: 'Invalid end_time format. Must be ISO 8601 TIMESTAMP' } }
        }
        if (endTime <= eventDate) {
          return { data: null, error: { message: 'End time must be after start time' } }
        }
      } catch (e) {
        return { data: null, error: { message: 'Invalid end_time format. Must be ISO 8601 TIMESTAMP' } }
      }
    }

    // Validate description max length (500 characters)
    if (eventData.description && eventData.description.length > 500) {
      return { data: null, error: { message: 'Description must be 500 characters or less' } }
    }

    // Validate and normalize image_url if provided
    let imageUrl = null
    if (eventData.image_url) {
      try {
        // Trim whitespace
        const trimmedUrl = eventData.image_url.trim()
        if (trimmedUrl) {
          // Validate URL format
          new URL(trimmedUrl)
          imageUrl = trimmedUrl
        }
      } catch (e) {
        return { data: null, error: { message: 'Invalid image URL format' } }
      }
    }

    // Data Processing
    const eventId = randomUUID()
    const qrCode = generateQRCode(eventId)

    // Normalize fields
    const description = eventData.description ? eventData.description.trim() : null

    // Ensure end_time is null (not empty string) if not provided
    const endTimeValue = endTime ? endTime.toISOString() : null

    // Database Insert
    const insertData = {
      id: eventId,
      frat_id: eventData.frat_id,
      date: eventDate.toISOString(),
      end_time: endTimeValue,
      event_type: eventData.event_type,
      visibility: visibility,
      description: description || null,
      image_url: imageUrl,
      qr_code: qrCode
    }

    const { data: event, error: insertError } = await supabase
      .from('event')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      // Handle UNIQUE constraint violation on qr_code (shouldn't happen, but handle gracefully)
      if (insertError.code === '23505') {
        // Retry with new QR code (very unlikely)
        const retryQrCode = generateQRCode(eventId)
        insertData.qr_code = retryQrCode
        const { data: retryEvent, error: retryError } = await supabase
          .from('event')
          .insert(insertData)
          .select()
          .single()
        
        if (retryError) {
          return { data: null, error: serializeError(retryError, 'Failed to create event') }
        }
        return { data: retryEvent, error: null }
      }
      return { data: null, error: serializeError(insertError, 'Failed to create event') }
    }

    return { data: event, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create event' } }
  }
}

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getEvent(eventId) {
  try {
    const supabase = await createClient()

    const { data: event, error } = await supabase
      .from('event')
      .select(`
        id,
        frat_id,
        date,
        end_time,
        description,
        event_type,
        visibility,
        qr_code,
        image_url,
        created_at,
        updated_at,
        fraternity:frat_id (
          id,
          name,
          photo_url,
          type
        )
      `)
      .eq('id', eventId)
      .single()

    if (error) {
      // Not found is not an error, return null data
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      return { data: null, error: serializeError(error) }
    }

    // Format dates as ISO 8601 strings for frontend consumption
    if (event) {
      if (event.date) {
        event.date = new Date(event.date).toISOString()
      }
      if (event.end_time) {
        event.end_time = new Date(event.end_time).toISOString()
      }
      if (event.created_at) {
        event.created_at = new Date(event.created_at).toISOString()
      }
      if (event.updated_at) {
        event.updated_at = new Date(event.updated_at).toISOString()
      }
    }

    return { data: event, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get event' } }
  }
}

/**
 * Update event
 * @param {string} eventId - Event ID
 * @param {object} updates - Fields to update (partial)
 * @param {string} userId - User ID making the update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateEvent(eventId, updates, userId) {
  try {
    const supabase = await createClient()

    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } }
    }

    // Get event to check fraternity
    const { data: existingEvent, error: fetchError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', eventId)
      .single()

    if (fetchError || !existingEvent) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate user is admin of the event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(userId, existingEvent.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can update events' } }
    }

    // Build update object with only provided fields
    const updateData = {}

    // Field Validation (for updated fields only)
    if (updates.event_type !== undefined) {
      const validEventTypes = ['party', 'mixer', 'rush', 'invite-only']
      if (!validEventTypes.includes(updates.event_type)) {
        return { data: null, error: { message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` } }
      }
      updateData.event_type = updates.event_type
    }

    if (updates.visibility !== undefined) {
      const validVisibility = ['public', 'invite-only', 'rush-only']
      if (!validVisibility.includes(updates.visibility)) {
        return { data: null, error: { message: `Invalid visibility. Must be one of: ${validVisibility.join(', ')}` } }
      }
      updateData.visibility = updates.visibility
    }

    if (updates.date !== undefined) {
      try {
        const eventDate = new Date(updates.date)
        if (isNaN(eventDate.getTime())) {
          return { data: null, error: { message: 'Invalid date format. Must be ISO 8601 TIMESTAMP' } }
        }
        const now = new Date()
        if (eventDate < now) {
          return { data: null, error: { message: 'Event date must be today or in the future' } }
        }
        updateData.date = eventDate.toISOString()
      } catch (e) {
        return { data: null, error: { message: 'Invalid date format. Must be ISO 8601 TIMESTAMP' } }
      }
    }

    if (updates.end_time !== undefined) {
      if (updates.end_time === null) {
        updateData.end_time = null
      } else {
        try {
          const endTime = new Date(updates.end_time)
          if (isNaN(endTime.getTime())) {
            return { data: null, error: { message: 'Invalid end_time format. Must be ISO 8601 TIMESTAMP' } }
          }
          // Check if end_time is after date (use updated date if provided, otherwise existing date)
          const eventDate = updates.date ? new Date(updates.date) : new Date(existingEvent.date)
          if (endTime <= eventDate) {
            return { data: null, error: { message: 'End time must be after start time' } }
          }
          updateData.end_time = endTime.toISOString()
        } catch (e) {
          return { data: null, error: { message: 'Invalid end_time format. Must be ISO 8601 TIMESTAMP' } }
        }
      }
    }

    if (updates.description !== undefined) {
      if (updates.description === null || updates.description === '') {
        updateData.description = null
      } else {
        const trimmed = updates.description.trim()
        if (trimmed.length > 500) {
          return { data: null, error: { message: 'Description must be 500 characters or less' } }
        }
        updateData.description = trimmed || null
      }
    }

    if (updates.image_url !== undefined) {
      if (updates.image_url === null || updates.image_url === '') {
        updateData.image_url = null
      } else {
        try {
          const trimmedUrl = updates.image_url.trim()
          if (trimmedUrl) {
            // Validate URL format
            new URL(trimmedUrl)
            updateData.image_url = trimmedUrl
          } else {
            updateData.image_url = null
          }
        } catch (e) {
          return { data: null, error: { message: 'Invalid image URL format' } }
        }
      }
    }

    // If no fields to update, return existing event
    if (Object.keys(updateData).length === 0) {
      return await getEvent(eventId)
    }

    // Database Update
    const { data: updatedEvent, error: updateError } = await supabase
      .from('event')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError, 'Failed to update event') }
    }

    return { data: updatedEvent, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to update event' } }
  }
}

/**
 * Delete event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID making the delete
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function deleteEvent(eventId, userId) {
  try {
    const supabase = await createClient()

    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } }
    }

    // Get event to check fraternity
    const { data: existingEvent, error: fetchError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', eventId)
      .single()

    if (fetchError || !existingEvent) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate user is admin of the event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(userId, existingEvent.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can delete events' } }
    }

    // Delete event (cascades to event_requests, checkins via FK constraints)
    const { error: deleteError } = await supabase
      .from('event')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      return { data: null, error: serializeError(deleteError, 'Failed to delete event') }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to delete event' } }
  }
}

