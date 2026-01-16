// contexts/FriendContext.js
// Provides friend state and functions to the entire app
// This context wraps the app in layout.js so any component can access:
//   - friends: Array of accepted friends
//   - receivedRequests: Array of incoming friend requests
//   - sentRequests: Array of outgoing friend requests
//   - suggestions: Array of people you might have met
//   - friendshipStatuses: Map of userId -> status for quick lookups
//   - loading, error, refreshing: State flags
//   - All friend-related functions with optimistic updates and real-time sync

'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  getFriendsAction,
  getFriendRequestsAction,
  getPeopleYouMetAction,
  sendFriendRequestAction,
  acceptFriendRequestAction,
  declineFriendRequestAction,
  cancelFriendRequestAction,
  removeFriendAction,
  getFriendshipStatusAction,
  getFriendProfilesBatchAction
} from '@/app/actions/friends'
import { subscribeToFriendships } from '@/lib/supabase/realtime'

// Create the context that will hold our friend state and functions
const FriendContext = createContext({})

// Custom hook to use friend context in any component
// Usage: const { friends, sendFriendRequest, getFriendshipStatus } = useFriend()
export const useFriend = () => {
  const context = useContext(FriendContext)
  if (!context) {
    // Throw error if hook is used outside of FriendProvider
    throw new Error('useFriend must be used within a FriendProvider')
  }
  return context
}

