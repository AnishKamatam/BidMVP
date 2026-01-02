// contexts/FraternityContext.js
// Provides fraternity state and functions to the entire app
// This context wraps the app in layout.js so any component can access:
//   - userFraternities: Array of user's fraternities
//   - loading: boolean for initial state check
//   - error: error message string
//   - selectedFraternity: currently selected fraternity ID
//   - fetchUserFraternities, refreshFraternities, selectFraternity: functions

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { getUserFraternitiesAction } from '@/app/actions/fraternity'

// Create the context that will hold our fraternity state and functions
const FraternityContext = createContext({})

// Custom hook to use fraternity context in any component
// Usage: const { userFraternities, fetchUserFraternities } = useFraternity()
export const useFraternity = () => {
  const context = useContext(FraternityContext)
  if (!context) {
    // Throw error if hook is used outside of FraternityProvider
    throw new Error('useFraternity must be used within a FraternityProvider')
  }
  return context
}

// Provider component that wraps the app and manages fraternity state
export function FraternityProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [userFraternities, setUserFraternities] = useState([]) // Stores user's fraternities
  const [loading, setLoading] = useState(true) // True until initial check completes
  const [error, setError] = useState(null) // Error message
  const [selectedFraternity, setSelectedFraternity] = useState(null) // Currently selected fraternity ID

  // Fetch user's fraternities
  const fetchUserFraternities = async () => {
    if (!user?.id) {
      setUserFraternities([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getUserFraternitiesAction()
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to fetch fraternities')
        setUserFraternities([])
      } else {
        setUserFraternities(data || [])
        setError(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch fraternities')
      setUserFraternities([])
    } finally {
      setLoading(false)
    }
  }

  // Refresh fraternities (reload after changes)
  const refreshFraternities = async () => {
    await fetchUserFraternities()
  }

  // Select a fraternity (for event creation, etc.)
  const selectFraternity = (fraternityId) => {
    setSelectedFraternity(fraternityId)
  }

  // Fetch fraternities when user changes (but wait for auth to finish loading)
  useEffect(() => {
    let mounted = true
    let timeoutId = null
    let safetyTimeoutId = null

    // Safety timeout: Always resolve loading within 7 seconds total
    // This prevents infinite loading screens if auth or fetch gets stuck
    safetyTimeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Fraternity context safety timeout: forcing loading to false after 7 seconds')
        setLoading(false)
        setError(null)
        // If we still don't have fraternities after timeout, clear them
        if (!userFraternities || userFraternities.length === 0) {
          setUserFraternities([])
        }
      }
    }, 7000)

    // Wait for auth to finish loading before checking user
    // This prevents race conditions where we try to fetch before auth is ready
    if (authLoading) {
      // Auth is still loading - wait a bit, but the safety timeout will resolve loading if stuck
      // Don't return early - let the safety timeout handle it
      // But if authLoading takes too long (more than 5 seconds), we'll timeout anyway
      return () => {
        mounted = false
        if (safetyTimeoutId) {
          clearTimeout(safetyTimeoutId)
        }
      }
    }

    // Auth is done loading, clear safety timeout and proceed
    if (safetyTimeoutId) {
      clearTimeout(safetyTimeoutId)
      safetyTimeoutId = null
    }

    if (user?.id) {
      // Set timeout to prevent infinite loading (5 seconds max for fetch)
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('Fraternity fetch timed out after 5 seconds, setting loading to false')
          setLoading(false)
        }
      }, 5000)

      fetchUserFraternities().finally(() => {
        if (mounted) {
          if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
          }
        }
      })
    } else {
      // No user - clear fraternities and set loading to false immediately
      setUserFraternities([])
      setLoading(false)
      setError(null)
      if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId)
      }
    }

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])


  // Package everything we want to expose to consuming components
  const value = {
    userFraternities,        // Array of user's fraternities
    loading,                 // Loading state for initial check
    error,                   // Error message
    selectedFraternity,      // Currently selected fraternity ID
    fetchUserFraternities,   // Function to fetch fraternities
    refreshFraternities,     // Function to refresh fraternities
    selectFraternity,        // Function to select a fraternity
  }

  // Provide fraternity state and functions to all child components
  return <FraternityContext.Provider value={value}>{children}</FraternityContext.Provider>
}

