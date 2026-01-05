// components/EventTypeSelector.js
// Event type selection component

'use client'

export default function EventTypeSelector({
  value,
  onChange,
  error = null,
  required = false
}) {
  const options = [
    { value: 'party', label: 'Party' },
    { value: 'mixer', label: 'Mixer' },
    { value: 'rush', label: 'Rush Event' },
    { value: 'invite-only', label: 'Invite Only' }
  ]

  return (
    <div>
      <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
        Event Type {required && <span className="text-error">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer
              transition-all
              ${value === option.value
                ? 'border-primary-ui bg-white'
                : 'border-gray-border bg-white hover:bg-gray-light'
              }
            `}
          >
            <input
              type="radio"
              name="event_type"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4 text-primary-ui focus:ring-primary-ui"
            />
            <span className="text-bodySmall text-neutral-black">{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-bodySmall text-error mt-1">{error}</p>
      )}
    </div>
  )
}

