// components/ui/Badge.js
// Reusable badge component matching design.json specifications
// Props:
//   - children: React node
//   - variant: 'count' | 'tag' | 'status' (default: 'tag')
//   - status: 'active' | 'inactive' (optional, only for status variant)
//   - className: string (optional) - additional classes

'use client'

export default function Badge({ children, variant = 'tag', status, className = '', ...props }) {
  const baseClasses = 'rounded-full px-3 py-1 text-caption font-medium inline-flex items-center'
  
  const variantClasses = {
    count: 'bg-gray-bg text-primary-accent',
    tag: 'bg-neutral-white text-gray-dark',
    status: status === 'active' ? 'bg-success text-white' : 'bg-gray-medium text-white',
  }
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim()
  
  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  )
}

