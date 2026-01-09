// lib/supabase/friendships.js
// Friendship management functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'

// Simple UUID v4 generator (works in server context)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

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
 * Send a friend request
 * @param {string} userId - User ID of sender
 * @param {string} friendId - User ID of recipient
 * @returns {Promise<{data: {friendship: object, success: boolean}|null, error: object|null}>}
 */
export async function sendFriendRequest(userId, friendId) {
  try {
    const supabase = await createClient()

    // Validation: Cannot send request to yourself
    if (userId === friendId) {
      return { data: null, error: { message: 'Cannot send friend request to yourself' } }
    }

    // Check if friendship already exists (either direction)
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friendship')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle()

    if (checkError) {
      return { data: null, error: serializeError(checkError, 'Failed to check existing friendship') }
    }

    // If friendship exists, handle different statuses
    if (existingFriendship) {
      if (existingFriendship.status === 'blocked') {
        return { data: null, error: { message: 'Cannot send request to blocked user' } }
      }
      if (existingFriendship.status === 'pending') {
        // Return existing pending request (don't create duplicate)
        return { 
          data: { 
            friendship: existingFriendship, 
            success: true 
          }, 
          error: null 
        }
      }
      if (existingFriendship.status === 'accepted') {
        return { data: null, error: { message: 'You are already friends with this user' } }
      }
    }

    // Create new friend request
    // Generate UUID for id if table requires it (some schemas have id without default)
    const friendshipId = generateUUID()
    const { data: friendship, error: insertError } = await supabase
      .from('friendship')
      .insert({
        id: friendshipId,
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError, 'Failed to send friend request') }
    }

    return { data: { friendship, success: true }, error: null }
  } catch (error) {
    console.error('sendFriendRequest error:', error)
    return { data: null, error: serializeError(error, 'Failed to send friend request') }
  }
}

/**
 * Accept a friend request
 * @param {string} userId - User ID of recipient (the one accepting)
 * @param {string} friendId - User ID of sender (the one who sent the request)
 * @returns {Promise<{data: {friendship: object, success: boolean}|null, error: object|null}>}
 */
export async function acceptFriendRequest(userId, friendId) {
  try {
    const supabase = await createClient()

    // Find the friendship where friendId is sender and userId is recipient
    const { data: friendship, error: findError } = await supabase
      .from('friendship')
      .select('*')
      .eq('user_id', friendId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .single()

    if (findError || !friendship) {
      return { data: null, error: { message: 'No pending request found' } }
    }

    // Update status to accepted
    const { data: updatedFriendship, error: updateError } = await supabase
      .from('friendship')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', friendship.id)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError, 'Failed to accept friend request') }
    }

    return { data: { friendship: updatedFriendship, success: true }, error: null }
  } catch (error) {
    console.error('acceptFriendRequest error:', error)
    return { data: null, error: serializeError(error, 'Failed to accept friend request') }
  }
}

