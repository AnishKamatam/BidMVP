'use server'

import { geocodeAddress } from '@/lib/geocoding/nominatim'

/**
 * Geocode an address to coordinates (server action)
 * @param {string} address - Address string
 * @returns {Promise<{data: {lat: number, lng: number}|null, error: object|null}>}
 */
export async function geocodeAddressAction(address) {
  try {
    const coordinates = await geocodeAddress(address)
    if (coordinates) {
      return { data: coordinates, error: null }
    }
    return { data: null, error: { message: 'Could not geocode address' } }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to geocode address' } }
  }
}

