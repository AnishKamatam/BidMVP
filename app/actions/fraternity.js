// app/actions/fraternity.js
// Server Actions for fraternity and member management
// These wrap the backend functions and can be called from client components

'use server'

import {
  createFraternity,
  getFraternity,
  updateFraternity,
  getUserFraternities,
  searchFraternities,
  canCreateEvents,
  verifyFraternityEmail,
  checkVerificationStatus,
  reportFraternity,
  getFraternityReports,
  reviewFraternityReport,
  getFraternityCreator,
  checkIsCreator
} from '@/lib/supabase/fraternities'

import {
  addMember,
  removeMember,
  updateMemberRole,
  getMembers,
  checkIsAdmin,
  getMemberRole
} from '@/lib/supabase/groupMembers'

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
// Fraternity CRUD Actions
// ============================================

export async function createFraternityAction(fraternityData) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await createFraternity(fraternityData, userId)
}

export async function getFraternityAction(fraternityId) {
  return await getFraternity(fraternityId)
}

export async function updateFraternityAction(fraternityId, updates) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await updateFraternity(fraternityId, updates, userId)
}

export async function getUserFraternitiesAction() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getUserFraternities(userId)
}

export async function searchFraternitiesAction(query, schoolId, limit = 20) {
  return await searchFraternities(query, schoolId, limit)
}

// ============================================
// Verification Actions
// ============================================

export async function canCreateEventsAction(fraternityId) {
  return await canCreateEvents(fraternityId)
}

export async function checkVerificationStatusAction(fraternityId) {
  return await checkVerificationStatus(fraternityId)
}

export async function verifyFraternityEmailAction(fraternityId, token) {
  return await verifyFraternityEmail(fraternityId, token)
}

// ============================================
// Member Management Actions
// ============================================

export async function addMemberAction(groupId, userId, role = 'member') {
  const addedByUserId = await getCurrentUserId()
  if (!addedByUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await addMember(groupId, userId, role, addedByUserId)
}

export async function removeMemberAction(groupId, userId) {
  const removedByUserId = await getCurrentUserId()
  if (!removedByUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await removeMember(groupId, userId, removedByUserId)
}

export async function updateMemberRoleAction(groupId, userId, newRole) {
  const updatedByUserId = await getCurrentUserId()
  if (!updatedByUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await updateMemberRole(groupId, userId, newRole, updatedByUserId)
}

export async function getMembersAction(groupId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getMembers(groupId, userId)
}

export async function checkIsAdminAction(groupId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: { isAdmin: false }, error: { message: 'Not authenticated' } }
  }
  return await checkIsAdmin(userId, groupId)
}

export async function getMemberRoleAction(groupId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: { role: null }, error: { message: 'Not authenticated' } }
  }
  return await getMemberRole(userId, groupId)
}

// ============================================
// Reporting Actions
// ============================================

export async function reportFraternityAction(fraternityId, reason, description) {
  const reporterUserId = await getCurrentUserId()
  if (!reporterUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await reportFraternity(fraternityId, reporterUserId, reason, description)
}

export async function getFraternityReportsAction(fraternityId) {
  const adminUserId = await getCurrentUserId()
  if (!adminUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getFraternityReports(fraternityId, adminUserId)
}

export async function reviewFraternityReportAction(reportId, action, notes) {
  const adminUserId = await getCurrentUserId()
  if (!adminUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await reviewFraternityReport(reportId, adminUserId, action, notes)
}

// ============================================
// Creator Actions
// ============================================

export async function getFraternityCreatorAction(fraternityId) {
  return await getFraternityCreator(fraternityId)
}

export async function checkIsCreatorAction(fraternityId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: { isCreator: false }, error: { message: 'Not authenticated' } }
  }
  return await checkIsCreator(userId, fraternityId)
}
