// app/fraternities/page.js
// "My Fraternities" dashboard hub for admins
// Moved from home page (/) to separate route

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import FraternityCard from '@/components/FraternityCard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function FraternitiesDashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  const router = useRouter()

  // Filter to admin fraternities only (with null checks)
  // IMPORTANT: Only calculate when both auth and fraternity loading are complete
  const adminFraternities = (authLoading || fraternityLoading)
    ? [] // Don't calculate while loading
    : (userFraternities || [])
        .filter(f => f && f.role === 'admin' && f.fraternity)
        .map(f => f.fraternity) // Extract fraternity object for FraternityCard

  // Only consider user an admin if BOTH loading states are complete and they have admin fraternities
  const isAdmin = !authLoading && !fraternityLoading && adminFraternities.length > 0
  
  // Track if we've determined the user's admin status (to prevent flash)
  const hasDeterminedAdminStatus = !authLoading && !fraternityLoading

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (hasDeterminedAdminStatus && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isAdmin, hasDeterminedAdminStatus, router])

  // Show loading state while checking auth
  if (authLoading || fraternityLoading) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center">
        <Card className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Loading...</p>
        </Card>
      </main>
    )
  }

  // If not logged in or not an admin, this will redirect (handled in useEffect)
  if (!user || !isAdmin) {
    return null
  }

  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header with Home and Sign Out buttons */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            onClick={() => router.push('/')}
            variant="text"
            size="medium"
            className="text-gray-medium hover:text-gray-dark flex-shrink-0"
          >
            Home
          </Button>
          <h1 className="text-heading1 text-neutral-black flex-1 text-center">
            My Fraternities
          </h1>
          <Button
            onClick={async () => {
              await signOut()
              router.push('/')
            }}
            variant="text"
            size="medium"
            className="text-gray-medium hover:text-gray-dark flex-shrink-0"
          >
            Sign Out
          </Button>
        </div>

        <Card>
          <div className="space-y-6 flex flex-col">
            {/* Fraternity Cards List */}
            <div className="flex-1">
              {adminFraternities.length > 0 ? (
                <div className="space-y-4">
                  {adminFraternities.map((fraternity) => (
                    <FraternityCard
                      key={fraternity.id}
                      fraternity={fraternity}
                      onClick={() => router.push(`/fraternities/${fraternity.id}`)}
                      showMemberCount={true}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                // Empty State (edge case)
                <div className="py-8">
                  <p className="text-center text-bodySmall text-gray-medium">
                    No fraternities found. Create your first fraternity to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Create New Fraternity Button - at bottom */}
            <div className="pt-4">
              <Button
                onClick={() => router.push('/fraternities/create')}
                variant="primary"
                size="large"
                className="w-full"
              >
                Create New Fraternity
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

