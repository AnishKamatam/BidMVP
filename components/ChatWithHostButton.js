// components/ChatWithHostButton.js
// Button to initiate conversation with event host

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/contexts/ChatContext'
import Button from '@/components/ui/Button'

export default function ChatWithHostButton({ eventId, onSuccess }) {
  const router = useRouter()
  const { createConversationWithEventHost } = useChat()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = async () => {
    if (!eventId || loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await createConversationWithEventHost(eventId)
      
      if (result?.conversation) {
        // Navigate to conversation
        router.push(`/messages/${result.conversation.id}`)
        if (onSuccess) {
          onSuccess(result)
        }
      } else {
        setError('Failed to create conversation with host')
      }
    } catch (err) {
      setError(err.message || 'Failed to create conversation')
      console.error('Error creating conversation with host:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Button
        variant="primary"
        size="large"
        onClick={handleClick}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Creating...' : 'Chat with Host'}
      </Button>
      {error && (
        <p className="text-xs text-error mt-1 text-center">{error}</p>
      )}
    </div>
  )
}

