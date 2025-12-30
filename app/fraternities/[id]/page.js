// app/fraternities/[id]/page.js
// Basic fraternity dashboard showing verification status

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getFraternityAction } from '@/app/actions/fraternity'
import VerificationStatus from '@/components/VerificationStatus'
import ReportFraternityModal from '@/components/ReportFraternityModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function FraternityDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [fraternity, setFraternity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)

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

  const typeLabels = {
    'Fraternity': 'Fraternity',
    'Sorority': 'Sorority',
    'Other': 'Other'
  }

  const typeLabel = typeLabels[fraternity.type] || fraternity.type || 'Other'

  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <Card>
          <div className="space-y-6">
            {/* Header with photo and name */}
            <div className="flex items-start gap-4">
              {fraternity.photo && (
                <Avatar 
                  src={fraternity.photo} 
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
                  {fraternity.total_member_count > (fraternity.quality_member_count || 0) && (
                    <span> ({fraternity.total_member_count} total)</span>
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

