// app/fraternities/[id]/events/guests/page.js
// Page listing all fraternity events with pending request counts and links to manage guests

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getFraternityEventsAction } from '@/app/actions/guests'
import { getEventRequestsAction } from '@/app/actions/guests'
import { getFraternityAction } from '@/app/actions/fraternity'
import { checkIsAdminAction } from '@/app/actions/fraternity'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Input from '@/components/ui/Input'

export default function FraternityEventsGuestsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [fraternity, setFraternity] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'upcoming' | 'past'

  const fraternityId = params.id

  // Check admin status and load fraternity
  useEffect(() => {
    const loadData = async () => {
      if (authLoading || !user?.id || !fraternityId) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Check admin status
        const { data: adminData } = await checkIsAdminAction(fraternityId)
        if (!adminData?.isAdmin) {
          setError('You must be an admin to manage guest lists')
          setLoading(false)
          return
        }
        setIsAdmin(true)

        // Load fraternity
        const { data: fratData, error: fratError } = await getFraternityAction(fraternityId)
        if (fratError) {
          setError(fratError.message || 'Failed to load fraternity')
          setLoading(false)
          return
        }
        setFraternity(fratData)

        // Load events
        const { data: eventsData, error: eventsError } = await getFraternityEventsAction(fraternityId)
        if (eventsError) {
          setError(eventsError.message || 'Failed to load events')
          setLoading(false)
          return
        }

        // Load pending counts for each event
        const eventsWithCounts = await Promise.all(
          (eventsData || []).map(async (event) => {
            try {
              const { data: requestsData } = await getEventRequestsAction(event.id, 'pending')
              return {
                ...event,
                pendingCount: requestsData?.length || 0,
              }
            } catch (err) {
              console.error(`Error loading pending count for event ${event.id}:`, err)
              return {
                ...event,
                pendingCount: 0,
              }
            }
          })
        )

        setEvents(eventsWithCounts)
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fraternityId, user?.id, authLoading])

  // Filter events
  const filteredEvents = events.filter((event) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        event.title?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Date filter
    if (dateFilter === 'upcoming') {
      const eventDate = new Date(event.date)
      return eventDate >= new Date()
    } else if (dateFilter === 'past') {
      const eventDate = new Date(event.date)
      return eventDate < new Date()
    }

    return true
  })

  // Sort events: upcoming first, then by pending count (most first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    const now = new Date()

    // Upcoming events first
    const aIsUpcoming = aDate >= now
    const bIsUpcoming = bDate >= now
    if (aIsUpcoming !== bIsUpcoming) {
      return aIsUpcoming ? -1 : 1
    }

    // Then by pending count (most first)
    if (a.pendingCount !== b.pendingCount) {
      return b.pendingCount - a.pendingCount
    }

    // Then by date (earliest first)
    return aDate - bDate
  })

  const handleManageGuests = (eventId) => {
    router.push(`/events/${eventId}/guests`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD'
    try {
      // Parse the ISO string - JavaScript automatically handles UTC to local conversion
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      
      // Use toLocaleString to ensure proper timezone conversion
      // This will display the date/time in the user's local timezone
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Explicitly use user's timezone
      })
    } catch (e) {
      return 'Invalid Date'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-bg p-4">
        <div className="max-w-2xl mx-auto">
          <div className="p-4 text-center">
            <p className="text-bodySmall text-gray-medium">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-bg p-4">
        <div className="max-w-2xl mx-auto">
          <Card variant="default" className="p-6">
            <p className="text-bodySmall text-error mb-4">{error}</p>
            <Button variant="primary" size="medium" onClick={() => router.back()}>
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-bg">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-light rounded-full transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-dark" />
            </button>
            <h1 className="text-heading2 text-neutral-black flex-1">
              Manage Guest Lists
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Fraternity Name */}
        {fraternity && (
          <div>
            <p className="text-bodySmall text-gray-medium">
              Fraternity: <span className="font-semibold text-gray-dark">{fraternity.name}</span>
            </p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant={dateFilter === 'all' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setDateFilter('all')}
            >
              All
            </Button>
            <Button
              variant={dateFilter === 'upcoming' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setDateFilter('upcoming')}
            >
              Upcoming
            </Button>
            <Button
              variant={dateFilter === 'past' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setDateFilter('past')}
            >
              Past
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card variant="default" className="p-4 bg-red-50 border-red-200">
            <p className="text-bodySmall text-red-600">{error}</p>
          </Card>
        )}

        {/* Events List */}
        {sortedEvents.length === 0 ? (
          <Card variant="default" className="p-8 text-center">
            <p className="text-bodySmall text-gray-medium">
              {searchQuery || dateFilter !== 'all'
                ? 'No events match your filters.'
                : 'No events found.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <Card key={event.id} variant="default" className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-dark mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-medium">{formatDate(event.date)}</p>
                    {event.location && (
                      <p className="text-sm text-gray-medium">{event.location}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {event.pendingCount > 0 ? (
                        <Badge variant="count">
                          {event.pendingCount} Pending
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-medium">No pending requests</span>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleManageGuests(event.id)}
                    >
                      Manage Guests →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

