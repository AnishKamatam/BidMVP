// app/actions/profile.js
// Server Actions for profile-related operations
// These can be called from Client Components

'use server'

import { uploadProfilePhoto as uploadPhoto } from '@/lib/storage/upload'
import { checkProfileComplete, createUserProfile, updateUserProfile, getUserProfile } from '@/lib/supabase/users'
import { createClient } from '@/lib/supabase/server'

/**
 * Upload profile photo (Server Action wrapper)
 * @param {string} userId - User ID
 * @param {FormData} formData - FormData containing the file
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadProfilePhoto(userId, formData) {
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return { data: null, error: { message: 'No file provided' } }
  }
  return await uploadPhoto(userId, file)
}

/**
 * Check if profile is complete (Server Action wrapper)
 * @param {string} userId - User ID
 * @returns {Promise<{data: {complete: boolean, missing: Array<string>}, error: object|null}>}
 */
export async function checkProfile(userId) {
  return await checkProfileComplete(userId)
}

/**
 * Create user profile (Server Action wrapper)
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data
 * @param {string} email - User's email address (required)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createProfile(userId, profileData, email) {
  return await createUserProfile(userId, profileData, email)
}

/**
 * Update user profile (Server Action wrapper)
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateProfile(userId, profileData) {
  return await updateUserProfile(userId, profileData)
}

/**
 * Get user profile (Server Action wrapper)
 * @param {string} userId - User ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getProfile(userId) {
  return await getUserProfile(userId)
}

/**
 * Update user's phone number in User table after verification
 * This should be called after verifyPhoneCode succeeds
 * @param {string} userId - User ID
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

