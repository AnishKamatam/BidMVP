// app/welcome/page.js
// Welcome page shown after successful login
// Shows welcome message and sign out button

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import FraternityPrompt from '@/components/FraternityPrompt'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function WelcomePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  const router = useRouter()
  const [promptDismissed, setPromptDismissed] = useState(false)

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

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleDismissPrompt = () => {
    setPromptDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fraternityPromptDismissed', Date.now().toString())
    }
  }

  const handleJoinFraternity = () => {
    router.push('/fraternities/join?returnTo=/welcome')
  }

  const showPrompt = !promptDismissed && 
                     !fraternityLoading && 
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

  // If not logged in, don't render (will redirect)
  if (!user) {
    return null
  }

  // Handle user sign out
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <main className="min-h-screen w-screen bg-white flex flex-col">
      {/* Fraternity Prompt Banner */}
      {showPrompt && (
        <FraternityPrompt
          onJoin={handleJoinFraternity}
          onDismiss={handleDismissPrompt}
          variant="banner"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-heading1 text-neutral-black mb-2">Welcome!</p>
          <p className="text-bodySmall text-gray-dark mb-6">{user.email}</p>
          <Button
            onClick={handleSignOut}
            variant="secondary"
            size="large"
            className="w-full"
          >
            Sign Out
          </Button>
        </Card>
      </div>
    </main>
  )
}

