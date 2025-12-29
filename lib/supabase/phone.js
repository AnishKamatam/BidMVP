// lib/supabase/phone.js
// Phone verification functions using Supabase Auth
// NOTE: sendPhoneVerificationCode and verifyPhoneCode must be called from Client Components
// because they use browser-side Supabase client for auth operations

import { createClient } from './server'
import { createClient as createBrowserClient } from './client'

/**
 * Send phone verification code via SMS
 * Uses Supabase Auth's built-in OTP (One-Time Password) system
 * 
 * IMPORTANT: This function must be called from a Client Component ('use client')
 * because it uses browser-side Supabase client for authentication
 * 
 * @param {string} phone - Phone number in E.164 format (e.g., +1234567890)
 * @returns {Promise<{data: {message: string}|null, error: object|null}>}
 */
export async function sendPhoneVerificationCode(phone) {
  try {
    // Phone verification uses browser client for auth operations
    // This function should be called from client components
    const supabase = createBrowserClient()

    // Validate phone number format (basic check)
    if (!phone || !phone.startsWith('+')) {
      return {
        data: null,
        error: { message: 'Phone number must be in E.164 format (e.g., +1234567890)' }
      }
    }

    // Send OTP code via SMS
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        // Optional: customize SMS message
        // channel: 'sms'
      }
    })

    if (error) {
      return { data: null, error }
    }

    return {
      data: {
        message: 'Verification code sent successfully',
        // Note: Supabase doesn't return the code in production for security
        // The code is sent via SMS to the phone number
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || 'Failed to send verification code' }
    }
  }
}

/**
 * Verify phone verification code
 * 
 * IMPORTANT: This function must be called from a Client Component ('use client')
 * because it uses browser-side Supabase client for authentication
 * 
 * @param {string} phone - Phone number in E.164 format
 * @param {string} code - Verification code received via SMS
 * @returns {Promise<{data: {verified: boolean, user: object}|null, error: object|null}>}
 */
export async function verifyPhoneCode(phone, code) {
  try {
    // Phone verification uses browser client for auth operations
    const supabase = createBrowserClient()

    if (!phone || !code) {
      return {
        data: null,
        error: { message: 'Phone number and verification code are required' }
      }
    }

    // Verify the OTP code
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: 'sms'
    })

    if (error) {
      return { data: null, error }
    }

    // If verification successful, data.user contains the authenticated user
    return {
      data: {
        verified: true,
        user: data.user
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || 'Failed to verify code' }
    }
  }
}

/**
 * Update user's phone number in User table after verification
 * This should be called after verifyPhoneCode succeeds
 * @param {string} userId - User ID (from auth.uid())
 * @param {string} phone - Verified phone number
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function updateUserPhone(userId, phone) {
  try {
    const supabase = await createClient()

    if (!phone) {
      return {
        data: null,
        error: { message: 'Phone number is required' }
      }
    }

    // Update phone number in User table
    // Note: Assuming the User table has a 'phone' column
    // If the column name is different, update accordingly
    const { data, error } = await supabase
      .from('User')
      .update({ phone: phone })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return {
      data: { success: true, user: data },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || 'Failed to update phone number' }
    }
  }
}

/**
 * Resend phone verification code
 * Useful if user didn't receive the code or it expired
 * @param {string} phone - Phone number in E.164 format
 * @returns {Promise<{data: {message: string}|null, error: object|null}>}
 */
export async function resendPhoneVerificationCode(phone) {
  // Resending is the same as sending
  return await sendPhoneVerificationCode(phone)
}

