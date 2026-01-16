// components/NewMessageModal.js
// Modal component for starting new conversations
// Shows friends and "People You Met" suggestions

'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/contexts/ChatContext'
import { useFriend } from '@/contexts/FriendContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'

const TABS = {
  FRIENDS: 'friends',
  SUGGESTIONS: 'suggestions'
}

export default function NewMessageModal({ isOpen, onClose }) {
  const router = useRouter()
  const { createConversation } = useChat()
  const { friends, suggestions } = useFriend()
  
  const [activeTab, setActiveTab] = useState(TABS.FRIENDS)
  const [loading, setLoading] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  // Memoize filter function
  const filterUsers = useCallback((users) => {
    if (!searchQuery.trim()) return users
    
    const query = searchQuery.toLowerCase()
    return users.filter(user => {
      const name = (user?.name || user?.friend?.name || '').toLowerCase()
      return name.includes(query)
    })
  }, [searchQuery])

  // Memoize filtered results
  const filteredFriends = useMemo(() => filterUsers(friends), [filterUsers, friends])
  const filteredSuggestions = useMemo(() => filterUsers(suggestions), [filterUsers, suggestions])

  const handleStartConversation = useCallback(async (userId, userName) => {
    if (!userId || loading[userId]) return

    setLoading(prev => ({ ...prev, [userId]: true }))

    try {
      const conversation = await createConversation(userId)
      
      if (conversation) {
        // Close modal and navigate to conversation
        onClose()
        router.push(`/messages/${conversation.id}`)
      }
    } catch (err) {
      console.error('Error creating conversation:', err)
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }))
    }
  }, [createConversation, router, onClose])

  const handleClose = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleClose}
    >
      <Card variant="default" className="w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-border">
          <h2 className="text-xl font-bold text-gray-dark">New Message</h2>
          <button
            onClick={onClose}
            className="text-gray-medium hover:text-gray-dark transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-border">
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-border">
          <button
            onClick={() => setActiveTab(TABS.FRIENDS)}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === TABS.FRIENDS
                ? 'border-primary-ui text-primary-ui'
                : 'border-transparent text-gray-medium hover:text-gray-dark'
            }`}
          >
            Friends ({filteredFriends.length})
          </button>
          <button
            onClick={() => setActiveTab(TABS.SUGGESTIONS)}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === TABS.SUGGESTIONS
                ? 'border-primary-ui text-primary-ui'
                : 'border-transparent text-gray-medium hover:text-gray-dark'
            }`}
          >
            Suggestions ({filteredSuggestions.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === TABS.FRIENDS && (
            <div className="space-y-2">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-medium">
                    {searchQuery ? 'No friends match your search' : 'No friends yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-sm text-gray-medium mt-2">
                      Connect with people at events to see them here
                    </p>
                  )}
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const friendId = friend?.id || friend?.friend?.id
                  const friendName = friend?.name || friend?.friend?.name
                  const friendPic = friend?.profile_pic || friend?.friend?.profile_pic
                  const friendYear = friend?.year || friend?.friend?.year

                  return (
                    <button
                      key={friendId}
                      onClick={() => handleStartConversation(friendId, friendName)}
                      disabled={loading[friendId]}
                      className="w-full p-3 rounded-md hover:bg-gray-light transition-colors flex items-center gap-3 text-left"
                    >
                      <Avatar
                        src={friendPic}
                        alt={friendName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-dark truncate">
                          {friendName}
                        </p>
                        {friendYear && (
                          <p className="text-sm text-gray-medium">
                            Year {friendYear}
                          </p>
                        )}
                      </div>
                      {loading[friendId] && (
                        <div className="w-5 h-5 border-2 border-primary-ui border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}

          {activeTab === TABS.SUGGESTIONS && (
            <div className="space-y-2">
              {filteredSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-medium">
                    {searchQuery ? 'No suggestions match your search' : 'No suggestions yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-sm text-gray-medium mt-2">
                      Check into events to see people you might have met
                    </p>
                  )}
                </div>
              ) : (
                filteredSuggestions.map((suggestion) => {
                  const suggestionId = suggestion?.id || suggestion?.user?.id
                  const suggestionName = suggestion?.name || suggestion?.user?.name
                  const suggestionPic = suggestion?.profile_pic || suggestion?.user?.profile_pic
                  const suggestionYear = suggestion?.year || suggestion?.user?.year

                  return (
                    <button
                      key={suggestionId}
                      onClick={() => handleStartConversation(suggestionId, suggestionName)}
                      disabled={loading[suggestionId]}
                      className="w-full p-3 rounded-md hover:bg-gray-light transition-colors flex items-center gap-3 text-left"
                    >
                      <Avatar
                        src={suggestionPic}
                        alt={suggestionName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-dark truncate">
                          {suggestionName}
                        </p>
                        {suggestionYear && (
                          <p className="text-sm text-gray-medium">
                            Year {suggestionYear}
                          </p>
                        )}
                      </div>
                      {loading[suggestionId] && (
                        <div className="w-5 h-5 border-2 border-primary-ui border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

