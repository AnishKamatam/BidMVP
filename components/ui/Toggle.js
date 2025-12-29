// components/ui/Toggle.js
// Reusable toggle/switch component matching design.json specifications
// Props:
//   - checked: boolean (default: false)
//   - onChange: function (optional) - called when toggled
//   - disabled: boolean (default: false)
//   - className: string (optional) - additional classes
//   - label: string (optional) - label text

'use client'

export default function Toggle({ checked = false, onChange, disabled = false, className = '', label, ...props }) {
  const baseClasses = 'relative inline-flex items-center rounded-full transition-all cursor-pointer'
  const sizeClasses = 'w-12 h-6' // 3rem x 1.5rem
  
  const stateClasses = checked
    ? 'bg-primary-accent'
    : 'bg-gray-light'
  
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : ''
  
  const thumbClasses = `absolute rounded-full bg-white shadow-md transition-all ${
    checked ? 'translate-x-6' : 'translate-x-0'
  } w-5 h-5` // 1.25rem thumb size
  
  const combinedClasses = `${baseClasses} ${sizeClasses} ${stateClasses} ${disabledClasses} ${className}`.trim()
  
  return (
    <label className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={combinedClasses}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        {...props}
      >
        <span className={thumbClasses} />
      </button>
      {label && (
        <span className="text-bodySmall text-neutral-black">{label}</span>
      )}
    </label>
  )
}

