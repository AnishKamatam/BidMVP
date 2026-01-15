// components/MessageInput.js
// Input component for sending messages

'use client'

import { useState, useRef, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function MessageInput({ conversationId, onSend, disabled = false, placeholder = 'Type a message...' }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  const handleSend = async () => {
    if (!content.trim() || disabled || sending) return

    const messageContent = content.trim()
    setContent('')
    setSending(true)

    try {
      await onSend(conversationId, messageContent)
    } catch (error) {
      // Restore content on error
      setContent(messageContent)
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
      // Refocus input
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2 p-4 bg-white border-t border-gray-border">
      <Input
        ref={inputRef}
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled || sending}
        className="flex-1"
      />
      <Button
        variant="primary"
        onClick={handleSend}
        disabled={!content.trim() || disabled || sending}
      >
        {sending ? 'Sending...' : 'Send'}
      </Button>
    </div>
  )
}

