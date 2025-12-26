// lib/mocks/userFunctions.js
// Mock versions of user profile functions for parallel frontend development
// These match the exact signatures of the real functions in lib/supabase/users.js, lib/supabase/phone.js, and lib/storage/upload.js

/**
 * Simulate network delay for realistic loading states
 */
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock user data
const mockUser = {
  id: 'mock-user-123',
  name: 'John Doe',
  year: 2,
  gender: 'M',
  profile_pic: 'https://via.placeholder.com/200',
  phone: '+1234567890',
  email: 'john.doe@university.edu',
  rushing: false,
  school_id: 'mock-school-1',
  created_at: new Date().toISOString(),
  social_links: [
    {
      id: 'mock-link-1',
      user_id: 'mock-user-123',
      platform: 'instagram',
      username: 'johndoe',
      created_at: new Date().toISOString()
    },
    {
      id: 'mock-link-2',
      user_id: 'mock-user-123',
      platform: 'snapchat',
      username: 'john_doe',
      created_at: new Date().toISOString()
    }
  ]
}

// ============================================
// Mock User Profile Functions
// ============================================

/**
 * Mock: Get user profile with social links
 * @param {string} userId - User ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getUserProfile(userId) {
  await delay(300)
  
  if (!userId) {
    return {
      data: null,
      error: { message: 'User ID is required' }
    }
  }

  return {
    data: {
      ...mockUser,
      id: userId
    },
    error: null
  }
}

/**
 * Mock: Create user profile after signup
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createUserProfile(userId, profileData) {
  await delay(400)

  // Simulate validation
  if (!profileData.name || !profileData.year || !profileData.gender || !profileData.profile_pic) {
    return {
      data: null,
      error: { message: 'Missing required fields: name, year, gender, and profile_pic are required' }
    }
  }

  if (profileData.year < 1 || profileData.year > 5) {
    return {
      data: null,
      error: { message: 'Year must be between 1 and 5' }
    }
  }

  const newUser = {
    ...mockUser,
    id: userId,
    name: profileData.name,
    year: profileData.year,
    gender: profileData.gender,
    profile_pic: profileData.profile_pic,
    social_links: profileData.social_links || []
  }

  return {
    data: newUser,
    error: null
  }
}

/**
 * Mock: Update existing user profile
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateUserProfile(userId, profileData) {
  await delay(350)

  const updatedUser = {
    ...mockUser,
    id: userId,
    ...profileData,
    social_links: profileData.social_links !== undefined 
      ? profileData.social_links 
      : mockUser.social_links
  }

  return {
    data: updatedUser,
    error: null
  }
}

/**
 * Mock: Check if user profile is complete
 * @param {string} userId - User ID
 * @returns {Promise<{data: {complete: boolean, missing: Array<string>}, error: object|null}>}
 */
export async function checkProfileComplete(userId) {
  await delay(200)

  // Simulate incomplete profile scenario
  const missing = []
  
  // Randomly simulate missing fields for testing
  if (Math.random() > 0.7) {
    missing.push('profile_pic')
  }

  return {
    data: {
      complete: missing.length === 0,
      missing
    },
    error: null
  }
}

/**
 * Mock: Get user's social links
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getUserSocialLinks(userId) {
  await delay(250)

  return {
    data: mockUser.social_links,
    error: null
  }
}

/**
 * Mock: Update user's social links
 * @param {string} userId - User ID
 * @param {Array} links - Array of social link objects
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function updateSocialLinks(userId, links) {
  await delay(300)

  const updatedLinks = links.map((link, index) => ({
    id: `mock-link-${index + 1}`,
    user_id: userId,
    platform: link.platform,
    username: link.username,
    created_at: new Date().toISOString()
  }))

  return {
    data: updatedLinks,
    error: null
  }
}

// ============================================
// Mock Phone Verification Functions
// ============================================

/**
 * Mock: Send phone verification code
 * @param {string} phone - Phone number
 * @returns {Promise<{data: {message: string}|null, error: object|null}>}
 */
export async function sendPhoneVerificationCode(phone) {
  await delay(800) // Simulate SMS sending delay

  if (!phone || !phone.startsWith('+')) {
    return {
      data: null,
      error: { message: 'Phone number must be in E.164 format (e.g., +1234567890)' }
    }
  }

  // In mock, we'll simulate success
  // In real implementation, code would be sent via SMS
  return {
    data: {
      message: 'Verification code sent successfully',
      // Mock: For development, you could return a test code
      // In production, this would never be returned
      mockCode: '123456' // Only for development/testing
    },
    error: null
  }
}

/**
 * Mock: Verify phone verification code
 * @param {string} phone - Phone number
 * @param {string} code - Verification code
 * @returns {Promise<{data: {verified: boolean, user: object}|null, error: object|null}>}
 */
export async function verifyPhoneCode(phone, code) {
  await delay(400)

  if (!phone || !code) {
    return {
      data: null,
      error: { message: 'Phone number and verification code are required' }
    }
  }

  // Mock: Accept any 6-digit code for testing
  if (code.length === 6 && /^\d+$/.test(code)) {
    return {
      data: {
        verified: true,
        user: {
          id: 'mock-user-123',
          phone: phone
        }
      },
      error: null
    }
  }

  return {
    data: null,
    error: { message: 'Invalid verification code' }
  }
}

/**
 * Mock: Update user's phone number
 * @param {string} userId - User ID
 * @param {string} phone - Verified phone number
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function updateUserPhone(userId, phone) {
  await delay(300)

  return {
    data: {
      success: true,
      user: {
        ...mockUser,
        id: userId,
        phone: phone
      }
    },
    error: null
  }
}

/**
 * Mock: Resend phone verification code
 * @param {string} phone - Phone number
 * @returns {Promise<{data: {message: string}|null, error: object|null}>}
 */
export async function resendPhoneVerificationCode(phone) {
  return await sendPhoneVerificationCode(phone)
}

// ============================================
// Mock Photo Upload Functions
// ============================================

/**
 * Mock: Upload profile photo
 * @param {string} userId - User ID
 * @param {File} file - File object
 * @returns {Promise<{data: {url: string, path: string}|null, error: object|null}>}
 */
export async function uploadProfilePhoto(userId, file) {
  await delay(1000) // Simulate upload delay

  if (!file) {
    return {
      data: null,
      error: { message: 'No file provided' }
    }
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      data: null,
      error: { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }
    }
  }

  // Validate file size
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return {
      data: null,
      error: { message: 'File size too large. Maximum size is 5MB.' }
    }
  }

  // Generate mock URL
  const timestamp = Date.now()
  const mockUrl = `https://via.placeholder.com/200?text=${encodeURIComponent(file.name)}`
  const mockPath = `${userId}/${timestamp}-${file.name}`

  return {
    data: {
      url: mockUrl,
      path: mockPath
    },
    error: null
  }
}

/**
 * Mock: Delete profile photo
 * @param {string} userId - User ID
 * @param {string} photoUrl - Photo URL or path
 * @returns {Promise<{data: {success: boolean}|null, error: object|null}>}
 */
export async function deleteProfilePhoto(userId, photoUrl) {
  await delay(300)

  if (!photoUrl) {
    return {
      data: null,
      error: { message: 'No photo URL provided' }
    }
  }

  return {
    data: { success: true },
    error: null
  }
}

/**
 * Mock: Get profile photo URL
 * @param {string} userId - User ID
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function getProfilePhotoUrl(userId) {
  await delay(200)

  return {
    data: {
      url: mockUser.profile_pic
    },
    error: null
  }
}

