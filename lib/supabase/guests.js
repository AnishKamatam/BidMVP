// lib/supabase/guests.js
// Guest list and event request management functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { checkIsAdmin } from './groupMembers'

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
 * Create a new event request for a user
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID requesting access
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEventRequest(eventId, userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userId) {
      return { data: null, error: { message: 'Event ID and User ID are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId)) {
      return { data: null, error: { message: 'Invalid ID format' } }
    }

    // Check if event exists and get visibility
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, visibility')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Can't request public events - only invite-only or rush-only
    if (event.visibility === 'public') {
      return { data: null, error: { message: 'Public events do not require requests' } }
    }

    // Check if user already has a request for this event
    const { data: existingRequest } = await supabase
      .from('event_requests')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingRequest) {
      return { data: null, error: { message: 'Request already exists for this event' } }
    }

    // Create the request
    const { data: request, error: insertError } = await supabase
      .from('event_requests')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError) }
    }

    return { data: request, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create event request' } }
  }
}

/**
 * Approve a pending event request
 * @param {string} requestId - Request ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function approveRequest(requestId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!requestId || !adminUserId) {
      return { data: null, error: { message: 'Request ID and Admin User ID are required' } }
    }

    // Get the request and event to check admin permissions
    const { data: request, error: requestError } = await supabase
      .from('event_requests')
      .select('event_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { data: null, error: { message: 'Request not found' } }
    }

    // Check if already approved/denied
    if (request.status !== 'pending') {
      return { data: null, error: { message: 'Request has already been processed' } }
    }

    // Get event to check fraternity
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', request.event_id)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate admin is admin of event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can approve requests' } }
    }

    // Update request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('event_requests')
      .update({
        status: 'approved',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError) }
    }

    return { data: updatedRequest, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to approve request' } }
  }
}

/**
 * Deny a pending event request
 * @param {string} requestId - Request ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function denyRequest(requestId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!requestId || !adminUserId) {
      return { data: null, error: { message: 'Request ID and Admin User ID are required' } }
    }

    // Get the request and event to check admin permissions
    const { data: request, error: requestError } = await supabase
      .from('event_requests')
      .select('event_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { data: null, error: { message: 'Request not found' } }
    }

    // Check if already approved/denied
    if (request.status !== 'pending') {
      return { data: null, error: { message: 'Request has already been processed' } }
    }

    // Get event to check fraternity
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', request.event_id)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate admin is admin of event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can deny requests' } }
    }

    // Update request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('event_requests')
      .update({
        status: 'denied',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError) }
    }

    return { data: updatedRequest, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to deny request' } }
  }
}

/**
 * Get all requests for an event (filtered by status if provided)
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID
 * @param {string|null} status - Filter by status: 'pending', 'approved', 'denied', or null for all
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getEventRequests(eventId, adminUserId, status = null) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !adminUserId) {
      return { data: null, error: { message: 'Event ID and Admin User ID are required' } }
    }

    // Get event to check fraternity
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate admin is admin of event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can view event requests' } }
    }

    // Build query - join with User table
    let query = supabase
      .from('event_requests')
      .select(`
        id,
        event_id,
        user_id,
        status,
        requested_at,
        responded_at,
        user:User!event_requests_user_id_fkey (
          id,
          name,
          email,
          profile_pic,
          year,
          safety_score
        )
      `)
      .eq('event_id', eventId)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Order by requested_at descending (newest first)
    query = query.order('requested_at', { ascending: false })

    const { data: requests, error: requestsError } = await query

    if (requestsError) {
      return { data: null, error: serializeError(requestsError) }
    }

    // Get safety tiers for all users in the requests
    if (requests && requests.length > 0) {
      const userIds = requests.map((r) => r.user_id).filter(Boolean)
      if (userIds.length > 0) {
        const { data: safetyTiers, error: tiersError } = await supabase
          .from('safetytier')
          .select('user_id, tier')
          .in('user_id', userIds)

        if (!tiersError && safetyTiers) {
          // Create a map of user_id to safety tier
          const tierMap = new Map(safetyTiers.map((st) => [st.user_id, st.tier]))

          // Add safety tier to each request (with score from User table)
          requests.forEach((request) => {
            const tier = tierMap.get(request.user_id)
            const score = request.user?.safety_score || null
            request.safety_tier = tier ? { tier, score } : null
          })
        } else {
          // If no safety tiers found, still try to include score from user
          requests.forEach((request) => {
            const score = request.user?.safety_score || null
            request.safety_tier = score !== null ? { tier: null, score } : null
          })
        }
      }
    }

    return { data: requests || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get event requests' } }
  }
}

/**
 * Manually add a user to guest list (creates approved request)
 * @param {string} eventId - Event ID
 * @param {string} userIdToAdd - User ID to add
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function manuallyAddGuest(eventId, userIdToAdd, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userIdToAdd || !adminUserId) {
      return { data: null, error: { message: 'Event ID, User ID to add, and Admin User ID are required' } }
    }

    // Get event to check fraternity
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate admin is admin of event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can manually add guests' } }
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userIdToAdd)
      .maybeSingle()

    if (userError || !user) {
      return { data: null, error: { message: 'User not found' } }
    }

    // Check if user is already on guest list
    const { data: existingRequest } = await supabase
      .from('event_requests')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userIdToAdd)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'approved') {
        return { data: null, error: { message: 'User is already on the guest list' } }
      }
      // If pending or denied, update to approved
      const { data: updatedRequest, error: updateError } = await supabase
        .from('event_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
        })
        .eq('id', existingRequest.id)
        .select()
        .single()

      if (updateError) {
        return { data: null, error: serializeError(updateError) }
      }

      return { data: updatedRequest, error: null }
    }

    // Create approved request
    const { data: request, error: insertError } = await supabase
      .from('event_requests')
      .insert({
        event_id: eventId,
        user_id: userIdToAdd,
        status: 'approved',
        requested_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError) }
    }

    return { data: request, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to manually add guest' } }
  }
}

/**
 * Get all approved guests for an event
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getGuestList(eventId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !adminUserId) {
      return { data: null, error: { message: 'Event ID and Admin User ID are required' } }
    }

    // Get event to check fraternity
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate admin is admin of event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can view guest list' } }
    }

    // Get approved requests with user info
    const { data: guests, error: guestsError } = await supabase
      .from('event_requests')
      .select(`
        id,
        event_id,
        user_id,
        status,
        requested_at,
        responded_at,
        user:User!event_requests_user_id_fkey (
          id,
          name,
          email,
          profile_pic,
          year,
          safety_score
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('requested_at', { ascending: true })

    if (guestsError) {
      return { data: null, error: serializeError(guestsError) }
    }

    // Get safety tiers for all guests
    if (guests && guests.length > 0) {
      const userIds = guests.map((g) => g.user_id).filter(Boolean)
      if (userIds.length > 0) {
        const { data: safetyTiers, error: tiersError } = await supabase
          .from('safetytier')
          .select('user_id, tier')
          .in('user_id', userIds)

        if (!tiersError && safetyTiers) {
          // Create a map of user_id to safety tier
          const tierMap = new Map(safetyTiers.map((st) => [st.user_id, st.tier]))

          // Add safety tier to each guest (with score from User table)
          guests.forEach((guest) => {
            const tier = tierMap.get(guest.user_id)
            const score = guest.user?.safety_score || null
            guest.safety_tier = tier ? { tier, score } : null
          })
        } else {
          // If no safety tiers found, still try to include score from user
          guests.forEach((guest) => {
            const score = guest.user?.safety_score || null
            guest.safety_tier = score !== null ? { tier: null, score } : null
          })
        }
      }
    }

    return { data: guests || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get guest list' } }
  }
}

/**
 * Search users by name or email for manual guest addition
 * @param {string} query - Search query (name or email)
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function searchUsers(query, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!query || !adminUserId) {
      return { data: null, error: { message: 'Query and Admin User ID are required' } }
    }

    // Validate admin is admin (any fraternity admin can search users)
    // Check if user is admin of any fraternity
    const { data: adminCheck } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .limit(1)

    // Also check if user is creator of any fraternity
    const { data: creatorCheck } = await supabase
      .from('fraternity')
      .select('id')
      .eq('creator_id', adminUserId)
      .limit(1)

    if ((!adminCheck || adminCheck.length === 0) && (!creatorCheck || creatorCheck.length === 0)) {
      return { data: null, error: { message: 'Only admins can search users' } }
    }

    // Search users by name or email
    const searchPattern = `%${query.trim()}%`
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, email, profile_pic, year')
      .or(`name.ilike.${searchPattern},email.ilike.${searchPattern}`)
      .limit(20)
      .order('name', { ascending: true })

    if (usersError) {
      return { data: null, error: serializeError(usersError) }
    }

    return { data: users || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to search users' } }
  }
}

/**
 * Get all events for a fraternity
 * @param {string} fraternityId - Fraternity ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFraternityEvents(fraternityId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!fraternityId || !adminUserId) {
      return { data: null, error: { message: 'Fraternity ID and Admin User ID are required' } }
    }

    // Validate admin is admin of the fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, fraternityId)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can view fraternity events' } }
    }

    // Get all events for the fraternity
    const { data: events, error: eventsError } = await supabase
      .from('event')
      .select('id, title, date, end_time, event_type, visibility, bid_price')
      .eq('frat_id', fraternityId)
      .order('date', { ascending: false })

    if (eventsError) {
      return { data: null, error: serializeError(eventsError) }
    }

    return { data: events || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get fraternity events' } }
  }
}

