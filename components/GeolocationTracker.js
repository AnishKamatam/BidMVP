'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { trackUserLocationAction, checkUserInRadiusAction, autoCheckOutAction } from '@/app/actions/checkin'

export default function GeolocationTracker({ 
  eventId, 
  userId, 
  eventLocation, 
  radius = 150, // 150 meters default
  onCheckOut,
  onError 
}) {
  const [locationPermission, setLocationPermission] = useState(null) // 'granted', 'denied', 'prompt'
  const [isTracking, setIsTracking] = useState(false)
  const [outsideRadiusSince, setOutsideRadiusSince] = useState(null) // Timestamp when user left radius
  const trackingIntervalRef = useRef(null)
  const watchIdRef = useRef(null)

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }, [])

  const trackLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Store location
        await trackUserLocationAction(eventId, userId, latitude, longitude)

        // Check if in radius
        const { data: radiusCheck, error } = await checkUserInRadiusAction(
          eventId, 
          userId, 
          latitude, 
          longitude
        )

        if (error) {
          console.error('Error checking radius:', error)
          return
        }

        if (!radiusCheck?.inRadius) {
          // User is outside radius
          setOutsideRadiusSince(prev => {
            const now = Date.now()
            if (!prev) {
              // First time outside - record timestamp
              return now
            } else {
              // Check if outside for 5+ minutes
              const timeOutside = (now - prev) / 1000 / 60 // minutes
              if (timeOutside >= 5) {
                // Auto check-out (use setTimeout to avoid calling async in setState)
                setTimeout(() => {
                  autoCheckOutAction(eventId, userId).then(({ error: checkoutError }) => {
                    if (!checkoutError) {
                      onCheckOut?.()
                      stopTracking()
                    }
                  })
                }, 0)
              }
              return prev // Keep the original timestamp
            }
          })
        } else {
          // User is back in radius - reset timer
          setOutsideRadiusSince(null)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied')
          onError?.(new Error('Location access denied. Manual check-out will be required.'))
          stopTracking()
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }, [eventId, userId, onCheckOut, onError, stopTracking])

  const startTracking = useCallback(() => {
    if (isTracking) return

    setIsTracking(true)
    
    // Track location every 45 seconds
    trackingIntervalRef.current = setInterval(() => {
      trackLocation()
    }, 45000) // 45 seconds

    // Initial track
    trackLocation()
  }, [isTracking, trackLocation])

  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      onError?.(new Error('Geolocation is not supported by your browser'))
      setLocationPermission('denied')
      return
    }

    try {
      // Request permission
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      setLocationPermission(permission.state)

      if (permission.state === 'granted' || permission.state === 'prompt') {
        startTracking()
      } else {
        onError?.(new Error('Location permission denied. Manual check-out will be required.'))
      }

      // Listen for permission changes
      permission.onchange = () => {
        setLocationPermission(permission.state)
        if (permission.state === 'granted') {
          startTracking()
        } else {
          stopTracking()
        }
      }
    } catch (err) {
      // Fallback: try to get location directly (will prompt user)
      startTracking()
    }
  }, [startTracking, onError])

  // Request location permission and start tracking
  useEffect(() => {
    if (!eventId || !userId || !eventLocation) return

    requestLocationPermission()
    
    return () => {
      // Cleanup: stop tracking when component unmounts
      stopTracking()
    }
  }, [eventId, userId, eventLocation, requestLocationPermission, stopTracking])

  return (
    <div className="text-sm text-gray-medium">
      {locationPermission === 'granted' && isTracking && (
        <p className="text-success">📍 Location tracking active</p>
      )}
      {locationPermission === 'denied' && (
        <p className="text-yellow-600">⚠️ Location denied - manual check-out required</p>
      )}
    </div>
  )
}

