// lib/mocks/userFunctions.js
// Temporary mock functions for frontend development
// These match the expected backend function signatures from:
// - lib/supabase/users.js
// - lib/supabase/phone.js
// - lib/storage/upload.js
//
// At integration, replace imports with real functions from those files

/**
 * Mock function to get user profile
 * @param {string} userId - User ID
 * @returns {Promise<{id: string, name: string, year: number, gender: string, profile_pic: string, phone: string, email: string, school_id: string, rushing: boolean}>}
 */
export const mockGetUserProfile = async (userId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))

  // Return mock profile data
  return {
    id: userId || 'mock-user-id',
    name: 'John Doe',
    year: 2,
    gender: 'M',
    profile_pic: 'https://via.placeholder.com/200',
    phone: '+1234567890',
    email: 'john.doe@university.edu',
    school_id: 'mock-school-id',
    rushing: false,
    created_at: new Date().toISOString(),
  }
}

/**
 * Mock function to create user profile
 * @param {Object} profileData - Profile data
 * @param {string} profileData.name - User's name
 * @param {number} profileData.year - College year (1-5)
 * @param {string} profileData.gender - Gender (M/F/X)
 * @param {string} profileData.profile_pic - Profile photo URL
 * @param {string} [profileData.phone] - Phone number
 * @param {Array<{platform: string, username: string}>} [profileData.social_links] - Social links
 * @returns {Promise<{id: string, ...profileData}>}
 */
export const mockCreateUserProfile = async (profileData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Validate required fields
  if (!profileData.name || !profileData.year || !profileData.gender || !profileData.profile_pic) {
    throw new Error('Missing required fields: name, year, gender, and profile_pic are required')
  }

  // Return created profile
  return {
    id: 'mock-profile-id-' + Date.now(),
    ...profileData,
    created_at: new Date().toISOString(),
  }
}

/**
 * Mock function to update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{id: string, ...updates}>}
 */
export const mockUpdateUserProfile = async (userId, updates) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400))

  if (!userId) {
    throw new Error('User ID is required')
  }

  // Get existing profile and merge updates
  const existingProfile = await mockGetUserProfile(userId)
  
  return {
    ...existingProfile,
    ...updates,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Mock function to check if profile is complete
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const mockCheckProfileComplete = async (userId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200))

  if (!userId) {
    return false
  }

  try {
    const profile = await mockGetUserProfile(userId)
    
    // Profile is complete if all required fields are present
    const isComplete = !!(
      profile.name &&
      profile.year &&
      profile.gender &&
      profile.profile_pic
    )

    return isComplete
  } catch (error) {
    return false
  }
}

/**
 * Mock function to send phone verification code
 * @param {string} phone - Phone number in E.164 format (e.g., +1234567890)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const mockSendPhoneVerificationCode = async (phone) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))

  // Validate phone format (basic E.164 check)
  if (!phone || !phone.startsWith('+')) {
    throw new Error('Phone number must be in E.164 format (e.g., +1234567890)')
  }

  // In mock, always succeed
  // In real implementation, this would send SMS via Supabase or Twilio
  console.log(`[MOCK] Verification code sent to ${phone}. Mock code: 123456`)
  
  return {
    success: true,
    message: 'Verification code sent successfully',
  }
}

/**
 * Mock function to verify phone code
 * @param {string} phone - Phone number in E.164 format
 * @param {string} code - 6-digit verification code
 * @returns {Promise<{verified: boolean, error?: string}>}
 */
export const mockVerifyPhoneCode = async (phone, code) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600))

  if (!phone || !code) {
    return {
      verified: false,
      error: 'Phone and code are required',
    }
  }

  // In mock, accept code "123456" for testing
  // In real implementation, this would verify against Supabase auth
  if (code === '123456') {
    return {
      verified: true,
    }
  }

  // Simulate wrong code
  return {
    verified: false,
    error: 'Invalid verification code',
  }
}

/**
 * Mock function to upload profile photo
 * @param {File} file - Image file to upload
 * @returns {Promise<{url: string, path?: string}>}
 */
export const mockUploadProfilePhoto = async (file) => {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  if (!file) {
    throw new Error('File is required')
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.')
  }

  // In mock, return a placeholder URL
  // In real implementation, this would upload to Supabase Storage
  const mockUrl = `https://via.placeholder.com/400?text=${encodeURIComponent(file.name)}`
  
  return {
    url: mockUrl,
    path: `profiles/mock-${Date.now()}-${file.name}`,
  }
}

