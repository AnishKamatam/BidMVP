// app/events/[id]/page.js
// Event details page - shows full event information and provides access to event features
// - View QR code
// - Purchase bid
// - Check-in (admin only)
// - Manage guests (admin only)

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getEventAction } from '@/app/actions/events'
import { checkUserApprovedForEventAction } from '@/app/actions/guests'
import { isUserCheckedInAction } from '@/app/actions/checkin'
import { checkIsAdminAction } from '@/app/actions/fraternity'
import { checkUserBidPurchaseAction } from '@/app/actions/revenue'
import { formatEventDate, formatEventDateRange } from '@/lib/utils/dateFormatting'
import LayoutWrapper from '@/components/LayoutWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import BidPurchaseButton from '@/components/BidPurchaseButton'
import PaymentSuccessModal from '@/components/PaymentSuccessModal'

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const eventId = params.id

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isApproved, setIsApproved] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState(null)
  const [hasPurchasedBid, setHasPurchasedBid] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)

  // Memoize checkCheckInStatus to avoid recreating on every render
  const checkCheckInStatus = useCallback(async () => {
    if (!eventId || !user?.id) return
    const { data, error } = await isUserCheckedInAction(eventId, user.id)
    if (!error && data) {
      setCheckInStatus(data)
    } else {
      setCheckInStatus(null)
    }
  }, [eventId, user?.id])

  // Load event and all status information
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return

      if (!user?.id) {
        router.push('/')
        return
      }

      if (!eventId) {
        setLoading(false)
        setError('Event ID is required')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Load event, approval status, check-in status, bid purchase, and admin status in parallel
        const [
          eventResult,
          approvalResult,
          checkInResult,
          bidPurchaseResult,
        ] = await Promise.all([
          getEventAction(eventId),
          checkUserApprovedForEventAction(eventId),
          isUserCheckedInAction(eventId, user.id),
          checkUserBidPurchaseAction(eventId),
        ])

        // Handle event data
        const { data: eventData, error: eventError } = eventResult
        if (eventError || !eventData) {
          setError(eventError?.message || 'Event not found')
          setLoading(false)
          return
        }

        setEvent(eventData)

        // Check admin status (need event data first to get frat_id)
        if (eventData.frat_id) {
          const { data: adminData } = await checkIsAdminAction(eventData.frat_id)
          setIsAdmin(adminData?.isAdmin || false)
        }

        // Handle approval status
        const { data: approvalData, error: approvalError } = approvalResult
        if (!approvalError && approvalData) {
          setIsApproved(approvalData.isApproved || false)
          setIsPublic(approvalData.isPublic || false)
        }

        // Handle check-in status
        if (!checkInResult.error && checkInResult.data) {
          setCheckInStatus(checkInResult.data)
        }

        // Handle bid purchase status
        const { data: bidPurchaseData, error: bidPurchaseError } = bidPurchaseResult
        if (!bidPurchaseError && bidPurchaseData) {
          setHasPurchasedBid(bidPurchaseData.hasPurchased || false)
        }
      } catch (err) {
        console.error('Error loading event data:', err)
        setError(err.message || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id, eventId, authLoading, router])

  // Poll for check-in status updates
  useEffect(() => {
    if (!eventId || !user?.id) return

    // Initial check
    checkCheckInStatus()

    // Poll every 5 seconds (only if not checked in)
    const interval = setInterval(() => {
      if (!checkInStatus || !checkInStatus.is_checked_in) {
        checkCheckInStatus()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [eventId, user?.id, checkCheckInStatus, checkInStatus])

  // Check payment success/cancel from URL params
  useEffect(() => {
    const payment = searchParams.get('payment')
    const paymentType = searchParams.get('payment_type')
    const amount = searchParams.get('amount')

    if (payment === 'success' && paymentType && amount) {
      setPaymentInfo({ type: paymentType, amount: parseFloat(amount) })
      setShowPaymentModal(true)
      // Clean URL
      router.replace(`/events/${eventId}`, { scroll: false })
      
      // Refresh bid purchase status
      if (paymentType === 'bid') {
        checkUserBidPurchaseAction(eventId).then(({ data }) => {
          if (data) {
            setHasPurchasedBid(data.hasPurchased)
          }
        })
      }
    }
  }, [searchParams, router, eventId])

  // Get event type label
  const getEventTypeLabel = (type) => {
    const labels = {
      'party': 'Party',
      'mixer': 'Mixer',
      'rush': 'Rush Event',
      'invite-only': 'Invite Only'
    }
    return labels[type] || type
  }

  // Get visibility label
  const getVisibilityLabel = (visibility) => {
    const labels = {
      'public': 'Public',
      'invite-only': 'Invite Only',
      'rush-only': 'Rush Only'
    }
    return labels[visibility] || visibility
  }

  if (authLoading || loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto"></div>
            <p className="text-gray-medium mt-4">Loading event...</p>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  if (error || !event) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-white p-4">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-dark mb-4">Event Not Found</h2>
            <p className="text-gray-medium mb-6">{error || 'The event you are looking for does not exist.'}</p>
            <Button variant="primary" onClick={() => router.push('/events')}>
              Back to Events
            </Button>
          </Card>
        </div>
      </LayoutWrapper>
    )
  }

  const isCheckedIn = checkInStatus?.is_checked_in || false
  const canViewQR = isApproved || isPublic
  // Show Buy Bid button if event has a bid price
  // Note: BidPurchaseButton component will handle its own purchase status check
  // Convert bid_price to number if it's a string
  const bidPrice = event?.bid_price ? parseFloat(event.bid_price) : 0
  const showBuyBid = event && bidPrice > 0

  return (
    <LayoutWrapper>
      <main className="min-h-screen bg-white pb-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))]">
        {/* Header */}
        <div className="bg-white border-b border-gray-light sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.push('/events')}
              className="flex items-center text-gray-dark"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-lg font-bold text-gray-dark">Event Details</h1>
            <div className="w-14" /> {/* Spacer for centering */}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Event Image */}
          {event.image_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-light">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Title and Fraternity */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold text-gray-dark flex-1">{event.title}</h2>
                <div className="flex gap-2 flex-shrink-0">
                  <Badge variant="tag">{getEventTypeLabel(event.event_type)}</Badge>
                  <Badge variant="tag">{getVisibilityLabel(event.visibility)}</Badge>
                </div>
              </div>

              {/* Always prioritize fraternity name when available - never show admin/creator info */}
              {/* Only display fraternity information - fraternity name is the primary identifier */}
              {event.fraternity && event.fraternity.name && (
                <div className="flex items-center gap-3 pt-2 border-t border-gray-light">
                  <Avatar
                    src={event.fraternity.photo_url}
                    alt={event.fraternity.name}
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-gray-dark">{event.fraternity.name}</p>
                    {event.fraternity.type && (
                      <p className="text-sm text-gray-medium capitalize">
                        {event.fraternity.type}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Status Indicators */}
          {(hasPurchasedBid || isApproved || isCheckedIn) && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-dark mb-3">Your Status</h3>
              <div className="space-y-2">
                {hasPurchasedBid && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-medium">Bid Purchase</span>
                    <Badge variant="status" status="active">Purchased</Badge>
                  </div>
                )}
                {isApproved && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-medium">Approval</span>
                    <Badge variant="status" status="active">Approved</Badge>
                  </div>
                )}
                {isCheckedIn && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-medium">Check-In</span>
                    <Badge variant="status" status="active">Checked In</Badge>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Event Details */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-dark mb-3">Event Details</h3>
            <div className="space-y-3">
              {/* Date and Time */}
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-3 mt-0.5 text-gray-medium flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-gray-medium">Date & Time</p>
                  <p className="text-base text-gray-dark font-medium">
                    {event.end_time 
                      ? formatEventDateRange(event.date, event.end_time)
                      : formatEventDate(event.date)
                    }
                  </p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 text-gray-medium flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-medium">Location</p>
                    <p className="text-base text-gray-dark font-medium">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="pt-3 border-t border-gray-light">
                  <p className="text-sm text-gray-medium mb-2">Description</p>
                  <p className="text-base text-gray-dark whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Pricing */}
              {(event.bid_price > 0 || event.line_skip_price) && (
                <div className="pt-3 border-t border-gray-light">
                  <p className="text-sm text-gray-medium mb-2">Pricing</p>
                  <div className="space-y-1">
                    {event.bid_price > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-base text-gray-dark">Bid Price</span>
                        <span className="text-base font-semibold text-gray-dark">
                          ${event.bid_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {event.line_skip_price && (
                      <div className="flex items-center justify-between">
                        <span className="text-base text-gray-dark">Line Skip</span>
                        <span className="text-base font-semibold text-gray-dark">
                          ${event.line_skip_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* View QR Code Button */}
            {canViewQR && (
              <Button
                variant="primary"
                size="large"
                onClick={() => router.push(`/events/${eventId}/qr`)}
                className="w-full"
              >
                View My QR Code
              </Button>
            )}

            {/* Buy Bid Button */}
            {showBuyBid && (
              <BidPurchaseButton
                eventId={eventId}
                event={event}
                variant="button"
                onSuccess={() => {
                  // Refresh bid purchase status
                  checkUserBidPurchaseAction(eventId).then(({ data }) => {
                    if (data) {
                      setHasPurchasedBid(data.hasPurchased)
                    }
                  })
                }}
                onError={(error) => {
                  console.error('Bid purchase error:', error)
                }}
              />
            )}

            {/* Request Access Button (for invite-only/rush-only events) */}
            {!isApproved && !isPublic && (
              <Button
                variant="secondary"
                size="large"
                onClick={async () => {
                  // TODO: Implement event request creation
                  // For now, show a message
                  alert('Event request feature coming soon!')
                }}
                className="w-full"
              >
                Request Access
              </Button>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <>
                <div className="pt-2 border-t border-gray-light">
                  <p className="text-sm font-semibold text-gray-medium mb-3">Admin Actions</p>
                </div>
                
                <Button
                  variant="secondary"
                  size="large"
                  onClick={() => router.push(`/events/${eventId}/checkin`)}
                  className="w-full mb-3"
                >
                  Check-In Guests
                </Button>

                <Button
                  variant="secondary"
                  size="large"
                  onClick={() => router.push(`/events/${eventId}/guests`)}
                  className="w-full"
                >
                  Manage Guests
                </Button>
              </>
            )}
          </div>
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
    </LayoutWrapper>
  )
}

