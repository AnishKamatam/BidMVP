// app/friends/page.js
// Main friends page with tabs for friends, requests, sent requests, and suggestions

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getFriendsAction,
  getFriendRequestsAction,
  getSentRequestsAction,
  getPeopleYouMetAction,
  acceptFriendRequestAction,
  denyFriendRequestAction,
  sendFriendRequestAction,
  removeFriendAction
} from '@/app/actions/friendship'
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
  const [activeTab, setActiveTab] = useState(TABS.FRIENDS)

  // Data states
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])

  // Loading states
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [sentLoading, setSentLoading] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // Error states
  const [error, setError] = useState(null)

  // Action loading states
  const [actionLoading, setActionLoading] = useState({})

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user?.id) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Fetch friends
  const fetchFriends = async () => {
    if (!user?.id) return

    setFriendsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getFriendsAction(user.id)
      if (fetchError) {
        setError(fetchError.message || 'Failed to load friends')
      } else {
        setFriends(data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load friends')
    } finally {
      setFriendsLoading(false)
    }
  }

  // Fetch friend requests
  const fetchRequests = async () => {
    if (!user?.id) return

    setRequestsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getFriendRequestsAction(user.id)
      if (fetchError) {
        setError(fetchError.message || 'Failed to load requests')
      } else {
        setRequests(data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests')
    } finally {
      setRequestsLoading(false)
    }
  }

  // Fetch sent requests
  const fetchSentRequests = async () => {
    if (!user?.id) return

    setSentLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getSentRequestsAction(user.id)
      if (fetchError) {
        setError(fetchError.message || 'Failed to load sent requests')
      } else {
        setSentRequests(data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load sent requests')
    } finally {
      setSentLoading(false)
    }
  }

  // Fetch suggestions
  const fetchSuggestions = async () => {
    if (!user?.id) return

    setSuggestionsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getPeopleYouMetAction(user.id)
      if (fetchError) {
        setError(fetchError.message || 'Failed to load suggestions')
      } else {
        setSuggestions(data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load suggestions')
    } finally {
      setSuggestionsLoading(false)
    }
  }

  // Fetch data when tab changes or user changes
  useEffect(() => {
    if (authLoading || !user?.id) return

    switch (activeTab) {
      case TABS.FRIENDS:
        fetchFriends()
        break
      case TABS.REQUESTS:
        fetchRequests()
        break
      case TABS.SENT:
        fetchSentRequests()
        break
      case TABS.SUGGESTIONS:
        fetchSuggestions()
        break
    }
  }, [activeTab, user?.id, authLoading])

  // Handle accept request
  const handleAcceptRequest = async (request) => {
    if (!user?.id || !request?.requester?.id) return

    const actionKey = `accept-${request.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))
    setError(null)

    try {
      const { error: acceptError } = await acceptFriendRequestAction(
        user.id,
        request.requester.id
      )

      if (acceptError) {
        setError(acceptError.message || 'Failed to accept request')
      } else {
        // Remove from requests and refresh friends
        setRequests(prev => prev.filter(r => r.id !== request.id))
        fetchFriends()
      }
    } catch (err) {
      setError(err.message || 'Failed to accept request')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Handle deny request
  const handleDenyRequest = async (request) => {
    if (!user?.id || !request?.requester?.id) return

    const actionKey = `deny-${request.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))
    setError(null)

    try {
      const { error: denyError } = await denyFriendRequestAction(
        user.id,
        request.requester.id
      )

      if (denyError) {
        setError(denyError.message || 'Failed to deny request')
      } else {
        // Remove from requests
        setRequests(prev => prev.filter(r => r.id !== request.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to deny request')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Handle send request (from suggestions)
  const handleSendRequest = async (suggestion) => {
    if (!user?.id || !suggestion?.id) return

    const actionKey = `send-${suggestion.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))
    setError(null)

    try {
      const { error: sendError } = await sendFriendRequestAction(
        user.id,
        suggestion.id
      )

      if (sendError) {
        setError(sendError.message || 'Failed to send request')
      } else {
        // Remove from suggestions and refresh sent requests
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
        if (activeTab === TABS.SENT) {
          fetchSentRequests()
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to send request')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Handle remove friend
  const handleRemoveFriend = async (friend) => {
    if (!user?.id || !friend?.id) return

    if (!confirm(`Are you sure you want to remove ${friend.name} as a friend?`)) {
      return
    }

    const actionKey = `remove-${friend.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))
    setError(null)

    try {
      const { error: removeError } = await removeFriendAction(
        user.id,
        friend.id
      )

      if (removeError) {
        setError(removeError.message || 'Failed to remove friend')
      } else {
        // Remove from friends list
        setFriends(prev => prev.filter(f => f.id !== friend.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to remove friend')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  if (authLoading) {
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
    <div className="min-h-screen bg-gray-bg p-4 md:p-6">
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
                        src={request.recipient?.profile_pic}
                        alt={request.recipient?.name}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-dark truncate">
                          {request.recipient?.name}
                        </h3>
                        {request.recipient?.year && (
                          <p className="text-sm text-gray-medium">
                            Year {request.recipient.year}
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
            <PeopleYouMet
              suggestions={suggestions}
              onSendRequest={handleSendRequest}
              loading={suggestionsLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

