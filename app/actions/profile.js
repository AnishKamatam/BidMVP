// app/actions/profile.js
// Server Actions for profile-related operations
// These can be called from Client Components

'use server'

import { uploadProfilePhoto as uploadPhoto } from '@/lib/storage/upload'
import { checkProfileComplete, createUserProfile, updateUserProfile, getUserProfile, searchUserByEmail } from '@/lib/supabase/users'
import { getSchoolByDomain, createSchool, linkUserToSchool, getUserSchool, searchSchools } from '@/lib/supabase/schools'
import { detectCampusFromEmail, autoLinkUser } from '@/lib/campus'
import { createClient } from '@/lib/supabase/server'

/**
 * Upload profile photo (Server Action wrapper)
 * @param {string} userId - User ID
 * @param {FormData} formData - FormData containing the file
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadProfilePhoto(userId, formData) {
  try {
    // Validate userId
    if (!userId) {
      return { data: null, error: { message: 'User ID is required for photo upload' } }
    }

    // Validate formData
    if (!formData) {
      return { data: null, error: { message: 'FormData is required' } }
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return { data: null, error: { message: 'No file provided' } }
    }

    return await uploadPhoto(userId, file)
  } catch (error) {
    console.error('uploadProfilePhoto server action error:', error)
    return {
      data: null,
      error: {
        message: error.message || 'Failed to upload profile photo. Please try again.'
      }
    }
  }
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

/**
 * Detect campus from email domain (Server Action wrapper)
 * @param {string} email - Email address
 * @returns {Promise<{domain: string|null, error: object|null}>}
 */
export async function detectCampus(email) {
  return await detectCampusFromEmail(email)
}

/**
 * Auto-link user to campus based on email (Server Action wrapper)
 * @param {string} userId - User ID
 * @param {string} email - User's email address
 * @returns {Promise<{data: {school: object, linked: boolean}|null, error: object|null}>}
 */
export async function linkCampus(userId, email) {
  return await autoLinkUser(userId, email)
}

/**
 * Get user's school (Server Action wrapper)
 * @param {string} userId - User ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getCampus(userId) {
  return await getUserSchool(userId)
}

/**
 * Search schools by name or domain (Server Action wrapper)
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 20)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function searchSchoolsAction(query, limit = 20) {
  return await searchSchools(query, limit)
}

/**
 * Link user to a specific school by ID (Server Action wrapper)
 * Used for manual school selection
 * @param {string} userId - User ID
 * @param {string} schoolId - School ID
 * @returns {Promise<{data: {success: boolean, user: object}|null, error: object|null}>}
 */
export async function linkUserToSchoolAction(userId, schoolId) {
  return await linkUserToSchool(userId, schoolId)
}

/**
 * Get school by domain (Server Action wrapper)
 * @param {string} domain - Email domain (e.g., "stanford.edu")
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getSchoolByDomainAction(domain) {
  return await getSchoolByDomain(domain)
}

/**
 * Search user by email (Server Action wrapper)
 * @param {string} email - Email address
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function searchUserByEmailAction(email) {
  return await searchUserByEmail(email)
}

/**
 * Upload fraternity photo (Server Action wrapper)
 * @param {string} fraternityId - Fraternity ID (optional, for existing fraternities)
 * @param {FormData} formData - FormData containing the file
 * @param {string} userId - User ID (required for creation, optional for updates)
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadFraternityPhotoAction(fraternityId, formData, userId = null) {
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return { data: null, error: { message: 'No file provided' } }
  }
  const { uploadFraternityPhoto } = await import('@/lib/storage/upload')
  return await uploadFraternityPhoto(fraternityId || null, file, userId)
}

