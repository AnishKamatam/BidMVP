// lib/supabase/users.js
// User profile management functions
// All functions use server-side Supabase client for database operations

import { createClient } from './server'
import { autoLinkUser } from '../campus'

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
 * @param {string} email - User's email address (required, passed from client)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createUserProfile(userId, profileData, email) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users.js:67',message:'createUserProfile called',data:{userId,email,hasName:!!profileData?.name,hasYear:!!profileData?.year,hasGender:!!profileData?.gender,hasProfilePic:!!profileData?.profile_pic},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    const supabase = await createClient()
    
    // #region agent log
    // Check if user already exists before attempting insert
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id, email, name')
      .eq('id', userId)
      .maybeSingle()
    
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users.js:75',message:'User existence check',data:{userId,existingUser:!!existingUser,existingEmail:existingUser?.email,existingName:existingUser?.name,checkError:checkError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // If user already exists, use UPDATE instead of INSERT to avoid duplicate key error
    if (existingUser) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users.js:127',message:'User exists - using UPDATE instead of INSERT',data:{userId,existingEmail:existingUser.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Use updateUserProfile instead of insert
      return await updateUserProfile(userId, {
        name: profileData.name,
        year: profileData.year,
        gender: profileData.gender,
        profile_pic: profileData.profile_pic,
        social_links: profileData.social_links
      })
    }

    // Validate required fields
    if (!profileData.name || !profileData.year || !profileData.gender || !profileData.profile_pic) {
      return {
        data: null,
        error: { message: 'Missing required fields: name, year, gender, and profile_pic are required' }
      }
    }

    // Validate email
    if (!email) {
      return {
        data: null,
        error: { message: 'Email is required' }
      }
    }

    // Validate year range
    if (profileData.year < 1 || profileData.year > 5) {
      return {
        data: null,
        error: { message: 'Year must be between 1 and 5' }
      }
    }

    // Get email_confirmed_at from auth.users before creating User record
    // This ensures the User table reflects the email verification status
    let emailConfirmedAt = null
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.email_confirmed_at) {
        emailConfirmedAt = authUser.email_confirmed_at
      }
    } catch (authError) {
      // Non-critical - log but continue
      console.warn('Could not get email_confirmed_at from auth.users:', authError.message)
    }

    // Check if user already has a school_id (manual selection takes priority)
    // Note: We check existingUser from line 78, but need to check school_id separately
    // since the first check only gets id, email, name
    const { data: userWithSchool } = await supabase
      .from('User')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle()

    let schoolId = null
    let school = 'unknown.edu' // Fallback value

    // Only auto-link if user doesn't already have a school_id
    if (!userWithSchool?.school_id && email) {
      // Auto-detect and link campus from email domain
      // This uses the new campus detection system (Phase 0.3)
      const { data: campusData, error: campusError } = await autoLinkUser(userId, email)
      
      if (campusError) {
        // Log but don't fail - use fallback
        console.warn('Campus detection failed:', campusError.message)
      }
      
      if (campusData?.school) {
        // Use school_id if available, otherwise fallback to domain string
        schoolId = campusData.school.id
        school = campusData.school.name || campusData.school.domain || 'unknown.edu'
      } else {
        // Fallback: extract domain manually if campus detection failed
        if (email && email.includes('@')) {
          const domain = email.split('@')[1]
          if (domain) {
            school = domain.toLowerCase()
          }
        }
      }
    } else if (userWithSchool?.school_id) {
      // User already has a school_id (from manual selection)
      // Fetch school details to populate school string field
      const { data: existingSchool } = await supabase
        .from('school')
        .select('name, domain')
        .eq('id', userWithSchool.school_id)
        .single()

      if (existingSchool) {
        schoolId = userWithSchool.school_id
        school = existingSchool.name || existingSchool.domain || 'unknown.edu'
      }
    }

    // Generate timestamps explicitly (database defaults should handle this, but explicit is safer)
    // Using ISO string format that PostgreSQL accepts
    const now = new Date().toISOString()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users.js:125',message:'Before insert attempt',data:{userId,email,school,schoolId,name:profileData.name,year:profileData.year,gender:profileData.gender,hasProfilePic:!!profileData.profile_pic,timestamp:now},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Create user profile in User table
    // Include ALL required fields: email, school, name, year, gender, profile_pic, timestamps
    // Email is passed as parameter from client where it's already available
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: email, // Use email passed as parameter
        school: school, // School name/domain (for backward compatibility)
        school_id: schoolId, // Link to school table (Phase 0.3)
        name: profileData.name,
        year: profileData.year,
        gender: profileData.gender,
        profile_pic: profileData.profile_pic,
        email_confirmed_at: emailConfirmedAt, // Sync email verification status from auth.users
        email_verified: emailConfirmedAt !== null, // Set email_verified based on email_confirmed_at
        created_at: now, // Explicit timestamp (database default should also handle this)
        updated_at: now  // Explicit timestamp (database default should also handle this)
      })
      .select()
      .single()
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users.js:145',message:'After insert attempt',data:{userId,hasUser:!!user,hasError:!!userError,errorCode:userError?.code,errorMessage:userError?.message,errorDetails:userError?.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (userError) {
      // Enhanced error logging to help identify which field is causing issues
      console.error('User creation error:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        userId: userId,
        email: email,
        school: school,
        hasName: !!profileData.name,
        hasYear: !!profileData.year,
        hasGender: !!profileData.gender,
        hasProfilePic: !!profileData.profile_pic
      })
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

