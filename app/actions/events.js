// app/actions/events.js
// Server Actions for event management
// These wrap the backend functions and can be called from client components

'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadEventImage as uploadEventImageFile } from '@/lib/storage/upload'
import { randomUUID } from 'crypto'

/**
 * Get current user ID from auth context
 */
async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

/**
 * Create a new event
 * @param {object} eventData - Event data
 * @param {string} eventData.frat_id - Fraternity ID
 * @param {string} eventData.date - ISO 8601 TIMESTAMP (date + start_time combined)
 * @param {string|null} eventData.end_time - Optional, ISO 8601 TIMESTAMP (date + end_time combined)
 * @param {string} eventData.event_type - 'party' | 'mixer' | 'rush' | 'invite-only'
 * @param {string} eventData.visibility - 'public' | 'invite-only' | 'rush-only'
 * @param {string|null} eventData.description - Optional description
 * @param {string|null} eventData.image_url - Optional image URL
 * @param {string} eventData.timezone - User's timezone for validation
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEventAction(eventData) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { data: null, error: { message: 'Not authenticated' } }
    }

    const supabase = await createClient()

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

    if (!eventData.visibility) {
      return { data: null, error: { message: 'Visibility is required' } }
    }

    // Validate event_type
    const validEventTypes = ['party', 'mixer', 'rush', 'invite-only']
    if (!validEventTypes.includes(eventData.event_type)) {
      return { data: null, error: { message: 'Invalid event type' } }
    }

    // Validate visibility
    const validVisibility = ['public', 'invite-only', 'rush-only']
    if (!validVisibility.includes(eventData.visibility)) {
      return { data: null, error: { message: 'Invalid visibility setting' } }
    }

    // Validate date is in the future (using user's timezone)
    const eventDate = new Date(eventData.date)
    const now = new Date()
    if (eventDate <= now) {
      return { data: null, error: { message: 'Event date must be in the future' } }
    }

    // Validate end_time is after start_time if provided
    if (eventData.end_time) {
      const endDate = new Date(eventData.end_time)
      if (endDate <= eventDate) {
        return { data: null, error: { message: 'End time must be after start time' } }
      }
    }

    // Check if user is admin of the fraternity
    const { data: memberCheck, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', eventData.frat_id)
      .eq('user_id', userId)
      .single()

    if (memberError || !memberCheck || memberCheck.role !== 'admin') {
      return { data: null, error: { message: 'You must be an admin of this fraternity to create events' } }
    }

    // Generate unique event ID
    const eventId = randomUUID()

    // Generate QR code (simple UUID-based for now, can be enhanced later)
    const qrCode = `event:${eventId}`

    // Create event record
    const insertData = {
      id: eventId,
      frat_id: eventData.frat_id,
      date: eventData.date, // This is the start_time TIMESTAMP
      start_time: eventData.date, // Same as date (combined TIMESTAMP)
      end_time: eventData.end_time || null,
      event_type: eventData.event_type,
      visibility: eventData.visibility,
      description: eventData.description || null,
      image_url: eventData.image_url || null,
      qr_code: qrCode
    }

    const { data: event, error: eventError } = await supabase
      .from('event')
      .insert(insertData)
      .select()
      .single()

    if (eventError) {
      return { data: null, error: eventError }
    }

    return { data: event, error: null }
  } catch (error) {
    console.error('createEventAction error:', error)
    return {
      data: null,
      error: { message: error.message || 'Failed to create event' }
    }
  }
}

/**
 * Upload event illustration/image (Server Action wrapper)
 * @param {FormData} formData - FormData containing the file
 * @param {string} userId - User ID (required for temp upload during creation)
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadEventImageAction(formData, userId) {
  try {
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return { data: null, error: { message: 'No file provided' } }
    }

    if (!userId) {
      return { data: null, error: { message: 'User ID is required for event image upload' } }
    }

    return await uploadEventImageFile(userId, file)
  } catch (error) {
    console.error('uploadEventImageAction error:', error)
    return {
      data: null,
      error: { message: error.message || 'Failed to upload event image' }
    }
  }
}

