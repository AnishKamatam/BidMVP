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
  const { user } = useAuth()
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
      const { data, error: fetchError } = await getUserFraternitiesAction(user.id)
      
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

  // Fetch fraternities when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUserFraternities()
    } else {
      setUserFraternities([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

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

