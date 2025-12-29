// components/ui/ProgressIndicator.js
// Progress indicator component matching design.json specifications
// Props:
//   - type: 'circular' | 'linear' (default: 'circular')
//   - progress: number (0-100) - progress percentage
//   - size: number (optional, default: 80) - diameter in pixels for circular type
//   - className: string (optional) - additional classes
//   - showText: boolean (default: true) - show percentage text (circular only)
//   - stepText: string (optional) - step indicator text (e.g., "STEP 2 OF 8") for linear type

'use client'

export default function ProgressIndicator({ 
  type = 'circular', 
  progress = 0, 
  size = 80, 
  className = '', 
  showText = true,
  stepText,
  ...props 
}) {
  // Linear progress bar
  if (type === 'linear') {
    return (
      <div className={`w-full ${className}`} {...props}>
        {stepText && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-bodySmall font-semibold text-gray-medium">{stepText}</span>
          </div>
        )}
        <div className="w-full bg-gray-border h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary-ui h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    )
  }
  
  // Circular progress indicator
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} {...props}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-bodySmall font-semibold text-primary-ui">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
}

