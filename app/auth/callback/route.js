// app/auth/callback/route.js
// Handles email verification callbacks from Supabase
// When users click the verification link in their email, Supabase redirects here
// This route exchanges the verification token for a session

import { createClient } from '@/lib/supabase/server'
import { checkProfileComplete } from '@/lib/supabase/users'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Check for Supabase error parameters (they redirect here with error info)
    const errorParam = requestUrl.searchParams.get('error')
    const errorCode = requestUrl.searchParams.get('error_code')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    // #region agent log
    console.log('Callback route: Request received', {
      hasCode: !!code,
      hasError: !!errorParam,
      errorParam,
      errorCode,
      errorDescription
    })
    // #endregion
    
    // If Supabase redirected here with an error, handle it
    if (errorParam && errorCode) {
      console.error('Supabase auth error in callback:', {
        error: errorParam,
        code: errorCode,
        description: errorDescription
      })
      // Redirect to home with error
      const errorUrl = new URL('/', request.url)
      errorUrl.searchParams.set('error', 'verification_failed')
      errorUrl.searchParams.set('details', errorDescription || errorParam)
      return NextResponse.redirect(errorUrl)
    }
    
    // Get returnTo from user metadata (stored during signup), cookie (fallback), or URL parameter
    // User metadata is most reliable since it persists across devices/browsers
    // In route handlers, cookies are accessed via request.cookies
    let returnTo = '/'
    
    // First, try to get returnTo from user metadata (after session exchange)
    // We'll read it after exchanging the code for session

    // If there's a code, exchange it for a session
    if (code) {
      const supabase = await createClient()
      
      // #region agent log
      console.log('Callback route: Starting email verification', { hasCode: !!code, codeLength: code?.length })
      // #endregion
      
      // Exchange the code for a session
      // This verifies the email and creates an authenticated session
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      // #region agent log
      console.log('Callback route: After exchangeCodeForSession', {
        hasSession: !!sessionData?.session,
        hasError: !!exchangeError,
        errorMessage: exchangeError?.message,
        errorStatus: exchangeError?.status,
        errorCode: exchangeError?.code
      })
      // #endregion
      
      // Handle exchange errors
      if (exchangeError) {
        console.error('Error exchanging code for session:', {
          message: exchangeError.message,
          status: exchangeError.status,
          code: exchangeError.code,
          name: exchangeError.name
        })
        // Redirect to home with error details
        const errorUrl = new URL('/', request.url)
        errorUrl.searchParams.set('error', 'verification_failed')
        errorUrl.searchParams.set('details', exchangeError.message || 'Failed to verify email')
        return NextResponse.redirect(errorUrl)
      }
      
      // Success! User is now authenticated
      // Get the user from the session to check profile status and get returnTo from metadata
      const { data: { user }, error: getUserError } = await supabase.auth.getUser()
      
      // #region agent log
      console.log('Callback route: After getUser', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        emailConfirmed: !!user?.email_confirmed_at,
        hasError: !!getUserError,
        errorMessage: getUserError?.message
      })
      // #endregion
      
      if (getUserError || !user) {
        console.error('Error getting user after verification:', getUserError)
        // Redirect to onboarding as fallback
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      
      try {
        // Sync email_confirmed_at from auth.users to User table
        // This is a backup to the database trigger - handles cases where User record doesn't exist yet
        // The trigger will handle it when the User record is created during profile setup
        if (user.email_confirmed_at) {
          try {
            // Check if User record exists
            const { data: existingUser } = await supabase
              .from('User')
              .select('id, email_confirmed_at')
              .eq('id', user.id)
              .maybeSingle()
            
            // Only update if User record exists
            if (existingUser) {
              // Update email_confirmed_at if it's different
              if (existingUser.email_confirmed_at !== user.email_confirmed_at) {
                const { error: updateError } = await supabase
                  .from('User')
                  .update({ 
                    email_confirmed_at: user.email_confirmed_at,
                    email_verified: user.email_confirmed_at !== null
                  })
                  .eq('id', user.id)
                
                if (updateError) {
                  console.warn('Failed to sync email_confirmed_at in callback (non-critical):', updateError.message)
                } else {
                  console.log('Successfully synced email_confirmed_at in callback')
                }
              }
            } else {
              // User record doesn't exist yet - that's OK, it will be created during profile setup
              // The email_confirmed_at will be synced when the User record is created
              console.log('User record does not exist yet - email_confirmed_at will be synced during profile creation')
            }
          } catch (syncError) {
            // Non-critical error - log but don't fail
            console.warn('Error syncing email_confirmed_at in callback (non-critical):', syncError.message)
          }
        }
            
            // Get returnTo from user metadata (stored during signup)
            // This is the most reliable method as it works across devices/browsers
            // Note: user_metadata might be in raw_user_meta_data for newly verified users
            const returnToFromMetadata = user.user_metadata?.returnTo || user.raw_user_meta_data?.returnTo
            
            // Fallback to cookie if metadata not found
            const returnToCookie = request.cookies.get('auth_returnTo')?.value
            const returnToParam = requestUrl.searchParams.get('returnTo')
            
            // Priority: metadata > cookie > URL param > home
            returnTo = returnToFromMetadata 
              ? returnToFromMetadata
              : (returnToCookie 
                ? decodeURIComponent(returnToCookie)
                : (returnToParam || '/'))
            
            // Debug logging (remove in production)
            console.log('ReturnTo resolution:', {
              fromMetadata: returnToFromMetadata,
              fromCookie: returnToCookie,
              fromParam: returnToParam,
              final: returnTo
            })
            
            // Check if user profile is complete
            const { data: profileStatus, error: profileError } = await checkProfileComplete(user.id)
            
            // If profile check fails or profile is incomplete, redirect to onboarding
            // Pass returnTo parameter so user can return to original page after setup
            if (profileError || !profileStatus?.complete) {
              const onboardingUrl = new URL('/onboarding', request.url)
              if (returnTo && returnTo !== '/') {
                onboardingUrl.searchParams.set('returnTo', returnTo)
              }
              // Clear the returnTo cookie since we're passing it via URL now
              const response = NextResponse.redirect(onboardingUrl)
              response.cookies.delete('auth_returnTo')
              return response
            }
            
            // Profile is complete, redirect to the original page user was on
            // Clear the returnTo cookie and metadata
            const redirectResponse = NextResponse.redirect(new URL(returnTo, request.url))
            redirectResponse.cookies.delete('auth_returnTo')
            
            // Clear returnTo from user metadata after successful redirect
            // This prevents it from being used again if user verifies email multiple times
            try {
              await supabase.auth.updateUser({
                data: { returnTo: null }
              })
            } catch (metadataError) {
              // Non-critical error, log but don't fail
              console.error('Failed to clear returnTo metadata:', metadataError)
            }
            
            return redirectResponse
          } catch (profileCheckError) {
            // If profile check fails, redirect to onboarding as fallback
            console.error('Profile check error:', profileCheckError)
            return NextResponse.redirect(new URL('/onboarding', request.url))
          }
        }

    // If there's an error or no code, redirect to home with error
    // The error will be visible in the URL as a search param
    const errorUrl = new URL('/', request.url)
    errorUrl.searchParams.set('error', 'verification_failed')
    return NextResponse.redirect(errorUrl)
  } catch (error) {
    // Catch any unexpected errors and redirect to home
    console.error('Callback route error:', error)
    const errorUrl = new URL('/', request.url)
    errorUrl.searchParams.set('error', 'verification_failed')
    return NextResponse.redirect(errorUrl)
  }
}

