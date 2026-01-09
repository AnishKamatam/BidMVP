// app/actions/friends.js
// Server Actions for friend-related operations
// These can be called from Client Components

'use server'

import { 
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriends,
  getFriendRequests,
  getFriendshipStatus,
  getPeopleYouMet,
  getFriendshipStatusesBatch,
  getFriendProfilesBatch
} from '@/lib/supabase/friendships'
import { createClient } from '@/lib/supabase/server'

/**
 * Send friend request (Server Action wrapper)
 * @param {string} friendId - Friend ID to send request to
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function sendFriendRequestAction(friendId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await sendFriendRequest(user.id, friendId)
}

/**
 * Accept friend request (Server Action wrapper)
 * @param {string} friendId - Friend ID who sent the request
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function acceptFriendRequestAction(friendId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await acceptFriendRequest(user.id, friendId)
}

/**
 * Decline friend request (Server Action wrapper)
 * @param {string} friendId - Friend ID who sent the request
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function declineFriendRequestAction(friendId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await declineFriendRequest(user.id, friendId)
}

/**
 * Cancel friend request (Server Action wrapper)
 * @param {string} friendId - Friend ID the request was sent to
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function cancelFriendRequestAction(friendId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await cancelFriendRequest(user.id, friendId)
}

/**
 * Remove friend (Server Action wrapper)
 * @param {string} friendId - Friend ID to remove
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function removeFriendAction(friendId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await removeFriend(user.id, friendId)
}

/**
 * Block user (Server Action wrapper)
 * @param {string} userId - User ID to block
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function blockUserAction(userId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await blockUser(user.id, userId)
}

/**
 * Unblock user (Server Action wrapper)
 * @param {string} userId - User ID to unblock
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function unblockUserAction(userId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await unblockUser(user.id, userId)
}

/**
 * Get friends list (Server Action wrapper)
 * @param {number} limit - Maximum number of friends to return (default: 50)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFriendsAction(limit = 50) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getFriends(user.id, limit)
}

/**
 * Get friend requests (Server Action wrapper)
 * @returns {Promise<{data: {sent: Array, received: Array}|null, error: object|null}>}
 */
export async function getFriendRequestsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getFriendRequests(user.id)
}

/**
 * Get sent friend requests only (Server Action wrapper)
 * Extracts sent requests from getFriendRequests
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getSentRequestsAction() {
  const result = await getFriendRequestsAction()
  if (result.error) {
    return result
  }
  return { data: result.data?.sent || [], error: null }
}

/**
 * Get friendship status (Server Action wrapper)
 * @param {string} otherUserId - Other user ID to check status with
 * @returns {Promise<{data: {status: string, friendship: object|null}|null, error: object|null}>}
 */
export async function getFriendshipStatusAction(otherUserId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getFriendshipStatus(user.id, otherUserId)
}

/**
 * Get people you might have met (Server Action wrapper)
 * @param {number} limit - Maximum number of suggestions (default: 20)
 * @param {boolean} includeCrossSchool - Include users from other schools (default: true)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getPeopleYouMetAction(limit = 20, includeCrossSchool = true) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getPeopleYouMet(user.id, limit, includeCrossSchool)
}

/**
 * Get friendship statuses for multiple users at once (Server Action wrapper)
 * Batch query for efficiency - reduces API calls when checking multiple users
 * @param {string[]} otherUserIds - Array of other user IDs to check status with
 * @returns {Promise<{data: Array<{otherUserId: string, status: string, friendship: object|null}>|null, error: object|null}>}
 */
export async function getFriendshipStatusesBatchAction(otherUserIds) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }

  // Validate input
  if (!Array.isArray(otherUserIds)) {
    return { data: null, error: { message: 'otherUserIds must be an array' } }
  }

  if (otherUserIds.length === 0) {
    return { data: [], error: null }
  }
  
  return await getFriendshipStatusesBatch(user.id, otherUserIds)
}

/**
 * Get user profiles for multiple user IDs efficiently (Server Action wrapper)
 * Batch query for efficiency - reduces API calls when loading multiple profiles
 * @param {string[]} userIds - Array of user IDs to fetch profiles for
 * @returns {Promise<{data: Array<{id: string, name: string, profile_pic: string, year: number, school: string}>|null, error: object|null}>}
 */
export async function getFriendProfilesBatchAction(userIds) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }

  // Validate input
  if (!Array.isArray(userIds)) {
    return { data: null, error: { message: 'userIds must be an array' } }
  }

  if (userIds.length === 0) {
    return { data: [], error: null }
  }
  
  return await getFriendProfilesBatch(userIds)
}

