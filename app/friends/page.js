// app/friends/page.js
// Main friends page with tabs for friends, requests, sent requests, and suggestions

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFriend } from '@/contexts/FriendContext'
import FriendList from '@/components/FriendList'
import FriendRequestCard from '@/components/FriendRequestCard'
import PeopleYouMet from '@/components/PeopleYouMet'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'

const TABS = {
  FRIENDS: 'friends',
  REQUESTS: 'requests',
  SENT: 'sent',
  SUGGESTIONS: 'suggestions'
}

export default function FriendsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { 
    friends, 
    receivedRequests, 
    sentRequests, 
    suggestions,
    loading: friendContextLoading,
    error: friendContextError,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    cancelFriendRequest
  } = useFriend()
  const [activeTab, setActiveTab] = useState(TABS.FRIENDS)
  const [actionLoading, setActionLoading] = useState({})

  // Memoize requests to avoid unnecessary re-renders
  const requests = useMemo(() => receivedRequests, [receivedRequests])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user?.id) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Handle accept request - uses context function
  const handleAcceptRequest = useCallback(async (request) => {
    if (!user?.id || !request?.user?.id) return

    const actionKey = `accept-${request.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      await acceptFriendRequest(request.user.id)
      // Context handles optimistic update and real-time confirmation
    } catch (err) {
      console.error('Error accepting request:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [user?.id, acceptFriendRequest])

  // Handle deny request - uses context function
  const handleDenyRequest = useCallback(async (request) => {
    if (!user?.id || !request?.user?.id) return

    const actionKey = `deny-${request.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      await declineFriendRequest(request.user.id)
      // Context handles optimistic update and real-time confirmation
    } catch (err) {
      console.error('Error declining request:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [user?.id, declineFriendRequest])

  // Handle send request (from suggestions) - uses context function
  const handleSendRequest = useCallback(async (suggestion) => {
    if (!user?.id || !suggestion?.id) return

    const actionKey = `send-${suggestion.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      await sendFriendRequest(suggestion.id)
      // Context handles optimistic update and real-time confirmation
    } catch (err) {
      console.error('Error sending request:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [user?.id, sendFriendRequest])

  // Handle remove friend - uses context function
  const handleRemoveFriend = useCallback(async (friend) => {
    if (!user?.id || !friend?.id) return

    if (!confirm(`Are you sure you want to remove ${friend.name} as a friend?`)) {
      return
    }

    const actionKey = `remove-${friend.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      await removeFriend(friend.id)
      // Context handles optimistic update and real-time confirmation
    } catch (err) {
      console.error('Error removing friend:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }, [user?.id, removeFriend])

  // Use context error and loading states - memoized
  const error = useMemo(() => friendContextError, [friendContextError])
  const friendsLoading = useMemo(() => friendContextLoading, [friendContextLoading])
  const requestsLoading = useMemo(() => friendContextLoading, [friendContextLoading])
  const sentLoading = useMemo(() => friendContextLoading, [friendContextLoading])
  const suggestionsLoading = useMemo(() => friendContextLoading, [friendContextLoading])

  if (authLoading || friendContextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-medium">Loading...</p>
      </div>
    )
  }

  if (!user?.id) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-bg p-4 md:p-6 pb-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-dark mb-2">Friends</h1>
          <p className="text-gray-medium">Manage your connections and discover new friends</p>
        </div>

        {/* Error Message */}
        {error && (
          <Card variant="default" className="p-4 mb-4 bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-border">
          {Object.entries(TABS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setActiveTab(value)}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === value
                  ? 'border-primary-ui text-primary-ui'
                  : 'border-transparent text-gray-medium hover:text-gray-dark'
              }`}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
              {value === TABS.REQUESTS && requests.length > 0 && (
                <span className="ml-2 bg-primary-ui text-white rounded-full px-2 py-0.5 text-xs">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === TABS.FRIENDS && (
            <FriendList
              friends={friends}
              onRemove={handleRemoveFriend}
              loading={friendsLoading}
            />
          )}

          {activeTab === TABS.REQUESTS && (
            <div className="space-y-4">
              {requestsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} variant="default" className="p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-light" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-light rounded mb-2" />
                          <div className="h-3 w-24 bg-gray-light rounded" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <Card variant="default" className="p-8 text-center">
                  <p className="text-gray-medium">No friend requests</p>
                  <p className="text-sm text-gray-medium mt-2">
                    When someone sends you a friend request, it will appear here
                  </p>
                </Card>
              ) : (
                requests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAcceptRequest}
                    onDeny={handleDenyRequest}
                    loading={actionLoading[`accept-${request.id}`] || actionLoading[`deny-${request.id}`]}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === TABS.SENT && (
            <div className="space-y-4">
              {sentLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} variant="default" className="p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-light" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-light rounded mb-2" />
                          <div className="h-3 w-24 bg-gray-light rounded" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : sentRequests.length === 0 ? (
                <Card variant="default" className="p-8 text-center">
                  <p className="text-gray-medium">No pending requests</p>
                  <p className="text-sm text-gray-medium mt-2">
                    Friend requests you send will appear here until they're accepted
                  </p>
                </Card>
              ) : (
                sentRequests.map((request) => (
                  <Card key={request.id} variant="default" className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={request.user?.profile_pic}
                        alt={request.user?.name}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-dark truncate">
                          {request.user?.name}
                        </h3>
                        {request.user?.year && (
                          <p className="text-sm text-gray-medium">
                            Year {request.user.year}
                          </p>
                        )}
                        <p className="text-xs text-gray-medium mt-1">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="secondary" size="small" disabled>
                        Pending
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === TABS.SUGGESTIONS && (
            <PeopleYouMet />
          )}
        </div>
      </div>
    </div>
  )
}

