// components/ui/Card.js
// Reusable card component matching design.json specifications
// Props:
//   - children: React node
//   - variant: 'default' | 'elevated' | 'flat' | 'premium-blue' | 'premium-yellow' | 'premium-orange' (default: 'default')
//   - className: string (optional) - additional classes
//   - onClick: function (optional) - makes card clickable

'use client'

export default function Card({ children, variant = 'default', className = '', onClick, ...props }) {
  const baseClasses = 'rounded-lg p-6'
  
  const variantClasses = {
    default: 'bg-white shadow-md',
    elevated: 'bg-white shadow-lg',
    flat: 'bg-white shadow-none',
    'premium-blue': 'bg-premium-blue text-white shadow-lg',
    'premium-yellow': 'bg-premium-yellow text-white shadow-lg',
    'premium-orange': 'bg-premium-orange text-white shadow-lg',
  }
  
  const interactiveClasses = onClick ? 'cursor-pointer transition-all hover:shadow-lg' : ''
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`.trim()
  
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}

