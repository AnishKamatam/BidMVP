// AuthContext.js
// Provides authentication state and functions to the entire app
// This context wraps the app in layout.js so any component can access:
//   - user: current user object (null if not logged in)
//   - loading: boolean for initial auth state check
//   - signUp, signIn, signOut: authentication functions

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Create the context that will hold our auth state and functions
const AuthContext = createContext({})

// Custom hook to use auth context in any component
// Usage: const { user, signIn, signOut } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Throw error if hook is used outside of AuthProvider
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Provider component that wraps the app and manages auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // Stores current user object
  const [loading, setLoading] = useState(true) // True until initial session check completes
  const supabase = createClient() // Create Supabase client for browser

  useEffect(() => {
    let mounted = true
    let timeoutId = null
    let subscription = null
    let initialCheckComplete = false // Track if initial session check is done

    // Check for missing environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables. Please check your .env file.')
      setLoading(false)
      return
    }

    // Set up a timeout to prevent infinite loading (5 seconds max)
    timeoutId = setTimeout(() => {
      if (mounted && !initialCheckComplete) {
        console.warn('Auth session check timed out after 5 seconds, setting loading to false')
        initialCheckComplete = true
        setLoading(false)
      }
    }, 5000)

    // On mount: Check if user already has an active session
    // This happens when user refreshes page or returns to app
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted || initialCheckComplete) return
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (error) {
          console.error('Error getting session:', error)
        }
        
        initialCheckComplete = true
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((error) => {
        if (!mounted || initialCheckComplete) return
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        console.error('Failed to get session:', error)
        // Still set loading to false so app doesn't get stuck
        initialCheckComplete = true
        setUser(null)
        setLoading(false)
      })

    // Set up listener for FUTURE auth state changes (after initial check)
    // Fires when user logs in, logs out, token refreshes, etc.
    // IMPORTANT: This listener may fire immediately with current session,
    // but we ignore it until initial check is complete
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      // Only process auth state changes AFTER initial session check is complete
      // This prevents race conditions where the listener fires before getSession() completes
      if (!initialCheckComplete) {
        return // Ignore until initial check is done
      }
      
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      setUser(session?.user ?? null)
      // Don't set loading to false here - it's already false after initial check
      // Only update user state for future auth changes
    })
    
    subscription = authSubscription

    // Cleanup: unsubscribe from listener and clear timeout when component unmounts
    return () => {
      mounted = false
      initialCheckComplete = true // Prevent any pending callbacks from running
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, []) // Empty dependency array - only run once on mount

  // Create new user account
  // Supabase will send a confirmation email by default
  // The edufilter.sql trigger validates .edu emails at the database level
  const signUp = async (email, password, returnTo = null) => {
    
    // Capture the current page path to return user after email verification
    // If returnTo is not provided, use current pathname (or '/' as fallback)
    let redirectPath = returnTo
    if (typeof window !== 'undefined' && !redirectPath) {
      redirectPath = window.location.pathname || '/'
    }
    
    // Store returnTo in user metadata so it persists across devices/browsers
    // This works better than cookies since email links may be clicked from different contexts
    const userMetadata = redirectPath && redirectPath !== '/' 
      ? { returnTo: redirectPath }
      : {}
    
    // Also store in cookie as fallback for backward compatibility
    if (typeof document !== 'undefined' && redirectPath && redirectPath !== '/') {
      document.cookie = `auth_returnTo=${encodeURIComponent(redirectPath)}; path=/; max-age=3600; SameSite=Lax`
    }
    
    // Build callback URL - Supabase will add its own query params (code, type)
    const callbackUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined
    
    // Signup with email redirect URL pointing to our callback route
    // Store returnTo in user metadata so it's available after email verification
    // This ensures verification links from Supabase point to our callback handler
    // NOTE: Using only options.data to store metadata - no updateUser call after signup
    // to avoid interfering with email verification sending
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
        data: userMetadata, // Store returnTo in user_metadata - this persists through email verification
      }
    })
    
    
    return { data, error }
  }

  // Sign in existing user with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  // Sign out current user and clear session
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Resend confirmation email
  const resendConfirmationEmail = async (email, returnTo = null) => {
    
    // Capture the current page path to return user after email verification
    let redirectPath = returnTo
    if (typeof window !== 'undefined' && !redirectPath) {
      redirectPath = window.location.pathname || '/'
    }
    
    // Store returnTo in user metadata
    // Also store in cookie as fallback
    const userMetadata = redirectPath && redirectPath !== '/' 
      ? { returnTo: redirectPath }
      : {}
    
    if (typeof document !== 'undefined' && redirectPath && redirectPath !== '/') {
      document.cookie = `auth_returnTo=${encodeURIComponent(redirectPath)}; path=/; max-age=3600; SameSite=Lax`
    }
    
    // Build callback URL - Supabase will add its own query params
    const callbackUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined
    
    // Use resend confirmation email API - this doesn't require updateUser
    const resendOptions = {
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: callbackUrl,
        data: userMetadata, // Store returnTo in user_metadata
      }
    }
    
    
    const { data, error } = await supabase.auth.resend(resendOptions)
    
    
    return { data, error }
  }

  // Package everything we want to expose to consuming components
  const value = {
    user,        // Current user object or null
    loading,     // Loading state for initial check
    signUp,      // Function to create account
    signIn,      // Function to log in
    signOut,     // Function to log out
    resendConfirmationEmail, // Function to resend confirmation email
  }

  // Provide auth state and functions to all child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

