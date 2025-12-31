// lib/storage/upload.js
// Profile photo upload functions using Supabase Storage

'use server'

import { createClient } from '../supabase/server'

// Helper function to serialize Supabase errors to plain objects
// This ensures errors can be passed from Server Components to Client Components
function serializeError(error) {
  if (!error) return null
  return {
    message: error?.message || String(error) || 'An error occurred',
    code: error?.code || null,
    statusCode: error?.statusCode || null,
    details: error?.details || null,
    hint: error?.hint || null
  }
}

/**
 * Upload profile photo to Supabase Storage
 * @param {string} userId - User ID (from auth.uid())
 * @param {File} file - File object to upload
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadProfilePhoto(userId, file) {
  try {
    const supabase = await createClient()

    // Validate file
    if (!file) {
      return { data: null, error: { message: 'No file provided' } }
    }

    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return {
        data: null,
        error: { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }
      }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return {
        data: null,
        error: { message: 'File size too large. Maximum size is 5MB.' }
      }
    }

    // Generate unique filename: {userId}/{timestamp}-{originalFilename}
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}/${timestamp}-${file.name}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (uploadError) {
      return { data: null, error: serializeError(uploadError) }
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      return {
        data: null,
        error: { message: 'Failed to get public URL for uploaded file' }
      }
    }

    return {
      data: {
        url: urlData.publicUrl,
        path: fileName
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to upload profile photo' } }
  }
}

/**
 * Delete profile photo from Supabase Storage
 * @param {string} userId - User ID (from auth.uid())
 * @param {string} photoUrl - Full URL or path of the photo to delete
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function deleteProfilePhoto(userId, photoUrl) {
  try {
    const supabase = await createClient()

    if (!photoUrl) {
      return { data: null, error: { message: 'No photo URL provided' } }
    }

    // Extract path from URL if full URL is provided
    // URL format: https://{project}.supabase.co/storage/v1/object/public/profile-photos/{path}
    let filePath = photoUrl
    if (photoUrl.includes('/profile-photos/')) {
      filePath = photoUrl.split('/profile-photos/')[1]
    }

    // Verify the file belongs to the user (security check)
    if (!filePath.startsWith(`${userId}/`)) {
      return {
        data: null,
        error: { message: 'Unauthorized: Cannot delete photos that do not belong to you' }
      }
    }

    // Delete file from storage
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath])

    if (error) {
      return { data: null, error: serializeError(error) }
    }

    return {
      data: { success: true },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to delete profile photo' } }
  }
}

/**
 * Get current profile photo URL for a user
 * @param {string} userId - User ID (from auth.uid())
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function getProfilePhotoUrl(userId) {
  try {
    const supabase = await createClient()

    // Get user profile to find photo URL
    const { data: user, error } = await supabase
      .from('User')
      .select('profile_pic')
      .eq('id', userId)
      .single()

    if (error) {
      return { data: null, error: serializeError(error) }
    }

    if (!user || !user.profile_pic) {
      return {
        data: { url: null },
        error: null
      }
    }

    return {
      data: { url: user.profile_pic },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get profile photo URL' } }
  }
}

/**
 * Upload fraternity photo to Supabase Storage
 * Can be used during fraternity creation (with userId) or after (with fraternityId)
 * @param {string} fraternityId - Fraternity ID (optional, for existing fraternities)
 * @param {File} file - File object to upload
 * @param {string} userId - User ID (required for creation, optional for updates)
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadFraternityPhoto(fraternityId, file, userId = null) {
  try {
    const supabase = await createClient()

    // Validate file
    if (!file) {
      return { data: null, error: { message: 'No file provided' } }
    }

    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return {
        data: null,
        error: { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }
      }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return {
        data: null,
        error: { message: 'File size too large. Maximum size is 5MB.' }
      }
    }

    // Validate userId is provided when fraternityId is not (for creation)
    if (!fraternityId && !userId) {
      return {
        data: null,
        error: { message: 'User ID is required for fraternity photo upload during creation' }
      }
    }

    // For fraternity creation, use userId in temp path
    // For updates, use fraternityId
    const timestamp = Date.now()
    const fileName = fraternityId
      ? `${fraternityId}/${timestamp}-${file.name}`
      : `temp/${userId}/${timestamp}-${file.name}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fraternity-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (uploadError) {
      return { data: null, error: serializeError(uploadError) }
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('fraternity-photos')
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      return {
        data: null,
        error: { message: 'Failed to get public URL for uploaded file' }
      }
    }

    return {
      data: {
        url: urlData.publicUrl,
        path: fileName
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to upload fraternity photo' } }
  }
}

