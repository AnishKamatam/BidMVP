// contexts/ChatContext.js
// Provides chat/message state and functions to the entire app
// This context wraps the app in layout.js so any component can access:
//   - conversations: Array of user's conversations
//   - messages: Map of conversationId -> messages array
//   - unreadCount: Total unread messages
//   - messageRequests: Array of pending message requests
//   - activeConversation: Currently open conversation ID
//   - All message-related functions with optimistic updates and real-time sync

'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  getConversationsAction,
  getMessagesAction,
  sendMessageAction,
  createConversationAction,
  markAsReadAction,
  getUnreadCountAction,
  acceptMessageRequestAction,
  declineMessageRequestAction,
  createConversationWithEventHostAction
} from '@/app/actions/messages'
import { createClient } from '@/lib/supabase/client'

// Create the context that will hold our chat state and functions
const ChatContext = createContext({})

// Custom hook to use chat context in any component
// Usage: const { conversations, sendMessage, fetchMessages } = useChat()
export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    // Throw error if hook is used outside of ChatProvider
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

// Provider component that wraps the app and manages chat state
export function ChatProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  
  // State
  const [conversations, setConversations] = useState([]) // Array of conversations
  const [messages, setMessages] = useState(new Map()) // Map<conversationId, Array<message>>
  const [unreadCount, setUnreadCount] = useState(0) // Total unread messages
  const [messageRequests, setMessageRequests] = useState([]) // Pending message requests
  const [activeConversation, setActiveConversation] = useState(null) // Currently open conversation ID
  const [loading, setLoading] = useState(false) // Initial loading state - start as false to not block navigation
  const [error, setError] = useState(null) // Error message

  // Refs to track subscriptions
  const subscriptionsRef = useRef(new Map()) // Map<channelName, channel>

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([])
      return
    }

    try {
      const { data, error: fetchError } = await getConversationsAction()
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to fetch conversations')
        setConversations([])
      } else {
        setConversations(data || [])
        setError(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations')
      setConversations([])
    }
  }, [user?.id])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId, limit = 50, offset = 0) => {
    if (!user?.id || !conversationId) return

    try {
      const { data, error: fetchError } = await getMessagesAction(conversationId, limit, offset)
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to fetch messages')
        return
      }

      // Update messages map
      setMessages(prev => {
        const newMap = new Map(prev)
        if (offset === 0) {
          // Replace messages if loading from start
          newMap.set(conversationId, data || [])
        } else {
          // Append messages if loading more (pagination)
          const existing = newMap.get(conversationId) || []
          newMap.set(conversationId, [...existing, ...(data || [])])
        }
        return newMap
      })
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to fetch messages')
    }
  }, [user?.id])

  // Send a message with optimistic update
  const sendMessage = useCallback(async (conversationId, content, messageType = 'text', reactionType = null) => {
    if (!user?.id || !conversationId || !content) return

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      sender: {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'You',
        profile_pic: user.user_metadata?.profile_pic || null
      },
      content,
      type: messageType,
      reaction_type: reactionType,
      read_at: null,
      created_at: new Date().toISOString()
    }

    // Optimistic update: Add message immediately
    setMessages(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(conversationId) || []
      newMap.set(conversationId, [...existing, optimisticMessage])
      return newMap
    })

    // Update conversation's last_message_at optimistically
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, last_message_at: optimisticMessage.created_at }
        : conv
    ))

    try {
      const { data, error: sendError } = await sendMessageAction(conversationId, content, messageType, reactionType)
      
      if (sendError) {
        // Rollback optimistic update
        setMessages(prev => {
          const newMap = new Map(prev)
          const existing = newMap.get(conversationId) || []
          newMap.set(conversationId, existing.filter(m => m.id !== optimisticMessage.id))
          return newMap
        })
        setError(sendError.message || 'Failed to send message')
      } else if (data) {
        // Replace optimistic message with real message
        setMessages(prev => {
          const newMap = new Map(prev)
          const existing = newMap.get(conversationId) || []
          const filtered = existing.filter(m => m.id !== optimisticMessage.id)
          newMap.set(conversationId, [...filtered, data])
          return newMap
        })
      }
      // Real-time subscription will also update, but optimistic update provides instant feedback
    } catch (err) {
      // Rollback optimistic update
      setMessages(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(conversationId) || []
        newMap.set(conversationId, existing.filter(m => m.id !== optimisticMessage.id))
        return newMap
      })
      setError(err.message || 'Failed to send message')
    }
  }, [user?.id, user?.email, user?.user_metadata])

  // Create new conversation
  const createConversation = useCallback(async (user2Id) => {
    if (!user?.id || !user2Id) return null

    try {
      const { data, error: createError } = await createConversationAction(user2Id)
      
      if (createError) {
        setError(createError.message || 'Failed to create conversation')
        return null
      }

      // Add to conversations list
      if (data) {
        setConversations(prev => {
          // Check if already exists
          if (prev.some(c => c.id === data.id)) return prev
          return [...prev, data]
        })
      }

      return data
    } catch (err) {
      setError(err.message || 'Failed to create conversation')
      return null
    }
  }, [user?.id])

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0)
      return
    }

    try {
      const { data, error: countError } = await getUnreadCountAction()
      
      if (countError) {
        setError(countError.message || 'Failed to get unread count')
      } else {
        setUnreadCount(data?.total_unread || 0)
      }
    } catch (err) {
      setError(err.message || 'Failed to get unread count')
    }
  }, [user?.id])

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId) => {
    if (!user?.id || !conversationId) return

    try {
      const { data, error: markError } = await markAsReadAction(conversationId)
      
      if (markError) {
        setError(markError.message || 'Failed to mark as read')
        return
      }

      // Update messages to mark as read
      setMessages(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(conversationId) || []
        const updated = existing.map(msg => 
          msg.sender_id !== user.id && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
        newMap.set(conversationId, updated)
        return newMap
      })

      // Refresh unread count
      refreshUnreadCount()
    } catch (err) {
      setError(err.message || 'Failed to mark as read')
    }
  }, [user?.id, refreshUnreadCount])

  // Accept message request
  const acceptMessageRequest = useCallback(async (requestId) => {
    if (!user?.id || !requestId) return

    try {
      const { data, error: acceptError } = await acceptMessageRequestAction(requestId)
      
      if (acceptError) {
        setError(acceptError.message || 'Failed to accept message request')
      } else {
        // Remove from message requests
        setMessageRequests(prev => prev.filter(req => req.id !== requestId))
        // Refresh conversations to update status
        fetchConversations()
      }
    } catch (err) {
      setError(err.message || 'Failed to accept message request')
    }
  }, [user?.id, fetchConversations])

  // Decline message request
  const declineMessageRequest = useCallback(async (requestId) => {
    if (!user?.id || !requestId) return

    try {
      const { data, error: declineError } = await declineMessageRequestAction(requestId)
      
      if (declineError) {
        setError(declineError.message || 'Failed to decline message request')
      } else {
        // Remove from message requests
        setMessageRequests(prev => prev.filter(req => req.id !== requestId))
      }
    } catch (err) {
      setError(err.message || 'Failed to decline message request')
    }
  }, [user?.id])

  // Create conversation with event host
  const createConversationWithEventHost = useCallback(async (eventId) => {
    if (!user?.id || !eventId) return null

    try {
      const { data, error: createError } = await createConversationWithEventHostAction(eventId)
      
      if (createError) {
        setError(createError.message || 'Failed to create conversation with host')
        return null
      }

      // Add conversation to list
      if (data?.conversation) {
        setConversations(prev => {
          if (prev.some(c => c.id === data.conversation.id)) return prev
          return [...prev, data.conversation]
        })
      }

      // Add message request to list
      if (data?.message_request) {
        setMessageRequests(prev => {
          if (prev.some(r => r.id === data.message_request.id)) return prev
          return [...prev, data.message_request]
        })
      }

      return data
    } catch (err) {
      setError(err.message || 'Failed to create conversation with host')
      return null
    }
  }, [user?.id])

  // Set up real-time subscriptions
  useEffect(() => {
    if (authLoading || !user?.id) {
      // Clean up all subscriptions
      subscriptionsRef.current.forEach((channel) => {
        const supabase = createClient()
        supabase.removeChannel(channel)
      })
      subscriptionsRef.current.clear()
      return
    }

    const supabase = createClient()

    // Subscribe to conversations updates
    const conversationsChannel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `user1_id=eq.${user.id} OR user2_id=eq.${user.id}`
        },
        (payload) => {
          // Update conversation in list
          setConversations(prev => prev.map(conv => 
            conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
          ))
        }
      )
      .subscribe()

    subscriptionsRef.current.set('conversations', conversationsChannel)

    // Subscribe to messages for all user's conversations
    // Supabase Realtime doesn't support .in() filters, so we subscribe to each conversation
    // But we use a single channel with multiple filters to avoid creating too many channels
    const conversationIds = conversations.map(c => c.id)
    
    // Clean up old message subscriptions
    const oldMessageChannels = Array.from(subscriptionsRef.current.keys())
      .filter(key => key.startsWith('messages-') && key !== 'messages')
    oldMessageChannels.forEach(key => {
      const channel = subscriptionsRef.current.get(key)
      if (channel) {
        supabase.removeChannel(channel)
        subscriptionsRef.current.delete(key)
      }
    })

    // Subscribe to messages for each conversation individually
    // This is necessary because Supabase Realtime doesn't support .in() filters
    conversationIds.forEach(conversationId => {
      const channelName = `messages-${conversationId}`
      if (subscriptionsRef.current.has(channelName)) return // Already subscribed

      const messagesChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            // Add new message
            setMessages(prev => {
              const newMap = new Map(prev)
              const existing = newMap.get(conversationId) || []
              // Check if message already exists (avoid duplicates)
              if (existing.some(m => m.id === payload.new.id)) return prev
              newMap.set(conversationId, [...existing, payload.new])
              return newMap
            })

            // Update conversation's last_message_at
            setConversations(prev => prev.map(conv => 
              conv.id === conversationId 
                ? { ...conv, last_message_at: payload.new.created_at }
                : conv
            ))

            // Mark as read if this is the active conversation
            if (activeConversation === conversationId && payload.new.sender_id !== user.id) {
              markAsRead(conversationId)
            }

            // Refresh unread count
            refreshUnreadCount()
          }
        )
        .subscribe()

      subscriptionsRef.current.set(channelName, messagesChannel)
    })

    // Subscribe to message requests
    // Subscribe to requests where user is requester OR recipient
    const messageRequestsChannel = supabase
      .channel(`message-requests-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_requests'
        },
        (payload) => {
          // Check if this request is relevant to the user
          // We need to check if the conversation belongs to the user
          const conversationId = payload.new?.conversation_id || payload.old?.conversation_id
          const isRelevant = conversations.some(c => c.id === conversationId)
          
          if (!isRelevant) return

          if (payload.eventType === 'INSERT') {
            setMessageRequests(prev => {
              if (prev.some(r => r.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          } else if (payload.eventType === 'UPDATE') {
            setMessageRequests(prev => prev.map(req => 
              req.id === payload.new.id ? payload.new : req
            ))
          } else if (payload.eventType === 'DELETE') {
            setMessageRequests(prev => prev.filter(req => req.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    subscriptionsRef.current.set('message-requests', messageRequestsChannel)

    return () => {
      // Cleanup all subscriptions
      subscriptionsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
      subscriptionsRef.current.clear()
    }
  }, [user?.id, authLoading, conversations, activeConversation, markAsRead, refreshUnreadCount])

  // Load initial data when user is authenticated
  useEffect(() => {
    let mounted = true
    let timeoutId = null
    let safetyTimeoutId = null

    // Safety timeout: Always resolve loading within 10 seconds
    safetyTimeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Chat context safety timeout: forcing loading to false after 10 seconds')
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
      // Load unread count first (needed for nav badge) - don't block on conversations
      refreshUnreadCount()
      
      // Load conversations in background - set loading only for conversations fetch
      setLoading(true)
      setError(null)

      // Set timeout for individual fetch operations
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('Chat data fetch timed out after 8 seconds, setting loading to false')
          setLoading(false)
        }
      }, 8000)

      // Load initial data - unread count already fetched above
      fetchConversations().finally(() => {
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
      setConversations([])
      setMessages(new Map())
      setUnreadCount(0)
      setMessageRequests([])
      setActiveConversation(null)
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
    conversations,
    messages,
    unreadCount,
    messageRequests,
    activeConversation,
    loading,
    error,
    
    // Functions
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    markAsRead,
    refreshUnreadCount,
    acceptMessageRequest,
    declineMessageRequest,
    createConversationWithEventHost,
    setActiveConversation
  }), [
    conversations,
    messages,
    unreadCount,
    messageRequests,
    activeConversation,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    markAsRead,
    refreshUnreadCount,
    acceptMessageRequest,
    declineMessageRequest,
    createConversationWithEventHost
  ])

  // Provide chat state and functions to all child components
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

