// app/onboarding/fraternity/page.js
// Fraternity selection page - appears after campus selection
// Optional step in onboarding flow

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getCampus } from '@/app/actions/profile'
import { 
  getUserFraternitiesAction, 
  searchFraternitiesAction, 
  createFraternityAction, 
  addMemberAction 
} from '@/app/actions/fraternity'
import FraternitySelector from '@/components/FraternitySelector'
import FraternityForm from '@/components/FraternityForm'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function FraternitySelectionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState('select') // 'select' | 'search' | 'create' | 'loading'
  const [userFraternities, setUserFraternities] = useState([])
  const [schoolId, setSchoolId] = useState(null)
  const [schoolName, setSchoolName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Check if user already has fraternities and get school
  useEffect(() => {
    const initialize = async () => {
      if (authLoading) return

      if (!user?.id) {
        router.push('/')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Get user's school
        const { data: school, error: schoolError } = await getCampus(user.id)
        if (schoolError || !school) {
          setError('Please select a campus first')
          setLoading(false)
          return
        }

        setSchoolId(school.id)
        setSchoolName(school.name)

        // Check if user already has fraternities
        const { data: fraternities, error: fraternitiesError } = await getUserFraternitiesAction(user.id)
        if (fraternitiesError) {
          console.error('Error fetching fraternities:', fraternitiesError)
        } else {
          setUserFraternities(fraternities || [])
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [user?.id, authLoading, router])

  // Handle search mode
  const handleSearch = async (query, schoolId, limit) => {
    return await searchFraternitiesAction(query, schoolId, limit)
  }

  // Handle fraternity selection
  const handleSelectFraternity = async (fraternityId) => {
    if (!user?.id || !fraternityId) {
      setError('Invalid selection')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { data, error: addError } = await addMemberAction(fraternityId, user.id, 'member')
      
      if (addError) {
        setError(addError.message || 'Failed to join fraternity')
        setSubmitting(false)
        return
      }

      if (data?.success) {
        // Successfully joined
        const returnTo = searchParams.get('returnTo') || '/welcome'
        router.push(returnTo)
      } else {
        setError('Failed to join fraternity')
        setSubmitting(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to join fraternity')
      setSubmitting(false)
    }
  }

  // Handle fraternity creation
  const handleCreateFraternity = async (fraternityData) => {
    if (!user?.id || !schoolId) {
      setError('User or school information missing')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { data, error: createError } = await createFraternityAction(fraternityData)
      
      if (createError) {
        // Check if it's a duplicate error
        if (createError.message?.toLowerCase().includes('duplicate')) {
          throw new Error('DUPLICATE')
        }
        setError(createError.message || 'Failed to create fraternity')
        setSubmitting(false)
        return
      }

      if (data?.id) {
        // Successfully created - add user as admin
        const { error: addError } = await addMemberAction(data.id, user.id, 'admin')
        
        if (addError) {
          console.error('Failed to add creator as admin:', addError)
          // Still continue - fraternity was created
        }

        // Success message would be shown by parent or redirect
        const returnTo = searchParams.get('returnTo') || '/welcome'
        router.push(returnTo)
      } else {
        setError('Failed to create fraternity')
        setSubmitting(false)
      }
    } catch (err) {
      if (err.message === 'DUPLICATE') {
        throw err // Let form handle duplicate warning
      }
      setError(err.message || 'Failed to create fraternity')
      setSubmitting(false)
    }
  }

  // Handle skip
  const handleSkip = () => {
    const returnTo = searchParams.get('returnTo') || '/welcome'
    router.push(returnTo)
  }

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

  // If no school, show error
  if (!schoolId) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-bodySmall text-error mb-4">{error || 'Please select a campus first'}</p>
          <Button
            onClick={() => router.push('/onboarding/campus')}
            variant="primary"
            size="large"
            className="w-full"
          >
            Go to Campus Selection
          </Button>
        </Card>
      </main>
    )
  }

  // Show different UI if user already has fraternities
  if (userFraternities.length > 0 && mode === 'select') {
    return (
      <main className="min-h-screen w-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-12">
          <Card>
            <div className="mb-8">
              <h1 className="text-heading1 text-neutral-black mb-2">
                You're Already Part of a Fraternity
              </h1>
              <p className="text-bodySmall text-gray-medium">
                You're already a member of {userFraternities.length} fraternity{userFraternities.length !== 1 ? 'ies' : ''}.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setMode('search')}
                variant="secondary"
                size="large"
                className="w-full"
              >
                Join Another Fraternity
              </Button>
              <Button
                onClick={handleSkip}
                variant="text"
                size="medium"
                className="w-full"
              >
                Continue to Welcome
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  // Initial selection screen
  if (mode === 'select') {
    return (
      <main className="min-h-screen w-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-12">
          <Card>
            <div className="mb-8">
              <h1 className="text-heading1 text-neutral-black mb-2">
                Great! You're connected to {schoolName || 'your school'}
              </h1>
              <p className="text-bodySmall text-gray-medium">
                Join or create a fraternity to start hosting events
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setMode('search')}
                variant="primary"
                size="large"
                className="w-full"
              >
                I'm part of a fraternity
              </Button>
              <Button
                onClick={() => setMode('create')}
                variant="secondary"
                size="large"
                className="w-full"
              >
                I want to create a fraternity
              </Button>
              <Button
                onClick={handleSkip}
                variant="text"
                size="medium"
                className="w-full"
              >
                Skip for now
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  // Search mode
  if (mode === 'search') {
    return (
      <main className="min-h-screen w-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-12">
          <button
            onClick={() => setMode('select')}
            className="mb-4 flex items-center gap-2 text-bodySmall text-gray-dark hover:text-neutral-black transition-colors"
            disabled={submitting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </button>

          <Card>
            <div className="mb-6">
              <h1 className="text-heading1 text-neutral-black mb-2">
                Find Your Fraternity
              </h1>
              <p className="text-bodySmall text-gray-medium">
                Search for your fraternity at {schoolName || 'your school'}
              </p>
            </div>

            <FraternitySelector
              schoolId={schoolId}
              onSelect={handleSelectFraternity}
              onCreate={() => setMode('create')}
              loading={submitting}
              error={error}
              onSearch={handleSearch}
            />
          </Card>
        </div>
      </main>
    )
  }

  // Create mode
  if (mode === 'create') {
    return (
      <main className="min-h-screen w-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-12">
          <button
            onClick={() => setMode('select')}
            className="mb-4 flex items-center gap-2 text-bodySmall text-gray-dark hover:text-neutral-black transition-colors"
            disabled={submitting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </button>

          <Card>
            <div className="mb-6">
              <h1 className="text-heading1 text-neutral-black mb-2">
                Create a Fraternity
              </h1>
              <p className="text-bodySmall text-gray-medium">
                Create a new fraternity at {schoolName || 'your school'}
              </p>
            </div>

            <FraternityForm
              schoolId={schoolId}
              userId={user.id}
              onSubmit={handleCreateFraternity}
              onCancel={() => setMode('select')}
              loading={submitting}
              error={error}
            />
          </Card>
        </div>
      </main>
    )
  }

  return null
}

