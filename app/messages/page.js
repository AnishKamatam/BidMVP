// app/messages/page.js
// Messages inbox page showing all conversations

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import MessageList from '@/components/MessageList'
import MessageRequestCard from '@/components/MessageRequestCard'
import NewMessageModal from '@/components/NewMessageModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LayoutWrapper from '@/components/LayoutWrapper'

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    conversations,
    messageRequests,
    loading: chatLoading,
    error: chatError,
    fetchConversations,
    acceptMessageRequest,
    declineMessageRequest
  } = useChat()
  const [actionLoading, setActionLoading] = useState({})
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)

  // Memoize pending requests
  const pendingRequests = useMemo(() => 
    messageRequests.filter(req => req.status === 'pending'),
    [messageRequests]
  )

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user?.id) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Fetch conversations on mount
  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchConversations()
    }
  }, [user?.id, authLoading, fetchConversations])

  // Handle accept message request
  const handleAcceptRequest = useCallback(async (request) => {
    if (!user?.id || !request?.id) return

    const actionKey = `accept-${request.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      await acceptMessageRequest(request.id)
      // Refresh conversations after accepting
      fetchConversations()
    } catch (err) {
      console.error('Error accepting request:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [user?.id, acceptMessageRequest, fetchConversations])

  // Handle decline message request
  const handleDeclineRequest = useCallback(async (request) => {
    if (!user?.id || !request?.id) return

    const actionKey = `decline-${request.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      await declineMessageRequest(request.id)
    } catch (err) {
      console.error('Error declining request:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [user?.id, declineMessageRequest])

  const handleNewMessageClick = useCallback(() => {
    setShowNewMessageModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowNewMessageModal(false)
  }, [])

  if (authLoading || chatLoading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gray-bg p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="h-8 bg-gray-light rounded w-48 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-light rounded w-64 animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-light" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-light rounded mb-2" />
                      <div className="h-3 w-48 bg-gray-light rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  if (!user?.id) {
    return null
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gray-bg p-4 md:p-6 pb-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-dark">Messages</h1>
            <Button
              variant="primary"
              size="medium"
              onClick={handleNewMessageClick}
              className="flex-shrink-0"
            >
                <svg className="w-5 h-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline">New Message</span>
              </Button>
            </div>
            <p className="text-gray-medium">Your conversations and message requests</p>
          </div>

          {/* Error Message */}
          {chatError && (
            <Card variant="default" className="p-4 mb-4 bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{chatError}</p>
            </Card>
          )}

          {/* Message Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-dark mb-3">Message Requests</h2>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <MessageRequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAcceptRequest}
                    onDecline={handleDeclineRequest}
                    loading={actionLoading[`accept-${request.id}`] || actionLoading[`decline-${request.id}`]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conversations Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-dark mb-3">
              Conversations
            </h2>
            <MessageList
              conversations={conversations}
              loading={chatLoading}
            />
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={handleCloseModal}
      />
    </LayoutWrapper>
  )
}

