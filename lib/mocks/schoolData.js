// lib/mocks/schoolData.js
// Mock versions of school and campus functions for parallel frontend development
// These match the exact signatures of the real functions in lib/supabase/schools.js and lib/campus.js

/**
 * Simulate network delay for realistic loading states
 */
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock school data for common universities
const mockSchools = [
  {
    id: 'mock-school-1',
    name: 'Stanford University',
    domain: 'stanford.edu',
    abbreviation: 'Stanford',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-school-2',
    name: 'University of California, Berkeley',
    domain: 'berkeley.edu',
    abbreviation: 'UC Berkeley',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-school-3',
    name: 'University of California, Los Angeles',
    domain: 'ucla.edu',
    abbreviation: 'UCLA',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-school-4',
    name: 'University of Southern California',
    domain: 'usc.edu',
    abbreviation: 'USC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-school-5',
    name: 'Harvard University',
    domain: 'harvard.edu',
    abbreviation: 'Harvard',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-school-6',
    name: 'Massachusetts Institute of Technology',
    domain: 'mit.edu',
    abbreviation: 'MIT',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

/**
 * Mock: Get school by domain
 * @param {string} domain - Email domain
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function mockGetSchoolByDomain(domain) {
  await delay(300)
  
  if (!domain) {
    return { data: null, error: { message: 'Domain is required' } }
  }

  const normalizedDomain = domain.toLowerCase().trim()
  const school = mockSchools.find(s => s.domain === normalizedDomain)

  return { data: school || null, error: null }
}

/**
 * Mock: Create school
 * @param {object} schoolData - School data
 * @param {string} schoolData.name - Full school name
 * @param {string} schoolData.domain - Email domain
 * @param {string} schoolData.abbreviation - Optional short name
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function mockCreateSchool(schoolData) {
  await delay(400)

  if (!schoolData.name || !schoolData.domain) {
    return {
      data: null,
      error: { message: 'School name and domain are required' }
    }
  }

  // Check if school already exists
  const existing = mockSchools.find(s => s.domain === schoolData.domain.toLowerCase())
  if (existing) {
    return { data: existing, error: null }
  }

  // Create new mock school
  const newSchool = {
    id: `mock-school-${mockSchools.length + 1}`,
    name: schoolData.name,
    domain: schoolData.domain.toLowerCase(),
    abbreviation: schoolData.abbreviation || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  mockSchools.push(newSchool)

  return { data: newSchool, error: null }
}

/**
 * Mock: Link user to school
 * @param {string} userId - User ID
 * @param {string} schoolId - School ID
 * @returns {Promise<{data: {success: boolean, user: object}|null, error: object|null}>}
 */
export async function mockLinkUserToSchool(userId, schoolId) {
  await delay(300)

  if (!userId || !schoolId) {
    return {
      data: null,
      error: { message: 'User ID and School ID are required' }
    }
  }

  // Find school
  const school = mockSchools.find(s => s.id === schoolId)
  if (!school) {
    return {
      data: null,
      error: { message: 'School not found' }
    }
  }

  // Mock user update (in real implementation, this would update the database)
  const mockUser = {
    id: userId,
    school_id: schoolId,
    school: school.name,
    // ... other user fields
  }

  return {
    data: {
      success: true,
      user: mockUser
    },
    error: null
  }
}

/**
 * Mock: Get user's school
 * @param {string} userId - User ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function mockGetUserSchool(userId) {
  await delay(300)

  if (!userId) {
    return { data: null, error: { message: 'User ID is required' } }
  }

  // Mock: Assume user is linked to first school
  // In real implementation, this would query the database
  const school = mockSchools[0]

  return { data: school || null, error: null }
}

/**
 * Mock: Detect campus from email
 * @param {string} email - Email address
 * @returns {Promise<{domain: string|null, error: object|null}>}
 */
export async function mockDetectCampusFromEmail(email) {
  await delay(200)

  if (!email) {
    return {
      domain: null,
      error: { message: 'Email is required' }
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      domain: null,
      error: { message: 'Invalid email format' }
    }
  }

  const parts = email.split('@')
  if (parts.length !== 2) {
    return {
      domain: null,
      error: { message: 'Invalid email format: missing @ symbol' }
    }
  }

  const domain = parts[1].toLowerCase().trim()

  return {
    domain: domain || null,
    error: null
  }
}

/**
 * Mock: Auto-link user to campus
 * @param {string} userId - User ID
 * @param {string} email - User's email address
 * @returns {Promise<{data: {school: object, linked: boolean}|null, error: object|null}>}
 */
export async function mockAutoLinkUser(userId, email) {
  await delay(500)

  if (!userId || !email) {
    return {
      data: null,
      error: { message: 'User ID and email are required' }
    }
  }

  // Step 1: Detect domain
  const { domain, error: detectError } = await mockDetectCampusFromEmail(email)
  
  if (detectError || !domain) {
    return {
      data: null,
      error: detectError || { message: 'Failed to extract domain from email' }
    }
  }

  // Step 2: Check if school exists
  const { data: existingSchool } = await mockGetSchoolByDomain(domain)

  let school = existingSchool

  // Step 3: Create school if doesn't exist
  if (!school) {
    const domainParts = domain.split('.')
    const schoolName = domainParts[0]
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') + ' University'

    const { data: newSchool, error: createError } = await mockCreateSchool({
      name: schoolName,
      domain: domain,
      abbreviation: schoolName.split(' ')[0]
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
  const { data: linkData, error: linkError } = await mockLinkUserToSchool(userId, school.id)

  if (linkError) {
    return {
      data: {
        school: school,
        linked: false
      },
      error: linkError
    }
  }

  return {
    data: {
      school: school,
      linked: true
    },
    error: null
  }
}

