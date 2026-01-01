// lib/mocks/friendshipData.js
// Mock versions of friendship functions for parallel frontend development
// These match the exact signatures of the real functions in lib/supabase/friendships.js

/**
 * Simulate network delay for realistic loading states
 */
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock users for friend system
const mockUsers = [
  {
    id: 'mock-user-1',
    name: 'Alice Johnson',
    year: 2,
    profile_pic: 'https://via.placeholder.com/200?text=AJ',
    email: 'alice@university.edu'
  },
  {
    id: 'mock-user-2',
    name: 'Bob Smith',
    year: 3,
    profile_pic: 'https://via.placeholder.com/200?text=BS',
    email: 'bob@university.edu'
  },
  {
    id: 'mock-user-3',
    name: 'Charlie Brown',
    year: 1,
    profile_pic: 'https://via.placeholder.com/200?text=CB',
    email: 'charlie@university.edu'
  },
  {
    id: 'mock-user-4',
    name: 'Diana Prince',
    year: 4,
    profile_pic: 'https://via.placeholder.com/200?text=DP',
    email: 'diana@university.edu'
  },
  {
    id: 'mock-user-5',
    name: 'Eve Wilson',
    year: 2,
    profile_pic: 'https://via.placeholder.com/200?text=EW',
    email: 'eve@university.edu'
  }
]

