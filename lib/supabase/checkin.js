// lib/supabase/checkin.js
// Check-in and check-out functions for QR code check-in system
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { checkIsAdmin } from './groupMembers'

// Helper function to serialize Supabase errors to plain objects
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
 * Validate user QR code format and match event/user IDs
 * @param {string} qrCode - QR code string to validate
 * @param {string} eventId - Expected event ID
 * @param {string} userId - Expected user ID
 * @returns {{valid: boolean, error: string | null}}
 */
export async function validateUserQRCode(qrCode, eventId, userId) {
  if (!qrCode || !eventId || !userId) {
    return { valid: false, error: 'QR code, event ID, and user ID are required' }
  }

  // QR code format: user-${userId}-${eventId}
  const expectedFormat = `user-${userId}-${eventId}`
  
  if (qrCode !== expectedFormat) {
    // Try to extract IDs from QR code to provide better error message
    const match = qrCode.match(/^user-(.+?)-(.+)$/)
    if (!match) {
      return { valid: false, error: 'Invalid QR code format. Expected: user-{userId}-{eventId}' }
    }
    
    const [, extractedUserId, extractedEventId] = match
    if (extractedUserId !== userId) {
      return { valid: false, error: 'QR code does not match user' }
    }
    if (extractedEventId !== eventId) {
      return { valid: false, error: 'QR code does not match event' }
    }
    
    return { valid: false, error: 'QR code validation failed' }
  }

  return { valid: true, error: null }
}

/**
 * Check a user into an event via QR code scan
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to check in
 * @param {string} qrCode - Scanned QR code string
 * @param {string} adminUserId - Admin user ID performing check-in
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function checkInUser(eventId, userId, qrCode, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userId || !qrCode || !adminUserId) {
      return { data: null, error: { message: 'All parameters are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId) || !uuidRegex.test(adminUserId)) {
      return { data: null, error: { message: 'Invalid ID format' } }
    }

    // Validate QR code format
    const qrValidation = await validateUserQRCode(qrCode, eventId, userId)
    if (!qrValidation.valid) {
      return { data: null, error: { message: qrValidation.error } }
    }

    // Verify event exists and get fraternity ID
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Verify admin is admin of event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can check users in/out' } }
    }

    // Check user has approved event_request for this event
    const { data: request, error: requestError } = await supabase
      .from('event_requests')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()

    if (requestError) {
      return { data: null, error: serializeError(requestError) }
    }

    if (!request) {
      return { data: null, error: { message: 'User is not approved for this event' } }
    }

    // Check user is not already checked in
    const { data: existingCheckin, error: checkinError } = await supabase
      .from('checkin')
      .select('id, is_checked_in')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_checked_in', true)
      .maybeSingle()

    if (checkinError) {
      return { data: null, error: serializeError(checkinError) }
    }

    if (existingCheckin) {
      return { data: null, error: { message: 'User is already checked in' } }
    }

    // Create checkin record
    const { data: checkin, error: insertError } = await supabase
      .from('checkin')
      .insert({
        event_id: eventId,
        user_id: userId,
        checked_in_at: new Date().toISOString(),
        is_checked_in: true,
        entry_method: 'qr_scan'
      })
      .select(`
        *,
        user:User!checkin_user_id_fkey (
          id,
          name,
          email,
          profile_pic,
          year,
          gender
        )
      `)
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError) }
    }

    return { data: checkin, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check in user' } }
  }
}

/**
 * Check a user out of an event (used by both automatic and manual check-out)
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to check out
 * @param {string|null} adminUserId - Admin user ID performing check-out (null for automatic check-out)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function checkOutUser(eventId, userId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs (eventId, userId required; adminUserId optional)
    if (!eventId || !userId) {
      return { data: null, error: { message: 'Event ID and User ID are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId)) {
      return { data: null, error: { message: 'Invalid ID format' } }
    }

    // If adminUserId provided, verify admin permissions (for manual check-out)
    if (adminUserId) {
      if (!uuidRegex.test(adminUserId)) {
        return { data: null, error: { message: 'Invalid admin user ID format' } }
      }

      // Get event to check fraternity
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('id, frat_id')
        .eq('id', eventId)
        .single()

      if (eventError || !event) {
        return { data: null, error: { message: 'Event not found' } }
      }

      // Verify admin permissions
      const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
      if (adminError || !adminCheck?.isAdmin) {
        return { data: null, error: { message: 'Only admins can check users out' } }
      }
    }

    // Find existing checkin record
    const { data: checkin, error: findError } = await supabase
      .from('checkin')
      .select('id, is_checked_in')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (findError) {
      return { data: null, error: serializeError(findError) }
    }

    if (!checkin) {
      return { data: null, error: { message: 'Check-in record not found' } }
    }

    if (!checkin.is_checked_in) {
      return { data: null, error: { message: 'User is not currently checked in' } }
    }

    // Update checkin record
    const { data: updatedCheckin, error: updateError } = await supabase
      .from('checkin')
      .update({
        is_checked_in: false,
        checked_out_at: new Date().toISOString()
      })
      .eq('id', checkin.id)
      .select(`
        *,
        user:User!checkin_user_id_fkey (
          id,
          name,
          email,
          profile_pic,
          year,
          gender
        )
      `)
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError) }
    }

    return { data: updatedCheckin, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check out user' } }
  }
}

/**
 * Get all users currently checked into an event
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getCheckedInUsers(eventId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !adminUserId) {
      return { data: null, error: { message: 'Event ID and Admin User ID are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventId) || !uuidRegex.test(adminUserId)) {
      return { data: null, error: { message: 'Invalid ID format' } }
    }

    // Get event to check fraternity
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Verify admin permissions
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can view check-in list' } }
    }

    // Query checkin table
    const { data: checkins, error: queryError } = await supabase
      .from('checkin')
      .select(`
        *,
        user:User!checkin_user_id_fkey (
          id,
          name,
          email,
          profile_pic,
          year,
          gender
        )
      `)
      .eq('event_id', eventId)
      .eq('is_checked_in', true)
      .order('checked_in_at', { ascending: false })

    if (queryError) {
      return { data: null, error: serializeError(queryError) }
    }

    return { data: checkins || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get checked-in users' } }
  }
}

/**
 * Check if a user is currently checked into an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<{data: boolean, error: object|null}>}
 */
export async function isUserCheckedIn(eventId, userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userId) {
      return { data: false, error: { message: 'Event ID and User ID are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId)) {
      return { data: false, error: { message: 'Invalid ID format' } }
    }

    // Query checkin table
    const { data: checkin, error: queryError } = await supabase
      .from('checkin')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_checked_in', true)
      .maybeSingle()

    if (queryError) {
      return { data: false, error: serializeError(queryError) }
    }

    return { data: !!checkin, error: null }
  } catch (error) {
    return { data: false, error: { message: error.message || 'Failed to check user status' } }
  }
}

