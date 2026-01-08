// components/BidPurchaseButton.js
// Reusable button/card component for purchasing bids with Stripe Checkout integration

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createStripeCheckoutSessionAction, checkUserBidPurchaseAction } from '@/app/actions/revenue'
// Note: getEventRevenueAction requires admin access, so we use checkUserBidPurchaseAction for regular users
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
  const [remainingBids, setRemainingBids] = useState(null)
  const [purchaseError, setPurchaseError] = useState(null)
  
  // Debug: Log when component mounts
  console.log('BidPurchaseButton: Component rendered', {
    eventId,
    event,
    bid_price: event?.bid_price,
    variant,
    hasEvent: !!event
  })

  // Check if user has already purchased a bid and get remaining bid count
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user?.id || !eventId) {
        console.debug('BidPurchaseButton: No user or eventId, skipping purchase check', { userId: user?.id, eventId })
        setCheckingPurchase(false)
        return
      }

      try {
        console.debug('BidPurchaseButton: Checking purchase status', { eventId, userId: user.id })
        // First, try to check if user has purchased (works for all users)
        const { data: purchaseData, error: purchaseError } = await checkUserBidPurchaseAction(eventId)
        
        console.debug('BidPurchaseButton: Purchase check result', { purchaseData, purchaseError })
        if (!purchaseError && purchaseData) {
          setAlreadyPurchased(purchaseData.hasPurchased || false)
          console.debug('BidPurchaseButton: Already purchased set to', purchaseData.hasPurchased)
        }

        // Try to get remaining bid count (requires admin access, so may fail for regular users)
        try {
          const { data: revenueData, error: revenueError } = await getEventRevenueAction(eventId)
          
          if (!revenueError && revenueData?.records && event?.max_bids && event.max_bids > 0) {
            const bidCount = revenueData.records.filter(r => r.type === 'bid').length
            const remaining = event.max_bids - bidCount
            setRemainingBids(remaining > 0 ? remaining : 0)
            console.debug('BidPurchaseButton: Remaining bids set to', remaining)
          }
        } catch (revenueError) {
          // Silently fail - user may not be admin, which is fine
          console.debug('Could not get remaining bid count (may require admin access):', revenueError)
        }
      } catch (error) {
        console.error('BidPurchaseButton: Error checking purchase status', error)
      } finally {
        console.debug('BidPurchaseButton: Finished checking purchase status, setting checkingPurchase to false')
        setCheckingPurchase(false)
      }
    }

    checkPurchaseStatus()
  }, [user?.id, eventId, event?.max_bids])

  const handlePurchase = async () => {
    const bidPrice = event?.bid_price ? parseFloat(event.bid_price) : 0
    if (disabled || loading || !eventId || !event || !bidPrice || bidPrice <= 0) {
      console.log('BidPurchaseButton: handlePurchase blocked', { disabled, loading, eventId, event, bidPrice })
      return
    }

    // Check if bids are sold out
    if (remainingBids !== null && remainingBids <= 0) {
      setPurchaseError('All bids have been sold. No more bids available.')
      return
    }

    setLoading(true)
    setPurchaseError(null)

    try {
      const bidPrice = parseFloat(event.bid_price)
      const { data, error } = await createStripeCheckoutSessionAction(
        eventId,
        bidPrice,
        `Bid for ${event.title || 'Event'}`,
        'bid'
      )

      if (error) {
        console.error('Error creating checkout session:', error)
        setPurchaseError(error.message || 'Failed to create checkout session')
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
      setPurchaseError(error.message || 'Failed to initiate payment')
      if (onError) {
        onError(error.message || 'Failed to initiate payment')
      }
      setLoading(false)
    }
  }

  // Don't show if event has no bid price
  // Convert bid_price to number if it's a string
  const bidPrice = event?.bid_price ? parseFloat(event.bid_price) : 0
  if (!event || !bidPrice || bidPrice <= 0) {
    console.log('BidPurchaseButton: No bid price, returning null', { 
      event, 
      bid_price: event?.bid_price,
      bid_price_parsed: bidPrice,
      bid_price_type: typeof event?.bid_price
    })
    return null
  }

  // Show purchased state (but only if we've finished checking)
  if (!checkingPurchase && alreadyPurchased) {
    return variant === 'card' ? (
      <Card variant="default" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-dark mb-1">{event.title}</h3>
            <p className="text-sm text-gray-medium">Bid Price: ${bidPrice.toFixed(2)}</p>
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
    const isSoldOut = remainingBids !== null && remainingBids <= 0
    const isLoadingPurchaseCheck = checkingPurchase
    
    return (
      <div className="w-full">
        {event.max_bids && remainingBids !== null && !checkingPurchase && (
          <p className="text-sm text-gray-medium mb-2 text-center">
            {remainingBids > 0 
              ? `${remainingBids} of ${event.max_bids} bids remaining`
              : 'All bids sold out'
            }
          </p>
        )}
        {purchaseError && (
          <p className="text-sm text-red-600 mb-2 text-center">{purchaseError}</p>
        )}
        {checkingPurchase && (
          <p className="text-sm text-gray-medium mb-2 text-center">Checking purchase status...</p>
        )}
      <Button
        variant={alreadyPurchased ? "secondary" : "primary"}
        size="medium"
        onClick={handlePurchase}
        disabled={disabled || loading || isSoldOut || alreadyPurchased || isLoadingPurchaseCheck}
        className="w-full"
      >
          {loading ? 'Processing...' : isLoadingPurchaseCheck ? 'Loading...' : alreadyPurchased ? 'Bid Purchased' : isSoldOut ? 'Sold Out' : `Buy Bid - $${bidPrice.toFixed(2)}`}
      </Button>
      </div>
    )
  }

  // Card variant
  const isSoldOut = remainingBids !== null && remainingBids <= 0
  return (
    <Card variant="default" className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-dark mb-1">{event.title}</h3>
          <p className="text-lg font-bold text-primary-ui">
            ${bidPrice.toFixed(2)}
          </p>
          {event.max_bids && remainingBids !== null && (
            <p className="text-sm text-gray-medium mt-1">
              {remainingBids > 0 
                ? `${remainingBids} of ${event.max_bids} bids remaining`
                : 'All bids sold out'
              }
            </p>
          )}
        </div>
        {purchaseError && (
          <p className="text-sm text-red-600">{purchaseError}</p>
        )}
        <Button
          variant="primary"
          size="medium"
          onClick={handlePurchase}
          disabled={disabled || loading || isSoldOut}
          className="w-full"
        >
          {loading ? 'Processing...' : isSoldOut ? 'Sold Out' : 'Purchase Bid'}
        </Button>
      </div>
    </Card>
  )
}

