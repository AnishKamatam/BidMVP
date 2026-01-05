// app/actions/revenue.js
// Server Actions for revenue tracking and Stripe integration
// These wrap the backend functions and can be called from client components

'use server'

import {
  recordLineSkip,
  recordBidPurchase,
  getEventRevenue,
  createStripeCheckoutSession,
} from '@/lib/supabase/revenue'
import { createClient } from '@/lib/supabase/server'

/**
 * Get current user ID from auth context
 */
async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

// ============================================
// Revenue Actions
// ============================================

/**
 * Record a line skip payment
 * Note: This is typically called from the webhook handler, not directly from client
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID who paid
 * @param {number} amount - Payment amount in dollars
 * @param {string} stripeSessionId - Stripe checkout session ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function recordLineSkipAction(eventId, userId, amount, stripeSessionId) {
  const adminUserId = await getCurrentUserId()
  if (!adminUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await recordLineSkip(eventId, userId, amount, stripeSessionId, adminUserId)
}

/**
 * Record a bid purchase payment
 * Note: This is typically called from the webhook handler, not directly from client
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID who paid
 * @param {number} amount - Payment amount in dollars
 * @param {string} stripeSessionId - Stripe checkout session ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function recordBidPurchaseAction(eventId, userId, amount, stripeSessionId) {
  // Note: This is typically called from webhook, but if called from client, we validate user
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  // For bid purchases, the userId should match the current user (users buy bids for themselves)
  if (currentUserId !== userId) {
    return { data: null, error: { message: 'User ID mismatch' } }
  }
  return await recordBidPurchase(eventId, userId, amount, stripeSessionId)
}

/**
 * Get event revenue
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getEventRevenueAction(eventId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getEventRevenue(eventId, userId)
}

/**
 * Create Stripe checkout session for payment
 * @param {string} eventId - Event ID
 * @param {number} amount - Payment amount in dollars
 * @param {string} lineItemDescription - Description for the line item
 * @param {string} paymentType - Payment type: 'line_skip' or 'bid' (default: 'line_skip')
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createStripeCheckoutSessionAction(
  eventId,
  amount,
  lineItemDescription,
  paymentType = 'line_skip'
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await createStripeCheckoutSession(eventId, userId, amount, lineItemDescription, paymentType)
}

