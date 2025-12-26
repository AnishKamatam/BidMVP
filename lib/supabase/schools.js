// lib/supabase/schools.js
// School/campus management functions
// All functions use server-side Supabase client for database operations

import { createClient } from './server'

/**
 * Get school by email domain
 * @param {string} domain - Email domain (e.g., "stanford.edu")
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getSchoolByDomain(domain) {
  try {
    const supabase = await createClient()

    if (!domain) {
      return { data: null, error: { message: 'Domain is required' } }
    }

    // Normalize domain (lowercase, trim)
    const normalizedDomain = domain.toLowerCase().trim()

    // Query school table by domain (case-insensitive)
    const { data: school, error } = await supabase
      .from('school')
      .select('*')
      .ilike('domain', normalizedDomain)
      .maybeSingle()

    if (error) {
      return { data: null, error }
    }

    // Return null data (not error) if school not found
    return { data: school || null, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get school by domain' } }
  }
}

/**
 * Create a new school record
 * @param {object} schoolData - School data
 * @param {string} schoolData.name - Full school name (required)
 * @param {string} schoolData.domain - Email domain (required)
 * @param {string} schoolData.abbreviation - Optional short name
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createSchool(schoolData) {
  try {
    const supabase = await createClient()

    // Validate required fields
    if (!schoolData.name || !schoolData.domain) {
      return {
        data: null,
        error: { message: 'School name and domain are required' }
      }
    }

    // Normalize domain (lowercase, trim)
    const normalizedDomain = schoolData.domain.toLowerCase().trim()

    // Validate domain format (basic validation - must contain at least one dot)
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i
    if (!domainRegex.test(normalizedDomain)) {
      return {
        data: null,
        error: { message: 'Invalid domain format' }
      }
    }

    // Create school record
    const { data: school, error } = await supabase
      .from('school')
      .insert({
        name: schoolData.name.trim(),
        domain: normalizedDomain,
        abbreviation: schoolData.abbreviation?.trim() || null
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate domain error gracefully
      if (error.code === '23505') { // Unique violation
        // Try to get the existing school
        const { data: existingSchool } = await getSchoolByDomain(normalizedDomain)
        if (existingSchool) {
          return { data: existingSchool, error: null }
        }
      }
      return { data: null, error }
    }

    return { data: school, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create school' } }
  }
}

/**
 * Link user to a school
 * @param {string} userId - User ID (from auth.uid())
 * @param {string} schoolId - School ID
 * @returns {Promise<{data: {success: boolean, user: object}|null, error: object|null}>}
 */
export async function linkUserToSchool(userId, schoolId) {
  try {
    const supabase = await createClient()

    if (!userId || !schoolId) {
      return {
        data: null,
        error: { message: 'User ID and School ID are required' }
      }
    }

    // First, verify both user and school exist
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return {
        data: null,
        error: { message: 'User not found' }
      }
    }

    const { data: school, error: schoolError } = await supabase
      .from('school')
      .select('id, name, domain')
      .eq('id', schoolId)
      .maybeSingle()

    if (schoolError || !school) {
      return {
        data: null,
        error: { message: 'School not found' }
      }
    }

    // Update user's school_id and school string field (for backward compatibility)
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        school_id: schoolId,
        school: school.name || school.domain // Keep string field updated for backward compatibility
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: updateError }
    }

    return {
      data: {
        success: true,
        user: updatedUser
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to link user to school' } }
  }
}

/**
 * Get school for a user
 * @param {string} userId - User ID (from auth.uid())
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getUserSchool(userId) {
  try {
    const supabase = await createClient()

    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } }
    }

    // Get user's school_id
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return { data: null, error: userError }
    }

    if (!user || !user.school_id) {
      // User has no school linked
      return { data: null, error: null }
    }

    // Get school details
    const { data: school, error: schoolError } = await supabase
      .from('school')
      .select('*')
      .eq('id', user.school_id)
      .maybeSingle()

    if (schoolError) {
      return { data: null, error: schoolError }
    }

    return { data: school || null, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get user school' } }
  }
}

