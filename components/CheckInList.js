'use client'

import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCheckedInUsersAction } from '@/app/actions/checkin'
import ManualCheckOut from './ManualCheckOut'
import Avatar from './ui/Avatar'
import Card from './ui/Card'
import Input from './ui/Input'

// Format time for check-in display (always shows time, not relative)
function formatCheckInTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

function CheckInList({ eventId, adminUserId, onCheckOut }) {
  const [checkedInUsers, setCheckedInUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Memoize load function to avoid recreating on every render
  const loadCheckedInUsers = useCallback(async () => {
    if (!eventId || !adminUserId) return
    setLoading(true)
    const { data, error } = await getCheckedInUsersAction(eventId, adminUserId)
    if (!error && data) {
      setCheckedInUsers(data)
    }
    setLoading(false)
  }, [eventId, adminUserId])

  // Load initial check-ins
  useEffect(() => {
    loadCheckedInUsers()
  }, [loadCheckedInUsers])

  // Real-time subscription
  useEffect(() => {
    if (!eventId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`checkin-list-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkin',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.is_checked_in) {
            // Add new check-in
            setCheckedInUsers(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_checked_in) {
              // Update existing
              setCheckedInUsers(prev => 
                prev.map(ci => ci.id === payload.new.id ? payload.new : ci)
              )
            } else {
              // Remove checked-out user
              setCheckedInUsers(prev => 
                prev.filter(ci => ci.id !== payload.new.id)
              )
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted check-in
            setCheckedInUsers(prev => 
              prev.filter(ci => ci.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  // Memoize filtered users to avoid re-filtering on every render
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return checkedInUsers
    const query = searchQuery.toLowerCase()
    return checkedInUsers.filter(checkIn => {
      const user = checkIn.user
      return (
        user?.name?.toLowerCase().includes(query) ||
        user?.email?.toLowerCase().includes(query)
      )
    })
  }, [checkedInUsers, searchQuery])

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-ui border-t-transparent mx-auto"></div>
        <p className="text-gray-medium mt-2">Loading attendees...</p>
      </div>
    )
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Search attendees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Card className="p-8 text-center">
          <p className="text-gray-medium">
            {searchQuery ? 'No attendees match your search' : 'No attendees checked in yet'}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search attendees..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="space-y-3">
        {filteredUsers.map((checkIn) => (
          <Card key={checkIn.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={checkIn.user?.profile_pic}
                  alt={checkIn.user?.name || 'User'}
                  size="md"
                />
                <div>
                  <p className="font-medium text-neutral-black">{checkIn.user?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-medium">
                    Checked in {formatCheckInTime(checkIn.checked_in_at)}
                  </p>
                </div>
              </div>
              <ManualCheckOut
                eventId={eventId}
                userId={checkIn.user_id}
                adminUserId={adminUserId}
                onSuccess={() => {
                  onCheckOut?.(checkIn.user_id)
                  setCheckedInUsers(prev => 
                    prev.filter(ci => ci.id !== checkIn.id)
                  )
                }}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default memo(CheckInList)

