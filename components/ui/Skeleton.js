// components/ui/Skeleton.js
// Loading skeleton component for better perceived performance
// Shows placeholder content that matches the layout of actual content

'use client'

export default function Skeleton({ 
  variant = 'text', 
  width, 
  height, 
  className = '',
  ...props 
}) {
  const baseClasses = 'animate-pulse bg-gray-light rounded'
  
  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
        {...props}
      />
    )
  }
  
  if (variant === 'rectangular') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{ width: width || '100%', height: height || '20px' }}
        {...props}
      />
    )
  }
  
  // Default: text skeleton
  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{ width: width || '100%', height: height || '1em' }}
      {...props}
    />
  )
}

// Pre-built skeleton components for common patterns
export function AvatarSkeleton({ size = 'md' }) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }
  
  return (
    <Skeleton
      variant="circular"
      className={sizeClasses[size]}
    />
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-3 p-4">
      <Skeleton height="20px" width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton height="192px" className="rounded-lg" />
      <div className="flex items-center gap-3">
        <AvatarSkeleton size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton height="16px" width="40%" />
          <Skeleton height="14px" width="60%" />
        </div>
      </div>
      <Skeleton height="20px" width="70%" />
      <Skeleton height="14px" width="50%" />
      <Skeleton height="14px" width="80%" />
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-2 mb-4">
      <AvatarSkeleton size="sm" />
      <div className="flex-1 space-y-2">
        <Skeleton height="14px" width="30%" />
        <Skeleton height="60px" className="rounded-lg" />
        <Skeleton height="12px" width="20%" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <AvatarSkeleton size="lg" />
          <div className="flex-1 space-y-2">
            <Skeleton height="16px" width="40%" />
            <Skeleton height="14px" width="60%" />
          </div>
        </div>
      ))}
    </div>
  )
}

