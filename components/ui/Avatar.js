// components/ui/Avatar.js
// Reusable avatar component matching design.json specifications
// Props:
//   - src: string (optional) - image URL
//   - alt: string (optional) - alt text
//   - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
//   - className: string (optional) - additional classes

'use client'

import Image from 'next/image'

const sizeClasses = {
  xs: 'w-6 h-6',      // 1.5rem
  sm: 'w-8 h-8',      // 2rem
  md: 'w-10 h-10',    // 2.5rem
  lg: 'w-16 h-16',    // 4rem
  xl: 'w-24 h-24',    // 6rem
}

const sizePixels = {
  xs: 24,      // 1.5rem
  sm: 32,      // 2rem
  md: 40,      // 2.5rem
  lg: 64,      // 4rem
  xl: 96,      // 6rem
}

export default function Avatar({ src, alt = '', size = 'md', className = '', ...props }) {
  const baseClasses = 'rounded-full object-cover border-2 border-neutral-white shadow-sm'
  // Ensure size is valid, fallback to 'md' if not
  const validSize = sizeClasses[size] ? size : 'md'
  const sizeClass = sizeClasses[validSize]
  const sizePixel = sizePixels[validSize]
  const combinedClasses = `${baseClasses} ${sizeClass} ${className}`.trim()
  
  if (src) {
    // Use Next.js Image for optimization, but fall back to img for data URLs or blob URLs
    const isDataOrBlobUrl = src?.startsWith('data:') || src?.startsWith('blob:')
    
    if (isDataOrBlobUrl) {
      return (
        <img
          src={src}
          alt={alt}
          className={combinedClasses}
          {...props}
        />
      )
    }
    
    // Ensure width and height are always defined numbers
    const imageWidth = sizePixel || 40 // fallback to 'md' size (40px)
    const imageHeight = sizePixel || 40
    
    // Extract width/height from props to prevent override, but keep other props
    const { width, height, ...restProps } = props
    
    return (
      <Image
        src={src}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        className={combinedClasses}
        style={{ objectFit: 'cover' }}
        {...restProps}
      />
    )
  }
  
  // Fallback: show initials or placeholder
  return (
    <div
      className={`${combinedClasses} bg-gray-light flex items-center justify-center text-gray-dark font-semibold`}
      {...props}
    >
      {alt ? alt.charAt(0).toUpperCase() : '?'}
    </div>
  )
}

