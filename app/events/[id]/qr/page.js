'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getEventAction } from '@/app/actions/events'
import { isUserCheckedInAction } from '@/app/actions/checkin'
import { geocodeAddressAction } from '@/app/actions/geocoding'
import QRCode from 'qrcode'
import GeolocationTracker from '@/components/GeolocationTracker'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LayoutWrapper from '@/components/LayoutWrapper'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

// Parse event location to coordinates
async function parseEventLocation(location) {
  if (!location) return null
  
  // Check if it's a coordinate format (lat,lng)
  const latLngPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/
  if (latLngPattern.test(location.trim())) {
    const [lat, lng] = location.split(',').map(Number)
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }
  
  // Otherwise, geocode the address using server action
  const { data, error } = await geocodeAddressAction(location)
  if (error || !data) {
    return null
  }
  return data
}

export default function QRDisplayPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const eventId = params.id

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null)
  const [checkInStatus, setCheckInStatus] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [eventLocation, setEventLocation] = useState(null)

  const checkCheckInStatus = async () => {
    if (!eventId || !user?.id) return
    const { data, error } = await isUserCheckedInAction(eventId, user.id)
    if (!error && data) {
      setCheckInStatus(data)
    } else {
      setCheckInStatus(null)
    }
  }

  // Load event and generate QR code
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return

      if (!user?.id) {
        router.push('/')
        return
      }

      if (!eventId) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // Get event
        const { data: eventData, error: eventError } = await getEventAction(eventId)
        if (eventError || !eventData) {
          setLoading(false)
          return
        }

        setEvent(eventData)

        // Parse event location for geolocation tracking
        if (eventData.location) {
          const location = await parseEventLocation(eventData.location)
          setEventLocation(location)
        }

        // Generate QR code string
        const qrCodeString = `user-${user.id}-${eventId}`
        
        // Convert to QR code image
        QRCode.toDataURL(qrCodeString, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
          .then(url => setQrCodeDataUrl(url))
          .catch(err => console.error('Error generating QR code:', err))
        
        // Check if user is already checked in
        checkCheckInStatus()
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id, eventId, authLoading, router])

  // Poll for check-in status updates (in case user gets checked in from another device)
  useEffect(() => {
    if (!eventId || !user?.id) return

    const interval = setInterval(() => {
      checkCheckInStatus()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [eventId, user?.id])

  if (authLoading || loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gray-bg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto"></div>
            <p className="text-gray-medium mt-4">Loading...</p>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  if (!event) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gray-bg p-4">
          <Card className="p-8 text-center">
            <h1 className="text-xl font-bold mb-4">Event not found</h1>
            <p className="text-gray-medium">The event you're looking for doesn't exist.</p>
          </Card>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gray-bg p-4">
        {/* Event Info */}
        <Card className="mb-4">
          <h2 className="text-xl font-semibold text-neutral-black mb-2">{event.title}</h2>
          <p className="text-bodySmall text-gray-medium mb-1">
            {formatDate(event.date)} at {formatTime(event.date)}
          </p>
          {event.location && (
            <p className="text-bodySmall text-gray-medium">
              📍 {event.location}
            </p>
          )}
        </Card>

        {/* QR Code Display */}
        <Card className="p-8 text-center mb-4">
          {qrCodeDataUrl ? (
            <>
              <img
                src={qrCodeDataUrl}
                alt="Your QR Code"
                className="mx-auto mb-4"
                style={{ maxWidth: '300px', width: '100%' }}
              />
              <p className="text-bodySmall text-gray-medium mb-2">
                Show this QR code to the host
              </p>
              {checkInStatus && checkInStatus.is_checked_in ? (
                <Badge variant="status" status="active" className="mt-2">
                  ✓ Checked in at {formatTime(checkInStatus.checked_in_at)}
                </Badge>
              ) : (
                <p className="text-bodySmall text-gray-medium mt-2">
                  Waiting to be checked in...
                </p>
              )}
            </>
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto"></div>
          )}
        </Card>

        {/* Geolocation Tracker - Start tracking when checked in */}
        {checkInStatus && checkInStatus.is_checked_in && eventLocation && (
          <Card className="mb-4 p-4">
            <GeolocationTracker
              eventId={eventId}
              userId={user.id}
              eventLocation={eventLocation}
              radius={150}
              onCheckOut={() => {
                // Update check-in status
                checkCheckInStatus()
                // Show notification
                alert('You have been automatically checked out')
              }}
              onError={(error) => {
                console.error('Geolocation error:', error)
              }}
            />
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <h3 className="font-semibold mb-2 text-neutral-black">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-bodySmall text-gray-medium">
            <li>Show this QR code to the event host</li>
            <li>The host will scan it to check you in</li>
            <li>Keep this page open until you're checked in</li>
            {eventLocation && (
              <li>Location tracking will start automatically after check-in</li>
            )}
          </ol>
        </Card>
      </div>
    </LayoutWrapper>
  )
}

