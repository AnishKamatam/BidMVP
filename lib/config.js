// lib/config.js
// Configuration for switching between mock and real functions
// Set NEXT_PUBLIC_USE_MOCKS=true in .env.local during development
// Set to false when ready to integrate with real backend functions

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'

// Helper to conditionally import mocks or real functions
// Usage:
//   const { getUserProfile } = USE_MOCKS 
//     ? await import('@/lib/mocks/userFunctions')
//     : await import('@/lib/supabase/users')