/**
 * Decline a friend request
 * @param {string} userId - User ID of recipient (the one declining)
 * @param {string} friendId - User ID of sender (the one who sent the request)
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function declineFriendRequest(userId, friendId) {
  try {
    const supabase = await createClient()

    // Find the friendship where friendId is sender and userId is recipient
    const { data: friendship, error: findError } = await supabase
      .from('friendship')
      .select('id')
      .eq('user_id', friendId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .single()

    if (findError || !friendship) {
      return { data: null, error: { message: 'No pending request found' } }
    }

    // Delete the friendship record
    const { error: deleteError } = await supabase
      .from('friendship')
      .delete()
      .eq('id', friendship.id)

    if (deleteError) {
      return { data: null, error: serializeError(deleteError, 'Failed to decline friend request') }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('declineFriendRequest error:', error)
    return { data: null, error: serializeError(error, 'Failed to decline friend request') }
  }
}

/**
 * Cancel a friend request (sender cancels their own request)
 * @param {string} userId - User ID of sender (the one canceling)
 * @param {string} friendId - User ID of recipient
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function cancelFriendRequest(userId, friendId) {
  try {
    const supabase = await createClient()

    // Find the friendship where userId is sender and friendId is recipient
    const { data: friendship, error: findError } = await supabase
      .from('friendship')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .eq('status', 'pending')
      .single()

    if (findError || !friendship) {
      return { data: null, error: { message: 'No pending request found' } }
    }

    // Delete the friendship record
    const { error: deleteError } = await supabase
      .from('friendship')
      .delete()
      .eq('id', friendship.id)

    if (deleteError) {
      return { data: null, error: serializeError(deleteError, 'Failed to cancel friend request') }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('cancelFriendRequest error:', error)
    return { data: null, error: serializeError(error, 'Failed to cancel friend request') }
  }
}

/**
 * Remove a friend (either party can remove)
 * @param {string} userId - User ID of requester
 * @param {string} friendId - User ID of friend to remove
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function removeFriend(userId, friendId) {
  try {
    const supabase = await createClient()

    // Find the friendship (either direction)
    const { data: friendship, error: findError } = await supabase
      .from('friendship')
      .select('id')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .eq('status', 'accepted')
      .single()

    if (findError || !friendship) {
      return { data: null, error: { message: 'Friendship not found' } }
    }

    // Delete the friendship record
    const { error: deleteError } = await supabase
      .from('friendship')
      .delete()
      .eq('id', friendship.id)

    if (deleteError) {
      return { data: null, error: serializeError(deleteError, 'Failed to remove friend') }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('removeFriend error:', error)
    return { data: null, error: serializeError(error, 'Failed to remove friend') }
  }
}

/**
 * Block a user
 * @param {string} userId - User ID of blocker
 * @param {string} blockedUserId - User ID to block
 * @returns {Promise<{data: {friendship: object, success: boolean}|null, error: object|null}>}
 */
