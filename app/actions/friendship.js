// app/actions/friendship.js
// Server Actions for friendship-related operations
// These can be called from Client Components
// During development, uses mock functions. During integration, will use real functions.

'use server'

// TODO: During integration, replace with real functions:
// import { sendFriendRequest, acceptFriendRequest, denyFriendRequest, removeFriend, getFriends, getFriendRequests, getSentRequests, getPeopleYouMet, checkFriendshipStatus } from '@/lib/supabase/friendships'

// For now, use mock functions
import * as friendshipMocks from '@/lib/mocks/friendshipData'

/**
 * Send a friend request (Server Action wrapper)
 * @param {string} userId - Current user ID
 * @param {string} friendId - Target user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function sendFriendRequestAction(userId, friendId) {
  return await friendshipMocks.sendFriendRequest(userId, friendId)
}

/**
 * Accept a friend request (Server Action wrapper)
 * @param {string} userId - Current user ID
 * @param {string} friendId - User ID who sent the request
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function acceptFriendRequestAction(userId, friendId) {
  return await friendshipMocks.acceptFriendRequest(userId, friendId)
}

/**
 * Deny a friend request (Server Action wrapper)
 * @param {string} userId - Current user ID
 * @param {string} friendId - User ID who sent the request
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function denyFriendRequestAction(userId, friendId) {
  return await friendshipMocks.denyFriendRequest(userId, friendId)
}

/**
 * Remove a friend (Server Action wrapper)
 * @param {string} userId - Current user ID
 * @param {string} friendId - Friend user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function removeFriendAction(userId, friendId) {
  return await friendshipMocks.removeFriend(userId, friendId)
}

/**
 * Get user's friends list (Server Action wrapper)
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFriendsAction(userId) {
  return await friendshipMocks.getFriends(userId)
}

/**
 * Get incoming friend requests (Server Action wrapper)
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFriendRequestsAction(userId) {
  return await friendshipMocks.getFriendRequests(userId)
}

/**
 * Get sent friend requests (Server Action wrapper)
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getSentRequestsAction(userId) {
  return await friendshipMocks.getSentRequests(userId)
}

/**
 * Get people user might have met at events (Server Action wrapper)
 * @param {string} userId - User ID
 * @param {string|null} eventId - Optional event ID to filter by
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getPeopleYouMetAction(userId, eventId = null) {
  return await friendshipMocks.getPeopleYouMet(userId, eventId)
}

/**
 * Check friendship status between two users (Server Action wrapper)
 * @param {string} userId - Current user ID
 * @param {string} friendId - Other user ID
 * @returns {Promise<{data: {status: string}|null, error: object|null}>}
 */
export async function checkFriendshipStatusAction(userId, friendId) {
  return await friendshipMocks.checkFriendshipStatus(userId, friendId)
}

