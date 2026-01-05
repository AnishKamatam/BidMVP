// components/SafetyBadge.js
// Reusable badge component for displaying safety tiers (G1-G3, Y1-Y3, R1-R3) with color coding

'use client'

/**
 * Safety Badge Component
 * @param {string} tier - Safety tier: 'G1' | 'G2' | 'G3' | 'Y1' | 'Y2' | 'Y3' | 'R1' | 'R2' | 'R3'
 * @param {number} score - Optional safety score (shown in tooltip)
 * @param {string} size - Size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} showTooltip - Whether to show tooltip on hover (default: true)
 */
export default function SafetyBadge({ tier, score, size = 'md', showTooltip = true }) {
  if (!tier) {
    return null
  }

  // Determine color based on tier prefix
  const tierPrefix = tier.charAt(0)
  const isGreen = tierPrefix === 'G'
  const isYellow = tierPrefix === 'Y'
  const isRed = tierPrefix === 'R'

  // Color classes
  const colorClasses = isGreen
    ? 'bg-green-500 text-white'
    : isYellow
    ? 'bg-yellow-500 text-white'
    : isRed
    ? 'bg-red-500 text-white'
    : 'bg-gray-medium text-white'

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const baseClasses = 'rounded-full font-medium inline-flex items-center'
  const combinedClasses = `${baseClasses} ${colorClasses} ${sizeClasses[size]}`.trim()

  // Tooltip content
  const tooltipText = score !== undefined && score !== null
    ? `Safety Tier: ${tier} (Score: ${score})`
    : `Safety Tier: ${tier}`

  const badge = (
    <span className={combinedClasses}>
      {tier}
    </span>
  )

  if (showTooltip && (score !== undefined || tier)) {
    return (
      <div className="relative group">
        {badge}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-dark text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {tooltipText}
        </div>
      </div>
    )
  }

  return badge
}

