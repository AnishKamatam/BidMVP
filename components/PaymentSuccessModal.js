// components/PaymentSuccessModal.js
// Optional modal to show after successful payment redirect

'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  paymentType = 'line_skip',
  amount,
}) {
  if (!isOpen) {
    return null
  }

  const paymentTypeLabel = paymentType === 'bid' ? 'Bid Purchase' : 'Line Skip Payment'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card variant="default" className="w-full max-w-md">
        <div className="p-6 space-y-4 text-center">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div>
            <h2 className="text-heading3 text-neutral-black mb-2">
              Payment Successful!
            </h2>
            <p className="text-bodySmall text-gray-dark mb-1">
              {paymentTypeLabel} completed successfully.
            </p>
            {amount && (
              <p className="text-bodySmall font-semibold text-primary-ui">
                Amount: ${amount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Close Button */}
          <Button
            variant="primary"
            size="medium"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}

