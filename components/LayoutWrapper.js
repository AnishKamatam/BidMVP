// components/LayoutWrapper.js
// Client component wrapper that conditionally shows bottom navigation
// Determines visibility based on auth state, admin status, and current route

'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { useChat } from '@/contexts/ChatContext'
import BottomNavigation from '@/components/ui/BottomNavigation'

// Navigation items configuration
// Note: This is a function that takes unreadCount to show badge
function getNavItems(unreadCount = 0) {
  return [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/messages',
      label: 'Messages',
      icon: (
        <div className="relative">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      ),
    },
    {
      path: '/friends',
      label: 'Friends',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]
}

export default function LayoutWrapper({ children }) {
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  
  // Get unread count from chat context
  // ChatContext is always available since ChatProvider wraps the app in layout.js
  const chatContext = useChat()
  const unreadCount = chatContext?.unreadCount || 0

  // Calculate admin status
  const isAdmin = !authLoading && !fraternityLoading && 
    (userFraternities || []).some(f => f && f.role === 'admin' && f.fraternity)

  // Determine if navigation should be visible
  // Show nav for authenticated users on main pages (home, events, friends, profile, messages)
  // Also show for non-admins on other pages (except excluded ones)
  const isMainPage = pathname === '/' || pathname === '/events' || pathname === '/friends' || pathname === '/profile' || pathname === '/messages' || pathname?.startsWith('/messages/')
  const shouldShowNav =
    !authLoading &&
    !fraternityLoading &&
    user && // User is authenticated
    (isMainPage || (!isAdmin)) && // Show nav on main pages or for non-admins on other pages
    !pathname?.startsWith('/onboarding') && // Not in onboarding flow
    pathname !== '/fraternities/create' &&
    pathname !== '/fraternities/join'

  return (
    <>
      {children}
      {shouldShowNav && (
        <BottomNavigation items={getNavItems(unreadCount)} activePath={pathname} />
      )}
    </>
  )
}

