// app/messages/[conversationId]/page.js
// Individual conversation page with messages and input

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { getMessageRequestForConversationAction } from '@/app/actions/messages'
import ConversationHeader from '@/components/ConversationHeader'
import MessageBubble from '@/components/MessageBubble'
import MessageInput from '@/components/MessageInput'
import MessageRequestCard from '@/components/MessageRequestCard'
import Card from '@/components/ui/Card'
import LayoutWrapper from '@/components/LayoutWrapper'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    conversations,
    messages,
    fetchMessages,
    sendMessage,
    markAsRead,
    acceptMessageRequest,
    declineMessageRequest,
    setActiveConversation
  } = useChat()
  const conversationId = params.conversationId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messageRequest, setMessageRequest] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Set active conversation
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId)
    }
    return () => {
      setActiveConversation(null)
    }
  }, [conversationId, setActiveConversation])

  // Find conversation and load messages
  useEffect(() => {
    if (!user?.id || !conversationId || authLoading) return

    const loadConversation = async () => {
      setLoading(true)
      setError(null)

      try {
        // Find conversation in list, or wait a bit for it to load
        let conversation = conversations.find(c => c.id === conversationId)
        
        // If conversation not found, try fetching conversations first
        if (!conversation) {
          // Wait a moment for conversations to load from context
          await new Promise(resolve => setTimeout(resolve, 500))
          conversation = conversations.find(c => c.id === conversationId)
        }

        // If still not found, show error
        if (!conversation) {
          setError('Conversation not found')
          setLoading(false)
          return
        }

        // Check for message request
        const { data: requestData, error: requestError } = await getMessageRequestForConversationAction(conversationId)
        if (requestError) {
          console.error('Error fetching message request:', requestError)
        } else if (requestData) {
          setMessageRequest(requestData)
        }

        // Load messages
        await fetchMessages(conversationId, 50, 0)
        
        // Mark as read
        await markAsRead(conversationId)

        setLoading(false)
      } catch (err) {
        setError(err.message || 'Failed to load conversation')
        setLoading(false)
      }
    }

    loadConversation()
  }, [user?.id, conversationId, authLoading, conversations, fetchMessages, markAsRead])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, conversationId])

  // Handle send message
  const handleSendMessage = async (convId, content) => {
    if (!content.trim()) return

    try {
      await sendMessage(convId, content)
      // Mark as read after sending
      await markAsRead(convId)
    } catch (err) {
      setError(err.message || 'Failed to send message')
      throw err
    }
  }

  // Handle accept message request
  const handleAcceptRequest = async (request) => {
    try {
      await acceptMessageRequest(request.id)
      setMessageRequest(null)
      // Refresh messages
      await fetchMessages(conversationId, 50, 0)
    } catch (err) {
      setError(err.message || 'Failed to accept request')
    }
  }

  // Handle decline message request
  const handleDeclineRequest = async (request) => {
    try {
      await declineMessageRequest(request.id)
      setMessageRequest(null)
    } catch (err) {
      setError(err.message || 'Failed to decline request')
    }
  }

  // Load more messages (pagination)
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    const conversationMessages = messages.get(conversationId) || []
    setLoadingMore(true)

    try {
      await fetchMessages(conversationId, 50, conversationMessages.length)
      // Check if there are more messages (simplified - would need total count from backend)
      setHasMore(false) // This would be determined by backend response
    } catch (err) {
      setError(err.message || 'Failed to load more messages')
    } finally {
      setLoadingMore(false)
    }
  }

  if (authLoading || loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-medium">Loading conversation...</p>
        </div>
      </LayoutWrapper>
    )
  }

  if (!user?.id) {
    router.push('/')
    return null
  }

  // Find conversation
  const conversation = conversations.find(c => c.id === conversationId)
  const conversationMessages = messages.get(conversationId) || []

  if (!conversation) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card variant="default" className="p-8 text-center">
            <p className="text-gray-medium mb-4">Conversation not found</p>
            <button
              onClick={() => router.push('/messages')}
              className="text-primary-ui hover:underline"
            >
              Back to Messages
            </button>
          </Card>
        </div>
      </LayoutWrapper>
    )
  }

  const otherUser = conversation.other_user
  const isRequestPending = messageRequest?.status === 'pending'
  const isRequestDeclined = messageRequest?.status === 'declined'
  const isRequester = messageRequest?.requester_id === user.id
  const isRecipient = messageRequest && messageRequest.requester_id !== user.id

  return (
    <LayoutWrapper>
      <div className="flex flex-col h-screen bg-gray-bg">
        {/* Header */}
        <ConversationHeader
          conversation={conversation}
          otherUser={otherUser}
          messageRequestStatus={messageRequest?.status}
        />

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Message Request Card - only show for recipient */}
        {isRequestPending && messageRequest && isRecipient && (
          <div className="p-4 border-b border-gray-border bg-yellow-50">
            <p className="text-sm text-gray-medium mb-3">You have a pending message request</p>
            <MessageRequestCard
              request={messageRequest}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          </div>
        )}

        {/* Message Request Status - show for requester */}
        {isRequestPending && messageRequest && isRequester && (
          <div className="p-4 border-b border-gray-border bg-blue-50">
            <Card variant="default" className="p-4">
              <p className="text-sm text-gray-medium">
                Your message request is pending. The other user will be notified and can accept or decline.
              </p>
            </Card>
          </div>
        )}

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
        >
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mb-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-primary-ui text-sm hover:underline disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}

          {/* Messages */}
          {conversationMessages.length === 0 ? (
            <Card variant="default" className="p-8 text-center">
              <p className="text-gray-medium">No messages yet</p>
              {isRequestPending && (
                <p className="text-sm text-gray-medium mt-2">
                  Accept the message request to start messaging
                </p>
              )}
            </Card>
          ) : (
            conversationMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user.id}
                showAvatar={true}
              />
            ))
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {!isRequestDeclined && (
          <MessageInput
            conversationId={conversationId}
            onSend={handleSendMessage}
            disabled={isRequestPending}
            placeholder={isRequestPending ? 'Message request pending...' : 'Type a message...'}
          />
        )}

        {isRequestDeclined && (
          <div className="p-4 bg-gray-light border-t border-gray-border text-center">
            <p className="text-sm text-gray-medium">
              This message request was declined. You cannot send messages.
            </p>
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}

