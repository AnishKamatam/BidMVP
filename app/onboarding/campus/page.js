// app/onboarding/campus/page.js
// Campus selection page - appears after profile setup
// Auto-detects campus from email and allows manual selection if needed

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { detectCampus, linkCampus, getCampus, searchSchoolsAction, linkUserToSchoolAction, getSchoolByDomainAction } from '@/app/actions/profile'
import CampusSelector from '@/components/CampusSelector'
import Card from '@/components/ui/Card'

function CampusSelectionPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [detecting, setDetecting] = useState(true)
  const [detectedCampus, setDetectedCampus] = useState(null)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState(null)
  const [isManualSearch, setIsManualSearch] = useState(false) // Track if user is in manual search mode
  const [detectionComplete, setDetectionComplete] = useState(false) // Track when detection is done
  const initializedRef = useRef(false)

  // Check authentication and auto-detect campus on mount
  // Always show the campus selector - user must manually confirm even if detection is correct
  // Use ref to prevent multiple initializations
  useEffect(() => {
    let mounted = true
    let timeoutId = null

    // Wait for auth to load
    if (authLoading) return
    
    // Prevent multiple initializations - only run once when user is available
    // BUT: Reset the ref if user changes (e.g., on refresh)
    if (initializedRef.current && user?.id) {
      // Already initialized for this user - don't run again
      return
    }
    
    // Reset ref if user changed (shouldn't happen, but safety check)
    if (initializedRef.current && !user?.id) {
      initializedRef.current = false
    }
    
    const initialize = async () => {
      // Check if user is authenticated
      if (!user) {
        router.push('/')
        return
      }

      // Always auto-detect campus from email and show selector
      // User must manually confirm the detection (even if it's already linked)
      if (!user.email) {
        setError('Email not available')
        setDetecting(false)
        initializedRef.current = true // Mark as initialized after handling error case
        return
      }

      // Don't set initializedRef here - set it AFTER state updates complete
      // This ensures React can process the state changes
      setDetecting(true)
      setError(null)

      // Set a reasonable timeout as safety net (5 seconds) - only fires if something is truly stuck
      // This should rarely fire under normal conditions
      // Use a ref to track if detection completed to avoid stale state checks
      const detectionCompleteRef = { current: false }
      timeoutId = setTimeout(() => {
        if (mounted && !detectionCompleteRef.current) {
          console.warn('Campus detection timed out after 5 seconds - showing search UI as fallback')
          detectionCompleteRef.current = true // Prevent multiple timeout fires
          setDetectedCampus(null)
          setDetecting(false)
          setError(null)
        }
      }, 5000)

      try {
        console.log('Starting campus detection for user:', user.id, 'email:', user.email)
        
        // First, check if user already has a school linked
        // If they do, show that as the detected campus for confirmation
        console.log('Checking for existing campus...')
        const { data: existingCampus, error: campusError } = await getCampus(user.id)
        console.log('getCampus result:', { hasCampus: !!existingCampus, hasId: !!existingCampus?.id, id: existingCampus?.id, error: campusError?.message })
        
        if (!mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          return
        }
        
        if (!campusError && existingCampus && existingCampus.id) {
          // Mark detection as complete and clear timeout
          detectionCompleteRef.current = true
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          // User already has a school linked - show it for confirmation
          // Update states synchronously - React will batch these
          setDetectedCampus({
            id: existingCampus.id,
            name: existingCampus.name,
            domain: existingCampus.domain,
            abbreviation: existingCampus.abbreviation || null
          })
          // Mark detection as complete - this will trigger the useEffect below
          setDetectionComplete(true)
          initializedRef.current = true
          
          console.log('State updated: setDetecting(false) called, detectedCampus set')
          return
        }

        // No existing school linked - detect from email domain
        // Get domain from email
        console.log('Detecting campus from email...')
        const { domain, error: detectError } = await detectCampus(user.email)
        console.log('detectCampus result:', { domain, error: detectError?.message })

        if (detectError || !domain) {
          // Mark detection as complete
          detectionCompleteRef.current = true
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          // Don't show error - just show search UI
          setDetectedCampus(null)
          setDetectionComplete(true)
          initializedRef.current = true
          return
        }

        // Try to get school by domain
        console.log('Getting school by domain:', domain)
        const { data: existingSchool, error: schoolError } = await getSchoolByDomainAction(domain)
        console.log('getSchoolByDomain result:', { hasSchool: !!existingSchool, error: schoolError?.message })

        // Mark detection as complete
        detectionCompleteRef.current = true
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        if (existingSchool) {
          setDetectedCampus({
            id: existingSchool.id,
            name: existingSchool.name,
            domain: existingSchool.domain,
            abbreviation: existingSchool.abbreviation || null
          })
        } else {
          // School doesn't exist yet - show preview with domain
          // It will be created when user confirms
          setDetectedCampus({
            id: null, // Will be created when linking
            name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' University',
            domain: domain,
            abbreviation: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
          })
        }
        // Mark detection as complete
        setDetectionComplete(true)
        initializedRef.current = true
      } catch (err) {
        if (!mounted) return
        
        // Mark detection as complete (even if it errored)
        detectionCompleteRef.current = true
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        console.error('Unexpected error detecting campus:', err)
        // Don't show error - just show search UI
        setDetectedCampus(null)
        setDetectionComplete(true)
        initializedRef.current = true
      }
    }

    initialize()

    // Cleanup
    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
    // Use specific user properties to avoid re-runs when user object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, user?.email])
  
  // Separate effect to handle detection completion
  // This ensures React processes the state update even if the main effect doesn't re-run
  useEffect(() => {
    if (detectionComplete && detecting) {
      console.log('Detection complete, setting detecting to false')
      setDetecting(false)
    }
  }, [detectionComplete, detecting])
  

  // Handle confirming auto-detected campus
  const handleConfirmDetected = async () => {
    if (!user?.id || !user?.email) {
      setError('User information not available')
      return
    }

    setLinking(true)
    setError(null)

    try {
      const { data, error: linkError } = await linkCampus(user.id, user.email)

      if (linkError) {
        setError(linkError.message || 'Failed to link campus')
        setLinking(false)
        return
      }

      if (data?.school) {
        // Successfully linked
        const returnTo = searchParams.get('returnTo') || '/welcome'
        const finalReturnTo = returnTo === '/welcome' ? '/' : returnTo
        router.push(finalReturnTo)
      } else {
        setError('Failed to link campus')
        setLinking(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to link campus')
      setLinking(false)
    }
  }

  // Handle manual school selection
  const handleSelectSchool = async (schoolId) => {
    if (!user?.id || !schoolId) {
      setError('Invalid selection')
      return
    }

    setLinking(true)
    setError(null)

    try {
      const { data, error: linkError } = await linkUserToSchoolAction(user.id, schoolId)

      if (linkError) {
        setError(linkError.message || 'Failed to link campus')
        setLinking(false)
        return
      }

      if (data?.success) {
        // Successfully linked
        const returnTo = searchParams.get('returnTo') || '/welcome'
        const finalReturnTo = returnTo === '/welcome' ? '/' : returnTo
        router.push(finalReturnTo)
      } else {
        setError('Failed to link campus')
        setLinking(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to link campus')
      setLinking(false)
    }
  }

  // Handle search
  const handleSearch = async (query, limit = 15) => {
    return await searchSchoolsAction(query, limit)
  }

  // Handle skip detection - show search UI immediately
  const handleSkipDetection = () => {
    // Reset initialization ref so detection can run again if needed
    initializedRef.current = false
    setDetecting(false)
    setDetectedCampus(null)
    setError(null)
  }

  // Show loading state
  if (authLoading || detecting) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium mb-6">
            {detecting ? 'Detecting your campus...' : 'Loading...'}
          </p>
          {/* Skip button - allows users to bypass detection if it gets stuck */}
          {detecting && (
            <button
              onClick={handleSkipDetection}
              className="text-bodySmall text-gray-medium hover:text-neutral-black underline transition-colors"
            >
              Skip detection and search manually
            </button>
          )}
        </Card>
      </main>
    )
  }

  // If not logged in, this will redirect (handled in useEffect)
  if (!user) {
    return null
  }

  // Handle back button click - only shown in manual search mode
  // Goes back to the campus confirmation page (detected campus view)
  const handleBack = () => {
    setIsManualSearch(false)
  }

  // Handle when user clicks "Not correct?" - switch to manual search mode
  const handleNotCorrect = () => {
    setIsManualSearch(true)
  }

  // Show campus selector
  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Back button - only show when in manual search mode */}
        {isManualSearch && (
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 text-bodySmall text-gray-dark hover:text-neutral-black transition-colors"
            disabled={linking}
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
        )}

        <Card>
          <div className="mb-8">
            <h1 className="text-heading1 text-neutral-black mb-2">
              Select Your Campus
            </h1>
            <p className="text-bodySmall text-gray-medium">
              We'll use this to connect you with events at your school
            </p>
          </div>

          <CampusSelector
            detectedCampus={detectedCampus}
            onSelect={handleSelectSchool}
            onConfirm={handleConfirmDetected}
            onNotCorrect={handleNotCorrect}
            showSearch={isManualSearch}
            loading={linking}
            error={error}
            onSearch={handleSearch}
          />
        </Card>
      </div>
    </main>
  )
}

export default function CampusSelectionPage() {
  return (
    <Suspense
      fallback={
        <main className="h-screen w-screen bg-white flex items-center justify-center px-6">
          <Card className="text-center max-w-md w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
            <p className="text-bodySmall text-gray-medium">Loading...</p>
          </Card>
        </main>
      }
    >
      <CampusSelectionPageContent />
    </Suspense>
  )
}

