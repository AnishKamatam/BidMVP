// app/page.js
// Main home page component
// Shows login/signup buttons when user is logged out
// Shows welcome message and sign out button when user is logged in

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function Home() {
  // Local state to control the auth modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login') // 'login' or 'signup'
  
  // Get current user from auth context (for potential future use)
  const { loading: authLoading } = useAuth()
  
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
      {/* Center area - empty for now, can add content later */}
      <div className="flex-1 flex items-center justify-center px-6">
        {/* Add any welcome content or branding here if needed */}
      </div>
      
      {/* Bottom buttons - always visible */}
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

      {/* Reusable auth modal - switches between login and signup mode */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </main>
  )
}

