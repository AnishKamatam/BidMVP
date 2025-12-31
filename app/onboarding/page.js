// app/onboarding/page.js
// Onboarding page that checks profile completion and redirects or shows setup form
// If profile is incomplete, shows ProfileSetupForm
// If profile is complete, redirects to home page

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkProfile, createProfile } from '@/app/actions/profile'
import ProfileSetupForm from '@/components/ProfileSetupForm'
import Card from '@/components/ui/Card'

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)
  const [error, setError] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Check profile completion on mount
  useEffect(() => {
    let mounted = true
    let timeoutId = null

    const verifyProfileStatus = async () => {
      if (authLoading) return // Wait for auth to load

      if (!user) {
        // Not logged in, redirect to home
        router.push('/')
        return
      }

      setChecking(true)
      setError(null)

      // Set timeout to prevent infinite loading (5 seconds max)
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('Profile check timed out, setting checking to false')
          setChecking(false)
        }
      }, 5000)

      try {
        const { data, error: checkError } = await checkProfile(user.id)
        
        if (!mounted) return
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (checkError) {
          setError(checkError.message || 'Failed to check profile status')
          return
        }

        const isComplete = data?.complete || false
        setProfileComplete(isComplete)

        if (isComplete) {
          // Profile complete, get returnTo parameter to redirect back to original page
          const searchParams = new URLSearchParams(window.location.search)
          const returnTo = searchParams.get('returnTo') || '/'
          
          // Redirect to original page (or home) after brief delay
          setTimeout(() => {
            if (mounted) {
              router.push(returnTo)
            }
          }, 1000)
        }
      } catch (err) {
        if (!mounted) return
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        setError(err.message || 'Failed to check profile status')
      } finally {
        if (mounted && timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        if (mounted) {
          setChecking(false)
        }
      }
    }

    verifyProfileStatus()

    // Cleanup
    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [user, authLoading, router])

  // Handle profile submission
  const handleProfileSubmit = async (profileData) => {
    
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    if (!user?.email) {
      setError('User email not available')
      return
    }

    setProfileLoading(true)
    setError(null)

    try {
      // Create user profile using Server Action
      // Pass email from user object (available from AuthContext)
      const { data, error: createError } = await createProfile(user.id, profileData, user.email)
      
      if (createError) {
        setError(createError.message || 'Failed to create profile')
        return
      }

      // Profile created successfully
      setProfileComplete(true)
      
      // Get returnTo parameter from URL to pass to campus selection
      const searchParams = new URLSearchParams(window.location.search)
      const returnTo = searchParams.get('returnTo') || '/welcome'
      
      // Clear returnTo from user metadata after successful profile creation
      // This prevents it from being used again if user verifies email multiple times
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.updateUser({
          data: { returnTo: null }
        })
      } catch (metadataError) {
        // Non-critical error, log but don't fail
        console.error('Failed to clear returnTo metadata:', metadataError)
      }
      
      // Redirect to campus selection page after profile creation
      // Pass returnTo as URL parameter so campus page can redirect after linking
      setTimeout(() => {
        router.push(`/onboarding/campus?returnTo=${encodeURIComponent(returnTo)}`)
      }, 500)
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
        <Card className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Checking your profile...</p>
        </Card>
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
        <Card className="text-center">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
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
          <p className="text-heading1 text-neutral-black mb-2">Profile complete!</p>
          <p className="text-bodySmall text-gray-medium">Redirecting...</p>
        </Card>
      </main>
    )
  }

  // Show profile setup form
  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <Card>
          <div className="mb-8">
            <h1 className="text-heading1 text-neutral-black mb-2">Complete Your Profile</h1>
            <p className="text-bodySmall text-gray-medium">
              Add your information to get started
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-error text-error rounded-md">
              {error}
            </div>
          )}

          {/* Profile form */}
          <ProfileSetupForm
            onSubmit={handleProfileSubmit}
            loading={profileLoading}
            userId={user?.id}
          />
        </Card>
      </div>
    </main>
  )
}

