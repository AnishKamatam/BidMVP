'use client'

import { useState } from 'react'
import { checkOutUserAction } from '@/app/actions/checkin'
import Button from './ui/Button'

export default function ManualCheckOut({ 
  eventId, 
  userId, 
  adminUserId, 
  onSuccess,
  onError 
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const { error } = await checkOutUserAction(eventId, userId, adminUserId)
      if (error) {
        onError?.(new Error(error.message))
      } else {
        onSuccess()
      }
    } catch (err) {
      onError?.(err)
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="small"
          onClick={handleCheckOut}
          disabled={loading}
        >
          {loading ? 'Checking out...' : 'Confirm'}
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="secondary"
      size="small"
      onClick={() => setShowConfirm(true)}
    >
      Check Out
    </Button>
  )
}

