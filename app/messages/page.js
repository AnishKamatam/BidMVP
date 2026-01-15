// app/messages/page.js
// Messages inbox page showing all conversations

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import MessageList from '@/components/MessageList'
import MessageRequestCard from '@/components/MessageRequestCard'
import Card from '@/components/ui/Card'
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
  const handleAcceptRequest = async (request) => {
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
  }

  // Handle decline message request
  const handleDeclineRequest = async (request) => {
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
  }

  if (authLoading || chatLoading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-medium">Loading...</p>
        </div>
      </LayoutWrapper>
    )
  }

  if (!user?.id) {
    return null
  }

  // Filter pending message requests
  const pendingRequests = messageRequests.filter(req => req.status === 'pending')

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gray-bg p-4 md:p-6 pb-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-dark mb-2">Messages</h1>
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
    </LayoutWrapper>
  )
}