export async function blockUser(userId, blockedUserId) {
  try {
    const supabase = await createClient()

    // Validation: Cannot block yourself
    if (userId === blockedUserId) {
      return { data: null, error: { message: 'Cannot block yourself' } }
    }

    // Check if friendship exists
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friendship')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${blockedUserId}),and(user_id.eq.${blockedUserId},friend_id.eq.${userId})`)
      .maybeSingle()

    if (checkError) {
      return { data: null, error: serializeError(checkError, 'Failed to check existing friendship') }
    }

    let friendship

    if (existingFriendship) {
      // Update existing friendship to blocked
      // Ensure user_id is the blocker
      const updateData = {
        user_id: userId,
        friend_id: blockedUserId,
        status: 'blocked',
        updated_at: new Date().toISOString()
      }

      const { data: updated, error: updateError } = await supabase
        .from('friendship')
        .update(updateData)
        .eq('id', existingFriendship.id)
        .select()
        .single()

      if (updateError) {
        return { data: null, error: serializeError(updateError, 'Failed to block user') }
      }

      friendship = updated
    } else {
      // Create new blocked friendship
      const { data: created, error: insertError } = await supabase
        .from('friendship')
        .insert({
          user_id: userId,
          friend_id: blockedUserId,
          status: 'blocked',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        return { data: null, error: serializeError(insertError, 'Failed to block user') }
      }

      friendship = created
    }

    return { data: { friendship, success: true }, error: null }
  } catch (error) {
    console.error('blockUser error:', error)
    return { data: null, error: serializeError(error, 'Failed to block user') }
  }
}

/**
 * Unblock a user
 * @param {string} userId - User ID of blocker
 * @param {string} blockedUserId - User ID to unblock
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function unblockUser(userId, blockedUserId) {
  try {
    const supabase = await createClient()

    // Find the blocked friendship where userId is the blocker
    const { data: friendship, error: findError } = await supabase
      .from('friendship')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', blockedUserId)
      .eq('status', 'blocked')
      .single()

    if (findError || !friendship) {
      return { data: null, error: { message: 'Blocked relationship not found' } }
    }

    // Delete the friendship record
    const { error: deleteError } = await supabase
      .from('friendship')
      .delete()
      .eq('id', friendship.id)

    if (deleteError) {
      return { data: null, error: serializeError(deleteError, 'Failed to unblock user') }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('unblockUser error:', error)
    return { data: null, error: serializeError(error, 'Failed to unblock user') }
  }
}

/**
 * Get all accepted friends for a user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of friends to return (default: 50)
 * @returns {Promise<{data: Array<{friend: object, friendship: object}>|null, error: object|null}>}
 */
export async function getFriends(userId, limit = 50) {
  try {
    const supabase = await createClient()

    // Get friendships where userId is either user_id or friend_id and status is accepted
    const { data: friendships, error: fetchError } = await supabase
      .from('friendship')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')
      .limit(limit)

    if (fetchError) {
      return { data: null, error: serializeError(fetchError, 'Failed to get friends') }
    }

    if (!friendships || friendships.length === 0) {
      return { data: [], error: null }
    }

    // Get all friend IDs
    const friendIds = friendships.map(friendship => 
      friendship.user_id === userId ? friendship.friend_id : friendship.user_id
    )

    // Fetch user profiles for all friends
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, profile_pic, year, school')
      .in('id', friendIds)

    if (usersError) {
      return { data: null, error: serializeError(usersError, 'Failed to get friend profiles') }
    }

    // Create a map of user ID to user object
    const usersMap = new Map()
    users?.forEach(user => {
      usersMap.set(user.id, user)
    })

    // Transform the data to return friend info with friendship metadata
    const friends = friendships.map(friendship => {
      const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      const friend = usersMap.get(friendId) || {
        id: friendId,
        name: null,
        profile_pic: null,
        year: null,
        school: null
      }
      
      return {
        friend: {
          id: friend.id,
          name: friend.name,
          profile_pic: friend.profile_pic,
          year: friend.year,
          school: friend.school
        },
        friendship: {
          id: friendship.id,
          created_at: friendship.created_at,
          updated_at: friendship.updated_at
        }
      }
    })

    return { data: friends, error: null }
  } catch (error) {
    console.error('getFriends error:', error)
    return { data: null, error: serializeError(error, 'Failed to get friends') }
  }
}

/**
 * Get pending friend requests (both sent and received)
 * @param {string} userId - User ID
 * @returns {Promise<{data: {sent: Array, received: Array}|null, error: object|null}>}
 */
export async function getFriendRequests(userId) {
  try {
    const supabase = await createClient()

    // Get all pending friendships involving this user
    const { data: friendships, error: fetchError } = await supabase
      .from('friendship')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'pending')

    if (fetchError) {
      return { data: null, error: serializeError(fetchError, 'Failed to get friend requests') }
    }

    if (!friendships || friendships.length === 0) {
      return { data: { sent: [], received: [] }, error: null }
    }

    // Get all user IDs involved
    const userIds = new Set()
    friendships.forEach(friendship => {
      if (friendship.user_id !== userId) userIds.add(friendship.user_id)
      if (friendship.friend_id !== userId) userIds.add(friendship.friend_id)
    })

    // Fetch user profiles
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, profile_pic, year, school')
      .in('id', Array.from(userIds))

    if (usersError) {
      return { data: null, error: serializeError(usersError, 'Failed to get user profiles') }
    }

    // Create a map of user ID to user object
    const usersMap = new Map()
    users?.forEach(user => {
      usersMap.set(user.id, user)
    })

    // Separate into sent and received
    const sent = []
    const received = []

    friendships.forEach(friendship => {
      const otherUserId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      const otherUser = usersMap.get(otherUserId) || {
        id: otherUserId,
        name: null,
        profile_pic: null,
        year: null,
        school: null
      }

      const requestData = {
        id: friendship.id,
        created_at: friendship.created_at,
        updated_at: friendship.updated_at,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          profile_pic: otherUser.profile_pic,
          year: otherUser.year,
          school: otherUser.school
        }
      }

      if (friendship.user_id === userId) {
        // User sent the request
        sent.push(requestData)
      } else {
        // User received the request
        received.push(requestData)
      }
    })

    return { data: { sent, received }, error: null }
  } catch (error) {
    console.error('getFriendRequests error:', error)
    return { data: null, error: serializeError(error, 'Failed to get friend requests') }
  }
}

/**
 * Get friendship status between two users
 * @param {string} userId - User ID of requester
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<{data: {status: string, friendship: object|null}|null, error: object|null}>}
 */
