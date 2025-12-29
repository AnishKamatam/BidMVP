// app/welcome/page.js
// Welcome page shown after successful login
// Shows welcome message and sign out button

'use client'

import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function WelcomePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
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
    <main className="h-screen w-screen bg-white flex items-center justify-center px-6">
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
    </main>
  )
}

