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
  getPeopleYouMet
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
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getPeopleYouMetAction(limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getPeopleYouMet(user.id, limit)
}

