// lib/supabase/client.js
// Creates a Supabase client for use in CLIENT COMPONENTS (browser)
// This is used in contexts and components that run on the client side
// The browser client handles cookies automatically for session management

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    })
    throw new Error('Supabase environment variables are not configured. Please check your .env file.')
  }

  // Create and return a browser-safe Supabase client
  // Reads credentials from environment variables (set in .env file)
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

