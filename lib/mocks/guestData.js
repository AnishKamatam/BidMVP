// lib/mocks/guestData.js
// Mock data and functions for frontend development
// These match the real function signatures and can be used for testing

// Mock user data
const mockUsers = [
  {
    id: 'mock-user-1',
    name: 'John Doe',
    email: 'john.doe@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 2,
  },
  {
    id: 'mock-user-2',
    name: 'Jane Smith',
    email: 'jane.smith@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 3,
  },
  {
    id: 'mock-user-3',
    name: 'Bob Johnson',
    email: 'bob.johnson@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 1,
  },
]

// Mock safety tiers
const mockSafetyTiers = [
  { tier: 'G1', score: 95 },
  { tier: 'G2', score: 88 },
  { tier: 'G3', score: 82 },
  { tier: 'Y1', score: 75 },
  { tier: 'Y2', score: 68 },
  { tier: 'Y3', score: 62 },
  { tier: 'R1', score: 55 },
  { tier: 'R2', score: 48 },
  { tier: 'R3', score: 42 },
]

// Mock event requests
const mockRequests = [
  {
    id: 'mock-request-1',
    event_id: 'mock-event-1',
    user_id: 'mock-user-1',
    status: 'pending',
    requested_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    user: mockUsers[0],
    safety_tier: mockSafetyTiers[0],
  },
  {
    id: 'mock-request-2',
    event_id: 'mock-event-1',
    user_id: 'mock-user-2',
    status: 'pending',
    requested_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    user: mockUsers[1],
    safety_tier: mockSafetyTiers[1],
  },
]

// Mock events
const mockEvents = [
  {
    id: 'mock-event-1',
    title: 'Party Night',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    event_type: 'party',
    visibility: 'invite-only',
    bid_price: 10.0,
  },
  {
    id: 'mock-event-2',
    title: 'Mixer',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    event_type: 'mixer',
    visibility: 'public',
    bid_price: 0,
  },
]

/**
 * Mock function to create an event request
 */
export const mockCreateEventRequest = async (eventId, userId) => {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
  return {
    data: {
      id: `mock-request-${Date.now()}`,
      event_id: eventId,
      user_id: userId,
      status: 'pending',
      requested_at: new Date().toISOString(),
    },
    error: null,
  }
}

/**
 * Mock function to approve a request
 */
export const mockApproveRequest = async (requestId, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    data: {
      id: requestId,
      status: 'approved',
      responded_at: new Date().toISOString(),
    },
    error: null,
  }
}

/**
 * Mock function to deny a request
 */
export const mockDenyRequest = async (requestId, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    data: {
      id: requestId,
      status: 'denied',
      responded_at: new Date().toISOString(),
    },
    error: null,
  }
}

/**
 * Mock function to get event requests
 */
export const mockGetEventRequests = async (eventId, adminUserId, status = null) => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  let requests = mockRequests.filter((r) => r.event_id === eventId)
  if (status) {
    requests = requests.filter((r) => r.status === status)
  }
  return {
    data: requests,
    error: null,
  }
}

/**
 * Mock function to manually add a guest
 */
export const mockManuallyAddGuest = async (eventId, userIdToAdd, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const user = mockUsers.find((u) => u.id === userIdToAdd) || mockUsers[0]
  return {
    data: {
      id: `mock-request-${Date.now()}`,
      event_id: eventId,
      user_id: userIdToAdd,
      status: 'approved',
      requested_at: new Date().toISOString(),
      responded_at: new Date().toISOString(),
      user,
      safety_tier: mockSafetyTiers[0],
    },
    error: null,
  }
}

/**
 * Mock function to get guest list
 */
export const mockGetGuestList = async (eventId, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const approvedRequests = mockRequests
    .filter((r) => r.event_id === eventId && r.status === 'approved')
    .map((r) => ({
      ...r,
      status: 'approved',
      responded_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    }))
  return {
    data: approvedRequests,
    error: null,
  }
}

/**
 * Mock function to search users
 */
export const mockSearchUsers = async (query, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const searchLower = query.toLowerCase()
  const results = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
  )
  return {
    data: results.slice(0, 20), // Limit to 20
    error: null,
  }
}

/**
 * Mock function to get fraternity events
 */
export const mockGetFraternityEvents = async (fraternityId, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return {
    data: mockEvents,
    error: null,
  }
}

/**
 * Mock function to record line skip payment
 */
export const mockRecordLineSkip = async (eventId, userId, amount, stripeSessionId, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    data: {
      id: `mock-revenue-${Date.now()}`,
      event_id: eventId,
      user_id: userId,
      type: 'line_skip',
      amount,
      stripe_session_id: stripeSessionId,
      created_at: new Date().toISOString(),
    },
    error: null,
  }
}

/**
 * Mock function to record bid purchase
 */
export const mockRecordBidPurchase = async (eventId, userId, amount, stripeSessionId) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    data: {
      id: `mock-revenue-${Date.now()}`,
      event_id: eventId,
      user_id: userId,
      type: 'bid',
      amount,
      stripe_session_id: stripeSessionId,
      created_at: new Date().toISOString(),
    },
    error: null,
  }
}

/**
 * Mock function to get event revenue
 */
export const mockGetEventRevenue = async (eventId, adminUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const mockRecords = [
    {
      id: 'mock-revenue-1',
      event_id: eventId,
      user_id: 'mock-user-1',
      type: 'line_skip',
      amount: 15.0,
      stripe_session_id: 'mock-session-1',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-revenue-2',
      event_id: eventId,
      user_id: 'mock-user-2',
      type: 'bid',
      amount: 10.0,
      stripe_session_id: 'mock-session-2',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ]
  return {
    data: {
      total: 25.0,
      byType: {
        line_skip: 15.0,
        bid: 10.0,
        priority_pass: 0,
      },
      records: mockRecords,
    },
    error: null,
  }
}

/**
 * Mock function to create Stripe checkout session
 */
export const mockCreateStripeCheckoutSession = async (
  eventId,
  userId,
  amount,
  lineItemDescription,
  paymentType = 'line_skip'
) => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    data: {
      sessionId: `mock-session-${Date.now()}`,
      url: 'https://checkout.stripe.com/mock',
    },
    error: null,
  }
}

