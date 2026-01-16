// components/LayoutWrapper.js
// Client component wrapper that conditionally shows bottom navigation
// Determines visibility based on auth state, admin status, and current route

'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { useChat } from '@/contexts/ChatContext'
import BottomNavigation from '@/components/ui/BottomNavigation'

// Static icons - defined outside component to avoid recreation
const HomeIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const FriendsIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const ProfileIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export default function LayoutWrapper({ children }) {
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  
  // Get unread count from chat context - only get the value, don't subscribe to all changes
  const chatContext = useChat()
  const unreadCount = chatContext?.unreadCount || 0

  // Memoize admin status calculation
  const isAdmin = useMemo(() => {
    if (authLoading || fraternityLoading) return false
    return (userFraternities || []).some(f => f && f.role === 'admin' && f.fraternity)
  }, [authLoading, fraternityLoading, userFraternities])

  // Memoize navigation items to prevent recreation on every render
  const navItems = useMemo(() => {
    const MessagesIcon = (
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
    )

    return [
      {
        path: '/',
        label: 'Home',
        icon: HomeIcon,
      },
      {
        path: '/messages',
        label: 'Messages',
        icon: MessagesIcon,
      },
      {
        path: '/friends',
        label: 'Friends',
        icon: FriendsIcon,
      },
      {
        path: '/profile',
        label: 'Profile',
        icon: ProfileIcon,
      },
    ]
  }, [unreadCount])

  // Memoize main page check
  const isMainPage = useMemo(() => {
    return pathname === '/' || pathname === '/events' || pathname === '/friends' || pathname === '/profile' || pathname === '/messages' || pathname?.startsWith('/messages/')
  }, [pathname])

  // Memoize navigation visibility logic
  const shouldShowNav = useMemo(() => {
    return (
      !authLoading &&
      !fraternityLoading &&
      user && // User is authenticated
      (isMainPage || (!isAdmin)) && // Show nav on main pages or for non-admins on other pages
      !pathname?.startsWith('/onboarding') && // Not in onboarding flow
      pathname !== '/fraternities/create' &&
      pathname !== '/fraternities/join'
    )
  }, [authLoading, fraternityLoading, user, isMainPage, isAdmin, pathname])

  return (
    <>
      {children}
      {shouldShowNav && (
        <BottomNavigation items={navItems} activePath={pathname} />
      )}
    </>
  )
}

