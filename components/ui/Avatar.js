// components/ui/Avatar.js
// Reusable avatar component matching design.json specifications
// Props:
//   - src: string (optional) - image URL
//   - alt: string (optional) - alt text
//   - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
//   - className: string (optional) - additional classes

'use client'

const sizeClasses = {
  xs: 'w-6 h-6',      // 1.5rem
  sm: 'w-8 h-8',      // 2rem
  md: 'w-10 h-10',    // 2.5rem
  lg: 'w-16 h-16',    // 4rem
  xl: 'w-24 h-24',    // 6rem
}

export default function Avatar({ src, alt = '', size = 'md', className = '', ...props }) {
  const baseClasses = 'rounded-full object-cover border-2 border-neutral-white shadow-sm'
  const sizeClass = sizeClasses[size]
  const combinedClasses = `${baseClasses} ${sizeClass} ${className}`.trim()
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={combinedClasses}
        {...props}
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

