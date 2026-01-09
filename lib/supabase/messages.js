// lib/supabase/messages.js
// Chat/DM system functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { randomUUID } from 'crypto'

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
 * Helper function to ensure consistent ordering of users in conversations
 * Always stores smaller ID as user1_id, larger as user2_id
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {object} Object with ordered user1_id and user2_id
 */
function ensureConversationOrder(userId1, userId2) {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required')
  }
  if (userId1 === userId2) {
    throw new Error('Cannot create conversation with self')
  }
  
  // Order lexicographically
  const user1Id = userId1 < userId2 ? userId1 : userId2
  const user2Id = userId1 < userId2 ? userId2 : userId1
  
  return { user1Id, user2Id }
}

/**
 * Helper function to validate that a user is part of a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID to validate
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<{isValid: boolean, error: object|null}>}
 */
async function validateConversationAccess(conversationId, userId, supabase) {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (error || !conversation) {
      return { isValid: false, error: { message: 'Conversation not found' } }
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return { isValid: false, error: { message: 'User is not part of this conversation' } }
    }

    return { isValid: true, error: null }
  } catch (error) {
    return { isValid: false, error: { message: error.message || 'Failed to validate conversation access' } }
  }
}

/**
 * Create or retrieve an existing conversation between two users
 * @param {string} user1Id - Current user ID
 * @param {string} user2Id - Other user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createConversation(user1Id, user2Id) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!user1Id || !user2Id) {
      return { data: null, error: { message: 'Both user IDs are required' } }
    }

    // Ensure consistent ordering
    let user1IdOrdered, user2IdOrdered
    try {
      const ordered = ensureConversationOrder(user1Id, user2Id)
      user1IdOrdered = ordered.user1Id
      user2IdOrdered = ordered.user2Id
    } catch (error) {
      return { data: null, error: { message: error.message } }
    }

    // Validate both users exist
    const { data: user1, error: user1Error } = await supabase
      .from('User')
      .select('id')
      .eq('id', user1IdOrdered)
      .maybeSingle()

    if (user1Error || !user1) {
      return { data: null, error: { message: 'User 1 not found' } }
    }

    const { data: user2, error: user2Error } = await supabase
      .from('User')
      .select('id')
      .eq('id', user2IdOrdered)
      .maybeSingle()

    if (user2Error || !user2) {
      return { data: null, error: { message: 'User 2 not found' } }
    }

    // Check if conversation already exists
    const { data: existingConversation, error: existingError } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id, last_message_at, created_at')
      .eq('user1_id', user1IdOrdered)
      .eq('user2_id', user2IdOrdered)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      return { data: null, error: serializeError(existingError, 'Failed to check existing conversation') }
    }

    if (existingConversation) {
      // Get other user info (the user that is not the current user)
      const otherUserId = user1Id === user1IdOrdered ? user2IdOrdered : user1IdOrdered
      
      const { data: otherUser, error: otherUserError } = await supabase
        .from('User')
        .select('id, name, email, profile_pic')
        .eq('id', otherUserId)
        .single()

      if (otherUserError || !otherUser) {
        return { data: null, error: { message: 'Other user not found' } }
      }

      return {
        data: {
          id: existingConversation.id,
          user1_id: existingConversation.user1_id,
          user2_id: existingConversation.user2_id,
          last_message_at: existingConversation.last_message_at ? new Date(existingConversation.last_message_at).toISOString() : null,
          created_at: new Date(existingConversation.created_at).toISOString(),
          other_user: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            profile_pic: otherUser.profile_pic
          }
        },
        error: null
      }
    }

    // Create new conversation
    const conversationId = randomUUID()
    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        user1_id: user1IdOrdered,
        user2_id: user2IdOrdered,
        last_message_at: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError, 'Failed to create conversation') }
    }

    // Get other user info
    const otherUserId = user1Id === user1IdOrdered ? user2IdOrdered : user1IdOrdered
    
    const { data: otherUser, error: otherUserError } = await supabase
      .from('User')
      .select('id, name, email, profile_pic')
      .eq('id', otherUserId)
      .single()

    if (otherUserError || !otherUser) {
      return { data: null, error: { message: 'Other user not found' } }
    }

    return {
      data: {
        id: newConversation.id,
        user1_id: newConversation.user1_id,
        user2_id: newConversation.user2_id,
        last_message_at: newConversation.last_message_at ? new Date(newConversation.last_message_at).toISOString() : null,
        created_at: new Date(newConversation.created_at).toISOString(),
        other_user: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          profile_pic: otherUser.profile_pic
        }
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create conversation' } }
  }
}

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender user ID
 * @param {string} content - Message content
 * @param {string} messageType - Message type: 'text' or 'reaction' (default: 'text')
 * @param {string} reactionType - Reaction type: 'thumbs_up' or 'thumbs_down' (required if messageType is 'reaction')
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function sendMessage(conversationId, senderId, content, messageType = 'text', reactionType = null) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!conversationId || !senderId) {
      return { data: null, error: { message: 'Conversation ID and sender ID are required' } }
    }

    // Validate conversation exists and sender is part of it
    const { isValid, error: accessError } = await validateConversationAccess(conversationId, senderId, supabase)
    if (!isValid) {
      return { data: null, error: accessError }
    }

    // Enforce message request validation
    const { data: messageRequest, error: requestError } = await supabase
      .from('message_requests')
      .select('id, status, requester_id')
      .eq('conversation_id', conversationId)
      .maybeSingle()

    if (requestError && requestError.code !== 'PGRST116') {
      return { data: null, error: serializeError(requestError, 'Failed to check message request') }
    }

    if (messageRequest) {
      // Message request exists - validate status
      if (messageRequest.status === 'pending') {
        return { data: null, error: { message: 'Cannot send message. Message request is pending approval.' } }
      }
      if (messageRequest.status === 'declined') {
        return { data: null, error: { message: 'Cannot send message. Message request was declined.' } }
      }
      // If status is 'accepted', allow sending
    }
    // If no message request exists, allow sending (for MVP, can create conversation without request initially)

    // Validate message content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return { data: null, error: { message: 'Message content is required' } }
    }

    const trimmedContent = content.trim()
    if (trimmedContent.length > 5000) {
      return { data: null, error: { message: 'Message content must be 5000 characters or less' } }
    }

    // Validate message type
    if (messageType !== 'text' && messageType !== 'reaction') {
      return { data: null, error: { message: 'Invalid message type. Must be "text" or "reaction"' } }
    }

    // Validate reaction type if message type is reaction
    if (messageType === 'reaction') {
      if (!reactionType || (reactionType !== 'thumbs_up' && reactionType !== 'thumbs_down')) {
        return { data: null, error: { message: 'Reaction type is required and must be "thumbs_up" or "thumbs_down" when message type is "reaction"' } }
      }
    } else {
      // For text messages, reaction_type should be null
      reactionType = null
    }

    // Insert message
    const messageId = randomUUID()
    const now = new Date().toISOString()
    
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        conversation_id: conversationId,
        sender_id: senderId,
        content: trimmedContent,
        type: messageType,
        reaction_type: reactionType,
        read_at: null,
        created_at: now
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError, 'Failed to send message') }
    }

    // Note: last_message_at is automatically updated by database trigger
    // See migration 015_messages_triggers.sql

    return {
      data: {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        type: message.type,
        reaction_type: message.reaction_type,
        read_at: message.read_at ? new Date(message.read_at).toISOString() : null,
        created_at: new Date(message.created_at).toISOString()
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to send message' } }
  }
}

/**
 * Get messages for a conversation with pagination
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - Current user ID (for authorization check)
 * @param {number} limit - Number of messages to return (default: 50)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getMessages(conversationId, userId, limit = 50, offset = 0) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!conversationId || !userId) {
      return { data: null, error: { message: 'Conversation ID and user ID are required' } }
    }

    // Validate user is part of the conversation
    const { isValid, error: accessError } = await validateConversationAccess(conversationId, userId, supabase)
    if (!isValid) {
      return { data: null, error: accessError }
    }

    // Validate pagination parameters
    const validLimit = limit && limit > 0 ? Math.min(limit, 100) : 50
    const validOffset = offset && offset >= 0 ? offset : 0

    // Query messages ordered by created_at DESC (newest first), then reverse for display (oldest first)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        type,
        reaction_type,
        read_at,
        created_at,
        sender:User!messages_sender_id_fkey (
          id,
          name,
          profile_pic
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(validOffset, validOffset + validLimit - 1)

    if (messagesError) {
      return { data: null, error: serializeError(messagesError, 'Failed to get messages') }
    }

    // Reverse to show oldest first (for display)
    const reversedMessages = (messages || []).reverse()

    // Format messages
    const formattedMessages = reversedMessages.map(message => ({
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender: message.sender ? {
        id: message.sender.id,
        name: message.sender.name,
        profile_pic: message.sender.profile_pic
      } : null,
      content: message.content,
      type: message.type,
      reaction_type: message.reaction_type,
      read_at: message.read_at ? new Date(message.read_at).toISOString() : null,
      created_at: new Date(message.created_at).toISOString()
    }))

    return { data: formattedMessages, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get messages' } }
  }
}

/**
 * Get all conversations for a user, ordered by most recent message
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getConversations(userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } }
    }

    // Query conversations where user is either user1 or user2
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id, last_message_at, created_at')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (conversationsError) {
      return { data: null, error: serializeError(conversationsError, 'Failed to get conversations') }
    }

    if (!conversations || conversations.length === 0) {
      return { data: [], error: null }
    }

    // Optimize: Batch fetch all required data instead of N+1 queries
    const conversationIds = conversations.map(c => c.id)
    const otherUserIds = conversations.map(c => 
      c.user1_id === userId ? c.user2_id : c.user1_id
    )
    const uniqueOtherUserIds = [...new Set(otherUserIds)]

    // Create conversation map for efficient lookup (optimize the .find() in loop)
    const conversationMap = new Map(conversations.map(c => [c.id, c]))

    // Batch fetch all other users
    const { data: otherUsers, error: otherUsersError } = await supabase
      .from('User')
      .select('id, name, email, profile_pic')
      .in('id', uniqueOtherUserIds)

    if (otherUsersError) {
      return { data: null, error: serializeError(otherUsersError, 'Failed to get other users') }
    }

    const otherUsersMap = new Map((otherUsers || []).map(u => [u.id, u]))

    // Batch fetch all last messages using a single query
    // Note: We fetch recent messages (limit 100 per conversation in worst case) and filter in memory
    // This is efficient for MVP scale. For larger scale, consider using database functions
    let lastMessagesMap = new Map()
    let unreadCountsMap = new Map()

    // Only fetch messages if there are conversations
    if (conversationIds.length > 0) {
      const { data: recentMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id, conversation_id, content, sender_id, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(Math.max(conversationIds.length * 10, 50)) // Fetch up to 10 messages per conversation (enough to get latest)

      if (messagesError) {
        // Log error but don't fail - continue with empty last messages
        console.error('Failed to fetch recent messages:', messagesError)
      } else {
        // Group messages by conversation and get the latest one
        if (recentMessages) {
          for (const msg of recentMessages) {
            if (!lastMessagesMap.has(msg.conversation_id)) {
              lastMessagesMap.set(msg.conversation_id, msg)
            }
          }
        }
      }

      // Batch fetch unread counts for all conversations
      // Get all unread messages from other users across all conversations
      if (uniqueOtherUserIds.length > 0) {
        const { data: unreadMessages, error: unreadError } = await supabase
          .from('messages')
          .select('conversation_id, sender_id')
          .in('conversation_id', conversationIds)
          .in('sender_id', uniqueOtherUserIds)
          .is('read_at', null)

        if (unreadError) {
          // Log error but don't fail - continue with zero unread counts
          console.error('Failed to fetch unread messages:', unreadError)
        } else {
          // Count unread messages per conversation (optimized: use map instead of find)
          if (unreadMessages) {
            for (const msg of unreadMessages) {
              const conversation = conversationMap.get(msg.conversation_id)
              if (conversation) {
                const otherUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id
                if (msg.sender_id === otherUserId) {
                  unreadCountsMap.set(msg.conversation_id, (unreadCountsMap.get(msg.conversation_id) || 0) + 1)
                }
              }
            }
          }
        }
      }
    }

    // Format conversations with batch-fetched data
    const formattedConversations = conversations
      .map((conversation) => {
        const otherUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id
        const otherUser = otherUsersMap.get(otherUserId)

        if (!otherUser) {
          // Skip if other user not found
          return null
        }

        const lastMessage = lastMessagesMap.get(conversation.id)
        const unreadCount = unreadCountsMap.get(conversation.id) || 0

        return {
          id: conversation.id,
          user1_id: conversation.user1_id,
          user2_id: conversation.user2_id,
          last_message_at: conversation.last_message_at ? new Date(conversation.last_message_at).toISOString() : null,
          created_at: new Date(conversation.created_at).toISOString(),
          other_user: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            profile_pic: otherUser.profile_pic
          },
          last_message: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            sender_id: lastMessage.sender_id,
            created_at: new Date(lastMessage.created_at).toISOString()
          } : null,
          unread_count: unreadCount
        }
      })
      .filter(c => c !== null)

    // Re-sort by last_message_at (since we added data)
    formattedConversations.sort((a, b) => {
      if (!a.last_message_at && !b.last_message_at) {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      if (!a.last_message_at) return 1
      if (!b.last_message_at) return -1
      return new Date(b.last_message_at) - new Date(a.last_message_at)
    })

    return { data: formattedConversations, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get conversations' } }
  }
}

/**
 * Create a message request for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} requesterId - User ID requesting to message
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createMessageRequest(conversationId, requesterId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!conversationId || !requesterId) {
      return { data: null, error: { message: 'Conversation ID and requester ID are required' } }
    }

    // Validate conversation exists
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return { data: null, error: { message: 'Conversation not found' } }
    }

    // Validate requester is one of the users in the conversation
    if (conversation.user1_id !== requesterId && conversation.user2_id !== requesterId) {
      return { data: null, error: { message: 'Requester is not part of this conversation' } }
    }

    // Validate requester is not trying to message themselves
    if (conversation.user1_id === requesterId && conversation.user2_id === requesterId) {
      return { data: null, error: { message: 'Cannot create message request to self' } }
    }

    // Check if message request already exists
    const { data: existingRequest, error: existingError } = await supabase
      .from('message_requests')
      .select('id, conversation_id, requester_id, status, created_at')
      .eq('conversation_id', conversationId)
      .eq('requester_id', requesterId)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      return { data: null, error: serializeError(existingError, 'Failed to check existing message request') }
    }

    if (existingRequest) {
      // Return existing request (don't create duplicate)
      return {
        data: {
          id: existingRequest.id,
          conversation_id: existingRequest.conversation_id,
          requester_id: existingRequest.requester_id,
          status: existingRequest.status,
          created_at: new Date(existingRequest.created_at).toISOString()
        },
        error: null
      }
    }

    // Create new request with status 'pending'
    const requestId = randomUUID()
    const { data: newRequest, error: insertError } = await supabase
      .from('message_requests')
      .insert({
        id: requestId,
        conversation_id: conversationId,
        requester_id: requesterId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError, 'Failed to create message request') }
    }

    return {
      data: {
        id: newRequest.id,
        conversation_id: newRequest.conversation_id,
        requester_id: newRequest.requester_id,
        status: newRequest.status,
        created_at: new Date(newRequest.created_at).toISOString()
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create message request' } }
  }
}

/**
 * Accept a pending message request
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID accepting the request (must be the other user in conversation)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function acceptMessageRequest(requestId, userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!requestId || !userId) {
      return { data: null, error: { message: 'Request ID and user ID are required' } }
    }

    // Get the request
    const { data: request, error: requestError } = await supabase
      .from('message_requests')
      .select('id, conversation_id, requester_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { data: null, error: { message: 'Message request not found' } }
    }

    // Validate request is pending
    if (request.status !== 'pending') {
      return { data: null, error: { message: 'Message request has already been processed' } }
    }

    // Get conversation to validate user is the recipient (not the requester)
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', request.conversation_id)
      .single()

    if (conversationError || !conversation) {
      return { data: null, error: { message: 'Conversation not found' } }
    }

    // Validate user is part of the conversation
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return { data: null, error: { message: 'User is not part of this conversation' } }
    }

    // Validate user is the recipient (not the requester)
    if (request.requester_id === userId) {
      return { data: null, error: { message: 'Cannot accept your own message request' } }
    }

    // Update request status to 'accepted'
    const { data: updatedRequest, error: updateError } = await supabase
      .from('message_requests')
      .update({
        status: 'accepted'
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError, 'Failed to accept message request') }
    }

    return {
      data: {
        id: updatedRequest.id,
        conversation_id: updatedRequest.conversation_id,
        requester_id: updatedRequest.requester_id,
        status: updatedRequest.status,
        created_at: new Date(updatedRequest.created_at).toISOString(),
        updated_at: null // message_requests table doesn't have updated_at column
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to accept message request' } }
  }
}

/**
 * Decline a pending message request
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID declining the request
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function declineMessageRequest(requestId, userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!requestId || !userId) {
      return { data: null, error: { message: 'Request ID and user ID are required' } }
    }

    // Get the request
    const { data: request, error: requestError } = await supabase
      .from('message_requests')
      .select('id, conversation_id, requester_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { data: null, error: { message: 'Message request not found' } }
    }

    // Validate request is pending
    if (request.status !== 'pending') {
      return { data: null, error: { message: 'Message request has already been processed' } }
    }

    // Get conversation to validate user is the recipient (not the requester)
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', request.conversation_id)
      .single()

    if (conversationError || !conversation) {
      return { data: null, error: { message: 'Conversation not found' } }
    }

    // Validate user is part of the conversation
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return { data: null, error: { message: 'User is not part of this conversation' } }
    }

    // Validate user is the recipient (not the requester)
    if (request.requester_id === userId) {
      return { data: null, error: { message: 'Cannot decline your own message request' } }
    }

    // Update request status to 'declined'
    const { data: updatedRequest, error: updateError } = await supabase
      .from('message_requests')
      .update({
        status: 'declined'
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError, 'Failed to decline message request') }
    }

    return {
      data: {
        id: updatedRequest.id,
        conversation_id: updatedRequest.conversation_id,
        requester_id: updatedRequest.requester_id,
        status: updatedRequest.status,
        created_at: new Date(updatedRequest.created_at).toISOString(),
        updated_at: null // message_requests table doesn't have updated_at column
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to decline message request' } }
  }
}

/**
 * Mark all unread messages in a conversation as read for the current user
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID marking messages as read
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function markAsRead(conversationId, userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!conversationId || !userId) {
      return { data: null, error: { message: 'Conversation ID and user ID are required' } }
    }

    // Validate user is part of the conversation and get conversation data
    // Note: We need the conversation data to determine which messages to mark as read
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return { data: null, error: { message: 'Conversation not found' } }
    }

    // Validate user is part of the conversation
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return { data: null, error: { message: 'User is not part of this conversation' } }
    }

    // Update all messages where sender_id != userId and read_at IS NULL
    const now = new Date().toISOString()
    const { data: updatedMessages, error: updateError } = await supabase
      .from('messages')
      .update({ read_at: now })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null)
      .select()

    if (updateError) {
      return { data: null, error: serializeError(updateError, 'Failed to mark messages as read') }
    }

    return {
      data: {
        marked_count: updatedMessages?.length || 0
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to mark messages as read' } }
  }
}

/**
 * Get total unread message count across all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getUnreadCount(userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } }
    }

    // Get all conversations for the user
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (conversationsError) {
      return { data: null, error: serializeError(conversationsError, 'Failed to get conversations') }
    }

    if (!conversations || conversations.length === 0) {
      return { data: { total_unread: 0 }, error: null }
    }

    // Optimize: Single query to get all unread messages instead of N+1 queries
    const conversationIds = conversations.map(c => c.id)
    const otherUserIds = conversations.map(c => 
      c.user1_id === userId ? c.user2_id : c.user1_id
    )
    const uniqueOtherUserIds = [...new Set(otherUserIds)]

    // Create a map of conversation_id -> other_user_id for quick lookup
    const conversationOtherUserMap = new Map()
    conversations.forEach(c => {
      const otherUserId = c.user1_id === userId ? c.user2_id : c.user1_id
      conversationOtherUserMap.set(c.id, otherUserId)
    })

    // Only query if we have conversations and other users
    if (conversationIds.length === 0 || uniqueOtherUserIds.length === 0) {
      return {
        data: {
          total_unread: 0
        },
        error: null
      }
    }

    // Get all unread messages from other users across all conversations
    const { data: unreadMessages, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id, sender_id')
      .in('conversation_id', conversationIds)
      .in('sender_id', uniqueOtherUserIds)
      .is('read_at', null)

    if (unreadError) {
      return { data: null, error: serializeError(unreadError, 'Failed to get unread messages') }
    }

    // Count unread messages (only from other users, not from self)
    let totalUnread = 0
    if (unreadMessages) {
      for (const msg of unreadMessages) {
        const otherUserId = conversationOtherUserMap.get(msg.conversation_id)
        if (otherUserId && msg.sender_id === otherUserId) {
          totalUnread++
        }
      }
    }

    return {
      data: {
        total_unread: totalUnread
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get unread count' } }
  }
}

/**
 * Get the host/admin user ID for an event (for "Chat with Host" functionality)
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getEventHostId(eventId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId) {
      return { data: null, error: { message: 'Event ID is required' } }
    }

    // Get event to get fraternity ID
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    if (!event.frat_id) {
      return { data: null, error: { message: 'Event does not have an associated fraternity' } }
    }

    // Get an admin user ID for the fraternity from groupMembers table
    const { data: adminMember, error: adminError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', event.frat_id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    // If no admin found in group_members, check if fraternity creator is the host
    if (adminError || !adminMember) {
      const { data: fraternity, error: fraternityError } = await supabase
        .from('fraternity')
        .select('id, creator_id')
        .eq('id', event.frat_id)
        .single()

      if (fraternityError || !fraternity || !fraternity.creator_id) {
        return { data: null, error: { message: 'No admin found for this event\'s fraternity' } }
      }

      return {
        data: {
          host_id: fraternity.creator_id,
          event_id: eventId,
          fraternity_id: event.frat_id
        },
        error: null
      }
    }

    return {
      data: {
        host_id: adminMember.user_id,
        event_id: eventId,
        fraternity_id: event.frat_id
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get event host ID' } }
  }
}

/**
 * Create a conversation with an event host and automatically create a message request
 * @param {string} eventId - Event ID
 * @param {string} requesterId - User ID clicking "Chat with Host"
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createConversationWithEventHost(eventId, requesterId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !requesterId) {
      return { data: null, error: { message: 'Event ID and requester ID are required' } }
    }

    // Get event host ID using getEventHostId
    const { data: hostData, error: hostError } = await getEventHostId(eventId)
    if (hostError || !hostData) {
      return { data: null, error: hostError || { message: 'Failed to get event host' } }
    }

    const hostId = hostData.host_id

    // Validate requester is not trying to message themselves
    if (requesterId === hostId) {
      return { data: null, error: { message: 'Cannot create conversation with yourself' } }
    }

    // Create conversation between requester and host (or retrieve existing)
    const { data: conversation, error: conversationError } = await createConversation(requesterId, hostId)
    if (conversationError || !conversation) {
      return { data: null, error: conversationError || { message: 'Failed to create conversation' } }
    }

    // Create message request for the conversation (status 'pending')
    const { data: messageRequest, error: requestError } = await createMessageRequest(conversation.id, requesterId)
    if (requestError || !messageRequest) {
      return { data: null, error: requestError || { message: 'Failed to create message request' } }
    }

    // Get host user info
    const { data: host, error: hostInfoError } = await supabase
      .from('User')
      .select('id, name, profile_pic')
      .eq('id', hostId)
      .single()

    if (hostInfoError || !host) {
      return { data: null, error: { message: 'Host user not found' } }
    }

    return {
      data: {
        conversation: {
          id: conversation.id,
          user1_id: conversation.user1_id,
          user2_id: conversation.user2_id,
          created_at: conversation.created_at
        },
        message_request: {
          id: messageRequest.id,
          status: messageRequest.status,
          created_at: messageRequest.created_at
        },
        host: {
          id: host.id,
          name: host.name,
          profile_pic: host.profile_pic
        }
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create conversation with event host' } }
  }
}

