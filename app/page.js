// app/page.js
// Main home page component
// Shows login/signup buttons when user is logged out
// Shows welcome message and sign out button when user is logged in

'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

// Dynamically import AuthModal - only loaded when modal is opened
const AuthModal = dynamic(() => import('@/components/AuthModal'), {
  ssr: false
})

export default function Home() {
  // Local state to control the auth modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login') // 'login' or 'signup'
  
  // Get current user from auth context
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // Redirect logged-in users to events page
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/events')
    }
  }, [user, authLoading, router])
  
  // Show loading state while checking auth
  if (authLoading) {
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
      {/* Center area - Login/Signup for logged-out users */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))]">
        {/* Show welcome message for logged-out users */}
        {!user && !authLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="text-center max-w-md w-full">
              <h1 className="text-2xl font-bold text-gray-dark mb-4">Welcome to BidMVP</h1>
              <p className="text-bodySmall text-gray-medium mb-6">
                Connect with your campus community and discover events near you.
              </p>
            </Card>
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

