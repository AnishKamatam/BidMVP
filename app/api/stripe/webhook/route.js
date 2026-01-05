// app/api/stripe/webhook/route.js
// Stripe webhook handler for payment confirmation
// Handles checkout.session.completed events for line skip and bid purchases

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { recordLineSkip, recordBidPurchase } from '@/lib/supabase/revenue'

export const runtime = 'nodejs'

// Initialize Stripe - will be created in POST handler to handle missing env var gracefully
let stripe = null

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  }
  return stripe
}

export async function POST(request) {
  try {
    const stripeInstance = getStripe()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable is not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event

    try {
      event = stripeInstance.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { eventId, userId, type } = session.metadata

      if (!eventId || !userId || !type) {
        console.error('Missing metadata in checkout session:', session.id)
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      const amount = session.amount_total / 100 // Convert cents to dollars

      try {
        if (type === 'line_skip') {
          // For line skip, adminUserId is not needed for webhook (pass null)
          // The recordLineSkip function will handle validation
          await recordLineSkip(eventId, userId, amount, session.id, null)
        } else if (type === 'bid') {
          await recordBidPurchase(eventId, userId, amount, session.id)
        } else {
          console.error('Unknown payment type:', type)
          return NextResponse.json({ error: 'Unknown payment type' }, { status: 400 })
        }
      } catch (error) {
        console.error('Error recording payment:', error)
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

