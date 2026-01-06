'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getEventAction } from '@/app/actions/events'
import { checkInUserAction } from '@/app/actions/checkin'
import { checkIsAdminAction } from '@/app/actions/fraternity'
import QRScanner from '@/components/QRScanner'
import CheckInList from '@/components/CheckInList'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LayoutWrapper from '@/components/LayoutWrapper'

export default function CheckInPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const eventId = params.id

  const [checkedInUsers, setCheckedInUsers] = useState([])
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState(null)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load event and check admin status
  useEffect(() => {
    const loadEvent = async () => {
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
      setScanError(null)

      try {
        // Get event
        const { data: eventData, error: eventError } = await getEventAction(eventId)
        if (eventError || !eventData) {
          setScanError('Event not found')
          setLoading(false)
          return
        }

        setEvent(eventData)

        // Check if user is admin of event's fraternity
        const { data: adminCheck, error: adminError } = await checkIsAdminAction(eventData.frat_id)
        if (adminError || !adminCheck?.isAdmin) {
          setScanError('Only admins can access check-in')
          setIsAdmin(false)
        } else {
          setIsAdmin(true)
        }
      } catch (err) {
        setScanError(err.message || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId, user?.id, authLoading, router])

  const handleQRScan = async (qrCode) => {
    setScanError(null)
    setScanSuccess(false)
    
    try {
      // Extract userId and eventId from QR code
      // Format: user-${userId}-${eventId}
      const match = qrCode.match(/^user-(.+?)-(.+)$/)
      if (!match) {
        setScanError('Invalid QR code format')
        return
      }
      
      const [, userId, eventIdFromQR] = match
      
      // Verify eventId matches current event
      if (eventIdFromQR !== eventId) {
        setScanError('QR code is for a different event')
        return
      }
      
      // Call check-in API
      const { data, error } = await checkInUserAction(
        eventId,
        userId,
        qrCode,
        user.id
      )
      
      if (error) {
        setScanError(error.message)
      } else {
        setScanSuccess(true)
        // Real-time subscription will update the list
        setTimeout(() => setScanSuccess(false), 2000)
        // Stop scanning after successful check-in
        setScanning(false)
      }
    } catch (err) {
      setScanError(err.message || 'Failed to check in user')
    }
  }

  const handleCheckOut = (userId) => {
    // User has been checked out - list will update via real-time subscription
    console.log('User checked out:', userId)
  }

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

  if (!isAdmin) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gray-bg p-4">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-medium mb-4">{scanError || 'Only admins can access check-in'}</p>
            <Button onClick={() => router.back()} variant="primary">
              Go Back
            </Button>
          </Card>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gray-bg">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-black">Check-In Scanner</h1>
              {event && (
                <p className="text-sm text-gray-medium mt-1">{event.title}</p>
              )}
            </div>
            <Button
              variant={scanning ? 'secondary' : 'primary'}
              onClick={() => setScanning(!scanning)}
            >
              {scanning ? 'Stop Scanning' : 'Start Scanning'}
            </Button>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="p-4">
          {scanning && (
            <QRScanner
              onScan={handleQRScan}
              onError={(err) => setScanError(err.message)}
              scanning={scanning}
            />
          )}
          
          {scanSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 font-medium">✓ User checked in successfully!</p>
            </div>
          )}
          
          {scanError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{scanError}</p>
            </div>
          )}

          {!scanning && (
            <Card className="p-8 text-center mt-4">
              <p className="text-gray-medium">Click "Start Scanning" to begin checking in attendees</p>
            </Card>
          )}
        </div>

        {/* Check-In List */}
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-neutral-black">
            Checked-In Attendees
          </h2>
          <CheckInList
            eventId={eventId}
            adminUserId={user.id}
            onCheckOut={handleCheckOut}
          />
        </div>
      </div>
    </LayoutWrapper>
  )
}

