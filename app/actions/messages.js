// app/actions/messages.js
// Server Actions for message/conversation operations
// These can be called from Client Components

'use server'

import {
  createConversation,
  sendMessage,
  getMessages,
  getConversations,
  createMessageRequest,
  acceptMessageRequest,
  declineMessageRequest,
  markAsRead,
  getUnreadCount,
  getEventHostId,
  createConversationWithEventHost
} from '@/lib/supabase/messages'
import { createClient } from '@/lib/supabase/server'

/**
 * Create or retrieve conversation (Server Action wrapper)
 * @param {string} user2Id - Other user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createConversationAction(user2Id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await createConversation(user.id, user2Id)
}

/**
 * Send a message (Server Action wrapper)
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message content
 * @param {string} messageType - Message type ('text' or 'reaction', default: 'text')
 * @param {string} reactionType - Reaction type ('thumbs_up' or 'thumbs_down', required if messageType is 'reaction')
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function sendMessageAction(conversationId, content, messageType = 'text', reactionType = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await sendMessage(conversationId, user.id, content, messageType, reactionType)
}

/**
 * Get messages for a conversation (Server Action wrapper)
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Maximum number of messages (default: 50)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getMessagesAction(conversationId, limit = 50, offset = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getMessages(conversationId, user.id, limit, offset)
}

/**
 * Get all conversations for current user (Server Action wrapper)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getConversationsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getConversations(user.id)
}

/**
 * Create message request (Server Action wrapper)
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createMessageRequestAction(conversationId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await createMessageRequest(conversationId, user.id)
}

/**
 * Accept message request (Server Action wrapper)
 * @param {string} requestId - Message request ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function acceptMessageRequestAction(requestId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await acceptMessageRequest(requestId, user.id)
}

/**
 * Decline message request (Server Action wrapper)
 * @param {string} requestId - Message request ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function declineMessageRequestAction(requestId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await declineMessageRequest(requestId, user.id)
}

/**
 * Mark messages as read (Server Action wrapper)
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function markAsReadAction(conversationId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await markAsRead(conversationId, user.id)
}

/**
 * Get unread message count (Server Action wrapper)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getUnreadCountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await getUnreadCount(user.id)
}

/**
 * Get event host ID (Server Action wrapper)
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getEventHostIdAction(eventId) {
  return await getEventHostId(eventId)
}

/**
 * Create conversation with event host (Server Action wrapper)
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createConversationWithEventHostAction(eventId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  return await createConversationWithEventHost(eventId, user.id)
}

/**
 * Get message request for a conversation (Server Action wrapper)
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getMessageRequestForConversationAction(conversationId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } }
  }

  try {
    const { data, error } = await supabase
      .from('message_requests')
      .select(`
        id,
        conversation_id,
        requester_id,
        status,
        created_at,
        requester:User!message_requests_requester_id_fkey (
          id,
          name,
          email,
          profile_pic
        )
      `)
      .eq('conversation_id', conversationId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: { message: error.message || 'Failed to get message request' } }
    }

    if (!data) {
      return { data: null, error: null }
    }

    // Format the response
    return {
      data: {
        id: data.id,
        conversation_id: data.conversation_id,
        requester_id: data.requester_id,
        status: data.status,
        created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
        requester: data.requester ? {
          id: data.requester.id,
          name: data.requester.name,
          email: data.requester.email,
          profile_pic: data.requester.profile_pic
        } : null
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get message request' } }
  }
}

