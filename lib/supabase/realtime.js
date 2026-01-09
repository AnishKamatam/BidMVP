// lib/supabase/realtime.js
// Real-time subscription helpers for friend data
// Provides functions to subscribe to friendship table changes via Supabase Realtime

'use client'

import { createClient } from './client'

/**
 * Subscribe to friendship changes for a user
 * Listens for INSERT, UPDATE, and DELETE events on the friendship table
 * @param {string} userId - User ID to subscribe to friendship changes for
 * @param {function} onFriendshipChange - Callback function called when friendship changes
 *   Receives: { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new: object, old: object, friendship: object }
 * @returns {function} Unsubscribe function to clean up the subscription
 */
export function subscribeToFriendships(userId, onFriendshipChange) {
  if (!userId) {
    console.warn('subscribeToFriendships: userId is required')
    return () => {} // Return no-op unsubscribe function
  }

  const supabase = createClient()

  // Set up timeout handling for subscription
  const SUBSCRIPTION_TIMEOUT = 10000 // 10 seconds
  let subscriptionTimeoutId = null
  let isSubscribed = false

  // Subscribe to friendship table changes
  // Filter to only listen to friendships where user is user_id or friend_id
  const subscription = supabase
    .channel(`friendships:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'friendship',
        filter: `user_id=eq.${userId}` // Friendships where user is the sender
      },
      (payload) => {
        // Transform the event to include friend profile info if needed
        const eventData = {
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          friendship: payload.new || payload.old,
          isUserSender: true // User is the user_id in this friendship
        }
        
        if (onFriendshipChange) {
          try {
            onFriendshipChange(eventData)
          } catch (error) {
            console.error('Error in friendship change callback:', error)
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'friendship',
        filter: `friend_id=eq.${userId}` // Friendships where user is the recipient
      },
      (payload) => {
        // Transform the event to include friend profile info if needed
        const eventData = {
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          friendship: payload.new || payload.old,
          isUserSender: false // User is the friend_id in this friendship
        }
        
        if (onFriendshipChange) {
          try {
            onFriendshipChange(eventData)
          } catch (error) {
            console.error('Error in friendship change callback:', error)
          }
        }
      }
    )
    .subscribe((status) => {
      // Clear timeout if subscription succeeds
      if (subscriptionTimeoutId) {
        clearTimeout(subscriptionTimeoutId)
        subscriptionTimeoutId = null
      }

      if (status === 'SUBSCRIBED') {
        isSubscribed = true
        console.log(`Subscribed to friendships for user ${userId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to friendships for user ${userId}`)
        isSubscribed = false
      } else if (status === 'TIMED_OUT') {
        console.warn(`Subscription timeout for user ${userId}, attempting to reconnect...`)
        isSubscribed = false
      } else if (status === 'CLOSED') {
        console.log(`Subscription closed for user ${userId}`)
        isSubscribed = false
      }
    })

  // Set timeout to warn if subscription doesn't complete within time limit
  subscriptionTimeoutId = setTimeout(() => {
    if (!isSubscribed) {
      console.warn(`Friendship subscription for user ${userId} took longer than ${SUBSCRIPTION_TIMEOUT}ms to establish`)
    }
  }, SUBSCRIPTION_TIMEOUT)

  // Return unsubscribe function that clears timeout
  const unsubscribeFn = () => {
    // Clear timeout if it exists
    if (subscriptionTimeoutId) {
      clearTimeout(subscriptionTimeoutId)
      subscriptionTimeoutId = null
    }
    subscription.unsubscribe()
  }
  
  return unsubscribeFn
}

/**
 * Subscribe to friend request updates (pending status changes)
 * Convenience function that filters for pending requests specifically
 * @param {string} userId - User ID to subscribe to friend request changes for
 * @param {function} onRequestChange - Callback function called when friend request changes
 *   Receives: { eventType: 'INSERT' | 'UPDATE' | 'DELETE', friendship: object, isReceived: boolean }
 * @returns {function} Unsubscribe function to clean up the subscription
 */
export function subscribeToFriendRequests(userId, onRequestChange) {
  if (!userId) {
    console.warn('subscribeToFriendRequests: userId is required')
    return () => {} // Return no-op unsubscribe function
  }

  const supabase = createClient()

  // Subscribe to friendship table changes where status is pending
  const subscription = supabase
    .channel(`friend_requests:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friendship',
        filter: `user_id=eq.${userId}` // Sent requests
      },
      (payload) => {
        // Only process pending status (for requests)
        const friendship = payload.new || payload.old
        if (!friendship || (friendship.status !== 'pending' && payload.eventType !== 'DELETE')) {
          return // Skip non-pending friendships
        }

        const eventData = {
          eventType: payload.eventType,
          friendship: friendship,
          isReceived: false, // User sent this request
          isUserSender: true
        }
        
        if (onRequestChange) {
          try {
            onRequestChange(eventData)
          } catch (error) {
            console.error('Error in friend request change callback:', error)
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friendship',
        filter: `friend_id=eq.${userId}` // Received requests
      },
      (payload) => {
        // Only process pending status (for requests)
        const friendship = payload.new || payload.old
        if (!friendship || (friendship.status !== 'pending' && payload.eventType !== 'DELETE')) {
          return // Skip non-pending friendships
        }

        const eventData = {
          eventType: payload.eventType,
          friendship: friendship,
          isReceived: true, // User received this request
          isUserSender: false
        }
        
        if (onRequestChange) {
          try {
            onRequestChange(eventData)
          } catch (error) {
            console.error('Error in friend request change callback:', error)
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to friend requests for user ${userId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to friend requests for user ${userId}`)
      } else if (status === 'TIMED_OUT') {
        console.warn(`Friend requests subscription timeout for user ${userId}`)
      }
    })

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Helper function to handle reconnection after connection loss
 * @param {string} userId - User ID
 * @param {function} onFriendshipChange - Callback function
 * @param {function} unsubscribe - Previous unsubscribe function
 * @returns {function} New unsubscribe function (returns no-op if reconnection fails)
 */
export function reconnectFriendshipSubscription(userId, onFriendshipChange, unsubscribe) {
  // Clean up old subscription
  if (unsubscribe) {
    unsubscribe()
  }

  // Create new subscription with exponential backoff
  let retryCount = 0
  const maxRetries = 5
  const baseDelay = 1000 // 1 second
  
  // Use an object to hold the unsubscribe function so closure can access updated value
  const state = {
    unsubscribeFn: null,
    timeoutIds: []
  }

  const attemptReconnect = () => {
    if (retryCount >= maxRetries) {
      console.error(`Failed to reconnect friendship subscription after ${maxRetries} attempts`)
      state.unsubscribeFn = () => {} // Set to no-op if reconnection fails
      return
    }

    const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff
    retryCount++

    const timeoutId = setTimeout(() => {
      try {
        state.unsubscribeFn = subscribeToFriendships(userId, onFriendshipChange)
      } catch (error) {
        console.error(`Reconnection attempt ${retryCount} failed:`, error)
        attemptReconnect() // Try again
      }
    }, delay)
    
    state.timeoutIds.push(timeoutId)
  }

  attemptReconnect()
  
  // Return unsubscribe function that handles both cases
  return () => {
    // Clear all pending timeouts
    state.timeoutIds.forEach(id => clearTimeout(id))
    state.timeoutIds = []
    
    // Call unsubscribe if it exists
    if (state.unsubscribeFn && typeof state.unsubscribeFn === 'function') {
      state.unsubscribeFn()
    }
  }
}

