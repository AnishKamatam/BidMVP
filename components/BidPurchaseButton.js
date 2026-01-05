// components/BidPurchaseButton.js
// Reusable button/card component for purchasing bids with Stripe Checkout integration

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createStripeCheckoutSessionAction } from '@/app/actions/revenue'
// Note: getEventRevenueAction requires admin access, so purchase status check may not work for regular users
import { getEventRevenueAction } from '@/app/actions/revenue'

export default function BidPurchaseButton({
  eventId,
  event,
  onSuccess,
  onError,
  disabled = false,
  variant = 'button',
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingPurchase, setCheckingPurchase] = useState(true)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)

  // Check if user has already purchased a bid for this event
  // Note: getEventRevenueAction requires admin access, so this check may fail for regular users
  // In that case, we'll just not show the "already purchased" state, but the button will still work
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user?.id || !eventId) {
        setCheckingPurchase(false)
        return
      }

      try {
        // Get event revenue and check if user has a bid purchase
        // This requires admin access, so it may fail for regular users
        const { data, error } = await getEventRevenueAction(eventId)
        
        if (!error && data?.records) {
          const userBidPurchase = data.records.find(
            (record) => record.user_id === user.id && record.type === 'bid'
          )
          setAlreadyPurchased(!!userBidPurchase)
        }
        // If error is due to authorization (not admin), that's OK - we just won't show "already purchased"
      } catch (error) {
        // Silently fail - user may not be admin, which is fine
        console.debug('Could not check purchase status (may require admin access):', error)
      } finally {
        setCheckingPurchase(false)
      }
    }

    checkPurchaseStatus()
  }, [user?.id, eventId])

  const handlePurchase = async () => {
    if (disabled || loading || !eventId || !event || !event.bid_price || event.bid_price <= 0) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await createStripeCheckoutSessionAction(
        eventId,
        event.bid_price,
        `Bid for ${event.title || 'Event'}`,
        'bid'
      )

      if (error) {
        console.error('Error creating checkout session:', error)
        if (onError) {
          onError(error.message || 'Failed to create checkout session')
        }
        setLoading(false)
        return
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error initiating bid purchase:', error)
      if (onError) {
        onError(error.message || 'Failed to initiate payment')
      }
      setLoading(false)
    }
  }

  // Don't show if event has no bid price
  if (!event || !event.bid_price || event.bid_price <= 0) {
    return null
  }

  // Show loading state while checking purchase status
  if (checkingPurchase) {
    return variant === 'card' ? (
      <Card variant="default" className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-light rounded w-32 mb-2" />
          <div className="h-8 bg-gray-light rounded w-24" />
        </div>
      </Card>
    ) : (
      <Button variant="primary" size="medium" disabled className="w-full">
        Loading...
      </Button>
    )
  }

  // Show purchased state
  if (alreadyPurchased) {
    return variant === 'card' ? (
      <Card variant="default" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-dark mb-1">{event.title}</h3>
            <p className="text-sm text-gray-medium">Bid Price: ${event.bid_price.toFixed(2)}</p>
          </div>
          <Badge variant="status" status="active">
            Purchased
          </Badge>
        </div>
      </Card>
    ) : (
      <Button variant="secondary" size="medium" disabled className="w-full">
        Bid Purchased
      </Button>
    )
  }

  // Button variant
  if (variant === 'button') {
    return (
      <Button
        variant="primary"
        size="medium"
        onClick={handlePurchase}
        disabled={disabled || loading}
        className="w-full"
      >
        {loading ? 'Processing...' : `Buy Bid - $${event.bid_price.toFixed(2)}`}
      </Button>
    )
  }

  // Card variant
  return (
    <Card variant="default" className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-dark mb-1">{event.title}</h3>
          <p className="text-lg font-bold text-primary-ui">
            ${event.bid_price.toFixed(2)}
          </p>
        </div>
        <Button
          variant="primary"
          size="medium"
          onClick={handlePurchase}
          disabled={disabled || loading}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Purchase Bid'}
        </Button>
      </div>
    </Card>
  )
}

