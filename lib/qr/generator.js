// lib/qr/generator.js
// QR code generation and validation functions
// Backend only generates the QR code string; frontend generates the image

import { randomUUID } from 'crypto'

/**
 * Generate unique QR code string for event
 * @param {string} eventId - Event ID
 * @returns {string} QR code string
 */
export function generateQRCode(eventId) {
  // Format: event-${eventId}-${randomUUID().slice(0, 8)}
  const randomSuffix = randomUUID().slice(0, 8)
  return `event-${eventId}-${randomSuffix}`
}

/**
 * Validate QR code matches event
 * @param {string} qrCode - QR code string to validate
 * @param {string} eventId - Event ID to check against
 * @returns {{valid: boolean, error: string | null}}
 */
export function validateQRCode(qrCode, eventId) {
  if (!qrCode || !eventId) {
    return { valid: false, error: 'QR code and event ID are required' }
  }

  // QR code format: event-${eventId}-${randomSuffix}
  // Extract event ID from QR code
  const qrCodePrefix = `event-${eventId}-`
  
  if (!qrCode.startsWith(qrCodePrefix)) {
    return { valid: false, error: 'QR code does not match event' }
  }

  return { valid: true, error: null }
}

