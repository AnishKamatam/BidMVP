// app/events/create/page.js
// Event creation page with DoorList-inspired layout

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { createEventAction } from '@/app/actions/events'
import { canCreateEventsAction } from '@/app/actions/fraternity'
import EventIllustrationUpload from '@/components/EventIllustrationUpload'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/outline'

// Dynamically import large form components - only used on this page
const EventForm = dynamic(() => import('@/components/EventForm'), {
  loading: () => (
    <Card className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-ui border-t-transparent mx-auto mb-2"></div>
      <p className="text-gray-medium">Loading form...</p>
    </Card>
  )
})

const FraternityRequiredModal = dynamic(() => import('@/components/FraternityRequiredModal'), {
  ssr: false
})

function CreateEventPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [verifiedFraternities, setVerifiedFraternities] = useState([])
  const [selectedFratId, setSelectedFratId] = useState(null)
  const [illustrationUrl, setIllustrationUrl] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)
  const formRef = useRef(null)

  // Get fraternityId from query parameter
  const fraternityIdFromQuery = searchParams.get('fraternityId')

  // Check verification status for user's fraternities
  useEffect(() => {
    const checkVerification = async () => {
      if (authLoading || fraternityLoading || !user?.id) {
        return
      }

      if (!userFraternities || userFraternities.length === 0) {
        setCheckingVerification(false)
        setShowVerificationModal(true)
        return
      }

      setCheckingVerification(true)

      // Filter to admin fraternities only
      // userFraternities structure: [{ fraternity: {...}, role: 'admin' }, ...]
      const adminFraternities = userFraternities.filter(frat => frat.role === 'admin')

      if (adminFraternities.length === 0) {
        setCheckingVerification(false)
        setShowVerificationModal(true)
        return
      }

      // Check verification status for each admin fraternity
      const verificationChecks = await Promise.all(
        adminFraternities.map(async (frat) => {
          const fraternityId = frat.fraternity?.id || frat.id
          const { data } = await canCreateEventsAction(fraternityId)
          return {
            ...frat,
            id: fraternityId,
            name: frat.fraternity?.name || frat.name,
            canCreate: data?.canCreate || false,
            reason: data?.reason || null,
            membersNeeded: data?.membersNeeded || 0,
            qualityMemberCount: data?.qualityMemberCount || 0
          }
        })
      )

      // If a specific fraternity was requested via query param, include it even if not verified
      // This allows users to see the form and get a clear error message
      const verified = verificationChecks.filter(frat => frat.canCreate)
      const requestedFrat = fraternityIdFromQuery 
        ? verificationChecks.find(frat => frat.id === fraternityIdFromQuery)
        : null

      // If no verified fraternities and no requested fraternity, show modal
      if (verified.length === 0 && !requestedFrat) {
        setCheckingVerification(false)
        setShowVerificationModal(true)
        return
      }

      // Include verified fraternities, and the requested one if it exists (even if not verified)
      const fraternitiesToShow = verified.length > 0 
        ? verified 
        : requestedFrat 
          ? [requestedFrat]
          : []

      setVerifiedFraternities(fraternitiesToShow)

      // Pre-select fraternity from query parameter if provided and valid
      if (fraternityIdFromQuery) {
        const queryFrat = fraternitiesToShow.find(frat => frat.id === fraternityIdFromQuery)
        if (queryFrat) {
          setSelectedFratId(fraternityIdFromQuery)
        } else if (fraternitiesToShow.length > 0) {
          // If query param fraternity is not in list, select first available
          setSelectedFratId(fraternitiesToShow[0].id)
        }
      } else if (fraternitiesToShow.length === 1) {
        // Auto-select if only one fraternity and no query param
        setSelectedFratId(fraternitiesToShow[0].id)
      }

      setCheckingVerification(false)
    }

    checkVerification()
  }, [user, userFraternities, authLoading, fraternityLoading, fraternityIdFromQuery])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (eventData) => {
    if (!selectedFratId) {
      setError('Please select a fraternity')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const submitData = {
        ...eventData,
        frat_id: selectedFratId,
        image_url: illustrationUrl || null
      }

      const { data, error: createError } = await createEventAction(submitData)

      if (createError) {
        // Handle backend error responses - may include additional fields
        const errorMessage = createError.message || createError.error?.message || 'Failed to create event'
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (data) {
        // Redirect to event detail page (if exists) or fraternity dashboard
        // For now, redirect to home until event detail page is implemented
        router.push('/')
      } else {
        setError('Failed to create event')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to create event')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Show loading state
  if (authLoading || fraternityLoading || checkingVerification) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent"></div>
      </main>
    )
  }

  // If not logged in, redirect (handled in useEffect)
  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen w-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-border px-4 py-3 flex items-center justify-between">
        <Button variant="text" onClick={handleCancel} className="p-2">
          <XIcon className="w-6 h-6" />
        </Button>
        <h1 className="text-heading2 text-neutral-black">Create Event</h1>
        <Button 
          variant="text" 
          onClick={() => formRef.current?.requestSubmit()} 
          className="p-2"
          disabled={loading}
        >
          <CheckIcon className="w-6 h-6 text-primary-ui" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto pb-20">
        {/* Header Card with Illustration Upload */}
        <div className="mx-4 mt-4 mb-6">
          <Card className="bg-gradient-to-br from-primary-ui/10 to-primary-ui/5 p-6 text-center relative overflow-hidden">
            <h2 className="text-heading2 text-neutral-black mb-2">Create Event</h2>
            {/* Event Illustration Upload */}
            <EventIllustrationUpload
              value={illustrationUrl}
              onChange={setIllustrationUrl}
              userId={user?.id}
            />
          </Card>
        </div>

        {/* Event Form */}
        <div className="px-4">
          {/* Show warning if selected fraternity can't create events */}
          {selectedFratId && (() => {
            const selectedFrat = verifiedFraternities.find(f => (f.id || f.fraternity?.id) === selectedFratId)
            if (selectedFrat && !selectedFrat.canCreate) {
              return (
                <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-bodySmall font-semibold text-neutral-black mb-1">
                        Fraternity Not Verified for Events
                      </p>
                      <p className="text-bodySmall text-gray-dark mb-2">
                        {selectedFrat.reason || 'This fraternity does not meet the requirements to create events.'}
                      </p>
                      <p className="text-caption text-gray-medium">
                        Current: {selectedFrat.qualityMemberCount || 0} verified members. 
                        Required: {selectedFrat.membersNeeded ? `${selectedFrat.qualityMemberCount + selectedFrat.membersNeeded}` : '7'} verified members.
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}
          <EventForm
            ref={formRef}
            fratId={selectedFratId}
            userFraternities={verifiedFraternities}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        </div>
      </div>

      {/* Verification Modal */}
      <FraternityRequiredModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false)
          router.back()
        }}
        onJoin={() => {
          setShowVerificationModal(false)
          router.push('/fraternities/join')
        }}
        onCreate={() => {
          setShowVerificationModal(false)
          router.push('/fraternities/create')
        }}
        userFraternities={userFraternities || []}
      />
    </main>
  )
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen w-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent"></div>
      </main>
    }>
      <CreateEventPageContent />
    </Suspense>
  )
}

