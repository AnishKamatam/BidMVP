// lib/mocks/eventFeedData.js
// Mock data and functions for event feed frontend development
// These match the real function signatures and can be used for testing

// Mock events
const mockEvents = [
  {
    id: 'mock-event-1',
    title: 'Frat Party',
    date: '2024-12-25T20:00:00',  // Future date
    end_time: '2024-12-26T02:00:00',
    event_type: 'party',
    visibility: 'public',
    bid_price: 15.0,
    max_bids: null,  // null = unlimited
    line_skip_price: 10.0,
    location: '123 Greek Row, Berkeley, CA',
    location_lat: 37.8715,
    location_lng: -122.2730,
    description: 'Epic party with live DJ and drinks',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    frat_id: 'mock-frat-1',
    fraternity: {
      id: 'mock-frat-1',
      name: 'Alpha Beta',
      photo_url: null,
      type: 'fraternity'
    }
  },
  {
    id: 'mock-event-2',
    title: 'Rush Mixer',
    date: '2024-12-28T18:00:00',
    end_time: '2024-12-28T22:00:00',
    event_type: 'mixer',
    visibility: 'public',
    bid_price: 0,
    max_bids: null,
    line_skip_price: null,
    location: 'Fraternity House, UC Berkeley',
    location_lat: 37.8715,
    location_lng: -122.2730,
    description: 'Meet the brothers and learn about our values',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    frat_id: 'mock-frat-2',
    fraternity: {
      id: 'mock-frat-2',
      name: 'Gamma Delta',
      photo_url: null,
      type: 'fraternity'
    }
  },
  {
    id: 'mock-event-3',
    title: 'Rush Only Event',
    date: '2024-12-30T19:00:00',
    end_time: '2024-12-30T23:00:00',
    event_type: 'rush',
    visibility: 'rush-only',
    bid_price: 20.0,
    max_bids: 50,
    line_skip_price: 15.0,
    location: 'Secret Location',
    location_lat: 37.8715,
    location_lng: -122.2730,
    description: 'Exclusive event for rushees only',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    frat_id: 'mock-frat-1',
    fraternity: {
      id: 'mock-frat-1',
      name: 'Alpha Beta',
      photo_url: null,
      type: 'fraternity'
    }
  },
  {
    id: 'mock-event-4',
    title: 'Invite Only Soirée',
    date: '2025-01-05T20:00:00',
    end_time: '2025-01-06T01:00:00',
    event_type: 'invite-only',
    visibility: 'invite-only',
    bid_price: 25.0,
    max_bids: 30,
    line_skip_price: 20.0,
    location: 'Upscale Venue, Downtown',
    location_lat: 37.8715,
    location_lng: -122.2730,
    description: 'Exclusive event for invited guests',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    frat_id: 'mock-frat-3',
    fraternity: {
      id: 'mock-frat-3',
      name: 'Epsilon Zeta',
      photo_url: null,
      type: 'fraternity'
    }
  },
  {
    id: 'mock-event-5',
    title: 'New Year Party',
    date: '2025-01-01T21:00:00',
    end_time: '2025-01-02T03:00:00',
    event_type: 'party',
    visibility: 'public',
    bid_price: 30.0,
    max_bids: 100,
    line_skip_price: 25.0,
    location: 'Main Quad, UC Berkeley',
    location_lat: 37.8715,
    location_lng: -122.2730,
    description: 'Ring in the new year with us!',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    frat_id: 'mock-frat-2',
    fraternity: {
      id: 'mock-frat-2',
      name: 'Gamma Delta',
      photo_url: null,
      type: 'fraternity'
    }
  },
  {
    id: 'mock-event-6',
    title: 'Sorority Mixer',
    date: '2025-01-10T19:00:00',
    end_time: '2025-01-10T23:00:00',
    event_type: 'mixer',
    visibility: 'public',
    bid_price: 12.0,
    max_bids: null,
    line_skip_price: null,
    location: 'Sorority Row, UC Berkeley',
    location_lat: 37.8715,
    location_lng: -122.2730,
    description: 'Join us for a fun mixer!',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    frat_id: 'mock-frat-4',
    fraternity: {
      id: 'mock-frat-4',
      name: 'Alpha Gamma',
      photo_url: null,
      type: 'sorority'
    }
  },
  {
    id: 'mock-event-7',
    title: 'Rush Only BBQ',
    date: '2025-01-15T14:00:00',
    end_time: '2025-01-15T18:00:00',
    event_type: 'rush',
    visibility: 'rush-only',
    bid_price: 0,
    max_bids: null,
    line_skip_price: null,
    location: 'Backyard, Fraternity House',
    location_lat: 37.8715,
    location_lng: -122.2730,
    description: 'Casual BBQ for rushees',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    frat_id: 'mock-frat-3',
    fraternity: {
      id: 'mock-frat-3',
      name: 'Epsilon Zeta',
      photo_url: null,
      type: 'fraternity'
    }
  }
]

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock get campus events function
 * @param {string} userId - User ID
 * @param {object} filters - Filter options
 * @param {string | string[]} filters.event_type - Optional - filter by event type(s)
 * @param {string} filters.visibility - Optional - filter by visibility
 * @param {boolean} filters.rush_only - Optional - show only rush-only events
 * @param {number} filters.limit - Optional - limit results (default: 50)
 * @param {number} filters.offset - Optional - pagination offset
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function mockGetCampusEvents(userId, filters = {}) {
  await delay(300 + Math.random() * 200) // 300-500ms delay

  // Validate userId
  if (!userId) {
    return { data: null, error: { message: 'User ID is required' } }
  }

  // For mock purposes, assume user exists and has school_id
  // In real implementation, this would check user and school_id

  // Get today's date at start of day (local time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00`

  // Filter events: only future events (including today)
  let filteredEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.date)
    const todayDate = new Date(todayString)
    return eventDate >= todayDate
  })

  // For mock purposes, assume user.rushing = false unless we want to test rush-only
  // In real implementation, this would come from the database
  const userRushing = false

  // Apply visibility rules: rush-only events only shown if user.rushing = true
  filteredEvents = filteredEvents.filter(event => {
    if (event.visibility === 'rush-only' && !userRushing) {
      return false
    }
    return true
  })

  // Apply event_type filter if provided
  if (filters.event_type) {
    if (Array.isArray(filters.event_type)) {
      if (filters.event_type.length > 0) {
        filteredEvents = filteredEvents.filter(event =>
          filters.event_type.includes(event.event_type)
        )
      }
    } else {
      filteredEvents = filteredEvents.filter(event =>
        event.event_type === filters.event_type
      )
    }
  }

  // Apply visibility filter if provided (but don't filter rush-only here, already handled above)
  if (filters.visibility && filters.visibility !== 'rush-only') {
    filteredEvents = filteredEvents.filter(event =>
      event.visibility === filters.visibility
    )
  }

  // Apply rush_only filter: if rush_only=true, only show rush-only events
  if (filters.rush_only === true) {
    filteredEvents = filteredEvents.filter(event =>
      event.visibility === 'rush-only'
    )
  }

  // Apply visibility filter for rush-only if specified
  if (filters.visibility === 'rush-only') {
    filteredEvents = filteredEvents.filter(event =>
      event.visibility === 'rush-only'
    )
    // Also need to check user.rushing, but for mock we assume false unless testing
  }

  // Sort by date ASC (soonest first)
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA - dateB
  })

  // Apply pagination
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 50
  const offset = filters.offset && filters.offset > 0 ? filters.offset : 0
  const paginatedEvents = filteredEvents.slice(offset, offset + limit)

  // Format events to match real function return format
  const formattedEvents = paginatedEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date, // Already in local time string format
    end_time: event.end_time,
    event_type: event.event_type,
    visibility: event.visibility,
    bid_price: parseFloat(event.bid_price || 0),
    max_bids: event.max_bids !== null && event.max_bids !== undefined ? parseInt(event.max_bids, 10) : null,
    line_skip_price: event.line_skip_price !== null && event.line_skip_price !== undefined ? parseFloat(event.line_skip_price) : null,
    location: event.location,
    location_lat: event.location_lat !== null && event.location_lat !== undefined ? parseFloat(event.location_lat) : null,
    location_lng: event.location_lng !== null && event.location_lng !== undefined ? parseFloat(event.location_lng) : null,
    description: event.description,
    image_url: event.image_url,
    created_at: event.created_at,
    updated_at: event.updated_at,
    fraternity: event.fraternity ? {
      id: event.fraternity.id,
      name: event.fraternity.name,
      photo_url: event.fraternity.photo_url,
      type: event.fraternity.type
    } : null
  }))

  return { data: formattedEvents, error: null }
}

