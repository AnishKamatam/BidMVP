// components/FraternityPrompt.js
// Reusable prompt component for home page
// Props:
//   - onJoin: Function() called when user clicks "Join"
//   - onDismiss: Function() called when user dismisses
//   - variant: 'banner' | 'card' | 'modal' (default: 'banner')

'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function FraternityPrompt({ 
  onJoin, 
  onDismiss, 
  variant = 'banner' 
}) {
  // Banner variant - non-intrusive top banner
  if (variant === 'banner') {
    return (
      <div className="bg-premium-blue text-white px-6 py-4 relative">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-bodySmall font-semibold mb-1">
              Join a fraternity to start hosting events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onJoin}
              variant="secondary"
              size="small"
              className="bg-white text-premium-blue hover:bg-gray-light"
            >
              Join Now
            </Button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-white hover:text-gray-light transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Card variant - card-style prompt
  if (variant === 'card') {
    return (
      <Card variant="premium-blue" className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-heading3 text-white mb-1">
              Join a Fraternity
            </h3>
            <p className="text-bodySmall text-white/90">
              Join a fraternity to start hosting events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onJoin}
              variant="secondary"
              size="medium"
              className="bg-white text-premium-blue hover:bg-gray-light"
            >
              Join Now
            </Button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-white hover:text-white/80 transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Modal variant - modal-style prompt
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <h3 className="text-heading2 text-neutral-black mb-2">
            Join a Fraternity
          </h3>
          <p className="text-bodySmall text-gray-dark mb-6">
            Join a fraternity to start hosting events
          </p>
          <div className="flex gap-3">
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="secondary"
                size="large"
                className="flex-1"
              >
                Later
              </Button>
            )}
            <Button
              onClick={onJoin}
              variant="primary"
              size="large"
              className="flex-1"
            >
              Join Now
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return null
}

