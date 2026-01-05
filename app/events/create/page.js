// app/events/create/page.js
// Event creation page with DoorList-inspired layout

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { createEventAction } from '@/app/actions/events'
import { canCreateEventsAction } from '@/app/actions/fraternity'
import EventForm from '@/components/EventForm'
import EventIllustrationUpload from '@/components/EventIllustrationUpload'
import FraternityRequiredModal from '@/components/FraternityRequiredModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/outline'

export default function CreateEventPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [verifiedFraternities, setVerifiedFraternities] = useState([])
  const [selectedFratId, setSelectedFratId] = useState(null)
  const [illustrationUrl, setIllustrationUrl] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)

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
      const adminFraternities = userFraternities.filter(frat => frat.role === 'admin')

      if (adminFraternities.length === 0) {
        setCheckingVerification(false)
        setShowVerificationModal(true)
        return
      }

      // Check verification status for each admin fraternity
      const verificationChecks = await Promise.all(
        adminFraternities.map(async (frat) => {
          const { data } = await canCreateEventsAction(frat.id)
          return {
            ...frat,
            canCreate: data?.canCreate || false
          }
        })
      )

      const verified = verificationChecks.filter(frat => frat.canCreate)

      if (verified.length === 0) {
        setCheckingVerification(false)
        setShowVerificationModal(true)
        return
      }

      setVerifiedFraternities(verified)

      // Auto-select if only one verified fraternity
      if (verified.length === 1) {
        setSelectedFratId(verified[0].id)
      }

      setCheckingVerification(false)
    }

    checkVerification()
  }, [user, userFraternities, authLoading, fraternityLoading])

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
        setError(createError.message || 'Failed to create event')
        setLoading(false)
        return
      }

      if (data) {
        // Redirect to event detail page or fraternity dashboard
        router.push(`/events/${data.id}`)
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
        <div className="w-10" /> {/* Spacer for centering */}
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
          <EventForm
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

