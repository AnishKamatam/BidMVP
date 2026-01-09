// app/events/page.js
// Main event feed page showing all campus events

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getCampusEventsAction } from '@/app/actions/events'
import EventCard from '@/components/EventCard'
import EventFilters from '@/components/EventFilters'
import PaymentSuccessModal from '@/components/PaymentSuccessModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [filters, setFilters] = useState({
    event_type: null,  // null = all types
    visibility: null,  // null = all visibility
    rush_only: false
  })

  // Load events function
  const loadEvents = useCallback(async () => {
    if (authLoading || !user?.id) {
      if (!authLoading) {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: eventsError } = await getCampusEventsAction(filters)

      if (eventsError) {
        // Check for specific error types
        if (eventsError.message?.includes('complete profile and select a campus')) {
          setError({
            type: 'no_school',
            message: 'User must complete profile and select a campus to view events'
          })
        } else {
          setError({
            type: 'api_error',
            message: eventsError.message || 'Failed to load events. Please try again.'
          })
        }
        setEvents([])
        setLoading(false)
        return
      }

      setEvents(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading events:', err)
      setError({
        type: 'network_error',
        message: 'Failed to load events. Please check your connection and try again.'
      })
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, authLoading, filters])

  // Load events on mount and when filters change
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Check payment success/cancel from URL params
  useEffect(() => {
    const payment = searchParams.get('payment')
    const paymentType = searchParams.get('payment_type')
    const amount = searchParams.get('amount')

    if (payment === 'success' && paymentType && amount) {
      setPaymentInfo({ type: paymentType, amount: parseFloat(amount) })
      setShowPaymentModal(true)
      // Clean URL
      router.replace('/events', { scroll: false })
    }
  }, [searchParams, router])

  // Show loading state
  if (authLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Card className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Loading...</p>
        </Card>
      </main>
    )
  }

  // Show not authenticated state
  if (!user) {
    return null // Will redirect via useEffect
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-light">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-dark">Events</h1>
        </div>
      </div>

      {/* Filters */}
      <EventFilters
        filters={filters}
        onChange={setFilters}
      />

      {/* Content Area with bottom padding for navigation */}
      <div className="px-4 py-4 pb-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))]">
        {/* Error State */}
        {error && (
          <Card className="mb-4 p-6 text-center bg-red-50 border-red-200">
            <p className="text-bodySmall text-red-600 mb-4">{error.message}</p>
            {error.type === 'no_school' && (
              <Button
                variant="primary"
                size="medium"
                onClick={() => router.push('/profile')}
                className="w-full"
              >
                Complete Profile
              </Button>
            )}
            {error.type !== 'no_school' && (
              <Button
                variant="primary"
                size="medium"
                onClick={loadEvents}
                className="w-full"
              >
                Retry
              </Button>
            )}
          </Card>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-light rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-light rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-light rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-light rounded w-3/4"></div>
                  <div className="h-4 bg-gray-light rounded w-1/2"></div>
                  <div className="h-10 bg-gray-light rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-bodySmall text-gray-medium mb-4">
              No events found
            </p>
            <p className="text-bodySmall text-gray-medium">
              Check back later for upcoming events at your campus!
            </p>
          </Card>
        )}

        {/* Events List */}
        {!loading && !error && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="default"
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setPaymentInfo(null)
        }}
        paymentType={paymentInfo?.type || 'bid'}
        amount={paymentInfo?.amount}
      />
    </main>
  )
}

