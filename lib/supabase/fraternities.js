// lib/supabase/fraternities.js
// Fraternity management functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { randomUUID } from 'crypto'

// Helper function to serialize Supabase errors to plain objects
// This ensures errors can be passed from Server Components to Client Components
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
 * Create a new fraternity
 * @param {object} fraternityData - Fraternity data
 * @param {string} fraternityData.name - Fraternity name (required)
 * @param {string} fraternityData.type - Type: 'fraternity', 'sorority', 'other' (required)
 * @param {string} fraternityData.verification_email - Optional verification email
 * @param {string} fraternityData.photo_url - Optional photo URL
 * @param {string} fraternityData.description - Optional description
 * @param {string} creatorUserId - User ID of creator
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createFraternity(fraternityData, creatorUserId) {
  try {
    const supabase = await createClient()

    // Validation
    if (!fraternityData.name || fraternityData.name.trim().length < 2 || fraternityData.name.length > 100) {
      return { data: null, error: { message: 'Name is required and must be between 2 and 100 characters' } }
    }

    // Validate type - ensure it's a string and matches expected values
    const typeValue = fraternityData.type ? String(fraternityData.type).trim().toLowerCase() : null
    if (!typeValue || !['fraternity', 'sorority', 'other'].includes(typeValue)) {
      return { 
        data: null, 
        error: { 
          message: 'Type must be one of: fraternity, sorority, other',
          received: fraternityData.type,
          processed: typeValue
        } 
      }
    }

    // Validate verification_email if provided (optional)
    if (fraternityData.verification_email && !fraternityData.verification_email.includes('@')) {
      return { data: null, error: { message: 'Invalid email format' } }
    }

    // Check if creator user exists and has verified email + completed profile
    const { data: creator, error: creatorError } = await supabase
      .from('User')
      .select('id, email_verified, name, year, gender, school')
      .eq('id', creatorUserId)
      .single()

    if (creatorError || !creator) {
      return { data: null, error: { message: 'Creator user not found' } }
    }

    // Member quality check: creator must have verified email and completed profile
    if (!creator.email_verified) {
      return { data: null, error: { message: 'Creator must have verified email to create fraternity' } }
    }

    if (!creator.name || !creator.year || !creator.gender || !creator.school) {
      return { data: null, error: { message: 'Creator must have completed profile to create fraternity' } }
    }

    // Get creator's school_id for duplicate check and fraternity creation
    const { data: creatorProfile } = await supabase
      .from('User')
      .select('school_id')
      .eq('id', creatorUserId)
      .single()

    // Validate that creator has a school_id (required for fraternity creation)
    if (!creatorProfile?.school_id) {
      return { 
        data: null, 
        error: { 
          message: 'Creator must be linked to a school to create a fraternity. Please complete your profile and select a campus.' 
        } 
      }
    }

    const creatorSchoolId = creatorProfile.school_id

    // Check for duplicate name at same school - BLOCK creation if duplicate found
    const { data: existingFraternity, error: checkError } = await supabase
      .from('fraternity')
      .select('id, name')
      .eq('school_id', creatorSchoolId)
      .ilike('name', fraternityData.name.trim())
      .limit(1)
      .maybeSingle()

    if (checkError) {
      return { 
        data: null, 
        error: serializeError(checkError, 'Failed to check for duplicate fraternity') 
      }
    }

    // Block creation if duplicate found
    if (existingFraternity) {
      return {
        data: null,
        error: {
          message: `A fraternity with the name "${fraternityData.name.trim()}" already exists at your school. Please choose a different name.`,
          code: 'DUPLICATE_NAME',
          allowCreation: false
        }
      }
    }

    // Generate fraternity ID
    const fraternityId = randomUUID()

    // Create fraternity record (school_id and creator_id are required)
    const insertData = {
      id: fraternityId,
      name: fraternityData.name.trim(),
      type: typeValue, // Use the validated and normalized type
      school_id: creatorSchoolId, // REQUIRED: Set school_id from creator
      creator_id: creatorUserId, // REQUIRED: Track who created this fraternity
      verification_email: fraternityData.verification_email || null,
      photo_url: fraternityData.photo_url || null,
      verified: false,
      email_verified: false,
      member_verified: false,
      member_count: 1,
      quality_member_count: 1, // Creator counts as quality member
      flagged_for_review: false // No longer flagging for duplicate review since we block duplicates
    }
    
    // Debug logging
    console.log('createFraternity: Inserting fraternity with photo_url:', insertData.photo_url ? (insertData.photo_url.substring(0, 50) + '...') : null)
    
    const { data: fraternity, error: fraternityError } = await supabase
      .from('fraternity')
      .insert(insertData)
      .select()
      .single()

    if (fraternityError) {
      return { data: null, error: fraternityError }
    }

    // Add creator as admin member using SECURITY DEFINER function
    // This bypasses RLS and allows the creator to add themselves as first admin
    const { error: memberError } = await supabase.rpc('add_first_admin_member', {
      p_group_id: fraternityId,
      p_user_id: creatorUserId,
      p_member_id: randomUUID()
    })

    if (memberError) {
      // Rollback: delete fraternity if member insert fails
      await supabase.from('fraternity').delete().eq('id', fraternityId)
      // Ensure error is serializable - only return plain object properties
      const errorMessage = memberError?.message || String(memberError) || 'Failed to add creator as admin member'
      return { 
        data: null, 
        error: { 
          message: 'Failed to add creator as admin member',
          details: errorMessage
        } 
      }
    }

    // Success - return fraternity data
    return { data: fraternity, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create fraternity' } }
  }
}

/**
 * Get fraternity by ID
 * @param {string} fraternityId - Fraternity ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getFraternity(fraternityId) {
  try {
    const supabase = await createClient()

    const { data: fraternity, error } = await supabase
      .from('fraternity')
      .select('*')
      .eq('id', fraternityId)
      .single()

    if (error) {
      // Not found is not an error, return null data
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      return { data: null, error: serializeError(error) }
    }

    return { data: fraternity, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get fraternity' } }
  }
}

/**
 * Get the creator of a fraternity
 * @param {string} fraternityId - Fraternity ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getFraternityCreator(fraternityId) {
  try {
    const supabase = await createClient()

    // Get fraternity with creator info
    const { data: fraternity, error: fraternityError } = await supabase
      .from('fraternity')
      .select('creator_id')
      .eq('id', fraternityId)
      .single()

    if (fraternityError || !fraternity?.creator_id) {
      return { data: null, error: { message: 'Fraternity creator not found' } }
    }

    // Get creator user details
    const { data: creator, error: creatorError } = await supabase
      .from('User')
      .select('id, name, email, profile_pic')
      .eq('id', fraternity.creator_id)
      .single()

    if (creatorError) {
      return { data: null, error: serializeError(creatorError, 'Failed to get creator details') }
    }

    return { data: creator, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get fraternity creator' } }
  }
}

/**
 * Check if a user is the creator of a fraternity
 * @param {string} userId - User ID
 * @param {string} fraternityId - Fraternity ID
 * @returns {Promise<{data: {isCreator: boolean}, error: object|null}>}
 */
export async function checkIsCreator(userId, fraternityId) {
  try {
    const supabase = await createClient()

    const { data: fraternity, error } = await supabase
      .from('fraternity')
      .select('creator_id')
      .eq('id', fraternityId)
      .single()

    if (error) {
      return { data: { isCreator: false }, error: serializeError(error) }
    }

    return { 
      data: { isCreator: fraternity?.creator_id === userId }, 
      error: null 
    }
  } catch (error) {
    return { data: { isCreator: false }, error: { message: error.message || 'Failed to check creator status' } }
  }
}

/**
 * Update fraternity info (admin only)
 * @param {string} fraternityId - Fraternity ID
 * @param {object} updates - Fields to update
 * @param {string} userId - User ID performing the update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateFraternity(fraternityId, updates, userId) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_group_admin', {
      user_id: userId,
      group_id: fraternityId
    })

    if (adminError || !isAdmin) {
      return { data: null, error: { message: 'Only admins can update fraternity' } }
    }

    // Build update object
    const updateData = {}
    if (updates.name !== undefined) {
      if (updates.name.trim().length < 2 || updates.name.length > 100) {
        return { data: null, error: { message: 'Name must be between 2 and 100 characters' } }
      }
      updateData.name = updates.name.trim()
    }
    if (updates.type !== undefined) {
      if (!['fraternity', 'sorority', 'other'].includes(updates.type)) {
        return { data: null, error: { message: 'Type must be one of: fraternity, sorority, other' } }
      }
      updateData.type = updates.type
    }
    if (updates.photo_url !== undefined) updateData.photo_url = updates.photo_url
    if (updates.description !== undefined) updateData.description = updates.description

    const { data: fraternity, error } = await supabase
      .from('fraternity')
      .update(updateData)
      .eq('id', fraternityId)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data: fraternity, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to update fraternity' } }
  }
}

/**
 * Get all fraternities a user belongs to
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function getUserFraternities(userId) {
  try {
    const supabase = await createClient()

    const { data: memberships, error } = await supabase
      .from('group_members')
      .select(`
        role,
        fraternity:group_id (
          id,
          name,
          type,
          photo_url,
          verified,
          email_verified,
          member_verified,
          member_count,
          quality_member_count
        )
      `)
      .eq('user_id', userId)

    if (error) {
      return { data: null, error }
    }

    // Transform data to match expected format
    const fraternities = (memberships || []).map(m => ({
      fraternity: m.fraternity,
      role: m.role
    }))

    return { data: fraternities, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get user fraternities' } }
  }
}

/**
 * Search fraternities by name at a specific school
 * @param {string} query - Search query
 * @param {string} schoolId - School ID to filter by
 * @param {number} limit - Maximum results (default 20)
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function searchFraternities(query, schoolId, limit = 20) {
  try {
    const supabase = await createClient()

    // Build query: search by name and filter by school_id if provided
    let queryBuilder = supabase
      .from('fraternity')
      .select('*')
      .ilike('name', `%${query}%`)

    // Filter by school_id if provided (fraternities now have school_id field directly)
    if (schoolId) {
      queryBuilder = queryBuilder.eq('school_id', schoolId)
    }

    // Apply limit
    queryBuilder = queryBuilder.limit(limit)

    const { data: fraternities, error } = await queryBuilder

    if (error) {
      return { data: null, error: serializeError(error, 'Failed to search fraternities') }
    }

    // Return all fraternities matching the search (including unverified ones)
    // Users can see all fraternities at their school, verification status is shown separately
    return { data: fraternities || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to search fraternities' } }
  }
}

/**
 * Check if fraternity can create public events
 * @param {string} fraternityId - Fraternity ID
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function canCreateEvents(fraternityId) {
  try {
    const supabase = await createClient()

    const { data: fraternity, error } = await supabase
      .from('fraternity')
      .select('verified, email_verified, member_verified, quality_member_count')
      .eq('id', fraternityId)
      .single()

    if (error || !fraternity) {
      return {
        data: {
          canCreate: false,
          reason: 'Fraternity not found',
          membersNeeded: 7,
          qualityMemberCount: 0
        },
        error: null
      }
    }

    // Primary verification: 7+ quality members
    if (fraternity.quality_member_count >= 7) {
      return {
        data: {
          canCreate: true,
          reason: null,
          membersNeeded: 0,
          qualityMemberCount: fraternity.quality_member_count
        },
        error: null
      }
    }

    // Optional bonus: Email verified + 5+ quality members
    if (fraternity.email_verified && fraternity.quality_member_count >= 5) {
      return {
        data: {
          canCreate: true,
          reason: null,
          membersNeeded: 0,
          qualityMemberCount: fraternity.quality_member_count
        },
        error: null
      }
    }

    // Fully verified
    if (fraternity.verified) {
      return {
        data: {
          canCreate: true,
          reason: null,
          membersNeeded: 0,
          qualityMemberCount: fraternity.quality_member_count
        },
        error: null
      }
    }

    // Not verified - calculate members needed
    const membersNeeded = Math.max(0, 7 - fraternity.quality_member_count)
    const reason = `Add ${membersNeeded} more verified members to unlock events`

    return {
      data: {
        canCreate: false,
        reason,
        membersNeeded,
        qualityMemberCount: fraternity.quality_member_count
      },
      error: null
    }
  } catch (error) {
    return {
      data: {
        canCreate: false,
        reason: 'Error checking verification status',
        membersNeeded: 7,
        qualityMemberCount: 0
      },
      error: { message: error.message || 'Failed to check event creation permission' }
    }
  }
}

/**
 * Verify fraternity email (optional)
 * @param {string} fraternityId - Fraternity ID
 * @param {string} verificationToken - Verification token
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function verifyFraternityEmail(fraternityId, verificationToken) {
  try {
    const supabase = await createClient()

    // TODO: Implement token verification logic
    // For now, just set email_verified to true
    // In production, verify the token matches what was sent

    const { data: fraternity, error } = await supabase
      .from('fraternity')
      .update({ email_verified: true })
      .eq('id', fraternityId)
      .select()
      .single()

    if (error) {
      return { data: { verified: false, status: null }, error }
    }

    return {
      data: {
        verified: true,
        status: {
          email_verified: true,
          member_verified: fraternity.member_verified,
          verified: fraternity.verified,
          quality_member_count: fraternity.quality_member_count
        }
      },
      error: null
    }
  } catch (error) {
    return { data: { verified: false, status: null }, error: { message: error.message || 'Failed to verify email' } }
  }
}

/**
 * Check verification status of fraternity
 * @param {string} fraternityId - Fraternity ID
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function checkVerificationStatus(fraternityId) {
  try {
    const supabase = await createClient()

    const { data: fraternity, error } = await supabase
      .from('fraternity')
      .select('email_verified, member_verified, verified, member_count, quality_member_count, verification_email')
      .eq('id', fraternityId)
      .single()

    if (error || !fraternity) {
      return { data: null, error: { message: 'Fraternity not found' } }
    }

    // Calculate members needed
    let membersNeeded = 0
    let requirements = ''

    if (fraternity.quality_member_count >= 7) {
      requirements = 'Ready to create events! ✓'
    } else {
      membersNeeded = 7 - fraternity.quality_member_count
      if (fraternity.email_verified && fraternity.verification_email) {
        requirements = `Email verified ✓ | Add ${membersNeeded} more verified members (or 5+ with email)`
      } else {
        requirements = `Add ${membersNeeded} more verified members to unlock events`
      }
    }

    return {
      data: {
        email_verified: fraternity.email_verified,
        member_verified: fraternity.member_verified,
        verified: fraternity.verified,
        member_count: fraternity.member_count,
        quality_member_count: fraternity.quality_member_count,
        membersNeeded,
        requirements
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check verification status' } }
  }
}

/**
 * Report a fraternity
 * @param {string} fraternityId - Fraternity ID
 * @param {string} reporterUserId - User ID of reporter
 * @param {string} reason - Reason: 'fake', 'duplicate', 'inappropriate', 'other'
 * @param {string} description - Description (min 10 chars)
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function reportFraternity(fraternityId, reporterUserId, reason, description) {
  try {
    const supabase = await createClient()

    // Validation
    if (!['fake', 'duplicate', 'inappropriate', 'other'].includes(reason)) {
      return { data: null, error: { message: 'Invalid reason' } }
    }

    if (!description || description.trim().length < 10) {
      return { data: null, error: { message: 'Description must be at least 10 characters' } }
    }

    // Check if fraternity exists
    const { data: fraternity } = await supabase
      .from('fraternity')
      .select('id')
      .eq('id', fraternityId)
      .single()

    if (!fraternity) {
      return { data: null, error: { message: 'Fraternity not found' } }
    }

    // Create report
    const { data: report, error } = await supabase
      .from('fraternity_reports')
      .insert({
        fraternity_id: fraternityId,
        reporter_user_id: reporterUserId,
        reason,
        description: description.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return {
      data: {
        reportId: report.id,
        success: true
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to report fraternity' } }
  }
}

/**
 * Get fraternity reports (admin only)
 * @param {string} fraternityId - Fraternity ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function getFraternityReports(fraternityId, adminUserId) {
  try {
    const supabase = await createClient()

    // TODO: Add platform admin check
    // For now, allow any authenticated user

    const { data: reports, error } = await supabase
      .from('fraternity_reports')
      .select('*')
      .eq('fraternity_id', fraternityId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error }
    }

    return { data: reports || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get reports' } }
  }
}

/**
 * Review fraternity report (admin only)
 * @param {string} reportId - Report ID
 * @param {string} adminUserId - Admin user ID
 * @param {string} action - Action: 'dismiss', 'flag_fraternity', 'suspend_fraternity', 'delete_fraternity'
 * @param {string} notes - Admin notes
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function reviewFraternityReport(reportId, adminUserId, action, notes) {
  try {
    const supabase = await createClient()

    // Validation
    if (!['dismiss', 'flag_fraternity', 'suspend_fraternity', 'delete_fraternity'].includes(action)) {
      return { data: null, error: { message: 'Invalid action' } }
    }

    // Get report
    const { data: report, error: reportError } = await supabase
      .from('fraternity_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return { data: null, error: { message: 'Report not found' } }
    }

    // Update report
    const updateData = {
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      admin_notes: notes || null
    }

    const { error: updateError } = await supabase
      .from('fraternity_reports')
      .update(updateData)
      .eq('id', reportId)

    if (updateError) {
      return { data: null, error: updateError }
    }

    // Take action on fraternity if needed
    if (action === 'flag_fraternity') {
      await supabase
        .from('fraternity')
        .update({ flagged_for_review: true })
        .eq('id', report.fraternity_id)
    } else if (action === 'delete_fraternity') {
      await supabase
        .from('fraternity')
        .delete()
        .eq('id', report.fraternity_id)
    }

    return {
      data: {
        success: true,
        action
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to review report' } }
  }
}
