// app/fraternities/[id]/page.js
// Basic fraternity dashboard showing verification status

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getFraternityAction, checkIsAdminAction, canCreateEventsAction } from '@/app/actions/fraternity'
import VerificationStatus from '@/components/VerificationStatus'
import ReportFraternityModal from '@/components/ReportFraternityModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function FraternityDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [fraternity, setFraternity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [canCreateEvents, setCanCreateEvents] = useState(null)
  const [adminLoading, setAdminLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)

  const fraternityId = params.id

  // Fetch fraternity data
  useEffect(() => {
    const fetchFraternity = async () => {
      if (authLoading) return

      if (!user?.id) {
        router.push('/')
        return
      }

      if (!fraternityId) {
        setError('Invalid fraternity ID')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await getFraternityAction(fraternityId)
        
        if (fetchError) {
          setError(fetchError.message || 'Failed to load fraternity')
        } else {
          setFraternity(data)
        }
      } catch (err) {
        setError(err.message || 'Failed to load fraternity')
      } finally {
        setLoading(false)
      }
    }

    fetchFraternity()
  }, [fraternityId, user?.id, authLoading, router])

  // Fetch admin status and event creation permission
  useEffect(() => {
    const fetchAdminAndEvents = async () => {
      if (authLoading || !user?.id || !fraternityId || loading) {
        return
      }

      setAdminLoading(true)
      setEventsLoading(true)

      try {
        // Check admin status
        const { data: adminData, error: adminError } = await checkIsAdminAction(fraternityId)
        if (!adminError && adminData) {
          setIsAdmin(adminData.isAdmin || false)
        }

        // Check event creation permission
        const { data: eventsData, error: eventsError } = await canCreateEventsAction(fraternityId)
        if (!eventsError && eventsData) {
          setCanCreateEvents(eventsData)
        }
      } catch (err) {
        console.error('Error fetching admin/events status:', err)
      } finally {
        setAdminLoading(false)
        setEventsLoading(false)
      }
    }

    fetchAdminAndEvents()
  }, [fraternityId, user?.id, authLoading, loading])

  // Show loading state
  if (authLoading || loading) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Loading...</p>
        </Card>
      </main>
    )
  }

  // If not logged in, this will redirect (handled in useEffect)
  if (!user) {
    return null
  }

  // Show error state
  if (error || !fraternity) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-bodySmall text-error mb-4">
            {error || 'Fraternity not found'}
          </p>
          <Button
            onClick={() => router.push('/')}
            variant="primary"
            size="large"
            className="w-full"
          >
            Go Home
          </Button>
        </Card>
      </main>
    )
  }

  // Backend returns lowercase types, map to capitalized labels
  const getTypeLabel = (type) => {
    const typeMap = {
      'fraternity': 'Fraternity',
      'sorority': 'Sorority',
      'other': 'Other'
    }
    return typeMap[type?.toLowerCase()] || type || 'Other'
  }

  const typeLabel = getTypeLabel(fraternity.type)

  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header with Back and Sign Out buttons */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            onClick={() => router.push('/')}
            variant="text"
            size="medium"
            className="text-gray-medium hover:text-gray-dark"
          >
            ← Back
          </Button>
          <Button
            onClick={async () => {
              await signOut()
              router.push('/')
            }}
            variant="text"
            size="medium"
            className="text-gray-medium hover:text-gray-dark"
          >
            Sign Out
          </Button>
        </div>
        <Card>
          <div className="space-y-6">
            {/* Header with photo and name */}
            <div className="flex items-start gap-4">
              {fraternity.photo_url && (
                <Avatar 
                  src={fraternity.photo_url} 
                  alt={fraternity.name}
                  size="large"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-heading1 text-neutral-black mb-2">
                  {fraternity.name}
                </h1>
                <Badge variant="tag" className="mb-2">
                  {typeLabel}
                </Badge>
                <p className="text-bodySmall text-gray-medium">
                  {fraternity.quality_member_count || 0} quality member{(fraternity.quality_member_count || 0) !== 1 ? 's' : ''}
                  {fraternity.member_count > (fraternity.quality_member_count || 0) && (
                    <span> ({fraternity.member_count} total)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Description */}
            {fraternity.description && (
              <div>
                <h2 className="text-heading3 text-neutral-black mb-2">
                  About
                </h2>
                <p className="text-bodySmall text-gray-dark">
                  {fraternity.description}
                </p>
              </div>
            )}

            {/* Verification Status */}
            <div>
              <h2 className="text-heading3 text-neutral-black mb-3">
                Verification Status
              </h2>
              <div className="p-4 bg-gray-light rounded-md">
                <VerificationStatus fraternity={fraternity} variant="detailed" />
              </div>
            </div>

            {/* Member Count Info */}
            <div className="p-4 bg-gray-light rounded-md">
              <p className="text-bodySmall text-gray-dark mb-2">
                <strong>Quality Member Count:</strong> {fraternity.quality_member_count || 0} / 7 needed
              </p>
              <p className="text-caption text-gray-medium">
                Only members with verified emails and completed profiles count toward verification.
              </p>
            </div>

            {/* Event Creation Status */}
            {canCreateEvents && (
              <div className={`p-4 rounded-md ${canCreateEvents.canCreate ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">{canCreateEvents.canCreate ? '✓' : 'ⓘ'}</span>
                  <div className="flex-1">
                    <p className="text-bodySmall font-semibold text-neutral-black mb-1">
                      {canCreateEvents.canCreate ? 'Ready to Create Events' : 'Event Creation Not Available'}
                    </p>
                    {canCreateEvents.reason && (
                      <p className="text-bodySmall text-gray-dark">
                        {canCreateEvents.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && !adminLoading && (
              <div className="pt-4 border-t border-gray-border space-y-3">
                <Button
                  onClick={() => router.push(`/fraternities/${fraternityId}/members`)}
                  variant="secondary"
                  size="large"
                  className="w-full"
                >
                  Manage Members
                </Button>
                {canCreateEvents?.canCreate && (
                  <Button
                    onClick={() => router.push(`/events/create?fraternityId=${fraternityId}`)}
                    variant="primary"
                    size="large"
                    className="w-full"
                  >
                    Create Event
                  </Button>
                )}
              </div>
            )}

            {/* Report Button */}
            <div className="pt-4 border-t border-gray-border">
              <Button
                onClick={() => setShowReportModal(true)}
                variant="text"
                size="medium"
                className="w-full text-error hover:text-error/80"
              >
                Report Fraternity
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportFraternityModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          fraternityId={fraternityId}
          fraternityName={fraternity.name}
        />
      )}
    </main>
  )
}

