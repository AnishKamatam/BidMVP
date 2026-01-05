// components/ManualAddGuest.js
// Modal/form for manually adding guests with user search functionality

'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { searchUsersAction } from '@/app/actions/guests'
import { manuallyAddGuestAction } from '@/app/actions/guests'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ManualAddGuest({
  eventId,
  isOpen,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const searchTimeoutRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSearchResults([])
      setSelectedUser(null)
      setError(null)
      return
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // If search query is empty, clear results
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    // Set new timeout for debounced search
    setSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error: searchError } = await searchUsersAction(searchQuery.trim())
        
        if (searchError) {
          setError(searchError.message || 'Failed to search users')
          setSearchResults([])
        } else {
          setError(null)
          setSearchResults(data || [])
        }
      } catch (err) {
        console.error('Error searching users:', err)
        setError(err.message || 'Failed to search users')
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, isOpen])

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setSearchQuery(user.name || user.email)
    setSearchResults([])
  }

  const handleAddGuest = async () => {
    if (!selectedUser || !eventId || !user?.id) {
      setError('Please select a user to add')
      return
    }

    setAdding(true)
    setError(null)

    try {
      const { data, error: addError } = await manuallyAddGuestAction(eventId, selectedUser.id)

      if (addError) {
        setError(addError.message || 'Failed to add guest')
        setAdding(false)
        return
      }

      // Success - reset and close
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      setError(null)
      
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (err) {
      console.error('Error adding guest:', err)
      setError(err.message || 'Failed to add guest')
    } finally {
      setAdding(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card variant="default" className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-heading3 text-neutral-black">
              Add Guest Manually
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-light rounded-full transition-colors"
              disabled={adding}
            >
              <XMarkIcon className="w-6 h-6 text-gray-dark" />
            </button>
          </div>

          {/* Search Input */}
          <div>
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={adding}
            />
            {searching && (
              <p className="text-sm text-gray-medium mt-2">Searching...</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && !selectedUser && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-gray-dark">Select a user:</p>
              {searchResults.map((resultUser) => (
                <button
                  key={resultUser.id}
                  onClick={() => handleSelectUser(resultUser)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-light rounded-md transition-colors text-left"
                  disabled={adding}
                >
                  <Avatar
                    src={resultUser.profile_pic}
                    alt={resultUser.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-dark truncate">
                      {resultUser.name}
                    </p>
                    {resultUser.email && (
                      <p className="text-sm text-gray-medium truncate">
                        {resultUser.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="p-4 bg-gray-light rounded-md">
              <p className="text-sm font-medium text-gray-dark mb-2">Selected:</p>
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedUser.profile_pic}
                  alt={selectedUser.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-dark truncate">
                    {selectedUser.name}
                  </p>
                  {selectedUser.email && (
                    <p className="text-sm text-gray-medium truncate">
                      {selectedUser.email}
                    </p>
                  )}
                </div>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setSelectedUser(null)
                    setSearchQuery('')
                  }}
                  disabled={adding}
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              size="medium"
              onClick={onClose}
              disabled={adding}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleAddGuest}
              disabled={!selectedUser || adding}
              className="flex-1"
            >
              {adding ? 'Adding...' : 'Add Guest'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

