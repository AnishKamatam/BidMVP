# Phase 0.2 Backend Testing Guide

## Prerequisites

1. **Run Storage Migration**: Execute `lib/supabase/migrations/005_storage_setup.sql` in your Supabase SQL Editor to create the storage bucket and RLS policies.

2. **Environment Variables**: Ensure `.env.local` has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Testing User Profile Functions

### Test `getUserProfile()`

```javascript
import { getUserProfile } from '@/lib/supabase/users'

// Test in a Server Component or Server Action
const { data, error } = await getUserProfile('user-id-here')
console.log('Profile:', data)
console.log('Error:', error)
```

### Test `createUserProfile()`

```javascript
import { createUserProfile } from '@/lib/supabase/users'

const profileData = {
  name: 'Test User',
  year: 2,
  gender: 'M',
  profile_pic: 'https://via.placeholder.com/200',
  social_links: [
    { platform: 'instagram', username: 'testuser' }
  ]
}

const { data, error } = await createUserProfile('user-id-here', profileData)
```

### Test `updateUserProfile()`

```javascript
import { updateUserProfile } from '@/lib/supabase/users'

const { data, error } = await updateUserProfile('user-id-here', {
  name: 'Updated Name',
  year: 3
})
```

### Test `checkProfileComplete()`

```javascript
import { checkProfileComplete } from '@/lib/supabase/users'

const { data, error } = await checkProfileComplete('user-id-here')
console.log('Complete:', data.complete)
console.log('Missing:', data.missing)
```

## Testing Photo Upload Functions

### Test `uploadProfilePhoto()`

```javascript
import { uploadProfilePhoto } from '@/lib/storage/upload'

// In a Server Action with FormData
const formData = new FormData()
formData.append('file', file)

const { data, error } = await uploadProfilePhoto('user-id-here', file)
console.log('Photo URL:', data.url)
```

**Note**: Make sure the storage bucket `profile-photos` exists and has proper RLS policies.

## Testing Phone Verification Functions

### Test `sendPhoneVerificationCode()`

```javascript
import { sendPhoneVerificationCode } from '@/lib/supabase/phone'

// This must be called from a Client Component
const { data, error } = await sendPhoneVerificationCode('+1234567890')
```

**Note**: Phone verification requires Supabase Auth to be configured with SMS provider (Twilio, etc.). Check your Supabase dashboard settings.

### Test `verifyPhoneCode()`

```javascript
import { verifyPhoneCode } from '@/lib/supabase/phone'

const { data, error } = await verifyPhoneCode('+1234567890', '123456')
```

## Verifying Mock Functions Match Real Functions

All mock functions in `lib/mocks/userFunctions.js` should have the same signatures as their real counterparts:

- ✅ `getUserProfile(userId)` - Same signature
- ✅ `createUserProfile(userId, profileData)` - Same signature
- ✅ `updateUserProfile(userId, profileData)` - Same signature
- ✅ `checkProfileComplete(userId)` - Same signature
- ✅ `getUserSocialLinks(userId)` - Same signature
- ✅ `updateSocialLinks(userId, links)` - Same signature
- ✅ `sendPhoneVerificationCode(phone)` - Same signature
- ✅ `verifyPhoneCode(phone, code)` - Same signature
- ✅ `updateUserPhone(userId, phone)` - Same signature
- ✅ `uploadProfilePhoto(userId, file)` - Same signature
- ✅ `deleteProfilePhoto(userId, photoUrl)` - Same signature
- ✅ `getProfilePhotoUrl(userId)` - Same signature

## Quick Test Script

Create a test file `test-profile-functions.js` in your project root:

```javascript
// test-profile-functions.js
// Run with: node test-profile-functions.js

// This is a basic structure - you'll need to adapt it based on your testing setup
// For Next.js, you'd typically test these in Server Actions or API routes

console.log('Testing Phase 0.2 Backend Functions...')
console.log('1. Make sure storage bucket is set up')
console.log('2. Test each function with real user IDs')
console.log('3. Verify error handling works correctly')
console.log('4. Check that mock functions match real function signatures')
```

## Common Issues

1. **Storage bucket not found**: Run `005_storage_setup.sql` migration
2. **RLS policy errors**: Check that RLS policies are correctly set up
3. **Phone verification not working**: Configure SMS provider in Supabase dashboard
4. **User table column mismatch**: Verify your User table has columns: `name`, `year`, `gender`, `profile_pic`, `phone`

## Next Steps

After testing:
1. Share mock functions with Andrew for frontend development
2. Document any issues or needed adjustments
3. Proceed to Phase 0.3 (Campus Detection)

