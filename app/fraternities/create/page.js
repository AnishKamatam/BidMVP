// app/fraternities/create/page.js
// Page for creating a new fraternity

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { createFraternityAction } from '@/app/actions/fraternity'
import { getProfile } from '@/app/actions/profile'
import FraternityForm from '@/components/FraternityForm'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function CreateFraternityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { refreshFraternities } = useFraternity()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Fetch user profile to get school_id
  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading || !user?.id) {
        return
      }

      setProfileLoading(true)
      try {
        const { data, error: profileError } = await getProfile(user.id)
        if (profileError) {
          setError('Failed to load your profile. Please complete your profile first.')
        } else {
          setUserProfile(data)
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id, authLoading])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (fraternityData) => {
    setError(null)
    setLoading(true)

    try {
      // Validate type is present and valid
      if (!fraternityData.type || typeof fraternityData.type !== 'string') {
        setError('Please select a type (Fraternity, Sorority, or Other)')
        setLoading(false)
        return
      }

      // Convert type from capitalized to lowercase for backend
      // Handle any case variations
      const typeLower = String(fraternityData.type).toLowerCase().trim()
      
      // Validate converted type matches expected values
      const validTypes = ['fraternity', 'sorority', 'other']
      if (!validTypes.includes(typeLower)) {
        setError(`Invalid type: "${fraternityData.type}". Please select Fraternity, Sorority, or Other.`)
        setLoading(false)
        return
      }

      const backendData = {
        name: fraternityData.name,
        type: typeLower, // 'Fraternity' -> 'fraternity'
        verification_email: fraternityData.verification_email || null,
        photo_url: fraternityData.photo_url || null,
        description: fraternityData.description || null,
      }

      // Debug logging (remove in production)
      console.log('Creating fraternity with data:', { 
        ...backendData, 
        photo_url: backendData.photo_url ? (backendData.photo_url.substring(0, 50) + '...') : null,
        photo_url_length: backendData.photo_url ? backendData.photo_url.length : 0
      })

      const { data, error: createError } = await createFraternityAction(backendData)

      if (createError) {
        // Log full error details for debugging
        try {
          console.error('Fraternity creation error:', {
            message: createError.message,
            details: createError.details,
            code: createError.code,
            errorString: String(createError),
            errorType: typeof createError,
            errorKeys: Object.keys(createError || {})
          })
        } catch (logError) {
          console.error('Failed to log error details:', logError)
          console.error('Raw createError:', createError)
        }

        // Debug logging for type errors
        if (createError.message?.includes('Type must be one of')) {
          console.error('Type validation error:', {
            originalType: fraternityData.type,
            convertedType: typeLower,
            backendData: backendData.type,
            fullBackendData: backendData
          })
        }

        // Show error message with details if available
        let errorMessage = createError.message || 'Failed to create fraternity'
        if (createError.details) {
          errorMessage += `: ${createError.details}`
        }
        if (createError.code) {
          console.error('Fraternity creation error code:', createError.code)
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (data) {
        // Refresh fraternity context to include new fraternity
        await refreshFraternities()
        // Use replace instead of push to avoid showing home page during transition
        // This prevents the brief flash of the welcome/signout screen
        router.replace(`/fraternities/${data.id}`)
      } else {
        setError('Failed to create fraternity')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to create fraternity')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Loading...</p>
        </Card>
      </main>
    )
  }

  // If not logged in, redirect (handled in useEffect)
  if (!user) {
    return null
  }

  // If no profile, show error
  if (!userProfile) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-bodySmall text-error mb-4">
            {error || 'Please complete your profile before creating a fraternity'}
          </p>
          <Button
            onClick={() => router.push('/onboarding')}
            variant="primary"
            size="large"
            className="w-full"
          >
            Complete Profile
          </Button>
        </Card>
      </main>
    )
  }

  // Check if user has verified email and completed profile (required for creating fraternity)
  if (!userProfile.email_verified || !userProfile.name || !userProfile.year || !userProfile.gender || !userProfile.school) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-bodySmall text-error mb-4">
            You must have a verified email and completed profile to create a fraternity
          </p>
          <Button
            onClick={() => router.push('/onboarding')}
            variant="primary"
            size="large"
            className="w-full"
          >
            Complete Profile
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="mb-6">
          <h1 className="text-heading1 text-neutral-black mb-2">
            Create Fraternity
          </h1>
          <p className="text-bodySmall text-gray-medium">
            Create a new fraternity or sorority group. You'll become an admin automatically.
          </p>
        </div>

        <Card>
          <FraternityForm
            schoolId={userProfile.school_id || null}
            userId={user.id}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        </Card>
      </div>
    </main>
  )
}
