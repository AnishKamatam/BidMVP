// components/LineSkipButton.js
// Button component for initiating line skip payment via Stripe Checkout

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { createStripeCheckoutSessionAction } from '@/app/actions/revenue'

export default function LineSkipButton({
  eventId,
  amount,
  onSuccess,
  onError,
  disabled = false,
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (disabled || loading || !eventId || !user?.id || !amount) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await createStripeCheckoutSessionAction(
        eventId,
        amount,
        'Line Skip Payment',
        'line_skip'
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
      console.error('Error initiating line skip payment:', error)
      if (onError) {
        onError(error.message || 'Failed to initiate payment')
      }
      setLoading(false)
    }
  }

  return (
    <Button
      variant="primary"
      size="medium"
      onClick={handleClick}
      disabled={disabled || loading || !amount || amount <= 0}
      className="w-full"
    >
      {loading ? 'Processing...' : `Skip the Line - $${amount.toFixed(2)}`}
    </Button>
  )
}

