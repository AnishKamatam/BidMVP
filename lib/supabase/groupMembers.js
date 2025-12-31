// lib/supabase/groupMembers.js
// Group member management functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { randomUUID } from 'crypto'

/**
 * Add a user to a fraternity
 * @param {string} groupId - Fraternity/group ID
 * @param {string} userId - User ID to add
 * @param {string} role - Role: 'admin', 'member', 'pledge' (default: 'member')
 * @param {string} addedByUserId - User ID of person adding the member
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function addMember(groupId, userId, role = 'member', addedByUserId) {
  try {
    const supabase = await createClient()

    // Validation
    if (!['admin', 'member', 'pledge'].includes(role)) {
      return { data: null, error: { message: 'Invalid role. Must be admin, member, or pledge' } }
    }

    // Special case: Users can request to join themselves (bypass admin check)
    // Admins can add any member directly
    const isSelfJoin = userId === addedByUserId
    
    if (!isSelfJoin) {
      // If adding someone else, must be admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_group_admin', {
        user_id: addedByUserId,
        group_id: groupId
      })

      if (adminError || !isAdmin) {
        return { data: null, error: { message: 'Only admins can add other members' } }
      }
    }
    // If isSelfJoin, allow the user to join themselves (no admin check needed)

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember) {
      return { data: null, error: { message: 'User is already a member' } }
    }

    // Member Quality Check: User must have verified email and completed profile
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, email_verified, name, year, gender, school')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { data: null, error: { message: 'User not found' } }
    }

    if (!user.email_verified) {
      return { data: null, error: { message: 'User must have verified email to join fraternities' } }
    }

    if (!user.name || !user.year || !user.gender || !user.school) {
      return { data: null, error: { message: 'User must have completed profile to join fraternities' } }
    }

    // Add member
    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .insert({
        id: randomUUID(),
        group_id: groupId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    if (memberError) {
      return { data: null, error: memberError }
    }

    // Manually update member counts using RPC function (bypasses RLS)
    // This ensures counts are always accurate even if triggers haven't run
    // The RPC function uses SECURITY DEFINER to bypass RLS
    const { error: refreshError } = await supabase.rpc('refresh_fraternity_member_counts', {
      p_group_id: groupId
    })

    if (refreshError) {
      console.error('Failed to refresh member counts via RPC:', refreshError)
      // Don't fail the entire operation, but log the error
      // Triggers should still handle it, but this is a backup
    }

    // Get updated fraternity data
    const { data: fraternity } = await supabase
      .from('fraternity')
      .select('member_count, quality_member_count, member_verified, verified')
      .eq('id', groupId)
      .single()

    return {
      data: {
        success: true,
        member,
        verificationUpdated: fraternity?.member_verified || fraternity?.verified || false,
        qualityMemberCount: fraternity?.quality_member_count || 0,
        totalMemberCount: fraternity?.member_count || 0
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to add member' } }
  }
}

/**
 * Remove a user from a fraternity
 * @param {string} groupId - Fraternity/group ID
 * @param {string} userId - User ID to remove
 * @param {string} removedByUserId - User ID of person removing the member
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function removeMember(groupId, userId, removedByUserId) {
  try {
    const supabase = await createClient()

    // Permission check: Only admins can remove members, OR user can remove themselves
    if (userId !== removedByUserId) {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_group_admin', {
        user_id: removedByUserId,
        group_id: groupId
      })

      if (adminError || !isAdmin) {
        return { data: null, error: { message: 'Only admins can remove other members' } }
      }
    }

    // Remove member
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      return { data: null, error }
    }

    // Refresh member counts after removal (triggers should handle this, but this ensures it)
    const { error: refreshError } = await supabase.rpc('refresh_fraternity_member_counts', {
      p_group_id: groupId
    })

    if (refreshError) {
      console.error('Failed to refresh member counts after removal:', refreshError)
      // Don't fail the operation - triggers should handle it
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to remove member' } }
  }
}

/**
 * Update a member's role
 * @param {string} groupId - Fraternity/group ID
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role: 'admin', 'member', 'pledge'
 * @param {string} updatedByUserId - User ID of person updating the role
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateMemberRole(groupId, userId, newRole, updatedByUserId) {
  try {
    const supabase = await createClient()

    // Validation
    if (!['admin', 'member', 'pledge'].includes(newRole)) {
      return { data: null, error: { message: 'Invalid role. Must be admin, member, or pledge' } }
    }

    // Permission check: Only admins can update roles
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_group_admin', {
      user_id: updatedByUserId,
      group_id: groupId
    })

    if (adminError || !isAdmin) {
      return { data: null, error: { message: 'Only admins can update roles' } }
    }

    // Check if this is the last admin and we're trying to demote/remove them
    if (newRole !== 'admin') {
      const { data: admins } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('role', 'admin')

      if (admins && admins.length === 1 && admins[0].user_id === userId) {
        return { data: null, error: { message: 'Cannot remove last admin. Promote another member first.' } }
      }
    }

    // Update role
    const { data: member, error } = await supabase
      .from('group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data: { success: true, member }, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to update role' } }
  }
}

/**
 * Get all members of a fraternity
 * @param {string} groupId - Fraternity/group ID
 * @param {string} userId - User ID requesting the list (for permission check)
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function getMembers(groupId, userId) {
  try {
    const supabase = await createClient()

    // Permission check: Only group members can view members list
    const { data: membership } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!membership) {
      return { data: null, error: { message: 'Only group members can view members list' } }
    }

    // Get all members with user profile info
    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        id,
        role,
        joined_at,
        user:user_id (
          id,
          name,
          profile_pic,
          year,
          email
        )
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (error) {
      return { data: null, error }
    }

    return { data: members || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get members' } }
  }
}

/**
 * Check if user is an admin of a group
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function checkIsAdmin(userId, groupId) {
  try {
    const supabase = await createClient()

    const { data: isAdmin, error } = await supabase.rpc('is_group_admin', {
      user_id: userId,
      group_id: groupId
    })

    if (error) {
      return { data: { isAdmin: false }, error }
    }

    return { data: { isAdmin: isAdmin || false }, error: null }
  } catch (error) {
    return { data: { isAdmin: false }, error: { message: error.message || 'Failed to check admin status' } }
  }
}

/**
 * Get a user's role in a specific group
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function getMemberRole(userId, groupId) {
  try {
    const supabase = await createClient()

    const { data: membership, error } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return { data: { role: null }, error }
    }

    return { data: { role: membership?.role || null }, error: null }
  } catch (error) {
    return { data: { role: null }, error: { message: error.message || 'Failed to get member role' } }
  }
}
