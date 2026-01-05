// app/actions/guests.js
// Server Actions for guest list and event request management
// These wrap the backend functions and can be called from client components

'use server'

import {
  createEventRequest,
  approveRequest,
  denyRequest,
  getEventRequests,
  manuallyAddGuest,
  getGuestList,
  searchUsers,
  getFraternityEvents,
} from '@/lib/supabase/guests'
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
// Event Request Actions
// ============================================

/**
 * Create a new event request
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEventRequestAction(eventId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await createEventRequest(eventId, userId)
}

/**
 * Approve an event request
 * @param {string} requestId - Request ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function approveRequestAction(requestId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await approveRequest(requestId, userId)
}

/**
 * Deny an event request
 * @param {string} requestId - Request ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function denyRequestAction(requestId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await denyRequest(requestId, userId)
}

/**
 * Get event requests
 * @param {string} eventId - Event ID
 * @param {string|null} status - Filter by status: 'pending', 'approved', 'denied', or null for all
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getEventRequestsAction(eventId, status = null) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getEventRequests(eventId, userId, status)
}

/**
 * Manually add a guest to an event
 * @param {string} eventId - Event ID
 * @param {string} userIdToAdd - User ID to add
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function manuallyAddGuestAction(eventId, userIdToAdd) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await manuallyAddGuest(eventId, userIdToAdd, userId)
}

/**
 * Get guest list for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getGuestListAction(eventId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getGuestList(eventId, userId)
}

/**
 * Search users by name or email
 * @param {string} query - Search query
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function searchUsersAction(query) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await searchUsers(query, userId)
}

/**
 * Get all events for a fraternity
 * @param {string} fraternityId - Fraternity ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFraternityEventsAction(fraternityId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getFraternityEvents(fraternityId, userId)
}

