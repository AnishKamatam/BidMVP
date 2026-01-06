'use server'

import { 
  checkInUser, 
  checkOutUser, 
  getCheckedInUsers, 
  isUserCheckedIn 
} from '@/lib/supabase/checkin'
import {
  trackUserLocation,
  checkUserInRadius,
  autoCheckOut
} from '@/lib/location/tracker'
import { createClient } from '@/lib/supabase/server'

export async function checkInUserAction(eventId, userId, qrCode, adminUserId) {
  return await checkInUser(eventId, userId, qrCode, adminUserId)
}

export async function checkOutUserAction(eventId, userId, adminUserId) {
  return await checkOutUser(eventId, userId, adminUserId)
}

export async function getCheckedInUsersAction(eventId, adminUserId) {
  return await getCheckedInUsers(eventId, adminUserId)
}

export async function isUserCheckedInAction(eventId, userId) {
  try {
    const supabase = await createClient()
    
    // Query checkin table directly for user's check-in record
    const { data: checkin, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_checked_in', true)
      .maybeSingle()
    
    if (error) {
      return { data: null, error: { message: error.message || 'Failed to check user status' } }
    }
    
    return { data: checkin || null, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check user status' } }
  }
}

// Geolocation tracking actions
export async function trackUserLocationAction(eventId, userId, latitude, longitude) {
  return await trackUserLocation(userId, eventId, latitude, longitude)
}

export async function checkUserInRadiusAction(eventId, userId, latitude, longitude) {
  return await checkUserInRadius(eventId, userId, latitude, longitude)
}

export async function autoCheckOutAction(eventId, userId) {
  return await autoCheckOut(userId, eventId)
}