export async function getFriendshipStatus(userId, otherUserId) {
  try {
    const supabase = await createClient()

    // Find friendship in either direction
    const { data: friendship, error: findError } = await supabase
      .from('friendship')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${userId})`)
      .maybeSingle()

    if (findError) {
      return { data: null, error: serializeError(findError, 'Failed to get friendship status') }
    }

    if (!friendship) {
      return { data: { status: 'none', friendship: null }, error: null }
    }

    // Determine status based on friendship direction
    let status
    if (friendship.status === 'accepted') {
      status = 'accepted'
    } else if (friendship.status === 'blocked') {
      status = 'blocked'
    } else if (friendship.status === 'pending') {
      // Determine if it was sent or received
      status = friendship.user_id === userId ? 'pending_sent' : 'pending_received'
    } else {
      status = 'none'
    }

    return { data: { status, friendship }, error: null }
  } catch (error) {
    console.error('getFriendshipStatus error:', error)
    return { data: null, error: serializeError(error, 'Failed to get friendship status') }
  }
}

/**
 * Get people you might have met (based on shared events)
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of suggestions (default: 20)
 * @param {boolean} includeCrossSchool - Include users from other schools (default: true). If false, only shows same-school users.
 * @returns {Promise<{data: Array<{user: object, sharedEvents: number, lastEventDate: string}>|null, error: object|null}>}
 */
export async function getPeopleYouMet(userId, limit = 20, includeCrossSchool = true) {
  try {
    const supabase = await createClient()

    // Get user's school_id for filtering
    const { data: userProfile, error: userError } = await supabase
      .from('User')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return { data: null, error: serializeError(userError, 'Failed to get user profile') }
    }

    const userSchoolId = userProfile?.school_id || null

    // Try to use the database function if it exists, otherwise fall back to query
    const { data: functionResults, error: functionError } = await supabase
      .rpc('get_people_you_met', { 
        p_user_id: userId, 
        p_limit: limit,
        p_user_school_id: userSchoolId,
        p_include_cross_school: includeCrossSchool
      })

    if (!functionError && functionResults) {
      // Transform function results to match expected format
      const suggestions = functionResults.map(result => ({
        user: {
          id: result.user_id,
          name: result.name,
          profile_pic: result.profile_pic,
          year: result.year
        },
        sharedEvents: result.shared_events_count,
        lastEventDate: result.last_event_date,
        isSameSchool: result.is_same_school || false
      }))

      return { data: suggestions, error: null }
    }

    // Fallback: Use direct query if function doesn't exist
    // This improved version includes same-school users even without events
    // Get all existing friendships to exclude
    const { data: friendships, error: friendshipError } = await supabase
      .from('friendship')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (friendshipError) {
      return { data: null, error: serializeError(friendshipError, 'Failed to get friendships') }
    }

    const excludedUserIds = new Set()
    excludedUserIds.add(userId) // Exclude self
    friendships?.forEach(f => {
      if (f.user_id === userId) excludedUserIds.add(f.friend_id)
      if (f.friend_id === userId) excludedUserIds.add(f.user_id)
    })

    // Get users from same school (if user has a school)
    let sameSchoolUsers = []
    if (userSchoolId) {
      const { data: sameSchool, error: sameSchoolError } = await supabase
        .from('User')
        .select('id, name, profile_pic, year, school_id')
        .eq('school_id', userSchoolId)
        .neq('id', userId)

      if (sameSchoolError) {
        console.warn('Failed to get same-school users:', sameSchoolError)
      } else {
        // Filter out excluded users in JavaScript (simpler than complex SQL)
        sameSchoolUsers = (sameSchool || []).filter(user => !excludedUserIds.has(user.id))
      }
    }

    // Get event-based suggestions (users who attended same events)
    const { data: userCheckins, error: checkinError } = await supabase
      .from('checkin')
      .select('event_id')
      .eq('user_id', userId)
      .or('is_checked_in.eq.true,checked_out_at.is.null')

    let eventBasedUserIds = new Set()
    let userEventMap = new Map()

    if (!checkinError && userCheckins && userCheckins.length > 0) {
      const eventIds = userCheckins.map(c => c.event_id)

      // Find other users who checked into same events
      const { data: otherCheckins, error: otherError } = await supabase
        .from('checkin')
        .select('user_id, event_id')
        .in('event_id', eventIds)
        .neq('user_id', userId)
        .or('is_checked_in.eq.true,checked_out_at.is.null')

      if (!otherError && otherCheckins) {
        // Group by user_id and count shared events
        otherCheckins.forEach(checkin => {
          if (!excludedUserIds.has(checkin.user_id)) {
            eventBasedUserIds.add(checkin.user_id)
            if (!userEventMap.has(checkin.user_id)) {
              userEventMap.set(checkin.user_id, {
                userId: checkin.user_id,
                eventIds: new Set()
              })
            }
            const userData = userEventMap.get(checkin.user_id)
            userData.eventIds.add(checkin.event_id)
          }
        })
      }
    }

    // Get user profiles for event-based users
    let eventBasedUsers = []
    if (eventBasedUserIds.size > 0) {
      const eventBasedIdsArray = Array.from(eventBasedUserIds)
      const { data: users, error: usersError } = await supabase
        .from('User')
        .select('id, name, profile_pic, year, school_id')
        .in('id', eventBasedIdsArray)

      if (usersError) {
        console.warn('Failed to get event-based users:', usersError)
      } else {
        // Filter by school if includeCrossSchool is false
        eventBasedUsers = includeCrossSchool 
          ? (users || [])
          : (users || []).filter(user => user.school_id === userSchoolId)
      }
    }

    // Combine and deduplicate: merge same-school users with event-based users
    // Prefer event-based data when user appears in both (has event counts)
    const allUserIds = new Set()
    const suggestionsMap = new Map()

    // Add same-school users first
    sameSchoolUsers.forEach(user => {
      allUserIds.add(user.id)
      suggestionsMap.set(user.id, {
        user: {
          id: user.id,
          name: user.name,
          profile_pic: user.profile_pic,
          year: user.year
        },
        sharedEvents: 0,
        lastEventDate: null,
        isSameSchool: true
      })
    })

    // Add/update with event-based users (this overwrites same-school entries with event data)
    eventBasedUsers.forEach(user => {
      allUserIds.add(user.id)
      const userData = userEventMap.get(user.id)
      const isSameSchool = userSchoolId && user.school_id === userSchoolId
      suggestionsMap.set(user.id, {
        user: {
          id: user.id,
          name: user.name,
          profile_pic: user.profile_pic,
          year: user.year
        },
        sharedEvents: userData?.eventIds.size || 0,
        lastEventDate: null,
        isSameSchool: isSameSchool
      })
    })

    // Convert to array and sort
    const suggestions = Array.from(suggestionsMap.values())
      .sort((a, b) => {
        // Prioritize same-school users, then by shared events count
        if (a.isSameSchool !== b.isSameSchool) {
          return b.isSameSchool ? 1 : -1 // Same-school users first
        }
        // Secondary sort: by shared events count (desc)
        return b.sharedEvents - a.sharedEvents
      })
      .slice(0, limit)

    return { data: suggestions, error: null }
  } catch (error) {
    console.error('getPeopleYouMet error:', error)
    return { data: null, error: serializeError(error, 'Failed to get people you met') }
  }
}

/**
 * Check privacy settings (simplified for MVP - always allows)
 * @param {string} userId - User ID to check settings for
 * @param {string} requesterId - User ID making the request
 * @param {string} action - Action being requested ('send_friend_request', 'view_profile', 'see_suggestions')
 * @returns {Promise<{data: {allowed: boolean, reason: string|null}|null, error: object|null}>}
 */
export async function checkPrivacySettings(userId, requesterId, action) {
  try {
    // For MVP, privacy checks are simplified - always allow
    // This can be enhanced later when privacy tiers are implemented
    return { data: { allowed: true, reason: null }, error: null }
  } catch (error) {
    console.error('checkPrivacySettings error:', error)
    return { data: null, error: serializeError(error, 'Failed to check privacy settings') }
  }
}

/**
 * Get friendship statuses for multiple users at once (batch query)
 * More efficient than calling getFriendshipStatus multiple times
 * @param {string} userId - User ID of requester
 * @param {string[]} otherUserIds - Array of other user IDs to check status with
 * @returns {Promise<{data: Array<{otherUserId: string, status: string, friendship: object|null}>|null, error: object|null}>}
 */
export async function getFriendshipStatusesBatch(userId, otherUserIds) {
  try {
    if (!Array.isArray(otherUserIds) || otherUserIds.length === 0) {
      return { data: [], error: null }
    }

    // Validate input - limit batch size to prevent performance issues
    const MAX_BATCH_SIZE = 100
    if (otherUserIds.length > MAX_BATCH_SIZE) {
      return { 
        data: null, 
        error: { 
          message: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}. Got ${otherUserIds.length} users.` 
        } 
      }
    }

    // Remove duplicates and filter out invalid IDs
    const uniqueUserIdsArray = [...new Set(otherUserIds.filter(id => id && id !== userId))]
    const uniqueUserIdsSet = new Set(uniqueUserIdsArray) // Use Set for O(1) lookups
    
    if (uniqueUserIdsArray.length === 0) {
      return { data: [], error: null }
    }

    const supabase = await createClient()

    // Query all friendships where userId is involved with any of the otherUserIds
    // We need to check both directions: where userId is user_id OR friend_id
    // Since Supabase doesn't easily support complex nested OR with IN clauses,
    // we'll query all friendships involving the user and filter in JavaScript
    // This is still efficient because we're only querying friendships for one user
    
    // First, get all friendships involving the user
    const { data: userFriendships, error: userFriendshipsError } = await supabase
      .from('friendship')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (userFriendshipsError) {
      return { data: null, error: serializeError(userFriendshipsError, 'Failed to get friendship statuses batch') }
    }

    // Filter to only include friendships with the requested otherUserIds
    const friendships = (userFriendships || []).filter(friendship => {
      const otherUserId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      return uniqueUserIdsSet.has(otherUserId)
    })

    // Create a map of friendship by other user ID for quick lookup
    const friendshipMap = new Map()
    friendships?.forEach(friendship => {
      const otherUserId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      friendshipMap.set(otherUserId, friendship)
    })

    // Build result array with status for each requested user ID
    const results = uniqueUserIdsArray.map(otherUserId => {
      const friendship = friendshipMap.get(otherUserId)
      
      if (!friendship) {
        return {
          otherUserId,
          status: 'none',
          friendship: null
        }
      }

      // Determine status based on friendship direction and status
      let status
      if (friendship.status === 'accepted') {
        status = 'accepted'
      } else if (friendship.status === 'blocked') {
        status = 'blocked'
      } else if (friendship.status === 'pending') {
        // Determine if it was sent or received
        status = friendship.user_id === userId ? 'pending_sent' : 'pending_received'
      } else {
        status = 'none'
      }

      return {
        otherUserId,
        status,
        friendship
      }
    })

    return { data: results, error: null }
  } catch (error) {
    console.error('getFriendshipStatusesBatch error:', error)
    return { data: null, error: serializeError(error, 'Failed to get friendship statuses batch') }
  }
}