// Provider component that wraps the app and manages friend state
export function FriendProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  
  // State
  const [friends, setFriends] = useState([]) // Array of accepted friends
  const [receivedRequests, setReceivedRequests] = useState([]) // Incoming friend requests
  const [sentRequests, setSentRequests] = useState([]) // Outgoing friend requests
  const [suggestions, setSuggestions] = useState([]) // People you might have met
  const [friendshipStatuses, setFriendshipStatuses] = useState(new Map()) // userId -> status cache
  const [loading, setLoading] = useState(false) // Initial loading state - start false to not block
  const [error, setError] = useState(null) // Error message
  const [refreshing, setRefreshing] = useState(false) // Manual refresh state

  // Ref to track subscription cleanup
  const unsubscribeRef = useRef(null)

  // Fetch friends list
  const refreshFriends = useCallback(async () => {
    if (!user?.id) {
      setFriends([])
      return
    }

    try {
      const { data, error: fetchError } = await getFriendsAction()
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to fetch friends')
        setFriends([])
      } else {
        // Backend returns [{friend: {...}, friendship: {...}}]
        const friendList = (data || []).map(item => item.friend)
        setFriends(friendList)
        
        // Update friendship statuses cache
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          friendList.forEach(friend => {
            newMap.set(friend.id, 'accepted')
          })
          return newMap
        })
        
        setError(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch friends')
      setFriends([])
    }
  }, [user?.id])

  // Fetch friend requests (both sent and received)
  const refreshRequests = useCallback(async () => {
    if (!user?.id) {
      setReceivedRequests([])
      setSentRequests([])
      return
    }

    try {
      const { data, error: fetchError } = await getFriendRequestsAction()
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to fetch friend requests')
        setReceivedRequests([])
        setSentRequests([])
      } else {
        // Backend returns {sent: [], received: []}
        // Ensure we always have arrays, even if data structure is unexpected
        const received = Array.isArray(data?.received) ? data.received : []
        const sent = Array.isArray(data?.sent) ? data.sent : []
        
        setReceivedRequests(received)
        setSentRequests(sent)
        
        // Update friendship statuses cache
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          received.forEach(request => {
            if (request?.user?.id) {
              newMap.set(request.user.id, 'pending_received')
            }
          })
          sent.forEach(request => {
            if (request?.user?.id) {
              newMap.set(request.user.id, 'pending_sent')
            }
          })
          return newMap
        })
        
        setError(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch friend requests')
      setReceivedRequests([])
      setSentRequests([])
    }
  }, [user?.id])

  // Fetch suggestions
  const refreshSuggestions = useCallback(async () => {
    if (!user?.id) {
      setSuggestions([])
      return
    }

    try {
      const { data, error: fetchError } = await getPeopleYouMetAction(20, true)
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to fetch suggestions')
        setSuggestions([])
      } else {
        // Backend returns [{user: {...}, sharedEvents: number, lastEventDate: string, isSameSchool: boolean}]
        // Transform to match frontend format
        const formatted = (data || []).map(item => ({
          id: item.user.id,
          name: item.user.name,
          profile_pic: item.user.profile_pic,
          year: item.user.year,
          sharedEvents: item.sharedEvents,
          lastEventDate: item.lastEventDate,
          isSameSchool: item.isSameSchool || false
        }))
        setSuggestions(formatted)
        setError(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch suggestions')
      setSuggestions([])
    }
  }, [user?.id])

  // Refresh all friend data
  const refreshAll = useCallback(async () => {
    if (!user?.id) return
    
    setRefreshing(true)
    setError(null)
    
    try {
      await Promise.all([
        refreshFriends(),
        refreshRequests(),
        refreshSuggestions()
      ])
    } catch (err) {
      setError(err.message || 'Failed to refresh friend data')
    } finally {
      setRefreshing(false)
    }
  }, [user?.id, refreshFriends, refreshRequests, refreshSuggestions])

  // Get friendship status (from cache or fetch)
  const getFriendshipStatus = useCallback(async (otherUserId) => {
    if (!user?.id || !otherUserId) return { status: 'none', friendship: null }
    
    // Check cache first
    const cachedStatus = friendshipStatuses.get(otherUserId)
    if (cachedStatus) {
      return { status: cachedStatus, friendship: null }
    }
    
    // If not cached, fetch it
    try {
      const { data, error: fetchError } = await getFriendshipStatusAction(otherUserId)
      
      if (fetchError) {
        return { status: 'none', friendship: null }
      }
      
      // Update cache
      if (data?.status) {
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(otherUserId, data.status)
          return newMap
        })
      }
      
      return { status: data?.status || 'none', friendship: data?.friendship || null }
    } catch (err) {
      return { status: 'none', friendship: null }
    }
  }, [user?.id, friendshipStatuses])

  // Send friend request with optimistic update
  const sendFriendRequest = useCallback(async (friendId) => {
    if (!user?.id || !friendId) return

    // Save previous state for rollback
    const previousState = {
      sentRequests: [...sentRequests],
      suggestions: [...suggestions],
      friendshipStatuses: new Map(friendshipStatuses)
    }

    // Optimistic update: Add to sent requests immediately
    const optimisticRequest = {
      id: `temp-${Date.now()}`,
      user: {
        id: friendId,
        name: suggestions.find(s => s.id === friendId)?.name || null,
        profile_pic: suggestions.find(s => s.id === friendId)?.profile_pic || null,
        year: suggestions.find(s => s.id === friendId)?.year || null
      },
      created_at: new Date().toISOString()
    }
    
    setSentRequests(prev => [...prev, optimisticRequest])
    setSuggestions(prev => prev.filter(s => s.id !== friendId))
    setFriendshipStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(friendId, 'pending_sent')
      return newMap
    })

    try {
      const { data, error: requestError } = await sendFriendRequestAction(friendId)
      
      if (requestError) {
        // Rollback on error
        setSentRequests(previousState.sentRequests)
        setSuggestions(previousState.suggestions)
        setFriendshipStatuses(previousState.friendshipStatuses)
        setError(requestError.message || 'Failed to send friend request')
      }
      // On success, real-time subscription will update with actual data
    } catch (err) {
      // Rollback on error
      setSentRequests(previousState.sentRequests)
      setSuggestions(previousState.suggestions)
      setFriendshipStatuses(previousState.friendshipStatuses)
      setError(err.message || 'Failed to send friend request')
    }
  }, [user?.id, sentRequests, suggestions, friendshipStatuses])

  // Accept friend request with optimistic update
  const acceptFriendRequest = useCallback(async (friendId) => {
    if (!user?.id || !friendId) return

    // Find the request
    const request = receivedRequests.find(r => r.user?.id === friendId)
    if (!request) return

    // Save previous state for rollback
    const previousState = {
      receivedRequests: [...receivedRequests],
      friends: [...friends],
      friendshipStatuses: new Map(friendshipStatuses)
    }

    // Optimistic update: Remove from received requests, add to friends
    setReceivedRequests(prev => prev.filter(r => r.user?.id !== friendId))
    
    // Fetch friend profile for the friends list
    try {
      const { data: profiles } = await getFriendProfilesBatchAction([friendId])
      if (profiles && profiles.length > 0) {
        setFriends(prev => [...prev, profiles[0]])
      }
    } catch (err) {
      console.error('Failed to fetch friend profile:', err)
    }
    
    setFriendshipStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(friendId, 'accepted')
      return newMap
    })

    try {
      const { error: acceptError } = await acceptFriendRequestAction(friendId)
      
      if (acceptError) {
        // Rollback on error
        setReceivedRequests(previousState.receivedRequests)
        setFriends(previousState.friends)
        setFriendshipStatuses(previousState.friendshipStatuses)
        setError(acceptError.message || 'Failed to accept friend request')
      }
      // On success, real-time subscription will update with actual data
    } catch (err) {
      // Rollback on error
      setReceivedRequests(previousState.receivedRequests)
      setFriends(previousState.friends)
      setFriendshipStatuses(previousState.friendshipStatuses)
      setError(err.message || 'Failed to accept friend request')
    }
  }, [user?.id, receivedRequests, friends, friendshipStatuses])

  // Decline friend request with optimistic update
  const declineFriendRequest = useCallback(async (friendId) => {
    if (!user?.id || !friendId) return

    // Save previous state for rollback
    const previousState = {
      receivedRequests: [...receivedRequests],
      friendshipStatuses: new Map(friendshipStatuses)
    }

    // Optimistic update: Remove from received requests
    setReceivedRequests(prev => prev.filter(r => r.user?.id !== friendId))
    setFriendshipStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(friendId, 'none')
      return newMap
    })

    try {
      const { error: declineError } = await declineFriendRequestAction(friendId)
      
      if (declineError) {
        // Rollback on error
        setReceivedRequests(previousState.receivedRequests)
        setFriendshipStatuses(previousState.friendshipStatuses)
        setError(declineError.message || 'Failed to decline friend request')
      }
      // On success, real-time subscription will confirm
    } catch (err) {
      // Rollback on error
      setReceivedRequests(previousState.receivedRequests)
      setFriendshipStatuses(previousState.friendshipStatuses)
      setError(err.message || 'Failed to decline friend request')
    }
  }, [user?.id, receivedRequests, friendshipStatuses])

  // Cancel friend request with optimistic update
  const cancelFriendRequest = useCallback(async (friendId) => {
    if (!user?.id || !friendId) return

    // Save previous state for rollback
    const previousState = {
      sentRequests: [...sentRequests],
      friendshipStatuses: new Map(friendshipStatuses)
    }

    // Optimistic update: Remove from sent requests
    setSentRequests(prev => prev.filter(r => r.user?.id !== friendId))
    setFriendshipStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(friendId, 'none')
      return newMap
    })

    try {
      const { error: cancelError } = await cancelFriendRequestAction(friendId)
      
      if (cancelError) {
        // Rollback on error
        setSentRequests(previousState.sentRequests)
        setFriendshipStatuses(previousState.friendshipStatuses)
        setError(cancelError.message || 'Failed to cancel friend request')
      }
      // On success, real-time subscription will confirm
    } catch (err) {
      // Rollback on error
      setSentRequests(previousState.sentRequests)
      setFriendshipStatuses(previousState.friendshipStatuses)
      setError(err.message || 'Failed to cancel friend request')
    }
  }, [user?.id, sentRequests, friendshipStatuses])

  // Remove friend with optimistic update
  const removeFriend = useCallback(async (friendId) => {
    if (!user?.id || !friendId) return

    // Save previous state for rollback
    const previousState = {
      friends: [...friends],
      friendshipStatuses: new Map(friendshipStatuses)
    }

    // Optimistic update: Remove from friends
    setFriends(prev => prev.filter(f => f.id !== friendId))
    setFriendshipStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(friendId, 'none')
      return newMap
    })

    try {
      const { error: removeError } = await removeFriendAction(friendId)
      
      if (removeError) {
        // Rollback on error
        setFriends(previousState.friends)
        setFriendshipStatuses(previousState.friendshipStatuses)
        setError(removeError.message || 'Failed to remove friend')
      }
      // On success, real-time subscription will confirm
    } catch (err) {
      // Rollback on error
      setFriends(previousState.friends)
      setFriendshipStatuses(previousState.friendshipStatuses)
      setError(err.message || 'Failed to remove friend')
    }
  }, [user?.id, friends, friendshipStatuses])

  // Handle real-time friendship changes
  const handleFriendshipChange = useCallback(async (event) => {
    const { eventType, friendship, isUserSender } = event
    
    if (!friendship) return

    const otherUserId = isUserSender ? friendship.friend_id : friendship.user_id
    const status = friendship.status

    if (eventType === 'INSERT') {
      if (status === 'pending') {
        // Fetch full user profile for the request
        getFriendProfilesBatchAction([otherUserId]).then(({ data }) => {
          const userProfile = data && data.length > 0 ? data[0] : { id: otherUserId }
          
          if (isUserSender) {
            // User sent the request
            setSentRequests(prev => {
              // Check if already exists
              if (prev.some(r => r.user?.id === otherUserId)) return prev
              return [...prev, {
                id: friendship.id,
                user: userProfile,
                created_at: friendship.created_at
              }]
            })
          } else {
            // User received the request
            setReceivedRequests(prev => {
              // Check if already exists
              if (prev.some(r => r.user?.id === otherUserId)) return prev
              return [...prev, {
                id: friendship.id,
                user: userProfile,
                created_at: friendship.created_at
              }]
            })
          }
        }).catch(err => {
          console.error('Failed to fetch user profile for request:', err)
          // Add with minimal data if fetch fails
          const minimalUser = { id: otherUserId }
          if (isUserSender) {
            setSentRequests(prev => {
              if (prev.some(r => r.user?.id === otherUserId)) return prev
              return [...prev, {
                id: friendship.id,
                user: minimalUser,
                created_at: friendship.created_at
              }]
            })
          } else {
            setReceivedRequests(prev => {
              if (prev.some(r => r.user?.id === otherUserId)) return prev
              return [...prev, {
                id: friendship.id,
                user: minimalUser,
                created_at: friendship.created_at
              }]
            })
          }
        })
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(otherUserId, isUserSender ? 'pending_sent' : 'pending_received')
          return newMap
        })
      } else if (status === 'accepted') {
        // Friend added - fetch full profile
        setSentRequests(prev => prev.filter(r => r.user?.id !== otherUserId))
        setReceivedRequests(prev => prev.filter(r => r.user?.id !== otherUserId))
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(otherUserId, 'accepted')
          return newMap
        })
        
        // Fetch full friend profile
        getFriendProfilesBatchAction([otherUserId]).then(({ data }) => {
          if (data && data.length > 0) {
            setFriends(prev => {
              if (prev.some(f => f.id === otherUserId)) return prev
              return [...prev, data[0]]
            })
          }
        }).catch(err => {
          console.error('Failed to fetch friend profile:', err)
          // Add with just ID if fetch fails
          setFriends(prev => {
            if (prev.some(f => f.id === otherUserId)) return prev
            return [...prev, { id: otherUserId }]
          })
        })
      }
    } else if (eventType === 'UPDATE') {
      if (status === 'accepted') {
        // Request accepted - move from requests to friends and fetch profile
        setSentRequests(prev => prev.filter(r => r.user?.id !== otherUserId))
        setReceivedRequests(prev => prev.filter(r => r.user?.id !== otherUserId))
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(otherUserId, 'accepted')
          return newMap
        })
        
        // Fetch full friend profile
        getFriendProfilesBatchAction([otherUserId]).then(({ data }) => {
          if (data && data.length > 0) {
            setFriends(prev => {
              if (prev.some(f => f.id === otherUserId)) return prev
              return [...prev, data[0]]
            })
          }
        }).catch(err => {
          console.error('Failed to fetch friend profile:', err)
          // Add with just ID if fetch fails
          setFriends(prev => {
            if (prev.some(f => f.id === otherUserId)) return prev
            return [...prev, { id: otherUserId }]
          })
        })
      } else if (status === 'blocked') {
        // Friend blocked - remove from friends
        setFriends(prev => prev.filter(f => f.id !== otherUserId))
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(otherUserId, 'blocked')
          return newMap
        })
      } else if (status === 'pending') {
        // Status changed to pending
        setFriendshipStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(otherUserId, isUserSender ? 'pending_sent' : 'pending_received')
          return newMap
        })
      }
    } else if (eventType === 'DELETE') {
      // Friendship removed
      setFriends(prev => prev.filter(f => f.id !== otherUserId))
      setSentRequests(prev => prev.filter(r => r.user?.id !== otherUserId))
      setReceivedRequests(prev => prev.filter(r => r.user?.id !== otherUserId))
      setFriendshipStatuses(prev => {
        const newMap = new Map(prev)
        newMap.set(otherUserId, 'none')
        return newMap
      })
    }
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (authLoading || !user?.id) {
      // Clean up subscription if user logs out
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      return
    }

    // Subscribe to friendship changes
    const unsubscribe = subscribeToFriendships(user.id, handleFriendshipChange)
    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [user?.id, authLoading, handleFriendshipChange])

  // Load initial data when user is authenticated
  useEffect(() => {
    let mounted = true
    let timeoutId = null
    let safetyTimeoutId = null

    // Safety timeout: Always resolve loading within 10 seconds
    safetyTimeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Friend context safety timeout: forcing loading to false after 10 seconds')
        setLoading(false)
        setError(null)
      }
    }, 10000)

    // Wait for auth to finish loading
    if (authLoading) {
      return () => {
        mounted = false
        if (safetyTimeoutId) {
          clearTimeout(safetyTimeoutId)
        }
      }
    }

    // Clear safety timeout if auth is done
    if (safetyTimeoutId) {
      clearTimeout(safetyTimeoutId)
      safetyTimeoutId = null
    }

    if (user?.id) {
      setLoading(true)
      setError(null)

      // Set timeout for individual fetch operations
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('Friend data fetch timed out after 8 seconds, setting loading to false')
          setLoading(false)
        }
      }, 8000)

      // Load initial data
      refreshAll().finally(() => {
        if (mounted) {
          setLoading(false)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }
      })
    } else {
      // No user - clear all data
      setFriends([])
      setReceivedRequests([])
      setSentRequests([])
      setSuggestions([])
      setFriendshipStatuses(new Map())
      setLoading(false)
      setError(null)
      if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId)
      }
    }

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    friends,
    receivedRequests,
    sentRequests,
    suggestions,
    friendshipStatuses,
    loading,
    error,
    refreshing,
    
    // Functions
    refreshFriends,
    refreshRequests,
    refreshSuggestions,
    refreshAll,
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend
  }), [
    friends,
    receivedRequests,
    sentRequests,
    suggestions,
    friendshipStatuses,
    loading,
    error,
    refreshing,
    refreshFriends,
    refreshRequests,
    refreshSuggestions,
    refreshAll,
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend
  ])

  // Provide friend state and functions to all child components
  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>
}

