// lib/campus.js
// Campus detection logic - automatically detects and links schools from email domains
// Orchestrates school lookup, creation, and user linking

import { getSchoolByDomain, createSchool, linkUserToSchool } from './supabase/schools'
import { createClient } from './supabase/server'

/**
 * Extract and normalize domain from email address
 * @param {string} email - Email address (e.g., "user@stanford.edu")
 * @returns {Promise<{domain: string|null, error: object|null}>}
 */
export async function detectCampusFromEmail(email) {
  try {
    if (!email) {
      return {
        domain: null,
        error: { message: 'Email is required' }
      }
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        domain: null,
        error: { message: 'Invalid email format' }
      }
    }

    // Extract domain from email (e.g., "user@stanford.edu" → "stanford.edu")
    const parts = email.split('@')
    if (parts.length !== 2) {
      return {
        domain: null,
        error: { message: 'Invalid email format: missing @ symbol' }
      }
    }

    const domain = parts[1]

    // Normalize domain (lowercase, trim)
    const normalizedDomain = domain.toLowerCase().trim()

    // Validate domain is not empty
    if (!normalizedDomain) {
      return {
        domain: null,
        error: { message: 'Invalid email format: empty domain' }
      }
    }

    return {
      domain: normalizedDomain,
      error: null
    }
  } catch (error) {
    return {
      domain: null,
      error: { message: error.message || 'Failed to detect campus from email' }
    }
  }
}

/**
 * Automatically detect campus from email and link user to school
 * Main orchestration function that:
 * 1. Extracts domain from email
 * 2. Checks if school exists
 * 3. Creates school if missing (auto-create)
 * 4. Links user to school
 * 
 * @param {string} userId - User ID (from auth.uid())
 * @param {string} email - User's email address
 * @returns {Promise<{data: {school: object, linked: boolean}|null, error: object|null}>}
 */
export async function autoLinkUser(userId, email) {
  try {
    if (!userId || !email) {
      return {
        data: null,
        error: { message: 'User ID and email are required' }
      }
    }

    // PRIORITY CHECK: If user already has a school_id, don't overwrite it
    // This ensures manual selections take priority over auto-detection
    const supabase = await createClient()
    
    // Check if user already has a school_id (manual selection takes priority)
    const { data: existingUser } = await supabase
      .from('User')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle()

    if (existingUser?.school_id) {
      // User already has a manually selected school - fetch and return it
      const { data: school } = await supabase
        .from('school')
        .select('*')
        .eq('id', existingUser.school_id)
        .single()

      if (school) {
        return {
          data: {
            school: school,
            linked: true,
            alreadyLinked: true // Indicates this was already linked (not auto-linked)
          },
          error: null
        }
      }
    }

    // Step 1: Extract domain from email
    const { domain, error: detectError } = await detectCampusFromEmail(email)
    
    if (detectError || !domain) {
      return {
        data: null,
        error: detectError || { message: 'Failed to extract domain from email' }
      }
    }

    // Step 2: Check if school exists
    const { data: existingSchool, error: lookupError } = await getSchoolByDomain(domain)
    
    if (lookupError) {
      return {
        data: null,
        error: lookupError
      }
    }

    let school = existingSchool

    // Step 3: If school doesn't exist, create it (auto-create)
    if (!school) {
      // Generate school name from domain (e.g., "stanford.edu" → "Stanford University")
      // This is a best-guess - can be improved later with a school name database
      const domainParts = domain.split('.')
      const schoolName = domainParts[0]
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') + ' University'

      const { data: newSchool, error: createError } = await createSchool({
        name: schoolName,
        domain: domain,
        abbreviation: schoolName.split(' ')[0] // Use first word as abbreviation
      })

      if (createError) {
        return {
          data: null,
          error: createError
        }
      }

      school = newSchool
    }

    // Step 4: Link user to school
    const { data: linkData, error: linkError } = await linkUserToSchool(userId, school.id)

    if (linkError) {
      // School was found/created but linking failed
      // Return school info but indicate linking failed
      return {
        data: {
          school: school,
          linked: false
        },
        error: linkError
      }
    }

    // Success: school found/created and user linked
    return {
      data: {
        school: school,
        linked: true
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || 'Failed to auto-link user to campus' }
    }
  }
}

