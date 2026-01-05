// lib/supabase/revenue.js
// Revenue tracking and Stripe integration functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { checkIsAdmin } from './groupMembers'

// Helper function to serialize Supabase errors to plain objects
function serializeError(error, defaultMessage = 'An unexpected error occurred') {
  if (!error) return { message: defaultMessage }
  return {
    message: error.message || defaultMessage,
    code: error.code || null,
    statusCode: error.statusCode || null,
    details: error.details || null,
    hint: error.hint || null,
  }
}

/**
 * Record a line skip payment in event_revenue table
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID who paid
 * @param {number} amount - Payment amount in dollars
 * @param {string} stripeSessionId - Stripe checkout session ID
 * @param {string|null} adminUserId - Admin user ID (for manual recording, can be null for webhook)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function recordLineSkip(eventId, userId, amount, stripeSessionId, adminUserId = null) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userId || !amount || !stripeSessionId) {
      return { data: null, error: { message: 'Event ID, User ID, amount, and Stripe Session ID are required' } }
    }

    // Validate amount is positive
    if (amount <= 0) {
      return { data: null, error: { message: 'Amount must be greater than 0' } }
    }

    // Idempotency check: Check if stripe_session_id already exists
    const { data: existingRecord } = await supabase
      .from('event_revenue')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (existingRecord) {
      // Return existing record instead of creating duplicate
      return { data: existingRecord, error: null }
    }

    // If adminUserId is provided, validate admin permissions
    if (adminUserId) {
      // Get event to check fraternity
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('frat_id')
        .eq('id', eventId)
        .single()

      if (eventError || !event) {
        return { data: null, error: { message: 'Event not found' } }
      }

      // Validate admin is admin of event's fraternity
      const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
      if (adminError || !adminCheck?.isAdmin) {
        return { data: null, error: { message: 'Only admins can record line skip payments' } }
      }
    }

    // Create revenue record
    const { data: revenue, error: insertError } = await supabase
      .from('event_revenue')
      .insert({
        event_id: eventId,
        user_id: userId,
        type: 'line_skip',
        amount: amount,
        stripe_session_id: stripeSessionId,
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError) }
    }

    return { data: revenue, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to record line skip payment' } }
  }
}

/**
 * Record a bid purchase payment in event_revenue table
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID who paid
 * @param {number} amount - Payment amount in dollars
 * @param {string} stripeSessionId - Stripe checkout session ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function recordBidPurchase(eventId, userId, amount, stripeSessionId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userId || !amount || !stripeSessionId) {
      return { data: null, error: { message: 'Event ID, User ID, amount, and Stripe Session ID are required' } }
    }

    // Validate amount is positive
    if (amount <= 0) {
      return { data: null, error: { message: 'Amount must be greater than 0' } }
    }

    // Get event to validate bid_price
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, bid_price')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate event has bid_price > 0
    if (!event.bid_price || event.bid_price <= 0) {
      return { data: null, error: { message: 'Event does not have a bid price' } }
    }

    // Validate amount matches event's bid_price
    if (Math.abs(amount - parseFloat(event.bid_price)) > 0.01) {
      return { data: null, error: { message: 'Payment amount does not match event bid price' } }
    }

    // Idempotency check: Check if stripe_session_id already exists
    const { data: existingRecord } = await supabase
      .from('event_revenue')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (existingRecord) {
      // Return existing record instead of creating duplicate
      return { data: existingRecord, error: null }
    }

    // Create revenue record
    const { data: revenue, error: insertError } = await supabase
      .from('event_revenue')
      .insert({
        event_id: eventId,
        user_id: userId,
        type: 'bid',
        amount: amount,
        stripe_session_id: stripeSessionId,
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError) }
    }

    return { data: revenue, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to record bid purchase' } }
  }
}

/**
 * Get all revenue records for an event
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getEventRevenue(eventId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !adminUserId) {
      return { data: null, error: { message: 'Event ID and Admin User ID are required' } }
    }

    // Get event to check fraternity
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Validate admin is admin of event's fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can view event revenue' } }
    }

    // Get all revenue records for the event
    const { data: records, error: recordsError } = await supabase
      .from('event_revenue')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (recordsError) {
      return { data: null, error: serializeError(recordsError) }
    }

    // Calculate totals
    const total = records?.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0) || 0
    const byType = {
      line_skip: 0,
      bid: 0,
      priority_pass: 0,
    }

    records?.forEach((record) => {
      if (record.type && byType.hasOwnProperty(record.type)) {
        byType[record.type] += parseFloat(record.amount || 0)
      }
    })

    return {
      data: {
        total,
        byType,
        records: records || [],
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get event revenue' } }
  }
}

/**
 * Create Stripe Checkout session for payments (line skip or bid purchase)
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {number} amount - Payment amount in dollars
 * @param {string} lineItemDescription - Description for the line item
 * @param {string} paymentType - Payment type: 'line_skip' or 'bid' (default: 'line_skip')
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createStripeCheckoutSession(eventId, userId, amount, lineItemDescription, paymentType = 'line_skip') {
  try {
    // Dynamic import to avoid errors if Stripe is not installed
    let Stripe
    try {
      Stripe = (await import('stripe')).default
    } catch (importError) {
      return { data: null, error: { message: 'Stripe package not installed. Run: npm install stripe' } }
    }

    // Validate inputs
    if (!eventId || !userId || !amount || !lineItemDescription) {
      return { data: null, error: { message: 'Event ID, User ID, amount, and description are required' } }
    }

    // Validate payment type
    if (!['line_skip', 'bid'].includes(paymentType)) {
      return { data: null, error: { message: 'Payment type must be "line_skip" or "bid"' } }
    }

    // Validate amount is positive
    if (amount <= 0) {
      return { data: null, error: { message: 'Amount must be greater than 0' } }
    }

    // For bid purchases, validate event has bid_price
    if (paymentType === 'bid') {
      const supabase = await createClient()
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('id, bid_price, title')
        .eq('id', eventId)
        .single()

      if (eventError || !event) {
        return { data: null, error: { message: 'Event not found' } }
      }

      if (!event.bid_price || event.bid_price <= 0) {
        return { data: null, error: { message: 'Event does not have a bid price' } }
      }

      // Use event's bid_price as the amount
      amount = parseFloat(event.bid_price)
    }

    // Check for Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      return { data: null, error: { message: 'STRIPE_SECRET_KEY environment variable is not set' } }
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })

    // Get base URL for success/cancel redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/events/${eventId}/guests?payment=success`
    const cancelUrl = `${baseUrl}/events/${eventId}/guests?payment=cancelled`

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: lineItemDescription,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId,
        userId,
        type: paymentType,
      },
    })

    return {
      data: {
        sessionId: session.id,
        url: session.url,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create Stripe checkout session' } }
  }
}

