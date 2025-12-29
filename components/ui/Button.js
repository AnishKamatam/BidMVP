// components/ui/Button.js
// Reusable button component matching design.json specifications
// Props:
//   - children: React node
//   - variant: 'primary' | 'secondary' | 'gradient' | 'text' | 'circular' | 'ghost' (default: 'primary')
//   - size: 'small' | 'medium' | 'large' (default: 'medium')
//   - disabled: boolean (default: false)
//   - iconLeft: React node (optional) - icon to display on the left
//   - iconRight: React node (optional) - icon to display on the right
//   - className: string (optional) - additional classes
//   - All standard button props (onClick, type, etc.)

'use client'

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  iconLeft,
  iconRight,
  className = '',
  ...props
}) {
  const baseClasses = 'rounded-md font-medium transition-all cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center'
  
  const variantClasses = {
    primary: 'bg-primary-ui text-white hover:bg-[#2563EB] active:bg-[#1D4ED8] focus:ring-primary-ui',
    secondary: 'bg-gray-border text-gray-dark hover:bg-[#D1D5DB] active:bg-[#BDC1C7] focus:ring-gray-medium',
    gradient: 'bg-gradient-to-r from-primary-ui to-premium-orange text-white hover:from-[#2563EB] hover:to-[#D97706] active:from-[#1D4ED8] active:to-[#B45309] focus:ring-primary-ui',
    text: 'bg-transparent text-gray-dark hover:bg-gray-light active:bg-gray-light focus:ring-gray-medium',
    circular: 'bg-black text-white rounded-full w-14 h-14 hover:bg-gray-dark active:bg-gray-dark focus:ring-primary-ui',
    ghost: 'bg-transparent text-gray-dark hover:bg-gray-light active:bg-gray-light focus:ring-gray-medium',
  }
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs gap-1.5',
    medium: 'px-4 py-2 text-bodySmall gap-2',
    large: 'px-6 py-3 text-base gap-2',
  }
  
  const activeClasses = disabled ? '' : 'active:scale-[0.98]'
  
  // Circular variant has fixed size, ignore size prop
  const isCircular = variant === 'circular'
  const sizeClass = isCircular ? '' : sizeClasses[size]
  const iconSpacing = isCircular ? 'gap-2' : ''
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClass} ${activeClasses} ${className}`.trim()
  
  return (
    <button
      className={combinedClasses}
      disabled={disabled}
      {...props}
    >
      {iconLeft && <span className={iconSpacing}>{iconLeft}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className={iconSpacing}>{iconRight}</span>}
    </button>
  )
}

