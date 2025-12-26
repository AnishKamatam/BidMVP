// lib/supabase/users.js
// User profile management functions
// All functions use server-side Supabase client for database operations

import { createClient } from './server'

/**
 * Get user profile with social links
 * @param {string} userId - User ID (from auth.uid())
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getUserProfile(userId) {
  try {
    const supabase = await createClient()

    // Fetch user profile from User table
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      return { data: null, error: userError }
    }

    if (!user) {
      return { data: null, error: { message: 'User not found' } }
    }

    // Fetch social links
    const { data: socialLinks, error: linksError } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', userId)

    // Social links error is not critical, just log it
    if (linksError) {
      console.warn('Error fetching social links:', linksError)
    }

    // Combine user data with social links
    return {
      data: {
        ...user,
        social_links: socialLinks || []
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get user profile' } }
  }
}

/**
 * Create user profile after signup
 * @param {string} userId - User ID (from auth.uid())
 * @param {object} profileData - Profile data
 * @param {string} profileData.name - User's name (required)
 * @param {number} profileData.year - College year 1-5 (required)
 * @param {string} profileData.gender - User's gender (required)
 * @param {string} profileData.profile_pic - Profile photo URL (required)
 * @param {Array} profileData.social_links - Array of social link objects (optional)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createUserProfile(userId, profileData) {
  try {
    const supabase = await createClient()

    // Validate required fields
    if (!profileData.name || !profileData.year || !profileData.gender || !profileData.profile_pic) {
      return {
        data: null,
        error: { message: 'Missing required fields: name, year, gender, and profile_pic are required' }
      }
    }

    // Validate year range
    if (profileData.year < 1 || profileData.year > 5) {
      return {
        data: null,
        error: { message: 'Year must be between 1 and 5' }
      }
    }

    // Create user profile in User table
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        id: userId,
        name: profileData.name,
        year: profileData.year,
        gender: profileData.gender,
        profile_pic: profileData.profile_pic
      })
      .select()
      .single()

    if (userError) {
      return { data: null, error: userError }
    }

    // Handle social links if provided
    if (profileData.social_links && profileData.social_links.length > 0) {
      const socialLinksData = profileData.social_links.map(link => ({
        user_id: userId,
        platform: link.platform,
        username: link.username
      }))

      const { error: linksError } = await supabase
        .from('social_links')
        .insert(socialLinksData)

      if (linksError) {
        // Log error but don't fail the whole operation
        console.warn('Error creating social links:', linksError)
      }
    }

    // Fetch complete profile with social links
    return await getUserProfile(userId)
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create user profile' } }
  }
}

/**
 * Update existing user profile
 * @param {string} userId - User ID (from auth.uid())
 * @param {object} profileData - Profile data to update (partial)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateUserProfile(userId, profileData) {
  try {
    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData = {}
    if (profileData.name !== undefined) updateData.name = profileData.name
    if (profileData.year !== undefined) {
      if (profileData.year < 1 || profileData.year > 5) {
        return { data: null, error: { message: 'Year must be between 1 and 5' } }
      }
      updateData.year = profileData.year
    }
    if (profileData.gender !== undefined) updateData.gender = profileData.gender
    if (profileData.profile_pic !== undefined) updateData.profile_pic = profileData.profile_pic

    // Update user profile
    const { data: user, error: userError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (userError) {
      return { data: null, error: userError }
    }

    // Update social links if provided
    if (profileData.social_links !== undefined) {
      // Delete existing social links
      const { error: deleteError } = await supabase
        .from('social_links')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        console.warn('Error deleting old social links:', deleteError)
      }

      // Insert new social links if any
      if (profileData.social_links.length > 0) {
        const socialLinksData = profileData.social_links.map(link => ({
          user_id: userId,
          platform: link.platform,
          username: link.username
        }))

        const { error: linksError } = await supabase
          .from('social_links')
          .insert(socialLinksData)

        if (linksError) {
          console.warn('Error creating social links:', linksError)
        }
      }
    }

    // Fetch complete updated profile
    return await getUserProfile(userId)
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to update user profile' } }
  }
}

/**
 * Check if user profile is complete (has all required fields)
 * @param {string} userId - User ID (from auth.uid())
 * @returns {Promise<{data: {complete: boolean, missing: Array<string>}, error: object|null}>}
 */
export async function checkProfileComplete(userId) {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('User')
      .select('name, year, gender, profile_pic')
      .eq('id', userId)
      .single()

    if (error) {
      return { data: null, error }
    }

    if (!user) {
      return {
        data: { complete: false, missing: ['name', 'year', 'gender', 'profile_pic'] },
        error: null
      }
    }

    // Check which required fields are missing
    const missing = []
    if (!user.name) missing.push('name')
    if (!user.year) missing.push('year')
    if (!user.gender) missing.push('gender')
    if (!user.profile_pic) missing.push('profile_pic')

    return {
      data: {
        complete: missing.length === 0,
        missing
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check profile completeness' } }
  }
}

/**
 * Get user's social links
 * @param {string} userId - User ID (from auth.uid())
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getUserSocialLinks(userId) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get social links' } }
  }
}

/**
 * Update user's social links (replaces all existing links)
 * @param {string} userId - User ID (from auth.uid())
 * @param {Array} links - Array of social link objects
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function updateSocialLinks(userId, links) {
  try {
    const supabase = await createClient()

    // Delete existing social links
    const { error: deleteError } = await supabase
      .from('social_links')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      return { data: null, error: deleteError }
    }

    // Insert new social links if any
    if (links && links.length > 0) {
      const socialLinksData = links.map(link => ({
        user_id: userId,
        platform: link.platform,
        username: link.username
      }))

      const { data, error } = await supabase
        .from('social_links')
        .insert(socialLinksData)
        .select()

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to update social links' } }
  }
}

