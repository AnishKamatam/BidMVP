// app/events/[id]/guests/page.js
// Main guest list management page for event hosts (admins only)

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getEventAction } from '@/app/actions/events'
import { getEventRequestsAction, approveRequestAction, denyRequestAction, getGuestListAction } from '@/app/actions/guests'
import { checkIsAdminAction } from '@/app/actions/fraternity'
import RequestCard from '@/components/RequestCard'
import GuestList from '@/components/GuestList'
import ManualAddGuest from '@/components/ManualAddGuest'
import LineSkipButton from '@/components/LineSkipButton'
import BidPurchaseButton from '@/components/BidPurchaseButton'
import dynamic from 'next/dynamic'

// Dynamically import PaymentSuccessModal - only shown conditionally
const PaymentSuccessModal = dynamic(() => import('@/components/PaymentSuccessModal'), {
  ssr: false
})
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function EventGuestsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [event, setEvent] = useState(null)
  const [requests, setRequests] = useState([])
  const [guestList, setGuestList] = useState([])
  const [selectedTab, setSelectedTab] = useState('requests') // 'requests' | 'guests'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [selectedRequests, setSelectedRequests] = useState(new Set())
  const [processingRequest, setProcessingRequest] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)

  const eventId = params.id

  // Define load functions first (using useCallback to prevent unnecessary re-renders)
  const loadRequests = async () => {
    if (!eventId) return
    try {
      const { data, error: requestsError } = await getEventRequestsAction(eventId, 'pending')
      if (requestsError) {
        console.error('Error loading requests:', requestsError)
        return
      }
      setRequests(data || [])
    } catch (err) {
      console.error('Error loading requests:', err)
    }
  }

  const loadGuestList = async () => {
    if (!eventId) return
    try {
      const { data, error: guestsError } = await getGuestListAction(eventId)
      if (guestsError) {
        console.error('Error loading guest list:', guestsError)
        return
      }
      setGuestList(data || [])
    } catch (err) {
      console.error('Error loading guest list:', err)
    }
  }

  // Check payment success/cancel from URL params
  useEffect(() => {
    const payment = searchParams.get('payment')
    const paymentType = searchParams.get('payment_type')
    const amount = searchParams.get('amount')

    if (payment === 'success' && paymentType && amount) {
      setPaymentInfo({ type: paymentType, amount: parseFloat(amount) })
      setShowPaymentModal(true)
      // Clean URL
      router.replace(`/events/${eventId}/guests`, { scroll: false })
    }
  }, [searchParams, eventId, router])

  // Load event and check authorization
  useEffect(() => {
    const loadData = async () => {
      if (authLoading || !user?.id || !eventId) {
        if (!authLoading) {
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Load event first (we need it to check admin access)
        const { data: eventData, error: eventError } = await getEventAction(eventId)
        if (eventError || !eventData) {
          setError(eventError?.message || 'Event not found')
          setLoading(false)
          return
        }
        setEvent(eventData)

        // Check admin status
        const adminResult = await checkIsAdminAction(eventData.frat_id)
        
        // Check if admin check returned an error or if user is not admin
        if (adminResult.error || !adminResult.data?.isAdmin) {
          setError('You must be an admin of this fraternity to manage guest lists')
          setLoading(false)
          return
        }
        setIsAdmin(true)

        // Load requests and guest list in parallel (both need admin, already checked above)
        await Promise.all([
          loadRequests(),
          loadGuestList(),
        ])
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id, authLoading])

  const handleApprove = async (requestId) => {
    setProcessingRequest(requestId)
    try {
      const { error } = await approveRequestAction(requestId)
      if (error) {
        setError(error.message || 'Failed to approve request')
      } else {
        // Refresh both lists
        await Promise.all([loadRequests(), loadGuestList()])
        setSelectedRequests((prev) => {
          const next = new Set(prev)
          next.delete(requestId)
          return next
        })
      }
    } catch (err) {
      console.error('Error approving request:', err)
      setError(err.message || 'Failed to approve request')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleDeny = async (requestId) => {
    setProcessingRequest(requestId)
    try {
      const { error } = await denyRequestAction(requestId)
      if (error) {
        setError(error.message || 'Failed to deny request')
      } else {
        // Refresh requests list
        await loadRequests()
        setSelectedRequests((prev) => {
          const next = new Set(prev)
          next.delete(requestId)
          return next
        })
      }
    } catch (err) {
      console.error('Error denying request:', err)
      setError(err.message || 'Failed to deny request')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0) return

    setProcessingRequest('bulk')
    try {
      const results = await Promise.all(
        Array.from(selectedRequests).map((requestId) => approveRequestAction(requestId))
      )
      const errors = results.filter((r) => r.error)
      if (errors.length > 0) {
        setError(`Failed to approve ${errors.length} request(s)`)
      } else {
        await Promise.all([loadRequests(), loadGuestList()])
        setSelectedRequests(new Set())
      }
    } catch (err) {
      console.error('Error bulk approving:', err)
      setError(err.message || 'Failed to approve requests')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleBulkDeny = async () => {
    if (selectedRequests.size === 0) return

    setProcessingRequest('bulk')
    try {
      const results = await Promise.all(
        Array.from(selectedRequests).map((requestId) => denyRequestAction(requestId))
      )
      const errors = results.filter((r) => r.error)
      if (errors.length > 0) {
        setError(`Failed to deny ${errors.length} request(s)`)
      } else {
        await loadRequests()
        setSelectedRequests(new Set())
      }
    } catch (err) {
      console.error('Error bulk denying:', err)
      setError(err.message || 'Failed to deny requests')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleSelectRequest = (requestId, selected) => {
    setSelectedRequests((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(requestId)
      } else {
        next.delete(requestId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set())
    } else {
      setSelectedRequests(new Set(requests.map((r) => r.id)))
    }
  }

  const handleManualAddSuccess = () => {
    loadGuestList()
  }

  // Filter requests and guests by search query
  const filteredRequests = requests.filter((request) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      request.user?.name?.toLowerCase().includes(query) ||
      request.user?.email?.toLowerCase().includes(query)
    )
  })

  const filteredGuests = guestList.filter((guest) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      guest.user?.name?.toLowerCase().includes(query) ||
      guest.user?.email?.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                // Navigate back to Manage Guest Lists page for this fraternity
                if (event?.frat_id) {
                  router.push(`/fraternities/${event.frat_id}/events/guests`)
                } else {
                  router.back()
                }
              }}
              className="p-2 hover:bg-gray-light rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-dark" />
            </button>
            <h1 className="text-heading2 text-neutral-black flex-1 text-center">
              Guest List
            </h1>
            <Button
              variant="primary"
              size="small"
              onClick={() => router.push(`/events/${eventId}/checkin`)}
              className="whitespace-nowrap"
            >
              Check-In
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Event Info */}
        {event && (
          <Card variant="default" className="p-4">
            <h2 className="font-semibold text-gray-dark mb-1">{event.title}</h2>
            <p className="text-sm text-gray-medium">{formatDate(event.date)}</p>
            {event.location && (
              <p className="text-sm text-gray-medium">{event.location}</p>
            )}
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card variant="default" className="p-4 bg-red-50 border-red-200">
            <p className="text-bodySmall text-red-600">{error}</p>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-border">
          <button
            onClick={() => setSelectedTab('requests')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              selectedTab === 'requests'
                ? 'text-primary-ui border-b-2 border-primary-ui'
                : 'text-gray-medium hover:text-gray-dark'
            }`}
          >
            Requests ({requests.length})
          </button>
          <button
            onClick={() => setSelectedTab('guests')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              selectedTab === 'guests'
                ? 'text-primary-ui border-b-2 border-primary-ui'
                : 'text-gray-medium hover:text-gray-dark'
            }`}
          >
            Guest List ({guestList.length})
          </button>
        </div>

        {/* Search Bar */}
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Requests Tab */}
        {selectedTab === 'requests' && (
          <div className="space-y-4">
            {/* Bulk Actions */}
            {filteredRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleSelectAll}
                >
                  {selectedRequests.size === filteredRequests.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedRequests.size > 0 && (
                  <>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleBulkApprove}
                      disabled={processingRequest === 'bulk'}
                    >
                      Approve ({selectedRequests.size})
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={handleBulkDeny}
                      disabled={processingRequest === 'bulk'}
                    >
                      Deny ({selectedRequests.size})
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <Card variant="default" className="p-8 text-center">
                <p className="text-bodySmall text-gray-medium">
                  {searchQuery ? 'No requests match your search.' : 'No pending requests.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                    loading={processingRequest === request.id}
                    showCheckbox={true}
                    selected={selectedRequests.has(request.id)}
                    onSelect={handleSelectRequest}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guest List Tab */}
        {selectedTab === 'guests' && (
          <div className="space-y-4">
            {/* Add Guest Button */}
            <Button
              variant="primary"
              size="medium"
              onClick={() => setShowManualAdd(true)}
              iconLeft={<PlusIcon className="w-5 h-5" />}
              className="w-full"
            >
              Add Guest Manually
            </Button>

            {/* Guest List */}
            <GuestList
              guests={filteredGuests}
              loading={false}
            />

            {/* Payment Buttons (for reference - will be used in Phase 1.4) */}
            {event && event.line_skip_price > 0 && (
              <Card variant="default" className="p-4">
                <h3 className="font-semibold text-gray-dark mb-2">Line Skip</h3>
                <LineSkipButton
                  eventId={eventId}
                  amount={event.line_skip_price}
                  onError={(err) => setError(err)}
                />
              </Card>
            )}

            {event && event.bid_price > 0 && (
              <Card variant="default" className="p-4">
                <h3 className="font-semibold text-gray-dark mb-2">Bid Purchase</h3>
                <BidPurchaseButton
                  eventId={eventId}
                  event={event}
                  onError={(err) => setError(err)}
                />
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Manual Add Guest Modal */}
      <ManualAddGuest
        eventId={eventId}
        isOpen={showManualAdd}
        onClose={() => setShowManualAdd(false)}
        onSuccess={handleManualAddSuccess}
      />

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setPaymentInfo(null)
        }}
        paymentType={paymentInfo?.type}
        amount={paymentInfo?.amount}
      />
    </div>
  )
}

