// components/ProfileSetupForm.js
// Profile setup form with required and optional fields
// Props:
//   - onSubmit: function(profileData) - called when form is submitted
//   - initialData: object (optional) - pre-filled form data
//   - loading: boolean (optional) - external loading state
//   - userId: string (required) - User ID for photo upload

'use client'

import { useState } from 'react'
import PhotoUpload from './PhotoUpload'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ProfileSetupForm({ onSubmit, initialData = {}, loading: externalLoading = false, userId }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    year: initialData.year || '',
    gender: initialData.gender || '',
    profile_pic: initialData.profile_pic || null,
    social_links: {
      instagram: initialData.social_links?.instagram || '',
      snapchat: initialData.social_links?.snapchat || '',
      vsco: initialData.social_links?.vsco || '',
      tiktok: initialData.social_links?.tiktok || '',
    },
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }))
    }
  }

  // Handle social link changes
  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }))
  }

  // Validate form
  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.year) {
      newErrors.year = 'Year is required'
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required'
    }

    if (!formData.profile_pic) {
      newErrors.profile_pic = 'Profile photo is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      // Format social links (only include non-empty ones)
      const socialLinks = []
      if (formData.social_links.instagram) {
        socialLinks.push({ platform: 'instagram', username: formData.social_links.instagram })
      }
      if (formData.social_links.snapchat) {
        socialLinks.push({ platform: 'snapchat', username: formData.social_links.snapchat })
      }
      if (formData.social_links.vsco) {
        socialLinks.push({ platform: 'vsco', username: formData.social_links.vsco })
      }
      if (formData.social_links.tiktok) {
        socialLinks.push({ platform: 'tiktok', username: formData.social_links.tiktok })
      }

      const profileData = {
        name: formData.name.trim(),
        year: parseInt(formData.year),
        gender: formData.gender,
        profile_pic: formData.profile_pic,
        ...(socialLinks.length > 0 && { social_links: socialLinks }),
      }

      await onSubmit(profileData)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save profile' })
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || externalLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-bodySmall font-semibold mb-2 text-neutral-black"
        >
          Name <span className="text-error">*</span>
        </label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          error={errors.name}
          placeholder="Enter your name"
        />
        {errors.name && (
          <p className="mt-1 text-bodySmall text-error">{errors.name}</p>
        )}
      </div>

      {/* Year */}
      <div>
        <label
          htmlFor="year"
          className="block text-bodySmall font-semibold mb-2 text-neutral-black"
        >
          Year <span className="text-error">*</span>
        </label>
        <select
          id="year"
          value={formData.year}
          onChange={(e) => handleChange('year', e.target.value)}
          required
          className={`w-full px-4 py-3 rounded-md border transition-all ${
            errors.year ? 'border-error focus:border-error focus:ring-error' : 'border-gray-border focus:border-primary-ui focus:ring-primary-ui'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-base`}
        >
          <option value="">Select year</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
          <option value="5">5th Year / Graduate</option>
        </select>
        {errors.year && (
          <p className="mt-1 text-bodySmall text-error">{errors.year}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label
          htmlFor="gender"
          className="block text-bodySmall font-semibold mb-2 text-neutral-black"
        >
          Gender <span className="text-error">*</span>
        </label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => handleChange('gender', e.target.value)}
          required
          className={`w-full px-4 py-3 rounded-md border transition-all ${
            errors.gender ? 'border-error focus:border-error focus:ring-error' : 'border-gray-border focus:border-primary-ui focus:ring-primary-ui'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-base`}
        >
          <option value="">Select gender</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="X">Non-binary / Other</option>
        </select>
        {errors.gender && (
          <p className="mt-1 text-bodySmall text-error">{errors.gender}</p>
        )}
      </div>

      {/* Photo Upload */}
      <PhotoUpload
        value={formData.profile_pic}
        onChange={(url) => handleChange('profile_pic', url)}
        required
        error={errors.profile_pic}
        userId={userId}
      />

      {/* Social Links Section */}
      <div className="space-y-4 pt-4 border-t-2 border-gray-border">
        <h3 className="text-heading2 text-neutral-black">Social Links (Optional)</h3>
        
        {/* Instagram */}
        <div>
          <label
            htmlFor="instagram"
            className="block text-bodySmall font-semibold mb-2 text-neutral-black"
          >
            Instagram
          </label>
          <Input
            id="instagram"
            type="text"
            value={formData.social_links.instagram}
            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
            placeholder="@username"
          />
        </div>

        {/* Snapchat */}
        <div>
          <label
            htmlFor="snapchat"
            className="block text-bodySmall font-semibold mb-2 text-neutral-black"
          >
            Snapchat
          </label>
          <Input
            id="snapchat"
            type="text"
            value={formData.social_links.snapchat}
            onChange={(e) => handleSocialLinkChange('snapchat', e.target.value)}
            placeholder="username"
          />
        </div>

        {/* VSCO */}
        <div>
          <label
            htmlFor="vsco"
            className="block text-bodySmall font-semibold mb-2 text-neutral-black"
          >
            VSCO
          </label>
          <Input
            id="vsco"
            type="text"
            value={formData.social_links.vsco}
            onChange={(e) => handleSocialLinkChange('vsco', e.target.value)}
            placeholder="username"
          />
        </div>

        {/* TikTok */}
        <div>
          <label
            htmlFor="tiktok"
            className="block text-bodySmall font-semibold mb-2 text-neutral-black"
          >
            TikTok
          </label>
          <Input
            id="tiktok"
            type="text"
            value={formData.social_links.tiktok}
            onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
            placeholder="@username"
          />
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md">
          {errors.submit}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        variant="primary"
        size="large"
        className="w-full"
      >
        {isLoading ? 'Saving...' : 'Complete Profile'}
      </Button>
    </form>
  )
}