// Mock friendships data
let mockFriendships = [
  {
    id: 'friendship-1',
    user_id: 'mock-user-123',
    friend_id: 'mock-user-1',
    status: 'accepted',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'friendship-2',
    user_id: 'mock-user-123',
    friend_id: 'mock-user-2',
    status: 'accepted',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Mock pending requests
let mockPendingRequests = [
  {
    id: 'request-1',
    user_id: 'mock-user-3',
    friend_id: 'mock-user-123',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'request-2',
    user_id: 'mock-user-4',
    friend_id: 'mock-user-123',
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Mock sent requests
let mockSentRequests = [
  {
    id: 'sent-request-1',
    user_id: 'mock-user-123',
    friend_id: 'mock-user-5',
    status: 'pending',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Mock event check-ins for "people you met"
const mockEventCheckIns = [
  {
    event_id: 'event-1',
    event_name: 'Spring Mixer',
    user_id: 'mock-user-1',
    checked_in_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    event_id: 'event-1',
    event_name: 'Spring Mixer',
    user_id: 'mock-user-2',
    checked_in_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    event_id: 'event-2',
    event_name: 'Rush Event',
    user_id: 'mock-user-3',
    checked_in_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// ============================================
// Mock Friendship Functions
// ============================================

/**
 * Mock: Send friend request
 * @param {string} userId - User ID
 * @param {string} friendId - Friend user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function sendFriendRequest(userId, friendId) {
  await delay(400)

  if (!userId || !friendId) {
    return {
      data: null,
      error: { message: 'User ID and friend ID are required' }
    }
  }

  if (userId === friendId) {
    return {
      data: null,
      error: { message: 'Cannot send friend request to yourself' }
    }
  }

  // Check if request already exists
  const existing = mockPendingRequests.find(
    r => (r.user_id === userId && r.friend_id === friendId) ||
         (r.user_id === friendId && r.friend_id === userId)
  )

  if (existing) {
    return {
      data: null,
      error: { message: 'Friend request already exists' }
    }
  }

  // Create new request
  const newRequest = {
    id: `request-${Date.now()}`,
    user_id: userId,
    friend_id: friendId,
    status: 'pending',
    created_at: new Date().toISOString()
  }

  mockSentRequests.push(newRequest)

  return {
    data: newRequest,
    error: null
  }
}

/**
 * Mock: Accept friend request
 * @param {string} userId - User ID (recipient)
 * @param {string} friendId - User ID (sender)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function acceptFriendRequest(userId, friendId) {
  await delay(400)

  // Find and remove from pending requests
  const requestIndex = mockPendingRequests.findIndex(
    r => r.user_id === friendId && r.friend_id === userId
  )

  if (requestIndex === -1) {
    return {
      data: null,
      error: { message: 'Friend request not found' }
    }
  }

  mockPendingRequests.splice(requestIndex, 1)

  // Create accepted friendship
  const friendship = {
    id: `friendship-${Date.now()}`,
    user_id: userId,
    friend_id: friendId,
    status: 'accepted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  mockFriendships.push(friendship)

  return {
    data: friendship,
    error: null
  }
}

/**
 * Mock: Deny friend request
 * @param {string} userId - User ID (recipient)
 * @param {string} friendId - User ID (sender)
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function denyFriendRequest(userId, friendId) {
  await delay(300)

  const requestIndex = mockPendingRequests.findIndex(
    r => r.user_id === friendId && r.friend_id === userId
  )

  if (requestIndex === -1) {
    return {
      data: null,
      error: { message: 'Friend request not found' }
    }
  }

  mockPendingRequests.splice(requestIndex, 1)

  return {
    data: { success: true },
    error: null
  }
}

/**
 * Mock: Remove friend
 * @param {string} userId - User ID
 * @param {string} friendId - Friend user ID
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function removeFriend(userId, friendId) {
  await delay(300)

  const friendshipIndex = mockFriendships.findIndex(
    f => (f.user_id === userId && f.friend_id === friendId) ||
         (f.user_id === friendId && f.friend_id === userId)
  )

  if (friendshipIndex === -1) {
    return {
      data: null,
      error: { message: 'Friendship not found' }
    }
  }

  mockFriendships.splice(friendshipIndex, 1)

  return {
    data: { success: true },
    error: null
  }
}

/**
 * Mock: Get friends list
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFriends(userId) {
  await delay(500)

  const friendships = mockFriendships.filter(
    f => (f.user_id === userId || f.friend_id === userId) && f.status === 'accepted'
  )

  const friends = friendships.map(f => {
    const friendId = f.user_id === userId ? f.friend_id : f.user_id
    const friend = mockUsers.find(u => u.id === friendId)
    return friend ? {
      ...friend,
      friendship_id: f.id
    } : null
  }).filter(Boolean)

  return {
    data: friends,
    error: null
  }
}

/**
 * Mock: Get friend requests (incoming)
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFriendRequests(userId) {
  await delay(400)

  const requests = mockPendingRequests.filter(r => r.friend_id === userId)

  const requestsWithUsers = requests.map(r => {
    const requester = mockUsers.find(u => u.id === r.user_id)
    return requester ? {
      id: r.id,
      requester,
      created_at: r.created_at
    } : null
  }).filter(Boolean)

  return {
    data: requestsWithUsers,
    error: null
  }
}

/**
 * Mock: Get sent requests (outgoing)
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getSentRequests(userId) {
  await delay(400)

  const requests = mockSentRequests.filter(r => r.user_id === userId)

  const requestsWithUsers = requests.map(r => {
    const recipient = mockUsers.find(u => u.id === r.friend_id)
    return recipient ? {
      id: r.id,
      recipient,
      created_at: r.created_at
    } : null
  }).filter(Boolean)

  return {
    data: requestsWithUsers,
    error: null
  }
}

/**
 * Mock: Get people you might have met
 * @param {string} userId - User ID
 * @param {string|null} eventId - Optional event ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getPeopleYouMet(userId, eventId = null) {
  await delay(600)

  // Get events user checked into
  const userEvents = mockEventCheckIns
    .filter(c => c.user_id === userId)
    .map(c => c.event_id)

  if (userEvents.length === 0) {
    return {
      data: [],
      error: null
    }
  }

  // Filter by eventId if provided
  const targetEvents = eventId 
    ? userEvents.filter(e => e === eventId)
    : userEvents

  // Get other users who checked into same events
  const otherUsers = mockEventCheckIns
    .filter(c => 
      targetEvents.includes(c.event_id) && 
      c.user_id !== userId &&
      !mockFriendships.some(f => 
        (f.user_id === userId && f.friend_id === c.user_id) ||
        (f.user_id === c.user_id && f.friend_id === userId)
      ) &&
      !mockPendingRequests.some(r =>
        (r.user_id === userId && r.friend_id === c.user_id) ||
        (r.user_id === c.user_id && r.friend_id === userId)
      ) &&
      !mockSentRequests.some(r =>
        (r.user_id === userId && r.friend_id === c.user_id) ||
        (r.user_id === c.user_id && r.friend_id === userId)
      )
    )
    .map(c => {
      const user = mockUsers.find(u => u.id === c.user_id)
      return user ? {
        ...user,
        event_id: c.event_id,
        event_name: c.event_name,
        met_at: c.checked_in_at
      } : null
    })
    .filter(Boolean)

  // Remove duplicates
  const uniqueUsers = Array.from(
    new Map(otherUsers.map(u => [u.id, u])).values()
  )

  return {
    data: uniqueUsers,
    error: null
  }
}

/**
 * Mock: Check friendship status
 * @param {string} userId - User ID
 * @param {string} friendId - Friend user ID
 * @returns {Promise<{data: {status: string}|null, error: object|null}>}
 */
export async function checkFriendshipStatus(userId, friendId) {
  await delay(200)

  // Check accepted friendships
  const friendship = mockFriendships.find(
    f => (f.user_id === userId && f.friend_id === friendId) ||
         (f.user_id === friendId && f.friend_id === userId)
  )

  if (friendship && friendship.status === 'accepted') {
    return {
      data: { status: 'accepted' },
      error: null
    }
  }

  // Check pending requests (sent)
  const sentRequest = mockSentRequests.find(
    r => r.user_id === userId && r.friend_id === friendId
  )

  if (sentRequest) {
    return {
      data: { status: 'pending_sent' },
      error: null
    }
  }

  // Check pending requests (received)
  const receivedRequest = mockPendingRequests.find(
    r => r.user_id === friendId && r.friend_id === userId
  )

  if (receivedRequest) {
    return {
      data: { status: 'pending_received' },
      error: null
    }
  }

  return {
    data: { status: 'none' },
    error: null
  }
}

