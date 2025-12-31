// lib/mocks/friendshipData.js
// Mock data and functions for friend system
// Used for parallel frontend development before backend is complete

// Simulate network delay for realistic loading states
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Sample user data
const mockUsers = {
  'user-1': { id: 'user-1', name: 'John Doe', profile_pic: null, year: 3, school: 'Stanford University' },
  'user-2': { id: 'user-2', name: 'Jane Smith', profile_pic: null, year: 2, school: 'Stanford University' },
  'user-3': { id: 'user-3', name: 'Bob Johnson', profile_pic: null, year: 4, school: 'Stanford University' },
  'user-4': { id: 'user-4', name: 'Alice Williams', profile_pic: null, year: 2, school: 'Stanford University' },
  'user-5': { id: 'user-5', name: 'Charlie Brown', profile_pic: null, year: 3, school: 'Stanford University' },
  'user-6': { id: 'user-6', name: 'Diana Prince', profile_pic: null, year: 1, school: 'Stanford University' },
  'user-7': { id: 'user-7', name: 'Mike Wilson', profile_pic: null, year: 4, school: 'Stanford University' },
  'user-8': { id: 'user-8', name: 'Sarah Davis', profile_pic: null, year: 2, school: 'Stanford University' }
}

// Mock friendship data (using userId as key)
const mockFriendships = {
  'user-1': [
    { id: 'f1', user_id: 'user-1', friend_id: 'user-2', status: 'accepted', created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
    { id: 'f2', user_id: 'user-1', friend_id: 'user-3', status: 'accepted', created_at: '2024-01-20T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
    { id: 'f3', user_id: 'user-4', friend_id: 'user-1', status: 'pending', created_at: '2024-01-25T00:00:00Z', updated_at: '2024-01-25T00:00:00Z' },
    { id: 'f4', user_id: 'user-1', friend_id: 'user-5', status: 'pending', created_at: '2024-01-26T00:00:00Z', updated_at: '2024-01-26T00:00:00Z' }
  ]
}

// Mock checkin data for "People you met" suggestions
const mockCheckins = {
  'user-1': [
    { event_id: 'event-1', checked_in_at: '2024-01-20T18:00:00Z' },
    { event_id: 'event-2', checked_in_at: '2024-01-25T19:00:00Z' },
    { event_id: 'event-3', checked_in_at: '2024-01-28T20:00:00Z' }
  ],
  'user-6': [
    { event_id: 'event-1', checked_in_at: '2024-01-20T18:30:00Z' },
    { event_id: 'event-2', checked_in_at: '2024-01-25T19:15:00Z' }
  ],
  'user-7': [
    { event_id: 'event-1', checked_in_at: '2024-01-20T18:15:00Z' },
    { event_id: 'event-3', checked_in_at: '2024-01-28T20:30:00Z' }
  ],
  'user-8': [
    { event_id: 'event-2', checked_in_at: '2024-01-25T19:30:00Z' },
    { event_id: 'event-3', checked_in_at: '2024-01-28T20:15:00Z' }
  ]
}

/**
 * Get all friendships for a user (both directions)
 */
function getAllFriendshipsForUser(userId) {
  const allFriendships = []
  
  // Get friendships where user is user_id
  Object.values(mockFriendships).flat().forEach(f => {
    if (f.user_id === userId || f.friend_id === userId) {
      allFriendships.push(f)
    }
  })
  
  return allFriendships
}

/**
 * Mock: Send friend request
 */
export async function mockSendFriendRequest(userId, friendId) {
  await delay(400)

  // Validation: Cannot send to self
  if (userId === friendId) {
    return { data: null, error: { message: 'Cannot send friend request to yourself' } }
  }

  // Check if friendship already exists
  const existing = getAllFriendshipsForUser(userId).find(
    f => (f.user_id === userId && f.friend_id === friendId) ||
         (f.user_id === friendId && f.friend_id === userId)
  )

  if (existing) {
    if (existing.status === 'blocked') {
      return { data: null, error: { message: 'Cannot send request to blocked user' } }
    }
    if (existing.status === 'pending') {
      return { data: { friendship: existing, success: true }, error: null }
    }
    if (existing.status === 'accepted') {
      return { data: null, error: { message: 'You are already friends with this user' } }
    }
  }

  // Create new friendship
  const newFriendship = {
    id: `f-${Date.now()}`,
    user_id: userId,
    friend_id: friendId,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (!mockFriendships[userId]) {
    mockFriendships[userId] = []
  }
  mockFriendships[userId].push(newFriendship)

  return { data: { friendship: newFriendship, success: true }, error: null }
}

/**
 * Mock: Accept friend request
 */
export async function mockAcceptFriendRequest(userId, friendId) {
  await delay(400)

  const friendships = getAllFriendshipsForUser(userId)
  const friendship = friendships.find(
    f => f.user_id === friendId && f.friend_id === userId && f.status === 'pending'
  )

  if (!friendship) {
    return { data: null, error: { message: 'No pending request found' } }
  }

  friendship.status = 'accepted'
  friendship.updated_at = new Date().toISOString()

  return { data: { friendship, success: true }, error: null }
}

/**
 * Mock: Decline friend request
 */
export async function mockDeclineFriendRequest(userId, friendId) {
  await delay(350)

  const friendships = getAllFriendshipsForUser(userId)
  const index = friendships.findIndex(
    f => f.user_id === friendId && f.friend_id === userId && f.status === 'pending'
  )

  if (index === -1) {
    return { data: null, error: { message: 'No pending request found' } }
  }

  friendships.splice(index, 1)

  return { data: { success: true }, error: null }
}

/**
 * Mock: Cancel friend request
 */
export async function mockCancelFriendRequest(userId, friendId) {
  await delay(350)

  const friendships = getAllFriendshipsForUser(userId)
  const index = friendships.findIndex(
    f => f.user_id === userId && f.friend_id === friendId && f.status === 'pending'
  )

  if (index === -1) {
    return { data: null, error: { message: 'No pending request found' } }
  }

  friendships.splice(index, 1)

  return { data: { success: true }, error: null }
}

/**
 * Mock: Remove friend
 */
export async function mockRemoveFriend(userId, friendId) {
  await delay(400)

  const friendships = getAllFriendshipsForUser(userId)
  const index = friendships.findIndex(
    f => ((f.user_id === userId && f.friend_id === friendId) ||
          (f.user_id === friendId && f.friend_id === userId)) &&
         f.status === 'accepted'
  )

  if (index === -1) {
    return { data: null, error: { message: 'Friendship not found' } }
  }

  friendships.splice(index, 1)

  return { data: { success: true }, error: null }
}

/**
 * Mock: Block user
 */
export async function mockBlockUser(userId, blockedUserId) {
  await delay(400)

  if (userId === blockedUserId) {
    return { data: null, error: { message: 'Cannot block yourself' } }
  }

  const friendships = getAllFriendshipsForUser(userId)
  const existing = friendships.find(
    f => (f.user_id === userId && f.friend_id === blockedUserId) ||
         (f.user_id === blockedUserId && f.friend_id === userId)
  )

  if (existing) {
    existing.user_id = userId
    existing.friend_id = blockedUserId
    existing.status = 'blocked'
    existing.updated_at = new Date().toISOString()
    return { data: { friendship: existing, success: true }, error: null }
  }

  const newBlock = {
    id: `f-${Date.now()}`,
    user_id: userId,
    friend_id: blockedUserId,
    status: 'blocked',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (!mockFriendships[userId]) {
    mockFriendships[userId] = []
  }
  mockFriendships[userId].push(newBlock)

  return { data: { friendship: newBlock, success: true }, error: null }
}

/**
 * Mock: Unblock user
 */
export async function mockUnblockUser(userId, blockedUserId) {
  await delay(350)

  const friendships = getAllFriendshipsForUser(userId)
  const index = friendships.findIndex(
    f => f.user_id === userId && f.friend_id === blockedUserId && f.status === 'blocked'
  )

  if (index === -1) {
    return { data: null, error: { message: 'Blocked relationship not found' } }
  }

  friendships.splice(index, 1)

  return { data: { success: true }, error: null }
}

/**
 * Mock: Get friends
 */
export async function mockGetFriends(userId, limit = 50) {
  await delay(300)

  const friendships = getAllFriendshipsForUser(userId)
    .filter(f => f.status === 'accepted')
    .slice(0, limit)

  const friends = friendships.map(friendship => {
    const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id
    return {
      friend: mockUsers[friendId] || {
        id: friendId,
        name: 'Unknown User',
        profile_pic: null,
        year: null,
        school: null
      },
      friendship: {
        id: friendship.id,
        created_at: friendship.created_at,
        updated_at: friendship.updated_at
      }
    }
  })

  return { data: friends, error: null }
}

/**
 * Mock: Get friend requests
 */
export async function mockGetFriendRequests(userId) {
  await delay(300)

  const friendships = getAllFriendshipsForUser(userId)
    .filter(f => f.status === 'pending')

  const sent = []
  const received = []

  friendships.forEach(friendship => {
    const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id
    const friend = mockUsers[friendId] || {
      id: friendId,
      name: 'Unknown User',
      profile_pic: null,
      year: null,
      school: null
    }

    const requestData = {
      id: friendship.id,
      created_at: friendship.created_at,
      updated_at: friendship.updated_at,
      user: friend
    }

    if (friendship.user_id === userId) {
      sent.push(requestData)
    } else {
      received.push(requestData)
    }
  })

  return { data: { sent, received }, error: null }
}

/**
 * Mock: Get friendship status
 */
export async function mockGetFriendshipStatus(userId, otherUserId) {
  await delay(200)

  const friendships = getAllFriendshipsForUser(userId)
  const friendship = friendships.find(
    f => (f.user_id === userId && f.friend_id === otherUserId) ||
         (f.user_id === otherUserId && f.friend_id === userId)
  )

  if (!friendship) {
    return { data: { status: 'none', friendship: null }, error: null }
  }

  let status
  if (friendship.status === 'accepted') {
    status = 'accepted'
  } else if (friendship.status === 'blocked') {
    status = 'blocked'
  } else if (friendship.status === 'pending') {
    status = friendship.user_id === userId ? 'pending_sent' : 'pending_received'
  } else {
    status = 'none'
  }

  return { data: { status, friendship }, error: null }
}

/**
 * Mock: Get people you met
 */
export async function mockGetPeopleYouMet(userId, limit = 20) {
  await delay(400)

  // Get user's check-ins
  const userCheckins = mockCheckins[userId] || []
  if (userCheckins.length === 0) {
    return { data: [], error: null }
  }

  const userEventIds = new Set(userCheckins.map(c => c.event_id))

  // Get all existing friendships to exclude
  const friendships = getAllFriendshipsForUser(userId)
  const excludedUserIds = new Set([userId])
  friendships.forEach(f => {
    if (f.user_id === userId) excludedUserIds.add(f.friend_id)
    if (f.friend_id === userId) excludedUserIds.add(f.user_id)
  })

  // Find users who attended same events
  const userEventCounts = new Map()

  Object.entries(mockCheckins).forEach(([otherUserId, checkins]) => {
    if (excludedUserIds.has(otherUserId)) return

    let sharedCount = 0
    let lastEventDate = null

    checkins.forEach(checkin => {
      if (userEventIds.has(checkin.event_id)) {
        sharedCount++
        if (!lastEventDate || checkin.checked_in_at > lastEventDate) {
          lastEventDate = checkin.checked_in_at
        }
      }
    })

    if (sharedCount > 0) {
      userEventCounts.set(otherUserId, {
        sharedCount,
        lastEventDate
      })
    }
  })

  // Convert to array and sort
  const suggestions = Array.from(userEventCounts.entries())
    .map(([otherUserId, data]) => ({
      user: mockUsers[otherUserId] || {
        id: otherUserId,
        name: 'Unknown User',
        profile_pic: null,
        year: null
      },
      sharedEvents: data.sharedCount,
      lastEventDate: data.lastEventDate
    }))
    .sort((a, b) => {
      if (b.sharedEvents !== a.sharedEvents) {
        return b.sharedEvents - a.sharedEvents
      }
      return new Date(b.lastEventDate || 0) - new Date(a.lastEventDate || 0)
    })
    .slice(0, limit)

  return { data: suggestions, error: null }
}

