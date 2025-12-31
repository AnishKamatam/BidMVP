// app/page.js
// Main home page component
// Shows login/signup buttons when user is logged out
// Shows welcome message and sign out button when user is logged in

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import AuthModal from '@/components/AuthModal'
import FraternityPrompt from '@/components/FraternityPrompt'
import FraternityCard from '@/components/FraternityCard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

export default function Home() {
  // Local state to control the auth modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login') // 'login' or 'signup'
  const [promptDismissed, setPromptDismissed] = useState(false)
  
  // Get current user from auth context (for potential future use)
  const { user, loading: authLoading } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  const router = useRouter()

  // Filter to admin fraternities only
  const adminFraternities = userFraternities
    .filter(f => f.role === 'admin')
    .map(f => f.fraternity) // Extract fraternity object for FraternityCard

  const isAdmin = adminFraternities.length > 0

  // Check if prompt was dismissed in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('fraternityPromptDismissed')
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        // Show again after 7 days
        if (dismissedTime > sevenDaysAgo) {
          setPromptDismissed(true)
        } else {
          localStorage.removeItem('fraternityPromptDismissed')
        }
      }
    }
  }, [])

  const handleDismissPrompt = () => {
    setPromptDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fraternityPromptDismissed', Date.now().toString())
    }
  }

  const handleJoinFraternity = () => {
    router.push('/fraternities/join?returnTo=/')
  }

  const showPrompt = user && 
                     !promptDismissed && 
                     !fraternityLoading && 
                     !isAdmin && // Don't show prompt if user is admin
                     userFraternities.length === 0
  
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

  // Helper functions to open modal in different modes
  const openLoginModal = () => {
    setModalMode('login')
    setModalOpen(true)
  }

  const openSignupModal = () => {
    setModalMode('signup')
    setModalOpen(true)
  }

  return (
    <main className="h-screen w-screen bg-white flex flex-col">
      {/* Fraternity Prompt Banner - only for logged-in users without fraternities */}
      {showPrompt && (
        <FraternityPrompt
          onJoin={handleJoinFraternity}
          onDismiss={handleDismissPrompt}
          variant="banner"
        />
      )}

      {/* Center area - Dashboard Hub for admins, placeholder for others */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {user && isAdmin ? (
          // Dashboard Hub Section
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-heading1 text-neutral-black mb-4">
                My Fraternities
              </h1>
              <Button
                onClick={() => router.push('/fraternities/create')}
                variant="primary"
                size="large"
                className="w-full"
              >
                Create New Fraternity
              </Button>
            </div>

            {/* Fraternity Cards List */}
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
              <Card>
                <p className="text-center text-bodySmall text-gray-medium py-8">
                  No fraternities found. Create your first fraternity to get started.
                </p>
              </Card>
            )}
          </div>
        ) : (
          // Placeholder for non-admin users (current empty center area)
          <div className="flex items-center justify-center">
            {/* Empty for now - future: redirect to events feed */}
          </div>
        )}
      </div>
      
      {/* Bottom buttons - only show when not logged in */}
      {!user && (
        <div className="w-full px-6 pb-10 safe-area-bottom">
          <div className="flex gap-4">
            {/* Log In button - secondary variant */}
            <Button
              onClick={openLoginModal}
              variant="secondary"
              size="large"
              className="flex-1"
            >
              Log In
            </Button>
            {/* Sign Up button - primary variant */}
            <Button
              onClick={openSignupModal}
              variant="primary"
              size="large"
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}

      {/* Reusable auth modal - switches between login and signup mode */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </main>
  )
}