/**
 * Get user profiles for multiple user IDs efficiently (batch query)
 * Reduces database round trips when loading multiple friend profiles
 * @param {string[]} userIds - Array of user IDs to fetch profiles for
 * @returns {Promise<{data: Array<{id: string, name: string, profile_pic: string, year: number, school: string}>|null, error: object|null}>}
 */
export async function getFriendProfilesBatch(userIds) {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { data: [], error: null }
    }

    // Validate input - limit batch size to prevent performance issues
    const MAX_BATCH_SIZE = 100
    if (userIds.length > MAX_BATCH_SIZE) {
      return { 
        data: null, 
        error: { 
          message: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}. Got ${userIds.length} users.` 
        } 
      }
    }

    // Remove duplicates and filter out invalid IDs
    const uniqueUserIds = [...new Set(userIds.filter(id => id && typeof id === 'string'))]
    
    if (uniqueUserIds.length === 0) {
      return { data: [], error: null }
    }

    const supabase = await createClient()

    // Fetch user profiles in a single query
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, profile_pic, year, school')
      .in('id', uniqueUserIds)

    if (usersError) {
      return { data: null, error: serializeError(usersError, 'Failed to get friend profiles batch') }
    }

    // Return array of user profiles (preserve order if needed, or just return as-is)
    const profiles = (users || []).map(user => ({
      id: user.id,
      name: user.name,
      profile_pic: user.profile_pic,
      year: user.year,
      school: user.school
    }))

    return { data: profiles, error: null }
  } catch (error) {
    console.error('getFriendProfilesBatch error:', error)
    return { data: null, error: serializeError(error, 'Failed to get friend profiles batch') }
  }
}

