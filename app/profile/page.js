// app/profile/page.js
// Profile page accessible from bottom navigation
// Displays user profile information and allows joining/creating fraternities

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { getProfile } from '@/app/actions/profile'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { userFraternities, loading: fraternityLoading } = useFraternity()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: profileError } = await getProfile(user.id)
        if (profileError) {
          setError(profileError.message || 'Failed to load profile')
        } else {
          setProfile(data)
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, authLoading, router])

  if (authLoading || loading || fraternityLoading) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center">
        <Card className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Loading...</p>
        </Card>
      </main>
    )
  }

  // Filter to admin fraternities only
  // userFraternities structure: [{ fraternity: {...}, role: 'admin' }, ...]
  const adminFraternities = userFraternities?.filter(frat => frat.role === 'admin') || []

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12 pb-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-end">
          <Button
            onClick={async () => {
              await signOut()
              router.push('/')
            }}
            variant="text"
            size="medium"
            className="text-gray-medium hover:text-gray-dark"
          >
            Sign Out
          </Button>
        </div>

        <Card>
          <div className="text-center mb-8">
            {/* Profile Avatar */}
            <div className="flex justify-center mb-4">
              <Avatar
                src={profile?.profile_pic || user.user_metadata?.avatar_url || null}
                alt={profile?.name || user.email || 'Profile'}
                size="xl"
              />
            </div>
            
            {/* Name */}
            <h1 className="text-heading1 text-neutral-black mb-2">
              {profile?.name || user.email?.split('@')[0] || 'User'}
            </h1>
            
            {/* Email */}
            <p className="text-bodySmall text-gray-medium">
              {user.email}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-error text-error rounded-md">
              {error}
            </div>
          )}

          {/* Admin Fraternities Section */}
          {adminFraternities.length > 0 && (
            <div className="mb-6 pt-6 border-t border-gray-border">
              <h2 className="text-heading3 text-neutral-black mb-3">
                My Fraternities
              </h2>
              <div className="space-y-2">
                {adminFraternities.map((frat) => {
                  const fraternityId = frat.fraternity?.id || frat.id
                  const fraternityName = frat.fraternity?.name || frat.name
                  const fraternityPhoto = frat.fraternity?.photo_url || null
                  
                  return (
                    <button
                      key={fraternityId}
                      onClick={() => router.push(`/fraternities/${fraternityId}`)}
                      className="w-full p-3 border-2 border-gray-border rounded-lg hover:border-primary-ui hover:bg-gray-light transition-all text-left flex items-center gap-3"
                    >
                      {fraternityPhoto && (
                        <Avatar
                          src={fraternityPhoto}
                          alt={fraternityName}
                          size="medium"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-bodySmall font-semibold text-neutral-black truncate">
                          {fraternityName}
                        </p>
                        <p className="text-caption text-gray-medium">
                          Admin Dashboard
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-medium flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add Fraternity and Join Group Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/fraternities/create?returnTo=/profile')}
              variant="primary"
              size="large"
              className="w-full flex items-center justify-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Fraternity</span>
            </Button>
            <Button
              onClick={() => router.push('/fraternities/join?returnTo=/profile')}
              variant="secondary"
              size="large"
              className="w-full flex items-center justify-center gap-2"
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Join Group</span>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}

