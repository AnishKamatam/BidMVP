// app/onboarding/page.js
// Onboarding page that checks profile completion and redirects or shows setup form
// If profile is incomplete, shows ProfileSetupForm
// If profile is complete, redirects to home page

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { mockCheckProfileComplete, mockCreateUserProfile } from '@/lib/mocks/userFunctions'
import ProfileSetupForm from '@/components/ProfileSetupForm'

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)
  const [error, setError] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Check profile completion on mount
  useEffect(() => {
    const checkProfile = async () => {
      if (authLoading) return // Wait for auth to load

      if (!user) {
        // Not logged in, redirect to home
        router.push('/')
        return
      }

      setChecking(true)
      setError(null)

      try {
        const isComplete = await mockCheckProfileComplete(user.id)
        setProfileComplete(isComplete)

        if (isComplete) {
          // Profile complete, redirect to home after brief delay
          setTimeout(() => {
            router.push('/')
          }, 1000)
        }
      } catch (err) {
        setError(err.message || 'Failed to check profile status')
      } finally {
        setChecking(false)
      }
    }

    checkProfile()
  }, [user, authLoading, router])

  // Handle profile submission
  const handleProfileSubmit = async (profileData) => {
    if (!user) return

    setProfileLoading(true)
    setError(null)

    try {
      // Create user profile
      await mockCreateUserProfile({
        ...profileData,
        // Add user ID from auth
        user_id: user.id,
      })

      // Profile created successfully
      setProfileComplete(true)
      
      // Redirect to home after brief delay
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to create profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Show loading state while checking auth or profile
  if (authLoading || checking) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </main>
    )
  }

  // If not logged in, this will redirect (handled in useEffect)
  if (!user) {
    return null
  }

  // If profile is complete, show success message (will redirect)
  if (profileComplete) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold">Profile complete!</p>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </main>
    )
  }

  // Show profile setup form
  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">
            Add your information to get started
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {/* Profile form */}
        <ProfileSetupForm
          onSubmit={handleProfileSubmit}
          loading={profileLoading}
        />
      </div>
    </main>
  )
}

