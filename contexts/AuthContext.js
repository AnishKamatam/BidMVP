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
    // On mount: Check if user already has an active session
    // This happens when user refreshes page or returns to app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Set up listener for auth state changes
    // Fires when user logs in, logs out, token refreshes, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup: unsubscribe from listener when component unmounts
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Create new user account
  // Supabase will send a confirmation email by default
  // The edufilter.sql trigger validates .edu emails at the database level
  const signUp = async (email, password, returnTo = null) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.js:56',message:'signUp called',data:{email,hasPassword:!!password,returnTo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
    
    // #region agent log
    const userData = data?.user || {}
    const confirmationSentAt = userData.confirmation_sent_at
    const emailConfirmed = userData.email_confirmed_at
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.js:66',message:'After supabase.auth.signUp',data:{hasData:!!data,hasError:!!error,errorMessage:error?.message,userEmail:userData.email,userID:userData.id,confirmationSentAt:confirmationSentAt,emailConfirmed:emailConfirmed,hasSession:!!data?.session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.js:105',message:'resendConfirmationEmail called',data:{email,returnTo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.js:117',message:'Before resend - options',data:{email,hasRedirectTo:!!resendOptions.options.emailRedirectTo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    const { data, error } = await supabase.auth.resend(resendOptions)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.js:123',message:'After resend confirmation',data:{hasData:!!data,hasError:!!error,errorMessage:error?.message,errorCode:error?.status,errorName:error?.name,fullError:error?JSON.stringify(error):null,fullData:data?JSON.stringify(data):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
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

